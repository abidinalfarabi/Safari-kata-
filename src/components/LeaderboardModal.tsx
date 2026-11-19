import React, { useEffect, useState } from 'react';
import { RefreshCw, Trophy, X } from 'lucide-react';
import { ANIMALS } from '../data/gameCatalog';
import { LeaderboardEntry } from '../types/game';

interface LeaderboardModalProps {
  localPlayerId: string;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  localPlayerId,
  onClose,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setEntries(Array.isArray(data.entries) ? data.entries : []);
      }
    } catch {
      // Ignore error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/55 p-3 sm:p-4">
      <div className="flex max-h-[90dvh] w-full max-w-2xl flex-col rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 sm:px-6 py-3.5 sm:py-4 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <Trophy className="h-5 w-5 text-amber-500 shrink-0" />
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">Papan Peringkat Juara</h2>
              <p className="text-xs text-slate-500 truncate">Kumpulkan kosa kata &amp; selesaikan level untuk naik peringkat</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={loadLeaderboard}
              className="rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label="Segarkan"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
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

        <div className="custom-scroll flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">Memuat papan peringkat...</div>
          ) : entries.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Belum ada data peringkat. Jadilah yang pertama!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] sm:text-xs font-semibold text-slate-500">
                    <th className="pb-3 pr-2 sm:pr-3">Rank</th>
                    <th className="pb-3 pr-2 sm:pr-3">Petualang</th>
                    <th className="hidden sm:table-cell pb-3 pr-3 text-right">Level</th>
                    <th className="pb-3 pr-2 sm:pr-3 text-right">Kata</th>
                    <th className="pb-3 text-right">Skor Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {entries.map((entry, idx) => {
                    const isMe = entry.playerId === localPlayerId;
                    const animal = ANIMALS[entry.animalId] || ANIMALS.kiko;
                    return (
                      <tr
                        key={entry.playerId}
                        className={isMe ? 'bg-amber-50 font-semibold' : 'hover:bg-slate-50'}
                      >
                        <td className="py-2.5 sm:py-3 pr-2 sm:pr-3 font-mono-num font-bold text-slate-700">
                          #{idx + 1}
                        </td>
                        <td className="py-2.5 sm:py-3 pr-2 sm:pr-3 min-w-0">
                          <div className="text-slate-900 font-bold truncate max-w-[140px] sm:max-w-none">
                            {entry.name} {isMe && '(Kamu)'}
                          </div>
                          <div className="text-[11px] sm:text-xs text-slate-500">
                            {animal.name} · Tahap {entry.evolutionStage}
                            <span className="sm:hidden"> · Lv.{entry.highestLevel}</span>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell py-3 pr-3 text-right font-mono-num text-slate-700">
                          {entry.highestLevel}
                        </td>
                        <td className="py-2.5 sm:py-3 pr-2 sm:pr-3 text-right font-mono-num text-sky-700">
                          {entry.wordsCollected}
                        </td>
                        <td className="py-2.5 sm:py-3 text-right font-mono-num font-bold text-amber-600">
                          {entry.totalScore.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
