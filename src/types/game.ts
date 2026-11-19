export type AnimalId = 'kiko' | 'bimo' | 'lulu';

export type BiomeId =
  | 'pedesaan'
  | 'hutan'
  | 'lumpur'
  | 'pasir_batu'
  | 'gurun'
  | 'perkampungan'
  | 'kota_bukit';

export type VehicleType = 'car' | 'moto';
export type LocomotionMode = 'drive' | 'walk' | 'fly';
export type WheelStyle = 'classic' | 'star' | 'rainbow' | 'monster';
export type HatStyle = 'none' | 'propeller' | 'crown' | 'siren' | 'wings';
export type TrailStyle = 'puff' | 'flame' | 'bubble' | 'rainbow';
export type ControlSpeed = 'gentle' | 'normal' | 'fast';

export type CurvePattern =
  | 's_curve'
  | 'sweeping_arc'
  | 'serpentine'
  | 'chicane'
  | 'double_wave'
  | 'spiral_drift';

export type RoadSurfaceStyle =
  | 'dirt_trail'
  | 'forest_moss'
  | 'cobble_stone'
  | 'golden_sand'
  | 'wooden_plank'
  | 'snow_frost'
  | 'rainbow_crystal'
  | 'slate_asphalt'
  | 'cosmic_nebula';

export interface LevelCurveConfig {
  pattern: CurvePattern;
  amp1: number;
  freq1: number;
  phase1: number;
  amp2: number;
  freq2: number;
  phase2: number;
}

export interface ArenaThemeConfig {
  arenaName: string;
  skyColor: string;
  fogColor: string;
  fogDensity: number;
  groundPrimary: string;
  groundSecondary: string;
  roadStyle: RoadSurfaceStyle;
  roadBaseColor: string;
  roadCurbColor: string;
  roadStripeColor: string;
  weatherKind: 'petals' | 'rain' | 'drizzle' | 'snow' | 'sandstorm' | 'fireflies';
  weatherLabel: string;
  weatherEmoji: string;
  keyLightColor: string;
  keyLightIntensity: number;
  hemiSkyColor: string;
  hemiGroundColor: string;
  accentPropColor: string;
  propArchetype: 'meadow' | 'pine' | 'palm' | 'canyon' | 'village' | 'crystal' | 'sakura' | 'cosmos';
}

export type VocabCategory =
  | 'Pekerjaan'
  | 'Warna'
  | 'Ukuran'
  | 'Kata Kerja'
  | 'Kata Sifat'
  | 'Sekolah'
  | 'Rumah'
  | 'Masjid'
  | 'Kamar Mandi'
  | 'Daratan'
  | 'Lautan'
  | 'Alam Semesta'
  | 'Planet'
  | 'Hewan'
  | 'Buah & Sayur'
  | 'Kalimat'
  | 'Makanan'
  | 'Minuman'
  | 'Musim'
  | 'Keluarga'
  | 'Negara'
  | 'Kendaraan'
  | 'Angka';

export interface VocabWord {
  id: string;
  arabic: string;
  transliteration: string;
  english: string;
  indonesian: string;
  category: VocabCategory;
  emoji: string;
}

export interface SentenceMission {
  id: string;
  category: string;
  emoji: string;
  indonesian: string;
  englishSentence: string;
  englishWords: string[];
  arabicSentence: string;
  arabicWords: string[];
  arabicTranslit: string;
}

export interface EvolutionStageDef {
  stage: 1 | 2 | 3 | 4;
  minLevel: number;
  title: string;
  visualAccessory: string;
  abilityPowerLabel: string;
  abilityDurationSec: number;
  abilityCooldownSec: number;
}

export interface AnimalDef {
  id: AnimalId;
  name: string;
  species: string;
  primaryColor: string;
  secondaryColor: string;
  abilityName: string;
  abilityDesc: string;
  stages: EvolutionStageDef[];
}

export type SpeciesShape =
  | 'fox'
  | 'panda'
  | 'rabbit'
  | 'cat'
  | 'bear'
  | 'puppy'
  | 'lion'
  | 'owl'
  | 'dragon'
  | 'unicorn'
  | 'penguin'
  | 'duckling'
  | 'koala'
  | 'hamster'
  | 'frog'
  | 'deer';

export type AvatarAccessory =
  | 'bow'
  | 'flower_crown'
  | 'star_clip'
  | 'round_glasses'
  | 'headphones'
  | 'scarf'
  | 'sprout'
  | 'beret'
  | 'mini_crown'
  | 'blush_halo';

export interface CharacterDef {
  id: string;
  index: number;
  name: string;
  species: string;
  shape: SpeciesShape;
  baseAnimal: AnimalId;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  accessory: AvatarAccessory;
  unlockLevel: number;
}

export interface VehicleCustomization {
  vehicleType: VehicleType;
  bodyColor: string;
  accentColor: string;
  wheelStyle: WheelStyle;
  hatStyle: HatStyle;
  trailStyle: TrailStyle;
}

export interface GameSettings {
  autoDrive: boolean;
  earlyChildhoodMode: boolean;
  soundEnabled: boolean;
  voicePronunciation: boolean;
  speedPreset: ControlSpeed;
  touchButtonScale: 'normal' | 'large';
}

export interface PlayerProfile {
  playerId: string;
  name: string;
  coins: number;
  selectedAnimal: AnimalId;
  selectedCharacterId: string;
  unlockedCharacterIds: string[];
  animalXp: Record<AnimalId, number>;
  highestUnlockedLevel: number;
  completedLevels: Record<number, number>; // level -> stars (1..3)
  collectedWordIds: string[];
  unlockedCosmetics: string[];
  customization: VehicleCustomization;
  dailyStreak: number;
  lastClaimDate: string | null;
  totalScore: number;
  settings: GameSettings;
}

export type ObstacleKind =
  | 'cone'
  | 'crate'
  | 'rock'
  | 'jump_bar'
  | 'barrier_high'
  | 'mover';

export interface LevelObstacle {
  id: string;
  z: number;
  lane: 0 | 1 | 2;
  kind: ObstacleKind;
  moveSpeed?: number;
  movePhase?: number;
}

export interface LevelPickup {
  id: string;
  z: number;
  x: number; // lateral offset relative to roadCenterAtZ(z)
  y: number;
  lane: 0 | 1 | 2;
  offRoad?: boolean;
  kind: 'coin' | 'word_card' | 'boost' | 'heart';
  word?: VocabWord;
  countsTowardMission?: boolean;
}

export interface HiddenVocabCache {
  id: string;
  z: number;
  x: number; // lateral offset relative to roadCenterAtZ(z)
  hideStyle: 'bush' | 'chest' | 'rock_pile' | 'tent';
  puzzleType: 'guess_pair' | 'guess_meaning' | 'fill_word';
  word: VocabWord;
  distractors: VocabWord[];
  sentenceMission?: SentenceMission;
}

export interface LevelGateOption {
  lane: 0 | 1 | 2;
  word: VocabWord;
  isCorrect: boolean;
}

export interface LevelVocabGate {
  id: string;
  z: number;
  promptWord: VocabWord;
  options: [LevelGateOption, LevelGateOption, LevelGateOption];
}

export type LivingCreatureKind =
  | 'butterfly'
  | 'bird'
  | 'rabbit'
  | 'turtle'
  | 'camel'
  | 'sheep'
  | 'frog'
  | 'fish';

export interface LevelCreatureItem {
  id: string;
  kind: LivingCreatureKind;
  word: VocabWord;
  z: number;
  x: number; // lateral offset relative to roadCenterAtZ(z)
  roamRadius: number;
  roamSpeed: number;
  phase: number;
}

export type MonsterKind = 'slime' | 'spiky' | 'golem' | 'bot';

export interface LevelMonster {
  id: string;
  kind: MonsterKind;
  z: number;
  x: number; // lateral offset relative to roadCenterAtZ(z)
  patrolRange: number;
  patrolSpeed: number;
  phase: number;
}

export interface LevelNpcRacer {
  id: string;
  name: string;
  animalId: AnimalId;
  evolutionStage: 1 | 2 | 3 | 4;
  vehicleType: VehicleType;
  bodyColor: string;
  startZ: number;
  laneOffsetX: number; // lateral offset relative to roadCenterAtZ(z)
  baseSpeed: number;
  roamFreq: number;
  isExplorer: boolean;
}

export interface DailyRewardDef {
  day: number;
  coins: number;
  xpBonus: number;
  unlockItemId?: string;
  label: string;
}

export interface LevelConfig {
  level: number;
  biome: BiomeId;
  biomeName: string;
  title: string;
  missionTitle: string;
  missionWordCount: number;
  length: number;
  baseSpeed: number;
  waveAmp: number;
  waveFreq: number;
  curve: LevelCurveConfig;
  arenaTheme: ArenaThemeConfig;
  maxMistakes: number;
  targetWordsCount: number;
  obstacles: LevelObstacle[];
  pickups: LevelPickup[];
  hiddenCaches: HiddenVocabCache[];
  gates: LevelVocabGate[];
  creatures: LevelCreatureItem[];
  monsters: LevelMonster[];
  npcs: LevelNpcRacer[];
  featuredWords: VocabWord[];
}

export interface LeaderboardEntry {
  playerId: string;
  name: string;
  animalId: AnimalId;
  evolutionStage: 1 | 2 | 3 | 4;
  highestLevel: number;
  wordsCollected: number;
  totalScore: number;
  updatedAt: number;
}
