import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Car,
  Feather,
  Footprints,
  Gift,
  HeartCrack,
  Map as MapIcon,
  Menu,
  Play,
  RotateCcw,
  Settings,
  Trophy,
  X,
} from 'lucide-react';
import {
  ANIMALS,
  CHARACTER_ROSTER,
  CosmeticItem,
  DAILY_REWARDS,
  MAX_LEVEL,
  TOTAL_CHARACTERS,
  computeSequentialUnlockedLevel,
  createDefaultProfile,
  getAnimalEvolutionStage,
  getCharacterById,
  getLevelConfig,
  getNextUnlockableCharacter,
  isLevelUnlocked,
} from './data/gameCatalog';
import {
  CharacterDef,
  GameSettings,
  LocomotionMode,
  PlayerProfile,
  VehicleCustomization,
  VocabWord,
} from './types/game';
import { ActiveHudState, GameScene, RaceControlInput } from './three/GameScene';
import { PlayOverlay } from './components/PlayOverlay';
import { GarageModal } from './components/GarageModal';
import { LevelMapModal } from './components/LevelMapModal';
import { DailyRewardModal } from './components/DailyRewardModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { DictionaryModal } from './components/DictionaryModal';
import { SettingsModal } from './components/SettingsModal';
import { LevelResultModal } from './components/LevelResultModal';
import { soundEngine } from './utils/audio';

const STORAGE_KEY = 'safari_kata_3d_profile_v1';

type ActiveModal =
  | null
  | 'garage'
  | 'levels'
  | 'daily'
  | 'leaderboard'
  | 'dictionary'
  | 'settings';

function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

const MANUAL_MIGRATED_KEY = 'safari_kata_manual_migrated_v1';

export default function App() {
  const [profile, setProfile] = useState<PlayerProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<PlayerProfile>;
        const defaults = createDefaultProfile();
        const rawCompleted = parsed.completedLevels || {};
        const sanitizedCompleted: Record<number, number> = {};
        for (const [k, v] of Object.entries(rawCompleted)) {
          const lvlNum = Number(k);
          const starsNum = Number(v);
          if (Number.isInteger(lvlNum) && lvlNum >= 1 && lvlNum <= MAX_LEVEL && starsNum > 0) {
            sanitizedCompleted[lvlNum] = Math.min(3, Math.max(1, Math.round(starsNum)));
          }
        }
        const sequentialUnlocked = computeSequentialUnlockedLevel(sanitizedCompleted);
        const completedCount = Object.keys(sanitizedCompleted).length;
        const validCharIds = new Set(CHARACTER_ROSTER.map((c) => c.id));
        const rawUnlocked =
          Array.isArray(parsed.unlockedCharacterIds) && parsed.unlockedCharacterIds.length > 0
            ? parsed.unlockedCharacterIds.filter((id) => validCharIds.has(id))
            : defaults.unlockedCharacterIds;
        const baseUnlocked = new Set<string>(
          rawUnlocked.length > 0 ? rawUnlocked : defaults.unlockedCharacterIds
        );
        // Backfill up to TOTAL_CHARACTERS (100) based on completed levels
        const targetMinUnlocked = Math.min(TOTAL_CHARACTERS, 3 + completedCount);
        for (let idx = 1; idx <= TOTAL_CHARACTERS && baseUnlocked.size < targetMinUnlocked; idx++) {
          baseUnlocked.add(`char_${idx}`);
        }
        const safeCharId =
          parsed.selectedCharacterId && validCharIds.has(parsed.selectedCharacterId)
            ? parsed.selectedCharacterId
            : defaults.selectedCharacterId;
        const selectedChar = getCharacterById(safeCharId);
        const mergedSettings: GameSettings = {
          earlyChildhoodMode:
            parsed.settings?.earlyChildhoodMode ?? defaults.settings.earlyChildhoodMode,
          autoDrive: parsed.settings?.autoDrive ?? defaults.settings.autoDrive,
          soundEnabled: parsed.settings?.soundEnabled ?? defaults.settings.soundEnabled,
          voicePronunciation:
            parsed.settings?.voicePronunciation ?? defaults.settings.voicePronunciation,
          speedPreset: parsed.settings?.speedPreset ?? defaults.settings.speedPreset,
          touchButtonScale:
            parsed.settings?.touchButtonScale ?? defaults.settings.touchButtonScale,
        };
        const merged: PlayerProfile = {
          ...defaults,
          ...parsed,
          completedLevels: sanitizedCompleted,
          highestUnlockedLevel: sequentialUnlocked,
          selectedAnimal: selectedChar.baseAnimal,
          selectedCharacterId: selectedChar.id,
          unlockedCharacterIds: Array.from(baseUnlocked),
          settings: mergedSettings,
        };
        if (!localStorage.getItem(MANUAL_MIGRATED_KEY)) {
          merged.settings.autoDrive = false;
          localStorage.setItem(MANUAL_MIGRATED_KEY, '1');
        }
        return merged;
      }
      localStorage.setItem(MANUAL_MIGRATED_KEY, '1');
    } catch {
      // Ignore storage errors
    }
    return createDefaultProfile();
  });

  const [mode, setMode] = useState<'showcase' | 'playing'>('showcase');
  const [showcaseLocomotion, setShowcaseLocomotion] = useState<LocomotionMode>('drive');
  const [activeLevel, setActiveLevel] = useState<number>(profile.highestUnlockedLevel);
  const [raceRunId, setRaceRunId] = useState<number>(1);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [showcaseMenuOpen, setShowcaseMenuOpen] = useState<boolean>(false);
  const [evolutionBurstTrigger, setEvolutionBurstTrigger] = useState<number>(0);
  const [screenFade, setScreenFade] = useState<'idle' | 'out' | 'in'>('idle');

  const profileRef = useRef<PlayerProfile>(profile);
  profileRef.current = profile;
  const transitionLockRef = useRef<boolean>(false);
  const transitionTimersRef = useRef<number[]>([]);

  const [hud, setHud] = useState<ActiveHudState>({
    progressPct: 0,
    score: 0,
    coinsEarned: 0,
    wordsCollected: [],
    activeGatePrompt: null,
    abilityCooldownLeft: 0,
    abilityActiveLeft: 0,
    magnetCooldownLeft: 0,
    magnetActiveLeft: 0,
    shieldActive: false,
    magnetActive: false,
    turboActive: false,
    lives: 5,
    maxLives: 5,
    mistakes: 0,
    speedKmh: 0,
    monstersDefeated: 0,
    missionTotal: 10,
    missionSolved: 0,
    nearestHiddenCue: null,
    missionNotification: null,
    activePuzzle: null,
    nearFinishBlocked: false,
    feedbackText: null,
    feedbackTone: 'good',
    weatherLabel: 'Cerah Berbunga',
    weatherEmoji: '🌸',
    locomotionMode: 'drive',
  });

  const [levelResult, setLevelResult] = useState<{
    level: number;
    score: number;
    coinsEarned: number;
    xpEarned: number;
    stars: 1 | 2 | 3;
    wordsCollected: VocabWord[];
    evolvedToStage: 1 | 2 | 3 | 4 | null;
    unlockedCharacter: CharacterDef | null;
  } | null>(null);

  const [levelFailed, setLevelFailed] = useState<{
    level: number;
    mistakes: number;
    maxMistakes: number;
    score: number;
    wordsCollected: VocabWord[];
  } | null>(null);

  const controlRef = useRef<RaceControlInput | null>(null);

  // Persist profile and keep sound settings synced
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // Ignore quota errors
    }
    soundEngine.enabled = profile.settings.soundEnabled;
    soundEngine.voiceEnabled = profile.settings.voicePronunciation;
  }, [profile]);

  useEffect(() => {
    if (!showcaseMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowcaseMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showcaseMenuOpen]);

  const clearTransitionTimers = useCallback(() => {
    for (const id of transitionTimersRef.current) {
      window.clearTimeout(id);
    }
    transitionTimersRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearTransitionTimers();
    };
  }, [clearTransitionTimers]);

  const runWithScreenFade = useCallback(
    (onMidpointSwap: () => void) => {
      if (transitionLockRef.current) return;
      transitionLockRef.current = true;
      clearTransitionTimers();
      setScreenFade('out');

      const swapTimer = window.setTimeout(() => {
        onMidpointSwap();
        const revealTimer = window.setTimeout(() => {
          setScreenFade('in');
          const doneTimer = window.setTimeout(() => {
            setScreenFade('idle');
            transitionLockRef.current = false;
          }, 320);
          transitionTimersRef.current.push(doneTimer);
        }, 70);
        transitionTimersRef.current.push(revealTimer);
      }, 280);
      transitionTimersRef.current.push(swapTimer);
    },
    [clearTransitionTimers]
  );

  const currentAnimalXp = profile.animalXp[profile.selectedAnimal] || 0;
  const evolutionStage = getAnimalEvolutionStage(profile.selectedAnimal, currentAnimalXp);
  const activeAnimal = ANIMALS[profile.selectedAnimal];
  const activeCharacter = getCharacterById(profile.selectedCharacterId);

  const canClaimDaily = profile.lastClaimDate !== getTodayDateString();

  // Sync score to server leaderboard
  const syncLeaderboard = useCallback(async (nextProfile: PlayerProfile) => {
    const xp = nextProfile.animalXp[nextProfile.selectedAnimal] || 0;
    const stage = getAnimalEvolutionStage(nextProfile.selectedAnimal, xp);
    try {
      await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: nextProfile.playerId,
          name: nextProfile.name,
          animalId: nextProfile.selectedAnimal,
          evolutionStage: stage,
          highestLevel: nextProfile.highestUnlockedLevel,
          wordsCollected: nextProfile.collectedWordIds.length,
          totalScore: nextProfile.totalScore,
        }),
      });
    } catch {
      // Ignore offline error
    }
  }, []);

  const levelConfig = useMemo(
    () => (mode === 'playing' ? getLevelConfig(activeLevel) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, activeLevel, raceRunId]
  );

  const startSingleLevel = useCallback(
    (lvl: number) => {
      if (!isLevelUnlocked(lvl, profileRef.current.completedLevels)) {
        return;
      }
      runWithScreenFade(() => {
        setShowcaseMenuOpen(false);
        setActiveModal(null);
        setLevelResult(null);
        setLevelFailed(null);
        setActiveLevel(lvl);
        setIsPaused(false);
        setRaceRunId((id) => id + 1);
        setMode('playing');
      });
    },
    [runWithScreenFade]
  );

  const exitToShowcase = useCallback(() => {
    runWithScreenFade(() => {
      setIsPaused(false);
      setLevelResult(null);
      setLevelFailed(null);
      setMode('showcase');
    });
  }, [runWithScreenFade]);

  const handleLevelComplete = useCallback(
    (summary: {
      score: number;
      coinsEarned: number;
      wordsCollected: VocabWord[];
      stars: 1 | 2 | 3;
      finishTimeMs: number;
    }) => {
      const xpEarned = 35 + summary.wordsCollected.length * 15 + summary.stars * 10;
      const current = profileRef.current;
      const prevXp = current.animalXp[current.selectedAnimal] || 0;
      const prevStage = getAnimalEvolutionStage(current.selectedAnimal, prevXp);
      const newXp = prevXp + xpEarned;
      const newStage = getAnimalEvolutionStage(current.selectedAnimal, newXp);
      const evolvedToStage = newStage > prevStage ? newStage : null;

      if (evolvedToStage !== null) {
        soundEngine.playEvolution();
        setEvolutionBurstTrigger((c) => c + 1);
      }

      const newlyUnlockedCharacter = getNextUnlockableCharacter(
        current.unlockedCharacterIds || ['char_1', 'char_2', 'char_3'],
        activeLevel
      );

      setProfile((prev) => {
        const mergedWords = Array.from(
          new Set([...prev.collectedWordIds, ...summary.wordsCollected.map((w) => w.id)])
        );

        const prevStars = prev.completedLevels[activeLevel] || 0;
        const nextCompletedLevels = {
          ...prev.completedLevels,
          [activeLevel]: Math.max(prevStars, summary.stars),
        };
        const nextUnlocked = computeSequentialUnlockedLevel(nextCompletedLevels);
        const existingChars = prev.unlockedCharacterIds || ['char_1', 'char_2', 'char_3'];
        const mergedCharacters =
          newlyUnlockedCharacter && !existingChars.includes(newlyUnlockedCharacter.id)
            ? [...existingChars, newlyUnlockedCharacter.id]
            : existingChars;

        const nextProfile: PlayerProfile = {
          ...prev,
          coins: prev.coins + summary.coinsEarned,
          animalXp: {
            ...prev.animalXp,
            [prev.selectedAnimal]: newXp,
          },
          highestUnlockedLevel: nextUnlocked,
          unlockedCharacterIds: mergedCharacters,
          completedLevels: nextCompletedLevels,
          collectedWordIds: mergedWords,
          totalScore: prev.totalScore + summary.score,
        };

        syncLeaderboard(nextProfile);
        return nextProfile;
      });

      setLevelResult({
        level: activeLevel,
        score: summary.score,
        coinsEarned: summary.coinsEarned,
        xpEarned,
        stars: summary.stars,
        wordsCollected: summary.wordsCollected,
        evolvedToStage,
        unlockedCharacter: newlyUnlockedCharacter,
      });
    },
    [activeLevel, syncLeaderboard]
  );

  const handleLevelFailed = useCallback(
    (summary: {
      mistakes: number;
      maxMistakes: number;
      score: number;
      wordsCollected: VocabWord[];
    }) => {
      setLevelFailed({
        level: activeLevel,
        mistakes: summary.mistakes,
        maxMistakes: summary.maxMistakes,
        score: summary.score,
        wordsCollected: summary.wordsCollected,
      });
    },
    [activeLevel]
  );

  const handleClaimDaily = () => {
    if (!canClaimDaily) return;
    const reward = DAILY_REWARDS[profile.dailyStreak % 7];
    soundEngine.playEvolution();
    setProfile((prev) => {
      const unlocked =
        reward.unlockItemId && !prev.unlockedCosmetics.includes(reward.unlockItemId)
          ? [...prev.unlockedCosmetics, reward.unlockItemId]
          : prev.unlockedCosmetics;
      const next: PlayerProfile = {
        ...prev,
        coins: prev.coins + reward.coins,
        animalXp: {
          ...prev.animalXp,
          [prev.selectedAnimal]: (prev.animalXp[prev.selectedAnimal] || 0) + reward.xpBonus,
        },
        unlockedCosmetics: unlocked,
        dailyStreak: prev.dailyStreak + 1,
        lastClaimDate: getTodayDateString(),
      };
      syncLeaderboard(next);
      return next;
    });
  };

  const handleUnlockCosmetic = (item: CosmeticItem) => {
    setProfile((prev) => {
      if (prev.coins < item.cost || prev.unlockedCosmetics.includes(item.id)) return prev;
      soundEngine.playCoin();
      const nextCustomization = { ...prev.customization };
      if (item.category === 'color') {
        nextCustomization.bodyColor = item.value;
        nextCustomization.accentColor = item.accent || '#FFFFFF';
      } else if (item.category === 'wheel') {
        nextCustomization.wheelStyle = item.value as VehicleCustomization['wheelStyle'];
      } else if (item.category === 'hat') {
        nextCustomization.hatStyle = item.value as VehicleCustomization['hatStyle'];
      } else if (item.category === 'trail') {
        nextCustomization.trailStyle = item.value as VehicleCustomization['trailStyle'];
      }
      return {
        ...prev,
        coins: prev.coins - item.cost,
        unlockedCosmetics: [...prev.unlockedCosmetics, item.id],
        customization: nextCustomization,
      };
    });
  };

  return (
    <div className="relative h-dvh w-screen overflow-hidden bg-sky-200 select-none">
      {/* Full-Viewport 3D Three.js World */}
      <GameScene
        mode={mode}
        animalId={profile.selectedAnimal}
        characterId={profile.selectedCharacterId}
        showcaseLocomotion={showcaseLocomotion}
        evolutionStage={evolutionStage}
        customization={profile.customization}
        levelConfig={levelConfig}
        autoDrive={profile.settings.autoDrive}
        earlyChildhoodMode={profile.settings.earlyChildhoodMode}
        speedPreset={profile.settings.speedPreset}
        isPaused={isPaused}
        starburstTrigger={evolutionBurstTrigger}
        controlRef={controlRef}
        onHudUpdate={setHud}
        onLevelComplete={handleLevelComplete}
        onLevelFailed={handleLevelFailed}
      />

      {/* Showcase / Main Hub UI: Top-right corner icon menu + slim bottom preview bar */}
      {mode === 'showcase' && (
        <>
          {/* Top Bar with Brand + Play CTA + Corner Menu Icon */}
          <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between gap-3 bg-white/95 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 safe-pt shadow-sm border-b border-slate-200">
            <span className="text-base sm:text-xl font-bold tracking-tight text-slate-900 font-display whitespace-nowrap shrink-0">
              Safari Kata 3D
            </span>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={() => startSingleLevel(profile.highestUnlockedLevel)}
                className="flex items-center gap-1.5 sm:gap-2 rounded-xl bg-amber-500 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-amber-600 transition-colors whitespace-nowrap shrink-0 min-h-[42px]"
              >
                <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-white" />
                <span className="hidden sm:inline">Main Level {profile.highestUnlockedLevel}</span>
                <span className="sm:hidden">Main Lv.{profile.highestUnlockedLevel}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowcaseMenuOpen((open) => !open)}
                aria-label={showcaseMenuOpen ? 'Tutup Menu' : 'Buka Menu'}
                aria-expanded={showcaseMenuOpen}
                title="Menu"
                className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-colors shrink-0 ${
                  showcaseMenuOpen
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {showcaseMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </header>

          {/* Top-Right Corner Menu Dropdown */}
          {showcaseMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowcaseMenuOpen(false)}
                aria-hidden="true"
              />
              <nav
                aria-label="Menu Utama"
                className="fixed top-16 sm:top-[68px] right-3 sm:right-6 lg:right-8 z-40 w-64 sm:w-72 rounded-2xl bg-white p-2 shadow-2xl border border-slate-200"
              >
                <div className="px-3 py-2 border-b border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                  <span className="font-bold text-slate-900 truncate">{profile.name}</span>
                  <span className="font-bold text-amber-600 font-mono-num shrink-0">
                    {profile.coins} Koin
                  </span>
                </div>
                <div className="mt-1.5 flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowcaseMenuOpen(false);
                      setActiveModal('levels');
                    }}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 transition-colors min-h-[42px]"
                  >
                    <span className="flex items-center gap-2.5">
                      <MapIcon className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Peta {MAX_LEVEL} Level</span>
                    </span>
                    <span className="text-xs font-mono-num text-slate-500">
                      Lv.{profile.highestUnlockedLevel}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowcaseMenuOpen(false);
                      setActiveModal('garage');
                    }}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 transition-colors min-h-[42px]"
                  >
                    <span className="flex items-center gap-2.5">
                      <Car className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>Garasi & Avatar</span>
                    </span>
                    <span className="text-xs font-mono-num text-slate-500">
                      {(profile.unlockedCharacterIds || []).length}/{TOTAL_CHARACTERS}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowcaseMenuOpen(false);
                      setActiveModal('daily');
                    }}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors min-h-[42px] ${
                      canClaimDaily
                        ? 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                        : 'text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Gift
                        className={`h-4 w-4 shrink-0 ${
                          canClaimDaily ? 'text-amber-600' : 'text-rose-500'
                        }`}
                      />
                      <span>Hadiah Harian</span>
                    </span>
                    {canClaimDaily && (
                      <span className="text-xs font-bold text-amber-700">Siap!</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowcaseMenuOpen(false);
                      setActiveModal('dictionary');
                    }}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 transition-colors min-h-[42px]"
                  >
                    <span className="flex items-center gap-2.5">
                      <BookOpen className="h-4 w-4 text-sky-600 shrink-0" />
                      <span>Kamus 5.000 Kata</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowcaseMenuOpen(false);
                      setActiveModal('leaderboard');
                    }}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 transition-colors min-h-[42px]"
                  >
                    <span className="flex items-center gap-2.5">
                      <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
                      <span>Peringkat</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowcaseMenuOpen(false);
                      setActiveModal('settings');
                    }}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 transition-colors min-h-[42px]"
                  >
                    <span className="flex items-center gap-2.5">
                      <Settings className="h-4 w-4 text-slate-600 shrink-0" />
                      <span>Pengaturan</span>
                    </span>
                  </button>
                </div>
              </nav>
            </>
          )}

          {/* Slim Bottom Showcase Info & 3D Locomotion Preview Strip */}
          <div className="fixed bottom-2 sm:bottom-4 left-1/2 z-20 -translate-x-1/2 w-[94vw] max-w-[680px] safe-pb">
            <div className="rounded-2xl bg-white/95 px-3 sm:px-4 py-2 sm:py-2.5 shadow-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs text-slate-600 min-w-0">
                <span className="font-bold text-slate-900 truncate max-w-[140px] sm:max-w-none">
                  #{activeCharacter.index} {activeCharacter.name}
                </span>
                <span className="hidden sm:inline text-slate-400">
                  ({activeAnimal.stages[evolutionStage - 1].title})
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-bold text-amber-600 font-mono-num">{profile.coins} Koin</span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-emerald-700 font-mono-num">
                  {(profile.unlockedCharacterIds || []).length}/{TOTAL_CHARACTERS} Avatar
                </span>
              </div>

              <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 shrink-0">
                {(
                  [
                    { id: 'drive', Icon: Car, label: 'Kendaraan' },
                    { id: 'walk', Icon: Footprints, label: 'Jalan' },
                    { id: 'fly', Icon: Feather, label: 'Terbang' },
                  ] as const
                ).map(({ id, Icon, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setShowcaseLocomotion(id)}
                    title={`Pratinjau ${label}`}
                    className={`flex items-center gap-1 rounded-lg px-2 sm:px-2.5 py-1 text-[11px] font-bold transition-colors whitespace-nowrap min-h-[32px] ${
                      showcaseLocomotion === id
                        ? 'bg-amber-500 text-white'
                        : 'text-slate-600 hover:bg-white'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Active Gameplay HUD & Early-Childhood Touch Controls */}
      {mode === 'playing' && levelConfig && !levelResult && !levelFailed && (
        <PlayOverlay
          levelConfig={levelConfig}
          animalId={profile.selectedAnimal}
          characterId={profile.selectedCharacterId}
          evolutionStage={evolutionStage}
          hud={hud}
          settings={profile.settings}
          isPaused={isPaused}
          controlRef={controlRef}
          onTogglePause={() => setIsPaused((p) => !p)}
          onExitRace={exitToShowcase}
        />
      )}

      {/* Modals */}
      {activeModal === 'garage' && (
        <GarageModal
          profile={profile}
          showcaseLocomotion={showcaseLocomotion}
          onChangeShowcaseLocomotion={setShowcaseLocomotion}
          onClose={() => setActiveModal(null)}
          onSelectCharacter={(char: CharacterDef) =>
            setProfile((prev) => ({
              ...prev,
              selectedCharacterId: char.id,
              selectedAnimal: char.baseAnimal,
            }))
          }
          onUpdateCustomization={(next: VehicleCustomization) =>
            setProfile((prev) => ({ ...prev, customization: next }))
          }
          onUnlockCosmetic={handleUnlockCosmetic}
        />
      )}

      {activeModal === 'levels' && (
        <LevelMapModal
          profile={profile}
          onClose={() => setActiveModal(null)}
          onSelectLevel={startSingleLevel}
        />
      )}

      {activeModal === 'daily' && (
        <DailyRewardModal
          profile={profile}
          canClaimToday={canClaimDaily}
          onClaim={handleClaimDaily}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'leaderboard' && (
        <LeaderboardModal
          localPlayerId={profile.playerId}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'dictionary' && (
        <DictionaryModal
          collectedWordIds={profile.collectedWordIds}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'settings' && (
        <SettingsModal
          playerName={profile.name}
          settings={profile.settings}
          onSave={(newName: string, newSettings: GameSettings) => {
            setProfile((prev) => {
              const next = { ...prev, name: newName, settings: newSettings };
              syncLeaderboard(next);
              return next;
            });
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {levelFailed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4">
          <div className="w-full max-w-md max-h-[90dvh] overflow-y-auto custom-scroll rounded-3xl bg-white p-5 sm:p-7 text-center shadow-2xl border border-slate-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <HeartCrack className="h-9 w-9" />
            </div>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">
              Ayo Ulangi Level {levelFailed.level}!
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">
              Terlalu banyak kesalahan ({levelFailed.mistakes}/{levelFailed.maxMistakes}). Ambil item{' '}
              <strong className="text-rose-600">Hati ❤️</strong>, lompati monster, dan pilih gerbang kata yang tepat!
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
              <div>
                <div className="text-xs text-slate-500">Skor Sementara</div>
                <div className="text-lg font-bold text-slate-900 font-mono-num">{levelFailed.score}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Kata Ditemukan</div>
                <div className="text-lg font-bold text-sky-600 font-mono-num">
                  {levelFailed.wordsCollected.length} Kata
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={exitToShowcase}
                className="flex-1 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                Menu Utama
              </button>
              <button
                type="button"
                onClick={() => startSingleLevel(levelFailed.level)}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-bold text-white hover:bg-amber-600"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Ulangi Level</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {levelResult && (
        <LevelResultModal
          level={levelResult.level}
          score={levelResult.score}
          coinsEarned={levelResult.coinsEarned}
          xpEarned={levelResult.xpEarned}
          stars={levelResult.stars}
          wordsCollected={levelResult.wordsCollected}
          animalId={profile.selectedAnimal}
          characterId={profile.selectedCharacterId}
          evolvedToStage={levelResult.evolvedToStage}
          unlockedCharacter={levelResult.unlockedCharacter}
          onEquipUnlockedCharacter={(char: CharacterDef) =>
            setProfile((prev) => ({
              ...prev,
              selectedCharacterId: char.id,
              selectedAnimal: char.baseAnimal,
            }))
          }
          onReplay={() => startSingleLevel(levelResult.level)}
          onNextLevel={() => startSingleLevel(Math.min(MAX_LEVEL, levelResult.level + 1))}
          onExit={exitToShowcase}
        />
      )}

      {/* Smooth Screen Fade-Out to Black & Fade-In Curtain for Arena/Level Transitions */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-[100] bg-black transition-opacity duration-300 ease-in-out ${
          screenFade === 'out'
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      />
    </div>
  );
}
