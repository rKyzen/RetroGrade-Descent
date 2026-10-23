// tslint:disable
/* eslint-disable */
import {
  Activity,
  AlertTriangle,
  Award,
  Bot,
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  Crosshair,
  Flame,
  Gauge,
  HelpCircle,
  Keyboard,
  Maximize2,
  Menu,
  Minimize2,
  Play,
  Radio,
  Rocket,
  RotateCw,
  Settings,
  Shield,
  Sliders,
  SlidersHorizontal,
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
import {LEVELS, getLevel, LevelConfig, LandingPadDef} from './levels';
import {computeAiPilotInputs, AI_PERSONAS, AiPersona} from './aiPilot';
import {
  KeyBindings,
  DEFAULT_KEYBINDINGS,
  getKeybindings,
  saveKeybindings,
  resetKeybindings,
  formatKeyDisplay,
} from './keybindings';
import LivePreviewCanvas from './LivePreviewCanvas';
import MenuScreens, {MainMenuScreen} from './MenuScreens';
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

// Re-export LevelConfig as EpochInfo for full backwards compatibility across the game
export type EpochInfo = LevelConfig;
export const EPOCHS: LevelConfig[] = LEVELS;

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

export interface OrbitalHazard {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  rotSpeed: number;
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
  thrusting?: boolean;
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

  // Game Mode: Solo Campaign vs AI Opponent Duel vs 2-Player Split Screen Duel
  const [gameMode, setGameMode] = useState<'SOLO' | 'AI_DUEL' | 'DUEL'>('SOLO');
  const gameModeRef = useRef<'SOLO' | 'AI_DUEL' | 'DUEL'>('SOLO');
  gameModeRef.current = gameMode;

  // Selected AI Opponent Persona for Play Against AI mode
  const [selectedAiPersona, setSelectedAiPersona] = useState<AiPersona>(AI_PERSONAS[0]);

  // Main UI Screen state
  const [mainMenuScreen, setMainMenuScreen] = useState<
    'TITLE' | 'FLOW_MODE' | 'FLOW_CUSTOMIZE' | 'FLOW_LEVEL' | 'SETTINGS' | 'LEADERBOARD' | 'HOW_TO_PLAY'
  >('TITLE');
  const [previousScreen, setPreviousScreen] = useState<'TITLE' | 'PAUSE'>('TITLE');

  // Keybindings state & Active rebinding
  const [keyBindings, setKeyBindings] = useState<KeyBindings>(() => getKeybindings());
  const [rebindingAction, setRebindingAction] = useState<keyof KeyBindings | null>(null);

  // Leaderboard filter
  const [leaderboardFilter, setLeaderboardFilter] = useState<'ALL' | 'SOLO' | 'AI_DUEL' | 'DUEL'>('ALL');

  // Session Pilot Names
  const [pilotName, setPilotName] = useState<string>(() => getStoredPilotName('PILOT ALPHA'));
  const [p2Name, setP2Name] = useState<string>(() => getStoredP2Name('PILOT BETA'));

  // Ship Livery Theme Customization
  const [p1Theme, setP1Theme] = useState<ShipTheme>(SHIP_THEMES[0]);
  const [p2Theme, setP2Theme] = useState<ShipTheme>(SHIP_THEMES[2]);

  // Selected Starting Level for Retrogression (1..10)
  const [selectedStartingEpoch, setSelectedStartingEpoch] = useState<number>(1);

  const initGameRef = useRef<() => void>();

  // Reactive Game State for UI
  const [gameState, setGameState] = useState<GameState>({
    status: 'START',
    score: 0,
    level: 1, // 1..10
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

  // Fullscreen State & API Control
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

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
      // Key Rebinding Mode Capture
      if (rebindingAction) {
        e.preventDefault();
        e.stopPropagation();
        const capturedKey = e.code || e.key;
        const newBindings = {
          ...keyBindings,
          [rebindingAction]: capturedKey,
        };
        setKeyBindings(newBindings);
        saveKeybindings(newBindings);
        setRebindingAction(null);
        gameAudio.playConfirmSelect();
        return;
      }

      keysPressedRef.current[e.key.toLowerCase()] = true;
      keysPressedRef.current[e.code] = true;

      // Escape key toggles in-game pause menu
      if (e.key === 'Escape') {
        if (gameStateRef.current.status === 'PLAYING') {
          setIsMenuOpen((prev) => !prev);
          gameAudio.playCrispClick();
        }
      }

      // Quick Reset key
      const p1ResetBinding = keyBindings.p1Reset;
      if (
        (e.code === p1ResetBinding || e.key.toLowerCase() === p1ResetBinding.toLowerCase()) &&
        gameStateRef.current.status === 'PLAYING'
      ) {
        resetLander(gameStateRef.current.level);
        gameAudio.playConfirmSelect();
      }

      // Instant Launch from Title Screen with Enter or Space
      const isInput = (e.target as HTMLElement)?.tagName === 'INPUT';
      if (!isInput && gameStateRef.current.status === 'START') {
        if (e.key === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          if (mainMenuScreen === 'TITLE') {
            setMainMenuScreen('FLOW_MODE');
            gameAudio.playCrispClick();
          } else if (mainMenuScreen === 'FLOW_LEVEL') {
            initGameRef.current?.();
          }
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
  }, [keyBindings, mainMenuScreen, rebindingAction]);

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

  // Function to compute fuel capacity by level
  const getMaxFuel = useCallback((epoch: number) => {
    return getLevel(epoch).fuelCapacity;
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
  const hazardsRef = useRef<OrbitalHazard[]>([]);
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
  // MULTI-PAD PROCEDURAL LUNAR TERRAIN GENERATOR (10 Unique Map Profiles)
  // Generates 4 distinct landing pads at increasing distances with multipliers
  // 1.0x (ALPHA), 2.0x (BRAVO), 3.5x (CHARLIE), 5.0x (OMEGA)
  // Perfectly level plateau for each landing pad with Hermite smoothstep transition
  // =========================================================================
  const generateTerrain = useCallback((epoch: number) => {
    const levelConfig = getLevel(epoch);
    const wWidth = levelConfig.worldWidth;
    const wHeight = levelConfig.worldHeight;
    worldDimensionsRef.current = {width: wWidth, height: wHeight};

    const padHeight = 28;
    const padY = Math.round(wHeight * 0.76);

    // Distribution of 4 distinct landing zones across the lunar continent
    const padsConfig: LandingPad[] = levelConfig.pads.map((p, idx) => ({
      id: `pad-${idx + 1}`,
      name: p.name,
      code: p.code,
      x: Math.round(wWidth * p.xPercent),
      y: padY + p.yOffset,
      w: p.w,
      h: padHeight,
      multiplier: p.multiplier,
      color: p.color,
      glowColor: p.glowColor,
      distanceTier: p.distanceTier,
    }));

    platformsRef.current = padsConfig;

    // Multi-octave natural lunar height function with levelConfig topography
    const getNaturalHeight = (x: number) => {
      const normX = (((x % wWidth) + wWidth) % wWidth) / wWidth;
      const baseline = wHeight * 0.74;
      const oct = levelConfig.terrainOctaves;

      const wave1 = Math.sin(normX * Math.PI * 2 * oct.w1Freq + epoch * 0.7) * oct.w1Amp;
      const wave2 = Math.sin(normX * Math.PI * 2 * oct.w2Freq + 1.2 + epoch * 1.1) * oct.w2Amp;
      const wave3 = Math.cos(normX * Math.PI * 2 * oct.w3Freq + 2.5 + epoch * 0.4) * oct.w3Amp;

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

    // Basalt crag spires situated according to level configuration
    const crags: CragObstacle[] = [];
    const cragW = getConfig('assetLunarCragWidth') as number;
    const cragH = getConfig('assetLunarCragHeight') as number;
    const cragPositions = levelConfig.cragPositions.map((pos) => Math.round(wWidth * pos));

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

    // Drifting Orbital Micrometeorites / Debris Hazards (Scaled by Level)
    const hazards: OrbitalHazard[] = [];
    const hazardCount = levelConfig.hazardCount;
    for (let i = 0; i < hazardCount; i++) {
      const hx = Math.round(wWidth * 0.25 + (i * (wWidth * 0.70)) / hazardCount + Math.sin(i * 3.7 + epoch) * 90);
      const hy = Math.round(180 + ((i * 137) % (padY - 260)));
      hazards.push({
        id: i,
        x: ((hx % wWidth) + wWidth) % wWidth,
        y: hy,
        vx: (i % 2 === 0 ? 1 : -1) * (14 + (i * 3.5) % 18 + levelConfig.windSpeed * 0.35),
        vy: Math.sin(i * 2.1) * (6 + epoch * 1.1),
        radius: 11 + (i % 4) * 3,
        rotation: i * 0.8,
        rotSpeed: (i % 2 === 0 ? 1 : -1) * (0.8 + (i % 3) * 0.4),
      });
    }
    hazardsRef.current = hazards;
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
  // RESET LANDER & REFUEL (Supports Extra Fuel in Level 1 + Duel & AI Spawns)
  // =========================================================================
  const resetLander = useCallback((epoch: number) => {
    generateTerrain(epoch);
    const startX = 260 + Math.random() * 80;
    const initialVx = 12 + epoch * 1.5;
    const fuelCapacity = getMaxFuel(epoch);

    // Player 1 initialization
    landerRef.current = {
      id: 'p1',
      name: pilotName,
      themeColor: p1Theme.color,
      x: startX,
      y: 120,
      vx: initialVx,
      vy: 8 + epoch * 1.5,
      angle: 0,
      angularVelocity: 0,
      fuel: fuelCapacity,
      maxFuel: fuelCapacity,
      dampedFuel: fuelCapacity,
      width: getConfig('assetLanderVesselWidth') as number,
      height: getConfig('assetLanderVesselHeight') as number,
      crashed: false,
      landed: false,
      thrusting: false,
      landedPad: null,
      score: landerRef.current.score,
      roundsWon: landerRef.current.roundsWon,
    };

    const isDuelOrAi = gameModeRef.current === 'DUEL' || gameModeRef.current === 'AI_DUEL';
    const p2DisplayName = gameModeRef.current === 'AI_DUEL' ? selectedAiPersona.callsign : p2Name;
    const p2DisplayColor = gameModeRef.current === 'AI_DUEL' ? selectedAiPersona.hullColor : p2Theme.color;

    // Player 2 / AI Opponent initialization
    landerP2Ref.current = {
      id: 'p2',
      name: p2DisplayName,
      themeColor: p2DisplayColor,
      x: startX + 90,
      y: 120,
      vx: initialVx,
      vy: 8 + epoch * 1.5,
      angle: 0,
      angularVelocity: 0,
      fuel: fuelCapacity,
      maxFuel: fuelCapacity,
      dampedFuel: fuelCapacity,
      width: getConfig('assetLanderVesselWidth') as number,
      height: getConfig('assetLanderVesselHeight') as number,
      crashed: false,
      landed: false,
      thrusting: false,
      landedPad: null,
      score: landerP2Ref.current.score,
      roundsWon: landerP2Ref.current.roundsWon,
    };

    const halfW = isDuelOrAi ? canvasWidth / 2 : canvasWidth;
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
  }, [canvasWidth, generateTerrain, getMaxFuel, p2Name, p2Theme.color, pilotName, p1Theme.color, selectedAiPersona]);

  // Start / Init Game
  const initGame = useCallback(() => {
    setIsAttractMode(false);
    setIsMenuOpen(false);
    setIsHowToPlayOpen(false);
    setIsLeaderboardOpen(false);
    setMainMenuScreen('TITLE');
    lastInteractionTimeRef.current = Date.now();

    // Persist pilot callsigns
    setStoredPilotName(pilotName);
    setStoredP2Name(p2Name);

    landerRef.current.score = 0;
    landerRef.current.roundsWon = 0;
    landerP2Ref.current.score = 0;
    landerP2Ref.current.roundsWon = 0;

    const startLevel = selectedStartingEpoch || 1;
    resetLander(startLevel);

    setGameState({
      status: 'PLAYING',
      score: 0,
      level: startLevel,
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

    // Dynamic Crosswinds & Airspace Turbulence (Level difficulty scaling)
    const windScale = 6 + currentEpoch * 7;
    const gust = Math.sin(Date.now() * 0.002 + lander.y * 0.012) * windScale;
    ax += gust;

    // Drifting orbital micrometeorites update (Once per tick via P1)
    if (lander.id === 'p1') {
      const padY = Math.round(worldH * 0.76);
      for (const h of hazardsRef.current) {
        h.x = ((h.x + h.vx * dt) % worldW + worldW) % worldW;
        h.y += h.vy * dt;
        h.rotation += h.rotSpeed * dt;
        if (h.y < 120) {
          h.y = 120;
          h.vy = Math.abs(h.vy);
        } else if (h.y > padY - 70) {
          h.y = padY - 70;
          h.vy = -Math.abs(h.vy);
        }
      }
    }

    // Hazard Collision Check
    for (const h of hazardsRef.current) {
      let hdx = (h.x - lander.x) % worldW;
      if (hdx > worldW / 2) hdx -= worldW;
      if (hdx < -worldW / 2) hdx += worldW;
      const hdy = h.y - lander.y;
      const dist = Math.hypot(hdx, hdy);

      if (dist < h.radius + 15) {
        const relSpeed = Math.hypot(lander.vx - h.vx, lander.vy - h.vy);
        if (relSpeed > 60) {
          lander.crashed = true;
          spawnCrashExplosion(lander.x, lander.y);
          if (!isDemo) {
            handleCrash(lander, 'HULL IMPACT WITH ORBITAL MICROMETEORITE');
          }
          return;
        } else {
          // Kinetic deflection impulse
          const normX = hdx / (dist || 1);
          const normY = hdy / (dist || 1);
          lander.vx = -normX * 36;
          lander.vy = -normY * 26;
          lander.angularVelocity += (Math.random() - 0.5) * 3;
          spawnTouchdownSparkles(lander.x, lander.y, '#f59e0b');
          gameAudio.playCrispClick();
        }
      }
    }

    const groundY = getTerrainSurfaceY(lander.x);
    const altAboveGround = groundY - lander.y;

    lander.thrusting = Boolean(thrusting && lander.fuel > 0);

    if (thrusting && lander.fuel > 0) {
      const epochFuelRate = fuelRate * (1 + (currentEpoch - 1) * 0.08);
      lander.fuel = Math.max(0, lander.fuel - epochFuelRate * dt);

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
        (leftFootX >= currentPadX - 14 && leftFootX <= currentPadX + pad.w + 14) ||
        (rightFootX >= currentPadX - 14 && rightFootX <= currentPadX + pad.w + 14) ||
        (lander.x >= currentPadX - 8 && lander.x <= currentPadX + pad.w + 8);

      if (isOverPad && lowestFootY >= pad.y - 6 && lowestFootY <= pad.y + pad.h + 12) {
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

      // Generous, forgiving landing conditions:
      const safeVy = lander.vy <= maxVy;
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
        // Hydraulic Suspension Cushion:
        // If landing parameters are slightly above threshold (within 35% margin),
        // the landing gear compresses and bounces up safely instead of destroying the vessel!
        const canAbsorbBounce =
          lander.vy <= maxVy * 1.35 &&
          Math.abs(lander.vx) <= maxVx * 1.35 &&
          Math.abs(lander.angle) <= maxAngleRad * 1.4;

        if (canAbsorbBounce) {
          lander.vy = -Math.abs(lander.vy) * 0.28;
          lander.vx *= 0.45;
          lander.angle *= 0.35;
          lander.y = touchedPlatform.y - 20;
          spawnGroundDust(lander.x, touchedPlatform.y);
          gameAudio.playCrispClick();
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

    const isAiDuel = gameModeRef.current === 'AI_DUEL';
    const isDuel = gameModeRef.current === 'DUEL' || isAiDuel;

    let scoreMode: 'SOLO' | 'AI_DUEL' | 'DUEL' = 'SOLO';
    if (isAiDuel) scoreMode = 'AI_DUEL';
    else if (isDuel) scoreMode = 'DUEL';

    // Auto-save session score to Real Data Leaderboard
    const savedEntry = saveScore({
      pilotName: lander.name,
      score: isDuel ? lander.score : gameStateRef.current.score + totalPoints,
      epoch: currentEpoch,
      padName: `${pad.code} (${pad.multiplier}x)`,
      padMultiplier: pad.multiplier,
      mode: scoreMode,
      precisionRating,
    });

    setLeaderboardList(getLeaderboard());

    if (!isDuel) {
      const newScore = gameStateRef.current.score + totalPoints;
      const newEpoch = currentEpoch + 1;

      if (currentEpoch >= 10) {
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
      // In Duel / AI Duel mode: Declare Round / Match Winner
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

    if (gameModeRef.current === 'DUEL' || gameModeRef.current === 'AI_DUEL') {
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
    const isDuel = gameModeRef.current === 'DUEL' || gameModeRef.current === 'AI_DUEL';

    if (isDemo && (lander.crashed || lander.landed)) {
      touchDebounceRef.current += dt;
      if (touchDebounceRef.current > 3.5) {
        resetLander((gameStateRef.current.level % 10) + 1);
      }
      return;
    }

    const keys = keysPressedRef.current;
    const touch = touchInputsRef.current;
    const currentEpoch = gameStateRef.current.level;

    const isKeyPressed = (binding: string) => {
      if (!binding) return false;
      return Boolean(
        keys[binding] ||
        keys[binding.toLowerCase()] ||
        (binding.startsWith('Key') && keys[binding.substring(3).toLowerCase()])
      );
    };

    let p1Thrust = isKeyPressed(keyBindings.p1Thrust) || touch.p1Thrust;
    let p1Left = isKeyPressed(keyBindings.p1Left) || touch.p1Left;
    let p1Right = isKeyPressed(keyBindings.p1Right) || touch.p1Right;

    if (gameModeRef.current === 'SOLO') {
      if (keys['arrowup'] || keys['w']) p1Thrust = true;
      if (keys['arrowleft'] || keys['a']) p1Left = true;
      if (keys['arrowright'] || keys['d']) p1Right = true;
    }

    let p2Thrust = false;
    let p2Left = false;
    let p2Right = false;

    if (gameModeRef.current === 'AI_DUEL') {
      const aiDecision = computeAiPilotInputs(
        landerP2,
        platformsRef.current,
        worldDimensionsRef.current.width,
        getTerrainSurfaceY,
        selectedAiPersona,
      );
      p2Thrust = aiDecision.thrust;
      p2Left = aiDecision.left;
      p2Right = aiDecision.right;
    } else if (gameModeRef.current === 'DUEL') {
      p2Thrust = isKeyPressed(keyBindings.p2Thrust) || touch.p2Thrust || Boolean(keys['arrowup']);
      p2Left = isKeyPressed(keyBindings.p2Left) || touch.p2Left || Boolean(keys['arrowleft']);
      p2Right = isKeyPressed(keyBindings.p2Right) || touch.p2Right || Boolean(keys['arrowright']);
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

  const handleRestartLevel = useCallback(() => {
    resetLander(gameState.level);
    setGameState((prev) => ({...prev, status: 'PLAYING'}));
    gameAudio.playConfirmSelect();
  }, [gameState.level, resetLander]);

  const handleAdvanceLevel = useCallback(() => {
    if (gameMode === 'DUEL' || gameMode === 'AI_DUEL') {
      resetLander(gameState.level);
      setGameState((prev) => ({...prev, status: 'PLAYING'}));
      gameAudio.playConfirmSelect();
    } else {
      proceedToNextEpoch();
    }
  }, [gameMode, gameState.level, resetLander]);

  const handleAbortToTitle = useCallback(() => {
    gameAudio.stopThruster();
    setGameState((prev) => ({...prev, status: 'START'}));
    setMainMenuScreen('TITLE');
    gameAudio.playCrispClick();
  }, []);

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

    // 5.5 Draw Drifting Orbital Micrometeorites / Debris Hazards
    for (let k = startChunk; k <= endChunk; k++) {
      const chunkOffset = k * worldW;
      for (const h of hazardsRef.current) {
        const renderX = h.x + chunkOffset;
        if (
          renderX + h.radius * 2 < camX - 50 ||
          renderX - h.radius * 2 > camX + viewportW + 50 ||
          h.y + h.radius * 2 < camY - 50 ||
          h.y - h.radius * 2 > camY + viewportH + 50
        ) {
          continue;
        }

        ctx.save();
        ctx.translate(renderX, h.y);
        ctx.rotate(h.rotation);

        // Glowing plasma corona
        const corona = ctx.createRadialGradient(0, 0, h.radius * 0.3, 0, 0, h.radius * 1.8);
        corona.addColorStop(0, 'rgba(245, 158, 11, 0.4)');
        corona.addColorStop(0.6, 'rgba(239, 68, 68, 0.18)');
        corona.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = corona;
        ctx.beginPath();
        ctx.arc(0, 0, h.radius * 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Asteroid rocky silhouette
        ctx.fillStyle = '#475569';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const sides = 6;
        for (let s = 0; s < sides; s++) {
          const angle = (s / sides) * Math.PI * 2;
          const r = h.radius * (0.8 + 0.35 * Math.sin(s * 2.3 + h.id));
          const px = Math.cos(angle) * r;
          const py = Math.sin(angle) * r;
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
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

        // Multiplier Pill Badge (Enlarged)
        const badgeY = pad.y - 42;
        ctx.fillStyle = 'rgba(2, 6, 23, 0.92)';
        ctx.fillRect(currentPadX + pad.w / 2 - 54, badgeY, 108, 22);
        ctx.strokeStyle = pad.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(currentPadX + pad.w / 2 - 54, badgeY, 108, 22);

        ctx.fillStyle = pad.color;
        ctx.font = 'bold 9.5px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${pad.code} [${pad.multiplier}x]`, currentPadX + pad.w / 2, badgeY + 15);

        ctx.restore();

        // Runway chevrons (Enlarged)
        ctx.fillStyle = pad.color;
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        const chevronText = runwayStep % 2 === 0 ? '>>> LAND HERE <<<' : '>> MULTIPLIER <<';
        ctx.fillText(chevronText, currentPadX + pad.w / 2, pad.y + 20);
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

    // 10. Draw Other Player Lander (Duel & AI Duel Modes - Uses exact same spacecraft model)
    if (otherLander && !otherLander.crashed) {
      const landerImg = assets['lander'];
      const lw = otherLander.width;
      const lh = otherLander.height;
      const wrappedOtherX = ((otherLander.x % worldW) + worldW) % worldW;

      for (let k = startChunk; k <= endChunk; k++) {
        const renderOx = wrappedOtherX + k * worldW;
        if (renderOx + lw < camX - 80 || renderOx - lw > camX + viewportW + 80) continue;

        ctx.save();
        ctx.translate(renderOx, otherLander.y);
        ctx.rotate(otherLander.angle);

        // Spacecraft hull glow tinted by Livery / Persona color
        ctx.shadowColor = otherLander.themeColor;
        ctx.shadowBlur = 10;

        // Draw identical spacecraft model asset
        drawAsset(ctx, landerImg, -lw / 2, -lh / 2, lw, lh, (fallbackCtx) => {
          fallbackCtx.fillStyle = otherLander.themeColor;
          fallbackCtx.fillRect(-lw / 2, -lh / 2, lw, lh);
        });
        ctx.shadowBlur = 0;

        // Thruster flame cone if opponent is thrusting
        if (otherLander.thrusting) {
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.moveTo(-6, lh / 2 - 2);
          ctx.lineTo(6, lh / 2 - 2);
          ctx.lineTo(0, lh / 2 + 16 + Math.random() * 8);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#60a5fa';
          ctx.beginPath();
          ctx.moveTo(-3, lh / 2 - 2);
          ctx.lineTo(3, lh / 2 - 2);
          ctx.lineTo(0, lh / 2 + 9 + Math.random() * 4);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();

        // High-contrast callsign badge above opponent
        ctx.save();
        const opponentBadgeText = otherLander.id === 'p2' && gameModeRef.current === 'AI_DUEL'
          ? `[AI] ${otherLander.name}`
          : otherLander.name;
        ctx.font = 'bold 8.5px "Press Start 2P", monospace';
        const opponentBadgeW = ctx.measureText(opponentBadgeText).width + 14;
        const opponentBadgeH = 17;
        const badgeY = otherLander.y - 28;

        ctx.fillStyle = 'rgba(2, 6, 23, 0.92)';
        ctx.fillRect(renderOx - opponentBadgeW / 2, badgeY - 11, opponentBadgeW, opponentBadgeH);
        ctx.strokeStyle = otherLander.themeColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(renderOx - opponentBadgeW / 2, badgeY - 11, opponentBadgeW, opponentBadgeH);

        ctx.fillStyle = otherLander.themeColor;
        ctx.textAlign = 'center';
        ctx.fillText(opponentBadgeText, renderOx, badgeY + 1);
        ctx.restore();
      }
    }

    // 11. Draw Active Player Lander Vessel
    if (!activeLander.crashed) {
      ctx.save();
      ctx.translate(activeLander.x, activeLander.y);
      ctx.rotate(activeLander.angle);

      const landerImg = assets['lander'];
      const lw = activeLander.width;
      const lh = activeLander.height;

      ctx.shadowColor = activeLander.themeColor;
      ctx.shadowBlur = 12;
      drawAsset(ctx, landerImg, -lw / 2, -lh / 2, lw, lh, (fallbackCtx) => {
        fallbackCtx.fillStyle = activeLander.themeColor;
        fallbackCtx.fillRect(-lw / 2, -lh / 2, lw, lh);
      });
      ctx.shadowBlur = 0;

      // Thruster flame cone if active lander is thrusting
      if (activeLander.thrusting) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(-6, lh / 2 - 2);
        ctx.lineTo(6, lh / 2 - 2);
        ctx.lineTo(0, lh / 2 + 16 + Math.random() * 8);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#60a5fa';
        ctx.beginPath();
        ctx.moveTo(-3, lh / 2 - 2);
        ctx.lineTo(3, lh / 2 - 2);
        ctx.lineTo(0, lh / 2 + 9 + Math.random() * 5);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();

      // Dynamic engine spotlight illuminating the ground below
      if (activeLander.thrusting && activeLander.y < worldH) {
        ctx.save();
        const flameGlow = ctx.createRadialGradient(
          activeLander.x,
          activeLander.y + 12,
          5,
          activeLander.x,
          activeLander.y + 36,
          52,
        );
        flameGlow.addColorStop(0, 'rgba(255, 176, 0, 0.35)');
        flameGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = flameGlow;
        ctx.beginPath();
        ctx.arc(activeLander.x, activeLander.y + 24, 52, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Pilot Name Tag above lander with high-contrast pill
      ctx.save();
      const activeBadgeText = activeLander.id === 'p2' && gameModeRef.current === 'AI_DUEL'
        ? `[AI] ${activeLander.name}`
        : activeLander.name;
      ctx.font = 'bold 8.5px "Press Start 2P", monospace';
      const badgeW = ctx.measureText(activeBadgeText).width + 14;
      const badgeH = 17;
      const badgeY = activeLander.y - 28;

      ctx.fillStyle = 'rgba(2, 6, 23, 0.92)';
      ctx.fillRect(activeLander.x - badgeW / 2, badgeY - 11, badgeW, badgeH);
      ctx.strokeStyle = activeLander.themeColor;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(activeLander.x - badgeW / 2, badgeY - 11, badgeW, badgeH);

      ctx.fillStyle = activeLander.themeColor;
      ctx.textAlign = 'center';
      ctx.fillText(activeBadgeText, activeLander.x, badgeY + 1);
      ctx.restore();
    }

    // -----------------------------------------------------------------------
    // LIVE TRAJECTORY PREDICTOR (Level 1 & Modern Avionics)
    // Real-time dotted trajectory path projection & touchdown impact reticle
    // -----------------------------------------------------------------------
    const showTrajectoryPredictor = currentEpoch === 1 || epochInfo.hudStyle === 'modern';
    if (showTrajectoryPredictor && !activeLander.crashed && !activeLander.landed) {
      ctx.save();
      const gravityVal = getConfig('gravity') as number;
      const mainThrustVal = getConfig('mainThrust') as number;
      const maxSafeVy = getConfig('maxSafeLandingVy') as number;

      let simX = activeLander.x;
      let simY = activeLander.y;
      let simVx = activeLander.vx;
      let simVy = activeLander.vy;
      const isThrusting = Boolean(activeLander.thrusting);
      const thrustAx = isThrusting ? Math.sin(activeLander.angle) * mainThrustVal : 0;
      const thrustAy = isThrusting ? -Math.cos(activeLander.angle) * mainThrustVal : 0;
      const simDt = 0.05;

      const trajPoints: {x: number; y: number}[] = [{x: simX, y: simY}];
      let impactInfo: {x: number; y: number; vy: number; vx: number; pad: LandingPad | null} | null = null;

      for (let s = 1; s <= 75; s++) {
        simVy += (gravityVal + thrustAy) * simDt;
        simVx += thrustAx * simDt;
        simX += simVx * simDt;
        simY += simVy * simDt;
        trajPoints.push({x: simX, y: simY});

        const surfY = getTerrainSurfaceY(simX);
        if (simY >= surfY) {
          const targetPad = platformsRef.current.find(
            (p) => simX >= p.x - 8 && simX <= p.x + p.w + 8 && Math.abs(surfY - p.y) < 18,
          ) || null;
          impactInfo = {
            x: simX,
            y: surfY,
            vy: simVy,
            vx: simVx,
            pad: targetPad,
          };
          break;
        }
      }

      // Draw flowing dotted trajectory line
      ctx.setLineDash([5, 5]);
      ctx.lineDashOffset = -Date.now() * 0.025;
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = activeLander.themeColor;
      ctx.shadowColor = activeLander.themeColor;
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.moveTo(trajPoints[0].x, trajPoints[0].y);
      for (let i = 1; i < trajPoints.length; i++) {
        ctx.lineTo(trajPoints[i].x, trajPoints[i].y);
      }
      ctx.stroke();

      // Trajectory breadcrumb pips
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;
      for (let i = 6; i < trajPoints.length; i += 6) {
        ctx.fillStyle = activeLander.themeColor;
        ctx.beginPath();
        ctx.arc(trajPoints[i].x, trajPoints[i].y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Predicted Impact Reticle & Status Badge
      if (impactInfo) {
        const isSafeLanding = impactInfo.pad && Math.abs(impactInfo.vy) <= maxSafeVy && Math.abs(impactInfo.vx) <= 25;
        const reticleColor = isSafeLanding ? '#10b981' : impactInfo.pad ? '#f59e0b' : '#38bdf8';

        ctx.strokeStyle = reticleColor;
        ctx.fillStyle = reticleColor;
        ctx.lineWidth = 2;

        // Outer pulsing target reticle
        const reticlePulse = 8 + 3 * Math.sin(Date.now() * 0.008);
        ctx.beginPath();
        ctx.arc(impactInfo.x, impactInfo.y, reticlePulse, 0, Math.PI * 2);
        ctx.stroke();

        // Crosshairs
        ctx.beginPath();
        ctx.moveTo(impactInfo.x - 14, impactInfo.y);
        ctx.lineTo(impactInfo.x + 14, impactInfo.y);
        ctx.moveTo(impactInfo.x, impactInfo.y - 14);
        ctx.lineTo(impactInfo.x, impactInfo.y + 14);
        ctx.stroke();

        // Impact badge
        const badgeText = isSafeLanding
          ? `SAFE TOUCHDOWN [${Math.round(impactInfo.vy)} PX/S]`
          : impactInfo.pad
          ? `SPEED WARNING [${Math.round(impactInfo.vy)} PX/S]`
          : `SURFACE INTERCEPT [${Math.round(impactInfo.vy)} PX/S]`;

        ctx.font = 'bold 8px "Press Start 2P", monospace';
        const txtW = ctx.measureText(badgeText).width + 12;
        const bY = impactInfo.y - 18;

        ctx.fillStyle = 'rgba(2, 6, 23, 0.92)';
        ctx.fillRect(impactInfo.x - txtW / 2, bY - 10, txtW, 16);
        ctx.strokeStyle = reticleColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(impactInfo.x - txtW / 2, bY - 10, txtW, 16);

        ctx.fillStyle = reticleColor;
        ctx.textAlign = 'center';
        ctx.fillText(badgeText, impactInfo.x, bY + 2);
      }

      ctx.restore();
    }

    // Modern Guidance Velocity Vector Pip
    if (epochInfo.hudStyle === 'modern') {
      ctx.save();
      ctx.strokeStyle = activeLander.themeColor;
      ctx.lineWidth = 2;

      const pipX = activeLander.x + activeLander.vx * 1.8;
      const pipY = activeLander.y + activeLander.vy * 1.8;
      ctx.beginPath();
      ctx.arc(pipX, pipY, 8, 0, Math.PI * 2);
      ctx.moveTo(pipX - 14, pipY);
      ctx.lineTo(pipX + 14, pipY);
      ctx.moveTo(pipX, pipY - 14);
      ctx.lineTo(pipX, pipY + 14);
      ctx.stroke();

      ctx.fillStyle = activeLander.themeColor;
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(Math.hypot(activeLander.vx, activeLander.vy))} PX/S`, pipX, pipY - 12);
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
      ctx.font = '11px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ACOUSTIC SONAR ACTIVE - FLY BY AUDIO]', viewportW / 2, 48);
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
    // TACTICAL RADAR MINIMAP (Modern & Y2K Epochs) - Enlarged & Detailed
    // -----------------------------------------------------------------------
    if (epochInfo.hudStyle === 'modern' || epochInfo.hudStyle === 'y2k') {
      const radarW = isP2Side ? Math.min(230, Math.floor(viewportW * 0.44)) : Math.min(270, Math.floor(viewportW * 0.36));
      const radarH = isP2Side ? 80 : 92;
      const radarX = viewportW - radarW - 16;
      const radarY = 16;

      ctx.save();
      // Outer radar backdrop
      ctx.fillStyle = 'rgba(2, 6, 23, 0.94)';
      ctx.fillRect(radarX, radarY, radarW, radarH);
      ctx.strokeStyle = activeLander.themeColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(radarX, radarY, radarW, radarH);

      // Corner high-tech brackets
      ctx.fillStyle = activeLander.themeColor;
      ctx.fillRect(radarX - 1, radarY - 1, 6, 2);
      ctx.fillRect(radarX - 1, radarY - 1, 2, 6);
      ctx.fillRect(radarX + radarW - 5, radarY - 1, 6, 2);
      ctx.fillRect(radarX + radarW - 1, radarY - 1, 2, 6);
      ctx.fillRect(radarX - 1, radarY + radarH - 1, 6, 2);
      ctx.fillRect(radarX - 1, radarY + radarH - 5, 2, 6);
      ctx.fillRect(radarX + radarW - 5, radarY + radarH - 1, 6, 2);
      ctx.fillRect(radarX + radarW - 1, radarY + radarH - 5, 2, 6);

      // Header strip
      ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.fillRect(radarX + 1, radarY + 1, radarW - 2, 16);
      ctx.fillStyle = activeLander.themeColor;
      ctx.font = 'bold 8px "Press Start 2P", monospace';
      ctx.fillText('RADAR // TACTICAL SCAN', radarX + 8, radarY + 12);

      // Subtle tactical grid
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Horizontal mid grid
      ctx.moveTo(radarX, radarY + radarH * 0.55);
      ctx.lineTo(radarX + radarW, radarY + radarH * 0.55);
      // Vertical quadrant grids
      for (let g = 1; g < 4; g++) {
        const gx = radarX + (radarW / 4) * g;
        ctx.moveTo(gx, radarY + 16);
        ctx.lineTo(gx, radarY + radarH);
      }
      ctx.stroke();

      const scaleX = radarW / worldW;
      const scaleY = (radarH - 18) / worldH;
      const radarFloorY = radarY + 18;

      // Lunar terrain wireframe profile trace on radar
      const pts = terrainRef.current;
      if (pts.length > 0) {
        ctx.beginPath();
        ctx.moveTo(radarX, radarY + radarH);
        ctx.lineTo(radarX, radarFloorY + pts[0].y * scaleY);
        for (let i = 0; i < pts.length; i += 4) {
          ctx.lineTo(radarX + pts[i].x * scaleX, radarFloorY + pts[i].y * scaleY);
        }
        ctx.lineTo(radarX + radarW, radarFloorY + pts[pts.length - 1].y * scaleY);
        ctx.lineTo(radarX + radarW, radarY + radarH);
        ctx.closePath();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Camera FOV indicator box on radar
      const camFovX = radarX + (((camX % worldW) + worldW) % worldW) * scaleX;
      const camFovW = Math.max(12, viewportW * scaleX);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.strokeRect(camFovX, radarFloorY, camFovW, radarH - 20);
      ctx.setLineDash([]);

      // Draw all 4 landing pads on radar with multiplier pill
      for (const pad of platformsRef.current) {
        const rPadX = radarX + pad.x * scaleX;
        const rPadW = Math.max(8, pad.w * scaleX);
        const rPadY = radarFloorY + pad.y * scaleY;
        ctx.fillStyle = pad.color;
        ctx.fillRect(rPadX, rPadY - 2, rPadW, 4);
        ctx.strokeStyle = pad.glowColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(rPadX, rPadY - 2, rPadW, 4);

        ctx.fillStyle = pad.color;
        ctx.font = '6px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${pad.multiplier}x`, rPadX + rPadW / 2, rPadY - 4);
      }

      // Draw drifting hazards on radar in amber
      for (const h of hazardsRef.current) {
        const rHazX = radarX + h.x * scaleX;
        const rHazY = radarFloorY + h.y * scaleY;
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(rHazX, rHazY, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw other player / AI bot lander pip if present
      if (otherLander && !otherLander.crashed) {
        const wrappedOtherX = ((otherLander.x % worldW) + worldW) % worldW;
        const rOtherX = radarX + wrappedOtherX * scaleX;
        const rOtherY = radarFloorY + otherLander.y * scaleY;

        ctx.fillStyle = otherLander.themeColor || '#f43f5e';
        ctx.beginPath();
        ctx.arc(rOtherX, rOtherY, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = otherLander.themeColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(rOtherX, rOtherY, 6, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = otherLander.themeColor;
        ctx.font = '6px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        const otherLabel = otherLander.id === 'p2' && gameModeRef.current === 'AI_DUEL' ? 'BOT' : 'P2';
        ctx.fillText(otherLabel, rOtherX, rOtherY - 7);
      }

      // Draw active player lander pip
      const wrappedLanderX = ((activeLander.x % worldW) + worldW) % worldW;
      const rLanderX = radarX + wrappedLanderX * scaleX;
      const rLanderY = radarFloorY + activeLander.y * scaleY;

      // Pulsing radar sweep ring
      const sweepPulse = 6 + 3 * Math.sin(Date.now() * 0.009);
      ctx.strokeStyle = activeLander.themeColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(rLanderX, rLanderY, sweepPulse, 0, Math.PI * 2);
      ctx.stroke();

      // Lander core dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(rLanderX, rLanderY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Heading vector line on radar
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(rLanderX, rLanderY);
      ctx.lineTo(rLanderX + activeLander.vx * 0.4, rLanderY + activeLander.vy * 0.4);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '6px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('YOU', rLanderX, rLanderY - 8);

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

    const isDuel = gameModeRef.current === 'DUEL' || gameModeRef.current === 'AI_DUEL';
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
      // 2-PLAYER / PLAY-AGAINST-AI SPLIT SCREEN: Left (P1) and Right (P2 / AI Bot)
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

      // Viewport 2 (Player 2 or AI Opponent)
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
      ctx.fillStyle = gameModeRef.current === 'AI_DUEL' ? `rgba(34, 211, 238, ${pulse})` : `rgba(56, 189, 248, ${pulse})`;
      ctx.fillRect(divX + 1, 0, 2, canvasHeight);

      // VS Badge in center
      const vsY = canvasHeight / 2 - 16;
      ctx.fillStyle = '#020617';
      ctx.fillRect(divX - 26, vsY, 56, 32);
      ctx.strokeStyle = gameModeRef.current === 'AI_DUEL' ? '#22d3ee' : '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(divX - 26, vsY, 56, 32);

      ctx.fillStyle = gameModeRef.current === 'AI_DUEL' ? '#22d3ee' : '#f59e0b';
      ctx.font = 'bold 8.5px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(gameModeRef.current === 'AI_DUEL' ? 'VS AI' : 'VS', divX + 2, vsY + 20);
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

      {/* DECLUTTERED SLEEK IN-FLIGHT COCKPIT HUD - ENLARGED TELEMETRY */}
      <header className="w-full bg-[#08080c]/90 backdrop-blur-md border-b-2 border-emerald-500/50 px-4 py-2 md:py-3 z-20 shrink-0 flex items-center justify-between gap-3 shadow-lg rounded-none">
        {/* Left: Mission & Epoch Pill */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-xs md:text-sm font-black text-emerald-400 tracking-wider">
            RETROGRADE
          </span>
          <span
            className="text-[9px] md:text-xs font-bold px-2.5 py-1 border uppercase shadow-sm"
            style={{
              color: activeEpoch.themeColor,
              borderColor: `${activeEpoch.themeColor}90`,
              backgroundColor: `${activeEpoch.themeColor}20`,
            }}>
            MAP {gameState.level}: {activeEpoch.name}
          </span>
          <span className="text-[8px] text-zinc-400 font-mono hidden md:inline uppercase">
            [{activeEpoch.era}]
          </span>
        </div>

        {/* Center: Integrated Telemetry Cluster */}
        <div className="flex items-center gap-3 md:gap-6 text-xs font-mono">
          {/* Fuel Bar & Quantity (Player 1) */}
          <div className="flex items-center gap-2">
            <Zap size={15} className={isLowFuelP1 ? 'text-red-500 animate-bounce' : 'text-emerald-400'} />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none mb-1">
                <span className="text-zinc-500 text-[8px] md:text-[9px] font-bold">
                  {gameMode === 'DUEL' ? 'P1 FUEL:' : gameMode === 'AI_DUEL' ? 'YOU FUEL:' : 'FUEL:'}
                </span>
                <span className={`font-bold text-xs md:text-sm ${isLowFuelP1 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {currentFuelP1}L
                </span>
              </div>
              <div className="w-20 md:w-32 h-2.5 bg-zinc-900 border border-zinc-700 overflow-hidden shadow-inner">
                <div
                  className={`h-full transition-all duration-100 ${
                    isLowFuelP1 ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, (currentFuelP1 / telemetry.maxFuel) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* In Duel & AI Duel Mode, display P2 / AI Bot Fuel */}
          {(gameMode === 'DUEL' || gameMode === 'AI_DUEL') && (
            <div className="flex items-center gap-2">
              <Zap
                size={15}
                className={isLowFuelP2 ? 'text-red-500 animate-bounce' : gameMode === 'AI_DUEL' ? 'text-cyan-400' : 'text-amber-400'}
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 leading-none mb-1">
                  <span className="text-zinc-500 text-[8px] md:text-[9px] font-bold">
                    {gameMode === 'AI_DUEL' ? `${selectedAiPersona.callsign} FUEL:` : 'P2 FUEL:'}
                  </span>
                  <span
                    className="font-bold text-xs md:text-sm"
                    style={{ color: isLowFuelP2 ? '#f87171' : gameMode === 'AI_DUEL' ? selectedAiPersona.hullColor : '#fbbf24' }}>
                    {currentFuelP2}L
                  </span>
                </div>
                <div className="w-20 md:w-32 h-2.5 bg-zinc-900 border border-zinc-700 overflow-hidden shadow-inner">
                  <div
                    className="h-full transition-all duration-100"
                    style={{
                      width: `${Math.max(0, Math.min(100, (currentFuelP2 / telemetryP2.maxFuel) * 100))}%`,
                      backgroundColor: isLowFuelP2 ? '#ef4444' : gameMode === 'AI_DUEL' ? selectedAiPersona.hullColor : '#f59e0b',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Vertical Speed Readout */}
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 text-[8px] md:text-[9px] font-bold">V-SPD:</span>
            <span
              className={`font-bold text-xs md:text-sm ${
                Math.abs(telemetry.vy) > (getConfig('maxSafeLandingVy') as number)
                  ? 'text-red-400 animate-pulse'
                  : 'text-cyan-300'
              }`}>
              {telemetry.vy} <span className="text-[7.5px] text-zinc-500">PX/S</span>
            </span>
          </div>

          {/* Target Navigation Beacon */}
          <div className="hidden sm:flex items-center gap-1.5 text-emerald-300 text-[9px] md:text-xs">
            <Compass size={14} className="text-emerald-400 shrink-0" />
            <span className="font-bold truncate max-w-[190px]">
              {telemetry.nearestPadName} [{telemetry.nearestPadMult}x] {telemetry.nearestPadDir === 'aligned' ? '▼ ALIGNED' : telemetry.nearestPadDir === 'left' ? `◄ ${telemetry.nearestPadDist}m` : `${telemetry.nearestPadDist}m ►`}
            </span>
          </div>
        </div>

        {/* Right: Score, Reserves & Actions */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {gameMode === 'SOLO' && (
            <div className="hidden md:flex items-center gap-1.5 font-mono text-zinc-400">
              <span className="text-zinc-500 text-[8px] md:text-[9px]">LIVES:</span>
              <span className="font-bold text-xs md:text-sm text-yellow-400">{gameState.lives}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-zinc-500 text-[8px] md:text-[9px] hidden sm:inline">SCORE:</span>
            <span className="font-bold text-xs md:text-sm text-emerald-400">{gameState.score}</span>
          </div>

          <button
            onClick={() => {
              exitAttractMode();
              toggleFullscreen();
              gameAudio.playCrispClick();
            }}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            className="p-1.5 md:p-2 hover:bg-emerald-400 hover:text-black text-emerald-400 border border-emerald-500/60 transition flex items-center justify-center">
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          <button
            onClick={() => {
              exitAttractMode();
              setPreviousScreen(gameState.status === 'PLAYING' ? 'PAUSE' : 'TITLE');
              setMainMenuScreen('LEADERBOARD');
              gameAudio.playCrispClick();
            }}
            title="Scoreboard"
            className="p-1.5 md:p-2 hover:bg-yellow-400 hover:text-black text-yellow-400 border border-yellow-500/60 transition flex items-center justify-center">
            <Trophy size={16} />
          </button>

          <button
            onClick={() => {
              exitAttractMode();
              setIsMenuOpen((prev) => !prev);
              gameAudio.playCrispClick();
            }}
            aria-label="Toggle Game Menu"
            className="px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-400 hover:text-black text-emerald-400 border border-emerald-500/60 transition text-[9px] md:text-[10px] font-bold flex items-center gap-1.5">
            <Menu size={14} />
            <span className="hidden sm:inline">MENU</span>
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
          {gameMode === 'SOLO' || gameMode === 'AI_DUEL' ? (
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

      {/* ATTRACT MODE OVERLAY (Subtle press any key) */}
      {isAttractMode && (
        <div
          onClick={() => setIsAttractMode(false)}
          className="absolute inset-0 z-30 pointer-events-auto cursor-pointer flex flex-col justify-end items-center pb-12 bg-black/30">
          <div className="bg-black/80 border border-emerald-500 px-6 py-3 font-mono text-emerald-400 text-xs uppercase animate-pulse flex items-center gap-2">
            <span>[ PRESS ANY KEY OR CLICK TO ENTER APOLLO COMMAND CONSOLE ]</span>
          </div>
        </div>
      )}

      {/* MODULAR MENU SCREENS & OVERLAYS */}
      {!isAttractMode && (
        <MenuScreens
          mainMenuScreen={mainMenuScreen}
          setMainMenuScreen={setMainMenuScreen}
          previousScreen={previousScreen}
          setPreviousScreen={setPreviousScreen}
          gameMode={gameMode}
          setGameMode={setGameMode}
          pilotName={pilotName}
          setPilotName={setPilotName}
          p2Name={p2Name}
          setP2Name={setP2Name}
          p1Theme={p1Theme}
          setP1Theme={setP1Theme}
          p2Theme={p2Theme}
          setP2Theme={setP2Theme}
          selectedStartingEpoch={selectedStartingEpoch}
          setSelectedStartingEpoch={setSelectedStartingEpoch}
          selectedAiPersona={selectedAiPersona}
          setSelectedAiPersona={setSelectedAiPersona}
          keyBindings={keyBindings}
          setKeyBindings={setKeyBindings}
          rebindingAction={rebindingAction}
          setRebindingAction={setRebindingAction}
          isSfxMuted={isSfxMuted}
          setIsSfxMuted={setIsSfxMuted}
          isMusicMuted={isMusicMuted}
          setIsMusicMuted={setIsMusicMuted}
          isFullscreen={isFullscreen}
          toggleFullscreen={toggleFullscreen}
          leaderboardList={leaderboardList}
          setLeaderboardList={setLeaderboardList}
          onStartGame={initGame}
          onRestartLevel={handleRestartLevel}
          onAdvanceLevel={handleAdvanceLevel}
          onAbortToTitle={handleAbortToTitle}
          gameState={gameState}
          lastTouchdownStats={lastTouchdownStats}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          assets={assets}
          shipThemes={SHIP_THEMES}
          presetPilotNames={PRESET_PILOT_NAMES}
        />
      )}
    </div>
  );
}
