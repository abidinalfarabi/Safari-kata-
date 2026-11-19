import React, { useMemo, useState } from 'react';
import {
  Bike,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  Feather,
  Footprints,
  Lock,
  Search,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react';
import {
  ANIMALS,
  CHARACTER_ROSTER,
  COSMETIC_CATALOG,
  CosmeticItem,
  TOTAL_CHARACTERS,
  getAnimalEvolutionStage,
  getCharacterById,
  getXpForNextStage,
} from '../data/gameCatalog';
import {
  AvatarAccessory,
  CharacterDef,
  HatStyle,
  LocomotionMode,
  PlayerProfile,
  TrailStyle,
  VehicleCustomization,
  WheelStyle,
} from '../types/game';
import { soundEngine } from '../utils/audio';

const ACCESSORY_LABEL: Record<AvatarAccessory, string> = {
  bow: '🎀 Pita Lucu',
  flower_crown: '🌸 Mahkota Bunga',
  star_clip: '⭐ Jepit Bintang',
  round_glasses: '👓 Kacamata Bundar',
  headphones: '🎧 Headphone Imut',
  scarf: '🧣 Syal Hangat',
  sprout: '🌱 Tunas Daun',
  beret: '🎨 Topi Baret',
  mini_crown: '👑 Mahkota Mini',
  blush_halo: '✨ Halo Bercahaya',
};

interface GarageModalProps {
  profile: PlayerProfile;
  showcaseLocomotion: LocomotionMode;
  onChangeShowcaseLocomotion: (next: LocomotionMode) => void;
  onClose: () => void;
  onSelectCharacter: (char: CharacterDef) => void;
  onUpdateCustomization: (next: VehicleCustomization) => void;
  onUnlockCosmetic: (item: CosmeticItem) => void;
}

const CHARS_PER_PAGE = 24;

export const GarageModal: React.FC<GarageModalProps> = ({
  profile,
  showcaseLocomotion,
  onChangeShowcaseLocomotion,
  onClose,
  onSelectCharacter,
  onUpdateCustomization,
  onUnlockCosmetic,
}) => {
  const [tab, setTab] = useState<'character' | 'vehicle'>('character');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [page, setPage] = useState(0);

  const activeChar = getCharacterById(profile.selectedCharacterId);
  const activeAnimal = ANIMALS[activeChar.baseAnimal];
  const currentXp = profile.animalXp[activeChar.baseAnimal] || 0;
  const currentStage = getAnimalEvolutionStage(activeChar.baseAnimal, currentXp);
  const nextXp = getXpForNextStage(currentStage);

  const unlockedSet = useMemo(
    () => new Set(profile.unlockedCharacterIds || ['char_1', 'char_2', 'char_3']),
    [profile.unlockedCharacterIds]
  );

  const unlockedCount = useMemo(() => {
    let count = 0;
    for (const c of CHARACTER_ROSTER) {
      if (unlockedSet.has(c.id)) {
        count++;
      }
    }
    return count;
  }, [unlockedSet]);

  const filteredCharacters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return CHARACTER_ROSTER.filter((char) => {
      const isUnlocked = unlockedSet.has(char.id);
      if (filterMode === 'unlocked' && !isUnlocked) return false;
      if (filterMode === 'locked' && isUnlocked) return false;
      if (!q) return true;
      return (
        char.name.toLowerCase().includes(q) ||
        char.species.toLowerCase().includes(q) ||
        String(char.index).includes(q)
      );
    });
  }, [searchQuery, filterMode, unlockedSet]);

  const totalPages = Math.max(1, Math.ceil(filteredCharacters.length / CHARS_PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const pageCharacters = filteredCharacters.slice(
    safePage * CHARS_PER_PAGE,
    (safePage + 1) * CHARS_PER_PAGE
  );

  const handleCosmeticClick = (item: CosmeticItem) => {
    const owned = item.cost === 0 || profile.unlockedCosmetics.includes(item.id);
    if (!owned) {
      if (profile.coins >= item.cost) {
        onUnlockCosmetic(item);
      }
      return;
    }
    const next = { ...profile.customization };
    if (item.category === 'color') {
      next.bodyColor = item.value;
      next.accentColor = item.accent || '#FFFFFF';
    } else if (item.category === 'wheel') {
      next.wheelStyle = item.value as WheelStyle;
    } else if (item.category === 'hat') {
      next.hatStyle = item.value as HatStyle;
    } else if (item.category === 'trail') {
      next.trailStyle = item.value as TrailStyle;
    }
    onUpdateCustomization(next);
  };

  const isSelectedCosmetic = (item: CosmeticItem) => {
    const c = profile.customization;
    if (item.category === 'color') return c.bodyColor === item.value;
    if (item.category === 'wheel') return c.wheelStyle === item.value;
    if (item.category === 'hat') return c.hatStyle === item.value;
    return c.trailStyle === item.value;
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center md:justify-end p-0 sm:p-4 md:p-6 pointer-events-none">
      {/* Bottom-sheet on mobile, side-docked on tablet/laptop/desktop so the 3D live preview stays visible! */}
      <div className="pointer-events-auto flex max-h-[84dvh] md:max-h-[90dvh] w-full sm:max-w-[540px] md:w-[440px] lg:w-[490px] flex-col rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden safe-pb">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 sm:px-6 py-3.5 sm:py-4 gap-2">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">Garasi & {TOTAL_CHARACTERS} Avatar Lucu</h2>
            <p className="text-xs text-slate-500">
              Terbuka:{' '}
              <span className="font-bold text-emerald-600 font-mono-num">
                {unlockedCount}/{TOTAL_CHARACTERS}
              </span>
              <span className="mx-1.5">·</span>
              Koin:{' '}
              <span className="font-bold text-amber-600 font-mono-num">{profile.coins}</span>
            </p>
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

        {/* Live 3D Showcase Action Previewer */}
        <div className="border-b border-slate-100 bg-slate-50 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] sm:text-xs font-bold text-slate-600">Pratinjau Aksi 3D:</span>
          <div className="flex items-center gap-1 rounded-xl bg-white p-1 border border-slate-200">
            {(
              [
                { id: 'drive', label: 'Kendaraan', Icon: Car },
                { id: 'walk', label: 'Jalan', Icon: Footprints },
                { id: 'fly', label: 'Terbang', Icon: Feather },
              ] as const
            ).map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => onChangeShowcaseLocomotion(id)}
                className={`flex items-center gap-1 rounded-lg px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-bold transition-colors whitespace-nowrap ${
                  showcaseLocomotion === id
                    ? 'bg-amber-500 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Segmented Tabs */}
        <div className="px-4 sm:px-6 pt-3">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setTab('character')}
              className={`rounded-lg py-2 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
                tab === 'character' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              {TOTAL_CHARACTERS} Avatar Lucu & Evolusi
            </button>
            <button
              type="button"
              onClick={() => setTab('vehicle')}
              className={`rounded-lg py-2 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
                tab === 'vehicle' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Mobil & Motor
            </button>
          </div>
        </div>

        <div className="custom-scroll flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {tab === 'character' ? (
            <>
              {/* Active Character Evolution Summary */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm border-2 border-white"
                      style={{ backgroundColor: activeChar.primaryColor }}
                    >
                      #{activeChar.index}
                    </div>
                    <div className="min-w-0">
                      <div className="text-base font-bold text-slate-900 truncate">
                        {activeChar.name} · {activeAnimal.stages[currentStage - 1].title}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {activeChar.species} · Skill {activeAnimal.abilityName}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-sky-700 font-mono-num shrink-0">
                    {currentXp} / {nextXp} XP
                  </span>
                </div>

                <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-sky-500 transition-all"
                    style={{ width: `${Math.min(100, Math.round((currentXp / nextXp) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Search & Filter */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(0);
                    }}
                    placeholder="Cari nama, spesies (Kelinci, Panda, Unicorn...), atau nomor..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(
                      [
                        { id: 'all', label: `Semua (${TOTAL_CHARACTERS})` },
                        { id: 'unlocked', label: `Terbuka (${unlockedCount})` },
                        { id: 'locked', label: `Terkunci` },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          setFilterMode(f.id);
                          setPage(0);
                        }}
                        className={`rounded-lg px-2.5 py-1 text-[11px] sm:text-xs font-bold transition-colors whitespace-nowrap ${
                          filterMode === f.id
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Hal {safePage + 1}/{totalPages}
                  </span>
                </div>
              </div>

              {/* Paginated 500-Character Grid */}
              {pageCharacters.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 py-8 text-center text-xs text-slate-500">
                  Belum ada karakter yang cocok dengan pencarianmu.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {pageCharacters.map((char) => {
                    const isUnlocked = unlockedSet.has(char.id);
                    const selected = activeChar.id === char.id;
                    return (
                      <button
                        key={char.id}
                        type="button"
                        disabled={!isUnlocked}
                        onClick={() => onSelectCharacter(char)}
                        className={`relative rounded-2xl border-2 p-2.5 text-left transition-colors ${
                          selected
                            ? 'border-amber-500 bg-amber-50'
                            : isUnlocked
                            ? 'border-slate-200 bg-white hover:border-sky-300'
                            : 'border-slate-100 bg-slate-50/75 opacity-65 cursor-not-allowed'
                        }`}
                        title={
                          isUnlocked
                            ? `${char.name} (${char.species})`
                            : `Selesaikan level baru untuk membuka ${char.name}`
                        }
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div
                            className="h-7 w-7 rounded-full flex items-center justify-center text-white font-bold text-[11px] shrink-0"
                            style={{ backgroundColor: char.primaryColor }}
                          >
                            {char.name[0]}
                          </div>
                          {isUnlocked ? (
                            <span className="text-[10px] font-bold text-slate-400 font-mono-num">
                              #{char.index}
                            </span>
                          ) : (
                            <Lock className="h-3.5 w-3.5 text-slate-400" />
                          )}
                        </div>
                        <div className="mt-1.5 font-bold text-slate-900 text-xs truncate">
                          {char.name}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {char.species}
                        </div>
                        <div className="mt-0.5 text-[10px] font-medium text-sky-700 truncate">
                          {ACCESSORY_LABEL[char.accessory]}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Pagination Footer */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    disabled={safePage <= 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Sebelumnya</span>
                  </button>
                  <span className="text-xs font-bold text-slate-600 font-mono-num">
                    {safePage * CHARS_PER_PAGE + 1}–
                    {Math.min((safePage + 1) * CHARS_PER_PAGE, filteredCharacters.length)} dari{' '}
                    {filteredCharacters.length}
                  </span>
                  <button
                    type="button"
                    disabled={safePage >= totalPages - 1}
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <span>Berikutnya</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* 4 Evolution Stages Roadmap */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-800">
                  4 Tahap Evolusi ({activeAnimal.name})
                </h3>
                {activeAnimal.stages.map((st) => {
                  const unlocked = currentStage >= st.stage;
                  return (
                    <div
                      key={st.stage}
                      className={`flex items-center justify-between rounded-xl border px-3.5 py-2 text-xs ${
                        unlocked
                          ? 'border-emerald-200 bg-emerald-50 text-slate-800'
                          : 'border-slate-200 bg-white text-slate-400'
                      }`}
                    >
                      <div>
                        <div className="font-bold">
                          Tahap {st.stage}: {st.title}
                        </div>
                        <div>
                          {st.visualAccessory} · {st.abilityPowerLabel}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => soundEngine.playVictory(activeChar.baseAnimal, st.stage)}
                          className="rounded-lg bg-white p-1.5 text-sky-600 border border-slate-200 hover:bg-sky-50 transition-colors"
                          title={`Dengar suara kemenangan Tahap ${st.stage}`}
                          aria-label={`Dengar suara kemenangan Tahap ${st.stage}`}
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                        </button>
                        {unlocked ? (
                          <Sparkles className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Lock className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              {/* Vehicle Type: Mobil Lucu vs Motor Lucu */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-2">Pilih Kendaraan</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateCustomization({ ...profile.customization, vehicleType: 'car' })
                    }
                    className={`flex items-center justify-center gap-2 rounded-2xl border-2 py-3 font-bold text-sm transition-colors ${
                      profile.customization.vehicleType === 'car'
                        ? 'border-amber-500 bg-amber-50 text-amber-800'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Car className="h-5 w-5" />
                    Mobil Lucu
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateCustomization({ ...profile.customization, vehicleType: 'moto' })
                    }
                    className={`flex items-center justify-center gap-2 rounded-2xl border-2 py-3 font-bold text-sm transition-colors ${
                      profile.customization.vehicleType === 'moto'
                        ? 'border-amber-500 bg-amber-50 text-amber-800'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Bike className="h-5 w-5" />
                    Motor Lucu
                  </button>
                </div>
              </div>

              {/* Cosmetic Categories */}
              {(
                [
                  { cat: 'color', title: 'Warna Cat Bodi' },
                  { cat: 'wheel', title: 'Model Roda' },
                  { cat: 'hat', title: 'Aksesori Atap' },
                  { cat: 'trail', title: 'Efek Jejak Knalpot' },
                ] as const
              ).map(({ cat, title }) => (
                <div key={cat}>
                  <h3 className="text-sm font-bold text-slate-800 mb-2">{title}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {COSMETIC_CATALOG.filter((i) => i.category === cat).map((item) => {
                      const owned =
                        item.cost === 0 || profile.unlockedCosmetics.includes(item.id);
                      const selected = isSelectedCosmetic(item);
                      const canAfford = profile.coins >= item.cost;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleCosmeticClick(item)}
                          className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-xs transition-colors ${
                            selected
                              ? 'border-sky-600 bg-sky-50 font-bold text-sky-900'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {cat === 'color' && (
                              <span
                                className="h-4 w-4 rounded-full border border-slate-300 shrink-0"
                                style={{ backgroundColor: item.value }}
                              />
                            )}
                            <span className="truncate">{item.label}</span>
                          </div>
                          {selected ? (
                            <Check className="h-4 w-4 text-sky-600 shrink-0" />
                          ) : owned ? (
                            <span className="text-[11px] text-slate-400">Pakai</span>
                          ) : (
                            <span
                              className={`font-mono-num font-bold ${
                                canAfford ? 'text-amber-600' : 'text-slate-400'
                              }`}
                            >
                              {item.cost}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
