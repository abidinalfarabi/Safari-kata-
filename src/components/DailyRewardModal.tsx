import React from 'react';
import { Check, Gift, X } from 'lucide-react';
import { DAILY_REWARDS } from '../data/gameCatalog';
import { PlayerProfile } from '../types/game';

interface DailyRewardModalProps {
  profile: PlayerProfile;
  canClaimToday: boolean;
  onClaim: () => void;
  onClose: () => void;
}

export const DailyRewardModal: React.FC<DailyRewardModalProps> = ({
  profile,
  canClaimToday,
  onClaim,
  onClose,
}) => {
  const activeDayIndex = profile.dailyStreak % 7;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/55 p-3 sm:p-4">
      <div className="flex max-h-[90dvh] w-full max-w-xl flex-col rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 sm:px-6 py-3.5 sm:py-4 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <Gift className="h-5 w-5 text-amber-500 shrink-0" />
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">Hadiah Harian Petualang</h2>
              <p className="text-xs text-slate-500">
                Rekor Hari Berturut-turut: <span className="font-bold text-amber-600">{profile.dailyStreak} Hari</span>
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

        <div className="custom-scroll flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {DAILY_REWARDS.map((reward, idx) => {
              const claimed = idx < activeDayIndex || (!canClaimToday && idx === activeDayIndex && profile.dailyStreak > 0 && idx === (profile.dailyStreak - 1) % 7);
              const isToday = canClaimToday && idx === activeDayIndex;
              return (
                <div
                  key={reward.day}
                  className={`rounded-2xl border-2 p-3 text-center transition-all ${
                    idx === 6 ? 'col-span-2 sm:col-span-2' : ''
                  } ${
                    isToday
                      ? 'border-amber-500 bg-amber-50'
                      : claimed
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-500">Hari {reward.day}</div>
                  <div className="mt-1.5 text-sm font-bold text-slate-900">{reward.label}</div>
                  <div className="mt-2 flex justify-center">
                    {claimed ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                        <Check className="h-3.5 w-3.5" /> Diambil
                      </span>
                    ) : isToday ? (
                      <span className="text-xs font-bold text-amber-700">Siap Diambil!</span>
                    ) : (
                      <span className="text-xs text-slate-400">Menunggu</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <span className="text-xs text-slate-500">
              Main setiap hari untuk membuka cat, roda, dan mahkota gratis!
            </span>
            <button
              type="button"
              disabled={!canClaimToday}
              onClick={onClaim}
              className="w-full sm:w-auto rounded-2xl bg-amber-500 px-6 py-3 text-sm font-bold text-white hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 transition-colors whitespace-nowrap"
            >
              {canClaimToday ? 'Ambil Hadiah Hari Ini' : 'Sudah Diambil Hari Ini'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
