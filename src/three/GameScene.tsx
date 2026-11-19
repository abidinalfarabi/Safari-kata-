import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  AnimalId,
  ArenaThemeConfig,
  BiomeId,
  ControlSpeed,
  HiddenVocabCache,
  LevelConfig,
  LevelCreatureItem,
  LevelCurveConfig,
  LevelMonster,
  LevelNpcRacer,
  LevelVocabGate,
  LocomotionMode,
  SentenceMission,
  VehicleCustomization,
  VocabWord,
} from '../types/game';
import {
  ANIMALS,
  getCharacterById,
  roadCenterAtZ,
  roadHeightAt,
  roadTangentAngleAtZ,
} from '../data/gameCatalog';
import {
  buildArenaLandmarkFromTheme,
  buildHeartPickupMesh,
  buildHiddenCacheMesh,
  buildLivingCreatureMesh,
  buildMonsterMesh,
  buildObstacleMesh,
  buildSceneryProp,
  buildSceneryPropFromTheme,
  buildStandaloneCharacterRig,
  buildVehicleMesh,
  makeContactShadowTexture,
  makeFinishTexture,
  makeGroundTexture,
  makeNameplateTexture,
  makeRoadTexture,
  makeWordCardTexture,
  StandaloneCharacterRig,
} from './models';
import { soundEngine } from '../utils/audio';

export interface MissionNotification {
  id: number;
  title: string;
  message: string;
  tone: 'info' | 'progress' | 'complete' | 'warn';
}

export interface NearestHiddenCue {
  distanceM: number;
  directionText: string;
  clueEmoji: string;
  clueCategory: string;
}

export interface ActivePuzzleState {
  cacheId: string;
  word: VocabWord;
  distractors: VocabWord[];
  puzzleType: HiddenVocabCache['puzzleType'];
  sentenceMission?: SentenceMission;
}

export interface ActiveHudState {
  progressPct: number;
  score: number;
  coinsEarned: number;
  wordsCollected: VocabWord[];
  activeGatePrompt: VocabWord | null;
  abilityCooldownLeft: number;
  abilityActiveLeft: number;
  magnetCooldownLeft: number;
  magnetActiveLeft: number;
  shieldActive: boolean;
  magnetActive: boolean;
  turboActive: boolean;
  lives: number;
  maxLives: number;
  mistakes: number;
  speedKmh: number;
  monstersDefeated: number;
  missionTotal: number;
  missionSolved: number;
  nearestHiddenCue: NearestHiddenCue | null;
  missionNotification: MissionNotification | null;
  activePuzzle: ActivePuzzleState | null;
  nearFinishBlocked: boolean;
  feedbackText: string | null;
  feedbackTone: 'good' | 'warn';
  weatherLabel: string;
  weatherEmoji: string;
  locomotionMode: LocomotionMode;
}

export interface RaceControlInput {
  moveLane: (delta: -1 | 1) => void;
  setSteerDir: (dir: -1 | 0 | 1) => void;
  setJoystick: (x: number, y: number) => void;
  jump: () => void;
  triggerAbility: () => void;
  triggerMagnet: () => void;
  setGasPressed: (pressed: boolean) => void;
  setReversePressed: (pressed: boolean) => void;
  setLocomotionMode: (mode: LocomotionMode) => void;
  setFlyVertical: (dir: number) => void;
  spawnStarburst: () => void;
  resolvePuzzle: (cacheId: string, selectedWordId: string) => { correct: boolean; message: string };
  allowFinishBypass: () => void;
  dismissMissionNotif: () => void;
}

interface GameSceneProps {
  mode: 'showcase' | 'playing';
  animalId: AnimalId;
  characterId?: string;
  showcaseLocomotion?: LocomotionMode;
  evolutionStage: 1 | 2 | 3 | 4;
  customization: VehicleCustomization;
  levelConfig: LevelConfig | null;
  autoDrive: boolean;
  earlyChildhoodMode: boolean;
  speedPreset: ControlSpeed;
  isPaused: boolean;
  starburstTrigger?: number;
  controlRef: React.MutableRefObject<RaceControlInput | null>;
  onHudUpdate: (hud: ActiveHudState) => void;
  onLevelComplete: (summary: {
    score: number;
    coinsEarned: number;
    wordsCollected: VocabWord[];
    stars: 1 | 2 | 3;
    finishTimeMs: number;
  }) => void;
  onLevelFailed: (summary: {
    mistakes: number;
    maxMistakes: number;
    score: number;
    wordsCollected: VocabWord[];
  }) => void;
}

const LANE_X = [-6.0, 0, 6.0];
const EXPLORE_X = [-25.0, -19.0, -13.5, -6.0, 0, 6.0, 13.5, 19.0, 25.0];
const _vec3 = new THREE.Vector3();
const _weatherDummy = new THREE.Object3D();
const _weatherBaseSky = new THREE.Color();
const _weatherFlashSky = new THREE.Color('#E2E8F0');

export type WeatherKind = 'petals' | 'rain' | 'drizzle' | 'snow' | 'sandstorm' | 'fireflies';

interface WeatherProfile {
  kind: WeatherKind;
  label: string;
  emoji: string;
  skyColor: string;
  fogColor: string;
  fogDensity: number;
  keyColor: string;
  keyIntensity: number;
  hemiSkyColor: string;
  hemiGroundColor: string;
  hemiIntensity: number;
  particleColor: string;
  particleSize: number;
  particleOpacity: number;
  windX: number;
  windZ: number;
  fallSpeed: number;
  swirlAmp: number;
  streakOpacity: number;
  streakColor: string;
  lightningEnabled: boolean;
}

const BIOME_WEATHER_MAP: Record<BiomeId, WeatherProfile> = {
  pedesaan: {
    kind: 'petals',
    label: 'Cerah Berbunga',
    emoji: '🌸',
    skyColor: '#87CEFA',
    fogColor: '#BAE6FD',
    fogDensity: 0.0046,
    keyColor: '#FFFBEB',
    keyIntensity: 1.5,
    hemiSkyColor: '#BAE6FD',
    hemiGroundColor: '#86EFAC',
    hemiIntensity: 0.88,
    particleColor: '#FBCFE8',
    particleSize: 0.42,
    particleOpacity: 0.85,
    windX: 2.2,
    windZ: 1.4,
    fallSpeed: 1.55,
    swirlAmp: 1.9,
    streakOpacity: 0,
    streakColor: '#BAE6FD',
    lightningEnabled: false,
  },
  hutan: {
    kind: 'rain',
    label: 'Hujan Rimba',
    emoji: '🌧️',
    skyColor: '#6E9CB8',
    fogColor: '#6E9CB8',
    fogDensity: 0.011,
    keyColor: '#E0F2FE',
    keyIntensity: 0.96,
    hemiSkyColor: '#93C5FD',
    hemiGroundColor: '#14532D',
    hemiIntensity: 0.72,
    particleColor: '#BAE6FD',
    particleSize: 0.24,
    particleOpacity: 0.72,
    windX: -3.2,
    windZ: 3.8,
    fallSpeed: 21.0,
    swirlAmp: 0.5,
    streakOpacity: 0.46,
    streakColor: '#CFE8FF',
    lightningEnabled: true,
  },
  lumpur: {
    kind: 'drizzle',
    label: 'Gerimis Rawa',
    emoji: '🌦️',
    skyColor: '#94B0C2',
    fogColor: '#9FB5C4',
    fogDensity: 0.0125,
    keyColor: '#F1F5F9',
    keyIntensity: 1.05,
    hemiSkyColor: '#CBD5E1',
    hemiGroundColor: '#4D7C0F',
    hemiIntensity: 0.78,
    particleColor: '#E0F2FE',
    particleSize: 0.22,
    particleOpacity: 0.65,
    windX: -1.8,
    windZ: 2.4,
    fallSpeed: 14.5,
    swirlAmp: 0.65,
    streakOpacity: 0.3,
    streakColor: '#E2E8F0',
    lightningEnabled: false,
  },
  pasir_batu: {
    kind: 'snow',
    label: 'Salju Pegunungan',
    emoji: '❄️',
    skyColor: '#D6E4F0',
    fogColor: '#DCE8F5',
    fogDensity: 0.0095,
    keyColor: '#F8FAFC',
    keyIntensity: 1.25,
    hemiSkyColor: '#E0F2FE',
    hemiGroundColor: '#94A3B8',
    hemiIntensity: 0.92,
    particleColor: '#FFFFFF',
    particleSize: 0.48,
    particleOpacity: 0.92,
    windX: 2.8,
    windZ: 2.2,
    fallSpeed: 2.8,
    swirlAmp: 2.2,
    streakOpacity: 0,
    streakColor: '#FFFFFF',
    lightningEnabled: false,
  },
  gurun: {
    kind: 'sandstorm',
    label: 'Badai Pasir',
    emoji: '🌪️',
    skyColor: '#E8C170',
    fogColor: '#E9C477',
    fogDensity: 0.0145,
    keyColor: '#FEF08A',
    keyIntensity: 1.55,
    hemiSkyColor: '#FDE68A',
    hemiGroundColor: '#B45309',
    hemiIntensity: 0.85,
    particleColor: '#FDE68A',
    particleSize: 0.44,
    particleOpacity: 0.78,
    windX: -22.5,
    windZ: 10.5,
    fallSpeed: 1.4,
    swirlAmp: 3.4,
    streakOpacity: 0,
    streakColor: '#FDE68A',
    lightningEnabled: false,
  },
  perkampungan: {
    kind: 'fireflies',
    label: 'Senja Kunang-kunang',
    emoji: '✨',
    skyColor: '#7EA8D8',
    fogColor: '#9DBCE2',
    fogDensity: 0.0068,
    keyColor: '#FDE68A',
    keyIntensity: 1.28,
    hemiSkyColor: '#93C5FD',
    hemiGroundColor: '#4ADE80',
    hemiIntensity: 0.82,
    particleColor: '#FEF08A',
    particleSize: 0.46,
    particleOpacity: 0.9,
    windX: 1.2,
    windZ: 0.8,
    fallSpeed: -0.55,
    swirlAmp: 2.5,
    streakOpacity: 0,
    streakColor: '#FEF08A',
    lightningEnabled: false,
  },
  kota_bukit: {
    kind: 'snow',
    label: 'Salju Puncak Bukit',
    emoji: '🌨️',
    skyColor: '#CBD5E1',
    fogColor: '#D8E2EE',
    fogDensity: 0.0108,
    keyColor: '#F1F5F9',
    keyIntensity: 1.18,
    hemiSkyColor: '#E2E8F0',
    hemiGroundColor: '#64748B',
    hemiIntensity: 0.9,
    particleColor: '#F8FAFC',
    particleSize: 0.52,
    particleOpacity: 0.94,
    windX: -3.2,
    windZ: 2.6,
    fallSpeed: 3.2,
    swirlAmp: 2.4,
    streakOpacity: 0,
    streakColor: '#FFFFFF',
    lightningEnabled: false,
  },
};

const WEATHER_BY_KIND: Record<WeatherKind, WeatherProfile> = {
  petals: BIOME_WEATHER_MAP.pedesaan,
  rain: BIOME_WEATHER_MAP.hutan,
  drizzle: BIOME_WEATHER_MAP.lumpur,
  snow: BIOME_WEATHER_MAP.pasir_batu,
  sandstorm: BIOME_WEATHER_MAP.gurun,
  fireflies: BIOME_WEATHER_MAP.perkampungan,
};

function makeWeatherProfileFromArenaTheme(theme: ArenaThemeConfig): WeatherProfile {
  const base = WEATHER_BY_KIND[theme.weatherKind] || BIOME_WEATHER_MAP.pedesaan;
  return {
    ...base,
    label: theme.weatherLabel,
    emoji: theme.weatherEmoji,
    skyColor: theme.skyColor,
    fogColor: theme.fogColor,
    fogDensity: theme.fogDensity,
    keyColor: theme.keyLightColor,
    keyIntensity: theme.keyLightIntensity,
    hemiSkyColor: theme.hemiSkyColor,
    hemiGroundColor: theme.hemiGroundColor,
  };
}

function makeWeatherSpriteTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.45, 'rgba(255,255,255,0.85)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function wrapMod(val: number, span: number): number {
  const half = span * 0.5;
  return ((((val + half) % span) + span) % span) - half;
}

function terrainHeightAt(
  x: number,
  z: number,
  length: number,
  waveAmp: number,
  waveFreq: number,
  curve?: LevelCurveConfig
): number {
  const roadH = roadHeightAt(z, length, waveAmp, waveFreq);
  const roadCx = roadCenterAtZ(z, length, curve);
  const absX = Math.abs(x - roadCx);
  if (absX <= 10.2) return roadH;
  const offFactor = Math.min(1, (absX - 10.2) / 9.5);
  const hill =
    (Math.sin(x * 0.12 + z * 0.048) * 1.25 + Math.cos(z * 0.036 - x * 0.07) * 0.8) * offFactor;
  return roadH + hill;
}

export const GameScene: React.FC<GameSceneProps> = ({
  mode,
  animalId,
  characterId = 'char_1',
  showcaseLocomotion = 'drive',
  evolutionStage,
  customization,
  levelConfig,
  autoDrive,
  earlyChildhoodMode,
  speedPreset,
  isPaused,
  starburstTrigger = 0,
  controlRef,
  onHudUpdate,
  onLevelComplete,
  onLevelFailed,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const propsRef = useRef({
    mode,
    animalId,
    characterId,
    showcaseLocomotion,
    evolutionStage,
    customization,
    levelConfig,
    autoDrive,
    earlyChildhoodMode,
    speedPreset,
    isPaused,
    onHudUpdate,
    onLevelComplete,
    onLevelFailed,
  });
  propsRef.current = {
    mode,
    animalId,
    characterId,
    showcaseLocomotion,
    evolutionStage,
    customization,
    levelConfig,
    autoDrive,
    earlyChildhoodMode,
    speedPreset,
    isPaused,
    onHudUpdate,
    onLevelComplete,
    onLevelFailed,
  };

  const rebuildPlayerVehicleRef = useRef<() => void>(() => {});
  const rebuildTrackRef = useRef<() => void>(() => {});
  const spawnStarburstRef = useRef<() => void>(() => {});

  useEffect(() => {
    rebuildPlayerVehicleRef.current();
  }, [animalId, characterId, evolutionStage, customization]);

  useEffect(() => {
    rebuildTrackRef.current();
  }, [mode, levelConfig]);

  useEffect(() => {
    if (starburstTrigger > 0) {
      spawnStarburstRef.current();
    }
  }, [starburstTrigger]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const probe = document.createElement('canvas').getContext('webgl2');
      if (!probe) return true;
      const ext = probe.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
      const gpu = String(probe.getParameter(param));
      probe.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);

    const scene = new THREE.Scene();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(
      58,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      360
    );

    const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x86efac, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.45);
    keyLight.position.set(14, 24, 12);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 80;
    const d = 22;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);
    scene.add(keyLight.target);

    const rimLight = new THREE.DirectionalLight(0x7dd3fc, 0.55);
    rimLight.position.set(-10, 12, -16);
    scene.add(rimLight);

    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // Dynamic Biome Weather Particle System (Snow, Rain Streaks, Sandstorm, Petals, Fireflies)
    const WEATHER_SPAN_X = 64;
    const WEATHER_SPAN_Y = 24;
    const WEATHER_SPAN_Z = 58;
    const WEATHER_COUNT = 650;
    const RAIN_STREAK_COUNT = 220;

    const weatherPositions = new Float32Array(WEATHER_COUNT * 3);
    const weatherOffsets = new Float32Array(WEATHER_COUNT * 3);
    const weatherSpeeds = new Float32Array(WEATHER_COUNT);
    const weatherPhases = new Float32Array(WEATHER_COUNT);
    for (let i = 0; i < WEATHER_COUNT; i++) {
      weatherOffsets[i * 3] = (Math.random() - 0.5) * WEATHER_SPAN_X;
      weatherOffsets[i * 3 + 1] = (Math.random() - 0.5) * WEATHER_SPAN_Y;
      weatherOffsets[i * 3 + 2] = (Math.random() - 0.5) * WEATHER_SPAN_Z;
      weatherPositions[i * 3] = weatherOffsets[i * 3];
      weatherPositions[i * 3 + 1] = weatherOffsets[i * 3 + 1] + 10;
      weatherPositions[i * 3 + 2] = weatherOffsets[i * 3 + 2];
      weatherSpeeds[i] = 0.72 + Math.random() * 0.65;
      weatherPhases[i] = Math.random() * Math.PI * 2;
    }

    const weatherGeo = new THREE.BufferGeometry();
    const weatherPosAttr = new THREE.BufferAttribute(weatherPositions, 3);
    weatherGeo.setAttribute('position', weatherPosAttr);
    const weatherSpriteTex = makeWeatherSpriteTexture();
    const weatherMat = new THREE.PointsMaterial({
      color: '#FFFFFF',
      map: weatherSpriteTex,
      size: 0.42,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      fog: false,
    });
    const weatherPoints = new THREE.Points(weatherGeo, weatherMat);
    weatherPoints.frustumCulled = false;
    scene.add(weatherPoints);

    const rainStreakGeo = new THREE.CylinderGeometry(0.018, 0.018, 1.25, 5);
    const rainStreakMat = new THREE.MeshBasicMaterial({
      color: '#CFE8FF',
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const rainStreaks = new THREE.InstancedMesh(rainStreakGeo, rainStreakMat, RAIN_STREAK_COUNT);
    rainStreaks.frustumCulled = false;
    rainStreaks.visible = false;
    scene.add(rainStreaks);

    const rainOffsets = new Float32Array(RAIN_STREAK_COUNT * 3);
    const rainSpeeds = new Float32Array(RAIN_STREAK_COUNT);
    for (let i = 0; i < RAIN_STREAK_COUNT; i++) {
      rainOffsets[i * 3] = (Math.random() - 0.5) * WEATHER_SPAN_X;
      rainOffsets[i * 3 + 1] = (Math.random() - 0.5) * WEATHER_SPAN_Y;
      rainOffsets[i * 3 + 2] = (Math.random() - 0.5) * WEATHER_SPAN_Z;
      rainSpeeds[i] = 0.8 + Math.random() * 0.5;
    }

    const weatherRuntime = {
      profile: BIOME_WEATHER_MAP.pedesaan,
      driftX: 0,
      driftY: 0,
      driftZ: 0,
      rainDriftX: 0,
      rainDriftY: 0,
      rainDriftZ: 0,
      lightningPulse: 0,
      nextLightningAt: 7.5,
    };

    const playerWrapper = new THREE.Group();
    scene.add(playerWrapper);

    const shadowTex = makeContactShadowTexture();
    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 3.2),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.55,
      })
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.02;
    playerWrapper.add(contactShadow);

    const shieldSphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.85, 20, 16),
      new THREE.MeshStandardMaterial({
        color: '#22C55E',
        emissive: '#10B981',
        emissiveIntensity: 0.45,
        transparent: true,
        opacity: 0.28,
        roughness: 0.15,
      })
    );
    shieldSphere.position.y = 0.9;
    shieldSphere.visible = false;
    playerWrapper.add(shieldSphere);

    const magnetRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.7, 0.08, 10, 28),
      new THREE.MeshBasicMaterial({ color: '#F59E0B' })
    );
    magnetRing.rotation.x = Math.PI / 2;
    magnetRing.position.y = 0.35;
    magnetRing.visible = false;
    playerWrapper.add(magnetRing);

    let playerVehicleObj: {
      root: THREE.Group;
      wheels: THREE.Object3D[];
      propeller?: THREE.Object3D;
    } | null = null;
    let playerStandaloneObj: StandaloneCharacterRig | null = null;

    const rebuildPlayerVehicle = () => {
      if (playerVehicleObj) {
        playerWrapper.remove(playerVehicleObj.root);
      }
      if (playerStandaloneObj) {
        playerWrapper.remove(playerStandaloneObj.root);
      }
      const p = propsRef.current;
      const charDef = getCharacterById(p.characterId);
      playerVehicleObj = buildVehicleMesh(p.customization, p.animalId, p.evolutionStage, charDef);
      playerWrapper.add(playerVehicleObj.root);

      playerStandaloneObj = buildStandaloneCharacterRig(p.animalId, p.evolutionStage, charDef);
      playerStandaloneObj.root.visible = false;
      playerWrapper.add(playerStandaloneObj.root);
    };

    interface RuntimeObstacle {
      id: string;
      z: number;
      lane: 0 | 1 | 2;
      kind: string;
      moveSpeed: number;
      movePhase: number;
      hit: boolean;
      mesh: THREE.Group;
    }
    interface RuntimePickup {
      id: string;
      z: number;
      yOffset: number;
      x: number;
      kind: 'coin' | 'word_card' | 'boost' | 'heart';
      word?: VocabWord;
      countsTowardMission?: boolean;
      collected: boolean;
      mesh: THREE.Object3D;
    }
    interface RuntimeGate {
      gate: LevelVocabGate;
      resolved: boolean;
      group: THREE.Group;
    }
    interface RuntimeCreature {
      data: LevelCreatureItem;
      collected: boolean;
      group: THREE.Group;
      mesh: THREE.Group;
      ring: THREE.Mesh;
      prevX: number;
      prevZ: number;
    }
    interface RuntimeMonster {
      data: LevelMonster;
      x: number;
      z: number;
      stunLeft: number;
      mesh: THREE.Group;
    }
    interface RuntimeNpc {
      data: LevelNpcRacer;
      z: number;
      x: number;
      group: THREE.Group;
      vehicleRoot: THREE.Group;
      wheels: THREE.Object3D[];
    }
    interface RuntimeHiddenCache {
      data: HiddenVocabCache;
      solved: boolean;
      notifiedNear: boolean;
      group: THREE.Group;
      badge: THREE.Object3D | undefined;
      searchRing: THREE.Object3D | undefined;
    }

    let notifSeq = 1;

    const raceState = {
      z: 0,
      targetX: 0,
      steerDir: 0 as -1 | 0 | 1,
      joyX: 0,
      joyY: 0,
      keyJoyX: 0,
      keyJoyY: 0,
      yaw: Math.PI,
      vx: 0,
      vzForward: 0,
      x: 0,
      y: 0,
      vy: 0,
      speed: 0,
      gasPressed: false,
      reversePressed: false,
      score: 0,
      coinsEarned: 0,
      wordsCollected: [] as VocabWord[],
      mistakes: 0,
      maxMistakes: 5,
      monstersDefeated: 0,
      missionTotal: 10,
      missionSolved: 0,
      missionNotification: null as MissionNotification | null,
      missionNotifTimer: 0,
      activePuzzle: null as ActivePuzzleState | null,
      nearFinishBlocked: false,
      bypassFinishMission: false,
      abilityActiveLeft: 0,
      abilityCooldownLeft: 0,
      magnetActiveLeft: 0,
      magnetCooldownLeft: 0,
      boostLeft: 0,
      invulnLeft: 0,
      creatureZoomLeft: 0,
      creatureFocusX: 0,
      creatureFocusY: 0,
      creatureFocusZ: 0,
      hazardZoom: 0,
      hazardFocusX: 0,
      hazardFocusY: 0,
      hazardFocusZ: 0,
      camLookX: 0,
      camLookY: 1.45,
      camLookZ: -9,
      finished: false,
      startTimeMs: Date.now(),
      feedbackText: null as string | null,
      feedbackTimer: 0,
      feedbackTone: 'good' as 'good' | 'warn',
      lastHudEmit: 0,
      obstacles: [] as RuntimeObstacle[],
      pickups: [] as RuntimePickup[],
      gates: [] as RuntimeGate[],
      creatures: [] as RuntimeCreature[],
      hiddenCaches: [] as RuntimeHiddenCache[],
      monsters: [] as RuntimeMonster[],
      npcs: [] as RuntimeNpc[],
      roadTex: null as THREE.CanvasTexture | null,
      trackLength: 540,
      waveAmp: 1.0,
      waveFreq: 0.04,
      curve: undefined as LevelCurveConfig | undefined,
      locomotionMode: 'drive' as LocomotionMode,
      flyVertical: 0 as number,
      flyLandHoldTime: 0,
      targetFlyY: 4.4,
      walkPhase: 0,
    };

    const pushMissionNotif = (
      title: string,
      message: string,
      tone: MissionNotification['tone'],
      duration = 4.5
    ) => {
      raceState.missionNotification = {
        id: ++notifSeq,
        title,
        message,
        tone,
      };
      raceState.missionNotifTimer = duration;
    };

    const trailParticles: Array<{ mesh: THREE.Mesh; life: number; vx: number; vy: number }> = [];
    const trailGeo = new THREE.SphereGeometry(0.16, 8, 8);

    interface StarburstParticle {
      mesh: THREE.Mesh;
      vx: number;
      vy: number;
      vz: number;
      rx: number;
      ry: number;
      rz: number;
      life: number;
      maxLife: number;
      baseScale: number;
      gravity: number;
      drag: number;
      swirl: number;
      twinkleSpeed: number;
      twinklePhase: number;
      originX: number;
      originZ: number;
    }
    interface StarburstRing {
      mesh: THREE.Mesh;
      life: number;
      maxLife: number;
      startScale: number;
      endScale: number;
      spinZ: number;
    }
    interface StarburstBeam {
      mesh: THREE.Mesh;
      life: number;
      maxLife: number;
    }
    interface EvolutionWave {
      delayLeft: number;
      waveIndex: 1 | 2 | 3;
    }

    const starburstParticles: StarburstParticle[] = [];
    const starburstRings: StarburstRing[] = [];
    const starburstBeams: StarburstBeam[] = [];
    const evolutionWaves: EvolutionWave[] = [];
    let evolutionCelebrationLeft = 0;
    let lastEvolutionTriggerAt = -10;

    // 5-pointed 3D extruded star geometry for festive starbursts
    const starShape = new THREE.Shape();
    const outerStarR = 0.34;
    const innerStarR = 0.15;
    for (let sIdx = 0; sIdx < 10; sIdx++) {
      const angle = (sIdx / 10) * Math.PI * 2 - Math.PI / 2;
      const rad = sIdx % 2 === 0 ? outerStarR : innerStarR;
      const sx = Math.cos(angle) * rad;
      const sy = Math.sin(angle) * rad;
      if (sIdx === 0) starShape.moveTo(sx, sy);
      else starShape.lineTo(sx, sy);
    }
    starShape.closePath();
    const star5Geo = new THREE.ExtrudeGeometry(starShape, {
      depth: 0.08,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 1,
    });
    star5Geo.center();

    const starGeo = new THREE.OctahedronGeometry(0.27, 0);
    const confettiGeo = new THREE.BoxGeometry(0.32, 0.045, 0.16);
    const sparkOrbGeo = new THREE.SphereGeometry(0.14, 8, 8);
    const ringGeo = new THREE.TorusGeometry(1.0, 0.075, 10, 36);
    const beamGeo = new THREE.CylinderGeometry(0.9, 1.55, 7.2, 20, 1, true);

    const STARBURST_COLORS = [
      '#FACC15',
      '#FF5E7E',
      '#38BDF8',
      '#A855F7',
      '#22C55E',
      '#FB923C',
      '#F472B6',
      '#34D399',
    ];

    const spawnShockwaveRing = (
      origin: THREE.Vector3,
      color: string,
      endScale: number,
      maxLife: number,
      tiltX: number,
      tiltZ: number,
      yOffset = 0.7
    ) => {
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.92,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(ringGeo, mat);
      ring.position.set(origin.x, origin.y + yOffset, origin.z);
      ring.rotation.set(Math.PI / 2 + tiltX, 0, tiltZ);
      ring.scale.setScalar(0.35);
      scene.add(ring);
      starburstRings.push({
        mesh: ring,
        life: maxLife,
        maxLife,
        startScale: 0.35,
        endScale,
        spinZ: (Math.random() > 0.5 ? 1 : -1) * 2.4,
      });
    };

    const spawnEvolutionBeam = (origin: THREE.Vector3) => {
      const mat = new THREE.MeshBasicMaterial({
        color: '#FDE047',
        transparent: true,
        opacity: 0.42,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const beam = new THREE.Mesh(beamGeo, mat);
      beam.position.set(origin.x, origin.y + 3.4, origin.z);
      scene.add(beam);
      starburstBeams.push({
        mesh: beam,
        life: 1.55,
        maxLife: 1.55,
      });
    };

    const spawnFestiveParticles = (
      count: number,
      origin: THREE.Vector3,
      opts: {
        speedMin: number;
        speedMax: number;
        upwardBoost: number;
        yOffset: number;
        spreadRadius: number;
        gravity: number;
        drag: number;
        swirl: number;
        lifeMin: number;
        lifeMax: number;
        scaleMin: number;
        scaleMax: number;
        includeConfetti: boolean;
      }
    ) => {
      for (let i = 0; i < count; i++) {
        const color = STARBURST_COLORS[(i + Math.floor(Math.random() * 3)) % STARBURST_COLORS.length];
        const shapeRoll = Math.random();
        const geo = opts.includeConfetti
          ? shapeRoll < 0.42
            ? star5Geo
            : shapeRoll < 0.7
            ? confettiGeo
            : shapeRoll < 0.88
            ? starGeo
            : sparkOrbGeo
          : shapeRoll < 0.55
          ? star5Geo
          : starGeo;

        const mat = new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: geo === confettiGeo ? 0.65 : 1.05,
          roughness: 0.18,
          metalness: geo === confettiGeo ? 0.25 : 0.48,
          transparent: true,
          opacity: 1,
        });
        const mesh = new THREE.Mesh(geo, mat);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI * 0.78;
        const speed = opts.speedMin + Math.random() * (opts.speedMax - opts.speedMin);

        mesh.position.set(
          origin.x + (Math.random() - 0.5) * opts.spreadRadius,
          origin.y + opts.yOffset + (Math.random() - 0.5) * 0.65,
          origin.z + (Math.random() - 0.5) * opts.spreadRadius
        );
        const baseScale = opts.scaleMin + Math.random() * (opts.scaleMax - opts.scaleMin);
        mesh.scale.setScalar(baseScale);
        mesh.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
        scene.add(mesh);

        const maxLife = opts.lifeMin + Math.random() * (opts.lifeMax - opts.lifeMin);
        const isConfetti = geo === confettiGeo;
        starburstParticles.push({
          mesh,
          vx: Math.sin(phi) * Math.cos(theta) * speed,
          vy: Math.cos(phi) * speed + opts.upwardBoost,
          vz: Math.sin(phi) * Math.sin(theta) * speed,
          rx: (Math.random() - 0.5) * (isConfetti ? 14 : 9),
          ry: (Math.random() - 0.5) * (isConfetti ? 14 : 9),
          rz: (Math.random() - 0.5) * (isConfetti ? 12 : 7),
          life: maxLife,
          maxLife,
          baseScale,
          gravity: isConfetti ? opts.gravity * 0.52 : opts.gravity,
          drag: isConfetti ? opts.drag + 1.15 : opts.drag,
          swirl: opts.swirl,
          twinkleSpeed: 10 + Math.random() * 8,
          twinklePhase: Math.random() * Math.PI * 2,
          originX: origin.x,
          originZ: origin.z,
        });
      }
    };

    const triggerStarburst = (count = 36, origin?: THREE.Vector3) => {
      const center = origin || playerWrapper.position;
      spawnFestiveParticles(count, center, {
        speedMin: 4.5,
        speedMax: 10.5,
        upwardBoost: 4.0,
        yOffset: 1.0,
        spreadRadius: 0.8,
        gravity: 11.2,
        drag: 0.35,
        swirl: 0,
        lifeMin: 1.3,
        lifeMax: 2.0,
        scaleMin: 0.6,
        scaleMax: 1.15,
        includeConfetti: false,
      });
      if (count >= 28) {
        spawnShockwaveRing(center, '#FACC15', 3.4, 0.72, 0.15, 0.08, 0.8);
      }
    };

    const triggerEvolutionStarburst = (origin?: THREE.Vector3) => {
      const now = clock.getElapsedTime();
      if (now - lastEvolutionTriggerAt < 0.15) return;
      lastEvolutionTriggerAt = now;

      const center = origin || playerWrapper.position;
      evolutionCelebrationLeft = 2.8;
      evolutionWaves.length = 0;

      // Wave 0: Radiant evolution beam, twin crossing shockwave rings & grand starburst explosion
      spawnEvolutionBeam(center);
      spawnShockwaveRing(center, '#FACC15', 5.8, 0.95, 0.08, 0.0, 0.7);
      spawnShockwaveRing(center, '#F472B6', 4.9, 0.88, -0.48, 0.42, 1.25);
      spawnFestiveParticles(68, center, {
        speedMin: 5.5,
        speedMax: 13.5,
        upwardBoost: 5.8,
        yOffset: 1.1,
        spreadRadius: 1.1,
        gravity: 9.8,
        drag: 0.55,
        swirl: 1.4,
        lifeMin: 1.9,
        lifeMax: 2.8,
        scaleMin: 0.75,
        scaleMax: 1.45,
        includeConfetti: true,
      });

      // Staggered firework follow-up waves
      evolutionWaves.push(
        { delayLeft: 0.26, waveIndex: 1 },
        { delayLeft: 0.58, waveIndex: 2 },
        { delayLeft: 0.95, waveIndex: 3 }
      );
    };

    spawnStarburstRef.current = () => {
      triggerEvolutionStarburst();
    };

    const clearWorld = () => {
      while (worldGroup.children.length > 0) {
        worldGroup.remove(worldGroup.children[0]);
      }
      raceState.obstacles = [];
      raceState.pickups = [];
      raceState.gates = [];
      raceState.creatures = [];
      raceState.hiddenCaches = [];
      raceState.monsters = [];
      raceState.npcs = [];
    };

    const recordMistake = (reasonText: string) => {
      const p = propsRef.current;
      raceState.mistakes += 1;
      raceState.invulnLeft = 2.0; // Generous survival invulnerability so player doesn't die quickly
      soundEngine.playHit();

      if (raceState.mistakes >= raceState.maxMistakes && p.levelConfig) {
        raceState.finished = true;
        soundEngine.playLevelFail();
        p.onLevelFailed({
          mistakes: raceState.mistakes,
          maxMistakes: raceState.maxMistakes,
          score: raceState.score,
          wordsCollected: raceState.wordsCollected,
        });
      } else {
        const livesLeft = Math.max(0, raceState.maxMistakes - raceState.mistakes);
        raceState.feedbackText = `${reasonText} · Sisa ❤️ ${livesLeft}`;
        raceState.feedbackTone = 'warn';
        raceState.feedbackTimer = 1.5;
      }
    };

    const rebuildTrack = () => {
      clearWorld();
      const p = propsRef.current;

      weatherPoints.visible = true;
      const lvl = p.levelConfig;
      const biomeId = lvl ? lvl.biome : 'pedesaan';
      const wp = lvl ? makeWeatherProfileFromArenaTheme(lvl.arenaTheme) : BIOME_WEATHER_MAP[biomeId];
      weatherRuntime.profile = wp;
      weatherRuntime.lightningPulse = 0;
      weatherRuntime.nextLightningAt = 6 + ((lvl?.level ?? 1) % 6);

      _weatherBaseSky.set(wp.skyColor);
      scene.background = new THREE.Color(wp.skyColor);
      scene.fog = new THREE.FogExp2(
        wp.fogColor,
        p.mode === 'showcase' ? Math.max(0.012, wp.fogDensity) : wp.fogDensity
      );

      keyLight.color.set(wp.keyColor);
      keyLight.intensity = wp.keyIntensity;
      hemiLight.color.set(wp.hemiSkyColor);
      hemiLight.groundColor.set(wp.hemiGroundColor);
      hemiLight.intensity = wp.hemiIntensity;

      weatherMat.color.set(wp.particleColor);
      weatherMat.size = wp.particleSize;
      weatherMat.opacity = wp.particleOpacity;

      rainStreaks.visible = wp.streakOpacity > 0;
      rainStreakMat.color.set(wp.streakColor);
      rainStreakMat.opacity = wp.streakOpacity;

      const maxAniso = renderer.capabilities.getMaxAnisotropy();
      const roadTex = makeRoadTexture(lvl ? lvl.arenaTheme : biomeId, maxAniso);
      const groundTex = makeGroundTexture(lvl ? lvl.arenaTheme : biomeId, maxAniso);
      raceState.roadTex = roadTex;

      if (p.mode === 'showcase' || !lvl) {
        raceState.curve = undefined;
        groundTex.repeat.set(8, 8);
        const ground = new THREE.Mesh(
          new THREE.PlaneGeometry(140, 140),
          new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.9 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        worldGroup.add(ground);

        const pad = new THREE.Mesh(
          new THREE.CylinderGeometry(3.2, 3.5, 0.24, 32),
          new THREE.MeshStandardMaterial({ color: '#F8FAFC', roughness: 0.4, metalness: 0.1 })
        );
        pad.position.y = 0.12;
        pad.receiveShadow = true;
        worldGroup.add(pad);

        const padRing = new THREE.Mesh(
          new THREE.TorusGeometry(3.25, 0.08, 10, 40),
          new THREE.MeshStandardMaterial({ color: '#F59E0B', metalness: 0.6, roughness: 0.25 })
        );
        padRing.rotation.x = Math.PI / 2;
        padRing.position.y = 0.24;
        worldGroup.add(padRing);

        for (let i = 0; i < 16; i++) {
          const ang = (i / 16) * Math.PI * 2;
          const dist = 10 + (i % 3) * 4;
          const prop = buildSceneryProp(biomeId, (i * 0.37) % 1);
          prop.position.set(Math.cos(ang) * dist, 0, Math.sin(ang) * dist);
          prop.scale.setScalar(0.85 + (i % 3) * 0.18);
          worldGroup.add(prop);
        }

        playerWrapper.visible = true;
        playerWrapper.position.set(0, 0.24, 0);
        playerWrapper.rotation.set(0, 0, 0);
        if (playerVehicleObj) playerVehicleObj.root.rotation.set(0, 0, 0);
        shieldSphere.visible = false;
        magnetRing.visible = false;
        return;
      }

      // Active 360° Manual Wide Arena & Unique Winding Curved Track
      const len = lvl.length;
      raceState.trackLength = len;
      raceState.waveAmp = lvl.waveAmp;
      raceState.waveFreq = lvl.waveFreq;
      raceState.curve = lvl.curve;
      raceState.z = 0;
      raceState.targetX = 0;
      raceState.steerDir = 0;
      raceState.joyX = 0;
      raceState.joyY = 0;
      raceState.keyJoyX = 0;
      raceState.keyJoyY = 0;
      raceState.yaw = Math.PI;
      raceState.vx = 0;
      raceState.vzForward = p.autoDrive ? lvl.baseSpeed : 0;
      raceState.x = 0;
      raceState.y = 0;
      raceState.vy = 0;
      raceState.speed = p.autoDrive ? lvl.baseSpeed : 0;
      raceState.gasPressed = false;
      raceState.reversePressed = false;
      raceState.score = 0;
      raceState.coinsEarned = 0;
      raceState.wordsCollected = [];
      raceState.mistakes = 0;
      raceState.maxMistakes = lvl.maxMistakes;
      raceState.monstersDefeated = 0;
      raceState.missionTotal = lvl.missionWordCount;
      raceState.missionSolved = 0;
      raceState.activePuzzle = null;
      raceState.nearFinishBlocked = false;
      raceState.bypassFinishMission = false;
      raceState.abilityActiveLeft = 0;
      raceState.abilityCooldownLeft = 0;
      raceState.magnetActiveLeft = 0;
      raceState.magnetCooldownLeft = 0;
      raceState.boostLeft = 0;
      raceState.invulnLeft = 0;
      raceState.creatureZoomLeft = 0;
      raceState.creatureFocusX = 0;
      raceState.creatureFocusY = 0;
      raceState.creatureFocusZ = 0;
      raceState.hazardZoom = 0;
      raceState.hazardFocusX = 0;
      raceState.hazardFocusY = 0;
      raceState.hazardFocusZ = 0;
      raceState.camLookX = 0;
      raceState.camLookY = 1.45;
      raceState.camLookZ = -9;
      raceState.finished = false;
      raceState.startTimeMs = Date.now();
      raceState.feedbackText = null;
      raceState.feedbackTimer = 0;
      raceState.feedbackTone = 'good';
      raceState.locomotionMode = 'drive';
      raceState.flyVertical = 0;
      raceState.flyLandHoldTime = 0;
      raceState.targetFlyY = 4.4;
      raceState.walkPhase = 0;
      if (playerVehicleObj) playerVehicleObj.root.visible = true;
      if (playerStandaloneObj) playerStandaloneObj.root.visible = false;
      pushMissionNotif(
        `Misi Level ${lvl.level} · ${lvl.biomeName} (${wp.emoji} ${wp.label})`,
        lvl.level > 200
          ? `${lvl.missionTitle} Jelajahi lintasan berliku & susun kalimat Arab + Inggris!`
          : `${lvl.missionTitle} Ikuti tikungan berliku dengan Joystick 360° di sebelah kanan.`,
        'info',
        5.5
      );

      playerWrapper.visible = true;
      playerWrapper.position.set(0, 0, 0);
      playerWrapper.rotation.set(0, Math.PI, 0);
      if (playerVehicleObj) playerVehicleObj.root.rotation.set(0, 0, 0);

      // Wide Undulating & Curved Textured Arena Ground (380m wide!)
      const terrainOffsetZ = -(len / 2) + 30;
      groundTex.repeat.set(26, Math.round((len + 220) / 14));
      const terrainGeo = new THREE.PlaneGeometry(
        380,
        len + 220,
        72,
        Math.max(70, Math.ceil((len + 220) / 5))
      );
      terrainGeo.rotateX(-Math.PI / 2);
      const tPos = terrainGeo.attributes.position;
      for (let i = 0; i < tPos.count; i++) {
        const vx = tPos.getX(i);
        const vz = tPos.getZ(i);
        const trackZ = -(vz + terrainOffsetZ);
        const rcx = roadCenterAtZ(trackZ, len, lvl.curve);
        const h = terrainHeightAt(vx, trackZ, len, lvl.waveAmp, lvl.waveFreq, lvl.curve);
        const underRoadDip = Math.abs(vx - rcx) <= 10.2 ? -0.05 : 0;
        tPos.setY(i, h + underRoadDip);
      }
      tPos.needsUpdate = true;
      terrainGeo.computeVertexNormals();

      const terrain = new THREE.Mesh(
        terrainGeo,
        new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.94 })
      );
      terrain.position.set(0, 0, terrainOffsetZ);
      terrain.receiveShadow = true;
      worldGroup.add(terrain);

      // Wide 20m Winding Curved & Wavy Road Ribbon
      const roadOffsetZ = -(len / 2) + 15;
      roadTex.repeat.set(1, Math.round(len / 14));
      const roadGeo = new THREE.PlaneGeometry(
        20.0,
        len + 80,
        18,
        Math.max(90, Math.ceil((len + 80) / 2.2))
      );
      roadGeo.rotateX(-Math.PI / 2);
      const rPos = roadGeo.attributes.position;
      for (let i = 0; i < rPos.count; i++) {
        const vx0 = rPos.getX(i);
        const vz = rPos.getZ(i);
        const trackZ = -(vz + roadOffsetZ);
        const rcx = roadCenterAtZ(trackZ, len, lvl.curve);
        const ang = roadTangentAngleAtZ(trackZ, len, lvl.curve);
        rPos.setX(i, rcx + vx0 * Math.cos(ang));
        rPos.setZ(i, vz - vx0 * Math.sin(ang));
        rPos.setY(i, roadHeightAt(trackZ, len, lvl.waveAmp, lvl.waveFreq));
      }
      rPos.needsUpdate = true;
      roadGeo.computeVertexNormals();

      const road = new THREE.Mesh(
        roadGeo,
        new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.78 })
      );
      road.position.set(0, 0, roadOffsetZ);
      road.receiveShadow = true;
      worldGroup.add(road);

      // Unique Per-Level Themed Arena Landmarks hugging the curved off-road zone
      for (let az = 24; az < len - 12; az += 24) {
        const side = (az / 24) % 2 === 0 ? -1 : 1;
        const rcx = roadCenterAtZ(az, len, lvl.curve);
        const ax = rcx + side * (14.5 + ((az % 8) * 1.1));
        const ay = terrainHeightAt(ax, az, len, lvl.waveAmp, lvl.waveFreq, lvl.curve);
        const landmark = buildArenaLandmarkFromTheme(lvl.arenaTheme, ((az * 13) % 10) / 10);
        landmark.position.set(ax, ay - 0.02, -az);
        worldGroup.add(landmark);
      }

      // Outer Perimeter Arena Scenery framing the curved valley
      for (let sz = 10; sz < len + 30; sz += 14) {
        const rcx = roadCenterAtZ(sz, len, lvl.curve);
        [-1, 1].forEach((side) => {
          const sx = rcx + side * (31.0 + ((sz % 6) * 1.8));
          const sy = terrainHeightAt(sx, sz, len, lvl.waveAmp, lvl.waveFreq, lvl.curve);
          const prop = buildSceneryPropFromTheme(lvl.arenaTheme, ((sz * 17 + side * 5) % 10) / 10);
          prop.position.set(sx, sy - 0.05, -sz);
          prop.scale.setScalar(1.05 + ((sz % 7) * 0.1));
          worldGroup.add(prop);
        });
      }

      // Build Obstacles along curved lanes
      for (const obs of lvl.obstacles) {
        const mesh = buildObstacleMesh(obs.kind, biomeId);
        const rcx = roadCenterAtZ(obs.z, len, lvl.curve);
        const startX = rcx + LANE_X[obs.lane];
        const oy = roadHeightAt(obs.z, len, lvl.waveAmp, lvl.waveFreq);
        mesh.position.set(startX, oy, -obs.z);
        mesh.rotation.y = roadTangentAngleAtZ(obs.z, len, lvl.curve);
        worldGroup.add(mesh);
        raceState.obstacles.push({
          id: obs.id,
          z: obs.z,
          lane: obs.lane,
          kind: obs.kind,
          moveSpeed: obs.moveSpeed || 1.5,
          movePhase: obs.movePhase || 0,
          hit: false,
          mesh,
        });
      }

      // Build Pickups (Coins, Mission Word Cards, Boosts, and Healing Hearts!)
      const coinGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.12, 16);
      const coinMat = new THREE.MeshStandardMaterial({
        color: '#FACC15',
        metalness: 0.8,
        roughness: 0.2,
        emissive: '#CA8A04',
        emissiveIntensity: 0.2,
      });

      for (const pk of lvl.pickups) {
        const x = roadCenterAtZ(pk.z, len, lvl.curve) + pk.x;
        const groundY = terrainHeightAt(x, pk.z, len, lvl.waveAmp, lvl.waveFreq, lvl.curve);
        if (pk.kind === 'coin') {
          const coin = new THREE.Mesh(coinGeo, coinMat);
          coin.rotation.x = Math.PI / 2;
          coin.position.set(x, groundY + pk.y, -pk.z);
          worldGroup.add(coin);
          raceState.pickups.push({
            id: pk.id,
            z: pk.z,
            yOffset: pk.y,
            x,
            kind: 'coin',
            collected: false,
            mesh: coin,
          });
        } else if (pk.kind === 'heart') {
          const heart = buildHeartPickupMesh();
          heart.position.set(x, groundY + 1.05, -pk.z);
          worldGroup.add(heart);
          raceState.pickups.push({
            id: pk.id,
            z: pk.z,
            yOffset: 1.05,
            x,
            kind: 'heart',
            collected: false,
            mesh: heart,
          });
        } else if (pk.kind === 'boost') {
          const pad = new THREE.Mesh(
            new THREE.BoxGeometry(2.1, 0.08, 3.2),
            new THREE.MeshStandardMaterial({
              color: '#06B6D4',
              emissive: '#0EA5E9',
              emissiveIntensity: 0.7,
            })
          );
          pad.position.set(x, groundY + 0.04, -pk.z);
          pad.rotation.y = roadTangentAngleAtZ(pk.z, len, lvl.curve);
          worldGroup.add(pad);
          raceState.pickups.push({
            id: pk.id,
            z: pk.z,
            yOffset: 0.1,
            x,
            kind: 'boost',
            collected: false,
            mesh: pad,
          });
        } else if (pk.kind === 'word_card' && pk.word) {
          const tex = makeWordCardTexture(pk.word, false, true);
          const card = new THREE.Mesh(
            new THREE.BoxGeometry(1.9, 1.45, 0.14),
            new THREE.MeshStandardMaterial({ map: tex, roughness: 0.3 })
          );
          card.position.set(x, groundY + 1.25, -pk.z);
          worldGroup.add(card);
          raceState.pickups.push({
            id: pk.id,
            z: pk.z,
            yOffset: 1.25,
            x,
            kind: 'word_card',
            word: pk.word,
            countsTowardMission: Boolean(pk.countsTowardMission),
            collected: false,
            mesh: card,
          });
        }
      }

      // Build Hidden Vocabulary Caches tucked around the curved arena
      for (const hc of lvl.hiddenCaches) {
        const group = buildHiddenCacheMesh(hc.hideStyle, biomeId, hc.word.category);
        const hxWorld = roadCenterAtZ(hc.z, len, lvl.curve) + hc.x;
        const hy = terrainHeightAt(hxWorld, hc.z, len, lvl.waveAmp, lvl.waveFreq, lvl.curve);
        group.position.set(hxWorld, hy, -hc.z);
        worldGroup.add(group);
        raceState.hiddenCaches.push({
          data: hc,
          solved: false,
          notifiedNear: false,
          group,
          badge: group.getObjectByName('mysteryBadge'),
          searchRing: group.getObjectByName('searchRing'),
        });
      }

      // Build Living Creature Items
      const ringGeo = new THREE.TorusGeometry(0.85, 0.06, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: '#FACC15' });
      for (const cr of lvl.creatures) {
        const crGroup = new THREE.Group();
        const mesh = buildLivingCreatureMesh(cr.kind);
        crGroup.add(mesh);

        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.06;
        crGroup.add(ring);

        const cxWorld = roadCenterAtZ(cr.z, len, lvl.curve) + cr.x;
        const cy = terrainHeightAt(cxWorld, cr.z, len, lvl.waveAmp, lvl.waveFreq, lvl.curve);
        crGroup.position.set(cxWorld, cy, -cr.z);
        worldGroup.add(crGroup);

        raceState.creatures.push({
          data: cr,
          collected: false,
          group: crGroup,
          mesh,
          ring,
          prevX: cxWorld,
          prevZ: cr.z,
        });
      }

      // Build Patrol Monsters
      for (const mon of lvl.monsters) {
        const mesh = buildMonsterMesh(mon.kind, biomeId);
        const mxWorld = roadCenterAtZ(mon.z, len, lvl.curve) + mon.x;
        const my = terrainHeightAt(mxWorld, mon.z, len, lvl.waveAmp, lvl.waveFreq, lvl.curve);
        mesh.position.set(mxWorld, my, -mon.z);
        worldGroup.add(mesh);
        raceState.monsters.push({
          data: mon,
          x: mxWorld,
          z: mon.z,
          stunLeft: 0,
          mesh,
        });
      }

      // Build Lively AI NPC Explorers
      for (const npc of lvl.npcs) {
        const built = buildVehicleMesh(
          {
            vehicleType: npc.vehicleType,
            bodyColor: npc.bodyColor,
            accentColor: '#FFFFFF',
            wheelStyle: 'classic',
            hatStyle: npc.evolutionStage >= 3 ? 'crown' : 'none',
            trailStyle: 'puff',
          },
          npc.animalId,
          npc.evolutionStage
        );
        const npcGroup = new THREE.Group();
        built.root.rotation.y = Math.PI;
        npcGroup.add(built.root);

        const plateTex = makeNameplateTexture(npc.name, npc.bodyColor);
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({ map: plateTex, transparent: true })
        );
        sprite.position.set(0, 2.35, 0);
        sprite.scale.set(2.4, 0.68, 1);
        npcGroup.add(sprite);

        const nxWorld = roadCenterAtZ(npc.startZ, len, lvl.curve) + npc.laneOffsetX;
        const ny = terrainHeightAt(nxWorld, npc.startZ, len, lvl.waveAmp, lvl.waveFreq, lvl.curve);
        npcGroup.position.set(nxWorld, ny, -npc.startZ);
        npcGroup.rotation.y = roadTangentAngleAtZ(npc.startZ, len, lvl.curve);
        worldGroup.add(npcGroup);

        raceState.npcs.push({
          data: npc,
          z: npc.startZ,
          x: nxWorld,
          group: npcGroup,
          vehicleRoot: built.root,
          wheels: built.wheels,
        });
      }

      // Build Vocabulary Quiz Gates aligned perpendicular to the curved road!
      for (const gate of lvl.gates) {
        const gGroup = new THREE.Group();
        const rcx = roadCenterAtZ(gate.z, len, lvl.curve);
        const gy = roadHeightAt(gate.z, len, lvl.waveAmp, lvl.waveFreq);
        gGroup.position.set(rcx, gy, -gate.z);
        gGroup.rotation.y = roadTangentAngleAtZ(gate.z, len, lvl.curve);

        const pillarMat = new THREE.MeshStandardMaterial({
          color: '#F59E0B',
          roughness: 0.35,
          metalness: 0.2,
        });
        [-9.8, 9.8].forEach((px) => {
          const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 4.8, 12), pillarMat);
          pil.position.set(px, 2.4, 0);
          gGroup.add(pil);
        });
        const topBeam = new THREE.Mesh(new THREE.BoxGeometry(20.2, 0.48, 0.48), pillarMat);
        topBeam.position.set(0, 4.8, 0);
        gGroup.add(topBeam);

        for (const opt of gate.options) {
          const tex = makeWordCardTexture(opt.word, true);
          const panel = new THREE.Mesh(
            new THREE.BoxGeometry(3.8, 2.4, 0.16),
            new THREE.MeshStandardMaterial({ map: tex, roughness: 0.25 })
          );
          panel.position.set(LANE_X[opt.lane], 2.0, 0);
          gGroup.add(panel);
        }

        worldGroup.add(gGroup);
        raceState.gates.push({ gate, resolved: false, group: gGroup });
      }

      // Finish Line Arch spanning the 20m wide road
      const finishGroup = new THREE.Group();
      finishGroup.position.set(0, 0, -len);
      finishGroup.rotation.y = roadTangentAngleAtZ(len, len, lvl.curve);
      const finishTex = makeFinishTexture();
      const banner = new THREE.Mesh(
        new THREE.BoxGeometry(20.4, 1.8, 0.35),
        new THREE.MeshStandardMaterial({ map: finishTex, roughness: 0.4 })
      );
      banner.position.set(0, 4.8, 0);
      finishGroup.add(banner);
      [-10.0, 10.0].forEach((px) => {
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.32, 0.38, 5.6, 12),
          new THREE.MeshStandardMaterial({ color: '#FACC15', metalness: 0.5, roughness: 0.3 })
        );
        pole.position.set(px, 2.8, 0);
        finishGroup.add(pole);
      });
      const finishStrip = new THREE.Mesh(
        new THREE.PlaneGeometry(20.0, 2.4),
        new THREE.MeshBasicMaterial({ map: finishTex })
      );
      finishStrip.rotation.x = -Math.PI / 2;
      finishStrip.position.set(0, 0.03, 0);
      finishGroup.add(finishStrip);
      worldGroup.add(finishGroup);
    };

    rebuildPlayerVehicleRef.current = rebuildPlayerVehicle;
    rebuildTrackRef.current = rebuildTrack;

    rebuildPlayerVehicle();
    rebuildTrack();

    const moveLane = (delta: -1 | 1) => {
      if (propsRef.current.mode !== 'playing' || propsRef.current.isPaused || raceState.finished)
        return;
      let nearestIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < EXPLORE_X.length; i++) {
        const d = Math.abs(EXPLORE_X[i] - raceState.targetX);
        if (d < bestDist) {
          bestDist = d;
          nearestIdx = i;
        }
      }
      const nextIdx = Math.max(0, Math.min(EXPLORE_X.length - 1, nearestIdx + delta));
      if (nextIdx !== nearestIdx || Math.abs(EXPLORE_X[nextIdx] - raceState.targetX) > 0.1) {
        raceState.targetX = EXPLORE_X[nextIdx];
        soundEngine.playMove();
      }
    };

    const jump = () => {
      if (propsRef.current.mode !== 'playing' || propsRef.current.isPaused || raceState.finished)
        return;
      if (raceState.locomotionMode === 'fly') {
        raceState.targetFlyY = Math.min(10.5, raceState.targetFlyY + 1.4);
        soundEngine.playJump();
        return;
      }
      if (raceState.y <= 0.14) {
        const isLuluTurbo = propsRef.current.animalId === 'lulu' && raceState.abilityActiveLeft > 0;
        raceState.vy = isLuluTurbo ? 14.2 : 11.4;
        soundEngine.playJump();
      }
    };

    const setLocomotionMode = (nextMode: LocomotionMode) => {
      if (propsRef.current.mode !== 'playing' || raceState.finished) return;
      if (raceState.locomotionMode === nextMode) return;
      raceState.locomotionMode = nextMode;
      raceState.flyVertical = 0;
      raceState.flyLandHoldTime = 0;
      if (nextMode === 'fly') {
        raceState.targetFlyY = Math.max(4.4, raceState.y + 2.5);
        raceState.vy = Math.max(raceState.vy, 7.5);
        raceState.feedbackText = 'Mode Terbang Aktif! Terbang bebas di langit!';
        raceState.feedbackTone = 'good';
        raceState.feedbackTimer = 1.6;
        soundEngine.playAbility();
        triggerStarburst(20);
      } else if (nextMode === 'walk') {
        raceState.feedbackText = 'Mode Jalan Kaki Aktif!';
        raceState.feedbackTone = 'good';
        raceState.feedbackTimer = 1.4;
        soundEngine.playMove();
      } else {
        raceState.feedbackText = 'Mode Kendaraan Aktif!';
        raceState.feedbackTone = 'good';
        raceState.feedbackTimer = 1.4;
        soundEngine.playMove();
      }
      emitHudNow();
    };

    const triggerAbility = () => {
      const p = propsRef.current;
      if (p.mode !== 'playing' || p.isPaused || raceState.finished) return;
      if (raceState.abilityCooldownLeft > 0 || raceState.abilityActiveLeft > 0) return;

      const stageDef = ANIMALS[p.animalId].stages[p.evolutionStage - 1];
      raceState.abilityActiveLeft = stageDef.abilityDurationSec;
      raceState.abilityCooldownLeft = stageDef.abilityCooldownSec;
      raceState.feedbackText = `${ANIMALS[p.animalId].abilityName} Aktif!`;
      raceState.feedbackTone = 'good';
      raceState.feedbackTimer = 1.6;
      soundEngine.playAbility();
      emitHudNow();
    };

    const triggerMagnet = () => {
      const p = propsRef.current;
      if (p.mode !== 'playing' || p.isPaused || raceState.finished) return;
      if (raceState.magnetCooldownLeft > 0 || raceState.magnetActiveLeft > 0) return;

      raceState.magnetActiveLeft = 5.5;
      raceState.magnetCooldownLeft = 8.5;
      raceState.feedbackText = 'Magnet Koin & Kata Aktif!';
      raceState.feedbackTone = 'good';
      raceState.feedbackTimer = 1.6;
      soundEngine.playAbility();
      emitHudNow();
    };

    const emitHudNow = (activeGatePrompt: VocabWord | null = null) => {
      const p = propsRef.current;
      let nearestHiddenCue: NearestHiddenCue | null = null;
      let bestDist = Infinity;
      for (const hc of raceState.hiddenCaches) {
        if (hc.solved) continue;
        const hcWorldX = roadCenterAtZ(hc.data.z, raceState.trackLength, raceState.curve) + hc.data.x;
        const dx = hcWorldX - raceState.x;
        const dz = hc.data.z - raceState.z;
        const d = Math.hypot(dx, dz);
        if (d < bestDist) {
          bestDist = d;
          const fb = Math.abs(dz) < 6 ? '' : dz > 0 ? 'Depan' : 'Belakang';
          const lr = Math.abs(dx) < 3.5 ? '' : dx > 0 ? 'Kanan' : 'Kiri';
          const directionText = [fb, lr].filter(Boolean).join(' ') || 'Dekat Sekali!';
          nearestHiddenCue = {
            distanceM: Math.round(d),
            directionText,
            clueEmoji: hc.data.word.emoji,
            clueCategory: hc.data.word.category,
          };
        }
      }

      if (!nearestHiddenCue) {
        for (const pk of raceState.pickups) {
          if (pk.collected || !pk.countsTowardMission || !pk.word) continue;
          const dx = pk.x - raceState.x;
          const dz = pk.z - raceState.z;
          const d = Math.hypot(dx, dz);
          if (d < bestDist) {
            bestDist = d;
            const fb = Math.abs(dz) < 6 ? '' : dz > 0 ? 'Depan' : 'Belakang';
            const lr = Math.abs(dx) < 3.5 ? '' : dx > 0 ? 'Kanan' : 'Kiri';
            const directionText = [fb, lr].filter(Boolean).join(' ') || 'Dekat Sekali!';
            nearestHiddenCue = {
              distanceM: Math.round(d),
              directionText,
              clueEmoji: pk.word.emoji,
              clueCategory: pk.word.category,
            };
          }
        }
      }

      p.onHudUpdate({
        progressPct: Math.min(100, (raceState.z / raceState.trackLength) * 100),
        score: raceState.score,
        coinsEarned: raceState.coinsEarned,
        wordsCollected: [...raceState.wordsCollected],
        activeGatePrompt,
        abilityCooldownLeft: raceState.abilityCooldownLeft,
        abilityActiveLeft: raceState.abilityActiveLeft,
        magnetCooldownLeft: raceState.magnetCooldownLeft,
        magnetActiveLeft: raceState.magnetActiveLeft,
        shieldActive: shieldSphere.visible,
        magnetActive: magnetRing.visible,
        turboActive:
          raceState.boostLeft > 0 ||
          (p.animalId === 'lulu' && raceState.abilityActiveLeft > 0),
        lives: Math.max(0, raceState.maxMistakes - raceState.mistakes),
        maxLives: raceState.maxMistakes,
        mistakes: raceState.mistakes,
        speedKmh: Math.round(Math.abs(raceState.speed) * 3.2),
        monstersDefeated: raceState.monstersDefeated,
        missionTotal: raceState.missionTotal,
        missionSolved: raceState.missionSolved,
        nearestHiddenCue,
        missionNotification: raceState.missionNotification,
        activePuzzle: raceState.activePuzzle,
        nearFinishBlocked: raceState.nearFinishBlocked,
        feedbackText: raceState.feedbackText,
        feedbackTone: raceState.feedbackTone,
        weatherLabel: weatherRuntime.profile.label,
        weatherEmoji: weatherRuntime.profile.emoji,
        locomotionMode: raceState.locomotionMode,
      });
    };

    controlRef.current = {
      moveLane,
      setSteerDir: (dir: -1 | 0 | 1) => {
        raceState.steerDir = dir;
      },
      setJoystick: (x: number, y: number) => {
        raceState.joyX = THREE.MathUtils.clamp(x, -1, 1);
        raceState.joyY = THREE.MathUtils.clamp(y, -1, 1);
      },
      jump,
      triggerAbility,
      triggerMagnet,
      setGasPressed: (pressed: boolean) => {
        raceState.gasPressed = pressed;
      },
      setReversePressed: (pressed: boolean) => {
        raceState.reversePressed = pressed;
      },
      setLocomotionMode,
      setFlyVertical: (dir: number) => {
        raceState.flyVertical = THREE.MathUtils.clamp(dir, -1, 1);
      },
      spawnStarburst: () => {
        triggerEvolutionStarburst();
      },
      resolvePuzzle: (cacheId: string, selectedWordId: string) => {
        const target = raceState.hiddenCaches.find((hc) => hc.data.id === cacheId);
        if (!target || target.solved) {
          raceState.activePuzzle = null;
          emitHudNow();
          return { correct: true, message: 'Sudah terpecahkan!' };
        }

        const word = target.data.word;
        const sent = target.data.sentenceMission;
        if (selectedWordId === word.id) {
          target.solved = true;
          target.group.visible = false;
          raceState.activePuzzle = null;
          raceState.missionSolved += 1;
          raceState.score += sent ? 260 : 200;
          raceState.coinsEarned += sent ? 50 : 40;
          raceState.invulnLeft = Math.max(raceState.invulnLeft, 1.5);
          raceState.nearFinishBlocked = false;
          if (!raceState.wordsCollected.some((w) => w.id === word.id)) {
            raceState.wordsCollected.push(word);
          }

          soundEngine.playWordCorrect();
          if (sent) {
            soundEngine.speakWord(sent.englishSentence, sent.arabicSentence);
          } else {
            soundEngine.speakWord(word.english, word.arabic);
          }
          const hxWorld = roadCenterAtZ(target.data.z, raceState.trackLength, raceState.curve) + target.data.x;
          const hy = terrainHeightAt(
            hxWorld,
            target.data.z,
            raceState.trackLength,
            raceState.waveAmp,
            raceState.waveFreq,
            raceState.curve
          );
          triggerStarburst(sent ? 34 : 28, new THREE.Vector3(hxWorld, hy + 1.2, -target.data.z));

          if (raceState.missionSolved >= raceState.missionTotal) {
            pushMissionNotif(
              sent ? 'Misi Kalimat Tuntas!' : 'Misi Kosa Kata Tuntas!',
              sent
                ? `Semua ${raceState.missionTotal} misi kalimat & kosa kata tuntas! Menuju Garis Finis!`
                : `Semua ${raceState.missionTotal} kosa kata baru ditemukan! Menuju Garis Finis!`,
              'complete',
              5.5
            );
          } else {
            const left = raceState.missionTotal - raceState.missionSolved;
            pushMissionNotif(
              `Misi Maju (${raceState.missionSolved}/${raceState.missionTotal})`,
              sent
                ? `${sent.emoji} "${sent.englishSentence}" · "${sent.arabicSentence}" beres! Cari ${left} lagi.`
                : `${word.emoji} ${word.arabic} · ${word.english} terbuka! Cari ${left} lagi.`,
              'progress',
              4.5
            );
          }
          emitHudNow();
          return {
            correct: true,
            message: sent
              ? `Hebat! "${sent.englishSentence}" = "${sent.arabicSentence}"`
              : `Benar! ${word.arabic} = ${word.english} (${word.indonesian})`,
          };
        } else {
          recordMistake(
            sent ? 'Susunan kalimat belum tepat!' : 'Jawaban teka-teki kurang tepat!'
          );
          if (raceState.finished) {
            raceState.activePuzzle = null;
          }
          emitHudNow();
          return {
            correct: false,
            message: sent
              ? 'Urutan kata belum tepat! Cek kembali susunan kata yang benar.'
              : 'Kurang tepat! Coba pilih pasangan kata yang lain.',
          };
        }
      },
      allowFinishBypass: () => {
        raceState.bypassFinishMission = true;
        raceState.nearFinishBlocked = false;
        emitHudNow();
      },
      dismissMissionNotif: () => {
        raceState.missionNotification = null;
        raceState.missionNotifTimer = 0;
        emitHudNow();
      },
    };

    const heldKeys = new Set<string>();
    const syncKeyControls = () => {
      const left = heldKeys.has('ArrowLeft') || heldKeys.has('a') || heldKeys.has('A');
      const right = heldKeys.has('ArrowRight') || heldKeys.has('d') || heldKeys.has('D');
      const up = heldKeys.has('ArrowUp') || heldKeys.has('w') || heldKeys.has('W');
      const down = heldKeys.has('ArrowDown') || heldKeys.has('s') || heldKeys.has('S');

      const kx = (right ? 1 : 0) - (left ? 1 : 0);
      const ky = (up ? 1 : 0) - (down ? 1 : 0);
      const kMag = Math.hypot(kx, ky);
      if (kMag > 1) {
        raceState.keyJoyX = kx / kMag;
        raceState.keyJoyY = ky / kMag;
      } else {
        raceState.keyJoyX = kx;
        raceState.keyJoyY = ky;
      }

      raceState.steerDir = kx as -1 | 0 | 1;
      raceState.gasPressed = up;
      raceState.reversePressed = down;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      heldKeys.add(e.key);
      syncKeyControls();
      if (e.key === 'Shift' || e.key === 'c' || e.key === 'C') {
        raceState.flyVertical = -1;
      }
      if (e.repeat) return;
      if (e.key === ' ') {
        e.preventDefault();
        jump();
      } else if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') {
        triggerAbility();
      } else if (e.key === 'm' || e.key === 'M') {
        triggerMagnet();
      } else if (e.key === '1') {
        setLocomotionMode('drive');
      } else if (e.key === '2') {
        setLocomotionMode('walk');
      } else if (e.key === '3') {
        setLocomotionMode('fly');
      } else if (e.key === 'f' || e.key === 'F') {
        setLocomotionMode(raceState.locomotionMode === 'fly' ? 'walk' : 'fly');
      } else if (
        e.key === 'ArrowUp' ||
        e.key === 'ArrowDown' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight'
      ) {
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      heldKeys.delete(e.key);
      syncKeyControls();
      if (e.key === 'Shift' || e.key === 'c' || e.key === 'C') {
        raceState.flyVertical = 0;
      }
    };
    const onWindowBlur = () => {
      heldKeys.clear();
      syncKeyControls();
      raceState.flyVertical = 0;
      raceState.joyX = 0;
      raceState.joyY = 0;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onWindowBlur);

    const onResize = () => {
      if (!container) return;
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null;
    resizeObserver?.observe(container);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const spawnTrail = (
      x: number,
      y: number,
      z: number,
      style: VehicleCustomization['trailStyle'],
      customColor?: string
    ) => {
      if (trailParticles.length > 30) return;
      const color =
        customColor ||
        (style === 'flame'
          ? '#F97316'
          : style === 'bubble'
          ? '#38BDF8'
          : style === 'rainbow'
          ? ['#F43F5E', '#FACC15', '#22C55E', '#38BDF8', '#A855F7'][Math.floor(Math.random() * 5)]
          : '#F8FAFC');
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.75 });
      const m = new THREE.Mesh(trailGeo, mat);
      m.position.set(x + (Math.random() - 0.5) * 0.35, y + 0.35, z + 1.15);
      scene.add(m);
      trailParticles.push({
        mesh: m,
        life: 0.45,
        vx: (Math.random() - 0.5) * 0.7,
        vy: 0.8 + Math.random() * 0.6,
      });
    };

    const tick = () => {
      if (disposed) return;
      const dt = Math.min(0.05, clock.getDelta());
      const elapsed = clock.getElapsedTime();
      const p = propsRef.current;

      // Animate trail particles
      for (let i = trailParticles.length - 1; i >= 0; i--) {
        const tp = trailParticles[i];
        tp.life -= dt;
        tp.mesh.position.x += tp.vx * dt;
        tp.mesh.position.y += tp.vy * dt;
        const s = Math.max(0.01, tp.life / 0.45);
        tp.mesh.scale.setScalar(s);
        (tp.mesh.material as THREE.MeshBasicMaterial).opacity = s * 0.75;
        if (tp.life <= 0) {
          scene.remove(tp.mesh);
          (tp.mesh.material as THREE.MeshBasicMaterial).dispose();
          trailParticles.splice(i, 1);
        }
      }

      // Trigger staggered evolution firework waves
      if (evolutionCelebrationLeft > 0) {
        evolutionCelebrationLeft = Math.max(0, evolutionCelebrationLeft - dt);
      }
      for (let w = evolutionWaves.length - 1; w >= 0; w--) {
        const wave = evolutionWaves[w];
        wave.delayLeft -= dt;
        if (wave.delayLeft <= 0) {
          const origin = playerWrapper.position;
          if (wave.waveIndex === 1) {
            spawnShockwaveRing(origin, '#38BDF8', 5.2, 0.85, 0.35, -0.3, 1.9);
            spawnFestiveParticles(46, origin, {
              speedMin: 4.8,
              speedMax: 11.5,
              upwardBoost: 6.2,
              yOffset: 2.0,
              spreadRadius: 1.4,
              gravity: 9.2,
              drag: 0.65,
              swirl: -1.6,
              lifeMin: 1.7,
              lifeMax: 2.6,
              scaleMin: 0.7,
              scaleMax: 1.35,
              includeConfetti: true,
            });
          } else if (wave.waveIndex === 2) {
            spawnShockwaveRing(origin, '#A855F7', 6.0, 0.9, -0.22, 0.25, 1.3);
            spawnFestiveParticles(50, origin, {
              speedMin: 4.0,
              speedMax: 10.5,
              upwardBoost: 7.4,
              yOffset: 1.3,
              spreadRadius: 1.6,
              gravity: 8.6,
              drag: 0.75,
              swirl: 2.4,
              lifeMin: 1.9,
              lifeMax: 2.9,
              scaleMin: 0.75,
              scaleMax: 1.4,
              includeConfetti: true,
            });
          } else {
            spawnShockwaveRing(origin, '#22C55E', 6.4, 1.0, 0.05, 0.0, 2.4);
            spawnFestiveParticles(56, origin, {
              speedMin: 3.5,
              speedMax: 9.2,
              upwardBoost: 5.5,
              yOffset: 3.0,
              spreadRadius: 3.0,
              gravity: 7.2,
              drag: 1.05,
              swirl: -1.8,
              lifeMin: 2.1,
              lifeMax: 3.1,
              scaleMin: 0.8,
              scaleMax: 1.45,
              includeConfetti: true,
            });
          }
          evolutionWaves.splice(w, 1);
        }
      }

      // Animate 3D Starburst Particles (twinkle, spiral swirl, drag & confetti flutter)
      const dragSteps = dt * 60;
      for (let i = starburstParticles.length - 1; i >= 0; i--) {
        const sp = starburstParticles[i];
        sp.life -= dt;
        const damp = Math.exp(-sp.drag * dt);
        sp.vx *= damp;
        sp.vz *= damp;
        sp.vy = sp.vy * Math.exp(-sp.drag * 0.35 * dt) - sp.gravity * dt;

        if (sp.swirl !== 0) {
          const rx = sp.mesh.position.x - sp.originX;
          const rz = sp.mesh.position.z - sp.originZ;
          const swirlFactor = sp.swirl * dt * 0.45;
          sp.vx += -rz * swirlFactor;
          sp.vz += rx * swirlFactor;
        }

        sp.mesh.position.x += sp.vx * dt;
        sp.mesh.position.y += sp.vy * dt;
        sp.mesh.position.z += sp.vz * dt;
        sp.mesh.rotation.x += sp.rx * dt;
        sp.mesh.rotation.y += sp.ry * dt;
        sp.mesh.rotation.z += sp.rz * dt * (dragSteps > 0 ? 1 : 0);

        const ratio = Math.max(0.001, sp.life / sp.maxLife);
        const twinkle = 0.84 + 0.26 * Math.sin(elapsed * sp.twinkleSpeed + sp.twinklePhase);
        const popIn = ratio > 0.88 ? (1 - ratio) / 0.12 : 1;
        const fadeScale = Math.pow(ratio, 0.48) * (0.45 + 0.55 * popIn);
        sp.mesh.scale.setScalar(Math.max(0.01, sp.baseScale * fadeScale * twinkle));
        (sp.mesh.material as THREE.MeshStandardMaterial).opacity = Math.min(1, ratio * 1.65);

        if (sp.life <= 0) {
          scene.remove(sp.mesh);
          (sp.mesh.material as THREE.MeshStandardMaterial).dispose();
          starburstParticles.splice(i, 1);
        }
      }

      // Animate Expanding 3D Celebration Shockwave Rings
      for (let i = starburstRings.length - 1; i >= 0; i--) {
        const sr = starburstRings[i];
        sr.life -= dt;
        const t = THREE.MathUtils.clamp(1 - sr.life / sr.maxLife, 0, 1);
        const easeOut = 1 - Math.pow(1 - t, 3);
        const scale = THREE.MathUtils.lerp(sr.startScale, sr.endScale, easeOut);
        sr.mesh.scale.setScalar(scale);
        sr.mesh.rotation.z += sr.spinZ * dt;
        (sr.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1 - t) * 0.85);
        if (sr.life <= 0) {
          scene.remove(sr.mesh);
          (sr.mesh.material as THREE.MeshBasicMaterial).dispose();
          starburstRings.splice(i, 1);
        }
      }

      // Animate Ascending Evolution Light Beams
      for (let i = starburstBeams.length - 1; i >= 0; i--) {
        const sb = starburstBeams[i];
        sb.life -= dt;
        const t = THREE.MathUtils.clamp(1 - sb.life / sb.maxLife, 0, 1);
        sb.mesh.position.y += dt * 1.1;
        sb.mesh.rotation.y += dt * 1.8;
        const radialScale = 1 + t * 0.95;
        sb.mesh.scale.set(radialScale, 1 + t * 0.35, radialScale);
        const pulse = t < 0.2 ? t / 0.2 : 1 - (t - 0.2) / 0.8;
        (sb.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, pulse * 0.42);
        if (sb.life <= 0) {
          scene.remove(sb.mesh);
          (sb.mesh.material as THREE.MeshBasicMaterial).dispose();
          starburstBeams.splice(i, 1);
        }
      }

      // Animate Dynamic Biome Weather System (Snow, Rain Streaks, Sandstorm, Petals, Fireflies)
      {
        const wp = weatherRuntime.profile;
        const gustFactor = 0.82 + 0.35 * Math.sin(elapsed * 0.45);
        const weatherCenterX = p.mode === 'showcase' ? 0 : raceState.x;
        const weatherCenterY =
          p.mode === 'showcase'
            ? 8
            : terrainHeightAt(
                raceState.x,
                raceState.z,
                raceState.trackLength,
                raceState.waveAmp,
                raceState.waveFreq,
                raceState.curve
              ) + 9.5;
        const weatherCenterZ = p.mode === 'showcase' ? -4 : -raceState.z - 14;

        if (!p.isPaused) {
          weatherRuntime.driftX += wp.windX * gustFactor * dt;
          weatherRuntime.driftY -= wp.fallSpeed * dt;
          weatherRuntime.driftZ += wp.windZ * gustFactor * dt;
          weatherRuntime.rainDriftX += wp.windX * gustFactor * dt;
          weatherRuntime.rainDriftY -= wp.fallSpeed * dt;
          weatherRuntime.rainDriftZ += wp.windZ * gustFactor * dt;

          // Occasional distant lightning shimmer during rain
          if (wp.lightningEnabled && p.mode === 'playing') {
            if (elapsed >= weatherRuntime.nextLightningAt) {
              weatherRuntime.lightningPulse = 1.0;
              weatherRuntime.nextLightningAt = elapsed + 8.5 + (Math.sin(elapsed * 3.1) + 1) * 3.0;
            }
            if (weatherRuntime.lightningPulse > 0) {
              weatherRuntime.lightningPulse = Math.max(0, weatherRuntime.lightningPulse - dt * 5.2);
            }
          } else {
            weatherRuntime.lightningPulse = 0;
          }
        }

        if (scene.fog instanceof THREE.FogExp2) {
          const baseFog = p.mode === 'showcase' ? Math.max(0.012, wp.fogDensity) : wp.fogDensity;
          scene.fog.density = baseFog * (0.92 + 0.16 * Math.sin(elapsed * 0.36));
        }

        if (wp.lightningEnabled) {
          const lp = weatherRuntime.lightningPulse;
          hemiLight.intensity = wp.hemiIntensity + lp * 1.15;
          if (scene.background instanceof THREE.Color) {
            scene.background.copy(_weatherBaseSky).lerp(_weatherFlashSky, lp * 0.55);
          }
        }

        const posArr = weatherPosAttr.array as Float32Array;
        for (let i = 0; i < WEATHER_COUNT; i++) {
          const spd = weatherSpeeds[i];
          const ph = weatherPhases[i];
          const swirlX = Math.sin(elapsed * 1.6 + ph) * wp.swirlAmp;
          const swirlY =
            wp.kind === 'fireflies'
              ? Math.sin(elapsed * 2.2 + ph * 1.7) * 1.4
              : Math.cos(elapsed * 1.2 + ph) * 0.25;
          const swirlZ = Math.cos(elapsed * 1.4 + ph) * (wp.swirlAmp * 0.55);

          const lx = wrapMod(
            weatherOffsets[i * 3] + weatherRuntime.driftX * spd + swirlX - weatherCenterX,
            WEATHER_SPAN_X
          );
          const ly = wrapMod(
            weatherOffsets[i * 3 + 1] + weatherRuntime.driftY * spd + swirlY - weatherCenterY,
            WEATHER_SPAN_Y
          );
          const lz = wrapMod(
            weatherOffsets[i * 3 + 2] + weatherRuntime.driftZ * spd + swirlZ - weatherCenterZ,
            WEATHER_SPAN_Z
          );

          posArr[i * 3] = weatherCenterX + lx;
          posArr[i * 3 + 1] = weatherCenterY + ly;
          posArr[i * 3 + 2] = weatherCenterZ + lz;
        }
        weatherPosAttr.needsUpdate = true;

        if (rainStreaks.visible) {
          const tiltZ = -Math.atan2(wp.windX * gustFactor, wp.fallSpeed);
          const tiltX = Math.atan2(wp.windZ * gustFactor, wp.fallSpeed);
          for (let i = 0; i < RAIN_STREAK_COUNT; i++) {
            const spd = rainSpeeds[i];
            const lx = wrapMod(
              rainOffsets[i * 3] + weatherRuntime.rainDriftX * spd - weatherCenterX,
              WEATHER_SPAN_X
            );
            const ly = wrapMod(
              rainOffsets[i * 3 + 1] + weatherRuntime.rainDriftY * spd - weatherCenterY,
              WEATHER_SPAN_Y
            );
            const lz = wrapMod(
              rainOffsets[i * 3 + 2] + weatherRuntime.rainDriftZ * spd - weatherCenterZ,
              WEATHER_SPAN_Z
            );
            _weatherDummy.position.set(
              weatherCenterX + lx,
              weatherCenterY + ly,
              weatherCenterZ + lz
            );
            _weatherDummy.rotation.set(tiltX, 0, tiltZ);
            _weatherDummy.scale.set(1, wp.kind === 'rain' ? 1.1 : 0.72, 1);
            _weatherDummy.updateMatrix();
            rainStreaks.setMatrixAt(i, _weatherDummy.matrix);
          }
          rainStreaks.instanceMatrix.needsUpdate = true;
        }
      }

      if (p.mode === 'showcase') {
        playerWrapper.visible = true;
        playerWrapper.rotation.y = elapsed * 0.55;
        const scMode = p.showcaseLocomotion || 'drive';
        if (playerVehicleObj) playerVehicleObj.root.visible = scMode === 'drive';
        if (playerStandaloneObj) {
          playerStandaloneObj.root.visible = scMode !== 'drive';
          if (playerStandaloneObj.flightWings) {
            playerStandaloneObj.flightWings.visible = scMode === 'fly';
          }
          if (scMode === 'walk') {
            const stride = Math.sin(elapsed * 6.5);
            playerStandaloneObj.charGroup.position.y = Math.abs(stride) * 0.08;
            playerStandaloneObj.charGroup.rotation.x = 0.05;
            if (playerStandaloneObj.leftFoot) playerStandaloneObj.leftFoot.rotation.x = stride * 0.55;
            if (playerStandaloneObj.rightFoot) playerStandaloneObj.rightFoot.rotation.x = -stride * 0.55;
            if (playerStandaloneObj.leftArm) playerStandaloneObj.leftArm.rotation.x = -stride * 0.5;
            if (playerStandaloneObj.rightArm) playerStandaloneObj.rightArm.rotation.x = stride * 0.5;
            if (playerStandaloneObj.tail) playerStandaloneObj.tail.rotation.y = Math.sin(elapsed * 7) * 0.35;
          } else if (scMode === 'fly') {
            const flap = Math.sin(elapsed * 13) * 0.52;
            playerStandaloneObj.charGroup.position.y = 0.45 + Math.sin(elapsed * 3.2) * 0.14;
            playerStandaloneObj.charGroup.rotation.x = 0.22;
            if (playerStandaloneObj.flyWingL) playerStandaloneObj.flyWingL.rotation.z = -flap;
            if (playerStandaloneObj.flyWingR) playerStandaloneObj.flyWingR.rotation.z = flap;
            if (playerStandaloneObj.leftArm) playerStandaloneObj.leftArm.rotation.z = 0.55;
            if (playerStandaloneObj.rightArm) playerStandaloneObj.rightArm.rotation.z = -0.55;
            if (playerStandaloneObj.leftFoot) playerStandaloneObj.leftFoot.rotation.x = -0.55;
            if (playerStandaloneObj.rightFoot) playerStandaloneObj.rightFoot.rotation.x = -0.55;
          }
        }
        playerWrapper.position.y = 0.24 + (scMode === 'fly' ? 0.35 : Math.sin(elapsed * 2.2) * 0.03);
        if (playerVehicleObj?.propeller) {
          playerVehicleObj.propeller.rotation.y += dt * 10;
        }
        if (playerVehicleObj) {
          for (const w of playerVehicleObj.wheels) {
            w.rotation.x += dt * 1.4;
          }
        }
        const aspect = camera.aspect || 1;
        const portraitFactor = aspect < 0.9 ? THREE.MathUtils.clamp((0.9 - aspect) * 2.2, 0, 1) : 0;
        const targetShowcaseFov = THREE.MathUtils.lerp(56, 66, portraitFactor);
        if (Math.abs(camera.fov - targetShowcaseFov) > 0.05) {
          camera.fov = targetShowcaseFov;
          camera.updateProjectionMatrix();
        }
        const distScale = 1 + portraitFactor * 0.34;
        camera.position.set(3.8 * distScale, 2.35 + portraitFactor * 0.35, 4.9 * distScale);
        camera.lookAt(0, scMode === 'fly' ? 1.15 : 0.85, 0);
        keyLight.position.set(8, 14, 10);
        keyLight.target.position.set(0, 0.5, 0);
      } else if (p.levelConfig) {
        const len = raceState.trackLength;
        const groundY = terrainHeightAt(
          raceState.x,
          raceState.z,
          len,
          raceState.waveAmp,
          raceState.waveFreq,
          raceState.curve
        );

        if (!p.isPaused && !raceState.finished && !raceState.activePuzzle) {
          const speedMult =
            p.speedPreset === 'gentle' ? 0.88 : p.speedPreset === 'fast' ? 1.2 : 1.0;
          const abilitySpeedBoost =
            p.animalId === 'lulu' && raceState.abilityActiveLeft > 0 ? 1.28 : 1.0;
          const padBoost = raceState.boostLeft > 0 ? 1.38 : 1.0;
          const curRoadCx = roadCenterAtZ(raceState.z, len, raceState.curve);
          const mudSlow =
            raceState.locomotionMode !== 'fly' &&
            p.levelConfig.biome === 'lumpur' &&
            Math.abs(raceState.x - curRoadCx) > 10.2
              ? 0.85
              : 1.0;
          const locoMult =
            raceState.locomotionMode === 'fly'
              ? 1.18
              : raceState.locomotionMode === 'walk'
              ? 0.78
              : 1.0;
          const maxForwardSpeed =
            p.levelConfig.baseSpeed * speedMult * abilitySpeedBoost * padBoost * mudSlow * locoMult;

          // Combine 360° touch/mouse joystick with keyboard 360° vector
          const jMag = Math.hypot(raceState.joyX, raceState.joyY);
          const inputX = jMag > 0.05 ? raceState.joyX : raceState.keyJoyX;
          const inputY = jMag > 0.05 ? raceState.joyY : raceState.keyJoyY;
          const activeMag = Math.min(1, Math.hypot(inputX, inputY));

          let targetVx = 0;
          let targetVzForward = 0;
          if (activeMag > 0.06) {
            targetVx = inputX * maxForwardSpeed;
            targetVzForward = inputY * maxForwardSpeed;
          } else if (p.autoDrive) {
            targetVzForward = maxForwardSpeed;
          } else if (raceState.boostLeft > 0) {
            targetVzForward = maxForwardSpeed * 0.85;
          }

          const accelRate =
            raceState.locomotionMode === 'walk'
              ? 8.5
              : activeMag > 0.06
              ? 6.0
              : 3.6;
          raceState.vx = THREE.MathUtils.damp(raceState.vx, targetVx, accelRate, dt);
          raceState.vzForward = THREE.MathUtils.damp(
            raceState.vzForward,
            targetVzForward,
            accelRate,
            dt
          );
          raceState.speed = Math.hypot(raceState.vx, raceState.vzForward);

          raceState.z = Math.max(0, raceState.z + raceState.vzForward * dt);
          const nextRoadCx = roadCenterAtZ(raceState.z, len, raceState.curve);
          raceState.x = THREE.MathUtils.clamp(
            raceState.x + raceState.vx * dt,
            nextRoadCx - 28.0,
            nextRoadCx + 28.0
          );
          raceState.targetX = raceState.x;

          // Smooth 360° heading yaw toward movement vector
          let tiltZ = 0;
          if (raceState.speed > 0.6) {
            const targetYaw = Math.atan2(raceState.vx, -raceState.vzForward);
            let diff = targetYaw - raceState.yaw;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            raceState.yaw += diff * Math.min(1, dt * 10);
            tiltZ = THREE.MathUtils.clamp(
              -diff * (raceState.locomotionMode === 'fly' ? 0.55 : 0.35),
              -0.38,
              0.38
            );
          }

          // Vertical physics: Flying hover/climb/dive vs Ground jump gravity
          if (raceState.locomotionMode === 'fly') {
            if (raceState.flyVertical !== 0) {
              raceState.targetFlyY = THREE.MathUtils.clamp(
                raceState.targetFlyY + raceState.flyVertical * 5.8 * dt,
                1.6,
                10.5
              );
            }
            if (raceState.targetFlyY <= 1.65 && raceState.flyVertical < -0.55) {
              raceState.flyLandHoldTime += dt;
              if (raceState.flyLandHoldTime >= 0.25) {
                raceState.flyLandHoldTime = 0;
                raceState.flyVertical = 0;
                setLocomotionMode('walk');
              }
            } else {
              raceState.flyLandHoldTime = 0;
            }
            const hoverOffset = Math.sin(elapsed * 3.8) * 0.16;
            const prevY = raceState.y;
            raceState.y = THREE.MathUtils.damp(
              raceState.y,
              raceState.targetFlyY + hoverOffset,
              6.0,
              dt
            );
            raceState.vy = (raceState.y - prevY) / Math.max(0.001, dt);
          } else {
            raceState.flyLandHoldTime = 0;
            raceState.vy -= 28 * dt;
            raceState.y += raceState.vy * dt;
            if (raceState.y <= 0) {
              raceState.y = 0;
              raceState.vy = 0;
            }
          }

          if (raceState.abilityActiveLeft > 0)
            raceState.abilityActiveLeft = Math.max(0, raceState.abilityActiveLeft - dt);
          if (raceState.abilityCooldownLeft > 0)
            raceState.abilityCooldownLeft = Math.max(0, raceState.abilityCooldownLeft - dt);
          if (raceState.magnetActiveLeft > 0)
            raceState.magnetActiveLeft = Math.max(0, raceState.magnetActiveLeft - dt);
          if (raceState.magnetCooldownLeft > 0)
            raceState.magnetCooldownLeft = Math.max(0, raceState.magnetCooldownLeft - dt);
          if (raceState.boostLeft > 0) raceState.boostLeft = Math.max(0, raceState.boostLeft - dt);
          if (raceState.invulnLeft > 0) raceState.invulnLeft = Math.max(0, raceState.invulnLeft - dt);
          if (raceState.feedbackTimer > 0) {
            raceState.feedbackTimer -= dt;
            if (raceState.feedbackTimer <= 0) raceState.feedbackText = null;
          }
          if (raceState.missionNotifTimer > 0) {
            raceState.missionNotifTimer -= dt;
            if (raceState.missionNotifTimer <= 0) raceState.missionNotification = null;
          }

          playerWrapper.visible =
            raceState.invulnLeft > 0 ? Math.floor(elapsed * 14) % 2 === 0 : true;

          const currentGroundY = terrainHeightAt(
            raceState.x,
            raceState.z,
            len,
            raceState.waveAmp,
            raceState.waveFreq,
            raceState.curve
          );
          const fwdDirX = Math.sin(raceState.yaw);
          const fwdDirZ = Math.cos(raceState.yaw);
          const hAhead = terrainHeightAt(
            raceState.x + fwdDirX * 1.2,
            raceState.z - fwdDirZ * 1.2,
            len,
            raceState.waveAmp,
            raceState.waveFreq,
            raceState.curve
          );
          const hBehind = terrainHeightAt(
            raceState.x - fwdDirX * 1.2,
            raceState.z + fwdDirZ * 1.2,
            len,
            raceState.waveAmp,
            raceState.waveFreq,
            raceState.curve
          );
          const slopePitch = Math.atan2(hAhead - hBehind, 2.4);

          playerWrapper.position.set(raceState.x, currentGroundY + raceState.y, -raceState.z);
          playerWrapper.rotation.set(0, raceState.yaw, tiltZ);
          contactShadow.position.y = -raceState.y + 0.03;
          contactShadow.scale.setScalar(Math.max(0.32, 1 - raceState.y * 0.08));

          const isDriving = raceState.locomotionMode === 'drive';
          if (playerVehicleObj) {
            playerVehicleObj.root.visible = isDriving;
            if (isDriving) {
              playerVehicleObj.root.rotation.x = THREE.MathUtils.damp(
                playerVehicleObj.root.rotation.x,
                -slopePitch,
                10,
                dt
              );
              for (const w of playerVehicleObj.wheels) {
                w.rotation.x += raceState.speed * dt * 1.6;
              }
              if (playerVehicleObj.propeller) {
                playerVehicleObj.propeller.rotation.y += dt * 16;
              }
            }
          }

          if (playerStandaloneObj) {
            playerStandaloneObj.root.visible = !isDriving;
            if (!isDriving) {
              const isFlying = raceState.locomotionMode === 'fly';
              if (playerStandaloneObj.flightWings) {
                playerStandaloneObj.flightWings.visible = isFlying;
              }
              if (playerStandaloneObj.halo) {
                playerStandaloneObj.halo.rotation.z = elapsed * 2.0;
              }

              if (isFlying) {
                const flapSpeed = 14 + Math.min(8, raceState.speed * 0.3);
                const flapAngle = Math.sin(elapsed * flapSpeed) * 0.58;
                if (playerStandaloneObj.flyWingL) playerStandaloneObj.flyWingL.rotation.z = -flapAngle;
                if (playerStandaloneObj.flyWingR) playerStandaloneObj.flyWingR.rotation.z = flapAngle;
                const fwdTilt = 0.24 + Math.min(0.28, raceState.speed * 0.012);
                playerStandaloneObj.charGroup.rotation.x = THREE.MathUtils.damp(
                  playerStandaloneObj.charGroup.rotation.x,
                  fwdTilt,
                  8,
                  dt
                );
                playerStandaloneObj.charGroup.position.y = 0;
                if (playerStandaloneObj.leftArm) playerStandaloneObj.leftArm.rotation.x = -0.35;
                if (playerStandaloneObj.rightArm) playerStandaloneObj.rightArm.rotation.x = -0.35;
                if (playerStandaloneObj.leftArm) playerStandaloneObj.leftArm.rotation.z = 0.65;
                if (playerStandaloneObj.rightArm) playerStandaloneObj.rightArm.rotation.z = -0.65;
                if (playerStandaloneObj.leftFoot) playerStandaloneObj.leftFoot.rotation.x = -0.65;
                if (playerStandaloneObj.rightFoot) playerStandaloneObj.rightFoot.rotation.x = -0.65;
                if (playerStandaloneObj.tail) playerStandaloneObj.tail.rotation.y = Math.sin(elapsed * 8) * 0.25;
              } else {
                // Walking / Running animation
                const isMoving = raceState.speed > 0.45;
                if (isMoving) {
                  raceState.walkPhase += Math.max(4, raceState.speed * 0.72) * dt;
                }
                const stride = isMoving ? Math.sin(raceState.walkPhase) : 0;
                const bounce = isMoving ? Math.abs(Math.sin(raceState.walkPhase)) * 0.14 : Math.sin(elapsed * 2.8) * 0.02;
                playerStandaloneObj.charGroup.position.y = bounce;
                playerStandaloneObj.charGroup.rotation.x = THREE.MathUtils.damp(
                  playerStandaloneObj.charGroup.rotation.x,
                  isMoving ? 0.1 : 0,
                  10,
                  dt
                );
                if (playerStandaloneObj.leftFoot) playerStandaloneObj.leftFoot.rotation.x = stride * 0.72;
                if (playerStandaloneObj.rightFoot) playerStandaloneObj.rightFoot.rotation.x = -stride * 0.72;
                if (playerStandaloneObj.leftArm) {
                  playerStandaloneObj.leftArm.rotation.z = 0;
                  playerStandaloneObj.leftArm.rotation.x = -stride * 0.62;
                }
                if (playerStandaloneObj.rightArm) {
                  playerStandaloneObj.rightArm.rotation.z = 0;
                  playerStandaloneObj.rightArm.rotation.x = stride * 0.62;
                }
                if (playerStandaloneObj.tail) {
                  playerStandaloneObj.tail.rotation.y = Math.sin(elapsed * (isMoving ? 10 : 3)) * 0.35;
                }
              }
            }
          }

          const hasBimoShield = p.animalId === 'bimo' && raceState.abilityActiveLeft > 0;
          shieldSphere.visible = hasBimoShield || raceState.invulnLeft > 0;
          if (shieldSphere.visible) {
            shieldSphere.rotation.y += dt * 2.5;
            (shieldSphere.material as THREE.MeshStandardMaterial).opacity = hasBimoShield
              ? 0.32
              : 0.18;
          }
          magnetRing.visible =
            raceState.magnetActiveLeft > 0 ||
            (p.animalId === 'kiko' && raceState.abilityActiveLeft > 0);
          if (magnetRing.visible) magnetRing.rotation.z += dt * 4;

          if ((raceState.speed > 1.8 || raceState.locomotionMode === 'fly') && Math.random() < 0.48) {
            spawnTrail(
              raceState.x - Math.sin(raceState.yaw) * (isDriving ? 1.15 : 0.45),
              currentGroundY + raceState.y,
              -raceState.z - Math.cos(raceState.yaw) * (isDriving ? 1.15 : 0.45),
              raceState.locomotionMode === 'fly' ? 'rainbow' : p.customization.trailStyle
            );
          }

          // Obstacles update & collision (along curved road)
          for (const obs of raceState.obstacles) {
            const obsCenter = roadCenterAtZ(obs.z, len, raceState.curve);
            let obsX = obsCenter + LANE_X[obs.lane];
            if (obs.kind === 'mover') {
              obsX = obsCenter + Math.sin(elapsed * obs.moveSpeed + obs.movePhase) * 6.5;
              obs.mesh.position.x = obsX;
              obs.mesh.rotation.y += dt * 2.5;
            }
            if (obs.hit) continue;
            const dz = Math.abs(obs.z - raceState.z);
            const dx = Math.abs(obsX - raceState.x);
            if (dz < 1.35 && dx < 1.1) {
              const jumpClearHeight =
                obs.kind === 'barrier_high' ? 2.4 : obs.kind === 'jump_bar' ? 0.95 : 1.05;
              if (raceState.y < jumpClearHeight) {
                obs.hit = true;
                if (hasBimoShield) {
                  obs.mesh.visible = false;
                  raceState.score += 60;
                  raceState.feedbackText = 'Perisai Bambu! +60 Poin!';
                  raceState.feedbackTone = 'good';
                  raceState.feedbackTimer = 1.1;
                  soundEngine.playWordCorrect();
                } else if (raceState.invulnLeft <= 0) {
                  obs.mesh.visible = false;
                  raceState.speed *= 0.45;
                  recordMistake('Kena rintangan!');
                }
              }
            }
          }

          // Pickups update & collection
          const hasMagnet =
            raceState.magnetActiveLeft > 0 ||
            (p.animalId === 'kiko' && raceState.abilityActiveLeft > 0);
          for (const pk of raceState.pickups) {
            if (pk.collected) continue;
            if (pk.kind !== 'boost') {
              pk.mesh.rotation.y += dt * 2.4;
            }
            const dz = pk.z - raceState.z;
            if (hasMagnet && dz > -5 && dz < 20 && pk.kind !== 'boost') {
              pk.x = THREE.MathUtils.damp(pk.x, raceState.x, 8.2, dt);
              pk.z = THREE.MathUtils.damp(pk.z, raceState.z, 8.2, dt);
              pk.yOffset = THREE.MathUtils.damp(pk.yOffset, raceState.y + 0.7, 7.0, dt);
              const pkGround = terrainHeightAt(
                pk.x,
                pk.z,
                len,
                raceState.waveAmp,
                raceState.waveFreq,
                raceState.curve
              );
              pk.mesh.position.set(pk.x, pkGround + pk.yOffset, -pk.z);
            }
            if (
              Math.abs(pk.z - raceState.z) < 1.75 &&
              Math.abs(pk.x - raceState.x) < 1.7 &&
              Math.abs(pk.yOffset - (raceState.y + 0.7)) < (hasMagnet ? 3.2 : 1.9)
            ) {
              pk.collected = true;
              pk.mesh.visible = false;
              if (pk.kind === 'coin') {
                const bonus = p.animalId === 'kiko' && p.evolutionStage >= 2 ? 15 : 10;
                raceState.coinsEarned += bonus;
                raceState.score += 25;
                soundEngine.playCoin();
              } else if (pk.kind === 'heart') {
                raceState.mistakes = Math.max(0, raceState.mistakes - 1);
                raceState.score += 50;
                raceState.invulnLeft = Math.max(raceState.invulnLeft, 1.2);
                raceState.feedbackText = '❤️ Hati Terkumpul! Nyawa Pulih!';
                raceState.feedbackTone = 'good';
                raceState.feedbackTimer = 1.6;
                soundEngine.playHeal();
              } else if (pk.kind === 'boost') {
                raceState.boostLeft = 2.2;
                raceState.score += 40;
                raceState.feedbackText = 'Boost Kecepatan!';
                raceState.feedbackTone = 'good';
                raceState.feedbackTimer = 1.0;
                soundEngine.playAbility();
              } else if (pk.kind === 'word_card' && pk.word) {
                raceState.score += 100;
                raceState.coinsEarned += 20;
                if (!raceState.wordsCollected.some((w) => w.id === pk.word!.id)) {
                  raceState.wordsCollected.push(pk.word);
                }
                if (pk.countsTowardMission) {
                  raceState.missionSolved += 1;
                  raceState.nearFinishBlocked = false;
                  const left = Math.max(0, raceState.missionTotal - raceState.missionSolved);
                  pushMissionNotif(
                    left === 0
                      ? 'Misi Kosa Kata Tuntas!'
                      : `Kosa Kata Misi (${raceState.missionSolved}/${raceState.missionTotal})`,
                    left === 0
                      ? `Semua ${raceState.missionTotal} kosa kata ditemukan! Menuju Garis Finis!`
                      : `${pk.word.emoji} ${pk.word.arabic} · ${pk.word.english} (${pk.word.indonesian})! Sisa ${left} kata.`,
                    left === 0 ? 'complete' : 'progress',
                    4.2
                  );
                }
                raceState.feedbackText = `Misteri Terbuka! ${pk.word.emoji} ${pk.word.arabic} · ${pk.word.english}!`;
                raceState.feedbackTone = 'good';
                raceState.feedbackTimer = 2.0;
                soundEngine.playWordCorrect();
                soundEngine.speakWord(pk.word.english, pk.word.arabic);
              }
            }
          }

          // Animate & Collect Living Creature Items
          for (const cr of raceState.creatures) {
            if (cr.collected) continue;
            const d = cr.data;
            let cz = d.z + Math.cos(elapsed * d.roamSpeed * 0.8 + d.phase) * (d.roamRadius * 0.65);
            let cx =
              roadCenterAtZ(cz, len, raceState.curve) +
              d.x +
              Math.sin(elapsed * d.roamSpeed + d.phase) * d.roamRadius;

            if (hasMagnet && Math.abs(cz - raceState.z) < 15 && Math.abs(cx - raceState.x) < 14) {
              cx = THREE.MathUtils.lerp(cx, raceState.x, 0.45);
              cz = THREE.MathUtils.lerp(cz, raceState.z, 0.45);
            }

            const cy = terrainHeightAt(
              cx,
              cz,
              len,
              raceState.waveAmp,
              raceState.waveFreq,
              raceState.curve
            );
            const hop =
              d.kind === 'frog' || d.kind === 'rabbit' || d.kind === 'sheep'
                ? Math.abs(Math.sin(elapsed * 4.2 + d.phase)) * 0.38
                : d.kind === 'butterfly' || d.kind === 'bird' || d.kind === 'fish'
                ? Math.sin(elapsed * 3.4 + d.phase) * 0.25
                : 0;

            cr.group.position.set(cx, cy, -cz);
            cr.mesh.position.y = hop;
            cr.ring.rotation.z += dt * 1.8;

            const dxMove = cx - cr.prevX;
            const dzMove = -(cz - cr.prevZ);
            if (dxMove * dxMove + dzMove * dzMove > 0.00001) {
              cr.mesh.rotation.y = Math.atan2(dxMove, dzMove);
            }
            cr.prevX = cx;
            cr.prevZ = cz;

            const wingL = cr.mesh.getObjectByName('wingL');
            const wingR = cr.mesh.getObjectByName('wingR');
            if (wingL && wingR) {
              const flap = Math.sin(elapsed * 14 + d.phase) * 0.65;
              wingL.rotation.z = flap;
              wingR.rotation.z = -flap;
            }

            if (Math.abs(cz - raceState.z) < 2.1 && Math.abs(cx - raceState.x) < 2.0) {
              cr.collected = true;
              cr.group.visible = false;
              raceState.score += 120;
              raceState.coinsEarned += 25;
              if (!raceState.wordsCollected.some((w) => w.id === d.word.id)) {
                raceState.wordsCollected.push(d.word);
              }
              raceState.creatureZoomLeft = 1.45;
              raceState.creatureFocusX = cx;
              raceState.creatureFocusY = cy + 0.85;
              raceState.creatureFocusZ = -cz;
              raceState.feedbackText = `Teman Baru! ${d.word.emoji} ${d.word.arabic} · ${d.word.english} (+120)`;
              raceState.feedbackTone = 'good';
              raceState.feedbackTimer = 2.2;
              soundEngine.playWordCorrect();
              soundEngine.speakWord(d.word.english, d.word.arabic);
              for (let s = 0; s < 6; s++) {
                spawnTrail(cx, cy + 0.6, -cz, 'rainbow');
              }
            }
          }

          // Animate & Interact with Patrol Monsters along curved road
          for (const mon of raceState.monsters) {
            const md = mon.data;
            if (mon.stunLeft > 0) {
              mon.stunLeft = Math.max(0, mon.stunLeft - dt);
              mon.mesh.scale.set(1.2, 0.35, 1.2);
              mon.mesh.rotation.y += dt * 10;
              continue;
            }
            mon.mesh.scale.setScalar(1);
            const monCenter = roadCenterAtZ(mon.z, len, raceState.curve);
            mon.x = monCenter + md.x + Math.sin(elapsed * md.patrolSpeed + md.phase) * md.patrolRange;
            const my = terrainHeightAt(
              mon.x,
              mon.z,
              len,
              raceState.waveAmp,
              raceState.waveFreq,
              raceState.curve
            );
            const bounce = Math.abs(Math.sin(elapsed * 3.6 + md.phase)) * 0.25;
            mon.mesh.position.set(mon.x, my + bounce, -mon.z);
            mon.mesh.rotation.y = Math.sin(elapsed * md.patrolSpeed + md.phase) * 0.6;

            const armL = mon.mesh.getObjectByName('armL');
            const armR = mon.mesh.getObjectByName('armR');
            if (armL && armR) {
              armL.rotation.x = Math.sin(elapsed * 5 + md.phase) * 0.5;
              armR.rotation.x = -Math.sin(elapsed * 5 + md.phase) * 0.5;
            }

            const dz = Math.abs(mon.z - raceState.z);
            const dx = Math.abs(mon.x - raceState.x);
            if (dz < 1.6 && dx < 1.45) {
              const stompedFromAbove = raceState.y > 0.72;
              const isTurboOrShield =
                hasBimoShield ||
                raceState.boostLeft > 0 ||
                (p.animalId === 'lulu' && raceState.abilityActiveLeft > 0);

              if (stompedFromAbove || isTurboOrShield) {
                mon.stunLeft = 4.0;
                raceState.monstersDefeated += 1;
                raceState.score += 150;
                raceState.coinsEarned += 20;
                if (stompedFromAbove) {
                  raceState.vy = 8.5; // Fun bounce off monster head!
                }
                raceState.feedbackText = 'Monster Kalah! +150 Poin & +20 Koin!';
                raceState.feedbackTone = 'good';
                raceState.feedbackTimer = 1.6;
                soundEngine.playMonsterBonk();
                triggerStarburst(16, new THREE.Vector3(mon.x, my + 0.8, -mon.z));
              } else if (raceState.invulnLeft <= 0) {
                mon.stunLeft = 2.5;
                raceState.speed = -4.5; // Gentle knockback so player isn't trapped
                recordMistake('Kena Monster!');
              }
            }
          }

          // Animate Lively AI NPC Explorers following the curved track
          for (const npc of raceState.npcs) {
            const nd = npc.data;
            const distFromPlayer = npc.z - raceState.z;
            let paceMult = 1.0;
            if (distFromPlayer > 48) paceMult = 0.72;
            else if (distFromPlayer < -24) paceMult = 1.28;

            npc.z += nd.baseSpeed * paceMult * dt;
            if (npc.z > len - 6) {
              npc.z = 8;
            }

            const swayAmp = nd.isExplorer ? 2.6 : 1.15;
            const npcCenter = roadCenterAtZ(npc.z, len, raceState.curve);
            npc.x = npcCenter + nd.laneOffsetX + Math.sin(elapsed * nd.roamFreq + nd.startZ) * swayAmp;
            const ny = terrainHeightAt(
              npc.x,
              npc.z,
              len,
              raceState.waveAmp,
              raceState.waveFreq,
              raceState.curve
            );
            const nhAhead = terrainHeightAt(
              npc.x,
              npc.z + 1.2,
              len,
              raceState.waveAmp,
              raceState.waveFreq,
              raceState.curve
            );
            const nhBehind = terrainHeightAt(
              npc.x,
              npc.z - 1.2,
              len,
              raceState.waveAmp,
              raceState.waveFreq,
              raceState.curve
            );
            const npcPitch = Math.atan2(nhAhead - nhBehind, 2.4);

            npc.group.position.set(npc.x, ny, -npc.z);
            npc.group.rotation.y = roadTangentAngleAtZ(npc.z, len, raceState.curve);
            npc.vehicleRoot.rotation.x = THREE.MathUtils.damp(
              npc.vehicleRoot.rotation.x,
              -npcPitch,
              8,
              dt
            );
            for (const w of npc.wheels) {
              w.rotation.x += nd.baseSpeed * dt * 1.4;
            }
          }

          // Vocabulary Quiz Gates aligned to curved center
          let activeGatePrompt: VocabWord | null = null;
          for (const gItem of raceState.gates) {
            if (!gItem.resolved) {
              const dist = gItem.gate.z - raceState.z;
              if (dist > 0 && dist < 48) {
                activeGatePrompt = gItem.gate.promptWord;
              }
              if (raceState.z >= gItem.gate.z) {
                gItem.resolved = true;
                const gateCenter = roadCenterAtZ(gItem.gate.z, len, raceState.curve);
                let chosen = gItem.gate.options[0];
                let minDiff = 999;
                for (const opt of gItem.gate.options) {
                  const diff = Math.abs(gateCenter + LANE_X[opt.lane] - raceState.x);
                  if (diff < minDiff) {
                    minDiff = diff;
                    chosen = opt;
                  }
                }
                if (chosen.isCorrect) {
                  raceState.score += 180;
                  raceState.coinsEarned += 35;
                  if (!raceState.wordsCollected.some((w) => w.id === chosen.word.id)) {
                    raceState.wordsCollected.push(chosen.word);
                  }
                  raceState.feedbackText = `Hebat! ${chosen.word.arabic} = ${chosen.word.english} (+180)`;
                  raceState.feedbackTone = 'good';
                  raceState.feedbackTimer = 2.2;
                  soundEngine.playWordCorrect();
                  soundEngine.speakWord(chosen.word.english, chosen.word.arabic);
                } else {
                  recordMistake(
                    `Salah! "${gItem.gate.promptWord.indonesian}" = ${gItem.gate.promptWord.english}`
                  );
                }
              }
            }
          }

          // Search & Trigger Hidden Vocabulary Puzzle Caches
          for (const hc of raceState.hiddenCaches) {
            if (hc.solved) continue;
            if (hc.searchRing) hc.searchRing.rotation.z += dt * 1.9;
            if (hc.badge) {
              hc.badge.position.y = 2.35 + Math.sin(elapsed * 3.2 + hc.data.z) * 0.16;
            }
            const hcWorldX = roadCenterAtZ(hc.data.z, len, raceState.curve) + hc.data.x;
            const dist = Math.hypot(hcWorldX - raceState.x, hc.data.z - raceState.z);
            if (!hc.notifiedNear && dist < 30) {
              hc.notifiedNear = true;
              const isSent = Boolean(hc.data.sentenceMission);
              pushMissionNotif(
                isSent ? 'Sinyal Misi Kalimat!' : 'Sinyal Kosa Kata Tersembunyi!',
                isSent
                  ? `Ada misi susun kalimat (${hc.data.sentenceMission?.category}) sekitar ${Math.round(dist)}m di dekatmu!`
                  : `Ada kata rahasia (${hc.data.word.category}) sekitar ${Math.round(dist)}m di dekatmu!`,
                'info',
                3.8
              );
            }
            if (dist < 2.8) {
              raceState.vx = 0;
              raceState.vzForward = 0;
              raceState.speed = 0;
              raceState.joyX = 0;
              raceState.joyY = 0;
              raceState.flyVertical = 0;
              raceState.activePuzzle = {
                cacheId: hc.data.id,
                word: hc.data.word,
                distractors: hc.data.distractors,
                puzzleType: hc.data.puzzleType,
                sentenceMission: hc.data.sentenceMission,
              };
              soundEngine.playAbility();
              emitHudNow(activeGatePrompt);
              break;
            }
          }

          // Check Finish Line (remind if mission words/sentences still remain!)
          if (!raceState.finished && !raceState.activePuzzle) {
            const missionIncomplete =
              !raceState.bypassFinishMission && raceState.missionSolved < raceState.missionTotal;
            if (raceState.z < raceState.trackLength - 8 && raceState.nearFinishBlocked) {
              raceState.nearFinishBlocked = false;
            }
            if (missionIncomplete && raceState.z >= raceState.trackLength - 2.5) {
              raceState.z = raceState.trackLength - 3.0;
              raceState.vzForward = Math.min(0, raceState.vzForward);
              if (!raceState.nearFinishBlocked) {
                raceState.nearFinishBlocked = true;
                const isSentLvl = (propsRef.current.levelConfig?.level ?? 0) > 200;
                pushMissionNotif(
                  `Misi Belum Tuntas (${raceState.missionSolved}/${raceState.missionTotal})`,
                  isSentLvl
                    ? `Masih ada ${raceState.missionTotal - raceState.missionSolved} misi kata/kalimat! Putar balik pakai Joystick 360° untuk mencarinya.`
                    : `Masih ada ${raceState.missionTotal - raceState.missionSolved} kosa kata misi! Putar balik pakai Joystick 360° untuk mencarinya.`,
                  'warn',
                  5.5
                );
                emitHudNow(activeGatePrompt);
              }
            } else if (raceState.z >= raceState.trackLength) {
              raceState.finished = true;
              playerWrapper.visible = true;
              const finishTimeMs = Date.now() - raceState.startTimeMs;
              const wordsCount = raceState.wordsCollected.length;
              const allMissionSolved = raceState.missionSolved >= raceState.missionTotal;
              const stars: 1 | 2 | 3 =
                allMissionSolved && wordsCount >= 3 ? 3 : wordsCount >= 1 ? 2 : 1;
              soundEngine.playConfetti();
              soundEngine.playVictory(p.animalId, p.evolutionStage);
              p.onLevelComplete({
                score: raceState.score + 200 + (allMissionSolved ? 150 : 0),
                coinsEarned: raceState.coinsEarned + 40 + (allMissionSolved ? 30 : 0),
                wordsCollected: raceState.wordsCollected,
                stars,
                finishTimeMs,
              });
            }
          }

          if (elapsed - raceState.lastHudEmit > 0.08) {
            raceState.lastHudEmit = elapsed;
            emitHudNow(activeGatePrompt);
          }

          if (raceState.creatureZoomLeft > 0) {
            raceState.creatureZoomLeft = Math.max(0, raceState.creatureZoomLeft - dt);
          }

          // Detect looming large obstacles & active monsters for dramatic zoom-in
          let bestHazardIntensity = 0;
          let bestHazardX = raceState.x;
          let bestHazardY = groundY;
          let bestHazardZ = -raceState.z - 6;

          for (const obs of raceState.obstacles) {
            if (obs.hit) continue;
            const isLargeObstacle =
              obs.kind === 'barrier_high' ||
              obs.kind === 'mover' ||
              obs.kind === 'rock' ||
              obs.kind === 'crate';
            if (!isLargeObstacle) continue;

            const obsX =
              obs.kind === 'mover'
                ? obs.mesh.position.x
                : roadCenterAtZ(obs.z, len, raceState.curve) + LANE_X[obs.lane];
            const dzAhead = obs.z - raceState.z;
            const dxAbs = Math.abs(obsX - raceState.x);
            if (dzAhead > -1.2 && dzAhead < 16.5 && dxAbs < 5.2) {
              const dist = Math.hypot(dxAbs, dzAhead);
              const sizeWeight =
                obs.kind === 'barrier_high' || obs.kind === 'mover' ? 1.0 : 0.78;
              const prox = THREE.MathUtils.clamp(1 - (dist - 2.4) / 14.0, 0, 1) * sizeWeight;
              if (prox > bestHazardIntensity) {
                bestHazardIntensity = prox;
                bestHazardX = obsX;
                bestHazardY = obs.mesh.position.y + (obs.kind === 'barrier_high' ? 1.2 : 0.65);
                bestHazardZ = -obs.z;
              }
            }
          }

          for (const mon of raceState.monsters) {
            if (mon.stunLeft > 0) continue;
            const dzAhead = mon.z - raceState.z;
            const dxAbs = Math.abs(mon.x - raceState.x);
            if (dzAhead > -1.5 && dzAhead < 14.5 && dxAbs < 6.0) {
              const dist = Math.hypot(dxAbs, dzAhead);
              const prox = THREE.MathUtils.clamp(1 - (dist - 2.2) / 12.5, 0, 1) * 0.95;
              if (prox > bestHazardIntensity) {
                bestHazardIntensity = prox;
                bestHazardX = mon.x;
                bestHazardY = mon.mesh.position.y + 0.85;
                bestHazardZ = -mon.z;
              }
            }
          }

          raceState.hazardZoom = THREE.MathUtils.damp(
            raceState.hazardZoom,
            bestHazardIntensity,
            6.5,
            dt
          );
          if (bestHazardIntensity > 0.05) {
            raceState.hazardFocusX = THREE.MathUtils.damp(raceState.hazardFocusX, bestHazardX, 9, dt);
            raceState.hazardFocusY = THREE.MathUtils.damp(raceState.hazardFocusY, bestHazardY, 9, dt);
            raceState.hazardFocusZ = THREE.MathUtils.damp(raceState.hazardFocusZ, bestHazardZ, 9, dt);
          }
        }

        // Smooth dynamic camera choreography (adapts FOV to screen + tracks winding curves + evolution celebration!)
        const aspect = camera.aspect || 1;
        const portraitFovBoost = aspect < 0.95 ? THREE.MathUtils.clamp((0.95 - aspect) * 24, 0, 14) : 0;
        const discoveryZoom = THREE.MathUtils.clamp(raceState.creatureZoomLeft / 1.15, 0, 1);
        const hazardZoom = raceState.activePuzzle ? 0 : raceState.hazardZoom;
        const evoCelebrationZoom =
          evolutionCelebrationLeft > 0
            ? THREE.MathUtils.clamp(evolutionCelebrationLeft / 1.4, 0, 1) * 0.55
            : 0;
        if (raceState.finished && evolutionCelebrationLeft > 0) {
          // Gentle joyful hop & spin on the evolved hero behind the modal
          playerWrapper.position.y =
            groundY + raceState.y + Math.abs(Math.sin(elapsed * 6.5)) * 0.42;
          playerWrapper.rotation.y = raceState.yaw + Math.sin(elapsed * 3.2) * 0.35;
        }
        const zoomAmount = Math.max(discoveryZoom, hazardZoom * 0.92, evoCelebrationZoom);
        const baseFov = (raceState.boostLeft > 0 ? 66 : 58) + portraitFovBoost;
        const targetFov = THREE.MathUtils.lerp(baseFov, 42 + portraitFovBoost * 0.5, zoomAmount);
        camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 5.5, dt);
        camera.updateProjectionMatrix();

        const curRoadCx = roadCenterAtZ(raceState.z, len, raceState.curve);
        const aheadRoadCx = roadCenterAtZ(Math.min(len, raceState.z + 9), len, raceState.curve);
        const isDiscoveryDominant = discoveryZoom >= hazardZoom * 0.92 && discoveryZoom > 0.02;
        const evoOrbitX =
          evoCelebrationZoom > 0.02 ? Math.sin(elapsed * 1.9) * 2.2 * evoCelebrationZoom : 0;
        const camSideShift = isDiscoveryDominant
          ? (raceState.creatureFocusX - raceState.x) * 0.25 * discoveryZoom
          : evoCelebrationZoom > 0.02
          ? evoOrbitX
          : (raceState.hazardFocusX - raceState.x) * 0.18 * hazardZoom;
        const camTargetX = raceState.x - (aheadRoadCx - curRoadCx) * 0.22 + camSideShift;
        const camTargetY =
          groundY + THREE.MathUtils.lerp(5.8, 3.65, zoomAmount) + raceState.y * 0.78;
        const camTargetZ = -raceState.z + THREE.MathUtils.lerp(10.6, 6.2, zoomAmount);

        camera.position.x = THREE.MathUtils.damp(camera.position.x, camTargetX, 7, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, camTargetY, 6, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, camTargetZ, 11, dt);

        let targetLookX = raceState.x + (aheadRoadCx - curRoadCx) * 0.28;
        let targetLookY =
          groundY + 1.45 + raceState.y * 0.72 + (evoCelebrationZoom > 0.02 ? 0.55 * evoCelebrationZoom : 0);
        let targetLookZ = -raceState.z - (evoCelebrationZoom > 0.02 ? 2.5 : 9);

        if (isDiscoveryDominant) {
          targetLookX = THREE.MathUtils.lerp(targetLookX, raceState.creatureFocusX, 0.38 * discoveryZoom);
          targetLookY = THREE.MathUtils.lerp(targetLookY, raceState.creatureFocusY, 0.45 * discoveryZoom);
          targetLookZ = THREE.MathUtils.lerp(-raceState.z - 3.5, raceState.creatureFocusZ, 0.32 * discoveryZoom);
        } else if (hazardZoom > 0.04) {
          targetLookX = THREE.MathUtils.lerp(targetLookX, raceState.hazardFocusX, 0.34 * hazardZoom);
          targetLookY = THREE.MathUtils.lerp(targetLookY, raceState.hazardFocusY, 0.42 * hazardZoom);
          targetLookZ = THREE.MathUtils.lerp(targetLookZ, raceState.hazardFocusZ, 0.32 * hazardZoom);
        }

        raceState.camLookX = THREE.MathUtils.damp(raceState.camLookX, targetLookX, 8, dt);
        raceState.camLookY = THREE.MathUtils.damp(raceState.camLookY, targetLookY, 8, dt);
        raceState.camLookZ = THREE.MathUtils.damp(raceState.camLookZ, targetLookZ, 8, dt);

        _vec3.set(raceState.camLookX, raceState.camLookY, raceState.camLookZ);
        camera.lookAt(_vec3);

        keyLight.position.set(raceState.x + 14, groundY + 24, -raceState.z + 12);
        keyLight.target.position.set(raceState.x, groundY, -raceState.z - 8);
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onWindowBlur);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      resizeObserver?.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      for (const tp of trailParticles) {
        scene.remove(tp.mesh);
        (tp.mesh.material as THREE.Material).dispose();
      }
      for (const sp of starburstParticles) {
        scene.remove(sp.mesh);
        (sp.mesh.material as THREE.Material).dispose();
      }
      for (const sr of starburstRings) {
        scene.remove(sr.mesh);
        (sr.mesh.material as THREE.Material).dispose();
      }
      for (const sb of starburstBeams) {
        scene.remove(sb.mesh);
        (sb.mesh.material as THREE.Material).dispose();
      }
      trailGeo.dispose();
      star5Geo.dispose();
      starGeo.dispose();
      confettiGeo.dispose();
      sparkOrbGeo.dispose();
      ringGeo.dispose();
      beamGeo.dispose();
      weatherGeo.dispose();
      weatherMat.dispose();
      weatherSpriteTex.dispose();
      rainStreakGeo.dispose();
      rainStreakMat.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full relative overflow-hidden" />;
};
