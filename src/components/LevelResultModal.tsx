import React from 'react';
import { ArrowRight, Check, RotateCcw, Sparkles, Star, UserPlus, Volume2 } from 'lucide-react';
import { motion } from 'motion/react';
import { ANIMALS, MAX_LEVEL, getCharacterById } from '../data/gameCatalog';
import { AnimalId, CharacterDef, VocabWord } from '../types/game';
import { soundEngine } from '../utils/audio';

const CONFETTI_PIECES = [
  { x: -160, y: -120, color: '#F59E0B', rot: 45, delay: 0 },
  { x: -120, y: -160, color: '#0EA5E9', rot: -60, delay: 0.05 },
  { x: -70, y: -140, color: '#10B981', rot: 90, delay: 0.08 },
  { x: -20, y: -170, color: '#EC4899', rot: -30, delay: 0.03 },
  { x: 35, y: -165, color: '#FACC15', rot: 75, delay: 0.06 },
  { x: 90, y: -150, color: '#8B5CF6', rot: -80, delay: 0.02 },
  { x: 145, y: -130, color: '#F43F5E', rot: 55, delay: 0.07 },
  { x: -140, y: -70, color: '#38BDF8', rot: -45, delay: 0.1 },
  { x: 150, y: -80, color: '#22C55E', rot: 110, delay: 0.09 },
  { x: 0, y: -190, color: '#F97316', rot: 25, delay: 0.04 },
];

interface LevelResultModalProps {
  level: number;
  score: number;
  coinsEarned: number;
  xpEarned: number;
  stars: 1 | 2 | 3;
  wordsCollected: VocabWord[];
  animalId: AnimalId;
  characterId?: string;
  evolvedToStage: 1 | 2 | 3 | 4 | null;
  unlockedCharacter?: CharacterDef | null;
  onEquipUnlockedCharacter?: (char: CharacterDef) => void;
  onReplay: () => void;
  onNextLevel: () => void;
  onExit: () => void;
}

export const LevelResultModal: React.FC<LevelResultModalProps> = ({
  level,
  score,
  coinsEarned,
  xpEarned,
  stars,
  wordsCollected,
  animalId,
  characterId,
  evolvedToStage,
  unlockedCharacter,
  onEquipUnlockedCharacter,
  onReplay,
  onNextLevel,
  onExit,
}) => {
  const animal = ANIMALS[animalId];
  const activeChar = getCharacterById(characterId);
  const isUnlockedEquipped = unlockedCharacter ? characterId === unlockedCharacter.id : false;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden ${
        evolvedToStage ? 'bg-slate-900/45' : 'bg-slate-900/65'
      }`}
    >
      {/* Lightweight celebratory confetti burst */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        {CONFETTI_PIECES.map((c, idx) => (
          <motion.span
            key={idx}
            initial={{ opacity: 1, x: 0, y: 0, scale: 0.5, rotate: 0 }}
            animate={{
              opacity: [1, 1, 0],
              x: c.x * 1.4,
              y: [c.y, c.y + 240],
              scale: [0.8, 1.15, 0.8],
              rotate: c.rot * 2,
            }}
            transition={{ duration: 1.4, delay: c.delay, ease: 'easeOut' }}
            className="absolute h-3 w-2 rounded-sm"
            style={{ backgroundColor: c.color }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-lg max-h-[90dvh] overflow-y-auto custom-scroll rounded-3xl bg-white p-5 sm:p-7 shadow-2xl border border-slate-200 text-center">
        {/* Stars Header */}
        <div className="flex justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <Star
              key={s}
              className={`h-10 w-10 ${
                s <= stars ? 'fill-amber-400 text-amber-500' : 'text-slate-200'
              }`}
            />
          ))}
        </div>

        <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">
          Level {level} Selesai!
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Kerja bagus! Kamu dan {activeChar.name} berhasil melewati garis finis!
        </p>

        {/* Evolution Celebration */}
        {evolvedToStage && (
          <div className="mt-4 rounded-2xl border-2 border-amber-300 bg-amber-50 p-3.5 text-amber-900">
            <div className="flex items-center justify-center gap-2 font-bold text-base">
              <Sparkles className="h-5 w-5 text-amber-600" />
              <span>
                Evolusi Baru! {activeChar.name} menjadi {animal.stages[evolvedToStage - 1].title}!
              </span>
            </div>
            <div className="mt-1 text-xs">
              Kemampuan meningkat: {animal.stages[evolvedToStage - 1].abilityPowerLabel}
            </div>
          </div>
        )}

        {/* Newly Unlocked Character Banner */}
        {unlockedCharacter && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border-2 border-emerald-300 bg-emerald-50 px-4 py-3 text-left">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 border-2 border-white shadow-sm"
                style={{ backgroundColor: unlockedCharacter.primaryColor }}
              >
                #{unlockedCharacter.index}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>AVATAR LUCU BARU TERBUKA!</span>
                </div>
                <div className="text-sm font-bold text-slate-900 truncate">
                  {unlockedCharacter.name} · {unlockedCharacter.species}
                </div>
              </div>
            </div>
            {onEquipUnlockedCharacter && (
              <button
                type="button"
                onClick={() => onEquipUnlockedCharacter(unlockedCharacter)}
                disabled={isUnlockedEquipped}
                className={`flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold shrink-0 transition-colors ${
                  isUnlockedEquipped
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                }`}
              >
                {isUnlockedEquipped ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Dipakai</span>
                  </>
                ) : (
                  <span>Pakai</span>
                )}
              </button>
            )}
          </div>
        )}

        {/* Stats Row */}
        <div className="mt-5 grid grid-cols-3 gap-2.5 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
          <div>
            <div className="text-xs text-slate-500">Skor</div>
            <div className="text-lg font-bold text-slate-900 font-mono-num">{score}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Koin</div>
            <div className="text-lg font-bold text-amber-600 font-mono-num">+{coinsEarned}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">XP Hewan</div>
            <div className="text-lg font-bold text-sky-600 font-mono-num">+{xpEarned}</div>
          </div>
        </div>

        {/* Vocabulary Learned */}
        {wordsCollected.length > 0 && (
          <div className="mt-4 text-left">
            <div className="text-xs font-bold text-slate-600 mb-2">
              Kosa Kata Baru yang Dipelajari ({wordsCollected.length}):
            </div>
            <div className="max-h-32 overflow-y-auto custom-scroll space-y-1.5">
              {wordsCollected.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{w.emoji}</span>
                    <div>
                      <span className="font-bold text-slate-900">{w.indonesian}</span>
                      <span className="text-slate-400 mx-1.5">·</span>
                      <span className="font-bold text-sky-700">{w.english}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-arabic text-base font-bold text-slate-900">
                      {w.arabic}
                    </span>
                    <button
                      type="button"
                      onClick={() => soundEngine.speakWord(w.english, w.arabic)}
                      className="rounded-lg bg-slate-100 p-1.5 text-sky-600 hover:bg-sky-100"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onExit}
            className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            Menu Utama
          </button>
          <button
            type="button"
            onClick={onReplay}
            className="flex items-center gap-1.5 rounded-2xl bg-sky-100 px-4 py-3 text-sm font-bold text-sky-800 hover:bg-sky-200"
          >
            <RotateCcw className="h-4 w-4" />
            Ulangi
          </button>
          {level < MAX_LEVEL && (
            <button
              type="button"
              onClick={onNextLevel}
              className="flex items-center gap-1.5 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-bold text-white hover:bg-amber-600"
            >
              <span>Level {level + 1}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
