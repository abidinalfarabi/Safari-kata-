import * as THREE from 'three';
import {
  AnimalId,
  ArenaThemeConfig,
  AvatarAccessory,
  BiomeId,
  CharacterDef,
  LivingCreatureKind,
  MonsterKind,
  ObstacleKind,
  SpeciesShape,
  VehicleCustomization,
  VocabWord,
} from '../types/game';

// Shared geometry/material helpers & procedural CanvasTextures

export function makeContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  grad.addColorStop(0, 'rgba(15, 23, 42, 0.45)');
  grad.addColorStop(0.55, 'rgba(15, 23, 42, 0.22)');
  grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeNameplateTexture(label: string, accentColor = '#0EA5E9'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 72;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.84)';
  ctx.beginPath();
  ctx.roundRect(8, 8, 240, 56, 20);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = accentColor;
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 28px "Fredoka", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label.slice(0, 14), 128, 36);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeRoadTexture(
  biomeOrTheme: BiomeId | ArenaThemeConfig,
  maxAniso: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const roadColors: Record<BiomeId, { base: string; curb: string; stripe: string }> = {
    pedesaan: { base: '#A16207', curb: '#84CC16', stripe: '#FEF08A' },
    hutan: { base: '#78350F', curb: '#22C55E', stripe: '#FDE68A' },
    lumpur: { base: '#5C3A21', curb: '#4D7C0F', stripe: '#A16207' },
    pasir_batu: { base: '#78716C', curb: '#D6D3D1', stripe: '#F59E0B' },
    gurun: { base: '#D97706', curb: '#FEF3C7', stripe: '#FEF9C3' },
    perkampungan: { base: '#64748B', curb: '#F8FAFC', stripe: '#FACC15' },
    kota_bukit: { base: '#334155', curb: '#38BDF8', stripe: '#FACC15' },
  };

  const isTheme = typeof biomeOrTheme !== 'string';
  const palette = isTheme
    ? {
        base: biomeOrTheme.roadBaseColor,
        curb: biomeOrTheme.roadCurbColor,
        stripe: biomeOrTheme.roadStripeColor,
      }
    : roadColors[biomeOrTheme];
  const style = isTheme ? biomeOrTheme.roadStyle : 'dirt_trail';

  ctx.fillStyle = palette.base;
  ctx.fillRect(0, 0, 512, 512);

  if (style === 'wooden_plank') {
    for (let y = 0; y < 512; y += 32) {
      ctx.fillStyle = y % 64 === 0 ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.06)';
      ctx.fillRect(22, y, 468, 28);
      ctx.fillStyle = 'rgba(42,20,8,0.45)';
      ctx.fillRect(22, y + 28, 468, 4);
    }
  } else if (style === 'cobble_stone') {
    for (let row = 0; row < 16; row++) {
      for (let col = 0; col < 10; col++) {
        const ox = (row % 2) * 24 + col * 48 + 24;
        const oy = row * 32 + 4;
        ctx.fillStyle = (row + col) % 2 === 0 ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.14)';
        ctx.beginPath();
        ctx.roundRect(ox, oy, 40, 24, 8);
        ctx.fill();
      }
    }
  } else if (style === 'rainbow_crystal') {
    const grad = ctx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0, 'rgba(244,114,182,0.22)');
    grad.addColorStop(0.5, 'rgba(56,189,248,0.22)');
    grad.addColorStop(1, 'rgba(167,139,250,0.22)');
    ctx.fillStyle = grad;
    ctx.fillRect(22, 0, 468, 512);
    for (let i = 0; i < 80; i++) {
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.beginPath();
      ctx.arc(30 + Math.random() * 452, Math.random() * 512, 3 + Math.random() * 4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (style === 'snow_frost') {
    for (let i = 0; i < 180; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.32)' : 'rgba(186,230,253,0.28)';
      ctx.beginPath();
      ctx.arc(Math.random() * 512, Math.random() * 512, 3 + Math.random() * 7, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (style === 'cosmic_nebula') {
    for (let i = 0; i < 160; i++) {
      ctx.fillStyle = i % 3 === 0 ? 'rgba(250,204,21,0.55)' : 'rgba(192,132,252,0.3)';
      ctx.beginPath();
      ctx.arc(Math.random() * 512, Math.random() * 512, 1.5 + Math.random() * 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (style === 'golden_sand') {
    for (let i = 0; i < 420; i++) {
      ctx.fillStyle = i % 3 === 0 ? 'rgba(255,255,255,0.16)' : 'rgba(120, 53, 15, 0.18)';
      ctx.beginPath();
      ctx.arc(Math.random() * 512, Math.random() * 512, 2 + Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (style === 'forest_moss') {
    for (let i = 0; i < 65; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(34,197,94,0.22)' : 'rgba(20,83,45,0.28)';
      ctx.beginPath();
      ctx.ellipse(Math.random() * 512, Math.random() * 512, 14 + Math.random() * 20, 8 + Math.random() * 14, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    for (let i = 0; i < 550; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)';
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 4, 7);
    }
  }

  // Side curbs
  ctx.fillStyle = palette.curb;
  ctx.fillRect(0, 0, 22, 512);
  ctx.fillRect(490, 0, 22, 512);

  // Dashed lane dividers
  ctx.fillStyle = palette.stripe;
  for (let y = 16; y < 512; y += 64) {
    ctx.fillRect(170, y, 10, 34);
    ctx.fillRect(332, y, 10, 34);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

export function makeGroundTexture(
  biomeOrTheme: BiomeId | ArenaThemeConfig,
  maxAniso: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const baseColors: Record<BiomeId, string> = {
    pedesaan: '#4ADE80',
    hutan: '#15803D',
    lumpur: '#65A30D',
    pasir_batu: '#D6D3D1',
    gurun: '#FBBF24',
    perkampungan: '#86EFAC',
    kota_bukit: '#6EE7B7',
  };

  const isTheme = typeof biomeOrTheme !== 'string';
  ctx.fillStyle = isTheme ? biomeOrTheme.groundPrimary : baseColors[biomeOrTheme];
  ctx.fillRect(0, 0, 512, 512);

  const secondary = isTheme ? biomeOrTheme.groundSecondary : '#22C55E';
  const accent = isTheme ? biomeOrTheme.accentPropColor : '#F472B6';

  if (isTheme) {
    if (biomeOrTheme.propArchetype === 'canyon' || biomeOrTheme.propArchetype === 'palm') {
      for (let i = 0; i < 28; i++) {
        ctx.strokeStyle = secondary;
        ctx.globalAlpha = 0.28;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(0, i * 20);
        ctx.bezierCurveTo(170, i * 20 - 14, 340, i * 20 + 14, 512, i * 20);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    } else if (biomeOrTheme.propArchetype === 'cosmos' || biomeOrTheme.propArchetype === 'crystal') {
      for (let i = 0; i < 120; i++) {
        ctx.fillStyle = i % 3 === 0 ? accent : secondary;
        ctx.globalAlpha = i % 3 === 0 ? 0.32 : 0.42;
        ctx.beginPath();
        ctx.arc(Math.random() * 512, Math.random() * 512, 3 + Math.random() * 9, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else {
      for (let i = 0; i < 180; i++) {
        ctx.fillStyle = i % 6 === 0 ? accent : i % 5 === 0 ? '#FEF08A' : secondary;
        ctx.globalAlpha = i % 6 === 0 ? 0.55 : 0.45;
        ctx.beginPath();
        ctx.arc(Math.random() * 512, Math.random() * 512, 3 + Math.random() * 7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  } else {
    for (let i = 0; i < 160; i++) {
      ctx.fillStyle = i % 5 === 0 ? '#FEF08A' : i % 7 === 0 ? '#F472B6' : '#22C55E';
      ctx.beginPath();
      ctx.arc(Math.random() * 512, Math.random() * 512, 3 + Math.random() * 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

export function makeWordCardTexture(
  word: VocabWord,
  isGateOption = false,
  isMysteryHidden = false
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  if (isMysteryHidden) {
    // Hidden mystery card: hides the Arabic & English text so players search & discover!
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.roundRect(12, 12, 488, 360, 40);
    ctx.fill();

    ctx.lineWidth = 14;
    ctx.strokeStyle = '#F59E0B';
    ctx.stroke();

    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.roundRect(32, 32, 448, 320, 28);
    ctx.fill();

    ctx.fillStyle = '#FACC15';
    ctx.font = 'bold 140px "Fredoka", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', 256, 155);

    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 34px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`Misteri · ${word.category}`, 256, 286);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // Crisp rounded card background
  ctx.fillStyle = isGateOption ? '#FFFBEB' : '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(12, 12, 488, 360, 40);
  ctx.fill();

  ctx.lineWidth = 14;
  ctx.strokeStyle = isGateOption ? '#F59E0B' : '#0EA5E9';
  ctx.stroke();

  // Top color ribbon
  ctx.fillStyle = isGateOption ? '#FEF3C7' : '#E0F2FE';
  ctx.beginPath();
  ctx.roundRect(24, 24, 464, 96, 28);
  ctx.fill();

  // Emoji & Category
  ctx.font = 'bold 64px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(word.emoji, 256, 74);

  // Arabic script (large, bold)
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 74px "Noto Sans Arabic", sans-serif';
  ctx.fillText(word.arabic, 256, 190);

  // English word
  ctx.fillStyle = '#0369A1';
  ctx.font = 'bold 48px "Fredoka", sans-serif';
  ctx.fillText(word.english, 256, 280);

  // Indonesian hint (smaller on gate options so kids read Arabic/English!)
  if (!isGateOption) {
    ctx.fillStyle = '#64748B';
    ctx.font = '600 28px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(word.indonesian, 256, 336);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeMysteryQuestionTexture(category: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 192;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.roundRect(10, 10, 236, 172, 28);
  ctx.fill();

  ctx.lineWidth = 10;
  ctx.strokeStyle = '#FACC15';
  ctx.stroke();

  ctx.fillStyle = '#FACC15';
  ctx.font = 'bold 88px "Fredoka", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', 128, 82);

  ctx.fillStyle = '#E2E8F0';
  ctx.font = 'bold 26px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(category, 128, 148);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeFinishTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const size = 32;
  for (let y = 0; y < 128; y += size) {
    for (let x = 0; x < 512; x += size) {
      ctx.fillStyle = ((x + y) / size) % 2 === 0 ? '#0F172A' : '#FFFFFF';
      ctx.fillRect(x, y, size, size);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildAnimalMesh(
  animalId: AnimalId,
  evolutionStage: 1 | 2 | 3 | 4,
  standing = false,
  characterDef?: CharacterDef,
  includeFlightWings = false
): THREE.Group {
  const group = new THREE.Group();
  const shape: SpeciesShape =
    characterDef?.shape ||
    (animalId === 'bimo' ? 'panda' : animalId === 'lulu' ? 'rabbit' : 'fox');

  const fallbackColors =
    animalId === 'kiko'
      ? { body: '#F97316', belly: '#FFF7ED', accent: '#FACC15', dark: '#1E293B' }
      : animalId === 'bimo'
      ? { body: '#F8FAFC', belly: '#E2E8F0', accent: '#1E293B', dark: '#0F172A' }
      : { body: '#F472B6', belly: '#FDF2F8', accent: '#EC4899', dark: '#1E293B' };

  const colors = characterDef
    ? {
        body: characterDef.primaryColor,
        belly: characterDef.secondaryColor,
        accent: characterDef.accentColor,
        dark: '#0F172A',
      }
    : fallbackColors;

  const bodyMat = new THREE.MeshStandardMaterial({ color: colors.body, roughness: 0.62, metalness: 0.06 });
  const bellyMat = new THREE.MeshStandardMaterial({ color: colors.belly, roughness: 0.75 });
  const accentMat = new THREE.MeshStandardMaterial({ color: colors.accent, roughness: 0.4, metalness: 0.25 });
  const darkMat = new THREE.MeshStandardMaterial({ color: colors.dark, roughness: 0.35, metalness: 0.1 });
  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });
  const cheekMat = new THREE.MeshStandardMaterial({ color: '#FB7185', roughness: 0.8 });

  const scaleMod = 1 + (evolutionStage - 1) * 0.05;
  group.scale.setScalar(scaleMod);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.28, 8, 14), bodyMat);
  torso.position.set(0, 0.34, 0);
  torso.castShadow = true;
  group.add(torso);

  // Belly patch
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 14), bellyMat);
  belly.scale.set(0.9, 1.0, 0.55);
  belly.position.set(0, 0.32, 0.19);
  group.add(belly);

  // Species shoulder/chest detail
  if (shape === 'panda' || shape === 'penguin') {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.34, 0.16, 16), shape === 'panda' ? accentMat : darkMat);
    band.position.set(0, 0.45, 0);
    group.add(band);
  }

  // Ultra-Cute Kawaii Chibi Head (larger rounder proportions & dual eye sparkles!)
  const headGroup = new THREE.Group();
  headGroup.name = 'animalHead';
  headGroup.position.set(0, 0.76, 0.04);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 22, 22), bodyMat);
  head.scale.set(1.12, 0.96, 1.02);
  head.castShadow = true;
  headGroup.add(head);

  // Cute Snout / Beak
  if (shape === 'owl' || shape === 'penguin' || shape === 'duckling') {
    const beakMat = new THREE.MeshStandardMaterial({ color: '#FB923C', roughness: 0.35 });
    if (shape === 'duckling') {
      const bill = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), beakMat);
      bill.scale.set(1.25, 0.55, 1.05);
      bill.position.set(0, -0.05, 0.37);
      headGroup.add(bill);
    } else {
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.18, 12), beakMat);
      beak.rotation.x = Math.PI / 2;
      beak.position.set(0, -0.04, 0.39);
      headGroup.add(beak);
    }
  } else {
    const snout = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 14), bellyMat);
    snout.scale.set(1.18, 0.78, 0.92);
    snout.position.set(0, -0.06, 0.3);
    headGroup.add(snout);

    const noseColor = shape === 'koala' ? '#334155' : shape === 'rabbit' || shape === 'cat' || shape === 'hamster' ? '#FB7185' : colors.dark;
    const nose = new THREE.Mesh(
      new THREE.SphereGeometry(shape === 'koala' ? 0.068 : 0.046, 10, 10),
      new THREE.MeshStandardMaterial({ color: noseColor, roughness: 0.3 })
    );
    if (shape === 'koala') nose.scale.set(0.85, 1.25, 0.8);
    nose.position.set(0, -0.02, 0.42);
    headGroup.add(nose);
  }

  // Big Glossy Kawaii Eyes with Dual White Highlights + Rosy Pastel Cheeks
  const kawaiiCheekMat = new THREE.MeshStandardMaterial({ color: '#FDA4AF', roughness: 0.75 });
  [-0.135, 0.135].forEach((ex) => {
    if (shape === 'panda') {
      const patch = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 12), accentMat);
      patch.scale.set(1, 1.18, 0.42);
      patch.position.set(ex, 0.05, 0.31);
      headGroup.add(patch);
    }
    const eyeY = shape === 'frog' ? 0.25 : 0.05;
    const eyeZ = shape === 'frog' ? 0.2 : 0.33;
    if (shape === 'frog' || shape === 'owl') {
      const eyeRing = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), eyeWhiteMat);
      eyeRing.position.set(ex * 1.1, eyeY, eyeZ - 0.02);
      headGroup.add(eyeRing);
    }
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.066, 14, 14), darkMat);
    eye.position.set(ex, eyeY, eyeZ);
    headGroup.add(eye);

    // Primary large sparkle
    const glint1 = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), eyeWhiteMat);
    glint1.position.set(ex + 0.02, eyeY + 0.024, eyeZ + 0.052);
    headGroup.add(glint1);

    // Secondary mini sparkle for extra cuteness
    const glint2 = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), eyeWhiteMat);
    glint2.position.set(ex - 0.016, eyeY - 0.016, eyeZ + 0.055);
    headGroup.add(glint2);

    const cheek = new THREE.Mesh(
      new THREE.SphereGeometry(shape === 'hamster' ? 0.075 : 0.056, 10, 10),
      kawaiiCheekMat
    );
    cheek.scale.set(1.28, 0.78, 0.45);
    cheek.position.set(ex * 1.52, -0.05, 0.28);
    headGroup.add(cheek);
  });

  // Species Ears / Horns / Mane / Antlers / Tufts
  if (shape === 'fox' || shape === 'cat') {
    [-0.21, 0.21].forEach((ex, idx) => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.12, shape === 'fox' ? 0.3 : 0.24, 12), bodyMat);
      ear.position.set(ex, 0.31, -0.02);
      ear.rotation.z = idx === 0 ? 0.24 : -0.24;
      ear.castShadow = true;
      headGroup.add(ear);

      const inner = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.17, 10), bellyMat);
      inner.position.set(ex, 0.29, 0.03);
      inner.rotation.z = idx === 0 ? 0.24 : -0.24;
      headGroup.add(inner);
    });
  } else if (shape === 'panda' || shape === 'bear' || shape === 'koala' || shape === 'hamster') {
    const earSize = shape === 'koala' ? 0.165 : shape === 'hamster' ? 0.085 : 0.125;
    const earY = shape === 'koala' ? 0.24 : 0.3;
    const earX = shape === 'koala' ? 0.3 : 0.24;
    [-earX, earX].forEach((ex) => {
      const ear = new THREE.Mesh(
        new THREE.SphereGeometry(earSize, 14, 14),
        shape === 'panda' ? accentMat : bodyMat
      );
      ear.position.set(ex, earY, -0.02);
      ear.castShadow = true;
      headGroup.add(ear);
      if (shape === 'koala' || shape === 'bear') {
        const inner = new THREE.Mesh(new THREE.SphereGeometry(earSize * 0.58, 10, 10), bellyMat);
        inner.position.set(ex, earY, 0.06);
        headGroup.add(inner);
      }
    });
  } else if (shape === 'puppy') {
    // Adorable floppy puppy ears
    [-0.31, 0.31].forEach((ex, idx) => {
      const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.22, 6, 10), accentMat);
      ear.position.set(ex, 0.08, 0.02);
      ear.rotation.z = idx === 0 ? 0.35 : -0.35;
      ear.castShadow = true;
      headGroup.add(ear);
    });
  } else if (shape === 'duckling') {
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 8), accentMat);
    tuft.position.set(0, 0.38, 0.04);
    tuft.rotation.z = -0.25;
    headGroup.add(tuft);
  } else if (shape === 'rabbit') {
    [-0.14, 0.14].forEach((ex, idx) => {
      const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.082, 0.34, 6, 10), bodyMat);
      ear.position.set(ex, 0.44, -0.02);
      ear.rotation.z = idx === 0 ? 0.15 : -0.15;
      ear.castShadow = true;
      headGroup.add(ear);

      const inner = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.24, 4, 8), bellyMat);
      inner.position.set(ex, 0.43, 0.035);
      inner.rotation.z = idx === 0 ? 0.15 : -0.15;
      headGroup.add(inner);
    });
  } else if (shape === 'lion') {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.135, 10, 10), accentMat);
      puff.position.set(Math.cos(a) * 0.34, Math.sin(a) * 0.31, -0.06);
      headGroup.add(puff);
    }
    [-0.22, 0.22].forEach((ex) => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.095, 10, 10), bodyMat);
      ear.position.set(ex, 0.3, 0.04);
      headGroup.add(ear);
    });
  } else if (shape === 'owl') {
    [-0.22, 0.22].forEach((ex, idx) => {
      const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.19, 8), accentMat);
      tuft.position.set(ex, 0.32, 0.02);
      tuft.rotation.z = idx === 0 ? 0.4 : -0.4;
      headGroup.add(tuft);
    });
  } else if (shape === 'dragon') {
    [-0.15, 0.15].forEach((ex, idx) => {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.26, 10), accentMat);
      horn.position.set(ex, 0.36, -0.03);
      horn.rotation.z = idx === 0 ? 0.24 : -0.24;
      headGroup.add(horn);
    });
  } else if (shape === 'unicorn') {
    const spiralHorn = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.38, 12),
      new THREE.MeshStandardMaterial({ color: '#FACC15', metalness: 0.65, roughness: 0.2, emissive: '#F59E0B', emissiveIntensity: 0.2 })
    );
    spiralHorn.position.set(0, 0.4, 0.12);
    spiralHorn.rotation.x = 0.25;
    headGroup.add(spiralHorn);
    [-0.2, 0.2].forEach((ex, idx) => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.19, 10), bodyMat);
      ear.position.set(ex, 0.31, -0.02);
      ear.rotation.z = idx === 0 ? 0.25 : -0.25;
      headGroup.add(ear);
    });
  } else if (shape === 'deer') {
    [-0.17, 0.17].forEach((ex, idx) => {
      const antler = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.036, 0.34, 8), accentMat);
      antler.position.set(ex, 0.4, -0.02);
      antler.rotation.z = idx === 0 ? 0.28 : -0.28;
      headGroup.add(antler);
      const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.16, 6), accentMat);
      branch.position.set(ex * 1.45, 0.44, 0.01);
      branch.rotation.z = idx === 0 ? -0.45 : 0.45;
      headGroup.add(branch);
    });
  }

  // Adorable Per-Avatar Cute Accessory (100 unique combinations!)
  const accessory: AvatarAccessory | undefined = characterDef?.accessory;
  if (accessory === 'bow') {
    const bowMat = new THREE.MeshStandardMaterial({ color: colors.accent, roughness: 0.4 });
    const knot = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), bowMat);
    knot.position.set(0.12, 0.34, 0.14);
    headGroup.add(knot);
    [-1, 1].forEach((s) => {
      const loop = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), bowMat);
      loop.scale.set(1.2, 0.8, 0.55);
      loop.position.set(0.12 + s * 0.08, 0.34, 0.14);
      loop.rotation.z = s * 0.25;
      headGroup.add(loop);
    });
  } else if (accessory === 'flower_crown') {
    const petalColors = ['#F472B6', '#FACC15', '#A78BFA', '#38BDF8', '#FB7185'];
    for (let i = 0; i < 5; i++) {
      const ang = -0.8 + i * 0.4;
      const fl = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 10, 10),
        new THREE.MeshStandardMaterial({ color: petalColors[i], roughness: 0.45 })
      );
      fl.position.set(Math.sin(ang) * 0.26, 0.32, Math.cos(ang) * 0.22);
      headGroup.add(fl);
    }
  } else if (accessory === 'star_clip') {
    const star = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.085, 0),
      new THREE.MeshStandardMaterial({ color: '#FACC15', emissive: '#F59E0B', emissiveIntensity: 0.3, roughness: 0.2 })
    );
    star.position.set(-0.22, 0.27, 0.18);
    headGroup.add(star);
  } else if (accessory === 'round_glasses') {
    const rimMat = new THREE.MeshStandardMaterial({ color: '#F59E0B', metalness: 0.65, roughness: 0.25 });
    [-0.135, 0.135].forEach((gx) => {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.018, 8, 18), rimMat);
      rim.position.set(gx, 0.05, 0.39);
      headGroup.add(rim);
    });
  } else if (accessory === 'headphones') {
    const hpMat = new THREE.MeshStandardMaterial({ color: colors.accent, roughness: 0.35 });
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.39, 0.032, 8, 22, Math.PI), hpMat);
    band.position.set(0, 0.05, 0);
    headGroup.add(band);
    [-0.39, 0.39].forEach((hx) => {
      const cup = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), hpMat);
      cup.scale.set(0.55, 1.05, 1.05);
      cup.position.set(hx, 0.03, 0);
      headGroup.add(cup);
    });
  } else if (accessory === 'scarf') {
    const scarfMat = new THREE.MeshStandardMaterial({ color: colors.accent, roughness: 0.55 });
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.065, 10, 20), scarfMat);
    scarf.rotation.x = Math.PI / 2;
    scarf.position.set(0, 0.54, 0.02);
    group.add(scarf);
  } else if (accessory === 'sprout') {
    const stemMat = new THREE.MeshStandardMaterial({ color: '#22C55E', roughness: 0.5 });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.16, 8), stemMat);
    stem.position.set(0, 0.4, 0);
    headGroup.add(stem);
    [-1, 1].forEach((s) => {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 10), stemMat);
      leaf.scale.set(1.4, 0.45, 0.8);
      leaf.position.set(s * 0.07, 0.47, 0);
      leaf.rotation.z = s * -0.4;
      headGroup.add(leaf);
    });
  } else if (accessory === 'beret') {
    const beretMat = new THREE.MeshStandardMaterial({ color: colors.accent, roughness: 0.65 });
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 10), beretMat);
    cap.scale.set(1.15, 0.42, 1.15);
    cap.position.set(0.06, 0.34, 0.02);
    cap.rotation.z = -0.22;
    headGroup.add(cap);
  } else if (accessory === 'mini_crown') {
    const crownMat = new THREE.MeshStandardMaterial({ color: '#FACC15', metalness: 0.85, roughness: 0.2 });
    const cBase = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.11, 8), crownMat);
    cBase.position.set(0, 0.38, 0.02);
    headGroup.add(cBase);
    for (let i = 0; i < 4; i++) {
      const ang = (i * Math.PI) / 2;
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.09, 6), crownMat);
      tip.position.set(Math.cos(ang) * 0.1, 0.46, 0.02 + Math.sin(ang) * 0.1);
      headGroup.add(tip);
    }
  } else if (accessory === 'blush_halo') {
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.21, 0.024, 8, 22),
      new THREE.MeshStandardMaterial({ color: '#FDE047', emissive: '#FACC15', emissiveIntensity: 0.35 })
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.set(0, 0.44, 0);
    headGroup.add(halo);
  }

  // Evolution Stage 2+ Head/Neck Accessories
  if (evolutionStage >= 2) {
    if (animalId === 'kiko') {
      const scarfMat = new THREE.MeshStandardMaterial({ color: '#0EA5E9', roughness: 0.5 });
      const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.055, 10, 20), scarfMat);
      scarf.rotation.x = Math.PI / 2;
      scarf.position.set(0, 0.53, 0.02);
      group.add(scarf);
    } else if (animalId === 'bimo') {
      const helmMat = new THREE.MeshStandardMaterial({ color: '#38BDF8', metalness: 0.55, roughness: 0.25 });
      const helm = new THREE.Mesh(new THREE.SphereGeometry(0.37, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.48), helmMat);
      helm.position.set(0, 0.05, 0);
      headGroup.add(helm);
    } else {
      const frameMat = new THREE.MeshStandardMaterial({ color: '#F59E0B', metalness: 0.6, roughness: 0.3 });
      const lensMat = new THREE.MeshStandardMaterial({ color: '#38BDF8', metalness: 0.8, roughness: 0.1 });
      [-0.12, 0.12].forEach((gx) => {
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.018, 8, 16), frameMat);
        rim.position.set(gx, 0.2, 0.3);
        headGroup.add(rim);
        const glass = new THREE.Mesh(new THREE.CircleGeometry(0.065, 14), lensMat);
        glass.position.set(gx, 0.2, 0.31);
        headGroup.add(glass);
      });
    }
  }

  // Evolution Stage 3+ Back Accessories (Wings / Cape / Jetpack)
  if (evolutionStage >= 3) {
    const backAcc = new THREE.Group();
    backAcc.name = 'backAccessory';
    if (animalId === 'kiko') {
      const wingMat = new THREE.MeshStandardMaterial({ color: '#FACC15', metalness: 0.5, roughness: 0.25 });
      [-1, 1].forEach((side) => {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.18, 0.04), wingMat);
        wing.position.set(side * 0.34, 0.44, -0.22);
        wing.rotation.y = side * -0.45;
        wing.rotation.z = side * 0.25;
        backAcc.add(wing);
      });
    } else if (animalId === 'bimo') {
      const capeMat = new THREE.MeshStandardMaterial({ color: '#10B981', roughness: 0.6, side: THREE.DoubleSide });
      const cape = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.52, 8, 1, true, 0, Math.PI), capeMat);
      cape.position.set(0, 0.36, -0.24);
      cape.rotation.x = 0.25;
      backAcc.add(cape);
    } else {
      const jetMat = new THREE.MeshStandardMaterial({ color: '#0EA5E9', metalness: 0.6, roughness: 0.3 });
      const glowMat = new THREE.MeshBasicMaterial({ color: '#38BDF8' });
      [-0.12, 0.12].forEach((jx) => {
        const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.32, 12), jetMat);
        tank.position.set(jx, 0.38, -0.28);
        backAcc.add(tank);
        const flame = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.14, 10), glowMat);
        flame.rotation.x = Math.PI;
        flame.position.set(jx, 0.18, -0.28);
        backAcc.add(flame);
      });
    }
    group.add(backAcc);
  }

  // Evolution Stage 4 Crown / Cosmic Halo
  if (evolutionStage >= 4) {
    const goldMat = new THREE.MeshStandardMaterial({
      color: '#FACC15',
      metalness: 0.85,
      roughness: 0.18,
      emissive: '#F59E0B',
      emissiveIntensity: 0.25,
    });
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.03, 10, 24), goldMat);
    halo.rotation.x = Math.PI / 2;
    halo.position.set(0, 0.48, 0);
    halo.name = 'evolutionHalo';
    headGroup.add(halo);
  }

  group.add(headGroup);

  // Cute Tail
  const tail = new THREE.Mesh(
    shape === 'fox' || shape === 'dragon' || shape === 'cat'
      ? new THREE.ConeGeometry(0.12, 0.4, 12)
      : new THREE.SphereGeometry(0.12, 10, 10),
    shape === 'fox' || shape === 'dragon' ? bodyMat : bellyMat
  );
  tail.name = 'animalTail';
  tail.position.set(0, 0.22, -0.34);
  if (shape === 'fox' || shape === 'dragon' || shape === 'cat') tail.rotation.x = -Math.PI / 3;
  group.add(tail);

  // Standing Paws & Feet (for Walking, Flying, and Victory Podium)
  if (standing) {
    ([-1, 1] as const).forEach((side) => {
      const armPivot = new THREE.Group();
      armPivot.name = side === -1 ? 'leftArm' : 'rightArm';
      armPivot.position.set(side * 0.31, 0.44, 0.04);

      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.2, 6, 10), bodyMat);
      arm.position.set(side * 0.06, -0.1, 0.04);
      arm.rotation.z = side * 0.35;
      arm.castShadow = true;
      armPivot.add(arm);

      const paw = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 10), bellyMat);
      paw.position.set(side * 0.11, -0.22, 0.08);
      armPivot.add(paw);

      group.add(armPivot);

      const footPivot = new THREE.Group();
      footPivot.name = side === -1 ? 'leftFoot' : 'rightFoot';
      footPivot.position.set(side * 0.15, 0.16, 0.02);

      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.12, 6, 8), bodyMat);
      leg.position.set(0, -0.05, 0.02);
      footPivot.add(leg);

      const foot = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 12, 12),
        shape === 'panda' ? accentMat : bellyMat
      );
      foot.scale.set(0.95, 0.65, 1.35);
      foot.position.set(0, -0.1, 0.07);
      foot.castShadow = true;
      footPivot.add(foot);
      group.add(footPivot);
    });
  }

  // Deployable Sky-Flight Wings for 'Terbang' Action
  if (includeFlightWings) {
    const flightWings = new THREE.Group();
    flightWings.name = 'flightWings';
    flightWings.position.set(0, 0.45, -0.2);
    flightWings.visible = false;

    const wingPrimaryMat = new THREE.MeshStandardMaterial({
      color: colors.accent,
      emissive: colors.accent,
      emissiveIntensity: 0.22,
      roughness: 0.3,
      metalness: 0.25,
    });
    const wingTipMat = new THREE.MeshStandardMaterial({
      color: '#FEF08A',
      emissive: '#FACC15',
      emissiveIntensity: 0.35,
      roughness: 0.25,
    });

    ([-1, 1] as const).forEach((side) => {
      const wingPivot = new THREE.Group();
      wingPivot.name = side === -1 ? 'flyWingL' : 'flyWingR';
      wingPivot.position.set(side * 0.22, 0, 0);

      const mainBlade = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.06, 0.34), wingPrimaryMat);
      mainBlade.position.set(side * 0.38, 0, -0.04);
      mainBlade.rotation.y = side * -0.18;
      mainBlade.castShadow = true;
      wingPivot.add(mainBlade);

      const featherTip = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.045, 0.22), wingTipMat);
      featherTip.position.set(side * 0.82, 0.02, -0.12);
      featherTip.rotation.y = side * -0.32;
      wingPivot.add(featherTip);

      flightWings.add(wingPivot);
    });

    group.add(flightWings);
  }

  return group;
}

export interface StandaloneCharacterRig {
  root: THREE.Group;
  charGroup: THREE.Group;
  head?: THREE.Object3D;
  leftArm?: THREE.Object3D;
  rightArm?: THREE.Object3D;
  leftFoot?: THREE.Object3D;
  rightFoot?: THREE.Object3D;
  tail?: THREE.Object3D;
  halo?: THREE.Object3D;
  backAccessory?: THREE.Object3D;
  flightWings?: THREE.Object3D;
  flyWingL?: THREE.Object3D;
  flyWingR?: THREE.Object3D;
}

export function buildStandaloneCharacterRig(
  animalId: AnimalId,
  evolutionStage: 1 | 2 | 3 | 4,
  characterDef?: CharacterDef
): StandaloneCharacterRig {
  const root = new THREE.Group();
  const charGroup = buildAnimalMesh(animalId, evolutionStage, true, characterDef, true);
  charGroup.scale.multiplyScalar(1.38);
  root.add(charGroup);

  return {
    root,
    charGroup,
    head: charGroup.getObjectByName('animalHead'),
    leftArm: charGroup.getObjectByName('leftArm'),
    rightArm: charGroup.getObjectByName('rightArm'),
    leftFoot: charGroup.getObjectByName('leftFoot'),
    rightFoot: charGroup.getObjectByName('rightFoot'),
    tail: charGroup.getObjectByName('animalTail'),
    halo: charGroup.getObjectByName('evolutionHalo'),
    backAccessory: charGroup.getObjectByName('backAccessory'),
    flightWings: charGroup.getObjectByName('flightWings'),
    flyWingL: charGroup.getObjectByName('flyWingL'),
    flyWingR: charGroup.getObjectByName('flyWingR'),
  };
}

function buildWheelMesh(wheelStyle: VehicleCustomization['wheelStyle'], radius: number, width: number): THREE.Group {
  const wheel = new THREE.Group();
  const tireMat = new THREE.MeshStandardMaterial({
    color: wheelStyle === 'rainbow' ? '#EC4899' : '#1E293B',
    roughness: 0.85,
    metalness: 0.05,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color:
      wheelStyle === 'star'
        ? '#FACC15'
        : wheelStyle === 'rainbow'
        ? '#38BDF8'
        : wheelStyle === 'monster'
        ? '#F97316'
        : '#E2E8F0',
    metalness: 0.7,
    roughness: 0.25,
  });

  const tireRadius = wheelStyle === 'monster' ? radius * 1.2 : radius;
  const tireWidth = wheelStyle === 'monster' ? width * 1.35 : width;

  const tire = new THREE.Mesh(new THREE.CylinderGeometry(tireRadius, tireRadius, tireWidth, 20), tireMat);
  tire.rotation.z = Math.PI / 2;
  tire.castShadow = true;
  wheel.add(tire);

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(tireRadius * 0.56, tireRadius * 0.56, tireWidth + 0.02, 16), rimMat);
  hub.rotation.z = Math.PI / 2;
  wheel.add(hub);

  if (wheelStyle === 'star') {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(tireWidth + 0.04, tireRadius * 0.8, 0.08), new THREE.MeshStandardMaterial({ color: '#FFFFFF', metalness: 0.6, roughness: 0.2 }));
    wheel.add(spoke);
  }

  return wheel;
}

function buildRoofHat(hatStyle: VehicleCustomization['hatStyle'], yPos: number, zPos: number): THREE.Group {
  const hat = new THREE.Group();
  hat.position.set(0, yPos, zPos);

  if (hatStyle === 'propeller') {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.05, 0.24, 10),
      new THREE.MeshStandardMaterial({ color: '#EF4444', roughness: 0.4 })
    );
    pole.position.y = 0.12;
    hat.add(pole);

    const bladeGroup = new THREE.Group();
    bladeGroup.name = 'propellerBlade';
    bladeGroup.position.y = 0.25;
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.04, 0.14),
      new THREE.MeshStandardMaterial({ color: '#FACC15', metalness: 0.4, roughness: 0.3 })
    );
    bladeGroup.add(blade);
    hat.add(bladeGroup);
  } else if (hatStyle === 'crown') {
    const crownMat = new THREE.MeshStandardMaterial({ color: '#FACC15', metalness: 0.85, roughness: 0.2 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.19, 0.18, 8), crownMat);
    base.position.y = 0.09;
    hat.add(base);
    for (let i = 0; i < 4; i++) {
      const ang = (i * Math.PI) / 2;
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 6), crownMat);
      tip.position.set(Math.cos(ang) * 0.18, 0.23, Math.sin(ang) * 0.18);
      hat.add(tip);
    }
  } else if (hatStyle === 'siren') {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.08, 14), new THREE.MeshStandardMaterial({ color: '#1E293B' }));
    base.position.y = 0.04;
    hat.add(base);
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 14, 14),
      new THREE.MeshStandardMaterial({ color: '#38BDF8', emissive: '#0EA5E9', emissiveIntensity: 0.6, roughness: 0.15 })
    );
    dome.position.y = 0.12;
    hat.add(dome);
  } else if (hatStyle === 'wings') {
    const wingMat = new THREE.MeshStandardMaterial({ color: '#F8FAFC', roughness: 0.35, metalness: 0.1 });
    [-1, 1].forEach((side) => {
      const w = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.24), wingMat);
      w.position.set(side * 0.42, 0.05, 0);
      w.rotation.z = side * 0.28;
      hat.add(w);
    });
  }

  return hat;
}

export function buildVehicleMesh(
  customization: VehicleCustomization,
  animalId: AnimalId,
  evolutionStage: 1 | 2 | 3 | 4,
  characterDef?: CharacterDef
): { root: THREE.Group; wheels: THREE.Object3D[]; propeller?: THREE.Object3D } {
  const root = new THREE.Group();
  const wheels: THREE.Object3D[] = [];
  let propeller: THREE.Object3D | undefined;

  const paintMat = new THREE.MeshPhysicalMaterial({
    color: customization.bodyColor,
    roughness: 0.25,
    metalness: 0.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.12,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: '#F8FAFC',
    roughness: 0.4,
    metalness: 0.15,
  });
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: '#334155',
    roughness: 0.4,
    metalness: 0.7,
  });
  const headlightMat = new THREE.MeshStandardMaterial({
    color: '#FEF08A',
    emissive: '#FDE047',
    emissiveIntensity: 0.85,
    roughness: 0.2,
  });
  const tailLightMat = new THREE.MeshStandardMaterial({
    color: '#FB7185',
    emissive: '#E11D48',
    emissiveIntensity: 0.65,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: '#BAE6FD',
    roughness: 0.1,
    metalness: 0.3,
    transparent: true,
    opacity: 0.72,
  });

  const animal = buildAnimalMesh(animalId, evolutionStage, false, characterDef);

  if (customization.vehicleType === 'car') {
    // 1. Primary hull
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.56, 2.55), paintMat);
    chassis.position.set(0, 0.54, 0);
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    root.add(chassis);

    // Rounded hood nose
    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.42, 0.75), paintMat);
    hood.position.set(0, 0.5, 1.18);
    hood.castShadow = true;
    root.add(hood);

    // Racing stripe
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 2.52), trimMat);
    stripe.position.set(0, 0.83, 0.18);
    root.add(stripe);

    // Front & rear bumpers
    const frontBumper = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 1.35, 6, 10), trimMat);
    frontBumper.rotation.z = Math.PI / 2;
    frontBumper.position.set(0, 0.32, 1.56);
    root.add(frontBumper);

    const rearBumper = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 1.35, 6, 10), trimMat);
    rearBumper.rotation.z = Math.PI / 2;
    rearBumper.position.set(0, 0.32, -1.32);
    root.add(rearBumper);

    // Cute windshield
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.42, 0.08), glassMat);
    windshield.position.set(0, 0.98, 0.68);
    windshield.rotation.x = -0.35;
    root.add(windshield);

    // Cute round headlights
    [-0.48, 0.48].forEach((hx) => {
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 14), headlightMat);
      lamp.scale.set(1, 1, 0.55);
      lamp.position.set(hx, 0.58, 1.53);
      root.add(lamp);

      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.08), tailLightMat);
      tail.position.set(hx, 0.58, -1.29);
      root.add(tail);
    });

    // Rear spoiler
    const spoilerWing = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.08, 0.32), paintMat);
    spoilerWing.position.set(0, 1.05, -1.16);
    root.add(spoilerWing);
    [-0.48, 0.48].forEach((sx) => {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.16), darkMetalMat);
      strut.position.set(sx, 0.92, -1.14);
      root.add(strut);
    });

    // Dual exhaust pipes
    [-0.26, 0.26].forEach((ex) => {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.28, 12), darkMetalMat);
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(ex, 0.34, -1.38);
      root.add(pipe);
    });

    // 4 Spinning Wheels
    const wheelOffsets: [number, number, number][] = [
      [-0.86, 0.34, 0.85],
      [0.86, 0.34, 0.85],
      [-0.86, 0.34, -0.82],
      [0.86, 0.34, -0.82],
    ];
    wheelOffsets.forEach(([wx, wy, wz]) => {
      const w = buildWheelMesh(customization.wheelStyle, 0.34, 0.24);
      w.position.set(wx, wy, wz);
      wheels.push(w);
      root.add(w);
    });

    // Seat animal inside open-top kart
    animal.position.set(0, 0.64, -0.08);
    root.add(animal);

    // Optional roof/spoiler accessory
    const hat = buildRoofHat(customization.hatStyle, 1.1, -1.12);
    root.add(hat);
    propeller = hat.getObjectByName('propellerBlade');
  } else {
    // Cute Scooter / Mini Motorcycle
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 1.25, 10, 16), paintMat);
    body.rotation.x = Math.PI / 2;
    body.position.set(0, 0.56, 0);
    body.castShadow = true;
    root.add(body);

    // Front fairing / shield
    const fairing = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 0.78, 14), paintMat);
    fairing.position.set(0, 0.72, 0.78);
    fairing.rotation.x = -0.25;
    fairing.castShadow = true;
    root.add(fairing);

    // Handlebars
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.96, 10), darkMetalMat);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 1.08, 0.68);
    root.add(bar);

    [-0.45, 0.45].forEach((gx) => {
      const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.18, 10), trimMat);
      grip.rotation.z = Math.PI / 2;
      grip.position.set(gx, 1.08, 0.68);
      root.add(grip);
    });

    // Cute round headlight
    const headlamp = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 14), headlightMat);
    headlamp.position.set(0, 0.88, 0.96);
    root.add(headlamp);

    // Cozy leather seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.16, 0.75), darkMetalMat);
    seat.position.set(0, 0.78, -0.18);
    root.add(seat);

    // Exhaust pipe
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 0.65, 12), darkMetalMat);
    exhaust.rotation.x = Math.PI / 2 + 0.12;
    exhaust.position.set(0.34, 0.38, -0.78);
    root.add(exhaust);

    // 2 Wheels
    const frontWheel = buildWheelMesh(customization.wheelStyle, 0.36, 0.24);
    frontWheel.position.set(0, 0.36, 0.92);
    wheels.push(frontWheel);
    root.add(frontWheel);

    const rearWheel = buildWheelMesh(customization.wheelStyle, 0.38, 0.28);
    rearWheel.position.set(0, 0.38, -0.85);
    wheels.push(rearWheel);
    root.add(rearWheel);

    // Seat animal on motorcycle
    animal.position.set(0, 0.78, -0.14);
    root.add(animal);

    const hat = buildRoofHat(customization.hatStyle, 1.18, 0.78);
    root.add(hat);
    propeller = hat.getObjectByName('propellerBlade');
  }

  return { root, wheels, propeller };
}

export function buildObstacleMesh(kind: ObstacleKind, biome: BiomeId): THREE.Group {
  const g = new THREE.Group();

  if (kind === 'cone') {
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.12, 0.95), new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.7 }));
    base.position.y = 0.06;
    g.add(base);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.38, 1.05, 16), new THREE.MeshStandardMaterial({ color: '#F97316', roughness: 0.4 }));
    cone.position.y = 0.64;
    cone.castShadow = true;
    g.add(cone);
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.29, 0.22, 16), new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.3 }));
    stripe.position.y = 0.62;
    g.add(stripe);
  } else if (kind === 'crate') {
    const wood = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.05, 1.1), new THREE.MeshStandardMaterial({ color: '#D97706', roughness: 0.8 }));
    wood.position.y = 0.525;
    wood.castShadow = true;
    g.add(wood);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.16, 1.16), new THREE.MeshStandardMaterial({ color: '#92400E', roughness: 0.75 }));
    frame.position.y = 0.96;
    g.add(frame);
  } else if (kind === 'rock') {
    const color =
      biome === 'gurun'
        ? '#B45309'
        : biome === 'pasir_batu'
        ? '#78716C'
        : biome === 'lumpur'
        ? '#57534E'
        : '#64748B';
    const rock1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65, 0), new THREE.MeshStandardMaterial({ color, roughness: 0.9 }));
    rock1.position.set(0, 0.52, 0);
    rock1.castShadow = true;
    g.add(rock1);
    const rock2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38, 0), new THREE.MeshStandardMaterial({ color, roughness: 0.85 }));
    rock2.position.set(0.45, 0.32, 0.18);
    g.add(rock2);
  } else if (kind === 'jump_bar') {
    const postMat = new THREE.MeshStandardMaterial({ color: '#E11D48', roughness: 0.4 });
    [-0.95, 0.95].forEach((px) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.85, 12), postMat);
      post.position.set(px, 0.425, 0);
      post.castShadow = true;
      g.add(post);
    });
    const bar = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.24, 0.24), new THREE.MeshStandardMaterial({ color: '#FACC15', roughness: 0.35 }));
    bar.position.set(0, 0.66, 0);
    bar.castShadow = true;
    g.add(bar);
  } else if (kind === 'barrier_high') {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(1.75, 2.35, 0.55), new THREE.MeshStandardMaterial({ color: '#EF4444', roughness: 0.5 }));
    wall.position.y = 1.175;
    wall.castShadow = true;
    g.add(wall);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.45, 0.6), new THREE.MeshStandardMaterial({ color: '#FEF08A', roughness: 0.3 }));
    sign.position.y = 1.75;
    g.add(sign);
  } else {
    // 'mover' rolling boulder / energy ball
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.62, 18, 18),
      new THREE.MeshStandardMaterial({
        color: biome === 'kota_bukit' ? '#EC4899' : '#38BDF8',
        emissive: biome === 'kota_bukit' ? '#DB2777' : '#0284C7',
        emissiveIntensity: 0.35,
        roughness: 0.3,
      })
    );
    ball.position.y = 0.62;
    ball.castShadow = true;
    g.add(ball);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.06, 8, 20), new THREE.MeshStandardMaterial({ color: '#FACC15', metalness: 0.7, roughness: 0.2 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.62;
    g.add(ring);
  }

  return g;
}

export function buildSceneryProp(biome: BiomeId, randVal: number): THREE.Group {
  const g = new THREE.Group();

  if (biome === 'pedesaan') {
    if (randVal > 0.62) {
      // Cozy red barn / farmhouse
      const walls = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.9, 2.4), new THREE.MeshStandardMaterial({ color: '#EF4444', roughness: 0.75 }));
      walls.position.y = 0.95;
      g.add(walls);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(2.1, 1.3, 4), new THREE.MeshStandardMaterial({ color: '#78350F', roughness: 0.8 }));
      roof.position.y = 2.55;
      roof.rotation.y = Math.PI / 4;
      g.add(roof);
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 0.1), new THREE.MeshStandardMaterial({ color: '#FEF3C7', roughness: 0.6 }));
      door.position.set(0, 0.55, 1.21);
      g.add(door);
    } else if (randVal > 0.3) {
      // Golden hay bale + wooden fence
      const bale = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.1, 14), new THREE.MeshStandardMaterial({ color: '#EAB308', roughness: 0.9 }));
      bale.rotation.z = Math.PI / 2;
      bale.position.y = 0.75;
      g.add(bale);
    } else {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 1.6, 10), new THREE.MeshStandardMaterial({ color: '#92400E', roughness: 0.9 }));
      trunk.position.y = 0.8;
      g.add(trunk);
      const crown = new THREE.Mesh(new THREE.SphereGeometry(1.15, 12, 12), new THREE.MeshStandardMaterial({ color: '#22C55E', roughness: 0.75 }));
      crown.position.y = 2.2;
      g.add(crown);
    }
  } else if (biome === 'hutan') {
    // Tall layered forest trees & bushes
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.38, 2.2, 10), new THREE.MeshStandardMaterial({ color: '#78350F', roughness: 0.9 }));
    trunk.position.y = 1.1;
    g.add(trunk);
    const tier1 = new THREE.Mesh(new THREE.ConeGeometry(1.5, 2.1, 10), new THREE.MeshStandardMaterial({ color: '#166534', roughness: 0.78 }));
    tier1.position.y = 2.6;
    g.add(tier1);
    const tier2 = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.8, 10), new THREE.MeshStandardMaterial({ color: randVal > 0.5 ? '#22C55E' : '#15803D', roughness: 0.72 }));
    tier2.position.y = 3.7;
    g.add(tier2);
  } else if (biome === 'lumpur') {
    // Mud puddles + jungle reeds / mossy log
    const puddle = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.4, 0.06, 16),
      new THREE.MeshStandardMaterial({ color: '#5C3A21', roughness: 0.25, metalness: 0.15 })
    );
    puddle.position.y = 0.03;
    g.add(puddle);
    const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 1.1, 10), new THREE.MeshStandardMaterial({ color: '#78350F', roughness: 0.9 }));
    stump.position.set(0.8, 0.55, 0);
    g.add(stump);
    const moss = new THREE.Mesh(new THREE.SphereGeometry(0.46, 10, 10), new THREE.MeshStandardMaterial({ color: '#65A30D', roughness: 0.85 }));
    moss.scale.set(1, 0.4, 1);
    moss.position.set(0.8, 1.1, 0);
    g.add(moss);
  } else if (biome === 'pasir_batu') {
    // Stacked rocky boulders & desert scrub
    const rockMat = new THREE.MeshStandardMaterial({ color: randVal > 0.5 ? '#78716C' : '#A8A29E', roughness: 0.92 });
    const r1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.15, 0), rockMat);
    r1.position.y = 0.85;
    g.add(r1);
    const r2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7, 0), rockMat);
    r2.position.set(0.85, 0.55, 0.4);
    g.add(r2);
  } else if (biome === 'gurun') {
    if (randVal > 0.45) {
      // Oasis palm tree
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 3.0, 10), new THREE.MeshStandardMaterial({ color: '#92400E', roughness: 0.85 }));
      trunk.position.y = 1.5;
      trunk.rotation.z = 0.1;
      g.add(trunk);
      const leafMat = new THREE.MeshStandardMaterial({ color: '#16A34A', roughness: 0.7 });
      for (let i = 0; i < 5; i++) {
        const frond = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 0.45), leafMat);
        const a = (i / 5) * Math.PI * 2;
        frond.position.set(Math.cos(a) * 0.7 - 0.12, 2.95, Math.sin(a) * 0.7);
        frond.rotation.y = -a;
        frond.rotation.z = -0.35;
        g.add(frond);
      }
    } else {
      const cactusMat = new THREE.MeshStandardMaterial({ color: '#15803D', roughness: 0.8 });
      const stem = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 1.8, 6, 10), cactusMat);
      stem.position.y = 1.1;
      g.add(stem);
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.7, 6, 8), cactusMat);
      arm.position.set(0.36, 1.4, 0);
      arm.rotation.z = -0.4;
      g.add(arm);
    }
  } else if (biome === 'perkampungan') {
    // Colorful village cottage with pitched roof & window
    const wallColors = ['#FEF3C7', '#E0F2FE', '#FCE7F3', '#DCFCE7'];
    const roofColors = ['#EF4444', '#0EA5E9', '#F59E0B', '#8B5CF6'];
    const ci = Math.floor(randVal * 4) % 4;
    const house = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.0, 2.3), new THREE.MeshStandardMaterial({ color: wallColors[ci], roughness: 0.7 }));
    house.position.y = 1.0;
    g.add(house);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.1, 1.25, 4), new THREE.MeshStandardMaterial({ color: roofColors[ci], roughness: 0.6 }));
    roof.position.y = 2.6;
    roof.rotation.y = Math.PI / 4;
    g.add(roof);
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.08), new THREE.MeshStandardMaterial({ color: '#38BDF8', emissive: '#0284C7', emissiveIntensity: 0.35 }));
    win.position.set(0, 1.1, 1.16);
    g.add(win);
  } else {
    // kota_bukit: cheerful multi-story town building
    const h = 3.0 + randVal * 2.8;
    const bldg = new THREE.Mesh(
      new THREE.BoxGeometry(2.3, h, 2.3),
      new THREE.MeshStandardMaterial({ color: randVal > 0.5 ? '#38BDF8' : '#A855F7', roughness: 0.4, metalness: 0.15 })
    );
    bldg.position.y = h / 2;
    g.add(bldg);
    const band = new THREE.Mesh(new THREE.BoxGeometry(2.38, 0.35, 2.38), new THREE.MeshBasicMaterial({ color: '#FEF08A' }));
    band.position.y = h * 0.72;
    g.add(band);
  }

  return g;
}

export function buildLivingCreatureMesh(kind: LivingCreatureKind): THREE.Group {
  const g = new THREE.Group();

  if (kind === 'butterfly') {
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.45, 6, 8), new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.5 }));
    body.rotation.x = Math.PI / 2;
    body.position.y = 1.1;
    g.add(body);

    const wingMat = new THREE.MeshStandardMaterial({ color: '#F472B6', emissive: '#EC4899', emissiveIntensity: 0.2, roughness: 0.35, side: THREE.DoubleSide });
    [-1, 1].forEach((side) => {
      const wing = new THREE.Mesh(new THREE.CircleGeometry(0.48, 12), wingMat);
      wing.position.set(side * 0.38, 1.14, 0);
      wing.rotation.x = -Math.PI / 2;
      wing.name = side < 0 ? 'wingL' : 'wingR';
      g.add(wing);
    });
  } else if (kind === 'bird') {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 14), new THREE.MeshStandardMaterial({ color: '#38BDF8', roughness: 0.5 }));
    body.scale.set(0.9, 0.9, 1.25);
    body.position.y = 1.25;
    g.add(body);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.24, 8), new THREE.MeshStandardMaterial({ color: '#F59E0B' }));
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, 1.25, 0.42);
    g.add(beak);
    const wingMat = new THREE.MeshStandardMaterial({ color: '#BAE6FD', roughness: 0.45 });
    [-1, 1].forEach((side) => {
      const w = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 0.28), wingMat);
      w.position.set(side * 0.42, 1.3, 0);
      w.name = side < 0 ? 'wingL' : 'wingR';
      g.add(w);
    });
  } else if (kind === 'sheep') {
    const woolMat = new THREE.MeshStandardMaterial({ color: '#F8FAFC', roughness: 0.9 });
    const darkMat = new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.6 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.52, 14, 14), woolMat);
    body.scale.set(1, 0.9, 1.25);
    body.position.y = 0.64;
    body.castShadow = true;
    g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 12), darkMat);
    head.position.set(0, 0.85, 0.56);
    g.add(head);
    [-0.22, 0.22].forEach((lx) => {
      [-0.25, 0.25].forEach((lz) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.34, 8), darkMat);
        leg.position.set(lx, 0.17, lz);
        g.add(leg);
      });
    });
  } else if (kind === 'turtle') {
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: '#15803D', roughness: 0.5 })
    );
    shell.position.y = 0.22;
    shell.castShadow = true;
    g.add(shell);
    const skinMat = new THREE.MeshStandardMaterial({ color: '#84CC16', roughness: 0.7 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), skinMat);
    head.position.set(0, 0.34, 0.62);
    g.add(head);
    [-0.36, 0.36].forEach((lx) => {
      [-0.28, 0.28].forEach((lz) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.22, 8), skinMat);
        leg.position.set(lx, 0.11, lz);
        g.add(leg);
      });
    });
  } else if (kind === 'camel') {
    const furMat = new THREE.MeshStandardMaterial({ color: '#D97706', roughness: 0.8 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.58, 1.15), furMat);
    body.position.y = 0.85;
    body.castShadow = true;
    g.add(body);
    const hump = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 12), furMat);
    hump.position.set(0, 1.22, 0);
    g.add(hump);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.72, 10), furMat);
    neck.position.set(0, 1.25, 0.62);
    neck.rotation.x = 0.35;
    g.add(neck);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), furMat);
    head.position.set(0, 1.56, 0.82);
    g.add(head);
    [-0.22, 0.22].forEach((lx) => {
      [-0.4, 0.4].forEach((lz) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.6, 8), furMat);
        leg.position.set(lx, 0.3, lz);
        g.add(leg);
      });
    });
  } else if (kind === 'frog') {
    const greenMat = new THREE.MeshStandardMaterial({ color: '#22C55E', roughness: 0.45 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 14), greenMat);
    body.scale.set(1.15, 0.78, 1.15);
    body.position.y = 0.34;
    body.castShadow = true;
    g.add(body);
    [-0.18, 0.18].forEach((ex) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), new THREE.MeshStandardMaterial({ color: '#FEF08A' }));
      eye.position.set(ex, 0.65, 0.24);
      g.add(eye);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshBasicMaterial({ color: '#0F172A' }));
      pupil.position.set(ex, 0.68, 0.33);
      g.add(pupil);
    });
  } else if (kind === 'fish') {
    const fishMat = new THREE.MeshStandardMaterial({ color: '#F97316', roughness: 0.25, metalness: 0.15 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 14), fishMat);
    body.scale.set(0.65, 0.85, 1.45);
    body.position.y = 0.85;
    g.add(body);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.38, 4), fishMat);
    tail.rotation.x = Math.PI / 2;
    tail.position.set(0, 0.85, -0.62);
    g.add(tail);
  } else {
    // Wild hopping rabbit
    const furMat = new THREE.MeshStandardMaterial({ color: '#F1F5F9', roughness: 0.7 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 14), furMat);
    body.position.y = 0.38;
    body.castShadow = true;
    g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 12), furMat);
    head.position.set(0, 0.72, 0.24);
    g.add(head);
    [-0.1, 0.1].forEach((ex) => {
      const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.28, 4, 8), furMat);
      ear.position.set(ex, 1.05, 0.22);
      g.add(ear);
    });
  }

  return g;
}

export function buildHeartPickupMesh(): THREE.Group {
  const g = new THREE.Group();
  const heartMat = new THREE.MeshStandardMaterial({
    color: '#F43F5E',
    emissive: '#E11D48',
    emissiveIntensity: 0.45,
    roughness: 0.2,
    metalness: 0.2,
  });
  // Stylized 3D heart from two spheres + lower diamond cone
  const leftLobe = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), heartMat);
  leftLobe.position.set(-0.18, 0.22, 0);
  g.add(leftLobe);
  const rightLobe = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), heartMat);
  rightLobe.position.set(0.18, 0.22, 0);
  g.add(rightLobe);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.56, 12), heartMat);
  tip.rotation.x = Math.PI;
  tip.position.set(0, -0.08, 0);
  g.add(tip);

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.58, 0.045, 8, 24),
    new THREE.MeshBasicMaterial({ color: '#FEF08A' })
  );
  halo.position.y = 0.08;
  g.add(halo);
  return g;
}

export function buildMonsterMesh(kind: MonsterKind, biome: BiomeId): THREE.Group {
  const g = new THREE.Group();
  const eyeWhite = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });
  const eyeDark = new THREE.MeshBasicMaterial({ color: '#0F172A' });

  if (kind === 'slime') {
    const color = biome === 'lumpur' ? '#713F12' : biome === 'hutan' ? '#16A34A' : '#8B5CF6';
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.25,
      metalness: 0.1,
      emissive: color,
      emissiveIntensity: 0.15,
    });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.75, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.65), mat);
    body.scale.set(1.15, 0.95, 1.15);
    body.position.y = 0.25;
    body.castShadow = true;
    g.add(body);

    [-0.28, 0.28].forEach((ex) => {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 8), new THREE.MeshStandardMaterial({ color: '#FACC15' }));
      horn.position.set(ex, 0.92, 0.1);
      g.add(horn);

      const ew = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), eyeWhite);
      ew.position.set(ex, 0.58, 0.68);
      g.add(ew);
      const ed = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), eyeDark);
      ed.position.set(ex, 0.58, 0.79);
      g.add(ed);
    });
  } else if (kind === 'golem') {
    const stoneColor = biome === 'gurun' ? '#D97706' : '#78716C';
    const stoneMat = new THREE.MeshStandardMaterial({ color: stoneColor, roughness: 0.9 });
    const torso = new THREE.Mesh(new THREE.DodecahedronGeometry(0.72, 0), stoneMat);
    torso.position.y = 0.85;
    torso.castShadow = true;
    g.add(torso);

    [-0.82, 0.82].forEach((ax) => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.72, 0.32), stoneMat);
      arm.position.set(ax, 0.8, 0.1);
      arm.name = ax < 0 ? 'armL' : 'armR';
      arm.castShadow = true;
      g.add(arm);
    });

    const eyeGlow = new THREE.MeshBasicMaterial({ color: '#FACC15' });
    [-0.22, 0.22].forEach((ex) => {
      const e = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.1), eyeGlow);
      e.position.set(ex, 0.98, 0.65);
      g.add(e);
    });
  } else if (kind === 'spiky') {
    const bodyMat = new THREE.MeshStandardMaterial({
      color: '#E11D48',
      roughness: 0.45,
      emissive: '#9F1239',
      emissiveIntensity: 0.2,
    });
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 16), bodyMat);
    core.position.y = 0.72;
    core.castShadow = true;
    g.add(core);

    const spikeMat = new THREE.MeshStandardMaterial({ color: '#FDE047', roughness: 0.35 });
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.42, 8), spikeMat);
      sp.position.set(Math.cos(ang) * 0.65, 0.72, Math.sin(ang) * 0.65);
      sp.rotation.z = -Math.cos(ang) * (Math.PI / 2);
      sp.rotation.x = Math.sin(ang) * (Math.PI / 2);
      g.add(sp);
    }

    [-0.2, 0.2].forEach((ex) => {
      const ew = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), eyeWhite);
      ew.position.set(ex, 0.82, 0.56);
      g.add(ew);
      const ed = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), eyeDark);
      ed.position.set(ex, 0.82, 0.67);
      g.add(ed);
    });
  } else {
    // 'bot': mischievous city/village toy robot monster
    const bodyMat = new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.65, roughness: 0.25 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.95, 0.85), bodyMat);
    body.position.y = 0.72;
    body.castShadow = true;
    g.add(body);

    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.76, 0.26, 0.1),
      new THREE.MeshBasicMaterial({ color: '#F43F5E' })
    );
    visor.position.set(0, 0.85, 0.45);
    g.add(visor);

    const antenna = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 10, 10),
      new THREE.MeshBasicMaterial({ color: '#FACC15' })
    );
    antenna.position.set(0, 1.38, 0);
    g.add(antenna);
  }

  // Reddish warning ground ring so players recognize monsters clearly
  const warnRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.92, 0.06, 8, 24),
    new THREE.MeshBasicMaterial({ color: '#EF4444' })
  );
  warnRing.rotation.x = Math.PI / 2;
  warnRing.position.y = 0.06;
  warnRing.name = 'warnRing';
  g.add(warnRing);

  return g;
}

export function buildSceneryPropFromTheme(theme: ArenaThemeConfig, randVal: number): THREE.Group {
  const g = new THREE.Group();
  const arch = theme.propArchetype;

  if (arch === 'sakura') {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 2.0, 10), new THREE.MeshStandardMaterial({ color: '#78350F', roughness: 0.9 }));
    trunk.position.y = 1.0;
    g.add(trunk);
    const blossomMat = new THREE.MeshStandardMaterial({ color: randVal > 0.35 ? '#F472B6' : theme.accentPropColor, roughness: 0.7 });
    const c1 = new THREE.Mesh(new THREE.SphereGeometry(1.3, 12, 12), blossomMat);
    c1.position.y = 2.45;
    g.add(c1);
    const c2 = new THREE.Mesh(new THREE.SphereGeometry(0.85, 10, 10), new THREE.MeshStandardMaterial({ color: '#FBCFE8', roughness: 0.7 }));
    c2.position.set(0.65, 2.2, 0.35);
    g.add(c2);
  } else if (arch === 'pine') {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.36, 2.2, 10), new THREE.MeshStandardMaterial({ color: '#78350F', roughness: 0.9 }));
    trunk.position.y = 1.1;
    g.add(trunk);
    const tier1 = new THREE.Mesh(new THREE.ConeGeometry(1.5, 2.1, 10), new THREE.MeshStandardMaterial({ color: '#166534', roughness: 0.78 }));
    tier1.position.y = 2.6;
    g.add(tier1);
    const tier2 = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.8, 10), new THREE.MeshStandardMaterial({ color: theme.weatherKind === 'snow' ? '#F8FAFC' : '#22C55E', roughness: 0.72 }));
    tier2.position.y = 3.7;
    g.add(tier2);
  } else if (arch === 'palm') {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 3.0, 10), new THREE.MeshStandardMaterial({ color: '#92400E', roughness: 0.85 }));
    trunk.position.y = 1.5;
    trunk.rotation.z = 0.1;
    g.add(trunk);
    const leafMat = new THREE.MeshStandardMaterial({ color: '#16A34A', roughness: 0.7 });
    for (let i = 0; i < 5; i++) {
      const frond = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 0.45), leafMat);
      const a = (i / 5) * Math.PI * 2;
      frond.position.set(Math.cos(a) * 0.7 - 0.12, 2.95, Math.sin(a) * 0.7);
      frond.rotation.y = -a;
      frond.rotation.z = -0.35;
      g.add(frond);
    }
  } else if (arch === 'canyon') {
    const rockMat = new THREE.MeshStandardMaterial({ color: randVal > 0.5 ? '#B45309' : '#78716C', roughness: 0.92 });
    const r1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.25, 0), rockMat);
    r1.position.y = 0.95;
    g.add(r1);
    const r2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.75, 0), rockMat);
    r2.position.set(0.88, 0.55, 0.4);
    g.add(r2);
  } else if (arch === 'crystal') {
    const crysMat = new THREE.MeshStandardMaterial({ color: theme.accentPropColor, emissive: theme.accentPropColor, emissiveIntensity: 0.28, roughness: 0.2, metalness: 0.35 });
    const c1 = new THREE.Mesh(new THREE.OctahedronGeometry(1.15, 0), crysMat);
    c1.scale.set(0.75, 1.85, 0.75);
    c1.position.y = 1.5;
    g.add(c1);
    const c2 = new THREE.Mesh(new THREE.OctahedronGeometry(0.75, 0), crysMat);
    c2.scale.set(0.7, 1.5, 0.7);
    c2.position.set(0.7, 0.9, 0.25);
    c2.rotation.z = -0.3;
    g.add(c2);
  } else if (arch === 'cosmos') {
    const orbMat = new THREE.MeshStandardMaterial({ color: theme.accentPropColor, emissive: theme.accentPropColor, emissiveIntensity: 0.4, roughness: 0.25 });
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 2.4, 12), new THREE.MeshStandardMaterial({ color: '#312E81', metalness: 0.5 }));
    pillar.position.y = 1.2;
    g.add(pillar);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.72, 16, 16), orbMat);
    orb.position.y = 2.9;
    g.add(orb);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.07, 8, 24), new THREE.MeshBasicMaterial({ color: '#FEF08A' }));
    ring.position.y = 2.9;
    ring.rotation.x = 1.2;
    g.add(ring);
  } else if (arch === 'village') {
    const wallColors = ['#FEF3C7', '#E0F2FE', '#FCE7F3', '#DCFCE7'];
    const roofColors = ['#EF4444', '#0EA5E9', '#F59E0B', theme.accentPropColor];
    const ci = Math.floor(randVal * 4) % 4;
    const house = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.0, 2.3), new THREE.MeshStandardMaterial({ color: wallColors[ci], roughness: 0.7 }));
    house.position.y = 1.0;
    g.add(house);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.1, 1.25, 4), new THREE.MeshStandardMaterial({ color: roofColors[ci], roughness: 0.6 }));
    roof.position.y = 2.6;
    roof.rotation.y = Math.PI / 4;
    g.add(roof);
  } else {
    // meadow: puffy trees & big pastel flowers
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 1.6, 10), new THREE.MeshStandardMaterial({ color: '#92400E', roughness: 0.9 }));
    trunk.position.y = 0.8;
    g.add(trunk);
    const crown = new THREE.Mesh(new THREE.SphereGeometry(1.15, 12, 12), new THREE.MeshStandardMaterial({ color: theme.groundSecondary, roughness: 0.75 }));
    crown.position.y = 2.2;
    g.add(crown);
    const flower = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 10), new THREE.MeshStandardMaterial({ color: theme.accentPropColor, roughness: 0.5 }));
    flower.position.set(1.0, 0.35, 0.5);
    g.add(flower);
  }

  return g;
}

export function buildArenaLandmarkFromTheme(theme: ArenaThemeConfig, variant: number): THREE.Group {
  const g = new THREE.Group();
  const arch = theme.propArchetype;

  if (arch === 'palm') {
    const water = new THREE.Mesh(
      new THREE.CylinderGeometry(2.5, 2.7, 0.08, 20),
      new THREE.MeshStandardMaterial({ color: '#0EA5E9', roughness: 0.15, metalness: 0.25 })
    );
    water.position.y = 0.04;
    g.add(water);
    const palm = buildSceneryPropFromTheme(theme, variant);
    palm.position.set(2.1, 0, 0);
    g.add(palm);
  } else if (arch === 'crystal' || arch === 'cosmos') {
    const prop = buildSceneryPropFromTheme(theme, variant);
    prop.scale.setScalar(0.9);
    g.add(prop);
  } else if (arch === 'village') {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.11, 2.8, 10),
      new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.6 })
    );
    pole.position.y = 1.4;
    g.add(pole);
    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 10, 10),
      new THREE.MeshBasicMaterial({ color: '#FEF08A' })
    );
    lamp.position.y = 2.85;
    g.add(lamp);
  } else {
    const bush = new THREE.Mesh(
      new THREE.SphereGeometry(0.88, 10, 10),
      new THREE.MeshStandardMaterial({
        color: variant > 0.5 ? theme.accentPropColor : theme.groundSecondary,
        roughness: 0.82,
      })
    );
    bush.position.y = 0.62;
    g.add(bush);
  }

  return g;
}

export function buildHiddenCacheMesh(
  hideStyle: 'bush' | 'chest' | 'rock_pile' | 'tent',
  biome: BiomeId,
  category: string
): THREE.Group {
  const g = new THREE.Group();

  if (hideStyle === 'chest') {
    const woodMat = new THREE.MeshStandardMaterial({ color: '#92400E', roughness: 0.72 });
    const goldMat = new THREE.MeshStandardMaterial({
      color: '#FACC15',
      metalness: 0.75,
      roughness: 0.25,
    });
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.78, 1.05), woodMat);
    base.position.y = 0.39;
    base.castShadow = true;
    g.add(base);
    const lid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.52, 0.52, 1.5, 12, 1, false, 0, Math.PI),
      woodMat
    );
    lid.rotation.z = Math.PI / 2;
    lid.position.y = 0.78;
    lid.castShadow = true;
    g.add(lid);
    const strap = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.16, 1.12), goldMat);
    strap.position.y = 0.78;
    g.add(strap);
    const lock = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.3, 0.12), goldMat);
    lock.position.set(0, 0.68, 0.56);
    g.add(lock);
  } else if (hideStyle === 'bush') {
    const leafColor = biome === 'gurun' ? '#65A30D' : '#16A34A';
    const leafMat = new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.85 });
    const offsets: [number, number, number, number][] = [
      [0, 0.68, 0, 0.85],
      [-0.65, 0.5, 0.25, 0.62],
      [0.65, 0.52, -0.2, 0.64],
      [0.15, 0.5, -0.58, 0.55],
    ];
    offsets.forEach(([x, y, z, r]) => {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 12), leafMat);
      puff.position.set(x, y, z);
      puff.castShadow = true;
      g.add(puff);
    });
    // Peeking golden mystery scroll capsule
    const scroll = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.9, 12),
      new THREE.MeshStandardMaterial({
        color: '#FACC15',
        emissive: '#F59E0B',
        emissiveIntensity: 0.35,
        roughness: 0.3,
      })
    );
    scroll.position.set(0, 1.05, 0.2);
    scroll.rotation.z = 0.45;
    g.add(scroll);
  } else if (hideStyle === 'rock_pile') {
    const rockColor = biome === 'gurun' ? '#D97706' : '#78716C';
    const rockMat = new THREE.MeshStandardMaterial({ color: rockColor, roughness: 0.9 });
    const r1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.75, 0), rockMat);
    r1.position.set(-0.35, 0.55, 0);
    r1.castShadow = true;
    g.add(r1);
    const r2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.68, 0), rockMat);
    r2.position.set(0.42, 0.48, 0.2);
    r2.castShadow = true;
    g.add(r2);
    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.44, 0),
      new THREE.MeshStandardMaterial({
        color: '#38BDF8',
        emissive: '#0284C7',
        emissiveIntensity: 0.45,
        roughness: 0.2,
      })
    );
    crystal.position.set(0, 1.05, 0);
    g.add(crystal);
  } else {
    // Explorer mini tent hiding a secret vocabulary book
    const tentMat = new THREE.MeshStandardMaterial({
      color: '#F59E0B',
      roughness: 0.7,
      side: THREE.DoubleSide,
    });
    const tent = new THREE.Mesh(new THREE.ConeGeometry(1.15, 1.65, 4), tentMat);
    tent.position.y = 0.82;
    tent.rotation.y = Math.PI / 4;
    tent.castShadow = true;
    g.add(tent);
    const flag = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.26, 0.05),
      new THREE.MeshBasicMaterial({ color: '#EC4899' })
    );
    flag.position.set(0.22, 1.75, 0);
    g.add(flag);
  }

  // Ground search ring so children can spot hiding caches while exploring
  const searchRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.35, 0.08, 8, 28),
    new THREE.MeshBasicMaterial({ color: '#FACC15' })
  );
  searchRing.rotation.x = Math.PI / 2;
  searchRing.position.y = 0.06;
  searchRing.name = 'searchRing';
  g.add(searchRing);

  // Floating "?" Mystery Badge (word stays hidden until player finds & solves it!)
  const badgeTex = makeMysteryQuestionTexture(category);
  const badge = new THREE.Sprite(new THREE.SpriteMaterial({ map: badgeTex, transparent: true }));
  badge.position.set(0, 2.35, 0);
  badge.scale.set(1.6, 1.2, 1);
  badge.name = 'mysteryBadge';
  g.add(badge);

  return g;
}
