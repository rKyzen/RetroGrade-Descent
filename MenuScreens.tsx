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
  Coins,
  Compass,
  Crosshair,
  Flame,
  Gauge,
  HelpCircle,
  Keyboard,
  Lock,
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
  ShoppingBag,
  Sliders,
  Sparkles,
  Trophy,
  User,
  Users,
  Volume2,
  VolumeX,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import {
  CRAFTS,
  CraftDefinition,
  CraftUpgradeTier,
  getCraft,
  MAX_UPGRADE_TIER,
  getUpgradeCost,
  computeEffectiveStats,
  deductGradeCoins,
  setStoredOwnedCrafts,
  setStoredSelectedCraftId,
  setStoredCraftUpgrades,
} from './crafts';
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
  PlanetProgression,
  getPreviouslyDecommissioned,
  getNewlyDecommissioned,
  getActiveOperationalSystems,
  getAvionics,
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
  unlockedLevels: PlanetProgression;
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
  onStartGame: (startingLevel?: number) => void;
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
    gcEarned?: number;
    totalGradeCoins?: number;
    basePoints?: number;
    fuelBonus?: number;
    precisionBonus?: number;
    totalCumulativeScore?: number;
    completedLevelNum?: number;
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
  gradeCoins: number;
  setGradeCoins: (coins: number) => void;
  ownedCrafts: string[];
  setOwnedCrafts: (crafts: string[]) => void;
  selectedCraftId: string;
  setSelectedCraftId: (id: string) => void;
  craftUpgrades: Record<string, CraftUpgradeTier>;
  setCraftUpgrades: React.Dispatch<React.SetStateAction<Record<string, CraftUpgradeTier>>>;
}

export default function MenuScreens({
  mainMenuScreen,
  setMainMenuScreen,
  previousScreen,
  setPreviousScreen,
  selectedPlanet,
  setSelectedPlanet,
  unlockedLevels,
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
  gradeCoins,
  setGradeCoins,
  ownedCrafts,
  setOwnedCrafts,
  selectedCraftId,
  setSelectedCraftId,
  craftUpgrades,
  setCraftUpgrades,
}: MenuScreensProps) {
  const [leaderboardFilter, setLeaderboardFilter] = useState<'ALL' | 'SOLO' | 'AI_DUEL' | 'DUEL'>('ALL');
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);

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
      <div className="fixed inset-0 w-full h-full z-40 pointer-events-none flex flex-col justify-between overflow-hidden">
        {/* Left-to-right fade gradient overlay: solid dark command console on left, seamlessly dissolving into the live simulation on right */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#06080d] via-[#06080d]/90 via-50% to-transparent pointer-events-none" />

        {/* Top Header Bar */}
        <div className="relative z-10 w-full flex items-center justify-between px-6 py-4 border-b border-emerald-900/60 bg-[#06080d]/65 backdrop-blur-xs pointer-events-auto">
          <div className="flex items-center gap-2.5">
            <Radio size={16} className="text-emerald-400 animate-pulse" />
            <div>
              <span className="text-[8px] sm:text-[9.5px] text-emerald-400 font-mono font-bold uppercase tracking-widest block">
                APOLLO GUIDANCE OS // LUNAR INSERTION TERMINAL
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {leaderboardList && leaderboardList.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setPreviousScreen('TITLE');
                  setMainMenuScreen('LEADERBOARD');
                  gameAudio.playCrispClick();
                }}
                className="bg-yellow-950/40 hover:bg-yellow-900/60 border border-yellow-500/70 px-3 py-1.5 text-[8.5px] flex items-center gap-2 text-yellow-300 font-mono transition">
                <Trophy size={13} className="text-yellow-400" />
                <span>RECORD: <strong>{leaderboardList[0].pilotName}</strong> ({leaderboardList[0].score.toLocaleString()} PTS)</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                toggleFullscreen();
                gameAudio.playCrispClick();
              }}
              className="bg-black hover:bg-emerald-400 hover:text-black border border-emerald-500 px-3 py-1.5 text-[8.5px] flex items-center gap-1.5 font-mono font-bold transition">
              {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              <span>{isFullscreen ? 'EXIT FS' : 'FULLSCREEN'}</span>
            </button>
          </div>
        </div>

        {/* Main Body: Left half holds navigation console; Right half reveals live background simulation */}
        <div className="relative z-10 w-full flex-1 flex flex-col md:flex-row items-stretch justify-between p-6 sm:p-10 pointer-events-none">
          {/* Left Column: Styled Game Title & Three Primary Options */}
          <div className="w-full md:w-1/2 lg:w-5/12 xl:w-4/12 flex flex-col justify-between space-y-6 pointer-events-auto">
            <div>
              <div className="inline-block px-2.5 py-1 bg-emerald-950/80 border border-emerald-500/80 text-[7.5px] font-mono font-bold text-emerald-300 uppercase tracking-widest mb-3">
                PROJECT RETROGRADE // CAMPAIGN SIMULATOR
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-wider text-emerald-400 drop-shadow-[0_0_24px_rgba(16,185,129,0.55)] leading-none uppercase">
                RETROGRADE
              </h1>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-widest text-emerald-300/80 leading-tight uppercase mt-1">
                DESCENT
              </h2>
              <p className="text-[8px] sm:text-[9px] text-zinc-400 font-mono uppercase tracking-wider mt-2">
                10-Level Progressive Avionics Degradation Simulation
              </p>
            </div>

            {/* THREE CLEAN, SIMPLE PRIMARY BUTTONS */}
            <div className="space-y-3.5 w-full">
              {/* 1. START FLIGHT */}
              <button
                type="button"
                autoFocus
                onClick={() => {
                  setMainMenuScreen('FLOW_PLANET');
                  gameAudio.playCrispClick();
                }}
                className="w-full bg-emerald-400 hover:bg-emerald-300 text-black border-4 border-emerald-200 font-black p-4 text-left shadow-[6px_6px_0px_0px_#064e3b] active:translate-x-0.5 active:translate-y-0.5 transition flex items-center justify-between group cursor-pointer rounded-none">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 bg-black text-emerald-400 flex items-center justify-center border-2 border-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                    <Rocket size={26} />
                  </div>
                  <div>
                    <span className="text-base sm:text-xl font-black tracking-wider uppercase block">
                      START FLIGHT
                    </span>
                    <span className="text-[7.5px] font-mono text-zinc-900 uppercase font-bold">
                      Select Planet, Mode & Maps
                    </span>
                  </div>
                </div>
                <ChevronRight size={24} className="group-hover:translate-x-1.5 transition-transform shrink-0" />
              </button>

              {/* 2. SETTINGS & CONTROLS */}
              <button
                type="button"
                onClick={() => {
                  setPreviousScreen('TITLE');
                  setMainMenuScreen('SETTINGS');
                  gameAudio.playCrispClick();
                }}
                className="w-full bg-black/85 hover:bg-zinc-900 text-zinc-200 border-2 border-zinc-700 hover:border-emerald-400 p-3.5 text-left shadow-[4px_4px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition flex items-center justify-between group cursor-pointer rounded-none">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 bg-zinc-950 text-cyan-400 flex items-center justify-center border border-zinc-800 group-hover:border-cyan-400 shrink-0">
                    <Sliders size={20} />
                  </div>
                  <div>
                    <span className="text-sm sm:text-base font-bold tracking-wider text-emerald-300 uppercase block">
                      SETTINGS & CONTROLS
                    </span>
                    <span className="text-[7px] font-mono text-zinc-400 uppercase">
                      Custom Keyboard & Display
                    </span>
                  </div>
                </div>
                <ChevronRight size={20} className="text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all shrink-0" />
              </button>

              {/* 3. LEADERBOARD */}
              <button
                type="button"
                onClick={() => {
                  setPreviousScreen('TITLE');
                  setMainMenuScreen('LEADERBOARD');
                  gameAudio.playCrispClick();
                }}
                className="w-full bg-black/85 hover:bg-zinc-900 text-zinc-200 border-2 border-zinc-700 hover:border-yellow-400 p-3.5 text-left shadow-[4px_4px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition flex items-center justify-between group cursor-pointer rounded-none">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 bg-zinc-950 text-yellow-400 flex items-center justify-center border border-zinc-800 group-hover:border-yellow-400 shrink-0">
                    <Trophy size={20} />
                  </div>
                  <div>
                    <span className="text-sm sm:text-base font-bold tracking-wider text-yellow-400 uppercase block">
                      LEADERBOARD
                    </span>
                    <span className="text-[7px] font-mono text-zinc-400 uppercase">
                      High Scores & Missions
                    </span>
                  </div>
                </div>
                <ChevronRight size={20} className="text-zinc-500 group-hover:text-yellow-400 group-hover:translate-x-1 transition-all shrink-0" />
              </button>
            </div>

            {/* Bottom Controls Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-800 text-[8px] font-mono text-zinc-400">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const newMuted = gameAudio.toggleMute();
                    setIsSfxMuted(newMuted);
                  }}
                  className="hover:text-white flex items-center gap-1.5 transition">
                  {isSfxMuted ? <VolumeX size={14} className="text-red-400" /> : <Volume2 size={14} className="text-emerald-400" />}
                  <span>SFX: {isSfxMuted ? 'OFF' : 'ON'}</span>
                </button>
                <span>|</span>
                <button
                  type="button"
                  onClick={() => setIsMusicMuted((prev) => !prev)}
                  className="hover:text-white flex items-center gap-1.5 transition">
                  {isMusicMuted ? <VolumeX size={14} className="text-red-400" /> : <Volume2 size={14} className="text-emerald-400" />}
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
                <HelpCircle size={14} />
                <span>[ FLIGHT MANUAL ]</span>
              </button>
            </div>
          </div>

          {/* Right Side: Completely open live viewport */}
          <div className="hidden md:flex flex-1" />
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. START FLOW - STEP 1: CELESTIAL TARGET (PLANET SELECTION)
  // 1) The Moon  2) The Mars  3) The Venus
  // =========================================================================
  if (gameState.status === 'START' && mainMenuScreen === 'FLOW_PLANET') {
    const selectedDef = getPlanet(selectedPlanet);

    return (
      <div className="fixed inset-0 w-full h-full z-40 flex flex-col justify-between overflow-y-auto bg-gradient-to-b from-[#06080d]/96 via-[#06080d]/92 to-[#06080d]/98 backdrop-blur-md text-emerald-400 select-none">
        {/* Full-width Top Header Bar */}
        <div className="w-full flex items-center justify-between px-6 md:px-12 py-4 border-b border-emerald-900/60 bg-[#06080d]/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <Compass size={24} className="text-emerald-400 animate-pulse" />
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs px-2.5 py-0.5 bg-emerald-950 border border-emerald-500/80 text-emerald-300 font-mono font-bold uppercase tracking-wider">
                  STEP 1 OF 4
                </span>
                <h2 className="text-base sm:text-xl font-black tracking-wider uppercase text-emerald-400">
                  CELESTIAL DESCENT TARGET // SELECT PLANET
                </h2>
              </div>
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest block mt-1">
                CHOOSE CELESTIAL BODY • 10 PROGRESSIVE MAPS WITH RETROGRESSION PER PLANET
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setMainMenuScreen('TITLE');
                gameAudio.playCrispClick();
              }}
              className="bg-black/80 hover:bg-zinc-800 border-2 border-zinc-700 hover:border-emerald-400 text-zinc-300 hover:text-white px-4 py-2 text-xs font-bold flex items-center gap-1.5 uppercase transition">
              <ChevronLeft size={15} />
              <span>RETURN TO TITLE</span>
            </button>
            <button
              type="button"
              onClick={() => {
                toggleFullscreen();
                gameAudio.playCrispClick();
              }}
              className="bg-black hover:bg-emerald-400 hover:text-black border border-emerald-500 px-4 py-2 text-xs flex items-center gap-1.5 font-mono font-bold transition">
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              <span>{isFullscreen ? 'EXIT FS' : 'FULLSCREEN'}</span>
            </button>
          </div>
        </div>

        {/* Content Area - Utilizing Full Screen & Spreading Panels to Edges */}
        <div className="w-full flex-1 flex flex-col justify-between px-6 sm:px-10 md:px-16 py-4 md:py-6 space-y-6">
          {/* 3 Celestial Planet Cards Spanning Full Width & Height */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 flex-1 items-stretch">
            {PLANETS.map((planet) => {
              const isSelected = selectedPlanet === planet.id;
              return (
                <div
                  key={planet.id}
                  onClick={() => {
                    setSelectedPlanet(planet.id);
                    gameAudio.playCrispClick();
                  }}
                  className={`p-6 md:p-8 border-2 transition rounded-none relative flex flex-col justify-between cursor-pointer group ${
                    isSelected
                      ? 'bg-zinc-900/90 shadow-[8px_8px_0_0_#10b981]'
                      : 'bg-black/75 hover:bg-zinc-950/80 border-zinc-800 hover:border-zinc-600'
                  }`}
                  style={{
                    borderColor: isSelected ? planet.accentColor : undefined,
                    boxShadow: isSelected ? `8px 8px 0 0 ${planet.accentColor}` : undefined,
                  }}>
                  <div>
                    {/* Planet Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl filter drop-shadow-[0_0_14px_rgba(255,255,255,0.3)]">
                          {planet.icon}
                        </span>
                        <div>
                          <h3
                            className="text-lg sm:text-xl md:text-2xl font-black uppercase tracking-wider leading-none"
                            style={{ color: planet.accentColor }}>
                            {planet.name}
                          </h3>
                          <span className="text-xs font-mono text-zinc-400 uppercase block tracking-widest mt-1">
                            {planet.subname}
                          </span>
                        </div>
                      </div>

                      {isSelected ? (
                        <div
                          className="px-2.5 py-1 text-xs font-mono font-bold uppercase flex items-center gap-1.5 border"
                          style={{
                            borderColor: planet.accentColor,
                            color: planet.accentColor,
                            backgroundColor: `${planet.accentColor}18`,
                          }}>
                          <Check size={14} />
                          <span>TARGET</span>
                        </div>
                      ) : (
                        <span className="text-xs font-mono px-2 py-1 bg-zinc-950 border border-zinc-800 text-zinc-400 group-hover:text-zinc-200 uppercase font-bold">
                          SELECT
                        </span>
                      )}
                    </div>

                    {/* Atmospheric & Physics Specifications (Clean Label-Only) */}
                    <div className="space-y-2.5 bg-black/85 border border-zinc-800/80 p-3.5 font-mono text-xs my-4">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 font-bold">SURFACE GRAVITY:</span>
                        <strong className="font-bold text-sm" style={{ color: planet.accentColor }}>
                          {planet.gravity} px/s²
                        </strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 font-bold">ATMOSPHERIC PRESSURE:</span>
                        <span className="text-zinc-200 font-bold">{planet.atmospherePressure}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 font-bold">MAIN ENGINE THRUST:</span>
                        <span className="text-emerald-400 font-bold">{planet.mainThrust} px/s²</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 font-bold">CAMPAIGN SECTORS:</span>
                        <span className="text-cyan-400 font-bold">10 UNIQUE MAPS</span>
                      </div>
                    </div>
                  </div>

                  {/* Planet Bottom Quote & Difficulty Badge */}
                  <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-3">
                    <span className="text-xs font-mono text-zinc-300 italic">
                      "{planet.flavorQuote}"
                    </span>
                    <span
                      className="text-xs font-mono font-bold px-2 py-1 uppercase border shrink-0"
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
            className="p-4 border-2 font-mono flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0"
            style={{
              backgroundColor: `${selectedDef.accentColor}12`,
              borderColor: `${selectedDef.accentColor}70`,
            }}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selectedDef.icon}</span>
              <div>
                <span className="text-sm font-bold uppercase tracking-wider block" style={{ color: selectedDef.accentColor }}>
                  TARGET LOCKED: {selectedDef.name} [{selectedDef.subname}]
                </span>
                <span className="text-xs text-zinc-300 block">
                  GRAVITY: {selectedDef.gravity} PX/S² • ATMOSPHERE: {selectedDef.atmospherePressure} • 10 MAPS
                </span>
              </div>
            </div>

            <div className="text-xs text-zinc-300 italic font-mono shrink-0">
              "{selectedDef.flavorQuote}"
            </div>
          </div>
        </div>

        {/* Full-width Bottom Action Bar */}
        <div className="w-full px-6 py-4 border-t border-emerald-900/60 bg-[#06080d]/80 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setMainMenuScreen('TITLE');
              gameAudio.playCrispClick();
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-black hover:bg-zinc-800 border-2 border-zinc-700 text-zinc-300 hover:text-white font-bold text-[9px] uppercase transition flex items-center justify-center gap-1.5">
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
            className="w-full sm:flex-1 max-w-md bg-emerald-400 hover:bg-emerald-300 text-black border-4 border-emerald-200 font-black text-xs sm:text-sm py-3 px-6 shadow-[0_0_20px_rgba(16,185,129,0.5)] active:translate-x-0.5 active:translate-y-0.5 transition flex items-center justify-center gap-2 uppercase rounded-none cursor-pointer">
            <span>CONFIRM {selectedDef.name} & SELECT FLIGHT MODE</span>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. START FLOW - STEP 2: SELECT MODE
  // Solo Flight vs Play Against AI vs 2P Duel Flight + BACK BUTTON
  // =========================================================================
  if (gameState.status === 'START' && mainMenuScreen === 'FLOW_MODE') {
    return (
      <div className="fixed inset-0 w-full h-full z-40 flex flex-col justify-between overflow-y-auto bg-gradient-to-b from-[#06080d]/96 via-[#06080d]/92 to-[#06080d]/98 backdrop-blur-md text-emerald-400 select-none">
        {/* Full-width Top Header Bar */}
        <div className="w-full flex items-center justify-between px-6 md:px-12 py-4 border-b border-emerald-900/60 bg-[#06080d]/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <Rocket size={24} className="text-emerald-400 animate-pulse" />
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs px-2.5 py-0.5 bg-emerald-950 border border-emerald-500/80 text-emerald-300 font-mono font-bold uppercase tracking-wider">
                  STEP 2 OF 4
                </span>
                <h2 className="text-base sm:text-xl font-black tracking-wider uppercase text-emerald-400">
                  SELECT FLIGHT PROFILE // MISSION FORMAT
                </h2>
              </div>
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest block mt-1">
                TARGET: {currentPlanetDef.name} [{currentPlanetDef.subname}] • SOLO CAMPAIGN, PLAY AGAINST AI, OR 2P DUEL
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setMainMenuScreen('FLOW_PLANET');
                gameAudio.playCrispClick();
              }}
              className="bg-black/80 hover:bg-zinc-800 border-2 border-zinc-700 hover:border-emerald-400 text-zinc-300 hover:text-white px-4 py-2 text-xs font-bold flex items-center gap-1.5 uppercase transition">
              <ChevronLeft size={15} />
              <span>BACK TO PLANET</span>
            </button>
            <button
              type="button"
              onClick={() => {
                toggleFullscreen();
                gameAudio.playCrispClick();
              }}
              className="bg-black hover:bg-emerald-400 hover:text-black border border-emerald-500 px-4 py-2 text-xs flex items-center gap-1.5 font-mono font-bold transition">
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              <span>{isFullscreen ? 'EXIT FS' : 'FULLSCREEN'}</span>
            </button>
          </div>
        </div>

        {/* Content Area - Utilizing Full Screen & Spreading Panels to Edges */}
        <div className="w-full flex-1 flex flex-col justify-between px-6 sm:px-10 md:px-16 py-4 md:py-6 space-y-6">
          {/* Three Mode Options Spanning Full Width & Height */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 flex-1 items-stretch">
            
            {/* Mode 1: Solo Flight */}
            <div
              onClick={() => {
                setGameMode('SOLO');
                gameAudio.playCrispClick();
              }}
              className={`p-6 md:p-8 border-2 transition cursor-pointer flex flex-col justify-between rounded-none ${
                gameMode === 'SOLO'
                  ? 'bg-emerald-950/60 border-emerald-400 text-emerald-300 shadow-[8px_8px_0_0_#064e3b]'
                  : 'bg-black/80 border-zinc-800 text-zinc-400 hover:border-zinc-600'
              }`}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 flex items-center justify-center border ${
                    gameMode === 'SOLO' ? 'border-emerald-400 bg-emerald-950 text-emerald-400' : 'border-zinc-700 bg-zinc-950 text-zinc-500'
                  }`}>
                    <Rocket size={24} />
                  </div>
                  {gameMode === 'SOLO' && (
                    <span className="text-xs bg-emerald-400 text-black px-2.5 py-1 font-bold uppercase tracking-wider">
                      ACTIVE PROFILE
                    </span>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-black uppercase text-emerald-400 mb-1">
                  SOLO DESCENT
                </h3>
                <span className="text-xs font-mono text-zinc-400 block mb-4 uppercase font-bold">
                  1 PILOT • 10 PROGRESSIVE MAPS
                </span>
                
                {/* Clean Feature Pills */}
                <div className="space-y-2 font-mono text-xs text-zinc-300 my-4">
                  <div className="bg-black/60 border border-zinc-800 p-2 text-emerald-300 font-bold">
                    [10 MAP CAMPAIGN PROGRESSION]
                  </div>
                  <div className="bg-black/60 border border-zinc-800 p-2 text-zinc-300">
                    [HARDCODED AVIONICS RETROGRESSION]
                  </div>
                  <div className="bg-black/60 border border-zinc-800 p-2 text-zinc-300">
                    [HIGH SCORE TELEMETRY LOGS]
                  </div>
                </div>
              </div>

              {/* Flavor Quote */}
              <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-300 italic">
                  "Descent through deep silence."
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  WASD / ARROWS
                </span>
              </div>
            </div>

            {/* Mode 2: Play Against AI */}
            <div
              onClick={() => {
                setGameMode('AI_DUEL');
                gameAudio.playCrispClick();
              }}
              className={`p-6 md:p-8 border-2 transition cursor-pointer flex flex-col justify-between rounded-none ${
                gameMode === 'AI_DUEL'
                  ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow-[8px_8px_0_0_#0891b2]'
                  : 'bg-black/80 border-zinc-800 text-zinc-400 hover:border-zinc-600'
              }`}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 flex items-center justify-center border ${
                    gameMode === 'AI_DUEL' ? 'border-cyan-400 bg-cyan-950 text-cyan-400' : 'border-zinc-700 bg-zinc-950 text-zinc-500'
                  }`}>
                    <Bot size={24} />
                  </div>
                  {gameMode === 'AI_DUEL' && (
                    <span className="text-xs bg-cyan-400 text-black px-2.5 py-1 font-bold uppercase tracking-wider">
                      ACTIVE PROFILE
                    </span>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-black uppercase text-cyan-400 mb-1">
                  AI AUTOPILOT DUEL
                </h3>
                <span className="text-xs font-mono text-zinc-400 block mb-4 uppercase font-bold">
                  RACE AN AUTONOMOUS BOT PILOT
                </span>

                {/* Clean Feature Pills */}
                <div className="space-y-2 font-mono text-xs text-zinc-300 my-4">
                  <div className="bg-black/60 border border-zinc-800 p-2 text-cyan-300 font-bold">
                    [REAL-TIME AUTONOMOUS BOT RACER]
                  </div>
                  <div className="bg-black/60 border border-zinc-800 p-2 text-zinc-300">
                    [LIVE SPLIT-SCREEN FLIGHT CAMERAS]
                  </div>
                  <div className="bg-black/60 border border-zinc-800 p-2 text-zinc-300">
                    [CUSTOMIZABLE BOT DIFFICULTY]
                  </div>
                </div>
              </div>

              {/* Flavor Quote */}
              <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-300 italic">
                  "Synthetic reflexes vs human intuition."
                </span>
                <span className="text-xs font-mono text-cyan-400 font-bold">
                  P1 vs AI BOT
                </span>
              </div>
            </div>

            {/* Mode 3: 2P Duel Flight */}
            <div
              onClick={() => {
                setGameMode('DUEL');
                gameAudio.playCrispClick();
              }}
              className={`p-6 md:p-8 border-2 transition cursor-pointer flex flex-col justify-between rounded-none ${
                gameMode === 'DUEL'
                  ? 'bg-yellow-950/60 border-yellow-400 text-yellow-300 shadow-[8px_8px_0_0_#78350f]'
                  : 'bg-black/80 border-zinc-800 text-zinc-400 hover:border-zinc-600'
              }`}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 flex items-center justify-center border ${
                    gameMode === 'DUEL' ? 'border-yellow-400 bg-yellow-950 text-yellow-400' : 'border-zinc-700 bg-zinc-950 text-zinc-500'
                  }`}>
                    <Users size={24} />
                  </div>
                  {gameMode === 'DUEL' && (
                    <span className="text-xs bg-yellow-400 text-black px-2.5 py-1 font-bold uppercase tracking-wider">
                      ACTIVE PROFILE
                    </span>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-black uppercase text-yellow-400 mb-1">
                  2-PLAYER DUEL
                </h3>
                <span className="text-xs font-mono text-zinc-400 block mb-4 uppercase font-bold">
                  LOCAL 2-PLAYER SPLIT-SCREEN
                </span>

                {/* Clean Feature Pills */}
                <div className="space-y-2 font-mono text-xs text-zinc-300 my-4">
                  <div className="bg-black/60 border border-zinc-800 p-2 text-yellow-300 font-bold">
                    [HEAD-TO-HEAD ON SHARED SURFACE]
                  </div>
                  <div className="bg-black/60 border border-zinc-800 p-2 text-zinc-300">
                    [DUAL SPLIT-SCREEN COCKPITS]
                  </div>
                  <div className="bg-black/60 border border-zinc-800 p-2 text-zinc-300">
                    [COMPETE FOR DISTANT PAD MULTIPLIERS]
                  </div>
                </div>
              </div>

              {/* Flavor Quote */}
              <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-300 italic">
                  "Two enter the canyon, one claims the pad."
                </span>
                <span className="text-xs font-mono text-yellow-400 font-bold">
                  WASD vs ARROWS
                </span>
              </div>
            </div>
          </div>

          {/* Active Profile Briefing Banner */}
          <div className="p-4 bg-black/80 border-2 border-zinc-800 text-xs font-mono flex items-center justify-between shrink-0">
            <span className="text-zinc-300">
              ACTIVE FLIGHT PROFILE: <strong className="text-emerald-400 uppercase text-sm font-bold">{gameMode === 'SOLO' ? 'SOLO DESCENT CAMPAIGN' : gameMode === 'AI_DUEL' ? 'AI AUTOPILOT DUEL' : '2-PLAYER LOCAL SPLIT-SCREEN'}</strong>
            </span>
            <span className="text-zinc-400 text-xs uppercase font-bold">[ READY FOR VESSEL CONFIGURATION ]</span>
          </div>
        </div>

        {/* Full-width Bottom Action Bar */}
        <div className="w-full px-6 py-4 border-t border-emerald-900/60 bg-[#06080d]/80 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setMainMenuScreen('FLOW_PLANET');
              gameAudio.playCrispClick();
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-black hover:bg-zinc-800 border-2 border-zinc-700 text-zinc-300 hover:text-white font-bold text-[9px] uppercase transition flex items-center justify-center gap-1.5">
            <ChevronLeft size={14} />
            <span>BACK TO PLANET</span>
          </button>

          <button
            type="button"
            autoFocus
            onClick={() => {
              setMainMenuScreen('FLOW_CUSTOMIZE');
              gameAudio.playCrispClick();
            }}
            className="w-full sm:flex-1 max-w-md bg-emerald-400 hover:bg-emerald-300 text-black border-4 border-emerald-200 font-black text-xs sm:text-sm py-3 px-6 shadow-[0_0_20px_rgba(16,185,129,0.5)] active:translate-x-0.5 active:translate-y-0.5 transition flex items-center justify-center gap-2 uppercase rounded-none cursor-pointer">
            <span>CONTINUE TO CRAFT SPECIFICATIONS</span>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 4. START FLOW - STEP 3: CRAFT CUSTOMIZATION & FLEET HANGAR SHOP
  // Select/Purchase Crafts (3 Models) + Individual Stat Upgrades + Livery/Pilot
  // =========================================================================
  if (gameState.status === 'START' && mainMenuScreen === 'FLOW_CUSTOMIZE') {
    const activeCraft = getCraft(selectedCraftId);
    const activeUpgrades = craftUpgrades[activeCraft.id] || { engineTier: 0, fuelTier: 0, turnTier: 0 };
    const effectiveStats = computeEffectiveStats(
      activeCraft,
      activeUpgrades,
      currentPlanetDef.mainThrust,
      selectedLevelConfig.fuelCapacity
    );

    const handlePurchaseCraft = (craft: CraftDefinition) => {
      if (gradeCoins < craft.price) {
        gameAudio.playRcsPuff();
        return;
      }
      const success = deductGradeCoins(craft.price);
      if (success) {
        const nextBalance = gradeCoins - craft.price;
        setGradeCoins(nextBalance);
        const nextOwned = Array.from(new Set([...ownedCrafts, craft.id]));
        setOwnedCrafts(nextOwned);
        setStoredOwnedCrafts(nextOwned);
        setSelectedCraftId(craft.id);
        setStoredSelectedCraftId(craft.id);
        // Ensure new craft starts with base stock stats (tier 0) if not set
        if (!craftUpgrades[craft.id]) {
          const updatedUpgrades = {
            ...craftUpgrades,
            [craft.id]: { engineTier: 0, fuelTier: 0, turnTier: 0 },
          };
          setCraftUpgrades(updatedUpgrades);
          setStoredCraftUpgrades(updatedUpgrades);
        }
        gameAudio.playVictoryFanfare();
      }
    };

    const handleUpgradeStat = (craftId: string, stat: 'engineTier' | 'fuelTier' | 'turnTier') => {
      const current = craftUpgrades[craftId] || { engineTier: 0, fuelTier: 0, turnTier: 0 };
      const currentTier = current[stat];
      if (currentTier >= MAX_UPGRADE_TIER) return;
      const cost = getUpgradeCost(currentTier);
      if (gradeCoins < cost) {
        gameAudio.playRcsPuff();
        return;
      }
      const success = deductGradeCoins(cost);
      if (success) {
        const nextBalance = gradeCoins - cost;
        setGradeCoins(nextBalance);
        const updated = {
          ...craftUpgrades,
          [craftId]: {
            ...current,
            [stat]: currentTier + 1,
          },
        };
        setCraftUpgrades(updated);
        setStoredCraftUpgrades(updated);
        gameAudio.playLevelUpStinger();
      }
    };

    return (
      <div className="fixed inset-0 w-full h-full z-40 flex flex-col justify-between overflow-y-auto bg-gradient-to-b from-[#06080d]/96 via-[#06080d]/92 to-[#06080d]/98 backdrop-blur-md text-emerald-400 select-none">
        {/* Full-width Top Header Bar */}
        <div className="w-full flex items-center justify-between px-6 md:px-12 py-3.5 border-b border-emerald-900/60 bg-[#06080d]/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <Shield size={24} className="text-emerald-400 animate-pulse" />
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs px-2.5 py-0.5 bg-emerald-950 border border-emerald-500/80 text-emerald-300 font-mono font-bold uppercase tracking-wider">
                  STEP 3 OF 4
                </span>
                <h2 className="text-base sm:text-xl font-black tracking-wider uppercase text-emerald-400">
                  FLEET HANGAR // CRAFT & PILOT CONFIGURATION
                </h2>
              </div>
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest block mt-0.5">
                TARGET: {currentPlanetDef.name} • SELECT OR PURCHASE LANDERS • UPGRADE PROPULSION, FUEL & RCS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* GradeCoins Persistent Wallet Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-950/40 border-2 border-amber-500/80 text-amber-300 font-mono font-bold text-xs sm:text-sm shadow-[0_0_12px_rgba(245,158,11,0.25)]">
              <Coins size={16} className="text-amber-400 animate-pulse" />
              <span>{gradeCoins.toLocaleString()} GC</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setMainMenuScreen('FLOW_MODE');
                gameAudio.playCrispClick();
              }}
              className="bg-black/80 hover:bg-zinc-800 border-2 border-zinc-700 hover:border-emerald-400 text-zinc-300 hover:text-white px-4 py-2 text-xs font-bold flex items-center gap-1.5 uppercase transition">
              <ChevronLeft size={15} />
              <span>BACK TO MODE</span>
            </button>

            <button
              type="button"
              onClick={() => {
                toggleFullscreen();
                gameAudio.playCrispClick();
              }}
              className="bg-black hover:bg-emerald-400 hover:text-black border border-emerald-500 px-4 py-2 text-xs flex items-center gap-1.5 font-mono font-bold transition">
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              <span>{isFullscreen ? 'EXIT FS' : 'FULLSCREEN'}</span>
            </button>
          </div>
        </div>

        {/* Content Area - Utilizing Full Screen & Spreading Panels to Edges */}
        <div className="w-full flex-1 flex flex-col justify-between px-6 sm:px-10 md:px-16 py-4 md:py-6 space-y-6">

          {/* SECTION 1: 3 PLAYABLE CRAFTS HANGAR (PURCHASE & SELECT) */}
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag size={15} />
                <span>SELECT OR PURCHASE LANDER VESSELS</span>
              </span>
              <span className="text-xs font-mono text-zinc-400">
                OWNED: {ownedCrafts.length}/{CRAFTS.length} CRAFTS
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {CRAFTS.map((craft) => {
                const isOwned = ownedCrafts.includes(craft.id);
                const isSelected = selectedCraftId === craft.id;
                const craftTier = craftUpgrades[craft.id] || { engineTier: 0, fuelTier: 0, turnTier: 0 };
                const canAfford = gradeCoins >= craft.price;

                return (
                  <div
                    key={craft.id}
                    onClick={() => {
                      if (isOwned) {
                        setSelectedCraftId(craft.id);
                        setStoredSelectedCraftId(craft.id);
                        gameAudio.playCrispClick();
                      }
                    }}
                    className={`p-4 sm:p-5 border-2 transition rounded-none flex flex-col justify-between relative cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-900/95 shadow-[6px_6px_0_0_#10b981]'
                        : isOwned
                        ? 'bg-black/80 hover:bg-zinc-950/90 border-zinc-700 hover:border-zinc-500'
                        : 'bg-black/60 border-zinc-800 hover:border-amber-600/80 opacity-90'
                    }`}
                    style={{
                      borderColor: isSelected ? craft.accentColor : undefined,
                      boxShadow: isSelected ? `6px 6px 0 0 ${craft.accentColor}` : undefined,
                    }}>
                    
                    {/* Header */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className="text-[10px] font-mono font-bold px-2 py-0.5 uppercase border"
                          style={{
                            color: craft.accentColor,
                            borderColor: `${craft.accentColor}80`,
                            backgroundColor: `${craft.accentColor}15`,
                          }}>
                          {craft.classTag}
                        </span>

                        {isSelected ? (
                          <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                            <Check size={14} /> ACTIVE
                          </span>
                        ) : isOwned ? (
                          <span className="text-xs font-mono font-bold text-zinc-400 uppercase">
                            OWNED
                          </span>
                        ) : (
                          <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1">
                            <Lock size={12} /> {craft.price} GC
                          </span>
                        )}
                      </div>

                      {/* Visual Lander Icon/Sprite Bay */}
                      <div className="bg-zinc-950 border border-zinc-800 p-3 flex items-center justify-center my-3 relative overflow-hidden h-28">
                        <div
                          className="absolute inset-0 opacity-15"
                          style={{ backgroundColor: craft.accentColor }}
                        />
                        {assets[craft.assetKey] ? (
                          <img
                            src={assets[craft.assetKey]!.src}
                            alt={craft.name}
                            className="max-h-24 max-w-[120px] object-contain relative z-10 filter drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                          />
                        ) : (
                          <div className="w-16 h-14 bg-white/20 border border-white/40 flex items-center justify-center font-mono text-xs">
                            {craft.name.split(' ')[0]}
                          </div>
                        )}
                      </div>

                      <h3 className="text-base font-black uppercase text-white tracking-wider mb-0.5">
                        {craft.name}
                      </h3>
                      <span className="text-xs font-mono text-zinc-400 block mb-2 uppercase">
                        {craft.subname}
                      </span>

                      {/* Specs */}
                      <div className="space-y-1 bg-black/70 border border-zinc-800/80 p-2 font-mono text-[10px] text-zinc-300 mb-3">
                        {craft.specs.map((spec, i) => (
                          <div key={i} className="flex items-center gap-1.5 truncate">
                            <span className="text-emerald-400 font-bold">•</span>
                            <span>{spec}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-3 pt-2.5 border-t border-zinc-800/80">
                      {isSelected ? (
                        <div className="w-full py-2 bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-mono font-bold text-xs uppercase text-center flex items-center justify-center gap-1.5">
                          <Check size={14} /> ACTIVE VESSEL
                        </div>
                      ) : isOwned ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCraftId(craft.id);
                            setStoredSelectedCraftId(craft.id);
                            gameAudio.playCrispClick();
                          }}
                          className="w-full py-2 bg-zinc-900 hover:bg-emerald-400 hover:text-black border border-zinc-600 hover:border-emerald-300 text-white font-mono font-bold text-xs uppercase transition text-center">
                          SELECT VESSEL
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePurchaseCraft(craft);
                          }}
                          className={`w-full py-2 border font-mono font-bold text-xs uppercase transition flex items-center justify-center gap-1.5 ${
                            canAfford
                              ? 'bg-amber-400 hover:bg-amber-300 text-black border-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.4)] cursor-pointer'
                              : 'bg-zinc-900 text-zinc-500 border-zinc-800 cursor-not-allowed opacity-60'
                          }`}>
                          <Coins size={14} />
                          <span>UNLOCK FOR {craft.price} GC</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: INDIVIDUAL CRAFT UPGRADES BAY & PILOT CUSTOMIZATION */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* UPGRADE BAY FOR CURRENT CRAFT */}
            <div className="lg:col-span-7 bg-black/85 border-2 border-emerald-600 p-5 md:p-6 rounded-none space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                <span className="text-xs sm:text-sm font-bold text-emerald-400 font-mono uppercase flex items-center gap-2">
                  <Wrench size={16} />
                  <span>UPGRADE BAY // {activeCraft.name}</span>
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  [STATS SAVED PER CRAFT]
                </span>
              </div>

              {/* 3 Upgradable Stats: Engine Power, Fuel Capacity, Turn Power */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* 1. Engine Power */}
                {(() => {
                  const tier = activeUpgrades.engineTier;
                  const isMax = tier >= MAX_UPGRADE_TIER;
                  const cost = getUpgradeCost(tier);
                  const canAfford = gradeCoins >= cost;

                  return (
                    <div className="bg-zinc-950 p-3.5 border border-zinc-800 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-zinc-200 uppercase">ENGINE POWER</span>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold">TIER {tier}/5</span>
                        </div>
                        <div className="flex gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((t) => (
                            <div
                              key={t}
                              className={`flex-1 h-2 border ${
                                t <= tier ? 'bg-emerald-400 border-emerald-300 shadow-[0_0_6px_#10b981]' : 'bg-zinc-900 border-zinc-800'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400 block">
                          THRUST: <strong className="text-emerald-300">+{tier * 8}%</strong>
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={isMax || !canAfford}
                        onClick={() => handleUpgradeStat(activeCraft.id, 'engineTier')}
                        className={`w-full py-1.5 px-2 font-mono text-[10px] font-bold uppercase border transition flex items-center justify-center gap-1 ${
                          isMax
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-500 cursor-default'
                            : canAfford
                            ? 'bg-emerald-500/20 hover:bg-emerald-400 hover:text-black border-emerald-500 text-emerald-300 cursor-pointer'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                        }`}>
                        {isMax ? 'MAX TIER' : `UPGRADE (${cost} GC)`}
                      </button>
                    </div>
                  );
                })()}

                {/* 2. Fuel Capacity */}
                {(() => {
                  const tier = activeUpgrades.fuelTier;
                  const isMax = tier >= MAX_UPGRADE_TIER;
                  const cost = getUpgradeCost(tier);
                  const canAfford = gradeCoins >= cost;

                  return (
                    <div className="bg-zinc-950 p-3.5 border border-zinc-800 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-zinc-200 uppercase">FUEL CAPACITY</span>
                          <span className="text-[10px] font-mono text-cyan-400 font-bold">TIER {tier}/5</span>
                        </div>
                        <div className="flex gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((t) => (
                            <div
                              key={t}
                              className={`flex-1 h-2 border ${
                                t <= tier ? 'bg-cyan-400 border-cyan-300 shadow-[0_0_6px_#38bdf8]' : 'bg-zinc-900 border-zinc-800'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400 block">
                          START TANK: <strong className="text-cyan-300">+{tier * 15}L</strong>
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={isMax || !canAfford}
                        onClick={() => handleUpgradeStat(activeCraft.id, 'fuelTier')}
                        className={`w-full py-1.5 px-2 font-mono text-[10px] font-bold uppercase border transition flex items-center justify-center gap-1 ${
                          isMax
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-500 cursor-default'
                            : canAfford
                            ? 'bg-cyan-500/20 hover:bg-cyan-400 hover:text-black border-cyan-500 text-cyan-300 cursor-pointer'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                        }`}>
                        {isMax ? 'MAX TIER' : `UPGRADE (${cost} GC)`}
                      </button>
                    </div>
                  );
                })()}

                {/* 3. Turn Power / RCS */}
                {(() => {
                  const tier = activeUpgrades.turnTier;
                  const isMax = tier >= MAX_UPGRADE_TIER;
                  const cost = getUpgradeCost(tier);
                  const canAfford = gradeCoins >= cost;

                  return (
                    <div className="bg-zinc-950 p-3.5 border border-zinc-800 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-zinc-200 uppercase">TURN POWER / RCS</span>
                          <span className="text-[10px] font-mono text-yellow-400 font-bold">TIER {tier}/5</span>
                        </div>
                        <div className="flex gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((t) => (
                            <div
                              key={t}
                              className={`flex-1 h-2 border ${
                                t <= tier ? 'bg-yellow-400 border-yellow-300 shadow-[0_0_6px_#facc15]' : 'bg-zinc-900 border-zinc-800'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400 block">
                          AGILITY: <strong className="text-yellow-300">+{tier * 10}%</strong>
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={isMax || !canAfford}
                        onClick={() => handleUpgradeStat(activeCraft.id, 'turnTier')}
                        className={`w-full py-1.5 px-2 font-mono text-[10px] font-bold uppercase border transition flex items-center justify-center gap-1 ${
                          isMax
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-500 cursor-default'
                            : canAfford
                            ? 'bg-yellow-500/20 hover:bg-yellow-400 hover:text-black border-yellow-500 text-yellow-300 cursor-pointer'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                        }`}>
                        {isMax ? 'MAX TIER' : `UPGRADE (${cost} GC)`}
                      </button>
                    </div>
                  );
                })()}
              </div>

              {/* Effective Flight Summary for Selected Vessel */}
              <div className="p-3 bg-zinc-950 border border-zinc-800 font-mono text-xs flex flex-wrap items-center justify-between gap-2">
                <span className="text-zinc-400 font-bold">
                  ACTIVE CRAFT STATUS: <strong className="text-white uppercase">{activeCraft.name}</strong>
                </span>
                <span className="text-emerald-400">
                  THRUST: <strong>{effectiveStats.thrust} px/s²</strong>
                </span>
                <span className="text-cyan-400">
                  FUEL: <strong>{effectiveStats.fuel}L</strong>
                </span>
                <span className="text-yellow-400">
                  TURN: <strong>{effectiveStats.turnSpeed} rad/s</strong>
                </span>
              </div>
            </div>

            {/* PILOT CALLSIGN & LIVERY CUSTOMIZATION */}
            <div className="lg:col-span-5 bg-black/85 border-2 border-emerald-700 p-5 md:p-6 rounded-none space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                <span className="text-xs sm:text-sm font-bold text-emerald-400 font-mono uppercase flex items-center gap-2">
                  <User size={16} />
                  <span>PILOT CALLSIGN & LIVERY</span>
                </span>
              </div>

              {/* Callsign Input */}
              <div>
                <label className="text-xs uppercase font-mono text-zinc-300 font-bold block mb-1.5">
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
                  className="w-full bg-zinc-950 border-2 border-emerald-600 px-3 py-1.5 text-emerald-300 text-xs sm:text-sm font-bold tracking-widest focus:outline-none focus:border-emerald-400 rounded-none mb-2"
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
                      className={`text-[10px] px-2 py-0.5 border font-mono transition ${
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
                <span className="text-xs uppercase font-mono text-zinc-300 font-bold block mb-1.5">
                  LIVERY ACCENT:
                </span>
                <div className="grid grid-cols-5 gap-1.5">
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
                        <div className="w-5 h-5 border border-black shadow" style={{ backgroundColor: theme.color }} />
                        <span className="text-[8px] font-mono font-bold truncate w-full" style={{ color: theme.color }}>
                          {theme.name.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* AI Opponent or P2 Setup if in duel mode */}
              {gameMode === 'AI_DUEL' && (
                <div className="pt-3 border-t border-zinc-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-cyan-400 font-mono uppercase flex items-center gap-1.5">
                      <Bot size={14} />
                      <span>AI BOT OPPONENT:</span>
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 font-bold">{selectedAiPersona.callsign}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {AI_PERSONAS.map((persona) => (
                      <button
                        key={persona.id}
                        type="button"
                        onClick={() => {
                          setSelectedAiPersona(persona);
                          gameAudio.playCrispClick();
                        }}
                        className={`p-1.5 border text-left font-mono text-[9px] transition ${
                          selectedAiPersona.id === persona.id
                            ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 font-bold'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}>
                        <div className="truncate">{persona.name}</div>
                        <div className="text-[8px] text-zinc-500">{persona.riskPreference}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {gameMode === 'DUEL' && (
                <div className="pt-3 border-t border-zinc-800">
                  <span className="text-xs font-bold text-amber-400 font-mono uppercase block mb-1">
                    PLAYER 2 CALLSIGN (ARROWS):
                  </span>
                  <input
                    type="text"
                    maxLength={16}
                    value={p2Name}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setP2Name(val);
                      setStoredP2Name(val);
                    }}
                    className="w-full bg-zinc-950 border border-amber-600 px-3 py-1 text-amber-300 text-xs font-bold font-mono focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Full-width Bottom Action Bar */}
        <div className="w-full px-6 py-4 border-t border-emerald-900/60 bg-[#06080d]/80 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setMainMenuScreen('FLOW_MODE');
              gameAudio.playCrispClick();
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-black hover:bg-zinc-800 border-2 border-zinc-700 text-zinc-300 hover:text-white font-bold text-xs uppercase transition flex items-center justify-center gap-1.5">
            <ChevronLeft size={14} />
            <span>BACK TO MODE SELECT</span>
          </button>

          <button
            type="button"
            autoFocus
            onClick={() => {
              setMainMenuScreen('FLOW_LEVEL');
              gameAudio.playCrispClick();
            }}
            className="w-full sm:flex-1 max-w-md bg-emerald-400 hover:bg-emerald-300 text-black border-4 border-emerald-200 font-black text-xs sm:text-sm py-3 px-6 shadow-[0_0_20px_rgba(16,185,129,0.5)] active:translate-x-0.5 active:translate-y-0.5 transition flex items-center justify-center gap-2 uppercase rounded-none cursor-pointer">
            <span>PROCEED TO SECTOR MAP SELECTION</span>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 5. START FLOW - STEP 4: MAP & RETROGRESSION SELECTION (10 Progressive Maps)
  // Clean Map Selector + Interactive 10-Step Retrogression Flow Map + Level Locks
  // =========================================================================
  if (gameState.status === 'START' && mainMenuScreen === 'FLOW_LEVEL') {
    const planetLevels = LEVELS_BY_PLANET[selectedPlanet] || LEVELS_BY_PLANET.moon;
    const maxUnlocked = unlockedLevels[selectedPlanet] || 1;
    const effectiveStartingEpoch = Math.min(selectedStartingEpoch, maxUnlocked);
    const currentRetrogressionStep = RETROGRESSION_STEPS[effectiveStartingEpoch - 1] || RETROGRESSION_STEPS[0];
    const effectiveLevelConfig = getLevel(selectedPlanet, effectiveStartingEpoch);

    return (
      <div className="fixed inset-0 w-full h-full z-40 flex flex-col justify-between overflow-y-auto bg-gradient-to-b from-[#06080d]/96 via-[#06080d]/92 to-[#06080d]/98 backdrop-blur-md text-emerald-400 select-none">
        {/* Full-width Top Header Bar */}
        <div className="w-full flex items-center justify-between px-6 md:px-12 py-4 border-b border-emerald-900/60 bg-[#06080d]/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <Compass size={24} className="text-emerald-400 animate-pulse" />
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs px-2.5 py-0.5 bg-emerald-950 border border-emerald-500/80 text-emerald-300 font-mono font-bold uppercase tracking-wider">
                  STEP 4 OF 4
                </span>
                <h2 className="text-base sm:text-xl font-black tracking-wider uppercase text-emerald-400">
                  SELECT DESCENT SECTOR // {currentPlanetDef.name}
                </h2>
                <span className="text-xs font-mono font-bold px-2 py-0.5 border uppercase" style={{ borderColor: currentPlanetDef.accentColor, color: currentPlanetDef.accentColor }}>
                  {currentPlanetDef.gravity} PX/S²
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-zinc-900 border border-zinc-700 text-zinc-300 uppercase">
                  UNLOCKED: {maxUnlocked}/10
                </span>
              </div>
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest block mt-1">
                {currentPlanetDef.subname} • 10 MAPS WITH PROGRESSIVE AVIONICS RETROGRESSION
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Planet Switcher Pills */}
            <div className="hidden md:flex items-center gap-2 font-mono text-xs mr-2">
              {PLANETS.map((p) => {
                const isCurrent = selectedPlanet === p.id;
                const planetMax = unlockedLevels[p.id] || 1;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedPlanet(p.id);
                      if (selectedStartingEpoch > planetMax) {
                        setSelectedStartingEpoch(planetMax);
                      }
                      gameAudio.playCrispClick();
                    }}
                    className={`px-3 py-1.5 border transition uppercase text-xs font-bold ${
                      isCurrent
                        ? 'border-emerald-400 bg-emerald-950 text-white shadow-[2px_2px_0_0_#10b981]'
                        : 'border-zinc-800 bg-black text-zinc-400 hover:border-zinc-600'
                    }`}>
                    {p.name} ({planetMax}/10)
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                setMainMenuScreen('FLOW_CUSTOMIZE');
                gameAudio.playCrispClick();
              }}
              className="bg-black/80 hover:bg-zinc-800 border-2 border-zinc-700 hover:border-emerald-400 text-zinc-300 hover:text-white px-4 py-2 text-xs font-bold flex items-center gap-1.5 uppercase transition">
              <ChevronLeft size={15} />
              <span>BACK TO CRAFT</span>
            </button>
            <button
              type="button"
              onClick={() => {
                toggleFullscreen();
                gameAudio.playCrispClick();
              }}
              className="bg-black hover:bg-emerald-400 hover:text-black border border-emerald-500 px-4 py-2 text-xs flex items-center gap-1.5 font-mono font-bold transition">
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              <span>{isFullscreen ? 'EXIT FS' : 'FULLSCREEN'}</span>
            </button>
          </div>
        </div>

        {/* Content Area - Utilizing Full Screen & Spreading Panels to Edges */}
        <div className="w-full flex-1 flex flex-col justify-between px-6 sm:px-10 md:px-16 py-4 md:py-6 space-y-5">
          {/* Locked Notice Banner */}
          {lockedNotice && (
            <div className="bg-amber-950/90 border-2 border-amber-500 p-2.5 text-center text-amber-300 font-bold text-xs uppercase tracking-wider mb-2 animate-pulse flex items-center justify-center gap-2">
              <Lock size={15} className="shrink-0 text-amber-400" />
              <span>{lockedNotice}</span>
            </div>
          )}

          {/* 10 Map Cards Grid (5x2) - Each Map Has Unique Terrain & Hardcoded Retrogression */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-2 flex-1">
            {planetLevels.map((level) => {
              const isUnlocked = level.id <= maxUnlocked;
              const isSelected = effectiveStartingEpoch === level.id;
              const cardAvionics = getAvionics(level.id);
              const avionicsLabel =
                level.id === 1 ? 'FULL AVIONICS'
                : level.id === 2 ? 'CROSSWIND 165L'
                : level.id === 3 ? 'NO VECTOR PIP'
                : level.id === 4 ? 'NO PREDICTOR'
                : level.id === 5 ? 'STROBE RADAR'
                : level.id === 6 ? 'ACOUSTIC ALT'
                : level.id === 7 ? 'RADAR DEAD'
                : level.id === 8 ? 'ANALOG FUEL/SPD'
                : level.id === 9 ? 'VIEW 75% BLIND'
                : 'TOTAL BLACKOUT';

              return (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => {
                    if (!isUnlocked) {
                      gameAudio.playRcsPuff();
                      setLockedNotice(`MAP ${level.id} (${level.name}) IS LOCKED! Complete Map ${level.id - 1} on ${currentPlanetDef.name} first.`);
                      setTimeout(() => setLockedNotice(null), 3500);
                      return;
                    }
                    setSelectedStartingEpoch(level.id);
                    gameAudio.playCrispClick();
                  }}
                  className={`p-3 text-left border-2 transition rounded-none relative flex flex-col justify-between ${
                    !isUnlocked
                      ? 'bg-zinc-950/70 border-zinc-900 opacity-45 cursor-not-allowed grayscale'
                      : isSelected
                      ? 'bg-zinc-900 border-emerald-400 shadow-[4px_4px_0_0_#10b981] cursor-pointer'
                      : 'bg-black/80 border-zinc-800 hover:border-zinc-600 cursor-pointer'
                  }`}
                  style={{
                    borderColor: isSelected ? level.themeColor : undefined,
                    boxShadow: isSelected ? `4px 4px 0 0 ${level.themeColor}` : undefined,
                  }}>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-black uppercase" style={{ color: isUnlocked ? level.themeColor : '#71717a' }}>
                        MAP {level.id.toString().padStart(2, '0')}
                      </span>
                      {!isUnlocked ? (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-500 flex items-center gap-1">
                          <Lock size={9} />
                          <span>LOCKED</span>
                        </span>
                      ) : isSelected ? (
                        <Check size={15} style={{ color: level.themeColor }} />
                      ) : (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-zinc-950 border border-zinc-800 text-zinc-400">
                          {level.fuelCapacity}L
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-zinc-200 block truncate uppercase leading-tight">
                      {isUnlocked ? level.name : `[LOCKED] ${level.name}`}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 block truncate mt-1">
                      {level.mapType}
                    </span>
                  </div>

                  <div className="mt-3 pt-2 border-t border-zinc-800/80 text-[10px] font-mono flex items-center justify-between text-zinc-400">
                    <span className="text-zinc-300 font-bold">{level.fuelCapacity}L</span>
                    <span
                      className="font-bold uppercase tracking-wider text-[10px]"
                      style={{ color: isUnlocked ? level.themeColor : '#71717a' }}>
                      {isUnlocked ? avionicsLabel : 'LOCKED'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Clean Selected Map Briefing Panel (Label-Only with Flavor Quote) */}
          <div className="bg-black/90 border-2 border-zinc-800 p-4 rounded-none grid grid-cols-1 md:grid-cols-12 gap-4 font-mono shrink-0">
            {/* Left: Map Title, Flavor Quote & Retrogression Status */}
            <div className="md:col-span-7 space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-sm sm:text-base font-black uppercase text-emerald-400" style={{ color: effectiveLevelConfig.themeColor }}>
                  MAP {effectiveLevelConfig.id}: {effectiveLevelConfig.name}
                </span>
                <span className="text-xs px-2 py-0.5 bg-zinc-900 border border-zinc-700 text-zinc-300 font-bold">
                  {effectiveLevelConfig.mapType}
                </span>
              </div>

              {/* Flavor Quote - Kept prominent and stylish */}
              <div className="text-xs sm:text-sm italic text-zinc-200 border-l-2 border-emerald-500 pl-3 py-0.5 my-2">
                "{effectiveLevelConfig.flavorQuote}"
              </div>

              {/* Hardcoded Retrogression Status Banner */}
              <div
                className="p-2.5 border text-xs flex flex-col gap-1.5 rounded-none"
                style={{
                  backgroundColor: `${effectiveLevelConfig.themeColor}15`,
                  borderColor: `${effectiveLevelConfig.themeColor}80`,
                }}>
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider text-xs" style={{ color: effectiveLevelConfig.themeColor }}>
                    AVIONICS SPECIFICATION: {effectiveLevelConfig.era}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold">
                    [OFFLINE PROTOCOLS PERMANENT]
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-zinc-300 text-xs">
                  {effectiveLevelConfig.degradedAvionics.map((item, i) => (
                    <span key={i} className="text-zinc-200 bg-black/60 px-2 py-1 border border-zinc-800 font-bold">
                      • {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Flight Conditions & Target Platforms (Clean Labels) */}
            <div className="md:col-span-5 space-y-2.5 border-t md:border-t-0 md:border-l border-zinc-800 md:pl-4 pt-2 md:pt-0">
              <div className="flex items-center justify-between text-xs text-zinc-300 font-bold">
                <span>FUEL: <strong className="text-emerald-400">{effectiveLevelConfig.fuelCapacity}L</strong></span>
                <span>WIND: <strong className="text-cyan-300">{effectiveLevelConfig.windSpeed} PX/S</strong></span>
                <span>HAZARDS: <strong className="text-amber-400">{effectiveLevelConfig.hazardCount}</strong></span>
              </div>

              <div>
                <span className="text-xs font-bold text-zinc-400 uppercase block mb-1.5">
                  LANDING PLATFORMS ON THIS MAP:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {effectiveLevelConfig.pads.map((pad) => (
                    <div key={pad.code} className="bg-zinc-950 border border-zinc-800 p-1.5 flex items-center justify-between">
                      <span className="text-xs font-bold" style={{ color: pad.color }}>
                        {pad.code} [{pad.multiplier}x]
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {pad.w}px wide
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full-width Bottom Action Bar */}
        <div className="w-full px-6 py-4 border-t border-emerald-900/60 bg-[#06080d]/80 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setMainMenuScreen('FLOW_CUSTOMIZE');
                gameAudio.playCrispClick();
              }}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-black hover:bg-zinc-800 border-2 border-zinc-700 text-zinc-300 hover:text-white font-bold text-[8.5px] uppercase transition flex items-center justify-center gap-1.5">
              <ChevronLeft size={13} />
              <span>BACK TO CRAFT</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMainMenuScreen('FLOW_PLANET');
                gameAudio.playCrispClick();
              }}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-black hover:bg-zinc-800 border-2 border-zinc-700 text-zinc-300 hover:text-white font-bold text-[8.5px] uppercase transition flex items-center justify-center gap-1.5">
              <span>CHANGE PLANET</span>
            </button>
          </div>

          <button
            type="button"
            autoFocus
            onClick={() => onStartGame(effectiveStartingEpoch)}
            className="w-full sm:flex-1 max-w-xl bg-emerald-400 hover:bg-emerald-300 text-black border-4 border-emerald-200 font-black text-xs md:text-sm py-3 px-6 shadow-[0_0_24px_rgba(16,185,129,0.55)] active:translate-x-0.5 active:translate-y-0.5 transition flex items-center justify-center gap-2 uppercase rounded-none cursor-pointer">
            <Play size={18} fill="currentColor" />
            <span>
              {gameMode === 'AI_DUEL'
                ? `LAUNCH AI DUEL ON ${currentPlanetDef.name} // MAP ${effectiveStartingEpoch}`
                : gameMode === 'DUEL'
                ? `LAUNCH 2P DUEL ON ${currentPlanetDef.name} // MAP ${effectiveStartingEpoch}`
                : `LAUNCH DESCENT ON ${currentPlanetDef.name} // MAP ${effectiveStartingEpoch}`}
            </span>
          </button>
        </div>
      </div>
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
      <MenuOverlay tone="neutral" zIndex={60} fullScreen maxWidthClass="w-full max-w-7xl">
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
      <MenuOverlay tone="neutral" zIndex={60} fullScreen maxWidthClass="w-full max-w-7xl">
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
      <MenuOverlay tone="neutral" zIndex={60} fullScreen maxWidthClass="w-full max-w-7xl">
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
  // Full-Screen 2-Half Layout:
  // - Left Half: Mission Telemetry, Score Breakdown & Cushion Verification
  // - Right Half: Next Sector Specs, Explicit Avionics Degradation & Pilot Advisory
  // - Bottom Bar: Full-Width Action Controls (Commence, Leaderboard, Map Select, Title)
  // =========================================================================
  if (gameState.status === 'LEVEL_COMPLETE' && lastTouchdownStats) {
    const nextLevelNum = gameState.level;
    const completedLevelNum = lastTouchdownStats.completedLevelNum || (nextLevelNum > 1 ? nextLevelNum - 1 : 1);
    const completedLevelConfig = getLevel(selectedPlanet, completedLevelNum);
    const nextLevelConfig = getLevel(selectedPlanet, nextLevelNum);
    const nextRetrogression = RETROGRESSION_STEPS[nextLevelNum - 1] || RETROGRESSION_STEPS[0];
    const isMaxCampaign = completedLevelNum >= 10;

    return (
      <MenuOverlay tone="victory" zIndex={40} fullScreen maxWidthClass="w-full max-w-7xl">
        <div className="w-full bg-[#07090e]/98 backdrop-blur-xl border-4 border-emerald-500 p-4 sm:p-6 md:p-7 shadow-[14px_14px_0px_0px_#064e3b] flex flex-col justify-between text-emerald-400 rounded-none max-h-[94vh] overflow-y-auto">
          
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-emerald-800/80">
            <div className="flex items-center gap-3">
              <Award className="text-emerald-400 animate-bounce shrink-0" size={36} />
              <div>
                <h2 className="text-base sm:text-2xl font-black uppercase tracking-wider leading-tight text-white flex items-center gap-2">
                  <span>
                    {gameMode === 'AI_DUEL'
                      ? lastTouchdownStats.isWinner
                        ? 'VICTORY OVER AI BOT'
                        : `${lastTouchdownStats.pilotName} WINS DUEL`
                      : gameMode === 'DUEL'
                      ? `${lastTouchdownStats.pilotName} WINS ROUND`
                      : `TOUCHDOWN CONFIRMED // MAP ${completedLevelNum.toString().padStart(2, '0')}: ${completedLevelConfig.name}`}
                  </span>
                </h2>
                <div className="text-[8px] sm:text-[9px] font-mono text-emerald-300 font-bold uppercase tracking-wider">
                  [ CELESTIAL TARGET: {currentPlanetDef.name} • {lastTouchdownStats.padName} PAD ({lastTouchdownStats.padMultiplier}X MULTIPLIER) • STRUT CONTACT NOMINAL ]
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-[8px]">
              <span className="px-2.5 py-1 bg-emerald-950 border border-emerald-500/80 text-emerald-300 font-bold uppercase">
                {currentPlanetDef.icon} {currentPlanetDef.name}
              </span>
              <span className="px-2.5 py-1 bg-black border border-zinc-700 text-zinc-300 font-bold uppercase">
                CAMPAIGN: {Math.min(completedLevelNum, 10)}/10
              </span>
            </div>
          </div>

          {/* TWO-HALF SPLIT CONTAINER */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 my-4 flex-1">
            
            {/* ============================================================= */}
            {/* LEFT HALF: LEVEL SCORE BREAKDOWN & LANDING TELEMETRY          */}
            {/* ============================================================= */}
            <div className="flex flex-col gap-3.5 bg-black/80 border-2 border-emerald-500/80 p-4 sm:p-5 font-mono">
              <div className="flex items-center justify-between border-b border-emerald-900 pb-2.5">
                <span className="text-xs sm:text-sm font-black uppercase text-emerald-400 tracking-wider flex items-center gap-2">
                  <Gauge size={16} className="text-emerald-400" />
                  <span>MISSION TELEMETRY & SCORE BREAKDOWN</span>
                </span>
                <span className="text-xs px-2.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold uppercase">
                  VERIFIED TOUCHDOWN
                </span>
              </div>

              {/* Points Summary Header */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-950/90 border border-emerald-900/60 p-4">
                <div>
                  <span className="text-xs text-zinc-400 uppercase font-bold tracking-widest block mb-1">
                    LEVEL {completedLevelNum} SCORE AWARDED
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]">
                    +{lastTouchdownStats.pointsAwarded.toLocaleString()} <span className="text-sm font-bold">PTS</span>
                  </span>
                </div>
                <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-zinc-800 pt-2 sm:pt-0 sm:pl-4">
                  <span className="text-xs text-zinc-400 uppercase font-bold tracking-widest block mb-1">
                    CAMPAIGN TOTAL SCORE
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.4)]">
                    {(lastTouchdownStats.totalCumulativeScore ?? gameState.score).toLocaleString()} <span className="text-sm font-bold">PTS</span>
                  </span>
                </div>
              </div>

              {/* GradeCoins Currency Award Banner */}
              <div className="bg-gradient-to-r from-amber-950/70 to-yellow-950/40 border-2 border-amber-500/80 p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center shrink-0">
                    <Coins className="text-amber-400 animate-bounce" size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                      GRADECOINS (GC) SALVAGE PAYOUT
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-amber-400">
                      +{lastTouchdownStats.gcEarned ?? Math.round(lastTouchdownStats.pointsAwarded / 12)} <span className="text-xs font-bold text-amber-300">GC</span>
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase block">WALLET BALANCE</span>
                  <span className="text-sm font-black text-amber-300 font-mono">
                    {gradeCoins.toLocaleString()} GC
                  </span>
                </div>
              </div>

              {/* 4 Score Multipliers Cards */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="bg-zinc-950 p-3 border border-zinc-800">
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold">BASE SECTOR VALUE:</span>
                  <strong className="text-white font-black text-sm block">
                    +{(lastTouchdownStats.basePoints ?? completedLevelNum * 1000).toLocaleString()}
                  </strong>
                  <span className="text-[10px] text-zinc-400">Map {completedLevelNum} difficulty rating</span>
                </div>

                <div className="bg-zinc-950 p-3 border border-zinc-800">
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold">FUEL CONSERVED:</span>
                  <strong className="text-cyan-400 font-black text-sm block">
                    +{(lastTouchdownStats.fuelBonus ?? 0).toLocaleString()}
                  </strong>
                  <span className="text-[10px] text-zinc-400">{lastTouchdownStats.fuelRemaining}L remaining</span>
                </div>

                <div className="bg-zinc-950 p-3 border border-zinc-800">
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold">SOFT LANDING BONUS:</span>
                  <strong className="text-emerald-400 font-black text-sm block">
                    +{(lastTouchdownStats.precisionBonus ?? 0).toLocaleString()}
                  </strong>
                  <span className="text-[10px] text-zinc-400">Hydraulic shock precision</span>
                </div>

                <div className="bg-zinc-950 p-3 border border-zinc-800">
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold">DISTANCE MULTIPLIER:</span>
                  <strong className="text-amber-400 font-black text-sm block">
                    {lastTouchdownStats.padMultiplier}x
                  </strong>
                  <span className="text-[10px] text-zinc-400">{lastTouchdownStats.padName} landing pad</span>
                </div>
              </div>

              {/* Real Flight Dynamics Telemetry Box */}
              <div className="bg-zinc-950 p-3.5 border border-zinc-800/80 space-y-2.5 mt-auto font-mono">
                <span className="text-xs font-bold uppercase text-zinc-400 block tracking-wider">
                  FLIGHT TOUCHDOWN DYNAMICS // SUSPENSION CUSHION
                </span>

                <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                  <div className="bg-black p-2.5 border border-emerald-900/60">
                    <span className="text-zinc-400 block text-[10px] font-bold">DESCENT SPEED</span>
                    <strong className="text-emerald-300 font-bold text-sm block">
                      {Math.round(lastTouchdownStats.vy)} <span className="text-[10px]">PX/S</span>
                    </strong>
                    <span className="text-[9px] text-zinc-500 font-mono">SAFE: ≤75</span>
                  </div>

                  <div className="bg-black p-2.5 border border-cyan-900/60">
                    <span className="text-zinc-400 block text-[10px] font-bold">LATERAL DRIFT</span>
                    <strong className="text-cyan-300 font-bold text-sm block">
                      {Math.round(Math.abs(lastTouchdownStats.vx))} <span className="text-[10px]">PX/S</span>
                    </strong>
                    <span className="text-[9px] text-zinc-500 font-mono">SAFE: ≤45</span>
                  </div>

                  <div className="bg-black p-2.5 border border-amber-900/60">
                    <span className="text-zinc-400 block text-[10px] font-bold">ATTITUDE TILT</span>
                    <strong className="text-amber-300 font-bold text-sm block">
                      {Math.round(Math.abs(lastTouchdownStats.tilt))}°
                    </strong>
                    <span className="text-[9px] text-zinc-500 font-mono">SAFE: ≤16°</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-300 pt-1.5 border-t border-zinc-900">
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <Check size={14} /> STRUT ABSORPTION: NOMINAL
                  </span>
                  <span>PILOT: <strong className="text-white">{lastTouchdownStats.pilotName || pilotName}</strong></span>
                </div>
              </div>
            </div>

            {/* ============================================================= */}
            {/* RIGHT HALF: AVIONICS DEGRADATION PROTOCOL FOR NEXT LEVEL     */}
            {/* ============================================================= */}
            {gameMode === 'SOLO' && !isMaxCampaign ? (
              <div className="flex flex-col gap-3.5 bg-red-950/25 border-2 border-red-500/80 p-4 sm:p-5 font-mono">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-red-900 pb-2.5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={17} className="text-red-400 animate-pulse shrink-0" />
                    <span className="text-xs sm:text-sm font-black uppercase text-red-400 tracking-wider">
                      AVIONICS DEGRADATION PROTOCOL // ADVANCING TO LEVEL {nextLevelNum}
                    </span>
                  </div>
                  <span
                    className="text-xs font-bold px-2.5 py-0.5 uppercase border shrink-0"
                    style={{
                      borderColor: nextRetrogression.color,
                      color: nextRetrogression.color,
                      backgroundColor: `${nextRetrogression.color}18`,
                    }}>
                    {nextRetrogression.shortBadge}
                  </span>
                </div>

                {/* Upcoming Level Specs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs bg-black/70 p-3 border border-red-900/50">
                  <div>
                    <span className="text-zinc-400 block text-[10px] font-bold">SECTOR NAME:</span>
                    <strong className="text-white uppercase font-bold block truncate">
                      {nextLevelConfig.name}
                    </strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] font-bold">TOPOLOGY:</span>
                    <strong className="text-yellow-300 uppercase font-bold block truncate">
                      {nextLevelConfig.mapType}
                    </strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] font-bold">CROSSWIND:</span>
                    <strong className="text-cyan-300 uppercase font-bold block truncate">
                      {nextLevelConfig.windMax > 0 ? `±${nextLevelConfig.windMax} PX/S` : 'VACUUM (0)'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] font-bold">STARTING FUEL:</span>
                    <strong className="text-amber-400 uppercase font-bold block truncate">
                      {nextLevelConfig.fuelCapacity}L
                    </strong>
                  </div>
                </div>

                {/* Era & Stage Description */}
                <div className="bg-black/80 border border-zinc-800 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold uppercase" style={{ color: nextRetrogression.color }}>
                      RETROGRESSION STAGE: {nextRetrogression.stageName}
                    </span>
                    <span className="text-xs text-zinc-400 font-bold">{nextRetrogression.title}</span>
                  </div>
                  <div className="text-xs text-zinc-300 italic pl-2 border-l border-red-500 mt-1">
                    "{nextLevelConfig.flavorQuote || 'Systems are stripped backward in time. Offlined features never return.'}"
                  </div>
                </div>

                {/* Newly Decommissioned Avionics */}
                <div>
                  <span className="text-xs text-red-400 uppercase font-black block mb-2 tracking-wider flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span>NEWLY DECOMMISSIONED ON LEVEL {nextLevelNum}:</span>
                  </span>
                  <div className="space-y-1.5">
                    {(getNewlyDecommissioned(nextLevelNum).length > 0
                      ? getNewlyDecommissioned(nextLevelNum)
                      : nextRetrogression.decommissioned
                    ).map((degraded, i) => (
                      <div key={i} className="flex items-start gap-2.5 bg-black/90 border border-red-900/90 p-2 text-xs">
                        <span className="text-red-400 font-black text-[10px] px-2 py-0.5 bg-red-950 border border-red-700 shrink-0 uppercase">
                          OFFLINE
                        </span>
                        <span className="text-yellow-200 font-bold leading-tight">
                          {degraded}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Previously Decommissioned (Never Comes Back) */}
                {getPreviouslyDecommissioned(nextLevelNum).length > 0 && (
                  <div>
                    <span className="text-xs text-zinc-400 uppercase font-bold block mb-1.5 tracking-wider flex items-center gap-1">
                      <span>🚫</span>
                      <span>PREVIOUSLY DECOMMISSIONED (PERMANENTLY OFFLINE):</span>
                    </span>
                    <div className="space-y-1.5 max-h-[90px] overflow-y-auto pr-1">
                      {getPreviouslyDecommissioned(nextLevelNum).map((prevDegraded, i) => (
                        <div key={i} className="flex items-center justify-between gap-2 bg-zinc-950/90 border border-zinc-800/80 px-2.5 py-1.5 text-xs">
                          <span className="text-zinc-300 truncate">
                            {prevDegraded}
                          </span>
                          <span className="text-zinc-500 font-mono text-[10px] shrink-0 font-bold uppercase">
                            OFFLINE
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pilot Warning Advisory */}
                <div className="bg-black/90 border border-amber-900/70 p-3 text-xs text-zinc-200 italic flex items-center gap-2 mt-auto">
                  <span className="text-amber-400 font-bold not-italic shrink-0">[PILOT ADVISORY]</span>
                  <span>"{nextRetrogression.pilotWarning}"</span>
                </div>
              </div>
            ) : gameMode === 'SOLO' && isMaxCampaign ? (
              <div className="flex flex-col gap-3 bg-yellow-950/30 border-2 border-yellow-500/80 p-4 font-mono justify-center items-center text-center">
                <Award size={48} className="text-yellow-400 animate-bounce" />
                <h3 className="text-lg font-black text-yellow-400 uppercase">
                  ALL 10 LEVELS CLEARED ON {currentPlanetDef.name}!
                </h3>
                <p className="text-[8.5px] text-zinc-300 max-w-md leading-relaxed">
                  You have conquered all 10 escalating maps and adapted through every tier of retrogression.
                  Level {completedLevelNum} was the ultimate trial!
                </p>
                <div className="bg-black/90 border border-yellow-600/80 p-3 w-full max-w-md text-left">
                  <div className="text-[8px] text-yellow-300 font-bold uppercase mb-1">
                    CELESTIAL CAMPAIGN ARCHIVE STATUS:
                  </div>
                  <div className="text-[7.5px] text-zinc-300 space-y-1">
                    <div>✓ 10/10 Planetary sectors unlocked</div>
                    <div>✓ Avionics degradation survived</div>
                    <div>✓ High score saved to planetary archive</div>
                  </div>
                </div>
              </div>
            ) : (
              /* Duel / AI Duel Mode Right Half */
              <div className="flex flex-col gap-3 bg-cyan-950/30 border-2 border-cyan-500/80 p-4 font-mono justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-cyan-900 pb-2 mb-3">
                    <span className="text-[9px] font-black uppercase text-cyan-400 tracking-wider flex items-center gap-2">
                      <Rocket size={14} />
                      <span>RIGHT HALF: HEAD-TO-HEAD DUEL RESULTS</span>
                    </span>
                    <span className="text-[7.5px] px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold uppercase">
                      {gameMode === 'AI_DUEL' ? 'AI BOT DUEL' : '2-PLAYER DUEL'}
                    </span>
                  </div>

                  <div className="bg-black/80 border border-cyan-800 p-3 space-y-2 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 text-[8px] uppercase">ROUND WINNER:</span>
                      <strong className="text-cyan-300 text-sm font-black uppercase">
                        {lastTouchdownStats.pilotName}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-[8px]">
                      <span className="text-zinc-400 uppercase">POINTS AWARDED:</span>
                      <span className="text-yellow-400 font-bold">+{lastTouchdownStats.pointsAwarded.toLocaleString()} PTS</span>
                    </div>
                    <div className="flex items-center justify-between text-[8px]">
                      <span className="text-zinc-400 uppercase">TOUCHDOWN ZONE:</span>
                      <span className="text-emerald-400 font-bold">{lastTouchdownStats.padName} ({lastTouchdownStats.padMultiplier}X)</span>
                    </div>
                  </div>

                  <p className="text-[8px] text-zinc-300 leading-relaxed">
                    Prepare for the next round! Both landers will be refueled and reset onto high orbital approach.
                  </p>
                </div>

                <div className="p-2.5 bg-black/90 border border-cyan-900 text-[7.5px] text-zinc-400 flex items-center gap-2">
                  <Shield size={13} className="text-cyan-400 shrink-0" />
                  <span>Next round continues on current planetary crater with opposing craft positions!</span>
                </div>
              </div>
            )}

          </div>

          {/* =============================================================== */}
          {/* BOTTOM FULL-WIDTH ACTION CONTROLS                               */}
          {/* =============================================================== */}
          <div className="w-full space-y-2 pt-2 border-t-2 border-emerald-800/80">
            <button
              autoFocus
              type="button"
              onClick={onAdvanceLevel}
              className="w-full bg-emerald-400 hover:bg-emerald-300 text-black border-4 border-emerald-200 font-black py-3 sm:py-3.5 px-6 shadow-[0_0_24px_rgba(16,185,129,0.55)] active:translate-x-0.5 active:translate-y-0.5 transition flex items-center justify-center gap-2 uppercase rounded-none text-xs sm:text-sm cursor-pointer">
              <Play size={18} fill="currentColor" />
              <span>
                {gameMode === 'SOLO'
                  ? isMaxCampaign
                    ? 'REPLAY FINAL SECTOR 10'
                    : `COMMENCE LEVEL ${nextLevelNum}: ${nextLevelConfig.name}`
                  : 'COMMENCE NEXT DUEL ROUND'}
              </span>
            </button>

            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPreviousScreen('TITLE');
                  setMainMenuScreen('LEADERBOARD');
                  gameAudio.playCrispClick();
                }}
                className="bg-black hover:bg-yellow-400 text-yellow-400 hover:text-black border-2 border-yellow-500 py-2 text-[9px] font-bold uppercase transition flex items-center justify-center gap-1.5 cursor-pointer">
                <Trophy size={13} />
                <span>VIEW SCOREBOARD</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMainMenuScreen('FLOW_LEVEL');
                  onAbortToTitle();
                  gameAudio.playCrispClick();
                }}
                className="bg-black hover:bg-emerald-500 text-emerald-400 hover:text-black border-2 border-emerald-600 py-2 text-[9px] font-bold uppercase transition flex items-center justify-center gap-1.5 cursor-pointer">
                <Compass size={13} />
                <span>SECTOR ARCHIVE / MAP SELECT</span>
              </button>

              <button
                type="button"
                onClick={onAbortToTitle}
                className="bg-black hover:bg-zinc-800 border-2 border-zinc-700 text-zinc-400 hover:text-white py-2 text-[9px] font-bold uppercase transition flex items-center justify-center gap-1 cursor-pointer">
                <ChevronLeft size={13} />
                <span>TITLE SCREEN</span>
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

          <div className="w-full bg-black border-2 border-red-900 p-3 mb-2 text-center text-[9px] rounded-none">
            <span className="text-zinc-500 block mb-1">FINAL PILOT SCORE</span>
            <span className="text-2xl font-bold text-yellow-400">
              {gameState.score}
            </span>
            <span className="text-[8px] text-zinc-400 block mt-1 uppercase font-mono">
              {pilotName} // Concluded on Level {gameState.level} ({activeLevelConfig.name})
            </span>
          </div>

          {lastTouchdownStats?.gcEarned ? (
            <div className="w-full bg-amber-950/40 border-2 border-amber-500/70 p-2.5 mb-3 flex items-center justify-between text-[9px] font-mono">
              <span className="text-amber-400 font-bold flex items-center gap-1.5 uppercase">
                <Coins size={14} className="text-amber-400" /> MISSION SALVAGE PAYOUT:
              </span>
              <span className="text-amber-300 font-black text-xs">+{lastTouchdownStats.gcEarned} GC</span>
            </div>
          ) : null}

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
      <MenuOverlay tone="victory" zIndex={40} fullScreen maxWidthClass="w-full max-w-2xl">
        <div className="w-full bg-[#08080c] border-4 border-yellow-400 p-5 sm:p-7 shadow-[10px_10px_0px_0px_#78350f] flex flex-col items-center text-center text-yellow-400 rounded-none max-h-[92vh] overflow-y-auto">
          <Award className="text-yellow-400 mb-2 animate-bounce shrink-0" size={48} />
          <h2 className="text-base sm:text-2xl font-black mb-1 uppercase tracking-wider">
            MASTER CELESTIAL PILOT
          </h2>
          <div className="text-[9px] text-cyan-400 uppercase tracking-widest font-bold mb-3">
            [ {pilotName} CONQUERED ALL 10 LEVELS ON {currentPlanetDef.name} ]
          </div>
          <p className="text-[9.5px] text-zinc-300 leading-relaxed mb-3 font-mono">
            You crossed hostile terrain on {currentPlanetDef.name}, adapted through 10 calibrated levels of
            avionics degradation, and conquered the final sensory blackout solely via acoustic sonar frequencies.
          </p>

          {/* Final Level Score & Grand Total Points */}
          <div className="w-full bg-black/90 border-2 border-yellow-600/80 p-3 mb-3 text-left font-mono rounded-none">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2 mb-2">
              <div>
                <span className="text-[7.5px] text-zinc-400 uppercase font-bold tracking-widest block">
                  LEVEL 10 FINAL SECTOR SCORE
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400">
                  +{lastTouchdownStats?.pointsAwarded?.toLocaleString() ?? '10,000'} PTS
                </span>
              </div>
              <div className="text-right">
                <span className="text-[7px] text-zinc-500 uppercase font-bold block">
                  CAMPAIGN EXPEDITION TOTAL
                </span>
                <span className="text-xl sm:text-2xl font-black text-yellow-400 drop-shadow-[0_0_12px_rgba(234,179,8,0.5)]">
                  {gameState.score.toLocaleString()} PTS
                </span>
              </div>
            </div>

            {lastTouchdownStats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[7.5px] bg-zinc-950 p-2 border border-zinc-800/80 text-zinc-300">
                <div>
                  <span className="text-zinc-500 block">BASE SECTOR:</span>
                  <strong className="text-zinc-200 font-bold block">
                    +{(lastTouchdownStats.basePoints ?? 10000).toLocaleString()}
                  </strong>
                </div>
                <div>
                  <span className="text-zinc-500 block">FUEL BONUS ({lastTouchdownStats.fuelRemaining}L):</span>
                  <strong className="text-cyan-400 font-bold block">
                    +{(lastTouchdownStats.fuelBonus ?? 0).toLocaleString()}
                  </strong>
                </div>
                <div>
                  <span className="text-zinc-500 block">TOUCHDOWN PRECISION:</span>
                  <strong className="text-emerald-400 font-bold block">
                    +{(lastTouchdownStats.precisionBonus ?? 0).toLocaleString()}
                  </strong>
                </div>
                <div>
                  <span className="text-zinc-500 block">DISTANCE MULTIPLIER:</span>
                  <strong className="text-amber-400 font-bold block">
                    {lastTouchdownStats.padMultiplier}x ({lastTouchdownStats.padName})
                  </strong>
                </div>
              </div>
            )}
          </div>

          {/* 10 Conquered Retrogression Stages Badge Strip */}
          <div className="w-full bg-zinc-950 border border-zinc-800 p-2.5 mb-4 text-left font-mono">
            <span className="text-[7px] text-zinc-400 font-bold uppercase tracking-wider block mb-1.5">
              10 RETROGRESSION PROTOCOLS SURVIVED:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 text-[6.5px]">
              {RETROGRESSION_STEPS.map((s) => (
                <div key={s.level} className="p-1 bg-black/80 border border-zinc-800/80 flex items-center justify-between">
                  <span className="font-bold" style={{ color: s.color }}>L{s.level}: {s.shortBadge}</span>
                  <span className="text-emerald-400 font-bold">✓</span>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full space-y-2">
            <button
              autoFocus
              type="button"
              onClick={onStartGame}
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-black border-4 border-yellow-200 font-black py-3 px-6 shadow-[0_0_20px_rgba(234,179,8,0.5)] active:translate-x-0.5 active:translate-y-0.5 transition flex items-center justify-center gap-2 uppercase rounded-none text-xs sm:text-sm cursor-pointer">
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
