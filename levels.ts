/**
 * @fileoverview Planetary Worlds & 10-Level Retrogression Engine for Retrograde Descent.
 *
 * CELESTIAL WORLDS:
 * 1. THE MOON (Luna) - Low gravity (36 px/s^2), vacuum space backdrop, basalt mare basins.
 * 2. MARS (Ares) - Medium gravity (52 px/s^2), red dust squalls, iron-oxide canyons and rift mesas.
 * 3. VENUS (Cytherea) - Heavy gravity (68 px/s^2), crushing sulfuric atmosphere, scorched calderas.
 *
 * STRICT CUMULATIVE RETROGRESSION:
 * "Technology retrogrades backward in time. Features already removed NEVER come back."
 * - Level 1: Full Glass Cockpit (All flight computers online).
 * - Level 2: Aux Fuel Tanks Jettisoned (165L), crosswind drift introduced.
 * - Level 3: Velocity Vector Pip OFFLINE (permanently removed).
 * - Level 4: Trajectory Predictor Arc & Reticle DECOMMISSIONED (permanently removed).
 * - Level 5: Continuous Radar Sweep DEGRADED (Radar pulses once every 2.0s with decaying trace).
 * - Level 6: Digital Numeric Laser Altimeter DECOMMISSIONED (Replaced by acoustic proximity chirps).
 * - Level 7: Tactical Radar Minimap & Target Beacon PERMANENTLY OFFLINE (Screens dead/glitching).
 * - Level 8: Digital Numeric Speedometers DECOMMISSIONED (Mechanical damped analog fuel needle with lag).
 * - Level 9: Cockpit Viewscreen 75% BLIND (Dense optical static fog).
 * - Level 10: TOTAL SENSORY BLACKOUT (All cockpit screens DEAD, 95% total optical darkness, 100% acoustic sonar pitch only).
 */

export type PlanetId = 'moon' | 'mars' | 'venus';

export interface PlanetDef {
  id: PlanetId;
  name: string;
  subname: string;
  gravity: number; // px/s^2
  mainThrust: number; // px/s^2
  atmospherePressure: string;
  atmosphereDensity: number; // physical drag factor
  skyTopColor: string;
  skyBottomColor: string;
  hazeColor: string;
  terrainPrimaryColor: string;
  terrainSecondaryColor: string;
  accentColor: string;
  bgStarCount: number;
  dustParticleColor?: string;
  difficultyRating: string;
  description: string;
  flavorQuote: string;
  icon: string;
}

export const PLANETS: PlanetDef[] = [
  {
    id: 'moon',
    name: 'THE MOON',
    subname: 'LUNA // EARTH SATELLITE',
    gravity: 36,
    mainThrust: 95,
    atmospherePressure: '0.00 atm (Vacuum)',
    atmosphereDensity: 0.0,
    skyTopColor: '#030712',
    skyBottomColor: '#0f172a',
    hazeColor: 'rgba(148, 163, 184, 0.05)',
    terrainPrimaryColor: '#475569',
    terrainSecondaryColor: '#334155',
    accentColor: '#10b981',
    bgStarCount: 160,
    difficultyRating: 'STANDARD (GRAVITY 36 px/s²)',
    description: 'Vacuum descent over ancient basalt lowlands and rugged impact craters. Zero atmospheric drag allows effortless coasting, but razor crags and deep abysses test precision thrust control.',
    flavorQuote: '"One small step for man, one harrowing retrograde burn for the pilot."',
    icon: '🌕',
  },
  {
    id: 'mars',
    name: 'MARS',
    subname: 'ARES // THE RED PLANET',
    gravity: 52,
    mainThrust: 118,
    atmospherePressure: '0.01 atm (Thin CO₂)',
    atmosphereDensity: 0.08,
    skyTopColor: '#1c0a06',
    skyBottomColor: '#3b1207',
    hazeColor: 'rgba(239, 68, 68, 0.14)',
    terrainPrimaryColor: '#9a3412',
    terrainSecondaryColor: '#7c2d12',
    accentColor: '#f97316',
    bgStarCount: 80,
    dustParticleColor: 'rgba(249, 115, 22, 0.55)',
    difficultyRating: 'ELEVATED (GRAVITY 52 px/s² • 1.45x)',
    description: 'Iron-oxide dunes and towering canyon walls buffeted by sudden red dust squalls. 1.45x lunar gravity requires aggressive counter-burns to arrest rapid vertical descents.',
    flavorQuote: '"The red dust of Olympus Mons forgives neither engine stalls nor drifting vectors."',
    icon: '🔴',
  },
  {
    id: 'venus',
    name: 'VENUS',
    subname: 'CYTHEREA // THE MORNING STAR',
    gravity: 68,
    mainThrust: 138,
    atmospherePressure: '90.0 atm (Crushing Acidic)',
    atmosphereDensity: 0.22,
    skyTopColor: '#191803',
    skyBottomColor: '#2e2c04',
    hazeColor: 'rgba(234, 179, 8, 0.20)',
    terrainPrimaryColor: '#713f12',
    terrainSecondaryColor: '#502e08',
    accentColor: '#eab308',
    bgStarCount: 25,
    dustParticleColor: 'rgba(234, 179, 8, 0.45)',
    difficultyRating: 'EXTREME (GRAVITY 68 px/s² • 1.9x)',
    description: 'Crushing 1.9x gravity beneath a scorching, sulfuric acid cloud deck. Heavy atmospheric drag and blinding thermal updrafts demand sustained engine burns to touch down without disintegrating.',
    flavorQuote: '"Under 90 atmospheres of corrosive acid, metal creaks and avionics die."',
    icon: '🪐',
  },
];

export function getPlanet(id: PlanetId): PlanetDef {
  return PLANETS.find((p) => p.id === id) || PLANETS[0];
}

export interface RetrogressionStep {
  level: number;
  stageName: string;
  title: string;
  shortBadge: string;
  color: string;
  icon: string;
  hudStyle: 'modern' | 'modern-nopip' | 'y2k' | 'eighties' | 'apollo' | 'blackout';
  fuelCapacity: number;
  windSpeed: number;
  hazardCount: number;
  avionicsStatus: string;
  decommissioned: string[];
  cumulativeOffline: string[];
  activeFeatures: string[];
  pilotWarning: string;
}

export const CUMULATIVE_RETROGRESSION_LEDGER = [
  { level: 2, feature: 'Auxiliary Fuel Pods (Reduced from 180L to 165L)' },
  { level: 2, feature: 'Atmospheric Crosswind Shear Active' },
  { level: 3, feature: 'Velocity Vector Pip (Directional Marker) OFFLINE' },
  { level: 4, feature: 'Live Dotted Trajectory Predictor Arc DECOMMISSIONED' },
  { level: 4, feature: 'Landing Guidance Alignment Reticle OFFLINE' },
  { level: 5, feature: 'Continuous Tactical Radar Sweep DEGRADED (Periodic 2s Strobe Pulse Only)' },
  { level: 6, feature: 'Digital Numeric Laser Altimeter Readout OFFLINE' },
  { level: 7, feature: 'Tactical Radar Minimap PERMANENTLY OFFLINE (Dead Screen)' },
  { level: 7, feature: 'Target Navigation Compass Beacon OFFLINE' },
  { level: 8, feature: 'Digital Numeric Speedometer (V-SPD / H-SPD) OFFLINE' },
  { level: 8, feature: 'Digital Fuel Gauge Replaced by Sluggish Analog Needle (~300ms mechanical lag)' },
  { level: 9, feature: 'Cockpit Viewscreen 75% BLIND (Dense Static Optical Noise Fog)' },
  { level: 10, feature: 'TOTAL SENSORY BLACKOUT (All Cockpit Instruments Dead, 95% Darkness)' },
];

export function getNewlyDecommissioned(level: number): string[] {
  return CUMULATIVE_RETROGRESSION_LEDGER
    .filter(item => item.level === level)
    .map(item => item.feature);
}

export function getPreviouslyDecommissioned(level: number): string[] {
  return CUMULATIVE_RETROGRESSION_LEDGER
    .filter(item => item.level < level)
    .map(item => item.feature);
}

export function getAllDecommissioned(level: number): string[] {
  return CUMULATIVE_RETROGRESSION_LEDGER
    .filter(item => item.level <= level)
    .map(item => item.feature);
}

export function getActiveOperationalSystems(level: number): string[] {
  const systems = [];
  if (level < 3) systems.push('Velocity Vector Pip');
  if (level < 4) systems.push('Live Trajectory Predictor Arc', 'Touchdown Reticle');
  if (level < 5) systems.push('Continuous Tactical Radar Minimap');
  else if (level < 7) systems.push('Low-Frequency Radar Strobe (2.0s pulse)');
  if (level < 6) systems.push('Digital Laser Altimeter');
  else if (level < 10) systems.push('Acoustic Proximity Audio Chirps');
  if (level < 7) systems.push('Target Compass Nav Beacon');
  if (level < 8) systems.push('Digital Speedometers (Vx / Vy)', 'Digital Fuel Bar');
  else if (level < 10) systems.push('Damped Mechanical Analog Fuel Needle');
  if (level < 9) systems.push('100% Optical Viewscreen');
  else if (level < 10) systems.push('25% Emergency Optical Window');
  systems.push('Main Rocket Thruster', 'Hydraulic Suspension Struts', 'Acoustic Sonar Frequency Pitch (200-1200Hz)');
  return systems;
}

export const RETROGRESSION_STEPS: RetrogressionStep[] = [
  {
    level: 1,
    stageName: 'STAGE 1: FULL GLASS COCKPIT',
    title: 'Glass Cockpit Initialized',
    shortBadge: 'FULL AVIONICS',
    color: '#10b981',
    icon: '🟢',
    hudStyle: 'modern',
    fuelCapacity: 180,
    windSpeed: 0,
    hazardCount: 4,
    avionicsStatus: '100% Operational',
    decommissioned: ['None (All flight computers online)'],
    cumulativeOffline: [],
    activeFeatures: [
      'Live Dotted Trajectory Predictor Arc',
      'Velocity Vector Pip (Directional Marker)',
      'Touchdown Alignment Reticle',
      'Tactical Radar Minimap (High Refresh)',
      'Digital Numeric Altimeter & Speedometers',
      '180L High-Capacity Auxiliary Fuel Tanks',
    ],
    pilotWarning: 'Baseline familiarization run. Test thruster authority and safe landing velocity envelope.',
  },
  {
    level: 2,
    stageName: 'STAGE 1: TELEMETRY DRIFT',
    title: 'Crosswind Drift Protocol',
    shortBadge: 'TELEMETRY DRIFT',
    color: '#06b6d4',
    icon: '🔷',
    hudStyle: 'modern',
    fuelCapacity: 165,
    windSpeed: 10,
    hazardCount: 5,
    avionicsStatus: 'Telemetry Drift Active',
    decommissioned: [
      'Auxiliary Fuel Pods Jettisoned (Down to 165L)',
      'Atmospheric Crosswind Shear Active',
    ],
    cumulativeOffline: [
      'Auxiliary Fuel Pods (180L)',
    ],
    activeFeatures: [
      'Live Dotted Trajectory Predictor Arc',
      'Tactical Radar Minimap',
      'Velocity Vector Pip',
      'Digital Speedometers & Altimeter',
    ],
    pilotWarning: 'Lateral crosswinds detected across landing corridors. Counter lateral drift with RCS.',
  },
  {
    level: 3,
    stageName: 'STAGE 2: VECTOR PIP OFFLINE',
    title: 'Velocity Vector Pip Stripped',
    shortBadge: 'NO VECTOR PIP',
    color: '#3b82f6',
    icon: '💠',
    hudStyle: 'modern-nopip',
    fuelCapacity: 150,
    windSpeed: 15,
    hazardCount: 6,
    avionicsStatus: 'HUD Marker Stripped',
    decommissioned: [
      'Velocity Vector Pip (Directional Marker) OFFLINE',
      'Fuel Capacity Restricted to 150L',
    ],
    cumulativeOffline: [
      'Auxiliary Fuel Pods (180L)',
      'Velocity Vector Pip (Directional Marker)',
    ],
    activeFeatures: [
      'Live Dotted Trajectory Arc',
      'Tactical Radar Minimap',
      'Digital Telemetry HUD (Numeric Vx / Vy)',
      'Digital Laser Altimeter',
    ],
    pilotWarning: 'Flight computer no longer draws the velocity pip. Pilot must fly by raw numeric instruments.',
  },
  {
    level: 4,
    stageName: 'STAGE 2: PREDICTOR OFFLINE',
    title: 'Trajectory Predictor Stripped',
    shortBadge: 'NO PREDICTOR',
    color: '#22c55e',
    icon: '❇️',
    hudStyle: 'y2k',
    fuelCapacity: 140,
    windSpeed: 20,
    hazardCount: 7,
    avionicsStatus: 'Predictive Guidance Dead',
    decommissioned: [
      'Live Dotted Trajectory Predictor Arc DECOMMISSIONED',
      'Touchdown Guidance Reticle OFFLINE',
      'Fuel Capacity Restricted to 140L',
    ],
    cumulativeOffline: [
      'Auxiliary Fuel Pods (180L)',
      'Velocity Vector Pip',
      'Live Dotted Trajectory Arc',
      'Touchdown Alignment Reticle',
    ],
    activeFeatures: [
      'Tactical Radar Minimap',
      'Digital Speedometers & Altimeter HUD',
      'Manual Attitude Indicator',
    ],
    pilotWarning: 'Predictive physics line terminated. Pilot must rely entirely on momentum intuition and thrust timing.',
  },
  {
    level: 5,
    stageName: 'STAGE 3: RADAR STROBE DECAY',
    title: 'Radar Refresh Degradation',
    shortBadge: 'RADAR STROBE',
    color: '#84cc16',
    icon: '📡',
    hudStyle: 'y2k',
    fuelCapacity: 130,
    windSpeed: 25,
    hazardCount: 8,
    avionicsStatus: 'Low-Frequency Pulse',
    decommissioned: [
      'Continuous Radar Sweep DEGRADED (Pulses every 2.0s with decaying trace)',
      'Fuel Capacity Restricted to 130L',
    ],
    cumulativeOffline: [
      'Auxiliary Fuel Pods (180L)',
      'Velocity Vector Pip',
      'Live Trajectory Predictor Arc',
      'Touchdown Guidance Reticle',
      'Continuous Tactical Radar Sweep (Now 2.0s Strobe)',
    ],
    activeFeatures: [
      'Periodic Strobe Radar Pulse',
      'Digital Altimeter & Speedometers',
      'Target Navigation Compass Beacon',
    ],
    pilotWarning: 'Radar sensor capacitors degrading. Topography and platform blips update only in periodic 2-second flashes.',
  },
  {
    level: 6,
    stageName: 'STAGE 3: ALTIMETER OFFLINE',
    title: 'Acoustic Altimeter Fallback',
    shortBadge: 'AUDIO ALTIMETER',
    color: '#f59e0b',
    icon: '🔊',
    hudStyle: 'eighties',
    fuelCapacity: 125,
    windSpeed: 30,
    hazardCount: 9,
    avionicsStatus: 'Digital Laser Altimeter Dead',
    decommissioned: [
      'Digital Numeric Altimeter Readout OFFLINE',
      'Fuel Capacity Restricted to 125L',
    ],
    cumulativeOffline: [
      'Auxiliary Fuel Pods',
      'Velocity Vector Pip',
      'Live Trajectory Predictor Arc',
      'Touchdown Reticle',
      'Continuous Radar Sweep',
      'Digital Numeric Laser Altimeter',
    ],
    activeFeatures: [
      'Acoustic Ground Proximity Chirps (Auditory cadence)',
      'Low-Frequency Radar Strobe',
      'Digital Speedometers',
    ],
    pilotWarning: 'Digital altitude display burnt out. Pilot must judge distance from ground via acoustic audio chirp frequency.',
  },
  {
    level: 7,
    stageName: 'STAGE 4: SENSOR CRT GLITCH',
    title: 'CRT Static & Radar Blackout',
    shortBadge: 'SENSOR GLITCH',
    color: '#ea580c',
    icon: '⚡',
    hudStyle: 'eighties',
    fuelCapacity: 120,
    windSpeed: 35,
    hazardCount: 10,
    avionicsStatus: 'CRT Screen Noise',
    decommissioned: [
      'Tactical Radar Minimap PERMANENTLY OFFLINE (Dead Screen)',
      'Target Navigation Compass Beacon OFFLINE',
      'Speedometer Displays Suffer CRT Static Flickering',
      'Fuel Capacity Restricted to 120L',
    ],
    cumulativeOffline: [
      'Auxiliary Fuel Pods',
      'Velocity Vector Pip',
      'Live Trajectory Predictor Arc',
      'Touchdown Reticle',
      'Tactical Radar Minimap (PERMANENTLY OFFLINE)',
      'Target Navigation Compass Beacon',
      'Digital Numeric Laser Altimeter',
    ],
    activeFeatures: [
      'Digital Speedometers (CRT Glitching)',
      'Acoustic Proximity Audio Chirps',
      'Visual Terrain Silhouette',
    ],
    pilotWarning: 'Electromagnetic static corrupts cockpit CRTs. Instruments flicker and radar is permanently dark.',
  },
  {
    level: 8,
    stageName: 'STAGE 4: ANALOG GAUGES',
    title: 'Mechanical Analog Fallback',
    shortBadge: 'ANALOG GAUGES',
    color: '#94a3b8',
    icon: '⚙️',
    hudStyle: 'apollo',
    fuelCapacity: 115,
    windSpeed: 38,
    hazardCount: 11,
    avionicsStatus: 'Mechanical Needles Only',
    decommissioned: [
      'Digital Speedometers (Vx / Vy) OFFLINE',
      'Digital Fuel Gauge Replaced by Sluggish Mechanical Needle (~300ms lag)',
      'Integrated Silicon Flight Computer Power Cut',
      'Fuel Capacity Restricted to 115L',
    ],
    cumulativeOffline: [
      'Auxiliary Fuel Pods',
      'Velocity Vector Pip',
      'Live Trajectory Predictor Arc',
      'Touchdown Reticle',
      'Tactical Radar Minimap',
      'Target Navigation Compass Beacon',
      'Digital Laser Altimeter',
      'Digital Speedometers (Vx / Vy)',
      'Digital Fuel Bar',
    ],
    activeFeatures: [
      'Mechanical Damped Fuel Needle (~300ms physical lag)',
      'Acoustic Audio Altitude Chirps',
      'Visual Eyeball Flight by Terrain',
    ],
    pilotWarning: 'Silicon avionics dead. Speedometers are blank. Mechanical fuel needle suffers damping lag.',
  },
  {
    level: 9,
    stageName: 'STAGE 5: OPTICAL SENSOR DECAY',
    title: '75% Optical Failure',
    shortBadge: '75% BLIND',
    color: '#f43f5e',
    icon: '🌫️',
    hudStyle: 'apollo',
    fuelCapacity: 110,
    windSpeed: 42,
    hazardCount: 12,
    avionicsStatus: '75% Optical Darkness',
    decommissioned: [
      'Cockpit Viewscreen 75% BLIND (Dense Static Optical Noise Fog)',
      'Mechanical Gauges Unlit',
      'Fuel Restricted to 110L',
    ],
    cumulativeOffline: [
      'Auxiliary Fuel Pods',
      'Velocity Vector Pip',
      'Live Trajectory Predictor Arc',
      'Touchdown Reticle',
      'Tactical Radar Minimap',
      'Target Navigation Compass Beacon',
      'Digital Laser Altimeter',
      'Digital Speedometers (Vx / Vy)',
      'Digital Fuel Bar',
      '75% Optical Viewscreen Sight',
    ],
    activeFeatures: [
      'Acoustic Sonar Frequency Pitch (200Hz - 1200Hz)',
      'Emergency Landing Pad Strobe Glow (25% window)',
      'Hydraulic Touchdown Sensors',
    ],
    pilotWarning: 'Dense optical noise blinds 75% of viewscreen. Fly by audio acoustic sonar tone elevation.',
  },
  {
    level: 10,
    stageName: 'STAGE 5: TOTAL SENSORY BLACKOUT',
    title: 'The Total Sensory Blackout',
    shortBadge: 'BLIND BLACKOUT',
    color: '#ef4444',
    icon: '🌑',
    hudStyle: 'blackout',
    fuelCapacity: 100,
    windSpeed: 46,
    hazardCount: 14,
    avionicsStatus: '100% Instrument Blackout',
    decommissioned: [
      'ALL FLIGHT COMPUTERS & SCREENS DEAD',
      'Viewscreen: 95% TOTAL SENSORY BLACKOUT',
      'Fuel Restricted to 100L',
    ],
    cumulativeOffline: [
      'ALL DIGITAL & ANALOG INSTRUMENTS DECOMMISSIONED',
      'Optical Viewscreen 95% BLACKOUT',
      'Only Acoustic Sonar Audio Survives',
    ],
    activeFeatures: [
      '100% Pure Acoustic Sonar Audio Flight Pitch (Frequency sweeps higher as craft nears ground)',
      'Hydraulic Touchdown Struts',
    ],
    pilotWarning: 'Total sensory blackout. All instrumentation dead. Close eyes and land purely by acoustic sonar tone pitch.',
  },
];

export interface LandingPadDef {
  name: string;
  code: 'ALPHA' | 'BRAVO' | 'CHARLIE' | 'OMEGA';
  xPercent: number; // Ratio of worldWidth (0.0 to 1.0)
  yOffset: number; // Height displacement from baseline
  w: number; // Pad width in pixels
  multiplier: number; // Score multiplier
  color: string;
  glowColor: string;
  distanceTier: 'NEAR' | 'MID' | 'FAR' | 'EXTREME';
}

export interface LevelConfig {
  id: number;
  planetId: PlanetId;
  name: string;
  era: string;
  retrogressionShort: string;
  themeColor: string;
  hudStyle: 'modern' | 'modern-nopip' | 'y2k' | 'eighties' | 'apollo' | 'blackout';
  mapType: string;
  description: string;
  degradedAvionics: string[];
  worldWidth: number;
  worldHeight: number;
  windSpeed: number;
  hazardCount: number;
  fuelCapacity: number;
  pads: LandingPadDef[];
  cragPositions: number[];
  terrainOctaves: {
    baseAmp: number;
    w1Freq: number;
    w1Amp: number;
    w2Freq: number;
    w2Amp: number;
    w3Freq: number;
    w3Amp: number;
  };
}

export const LEVELS_BY_PLANET: Record<PlanetId, LevelConfig[]> = {
  // =========================================================================
  // PLANET 1: THE MOON (Luna) - 10 Progressive Maps
  // Topography: Wide basalt mare basins, impact crater rings, rolling lowlands.
  // =========================================================================
  moon: [
    {
      id: 1,
      planetId: 'moon',
      name: 'TRANQUILLITY BASE',
      era: 'STAGE 1: FULL GLASS COCKPIT',
      retrogressionShort: 'FULL AVIONICS',
      themeColor: '#10b981',
      hudStyle: 'modern',
      mapType: 'Smooth Lunar Lowlands',
      description: 'Expansive rolling lowlands with forgiving wide plateaus. All modern avionics online: live dotted trajectory predictor, tactical radar minimap, and landing guidance reticle.',
      degradedAvionics: ['All systems 100% nominal — Live Dotted Trajectory Active', 'Auxiliary Fuel Tanks Online (180L)'],
      worldWidth: 3400,
      worldHeight: 1400,
      windSpeed: 0,
      hazardCount: 4,
      fuelCapacity: 180,
      pads: [
        { name: 'ALPHA BASE', code: 'ALPHA', xPercent: 0.18, yOffset: 10, w: 160, multiplier: 1.0, color: '#10b981', glowColor: 'rgba(16, 185, 129, 0.4)', distanceTier: 'NEAR' },
        { name: 'BRAVO OUTPOST', code: 'BRAVO', xPercent: 0.42, yOffset: -25, w: 135, multiplier: 2.0, color: '#38bdf8', glowColor: 'rgba(56, 189, 248, 0.4)', distanceTier: 'MID' },
        { name: 'CHARLIE CREST', code: 'CHARLIE', xPercent: 0.67, yOffset: 18, w: 115, multiplier: 3.5, color: '#f59e0b', glowColor: 'rgba(245, 158, 11, 0.4)', distanceTier: 'FAR' },
        { name: 'OMEGA SANCTUARY', code: 'OMEGA', xPercent: 0.89, yOffset: -15, w: 95, multiplier: 5.0, color: '#ec4899', glowColor: 'rgba(236, 72, 153, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.30, 0.55, 0.78],
      terrainOctaves: { baseAmp: 70, w1Freq: 2.0, w1Amp: 60, w2Freq: 5.0, w2Amp: 30, w3Freq: 9.0, w3Amp: 16 },
    },
    {
      id: 2,
      planetId: 'moon',
      name: 'OCEAN OF STORMS',
      era: 'STAGE 1: TELEMETRY DRIFT',
      retrogressionShort: 'LIGHT TURBULENCE',
      themeColor: '#06b6d4',
      hudStyle: 'modern',
      mapType: 'Undulating Mare Basin',
      description: 'Rolling volcanic plain crossed by gentle lunar swells. Light crosswinds detected across descent corridors, testing lateral thruster control.',
      degradedAvionics: ['Telemetry crosswind drift active (10 px/s)', 'Tactical Radar & Trajectory Predictor Active'],
      worldWidth: 3500,
      worldHeight: 1400,
      windSpeed: 10,
      hazardCount: 5,
      fuelCapacity: 165,
      pads: [
        { name: 'PROCELLARUM PLAINS', code: 'ALPHA', xPercent: 0.24, yOffset: -15, w: 155, multiplier: 1.0, color: '#06b6d4', glowColor: 'rgba(6, 182, 212, 0.4)', distanceTier: 'NEAR' },
        { name: 'STORM GAP', code: 'BRAVO', xPercent: 0.49, yOffset: 22, w: 130, multiplier: 2.0, color: '#38bdf8', glowColor: 'rgba(56, 189, 248, 0.4)', distanceTier: 'MID' },
        { name: 'CRATER RIM', code: 'CHARLIE', xPercent: 0.73, yOffset: -35, w: 110, multiplier: 3.5, color: '#a855f7', glowColor: 'rgba(168, 85, 247, 0.4)', distanceTier: 'FAR' },
        { name: 'OCEANUS MONOLITH', code: 'OMEGA', xPercent: 0.92, yOffset: 18, w: 90, multiplier: 5.0, color: '#f43f5e', glowColor: 'rgba(244, 63, 94, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.36, 0.61, 0.82],
      terrainOctaves: { baseAmp: 75, w1Freq: 2.2, w1Amp: 65, w2Freq: 4.8, w2Amp: 34, w3Freq: 8.5, w3Amp: 18 },
    },
    {
      id: 3,
      planetId: 'moon',
      name: 'TYCHO HIGHLANDS',
      era: 'STAGE 2: VECTOR PIP OFFLINE',
      retrogressionShort: 'NO VECTOR PIP',
      themeColor: '#3b82f6',
      hudStyle: 'modern-nopip',
      mapType: 'Impact Crater Ridges',
      description: 'Rugged highlands surrounding the central peaks of Tycho crater. Velocity vector pip is stripped; pilots must fly by raw numeric instruments.',
      degradedAvionics: ['Velocity Vector Pip OFFLINE (Permanently removed)', 'Fuel Restricted to 150L'],
      worldWidth: 3600,
      worldHeight: 1420,
      windSpeed: 15,
      hazardCount: 6,
      fuelCapacity: 150,
      pads: [
        { name: 'TYCHO RIDGE', code: 'ALPHA', xPercent: 0.16, yOffset: 28, w: 150, multiplier: 1.0, color: '#3b82f6', glowColor: 'rgba(59, 130, 246, 0.4)', distanceTier: 'NEAR' },
        { name: 'CENTRAL PEAK', code: 'BRAVO', xPercent: 0.38, yOffset: -38, w: 125, multiplier: 2.0, color: '#10b981', glowColor: 'rgba(16, 185, 129, 0.4)', distanceTier: 'MID' },
        { name: 'RAY CREST', code: 'CHARLIE', xPercent: 0.63, yOffset: 20, w: 105, multiplier: 3.5, color: '#f59e0b', glowColor: 'rgba(245, 158, 11, 0.4)', distanceTier: 'FAR' },
        { name: 'ZENITH SPIRE', code: 'OMEGA', xPercent: 0.85, yOffset: -42, w: 85, multiplier: 5.0, color: '#ec4899', glowColor: 'rgba(236, 72, 153, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.28, 0.50, 0.74, 0.94],
      terrainOctaves: { baseAmp: 82, w1Freq: 2.4, w1Amp: 72, w2Freq: 5.2, w2Amp: 38, w3Freq: 9.8, w3Amp: 20 },
    },
    {
      id: 4,
      planetId: 'moon',
      name: 'BASALT CANYONS',
      era: 'STAGE 2: PREDICTOR OFFLINE',
      retrogressionShort: 'NO PREDICTOR',
      themeColor: '#22c55e',
      hudStyle: 'y2k',
      mapType: 'Basalt Rift Gorge',
      description: 'Deep jagged basalt canyons with sheer vertical drops. Live trajectory prediction and landing guidance reticles are completely decommissioned.',
      degradedAvionics: ['Trajectory Predictor DECOMMISSIONED (Permanently removed)', 'Crosswinds: 20 px/s • Fuel: 140L'],
      worldWidth: 3700,
      worldHeight: 1420,
      windSpeed: 20,
      hazardCount: 7,
      fuelCapacity: 140,
      pads: [
        { name: 'CANYON SHELF', code: 'ALPHA', xPercent: 0.27, yOffset: -32, w: 145, multiplier: 1.0, color: '#22c55e', glowColor: 'rgba(34, 197, 94, 0.4)', distanceTier: 'NEAR' },
        { name: 'BASALT ROOST', code: 'BRAVO', xPercent: 0.51, yOffset: 35, w: 120, multiplier: 2.0, color: '#06b6d4', glowColor: 'rgba(6, 182, 212, 0.4)', distanceTier: 'MID' },
        { name: 'GORGE PASS', code: 'CHARLIE', xPercent: 0.71, yOffset: -20, w: 100, multiplier: 3.5, color: '#eab308', glowColor: 'rgba(234, 179, 8, 0.4)', distanceTier: 'FAR' },
        { name: 'SANCTUARY APEX', code: 'OMEGA', xPercent: 0.93, yOffset: 40, w: 80, multiplier: 5.0, color: '#ef4444', glowColor: 'rgba(239, 68, 68, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.19, 0.39, 0.62, 0.83],
      terrainOctaves: { baseAmp: 88, w1Freq: 2.5, w1Amp: 78, w2Freq: 5.4, w2Amp: 42, w3Freq: 10.2, w3Amp: 22 },
    },
    {
      id: 5,
      planetId: 'moon',
      name: 'FRA MAURO CRATERS',
      era: 'STAGE 3: RADAR STROBE DECAY',
      retrogressionShort: 'RADAR STROBE',
      themeColor: '#84cc16',
      hudStyle: 'y2k',
      mapType: 'Impact Ridge Fields',
      description: 'Ancient ejecta blanket from the Imbrium impact. Radar sensor sweep degrades to a periodic 2-second flash with phosphor decay.',
      degradedAvionics: ['Continuous Radar Sweep DEGRADED (2s pulse strobe)', 'Fuel Restricted to 130L'],
      worldWidth: 3800,
      worldHeight: 1440,
      windSpeed: 25,
      hazardCount: 8,
      fuelCapacity: 130,
      pads: [
        { name: 'EJECTA BENCH', code: 'ALPHA', xPercent: 0.20, yOffset: 20, w: 140, multiplier: 1.0, color: '#84cc16', glowColor: 'rgba(132, 204, 22, 0.4)', distanceTier: 'NEAR' },
        { name: 'FRA MAURO PIT', code: 'BRAVO', xPercent: 0.45, yOffset: -30, w: 115, multiplier: 2.0, color: '#eab308', glowColor: 'rgba(234, 179, 8, 0.4)', distanceTier: 'MID' },
        { name: 'IMBRIUM SPUR', code: 'CHARLIE', xPercent: 0.68, yOffset: 25, w: 95, multiplier: 3.5, color: '#ea580c', glowColor: 'rgba(234, 88, 12, 0.4)', distanceTier: 'FAR' },
        { name: 'APOLLO MONOLITH', code: 'OMEGA', xPercent: 0.88, yOffset: -35, w: 75, multiplier: 5.0, color: '#f43f5e', glowColor: 'rgba(244, 63, 94, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.32, 0.57, 0.79],
      terrainOctaves: { baseAmp: 94, w1Freq: 2.7, w1Amp: 84, w2Freq: 5.6, w2Amp: 46, w3Freq: 10.8, w3Amp: 24 },
    },
    {
      id: 6,
      planetId: 'moon',
      name: 'SINUS IRIDUM',
      era: 'STAGE 3: ALTIMETER OFFLINE',
      retrogressionShort: 'AUDIO ALTIMETER',
      themeColor: '#f59e0b',
      hudStyle: 'eighties',
      mapType: 'Bay of Rainbows Cliffs',
      description: 'A massive basalt impact bay flanked by the towering Promontorium Laplace cliffs. Digital numeric altitude readout is burnt out.',
      degradedAvionics: ['Digital Numeric Altimeter DECOMMISSIONED', 'Acoustic Proximity Audio Active', 'Fuel: 125L'],
      worldWidth: 3900,
      worldHeight: 1460,
      windSpeed: 30,
      hazardCount: 9,
      fuelCapacity: 125,
      pads: [
        { name: 'RAINBOW SHORE', code: 'ALPHA', xPercent: 0.23, yOffset: -25, w: 135, multiplier: 1.0, color: '#f59e0b', glowColor: 'rgba(245, 158, 11, 0.4)', distanceTier: 'NEAR' },
        { name: 'LAPLACE BLUFF', code: 'BRAVO', xPercent: 0.53, yOffset: 28, w: 110, multiplier: 2.0, color: '#ef4444', glowColor: 'rgba(239, 68, 68, 0.4)', distanceTier: 'MID' },
        { name: 'HERACLIDES LEDGE', code: 'CHARLIE', xPercent: 0.75, yOffset: -30, w: 90, multiplier: 3.5, color: '#ec4899', glowColor: 'rgba(236, 72, 153, 0.4)', distanceTier: 'FAR' },
        { name: 'IRIDUM TERMINUS', code: 'OMEGA', xPercent: 0.94, yOffset: -50, w: 70, multiplier: 5.0, color: '#dc2626', glowColor: 'rgba(220, 38, 38, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.15, 0.38, 0.65, 0.85],
      terrainOctaves: { baseAmp: 100, w1Freq: 2.8, w1Amp: 90, w2Freq: 5.8, w2Amp: 50, w3Freq: 11.2, w3Amp: 26 },
    },
    {
      id: 7,
      planetId: 'moon',
      name: 'APENNINE CRAGS',
      era: 'STAGE 4: SENSOR CRT GLITCH',
      retrogressionShort: 'SENSOR GLITCH',
      themeColor: '#ea580c',
      hudStyle: 'eighties',
      mapType: 'Mountain Spire Trench',
      description: 'Towering lunar mountain peaks rising 5,000 meters above the plain. Tactical radar is permanently offline, screens suffer electromagnetic static noise.',
      degradedAvionics: ['Tactical Radar PERMANENTLY OFFLINE', 'Compass Beacon Offline', 'Fuel: 120L'],
      worldWidth: 4000,
      worldHeight: 1480,
      windSpeed: 35,
      hazardCount: 10,
      fuelCapacity: 120,
      pads: [
        { name: 'HADLEY SPUR', code: 'ALPHA', xPercent: 0.15, yOffset: 38, w: 130, multiplier: 1.0, color: '#ea580c', glowColor: 'rgba(234, 88, 12, 0.4)', distanceTier: 'NEAR' },
        { name: 'APENNINE PASS', code: 'BRAVO', xPercent: 0.40, yOffset: -45, w: 105, multiplier: 2.0, color: '#f97316', glowColor: 'rgba(249, 115, 22, 0.4)', distanceTier: 'MID' },
        { name: 'HUYGENS PINNACLE', code: 'CHARLIE', xPercent: 0.65, yOffset: 32, w: 85, multiplier: 3.5, color: '#dc2626', glowColor: 'rgba(220, 38, 38, 0.4)', distanceTier: 'FAR' },
        { name: 'APENNINE ABYSS', code: 'OMEGA', xPercent: 0.86, yOffset: -35, w: 65, multiplier: 5.0, color: '#991b1b', glowColor: 'rgba(153, 27, 27, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.27, 0.52, 0.76, 0.95],
      terrainOctaves: { baseAmp: 108, w1Freq: 3.0, w1Amp: 98, w2Freq: 6.0, w2Amp: 54, w3Freq: 11.8, w3Amp: 28 },
    },
    {
      id: 8,
      planetId: 'moon',
      name: 'CLAVIUS ABYSS',
      era: 'STAGE 4: ANALOG GAUGES',
      retrogressionShort: 'ANALOG GAUGES',
      themeColor: '#94a3b8',
      hudStyle: 'apollo',
      mapType: 'Colossal Crater Floor',
      description: 'One of the oldest impact craters on the Moon. Digital speedometers are dead; fuel gauge is replaced by a mechanical needle with physical inertia.',
      degradedAvionics: ['Digital Speedometers OFFLINE', 'Mechanical Damped Fuel Needle Active', 'Fuel: 115L'],
      worldWidth: 4150,
      worldHeight: 1500,
      windSpeed: 38,
      hazardCount: 11,
      fuelCapacity: 115,
      pads: [
        { name: 'CLAVIUS FLOOR', code: 'ALPHA', xPercent: 0.25, yOffset: -35, w: 125, multiplier: 1.0, color: '#94a3b8', glowColor: 'rgba(148, 163, 184, 0.4)', distanceTier: 'NEAR' },
        { name: 'PORTER CREST', code: 'BRAVO', xPercent: 0.48, yOffset: 24, w: 100, multiplier: 2.0, color: '#cbd5e1', glowColor: 'rgba(203, 213, 225, 0.4)', distanceTier: 'MID' },
        { name: 'RUTHERFURD CHASM', code: 'CHARLIE', xPercent: 0.72, yOffset: -48, w: 80, multiplier: 3.5, color: '#e2e8f0', glowColor: 'rgba(226, 232, 240, 0.4)', distanceTier: 'FAR' },
        { name: 'CLAVIUS APEX', code: 'OMEGA', xPercent: 0.91, yOffset: 22, w: 60, multiplier: 5.0, color: '#ffffff', glowColor: 'rgba(255, 255, 255, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.18, 0.37, 0.60, 0.82],
      terrainOctaves: { baseAmp: 114, w1Freq: 3.2, w1Amp: 104, w2Freq: 6.4, w2Amp: 58, w3Freq: 12.4, w3Amp: 30 },
    },
    {
      id: 9,
      planetId: 'moon',
      name: 'RUPES RECTA FAULT',
      era: 'STAGE 5: OPTICAL SENSOR DECAY',
      retrogressionShort: '75% BLIND',
      themeColor: '#f43f5e',
      hudStyle: 'apollo',
      mapType: 'Linear Fault Scarp',
      description: 'The infamous Straight Wall scarp. Viewscreen is 75% blinded by static noise; pilot must rely on acoustic sonar frequency pitch.',
      degradedAvionics: ['Viewscreen: 75% BLIND (Static noise)', 'Acoustic Sonar Flight Mode', 'Fuel: 110L'],
      worldWidth: 4250,
      worldHeight: 1500,
      windSpeed: 42,
      hazardCount: 12,
      fuelCapacity: 110,
      pads: [
        { name: 'WALL OUTPOST', code: 'ALPHA', xPercent: 0.17, yOffset: 25, w: 120, multiplier: 1.0, color: '#f43f5e', glowColor: 'rgba(244, 63, 94, 0.4)', distanceTier: 'NEAR' },
        { name: 'SCARP TRENCH', code: 'BRAVO', xPercent: 0.46, yOffset: -40, w: 95, multiplier: 2.0, color: '#fb7185', glowColor: 'rgba(251, 113, 133, 0.4)', distanceTier: 'MID' },
        { name: 'FAULT PRECIPICE', code: 'CHARLIE', xPercent: 0.70, yOffset: 35, w: 75, multiplier: 3.5, color: '#e11d48', glowColor: 'rgba(225, 29, 72, 0.4)', distanceTier: 'FAR' },
        { name: 'RECTA MONOLITH', code: 'OMEGA', xPercent: 0.93, yOffset: -55, w: 55, multiplier: 5.0, color: '#be123c', glowColor: 'rgba(190, 18, 60, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.31, 0.58, 0.82],
      terrainOctaves: { baseAmp: 120, w1Freq: 3.4, w1Amp: 110, w2Freq: 6.8, w2Amp: 62, w3Freq: 13.0, w3Amp: 32 },
    },
    {
      id: 10,
      planetId: 'moon',
      name: 'MARE ORIENTALE VOID',
      era: 'STAGE 5: TOTAL SENSORY BLACKOUT',
      retrogressionShort: 'BLIND BLACKOUT',
      themeColor: '#ef4444',
      hudStyle: 'blackout',
      mapType: 'Deep Void Rift',
      description: 'Total optical darkness. All cockpit displays are dead. Pilot must navigate purely by acoustic sonar audio chirps (200Hz - 1200Hz) to touch down safely.',
      degradedAvionics: ['ALL INSTRUMENTS OFFLINE', 'Optical Sensors: 95% BLIND', 'Acoustic Sonar Flight ACTIVE', 'Maximum Hazard Density'],
      worldWidth: 4400,
      worldHeight: 1520,
      windSpeed: 46,
      hazardCount: 14,
      fuelCapacity: 100,
      pads: [
        { name: 'VOID OUTPOST', code: 'ALPHA', xPercent: 0.19, yOffset: -28, w: 110, multiplier: 1.0, color: '#ef4444', glowColor: 'rgba(239, 68, 68, 0.4)', distanceTier: 'NEAR' },
        { name: 'DARK CHASM', code: 'BRAVO', xPercent: 0.43, yOffset: 30, w: 85, multiplier: 2.0, color: '#f87171', glowColor: 'rgba(248, 113, 113, 0.4)', distanceTier: 'MID' },
        { name: 'SONAR CREST', code: 'CHARLIE', xPercent: 0.66, yOffset: -45, w: 70, multiplier: 3.5, color: '#dc2626', glowColor: 'rgba(220, 38, 38, 0.4)', distanceTier: 'FAR' },
        { name: 'OMEGA BLACKOUT', code: 'OMEGA', xPercent: 0.89, yOffset: -60, w: 55, multiplier: 5.0, color: '#b91c1c', glowColor: 'rgba(185, 28, 28, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.14, 0.32, 0.54, 0.78],
      terrainOctaves: { baseAmp: 125, w1Freq: 3.5, w1Amp: 115, w2Freq: 7.0, w2Amp: 66, w3Freq: 13.5, w3Amp: 34 },
    },
  ],

  // =========================================================================
  // PLANET 2: MARS (Ares) - 10 Progressive Maps
  // Topography: Stepped red alluvial mesas, colossal rift canyons, iron dunes.
  // Completely unique pad layouts and elevated terraces!
  // =========================================================================
  mars: [
    {
      id: 1,
      planetId: 'mars',
      name: 'CHRYSE PLANITIA',
      era: 'STAGE 1: FULL GLASS COCKPIT',
      retrogressionShort: 'FULL AVIONICS',
      themeColor: '#f97316',
      hudStyle: 'modern',
      mapType: 'Golden Iron Plains',
      description: 'Expansive alluvial plains rich in iron oxide silt. Wide landing plateaus provide an ideal entry point for navigating Mars medium gravity.',
      degradedAvionics: ['100% Avionics Nominal — Dotted Trajectory & Radar Online', 'Auxiliary Tanks: 180L'],
      worldWidth: 3450,
      worldHeight: 1420,
      windSpeed: 4,
      hazardCount: 4,
      fuelCapacity: 180,
      pads: [
        { name: 'VIKING SITE 1', code: 'ALPHA', xPercent: 0.30, yOffset: 32, w: 160, multiplier: 1.0, color: '#f97316', glowColor: 'rgba(249, 115, 22, 0.4)', distanceTier: 'NEAR' },
        { name: 'GOLDEN BASIN', code: 'BRAVO', xPercent: 0.54, yOffset: -38, w: 135, multiplier: 2.0, color: '#fb923c', glowColor: 'rgba(251, 146, 60, 0.4)', distanceTier: 'MID' },
        { name: 'ARES STRATA', code: 'CHARLIE', xPercent: 0.78, yOffset: 16, w: 115, multiplier: 3.5, color: '#ea580c', glowColor: 'rgba(234, 88, 12, 0.4)', distanceTier: 'FAR' },
        { name: 'RED SANCTUARY', code: 'OMEGA', xPercent: 0.95, yOffset: -28, w: 95, multiplier: 5.0, color: '#ef4444', glowColor: 'rgba(239, 68, 68, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.18, 0.42, 0.66, 0.87],
      terrainOctaves: { baseAmp: 74, w1Freq: 2.1, w1Amp: 64, w2Freq: 5.1, w2Amp: 32, w3Freq: 9.2, w3Amp: 17 },
    },
    {
      id: 2,
      planetId: 'mars',
      name: 'UTOPIA BASIN',
      era: 'STAGE 1: TELEMETRY DRIFT',
      retrogressionShort: 'DUST DEVIL GUSTS',
      themeColor: '#ea580c',
      hudStyle: 'modern',
      mapType: 'Polygonal Impact Basin',
      description: 'A vast plain dotted with permafrost fracture polygons and gentle dust squalls that introduce lateral drift into lander telemetry.',
      degradedAvionics: ['Martian Crosswind Shear (12 px/s)', 'Fuel Reserve: 165L'],
      worldWidth: 3550,
      worldHeight: 1420,
      windSpeed: 12,
      hazardCount: 5,
      fuelCapacity: 165,
      pads: [
        { name: 'UTOPIA STATION', code: 'ALPHA', xPercent: 0.17, yOffset: -18, w: 155, multiplier: 1.0, color: '#ea580c', glowColor: 'rgba(234, 88, 12, 0.4)', distanceTier: 'NEAR' },
        { name: 'FROST SHELF', code: 'BRAVO', xPercent: 0.41, yOffset: 30, w: 130, multiplier: 2.0, color: '#f97316', glowColor: 'rgba(249, 115, 22, 0.4)', distanceTier: 'MID' },
        { name: 'POLYGON RIM', code: 'CHARLIE', xPercent: 0.66, yOffset: -28, w: 110, multiplier: 3.5, color: '#c2410c', glowColor: 'rgba(194, 65, 12, 0.4)', distanceTier: 'FAR' },
        { name: 'UTOPIA DOME', code: 'OMEGA', xPercent: 0.87, yOffset: 35, w: 90, multiplier: 5.0, color: '#dc2626', glowColor: 'rgba(220, 38, 38, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.29, 0.53, 0.77],
      terrainOctaves: { baseAmp: 78, w1Freq: 2.3, w1Amp: 68, w2Freq: 5.0, w2Amp: 36, w3Freq: 9.0, w3Amp: 19 },
    },
    {
      id: 3,
      planetId: 'mars',
      name: 'NOCTIS LABYRINTHUS',
      era: 'STAGE 2: VECTOR PIP OFFLINE',
      retrogressionShort: 'NO VECTOR PIP',
      themeColor: '#c2410c',
      hudStyle: 'modern-nopip',
      mapType: 'Labyrinth of Canyons',
      description: 'The famous "Labyrinth of the Night", a chaotic network of deep intersecting fault valleys. Vector pip is offline; watch lateral descent speed.',
      degradedAvionics: ['Velocity Vector Pip DECOMMISSIONED', 'Fuel Restricted to 150L'],
      worldWidth: 3650,
      worldHeight: 1440,
      windSpeed: 18,
      hazardCount: 6,
      fuelCapacity: 150,
      pads: [
        { name: 'LABYRINTH GATE', code: 'ALPHA', xPercent: 0.25, yOffset: -40, w: 150, multiplier: 1.0, color: '#c2410c', glowColor: 'rgba(194, 65, 12, 0.4)', distanceTier: 'NEAR' },
        { name: 'VALLEY FORK', code: 'BRAVO', xPercent: 0.49, yOffset: 42, w: 125, multiplier: 2.0, color: '#ea580c', glowColor: 'rgba(234, 88, 12, 0.4)', distanceTier: 'MID' },
        { name: 'SHADOW BLUFF', code: 'CHARLIE', xPercent: 0.73, yOffset: -25, w: 105, multiplier: 3.5, color: '#e11d48', glowColor: 'rgba(225, 29, 72, 0.4)', distanceTier: 'FAR' },
        { name: 'NOCTIS MONOLITH', code: 'OMEGA', xPercent: 0.92, yOffset: -48, w: 85, multiplier: 5.0, color: '#be123c', glowColor: 'rgba(190, 18, 60, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.15, 0.37, 0.61, 0.83],
      terrainOctaves: { baseAmp: 85, w1Freq: 2.5, w1Amp: 75, w2Freq: 5.3, w2Amp: 40, w3Freq: 10.0, w3Amp: 21 },
    },
    {
      id: 4,
      planetId: 'mars',
      name: 'VALLES MARINERIS',
      era: 'STAGE 2: PREDICTOR OFFLINE',
      retrogressionShort: 'NO PREDICTOR',
      themeColor: '#b45309',
      hudStyle: 'y2k',
      mapType: 'Grand Solar Canyon',
      description: 'A colossal rift valley 4,000 kilometers long and 7 kilometers deep. With no trajectory projection arc, pilots must estimate parabolic trajectories by eye.',
      degradedAvionics: ['Trajectory Predictor DECOMMISSIONED', 'Crosswinds: 24 px/s • Fuel: 140L'],
      worldWidth: 3750,
      worldHeight: 1450,
      windSpeed: 24,
      hazardCount: 7,
      fuelCapacity: 140,
      pads: [
        { name: 'MARINER CLIFF', code: 'ALPHA', xPercent: 0.32, yOffset: 28, w: 145, multiplier: 1.0, color: '#b45309', glowColor: 'rgba(180, 83, 9, 0.4)', distanceTier: 'NEAR' },
        { name: 'CANYON FLOOR', code: 'BRAVO', xPercent: 0.58, yOffset: -55, w: 120, multiplier: 2.0, color: '#ea580c', glowColor: 'rgba(234, 88, 12, 0.4)', distanceTier: 'MID' },
        { name: 'ECHUS CHASM', code: 'CHARLIE', xPercent: 0.79, yOffset: -15, w: 100, multiplier: 3.5, color: '#f59e0b', glowColor: 'rgba(245, 158, 11, 0.4)', distanceTier: 'FAR' },
        { name: 'MARINERIS APEX', code: 'OMEGA', xPercent: 0.96, yOffset: 45, w: 80, multiplier: 5.0, color: '#ef4444', glowColor: 'rgba(239, 68, 68, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.20, 0.45, 0.69, 0.88],
      terrainOctaves: { baseAmp: 92, w1Freq: 2.6, w1Amp: 82, w2Freq: 5.5, w2Amp: 44, w3Freq: 10.4, w3Amp: 23 },
    },
    {
      id: 5,
      planetId: 'mars',
      name: 'OLYMPUS MONS FOOTHILLS',
      era: 'STAGE 3: RADAR STROBE DECAY',
      retrogressionShort: 'RADAR STROBE',
      themeColor: '#d97706',
      hudStyle: 'y2k',
      mapType: 'Volcanic Shield Flank',
      description: 'The base of the solar system largest volcano. Low-frequency radar pulse flashes every 2 seconds amidst tumbling volcanic ejecta.',
      degradedAvionics: ['Continuous Radar Sweep DEGRADED (2s pulse strobe)', 'Crosswinds: 28 px/s • Fuel: 130L'],
      worldWidth: 3850,
      worldHeight: 1460,
      windSpeed: 28,
      hazardCount: 8,
      fuelCapacity: 130,
      pads: [
        { name: 'CALDERA APRON', code: 'ALPHA', xPercent: 0.19, yOffset: -22, w: 140, multiplier: 1.0, color: '#d97706', glowColor: 'rgba(217, 119, 6, 0.4)', distanceTier: 'NEAR' },
        { name: 'BASALT BENCH', code: 'BRAVO', xPercent: 0.44, yOffset: 38, w: 115, multiplier: 2.0, color: '#f59e0b', glowColor: 'rgba(245, 158, 11, 0.4)', distanceTier: 'MID' },
        { name: 'AURA TERRACE', code: 'CHARLIE', xPercent: 0.70, yOffset: 12, w: 95, multiplier: 3.5, color: '#ea580c', glowColor: 'rgba(234, 88, 12, 0.4)', distanceTier: 'FAR' },
        { name: 'OLYMPUS SUMMIT', code: 'OMEGA', xPercent: 0.90, yOffset: -45, w: 75, multiplier: 5.0, color: '#dc2626', glowColor: 'rgba(220, 38, 38, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.31, 0.57, 0.80],
      terrainOctaves: { baseAmp: 98, w1Freq: 2.8, w1Amp: 88, w2Freq: 5.7, w2Amp: 48, w3Freq: 10.9, w3Amp: 25 },
    },
    {
      id: 6,
      planetId: 'mars',
      name: 'HELLAS IMPACT BASIN',
      era: 'STAGE 3: ALTIMETER OFFLINE',
      retrogressionShort: 'AUDIO ALTIMETER',
      themeColor: '#b91c1c',
      hudStyle: 'eighties',
      mapType: 'Dense Atmosphere Abyss',
      description: 'The deepest impact structure on Mars, where atmospheric pressure is highest. Numeric laser altimeter is offline; rely on acoustic ground proximity beeps.',
      degradedAvionics: ['Digital Numeric Altimeter DECOMMISSIONED', 'Acoustic Ground Proximity Audio Active', 'Fuel: 125L'],
      worldWidth: 3950,
      worldHeight: 1480,
      windSpeed: 32,
      hazardCount: 9,
      fuelCapacity: 125,
      pads: [
        { name: 'HELLAS RIM', code: 'ALPHA', xPercent: 0.27, yOffset: -45, w: 135, multiplier: 1.0, color: '#b91c1c', glowColor: 'rgba(185, 28, 28, 0.4)', distanceTier: 'NEAR' },
        { name: 'DEEP DEPRESSION', code: 'BRAVO', xPercent: 0.52, yOffset: 18, w: 110, multiplier: 2.0, color: '#ef4444', glowColor: 'rgba(239, 68, 68, 0.4)', distanceTier: 'MID' },
        { name: 'ALFEI LEDGE', code: 'CHARLIE', xPercent: 0.76, yOffset: -38, w: 90, multiplier: 3.5, color: '#f87171', glowColor: 'rgba(248, 113, 113, 0.4)', distanceTier: 'FAR' },
        { name: 'HELLAS SANCTUARY', code: 'OMEGA', xPercent: 0.94, yOffset: -65, w: 70, multiplier: 5.0, color: '#7f1d1d', glowColor: 'rgba(127, 29, 29, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.16, 0.39, 0.64, 0.85],
      terrainOctaves: { baseAmp: 104, w1Freq: 2.9, w1Amp: 94, w2Freq: 5.9, w2Amp: 52, w3Freq: 11.3, w3Amp: 27 },
    },
    {
      id: 7,
      planetId: 'mars',
      name: 'CYDONIA MENSAE',
      era: 'STAGE 4: SENSOR CRT GLITCH',
      retrogressionShort: 'SENSOR GLITCH',
      themeColor: '#991b1b',
      hudStyle: 'eighties',
      mapType: 'Mesa Plain with Anomalies',
      description: 'Eroded mesas and enigmatic buttes. Tactical radar is permanently offline, screens suffer electromagnetic static noise.',
      degradedAvionics: ['Tactical Radar PERMANENTLY OFFLINE', 'Target Compass Offline', 'Fuel: 120L'],
      worldWidth: 4050,
      worldHeight: 1480,
      windSpeed: 36,
      hazardCount: 10,
      fuelCapacity: 120,
      pads: [
        { name: 'MENSA PLATFORM', code: 'ALPHA', xPercent: 0.15, yOffset: 45, w: 130, multiplier: 1.0, color: '#991b1b', glowColor: 'rgba(153, 27, 27, 0.4)', distanceTier: 'NEAR' },
        { name: 'FACE CRAG', code: 'BRAVO', xPercent: 0.38, yOffset: -30, w: 105, multiplier: 2.0, color: '#dc2626', glowColor: 'rgba(220, 38, 38, 0.4)', distanceTier: 'MID' },
        { name: 'PYRAMID CREST', code: 'CHARLIE', xPercent: 0.64, yOffset: 38, w: 85, multiplier: 3.5, color: '#ef4444', glowColor: 'rgba(239, 68, 68, 0.4)', distanceTier: 'FAR' },
        { name: 'CYDONIA MONOLITH', code: 'OMEGA', xPercent: 0.85, yOffset: -35, w: 65, multiplier: 5.0, color: '#450a0a', glowColor: 'rgba(69, 10, 10, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.26, 0.51, 0.75, 0.95],
      terrainOctaves: { baseAmp: 110, w1Freq: 3.1, w1Amp: 100, w2Freq: 6.2, w2Amp: 56, w3Freq: 11.9, w3Amp: 29 },
    },
    {
      id: 8,
      planetId: 'mars',
      name: 'ARCADIA PLANITIA',
      era: 'STAGE 4: ANALOG GAUGES',
      retrogressionShort: 'ANALOG GAUGES',
      themeColor: '#78350f',
      hudStyle: 'apollo',
      mapType: 'Volcanic Plains & Lava Flows',
      description: 'Smooth volcanic flows crossed by subsurface ice sheets. Digital speedometers are dead; fuel gauge is replaced by a mechanical needle with physical inertia.',
      degradedAvionics: ['Digital Speedometers OFFLINE', 'Mechanical Damped Fuel Needle Active', 'Fuel: 115L'],
      worldWidth: 4150,
      worldHeight: 1500,
      windSpeed: 40,
      hazardCount: 11,
      fuelCapacity: 115,
      pads: [
        { name: 'ARCADIA BASE', code: 'ALPHA', xPercent: 0.31, yOffset: -18, w: 125, multiplier: 1.0, color: '#78350f', glowColor: 'rgba(120, 53, 15, 0.4)', distanceTier: 'NEAR' },
        { name: 'ICE FLOW', code: 'BRAVO', xPercent: 0.56, yOffset: 34, w: 100, multiplier: 2.0, color: '#92400e', glowColor: 'rgba(146, 64, 14, 0.4)', distanceTier: 'MID' },
        { name: 'FROST DIKE', code: 'CHARLIE', xPercent: 0.78, yOffset: -42, w: 80, multiplier: 3.5, color: '#b45309', glowColor: 'rgba(180, 83, 9, 0.4)', distanceTier: 'FAR' },
        { name: 'ARCADIA TERMINUS', code: 'OMEGA', xPercent: 0.95, yOffset: 28, w: 60, multiplier: 5.0, color: '#d97706', glowColor: 'rgba(217, 119, 6, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.19, 0.43, 0.67, 0.87],
      terrainOctaves: { baseAmp: 116, w1Freq: 3.3, w1Amp: 106, w2Freq: 6.5, w2Amp: 60, w3Freq: 12.5, w3Amp: 31 },
    },
    {
      id: 9,
      planetId: 'mars',
      name: 'CERBERUS FOSSAE',
      era: 'STAGE 5: OPTICAL SENSOR DECAY',
      retrogressionShort: '75% BLIND',
      themeColor: '#450a0a',
      hudStyle: 'apollo',
      mapType: 'Recent Tectonic Fissure',
      description: 'Active young tectonic rifts that recently spewed lava and volcanic gases. Cockpit viewscreen is 75% blinded by thick red atmospheric haze and electromagnetic noise.',
      degradedAvionics: ['Viewscreen: 75% BLIND (Red static fog)', 'Acoustic Sonar Flight Mode', 'Fuel: 110L'],
      worldWidth: 4300,
      worldHeight: 1500,
      windSpeed: 44,
      hazardCount: 12,
      fuelCapacity: 110,
      pads: [
        { name: 'FOSSAE SHELF', code: 'ALPHA', xPercent: 0.22, yOffset: -48, w: 120, multiplier: 1.0, color: '#450a0a', glowColor: 'rgba(69, 10, 10, 0.4)', distanceTier: 'NEAR' },
        { name: 'MAGMA CRACK', code: 'BRAVO', xPercent: 0.47, yOffset: 42, w: 95, multiplier: 2.0, color: '#7f1d1d', glowColor: 'rgba(127, 29, 29, 0.4)', distanceTier: 'MID' },
        { name: 'TECTONIC APEX', code: 'CHARLIE', xPercent: 0.71, yOffset: -32, w: 75, multiplier: 3.5, color: '#991b1b', glowColor: 'rgba(153, 27, 27, 0.4)', distanceTier: 'FAR' },
        { name: 'CERBERUS SPIRE', code: 'OMEGA', xPercent: 0.89, yOffset: -58, w: 55, multiplier: 5.0, color: '#b91c1c', glowColor: 'rgba(185, 28, 28, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.34, 0.59, 0.80],
      terrainOctaves: { baseAmp: 122, w1Freq: 3.5, w1Amp: 112, w2Freq: 6.9, w2Amp: 64, w3Freq: 13.2, w3Amp: 33 },
    },
    {
      id: 10,
      planetId: 'mars',
      name: 'ELYSIUM PLANITIA ABYSS',
      era: 'STAGE 5: TOTAL SENSORY BLACKOUT',
      retrogressionShort: 'BLIND BLACKOUT',
      themeColor: '#ef4444',
      hudStyle: 'blackout',
      mapType: 'Volcanic Dust Blackout',
      description: 'A global dust storm creates complete sensory blackout. All flight instruments are dead. Pilot must touch down purely by acoustic sonar frequency sweeps.',
      degradedAvionics: ['ALL INSTRUMENTS OFFLINE', 'Optical Sensors: 95% BLIND', 'Acoustic Sonar Flight ACTIVE', 'Maximum Hazard Density'],
      worldWidth: 4450,
      worldHeight: 1520,
      windSpeed: 48,
      hazardCount: 14,
      fuelCapacity: 100,
      pads: [
        { name: 'ARES OUTPOST', code: 'ALPHA', xPercent: 0.28, yOffset: 24, w: 110, multiplier: 1.0, color: '#ef4444', glowColor: 'rgba(239, 68, 68, 0.4)', distanceTier: 'NEAR' },
        { name: 'RED CHASM', code: 'BRAVO', xPercent: 0.54, yOffset: -54, w: 85, multiplier: 2.0, color: '#f87171', glowColor: 'rgba(248, 113, 113, 0.4)', distanceTier: 'MID' },
        { name: 'ELYSIUM RIDGE', code: 'CHARLIE', xPercent: 0.77, yOffset: 38, w: 70, multiplier: 3.5, color: '#dc2626', glowColor: 'rgba(220, 38, 38, 0.4)', distanceTier: 'FAR' },
        { name: 'MARS BLACKOUT', code: 'OMEGA', xPercent: 0.96, yOffset: -70, w: 55, multiplier: 5.0, color: '#991b1b', glowColor: 'rgba(153, 27, 27, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.17, 0.41, 0.65, 0.87],
      terrainOctaves: { baseAmp: 128, w1Freq: 3.6, w1Amp: 118, w2Freq: 7.1, w2Amp: 68, w3Freq: 13.8, w3Amp: 35 },
    },
  ],

  // =========================================================================
  // PLANET 3: VENUS (Cytherea) - 10 Progressive Maps
  // Topography: Crushing sulfuric calderas, razor tectonic tesserae, molten spires.
  // Completely unique pad layouts and extreme elevation cliffs!
  // =========================================================================
  venus: [
    {
      id: 1,
      planetId: 'venus',
      name: 'APHRODITE TERRA',
      era: 'STAGE 1: FULL GLASS COCKPIT',
      retrogressionShort: 'FULL AVIONICS',
      themeColor: '#eab308',
      hudStyle: 'modern',
      mapType: 'Highland Crustal Plateau',
      description: 'The largest highland region on Venus. Wide volcanic shelf pads allow pilots to acclimate to heavy 68 px/s² gravity with full glass cockpit aids.',
      degradedAvionics: ['100% Avionics Nominal — Dotted Trajectory & Radar Online', '180L Auxiliary Tanks Active'],
      worldWidth: 3500,
      worldHeight: 1440,
      windSpeed: 6,
      hazardCount: 4,
      fuelCapacity: 180,
      pads: [
        { name: 'APHRODITE SHELF', code: 'ALPHA', xPercent: 0.15, yOffset: -22, w: 160, multiplier: 1.0, color: '#eab308', glowColor: 'rgba(234, 179, 8, 0.4)', distanceTier: 'NEAR' },
        { name: 'CYTHEREA BASE', code: 'BRAVO', xPercent: 0.40, yOffset: 42, w: 135, multiplier: 2.0, color: '#facc15', glowColor: 'rgba(250, 204, 21, 0.4)', distanceTier: 'MID' },
        { name: 'SULFUR CREST', code: 'CHARLIE', xPercent: 0.63, yOffset: -48, w: 115, multiplier: 3.5, color: '#ca8a04', glowColor: 'rgba(202, 138, 4, 0.4)', distanceTier: 'FAR' },
        { name: 'GOLDEN CALDERA', code: 'OMEGA', xPercent: 0.85, yOffset: 32, w: 95, multiplier: 5.0, color: '#ea580c', glowColor: 'rgba(234, 88, 12, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.27, 0.51, 0.74, 0.94],
      terrainOctaves: { baseAmp: 76, w1Freq: 2.2, w1Amp: 66, w2Freq: 5.2, w2Amp: 34, w3Freq: 9.4, w3Amp: 18 },
    },
    {
      id: 2,
      planetId: 'venus',
      name: 'ISHTAR PLATEAU',
      era: 'STAGE 1: TELEMETRY DRIFT',
      retrogressionShort: 'ACID GALE DRIFT',
      themeColor: '#ca8a04',
      hudStyle: 'modern',
      mapType: 'Dense Atmosphere Lowlands',
      description: 'A northern highland plateau covered in thick yellow-green cloud deck. Heavy atmospheric drag and lateral gusts challenge descent vector tracking.',
      degradedAvionics: ['Sulfuric Acid Gale Shear (14 px/s)', 'Fuel Reserve: 165L'],
      worldWidth: 3600,
      worldHeight: 1440,
      windSpeed: 14,
      hazardCount: 5,
      fuelCapacity: 165,
      pads: [
        { name: 'LAKSHMI SHELF', code: 'ALPHA', xPercent: 0.31, yOffset: 38, w: 155, multiplier: 1.0, color: '#ca8a04', glowColor: 'rgba(202, 138, 4, 0.4)', distanceTier: 'NEAR' },
        { name: 'ISHTAR ROOST', code: 'BRAVO', xPercent: 0.55, yOffset: -24, w: 130, multiplier: 2.0, color: '#eab308', glowColor: 'rgba(234, 179, 8, 0.4)', distanceTier: 'MID' },
        { name: 'MAXWELL CREST', code: 'CHARLIE', xPercent: 0.77, yOffset: 48, w: 110, multiplier: 3.5, color: '#a16207', glowColor: 'rgba(161, 98, 7, 0.4)', distanceTier: 'FAR' },
        { name: 'ISHTAR MONOLITH', code: 'OMEGA', xPercent: 0.94, yOffset: -38, w: 90, multiplier: 5.0, color: '#c2410c', glowColor: 'rgba(194, 65, 12, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.19, 0.43, 0.66, 0.86],
      terrainOctaves: { baseAmp: 80, w1Freq: 2.4, w1Amp: 70, w2Freq: 5.2, w2Amp: 38, w3Freq: 9.3, w3Amp: 20 },
    },
    {
      id: 3,
      planetId: 'venus',
      name: 'BETA REGIO',
      era: 'STAGE 2: VECTOR PIP OFFLINE',
      retrogressionShort: 'NO VECTOR PIP',
      themeColor: '#a16207',
      hudStyle: 'modern-nopip',
      mapType: 'Volcanic Rift Highlands',
      description: 'A volcanic highland dominated by the massive Theia Mons shield. Velocity vector pip is stripped; manage high vertical descent speed purely by instruments.',
      degradedAvionics: ['Velocity Vector Pip DECOMMISSIONED', 'Fuel Restricted to 150L'],
      worldWidth: 3700,
      worldHeight: 1460,
      windSpeed: 20,
      hazardCount: 6,
      fuelCapacity: 150,
      pads: [
        { name: 'THEIA FLANK', code: 'ALPHA', xPercent: 0.19, yOffset: -32, w: 150, multiplier: 1.0, color: '#a16207', glowColor: 'rgba(161, 98, 7, 0.4)', distanceTier: 'NEAR' },
        { name: 'DEVANA CHASM', code: 'BRAVO', xPercent: 0.47, yOffset: 28, w: 125, multiplier: 2.0, color: '#ca8a04', glowColor: 'rgba(202, 138, 4, 0.4)', distanceTier: 'MID' },
        { name: 'RHEA PINNACLE', code: 'CHARLIE', xPercent: 0.72, yOffset: -48, w: 105, multiplier: 3.5, color: '#ea580c', glowColor: 'rgba(234, 88, 12, 0.4)', distanceTier: 'FAR' },
        { name: 'BETA OMEGA', code: 'OMEGA', xPercent: 0.90, yOffset: 34, w: 85, multiplier: 5.0, color: '#b45309', glowColor: 'rgba(180, 83, 9, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.33, 0.60, 0.81],
      terrainOctaves: { baseAmp: 88, w1Freq: 2.6, w1Amp: 78, w2Freq: 5.4, w2Amp: 42, w3Freq: 10.2, w3Amp: 22 },
    },
    {
      id: 4,
      planetId: 'venus',
      name: 'MAAT MONS CALDERA',
      era: 'STAGE 2: PREDICTOR OFFLINE',
      retrogressionShort: 'NO PREDICTOR',
      themeColor: '#854d0e',
      hudStyle: 'y2k',
      mapType: 'Highest Active Volcano',
      description: 'The highest volcano on Venus, rising 8 kilometers. Live trajectory predictor arc is offline; pilots must judge steep parabolic arcs amidst acidic thermal currents.',
      degradedAvionics: ['Trajectory Predictor DECOMMISSIONED', 'Crosswinds: 26 px/s • Fuel: 140L'],
      worldWidth: 3800,
      worldHeight: 1460,
      windSpeed: 26,
      hazardCount: 7,
      fuelCapacity: 140,
      pads: [
        { name: 'MAAT CRATER', code: 'ALPHA', xPercent: 0.24, yOffset: 44, w: 145, multiplier: 1.0, color: '#854d0e', glowColor: 'rgba(133, 77, 14, 0.4)', distanceTier: 'NEAR' },
        { name: 'CALDERA ABYSS', code: 'BRAVO', xPercent: 0.50, yOffset: -58, w: 120, multiplier: 2.0, color: '#b45309', glowColor: 'rgba(180, 83, 9, 0.4)', distanceTier: 'MID' },
        { name: 'LAVA RIDGE', code: 'CHARLIE', xPercent: 0.75, yOffset: 22, w: 100, multiplier: 3.5, color: '#d97706', glowColor: 'rgba(217, 119, 6, 0.4)', distanceTier: 'FAR' },
        { name: 'MAAT PEAK', code: 'OMEGA', xPercent: 0.93, yOffset: -52, w: 80, multiplier: 5.0, color: '#dc2626', glowColor: 'rgba(220, 38, 38, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.14, 0.37, 0.62, 0.84],
      terrainOctaves: { baseAmp: 95, w1Freq: 2.7, w1Amp: 85, w2Freq: 5.6, w2Amp: 46, w3Freq: 10.6, w3Amp: 24 },
    },
    {
      id: 5,
      planetId: 'venus',
      name: 'LAKSHMI PLANUM',
      era: 'STAGE 3: RADAR STROBE DECAY',
      retrogressionShort: 'RADAR STROBE',
      themeColor: '#713f12',
      hudStyle: 'y2k',
      mapType: 'Elevated Lava Plateau',
      description: 'An elevated smooth volcanic plateau ringed by intensely deformed mountain chains. Radar sweep degrades to a periodic 2-second pulse strobe.',
      degradedAvionics: ['Continuous Radar Sweep DEGRADED (2s pulse strobe)', 'Crosswinds: 30 px/s • Fuel: 130L'],
      worldWidth: 3900,
      worldHeight: 1480,
      windSpeed: 30,
      hazardCount: 8,
      fuelCapacity: 130,
      pads: [
        { name: 'LAKSHMI PLAIN', code: 'ALPHA', xPercent: 0.14, yOffset: -28, w: 140, multiplier: 1.0, color: '#713f12', glowColor: 'rgba(113, 63, 18, 0.4)', distanceTier: 'NEAR' },
        { name: 'VOLCANIC DOME', code: 'BRAVO', xPercent: 0.39, yOffset: 32, w: 115, multiplier: 2.0, color: '#a16207', glowColor: 'rgba(161, 98, 7, 0.4)', distanceTier: 'MID' },
        { name: 'DANU SPUR', code: 'CHARLIE', xPercent: 0.65, yOffset: -38, w: 95, multiplier: 3.5, color: '#c2410c', glowColor: 'rgba(194, 65, 12, 0.4)', distanceTier: 'FAR' },
        { name: 'LAKSHMI OMEGA', code: 'OMEGA', xPercent: 0.88, yOffset: 48, w: 75, multiplier: 5.0, color: '#ea580c', glowColor: 'rgba(234, 88, 12, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.26, 0.52, 0.76, 0.96],
      terrainOctaves: { baseAmp: 102, w1Freq: 2.9, w1Amp: 92, w2Freq: 5.8, w2Amp: 50, w3Freq: 11.1, w3Amp: 26 },
    },
    {
      id: 6,
      planetId: 'venus',
      name: 'ARTEMIS CORONA',
      era: 'STAGE 3: ALTIMETER OFFLINE',
      retrogressionShort: 'AUDIO ALTIMETER',
      themeColor: '#ea580c',
      hudStyle: 'eighties',
      mapType: 'Massive Circular Fracture',
      description: 'The largest corona feature on Venus, 2,600 km in diameter, encircled by deep tectonic rift trenches. Laser altimeter dead; listen for acoustic altitude chirps.',
      degradedAvionics: ['Digital Numeric Altimeter DECOMMISSIONED', 'Acoustic Ground Proximity Audio Active', 'Fuel: 125L'],
      worldWidth: 4000,
      worldHeight: 1480,
      windSpeed: 34,
      hazardCount: 9,
      fuelCapacity: 125,
      pads: [
        { name: 'CORONA RING', code: 'ALPHA', xPercent: 0.28, yOffset: 22, w: 135, multiplier: 1.0, color: '#ea580c', glowColor: 'rgba(234, 88, 12, 0.4)', distanceTier: 'NEAR' },
        { name: 'ARTEMIS CHASM', code: 'BRAVO', xPercent: 0.53, yOffset: -64, w: 110, multiplier: 2.0, color: '#f97316', glowColor: 'rgba(249, 115, 22, 0.4)', distanceTier: 'MID' },
        { name: 'FAULT CREST', code: 'CHARLIE', xPercent: 0.77, yOffset: 38, w: 90, multiplier: 3.5, color: '#fb923c', glowColor: 'rgba(251, 146, 60, 0.4)', distanceTier: 'FAR' },
        { name: 'CORONA SANCTUARY', code: 'OMEGA', xPercent: 0.95, yOffset: -48, w: 70, multiplier: 5.0, color: '#dc2626', glowColor: 'rgba(220, 38, 38, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.18, 0.41, 0.65, 0.86],
      terrainOctaves: { baseAmp: 108, w1Freq: 3.0, w1Amp: 98, w2Freq: 6.0, w2Amp: 54, w3Freq: 11.6, w3Amp: 28 },
    },
    {
      id: 7,
      planetId: 'venus',
      name: 'OVDA REGIO TESSERA',
      era: 'STAGE 4: SENSOR CRT GLITCH',
      retrogressionShort: 'SENSOR GLITCH',
      themeColor: '#c2410c',
      hudStyle: 'eighties',
      mapType: 'Intersecting Ridge Tesserae',
      description: 'Extremely rugged tessera terrain featuring complex intersecting faults, ridges, and graben. Radar is permanently offline, screens glitch with acid fog interference.',
      degradedAvionics: ['Tactical Radar PERMANENTLY OFFLINE', 'Target Compass Offline', 'Fuel: 120L'],
      worldWidth: 4100,
      worldHeight: 1500,
      windSpeed: 38,
      hazardCount: 10,
      fuelCapacity: 120,
      pads: [
        { name: 'TESSERA BENCH', code: 'ALPHA', xPercent: 0.17, yOffset: 48, w: 130, multiplier: 1.0, color: '#c2410c', glowColor: 'rgba(194, 65, 12, 0.4)', distanceTier: 'NEAR' },
        { name: 'GRABEN FLOOR', code: 'BRAVO', xPercent: 0.43, yOffset: -42, w: 105, multiplier: 2.0, color: '#ea580c', glowColor: 'rgba(234, 88, 12, 0.4)', distanceTier: 'MID' },
        { name: 'OVDA APEX', code: 'CHARLIE', xPercent: 0.68, yOffset: 32, w: 85, multiplier: 3.5, color: '#f97316', glowColor: 'rgba(249, 115, 22, 0.4)', distanceTier: 'FAR' },
        { name: 'TESSERA CHASM', code: 'OMEGA', xPercent: 0.89, yOffset: -68, w: 65, multiplier: 5.0, color: '#7c2d12', glowColor: 'rgba(124, 45, 18, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.30, 0.55, 0.79],
      terrainOctaves: { baseAmp: 114, w1Freq: 3.2, w1Amp: 104, w2Freq: 6.3, w2Amp: 58, w3Freq: 12.1, w3Amp: 30 },
    },
    {
      id: 8,
      planetId: 'venus',
      name: 'SAPAS MONS LAVA TUBES',
      era: 'STAGE 4: ANALOG GAUGES',
      retrogressionShort: 'ANALOG GAUGES',
      themeColor: '#9a3412',
      hudStyle: 'apollo',
      mapType: 'Radiating Molten Lava Lobes',
      description: 'An isolated volcano flanked by double-peaked summit calderas and hundreds of solidified lava tubes. Speedometers dead; mechanical fuel needle lags with momentum.',
      degradedAvionics: ['Digital Speedometers OFFLINE', 'Mechanical Damped Fuel Needle Active', 'Fuel: 115L'],
      worldWidth: 4200,
      worldHeight: 1500,
      windSpeed: 42,
      hazardCount: 11,
      fuelCapacity: 115,
      pads: [
        { name: 'SAPAS BASE', code: 'ALPHA', xPercent: 0.33, yOffset: -38, w: 125, multiplier: 1.0, color: '#9a3412', glowColor: 'rgba(154, 52, 18, 0.4)', distanceTier: 'NEAR' },
        { name: 'LOBE TERRACE', code: 'BRAVO', xPercent: 0.59, yOffset: 44, w: 100, multiplier: 2.0, color: '#c2410c', glowColor: 'rgba(194, 65, 12, 0.4)', distanceTier: 'MID' },
        { name: 'SUMMIT HORN', code: 'CHARLIE', xPercent: 0.81, yOffset: -54, w: 80, multiplier: 3.5, color: '#ea580c', glowColor: 'rgba(234, 88, 12, 0.4)', distanceTier: 'FAR' },
        { name: 'SAPAS APEX', code: 'OMEGA', xPercent: 0.96, yOffset: 22, w: 60, multiplier: 5.0, color: '#ef4444', glowColor: 'rgba(239, 68, 68, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.21, 0.46, 0.70, 0.89],
      terrainOctaves: { baseAmp: 120, w1Freq: 3.4, w1Amp: 110, w2Freq: 6.6, w2Amp: 62, w3Freq: 12.8, w3Amp: 32 },
    },
    {
      id: 9,
      planetId: 'venus',
      name: 'DIANA CHASMA',
      era: 'STAGE 5: OPTICAL SENSOR DECAY',
      retrogressionShort: '75% BLIND',
      themeColor: '#7c2d12',
      hudStyle: 'apollo',
      mapType: 'Deep Acid Rift Trench',
      description: 'One of the deepest chasms on Venus, dropping nearly 3 km below the mean planetary radius. Blinding sulfuric acid cloud fog obscures 75% of viewscreen.',
      degradedAvionics: ['Viewscreen: 75% BLIND (Acid cloud fog)', 'Acoustic Sonar Flight Mode', 'Fuel: 110L'],
      worldWidth: 4350,
      worldHeight: 1520,
      windSpeed: 45,
      hazardCount: 12,
      fuelCapacity: 110,
      pads: [
        { name: 'CHASMA RIM', code: 'ALPHA', xPercent: 0.22, yOffset: 32, w: 120, multiplier: 1.0, color: '#7c2d12', glowColor: 'rgba(124, 45, 18, 0.4)', distanceTier: 'NEAR' },
        { name: 'ACID CHASM', code: 'BRAVO', xPercent: 0.48, yOffset: -72, w: 95, multiplier: 2.0, color: '#9a3412', glowColor: 'rgba(154, 52, 18, 0.4)', distanceTier: 'MID' },
        { name: 'FAULT PRECIPICE', code: 'CHARLIE', xPercent: 0.73, yOffset: 48, w: 75, multiplier: 3.5, color: '#c2410c', glowColor: 'rgba(194, 65, 12, 0.4)', distanceTier: 'FAR' },
        { name: 'DIANA MONOLITH', code: 'OMEGA', xPercent: 0.91, yOffset: -64, w: 55, multiplier: 5.0, color: '#ea580c', glowColor: 'rgba(234, 88, 12, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.35, 0.60, 0.82],
      terrainOctaves: { baseAmp: 126, w1Freq: 3.6, w1Amp: 116, w2Freq: 7.0, w2Amp: 66, w3Freq: 13.5, w3Amp: 34 },
    },
    {
      id: 10,
      planetId: 'venus',
      name: 'TARTARUS COLLES BLACKOUT',
      era: 'STAGE 5: TOTAL SENSORY BLACKOUT',
      retrogressionShort: 'BLIND BLACKOUT',
      themeColor: '#ef4444',
      hudStyle: 'blackout',
      mapType: 'Scorched Acidic Void',
      description: 'The ultimate trial: crushing 90 atmospheres, 470°C heat, and total sensory blackout. All flight screens are dead. Touch down on acoustic sonar pitch alone.',
      degradedAvionics: ['ALL INSTRUMENTS OFFLINE', 'Optical Sensors: 95% BLIND', 'Acoustic Sonar Flight ACTIVE', 'Maximum Hazard Density'],
      worldWidth: 4500,
      worldHeight: 1540,
      windSpeed: 48,
      hazardCount: 14,
      fuelCapacity: 100,
      pads: [
        { name: 'INFERNO OUTPOST', code: 'ALPHA', xPercent: 0.16, yOffset: -45, w: 110, multiplier: 1.0, color: '#ef4444', glowColor: 'rgba(239, 68, 68, 0.4)', distanceTier: 'NEAR' },
        { name: 'SULFUR ABYSS', code: 'BRAVO', xPercent: 0.42, yOffset: 55, w: 85, multiplier: 2.0, color: '#f87171', glowColor: 'rgba(248, 113, 113, 0.4)', distanceTier: 'MID' },
        { name: 'SONAR ROOST', code: 'CHARLIE', xPercent: 0.66, yOffset: -68, w: 70, multiplier: 3.5, color: '#dc2626', glowColor: 'rgba(220, 38, 38, 0.4)', distanceTier: 'FAR' },
        { name: 'CYTHEREAN VOID', code: 'OMEGA', xPercent: 0.88, yOffset: -78, w: 55, multiplier: 5.0, color: '#b91c1c', glowColor: 'rgba(185, 28, 28, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.29, 0.54, 0.77, 0.96],
      terrainOctaves: { baseAmp: 130, w1Freq: 3.7, w1Amp: 120, w2Freq: 7.2, w2Amp: 70, w3Freq: 14.0, w3Amp: 36 },
    },
  ],
};

// Default export of lunar maps for full backwards compatibility
export const LEVELS: LevelConfig[] = LEVELS_BY_PLANET.moon;

/**
 * Retrieves level/map configuration.
 * Supports:
 * - getLevel(planetId, levelId)
 * - getLevel(levelId) -> defaults to moon
 */
export function getLevel(planetOrId: PlanetId | number, maybeLevelId?: number): LevelConfig {
  let planet: PlanetId = 'moon';
  let levelId = 1;

  if (typeof planetOrId === 'string') {
    planet = planetOrId;
    levelId = maybeLevelId !== undefined ? maybeLevelId : 1;
  } else if (typeof planetOrId === 'number') {
    levelId = planetOrId;
  }

  const planetLevels = LEVELS_BY_PLANET[planet] || LEVELS_BY_PLANET.moon;
  const index = Math.max(0, Math.min(planetLevels.length - 1, levelId - 1));
  return planetLevels[index];
}

export type PlanetProgression = Record<PlanetId, number>;

const PROGRESSION_STORAGE_KEY = 'retrograde_descent_unlocked_levels_v1';

export const DEFAULT_PROGRESSION: PlanetProgression = {
  moon: 1,
  mars: 1,
  venus: 1,
};

/**
 * Loads unlocked levels per planet from localStorage.
 * Defaults to Level 1 unlocked for all planets.
 */
export function getUnlockedLevels(): PlanetProgression {
  try {
    const raw = localStorage.getItem(PROGRESSION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        moon: Math.max(1, Math.min(10, Number(parsed.moon) || 1)),
        mars: Math.max(1, Math.min(10, Number(parsed.mars) || 1)),
        venus: Math.max(1, Math.min(10, Number(parsed.venus) || 1)),
      };
    }
  } catch {
    // fallback
  }
  return {...DEFAULT_PROGRESSION};
}

/**
 * Unlocks the next level upon successful touchdown on completedLevel.
 */
export function unlockNextLevel(planetId: PlanetId, completedLevel: number): PlanetProgression {
  const current = getUnlockedLevels();
  const nextLevel = Math.min(10, completedLevel + 1);
  if (nextLevel > current[planetId]) {
    current[planetId] = nextLevel;
    try {
      localStorage.setItem(PROGRESSION_STORAGE_KEY, JSON.stringify(current));
    } catch {
      // ignore
    }
  }
  return current;
}

/**
 * Resets campaign progression to Level 1 for all planets.
 */
export function resetProgression(): PlanetProgression {
  try {
    localStorage.removeItem(PROGRESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
  return {...DEFAULT_PROGRESSION};
}
