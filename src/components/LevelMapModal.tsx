import React, { useState } from 'react';
import { Lock, Star, X } from 'lucide-react';
import {
  computeSequentialUnlockedLevel,
  getBiomeForLevel,
  isLevelUnlocked,
  MAX_LEVEL,
} from '../data/gameCatalog';
import { PlayerProfile } from '../types/game';

interface LevelMapModalProps {
  profile: PlayerProfile;
  onClose: () => void;
  onSelectLevel: (level: number) => void;
}

const STAGE_RANGES = [
  { id: 1, label: 'Tahap 1 · Pemula', start: 1, end: 50 },
  { id: 2, label: 'Tahap 2 · Petualang', start: 51, end: 100 },
  { id: 3, label: 'Tahap 3 · Penjelajah', start: 101, end: 150 },
  { id: 4, label: 'Tahap 4 · Tangkas', start: 151, end: 200 },
  { id: 5, label: 'Tahap 5 · Kalimat I', start: 201, end: 250 },
  { id: 6, label: 'Tahap 6 · Kalimat II', start: 251, end: 300 },
  { id: 7, label: 'Tahap 7 · Kalimat III', start: 301, end: 350 },
  { id: 8, label: 'Tahap 8 · Kalimat IV', start: 351, end: 400 },
  { id: 9, label: 'Tahap 9 · Kalimat V', start: 401, end: 450 },
  { id: 10, label: 'Tahap 10 · Master', start: 451, end: MAX_LEVEL },
];

export const LevelMapModal: React.FC<LevelMapModalProps> = ({
  profile,
  onClose,
  onSelectLevel,
}) => {
  const sequentialUnlocked = computeSequentialUnlockedLevel(profile.completedLevels);
  const initialWorld = Math.min(10, Math.max(1, Math.ceil(sequentialUnlocked / 50)));
  const [worldTab, setWorldTab] = useState<number>(initialWorld);
  const currentRange = STAGE_RANGES.find((b) => b.id === worldTab)!;

  const levels = Array.from(
    { length: currentRange.end - currentRange.start + 1 },
    (_, i) => currentRange.start + i
  );

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/55 p-3 sm:p-4">
      <div className="flex max-h-[90dvh] w-full max-w-3xl flex-col rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 sm:px-6 py-3.5 sm:py-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
              Peta {MAX_LEVEL} Level Petualangan
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 truncate">
              Terbuka hingga Level {sequentialUnlocked}/{MAX_LEVEL} · Selesaikan level sebelumnya untuk membuka level berikutnya
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label="Tutup"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 10 Progression Stage Tabs */}
        <div className="flex gap-2 overflow-x-auto border-b border-slate-100 px-4 sm:px-6 py-2.5 sm:py-3">
          {STAGE_RANGES.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setWorldTab(b.id)}
              className={`rounded-xl px-3 sm:px-3.5 py-2 text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                worldTab === b.id
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {b.label} ({b.start}–{b.end})
            </button>
          ))}
        </div>

        {/* Terrain & Difficulty Summary */}
        <div className="bg-slate-50 px-4 sm:px-6 py-2 text-[11px] sm:text-xs text-slate-600 flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-100">
          <span>
            Arena: <strong className="text-slate-900">500 Lintasan Berliku & Lingkungan Selalu Berbeda</strong>
          </span>
          <span>
            {worldTab === 1 && 'Misi 10+ Kata Baru/Level · Tikungan Ringan & Cuaca Dinamis'}
            {worldTab === 2 && 'Kosa Kata Baru Tiap Level · Rintangan & Makhluk Hidup'}
            {worldTab === 3 && 'Tikungan Tajam & Jalan Beragam · Arena Unik Setiap Level'}
            {worldTab === 4 && 'Penghalang Dinamis & Kosa Kata Tersembunyi'}
            {worldTab >= 5 && worldTab <= 9 && 'Misi Susun Kalimat Percakapan Arab & Inggris Sehari-hari'}
            {worldTab === 10 && 'Tantangan Puncak Susun Kalimat · Level Master 451–500'}
          </span>
        </div>

        {/* 50 Level Grid */}
        <div className="custom-scroll flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 sm:gap-2.5">
            {levels.map((lvl) => {
              const unlocked = isLevelUnlocked(lvl, profile.completedLevels);
              const stars = profile.completedLevels[lvl] || 0;
              const biome = getBiomeForLevel(lvl);
              return (
                <button
                  key={lvl}
                  type="button"
                  disabled={!unlocked}
                  onClick={() => {
                    if (unlocked) onSelectLevel(lvl);
                  }}
                  title={
                    unlocked
                      ? `Level ${lvl} · ${biome.name}`
                      : `Level ${lvl} terkunci · Selesaikan Level ${lvl - 1} terlebih dahulu`
                  }
                  className={`flex flex-col items-center justify-center rounded-2xl border py-2.5 px-1 transition-all ${
                    unlocked
                      ? stars > 0
                        ? 'border-emerald-300 bg-emerald-50 text-slate-900 hover:border-emerald-500'
                        : 'border-amber-300 bg-amber-50 text-slate-900 hover:bg-amber-100'
                      : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span className="text-sm font-bold font-mono-num">{lvl}</span>
                  <span className="mt-0.5 text-[10px] font-medium text-slate-500 truncate max-w-full px-1">
                    {biome.name.split(' ')[0]}
                  </span>
                  {unlocked ? (
                    <div className="mt-1 flex items-center gap-0.5">
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          className={`h-3 w-3 ${
                            s <= stars
                              ? 'fill-amber-400 text-amber-500'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                  ) : (
                    <Lock className="mt-1 h-3 w-3 text-slate-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
