// tslint:disable
/* eslint-disable */
import {
  Activity,
  AlertTriangle,
  Award,
  Check,
  ChevronRight,
  Compass,
  Crosshair,
  Flame,
  Gauge,
  HelpCircle,
  Menu,
  Play,
  Radio,
  Rocket,
  RotateCw,
  Shield,
  Sparkles,
  Trophy,
  User,
  Users,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {getConfig} from './constants';
import {
  getLeaderboard,
  getStoredP2Name,
  getStoredPilotName,
  LeaderboardEntry,
  resetLeaderboardToSeeds,
  saveScore,
  setStoredP2Name,
  setStoredPilotName,
} from './leaderboard';
import BackgroundMusic from './utils/BackgroundMusic';
import {
  createFixedStepper,
  drawAsset,
  gameAudio,
  GameState,
  MenuOverlay,
  prepareCanvas,
  useAssets,
  useAutoFocus,
  useInput,
  useIsMobile,
} from './utils/helper';
import {
  usePlayground,
  usePlaygroundGameLifecycle,
} from './utils/usePlayground';

// Audio Asset
const BACKGROUND_MUSIC_URL = 'assets/audio/bgm_telemetry_loop.mp3';

// Discovered Image Assets
const ASSETS_MANIFEST: Record<string, string> = {
  lander: 'assets/images/lander_vessel.png',
  backdrop: 'assets/images/lunar_backdrop.png',
  platform: 'assets/images/landing_platform.png',
  crag: 'assets/images/lunar_crag.png',
};

// Epoch Descriptions & Degradation Parameters
export interface EpochInfo {
  id: number;
  name: string;
  era: string;
  themeColor: string;
  hudStyle: 'modern' | 'y2k' | 'eighties' | 'apollo' | 'blackout';
  description: string;
  degradedAvionics: string[];
  worldWidth: number;
  worldHeight: number;
}

const EPOCHS: EpochInfo[] = [
  {
    id: 1,
    name: 'MODERN',
    era: '2026 GLASS COCKPIT',
    themeColor: '#10b981',
    hudStyle: 'modern',
    description: 'Full digital telemetry, velocity vector pip, tactical terrain radar, multiple landing pads with distance score multipliers. Auxiliary high-capacity fuel tanks equipped (+80% fuel).',
    degradedAvionics: ['All systems nominal — Full Glass Cockpit active', 'High-Capacity Auxiliary Tanks Online'],
    worldWidth: 3400,
    worldHeight: 1400,
  },
  {
    id: 2,
    name: 'Y2K',
    era: '2000 INDUSTRIAL SCADA',
    themeColor: '#22c55e',
    hudStyle: 'y2k',
    description: 'Landing reticle & autopilot assists stripped. Manual trajectory flight across rugged terrain.',
    degradedAvionics: ['Landing Guidance Reticle OFFLINE', 'Trajectory Predictor OFFLINE'],
    worldWidth: 3600,
    worldHeight: 1400,
  },
  {
    id: 3,
    name: 'EIGHTIES',
    era: '1984 AMBER CRT',
    themeColor: '#f59e0b',
    hudStyle: 'eighties',
    description: 'Digital altimeter stripped. Amber strobe beacon and audio radar chirps only.',
    degradedAvionics: ['Digital Altimeter OFFLINE', 'Tactical Radar Degraded to Strobe'],
    worldWidth: 3800,
    worldHeight: 1450,
  },
  {
    id: 4,
    name: 'APOLLO',
    era: '1969 ANALOG CONSOLE',
    themeColor: '#94a3b8',
    hudStyle: 'apollo',
    description: 'Digital speed display dead. Fuel gauge replaced with laggy damped needle (~300ms).',
    degradedAvionics: ['Digital Speedometers OFFLINE', 'Mechanical Damped Needle ACTIVE'],
    worldWidth: 4000,
    worldHeight: 1500,
  },
  {
    id: 5,
    name: 'BLACKOUT',
    era: 'FINAL SENSORY REGRESSION',
    themeColor: '#ef4444',
    hudStyle: 'blackout',
    description: 'Total optical darkness. Pilot blind using acoustic sonar ping frequency (200Hz - 1200Hz). Reach distant pads for legendary multipliers.',
    degradedAvionics: ['ALL GLASS INSTRUMENTS OFFLINE', 'Optical Sensors: 95% BLIND', 'Acoustic Sonar ACTIVE'],
    worldWidth: 4200,
    worldHeight: 1500,
  },
];

export interface LandingPad {
  id: string;
  name: string;
  code: string;
  x: number;
  y: number;
  w: number;
  h: number;
  multiplier: number;
  color: string;
  glowColor: string;
  distanceTier: 'NEAR' | 'MID' | 'FAR' | 'EXTREME';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'flame' | 'smoke' | 'spark' | 'rcs' | 'debris' | 'dust';
}

interface TerrainPoint {
  x: number;
  y: number;
}

interface CragObstacle {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface SonarWave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

export interface LanderState {
  id: 'p1' | 'p2';
  name: string;
  themeColor: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angularVelocity: number;
  fuel: number;
  maxFuel: number;
  dampedFuel: number;
  width: number;
  height: number;
  crashed: boolean;
  landed: boolean;
  landedPad: LandingPad | null;
  score: number;
  roundsWon: number;
}

const PRESET_PILOT_NAMES = [
  'ARMSTRONG',
  'ALDRIN',
  'COLLINS',
  'YURI',
  'VIPER',
  'PHOENIX',
  'VALKYRIE',
  'MAVERICK',
];

export interface ShipTheme {
  id: string;
  name: string;
  color: string;
  glow: string;
  borderClass: string;
}

export const SHIP_THEMES: ShipTheme[] = [
  { id: 'emerald', name: 'APOLLO EMERALD', color: '#10b981', glow: 'rgba(16, 185, 129, 0.45)', borderClass: 'border-emerald-500' },
  { id: 'cyan', name: 'CYBER TITANIUM', color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.45)', borderClass: 'border-cyan-400' },
  { id: 'gold', name: 'SOLAR REGOLITH', color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.45)', borderClass: 'border-amber-400' },
  { id: 'crimson', name: 'ARES ODYSSEY', color: '#ef4444', glow: 'rgba(239, 68, 68, 0.45)', borderClass: 'border-red-500' },
  { id: 'violet', name: 'COSMIC NEBULA', color: '#a855f7', glow: 'rgba(168, 85, 247, 0.45)', borderClass: 'border-purple-400' },
];

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stepperRef = useRef<ReturnType<typeof createFixedStepper>>();
  const isMobile = useIsMobile();

  // --- PLAYGROUND SDK INTEGRATION ---
  const {sdk} = usePlayground();

  // Asset preloading
  const {assets, isReady: assetsReady} = useAssets(ASSETS_MANIFEST);

  const canvasWidth = getConfig('baseCanvasWidth') as number;
  const canvasHeight = getConfig('baseCanvasHeight') as number;

  if (!stepperRef.current) {
    const stepMs = getConfig('stepMs');
    const maxSubSteps = getConfig('maxSubSteps');
    stepperRef.current = createFixedStepper(stepMs, maxSubSteps);
  }

  // Game Mode: Solo Campaign vs 2-Player Split Screen Duel
  const [gameMode, setGameMode] = useState<'SOLO' | 'DUEL'>('SOLO');
  const gameModeRef = useRef<'SOLO' | 'DUEL'>('SOLO');
  gameModeRef.current = gameMode;

  // Session Pilot Names
  const [pilotName, setPilotName] = useState<string>(() => getStoredPilotName('PILOT ALPHA'));
  const [p2Name, setP2Name] = useState<string>(() => getStoredP2Name('PILOT BETA'));

  // Ship Livery Theme Customization
  const [p1Theme, setP1Theme] = useState<ShipTheme>(SHIP_THEMES[0]);
  const [p2Theme, setP2Theme] = useState<ShipTheme>(SHIP_THEMES[2]);

  const initGameRef = useRef<() => void>();

  // Reactive Game State for UI
  const [gameState, setGameState] = useState<GameState>({
    status: 'START',
    score: 0,
    level: 1, // Epoch 1..5
    lives: getConfig('startingLives') as number,
  });

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // Real-time Telemetry State for P1 & P2
  const [telemetry, setTelemetry] = useState({
    fuel: 180,
    maxFuel: 180,
    dampedFuel: 180,
    vy: 0,
    vx: 0,
    alt: 0,
    pitch: 0,
    nearestPadName: 'ALPHA',
    nearestPadMult: 1.0,
    nearestPadDist: 0,
    nearestPadDir: 'aligned' as 'left' | 'right' | 'aligned',
  });

  const [telemetryP2, setTelemetryP2] = useState({
    fuel: 180,
    maxFuel: 180,
    dampedFuel: 180,
    vy: 0,
    vx: 0,
    alt: 0,
    pitch: 0,
    nearestPadName: 'ALPHA',
    nearestPadMult: 1.0,
    nearestPadDist: 0,
    nearestPadDir: 'aligned' as 'left' | 'right' | 'aligned',
  });

  const telemetryTimerRef = useRef(0);

  // Audio mute controls
  const [isSfxMuted, setIsSfxMuted] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);

  // In-Game Modals
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [leaderboardList, setLeaderboardList] = useState<LeaderboardEntry[]>(() => getLeaderboard());

  // Attract Mode / Inactivity tracking
  const [isAttractMode, setIsAttractMode] = useState(false);
  const lastInteractionTimeRef = useRef(Date.now());

  // Mobile virtual inputs state
  const touchInputsRef = useRef({
    p1Thrust: false,
    p1Left: false,
    p1Right: false,
    p2Thrust: false,
    p2Left: false,
    p2Right: false,
  });

  // Dedicated key tracker for responsive independent dual-player inputs
  const keysPressedRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressedRef.current[e.key.toLowerCase()] = true;
      keysPressedRef.current[e.code] = true;

      // Instant Launch from Title Screen with Enter or Space
      const isInput = (e.target as HTMLElement)?.tagName === 'INPUT';
      if (!isInput && gameStateRef.current.status === 'START') {
        if (e.key === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          initGameRef.current?.();
          return;
        }
      }

      // Prevent window scrolling on arrow keys and space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        if (gameStateRef.current.status === 'PLAYING') {
          e.preventDefault();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.key.toLowerCase()] = false;
      keysPressedRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Standard hardware input hook for menu actions
  const inputRef = useInput(canvasRef, true, {
    width: canvasWidth,
    height: canvasHeight,
  });

  // Touchdown telemetry modal stats
  const [lastTouchdownStats, setLastTouchdownStats] = useState<{
    pilotName?: string;
    vy: number;
    vx: number;
    tilt: number;
    fuelRemaining: number;
    pointsAwarded: number;
    padName: string;
    padMultiplier: number;
    reason?: string;
    isWinner?: boolean;
  } | null>(null);

  // Auto-focus refs for menu buttons
  const startBtnRef = useAutoFocus<HTMLButtonElement>(gameState.status === 'START');

  // --- World & Camera Simulation State ---
  const worldDimensionsRef = useRef({
    width: 3400,
    height: 1400,
  });

  // Cameras for P1 and P2
  const cameraRef = useRef({x: 0, y: 0});
  const cameraP2Ref = useRef({x: 0, y: 0});

  // Function to compute fuel capacity by level (Level 1 has significantly more fuel!)
  const getMaxFuel = useCallback((epoch: number) => {
    if (epoch === 1) {
      // User request: "add more fuel in first level" -> 180 capacity (80% bonus!)
      return (getConfig('level1FuelCapacity') as number) || 180;
    }
    if (epoch === 2) return 140;
    return 100;
  }, []);

  // Lander Vessels State (stored in Refs for zero-jitter 60fps physics)
  const landerRef = useRef<LanderState>({
    id: 'p1',
    name: pilotName,
    themeColor: '#10b981',
    x: 320,
    y: 120,
    vx: 12,
    vy: 8,
    angle: 0,
    angularVelocity: 0,
    fuel: 180,
    maxFuel: 180,
    dampedFuel: 180,
    width: getConfig('assetLanderVesselWidth') as number,
    height: getConfig('assetLanderVesselHeight') as number,
    crashed: false,
    landed: false,
    landedPad: null,
    score: 0,
    roundsWon: 0,
  });

  const landerP2Ref = useRef<LanderState>({
    id: 'p2',
    name: p2Name,
    themeColor: '#f59e0b',
    x: 420,
    y: 120,
    vx: 12,
    vy: 8,
    angle: 0,
    angularVelocity: 0,
    fuel: 180,
    maxFuel: 180,
    dampedFuel: 180,
    width: getConfig('assetLanderVesselWidth') as number,
    height: getConfig('assetLanderVesselHeight') as number,
    crashed: false,
    landed: false,
    landedPad: null,
    score: 0,
    roundsWon: 0,
  });

  // Array of Multiple Landing Pads
  const platformsRef = useRef<LandingPad[]>([]);
  const terrainRef = useRef<TerrainPoint[]>([]);
  const cragsRef = useRef<CragObstacle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const sonarWavesRef = useRef<SonarWave[]>([]);
  const lastSonarTimeRef = useRef(0);
  const lastLowFuelAlarmRef = useRef(0);
  const screenShakeTimeRef = useRef(0);
  const screenShakeOffsetRef = useRef({x: 0, y: 0});
  const crashFlashTimerRef = useRef(0);
  const wasThrustingRef = useRef(false);
  const wasThrustingP2Ref = useRef(false);
  const touchDebounceRef = useRef(0);

  // =========================================================================
  // MULTI-PAD PROCEDURAL LUNAR TERRAIN GENERATOR
  // Generates 4 distinct landing pads at increasing distances with multipliers
  // 1.0x (ALPHA), 2.0x (BRAVO), 3.5x (CHARLIE), 5.0x (OMEGA)
  // Perfectly level plateau for each landing pad with Hermite smoothstep transition
  // =========================================================================
  const generateTerrain = useCallback((epoch: number) => {
    const epochConfig = EPOCHS[epoch - 1] || EPOCHS[0];
    const wWidth = epochConfig.worldWidth;
    const wHeight = epochConfig.worldHeight;
    worldDimensionsRef.current = {width: wWidth, height: wHeight};

    const padHeight = 28;
    const padY = Math.round(wHeight * 0.76);

    // Distribution of 4 distinct landing zones across the lunar continent
    // Distance increases progressively with higher risk and higher score multipliers
    const padsConfig: LandingPad[] = [
      {
        id: 'pad-1',
        name: 'ALPHA BASE',
        code: 'ALPHA',
        x: Math.round(wWidth * 0.22),
        y: padY,
        w: 160,
        h: padHeight,
        multiplier: 1.0,
        color: '#10b981', // Emerald
        glowColor: 'rgba(16, 185, 129, 0.4)',
        distanceTier: 'NEAR',
      },
      {
        id: 'pad-2',
        name: 'BRAVO OUTPOST',
        code: 'BRAVO',
        x: Math.round(wWidth * 0.46),
        y: padY - 14,
        w: 135,
        h: padHeight,
        multiplier: 2.0,
        color: '#38bdf8', // Sky Blue
        glowColor: 'rgba(56, 189, 248, 0.4)',
        distanceTier: 'MID',
      },
      {
        id: 'pad-3',
        name: 'CHARLIE CREST',
        code: 'CHARLIE',
        x: Math.round(wWidth * 0.70),
        y: padY + 10,
        w: 115,
        h: padHeight,
        multiplier: 3.5,
        color: '#f59e0b', // Amber
        glowColor: 'rgba(245, 158, 11, 0.4)',
        distanceTier: 'FAR',
      },
      {
        id: 'pad-4',
        name: 'OMEGA SANCTUARY',
        code: 'OMEGA',
        x: Math.round(wWidth * 0.90),
        y: padY - 24,
        w: 95,
        h: padHeight,
        multiplier: 5.0,
        color: '#ec4899', // Pink / Cosmic Magenta
        glowColor: 'rgba(236, 72, 153, 0.45)',
        distanceTier: 'EXTREME',
      },
    ];

    platformsRef.current = padsConfig;

    // Multi-octave natural lunar height function
    const getNaturalHeight = (x: number) => {
      const normX = (((x % wWidth) + wWidth) % wWidth) / wWidth;
      const baseline = wHeight * 0.74;

      const wave1 = Math.sin(normX * Math.PI * 2 * 2 + epoch * 0.7) * 70;
      const wave2 = Math.sin(normX * Math.PI * 2 * 5 + 1.2 + epoch * 1.1) * 36;
      const wave3 = Math.cos(normX * Math.PI * 2 * 9 + 2.5 + epoch * 0.4) * 18;

      return baseline + wave1 + wave2 + wave3;
    };

    // Calculate final blended terrain height with flat plateaus for all 4 pads
    const calcTerrainY = (x: number) => {
      const wrappedX = ((x % wWidth) + wWidth) % wWidth;

      // Find closest pad plateau
      let closestPad: LandingPad | null = null;
      let minPadDist = Infinity;

      for (const pad of padsConfig) {
        const padCenterX = pad.x + pad.w / 2;
        let dist = Math.abs(wrappedX - padCenterX);
        if (dist > wWidth / 2) {
          dist = wWidth - dist;
        }
        if (dist < minPadDist) {
          minPadDist = dist;
          closestPad = pad;
        }
      }

      const flatRadius = closestPad ? closestPad.w / 2 + 30 : 100;
      const transitionRadius = 120;

      if (closestPad && minPadDist <= flatRadius) {
        return closestPad.y; // Level plateau
      } else if (closestPad && minPadDist < flatRadius + transitionRadius) {
        const t = (minPadDist - flatRadius) / transitionRadius;
        const smoothT = t * t * (3 - 2 * t);
        const naturalY = getNaturalHeight(wrappedX);
        return closestPad.y * (1 - smoothT) + naturalY * smoothT;
      }

      const y = getNaturalHeight(wrappedX);
      return Math.max(wHeight * 0.52, Math.min(wHeight * 0.86, y));
    };

    // Sample terrain points with uniform 16px step
    const step = 16;
    const numPoints = Math.ceil(wWidth / step);
    const points: TerrainPoint[] = [];

    for (let i = 0; i <= numPoints; i++) {
      const px = Math.min(wWidth, i * step);
      if (points.length > 0 && px <= points[points.length - 1].x) {
        continue;
      }
      points.push({
        x: px,
        y: Math.round(calcTerrainY(px) * 10) / 10,
      });
    }

    if (points[0].x !== 0) {
      points.unshift({x: 0, y: Math.round(calcTerrainY(0) * 10) / 10});
    }
    if (points[points.length - 1].x !== wWidth) {
      points.push({x: wWidth, y: points[0].y});
    } else {
      points[points.length - 1].y = points[0].y;
    }

    terrainRef.current = points;

    // Basalt crag spires situated in intermediate valleys between pads
    const crags: CragObstacle[] = [];
    const cragW = getConfig('assetLunarCragWidth') as number;
    const cragH = getConfig('assetLunarCragHeight') as number;
    const cragPositions = [
      Math.round(wWidth * 0.35),
      Math.round(wWidth * 0.58),
      Math.round(wWidth * 0.81),
    ];

    for (let i = 0; i < cragPositions.length; i++) {
      const cx = cragPositions[i];
      const groundY = calcTerrainY(cx);
      crags.push({
        x: cx - cragW / 2,
        y: groundY - cragH * 0.82,
        w: cragW,
        h: cragH,
      });
    }

    cragsRef.current = crags;
  }, []);

  // Exact terrain surface height interpolation
  const getTerrainSurfaceY = useCallback((x: number): number => {
    const pts = terrainRef.current;
    const wWidth = worldDimensionsRef.current.width;
    if (!pts || pts.length === 0) return worldDimensionsRef.current.height;

    const wrappedX = ((x % wWidth) + wWidth) % wWidth;
    const step = 16;
    let idx = Math.floor(wrappedX / step);
    if (idx < 0) idx = 0;
    if (idx >= pts.length - 1) idx = pts.length - 2;

    while (idx > 0 && pts[idx].x > wrappedX) idx--;
    while (idx < pts.length - 2 && pts[idx + 1].x < wrappedX) idx++;

    const p1 = pts[idx];
    const p2 = pts[idx + 1];
    const span = p2.x - p1.x;
    if (span <= 0) return p1.y;
    const t = (wrappedX - p1.x) / span;
    return p1.y + t * (p2.y - p1.y);
  }, []);

  // Continuous collision check against terrain and crags
  const checkTerrainCollision = useCallback((px: number, py: number): boolean => {
    const wWidth = worldDimensionsRef.current.width;
    const wrappedX = ((px % wWidth) + wWidth) % wWidth;

    for (const crag of cragsRef.current) {
      for (const offset of [0, -wWidth, wWidth]) {
        const cx = crag.x + offset;
        if (
          wrappedX >= cx &&
          wrappedX <= cx + crag.w &&
          py >= crag.y &&
          py <= crag.y + crag.h
        ) {
          const halfW = crag.w / 2;
          const relX = Math.abs(wrappedX - (cx + halfW));
          const relY = py - crag.y;
          if (relY >= 0 && relX <= halfW * (relY / crag.h)) {
            return true;
          }
        }
      }
    }

    const surfaceY = getTerrainSurfaceY(px);
    return py >= surfaceY - 1;
  }, [getTerrainSurfaceY]);

  // =========================================================================
  // RESET LANDER & REFUEL (Supports Extra Fuel in Level 1 + Duel Spawns)
  // =========================================================================
  const resetLander = useCallback((epoch: number) => {
    generateTerrain(epoch);
    const startX = 260 + Math.random() * 80;
    const initialVx = 12 + epoch * 2;
    const fuelCapacity = getMaxFuel(epoch);

    // Player 1 initialization
    landerRef.current = {
      id: 'p1',
      name: pilotName,
      themeColor: p1Theme.color,
      x: startX,
      y: 120,
      vx: initialVx,
      vy: 8 + epoch * 2,
      angle: 0,
      angularVelocity: 0,
      fuel: fuelCapacity,
      maxFuel: fuelCapacity,
      dampedFuel: fuelCapacity,
      width: getConfig('assetLanderVesselWidth') as number,
      height: getConfig('assetLanderVesselHeight') as number,
      crashed: false,
      landed: false,
      landedPad: null,
      score: landerRef.current.score,
      roundsWon: landerRef.current.roundsWon,
    };

    // Player 2 initialization (Staggered spawn for 2-Player Duel)
    landerP2Ref.current = {
      id: 'p2',
      name: p2Name,
      themeColor: p2Theme.color,
      x: startX + 90,
      y: 120,
      vx: initialVx,
      vy: 8 + epoch * 2,
      angle: 0,
      angularVelocity: 0,
      fuel: fuelCapacity,
      maxFuel: fuelCapacity,
      dampedFuel: fuelCapacity,
      width: getConfig('assetLanderVesselWidth') as number,
      height: getConfig('assetLanderVesselHeight') as number,
      crashed: false,
      landed: false,
      landedPad: null,
      score: landerP2Ref.current.score,
      roundsWon: landerP2Ref.current.roundsWon,
    };

    const halfW = gameModeRef.current === 'DUEL' ? canvasWidth / 2 : canvasWidth;
    cameraRef.current = {
      x: startX - halfW / 2,
      y: 0,
    };
    cameraP2Ref.current = {
      x: startX + 90 - halfW / 2,
      y: 0,
    };

    const firstPad = platformsRef.current[0];
    const initialDx = firstPad ? firstPad.x + firstPad.w / 2 - startX : 500;

    setTelemetry({
      fuel: fuelCapacity,
      maxFuel: fuelCapacity,
      dampedFuel: fuelCapacity,
      vy: Math.round(landerRef.current.vy),
      vx: Math.round(landerRef.current.vx),
      alt: Math.max(0, Math.round((firstPad?.y ?? 1000) - 120)),
      pitch: 0,
      nearestPadName: firstPad?.code || 'ALPHA',
      nearestPadMult: firstPad?.multiplier || 1.0,
      nearestPadDist: Math.round(Math.abs(initialDx)),
      nearestPadDir: initialDx > 10 ? 'right' : initialDx < -10 ? 'left' : 'aligned',
    });

    setTelemetryP2({
      fuel: fuelCapacity,
      maxFuel: fuelCapacity,
      dampedFuel: fuelCapacity,
      vy: Math.round(landerP2Ref.current.vy),
      vx: Math.round(landerP2Ref.current.vx),
      alt: Math.max(0, Math.round((firstPad?.y ?? 1000) - 120)),
      pitch: 0,
      nearestPadName: firstPad?.code || 'ALPHA',
      nearestPadMult: firstPad?.multiplier || 1.0,
      nearestPadDist: Math.round(Math.abs(initialDx - 90)),
      nearestPadDir: initialDx - 90 > 10 ? 'right' : initialDx - 90 < -10 ? 'left' : 'aligned',
    });

    particlesRef.current = [];
    sonarWavesRef.current = [];
    touchDebounceRef.current = 0;
    gameAudio.stopThruster();
  }, [canvasWidth, generateTerrain, getMaxFuel, p2Name, p2Theme.color, pilotName, p1Theme.color]);

  // Start / Init Game
  const initGame = useCallback(() => {
    setIsAttractMode(false);
    setIsMenuOpen(false);
    setIsHowToPlayOpen(false);
    setIsLeaderboardOpen(false);
    lastInteractionTimeRef.current = Date.now();

    // Persist pilot callsigns
    setStoredPilotName(pilotName);
    setStoredP2Name(p2Name);

    landerRef.current.score = 0;
    landerRef.current.roundsWon = 0;
    landerP2Ref.current.score = 0;
    landerP2Ref.current.roundsWon = 0;

    resetLander(1);

    setGameState({
      status: 'PLAYING',
      score: 0,
      level: 1,
      lives: getConfig('startingLives') as number,
    });

    if (sdk && typeof sdk.startGame === 'function') {
      try {
        sdk.startGame();
      } catch (e) {
        console.warn('Playground SDK startGame failed:', e);
      }
    }
    gameAudio.resume();
    gameAudio.playConfirmSelect();
  }, [p2Name, pilotName, resetLander, sdk]);

  initGameRef.current = initGame;

  usePlaygroundGameLifecycle(gameState, sdk);

  const hasAutoplayed = useRef(false);
  useEffect(() => {
    if (
      !hasAutoplayed.current &&
      new URLSearchParams(window.location.search).has('autoplay')
    ) {
      hasAutoplayed.current = true;
      initGame();
    }
  }, [initGame]);

  useEffect(() => {
    if (gameState.status === 'GAME_OVER') {
      gameAudio.stopThruster();
      gameAudio.playDefeatMotif();
    } else if (gameState.status === 'VICTORY') {
      gameAudio.stopThruster();
      gameAudio.playVictoryFanfare();
    }
  }, [gameState.status]);

  // Idle Attract Mode Loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameStateRef.current.status === 'START' && !isAttractMode) {
        if (Date.now() - lastInteractionTimeRef.current > 18000) {
          setIsAttractMode(true);
          resetLander(2);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isAttractMode, resetLander]);

  const exitAttractMode = useCallback(() => {
    lastInteractionTimeRef.current = Date.now();
    gameAudio.resume();
    if (isAttractMode) {
      setIsAttractMode(false);
      gameAudio.stopThruster();
      setGameState((prev) => ({...prev, status: 'START'}));
    }
  }, [isAttractMode]);

  // Visual Juice FX: Engine Exhaust Plumes
  const spawnExhaustParticles = (x: number, y: number, angle: number, power: number, isP2 = false) => {
    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * 0.45;
      const speed = 75 + Math.random() * 85 * power;
      const plumeAngle = angle + Math.PI / 2 + spread;
      particlesRef.current.push({
        x: x + (Math.random() - 0.5) * 4,
        y: y + (Math.random() - 0.5) * 4,
        vx: Math.cos(plumeAngle) * speed + (Math.random() - 0.5) * 20,
        vy: Math.sin(plumeAngle) * speed + (Math.random() - 0.5) * 20,
        life: 0,
        maxLife: 0.25 + Math.random() * 0.25,
        size: 3 + Math.random() * 4,
        color: isP2
          ? Math.random() > 0.4 ? '#f59e0b' : '#ef4444'
          : Math.random() > 0.4 ? '#38bdf8' : '#ffb000',
        type: 'flame',
      });
    }
  };

  // Visual Juice FX: Ground Regolith Dust Spray when thruster fires near surface
  const spawnGroundDust = (x: number, y: number) => {
    for (let i = 0; i < 4; i++) {
      const dir = Math.random() > 0.5 ? 1 : -1;
      particlesRef.current.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 4,
        vx: dir * (50 + Math.random() * 80),
        vy: -10 - Math.random() * 25,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.3,
        size: 2.5 + Math.random() * 3,
        color: '#94a3b8',
        type: 'dust',
      });
    }
  };

  const spawnRcsParticles = (x: number, y: number, angle: number, dir: 'left' | 'right') => {
    const puffAngle = angle + (dir === 'left' ? 0 : Math.PI);
    for (let i = 0; i < 3; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(puffAngle) * (45 + Math.random() * 35),
        vy: Math.sin(puffAngle) * (45 + Math.random() * 35),
        life: 0,
        maxLife: 0.16 + Math.random() * 0.12,
        size: 2 + Math.random() * 2.5,
        color: '#e2e8f0',
        type: 'rcs',
      });
    }
  };

  const spawnCrashExplosion = (x: number, y: number, hitVx = 0, hitVy = 0) => {
    gameAudio.stopThruster();
    gameAudio.resume();
    gameAudio.playCrashSound();
    screenShakeTimeRef.current = 0.6;
    crashFlashTimerRef.current = 0.45;

    for (let i = 0; i < 65; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 240;
      const spreadVx = Math.cos(angle) * speed + hitVx * 0.25;
      const spreadVy = Math.sin(angle) * speed + Math.min(0, hitVy * 0.2) - 25;
      const palette = [
        '#ef4444',
        '#f97316',
        '#f59e0b',
        '#fde047',
        '#ffffff',
        '#94a3b8',
        '#475569',
      ];
      particlesRef.current.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: spreadVx,
        vy: spreadVy,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.75,
        size: 3 + Math.random() * 5,
        color: palette[Math.floor(Math.random() * palette.length)],
        type: i % 3 === 0 ? 'debris' : 'flame',
      });
    }

    for (let j = 0; j < 25; j++) {
      const arcAngle = -Math.PI + Math.random() * Math.PI;
      const arcSpeed = 70 + Math.random() * 190;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(arcAngle) * arcSpeed + hitVx * 0.2,
        vy: Math.sin(arcAngle) * arcSpeed - 30,
        life: 0,
        maxLife: 0.7 + Math.random() * 0.7,
        size: 3.5 + Math.random() * 4,
        color: j % 2 === 0 ? '#ff3b30' : '#ff9500',
        type: 'debris',
      });
    }
  };

  const spawnTouchdownSparkles = (x: number, y: number, color = '#34d399') => {
    gameAudio.stopThruster();
    gameAudio.playVictoryFanfare();
    gameAudio.playPowerupChime();

    for (let i = 0; i < 45; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
      const speed = 40 + Math.random() * 140;
      particlesRef.current.push({
        x: x + (Math.random() - 0.5) * 45,
        y: y - 4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.6,
        size: 2.5 + Math.random() * 3.5,
        color,
        type: 'spark',
      });
    }
  };

  // Helper to find nearest pad to a lander
  const getNearestPad = useCallback((landerX: number) => {
    const pads = platformsRef.current;
    const wWidth = worldDimensionsRef.current.width;
    let closestPad = pads[0];
    let minSignedDx = 0;
    let minAbsDist = Infinity;

    for (const pad of pads) {
      const padCenterX = pad.x + pad.w / 2;
      let dx = (padCenterX - landerX) % wWidth;
      if (dx > wWidth / 2) dx -= wWidth;
      if (dx < -wWidth / 2) dx += wWidth;
      if (Math.abs(dx) < minAbsDist) {
        minAbsDist = Math.abs(dx);
        minSignedDx = dx;
        closestPad = pad;
      }
    }

    return {
      pad: closestPad,
      dist: Math.round(minAbsDist),
      dx: minSignedDx,
      dir: minSignedDx > 12 ? ('right' as const) : minSignedDx < -12 ? ('left' as const) : ('aligned' as const),
    };
  }, []);

  // =========================================================================
  // SIMULATE SINGLE LANDER (Physics, Thruster, Landing/Crash Logic)
  // =========================================================================
  const simulateLander = (
    lander: LanderState,
    inputs: {thrust: boolean; left: boolean; right: boolean},
    dt: number,
    currentEpoch: number,
    isDemo: boolean,
  ) => {
    if (lander.crashed || lander.landed) {
      return;
    }

    const worldW = worldDimensionsRef.current.width;
    const worldH = worldDimensionsRef.current.height;

    let thrusting = inputs.thrust;
    let rotatingLeft = inputs.left;
    let rotatingRight = inputs.right;

    if (isDemo) {
      const firstPad = platformsRef.current[0];
      const targetX = firstPad ? firstPad.x + firstPad.w / 2 : 600;
      const dxToPad = targetX - lander.x;
      const desiredAngle = Math.max(-0.25, Math.min(0.25, dxToPad * 0.0018));

      if (lander.angle < desiredAngle - 0.04) rotatingRight = true;
      else if (lander.angle > desiredAngle + 0.04) rotatingLeft = true;

      if (lander.vy > 28 || (lander.y > (firstPad?.y ?? 1000) - 180 && lander.vy > 14)) {
        thrusting = true;
      }
    }

    const gravity = getConfig('gravity') as number;
    const mainThrust = getConfig('mainThrust') as number;
    const rotationSpeed = getConfig('rotationSpeed') as number;
    const fuelRate = getConfig('fuelConsumptionRate') as number;

    if (rotatingLeft) {
      lander.angularVelocity = -rotationSpeed;
      spawnRcsParticles(lander.x + 18, lander.y - 8, lander.angle, 'left');
      if (!isDemo && Math.random() < 0.25) gameAudio.playRcsPuff();
    } else if (rotatingRight) {
      lander.angularVelocity = rotationSpeed;
      spawnRcsParticles(lander.x - 18, lander.y - 8, lander.angle, 'right');
      if (!isDemo && Math.random() < 0.25) gameAudio.playRcsPuff();
    } else {
      lander.angularVelocity *= 0.88;
    }

    lander.angle += lander.angularVelocity * dt;
    while (lander.angle > Math.PI) lander.angle -= Math.PI * 2;
    while (lander.angle < -Math.PI) lander.angle += Math.PI * 2;

    let ax = 0;
    let ay = gravity;

    if (currentEpoch >= 3) {
      const gust = Math.sin(Date.now() * 0.0015 + lander.y * 0.01) * (currentEpoch * 4.5);
      ax += gust;
    }

    const groundY = getTerrainSurfaceY(lander.x);
    const altAboveGround = groundY - lander.y;

    if (thrusting && lander.fuel > 0) {
      lander.fuel = Math.max(0, lander.fuel - fuelRate * dt);

      const thrustX = Math.sin(lander.angle) * mainThrust;
      const thrustY = -Math.cos(lander.angle) * mainThrust;

      ax += thrustX;
      ay += thrustY;

      const nozzleX = lander.x - Math.sin(lander.angle) * 16;
      const nozzleY = lander.y + Math.cos(lander.angle) * 16;
      spawnExhaustParticles(nozzleX, nozzleY, lander.angle, 1, lander.id === 'p2');

      // Billowing regolith dust spray when thrusters fire near the surface
      if (altAboveGround < 140) {
        spawnGroundDust(lander.x, groundY);
      }

      if (lander.id === 'p1') {
        if (!wasThrustingRef.current && !isDemo) {
          gameAudio.startThruster();
        }
        wasThrustingRef.current = true;
      } else {
        if (!wasThrustingP2Ref.current && !isDemo) {
          gameAudio.startThruster();
        }
        wasThrustingP2Ref.current = true;
      }
    } else {
      if (lander.id === 'p1') {
        if (wasThrustingRef.current) gameAudio.stopThruster();
        wasThrustingRef.current = false;
      } else {
        if (wasThrustingP2Ref.current) gameAudio.stopThruster();
        wasThrustingP2Ref.current = false;
      }
      if (thrusting && lander.fuel <= 0 && !isDemo) {
        if (Math.random() < 0.15) gameAudio.playErrorBuzz();
      }
    }

    if (lander.id === 'p1' && lander.fuel > 0 && lander.fuel <= 20 && !isDemo) {
      const nowMs = Date.now();
      if (nowMs - lastLowFuelAlarmRef.current > 1200) {
        lastLowFuelAlarmRef.current = nowMs;
        gameAudio.playLowFuelAlarm();
      }
    }

    lander.vx += ax * dt;
    lander.vy += ay * dt;
    lander.x += lander.vx * dt;
    lander.y += lander.vy * dt;

    lander.dampedFuel += (lander.fuel - lander.dampedFuel) * Math.min(1, dt * 3.3);

    // Toroidal horizontal wrapping
    if (lander.x < 0) lander.x += worldW;
    else if (lander.x >= worldW) lander.x -= worldW;

    // Contact Geometry Calculation
    const cosA = Math.cos(lander.angle);
    const sinA = Math.sin(lander.angle);

    const leftFootX = lander.x - 20 * cosA - 18 * sinA;
    const leftFootY = lander.y - 20 * sinA + 18 * cosA;

    const rightFootX = lander.x + 20 * cosA - 18 * sinA;
    const rightFootY = lander.y + 20 * sinA + 18 * cosA;

    const noseX = lander.x + 18 * sinA;
    const noseY = lander.y - 18 * cosA;

    const lowestFootY = Math.max(leftFootY, rightFootY);

    // Check contact against all 4 landing platforms
    let touchedPlatform: LandingPad | null = null;

    for (const pad of platformsRef.current) {
      const padCenterX = pad.x + pad.w / 2;
      let dx = (padCenterX - lander.x) % worldW;
      if (dx > worldW / 2) dx -= worldW;
      if (dx < -worldW / 2) dx += worldW;
      const currentPadX = lander.x + dx - pad.w / 2;

      const isOverPad =
        leftFootX >= currentPadX - 6 &&
        leftFootX <= currentPadX + pad.w + 6 &&
        rightFootX >= currentPadX - 6 &&
        rightFootX <= currentPadX + pad.w + 6;

      if (isOverPad && lowestFootY >= pad.y - 4 && lowestFootY <= pad.y + pad.h + 8) {
        touchedPlatform = pad;
        break;
      }
    }

    const hitTerrain =
      checkTerrainCollision(leftFootX, leftFootY) ||
      checkTerrainCollision(rightFootX, rightFootY) ||
      checkTerrainCollision(noseX, noseY) ||
      checkTerrainCollision(lander.x, lander.y);

    if (touchedPlatform) {
      const maxVy = getConfig('maxSafeLandingVy') as number;
      const maxVx = getConfig('maxSafeLandingVx') as number;
      const maxAngleDeg = getConfig('maxSafeAngleDeg') as number;
      const maxAngleRad = (maxAngleDeg * Math.PI) / 180;

      const safeVy = lander.vy <= maxVy && lander.vy >= -10;
      const safeVx = Math.abs(lander.vx) <= maxVx;
      const safeAngle = Math.abs(lander.angle) <= maxAngleRad;

      if (safeVy && safeVx && safeAngle) {
        lander.landed = true;
        lander.landedPad = touchedPlatform;
        lander.vx = 0;
        lander.vy = 0;
        lander.angle = 0;
        lander.y = touchedPlatform.y - 18;

        spawnTouchdownSparkles(lander.x, touchedPlatform.y, touchedPlatform.color);

        if (!isDemo) {
          handleSuccessfulLanding(lander, touchedPlatform, currentEpoch);
        }
      } else {
        lander.crashed = true;
        spawnCrashExplosion(lander.x, lowestFootY);
        let failureReason = 'STRUCTURAL IMPACT OVERLOAD';
        if (!safeVy) failureReason = `EXCESS DESCENT SPEED (${Math.round(lander.vy)} > ${maxVy} px/s)`;
        else if (!safeVx) failureReason = `EXCESS LATERAL DRIFT (${Math.round(Math.abs(lander.vx))} > ${maxVx} px/s)`;
        else if (!safeAngle) failureReason = `EXCESS TILT ANGLE (${Math.abs(Math.round((lander.angle * 180) / Math.PI))}° > ${maxAngleDeg}°)`;

        if (!isDemo) {
          handleCrash(lander, failureReason);
        }
      }
    } else if (hitTerrain) {
      lander.crashed = true;
      spawnCrashExplosion(lander.x, lowestFootY);
      if (!isDemo) {
        handleCrash(lander, 'COLLISION WITH RUGGED LUNAR BASALT');
      }
    }
  };

  // =========================================================================
  // SUCCESSFUL LANDING HANDLER (Distance Multiplier Scoring + Real Scoreboard)
  // =========================================================================
  const handleSuccessfulLanding = (
    lander: LanderState,
    pad: LandingPad,
    currentEpoch: number,
  ) => {
    const maxVy = getConfig('maxSafeLandingVy') as number;
    const fuelBonus = Math.round(lander.fuel * 15);
    const precisionBonus = Math.round(
      Math.max(0, (maxVy - lander.vy) / maxVy) * 350,
    );
    const epochBonus = currentEpoch * 1000;
    const rawPoints = epochBonus + fuelBonus + precisionBonus;

    // Feature requirement: "the farther u take a landing pad the more u score should have multiplier"
    const totalPoints = Math.round(rawPoints * pad.multiplier);

    let precisionRating: 'PERFECT' | 'EXCELLENT' | 'GOOD' | 'ROUGH' = 'GOOD';
    if (lander.vy < 15 && Math.abs(lander.angle) < 0.03) precisionRating = 'PERFECT';
    else if (lander.vy < 28) precisionRating = 'EXCELLENT';

    lander.score += totalPoints;
    lander.roundsWon += 1;

    setLastTouchdownStats({
      pilotName: lander.name,
      vy: lander.vy,
      vx: lander.vx,
      tilt: (lander.angle * 180) / Math.PI,
      fuelRemaining: lander.fuel,
      pointsAwarded: totalPoints,
      padName: pad.name,
      padMultiplier: pad.multiplier,
      isWinner: true,
    });

    const isDuel = gameModeRef.current === 'DUEL';

    // Auto-save session score to Real Data Leaderboard
    const savedEntry = saveScore({
      pilotName: lander.name,
      score: isDuel ? lander.score : gameStateRef.current.score + totalPoints,
      epoch: currentEpoch,
      padName: `${pad.code} (${pad.multiplier}x)`,
      padMultiplier: pad.multiplier,
      mode: isDuel ? 'DUEL' : 'SOLO',
      precisionRating,
    });

    setLeaderboardList(getLeaderboard());

    if (!isDuel) {
      const newScore = gameStateRef.current.score + totalPoints;
      const newEpoch = currentEpoch + 1;

      if (currentEpoch >= 5) {
        setGameState((prev) => ({
          ...prev,
          score: newScore,
          status: 'VICTORY',
        }));
      } else {
        setGameState((prev) => ({
          ...prev,
          score: newScore,
          level: newEpoch,
          status: 'LEVEL_COMPLETE',
        }));
        gameAudio.playDistortionGlitch();
        gameAudio.playLevelUpStinger();
      }
    } else {
      // In Duel mode: Declare Round / Match Winner
      setGameState((prev) => ({
        ...prev,
        score: lander.score,
        status: 'LEVEL_COMPLETE',
      }));
      gameAudio.playVictoryFanfare();
    }
  };

  const handleCrash = (lander: LanderState, reason: string) => {
    gameAudio.stopThruster();

    setLastTouchdownStats({
      pilotName: lander.name,
      vy: lander.vy,
      vx: lander.vx,
      tilt: (lander.angle * 180) / Math.PI,
      fuelRemaining: lander.fuel,
      pointsAwarded: 0,
      padName: 'NONE',
      padMultiplier: 1.0,
      reason,
      isWinner: false,
    });

    if (gameModeRef.current === 'DUEL') {
      const opponent = lander.id === 'p1' ? landerP2Ref.current : landerRef.current;
      // If opponent already landed or also crashed
      if (opponent.landed) {
        // Opponent won
        setGameState((prev) => ({...prev, status: 'LEVEL_COMPLETE'}));
      } else if (opponent.crashed) {
        // Both crashed -> Game Over round
        setGameState((prev) => ({...prev, status: 'GAME_OVER'}));
      }
      return;
    }

    const currentLives = gameStateRef.current.lives ?? 1;
    const remainingLives = currentLives - 1;

    if (remainingLives <= 0) {
      // Save final score to Leaderboard
      if (gameStateRef.current.score > 0) {
        saveScore({
          pilotName: pilotName,
          score: gameStateRef.current.score,
          epoch: gameStateRef.current.level,
          padName: 'CRASHED',
          padMultiplier: 1.0,
          mode: 'SOLO',
          precisionRating: 'ROUGH',
        });
        setLeaderboardList(getLeaderboard());
      }

      setGameState((prev) => ({
        ...prev,
        lives: 0,
        status: 'GAME_OVER',
      }));
    } else {
      setGameState((prev) => ({
        ...prev,
        lives: remainingLives,
      }));
      setTimeout(() => {
        resetLander(gameStateRef.current.level);
      }, 1500);
    }
  };

  // =========================================================================
  // MAIN UPDATE LOOP (Fixed Timestep Physics & Cameras)
  // =========================================================================
  const update = (dt: number) => {
    const isPlaying = gameStateRef.current.status === 'PLAYING';
    const isDemo = isAttractMode;

    if (!isPlaying && !isDemo) {
      gameAudio.stopThruster();
      if (gameStateRef.current.status === 'START') {
        cameraRef.current.x += dt * 36;
        landerRef.current.y = 135 + Math.sin(Date.now() * 0.002) * 10;
        landerRef.current.angle = Math.sin(Date.now() * 0.001) * 0.04;
      }
      return;
    }
    if (isMenuOpen || isHowToPlayOpen || isLeaderboardOpen) {
      gameAudio.stopThruster();
      return;
    }

    const lander = landerRef.current;
    const landerP2 = landerP2Ref.current;
    const isDuel = gameModeRef.current === 'DUEL';

    if (isDemo && (lander.crashed || lander.landed)) {
      touchDebounceRef.current += dt;
      if (touchDebounceRef.current > 3.5) {
        resetLander((gameStateRef.current.level % 5) + 1);
      }
      return;
    }

    const keys = keysPressedRef.current;
    const touch = touchInputsRef.current;
    const currentEpoch = gameStateRef.current.level;

    // Controls mapping:
    // Solo mode: either WASD or Arrow Keys pilot P1
    // Duel mode: Player 1 uses WASD; Player 2 uses Arrow Keys
    let p1Thrust = false;
    let p1Left = false;
    let p1Right = false;

    let p2Thrust = false;
    let p2Left = false;
    let p2Right = false;

    if (!isDuel) {
      p1Thrust = Boolean(keys['arrowup'] || keys['w'] || touch.p1Thrust);
      p1Left = Boolean(keys['arrowleft'] || keys['a'] || touch.p1Left);
      p1Right = Boolean(keys['arrowright'] || keys['d'] || touch.p1Right);
    } else {
      // P1: W, A, D
      p1Thrust = Boolean(keys['w'] || touch.p1Thrust);
      p1Left = Boolean(keys['a'] || touch.p1Left);
      p1Right = Boolean(keys['d'] || touch.p1Right);

      // P2: Arrow Keys
      p2Thrust = Boolean(keys['arrowup'] || touch.p2Thrust);
      p2Left = Boolean(keys['arrowleft'] || touch.p2Left);
      p2Right = Boolean(keys['arrowright'] || touch.p2Right);
    }

    simulateLander(lander, {thrust: p1Thrust, left: p1Left, right: p1Right}, dt, currentEpoch, isDemo);

    if (isDuel) {
      simulateLander(landerP2, {thrust: p2Thrust, left: p2Left, right: p2Right}, dt, currentEpoch, isDemo);
    }

    // Camera 1 tracking
    const worldH = worldDimensionsRef.current.height;
    const viewW = isDuel ? canvasWidth / 2 : canvasWidth;
    const maxCamY = Math.max(0, worldH - canvasHeight);

    const targetCam1X = lander.x - viewW / 2 + lander.vx * 0.35;
    const targetCam1Y = Math.max(0, Math.min(maxCamY, lander.y - canvasHeight * 0.45 + lander.vy * 0.25));

    const lerpFactor = Math.min(1, dt * 4.8);
    cameraRef.current.x += (targetCam1X - cameraRef.current.x) * lerpFactor;
    cameraRef.current.y += (targetCam1Y - cameraRef.current.y) * lerpFactor;
    cameraRef.current.y = Math.max(0, Math.min(maxCamY, cameraRef.current.y));

    // Camera 2 tracking (Duel Mode)
    if (isDuel) {
      const targetCam2X = landerP2.x - viewW / 2 + landerP2.vx * 0.35;
      const targetCam2Y = Math.max(0, Math.min(maxCamY, landerP2.y - canvasHeight * 0.45 + landerP2.vy * 0.25));
      cameraP2Ref.current.x += (targetCam2X - cameraP2Ref.current.x) * lerpFactor;
      cameraP2Ref.current.y += (targetCam2Y - cameraP2Ref.current.y) * lerpFactor;
      cameraP2Ref.current.y = Math.max(0, Math.min(maxCamY, cameraP2Ref.current.y));
    }

    // Particles & Sonar update
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        particlesRef.current.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    for (let i = sonarWavesRef.current.length - 1; i >= 0; i--) {
      const w = sonarWavesRef.current[i];
      w.radius += dt * 140;
      w.alpha = Math.max(0, 1 - w.radius / w.maxRadius);
      if (w.alpha <= 0) {
        sonarWavesRef.current.splice(i, 1);
      }
    }

    // Screen Shake & Crash Flash
    if (screenShakeTimeRef.current > 0) {
      screenShakeTimeRef.current = Math.max(0, screenShakeTimeRef.current - dt);
      const intensity = screenShakeTimeRef.current * 18;
      screenShakeOffsetRef.current = {
        x: (Math.random() - 0.5) * intensity,
        y: (Math.random() - 0.5) * intensity,
      };
    } else {
      screenShakeOffsetRef.current = {x: 0, y: 0};
    }

    if (crashFlashTimerRef.current > 0) {
      crashFlashTimerRef.current = Math.max(0, crashFlashTimerRef.current - dt);
    }

    // Telemetry Refresh Throttled at ~16Hz
    telemetryTimerRef.current += dt;
    if (telemetryTimerRef.current >= 0.065) {
      telemetryTimerRef.current = 0;

      const p1Nearest = getNearestPad(lander.x);
      const ground1Y = getTerrainSurfaceY(lander.x);

      setTelemetry({
        fuel: Math.max(0, Math.round(lander.fuel)),
        maxFuel: lander.maxFuel,
        dampedFuel: Math.max(0, Math.round(lander.dampedFuel)),
        vy: Math.round(lander.vy),
        vx: Math.round(lander.vx),
        alt: Math.max(0, Math.round(ground1Y - lander.y - 18)),
        pitch: Math.round((lander.angle * 180) / Math.PI),
        nearestPadName: p1Nearest.pad?.code || 'ALPHA',
        nearestPadMult: p1Nearest.pad?.multiplier || 1.0,
        nearestPadDist: p1Nearest.dist,
        nearestPadDir: p1Nearest.dir,
      });

      if (isDuel) {
        const p2Nearest = getNearestPad(landerP2.x);
        const ground2Y = getTerrainSurfaceY(landerP2.x);
        setTelemetryP2({
          fuel: Math.max(0, Math.round(landerP2.fuel)),
          maxFuel: landerP2.maxFuel,
          dampedFuel: Math.max(0, Math.round(landerP2.dampedFuel)),
          vy: Math.round(landerP2.vy),
          vx: Math.round(landerP2.vx),
          alt: Math.max(0, Math.round(ground2Y - landerP2.y - 18)),
          pitch: Math.round((landerP2.angle * 180) / Math.PI),
          nearestPadName: p2Nearest.pad?.code || 'ALPHA',
          nearestPadMult: p2Nearest.pad?.multiplier || 1.0,
          nearestPadDist: p2Nearest.dist,
          nearestPadDir: p2Nearest.dir,
        });
      }
    }
  };

  const proceedToNextEpoch = () => {
    resetLander(gameState.level);
    setGameState((prev) => ({...prev, status: 'PLAYING'}));
    gameAudio.playConfirmSelect();
  };

  // =========================================================================
  // VIEWPORT WORLD RENDERER (Shared for Solo and Both Split-Screen Sides)
  // High visual beauty: layered nebulae, blue marble Earth, twinkling stars,
  // glowing runway lights, floating holographic pad badges, dynamic engine light
  // =========================================================================
  const renderWorldViewport = (
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    viewportW: number,
    viewportH: number,
    activeLander: LanderState,
    otherLander: LanderState | null,
    isP2Side = false,
  ) => {
    const worldW = worldDimensionsRef.current.width;
    const worldH = worldDimensionsRef.current.height;
    const currentEpoch = gameStateRef.current.level;
    const epochInfo = EPOCHS[currentEpoch - 1] || EPOCHS[0];

    // 1. Deep Space Void with Cosmic Gradient
    const spaceGrad = ctx.createLinearGradient(0, 0, 0, viewportH);
    spaceGrad.addColorStop(0, '#02040a');
    spaceGrad.addColorStop(0.5, '#040814');
    spaceGrad.addColorStop(1, '#070d1e');
    ctx.fillStyle = spaceGrad;
    ctx.fillRect(0, 0, viewportW, viewportH);

    // 2. Beautiful Procedural Nebulae (Cosmic Violet & Cyan Clouds)
    ctx.save();
    const neb1Grad = ctx.createRadialGradient(
      viewportW * 0.35 - camX * 0.02,
      120 - camY * 0.02,
      20,
      viewportW * 0.35 - camX * 0.02,
      120 - camY * 0.02,
      240,
    );
    neb1Grad.addColorStop(0, 'rgba(56, 189, 248, 0.09)');
    neb1Grad.addColorStop(0.6, 'rgba(168, 85, 247, 0.05)');
    neb1Grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = neb1Grad;
    ctx.fillRect(0, 0, viewportW, viewportH);

    const neb2Grad = ctx.createRadialGradient(
      viewportW * 0.78 - camX * 0.02,
      220 - camY * 0.02,
      30,
      viewportW * 0.78 - camX * 0.02,
      220 - camY * 0.02,
      280,
    );
    neb2Grad.addColorStop(0, 'rgba(236, 72, 153, 0.07)');
    neb2Grad.addColorStop(0.5, 'rgba(59, 130, 246, 0.04)');
    neb2Grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = neb2Grad;
    ctx.fillRect(0, 0, viewportW, viewportH);
    ctx.restore();

    // 3. Realistic Glowing Earth Sphere in the Black Cosmic Sky
    const earthScreenX = viewportW * 0.82 - (camX * 0.025);
    const earthScreenY = 95 - (camY * 0.02);
    const earthRadius = 38;

    ctx.save();
    // Atmospheric backglow
    const earthGlow = ctx.createRadialGradient(
      earthScreenX,
      earthScreenY,
      earthRadius * 0.8,
      earthScreenX,
      earthScreenY,
      earthRadius * 1.5,
    );
    earthGlow.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
    earthGlow.addColorStop(0.5, 'rgba(14, 165, 233, 0.12)');
    earthGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = earthGlow;
    ctx.beginPath();
    ctx.arc(earthScreenX, earthScreenY, earthRadius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Earth globe with sunlit blue marble gradient
    const earthBody = ctx.createRadialGradient(
      earthScreenX - 12,
      earthScreenY - 12,
      4,
      earthScreenX,
      earthScreenY,
      earthRadius,
    );
    earthBody.addColorStop(0, '#7dd3fc');
    earthBody.addColorStop(0.4, '#0284c7');
    earthBody.addColorStop(0.85, '#034078');
    earthBody.addColorStop(1, '#020617');
    ctx.fillStyle = earthBody;
    ctx.beginPath();
    ctx.arc(earthScreenX, earthScreenY, earthRadius, 0, Math.PI * 2);
    ctx.fill();

    // Swirling white clouds and continents
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.arc(earthScreenX - 8, earthScreenY - 6, 9, 0, Math.PI * 2);
    ctx.arc(earthScreenX + 6, earthScreenY + 4, 11, 0, Math.PI * 2);
    ctx.arc(earthScreenX - 14, earthScreenY + 12, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4. Parallax Starfield with Multicolored Twinkling Stars
    const timeSec = Date.now() * 0.002;
    for (let i = 0; i < 68; i++) {
      const seedX = (i * 197 + 37) % 3600;
      const seedY = (i * 131 + 59) % 1500;
      const parallax = (i % 3 === 0 ? 0.08 : i % 2 === 0 ? 0.05 : 0.03);
      const sx = (((seedX - camX * parallax) % viewportW + viewportW) % viewportW);
      const sy = (((seedY - camY * parallax) % (viewportH - 80) + (viewportH - 80)) % (viewportH - 80));

      const twinkle = 0.4 + 0.6 * Math.sin(timeSec + i * 1.7);
      const colors = ['#ffffff', '#bae6fd', '#fef08a', '#fbcfe8'];
      const starColor = colors[i % colors.length];

      ctx.fillStyle = starColor;
      ctx.globalAlpha = Math.max(0.2, twinkle * 0.85);
      const size = i % 7 === 0 ? 2.5 : i % 3 === 0 ? 1.8 : 1.2;
      ctx.fillRect(Math.floor(sx), Math.floor(sy), size, size);
    }
    ctx.globalAlpha = 1.0;

    // Optional Backdrop image with seamless wrap
    const bgImg = assets['backdrop'];
    if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
      const bgOffsetX = (((-camX * 0.12) % viewportW) + viewportW) % viewportW;
      const bgOffsetY = Math.max(-60, Math.min(20, -camY * 0.05));
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.drawImage(bgImg, bgOffsetX - viewportW, bgOffsetY, viewportW, viewportH);
      ctx.drawImage(bgImg, bgOffsetX, bgOffsetY, viewportW, viewportH);
      ctx.drawImage(bgImg, bgOffsetX + viewportW, bgOffsetY, viewportW, viewportH);
      ctx.restore();
    }

    // -----------------------------------------------------------------------
    // CAMERA WORLD MATRIX
    // -----------------------------------------------------------------------
    ctx.save();
    ctx.translate(-camX, -camY);

    const startChunk = Math.floor((camX - 100) / worldW);
    const endChunk = Math.floor((camX + viewportW + 100) / worldW);

    // 5. Draw Crag Spire Obstacles
    const crags = cragsRef.current;
    const cragImg = assets['crag'];
    for (let k = startChunk; k <= endChunk; k++) {
      const chunkOffset = k * worldW;
      for (const c of crags) {
        const renderX = c.x + chunkOffset;
        if (
          renderX + c.w < camX - 60 ||
          renderX > camX + viewportW + 60 ||
          c.y + c.h < camY - 60 ||
          c.y > camY + viewportH + 60
        ) {
          continue;
        }

        drawAsset(ctx, cragImg, renderX, c.y, c.w, c.h, (fallbackCtx) => {
          fallbackCtx.fillStyle = '#27354a';
          fallbackCtx.beginPath();
          fallbackCtx.moveTo(renderX + c.w / 2, c.y);
          fallbackCtx.lineTo(renderX + c.w, c.y + c.h);
          fallbackCtx.lineTo(renderX, c.y + c.h);
          fallbackCtx.closePath();
          fallbackCtx.fill();
        });
      }
    }

    // 6. Draw Clean Foreground Lunar Terrain Polygon
    const terrain = terrainRef.current;
    if (terrain.length > 1) {
      for (let k = startChunk; k <= endChunk; k++) {
        const chunkOffset = k * worldW;
        ctx.beginPath();
        ctx.moveTo(chunkOffset, worldH);
        ctx.lineTo(chunkOffset, terrain[0].y);
        for (let i = 0; i < terrain.length; i++) {
          ctx.lineTo(chunkOffset + terrain[i].x, terrain[i].y);
        }
        ctx.lineTo(chunkOffset + worldW, terrain[terrain.length - 1].y);
        ctx.lineTo(chunkOffset + worldW, worldH);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, worldH * 0.5, 0, worldH);
        grad.addColorStop(0, '#1c2638');
        grad.addColorStop(0.35, '#101726');
        grad.addColorStop(1, '#050811');
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(chunkOffset + terrain[0].x, terrain[0].y);
        for (let i = 1; i < terrain.length; i++) {
          ctx.lineTo(chunkOffset + terrain[i].x, terrain[i].y);
        }
        ctx.strokeStyle = epochInfo.themeColor;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 2; i < terrain.length - 2; i += 3) {
          ctx.moveTo(chunkOffset + terrain[i].x, terrain[i].y + 1);
          ctx.lineTo(chunkOffset + terrain[i].x, terrain[i].y + 6);
        }
        ctx.stroke();
      }
    }

    // 7. Draw Multiple Landing Platforms across visible chunks with holographic multipliers
    const platformImg = assets['platform'];
    const runwayStep = Math.floor(Date.now() / 150) % 4;

    for (let k = startChunk; k <= endChunk; k++) {
      for (const pad of platformsRef.current) {
        const currentPadX = pad.x + k * worldW;
        if (
          currentPadX + pad.w < camX - 100 ||
          currentPadX > camX + viewportW + 100
        ) {
          continue;
        }

        // Base foundation
        ctx.fillStyle = '#064e3b';
        ctx.fillRect(currentPadX - 4, pad.y, pad.w + 8, pad.h + 6);
        ctx.strokeStyle = pad.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(currentPadX - 4, pad.y, pad.w + 8, pad.h + 6);

        drawAsset(ctx, platformImg, currentPadX, pad.y, pad.w, pad.h, (fallbackCtx) => {
          fallbackCtx.fillStyle = '#022c22';
          fallbackCtx.fillRect(currentPadX, pad.y, pad.w, pad.h);
          fallbackCtx.strokeStyle = pad.color;
          fallbackCtx.lineWidth = 2.5;
          fallbackCtx.strokeRect(currentPadX, pad.y, pad.w, pad.h);
        });

        // Vertical holographic guidance beams
        ctx.save();
        ctx.strokeStyle = pad.glowColor;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(currentPadX, pad.y);
        ctx.lineTo(currentPadX, pad.y - 200);
        ctx.moveTo(currentPadX + pad.w, pad.y);
        ctx.lineTo(currentPadX + pad.w, pad.y - 200);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Flanking strobe beacon lights
        const strobePhase = Math.floor(Date.now() / 200) % 2;
        ctx.fillStyle = strobePhase === 0 ? pad.color : '#ffffff';
        ctx.shadowColor = pad.color;
        ctx.shadowBlur = 14;
        ctx.fillRect(currentPadX - 3, pad.y - 16, 6, 16);
        ctx.fillRect(currentPadX + pad.w - 3, pad.y - 16, 6, 16);
        ctx.shadowBlur = 0;

        // Floating 3D Holographic Label & Score Multiplier
        ctx.save();
        const holoPulse = 0.75 + 0.25 * Math.sin(Date.now() * 0.005);
        ctx.globalAlpha = holoPulse;

        // Multiplier Pill Badge
        const badgeY = pad.y - 36;
        ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
        ctx.fillRect(currentPadX + pad.w / 2 - 44, badgeY, 88, 16);
        ctx.strokeStyle = pad.color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(currentPadX + pad.w / 2 - 44, badgeY, 88, 16);

        ctx.fillStyle = pad.color;
        ctx.font = 'bold 8px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${pad.code} [${pad.multiplier}x]`, currentPadX + pad.w / 2, badgeY + 11);

        ctx.restore();

        // Runway chevrons
        ctx.fillStyle = pad.color;
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        const chevronText = runwayStep % 2 === 0 ? '>>> LAND HERE <<<' : '>> MULTIPLIER <<';
        ctx.fillText(chevronText, currentPadX + pad.w / 2, pad.y + 18);
        ctx.textAlign = 'left';
      }
    }

    // 8. Sonar Wave Ripples
    const waves = sonarWavesRef.current;
    for (const w of waves) {
      ctx.strokeStyle = `rgba(52, 211, 153, ${w.alpha * 0.75})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(w.x, w.y, Math.max(0, w.radius), 0, Math.PI * 2);
      ctx.stroke();
    }

    // 9. Particles (Flame, Smoke, Regolith Dust, Sparks, Debris)
    const particles = particlesRef.current;
    for (const p of particles) {
      const alpha = 1 - p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, alpha);
      const pSize = Math.max(1, p.size * (1 - (p.life / p.maxLife) * 0.5));
      ctx.fillRect(p.x - pSize / 2, p.y - pSize / 2, pSize, pSize);
    }
    ctx.globalAlpha = 1.0;

    // 10. Draw Other Player Lander (if in Duel mode)
    if (otherLander && !otherLander.crashed) {
      ctx.save();
      ctx.translate(otherLander.x, otherLander.y);
      ctx.rotate(otherLander.angle);

      const landerImg = assets['lander'];
      const lw = otherLander.width;
      const lh = otherLander.height;

      // Draw tinted hull for opponent
      drawAsset(ctx, landerImg, -lw / 2, -lh / 2, lw, lh, (fallbackCtx) => {
        fallbackCtx.fillStyle = otherLander.themeColor;
        fallbackCtx.fillRect(-lw / 2, -lh / 2, lw, lh);
      });

      // Name tag above other player
      ctx.restore();
      ctx.save();
      ctx.fillStyle = otherLander.themeColor;
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(otherLander.name, otherLander.x, otherLander.y - 24);
      ctx.restore();
    }

    // 11. Draw Active Player Lander Vessel
    if (!activeLander.crashed) {
      ctx.save();
      ctx.translate(activeLander.x, activeLander.y);
      ctx.rotate(activeLander.angle);

      const landerImg = assets['lander'];
      const lw = activeLander.width;
      const lh = activeLander.height;

      drawAsset(ctx, landerImg, -lw / 2, -lh / 2, lw, lh, (fallbackCtx) => {
        fallbackCtx.fillStyle = activeLander.themeColor;
        fallbackCtx.fillRect(-lw / 2, -lh / 2, lw, lh);
      });

      // Dynamic engine spotlight illuminating the ground below
      if (activeLander.y < worldH) {
        ctx.restore();
        ctx.save();
        const flameGlow = ctx.createRadialGradient(
          activeLander.x,
          activeLander.y + 12,
          5,
          activeLander.x,
          activeLander.y + 36,
          48,
        );
        flameGlow.addColorStop(0, 'rgba(255, 176, 0, 0.28)');
        flameGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = flameGlow;
        ctx.beginPath();
        ctx.arc(activeLander.x, activeLander.y + 24, 48, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.save();
      }

      ctx.restore();

      // Pilot Name Tag above lander
      ctx.save();
      ctx.fillStyle = activeLander.themeColor;
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(activeLander.name, activeLander.x, activeLander.y - 24);
      ctx.restore();
    }

    // Modern Guidance Trajectory Pip
    if (epochInfo.hudStyle === 'modern') {
      ctx.save();
      ctx.strokeStyle = activeLander.themeColor;
      ctx.lineWidth = 1.5;

      const pipX = activeLander.x + activeLander.vx * 1.8;
      const pipY = activeLander.y + activeLander.vy * 1.8;
      ctx.beginPath();
      ctx.arc(pipX, pipY, 6, 0, Math.PI * 2);
      ctx.moveTo(pipX - 10, pipY);
      ctx.lineTo(pipX + 10, pipY);
      ctx.moveTo(pipX, pipY - 10);
      ctx.lineTo(pipX, pipY + 10);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore(); // Restore Camera Matrix

    // -----------------------------------------------------------------------
    // SENSORY BLACKOUT / EIGHTIES CRT OVERLAYS
    // -----------------------------------------------------------------------
    if (epochInfo.hudStyle === 'blackout') {
      const screenLanderX = activeLander.x - camX;
      const screenLanderY = activeLander.y - camY;
      const groundY = getTerrainSurfaceY(activeLander.x);
      const padDist = Math.max(0, groundY - activeLander.y);
      const closeRadius = Math.max(30, 150 - padDist * 0.15);

      const darknessGrad = ctx.createRadialGradient(
        screenLanderX,
        screenLanderY,
        15,
        screenLanderX,
        screenLanderY,
        Math.max(25, closeRadius),
      );
      darknessGrad.addColorStop(0, 'rgba(3, 7, 18, 0.45)');
      darknessGrad.addColorStop(0.4, 'rgba(3, 7, 18, 0.9)');
      darknessGrad.addColorStop(1, 'rgba(3, 7, 18, 0.985)');

      ctx.fillStyle = darknessGrad;
      ctx.fillRect(0, 0, viewportW, viewportH);

      ctx.fillStyle = '#ef4444';
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ACOUSTIC SONAR ACTIVE - FLY BY AUDIO]', viewportW / 2, 44);
      ctx.textAlign = 'left';
    }

    if (epochInfo.hudStyle === 'eighties') {
      const groundY = getTerrainSurfaceY(activeLander.x);
      const padDist = Math.max(0, groundY - activeLander.y);
      if (padDist < 300 && Math.floor(Date.now() / 110) % 2 === 0) {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
        ctx.fillRect(0, 0, viewportW, viewportH);
      }
    }

    // -----------------------------------------------------------------------
    // TACTICAL RADAR MINIMAP (Modern & Y2K Epochs)
    // -----------------------------------------------------------------------
    if (epochInfo.hudStyle === 'modern' || epochInfo.hudStyle === 'y2k') {
      const radarW = 140;
      const radarH = 50;
      const radarX = viewportW - radarW - 14;
      const radarY = 14;

      ctx.save();
      ctx.fillStyle = 'rgba(2, 6, 23, 0.92)';
      ctx.fillRect(radarX, radarY, radarW, radarH);
      ctx.strokeStyle = activeLander.themeColor;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(radarX, radarY, radarW, radarH);

      ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
      ctx.lineWidth = 1;
      const scaleX = radarW / worldW;
      const scaleY = radarH / worldH;

      // Draw all 4 pads on radar with their respective multiplier colors
      for (const pad of platformsRef.current) {
        const rPadX = radarX + pad.x * scaleX;
        const rPadW = Math.max(4, pad.w * scaleX);
        const rPadY = radarY + pad.y * scaleY;
        ctx.fillStyle = pad.color;
        ctx.fillRect(rPadX, rPadY - 1, rPadW, 3);
      }

      // Draw active lander pip
      const wrappedLanderX = ((activeLander.x % worldW) + worldW) % worldW;
      const rLanderX = radarX + wrappedLanderX * scaleX;
      const rLanderY = radarY + activeLander.y * scaleY;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(rLanderX, rLanderY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = activeLander.themeColor;
      ctx.font = '6px "Press Start 2P", monospace';
      ctx.fillText('RADAR', radarX + 5, radarY + 11);
      ctx.restore();
    }

    // Scanline & CRT vignette
    ctx.save();
    ctx.fillStyle =
      epochInfo.hudStyle === 'eighties'
        ? 'rgba(245, 158, 11, 0.04)'
        : epochInfo.hudStyle === 'y2k'
        ? 'rgba(34, 197, 94, 0.03)'
        : 'rgba(0, 0, 0, 0.12)';

    for (let y = 0; y < viewportH; y += 4) {
      ctx.fillRect(0, y, viewportW, 1.2);
    }
    ctx.restore();
  };

  // =========================================================================
  // MAIN DRAW LOOP (Split-Screen / Solo Canvas Routing)
  // =========================================================================
  const draw = (ctx: CanvasRenderingContext2D) => {
    prepareCanvas(ctx, canvasWidth, canvasHeight);

    const isDuel = gameModeRef.current === 'DUEL';
    const lander = landerRef.current;
    const landerP2 = landerP2Ref.current;

    ctx.save();
    if (screenShakeTimeRef.current > 0) {
      ctx.translate(screenShakeOffsetRef.current.x, screenShakeOffsetRef.current.y);
    }

    if (!isDuel) {
      // SOLO MODE: Full canvas viewport
      renderWorldViewport(
        ctx,
        cameraRef.current.x,
        cameraRef.current.y,
        canvasWidth,
        canvasHeight,
        lander,
        null,
        false,
      );
    } else {
      // 2-PLAYER SPLIT SCREEN: Left (P1) and Right (P2)
      const halfW = canvasWidth / 2 - 2;

      // Viewport 1 (Player 1)
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, halfW, canvasHeight);
      ctx.clip();
      renderWorldViewport(
        ctx,
        cameraRef.current.x,
        cameraRef.current.y,
        halfW,
        canvasHeight,
        lander,
        landerP2,
        false,
      );
      ctx.restore();

      // Viewport 2 (Player 2)
      ctx.save();
      ctx.translate(canvasWidth / 2 + 2, 0);
      ctx.beginPath();
      ctx.rect(0, 0, halfW, canvasHeight);
      ctx.clip();
      renderWorldViewport(
        ctx,
        cameraP2Ref.current.x,
        cameraP2Ref.current.y,
        halfW,
        canvasHeight,
        landerP2,
        lander,
        true,
      );
      ctx.restore();

      // Center Divider: High-tech vertical beam
      const divX = canvasWidth / 2 - 2;
      const pulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.008);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(divX, 0, 4, canvasHeight);
      ctx.fillStyle = `rgba(56, 189, 248, ${pulse})`;
      ctx.fillRect(divX + 1, 0, 2, canvasHeight);

      // VS Badge in center
      const vsY = canvasHeight / 2 - 16;
      ctx.fillStyle = '#020617';
      ctx.fillRect(divX - 22, vsY, 48, 32);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(divX - 22, vsY, 48, 32);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 9px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('VS', divX + 2, vsY + 20);
      ctx.textAlign = 'left';
    }

    ctx.restore();
  };

  const updateRef = useRef(update);
  const drawRef = useRef(draw);
  updateRef.current = update;
  drawRef.current = draw;

  useEffect(() => {
    let raf = 0;
    const loop = (time: number) => {
      if (inputRef.current) {
        const cancelPressed = inputRef.current.actions.cancel;
        if (cancelPressed) {
          exitAttractMode();
        }
      }

      stepperRef.current?.(time, (dt) => updateRef.current(dt));

      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) drawRef.current(ctx);

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [exitAttractMode]);

  const activeEpoch = EPOCHS[gameState.level - 1] || EPOCHS[0];
  const isPlayingMusic =
    !isMusicMuted &&
    ['PLAYING', 'LEVEL_COMPLETE'].includes(gameState.status) &&
    !isAttractMode;

  const currentFuelP1 = activeEpoch.hudStyle === 'apollo' ? telemetry.dampedFuel : telemetry.fuel;
  const isLowFuelP1 = currentFuelP1 < 25;

  const currentFuelP2 = activeEpoch.hudStyle === 'apollo' ? telemetryP2.dampedFuel : telemetryP2.fuel;
  const isLowFuelP2 = currentFuelP2 < 25;

  return (
    <div
      onClick={exitAttractMode}
      onKeyDown={exitAttractMode}
      className="fixed inset-0 overflow-hidden touch-none flex flex-col items-center justify-between bg-[#08080c] text-emerald-400 select-none"
      style={{fontFamily: getConfig('fontFamily') as string}}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" />

      <BackgroundMusic
        url={BACKGROUND_MUSIC_URL}
        isPlaying={isPlayingMusic}
        isMuted={isMusicMuted}
      />

      {!assetsReady && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#08080c] text-emerald-400 border-4 border-emerald-500 rounded-none">
          <Zap className="animate-spin mb-4" size={36} />
          <div className="text-sm tracking-widest uppercase font-bold text-center">
            [ CALIBRATING MULTI-PAD TOPOGRAPHY & AVIONICS ]
          </div>
        </div>
      )}

      {/* TOP HUD BAR */}
      <header className="w-full bg-[#08080c] border-b-4 border-emerald-500 px-3 py-2 z-20 shrink-0 flex flex-wrap items-center justify-between gap-2 shadow-[0_4px_0_0_#064e3b] rounded-none">
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[8px] uppercase tracking-wider text-emerald-600 font-bold">
                {getConfig('title') as string}
              </span>
              <span className={`text-[7px] font-bold px-1.5 py-0.2 border uppercase ${
                gameMode === 'DUEL'
                  ? 'border-yellow-500 text-yellow-400 bg-yellow-950/40'
                  : 'border-emerald-600 text-emerald-400 bg-emerald-950/40'
              }`}>
                {gameMode === 'DUEL' ? '2P SPLIT SCREEN DUEL' : 'SOLO EXPEDITION'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="text-[9px] md:text-[10px] font-bold px-2 py-0.5 border-2 shadow-[2px_2px_0px_0px_#000] uppercase rounded-none"
                style={{
                  color: activeEpoch.themeColor,
                  borderColor: activeEpoch.themeColor,
                  backgroundColor: `${activeEpoch.themeColor}15`,
                }}>
                EPOCH {gameState.level}: {activeEpoch.name}
              </span>
              <span className="text-[8px] text-zinc-500 hidden sm:inline uppercase">
                [{activeEpoch.era}]
              </span>
            </div>
          </div>
        </div>

        {/* Telemetry Readouts (Player 1 & Player 2) */}
        <div className="flex items-center gap-1.5 md:gap-2 text-[9px] flex-wrap">
          {/* P1 Telemetry */}
          <div className={`flex items-center gap-1.5 bg-black px-2 py-1 border-2 shadow-[2px_2px_0px_0px_#000] rounded-none ${
            isLowFuelP1 ? 'border-red-500 animate-pulse' : 'border-emerald-600'
          }`}>
            <Zap
              size={12}
              className={isLowFuelP1 ? 'text-red-500 animate-bounce' : 'text-emerald-400'}
            />
            <div className="flex flex-col">
              <span className="text-zinc-500 text-[7px] leading-none">
                {gameMode === 'DUEL' ? 'P1 FUEL' : 'FUEL'}
                {gameState.level === 1 && ' (180L BONUS)'}
              </span>
              <span className={`font-bold ${isLowFuelP1 ? 'text-red-400' : 'text-emerald-400'}`}>
                {currentFuelP1} / {telemetry.maxFuel}L
              </span>
            </div>
          </div>

          {/* In Duel Mode, display P2 Fuel */}
          {gameMode === 'DUEL' && (
            <div className={`flex items-center gap-1.5 bg-black px-2 py-1 border-2 shadow-[2px_2px_0px_0px_#000] rounded-none ${
              isLowFuelP2 ? 'border-red-500 animate-pulse' : 'border-amber-500'
            }`}>
              <Zap
                size={12}
                className={isLowFuelP2 ? 'text-red-500 animate-bounce' : 'text-amber-400'}
              />
              <div className="flex flex-col">
                <span className="text-zinc-500 text-[7px] leading-none">P2 FUEL</span>
                <span className={`font-bold ${isLowFuelP2 ? 'text-red-400' : 'text-amber-400'}`}>
                  {currentFuelP2} / {telemetryP2.maxFuel}L
                </span>
              </div>
            </div>
          )}

          {/* Navigation Beacon: Multiplier & Nearest Pad */}
          <div className="flex items-center gap-1.5 bg-black px-2 py-1 border-2 border-emerald-700 shadow-[2px_2px_0px_0px_#000] rounded-none">
            <Compass size={11} className="text-emerald-400 animate-spin" />
            <div className="flex flex-col">
              <span className="text-zinc-500 text-[7px] leading-none">TARGET PAD</span>
              <span className="font-bold text-emerald-300 text-[8px]">
                {telemetry.nearestPadName} [{telemetry.nearestPadMult}x] {telemetry.nearestPadDir === 'aligned' ? '▼ ALIGNED' : telemetry.nearestPadDir === 'left' ? `◄ ${telemetry.nearestPadDist}M` : `${telemetry.nearestPadDist}M ►`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-black px-2 py-1 border-2 border-zinc-700 shadow-[2px_2px_0px_0px_#000] rounded-none">
            <Activity size={12} className="text-cyan-400" />
            <div className="flex flex-col">
              <span className="text-zinc-500 text-[7px] leading-none">V-SPD</span>
              <span
                className={`font-bold ${
                  Math.abs(telemetry.vy) > (getConfig('maxSafeLandingVy') as number)
                    ? 'text-red-400 animate-pulse'
                    : 'text-cyan-300'
                }`}>
                {telemetry.vy} PX/S
              </span>
            </div>
          </div>

          {gameMode === 'SOLO' && (
            <div className="flex items-center gap-1 bg-black px-2 py-1 border-2 border-zinc-700 shadow-[2px_2px_0px_0px_#000] rounded-none">
              <span className="text-[7px] text-zinc-500">RESERVES:</span>
              <span className="text-[9px] font-bold text-yellow-400">
                {gameState.lives ?? 3}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1 bg-black px-2 py-1 border-2 border-zinc-700 shadow-[2px_2px_0px_0px_#000] rounded-none">
            <span className="text-[7px] text-zinc-500">SCORE:</span>
            <span className="text-[9px] font-bold text-emerald-400">
              {gameState.score}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              exitAttractMode();
              setIsLeaderboardOpen(true);
              gameAudio.playCrispClick();
            }}
            title="View Scoreboard"
            className="bg-black hover:bg-yellow-400 hover:text-black text-yellow-400 border-2 border-yellow-500 px-2 py-1 shadow-[2px_2px_0px_0px_#78350f] active:translate-x-0.5 active:translate-y-0.5 transition text-[9px] font-bold min-w-[40px] min-h-[40px] flex items-center justify-center uppercase rounded-none">
            <Trophy size={14} className="mr-1" />
            <span className="hidden md:inline">ROSTER</span>
          </button>

          <button
            onClick={() => {
              exitAttractMode();
              setIsMenuOpen((prev) => !prev);
              gameAudio.playCrispClick();
            }}
            aria-label="Toggle Game Menu"
            className="bg-black hover:bg-emerald-400 hover:text-black text-emerald-400 border-2 border-emerald-500 px-2 py-1 shadow-[2px_2px_0px_0px_#064e3b] active:translate-x-0.5 active:translate-y-0.5 transition text-[9px] font-bold min-w-[40px] min-h-[40px] flex items-center justify-center uppercase rounded-none">
            <Menu size={14} className="mr-1" />
            <span>MENU</span>
          </button>
        </div>
      </header>

      {isAttractMode && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-black border-2 border-yellow-400 px-4 py-1.5 shadow-[4px_4px_0_0_#ca8a04] text-yellow-400 text-[9px] font-bold tracking-wider animate-pulse flex items-center gap-2 rounded-none">
          <Sparkles size={14} />
          <span>ATTRACT DEMO: TAP ANY BUTTON TO PILOT</span>
        </div>
      )}

      {/* GAME CANVAS */}
      <main
        onPointerDown={() => gameAudio.resume()}
        className="flex-1 w-full min-h-0 flex items-center justify-center bg-black relative overflow-hidden">
        {assetsReady && (
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            style={{
              aspectRatio: `${canvasWidth} / ${canvasHeight}`,
              width: `min(100%, calc(100vh * ${canvasWidth} / ${canvasHeight}))`,
            }}
            className="h-auto max-w-full max-h-full cursor-crosshair rounded-none"
          />
        )}
      </main>

      {/* MOBILE CONTROLS (Ergonomic for Solo and 2-Player Split Screen) */}
      {isMobile && (
        <footer className="w-full bg-[#08080c] border-t-4 border-emerald-500 px-3 py-2 z-30 flex items-center justify-between shrink-0 touch-none rounded-none shadow-[0_-4px_0_0_#064e3b]">
          {gameMode === 'SOLO' ? (
            <>
              <div className="flex items-center gap-2">
                <button
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    touchInputsRef.current.p1Left = true;
                    gameAudio.playRcsPuff();
                  }}
                  onPointerUp={() => (touchInputsRef.current.p1Left = false)}
                  onPointerLeave={() => (touchInputsRef.current.p1Left = false)}
                  onPointerCancel={() => (touchInputsRef.current.p1Left = false)}
                  className="w-12 h-12 min-w-[48px] min-h-[48px] bg-black active:bg-emerald-400 border-2 border-emerald-500 text-emerald-400 active:text-black font-bold text-lg flex items-center justify-center shadow-[2px_2px_0_0_#064e3b] select-none rounded-none">
                  ◄
                </button>
                <button
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    touchInputsRef.current.p1Right = true;
                    gameAudio.playRcsPuff();
                  }}
                  onPointerUp={() => (touchInputsRef.current.p1Right = false)}
                  onPointerLeave={() => (touchInputsRef.current.p1Right = false)}
                  onPointerCancel={() => (touchInputsRef.current.p1Right = false)}
                  className="w-12 h-12 min-w-[48px] min-h-[48px] bg-black active:bg-emerald-400 border-2 border-emerald-500 text-emerald-400 active:text-black font-bold text-lg flex items-center justify-center shadow-[2px_2px_0_0_#064e3b] select-none rounded-none">
                  ►
                </button>
              </div>

              <button
                onClick={() => {
                  resetLander(gameState.level);
                  gameAudio.playConfirmSelect();
                }}
                className="px-2 py-1 min-w-[44px] min-h-[44px] bg-black active:bg-zinc-800 border-2 border-zinc-700 text-zinc-300 text-[8px] flex flex-col items-center justify-center gap-1 shadow-[2px_2px_0_0_#000] font-bold uppercase rounded-none">
                <RotateCw size={12} />
                <span>RESET</span>
              </button>

              <button
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  touchInputsRef.current.p1Thrust = true;
                }}
                onPointerUp={() => (touchInputsRef.current.p1Thrust = false)}
                onPointerLeave={() => (touchInputsRef.current.p1Thrust = false)}
                onPointerCancel={() => (touchInputsRef.current.p1Thrust = false)}
                className="w-24 h-12 min-w-[48px] min-h-[48px] bg-black active:bg-emerald-400 border-2 border-emerald-400 text-emerald-400 active:text-black font-bold text-[9px] tracking-wider flex items-center justify-center gap-1 shadow-[2px_2px_0_0_#064e3b] select-none uppercase rounded-none">
                <Zap size={14} />
                <span>THRUST</span>
              </button>
            </>
          ) : (
            // 2P Duel Touch Controls
            <div className="w-full flex items-center justify-between text-[8px]">
              {/* P1 Controls */}
              <div className="flex items-center gap-1.5 border-r border-zinc-800 pr-2">
                <span className="text-cyan-400 font-bold block">P1:</span>
                <button
                  onPointerDown={() => (touchInputsRef.current.p1Left = true)}
                  onPointerUp={() => (touchInputsRef.current.p1Left = false)}
                  className="w-10 h-10 bg-black active:bg-cyan-400 border border-cyan-400 text-cyan-400 active:text-black font-bold flex items-center justify-center">
                  ◄
                </button>
                <button
                  onPointerDown={() => (touchInputsRef.current.p1Right = true)}
                  onPointerUp={() => (touchInputsRef.current.p1Right = false)}
                  className="w-10 h-10 bg-black active:bg-cyan-400 border border-cyan-400 text-cyan-400 active:text-black font-bold flex items-center justify-center">
                  ►
                </button>
                <button
                  onPointerDown={() => (touchInputsRef.current.p1Thrust = true)}
                  onPointerUp={() => (touchInputsRef.current.p1Thrust = false)}
                  className="px-2 h-10 bg-black active:bg-cyan-400 border border-cyan-400 text-cyan-400 active:text-black font-bold flex items-center justify-center">
                  W
                </button>
              </div>

              {/* P2 Controls */}
              <div className="flex items-center gap-1.5 pl-2">
                <span className="text-amber-400 font-bold block">P2:</span>
                <button
                  onPointerDown={() => (touchInputsRef.current.p2Left = true)}
                  onPointerUp={() => (touchInputsRef.current.p2Left = false)}
                  className="w-10 h-10 bg-black active:bg-amber-400 border border-amber-400 text-amber-400 active:text-black font-bold flex items-center justify-center">
                  ◄
                </button>
                <button
                  onPointerDown={() => (touchInputsRef.current.p2Right = true)}
                  onPointerUp={() => (touchInputsRef.current.p2Right = false)}
                  className="w-10 h-10 bg-black active:bg-amber-400 border border-amber-400 text-amber-400 active:text-black font-bold flex items-center justify-center">
                  ►
                </button>
                <button
                  onPointerDown={() => (touchInputsRef.current.p2Thrust = true)}
                  onPointerUp={() => (touchInputsRef.current.p2Thrust = false)}
                  className="px-2 h-10 bg-black active:bg-amber-400 border border-amber-400 text-amber-400 active:text-black font-bold flex items-center justify-center">
                  ▲
                </button>
              </div>
            </div>
          )}
        </footer>
      )}

      {/* START SCREEN: Session Name Input, Mode Selector, Mission Briefing */}
      {gameState.status === 'START' && !isAttractMode && (
        <MenuOverlay tone="neutral" zIndex={40}>
          <div className="w-full max-w-2xl bg-[#08080c]/95 backdrop-blur-md border-4 border-emerald-500 p-4 md:p-6 shadow-[10px_10px_0px_0px_#064e3b] flex flex-col items-center text-emerald-400 rounded-none relative">
            
            {/* Top All-Time High Score Ticker Banner */}
            {leaderboardList && leaderboardList.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setIsLeaderboardOpen(true);
                  gameAudio.playCrispClick();
                }}
                className="w-full bg-yellow-950/40 hover:bg-yellow-900/60 border-2 border-yellow-500/70 px-3 py-1.5 mb-3 text-[8px] md:text-[9px] flex items-center justify-between text-yellow-300 font-mono tracking-wider transition group shadow-[2px_2px_0px_0px_#78350f]">
                <span className="flex items-center gap-2 font-bold">
                  <Trophy size={14} className="text-yellow-400 animate-bounce" />
                  <span>ALL-TIME RECORD: <strong className="text-yellow-200">{leaderboardList[0].pilotName}</strong> — {leaderboardList[0].score.toLocaleString()} PTS</span>
                </span>
                <span className="text-[7px] text-yellow-400 uppercase flex items-center gap-1 group-hover:text-yellow-200 font-bold">
                  <span>[{leaderboardList[0].padName}]</span>
                  <ChevronRight size={12} />
                </span>
              </button>
            )}

            {/* Glowing Retro Terminal Header */}
            <div className="flex flex-col items-center text-center my-1 mb-4 w-full">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-[8px] md:text-[9px] uppercase tracking-widest border-b-2 border-emerald-800/80 pb-1 mb-1.5 justify-center w-full">
                <Radio size={13} className="animate-pulse text-emerald-400" />
                <span>APOLLO GUIDANCE OS // LUNAR INSERTION TERMINAL</span>
              </div>
              <h1 className="text-2xl md:text-4xl font-black tracking-wider text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.5)] flex items-center gap-2">
                <span>RETROGRADE DESCENT</span>
              </h1>
              <p className="text-[8px] md:text-[9px] text-zinc-400 mt-1 uppercase tracking-wide">
                AVIONICS REGRESSION SIMULATION • MULTI-PLATFORM EXPEDITION
              </p>
            </div>

            {/* Rich Interactive Game Mode Selection Cards */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
              {/* Solo Expedition Card */}
              <button
                type="button"
                onClick={() => {
                  setGameMode('SOLO');
                  gameAudio.playCrispClick();
                }}
                className={`p-3 border-2 text-left flex flex-col justify-between transition relative rounded-none ${
                  gameMode === 'SOLO'
                    ? 'bg-emerald-950/50 border-emerald-400 shadow-[4px_4px_0_0_#064e3b]'
                    : 'bg-black/80 border-zinc-800 hover:border-emerald-600/70 text-zinc-400'
                }`}>
                {gameMode === 'SOLO' && (
                  <span className="absolute top-2 right-2 flex items-center gap-1 text-[7px] bg-emerald-500 text-black px-1.5 py-0.5 font-bold uppercase">
                    <Check size={10} /> ACTIVE
                  </span>
                )}
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Rocket size={15} className={gameMode === 'SOLO' ? 'text-emerald-400' : 'text-zinc-500'} />
                    <span className={`text-[10px] font-bold uppercase ${gameMode === 'SOLO' ? 'text-emerald-300' : 'text-zinc-300'}`}>
                      SOLO EXPEDITION
                    </span>
                  </div>
                  <span className="text-[7px] text-emerald-500/90 font-mono uppercase block mb-1.5">
                    [ 5 HISTORICAL DEGRADATION ERAS ]
                  </span>
                  <p className="text-[8px] text-zinc-400 leading-relaxed">
                    Pilot across endless terrain. Instruments regress from Glass Cockpit down to pure Acoustic Sonar in Epoch 5.
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-zinc-800 flex items-center justify-between text-[7px] text-zinc-500 font-mono">
                  <span>CONTROLS: WASD / ARROWS</span>
                  <span className="text-emerald-400 font-bold">1 PLAYER</span>
                </div>
              </button>

              {/* 2-Player Split Screen Duel Card */}
              <button
                type="button"
                onClick={() => {
                  setGameMode('DUEL');
                  gameAudio.playCrispClick();
                }}
                className={`p-3 border-2 text-left flex flex-col justify-between transition relative rounded-none ${
                  gameMode === 'DUEL'
                    ? 'bg-yellow-950/50 border-yellow-400 shadow-[4px_4px_0_0_#78350f]'
                    : 'bg-black/80 border-zinc-800 hover:border-yellow-600/70 text-zinc-400'
                }`}>
                {gameMode === 'DUEL' && (
                  <span className="absolute top-2 right-2 flex items-center gap-1 text-[7px] bg-yellow-400 text-black px-1.5 py-0.5 font-bold uppercase">
                    <Check size={10} /> ACTIVE
                  </span>
                )}
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Users size={15} className={gameMode === 'DUEL' ? 'text-yellow-400' : 'text-zinc-500'} />
                    <span className={`text-[10px] font-bold uppercase ${gameMode === 'DUEL' ? 'text-yellow-300' : 'text-zinc-300'}`}>
                      2P SPLIT SCREEN DUEL
                    </span>
                  </div>
                  <span className="text-[7px] text-yellow-500/90 font-mono uppercase block mb-1.5">
                    [ LOCAL HEAD-TO-HEAD RACE ]
                  </span>
                  <p className="text-[8px] text-zinc-400 leading-relaxed">
                    Side-by-side split screen viewports. Race your opponent to claim distant high-multiplier platforms first!
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-zinc-800 flex items-center justify-between text-[7px] text-zinc-500 font-mono">
                  <span>P1: WASD | P2: ARROWS</span>
                  <span className="text-yellow-400 font-bold">2 PLAYERS</span>
                </div>
              </button>
            </div>

            {/* Pilot Callsign & Vessel Bay */}
            <div className="w-full bg-black/90 border-2 border-emerald-800 p-3.5 mb-3.5 rounded-none">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2.5 border-b border-zinc-800 mb-3">
                <div className="flex-1 w-full">
                  <label className="text-[8px] uppercase tracking-wider text-emerald-400 font-bold block mb-1.5 flex items-center gap-1.5">
                    <User size={12} className="text-emerald-400" />
                    <span>{gameMode === 'DUEL' ? 'PLAYER 1 CALLSIGN (WASD):' : 'PILOT CALLSIGN FOR THIS SESSION:'}</span>
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    value={pilotName}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setPilotName(val);
                      setStoredPilotName(val);
                    }}
                    placeholder="ENTER CALLSIGN..."
                    className="w-full bg-zinc-950 border-2 border-emerald-600 px-3 py-1.5 text-emerald-300 text-[10px] font-bold tracking-widest focus:outline-none focus:border-emerald-400 rounded-none mb-2"
                  />
                  {/* Preset Chips */}
                  <div className="flex flex-wrap gap-1">
                    {PRESET_PILOT_NAMES.slice(0, 6).map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          setPilotName(name);
                          setStoredPilotName(name);
                          gameAudio.playCrispClick();
                        }}
                        className={`text-[7px] px-2 py-0.5 border transition ${
                          pilotName === name
                            ? 'bg-emerald-500 text-black border-emerald-400 font-bold shadow-[1px_1px_0_0_#064e3b]'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                        }`}>
                        {name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interactive Vessel Preview Chamber */}
                <div className="w-full sm:w-auto flex sm:flex-col items-center justify-between sm:justify-center p-2.5 bg-zinc-950 border border-zinc-800 min-w-[130px]">
                  <span className="text-[7px] text-zinc-500 uppercase tracking-widest block mb-1 font-mono">VESSEL PREVIEW</span>
                  <div className="relative w-12 h-10 flex items-center justify-center my-1">
                    {/* Glowing Engine Flare */}
                    <div
                      className="absolute bottom-0 w-3 h-4 rounded-full blur-[2px] animate-pulse"
                      style={{ backgroundColor: p1Theme.color }}
                    />
                    {/* Lander Graphic */}
                    {assets['lander'] ? (
                      <img
                        src={assets['lander'].src}
                        alt="Lander Preview"
                        className="w-10 h-8 object-contain relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                      />
                    ) : (
                      <div className="w-8 h-6 bg-white rounded-sm" />
                    )}
                  </div>
                  <span className="text-[7px] font-bold uppercase" style={{ color: p1Theme.color }}>
                    {p1Theme.name}
                  </span>
                </div>
              </div>

              {/* Ship Livery / Hull Accent Swatches */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                <span className="text-[7px] text-zinc-400 uppercase font-mono flex items-center gap-1">
                  <Shield size={10} className="text-zinc-500" />
                  <span>HULL LIVERY ACCENT:</span>
                </span>
                <div className="flex items-center gap-1.5">
                  {SHIP_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => {
                        setP1Theme(theme);
                        gameAudio.playCrispClick();
                      }}
                      title={theme.name}
                      className={`w-6 h-6 border-2 flex items-center justify-center transition ${
                        p1Theme.id === theme.id ? 'border-white scale-110 shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'border-zinc-700 opacity-60 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: theme.color }}>
                      {p1Theme.id === theme.id && <Check size={10} className="text-black font-bold" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* In Duel Mode: Pilot 2 Configuration */}
              {gameMode === 'DUEL' && (
                <div className="mt-3 pt-3 border-t border-zinc-800">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex-1 w-full">
                      <label className="text-[8px] uppercase tracking-wider text-amber-400 font-bold block mb-1.5 flex items-center gap-1.5">
                        <Users size={12} />
                        <span>PLAYER 2 CALLSIGN (ARROW KEYS):</span>
                      </label>
                      <input
                        type="text"
                        maxLength={16}
                        value={p2Name}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setP2Name(val);
                          setStoredP2Name(val);
                        }}
                        placeholder="ENTER PILOT 2..."
                        className="w-full bg-zinc-950 border-2 border-amber-600 px-3 py-1.5 text-amber-300 text-[10px] font-bold tracking-widest focus:outline-none focus:border-amber-400 rounded-none mb-1.5"
                      />
                    </div>
                    {/* P2 Livery swatches */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[7px] text-amber-500 uppercase font-mono mr-1">P2 HULL:</span>
                      {SHIP_THEMES.map((theme) => (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => {
                            setP2Theme(theme);
                            gameAudio.playCrispClick();
                          }}
                          title={`P2: ${theme.name}`}
                          className={`w-5 h-5 border-2 flex items-center justify-center transition ${
                            p2Theme.id === theme.id ? 'border-white scale-110 shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'border-zinc-700 opacity-60 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: theme.color }}>
                          {p2Theme.id === theme.id && <Check size={8} className="text-black font-bold" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tactical Landing Targets Overview with Multipliers */}
            <div className="w-full bg-black/80 border-2 border-zinc-800 p-2.5 mb-3.5">
              <span className="text-[7px] text-zinc-400 uppercase font-mono block mb-1.5 font-bold flex items-center gap-1">
                <Crosshair size={11} className="text-cyan-400" />
                <span>TACTICAL TOUCHDOWN PLATFORMS & DISTANCE MULTIPLIERS:</span>
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-left font-mono">
                {/* Alpha */}
                <div className="bg-zinc-950 border border-emerald-600/70 p-1.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[8px] font-bold text-emerald-400">ALPHA</span>
                    <span className="text-[7px] font-bold bg-emerald-950 text-emerald-300 px-1 border border-emerald-500">1.0x</span>
                  </div>
                  <span className="text-[6.5px] text-zinc-400">~450m • SAFE PLATEAU</span>
                </div>
                {/* Bravo */}
                <div className="bg-zinc-950 border border-sky-500/70 p-1.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[8px] font-bold text-sky-400">BRAVO</span>
                    <span className="text-[7px] font-bold bg-sky-950 text-sky-300 px-1 border border-sky-400">2.0x</span>
                  </div>
                  <span className="text-[6.5px] text-zinc-400">~1200m • CRAG GAP</span>
                </div>
                {/* Charlie */}
                <div className="bg-zinc-950 border border-amber-500/70 p-1.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[8px] font-bold text-amber-400">CHARLIE</span>
                    <span className="text-[7px] font-bold bg-amber-950 text-amber-300 px-1 border border-amber-400">3.5x</span>
                  </div>
                  <span className="text-[6.5px] text-zinc-400">~2000m • BASALT RIDGE</span>
                </div>
                {/* Omega */}
                <div className="bg-zinc-950 border border-pink-500/70 p-1.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[8px] font-bold text-pink-400">OMEGA</span>
                    <span className="text-[7px] font-bold bg-pink-950 text-pink-300 px-1 border border-pink-400">5.0x</span>
                  </div>
                  <span className="text-[6.5px] text-zinc-400">~2800m • DEEP ABYSS</span>
                </div>
              </div>
            </div>

            {/* Level 1 Extra Fuel Feature Banner */}
            <div className="w-full bg-emerald-950/30 border-2 border-emerald-600/80 px-3 py-1.5 mb-4 text-[8px] flex items-center justify-between font-mono">
              <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                <Zap size={12} className="text-emerald-400 animate-pulse" />
                <span>LEVEL 1 REFUEL: 180L HIGH-CAPACITY TANKS EQUIPPED (+80% FUEL MARGIN)</span>
              </span>
              <span className="text-[7px] text-emerald-400 bg-emerald-900/50 px-1.5 py-0.5 border border-emerald-500 hidden sm:inline">
                EXPLORE DEEP PADS
              </span>
            </div>

            {/* Main Action Launch Button */}
            <button
              ref={startBtnRef}
              onClick={initGame}
              autoFocus
              className="w-full bg-emerald-400 hover:bg-emerald-300 text-black border-4 border-emerald-200 font-black text-sm md:text-base py-3.5 px-6 shadow-[0_0_20px_rgba(16,185,129,0.5)] active:translate-x-0.5 active:translate-y-0.5 transition flex items-center justify-center gap-2 uppercase rounded-none cursor-pointer group">
              <Play size={18} fill="currentColor" className="group-hover:scale-110 transition-transform" />
              <span>{gameMode === 'DUEL' ? 'COMMENCE SPLIT SCREEN DUEL' : 'ENGAGE DESCENT'}</span>
              <span className="text-[8px] bg-black/20 px-2 py-0.5 text-black font-mono ml-2 border border-black/30 hidden sm:inline">
                [ ENTER ]
              </span>
            </button>

            {/* Audio & Extra Actions Footer */}
            <div className="w-full flex items-center justify-between pt-3 mt-3 border-t border-zinc-800 text-[8px] flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const newMuted = gameAudio.toggleMute();
                    setIsSfxMuted(newMuted);
                  }}
                  className="text-zinc-400 hover:text-white flex items-center gap-1 transition uppercase font-mono">
                  {isSfxMuted ? <VolumeX size={12} className="text-red-400" /> : <Volume2 size={12} className="text-emerald-400" />}
                  <span>SFX: {isSfxMuted ? 'OFF' : 'ON'}</span>
                </button>
                <span className="text-zinc-700">|</span>
                <button
                  type="button"
                  onClick={() => setIsMusicMuted((prev) => !prev)}
                  className="text-zinc-400 hover:text-white flex items-center gap-1 transition uppercase font-mono">
                  {isMusicMuted ? <VolumeX size={12} className="text-red-400" /> : <Volume2 size={12} className="text-emerald-400" />}
                  <span>BGM: {isMusicMuted ? 'OFF' : 'ON'}</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsLeaderboardOpen(true);
                    gameAudio.playCrispClick();
                  }}
                  className="text-yellow-400 hover:text-yellow-300 flex items-center gap-1 transition underline uppercase font-bold">
                  <Trophy size={12} />
                  <span>[ ROSTER ]</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsHowToPlayOpen(true);
                    gameAudio.playCrispClick();
                  }}
                  className="text-zinc-400 hover:text-emerald-400 flex items-center gap-1 transition underline uppercase font-bold">
                  <HelpCircle size={12} />
                  <span>[ FLIGHT MANUAL ]</span>
                </button>
              </div>
            </div>
          </div>
        </MenuOverlay>
      )}

      {/* TOUCHDOWN SUCCESS / LEVEL COMPLETE */}
      {gameState.status === 'LEVEL_COMPLETE' && lastTouchdownStats && (
        <MenuOverlay tone="victory" zIndex={40}>
          <div className="w-full max-w-md bg-[#08080c] border-4 border-emerald-500 p-5 md:p-6 shadow-[8px_8px_0px_0px_#064e3b] flex flex-col items-center text-emerald-400 rounded-none">
            <Award className="text-emerald-400 mb-2 animate-bounce" size={36} />
            <h2 className="text-base md:text-xl font-bold text-center mb-1 uppercase tracking-wide">
              {gameMode === 'DUEL' ? `${lastTouchdownStats.pilotName} WINS DUEL!` : 'TOUCHDOWN CONFIRMED'}
            </h2>
            <div className="text-[9px] text-zinc-400 mb-3 uppercase font-bold tracking-wider">
              [ LANDED ON {lastTouchdownStats.padName} — {lastTouchdownStats.padMultiplier}X MULTIPLIER ]
            </div>

            <div className="w-full bg-black border-2 border-emerald-800 p-3 mb-3 text-[9px] space-y-1.5 font-mono rounded-none">
              <div className="flex justify-between">
                <span className="text-zinc-500">Pilot Callsign:</span>
                <span className="font-bold text-emerald-300">{lastTouchdownStats.pilotName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Landing Platform:</span>
                <span className="font-bold text-cyan-300">{lastTouchdownStats.padName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Distance Multiplier:</span>
                <span className="font-bold text-yellow-400">{lastTouchdownStats.padMultiplier}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Vertical Velocity:</span>
                <span className="font-bold text-emerald-300">
                  {Math.round(lastTouchdownStats.vy)} PX/S
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Attitude Tilt:</span>
                <span className="font-bold text-emerald-300">
                  {Math.round(Math.abs(lastTouchdownStats.tilt))}°
                </span>
              </div>
              <div className="flex justify-between border-t border-zinc-800 pt-1.5 text-xs font-bold">
                <span className="text-yellow-400">Total Points Awarded:</span>
                <span className="text-yellow-400">+{lastTouchdownStats.pointsAwarded}</span>
              </div>
            </div>

            <div className="w-full flex gap-2 mb-3">
              <button
                onClick={() => {
                  setIsLeaderboardOpen(true);
                  gameAudio.playCrispClick();
                }}
                className="flex-1 bg-black hover:bg-yellow-400 text-yellow-400 hover:text-black border-2 border-yellow-500 py-2 text-[9px] font-bold uppercase transition flex items-center justify-center gap-1.5">
                <Trophy size={13} />
                <span>VIEW SCOREBOARD</span>
              </button>
            </div>

            <button
              autoFocus
              onClick={() => {
                if (gameMode === 'DUEL') {
                  resetLander(1);
                  setGameState((prev) => ({...prev, status: 'PLAYING'}));
                  gameAudio.playConfirmSelect();
                } else {
                  proceedToNextEpoch();
                }
              }}
              className="w-full bg-black hover:bg-emerald-400 text-emerald-400 hover:text-black border-4 border-emerald-400 font-bold py-3 px-6 shadow-[4px_4px_0_0_#064e3b] active:translate-x-0.5 active:translate-y-0.5 transition flex items-center justify-center gap-2 uppercase rounded-none text-xs">
              <Play size={16} fill="currentColor" />
              <span>{gameMode === 'DUEL' ? 'COMMENCE NEXT DUEL ROUND' : `COMMENCE EPOCH ${gameState.level}`}</span>
            </button>
          </div>
        </MenuOverlay>
      )}

      {/* GAME OVER SCREEN */}
      {gameState.status === 'GAME_OVER' && (
        <MenuOverlay tone="danger" zIndex={40}>
          <div className="w-full max-w-md bg-[#08080c] border-4 border-red-500 p-5 md:p-6 shadow-[8px_8px_0px_0px_#7f1d1d] flex flex-col items-center text-red-500 rounded-none">
            <AlertTriangle className="text-red-500 mb-2 animate-pulse" size={36} />
            <h2 className="text-base md:text-xl font-bold text-center mb-1 uppercase tracking-wide">
              EXPEDITION TERMINATED
            </h2>
            <div className="text-[9px] text-red-400 text-center mb-3 uppercase font-bold tracking-wider">
              [ {lastTouchdownStats?.reason || 'VESSEL STRUCTURAL FAILURE'} ]
            </div>

            <div className="w-full bg-black border-2 border-red-900 p-3 mb-4 text-center text-[9px] rounded-none">
              <span className="text-zinc-500 block mb-1">FINAL PILOT SCORE</span>
              <span className="text-2xl font-bold text-yellow-400">
                {gameState.score}
              </span>
              <span className="text-[8px] text-zinc-400 block mt-1 uppercase">
                {pilotName} // Concluded on Epoch {gameState.level} ({activeEpoch.name})
              </span>
            </div>

            <div className="w-full flex gap-2 mb-3">
              <button
                onClick={() => {
                  setIsLeaderboardOpen(true);
                  gameAudio.playCrispClick();
                }}
                className="flex-1 bg-black hover:bg-yellow-400 text-yellow-400 hover:text-black border-2 border-yellow-500 py-2 text-[9px] font-bold uppercase transition flex items-center justify-center gap-1.5">
                <Trophy size={13} />
                <span>VIEW SCOREBOARD</span>
              </button>
            </div>

            <button
              autoFocus
              onClick={initGame}
              className="w-full bg-black hover:bg-red-500 text-red-400 hover:text-black border-4 border-red-500 font-bold py-3 px-6 shadow-[4px_4px_0_0_#7f1d1d] active:translate-x-0.5 active:translate-y-0.5 transition flex items-center justify-center gap-2 uppercase rounded-none text-xs">
              <RotateCw size={16} />
              <span>RELAUNCH EXPEDITION</span>
            </button>
          </div>
        </MenuOverlay>
      )}

      {/* VICTORY OVERLAY */}
      {gameState.status === 'VICTORY' && (
        <MenuOverlay tone="victory" zIndex={40}>
          <div className="w-full max-w-md bg-[#08080c] border-4 border-yellow-400 p-6 shadow-[8px_8px_0px_0px_#78350f] flex flex-col items-center text-center text-yellow-400 rounded-none">
            <Award className="text-yellow-400 mb-3 animate-bounce" size={44} />
            <h2 className="text-base md:text-2xl font-bold mb-1 uppercase tracking-wide">
              MASTER LUNAR PILOT
            </h2>
            <div className="text-[9px] text-cyan-400 uppercase tracking-widest font-bold mb-3">
              [ {pilotName} CONQUERED THE SENSORY BLACKOUT ]
            </div>
            <p className="text-[10px] text-zinc-300 leading-relaxed mb-4">
              You crossed deep lunar canyons, mastered all 4 distant platforms, and conquered
              the final sensory blackout solely via acoustic sonar frequencies.
            </p>

            <div className="w-full bg-black border-2 border-yellow-800 p-3 mb-4 text-[9px] rounded-none">
              <span className="text-zinc-500 block mb-1">EXPEDITION GRAND TOTAL</span>
              <span className="text-2xl font-bold text-yellow-400">
                {gameState.score}
              </span>
            </div>

            <button
              onClick={() => {
                setIsLeaderboardOpen(true);
                gameAudio.playCrispClick();
              }}
              className="w-full bg-black hover:bg-yellow-400 text-yellow-400 hover:text-black border-2 border-yellow-500 py-2 text-[9px] font-bold uppercase transition flex items-center justify-center gap-1.5 mb-2">
              <Trophy size={13} />
              <span>VIEW ON SCOREBOARD</span>
            </button>

            <button
              autoFocus
              onClick={initGame}
              className="w-full bg-black hover:bg-yellow-400 text-yellow-400 hover:text-black border-4 border-yellow-400 font-bold py-3 px-6 shadow-[4px_4px_0_0_#78350f] active:translate-x-0.5 active:translate-y-0.5 transition flex items-center justify-center gap-2 uppercase rounded-none text-xs">
              <RotateCw size={16} />
              <span>COMMENCE NEW EXPEDITION</span>
            </button>
          </div>
        </MenuOverlay>
      )}

      {/* REAL DATA LEADERBOARD / SCOREBOARD MODAL */}
      {isLeaderboardOpen && (
        <MenuOverlay tone="neutral" zIndex={60}>
          <div className="w-full max-w-lg bg-[#08080c] border-4 border-yellow-500 p-5 shadow-[8px_8px_0px_0px_#78350f] flex flex-col items-center text-yellow-400 rounded-none">
            <div className="flex items-center justify-between w-full mb-3 pb-2 border-b-2 border-zinc-800">
              <h2 className="text-sm md:text-base font-bold flex items-center gap-2 uppercase">
                <Trophy size={18} className="text-yellow-400" />
                <span>FLIGHT LOG & LEADERBOARD</span>
              </h2>
              <button
                onClick={() => {
                  setIsLeaderboardOpen(false);
                  gameAudio.playCrispClick();
                }}
                className="p-1 hover:bg-yellow-400 hover:text-black border-2 border-zinc-700 text-zinc-400 rounded-none">
                <X size={16} />
              </button>
            </div>

            <div className="w-full text-[8px] text-zinc-400 mb-2 uppercase font-bold flex justify-between">
              <span>REAL ASTRONAUT & PILOT MISSION ARCHIVE</span>
              <span>SAVED LOCALLY</span>
            </div>

            <div className="w-full overflow-y-auto max-h-[50vh] border-2 border-zinc-800 bg-black mb-3">
              <table className="w-full text-left text-[8px] border-collapse">
                <thead>
                  <tr className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                    <th className="p-2">#</th>
                    <th className="p-2">PILOT</th>
                    <th className="p-2">SCORE</th>
                    <th className="p-2">PAD</th>
                    <th className="p-2">MODE</th>
                    <th className="p-2">RECORDED</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardList.map((entry, idx) => {
                    const isTop3 = idx < 3;
                    const isUserCurrent = entry.pilotName === pilotName;
                    return (
                      <tr
                        key={entry.id}
                        className={`border-b border-zinc-900 ${
                          isUserCurrent ? 'bg-emerald-950/40 text-emerald-300' : 'text-zinc-300'
                        }`}>
                        <td className="p-2 font-bold">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                        </td>
                        <td className="p-2 font-bold">
                          {entry.pilotName}
                          {isUserCurrent && (
                            <span className="ml-1 text-[7px] text-emerald-400">[YOU]</span>
                          )}
                        </td>
                        <td className={`p-2 font-bold ${isTop3 ? 'text-yellow-400' : 'text-zinc-200'}`}>
                          {entry.score.toLocaleString()}
                        </td>
                        <td className="p-2">
                          <span className="px-1 py-0.5 bg-zinc-900 border border-zinc-700 text-[7px]">
                            {entry.padName}
                          </span>
                        </td>
                        <td className="p-2 text-zinc-400">{entry.mode}</td>
                        <td className="p-2 text-zinc-500">{entry.dateFormatted}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="w-full flex gap-2">
              <button
                onClick={() => {
                  const restored = resetLeaderboardToSeeds();
                  setLeaderboardList(restored);
                  gameAudio.playCrispClick();
                }}
                className="flex-1 bg-black hover:bg-zinc-800 border-2 border-zinc-700 text-zinc-400 hover:text-white py-2 text-[8px] font-bold uppercase transition">
                RESTORE ASTRONAUT ROSTER
              </button>
              <button
                onClick={() => {
                  setIsLeaderboardOpen(false);
                  gameAudio.playCrispClick();
                }}
                className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-2 text-[9px] uppercase transition shadow-[2px_2px_0_0_#78350f]">
                CLOSE SCOREBOARD
              </button>
            </div>
          </div>
        </MenuOverlay>
      )}

      {/* FLIGHT MENU MODAL */}
      {isMenuOpen && (
        <MenuOverlay tone="neutral" zIndex={50}>
          <div className="w-full max-w-md bg-[#08080c] border-4 border-emerald-500 p-5 shadow-[8px_8px_0px_0px_#064e3b] flex flex-col items-center text-emerald-400 rounded-none">
            <div className="flex items-center justify-between w-full mb-4 pb-2 border-b-2 border-zinc-800">
              <h2 className="text-base font-bold flex items-center gap-2 uppercase">
                <Gauge size={18} />
                <span>FLIGHT MENU</span>
              </h2>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  gameAudio.playCrispClick();
                }}
                className="p-1 hover:bg-emerald-400 hover:text-black border-2 border-zinc-700 text-zinc-400 rounded-none">
                <X size={16} />
              </button>
            </div>

            <div className="w-full space-y-2.5">
              <button
                autoFocus
                onClick={() => {
                  setIsMenuOpen(false);
                  gameAudio.playCrispClick();
                }}
                className="w-full bg-black hover:bg-emerald-400 text-emerald-400 hover:text-black border-2 border-emerald-400 font-bold py-2.5 px-4 shadow-[2px_2px_0_0_#064e3b] active:translate-x-0.5 active:translate-y-0.5 transition flex items-center justify-center gap-2 uppercase rounded-none text-xs">
                <Play size={16} fill="currentColor" />
                <span>RESUME DESCENT</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const newMuted = gameAudio.toggleMute();
                    setIsSfxMuted(newMuted);
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-2 border-2 text-[9px] font-bold transition uppercase shadow-[2px_2px_0_0_#000] rounded-none ${
                    isSfxMuted
                      ? 'bg-zinc-950 border-zinc-700 text-zinc-500'
                      : 'bg-black border-emerald-500 text-emerald-400'
                  }`}>
                  {isSfxMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  <span>SFX: {isSfxMuted ? 'MUTED' : 'ON'}</span>
                </button>

                <button
                  onClick={() => setIsMusicMuted((prev) => !prev)}
                  className={`flex items-center justify-center gap-2 py-2 px-2 border-2 text-[9px] font-bold transition uppercase shadow-[2px_2px_0_0_#000] rounded-none ${
                    isMusicMuted
                      ? 'bg-zinc-950 border-zinc-700 text-zinc-500'
                      : 'bg-black border-emerald-500 text-emerald-400'
                  }`}>
                  {isMusicMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  <span>BGM: {isMusicMuted ? 'MUTED' : 'ON'}</span>
                </button>
              </div>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsLeaderboardOpen(true);
                  gameAudio.playCrispClick();
                }}
                className="w-full bg-black hover:bg-yellow-400 hover:text-black text-yellow-400 border-2 border-yellow-500 font-bold py-2.5 px-4 shadow-[2px_2px_0_0_#78350f] transition flex items-center justify-center gap-2 uppercase rounded-none text-[9px]">
                <Trophy size={14} />
                <span>VIEW LEADERBOARD & FLIGHT LOG</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  resetLander(gameState.level);
                  gameAudio.playConfirmSelect();
                }}
                className="w-full bg-black hover:bg-zinc-800 border-2 border-zinc-700 text-white font-bold py-2 px-4 shadow-[2px_2px_0_0_#000] transition flex items-center justify-center gap-2 uppercase rounded-none text-[9px]">
                <RotateCw size={14} />
                <span>RESTART CURRENT RUN</span>
              </button>

              <button
                onClick={() => {
                  setIsHowToPlayOpen(true);
                  gameAudio.playCrispClick();
                }}
                className="w-full bg-black hover:bg-zinc-800 border-2 border-zinc-700 text-white font-bold py-2 px-4 shadow-[2px_2px_0_0_#000] transition flex items-center justify-center gap-2 uppercase rounded-none text-[9px]">
                <HelpCircle size={14} />
                <span>FLIGHT MANUAL & CONTROLS</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  gameAudio.stopThruster();
                  setGameState((prev) => ({...prev, status: 'START'}));
                  gameAudio.playCrispClick();
                }}
                className="w-full bg-black hover:bg-red-950 border-2 border-red-800 text-red-300 font-bold py-2 px-4 shadow-[2px_2px_0_0_#000] transition flex items-center justify-center gap-2 uppercase rounded-none text-[9px]">
                <X size={14} />
                <span>ABORT TO TITLE SCREEN</span>
              </button>
            </div>
          </div>
        </MenuOverlay>
      )}

      {/* HOW TO PLAY & AVIONICS MANUAL */}
      {isHowToPlayOpen && (
        <MenuOverlay tone="neutral" zIndex={60}>
          <div className="w-full max-w-lg bg-[#08080c] border-4 border-emerald-500 p-5 shadow-[8px_8px_0px_0px_#064e3b] flex flex-col items-center text-emerald-400 rounded-none">
            <div className="flex items-center justify-between w-full mb-3 pb-2 border-b-2 border-zinc-800">
              <h2 className="text-sm md:text-base font-bold flex items-center gap-2 uppercase">
                <HelpCircle size={18} />
                <span>AVIONICS FLIGHT MANUAL</span>
              </h2>
              <button
                onClick={() => {
                  setIsHowToPlayOpen(false);
                  gameAudio.playCrispClick();
                }}
                className="p-1 hover:bg-emerald-400 hover:text-black border-2 border-zinc-700 text-zinc-400 rounded-none">
                <X size={16} />
              </button>
            </div>

            <div className="w-full space-y-3 text-[9px] text-zinc-300 leading-relaxed overflow-y-auto max-h-[58vh] pr-1">
              <div className="bg-black p-3 border-2 border-emerald-900 rounded-none">
                <h3 className="font-bold text-emerald-400 mb-1.5 uppercase flex items-center gap-1">
                  <Zap size={12} />
                  <span>Controls & 2-Player Duel</span>
                </h3>
                <p className="mb-1">
                  • <strong>Player 1 (Solo / Duel):</strong> W (Thrust) / A & D (RCS Steer Left & Right).
                </p>
                <p className="mb-1">
                  • <strong>Player 2 (Duel Mode):</strong> Up Arrow (Thrust) / Left & Right Arrows (RCS Steer).
                </p>
                <p>
                  • <strong>Mobile:</strong> Virtual buttons at the bottom edge.
                </p>
              </div>

              <div className="bg-black p-3 border-2 border-amber-900 rounded-none">
                <h3 className="font-bold text-amber-400 mb-1.5 uppercase flex items-center gap-1">
                  <Award size={12} />
                  <span>Multiple Pads & Distance Multipliers</span>
                </h3>
                <p className="mb-1">
                  • <strong>PAD ALPHA (1.0x):</strong> Near spawn (~400m). Wide, safe, and easy to reach.
                </p>
                <p className="mb-1">
                  • <strong>PAD BRAVO (2.0x):</strong> Intermediate distance (~1200m). Doubles all touchdown points!
                </p>
                <p className="mb-1">
                  • <strong>PAD CHARLIE (3.5x):</strong> Long trek across basalt crags (~2000m). Huge point boost!
                </p>
                <p>
                  • <strong>PAD OMEGA (5.0x):</strong> Ultra-far expedition (~2800m). High risk/reward 5x score!
                </p>
              </div>

              <div className="bg-black p-3 border-2 border-cyan-900 rounded-none">
                <h3 className="font-bold text-cyan-400 mb-1.5 uppercase flex items-center gap-1">
                  <Radio size={12} />
                  <span>Safe Landing Envelope</span>
                </h3>
                <p className="mb-1">
                  1. <strong>Vertical Velocity:</strong> Below {getConfig('maxSafeLandingVy')} px/s.
                </p>
                <p className="mb-1">
                  2. <strong>Lateral Velocity:</strong> Below {getConfig('maxSafeLandingVx')} px/s.
                </p>
                <p>
                  3. <strong>Attitude Tilt:</strong> Within ±{getConfig('maxSafeAngleDeg')}° of true vertical.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setIsHowToPlayOpen(false);
                gameAudio.playCrispClick();
              }}
              className="mt-3 w-full bg-black hover:bg-zinc-800 border-2 border-zinc-700 text-white font-bold py-2 px-4 uppercase rounded-none text-[9px]">
              CLOSE MANUAL
            </button>
          </div>
        </MenuOverlay>
      )}
    </div>
  );
}
