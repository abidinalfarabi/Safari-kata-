import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Lock,
  Search,
  Volume2,
  X,
} from 'lucide-react';
import { VOCAB_CATEGORIES, VOCAB_WORDS } from '../data/vocabData';
import { VocabCategory } from '../types/game';
import { soundEngine } from '../utils/audio';

interface DictionaryModalProps {
  collectedWordIds: string[];
  onClose: () => void;
}

const CATEGORIES: ('Semua' | VocabCategory)[] = ['Semua', ...VOCAB_CATEGORIES];
const WORDS_PER_PAGE = 30;

export const DictionaryModal: React.FC<DictionaryModalProps> = ({
  collectedWordIds,
  onClose,
}) => {
  const [cat, setCat] = useState<'Semua' | VocabCategory>('Semua');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const collectedSet = useMemo(() => new Set(collectedWordIds), [collectedWordIds]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return VOCAB_WORDS.filter((w) => {
      if (cat !== 'Semua' && w.category !== cat) return false;
      if (!q) return true;
      return (
        w.indonesian.toLowerCase().includes(q) ||
        w.english.toLowerCase().includes(q) ||
        w.transliteration.toLowerCase().includes(q) ||
        w.arabic.includes(q)
      );
    });
  }, [cat, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / WORDS_PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const pageWords = filtered.slice(
    safePage * WORDS_PER_PAGE,
    (safePage + 1) * WORDS_PER_PAGE
  );

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/55 p-3 sm:p-4">
      <div className="flex max-h-[90dvh] w-full max-w-4xl flex-col rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 sm:px-6 py-3.5 sm:py-4 gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <BookOpen className="h-5 w-5 text-sky-600 shrink-0" />
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                Kamus {VOCAB_WORDS.length.toLocaleString('id-ID')} Kosa Kata Arab &amp; Inggris
              </h2>
              <p className="text-xs text-slate-500 truncate">
                Terkumpul:{' '}
                <span className="font-bold text-sky-700 font-mono-num">
                  {collectedWordIds.length} / {VOCAB_WORDS.length.toLocaleString('id-ID')}
                </span>{' '}
                kata · Klik suara untuk mendengar
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 transition-colors shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search + 23 Category Tabs */}
        <div className="border-b border-slate-100 px-4 sm:px-6 py-2.5 sm:py-3 space-y-2.5 shrink-0">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Cari kosa kata Indonesia, Inggris, Arab, atau angka 1–500..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:outline-none"
            />
          </div>
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setCat(c);
                  setPage(0);
                }}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap shrink-0 transition-colors ${
                  cat === c
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="custom-scroll flex-1 overflow-y-auto p-4 sm:p-6">
          {pageWords.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500">
              Tidak ada kosa kata yang cocok dengan pencarianmu.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
              {pageWords.map((word) => {
                const unlocked = collectedSet.has(word.id);
                return (
                  <div
                    key={word.id}
                    className={`rounded-2xl border p-3.5 sm:p-4 transition-colors ${
                      unlocked
                        ? 'border-sky-200 bg-sky-50/50'
                        : 'border-slate-200 bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-2xl shrink-0">{word.emoji}</span>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 truncate">
                            {word.indonesian}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {word.category}
                          </div>
                        </div>
                      </div>
                      {unlocked ? (
                        <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Lock className="h-4 w-4 text-slate-300 shrink-0" />
                      )}
                    </div>

                    <div className="mt-2.5 flex items-center justify-between border-t border-slate-200/70 pt-2.5 gap-2">
                      <div className="min-w-0">
                        <div className="text-base sm:text-lg font-bold text-slate-900 font-arabic truncate">
                          {word.arabic}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {word.transliteration} · <strong className="text-sky-700">{word.english}</strong>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => soundEngine.speakWord(word.english, word.arabic)}
                        className="rounded-xl bg-white p-2 text-sky-600 border border-slate-200 hover:bg-sky-50 transition-colors shrink-0"
                        title="Dengarkan"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 sm:px-6 py-2.5 shrink-0">
          <button
            type="button"
            disabled={safePage <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Sebelumnya</span>
          </button>
          <span className="text-xs font-bold text-slate-600 font-mono-num">
            {filtered.length === 0
              ? '0 hasil'
              : `${safePage * WORDS_PER_PAGE + 1}–${Math.min(
                  (safePage + 1) * WORDS_PER_PAGE,
                  filtered.length
                )} dari ${filtered.length.toLocaleString('id-ID')} (Hal ${safePage + 1}/${totalPages})`}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            <span>Berikutnya</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
