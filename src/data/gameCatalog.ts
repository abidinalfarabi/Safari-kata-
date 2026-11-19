import {
  AnimalDef,
  AnimalId,
  ArenaThemeConfig,
  AvatarAccessory,
  BiomeId,
  CharacterDef,
  CurvePattern,
  DailyRewardDef,
  HatStyle,
  HiddenVocabCache,
  LevelConfig,
  LevelCreatureItem,
  LevelCurveConfig,
  LevelMonster,
  LevelNpcRacer,
  LevelObstacle,
  LevelPickup,
  LevelVocabGate,
  LivingCreatureKind,
  MonsterKind,
  ObstacleKind,
  PlayerProfile,
  RoadSurfaceStyle,
  SpeciesShape,
  TrailStyle,
  VocabCategory,
  WheelStyle,
} from '../types/game';
import { CONVERSATION_SENTENCES, VOCAB_WORDS } from './vocabData';

export const MAX_LEVEL = 500;
export const TOTAL_CHARACTERS = 100;

export const ANIMALS: Record<AnimalId, AnimalDef> = {
  kiko: {
    id: 'kiko',
    name: 'Kiko',
    species: 'Rubah Ceria',
    primaryColor: '#F97316',
    secondaryColor: '#FFF7ED',
    abilityName: 'Magnet Kata',
    abilityDesc: 'Menarik koin & kartu kosa kata Arab-Inggris di sekitar jalur secara otomatis!',
    stages: [
      {
        stage: 1,
        minLevel: 1,
        title: 'Anak Rubah Imut',
        abilityPowerLabel: 'Magnet 4 detik',
        abilityDurationSec: 4,
        abilityCooldownSec: 11,
        visualAccessory: 'Dasar Menggemaskan',
      },
      {
        stage: 2,
        minLevel: 15,
        title: 'Rubah Syal Angin',
        abilityPowerLabel: 'Magnet 5.5 detik + Koin x1.5',
        abilityDurationSec: 5.5,
        abilityCooldownSec: 10,
        visualAccessory: 'Syal Petualang Biru',
      },
      {
        stage: 3,
        minLevel: 50,
        title: 'Rubah Sayap Emas',
        abilityPowerLabel: 'Magnet 7 detik + Sayap Kilat',
        abilityDurationSec: 7,
        abilityCooldownSec: 9,
        visualAccessory: 'Sayap Emas Kecil',
      },
      {
        stage: 4,
        minLevel: 110,
        title: 'Rubah Bintang Legendaris',
        abilityPowerLabel: 'Magnet 9 detik + Aura Kebal Mini',
        abilityDurationSec: 9,
        abilityCooldownSec: 8,
        visualAccessory: 'Mahkota Bintang & Sayap',
      },
    ],
  },
  bimo: {
    id: 'bimo',
    name: 'Bimo',
    species: 'Panda Gemoy',
    primaryColor: '#1E293B',
    secondaryColor: '#F8FAFC',
    abilityName: 'Perisai Bambu',
    abilityDesc: 'Melindungi avatar & mengubah rintangan menjadi bonus bintang!',
    stages: [
      {
        stage: 1,
        minLevel: 1,
        title: 'Bayi Panda Chibi',
        abilityPowerLabel: 'Perisai 4 detik',
        abilityDurationSec: 4,
        abilityCooldownSec: 12,
        visualAccessory: 'Pita Bambu Hijau',
      },
      {
        stage: 2,
        minLevel: 15,
        title: 'Panda Helm Ksatria',
        abilityPowerLabel: 'Perisai 5.5 detik',
        abilityDurationSec: 5.5,
        abilityCooldownSec: 10.5,
        visualAccessory: 'Helm Ksatria Cerah',
      },
      {
        stage: 3,
        minLevel: 50,
        title: 'Panda Jubah Bambu',
        abilityPowerLabel: 'Perisai 7 detik + Dorongan',
        abilityDurationSec: 7,
        abilityCooldownSec: 9.5,
        visualAccessory: 'Jubah Hijau Zamrud',
      },
      {
        stage: 4,
        minLevel: 110,
        title: 'Panda Raja Pelindung',
        abilityPowerLabel: 'Perisai 9 detik + Ledakan Poin',
        abilityDurationSec: 9,
        abilityCooldownSec: 8.5,
        visualAccessory: 'Mahkota Raja & Tameng Emas',
      },
    ],
  },
  lulu: {
    id: 'lulu',
    name: 'Lulu',
    species: 'Kelinci Manis',
    primaryColor: '#EC4899',
    secondaryColor: '#FDF2F8',
    abilityName: 'Lompatan Turbo',
    abilityDesc: 'Melompat super tinggi melewati rintangan ganda dengan dorongan cepat!',
    stages: [
      {
        stage: 1,
        minLevel: 1,
        title: 'Kelinci Mini',
        abilityPowerLabel: 'Turbo 3.5 detik',
        abilityDurationSec: 3.5,
        abilityCooldownSec: 10,
        visualAccessory: 'Pita Telinga Merah Muda',
      },
      {
        stage: 2,
        minLevel: 15,
        title: 'Kelinci Kacamata Pilot',
        abilityPowerLabel: 'Turbo 5 detik',
        abilityDurationSec: 5,
        abilityCooldownSec: 9,
        visualAccessory: 'Kacamata Lucu',
      },
      {
        stage: 3,
        minLevel: 50,
        title: 'Kelinci Roket Punggung',
        abilityPowerLabel: 'Turbo 6.5 detik + Lompat Ganda',
        abilityDurationSec: 6.5,
        abilityCooldownSec: 8,
        visualAccessory: 'Tas Roket Mini',
      },
      {
        stage: 4,
        minLevel: 110,
        title: 'Kelinci Kosmik',
        abilityPowerLabel: 'Turbo 8 detik + Melayang Halus',
        abilityDurationSec: 8,
        abilityCooldownSec: 7,
        visualAccessory: 'Lingkar Bintang Kosmik',
      },
    ],
  },
};

// Strictly 100 ultra-cute & adorable chibi avatars!
const CUTE_SPECIES_META: Array<{ shape: SpeciesShape; label: string; family: AnimalId }> = [
  { shape: 'rabbit', label: 'Kelinci Chibi', family: 'lulu' },
  { shape: 'cat', label: 'Kucing Manis', family: 'kiko' },
  { shape: 'panda', label: 'Panda Gemoy', family: 'bimo' },
  { shape: 'fox', label: 'Rubah Imut', family: 'kiko' },
  { shape: 'bear', label: 'Beruang Madu', family: 'bimo' },
  { shape: 'puppy', label: 'Anak Anjing Lucu', family: 'kiko' },
  { shape: 'penguin', label: 'Pinguin Mungil', family: 'bimo' },
  { shape: 'duckling', label: 'Bebek Ceria', family: 'lulu' },
  { shape: 'koala', label: 'Koala Menggemaskan', family: 'bimo' },
  { shape: 'hamster', label: 'Hamster Pipi Gembul', family: 'lulu' },
  { shape: 'unicorn', label: 'Unicorn Pelangi', family: 'lulu' },
  { shape: 'dragon', label: 'Naga Kecil Lucu', family: 'kiko' },
  { shape: 'deer', label: 'Rusa Bambi', family: 'kiko' },
  { shape: 'owl', label: 'Burung Hantu Imut', family: 'lulu' },
  { shape: 'frog', label: 'Katak Ceria', family: 'lulu' },
  { shape: 'lion', label: 'Singa Kecil Lucu', family: 'bimo' },
];

const CUTE_ACCESSORIES: AvatarAccessory[] = [
  'bow',
  'flower_crown',
  'star_clip',
  'round_glasses',
  'headphones',
  'scarf',
  'sprout',
  'beret',
  'mini_crown',
  'blush_halo',
];

const CUTE_PALETTES: Array<{ primary: string; secondary: string; accent: string; theme: string }> = [
  { primary: '#F472B6', secondary: '#FDF2F8', accent: '#EC4899', theme: 'Sakura' },
  { primary: '#FB923C', secondary: '#FFF7ED', accent: '#FACC15', theme: 'Jeruk' },
  { primary: '#38BDF8', secondary: '#F0F9FF', accent: '#0EA5E9', theme: 'Langit' },
  { primary: '#34D399', secondary: '#ECFDF5', accent: '#10B981', theme: 'Matcha' },
  { primary: '#A78BFA', secondary: '#F5F3FF', accent: '#8B5CF6', theme: 'Lavender' },
  { primary: '#FBBF24', secondary: '#FEFCE8', accent: '#F59E0B', theme: 'Madu' },
  { primary: '#FB7185', secondary: '#FFF1F2', accent: '#F43F5E', theme: 'Stroberi' },
  { primary: '#2DD4BF', secondary: '#F0FDFA', accent: '#14B8A6', theme: 'Mint' },
  { primary: '#C084FC', secondary: '#FAF5FF', accent: '#E879F9', theme: 'Tarot' },
  { primary: '#FDBA74', secondary: '#FFFBEB', accent: '#EA580C', theme: 'Karamel' },
  { primary: '#818CF8', secondary: '#EEF2FF', accent: '#6366F1', theme: 'Awan' },
  { primary: '#A3E635', secondary: '#F7FEE7', accent: '#65A30D', theme: 'Kiwi' },
];

const CUTE_AVATAR_NAMES = [
  'Kiko', 'Bimo', 'Lulu', 'Mochi', 'Boba', 'Pochi', 'Yuzu', 'Choco', 'Berry', 'Milo',
  'Cici', 'Marshmallow', 'Pudding', 'Caramel', 'Kiwi', 'Matcha', 'Peach', 'Butter', 'Daisy', 'Sunny',
  'Lala', 'Bibi', 'Momo', 'Nori', 'Zuzu', 'Coco', 'Popo', 'Tilly', 'Koko', 'Minty',
  'Ruby', 'Jelly', 'Waffle', 'Cotton', 'Honey', 'Clover', 'Snowy', 'Peony', 'Sugar', 'Biscuit',
  'Mimi', 'Toto', 'Nala', 'Hana', 'Sora', 'Piko', 'Rara', 'Fifi', 'Gigi', 'Dodo',
  'Cupcake', 'Muffin', 'Donut', 'Cookie', 'Brownie', 'Macaron', 'Truffle', 'Tiramisu', 'Vanilla', 'Cinnamon',
  'Pippin', 'Nutmeg', 'Acorn', 'Maple', 'Willow', 'Bramble', 'Pebble', 'Coral', 'Pearl', 'Bubbles',
  'Twinkle', 'Starry', 'Comet', 'Aurora', 'Nebula', 'Cloudy', 'Breeze', 'Dewdrop', 'Blossom', 'Tulip',
  'cherry', 'Mango', 'Lychee', 'Papaya', 'Melon', 'Berryl', 'Fluffy', 'Snuggle', 'Cuddle', 'Puff',
  'Skippy', 'Hoppy', 'Chirpy', 'Sparky', 'Sunnybell', 'Moonie', 'Pip', 'Lumi', 'Nini', 'Zayra',
];

export const CHARACTER_ROSTER: CharacterDef[] = Array.from({ length: TOTAL_CHARACTERS }, (_, idx) => {
  const num = idx + 1;
  if (num === 1) {
    return {
      id: 'char_1',
      index: 1,
      name: 'Kiko',
      species: 'Rubah Imut',
      baseAnimal: 'kiko',
      shape: 'fox',
      primaryColor: '#FB923C',
      secondaryColor: '#FFF7ED',
      accentColor: '#FACC15',
      accessory: 'scarf',
      unlockLevel: 0,
    };
  }
  if (num === 2) {
    return {
      id: 'char_2',
      index: 2,
      name: 'Bimo',
      species: 'Panda Gemoy',
      baseAnimal: 'bimo',
      shape: 'panda',
      primaryColor: '#F8FAFC',
      secondaryColor: '#E2E8F0',
      accentColor: '#1E293B',
      accessory: 'sprout',
      unlockLevel: 0,
    };
  }
  if (num === 3) {
    return {
      id: 'char_3',
      index: 3,
      name: 'Lulu',
      species: 'Kelinci Manis',
      baseAnimal: 'lulu',
      shape: 'rabbit',
      primaryColor: '#F472B6',
      secondaryColor: '#FDF2F8',
      accentColor: '#EC4899',
      accessory: 'bow',
      unlockLevel: 0,
    };
  }

  const sp = CUTE_SPECIES_META[(idx * 5 + Math.floor(idx / 16)) % CUTE_SPECIES_META.length];
  const pal = CUTE_PALETTES[(idx * 7 + Math.floor(idx / 12)) % CUTE_PALETTES.length];
  const acc = CUTE_ACCESSORIES[(idx * 3 + Math.floor(idx / 10)) % CUTE_ACCESSORIES.length];
  const rawName = CUTE_AVATAR_NAMES[idx] || `Chibi ${num}`;
  const cleanName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  return {
    id: `char_${num}`,
    index: num,
    name: num === 100 ? 'Zayra Pelangi' : cleanName,
    species: num === 100 ? 'Unicorn Raja Lucu' : `${sp.label} ${pal.theme}`,
    baseAnimal: num === 100 ? 'lulu' : sp.family,
    shape: num === 100 ? 'unicorn' : sp.shape,
    primaryColor: sp.shape === 'panda' ? '#F8FAFC' : pal.primary,
    secondaryColor: pal.secondary,
    accentColor: sp.shape === 'panda' ? pal.primary : pal.accent,
    accessory: num === 100 ? 'mini_crown' : acc,
    unlockLevel: num - 3, // char_4 unlocks at Lv 1 ... char_100 unlocks at Lv 97
  };
});

export function getCharacterById(characterId?: string): CharacterDef {
  if (!characterId) return CHARACTER_ROSTER[0];
  return CHARACTER_ROSTER.find((c) => c.id === characterId) || CHARACTER_ROSTER[0];
}

export function getNextUnlockableCharacter(
  unlockedIds: string[],
  completedLevel: number
): CharacterDef | null {
  const unlockedSet = new Set(unlockedIds);
  const preferredId = `char_${Math.min(TOTAL_CHARACTERS, completedLevel + 3)}`;
  const preferred = CHARACTER_ROSTER.find((c) => c.id === preferredId);
  if (preferred && !unlockedSet.has(preferred.id)) {
    return preferred;
  }
  return CHARACTER_ROSTER.find((c) => !unlockedSet.has(c.id)) || null;
}

export function getAnimalEvolutionStage(animalId: AnimalId, xp: number): 1 | 2 | 3 | 4 {
  void animalId;
  if (xp >= 900) return 4;
  if (xp >= 400) return 3;
  if (xp >= 140) return 2;
  return 1;
}

export function getXpForNextStage(stage: 1 | 2 | 3 | 4): number {
  if (stage === 1) return 140;
  if (stage === 2) return 400;
  if (stage === 3) return 900;
  return 900;
}

export interface CosmeticItem {
  id: string;
  category: 'color' | 'wheel' | 'hat' | 'trail';
  label: string;
  value: string;
  accent?: string;
  cost: number;
}

export const COSMETIC_CATALOG: CosmeticItem[] = [
  { id: 'color_sun', category: 'color', label: 'Kuning Mentari', value: '#F59E0B', accent: '#FEF3C7', cost: 0 },
  { id: 'color_sky', category: 'color', label: 'Biru Langit', value: '#0EA5E9', accent: '#E0F2FE', cost: 0 },
  { id: 'color_berry', category: 'color', label: 'Merah Stroberi', value: '#F43F5E', accent: '#FFE4E6', cost: 80 },
  { id: 'color_mint', category: 'color', label: 'Hijau Mint', value: '#10B981', accent: '#D1FAE5', cost: 100 },
  { id: 'color_grape', category: 'color', label: 'Ungu Anggur', value: '#8B5CF6', accent: '#EDE9FE', cost: 140 },
  { id: 'color_gold', category: 'color', label: 'Emas Juara', value: '#EAB308', accent: '#FEF9C3', cost: 250 },

  { id: 'wheel_classic', category: 'wheel', label: 'Roda Klasik', value: 'classic', cost: 0 },
  { id: 'wheel_star', category: 'wheel', label: 'Pelek Bintang', value: 'star', cost: 120 },
  { id: 'wheel_rainbow', category: 'wheel', label: 'Donat Pelangi', value: 'rainbow', cost: 180 },
  { id: 'wheel_monster', category: 'wheel', label: 'Roda Petualang', value: 'monster', cost: 220 },

  { id: 'hat_none', category: 'hat', label: 'Polos Rapi', value: 'none', cost: 0 },
  { id: 'hat_propeller', category: 'hat', label: 'Baling-Baling', value: 'propeller', cost: 90 },
  { id: 'hat_siren', category: 'hat', label: 'Lampu Bintang', value: 'siren', cost: 150 },
  { id: 'hat_wings', category: 'hat', label: 'Sayap Malaikat', value: 'wings', cost: 200 },
  { id: 'hat_crown', category: 'hat', label: 'Mahkota Raja', value: 'crown', cost: 300 },

  { id: 'trail_puff', category: 'trail', label: 'Awan Putih', value: 'puff', cost: 0 },
  { id: 'trail_bubble', category: 'trail', label: 'Gelembung', value: 'bubble', cost: 100 },
  { id: 'trail_rainbow', category: 'trail', label: 'Jejak Pelangi', value: 'rainbow', cost: 180 },
  { id: 'trail_flame', category: 'trail', label: 'Api Turbo', value: 'flame', cost: 240 },
];

export const DAILY_REWARDS: DailyRewardDef[] = [
  { day: 1, coins: 100, xpBonus: 40, label: '100 Koin + 40 XP' },
  { day: 2, coins: 150, xpBonus: 60, unlockItemId: 'color_berry', label: '150 Koin + Cat Stroberi' },
  { day: 3, coins: 200, xpBonus: 90, label: '200 Koin + 90 XP Evolusi' },
  { day: 4, coins: 260, xpBonus: 110, unlockItemId: 'wheel_star', label: '260 Koin + Pelek Bintang' },
  { day: 5, coins: 350, xpBonus: 140, unlockItemId: 'hat_propeller', label: '350 Koin + Baling-Baling' },
  { day: 6, coins: 500, xpBonus: 180, unlockItemId: 'trail_rainbow', label: '500 Koin + Jejak Pelangi' },
  { day: 7, coins: 800, xpBonus: 300, unlockItemId: 'hat_crown', label: '800 Koin + Mahkota Raja!' },
];

export const BIOME_CATALOG: Record<
  BiomeId,
  { id: BiomeId; name: string; skyHex: string; groundHex: string; roadHex: string; tagColor: string }
> = {
  pedesaan: {
    id: 'pedesaan',
    name: 'Lembah Sakura',
    skyHex: '#87CEFA',
    groundHex: '#4ADE80',
    roadHex: '#A16207',
    tagColor: '#16A34A',
  },
  hutan: {
    id: 'hutan',
    name: 'Rimba Zamrud',
    skyHex: '#7DD3FC',
    groundHex: '#15803D',
    roadHex: '#78350F',
    tagColor: '#15803D',
  },
  lumpur: {
    id: 'lumpur',
    name: 'Rawa Petualang',
    skyHex: '#BAE6FD',
    groundHex: '#65A30D',
    roadHex: '#713F12',
    tagColor: '#854D0E',
  },
  pasir_batu: {
    id: 'pasir_batu',
    name: 'Ngarai Salju & Batu',
    skyHex: '#D6E4F0',
    groundHex: '#D6D3D1',
    roadHex: '#78716C',
    tagColor: '#57534E',
  },
  gurun: {
    id: 'gurun',
    name: 'Gurun Oasis Emas',
    skyHex: '#FEF08A',
    groundHex: '#FBBF24',
    roadHex: '#D97706',
    tagColor: '#D97706',
  },
  perkampungan: {
    id: 'perkampungan',
    name: 'Desa Lentera Senja',
    skyHex: '#93C5FD',
    groundHex: '#86EFAC',
    roadHex: '#64748B',
    tagColor: '#0284C7',
  },
  kota_bukit: {
    id: 'kota_bukit',
    name: 'Puncak Kristal Kosmik',
    skyHex: '#A5B4FC',
    groundHex: '#6EE7B7',
    roadHex: '#334155',
    tagColor: '#4F46E5',
  },
};

const BIOME_ORDER: BiomeId[] = [
  'pedesaan',
  'hutan',
  'lumpur',
  'pasir_batu',
  'gurun',
  'perkampungan',
  'kota_bukit',
];

export function getBiomeForLevel(level: number) {
  const idx = (Math.max(1, Math.floor(level)) - 1) % BIOME_ORDER.length;
  return BIOME_CATALOG[BIOME_ORDER[idx]];
}

// ---------- Unique Per-Level Winding Track Curve Math ----------

const CURVE_PATTERNS: CurvePattern[] = [
  's_curve',
  'sweeping_arc',
  'serpentine',
  'chicane',
  'double_wave',
  'spiral_drift',
];

function buildCurveForLevel(level: number, length: number, rand: () => number): LevelCurveConfig {
  const pattern = CURVE_PATTERNS[(level - 1 + Math.floor(level / 7)) % CURVE_PATTERNS.length];
  const sign = level % 2 === 0 ? 1 : -1;
  const ampScale = 1 + Math.min(0.45, (level - 1) / 400);

  switch (pattern) {
    case 'sweeping_arc':
      return {
        pattern,
        amp1: sign * (22 + rand() * 14) * ampScale,
        freq1: Math.PI / Math.max(180, length),
        phase1: 0,
        amp2: -sign * (6 + rand() * 6),
        freq2: 0.015 + rand() * 0.01,
        phase2: rand() * Math.PI,
      };
    case 'serpentine':
      return {
        pattern,
        amp1: sign * (17 + rand() * 11) * ampScale,
        freq1: 0.016 + rand() * 0.01,
        phase1: rand() * Math.PI * 0.5,
        amp2: (6 + rand() * 5),
        freq2: 0.032 + rand() * 0.012,
        phase2: rand() * Math.PI,
      };
    case 'chicane':
      return {
        pattern,
        amp1: sign * (14 + rand() * 8) * ampScale,
        freq1: 0.024 + rand() * 0.012,
        phase1: 0.2 + rand() * 0.6,
        amp2: -sign * (10 + rand() * 6),
        freq2: 0.048 + rand() * 0.014,
        phase2: rand() * Math.PI,
      };
    case 'double_wave':
      return {
        pattern,
        amp1: sign * (19 + rand() * 10) * ampScale,
        freq1: 0.012 + rand() * 0.008,
        phase1: rand() * Math.PI,
        amp2: sign * (9 + rand() * 7),
        freq2: 0.028 + rand() * 0.01,
        phase2: 1.1 + rand() * 1.2,
      };
    case 'spiral_drift':
      return {
        pattern,
        amp1: sign * (24 + rand() * 12) * ampScale,
        freq1: 0.018 + rand() * 0.008,
        phase1: 0.4 + rand() * 0.8,
        amp2: -sign * (8 + rand() * 6),
        freq2: 0.038 + rand() * 0.01,
        phase2: 0.7,
      };
    case 's_curve':
    default:
      return {
        pattern: 's_curve',
        amp1: sign * (20 + rand() * 12) * ampScale,
        freq1: (Math.PI * 2) / Math.max(220, length),
        phase1: 0,
        amp2: (5 + rand() * 6),
        freq2: 0.022 + rand() * 0.008,
        phase2: rand() * Math.PI,
      };
  }
}

export function roadCenterAtZ(z: number, length: number, curve?: LevelCurveConfig): number {
  if (!curve || z <= 0 || z >= length) return 0;
  const clampedZ = Math.max(0, Math.min(length, z));
  const startBlend = Math.min(1, clampedZ / 26);
  const endBlend = Math.min(1, (length - clampedZ) / 26);
  // Smooth S-shaped Hermite ease near start and finish so start position z=0 is straight & centered
  const easeStart = startBlend * startBlend * (3 - 2 * startBlend);
  const easeEnd = endBlend * endBlend * (3 - 2 * endBlend);
  const edgeFade = Math.min(easeStart, easeEnd);

  let raw = 0;
  if (curve.pattern === 'sweeping_arc') {
    raw =
      Math.sin((clampedZ / length) * Math.PI) * curve.amp1 +
      Math.sin(clampedZ * curve.freq2 + curve.phase2) * curve.amp2;
  } else if (curve.pattern === 'spiral_drift') {
    const prog = clampedZ / length;
    raw =
      (0.35 + prog * 0.85) * Math.sin(clampedZ * curve.freq1 + curve.phase1) * curve.amp1 +
      Math.cos(clampedZ * curve.freq2 + curve.phase2) * curve.amp2;
  } else {
    raw =
      Math.sin(clampedZ * curve.freq1 + curve.phase1) * curve.amp1 +
      Math.sin(clampedZ * curve.freq2 + curve.phase2) * curve.amp2;
  }
  return raw * edgeFade;
}

export function roadTangentAngleAtZ(z: number, length: number, curve?: LevelCurveConfig): number {
  if (!curve) return 0;
  const dz = 1.0;
  const x1 = roadCenterAtZ(Math.max(0, z - dz * 0.5), length, curve);
  const x2 = roadCenterAtZ(Math.min(length, z + dz * 0.5), length, curve);
  return Math.atan2(-(x2 - x1), dz);
}

// Smooth wavy road elevation profile (0 near start and finish so arches sit level)
export function roadHeightAt(z: number, length: number, waveAmp: number, waveFreq: number): number {
  if (z <= 0 || z >= length) return 0;
  const edgeFade = Math.min(1, z / 22, (length - z) / 22);
  const primary = Math.sin(z * waveFreq) * waveAmp;
  const secondary = Math.sin(z * waveFreq * 0.43 + 1.2) * (waveAmp * 0.45);
  return (primary + secondary) * edgeFade;
}

// ---------- Unique Per-Level Arena & Environment Generator ----------

const ARENA_SKY_PALETTES = [
  { sky: '#7DD3FC', fog: '#BAE6FD', hemiSky: '#BAE6FD', hemiGround: '#86EFAC', key: '#FFFBEB', keyInt: 1.5, dense: 0.0048 },
  { sky: '#60A5FA', fog: '#BFDBFE', hemiSky: '#93C5FD', hemiGround: '#4ADE80', key: '#FEF9C3', keyInt: 1.42, dense: 0.0056 },
  { sky: '#6E9CB8', fog: '#7FA9C4', hemiSky: '#93C5FD', hemiGround: '#14532D', key: '#E0F2FE', keyInt: 1.02, dense: 0.0105 },
  { sky: '#D6E4F0', fog: '#E2E8F0', hemiSky: '#E0F2FE', hemiGround: '#94A3B8', key: '#F8FAFC', keyInt: 1.28, dense: 0.0088 },
  { sky: '#F3C677', fog: '#FDE68A', hemiSky: '#FDE68A', hemiGround: '#B45309', key: '#FEF08A', keyInt: 1.56, dense: 0.0115 },
  { sky: '#FDBA74', fog: '#FED7AA', hemiSky: '#FDE68A', hemiGround: '#86EFAC', key: '#FFEDD5', keyInt: 1.4, dense: 0.0062 },
  { sky: '#818CF8', fog: '#A5B4FC', hemiSky: '#C7D2FE', hemiGround: '#312E81', key: '#E0E7FF', keyInt: 1.22, dense: 0.0075 },
  { sky: '#F9A8D4', fog: '#FBCFE8', hemiSky: '#FCE7F3', hemiGround: '#4ADE80', key: '#FFF1F2', keyInt: 1.44, dense: 0.0052 },
  { sky: '#5EEAD4', fog: '#99F6E4', hemiSky: '#CCFBF1', hemiGround: '#0F766E', key: '#F0FDFA', keyInt: 1.38, dense: 0.0065 },
  { sky: '#334155', fog: '#475569', hemiSky: '#93C5FD', hemiGround: '#1E293B', key: '#E2E8F0', keyInt: 1.15, dense: 0.0082 },
  { sky: '#A7F3D0', fog: '#D1FAE5', hemiSky: '#A7F3D0', hemiGround: '#166534', key: '#ECFDF5', keyInt: 1.46, dense: 0.0054 },
  { sky: '#C084FC', fog: '#DDD6FE', hemiSky: '#E9D5FF', hemiGround: '#4C1D95', key: '#FAF5FF', keyInt: 1.32, dense: 0.007 },
];

const ARENA_GROUND_PALETTES = [
  { p: '#4ADE80', s: '#22C55E', prop: '#F472B6' },
  { p: '#15803D', s: '#166534', prop: '#4ADE80' },
  { p: '#65A30D', s: '#4D7C0F', prop: '#EAB308' },
  { p: '#FBBF24', s: '#D97706', prop: '#16A34A' },
  { p: '#E2E8F0', s: '#CBD5E1', prop: '#38BDF8' },
  { p: '#A7F3D0', s: '#34D399', prop: '#EC4899' },
  { p: '#FDE68A', s: '#F59E0B', prop: '#EF4444' },
  { p: '#93C5FD', s: '#60A5FA', prop: '#FACC15' },
  { p: '#D8B4FE', s: '#A855F7', prop: '#38BDF8' },
  { p: '#FCA5A5', s: '#F87171', prop: '#FDE047' },
  { p: '#78716C', s: '#57534E', prop: '#F59E0B' },
  { p: '#34D399', s: '#059669', prop: '#FEF08A' },
  { p: '#6EE7B7', s: '#10B981', prop: '#A855F7' },
];

const ROAD_SURFACE_CATALOG: Array<{
  style: RoadSurfaceStyle;
  base: string;
  curb: string;
  stripe: string;
  label: string;
}> = [
  { style: 'dirt_trail', base: '#A16207', curb: '#84CC16', stripe: '#FEF08A', label: 'Jalur Tanah Emas' },
  { style: 'forest_moss', base: '#5C3A21', curb: '#22C55E', stripe: '#D9F99D', label: 'Jalur Rimba Berlumut' },
  { style: 'cobble_stone', base: '#64748B', curb: '#F8FAFC', stripe: '#FACC15', label: 'Jalan Batu Klasik' },
  { style: 'golden_sand', base: '#D97706', curb: '#FEF3C7', stripe: '#FFFBEB', label: 'Lintasan Pasir Gurun' },
  { style: 'wooden_plank', base: '#92400E', curb: '#F59E0B', stripe: '#FEF3C7', label: 'Jembatan Papan Kayu' },
  { style: 'snow_frost', base: '#94A3B8', curb: '#FFFFFF', stripe: '#38BDF8', label: 'Jalur Es Pegunungan' },
  { style: 'rainbow_crystal', base: '#6366F1', curb: '#F472B6', stripe: '#FDE047', label: 'Jalan Kristal Pelangi' },
  { style: 'slate_asphalt', base: '#334155', curb: '#38BDF8', stripe: '#FACC15', label: 'Aspal Sirkuit Modern' },
  { style: 'cosmic_nebula', base: '#312E81', curb: '#C084FC', stripe: '#67E8F9', label: 'Lintasan Bintang Galaksi' },
];

const WEATHER_OPTIONS: Array<{
  kind: ArenaThemeConfig['weatherKind'];
  label: string;
  emoji: string;
}> = [
  { kind: 'petals', label: 'Cerah Berbunga', emoji: '🌸' },
  { kind: 'rain', label: 'Hujan Deras', emoji: '🌧️' },
  { kind: 'drizzle', label: 'Gerimis Sejuk', emoji: '🌦️' },
  { kind: 'snow', label: 'Salju Lembut', emoji: '❄️' },
  { kind: 'sandstorm', label: 'Angin Gurun', emoji: '🌪️' },
  { kind: 'fireflies', label: 'Kunang-kunang Senja', emoji: '✨' },
];

const PROP_ARCHETYPES: Array<{ id: ArenaThemeConfig['propArchetype']; title: string }> = [
  { id: 'sakura', title: 'Taman Sakura' },
  { id: 'pine', title: 'Lembah Pinus' },
  { id: 'palm', title: 'Oasis Palem' },
  { id: 'canyon', title: 'Ngarai Batu' },
  { id: 'village', title: 'Desa Warna-warni' },
  { id: 'crystal', title: 'Bukit Kristal' },
  { id: 'meadow', title: 'Padang Bunga' },
  { id: 'cosmos', title: 'Arena Kosmik' },
];

const CURVE_LABEL_MAP: Record<CurvePattern, string> = {
  s_curve: 'Tikungan S',
  sweeping_arc: 'Lengkung Luas',
  serpentine: 'Ular Berliku',
  chicane: 'Zigzag Tangkas',
  double_wave: 'Gelombang Ganda',
  spiral_drift: 'Spiral Petualang',
};

function shiftHexColor(hex: string, hueDegOffset: number, satDelta = 0, lightDelta = 0): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  h = (((h * 360 + hueDegOffset) % 360) + 360) % 360 / 360;
  s = Math.max(0.15, Math.min(0.95, s + satDelta));
  l = Math.max(0.18, Math.min(0.9, l + lightDelta));

  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  let nr = l;
  let ng = l;
  let nb = l;
  if (s !== 0) {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    nr = hue2rgb(p, q, h + 1 / 3);
    ng = hue2rgb(p, q, h);
    nb = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
  return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`;
}

export function getArenaThemeForLevel(level: number, curvePattern: CurvePattern): ArenaThemeConfig {
  const skyIdx = (level * 5) % ARENA_SKY_PALETTES.length;
  const groundIdx = (level * 7 + Math.floor(level / 12)) % ARENA_GROUND_PALETTES.length;
  const roadIdx = (level * 3 + Math.floor(level / 9)) % ROAD_SURFACE_CATALOG.length;
  const weatherIdx = (level * 11 + Math.floor(level / 6)) % WEATHER_OPTIONS.length;
  const archIdx = (level * 13 + Math.floor(level / 8)) % PROP_ARCHETYPES.length;

  const skyBase = ARENA_SKY_PALETTES[skyIdx];
  const groundBase = ARENA_GROUND_PALETTES[groundIdx];
  const roadBase = ROAD_SURFACE_CATALOG[roadIdx];
  const weather = WEATHER_OPTIONS[weatherIdx];
  const arch = PROP_ARCHETYPES[archIdx];

  // Deterministic unique hue tweak per level so even palettes never repeat identically
  const hueOffset = ((level * 29) % 44) - 22;

  return {
    arenaName: `${arch.title} · ${CURVE_LABEL_MAP[curvePattern]} #${level}`,
    skyColor: shiftHexColor(skyBase.sky, hueOffset),
    fogColor: shiftHexColor(skyBase.fog, hueOffset),
    fogDensity: skyBase.dense + ((level % 5) * 0.0005),
    groundPrimary: shiftHexColor(groundBase.p, hueOffset * 0.7),
    groundSecondary: shiftHexColor(groundBase.s, hueOffset * 0.7),
    roadStyle: roadBase.style,
    roadBaseColor: shiftHexColor(roadBase.base, hueOffset * 0.4),
    roadCurbColor: roadBase.curb,
    roadStripeColor: roadBase.stripe,
    weatherKind: weather.kind,
    weatherLabel: weather.label,
    weatherEmoji: weather.emoji,
    keyLightColor: skyBase.key,
    keyLightIntensity: skyBase.keyInt,
    hemiSkyColor: shiftHexColor(skyBase.hemiSky, hueOffset * 0.5),
    hemiGroundColor: shiftHexColor(skyBase.hemiGround, hueOffset * 0.5),
    accentPropColor: shiftHexColor(groundBase.prop, hueOffset),
    propArchetype: arch.id,
  };
}

// Deterministic PRNG per level so each of the 500 levels is reproducible and balanced
function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const CREATURE_WORD_MAP: Record<LivingCreatureKind, string> = {
  butterfly: 'butterfly',
  bird: 'bird',
  rabbit: 'rabbit',
  turtle: 'turtle',
  camel: 'camel',
  sheep: 'sheep',
  frog: 'frog',
  fish: 'fish',
};

const BIOME_CREATURES: Record<BiomeId, LivingCreatureKind[]> = {
  pedesaan: ['sheep', 'butterfly', 'bird', 'rabbit'],
  hutan: ['butterfly', 'bird', 'rabbit', 'turtle'],
  lumpur: ['frog', 'turtle', 'fish', 'bird'],
  pasir_batu: ['turtle', 'bird', 'rabbit', 'camel'],
  gurun: ['camel', 'bird', 'turtle'],
  perkampungan: ['bird', 'butterfly', 'sheep', 'rabbit'],
  kota_bukit: ['bird', 'butterfly', 'rabbit', 'fish'],
};

const BIOME_MONSTERS: Record<BiomeId, MonsterKind[]> = {
  pedesaan: ['slime', 'spiky'],
  hutan: ['spiky', 'slime'],
  lumpur: ['slime', 'golem'],
  pasir_batu: ['golem', 'spiky'],
  gurun: ['golem', 'slime'],
  perkampungan: ['bot', 'slime'],
  kota_bukit: ['bot', 'golem'],
};

const NPC_NAMES = ['Mochi', 'Boba', 'Sari', 'Rafi', 'Nadia', 'Omar', 'Dina', 'Faris', 'Laila', 'Cici'];
const NPC_COLORS = ['#0EA5E9', '#EC4899', '#10B981', '#8B5CF6', '#F43F5E', '#EAB308'];

export function getLevelConfig(levelInput: number): LevelConfig {
  const level = Math.max(1, Math.min(MAX_LEVEL, Math.floor(levelInput)));
  const biomeInfo = getBiomeForLevel(level);
  const rand = seededRandom(level * 9173 + 1337);
  const isSentenceMissionLevel = level > 200;

  // Gradual progression across 500 levels
  const progressRatio = (level - 1) / (MAX_LEVEL - 1);
  const baseSpeed = 16 + progressRatio * 20;
  const length = Math.round(540 + progressRatio * 740); // 540m -> 1280m curved safari tracks!
  const waveAmp = 0.85 + progressRatio * 1.85 + (level % 3) * 0.3;
  const waveFreq = 0.036 + ((level * 7) % 15) * 0.002;
  const curve = buildCurveForLevel(level, length, rand);
  const arenaTheme = getArenaThemeForLevel(level, curve.pattern);

  // Mission starts at 10 vocabulary words on Level 1 and grows each level!
  const missionWordCount = 10 + Math.min(20, level - 1); // Lv 1 = 10, Lv 2 = 11, Lv 3 = 12 ... Lv 21+ = 30
  const gateCount = Math.min(9, 3 + Math.floor(level / 55));

  // Every level draws a STRICTLY DISJOINT slice of 10 brand-new vocabulary words from the 5,000-word bank!
  const sliceStart = ((level - 1) * 10) % VOCAB_WORDS.length;
  const levelWords = VOCAB_WORDS.slice(sliceStart, sliceStart + 10);
  const featuredWords = [...levelWords];

  // Distractor pool excludes levelWords so options are clearly distinguishable
  const levelWordIds = new Set(levelWords.map((w) => w.id));
  const distractorPool = VOCAB_WORDS.filter((w) => !levelWordIds.has(w.id));

  // Generate vocabulary quiz gates placed along the curved track using levelWords
  const gates: LevelVocabGate[] = [];
  const gateZones: number[] = [];
  for (let g = 0; g < gateCount; g++) {
    const z = Math.round(92 + ((length - 145) / gateCount) * (g + 0.5));
    gateZones.push(z);
    const promptWord = levelWords[g % levelWords.length];
    const d1 = distractorPool[Math.floor(rand() * distractorPool.length)];
    let d2 = distractorPool[Math.floor(rand() * distractorPool.length)];
    if (d2.id === d1.id) {
      d2 = distractorPool[(Math.floor(rand() * (distractorPool.length - 1)) + 1) % distractorPool.length];
    }

    const lanes: (0 | 1 | 2)[] = [0, 1, 2];
    for (let i = lanes.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
    }

    gates.push({
      id: `gate_${level}_${g}`,
      z,
      promptWord,
      options: [
        { lane: lanes[0], word: promptWord, isCorrect: true },
        { lane: lanes[1], word: d1, isCorrect: false },
        { lane: lanes[2], word: d2, isCorrect: false },
      ],
    });
  }

  // Generate obstacles across the 3 curved road lanes
  const obstacles: LevelObstacle[] = [];
  const minGap = Math.max(15, 32 - progressRatio * 15);
  let cursorZ = 44;
  let obsIdx = 0;

  while (cursorZ < length - 38) {
    const nearGate = gateZones.some((gz) => Math.abs(cursorZ - gz) < 20);
    if (!nearGate) {
      const availableKinds: ObstacleKind[] = ['cone', 'crate'];
      if (level >= 8 || biomeInfo.id === 'pasir_batu') availableKinds.push('rock');
      if (level >= 25) availableKinds.push('jump_bar');
      if (level >= 55) availableKinds.push('mover');
      if (level >= 90) availableKinds.push('barrier_high');

      const primaryLane = Math.floor(rand() * 3) as 0 | 1 | 2;
      const kind = availableKinds[Math.floor(rand() * availableKinds.length)];

      obstacles.push({
        id: `obs_${level}_${obsIdx++}`,
        z: cursorZ,
        lane: primaryLane,
        kind,
        moveSpeed: kind === 'mover' ? 1.3 + progressRatio * 1.4 : undefined,
        movePhase: kind === 'mover' ? rand() * Math.PI * 2 : undefined,
      });

      const doubleChance = level < 18 ? 0 : Math.min(0.55, (level - 18) / 250);
      if (rand() < doubleChance && kind !== 'mover') {
        const otherLanes = ([0, 1, 2] as const).filter((l) => l !== primaryLane);
        const secondLane = otherLanes[Math.floor(rand() * otherLanes.length)];
        const secondKind: ObstacleKind = level >= 100 && rand() > 0.5 ? 'jump_bar' : 'cone';
        obstacles.push({
          id: `obs_${level}_${obsIdx++}`,
          z: cursorZ,
          lane: secondLane,
          kind: secondKind,
        });
      }
    }
    cursorZ += minGap * (0.85 + rand() * 0.45);
  }

  // Generate Hidden Vocabulary Caches (puzzles / sentences on Lv > 200)
  const hiddenCaches: HiddenVocabCache[] = [];
  const hiddenCacheCount = isSentenceMissionLevel
    ? Math.min(6, 4 + Math.floor((level - 200) / 120))
    : Math.min(5, 4 + Math.floor(level / 80)); // 4..6 interactive mystery caches
  const mysteryCardMissionCount = Math.max(1, missionWordCount - hiddenCacheCount);

  const hideStyles: HiddenVocabCache['hideStyle'][] = ['bush', 'chest', 'rock_pile', 'tent'];
  const puzzleTypes: HiddenVocabCache['puzzleType'][] = ['guess_pair', 'guess_meaning', 'fill_word'];

  for (let h = 0; h < hiddenCacheCount; h++) {
    const hz = Math.round(58 + ((length - 120) / hiddenCacheCount) * (h + 0.32 + rand() * 0.25));
    const side = h % 2 === 0 ? 1 : -1;
    const hx = side * (11.5 + rand() * 11.5);
    const word = levelWords[h % levelWords.length];
    const d1 = distractorPool[Math.floor(rand() * distractorPool.length)];
    let d2 = distractorPool[Math.floor(rand() * distractorPool.length)];
    if (d2.id === d1.id) {
      d2 = distractorPool[(Math.floor(rand() * (distractorPool.length - 1)) + 1) % distractorPool.length];
    }
    const sentenceMission = isSentenceMissionLevel
      ? CONVERSATION_SENTENCES[(level * 3 + h * 5) % CONVERSATION_SENTENCES.length]
      : undefined;

    hiddenCaches.push({
      id: `hid_${level}_${h}`,
      z: hz,
      x: hx,
      hideStyle: hideStyles[(level + h) % hideStyles.length],
      word,
      distractors: [d1, d2],
      puzzleType: puzzleTypes[(level + h) % puzzleTypes.length],
      sentenceMission,
    });
  }

  // Generate exact mission mystery word_card pickups using the remaining new level words!
  const ROAD_LANES = [-6.0, 0, 6.0];
  const EXPLORE_X = [-22.0, -16.5, -11.5, 11.5, 16.5, 22.0];
  const pickups: LevelPickup[] = [];
  let pIdx = 0;

  for (let m = 0; m < mysteryCardMissionCount; m++) {
    const pz = Math.round(28 + ((length - 70) / mysteryCardMissionCount) * (m + 0.35 + rand() * 0.2));
    const lane = (m + level) % 3 as 0 | 1 | 2;
    const isOffRoadExplore = m % 3 === 1;
    const xPos = isOffRoadExplore
      ? EXPLORE_X[(m + level) % EXPLORE_X.length]
      : ROAD_LANES[lane];
    const word = levelWords[(hiddenCacheCount + m) % levelWords.length];
    pickups.push({
      id: `pk_${level}_mission_${m}`,
      z: pz,
      y: 1.25,
      x: xPos,
      lane,
      offRoad: isOffRoadExplore,
      kind: 'word_card',
      word,
      countsTowardMission: true,
    });
  }

  // Coins, healing hearts & boost pads along the curved road & arena
  for (let pz = 22; pz < length - 24; pz += 14) {
    const nearGate = gateZones.some((gz) => Math.abs(pz - gz) < 11);
    if (nearGate) continue;

    const lane = Math.floor(rand() * 3) as 0 | 1 | 2;
    const isOffRoadExplore = rand() < 0.38;
    const xPos = isOffRoadExplore
      ? EXPLORE_X[Math.floor(rand() * EXPLORE_X.length)]
      : ROAD_LANES[lane];
    const roll = rand();

    if (roll < 0.14) {
      pickups.push({
        id: `pk_${level}_${pIdx++}`,
        z: pz,
        y: 1.05,
        x: xPos,
        lane,
        offRoad: isOffRoadExplore,
        kind: 'heart',
      });
    } else if (roll < 0.24 && !isOffRoadExplore && level >= 2) {
      pickups.push({
        id: `pk_${level}_${pIdx++}`,
        z: pz,
        y: 0.1,
        x: xPos,
        lane,
        kind: 'boost',
      });
    } else {
      const skyCoin = rand() < 0.24;
      const highJumpCoin = level >= 12 && !isOffRoadExplore && rand() < 0.2;
      pickups.push({
        id: `pk_${level}_${pIdx++}`,
        z: pz,
        y: skyCoin ? 4.6 : highJumpCoin ? 2.2 : 0.85,
        x: xPos,
        lane,
        offRoad: isOffRoadExplore,
        kind: 'coin',
      });
    }
  }

  // Living Creature Items along the curved meadow (each carries one of Level's new words too!)
  const creatures: LevelCreatureItem[] = [];
  const biomeCreatures = BIOME_CREATURES[biomeInfo.id];
  const creatureCount = 10 + Math.min(8, Math.floor(level / 25));
  for (let c = 0; c < creatureCount; c++) {
    const cz = 30 + ((length - 60) / creatureCount) * c + rand() * 10;
    const kind = biomeCreatures[c % biomeCreatures.length];
    const word = levelWords[c % levelWords.length] || VOCAB_WORDS.find((w) => w.id === CREATURE_WORD_MAP[kind]) || VOCAB_WORDS[0];
    const side = c % 2 === 0 ? -1 : 1;
    const cx = side * (11.0 + rand() * 13.5);
    creatures.push({
      id: `cr_${level}_${c}`,
      z: cz,
      x: cx,
      kind,
      word,
      roamRadius: 2.0 + rand() * 2.0,
      roamSpeed: 1.1 + rand() * 1.1,
      phase: rand() * Math.PI * 2,
    });
  }

  // Patrol Monsters along the curved track & off-road zones
  const monsters: LevelMonster[] = [];
  const biomeMonsters = BIOME_MONSTERS[biomeInfo.id];
  const monsterCount = 7 + Math.min(9, Math.floor(level / 20));
  for (let m = 0; m < monsterCount; m++) {
    const mz = 46 + ((length - 86) / monsterCount) * m + rand() * 12;
    const nearGate = gateZones.some((gz) => Math.abs(mz - gz) < 14);
    if (nearGate) continue;
    const isOffRoadGuard = m % 3 === 1;
    const side = m % 2 === 0 ? -1 : 1;
    const mx = isOffRoadGuard ? side * (14.0 + rand() * 8.5) : 0;
    monsters.push({
      id: `mon_${level}_${m}`,
      z: mz,
      x: mx,
      kind: biomeMonsters[m % biomeMonsters.length],
      patrolRange: isOffRoadGuard ? 3.8 + rand() * 2.0 : 5.8 + rand() * 1.8,
      patrolSpeed: 1.25 + progressRatio * 1.3 + rand() * 0.4,
      phase: rand() * Math.PI * 2,
    });
  }

  // Friendly AI NPC Explorers
  const npcs: LevelNpcRacer[] = [];
  const animalOptions: AnimalId[] = ['kiko', 'bimo', 'lulu'];
  for (let n = 0; n < 6; n++) {
    const isExplorer = n >= 3;
    const animalId = animalOptions[(level + n) % animalOptions.length];
    const stage = (1 + ((Math.floor(level / 40) + n) % 4)) as 1 | 2 | 3 | 4;
    npcs.push({
      id: `npc_${level}_${n}`,
      name: NPC_NAMES[(level + n) % NPC_NAMES.length],
      animalId,
      evolutionStage: stage,
      vehicleType: n % 2 === 0 ? 'car' : 'moto',
      bodyColor: NPC_COLORS[(level + n) % NPC_COLORS.length],
      startZ: 10 + n * 24 + rand() * 14,
      baseSpeed: baseSpeed * (isExplorer ? 0.78 + rand() * 0.22 : 0.88 + rand() * 0.24),
      laneOffsetX: isExplorer ? (n % 2 === 0 ? -16.5 : 16.5) : ROAD_LANES[n % 3],
      isExplorer,
      roamFreq: 0.65 + rand() * 0.65,
    });
  }

  return {
    level,
    biome: biomeInfo.id,
    biomeName: arenaTheme.arenaName,
    title: `Level ${level} · ${arenaTheme.arenaName}`,
    missionTitle: isSentenceMissionLevel
      ? `Misi ${missionWordCount} Kosa Kata Baru + Susun Kalimat Arab & Inggris!`
      : `Kumpulkan & pecahkan ${missionWordCount} Kosa Kata Baru di jalur berliku!`,
    missionWordCount,
    length,
    baseSpeed,
    waveAmp,
    waveFreq,
    curve,
    arenaTheme,
    maxMistakes: 5,
    targetWordsCount: missionWordCount,
    obstacles,
    gates,
    pickups,
    creatures,
    hiddenCaches,
    monsters,
    npcs,
    featuredWords,
  };
}

export function computeSequentialUnlockedLevel(
  completedLevels: Record<number, number> | undefined | null
): number {
  const map = completedLevels || {};
  let level = 1;
  while (level < MAX_LEVEL && (map[level] || 0) > 0) {
    level++;
  }
  return Math.min(MAX_LEVEL, Math.max(1, level));
}

export function isLevelUnlocked(
  level: number,
  completedLevels: Record<number, number> | undefined | null
): boolean {
  if (!Number.isInteger(level) || level < 1 || level > MAX_LEVEL) return false;
  if (level === 1) return true;
  return level <= computeSequentialUnlockedLevel(completedLevels);
}

export function createDefaultProfile(): PlayerProfile {
  const randomTag = Math.floor(100 + Math.random() * 900);
  return {
    playerId: `kid_${Date.now().toString(36)}_${randomTag}`,
    name: `Petualang ${randomTag}`,
    selectedAnimal: 'kiko',
    selectedCharacterId: 'char_1',
    unlockedCharacterIds: ['char_1', 'char_2', 'char_3'],
    animalXp: { kiko: 0, bimo: 0, lulu: 0 },
    coins: 150,
    highestUnlockedLevel: 1,
    completedLevels: {},
    collectedWordIds: ['cat', 'apple', 'sun'],
    unlockedCosmetics: [
      'color_sun',
      'color_sky',
      'wheel_classic',
      'hat_none',
      'trail_puff',
    ],
    customization: {
      vehicleType: 'car',
      bodyColor: '#F59E0B',
      accentColor: '#FEF3C7',
      wheelStyle: 'classic' as WheelStyle,
      hatStyle: 'none' as HatStyle,
      trailStyle: 'puff' as TrailStyle,
    },
    dailyStreak: 0,
    lastClaimDate: null,
    totalScore: 0,
    settings: {
      earlyChildhoodMode: true,
      autoDrive: false,
      touchButtonScale: 'large',
      speedPreset: 'gentle',
      soundEnabled: true,
      voicePronunciation: true,
    },
  };
}
