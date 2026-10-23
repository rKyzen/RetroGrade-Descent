/**
 * @fileoverview Leaderboard and Session Pilot Name Management for Retrograde Descent.
 * Handles real persistent score tracking, astronaut historical records, and session names.
 */

export interface LeaderboardEntry {
  id: string;
  pilotName: string;
  score: number;
  epoch: number;
  padName: string;
  padMultiplier: number;
  mode: 'SOLO' | 'AI_DUEL' | 'DUEL';
  timestamp: number;
  dateFormatted: string;
  precisionRating: 'PERFECT' | 'EXCELLENT' | 'GOOD' | 'ROUGH';
  isCurrentSession?: boolean;
}

const LEADERBOARD_STORAGE_KEY = 'retrograde_descent_leaderboard_v5';
const PILOT_NAME_KEY = 'retrograde_descent_pilot_name_v5';
const PILOT_P2_KEY = 'retrograde_descent_pilot_p2_v5';

// Realistic lunar historical mission seed data
const SEED_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'seed-1',
    pilotName: 'NEIL ARMSTRONG',
    score: 19850,
    epoch: 5,
    padName: 'OMEGA',
    padMultiplier: 5.0,
    mode: 'SOLO',
    timestamp: Date.now() - 86400000 * 5,
    dateFormatted: 'Apollo 11 Legend',
    precisionRating: 'PERFECT',
  },
  {
    id: 'seed-2',
    pilotName: 'BUZZ ALDRIN',
    score: 16400,
    epoch: 5,
    padName: 'CHARLIE',
    padMultiplier: 3.5,
    mode: 'SOLO',
    timestamp: Date.now() - 86400000 * 4,
    dateFormatted: 'Sea of Tranquility',
    precisionRating: 'EXCELLENT',
  },
  {
    id: 'seed-3',
    pilotName: 'GENE CERNAN',
    score: 13950,
    epoch: 4,
    padName: 'CHARLIE',
    padMultiplier: 3.5,
    mode: 'SOLO',
    timestamp: Date.now() - 86400000 * 3,
    dateFormatted: 'Apollo 17 Veteran',
    precisionRating: 'EXCELLENT',
  },
  {
    id: 'seed-4',
    pilotName: 'PETE CONRAD',
    score: 10800,
    epoch: 3,
    padName: 'BRAVO',
    padMultiplier: 2.0,
    mode: 'SOLO',
    timestamp: Date.now() - 86400000 * 2,
    dateFormatted: 'Ocean of Storms',
    precisionRating: 'GOOD',
  },
  {
    id: 'seed-5',
    pilotName: 'JOHN YOUNG',
    score: 8650,
    epoch: 3,
    padName: 'BRAVO',
    padMultiplier: 2.0,
    mode: 'SOLO',
    timestamp: Date.now() - 86400000 * 1.5,
    dateFormatted: 'Descartes Highlands',
    precisionRating: 'GOOD',
  },
  {
    id: 'seed-6',
    pilotName: 'MICHAEL COLLINS',
    score: 6900,
    epoch: 2,
    padName: 'ALPHA',
    padMultiplier: 1.0,
    mode: 'SOLO',
    timestamp: Date.now() - 86400000 * 1,
    dateFormatted: 'Lunar Orbit CMP',
    precisionRating: 'EXCELLENT',
  },
  {
    id: 'seed-7',
    pilotName: 'ALAN SHEPARD',
    score: 5400,
    epoch: 2,
    padName: 'ALPHA',
    padMultiplier: 1.0,
    mode: 'SOLO',
    timestamp: Date.now() - 3600000 * 12,
    dateFormatted: 'Fra Mauro Crater',
    precisionRating: 'GOOD',
  },
  {
    id: 'seed-8',
    pilotName: 'JIM LOVELL',
    score: 4150,
    epoch: 1,
    padName: 'ALPHA',
    padMultiplier: 1.0,
    mode: 'SOLO',
    timestamp: Date.now() - 3600000 * 6,
    dateFormatted: 'Lunar Odyssey',
    precisionRating: 'GOOD',
  },
];

/**
 * Loads leaderboard entries from localStorage, merging seed data if empty.
 */
export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort((a, b) => b.score - a.score);
      }
    }
  } catch {
    // fallback
  }
  return [...SEED_LEADERBOARD];
}

/**
 * Saves a new score entry to the persistent leaderboard.
 */
export function saveScore(entry: {
  pilotName: string;
  score: number;
  epoch: number;
  padName: string;
  padMultiplier: number;
  mode: 'SOLO' | 'AI_DUEL' | 'DUEL';
  precisionRating: 'PERFECT' | 'EXCELLENT' | 'GOOD' | 'ROUGH';
}): LeaderboardEntry {
  const current = getLeaderboard();
  const date = new Date();
  const dateFormatted = `${date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  })} ${date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`;

  const newEntry: LeaderboardEntry = {
    id: `run-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    pilotName: (entry.pilotName.trim() || 'LUNAR PILOT').toUpperCase(),
    score: Math.max(0, entry.score),
    epoch: entry.epoch,
    padName: entry.padName,
    padMultiplier: entry.padMultiplier,
    mode: entry.mode,
    timestamp: Date.now(),
    dateFormatted,
    precisionRating: entry.precisionRating,
    isCurrentSession: true,
  };

  // Add and sort by score descending
  const updated = [newEntry, ...current].sort((a, b) => b.score - a.score).slice(0, 50);

  try {
    localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // storage failed or full
  }

  return newEntry;
}

/**
 * Resets the leaderboard to the original authentic astronaut records.
 */
export function resetLeaderboardToSeeds(): LeaderboardEntry[] {
  try {
    localStorage.removeItem(LEADERBOARD_STORAGE_KEY);
  } catch {
    // ignore
  }
  return [...SEED_LEADERBOARD];
}

/**
 * Gets the current session pilot name.
 */
export function getStoredPilotName(defaultName = 'PILOT ALPHA'): string {
  try {
    const saved = localStorage.getItem(PILOT_NAME_KEY);
    if (saved && saved.trim()) return saved.trim().toUpperCase();
  } catch {
    // ignore
  }
  return defaultName;
}

/**
 * Sets the current session pilot name in localStorage.
 */
export function setStoredPilotName(name: string): void {
  try {
    localStorage.setItem(PILOT_NAME_KEY, (name.trim() || 'PILOT ALPHA').toUpperCase());
  } catch {
    // ignore
  }
}

/**
 * Gets Player 2 pilot name for Duel mode.
 */
export function getStoredP2Name(defaultName = 'PILOT BETA'): string {
  try {
    const saved = localStorage.getItem(PILOT_P2_KEY);
    if (saved && saved.trim()) return saved.trim().toUpperCase();
  } catch {
    // ignore
  }
  return defaultName;
}

/**
 * Sets Player 2 pilot name for Duel mode in localStorage.
 */
export function setStoredP2Name(name: string): void {
  try {
    localStorage.setItem(PILOT_P2_KEY, (name.trim() || 'PILOT BETA').toUpperCase());
  } catch {
    // ignore
  }
}
