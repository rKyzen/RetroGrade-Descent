/**
 * @fileoverview Redesigned Menu Screens & Overlays for Retrograde Descent.
 * Features:
 * - Clean 2-column main screen (Left: Title + 3 primary options [Start, Settings, Leaderboard]; Right: Live gameplay preview)
 * - Start Flow: Select Mode (Solo, Play Against AI, 2P Duel) -> Craft Customization (Name, Livery, AI Bot Persona) -> Level Selection (10 levels with unique maps)
 * - Settings with SFX, Music, Display, and customizable keyboard controls for both players (with interactive rebind)
 * - Leaderboard with filters and historical astronaut missions
 * - Flight manual with retrogression lore
 * - Responsive Back buttons on EVERY page!
 */

import React, {useState} from 'react';
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
  RotateCcw,
  RotateCw,
  Settings,
  Shield,
  Sliders,
  Sparkles,
  Trophy,
  User,
  Users,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import {
  LEVELS,
  LEVELS_BY_PLANET,
  getLevel,
  LevelConfig,
  PlanetId,
  PLANETS,
  getPlanet,
  RETROGRESSION_STEPS,
  RetrogressionStep,
} from './levels';
import {AI_PERSONAS, AiPersona} from './aiPilot';
import {
  KeyBindings,
  DEFAULT_KEYBINDINGS,
  saveKeybindings,
  resetKeybindings,
  formatKeyDisplay,
} from './keybindings';
import LivePreviewCanvas from './LivePreviewCanvas';
import {
  LeaderboardEntry,
  resetLeaderboardToSeeds,
  setStoredPilotName,
  setStoredP2Name,
} from './leaderboard';
import {gameAudio, GameState, MenuOverlay} from './utils/helper';

export interface ShipTheme {
  id: string;
  name: string;
  color: string;
  glow: string;
  borderClass: string;
}

export type MainMenuScreen =
  | 'TITLE'
  | 'FLOW_PLANET'
  | 'FLOW_MODE'
  | 'FLOW_CUSTOMIZE'
  | 'FLOW_LEVEL'
  | 'SETTINGS'
  | 'LEADERBOARD'
  | 'HOW_TO_PLAY';

interface MenuScreensProps {
  mainMenuScreen: MainMenuScreen;
  setMainMenuScreen: (screen: MainMenuScreen) => void;
  previousScreen: 'TITLE' | 'PAUSE';
  setPreviousScreen: (screen: 'TITLE' | 'PAUSE') => void;
  selectedPlanet: PlanetId;
  setSelectedPlanet: (planet: PlanetId) => void;
  gameMode: 'SOLO' | 'AI_DUEL' | 'DUEL';
  setGameMode: (mode: 'SOLO' | 'AI_DUEL' | 'DUEL') => void;
  pilotName: string;
  setPilotName: (name: string) => void;
  p2Name: string;
  setP2Name: (name: string) => void;
  p1Theme: ShipTheme;
  setP1Theme: (theme: ShipTheme) => void;
  p2Theme: ShipTheme;
  setP2Theme: (theme: ShipTheme) => void;
  selectedStartingEpoch: number;
  setSelectedStartingEpoch: (epoch: number) => void;
  selectedAiPersona: AiPersona;
  setSelectedAiPersona: (persona: AiPersona) => void;
  keyBindings: KeyBindings;
  setKeyBindings: React.Dispatch<React.SetStateAction<KeyBindings>>;
  rebindingAction: keyof KeyBindings | null;
  setRebindingAction: (action: keyof KeyBindings | null) => void;
  isSfxMuted: boolean;
  setIsSfxMuted: React.Dispatch<React.SetStateAction<boolean>>;
  isMusicMuted: boolean;
  setIsMusicMuted: React.Dispatch<React.SetStateAction<boolean>>;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  leaderboardList: LeaderboardEntry[];
  setLeaderboardList: (list: LeaderboardEntry[]) => void;
  onStartGame: () => void;
  onRestartLevel: () => void;
  onAdvanceLevel: () => void;
  onAbortToTitle: () => void;
  gameState: GameState;
  lastTouchdownStats: {
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
  } | null;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  assets: Record<string, HTMLImageElement | null>;
  shipThemes: ShipTheme[];
  presetPilotNames: string[];
}

export default function MenuScreens({
  mainMenuScreen,
  setMainMenuScreen,
  previousScreen,
  setPreviousScreen,
  selectedPlanet,
  setSelectedPlanet,
  gameMode,
  setGameMode,
  pilotName,
  setPilotName,
  p2Name,
  setP2Name,
  p1Theme,
  setP1Theme,
  p2Theme,
  setP2Theme,
  selectedStartingEpoch,
  setSelectedStartingEpoch,
  selectedAiPersona,
  setSelectedAiPersona,
  keyBindings,
  setKeyBindings,
  rebindingAction,
  setRebindingAction,
  isSfxMuted,
  setIsSfxMuted,
  isMusicMuted,
  setIsMusicMuted,
  isFullscreen,
  toggleFullscreen,
  leaderboardList,
  setLeaderboardList,
  onStartGame,
  onRestartLevel,
  onAdvanceLevel,
  onAbortToTitle,
  gameState,
  lastTouchdownStats,
  isMenuOpen,
  setIsMenuOpen,
  assets,
  shipThemes,
  presetPilotNames,
}: MenuScreensProps) {
  const [leaderboardFilter, setLeaderboardFilter] = useState<'ALL' | 'SOLO' | 'AI_DUEL' | 'DUEL'>('ALL');

  const currentPlanetDef = getPlanet(selectedPlanet);
  const selectedLevelConfig = getLevel(selectedPlanet, selectedStartingEpoch);
  const activeLevelConfig = getLevel(selectedPlanet, gameState.level);

  // Filtered leaderboard entries
  const filteredLeaderboard = leaderboardList.filter((entry) => {
    if (leaderboardFilter === 'ALL') return true;
    return entry.mode === leaderboardFilter;
  });

  // =========================================================================
  // 1. MAIN TITLE SCREEN (Redesigned 2-Column Clean Layout)
  // Left: Styled Game Title + 3 Primary Options (Start, Settings, Leaderboard)
  // Right: Live Gameplay Preview
  // =========================================================================
  if (gameState.status === 'START' && mainMenuScreen === 'TITLE') {
    return (
      <MenuOverlay tone="neutral" zIndex={40} fullScreen maxWidthClass="w-full max-w-7xl">
        <div className="w-full bg-[#08080c]/95 backdrop-blur-md border-4 border-emerald-500 p-4 md:p-6 shadow-[12px_12px_0px_0px_#064e3b] flex flex-col text-emerald-400 rounded-none relative">
          
          {/* Top Bar: Apollo Terminal Badge, Record Pill & Fullscreen */}
          <div className="flex flex-col sm:flex-row items-center justify-between pb-3 mb-4 border-b-2 border-emerald-800/80 gap-3">
            <div className="flex items-center gap-2.5">
              <Radio size={16} className="text-emerald-400 animate-pulse" />
              <div>
                <span className="text-[7.5px] text-zinc-400 font-mono uppercase tracking-widest block">
                  APOLLO GUIDANCE OS // LUNAR INSERTION TERMINAL
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {leaderboardList && leaderboardList.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setPreviousScreen('TITLE');
                    setMainMenuScreen('LEADERBOARD');
                    gameAudio.playCrispClick();
                  }}
                  className="bg-yellow-950/40 hover:bg-yellow-900/60 border border-yellow-500/70 px-2.5 py-1 text-[8px] flex items-center gap-2 text-yellow-300 font-mono transition">
                  <Trophy size={12} className="text-yellow-400" />
                  <span>RECORD: <strong>{leaderboardList[0].pilotName}</strong> ({leaderboardList[0].score.toLocaleString()} PTS)</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  toggleFullscreen();
                  gameAudio.playCrispClick();
                }}
                className="bg-black hover:bg-emerald-400 hover:text-black border border-emerald-500 px-2.5 py-1 text-[8px] flex items-center gap-1.5 font-mono font-bold transition">
                {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                <span>{isFullscreen ? 'EXIT FS' : 'FULLSCREEN'}</span>
              </button>
            </div>
          </div>

          {/* Clean 2-Column Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-4">
            
            {/* LEFT SIDE: Styled Game Title & Three Simple Options */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
              <div className="pt-2">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-wider text-emerald-400 drop-shadow-[0_0_18px_rgba(16,185,129,0.5)] leading-none uppercase">
                  RETROGRADE
                </h1>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-widest text-emerald-300/80 leading-tight uppercase mt-1">
                  DESCENT
                </h2>
              </div>

              {/* THREE CLEAN, SIMPLE PRIMARY BUTTONS */}
              <div className="space-y-3 w-full">
                {/* 1. START BUTTON */}
                <button
                  type="button"
                  autoFocus
                  onClick={() => {
                    setMainMenuScreen('FLOW_PLANET');
                    gameAudio.playCrispClick();
                  }}
                  className="w-full bg-emerald-400 hover:bg-emerald-300 text-black border-4 border-emerald-200 font-black p-4 text-left shadow-[6px_6px_0px_0px_#064e3b] active:translate-x-0.5 active:translate-y-0.5 transition flex items-center justify-between group cursor-pointer rounded-none">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 bg-black text-emerald-400 flex items-center justify-center border-2 border-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                      <Rocket size={24} />
                    </div>
                    <span className="text-base sm:text-lg font-black tracking-wider uppercase">
                      START FLIGHT
                    </span>
                  </div>
                  <ChevronRight size={24} className="group-hover:translate-x-1.5 transition-transform shrink-0" />
                </button>

                {/* 2. SETTINGS BUTTON */}
                <button
                  type="button"
                  onClick={() => {
                    setPreviousScreen('TITLE');
                    setMainMenuScreen('SETTINGS');
                    gameAudio.playCrispClick();
                  }}
                  className="w-full bg-black/80 hover:bg-zinc-900 text-zinc-200 border-2 border-zinc-700 hover:border-emerald-400 p-3.5 text-left shadow-[4px_4px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition flex items-center justify-between group cursor-pointer rounded-none">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 bg-zinc-950 text-cyan-400 flex items-center justify-center border border-zinc-800 group-hover:border-cyan-400 shrink-0">
                      <Sliders size={20} />
                    </div>
                    <span className="text-sm sm:text-base font-bold tracking-wider text-emerald-300 uppercase">
                      SETTINGS & CONTROLS
                    </span>
                  </div>
                  <ChevronRight size={20} className="text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all shrink-0" />
                </button>

                {/* 3. LEADERBOARD BUTTON */}
                <button
                  type="button"
                  onClick={() => {
                    setPreviousScreen('TITLE');
                    setMainMenuScreen('LEADERBOARD');
                    gameAudio.playCrispClick();
                  }}
                  className="w-full bg-black/80 hover:bg-zinc-900 text-zinc-200 border-2 border-zinc-700 hover:border-yellow-400 p-3.5 text-left shadow-[4px_4px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition flex items-center justify-between group cursor-pointer rounded-none">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 bg-zinc-950 text-yellow-400 flex items-center justify-center border border-zinc-800 group-hover:border-yellow-400 shrink-0">
                      <Trophy size={20} />
                    </div>
                    <span className="text-sm sm:text-base font-bold tracking-wider text-yellow-400 uppercase">
                      LEADERBOARD
                    </span>
                  </div>
                  <ChevronRight size={20} className="text-zinc-500 group-hover:text-yellow-400 group-hover:translate-x-1 transition-all shrink-0" />
                </button>
              </div>

              {/* Minimal Bottom Bar */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-800 text-[8px] font-mono text-zinc-400">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const newMuted = gameAudio.toggleMute();
                      setIsSfxMuted(newMuted);
                    }}
                    className="hover:text-white flex items-center gap-1.5 transition">
                    {isSfxMuted ? <VolumeX size={13} className="text-red-400" /> : <Volume2 size={13} className="text-emerald-400" />}
                    <span>SFX: {isSfxMuted ? 'OFF' : 'ON'}</span>
                  </button>
                  <span>|</span>
                  <button
                    type="button"
                    onClick={() => setIsMusicMuted((prev) => !prev)}
                    className="hover:text-white flex items-center gap-1.5 transition">
                    {isMusicMuted ? <VolumeX size={13} className="text-red-400" /> : <Volume2 size={13} className="text-emerald-400" />}
                    <span>BGM: {isMusicMuted ? 'OFF' : 'ON'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPreviousScreen('TITLE');
                    setMainMenuScreen('HOW_TO_PLAY');
                    gameAudio.playCrispClick();
                  }}
                  className="hover:text-emerald-400 transition flex items-center gap-1.5 font-bold">
                  <HelpCircle size={13} />
                  <span>[ FLIGHT MANUAL ]</span>
                </button>
              </div>
            </div>

            {/* RIGHT SIDE: Beautiful Refined Live Gameplay Preview */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center bg-black/70 border-2 border-emerald-900/60 p-2 md:p-3 relative shadow-inner">
              <div className="w-full flex items-center justify-between pb-1.5 mb-1.5 border-b border-zinc-800 text-[8px] font-mono">
                <span className="text-emerald-400 font-bold flex items-center gap-2">
                  <Activity size={12} className="animate-pulse text-emerald-400" />
                  <span>ORBITAL FLIGHT SIMULATOR // LIVE FEED</span>
                </span>
                <span className="text-emerald-500 font-bold">[ONLINE]</span>
              </div>

              {/* Render the Live Preview Canvas */}
              <div className="w-full flex-1 flex items-center justify-center">
                <LivePreviewCanvas landerColor={p1Theme.color} pilotCallsign={pilotName} landerImage={assets['lander']} />
              </div>

              {/* Preview Footer Notes */}
              <div className="w-full flex items-center justify-between pt-1.5 border-t border-zinc-800 text-[7px] font-mono text-zinc-400">
                <span>SECTOR: MARE TRANQUILLITATIS</span>
                <span className="text-emerald-400 font-bold">AUTONOMOUS AVIONICS • 60 FPS</span>
              </div>
            </div>

          </div>
        </div>
      </MenuOverlay>
    );
  }

  // =========================================================================
  // 2. START FLOW - STEP 1: CELESTIAL TARGET (PLANET SELECTION)
  // 1) The Moon  2) The Mars  3) The Venus
  // =========================================================================
  if (gameState.status === 'START' && mainMenuScreen === 'FLOW_PLANET') {
    const selectedDef = getPlanet(selectedPlanet);

    return (
      <MenuOverlay tone="neutral" zIndex={40} fullScreen maxWidthClass="w-full max-w-6xl">
        <div className="w-full bg-[#08080c]/95 backdrop-blur-md border-4 border-emerald-500 p-5 md:p-7 shadow-[12px_12px_0px_0px_#064e3b] flex flex-col text-emerald-400 rounded-none relative">
          {/* Header with Step Indicator */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-emerald-800/80">
            <div className="flex items-center gap-2.5">
              <Compass size={22} className="text-emerald-400 animate-pulse" />
              <div>
                <h2 className="text-base sm:text-xl font-black tracking-wider uppercase text-emerald-400">
                  CELESTIAL DESCENT TARGET // SELECT PLANET
                </h2>
                <span className="text-[7.5px] font-mono text-zinc-400 uppercase tracking-widest block">
                  START FLOW // STEP 1 OF 4 • TARGET CELESTIAL BODY DETERMINES GRAVITY, ATMOSPHERE & MAP TOPOLOGY
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setMainMenuScreen('TITLE');
                gameAudio.playCrispClick();
              }}
              className="bg-black hover:bg-zinc-800 border-2 border-zinc-700 hover:border-emerald-400 text-zinc-300 hover:text-white px-3 py-1.5 text-[8.5px] font-bold flex items-center gap-1.5 uppercase transition">
              <ChevronLeft size={13} />
              <span>RETURN TO TITLE</span>
            </button>
          </div>

          {/* 3 Celestial Planet Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {PLANETS.map((planet) => {
              const isSelected = selectedPlanet === planet.id;
              return (
                <div
                  key={planet.id}
                  onClick={() => {
                    setSelectedPlanet(planet.id);
                    gameAudio.playCrispClick();
                  }}
                  className={`p-4 border-2 transition rounded-none relative flex flex-col justify-between cursor-pointer group ${
                    isSelected
                      ? 'bg-zinc-900/90 shadow-[6px_6px_0_0_#10b981]'
                      : 'bg-black/75 hover:bg-zinc-950/80 border-zinc-800 hover:border-zinc-600'
                  }`}
                  style={{
                    borderColor: isSelected ? planet.accentColor : undefined,
                    boxShadow: isSelected ? `6px 6px 0 0 ${planet.accentColor}` : undefined,
                  }}>
                  <div>
                    {/* Planet Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-3xl filter drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]">
                          {planet.icon}
                        </span>
                        <div>
                          <h3
                            className="text-base sm:text-lg font-black uppercase tracking-wider leading-none"
                            style={{ color: planet.accentColor }}>
                            {planet.name}
                          </h3>
                          <span className="text-[7px] font-mono text-zinc-400 uppercase block tracking-widest mt-0.5">
                            {planet.subname}
                          </span>
                        </div>
                      </div>

                      {isSelected ? (
                        <div
                          className="px-2 py-0.5 text-[7px] font-mono font-bold uppercase flex items-center gap-1 border"
                          style={{
                            borderColor: planet.accentColor,
                            color: planet.accentColor,
                            backgroundColor: `${planet.accentColor}18`,
                          }}>
                          <Check size={11} />
                          <span>TARGET</span>
                        </div>
                      ) : (
                        <span className="text-[6.5px] font-mono px-1.5 py-0.5 bg-zinc-950 border border-zinc-800 text-zinc-400 group-hover:text-zinc-200">
                          CLICK TO TARGET
                        </span>
                      )}
                    </div>

                    {/* Planet Description */}
                    <p className="text-[8px] text-zinc-300 font-mono leading-relaxed mb-3">
                      {planet.description}
                    </p>

                    {/* Atmospheric & Physics Specifications */}
                    <div className="space-y-1.5 bg-black/85 border border-zinc-800/80 p-2.5 font-mono text-[7px]">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">SURFACE GRAVITY:</span>
                        <strong className="font-bold" style={{ color: planet.accentColor }}>
                          {planet.gravity} px/s²
                        </strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">ATMOSPHERIC PRESSURE:</span>
                        <span className="text-zinc-300 font-bold">{planet.atmospherePressure}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">MAIN ENGINE THRUST:</span>
                        <span className="text-emerald-400 font-bold">{planet.mainThrust} px/s²</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">CAMPAIGN SECTORS:</span>
                        <span className="text-cyan-400 font-bold">10 UNIQUE MAPS</span>
                      </div>
                    </div>
                  </div>

                  {/* Planet Bottom Quote & Difficulty Badge */}
                  <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                    <span className="text-[6.5px] font-mono text-zinc-400 italic truncate max-w-[200px]">
                      {planet.flavorQuote}
                    </span>
                    <span
                      className="text-[6.5px] font-mono font-bold px-1.5 py-0.5 uppercase border"
                      style={{
                        borderColor: `${planet.accentColor}60`,
                        color: planet.accentColor,
                        backgroundColor: `${planet.accentColor}10`,
                      }}>
                      {planet.difficultyRating}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Confirmed Celestial Target Briefing Strip */}
          <div
            className="p-3 border-2 font-mono flex flex-col sm:flex-row items-center justify-between gap-3 mb-4"
            style={{
              backgroundColor: `${selectedDef.accentColor}12`,
              borderColor: `${selectedDef.accentColor}70`,
            }}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedDef.icon}</span>
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: selectedDef.accentColor }}>
                  TARGET CONFIRMED: {selectedDef.name} [{selectedDef.subname}]
                </span>
                <span className="text-[7.5px] text-zinc-300 block">
                  Gravity: {selectedDef.gravity} px/s² • Atmosphere: {selectedDef.atmospherePressure} • 10 progressive maps with avionics retrogression
                </span>
              </div>
            </div>

            <div className="text-[7.5px] text-zinc-400 uppercase font-mono tracking-wider shrink-0">
              [ CELESTIAL TARGET LOCKED ]
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t-2 border-emerald-800/80">
            <button
              type="button"
              onClick={() => {
                setMainMenuScreen('TITLE');
                gameAudio.playCrispClick();
              }}
              className="w-full sm:w-auto px-4 py-2.5 bg-black hover:bg-zinc-800 border-2 border-zinc-700 text-zinc-300 hover:text-white font-bold text-[9px] uppercase transition flex items-center justify-center gap-1.5">
              <ChevronLeft size={14} />
              <span>RETURN TO TITLE</span>
            </button>

            <button
              type="button"
              autoFocus
              onClick={() => {
                setMainMenuScreen('FLOW_MODE');
                gameAudio.playCrispClick();
              }}
              className="w-full sm:flex-1 max-w-md bg-emerald-400 hover:bg-emerald-300 text-black border-4 border-emerald-200 font-black text-sm py-3 px-6 shadow-[0_0_20px_rgba(16,185,129,0.5)] active:translate-x-0.5 active:translate-y-0.5 transition flex items-center justify-center gap-2 uppercase rounded-none cursor-pointer">
              <span>CONFIRM {selectedDef.name} & SELECT FLIGHT MODE</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </MenuOverlay>
    );
  }

  // =========================================================================
  // 3. START FLOW - STEP 2: SELECT MODE
  // Solo Flight vs Play Against AI vs 2P Duel Flight + BACK BUTTON
  // =========================================================================
  if (gameState.status === 'START' && mainMenuScreen === 'FLOW_MODE') {
    return (
      <MenuOverlay tone="neutral" zIndex={40} fullScreen maxWidthClass="w-full max-w-5xl">
        <div className="w-full bg-[#08080c]/95 backdrop-blur-md border-4 border-emerald-500 p-5 md:p-7 shadow-[12px_12px_0px_0px_#064e3b] flex flex-col text-emerald-400 rounded-none relative">
          
          {/* Header with Step Indicator */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-emerald-800/80">
            <div className="flex items-center gap-2">
              <Rocket size={18} className="text-emerald-400" />
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-wider uppercase text-emerald-400">
                  SELECT FLIGHT PROFILE
                </h2>
                <span className="text-[7.5px] font-mono text-zinc-400 uppercase tracking-widest block">
                  START FLOW // STEP 2 OF 4 • TARGET: {currentPlanetDef.name} [{currentPlanetDef.subname}]
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setMainMenuScreen('FLOW_PLANET');
                gameAudio.playCrispClick();
              }}
              className="bg-black hover:bg-zinc-800 border-2 border-zinc-700 hover:border-emerald-400 text-zinc-300 hover:text-white px-3 py-1.5 text-[8.5px] font-bold flex items-center gap-1.5 uppercase transition">
              <ChevronLeft size={13} />
              <span>BACK TO PLANET</span>
            </button>
          </div>

          {/* Three Mode Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            
            {/* Mode 1: Solo Flight */}
            <div
              onClick={() => {
                setGameMode('SOLO');
                gameAudio.playCrispClick();
              }}
              className={`p-4 border-2 transition cursor-pointer flex flex-col justify-between rounded-none ${
                gameMode === 'SOLO'
                  ? 'bg-emerald-950/60 border-emerald-400 text-emerald-300 shadow-[4px_4px_0_0_#064e3b]'
                  : 'bg-black/80 border-zinc-800 text-zinc-400 hover:border-zinc-600'
              }`}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 flex items-center justify-center border ${
                    gameMode === 'SOLO' ? 'border-emerald-400 bg-emerald-950 text-emerald-400' : 'border-zinc-700 bg-zinc-950 text-zinc-500'
                  }`}>
                    <Rocket size={18} />
                  </div>
                  {gameMode === 'SOLO' && (
                    <span className="text-[7.5px] bg-emerald-400 text-black px-1.5 py-0.5 font-bold uppercase">
                      ACTIVE PROFILE
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-black uppercase text-emerald-400 mb-1">
                  SOLO FLIGHT
                </h3>
                <span className="text-[7px] font-mono text-zinc-400 block mb-2 uppercase">
                  1 PILOT • 10 RETROGRESSION LEVELS
                </span>
                <p className="text-[8px] font-mono text-zinc-300 leading-relaxed">
                  Fly solo across 10 progressive technological eras. Maintain fuel discipline,
                  brave crosswinds, and adapt as cockpit avionics strip away toward complete blackout.
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-zinc-800/80 text-[7px] font-mono text-emerald-400/90 font-bold">
                ✓ Full 10-level campaign progression
              </div>
            </div>

            {/* Mode 2: Play Against AI */}
            <div
              onClick={() => {
                setGameMode('AI_DUEL');
                gameAudio.playCrispClick();
              }}
              className={`p-4 border-2 transition cursor-pointer flex flex-col justify-between rounded-none ${
                gameMode === 'AI_DUEL'
                  ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow-[4px_4px_0_0_#0891b2]'
                  : 'bg-black/80 border-zinc-800 text-zinc-400 hover:border-zinc-600'
              }`}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 flex items-center justify-center border ${
                    gameMode === 'AI_DUEL' ? 'border-cyan-400 bg-cyan-950 text-cyan-400' : 'border-zinc-700 bg-zinc-950 text-zinc-500'
                  }`}>
                    <Bot size={18} />
                  </div>
                  {gameMode === 'AI_DUEL' && (
                    <span className="text-[7.5px] bg-cyan-400 text-black px-1.5 py-0.5 font-bold uppercase">
                      ACTIVE PROFILE
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-black uppercase text-cyan-400 mb-1">
                  PLAY AGAINST AI
                </h3>
                <span className="text-[7px] font-mono text-zinc-400 block mb-2 uppercase">
                  RACE AN AUTONOMOUS LUNAR ROBOT
                </span>
                <p className="text-[8px] font-mono text-zinc-300 leading-relaxed">
                  Challenge the intelligent AI Lunar Bot in a real-time race! Both landers spawn on
                  shared physical terrain with live split-screen cameras. First safe touchdown wins the duel.
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-zinc-800/80 text-[7px] font-mono text-cyan-400 font-bold">
                ✓ Intelligent real-time vector AI controller
              </div>
            </div>

            {/* Mode 3: 2P Duel Flight */}
            <div
              onClick={() => {
                setGameMode('DUEL');
                gameAudio.playCrispClick();
              }}
              className={`p-4 border-2 transition cursor-pointer flex flex-col justify-between rounded-none ${
                gameMode === 'DUEL'
                  ? 'bg-yellow-950/60 border-yellow-400 text-yellow-300 shadow-[4px_4px_0_0_#78350f]'
                  : 'bg-black/80 border-zinc-800 text-zinc-400 hover:border-zinc-600'
              }`}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 flex items-center justify-center border ${
                    gameMode === 'DUEL' ? 'border-yellow-400 bg-yellow-950 text-yellow-400' : 'border-zinc-700 bg-zinc-950 text-zinc-500'
                  }`}>
                    <Users size={18} />
                  </div>
                  {gameMode === 'DUEL' && (
                    <span className="text-[7.5px] bg-yellow-400 text-black px-1.5 py-0.5 font-bold uppercase">
                      ACTIVE PROFILE
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-black uppercase text-yellow-400 mb-1">
                  2P DUEL FLIGHT
                </h3>
                <span className="text-[7px] font-mono text-zinc-400 block mb-2 uppercase">
                  LOCAL 2-PLAYER SPLIT SCREEN
                </span>
                <p className="text-[8px] font-mono text-zinc-300 leading-relaxed">
                  Head-to-head local multiplayer race. Player 1 (WASD) and Player 2 (Arrow Keys or custom)
                  compete on the same lunar crater terrain for distant pad multipliers.
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-zinc-800/80 text-[7px] font-mono text-yellow-400 font-bold">
                ✓ Simultaneous dual tracking split cameras
              </div>
            </div>

          </div>

          {/* Navigation Bar */}
          <div className="flex items-center justify-between pt-3 border-t-2 border-emerald-800/80">
            <button
              type="button"
              onClick={() => {
                setMainMenuScreen('FLOW_PLANET');
                gameAudio.playCrispClick();
              }}
              className="px-4 py-2 bg-black hover:bg-zinc-800 border-2 border-zinc-700 text-zinc-300 hover:text-white font-bold text-[9px] uppercase transition flex items-center gap-1.5">
              <ChevronLeft size={14} />
              <span>BACK TO PLANET</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMainMenuScreen('FLOW_CUSTOMIZE');
                gameAudio.playCrispClick();
              }}
              className="px-6 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-black font-black text-xs uppercase transition shadow-[3px_3px_0_0_#064e3b] flex items-center gap-2">
              <span>CONTINUE TO CRAFT CUSTOMIZATION</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </MenuOverlay>
    );
  }

  // =========================================================================
  // 4. START FLOW - STEP 3: CRAFT CUSTOMIZATION
  // Callsign, Livery Colors, AI Bot Persona (if AI mode), P2 (if Duel) + BACK BUTTON
  // =========================================================================
  if (gameState.status === 'START' && mainMenuScreen === 'FLOW_CUSTOMIZE') {
    return (
      <MenuOverlay tone="neutral" zIndex={40} fullScreen maxWidthClass="w-full max-w-5xl">
        <div className="w-full bg-[#08080c]/95 backdrop-blur-md border-4 border-emerald-500 p-5 md:p-7 shadow-[12px_12px_0px_0px_#064e3b] flex flex-col text-emerald-400 rounded-none relative">
          
          {/* Header with Step Indicator */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-emerald-800/80">
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-emerald-400" />
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-wider uppercase text-emerald-400">
                  CRAFT & PILOT SPECIFICATIONS
                </h2>
                <span className="text-[7.5px] font-mono text-zinc-400 uppercase tracking-widest block">
                  START FLOW // STEP 3 OF 4 • TARGET: {currentPlanetDef.name} • PROFILE: {gameMode === 'SOLO' ? 'SOLO FLIGHT' : gameMode === 'AI_DUEL' ? 'PLAY AGAINST AI' : '2P DUEL FLIGHT'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setMainMenuScreen('FLOW_MODE');
                gameAudio.playCrispClick();
              }}
              className="bg-black hover:bg-zinc-800 border-2 border-zinc-700 hover:border-emerald-400 text-zinc-300 hover:text-white px-3 py-1.5 text-[8.5px] font-bold flex items-center gap-1.5 uppercase transition">
              <ChevronLeft size={13} />
              <span>BACK TO MODE SELECT</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
            
            {/* PLAYER 1 CUSTOMIZATION */}
            <div className={`${gameMode === 'SOLO' ? 'lg:col-span-12' : 'lg:col-span-6'} bg-black/80 border-2 border-emerald-700 p-4 rounded-none space-y-3`}>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-[8.5px] font-bold text-emerald-400 font-mono uppercase flex items-center gap-1.5">
                  <User size={13} />
                  <span>{gameMode === 'DUEL' ? 'PLAYER 1 (WASD)' : 'PRIMARY LUNAR PILOT'}</span>
                </span>
                <span className="text-[7px] text-zinc-500 font-mono">CALLSIGN & LIVERY</span>
              </div>

              {/* Callsign Input */}
              <div>
                <label className="text-[7.5px] uppercase font-mono text-zinc-400 font-bold block mb-1">
                  PILOT CALLSIGN:
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
                  className="w-full bg-zinc-950 border-2 border-emerald-600 px-3 py-1.5 text-emerald-300 text-[10px] font-bold tracking-widest focus:outline-none focus:border-emerald-400 rounded-none mb-2"
                />

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1">
                  {presetPilotNames.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setPilotName(name);
                        setStoredPilotName(name);
                        gameAudio.playCrispClick();
                      }}
                      className={`text-[6.5px] px-2 py-0.5 border font-mono transition ${
                        pilotName === name
                          ? 'bg-emerald-500 text-black border-emerald-400 font-bold'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                      }`}>
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hull Livery Selector */}
              <div>
                <span className="text-[7.5px] uppercase font-mono text-zinc-400 font-bold block mb-1.5">
                  HULL LIVERY ACCENT:
                </span>
                <div className="grid grid-cols-5 gap-1.5 mb-2">
                  {shipThemes.map((theme) => {
                    const isSelected = p1Theme.id === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => {
                          setP1Theme(theme);
                          gameAudio.playCrispClick();
                        }}
                        className={`p-1.5 border text-center transition flex flex-col items-center gap-1 ${
                          isSelected ? 'border-white bg-zinc-900 scale-105 shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'border-zinc-800 bg-zinc-950 opacity-60 hover:opacity-100'
                        }`}>
                        <div className="w-5 h-5 border border-black" style={{ backgroundColor: theme.color }} />
                        <span className="text-[6px] font-mono truncate w-full" style={{ color: theme.color }}>
                          {theme.name.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Craft Visual Preview Bay */}
              <div className="bg-zinc-950 border border-zinc-800 p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-10 bg-black border border-zinc-800 flex items-center justify-center">
                    <div
                      className="absolute bottom-1 w-3 h-4 rounded-full blur-[2px] animate-pulse"
                      style={{ backgroundColor: p1Theme.color }}
                    />
                    {assets['lander'] ? (
                      <img src={assets['lander'].src} alt="Lander" className="w-8 h-7 object-contain relative z-10" />
                    ) : (
                      <div className="w-6 h-5 bg-white rounded-sm" />
                    )}
                  </div>
                  <div>
                    <span className="text-[7.5px] font-bold block" style={{ color: p1Theme.color }}>
                      {p1Theme.name}
                    </span>
                    <span className="text-[6.5px] font-mono text-zinc-500 block">
                      TITANIUM ALLOY STRUTS // HYDRAULIC SUSPENSION
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[6.5px] text-zinc-500 font-mono block">STARTING FUEL</span>
                  <span className="text-[8.5px] text-emerald-400 font-mono font-bold block">
                    {selectedLevelConfig.fuelCapacity}L
                  </span>
                </div>
              </div>
            </div>

            {/* PLAYER 2 / AI OPPONENT SPECIFICATIONS */}
            {gameMode === 'AI_DUEL' && (
              <div className="lg:col-span-6 bg-black/80 border-2 border-cyan-700 p-4 rounded-none space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="text-[8.5px] font-bold text-cyan-400 font-mono uppercase flex items-center gap-1.5">
                    <Bot size={13} />
                    <span>AI OPPONENT ROBOT</span>
                  </span>
                  <span className="text-[7px] text-cyan-500 font-mono">[AUTONOMOUS PILOT]</span>
                </div>

                {/* AI Craft Visual Preview Bay (Identical Spacecraft Model) */}
                <div className="bg-zinc-950 border border-cyan-900/60 p-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-10 bg-black border border-cyan-900 flex items-center justify-center">
                      <div
                        className="absolute bottom-1 w-3 h-4 rounded-full blur-[2px] animate-pulse"
                        style={{ backgroundColor: selectedAiPersona.hullColor }}
                      />
                      {assets['lander'] ? (
                        <img src={assets['lander'].src} alt="AI Lander" className="w-8 h-7 object-contain relative z-10" />
                      ) : (
                        <div className="w-6 h-5 bg-white rounded-sm" />
                      )}
                    </div>
                    <div>
                      <span className="text-[7.5px] font-bold block" style={{ color: selectedAiPersona.hullColor }}>
                        {selectedAiPersona.name} [{selectedAiPersona.callsign}]
                      </span>
                      <span className="text-[6.5px] font-mono text-zinc-500 block">
                        AUTONOMOUS FCS // AGILITY: {selectedAiPersona.agility}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[6.5px] text-zinc-500 font-mono block">STARTING FUEL</span>
                    <span className="text-[8.5px] text-cyan-400 font-mono font-bold block">
                      {selectedLevelConfig.fuelCapacity}L
                    </span>
                  </div>
                </div>

                <span className="text-[7.5px] uppercase font-mono text-zinc-400 font-bold block mb-1">
                  SELECT AI PILOT PERSONA:
                </span>

                <div className="space-y-2">
                  {AI_PERSONAS.map((persona) => {
                    const isSelected = selectedAiPersona.id === persona.id;
                    return (
                      <div
                        key={persona.id}
                        onClick={() => {
                          setSelectedAiPersona(persona);
                          gameAudio.playCrispClick();
                        }}
                        className={`p-2.5 border-2 transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[8.5px] font-bold uppercase" style={{ color: persona.hullColor }}>
                              {persona.name}
                            </span>
                            <span className="text-[6.5px] font-mono px-1 py-0.2 bg-black border border-zinc-700 text-zinc-400">
                              {persona.riskPreference}
                            </span>
                          </div>
                          <span className="text-[7px] font-mono text-zinc-300 block">
                            {persona.description}
                          </span>
                        </div>
                        <div className="w-5 h-5 border border-zinc-700 shrink-0 ml-2" style={{ backgroundColor: persona.hullColor }} />
                      </div>
                    );
                  })}
                </div>

                <div className="p-2 bg-cyan-950/30 border border-cyan-700/60 text-[7px] font-mono text-cyan-300 flex items-center gap-1.5">
                  <Zap size={11} className="text-cyan-400 shrink-0" />
                  <span>AI will pilot simultaneously on shared lunar terrain in split screen!</span>
                </div>
              </div>
            )}

            {gameMode === 'DUEL' && (
              <div className="lg:col-span-6 bg-black/80 border-2 border-amber-700 p-4 rounded-none space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="text-[8.5px] font-bold text-amber-400 font-mono uppercase flex items-center gap-1.5">
                    <Users size={13} />
                    <span>PLAYER 2 (ARROW KEYS)</span>
                  </span>
                  <span className="text-[7px] text-zinc-500 font-mono">CALLSIGN & LIVERY</span>
                </div>

                <div>
                  <label className="text-[7.5px] uppercase font-mono text-amber-400 font-bold block mb-1">
                    P2 CALLSIGN:
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
                    className="w-full bg-zinc-950 border-2 border-amber-600 px-3 py-1.5 text-amber-300 text-[10px] font-bold tracking-widest focus:outline-none focus:border-amber-400 rounded-none mb-2"
                  />
                </div>

                <div>
                  <span className="text-[7.5px] uppercase font-mono text-amber-400 font-bold block mb-1.5">
                    P2 HULL LIVERY:
                  </span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {shipThemes.map((theme) => {
                      const isSelected = p2Theme.id === theme.id;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => {
                            setP2Theme(theme);
                            gameAudio.playCrispClick();
                          }}
                          className={`p-1.5 border text-center transition flex flex-col items-center gap-1 ${
                            isSelected ? 'border-white bg-zinc-900 scale-105' : 'border-zinc-800 bg-zinc-950 opacity-60'
                          }`}>
                          <div className="w-5 h-5 border border-black" style={{ backgroundColor: theme.color }} />
                          <span className="text-[6px] font-mono truncate w-full" style={{ color: theme.color }}>
                            {theme.name.split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* P2 Craft Visual Preview Bay */}
                <div className="bg-zinc-950 border border-zinc-800 p-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-10 bg-black border border-zinc-800 flex items-center justify-center">
                      <div
                        className="absolute bottom-1 w-3 h-4 rounded-full blur-[2px] animate-pulse"
                        style={{ backgroundColor: p2Theme.color }}
                      />
                      {assets['lander'] ? (
                        <img src={assets['lander'].src} alt="P2 Lander" className="w-8 h-7 object-contain relative z-10" />
                      ) : (
                        <div className="w-6 h-5 bg-white rounded-sm" />
                      )}
                    </div>
                    <div>
                      <span className="text-[7.5px] font-bold block" style={{ color: p2Theme.color }}>
                        {p2Theme.name}
                      </span>
                      <span className="text-[6.5px] font-mono text-zinc-500 block">
                        CO-PILOT REACTION CONTROL // HYDRAULIC STRUTS
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[6.5px] text-zinc-500 font-mono block">STARTING FUEL</span>
                    <span className="text-[8.5px] text-amber-400 font-mono font-bold block">
                      {selectedLevelConfig.fuelCapacity}L
                    </span>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Navigation Bar */}
          <div className="flex items-center justify-between pt-3 border-t-2 border-emerald-800/80">
            <button
              type="button"
              onClick={() => {
                setMainMenuScreen('FLOW_MODE');
                gameAudio.playCrispClick();
              }}
              className="px-4 py-2 bg-black hover:bg-zinc-800 border-2 border-zinc-700 text-zinc-300 hover:text-white font-bold text-[9px] uppercase transition flex items-center gap-1.5">
              <ChevronLeft size={14} />
              <span>BACK TO MODE SELECT</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMainMenuScreen('FLOW_LEVEL');
                gameAudio.playCrispClick();
              }}
              className="px-6 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-black font-black text-xs uppercase transition shadow-[3px_3px_0_0_#064e3b] flex items-center gap-2">
              <span>CONTINUE TO LEVEL SELECTION</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </MenuOverlay>
    );
  }

  // =========================================================================
  // 5. START FLOW - STEP 4: MAP & RETROGRESSION SELECTION (10 Progressive Maps)
  // Clean Map Selector + Interactive 10-Step Retrogression Flow Map
  // =========================================================================
  if (gameState.status === 'START' && mainMenuScreen === 'FLOW_LEVEL') {
    const planetLevels = LEVELS_BY_PLANET[selectedPlanet] || LEVELS_BY_PLANET.moon;
    const currentRetrogressionStep = RETROGRESSION_STEPS[selectedStartingEpoch - 1] || RETROGRESSION_STEPS[0];

    return (
      <MenuOverlay tone="neutral" zIndex={40} fullScreen maxWidthClass="w-full max-w-6xl">
        <div className="w-full bg-[#08080c]/95 backdrop-blur-md border-4 border-emerald-500 p-4 md:p-6 shadow-[12px_12px_0px_0px_#064e3b] flex flex-col text-emerald-400 rounded-none relative">
          
          {/* Header with Step Indicator & Quick Planet Selector */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 mb-3 border-b-2 border-emerald-800/80">
            <div className="flex items-center gap-2.5">
              <Compass size={22} className="text-emerald-400 animate-pulse" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-xl font-black tracking-wider uppercase text-emerald-400">
                    SELECT DESCENT SECTOR // {currentPlanetDef.name}
                  </h2>
                  <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 border uppercase" style={{ borderColor: currentPlanetDef.accentColor, color: currentPlanetDef.accentColor }}>
                    {currentPlanetDef.gravity} PX/S²
                  </span>
                </div>
                <span className="text-[7.5px] font-mono text-zinc-400 uppercase tracking-widest block mt-0.5">
                  START FLOW // STEP 4 OF 4 • {currentPlanetDef.subname} • 10 MAPS WITH PROGRESSIVE AVIONICS RETROGRESSION
                </span>
              </div>
            </div>

            {/* Quick Planet Switcher Pills */}
            <div className="flex items-center gap-1.5 font-mono text-[7.5px]">
              {PLANETS.map((p) => {
                const isCurrent = selectedPlanet === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedPlanet(p.id);
                      gameAudio.playCrispClick();
                    }}
                    className={`px-2 py-1 border transition flex items-center gap-1 font-bold uppercase ${
                      isCurrent
                        ? 'bg-zinc-900 border-emerald-400 text-white shadow-[2px_2px_0_0_#10b981]'
                        : 'bg-black/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                    style={{
                      borderColor: isCurrent ? p.accentColor : undefined,
                      color: isCurrent ? p.accentColor : undefined,
                    }}>
                    <span>{p.icon}</span>
                    <span>{p.name.replace('THE ', '')}</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  setMainMenuScreen('FLOW_CUSTOMIZE');
                  gameAudio.playCrispClick();
                }}
                className="bg-black hover:bg-zinc-800 border-2 border-zinc-700 hover:border-emerald-400 text-zinc-300 hover:text-white px-2.5 py-1 text-[8px] font-bold flex items-center gap-1 uppercase transition ml-1">
                <ChevronLeft size={12} />
                <span>BACK</span>
              </button>
            </div>
          </div>

          {/* INTERACTIVE 10-STEP RETROGRESSION FLOW MAP */}
          <div className="bg-black/90 border-2 border-emerald-800/80 p-2.5 mb-3 rounded-none font-mono">
            <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2 pb-1.5 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <Radio size={13} className="text-emerald-400 animate-pulse" />
                <span className="text-[8px] font-bold text-emerald-300 uppercase tracking-wider">
                  RETROGRESSION SEQUENCE PIPELINE (LEVELS 01 → 10)
                </span>
              </div>
              <span className="text-[6.5px] text-zinc-400 uppercase">
                CLICK ANY STEP TO SET STARTING LEVEL • AVIONICS DEGRADE EACH LEVEL
              </span>
            </div>

            {/* 10 Pipeline Nodes Matching Levels 1..10 */}
            <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-1.5 mb-2">
              {RETROGRESSION_STEPS.map((step) => {
                const isSelected = selectedStartingEpoch === step.level;
                return (
                  <button
                    key={step.level}
                    type="button"
                    onClick={() => {
                      setSelectedStartingEpoch(step.level);
                      gameAudio.playCrispClick();
                    }}
                    className={`p-1.5 border text-left flex flex-col justify-between transition cursor-pointer rounded-none relative ${
                      isSelected
                        ? 'bg-zinc-900 border-2 shadow-[2px_2px_0_0_#10b981]'
                        : 'bg-black/85 border-zinc-800 hover:border-zinc-700'
                    }`}
                    style={{
                      borderColor: isSelected ? step.color : undefined,
                      boxShadow: isSelected ? `2px 2px 0 0 ${step.color}` : undefined,
                    }}>
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[7.5px] font-black" style={{ color: step.color }}>
                          L{step.level.toString().padStart(2, '0')}
                        </span>
                        <span className="text-[8.5px]">{step.icon}</span>
                      </div>
                      <span className="text-[6.5px] font-bold text-zinc-200 block truncate leading-tight uppercase">
                        {step.shortBadge}
                      </span>
                    </div>

                    <div className="mt-1 pt-1 border-t border-zinc-800/80 text-[6px] text-zinc-400 flex items-center justify-between">
                      <span>{step.fuelCapacity}L</span>
                      {isSelected ? (
                        <span className="font-bold text-[6px]" style={{ color: step.color }}>ACTIVE</span>
                      ) : (
                        <span className="text-zinc-500 text-[6px]">{step.windSpeed}w</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Retrogression Step Detail Strip */}
            {currentRetrogressionStep && (
              <div
                className="p-2 border text-[7px] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                style={{
                  backgroundColor: `${currentRetrogressionStep.color}14`,
                  borderColor: `${currentRetrogressionStep.color}70`,
                }}>
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{currentRetrogressionStep.icon}</span>
                  <div>
                    <span className="font-bold uppercase tracking-wider block" style={{ color: currentRetrogressionStep.color }}>
                      LEVEL {currentRetrogressionStep.level}: {currentRetrogressionStep.title} [{currentRetrogressionStep.stageName}]
                    </span>
                    <span className="text-zinc-300 block">
                      DEGRADED: {currentRetrogressionStep.decommissioned.join(' • ')}
                    </span>
                  </div>
                </div>
                <div className="text-right sm:max-w-xs shrink-0">
                  <span className="text-zinc-300 italic block">
                    "{currentRetrogressionStep.pilotWarning}"
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 10 Map Cards Grid (5x2) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
            {planetLevels.map((level) => {
              const isSelected = selectedStartingEpoch === level.id;
              return (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => {
                    setSelectedStartingEpoch(level.id);
                    gameAudio.playCrispClick();
                  }}
                  className={`p-2 text-left border-2 transition rounded-none relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-zinc-900 border-emerald-400 shadow-[3px_3px_0_0_#10b981]'
                      : 'bg-black/80 border-zinc-800 hover:border-zinc-600'
                  }`}
                  style={{
                    borderColor: isSelected ? level.themeColor : undefined,
                    boxShadow: isSelected ? `3px 3px 0 0 ${level.themeColor}` : undefined,
                  }}>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[8.5px] font-black uppercase" style={{ color: level.themeColor }}>
                        MAP {level.id.toString().padStart(2, '0')}
                      </span>
                      {isSelected ? (
                        <Check size={12} style={{ color: level.themeColor }} />
                      ) : (
                        <span className="text-[6px] font-mono px-1 py-0.2 bg-zinc-950 border border-zinc-800 text-zinc-400">
                          {level.retrogressionShort}
                        </span>
                      )}
                    </div>
                    <span className="text-[7.5px] font-bold text-zinc-200 block truncate uppercase leading-tight">
                      {level.name}
                    </span>
                    <span className="text-[6px] font-mono text-zinc-400 block truncate mt-0.5">
                      {level.mapType}
                    </span>
                  </div>

                  <div className="mt-2 pt-1 border-t border-zinc-800/80 text-[6px] font-mono flex items-center justify-between text-zinc-400">
                    <span>FUEL: {level.fuelCapacity}L</span>
                    <span style={{ color: level.themeColor }}>{level.retrogressionShort}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Clean Selected Map Briefing Panel */}
          <div className="bg-black/90 border-2 border-zinc-800 p-3 mb-3 rounded-none grid grid-cols-1 md:grid-cols-12 gap-3 font-mono">
            {/* Left: Map Title, Terrain & Retrogression Status */}
            <div className="md:col-span-7 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black uppercase text-emerald-400" style={{ color: selectedLevelConfig.themeColor }}>
                  MAP {selectedLevelConfig.id}: {selectedLevelConfig.name}
                </span>
                <span className="text-[7px] px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 text-zinc-300">
                  {selectedLevelConfig.mapType}
                </span>
              </div>

              <p className="text-[7.5px] text-zinc-300 leading-relaxed">
                {selectedLevelConfig.description}
              </p>

              {/* Retrogression Status Banner */}
              <div
                className="p-1.5 border text-[7px] flex flex-col gap-0.5 rounded-none"
                style={{
                  backgroundColor: `${selectedLevelConfig.themeColor}15`,
                  borderColor: `${selectedLevelConfig.themeColor}80`,
                }}>
                <span className="font-bold uppercase tracking-wider" style={{ color: selectedLevelConfig.themeColor }}>
                  RETROGRESSION STATUS: {selectedLevelConfig.era}
                </span>
                <div className="flex flex-wrap gap-1.5 text-zinc-300 text-[6.5px]">
                  {selectedLevelConfig.degradedAvionics.map((item, i) => (
                    <span key={i} className="text-zinc-200">
                      • {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Flight Conditions & Target Platforms */}
            <div className="md:col-span-5 space-y-1.5 border-t md:border-t-0 md:border-l border-zinc-800 md:pl-3 pt-2 md:pt-0">
              <div className="flex items-center justify-between text-[7px] text-zinc-400">
                <span>START FUEL: <strong className="text-emerald-400">{selectedLevelConfig.fuelCapacity}L</strong></span>
                <span>WIND: <strong className="text-cyan-300">{selectedLevelConfig.windSpeed} PX/S</strong></span>
                <span>HAZARDS: <strong className="text-amber-400">{selectedLevelConfig.hazardCount}</strong></span>
              </div>

              <div>
                <span className="text-[6.5px] font-bold text-zinc-400 uppercase block mb-1">
                  LANDING PADS ON THIS MAP:
                </span>
                <div className="grid grid-cols-2 gap-1">
                  {selectedLevelConfig.pads.map((pad) => (
                    <div key={pad.code} className="bg-zinc-950 border border-zinc-800 p-1 flex items-center justify-between">
                      <span className="text-[7px] font-bold" style={{ color: pad.color }}>
                        {pad.code} [{pad.multiplier}x]
                      </span>
                      <span className="text-[6px] text-zinc-400 font-mono">
                        {pad.w}px wide
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Bar & Giant Launch Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t-2 border-emerald-800/80">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setMainMenuScreen('FLOW_CUSTOMIZE');
                  gameAudio.playCrispClick();
                }}
                className="flex-1 sm:flex-initial px-3.5 py-2 bg-black hover:bg-zinc-800 border-2 border-zinc-700 text-zinc-300 hover:text-white font-bold text-[8.5px] uppercase transition flex items-center justify-center gap-1.5">
                <ChevronLeft size={13} />
                <span>BACK TO CRAFT</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMainMenuScreen('FLOW_PLANET');
                  gameAudio.playCrispClick();
                }}
                className="flex-1 sm:flex-initial px-3.5 py-2 bg-black hover:bg-zinc-800 border-2 border-zinc-700 text-zinc-300 hover:text-white font-bold text-[8.5px] uppercase transition flex items-center justify-center gap-1.5">
                <span>CHANGE PLANET</span>
              </button>
            </div>

            <button
              type="button"
              autoFocus
              onClick={onStartGame}
              className="w-full sm:flex-1 max-w-lg bg-emerald-400 hover:bg-emerald-300 text-black border-4 border-emerald-200 font-black text-xs md:text-sm py-2.5 px-5 shadow-[0_0_20px_rgba(16,185,129,0.5)] active:translate-x-0.5 active:translate-y-0.5 transition flex items-center justify-center gap-2 uppercase rounded-none cursor-pointer">
              <Play size={16} fill="currentColor" />
              <span>
                {gameMode === 'AI_DUEL'
                  ? `LAUNCH AI DUEL ON ${currentPlanetDef.name} // MAP ${selectedStartingEpoch}`
                  : gameMode === 'DUEL'
                  ? `LAUNCH 2P DUEL ON ${currentPlanetDef.name} // MAP ${selectedStartingEpoch}`
                  : `LAUNCH DESCENT ON ${currentPlanetDef.name} // MAP ${selectedStartingEpoch}`}
              </span>
            </button>
          </div>
        </div>
      </MenuOverlay>
    );
  }

  // =========================================================================
  // 6. SETTINGS SCREEN
  // Audio, Display, and Customizable Keyboard Controls for Both Players + BACK BUTTON
  // =========================================================================
  if (mainMenuScreen === 'SETTINGS') {
    const handleRebindClick = (action: keyof KeyBindings) => {
      setRebindingAction(action);
      gameAudio.playCrispClick();
    };

    return (
      <MenuOverlay tone="neutral" zIndex={60} fullScreen maxWidthClass="w-full max-w-5xl">
        <div className="w-full bg-[#08080c]/95 backdrop-blur-md border-4 border-emerald-500 p-5 md:p-7 shadow-[12px_12px_0px_0px_#064e3b] flex flex-col text-emerald-400 rounded-none relative">
          
          {/* Header with Back Button */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-emerald-800/80">
            <div className="flex items-center gap-2">
              <Sliders size={20} className="text-emerald-400" />
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-wider uppercase text-emerald-400">
                  AVIONICS & SYSTEM SETTINGS
                </h2>
                <span className="text-[7.5px] font-mono text-zinc-400 uppercase tracking-widest block">
                  AUDIO • DISPLAY • CUSTOMIZABLE DUAL-PLAYER CONTROLS
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (previousScreen === 'PAUSE') {
                  setIsMenuOpen(true);
                }
                setMainMenuScreen('TITLE');
                gameAudio.playCrispClick();
              }}
              className="bg-black hover:bg-zinc-800 border-2 border-zinc-700 hover:border-emerald-400 text-zinc-300 hover:text-white px-3 py-1.5 text-[8.5px] font-bold flex items-center gap-1.5 uppercase transition">
              <ChevronLeft size={13} />
              <span>{previousScreen === 'PAUSE' ? 'BACK TO PAUSE MENU' : 'BACK TO TITLE'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5 max-h-[60vh] overflow-y-auto pr-1">
            
            {/* AUDIO & DISPLAY */}
            <div className="space-y-4">
              <div className="bg-black/80 border-2 border-zinc-800 p-3.5 rounded-none space-y-3 font-mono">
                <span className="text-[8.5px] font-bold text-emerald-400 uppercase block pb-1 border-b border-zinc-800 flex items-center gap-1.5">
                  <Volume2 size={13} />
                  <span>AUDIO FREQUENCIES:</span>
                </span>

                <div className="flex items-center justify-between">
                  <span className="text-[8px] text-zinc-300">SFX PROCEDURAL SOUNDS:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newMuted = gameAudio.toggleMute();
                      setIsSfxMuted(newMuted);
                    }}
                    className={`px-3 py-1 text-[8px] font-bold border transition ${
                      isSfxMuted ? 'bg-red-950 border-red-700 text-red-300' : 'bg-emerald-950 border-emerald-500 text-emerald-300'
                    }`}>
                    {isSfxMuted ? 'MUTED' : 'ACTIVE'}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[8px] text-zinc-300">TELEMETRY BACKGROUND MUSIC:</span>
                  <button
                    type="button"
                    onClick={() => setIsMusicMuted((prev) => !prev)}
                    className={`px-3 py-1 text-[8px] font-bold border transition ${
                      isMusicMuted ? 'bg-red-950 border-red-700 text-red-300' : 'bg-emerald-950 border-emerald-500 text-emerald-300'
                    }`}>
                    {isMusicMuted ? 'MUTED' : 'ACTIVE'}
                  </button>
                </div>
              </div>

              <div className="bg-black/80 border-2 border-zinc-800 p-3.5 rounded-none space-y-3 font-mono">
                <span className="text-[8.5px] font-bold text-emerald-400 uppercase block pb-1 border-b border-zinc-800 flex items-center gap-1.5">
                  <Maximize2 size={13} />
                  <span>DISPLAY & ACCESSIBILITY:</span>
                </span>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[8px] text-zinc-300 block">FULLSCREEN MODE:</span>
                    <span className="text-[6.5px] text-zinc-500 block">Expand viewport to edge of screen</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      toggleFullscreen();
                      gameAudio.playCrispClick();
                    }}
                    className="px-3 py-1 bg-black hover:bg-emerald-400 hover:text-black border border-emerald-500 text-emerald-400 text-[8px] font-bold transition">
                    {isFullscreen ? 'EXIT FULLSCREEN' : 'GO FULLSCREEN'}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[8px] text-zinc-300 block">RESTORE ASTRONAUT ROSTER:</span>
                    <span className="text-[6.5px] text-zinc-500 block">Reset persistent scores to authentic records</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const restored = resetLeaderboardToSeeds();
                      setLeaderboardList(restored);
                      gameAudio.playConfirmSelect();
                    }}
                    className="px-2.5 py-1 bg-black hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white text-[7.5px] font-bold transition">
                    RESET RECORDS
                  </button>
                </div>
              </div>
            </div>

            {/* CUSTOMIZABLE KEYBOARD CONTROLS FOR BOTH PLAYERS */}
            <div className="bg-black/80 border-2 border-zinc-800 p-3.5 rounded-none space-y-3 font-mono">
              <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
                <span className="text-[8.5px] font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                  <Keyboard size={13} />
                  <span>CUSTOMIZABLE KEYBOARD CONTROLS:</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const restored = resetKeybindings();
                    setKeyBindings(restored);
                    gameAudio.playConfirmSelect();
                  }}
                  className="text-[6.5px] text-zinc-400 hover:text-white underline">
                  [RESTORE DEFAULTS]
                </button>
              </div>

              {rebindingAction && (
                <div className="p-2 bg-yellow-950/80 border-2 border-yellow-400 text-yellow-300 text-[8px] text-center font-bold animate-pulse">
                  PRESS ANY KEY ON YOUR KEYBOARD TO BIND...
                </div>
              )}

              {/* Player 1 Controls */}
              <div className="space-y-1.5">
                <span className="text-[7.5px] font-bold text-emerald-400 block uppercase">
                  PLAYER 1 CONTROLS (SOLO & DUEL P1):
                </span>
                
                <div className="grid grid-cols-2 gap-2 text-[7.5px]">
                  <div className="flex items-center justify-between p-1.5 bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-400">THRUST:</span>
                    <button
                      type="button"
                      onClick={() => handleRebindClick('p1Thrust')}
                      className={`px-2 py-0.5 border text-[7.5px] font-bold ${
                        rebindingAction === 'p1Thrust'
                          ? 'bg-yellow-400 text-black border-yellow-300 animate-pulse'
                          : 'bg-black text-emerald-300 border-emerald-500 hover:bg-emerald-950'
                      }`}>
                      {rebindingAction === 'p1Thrust' ? 'PRESS...' : formatKeyDisplay(keyBindings.p1Thrust)}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-1.5 bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-400">STEER LEFT:</span>
                    <button
                      type="button"
                      onClick={() => handleRebindClick('p1Left')}
                      className={`px-2 py-0.5 border text-[7.5px] font-bold ${
                        rebindingAction === 'p1Left'
                          ? 'bg-yellow-400 text-black border-yellow-300 animate-pulse'
                          : 'bg-black text-emerald-300 border-emerald-500 hover:bg-emerald-950'
                      }`}>
                      {rebindingAction === 'p1Left' ? 'PRESS...' : formatKeyDisplay(keyBindings.p1Left)}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-1.5 bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-400">STEER RIGHT:</span>
                    <button
                      type="button"
                      onClick={() => handleRebindClick('p1Right')}
                      className={`px-2 py-0.5 border text-[7.5px] font-bold ${
                        rebindingAction === 'p1Right'
                          ? 'bg-yellow-400 text-black border-yellow-300 animate-pulse'
                          : 'bg-black text-emerald-300 border-emerald-500 hover:bg-emerald-950'
                      }`}>
                      {rebindingAction === 'p1Right' ? 'PRESS...' : formatKeyDisplay(keyBindings.p1Right)}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-1.5 bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-400">QUICK RESET:</span>
                    <button
                      type="button"
                      onClick={() => handleRebindClick('p1Reset')}
                      className={`px-2 py-0.5 border text-[7.5px] font-bold ${
                        rebindingAction === 'p1Reset'
                          ? 'bg-yellow-400 text-black border-yellow-300 animate-pulse'
                          : 'bg-black text-emerald-300 border-emerald-500 hover:bg-emerald-950'
                      }`}>
                      {rebindingAction === 'p1Reset' ? 'PRESS...' : formatKeyDisplay(keyBindings.p1Reset)}
                    </button>
                  </div>
                </div>
              </div>

              {/* Player 2 Controls */}
              <div className="space-y-1.5 pt-2 border-t border-zinc-800">
                <span className="text-[7.5px] font-bold text-amber-400 block uppercase">
                  PLAYER 2 CONTROLS (2P DUEL):
                </span>

                <div className="grid grid-cols-2 gap-2 text-[7.5px]">
                  <div className="flex items-center justify-between p-1.5 bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-400">THRUST:</span>
                    <button
                      type="button"
                      onClick={() => handleRebindClick('p2Thrust')}
                      className={`px-2 py-0.5 border text-[7.5px] font-bold ${
                        rebindingAction === 'p2Thrust'
                          ? 'bg-yellow-400 text-black border-yellow-300 animate-pulse'
                          : 'bg-black text-amber-300 border-amber-500 hover:bg-amber-950'
                      }`}>
                      {rebindingAction === 'p2Thrust' ? 'PRESS...' : formatKeyDisplay(keyBindings.p2Thrust)}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-1.5 bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-400">STEER LEFT:</span>
                    <button
                      type="button"
                      onClick={() => handleRebindClick('p2Left')}
                      className={`px-2 py-0.5 border text-[7.5px] font-bold ${
                        rebindingAction === 'p2Left'
                          ? 'bg-yellow-400 text-black border-yellow-300 animate-pulse'
                          : 'bg-black text-amber-300 border-amber-500 hover:bg-amber-950'
                      }`}>
                      {rebindingAction === 'p2Left' ? 'PRESS...' : formatKeyDisplay(keyBindings.p2Left)}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-1.5 bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-400">STEER RIGHT:</span>
                    <button
                      type="button"
                      onClick={() => handleRebindClick('p2Right')}
                      className={`px-2 py-0.5 border text-[7.5px] font-bold ${
                        rebindingAction === 'p2Right'
                          ? 'bg-yellow-400 text-black border-yellow-300 animate-pulse'
                          : 'bg-black text-amber-300 border-amber-500 hover:bg-amber-950'
                      }`}>
                      {rebindingAction === 'p2Right' ? 'PRESS...' : formatKeyDisplay(keyBindings.p2Right)}
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Navigation Bar */}
          <div className="flex items-center justify-between pt-3 border-t-2 border-emerald-800/80">
            <button
              type="button"
              onClick={() => {
                if (previousScreen === 'PAUSE') {
                  setIsMenuOpen(true);
                }
                setMainMenuScreen('TITLE');
                gameAudio.playCrispClick();
              }}
              className="px-4 py-2 bg-black hover:bg-zinc-800 border-2 border-zinc-700 text-zinc-300 hover:text-white font-bold text-[9px] uppercase transition flex items-center gap-1.5">
              <ChevronLeft size={14} />
              <span>{previousScreen === 'PAUSE' ? 'BACK TO PAUSE MENU' : 'BACK TO TITLE'}</span>
            </button>
          </div>
        </div>
      </MenuOverlay>
    );
  }

  // =========================================================================
  // 6. LEADERBOARD SCREEN
  // Real Persistent Scores + NASA Apollo Seeds + Mode Filter Tabs + BACK BUTTON
  // =========================================================================
  if (mainMenuScreen === 'LEADERBOARD') {
    return (
      <MenuOverlay tone="neutral" zIndex={60} fullScreen maxWidthClass="w-full max-w-5xl">
        <div className="w-full bg-[#08080c]/95 backdrop-blur-md border-4 border-yellow-500 p-5 md:p-7 shadow-[12px_12px_0px_0px_#78350f] flex flex-col text-yellow-400 rounded-none relative">
          
          {/* Header with Back Button */}
          <div className="flex items-center justify-between w-full mb-3 pb-2 border-b-2 border-zinc-800">
            <div className="flex items-center gap-2">
              <Trophy size={20} className="text-yellow-400" />
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-wider uppercase text-yellow-400">
                  MISSION ARCHIVE & LEADERBOARD
                </h2>
                <span className="text-[7.5px] font-mono text-zinc-400 uppercase tracking-widest block">
                  AUTHENTIC APOLLO MISSIONS & LOCAL EXPEDITIONS
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (previousScreen === 'PAUSE') {
                  setIsMenuOpen(true);
                }
                setMainMenuScreen('TITLE');
                gameAudio.playCrispClick();
              }}
              className="bg-black hover:bg-zinc-800 border-2 border-zinc-700 hover:border-yellow-400 text-zinc-300 hover:text-white px-3 py-1.5 text-[8.5px] font-bold flex items-center gap-1.5 uppercase transition">
              <ChevronLeft size={13} />
              <span>{previousScreen === 'PAUSE' ? 'BACK TO PAUSE MENU' : 'BACK TO TITLE'}</span>
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mb-3 text-[8px] font-mono">
            <span className="text-zinc-500">FILTER:</span>
            {(['ALL', 'SOLO', 'AI_DUEL', 'DUEL'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setLeaderboardFilter(mode);
                  gameAudio.playCrispClick();
                }}
                className={`px-2.5 py-1 border transition ${
                  leaderboardFilter === mode
                    ? 'bg-yellow-400 text-black border-yellow-300 font-bold'
                    : 'bg-black text-zinc-400 border-zinc-800 hover:text-white'
                }`}>
                {mode === 'ALL' ? 'ALL MISSIONS' : mode === 'SOLO' ? 'SOLO FLIGHT' : mode === 'AI_DUEL' ? 'PLAY AGAINST AI' : '2P DUEL'}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="w-full overflow-y-auto max-h-[50vh] border-2 border-zinc-800 bg-black mb-3">
            <table className="w-full text-left text-[8px] font-mono border-collapse">
              <thead>
                <tr className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                  <th className="p-2">#</th>
                  <th className="p-2">PILOT</th>
                  <th className="p-2">SCORE</th>
                  <th className="p-2">LEVEL REACHED</th>
                  <th className="p-2">PAD</th>
                  <th className="p-2">MODE</th>
                  <th className="p-2">DATE</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaderboard.map((entry, idx) => {
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
                        {isUserCurrent && <span className="ml-1 text-[7px] text-emerald-400">[YOU]</span>}
                      </td>
                      <td className={`p-2 font-bold ${isTop3 ? 'text-yellow-400' : 'text-zinc-200'}`}>
                        {entry.score.toLocaleString()}
                      </td>
                      <td className="p-2">
                        LEVEL {entry.epoch}
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

          {/* Footer Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-[8px]">
            <button
              onClick={() => {
                const restored = resetLeaderboardToSeeds();
                setLeaderboardList(restored);
                gameAudio.playCrispClick();
              }}
              className="bg-black hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white px-3 py-1.5 uppercase font-bold transition">
              RESTORE ASTRONAUT ROSTER
            </button>

            <button
              onClick={() => {
                if (previousScreen === 'PAUSE') {
                  setIsMenuOpen(true);
                }
                setMainMenuScreen('TITLE');
                gameAudio.playCrispClick();
              }}
              className="px-4 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-black font-bold uppercase transition shadow-[2px_2px_0_0_#78350f]">
              <span>CLOSE ARCHIVE</span>
            </button>
          </div>
        </div>
      </MenuOverlay>
    );
  }

  // =========================================================================
  // 7. FLIGHT MANUAL / HOW TO PLAY
  // Physics, Landing Tolerances, Retrogression Rules + BACK BUTTON
  // =========================================================================
  if (mainMenuScreen === 'HOW_TO_PLAY') {
    return (
      <MenuOverlay tone="neutral" zIndex={60} fullScreen maxWidthClass="w-full max-w-5xl">
        <div className="w-full bg-[#08080c]/95 backdrop-blur-md border-4 border-emerald-500 p-5 md:p-7 shadow-[12px_12px_0px_0px_#064e3b] flex flex-col text-emerald-400 rounded-none relative">
          
          {/* Header with Back Button */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-emerald-800/80">
            <div className="flex items-center gap-2">
              <HelpCircle size={20} className="text-emerald-400" />
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-wider uppercase text-emerald-400">
                  AVIONICS FLIGHT MANUAL & RETROGRESSION LORE
                </h2>
                <span className="text-[7.5px] font-mono text-zinc-400 uppercase tracking-widest block">
                  SYSTEM OVERVIEW // 10 LEVELS OF INSTRUMENT DEGRADATION
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (previousScreen === 'PAUSE') {
                  setIsMenuOpen(true);
                }
                setMainMenuScreen('TITLE');
                gameAudio.playCrispClick();
              }}
              className="bg-black hover:bg-zinc-800 border-2 border-zinc-700 hover:border-emerald-400 text-zinc-300 hover:text-white px-3 py-1.5 text-[8.5px] font-bold flex items-center gap-1.5 uppercase transition">
              <ChevronLeft size={13} />
              <span>{previousScreen === 'PAUSE' ? 'BACK TO PAUSE MENU' : 'BACK TO TITLE'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[8.5px] font-mono text-zinc-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
            <div className="bg-black p-3.5 border-2 border-emerald-900 rounded-none">
              <h3 className="font-bold text-emerald-400 mb-2 uppercase flex items-center gap-1.5">
                <Zap size={13} />
                <span>Flight Controls & Modes</span>
              </h3>
              <p className="mb-1.5">
                • <strong>Solo Flight:</strong> Pilot solo using customizable keys or W (Thrust), A & D (RCS Steer).
              </p>
              <p className="mb-1.5">
                • <strong>Play Against AI:</strong> Compete in real time against an intelligent AI bot in split screen!
              </p>
              <p className="mb-1.5">
                • <strong>2P Duel Flight:</strong> Head-to-head local race. P1 (WASD) vs P2 (Arrows).
              </p>
              <p>
                • <strong>Controls can be fully remapped</strong> in the Settings menu at any time.
              </p>
            </div>

            <div className="bg-black p-3.5 border-2 border-cyan-900 rounded-none">
              <h3 className="font-bold text-cyan-400 mb-2 uppercase flex items-center gap-1.5">
                <Compass size={13} />
                <span>Landing Platforms & Multipliers</span>
              </h3>
              <p className="mb-1">
                • <strong>ALPHA (1.0x):</strong> Near spawn (~450m). Safe and wide plateau.
              </p>
              <p className="mb-1">
                • <strong>BRAVO (2.0x):</strong> Moderate distance (~1200m). Situated in crater gaps.
              </p>
              <p className="mb-1">
                • <strong>CHARLIE (3.5x):</strong> Long trek (~2000m) across basalt spires.
              </p>
              <p>
                • <strong>OMEGA (5.0x):</strong> Ultra-far abyss (~2800m). Massive 5x score reward!
              </p>
            </div>

            <div className="bg-black p-3.5 border-2 border-purple-900 rounded-none md:col-span-2">
              <h3 className="font-bold text-purple-400 mb-2 uppercase flex items-center gap-1.5">
                <Activity size={13} />
                <span>The 10-Level Retrogression Progression System</span>
              </h3>
              <p className="mb-2 text-zinc-300">
                Regardless of which celestial world you target (The Moon, Mars, or Venus), as you advance across
                the 10 levels, your lander's flight avionics progressively retrograde (decay) across 10 calibrated steps —
                stripping flight computers and assists until you must touch down blind in optical darkness using acoustic sonar chirps:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[7px]">
                {RETROGRESSION_STEPS.map((step) => (
                  <div key={step.level} className="p-1.5 bg-zinc-950 border border-zinc-800">
                    <span className="font-bold block" style={{ color: step.color }}>
                      L{step.level}: {step.shortBadge}
                    </span>
                    <span className="text-zinc-500 block text-[6px]">{step.stageName}</span>
                    <span className="text-zinc-400 block text-[6px] truncate">{step.decommissioned[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Bar */}
          <div className="flex items-center justify-between pt-3 border-t-2 border-emerald-800/80 mt-3">
            <button
              type="button"
              onClick={() => {
                if (previousScreen === 'PAUSE') {
                  setIsMenuOpen(true);
                }
                setMainMenuScreen('TITLE');
                gameAudio.playCrispClick();
              }}
              className="px-4 py-2 bg-black hover:bg-zinc-800 border-2 border-zinc-700 text-zinc-300 hover:text-white font-bold text-[9px] uppercase transition flex items-center gap-1.5">
              <ChevronLeft size={14} />
              <span>BACK</span>
            </button>
          </div>
        </div>
      </MenuOverlay>
    );
  }

  // =========================================================================
  // 8. IN-GAME PAUSE MENU
  // Resume, Settings, Leaderboard, Flight Manual, Restart, Abort + BACK BUTTON
  // =========================================================================
  if (isMenuOpen) {
    return (
      <MenuOverlay tone="neutral" zIndex={50} fullScreen maxWidthClass="w-full max-w-2xl">
        <div className="w-full bg-[#08080c]/95 backdrop-blur-md border-4 border-emerald-500 p-6 shadow-[12px_12px_0px_0px_#064e3b] flex flex-col text-emerald-400 rounded-none relative">
          
          <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-zinc-800">
            <h2 className="text-base font-bold flex items-center gap-2 uppercase">
              <Gauge size={18} />
              <span>FLIGHT PAUSE MENU</span>
            </h2>

            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                gameAudio.playCrispClick();
              }}
              className="p-1 hover:bg-emerald-400 hover:text-black border-2 border-zinc-700 text-zinc-400 rounded-none">
              <X size={16} />
            </button>
          </div>

          {/* Current Mission Telemetry Summary */}
          <div className="w-full bg-black/80 border-2 border-emerald-900 p-3 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[8px] font-mono">
            <div>
              <span className="text-zinc-500 block">PILOT:</span>
              <span className="font-bold text-emerald-300 truncate block">{pilotName}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">CURRENT LEVEL:</span>
              <span className="font-bold text-yellow-400 block truncate">
                L{gameState.level}: {activeLevelConfig.name}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block">MISSION SCORE:</span>
              <span className="font-bold text-emerald-400 block">{gameState.score} PTS</span>
            </div>
            <div>
              <span className="text-zinc-500 block">MODE:</span>
              <span className="font-bold text-cyan-300 block">{gameMode}</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {/* Resume Descent Button */}
            <button
              type="button"
              autoFocus
              onClick={() => {
                setIsMenuOpen(false);
                gameAudio.playCrispClick();
              }}
              className="w-full bg-emerald-400 hover:bg-emerald-300 text-black border-2 border-emerald-200 font-bold py-3 px-4 shadow-[3px_3px_0_0_#064e3b] active:translate-x-0.5 active:translate-y-0.5 transition flex items-center justify-center gap-2 uppercase rounded-none text-xs">
              <Play size={16} fill="currentColor" />
              <span>RESUME DESCENT</span>
            </button>

            {/* Settings & Keybindings */}
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                setPreviousScreen('PAUSE');
                setMainMenuScreen('SETTINGS');
                gameAudio.playCrispClick();
              }}
              className="w-full bg-black hover:bg-zinc-800 text-zinc-200 border-2 border-zinc-700 font-bold py-2.5 px-4 shadow-[2px_2px_0_0_#000] transition flex items-center justify-center gap-2 uppercase rounded-none text-[9px]">
              <Sliders size={14} className="text-cyan-400" />
              <span>SETTINGS & CUSTOM KEYBINDINGS</span>
            </button>

            {/* Scoreboard */}
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                setPreviousScreen('PAUSE');
                setMainMenuScreen('LEADERBOARD');
                gameAudio.playCrispClick();
              }}
              className="w-full bg-black hover:bg-zinc-800 text-yellow-400 border-2 border-yellow-600 font-bold py-2.5 px-4 shadow-[2px_2px_0_0_#78350f] transition flex items-center justify-center gap-2 uppercase rounded-none text-[9px]">
              <Trophy size={14} />
              <span>VIEW LEADERBOARD & FLIGHT LOG</span>
            </button>

            {/* Flight Manual */}
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                setPreviousScreen('PAUSE');
                setMainMenuScreen('HOW_TO_PLAY');
                gameAudio.playCrispClick();
              }}
              className="w-full bg-black hover:bg-zinc-800 border-2 border-zinc-700 text-white font-bold py-2.5 px-4 shadow-[2px_2px_0_0_#000] transition flex items-center justify-center gap-2 uppercase rounded-none text-[9px]">
              <HelpCircle size={14} className="text-purple-400" />
              <span>FLIGHT MANUAL & RETROGRESSION LORE</span>
            </button>

            {/* Restart Current Run */}
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onRestartLevel();
                gameAudio.playConfirmSelect();
              }}
              className="w-full bg-black hover:bg-zinc-800 border-2 border-zinc-700 text-white font-bold py-2.5 px-4 shadow-[2px_2px_0_0_#000] transition flex items-center justify-center gap-2 uppercase rounded-none text-[9px]">
              <RotateCw size={14} />
              <span>RESTART CURRENT RUN</span>
            </button>

            {/* Abort to Title Screen */}
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onAbortToTitle();
                gameAudio.playCrispClick();
              }}
              className="w-full bg-black hover:bg-red-950 border-2 border-red-800 text-red-300 font-bold py-2.5 px-4 shadow-[2px_2px_0_0_#000] transition flex items-center justify-center gap-2 uppercase rounded-none text-[9px]">
              <X size={14} />
              <span>ABORT TO TITLE SCREEN</span>
            </button>
          </div>

          <div className="pt-3 mt-3 border-t border-zinc-800 flex justify-between">
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                gameAudio.playCrispClick();
              }}
              className="px-3 py-1.5 bg-black border border-zinc-700 text-zinc-300 text-[8px] font-bold uppercase flex items-center gap-1">
              <ChevronLeft size={12} />
              <span>BACK TO DESCENT</span>
            </button>
          </div>
        </div>
      </MenuOverlay>
    );
  }

  // =========================================================================
  // 9. LEVEL COMPLETE (Touchdown Confirmed) OVERLAY
  // Displays score, stats, next level retrogression warnings, advance / retry / title
  // =========================================================================
  if (gameState.status === 'LEVEL_COMPLETE' && lastTouchdownStats) {
    const nextLevelNum = gameState.level;
    const nextLevelConfig = getLevel(selectedPlanet, nextLevelNum);

    return (
      <MenuOverlay tone="victory" zIndex={40} fullScreen maxWidthClass="w-full max-w-xl">
        <div className="w-full bg-[#08080c] border-4 border-emerald-500 p-5 md:p-6 shadow-[8px_8px_0px_0px_#064e3b] flex flex-col items-center text-emerald-400 rounded-none">
          <Award className="text-emerald-400 mb-2 animate-bounce" size={36} />
          <h2 className="text-base md:text-xl font-bold text-center mb-1 uppercase tracking-wide">
            {gameMode === 'AI_DUEL'
              ? lastTouchdownStats.isWinner
                ? 'VICTORY OVER AI BOT!'
                : `${lastTouchdownStats.pilotName} WINS DUEL!`
              : gameMode === 'DUEL'
              ? `${lastTouchdownStats.pilotName} WINS ROUND!`
              : 'TOUCHDOWN CONFIRMED'}
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
              <span className="text-zinc-500">Vertical Velocity:</span>
              <span className="font-bold text-emerald-300">
                {Math.round(lastTouchdownStats.vy)} PX/S
              </span>
            </div>
            <div className="flex justify-between border-t border-zinc-800 pt-1.5 text-xs font-bold">
              <span className="text-yellow-400">Total Points Awarded:</span>
              <span className="text-yellow-400">+{lastTouchdownStats.pointsAwarded}</span>
            </div>
          </div>

          {/* Technological Retrogression Warning for Next Level */}
          {gameMode === 'SOLO' && nextLevelNum <= 10 && (
            <div className="w-full bg-red-950/40 border-2 border-red-500/80 p-2.5 mb-3 text-left font-mono rounded-none">
              <div className="flex items-center gap-1.5 text-red-400 font-bold uppercase text-[8px] mb-1">
                <AlertTriangle size={13} className="animate-pulse text-red-400 shrink-0" />
                <span>
                  RETROGRESSION PROTOCOL: ADVANCING TO MAP {nextLevelNum} — {nextLevelConfig.name} ({nextLevelConfig.era})
                </span>
              </div>
              <p className="text-[7.5px] text-zinc-300 mb-1.5 leading-relaxed">
                Avionics are retrograding (decaying). New instrument failure on this map:
              </p>
              <div className="space-y-0.5 text-[7px]">
                {nextLevelConfig.degradedAvionics.map((degraded, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-yellow-300">
                    <span className="text-red-400 font-bold">►</span>
                    <span>{degraded}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="w-full space-y-2">
            <button
              autoFocus
              type="button"
              onClick={onAdvanceLevel}
              className="w-full bg-black hover:bg-emerald-400 text-emerald-400 hover:text-black border-4 border-emerald-400 font-bold py-3 px-6 shadow-[4px_4px_0_0_#064e3b] active:translate-x-0.5 active:translate-y-0.5 transition flex items-center justify-center gap-2 uppercase rounded-none text-xs">
              <Play size={16} fill="currentColor" />
              <span>
                {gameMode === 'SOLO'
                  ? `COMMENCE MAP ${nextLevelNum}: ${nextLevelConfig.name}`
                  : 'COMMENCE NEXT DUEL ROUND'}
              </span>
            </button>

            <div className="w-full flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setPreviousScreen('TITLE');
                  setMainMenuScreen('LEADERBOARD');
                  gameAudio.playCrispClick();
                }}
                className="flex-1 bg-black hover:bg-yellow-400 text-yellow-400 hover:text-black border-2 border-yellow-500 py-2 text-[9px] font-bold uppercase transition flex items-center justify-center gap-1.5">
                <Trophy size={13} />
                <span>VIEW SCOREBOARD</span>
              </button>

              <button
                type="button"
                onClick={onAbortToTitle}
                className="px-4 bg-black hover:bg-zinc-800 border-2 border-zinc-700 text-zinc-400 hover:text-white py-2 text-[9px] font-bold uppercase transition flex items-center justify-center gap-1">
                <ChevronLeft size={13} />
                <span>TITLE</span>
              </button>
            </div>
          </div>
        </div>
      </MenuOverlay>
    );
  }

  // =========================================================================
  // 10. GAME OVER OVERLAY
  // Displays failure reason, score, relaunch / scoreboard / title
  // =========================================================================
  if (gameState.status === 'GAME_OVER') {
    return (
      <MenuOverlay tone="danger" zIndex={40} fullScreen maxWidthClass="w-full max-w-xl">
        <div className="w-full bg-[#08080c] border-4 border-red-500 p-5 md:p-6 shadow-[8px_8px_0px_0px_#7f1d1d] flex flex-col items-center text-red-500 rounded-none">
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
            <span className="text-[8px] text-zinc-400 block mt-1 uppercase font-mono">
              {pilotName} // Concluded on Level {gameState.level} ({activeLevelConfig.name})
            </span>
          </div>

          <div className="w-full space-y-2">
            <button
              autoFocus
              type="button"
              onClick={onStartGame}
              className="w-full bg-black hover:bg-red-500 text-red-400 hover:text-black border-4 border-red-500 font-bold py-3 px-6 shadow-[4px_4px_0_0_#7f1d1d] active:translate-x-0.5 active:translate-y-0.5 transition flex items-center justify-center gap-2 uppercase rounded-none text-xs">
              <RotateCw size={16} />
              <span>RELAUNCH EXPEDITION</span>
            </button>

            <div className="w-full flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setPreviousScreen('TITLE');
                  setMainMenuScreen('LEADERBOARD');
                  gameAudio.playCrispClick();
                }}
                className="flex-1 bg-black hover:bg-yellow-400 text-yellow-400 hover:text-black border-2 border-yellow-500 py-2 text-[9px] font-bold uppercase transition flex items-center justify-center gap-1.5">
                <Trophy size={13} />
                <span>VIEW SCOREBOARD</span>
              </button>

              <button
                type="button"
                onClick={onAbortToTitle}
                className="px-4 bg-black hover:bg-zinc-800 border-2 border-zinc-700 text-zinc-400 hover:text-white py-2 text-[9px] font-bold uppercase transition flex items-center justify-center gap-1">
                <ChevronLeft size={13} />
                <span>TITLE</span>
              </button>
            </div>
          </div>
        </div>
      </MenuOverlay>
    );
  }

  // =========================================================================
  // 11. VICTORY OVERLAY
  // Conquered all 10 Levels of Retrogression!
  // =========================================================================
  if (gameState.status === 'VICTORY') {
    return (
      <MenuOverlay tone="victory" zIndex={40} fullScreen maxWidthClass="w-full max-w-xl">
        <div className="w-full bg-[#08080c] border-4 border-yellow-400 p-6 shadow-[8px_8px_0px_0px_#78350f] flex flex-col items-center text-center text-yellow-400 rounded-none">
          <Award className="text-yellow-400 mb-3 animate-bounce" size={44} />
          <h2 className="text-base md:text-2xl font-bold mb-1 uppercase tracking-wide">
            MASTER CELESTIAL PILOT
          </h2>
          <div className="text-[9px] text-cyan-400 uppercase tracking-widest font-bold mb-3">
            [ {pilotName} CONQUERED ALL 10 LEVELS ON {currentPlanetDef.name} ]
          </div>
          <p className="text-[10px] text-zinc-300 leading-relaxed mb-4 font-mono">
            You crossed hostile terrain on {currentPlanetDef.name}, adapted through 10 calibrated levels of
            avionics degradation, and conquered the final sensory blackout solely via acoustic sonar frequencies.
          </p>

          <div className="w-full bg-black border-2 border-yellow-800 p-3 mb-4 text-[9px] rounded-none font-mono">
            <span className="text-zinc-500 block mb-1">EXPEDITION GRAND TOTAL</span>
            <span className="text-2xl font-bold text-yellow-400">
              {gameState.score.toLocaleString()} PTS
            </span>
          </div>

          <div className="w-full space-y-2">
            <button
              autoFocus
              type="button"
              onClick={onStartGame}
              className="w-full bg-black hover:bg-yellow-400 text-yellow-400 hover:text-black border-4 border-yellow-400 font-bold py-3 px-6 shadow-[4px_4px_0_0_#78350f] active:translate-x-0.5 active:translate-y-0.5 transition flex items-center justify-center gap-2 uppercase rounded-none text-xs">
              <RotateCw size={16} />
              <span>COMMENCE NEW EXPEDITION</span>
            </button>

            <div className="w-full flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setPreviousScreen('TITLE');
                  setMainMenuScreen('LEADERBOARD');
                  gameAudio.playCrispClick();
                }}
                className="flex-1 bg-black hover:bg-yellow-400 text-yellow-400 hover:text-black border-2 border-yellow-500 py-2 text-[9px] font-bold uppercase transition flex items-center justify-center gap-1.5">
                <Trophy size={13} />
                <span>VIEW ON SCOREBOARD</span>
              </button>

              <button
                type="button"
                onClick={onAbortToTitle}
                className="px-4 bg-black hover:bg-zinc-800 border-2 border-zinc-700 text-zinc-400 hover:text-white py-2 text-[9px] font-bold uppercase transition flex items-center justify-center gap-1">
                <ChevronLeft size={13} />
                <span>TITLE</span>
              </button>
            </div>
          </div>
        </div>
      </MenuOverlay>
    );
  }

  return null;
}
