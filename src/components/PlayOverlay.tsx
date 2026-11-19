import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Car,
  CheckCircle2,
  Compass,
  Feather,
  Footprints,
  Heart,
  HelpCircle,
  LogOut,
  Magnet,
  Menu,
  Play,
  RotateCcw,
  Shield,
  Sparkles,
  Target,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import { ANIMALS, MAX_LEVEL, getCharacterById } from '../data/gameCatalog';
import {
  AnimalId,
  GameSettings,
  LevelConfig,
  LocomotionMode,
  VocabWord,
} from '../types/game';
import { ActiveHudState, RaceControlInput } from '../three/GameScene';
import { soundEngine } from '../utils/audio';

interface PlayOverlayProps {
  levelConfig: LevelConfig;
  animalId: AnimalId;
  characterId?: string;
  evolutionStage: 1 | 2 | 3 | 4;
  hud: ActiveHudState;
  settings: GameSettings;
  isPaused: boolean;
  controlRef: React.MutableRefObject<RaceControlInput | null>;
  onTogglePause: () => void;
  onExitRace: () => void;
}

function maskEnglishWord(word: string): string {
  if (word.length <= 2) return `${word[0]} _`;
  return word
    .split('')
    .map((ch, idx) => {
      if (ch === ' ' || idx === 0 || idx === word.length - 1) return ch;
      return '_';
    })
    .join(' ');
}

function seededIndexOrder(length: number, seedStr: string): number[] {
  const arr = Array.from({ length }, (_, i) => i);
  if (length <= 1) return arr;
  let hash = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    hash ^= seedStr.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  for (let i = length - 1; i > 0; i--) {
    hash = (Math.imul(hash, 1664525) + 1013904223) >>> 0;
    const j = hash % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  // Ensure the shuffled order isn't already solved
  if (arr.every((val, idx) => val === idx)) {
    [arr[0], arr[1]] = [arr[1], arr[0]];
  }
  return arr;
}

export const PlayOverlay: React.FC<PlayOverlayProps> = ({
  levelConfig,
  animalId,
  characterId,
  evolutionStage,
  hud,
  settings,
  isPaused,
  controlRef,
  onTogglePause,
  onExitRace,
}) => {
  const animal = ANIMALS[animalId];
  const activeChar = getCharacterById(characterId);
  const stageInfo = animal.stages[evolutionStage - 1];
  const abilityReady = hud.abilityCooldownLeft <= 0 && hud.abilityActiveLeft <= 0;
  const magnetReady = hud.magnetCooldownLeft <= 0 && hud.magnetActiveLeft <= 0;
  const bigBtn = settings.touchButtonScale === 'large' || settings.earlyChildhoodMode;

  const locomotionModeRef = useRef<LocomotionMode>(hud.locomotionMode);
  locomotionModeRef.current = hud.locomotionMode;

  // RIGHT JOYSTICK: 360-degree analog movement (Maju, Mundur, Belok Kiri, Belok Kanan)
  const moveJoyBaseRef = useRef<HTMLDivElement | null>(null);
  const movePointerIdRef = useRef<number | null>(null);
  const [moveKnobPos, setMoveKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingMoveJoy, setIsDraggingMoveJoy] = useState(false);

  // LEFT JOYSTICK: 4-way Action Joystick (Terbang Naik/Turun, Loncat, Naik Kendaraan/Jalan)
  type ActionZone = 'none' | 'fly_up' | 'fly_down' | 'vehicle' | 'jump';
  const actionJoyBaseRef = useRef<HTMLDivElement | null>(null);
  const actionPointerIdRef = useRef<number | null>(null);
  const lastTriggeredActionSectorRef = useRef<ActionZone>('none');
  const [actionKnobPos, setActionKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingActionJoy, setIsDraggingActionJoy] = useState(false);
  const [activeActionZone, setActiveActionZone] = useState<ActionZone>('none');

  // Puzzle state when discovering a hidden vocabulary cache or sentence mission
  const [wrongChoiceIds, setWrongChoiceIds] = useState<string[]>([]);
  const [puzzleFeedback, setPuzzleFeedback] = useState<string | null>(null);
  const [sentenceStep, setSentenceStep] = useState<'en' | 'ar'>('en');
  const [selectedTokenIndices, setSelectedTokenIndices] = useState<number[]>([]);

  useEffect(() => {
    setWrongChoiceIds([]);
    setPuzzleFeedback(null);
    setSentenceStep('en');
    setSelectedTokenIndices([]);
  }, [hud.activePuzzle?.cacheId]);

  const activeSentence = hud.activePuzzle?.sentenceMission;
  const activeSentenceTokens = useMemo(() => {
    if (!activeSentence) return [];
    return sentenceStep === 'en' ? activeSentence.englishWords : activeSentence.arabicWords;
  }, [activeSentence, sentenceStep]);

  const shuffledSentenceIndices = useMemo(() => {
    if (!activeSentence || !hud.activePuzzle) return [];
    return seededIndexOrder(
      activeSentenceTokens.length,
      `${hud.activePuzzle.cacheId}_${activeSentence.id}_${sentenceStep}`
    );
  }, [activeSentence, activeSentenceTokens.length, hud.activePuzzle, sentenceStep]);

  const puzzleOptions: VocabWord[] = useMemo(() => {
    if (!hud.activePuzzle) return [];
    const list = [hud.activePuzzle.word, ...hud.activePuzzle.distractors];
    return [...list].sort((a, b) => a.id.localeCompare(b.id));
  }, [hud.activePuzzle]);

  const updateMoveJoystickFromClient = (clientX: number, clientY: number) => {
    const base = moveJoyBaseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const radius = Math.max(26, rect.width * 0.34);
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > radius) {
      dx = (dx / dist) * radius;
      dy = (dy / dist) * radius;
    }
    setMoveKnobPos({ x: dx, y: dy });
    // Invert dy because screen up is negative Y, while forward in 3D is +Y input
    controlRef.current?.setJoystick(dx / radius, -dy / radius);
  };

  const resetMoveJoystick = () => {
    movePointerIdRef.current = null;
    setIsDraggingMoveJoy(false);
    setMoveKnobPos({ x: 0, y: 0 });
    controlRef.current?.setJoystick(0, 0);
  };

  const updateActionJoystickFromClient = (clientX: number, clientY: number) => {
    const base = actionJoyBaseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const radius = Math.max(26, rect.width * 0.34);
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > radius) {
      dx = (dx / dist) * radius;
      dy = (dy / dist) * radius;
    }
    setActionKnobPos({ x: dx, y: dy });

    const normX = dx / radius;
    const normY = dy / radius;
    const deadzone = 0.32;
    if (Math.hypot(normX, normY) < deadzone) {
      setActiveActionZone('none');
      lastTriggeredActionSectorRef.current = 'none';
      controlRef.current?.setFlyVertical(0);
      return;
    }

    if (normY < -deadzone && Math.abs(normY) >= Math.abs(normX) * 0.85) {
      // UP: Terbang & Terbang Naik
      setActiveActionZone('fly_up');
      if (locomotionModeRef.current !== 'fly') {
        controlRef.current?.setLocomotionMode('fly');
      }
      const strength = Math.min(1, Math.max(0.25, (-normY - 0.16) / 0.84));
      controlRef.current?.setFlyVertical(strength);
    } else if (normY > deadzone && Math.abs(normY) >= Math.abs(normX) * 0.85) {
      // DOWN: Terbang Turun (or dismount vehicle to walk)
      setActiveActionZone('fly_down');
      if (locomotionModeRef.current === 'fly') {
        const strength = Math.min(1, Math.max(0.25, (normY - 0.16) / 0.84));
        controlRef.current?.setFlyVertical(-strength);
      } else if (lastTriggeredActionSectorRef.current !== 'fly_down') {
        lastTriggeredActionSectorRef.current = 'fly_down';
        if (locomotionModeRef.current === 'drive') {
          controlRef.current?.setLocomotionMode('walk');
        }
      }
    } else if (normX < -deadzone && Math.abs(normX) > Math.abs(normY) * 0.85) {
      // LEFT: Naik Kendaraan / Jalan
      setActiveActionZone('vehicle');
      controlRef.current?.setFlyVertical(0);
      if (lastTriggeredActionSectorRef.current !== 'vehicle') {
        lastTriggeredActionSectorRef.current = 'vehicle';
        const nextMode: LocomotionMode =
          locomotionModeRef.current === 'drive' ? 'walk' : 'drive';
        controlRef.current?.setLocomotionMode(nextMode);
      }
    } else if (normX > deadzone && Math.abs(normX) > Math.abs(normY) * 0.85) {
      // RIGHT: Loncat
      setActiveActionZone('jump');
      controlRef.current?.setFlyVertical(0);
      if (lastTriggeredActionSectorRef.current !== 'jump') {
        lastTriggeredActionSectorRef.current = 'jump';
        controlRef.current?.jump();
      }
    }
  };

  const resetActionJoystick = () => {
    actionPointerIdRef.current = null;
    lastTriggeredActionSectorRef.current = 'none';
    setIsDraggingActionJoy(false);
    setActiveActionZone('none');
    setActionKnobPos({ x: 0, y: 0 });
    controlRef.current?.setFlyVertical(0);
  };

  useEffect(() => {
    if (isPaused || hud.activePuzzle) {
      resetMoveJoystick();
      resetActionJoystick();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused, hud.activePuzzle]);

  const handlePuzzleOptionClick = (opt: VocabWord) => {
    if (!hud.activePuzzle || !controlRef.current) return;
    const res = controlRef.current.resolvePuzzle(hud.activePuzzle.cacheId, opt.id);
    if (!res.correct) {
      setWrongChoiceIds((prev) => (prev.includes(opt.id) ? prev : [...prev, opt.id]));
      setPuzzleFeedback(res.message);
    }
  };

  const handleVerifySentence = () => {
    if (!hud.activePuzzle || !activeSentence || !controlRef.current) return;
    if (selectedTokenIndices.length !== activeSentenceTokens.length) return;
    const userBuilt = selectedTokenIndices.map((idx) => activeSentenceTokens[idx]).join(' ');
    const expected = activeSentenceTokens.join(' ');
    if (userBuilt === expected) {
      if (sentenceStep === 'en') {
        soundEngine.playCoin();
        soundEngine.speakWord(activeSentence.englishSentence);
        setPuzzleFeedback(null);
        setSentenceStep('ar');
        setSelectedTokenIndices([]);
      } else {
        controlRef.current.resolvePuzzle(hud.activePuzzle.cacheId, hud.activePuzzle.word.id);
      }
    } else {
      const res = controlRef.current.resolvePuzzle(
        hud.activePuzzle.cacheId,
        '__WRONG_SENTENCE__'
      );
      setPuzzleFeedback(res.message);
      setSelectedTokenIndices([]);
    }
  };

  const notif = hud.missionNotification;
  const notifStyles =
    notif?.tone === 'complete'
      ? 'bg-emerald-700 text-white border-emerald-400'
      : notif?.tone === 'progress'
      ? 'bg-sky-700 text-white border-sky-400'
      : notif?.tone === 'warn'
      ? 'bg-amber-600 text-white border-amber-300'
      : 'bg-slate-900 text-white border-amber-400';

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between safe-inset-hud sm:p-5">
      {/* Top HUD Bar */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 sm:gap-3">
        <div className="flex items-start justify-between gap-2 sm:gap-3 w-full md:w-auto">
          {/* Left: Level, Progress, Hearts & Active Mission Radar */}
          <div className="pointer-events-auto flex-1 min-w-0 max-w-[260px] sm:w-[290px] sm:flex-none rounded-2xl bg-white/95 px-3 sm:px-4 py-2 sm:py-2.5 shadow-md border border-slate-200">
            <div className="flex items-center justify-between gap-2 text-[11px] sm:text-xs font-semibold text-slate-500">
              <span className="shrink-0">Lv.{levelConfig.level}/{MAX_LEVEL}</span>
              <span className="truncate text-right" title={`${levelConfig.biomeName} · ${hud.weatherLabel}`}>
                {hud.weatherEmoji} {levelConfig.biomeName}
              </span>
            </div>
            <div className="mt-1 sm:mt-1.5 h-2 sm:h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-150"
                style={{ width: `${Math.round(hud.progressPct)}%` }}
              />
            </div>
            <div className="mt-1 sm:mt-1.5 flex items-center gap-1.5 sm:gap-2.5 text-xs sm:text-sm font-bold text-slate-800 font-mono-num truncate">
              <span>{hud.score} pts</span>
              <span className="text-slate-300" aria-hidden="true">·</span>
              <span className="text-amber-600">+{hud.coinsEarned}</span>
              <span className="text-slate-300" aria-hidden="true">·</span>
              <span className="text-sky-600">{hud.wordsCollected.length} Kata</span>
            </div>
            <div className="mt-1 sm:mt-1.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-1 sm:pt-1.5 text-[11px] sm:text-xs font-semibold">
              <div className="flex items-center gap-0.5 sm:gap-1 min-w-0" title="Nyawa & batas kesalahan sebelum level diulang">
                {Array.from({ length: hud.maxLives }).map((_, i) => (
                  <Heart
                    key={i}
                    className={`h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 ${
                      i < hud.lives
                        ? 'fill-rose-500 text-rose-500'
                        : 'fill-slate-100 text-slate-300'
                    }`}
                  />
                ))}
                <span className="ml-1 text-slate-500 font-mono-num truncate">
                  {hud.mistakes}/{hud.maxLives}
                </span>
              </div>
              <span className="text-slate-500 font-mono-num shrink-0">{hud.speedKmh} km/j</span>
            </div>

            {/* Live Hidden Vocabulary / Sentence Mission Tracker & Radar */}
            <div className="mt-1 sm:mt-1.5 border-t border-slate-100 pt-1 sm:pt-1.5">
              <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold">
                <span className="flex items-center gap-1 text-slate-800 truncate">
                  <Target className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">
                    {levelConfig.level > 200 ? 'Misi Kalimat' : 'Misi Kosa Kata'}
                  </span>
                </span>
                <span
                  className={`font-mono-num shrink-0 ${
                    hud.missionSolved >= hud.missionTotal ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {hud.missionSolved}/{hud.missionTotal}
                </span>
              </div>
              {hud.missionSolved >= hud.missionTotal ? (
                <div className="mt-0.5 flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-emerald-700 truncate">
                  <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                  <span className="truncate">
                    {levelConfig.level > 200
                      ? 'Semua kalimat tersusun! Finis!'
                      : 'Semua kata ditemukan! Finis!'}
                  </span>
                </div>
              ) : hud.nearestHiddenCue ? (
                <div className="mt-0.5 flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-slate-600">
                  <Compass className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-sky-600" />
                  <span className="truncate">
                    {hud.nearestHiddenCue.directionText} · {hud.nearestHiddenCue.distanceM}m (
                    {hud.nearestHiddenCue.clueCategory})
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Mobile/Tablet Top-Right Corner Menu Icon */}
          <div className="pointer-events-auto flex items-start gap-1.5 md:hidden shrink-0">
            <button
              type="button"
              onClick={onTogglePause}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-800 shadow-md border border-slate-200 hover:bg-slate-50 active:scale-95 transition-transform"
              aria-label={isPaused ? 'Lanjutkan' : 'Menu & Jeda'}
              title={isPaused ? 'Lanjutkan' : 'Menu & Jeda'}
            >
              {isPaused ? <Play className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Center: Mission Notification Toast & Active Gate Prompt */}
        <div className="mx-auto flex flex-col items-center gap-1.5 sm:gap-2 w-full max-w-md md:flex-1">
          {notif && !hud.activePuzzle && (
            <div
              className={`pointer-events-auto flex items-start gap-2 rounded-2xl border-2 px-3 sm:px-4 py-2 sm:py-2.5 shadow-lg w-full sm:w-auto ${notifStyles}`}
              role="status"
            >
              {notif.tone === 'complete' ? (
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 mt-0.5 text-emerald-200" />
              ) : notif.tone === 'warn' ? (
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 mt-0.5 text-amber-100" />
              ) : (
                <Target className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 mt-0.5 text-amber-300" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-[11px] sm:text-xs font-bold tracking-wide">{notif.title}</div>
                <div className="text-[11px] sm:text-sm font-medium opacity-95 leading-snug">
                  {notif.message}
                </div>
                {hud.nearFinishBlocked && (
                  <button
                    type="button"
                    onClick={() => controlRef.current?.allowFinishBypass()}
                    className="mt-1.5 rounded-lg bg-white px-2.5 py-1 text-[11px] sm:text-xs font-bold text-amber-700 hover:bg-amber-50 whitespace-nowrap"
                  >
                    Tetap Finis Sekarang
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => controlRef.current?.dismissMissionNotif()}
                className="rounded-lg p-1 hover:bg-white/15 shrink-0"
                aria-label="Tutup notifikasi misi"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {hud.activeGatePrompt && !hud.activePuzzle && (
            <div className="pointer-events-auto rounded-2xl bg-amber-500 px-4 sm:px-6 py-2 sm:py-3 text-center text-white shadow-lg border-2 border-amber-200">
              <div className="text-[10px] sm:text-xs font-semibold tracking-wide">
                PILIH GERBANG KOSA KATA
              </div>
              <div className="mt-0.5 flex items-center justify-center gap-2 text-lg sm:text-2xl font-bold font-display">
                <span>{hud.activeGatePrompt.emoji}</span>
                <span>{hud.activeGatePrompt.indonesian}</span>
                <button
                  type="button"
                  onClick={() =>
                    soundEngine.speakWord(
                      hud.activeGatePrompt!.english,
                      hud.activeGatePrompt!.arabic
                    )
                  }
                  className="ml-1 rounded-lg bg-white/20 p-1.5 hover:bg-white/30 transition-colors"
                  title="Dengarkan kata"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Desktop/Tablet Landscape Top-Right Corner Menu Icon */}
        <div className="pointer-events-auto hidden md:flex items-start gap-2 shrink-0">
          <button
            type="button"
            onClick={onTogglePause}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-800 shadow-md border border-slate-200 hover:bg-slate-50 active:scale-95 transition-transform"
            aria-label={isPaused ? 'Lanjutkan' : 'Menu & Jeda'}
            title={isPaused ? 'Lanjutkan' : 'Menu & Jeda'}
          >
            {isPaused ? <Play className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {hud.feedbackText && !isPaused && !hud.activePuzzle && (
        <div className="mx-auto my-auto">
          <div
            className={`rounded-2xl px-4 sm:px-6 py-2 sm:py-3 text-base sm:text-xl font-bold shadow-lg border-2 text-center ${
              hud.feedbackTone === 'good'
                ? 'bg-emerald-600 text-white border-emerald-300'
                : 'bg-rose-600 text-white border-rose-300'
            }`}
          >
            {hud.feedbackText}
          </div>
        </div>
      )}

      {/* Hidden Vocabulary / Bilingual Sentence-Building Modal */}
      {hud.activePuzzle && !isPaused && (
        <div className="pointer-events-auto mx-auto my-auto w-full max-w-lg max-h-[82dvh] overflow-y-auto custom-scroll rounded-3xl bg-white p-4 sm:p-6 shadow-2xl border-2 border-amber-400">
          {activeSentence ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                  <Target className="h-5 w-5" />
                  <span>
                    Misi Susun Kalimat · Tahap {sentenceStep === 'en' ? '1/2 (Inggris)' : '2/2 (Arab)'}
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-500 font-mono-num">
                  {hud.missionSolved + 1}/{hud.missionTotal}
                </span>
              </div>

              <div className="mt-3 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-center">
                <div className="text-xs font-semibold text-slate-500">
                  Percakapan Sehari-hari · Kategori {activeSentence.category}
                </div>
                <div className="mt-1.5 flex items-center justify-center gap-2 text-xl sm:text-2xl font-bold text-slate-900">
                  <span>{activeSentence.emoji}</span>
                  <span>"{activeSentence.indonesian}"</span>
                </div>
                {sentenceStep === 'ar' && (
                  <div className="mt-2 inline-flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Inggris benar: {activeSentence.englishSentence}</span>
                  </div>
                )}
                <div className="mt-2 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      soundEngine.speakWord(
                        sentenceStep === 'en' ? activeSentence.englishSentence : undefined,
                        sentenceStep === 'ar' ? activeSentence.arabicSentence : undefined
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl bg-sky-100 px-3 py-1.5 text-xs font-bold text-sky-800 hover:bg-sky-200 transition-colors"
                  >
                    <Volume2 className="h-4 w-4" />
                    <span>
                      Dengarkan Kalimat {sentenceStep === 'en' ? 'Inggris' : 'Arab'}
                    </span>
                  </button>
                  {sentenceStep === 'ar' && (
                    <span className="text-xs font-medium text-slate-500">
                      ({activeSentence.arabicTranslit})
                    </span>
                  )}
                </div>
              </div>

              {/* Answer Construction Area */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1.5">
                  <span>
                    {sentenceStep === 'en'
                      ? 'Susunan Kalimat Bahasa Inggris (Kiri ke Kanan):'
                      : 'Susunan Kalimat Bahasa Arab (Kanan ke Kiri):'}
                  </span>
                  {selectedTokenIndices.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedTokenIndices([])}
                      className="inline-flex items-center gap-1 text-sky-700 hover:text-sky-900"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
                <div
                  dir={sentenceStep === 'ar' ? 'rtl' : 'ltr'}
                  className="min-h-[56px] flex flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/60 p-3"
                >
                  {selectedTokenIndices.length === 0 ? (
                    <span className="text-xs font-medium text-slate-400">
                      Ketuk kata-kata di bawah secara berurutan untuk menyusun kalimat...
                    </span>
                  ) : (
                    selectedTokenIndices.map((tokenIdx, pos) => (
                      <button
                        key={`sel_${pos}_${tokenIdx}`}
                        type="button"
                        onClick={() =>
                          setSelectedTokenIndices((prev) => prev.filter((_, i) => i !== pos))
                        }
                        className={`rounded-xl bg-amber-500 px-3.5 py-1.5 font-bold text-white shadow-sm hover:bg-amber-600 transition-colors ${
                          sentenceStep === 'ar' ? 'text-lg' : 'text-sm'
                        }`}
                      >
                        {activeSentenceTokens[tokenIdx]}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {puzzleFeedback && (
                <div className="mt-3 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-center text-xs font-semibold text-rose-700">
                  {puzzleFeedback}
                </div>
              )}

              {/* Available Shuffled Word Chips */}
              <div
                dir={sentenceStep === 'ar' ? 'rtl' : 'ltr'}
                className="mt-3 flex flex-wrap justify-center gap-2"
              >
                {shuffledSentenceIndices.map((tokenIdx) => {
                  const isUsed = selectedTokenIndices.includes(tokenIdx);
                  return (
                    <button
                      key={`opt_${tokenIdx}`}
                      type="button"
                      disabled={isUsed}
                      onClick={() =>
                        setSelectedTokenIndices((prev) =>
                          prev.includes(tokenIdx) ? prev : [...prev, tokenIdx]
                        )
                      }
                      className={`rounded-xl border-2 px-3.5 py-2 font-bold transition-colors ${
                        sentenceStep === 'ar' ? 'text-lg' : 'text-sm'
                      } ${
                        isUsed
                          ? 'border-slate-200 bg-slate-100 text-slate-300 cursor-not-allowed'
                          : 'border-slate-200 bg-white text-slate-900 hover:border-sky-400 hover:bg-sky-50'
                      }`}
                    >
                      {activeSentenceTokens[tokenIdx]}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={selectedTokenIndices.length !== activeSentenceTokens.length}
                onClick={handleVerifySentence}
                className={`mt-4 w-full rounded-2xl px-5 py-3 text-sm sm:text-base font-bold transition-colors ${
                  selectedTokenIndices.length === activeSentenceTokens.length
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {sentenceStep === 'en'
                  ? 'Periksa Kalimat Inggris → Lanjut Arab'
                  : 'Periksa Kalimat Arab & Selesaikan Misi'}
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                  <HelpCircle className="h-5 w-5" />
                  <span>Kosa Kata Tersembunyi Ditemukan!</span>
                </div>
                <span className="text-xs font-semibold text-slate-500 font-mono-num">
                  {hud.missionSolved + 1}/{hud.missionTotal}
                </span>
              </div>

              <div className="mt-3 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-center">
                {hud.activePuzzle.puzzleType === 'guess_pair' && (
                  <>
                    <div className="text-xs font-semibold text-slate-500">
                      Pecahkan teka-teki! Pilih kata Arab &amp; Inggris yang tepat untuk:
                    </div>
                    <div className="mt-2 flex items-center justify-center gap-2 text-2xl font-bold text-slate-900">
                      <span>{hud.activePuzzle.word.emoji}</span>
                      <span>{hud.activePuzzle.word.indonesian}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Kategori: {hud.activePuzzle.word.category}
                    </div>
                  </>
                )}

                {hud.activePuzzle.puzzleType === 'guess_meaning' && (
                  <>
                    <div className="text-xs font-semibold text-slate-500">
                      Apa arti kosa kata Bahasa Arab tersembunyi ini?
                    </div>
                    <div className="mt-2 flex items-center justify-center gap-3">
                      <span className="text-3xl font-bold text-slate-900">
                        {hud.activePuzzle.word.arabic}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          soundEngine.speakWord(
                            hud.activePuzzle!.word.english,
                            hud.activePuzzle!.word.arabic
                          )
                        }
                        className="rounded-xl bg-amber-100 p-2 text-amber-700 hover:bg-amber-200 transition-colors"
                        title="Dengarkan pelafalan"
                      >
                        <Volume2 className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="mt-1 text-sm font-semibold text-sky-700">
                      ({hud.activePuzzle.word.transliteration})
                    </div>
                  </>
                )}

                {hud.activePuzzle.puzzleType === 'fill_word' && (
                  <>
                    <div className="text-xs font-semibold text-slate-500">
                      Lengkapi kata Bahasa Inggris yang tersembunyi ini:
                    </div>
                    <div className="mt-2 text-xl font-bold text-slate-900">
                      {hud.activePuzzle.word.emoji} {hud.activePuzzle.word.indonesian} ·{' '}
                      {hud.activePuzzle.word.arabic}
                    </div>
                    <div className="mt-2 inline-block rounded-xl bg-white px-4 py-1.5 border border-slate-200 text-lg font-bold tracking-widest text-sky-700 font-mono-num">
                      {maskEnglishWord(hud.activePuzzle.word.english)}
                    </div>
                  </>
                )}
              </div>

              {puzzleFeedback && (
                <div className="mt-3 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-center text-xs font-semibold text-rose-700">
                  {puzzleFeedback}
                </div>
              )}

              <div className="mt-4 grid grid-cols-1 gap-2.5">
                {puzzleOptions.map((opt) => {
                  const isWrong = wrongChoiceIds.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isWrong}
                      onClick={() => handlePuzzleOptionClick(opt)}
                      className={`flex items-center justify-between rounded-2xl border-2 px-4 py-3 text-left font-bold transition-colors ${
                        isWrong
                          ? 'border-rose-200 bg-rose-50 text-rose-400 cursor-not-allowed'
                          : 'border-slate-200 bg-white text-slate-900 hover:border-amber-400 hover:bg-amber-50'
                      }`}
                    >
                      {hud.activePuzzle!.puzzleType === 'guess_pair' && (
                        <>
                          <div>
                            <div className="text-lg">{opt.arabic}</div>
                            <div className="text-xs font-medium text-slate-500">
                              {opt.transliteration}
                            </div>
                          </div>
                          <span className="text-base text-sky-700">{opt.english}</span>
                        </>
                      )}
                      {hud.activePuzzle!.puzzleType === 'guess_meaning' && (
                        <>
                          <span className="text-base">
                            {opt.emoji} {opt.indonesian}
                          </span>
                          <span className="text-sm text-sky-700">{opt.english}</span>
                        </>
                      )}
                      {hud.activePuzzle!.puzzleType === 'fill_word' && (
                        <>
                          <span className="text-base text-sky-700">{opt.english}</span>
                          <span className="text-xs font-medium text-slate-500">
                            {opt.transliteration}
                          </span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Pause Modal */}
      {isPaused && (
        <div className="pointer-events-auto mx-auto my-auto w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-xl border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900">Permainan Dijeda</h2>
          <p className="mt-1 text-sm text-slate-500">
            {levelConfig.title} · {activeChar.name} ({stageInfo.title})
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={onTogglePause}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3.5 text-base font-bold text-white hover:bg-amber-600 transition-colors"
            >
              <Play className="h-5 w-5" />
              Lanjutkan Main
            </button>
            <button
              type="button"
              onClick={onExitRace}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3.5 text-base font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Kembali ke Menu
            </button>
          </div>
        </div>
      )}

      {/* Bottom Dual-Joystick Cockpit: Left = Action Joystick + Magnet | Right = 360° Movement Joystick + Skill */}
      <div className="flex items-end justify-between gap-2 sm:gap-4">
        {/* LEFT CLUSTER: Action Joystick (Terbang Naik/Turun, Naik Kendaraan/Jalan, Loncat) + Rim Magnet Button */}
        <div className="pointer-events-auto flex flex-col items-center gap-1 sm:gap-1.5 shrink-0">
          <div className="relative flex items-end">
            <div
              ref={actionJoyBaseRef}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                actionPointerIdRef.current = e.pointerId;
                setIsDraggingActionJoy(true);
                updateActionJoystickFromClient(e.clientX, e.clientY);
              }}
              onPointerMove={(e) => {
                if (actionPointerIdRef.current === e.pointerId) {
                  updateActionJoystickFromClient(e.clientX, e.clientY);
                }
              }}
              onPointerUp={(e) => {
                if (actionPointerIdRef.current === e.pointerId) {
                  resetActionJoystick();
                }
              }}
              onPointerCancel={resetActionJoystick}
              className={`relative flex items-center justify-center rounded-full border-3 sm:border-4 border-sky-200 bg-slate-900/55 shadow-xl touch-none select-none cursor-grab active:cursor-grabbing ${
                bigBtn
                  ? 'h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 lg:h-36 lg:w-36'
                  : 'h-24 w-24 sm:h-28 sm:w-28'
              }`}
              aria-label="Joystick Aksi Kiri (Terbang, Kendaraan, Loncat)"
            >
              {/* Directional Action Labels */}
              <span
                className={`pointer-events-none absolute top-1 sm:top-2 flex items-center gap-0.5 rounded px-1 text-[8px] sm:text-[10px] font-extrabold transition-colors ${
                  activeActionZone === 'fly_up'
                    ? 'bg-sky-400 text-slate-950'
                    : 'text-sky-200'
                }`}
              >
                <ArrowUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span>TERBANG</span>
              </span>

              <span
                className={`pointer-events-none absolute bottom-1 sm:bottom-2 flex items-center gap-0.5 rounded px-1 text-[8px] sm:text-[10px] font-extrabold transition-colors ${
                  activeActionZone === 'fly_down'
                    ? 'bg-indigo-400 text-slate-950'
                    : 'text-indigo-200'
                }`}
              >
                <ArrowDown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span>{hud.locomotionMode === 'fly' ? 'TURUN' : 'JALAN'}</span>
              </span>

              <span
                className={`pointer-events-none absolute left-1 sm:left-1.5 rounded px-1 text-[8px] sm:text-[10px] font-extrabold transition-colors ${
                  activeActionZone === 'vehicle'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-amber-200'
                }`}
              >
                {hud.locomotionMode === 'drive' ? 'JALAN' : 'MOBIL'}
              </span>

              <span
                className={`pointer-events-none absolute right-1 sm:right-1.5 rounded px-1 text-[8px] sm:text-[10px] font-extrabold transition-colors ${
                  activeActionZone === 'jump'
                    ? 'bg-emerald-400 text-slate-950'
                    : 'text-emerald-200'
                }`}
              >
                LONCAT
              </span>

              {/* Crosshair Guide Ring */}
              <div className="pointer-events-none h-11 w-11 sm:h-16 sm:w-16 rounded-full border-2 border-dashed border-white/35" />

              {/* Action Thumb Knob */}
              <div
                className={`pointer-events-none absolute flex items-center justify-center rounded-full shadow-lg border-2 border-white transition-transform ${
                  isDraggingActionJoy
                    ? 'bg-sky-400 scale-105 duration-0'
                    : hud.locomotionMode === 'fly'
                    ? 'bg-sky-500 duration-150'
                    : hud.locomotionMode === 'walk'
                    ? 'bg-emerald-500 duration-150'
                    : 'bg-amber-500 duration-150'
                } ${
                  bigBtn
                    ? 'h-10 w-10 sm:h-14 sm:w-14 md:h-16 md:w-16'
                    : 'h-9 w-9 sm:h-12 sm:w-12'
                }`}
                style={{
                  transform: `translate(${actionKnobPos.x}px, ${actionKnobPos.y}px)`,
                }}
              >
                {hud.locomotionMode === 'fly' ? (
                  <Feather className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                ) : hud.locomotionMode === 'walk' ? (
                  <Footprints className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                ) : (
                  <Car className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                )}
              </div>
            </div>

            {/* Docked Magnet Trigger on Left Joystick Rim */}
            <button
              type="button"
              onPointerDown={() => controlRef.current?.triggerMagnet()}
              onClick={() => controlRef.current?.triggerMagnet()}
              disabled={!magnetReady}
              aria-label="Aktifkan Magnet"
              title="Magnet Koin & Kata (M)"
              className={`-ml-2 sm:-ml-1 mb-12 sm:mb-16 md:mb-20 flex flex-col items-center justify-center rounded-full border-2 shadow-lg font-bold transition-transform active:scale-95 shrink-0 ${
                bigBtn ? 'h-11 w-11 sm:h-12 sm:w-12 md:h-14 md:w-14' : 'h-10 w-10 sm:h-12 sm:w-12'
              } ${
                hud.magnetActiveLeft > 0
                  ? 'bg-cyan-400 text-slate-950 border-white ring-4 ring-cyan-200/75 scale-105'
                  : magnetReady
                  ? 'bg-cyan-600 text-white border-cyan-200 hover:bg-cyan-500'
                  : 'bg-slate-700/90 text-slate-300 border-slate-500'
              }`}
            >
              <Magnet className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-[8px] sm:text-[9px] leading-none mt-0.5 font-mono-num">
                {hud.magnetActiveLeft > 0
                  ? `${Math.ceil(hud.magnetActiveLeft)}d`
                  : magnetReady
                  ? 'MAGNET'
                  : `${Math.ceil(hud.magnetCooldownLeft)}d`}
              </span>
            </button>
          </div>

          <span className="rounded-lg bg-slate-900/75 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-white whitespace-nowrap">
            Joystick Aksi
          </span>
        </div>

        {/* CENTER: Active Mode Pill (Tap to Cycle) + Desktop Keyboard Legend */}
        <div className="pointer-events-auto hidden sm:flex flex-col items-center gap-1.5 pb-1 min-w-0">
          <div className="flex items-center gap-1 rounded-xl bg-slate-900/80 p-1 shadow-md border border-white/15">
            {(
              [
                { id: 'drive', label: 'Kendaraan', Icon: Car },
                { id: 'walk', label: 'Jalan', Icon: Footprints },
                { id: 'fly', label: 'Terbang', Icon: Feather },
              ] as const
            ).map(({ id, label, Icon }) => {
              const active = hud.locomotionMode === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => controlRef.current?.setLocomotionMode(id as LocomotionMode)}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors whitespace-nowrap ${
                    active
                      ? id === 'fly'
                        ? 'bg-sky-500 text-white'
                        : id === 'walk'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-amber-500 text-white'
                      : 'text-white/75 hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
          <div className="hidden xl:block rounded-xl bg-slate-900/80 px-3.5 py-1.5 text-[11px] font-medium text-white/95 whitespace-nowrap">
            WASD/Panah: Gerak 360° · Spasi: Loncat · F: Terbang · M: Magnet · E: Skill
          </div>
        </div>

        {/* RIGHT CLUSTER: 360° Movement Joystick (Maju, Mundur, Belok Kiri/Kanan) + Rim Skill Button */}
        <div className="pointer-events-auto flex flex-col items-center gap-1 sm:gap-1.5 shrink-0">
          <div className="relative flex items-end">
            {/* Docked Skill Trigger on Right Joystick Rim */}
            <button
              type="button"
              onPointerDown={() => controlRef.current?.triggerAbility()}
              onClick={() => controlRef.current?.triggerAbility()}
              disabled={!abilityReady}
              aria-label={`Aktifkan ${animal.abilityName}`}
              title={`${animal.abilityName} (E)`}
              className={`-mr-2 sm:-mr-1 mb-12 sm:mb-16 md:mb-20 flex flex-col items-center justify-center rounded-full border-2 shadow-lg font-bold transition-transform active:scale-95 shrink-0 z-10 ${
                bigBtn ? 'h-11 w-11 sm:h-12 sm:w-12 md:h-14 md:w-14' : 'h-10 w-10 sm:h-12 sm:w-12'
              } ${
                hud.abilityActiveLeft > 0
                  ? 'bg-amber-400 text-slate-950 border-white ring-4 ring-amber-200/75 scale-105'
                  : abilityReady
                  ? 'bg-indigo-600 text-white border-indigo-200 hover:bg-indigo-500'
                  : 'bg-slate-700/90 text-slate-300 border-slate-500'
              }`}
            >
              {animalId === 'bimo' ? (
                <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : animalId === 'lulu' ? (
                <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
              <span className="text-[8px] sm:text-[9px] leading-none mt-0.5 font-mono-num">
                {hud.abilityActiveLeft > 0
                  ? `${Math.ceil(hud.abilityActiveLeft)}d`
                  : abilityReady
                  ? 'SKILL'
                  : `${Math.ceil(hud.abilityCooldownLeft)}d`}
              </span>
            </button>

            <div
              ref={moveJoyBaseRef}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                movePointerIdRef.current = e.pointerId;
                setIsDraggingMoveJoy(true);
                updateMoveJoystickFromClient(e.clientX, e.clientY);
              }}
              onPointerMove={(e) => {
                if (movePointerIdRef.current === e.pointerId) {
                  updateMoveJoystickFromClient(e.clientX, e.clientY);
                }
              }}
              onPointerUp={(e) => {
                if (movePointerIdRef.current === e.pointerId) {
                  resetMoveJoystick();
                }
              }}
              onPointerCancel={resetMoveJoystick}
              className={`relative flex items-center justify-center rounded-full border-3 sm:border-4 border-white bg-slate-900/55 shadow-xl touch-none select-none cursor-grab active:cursor-grabbing ${
                bigBtn
                  ? 'h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 lg:h-36 lg:w-36'
                  : 'h-24 w-24 sm:h-28 sm:w-28'
              }`}
              aria-label="Joystick Gerak 360 Derajat"
            >
              <span className="pointer-events-none absolute top-1 sm:top-2 text-[8px] sm:text-[10px] font-extrabold text-white/90">
                MAJU
              </span>
              <span className="pointer-events-none absolute bottom-1 sm:bottom-2 text-[8px] sm:text-[10px] font-extrabold text-white/90">
                MUNDUR
              </span>
              <span className="pointer-events-none absolute left-1.5 sm:left-2 text-[9px] sm:text-[11px] font-extrabold text-white/90">
                ◀
              </span>
              <span className="pointer-events-none absolute right-1.5 sm:right-2 text-[9px] sm:text-[11px] font-extrabold text-white/90">
                ▶
              </span>

              <div className="pointer-events-none h-11 w-11 sm:h-16 sm:w-16 rounded-full border-2 border-dashed border-white/40" />

              <div
                className={`pointer-events-none absolute flex items-center justify-center rounded-full shadow-lg border-2 border-white transition-transform ${
                  isDraggingMoveJoy
                    ? 'bg-amber-400 scale-105 duration-0'
                    : 'bg-amber-500 duration-150'
                } ${
                  bigBtn
                    ? 'h-10 w-10 sm:h-14 sm:w-14 md:h-16 md:w-16'
                    : 'h-9 w-9 sm:h-12 sm:w-12'
                }`}
                style={{
                  transform: `translate(${moveKnobPos.x}px, ${moveKnobPos.y}px)`,
                }}
              >
                <div className="h-3.5 w-3.5 sm:h-5 sm:w-5 rounded-full bg-white/85" />
              </div>
            </div>
          </div>

          <span className="rounded-lg bg-slate-900/75 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-white whitespace-nowrap">
            Joystick Gerak 360°
          </span>
        </div>
      </div>
    </div>
  );
};
