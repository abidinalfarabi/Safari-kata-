import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { LeaderboardEntry } from './src/types/game.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.join(__dirname, 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

interface PersistedStore {
  leaderboard: LeaderboardEntry[];
}

function ensureStore(): PersistedStore {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    const now = Date.now();
    const initial: PersistedStore = {
      leaderboard: [
        {
          playerId: 'seed_amina',
          name: 'Amina',
          animalId: 'kiko',
          evolutionStage: 3,
          highestLevel: 64,
          wordsCollected: 420,
          totalScore: 8450,
          updatedAt: now,
        },
        {
          playerId: 'seed_zaid',
          name: 'Zaid',
          animalId: 'bimo',
          evolutionStage: 3,
          highestLevel: 52,
          wordsCollected: 360,
          totalScore: 6920,
          updatedAt: now,
        },
        {
          playerId: 'seed_hana',
          name: 'Hana',
          animalId: 'lulu',
          evolutionStage: 2,
          highestLevel: 29,
          wordsCollected: 250,
          totalScore: 4180,
          updatedAt: now,
        },
      ],
    };
    fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as PersistedStore;
    const list = Array.isArray(parsed.leaderboard)
      ? parsed.leaderboard.map((e) => ({
          playerId: String(e.playerId),
          name: String(e.name),
          animalId: (e.animalId === 'bimo' || e.animalId === 'lulu' ? e.animalId : 'kiko') as LeaderboardEntry['animalId'],
          evolutionStage: (e.evolutionStage === 2 || e.evolutionStage === 3 || e.evolutionStage === 4 ? e.evolutionStage : 1) as LeaderboardEntry['evolutionStage'],
          highestLevel: Number(e.highestLevel || 1),
          wordsCollected: Number(e.wordsCollected || 0),
          totalScore: Number(e.totalScore || 0),
          updatedAt: typeof e.updatedAt === 'number' ? e.updatedAt : Date.now(),
        }))
      : [];
    return { leaderboard: list };
  } catch {
    return { leaderboard: [] };
  }
}

function saveStore(store: PersistedStore) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist store:', err);
  }
}

const store = ensureStore();

async function startServer() {
  const app = express();
  app.use(express.json());

  // REST API: Leaderboard
  app.get('/api/leaderboard', (_req, res) => {
    const sorted = [...store.leaderboard]
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 30);
    res.json({ entries: sorted });
  });

  app.post('/api/leaderboard', (req, res) => {
    const body = req.body as Partial<LeaderboardEntry>;
    if (!body || !body.playerId || !body.name) {
      res.status(400).json({ error: 'Invalid player payload' });
      return;
    }

    const sanitizedName = String(body.name).trim().slice(0, 20) || 'Petualang';
    const existingIdx = store.leaderboard.findIndex((e) => e.playerId === body.playerId);
    const entry: LeaderboardEntry = {
      playerId: String(body.playerId),
      name: sanitizedName,
      animalId: body.animalId === 'bimo' || body.animalId === 'lulu' ? body.animalId : 'kiko',
      evolutionStage:
        body.evolutionStage === 2 || body.evolutionStage === 3 || body.evolutionStage === 4
          ? body.evolutionStage
          : 1,
      highestLevel: Math.max(1, Math.min(500, Number(body.highestLevel || 1))),
      wordsCollected: Math.max(0, Number(body.wordsCollected || 0)),
      totalScore: Math.max(0, Number(body.totalScore || 0)),
      updatedAt: Date.now(),
    };

    if (existingIdx >= 0) {
      const prev = store.leaderboard[existingIdx];
      store.leaderboard[existingIdx] = {
        ...entry,
        highestLevel: Math.max(prev.highestLevel, entry.highestLevel),
        wordsCollected: Math.max(prev.wordsCollected, entry.wordsCollected),
        totalScore: Math.max(prev.totalScore, entry.totalScore),
      };
    } else {
      store.leaderboard.push(entry);
    }

    saveStore(store);
    const sorted = [...store.leaderboard]
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 30);
    res.json({ entries: sorted });
  });

  const server = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Safari Kata 3D server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
