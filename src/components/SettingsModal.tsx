import React, { useState } from 'react';
import { Settings, X } from 'lucide-react';
import { ControlSpeed, GameSettings } from '../types/game';

interface SettingsModalProps {
  playerName: string;
  settings: GameSettings;
  onSave: (name: string, settings: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  playerName,
  settings,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(playerName);
  const [draft, setDraft] = useState<GameSettings>({ ...settings });

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(name.trim() || 'Petualang', draft);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/55 p-3 sm:p-4">
      <form
        onSubmit={handleApply}
        className="flex max-h-[90dvh] w-full max-w-lg flex-col rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 sm:px-6 py-3.5 sm:py-4 gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Settings className="h-5 w-5 text-slate-700 shrink-0" />
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">Pengaturan Kontrol &amp; Anak</h2>
              <p className="text-xs text-slate-500 truncate">Sesuaikan kontrol sederhana dan ramah usia dini</p>
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

        <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto custom-scroll">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nama Petualang (Untuk Papan Peringkat)
            </label>
            <input
              type="text"
              maxLength={20}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-900"
            />
          </div>

          {/* Early Childhood Friendly Toggles */}
          <label className="flex items-center justify-between rounded-2xl border border-slate-200 p-3.5 cursor-pointer hover:bg-slate-50">
            <div>
              <div className="text-sm font-bold text-slate-900">Mode Ramah Usia Dini</div>
              <div className="text-xs text-slate-500">
                Tombol sentuh ekstra besar dan perlambatan lembut saat menyentuh rintangan
              </div>
            </div>
            <input
              type="checkbox"
              checked={draft.earlyChildhoodMode}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  earlyChildhoodMode: e.target.checked,
                  touchButtonScale: e.target.checked ? 'large' : draft.touchButtonScale,
                })
              }
              className="h-5 w-5 accent-amber-500"
            />
          </label>

          <label className="flex items-center justify-between rounded-2xl border border-slate-200 p-3.5 cursor-pointer hover:bg-slate-50">
            <div>
              <div className="text-sm font-bold text-slate-900">Gas Otomatis (Opsional)</div>
              <div className="text-xs text-slate-500">
                Nonaktif secara default agar anak bebas mengendarai manual dengan Joystick 360° di sebelah kanan
              </div>
            </div>
            <input
              type="checkbox"
              checked={draft.autoDrive}
              onChange={(e) => setDraft({ ...draft, autoDrive: e.target.checked })}
              className="h-5 w-5 accent-amber-500"
            />
          </label>

          <div>
            <div className="text-xs font-bold text-slate-700 mb-2">Kecepatan Berkendara</div>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'gentle', label: 'Santai (Anak)' },
                  { id: 'normal', label: 'Normal' },
                  { id: 'fast', label: 'Cepat' },
                ] as { id: ControlSpeed; label: string }[]
              ).map((sp) => (
                <button
                  key={sp.id}
                  type="button"
                  onClick={() => setDraft({ ...draft, speedPreset: sp.id })}
                  className={`rounded-xl border py-2 text-xs font-bold transition-colors ${
                    draft.speedPreset === sp.id
                      ? 'border-amber-500 bg-amber-50 text-amber-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {sp.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between rounded-2xl border border-slate-200 p-3.5 cursor-pointer hover:bg-slate-50">
            <div>
              <div className="text-sm font-bold text-slate-900">Efek Suara Game</div>
              <div className="text-xs text-slate-500">Suara koin, lompatan, dan selebrasi</div>
            </div>
            <input
              type="checkbox"
              checked={draft.soundEnabled}
              onChange={(e) => setDraft({ ...draft, soundEnabled: e.target.checked })}
              className="h-5 w-5 accent-amber-500"
            />
          </label>

          <label className="flex items-center justify-between rounded-2xl border border-slate-200 p-3.5 cursor-pointer hover:bg-slate-50">
            <div>
              <div className="text-sm font-bold text-slate-900">Suara Pelafalan Arab & Inggris</div>
              <div className="text-xs text-slate-500">Mengucapkan kata saat mengambil kartu kosa kata</div>
            </div>
            <input
              type="checkbox"
              checked={draft.voicePronunciation}
              onChange={(e) => setDraft({ ...draft, voicePronunciation: e.target.checked })}
              className="h-5 w-5 accent-amber-500"
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            Batal
          </button>
          <button
            type="submit"
            className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-600"
          >
            Simpan Pengaturan
          </button>
        </div>
      </form>
    </div>
  );
};
