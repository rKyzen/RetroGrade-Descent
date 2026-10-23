/**
 * @fileoverview Planetary Worlds & 10-Level Retrogression Engine for Retrograde Descent.
 *
 * CELESTIAL WORLDS:
 * 1. THE MOON (Luna) - Low gravity (36 px/s^2), vacuum space backdrop, basalt terrain.
 * 2. MARS (Ares) - Medium gravity (52 px/s^2), red dust squalls, iron-oxide canyons.
 * 3. VENUS (Cytherea) - Heavy gravity (68 px/s^2), crushing sulfuric atmosphere, scorched basalt.
 *
 * RETROGRESSION FLOW (LEVELS 1 - 10):
 * With each subsequent map, avionics progressively degrade across 10 strictly calibrated steps:
 * - Level 1: STAGE 1 (Full Glass Cockpit) — Dotted trajectory predictor, velocity pip, tactical radar.
 * - Level 2: STAGE 1 (Telemetry Drift) — Crosswind drift active, auxiliary fuel tanks disengaged.
 * - Level 3: STAGE 2 (Vector Pip Offline) — Velocity vector reticle stripped; fly by raw numbers.
 * - Level 4: STAGE 2 (Predictor Stripped) — Dotted trajectory line and touchdown reticle offline.
 * - Level 5: STAGE 3 (Radar Strobe Decay) — Radar sweep degrades to low-frequency strobe pulses.
 * - Level 6: STAGE 3 (Digital Altimeter Dead) — Numeric altitude blanked; acoustic proximity beeps active.
 * - Level 7: STAGE 4 (Sensor Glitch & Static) — CRT screen static glitches; radar minimap offline.
 * - Level 8: STAGE 4 (Analog Fallback) — Digital telemetry dead; mechanical damped needle (~300ms lag).
 * - Level 9: STAGE 5 (75% Optical Failure) — Optical static covers cockpit; audio sonar chirps amplify.
 * - Level 10: STAGE 5 (Total Sensory Blackout) — 95% blackout; pilot lands purely by acoustic sonar audio pings.
 */

export type PlanetId = 'moon' | 'mars' | 'venus';

export interface PlanetDef {
  id: PlanetId;
  name: string;
  subname: string;
  gravity: number; // px/s^2
  mainThrust: number; // px/s^2 (scaled to maintain crisp thrust-to-weight authority)
  atmospherePressure: string;
  atmosphereDensity: number; // drag factor for physical drift
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
  activeFeatures: string[];
  pilotWarning: string;
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
    activeFeatures: [
      'Live Dotted Trajectory Predictor Arc',
      'Velocity Vector Pip (Directional Marker)',
      'Touchdown Alignment Reticle',
      'Tactical Radar Minimap (High Refresh)',
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
      'Auxiliary Fuel Pods Jettisoned (Standard 165L Tank)',
      'Atmospheric Wind Sensor Calibration Active',
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
      'Directional Velocity Vector Pip OFFLINE',
      'Fuel Capacity Reduced to 150L',
    ],
    activeFeatures: [
      'Live Dotted Trajectory Arc',
      'Tactical Radar Minimap',
      'Digital Telemetry HUD (Numeric Vx / Vy)',
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
      'Continuous Radar Sweep DEGRADED (Pulses every 2.0 seconds)',
      'Fuel Capacity Restricted to 130L',
    ],
    activeFeatures: [
      'Periodic Strobe Radar Pulse',
      'Digital Altimeter & Speedometers',
      'Micrometeorite Collision Warning',
    ],
    pilotWarning: 'Radar sensor capacitors degrading. Terrain topography and platform blips update in periodic pulses.',
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
      'Tactical Radar Minimap PERMANENTLY OFFLINE',
      'Speedometer Displays Suffer CRT Static Flickering',
      'Fuel Capacity Restricted to 120L',
    ],
    activeFeatures: [
      'Analog Compass Bearing Needle',
      'Acoustic Proximity Audio Audio',
      'Emergency Strobe Beacon',
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
      'Digital Speedometers OFFLINE',
      'Integrated Flight Computer Power Cut',
      'Fuel Capacity Restricted to 115L',
    ],
    activeFeatures: [
      'Mechanical Damped Fuel Needle (~300ms physical lag)',
      'Audio Altitude & Drift Chirps',
      'Visual Sonar Accessibility Wave',
    ],
    pilotWarning: 'Silicon avionics dead. Mechanical fuel needle suffers mechanical damping lag. High hazard density.',
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
      'Cockpit Optical Sensors 75% BLIND (Opaque static fog)',
      'Mechanical Gauges Unlit',
      'Fuel Restricted to 110L',
    ],
    activeFeatures: [
      'Acoustic Sonar Frequency Pitch (200Hz - 1200Hz)',
      'Emergency Landing Pad Strobe Glow',
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
    icon: '⬛',
    hudStyle: 'blackout',
    fuelCapacity: 100,
    windSpeed: 46,
    hazardCount: 14,
    avionicsStatus: '100% Instrument Blackout',
    decommissioned: [
      'ALL GLASS & DIGITAL INSTRUMENTS DEAD',
      'Optical Viewscreen 95% BLIND',
      'Minimal Emergency Fuel: 100L',
      'Maximum Atmospheric & Debris Turbulence',
    ],
    activeFeatures: [
      'Acoustic Sonar Flight Pitch (Tone sweeps higher as altitude closes)',
      'Visual Sonar Pulse Ring (Auditory Accessibility)',
    ],
    pilotWarning: 'Total sensory blackout. The ultimate test of piloting intuition. Land purely by sound.',
  },
];

export interface LandingPadDef {
  name: string;
  code: string;
  xPercent: number; // 0..1 ratio of world width
  yOffset: number; // offset relative to baseline padY
  w: number; // platform width in px
  multiplier: number;
  color: string;
  glowColor: string;
  distanceTier: 'NEAR' | 'MID' | 'FAR' | 'EXTREME';
}

export interface LevelConfig {
  id: number;
  planetId: PlanetId;
  name: string; // The Map Name
  era: string; // The Retrogression Stage
  retrogressionShort: string; // Short badge for map selector
  themeColor: string;
  hudStyle: 'modern' | 'modern-nopip' | 'y2k' | 'eighties' | 'apollo' | 'blackout';
  mapType: string;
  description: string;
  degradedAvionics: string[];
  worldWidth: number;
  worldHeight: number;
  windSpeed: number; // px/s lateral turbulence
  hazardCount: number; // micrometeorites / orbital debris count
  fuelCapacity: number; // starting fuel liters
  pads: LandingPadDef[];
  cragPositions: number[]; // x ratios for basalt obstacles
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
  // ==========================================
  // PLANET 1: THE MOON (10 Levels)
  // ==========================================
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
      degradedAvionics: ['All systems 100% nominal — Live Dotted Trajectory Active', 'Auxiliary High-Capacity Fuel Tanks Online (180L)'],
      worldWidth: 3400,
      worldHeight: 1400,
      windSpeed: 0,
      hazardCount: 4,
      fuelCapacity: 180,
      pads: [
        { name: 'ALPHA BASE', code: 'ALPHA', xPercent: 0.22, yOffset: 0, w: 160, multiplier: 1.0, color: '#10b981', glowColor: 'rgba(16, 185, 129, 0.4)', distanceTier: 'NEAR' },
        { name: 'BRAVO OUTPOST', code: 'BRAVO', xPercent: 0.46, yOffset: -14, w: 135, multiplier: 2.0, color: '#38bdf8', glowColor: 'rgba(56, 189, 248, 0.4)', distanceTier: 'MID' },
        { name: 'CHARLIE CREST', code: 'CHARLIE', xPercent: 0.70, yOffset: 12, w: 115, multiplier: 3.5, color: '#f59e0b', glowColor: 'rgba(245, 158, 11, 0.4)', distanceTier: 'FAR' },
        { name: 'OMEGA SANCTUARY', code: 'OMEGA', xPercent: 0.90, yOffset: -20, w: 95, multiplier: 5.0, color: '#ec4899', glowColor: 'rgba(236, 72, 153, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.34, 0.40, 0.58, 0.64, 0.81, 0.86],
      terrainOctaves: { baseAmp: 70, w1Freq: 2, w1Amp: 60, w2Freq: 5, w2Amp: 30, w3Freq: 9, w3Amp: 16 },
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
        { name: 'PROCELLARUM PLAINS', code: 'ALPHA', xPercent: 0.20, yOffset: 5, w: 155, multiplier: 1.0, color: '#06b6d4', glowColor: 'rgba(6, 182, 212, 0.4)', distanceTier: 'NEAR' },
        { name: 'STORM GAP', code: 'BRAVO', xPercent: 0.44, yOffset: -25, w: 130, multiplier: 2.0, color: '#38bdf8', glowColor: 'rgba(56, 189, 248, 0.4)', distanceTier: 'MID' },
        { name: 'CRATER RIM', code: 'CHARLIE', xPercent: 0.68, yOffset: 18, w: 110, multiplier: 3.5, color: '#a855f7', glowColor: 'rgba(168, 85, 247, 0.4)', distanceTier: 'FAR' },
        { name: 'OCEANUS MONOLITH', code: 'OMEGA', xPercent: 0.91, yOffset: -30, w: 90, multiplier: 5.0, color: '#f43f5e', glowColor: 'rgba(244, 63, 94, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.31, 0.38, 0.54, 0.61, 0.78, 0.85],
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
      degradedAvionics: ['Velocity Vector Pip OFFLINE', 'Raw Telemetry & Momentum Intuition Required'],
      worldWidth: 3600,
      worldHeight: 1420,
      windSpeed: 15,
      hazardCount: 6,
      fuelCapacity: 150,
      pads: [
        { name: 'TYCHO RIDGE', code: 'ALPHA', xPercent: 0.23, yOffset: -8, w: 150, multiplier: 1.0, color: '#3b82f6', glowColor: 'rgba(59, 130, 246, 0.4)', distanceTier: 'NEAR' },
        { name: 'CENTRAL PEAK', code: 'BRAVO', xPercent: 0.47, yOffset: 15, w: 125, multiplier: 2.0, color: '#10b981', glowColor: 'rgba(16, 185, 129, 0.4)', distanceTier: 'MID' },
        { name: 'RAY CREST', code: 'CHARLIE', xPercent: 0.71, yOffset: -22, w: 105, multiplier: 3.5, color: '#f59e0b', glowColor: 'rgba(245, 158, 11, 0.4)', distanceTier: 'FAR' },
        { name: 'ZENITH SPIRE', code: 'OMEGA', xPercent: 0.89, yOffset: 25, w: 85, multiplier: 5.0, color: '#ec4899', glowColor: 'rgba(236, 72, 153, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.33, 0.39, 0.57, 0.63, 0.80, 0.84],
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
      degradedAvionics: ['Trajectory Predictor DECOMMISSIONED', 'Landing Guidance Reticle OFFLINE', 'Crosswinds: 20 px/s'],
      worldWidth: 3700,
      worldHeight: 1420,
      windSpeed: 20,
      hazardCount: 7,
      fuelCapacity: 140,
      pads: [
        { name: 'CANYON SHELF', code: 'ALPHA', xPercent: 0.21, yOffset: 10, w: 145, multiplier: 1.0, color: '#22c55e', glowColor: 'rgba(34, 197, 94, 0.4)', distanceTier: 'NEAR' },
        { name: 'BASALT ROOST', code: 'BRAVO', xPercent: 0.45, yOffset: -18, w: 120, multiplier: 2.0, color: '#06b6d4', glowColor: 'rgba(6, 182, 212, 0.4)', distanceTier: 'MID' },
        { name: 'GORGE PASS', code: 'CHARLIE', xPercent: 0.69, yOffset: 12, w: 100, multiplier: 3.5, color: '#eab308', glowColor: 'rgba(234, 179, 8, 0.4)', distanceTier: 'FAR' },
        { name: 'SANCTUARY APEX', code: 'OMEGA', xPercent: 0.92, yOffset: -28, w: 80, multiplier: 5.0, color: '#ef4444', glowColor: 'rgba(239, 68, 68, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.30, 0.36, 0.52, 0.60, 0.77, 0.86],
      terrainOctaves: { baseAmp: 88, w1Freq: 2.5, w1Amp: 78, w2Freq: 5.4, w2Amp: 42, w3Freq: 10.2, w3Amp: 22 },
    },
    {
      id: 5,
      planetId: 'moon',
      name: 'FRA MAURO CRATERS',
      era: 'STAGE 3: RADAR STROBE',
      retrogressionShort: 'RADAR STROBE',
      themeColor: '#84cc16',
      hudStyle: 'y2k',
      mapType: 'Volcanic Calderas',
      description: 'Uneven volcanic ejecta and crater fields. Tactical radar refresh rate degrades to low-frequency strobe pulses with increased debris activity.',
      degradedAvionics: ['Real-Time Radar Degraded to Low-Freq Strobe', 'Crosswinds: 25 px/s • Fuel Reduced to 130L'],
      worldWidth: 3800,
      worldHeight: 1450,
      windSpeed: 25,
      hazardCount: 8,
      fuelCapacity: 130,
      pads: [
        { name: 'CALDERA RIM', code: 'ALPHA', xPercent: 0.22, yOffset: -12, w: 140, multiplier: 1.0, color: '#84cc16', glowColor: 'rgba(132, 204, 22, 0.4)', distanceTier: 'NEAR' },
        { name: 'FRA MAURO PERCH', code: 'BRAVO', xPercent: 0.48, yOffset: 20, w: 115, multiplier: 2.0, color: '#38bdf8', glowColor: 'rgba(56, 189, 248, 0.4)', distanceTier: 'MID' },
        { name: 'BASALT VALLEY', code: 'CHARLIE', xPercent: 0.72, yOffset: -15, w: 95, multiplier: 3.5, color: '#f59e0b', glowColor: 'rgba(245, 158, 11, 0.4)', distanceTier: 'FAR' },
        { name: 'EJECTA PINNACLE', code: 'OMEGA', xPercent: 0.90, yOffset: 30, w: 75, multiplier: 5.0, color: '#ec4899', glowColor: 'rgba(236, 72, 153, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.32, 0.37, 0.55, 0.62, 0.79, 0.85],
      terrainOctaves: { baseAmp: 94, w1Freq: 2.6, w1Amp: 84, w2Freq: 5.7, w2Amp: 46, w3Freq: 11.0, w3Amp: 24 },
    },
    {
      id: 6,
      planetId: 'moon',
      name: 'SINUS IRIDUM',
      era: 'STAGE 3: ALTIMETER OFFLINE',
      retrogressionShort: 'AUDIO ALTIMETER',
      themeColor: '#f59e0b',
      hudStyle: 'eighties',
      mapType: 'Bay of Rainbows Cliffline',
      description: 'Towering semi-circular crater walls overlooking smooth basalt seas. Digital altimeters are dead; pilots must rely on audio proximity chirps.',
      degradedAvionics: ['Digital Altimeter OFFLINE', 'Acoustic Proximity Chirps ACTIVE', 'Severe Crosswinds: 30 px/s'],
      worldWidth: 3900,
      worldHeight: 1460,
      windSpeed: 30,
      hazardCount: 9,
      fuelCapacity: 125,
      pads: [
        { name: 'IRIDUM PLAINS', code: 'ALPHA', xPercent: 0.20, yOffset: 14, w: 135, multiplier: 1.0, color: '#f59e0b', glowColor: 'rgba(245, 158, 11, 0.4)', distanceTier: 'NEAR' },
        { name: 'CLIFF PERCH', code: 'BRAVO', xPercent: 0.46, yOffset: -22, w: 110, multiplier: 2.0, color: '#eab308', glowColor: 'rgba(234, 179, 8, 0.4)', distanceTier: 'MID' },
        { name: 'PROMONTORIUM', code: 'CHARLIE', xPercent: 0.70, yOffset: 16, w: 90, multiplier: 3.5, color: '#ea580c', glowColor: 'rgba(234, 88, 12, 0.4)', distanceTier: 'FAR' },
        { name: 'RAINBOW APEX', code: 'OMEGA', xPercent: 0.91, yOffset: -35, w: 70, multiplier: 5.0, color: '#ef4444', glowColor: 'rgba(239, 68, 68, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.29, 0.35, 0.53, 0.61, 0.78, 0.87],
      terrainOctaves: { baseAmp: 100, w1Freq: 2.8, w1Amp: 90, w2Freq: 6.0, w2Amp: 50, w3Freq: 11.5, w3Amp: 26 },
    },
    {
      id: 7,
      planetId: 'moon',
      name: 'APENNINE CRAGS',
      era: 'STAGE 4: SENSORS FLICKERING',
      retrogressionShort: 'SENSOR GLITCH',
      themeColor: '#ea580c',
      hudStyle: 'eighties',
      mapType: 'Mountain Spire Trench',
      description: 'Lunar mountain peaks rising over 4,000 meters. Cockpit instruments flicker with CRT static; narrow plateaus are bordered by razor-sharp crags.',
      degradedAvionics: ['Speedometers Glitching & Flickering', 'Heavy Volcanic Spire Obstacles', 'Crosswinds: 35 px/s'],
      worldWidth: 4000,
      worldHeight: 1480,
      windSpeed: 35,
      hazardCount: 10,
      fuelCapacity: 120,
      pads: [
        { name: 'APENNINE VALLEY', code: 'ALPHA', xPercent: 0.23, yOffset: -18, w: 130, multiplier: 1.0, color: '#ea580c', glowColor: 'rgba(234, 88, 12, 0.4)', distanceTier: 'NEAR' },
        { name: 'SPIRE CREST', code: 'BRAVO', xPercent: 0.47, yOffset: 24, w: 105, multiplier: 2.0, color: '#f59e0b', glowColor: 'rgba(245, 158, 11, 0.4)', distanceTier: 'MID' },
        { name: 'MONS HUYGENS', code: 'CHARLIE', xPercent: 0.71, yOffset: -28, w: 85, multiplier: 3.5, color: '#f43f5e', glowColor: 'rgba(244, 63, 94, 0.4)', distanceTier: 'FAR' },
        { name: 'APEX PINNACLE', code: 'OMEGA', xPercent: 0.89, yOffset: 32, w: 68, multiplier: 5.0, color: '#a855f7', glowColor: 'rgba(168, 85, 247, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.31, 0.38, 0.56, 0.63, 0.80, 0.84],
      terrainOctaves: { baseAmp: 106, w1Freq: 3.0, w1Amp: 96, w2Freq: 6.3, w2Amp: 54, w3Freq: 12.0, w3Amp: 28 },
    },
    {
      id: 8,
      planetId: 'moon',
      name: 'CLAVIUS CHASM',
      era: 'STAGE 4: ANALOG GAUGES',
      retrogressionShort: 'ANALOG GAUGES',
      themeColor: '#94a3b8',
      hudStyle: 'apollo',
      mapType: 'Ancient Crater Floor',
      description: 'One of the oldest and largest lunar craters, scarred by secondary impacts. Digital telemetry is dead; fuel needle is damped with mechanical lag.',
      degradedAvionics: ['Digital Speedometers OFFLINE', 'Mechanical Damped Fuel Gauge Active (~300ms lag)', 'High Micrometeorite Density'],
      worldWidth: 4100,
      worldHeight: 1500,
      windSpeed: 38,
      hazardCount: 11,
      fuelCapacity: 115,
      pads: [
        { name: 'CLAVIUS BASE', code: 'ALPHA', xPercent: 0.21, yOffset: 12, w: 125, multiplier: 1.0, color: '#94a3b8', glowColor: 'rgba(148, 163, 184, 0.4)', distanceTier: 'NEAR' },
        { name: 'RUTHERFURD RIM', code: 'BRAVO', xPercent: 0.45, yOffset: -20, w: 100, multiplier: 2.0, color: '#cbd5e1', glowColor: 'rgba(203, 213, 225, 0.4)', distanceTier: 'MID' },
        { name: 'PORTER CHASM', code: 'CHARLIE', xPercent: 0.69, yOffset: 25, w: 80, multiplier: 3.5, color: '#f59e0b', glowColor: 'rgba(245, 158, 11, 0.4)', distanceTier: 'FAR' },
        { name: 'DEEP ABYSS', code: 'OMEGA', xPercent: 0.92, yOffset: -32, w: 65, multiplier: 5.0, color: '#ef4444', glowColor: 'rgba(239, 68, 68, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.28, 0.34, 0.51, 0.59, 0.76, 0.85],
      terrainOctaves: { baseAmp: 112, w1Freq: 3.1, w1Amp: 102, w2Freq: 6.5, w2Amp: 58, w3Freq: 12.5, w3Amp: 30 },
    },
    {
      id: 9,
      planetId: 'moon',
      name: 'DARK SIDE TRENCH',
      era: 'STAGE 5: DIMMED OPTICS',
      retrogressionShort: '70% BLIND',
      themeColor: '#f43f5e',
      hudStyle: 'apollo',
      mapType: 'Lunar Far Side Ravine',
      description: 'Far side lunar corridor enveloped in heavy shadow. Cockpit optical sensors dimmed by 75%; intense crosswinds buffet the lander over sheer drops.',
      degradedAvionics: ['Optical Sensors: 75% DIMMED', 'Severe Crosswinds: 42 px/s', 'Fuel Restricted to 110L'],
      worldWidth: 4200,
      worldHeight: 1500,
      windSpeed: 42,
      hazardCount: 12,
      fuelCapacity: 110,
      pads: [
        { name: 'FARSIDE PASS', code: 'ALPHA', xPercent: 0.22, yOffset: -16, w: 120, multiplier: 1.0, color: '#f43f5e', glowColor: 'rgba(244, 63, 94, 0.4)', distanceTier: 'NEAR' },
        { name: 'SHADOW GORGE', code: 'BRAVO', xPercent: 0.46, yOffset: 28, w: 95, multiplier: 2.0, color: '#fb7185', glowColor: 'rgba(251, 113, 133, 0.4)', distanceTier: 'MID' },
        { name: 'DARK CHASM', code: 'CHARLIE', xPercent: 0.70, yOffset: -25, w: 75, multiplier: 3.5, color: '#e11d48', glowColor: 'rgba(225, 29, 72, 0.4)', distanceTier: 'FAR' },
        { name: 'GAGARIN ABYSS', code: 'OMEGA', xPercent: 0.90, yOffset: 35, w: 60, multiplier: 5.0, color: '#be123c', glowColor: 'rgba(190, 18, 60, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.30, 0.36, 0.54, 0.62, 0.78, 0.86],
      terrainOctaves: { baseAmp: 118, w1Freq: 3.3, w1Amp: 108, w2Freq: 6.8, w2Amp: 62, w3Freq: 13.0, w3Amp: 32 },
    },
    {
      id: 10,
      planetId: 'moon',
      name: 'THE VOID GAUNTLET',
      era: 'STAGE 5: SENSORY BLACKOUT',
      retrogressionShort: 'BLIND BLACKOUT',
      themeColor: '#ef4444',
      hudStyle: 'blackout',
      mapType: 'Deep Void Rift',
      description: 'Total optical darkness. All glass cockpit instruments are dead. Pilot must navigate purely by acoustic sonar audio chirps (200Hz - 1200Hz) to touch down safely.',
      degradedAvionics: ['ALL INSTRUMENTS OFFLINE', 'Optical Sensors: 95% BLIND', 'Acoustic Sonar Flight ACTIVE', 'Maximum Hazard Density'],
      worldWidth: 4400,
      worldHeight: 1520,
      windSpeed: 46,
      hazardCount: 14,
      fuelCapacity: 100,
      pads: [
        { name: 'VOID OUTPOST', code: 'ALPHA', xPercent: 0.20, yOffset: 20, w: 110, multiplier: 1.0, color: '#ef4444', glowColor: 'rgba(239, 68, 68, 0.4)', distanceTier: 'NEAR' },
        { name: 'DARK CHASM', code: 'BRAVO', xPercent: 0.44, yOffset: -30, w: 85, multiplier: 2.0, color: '#f87171', glowColor: 'rgba(248, 113, 113, 0.4)', distanceTier: 'MID' },
        { name: 'SONAR CREST', code: 'CHARLIE', xPercent: 0.68, yOffset: 26, w: 70, multiplier: 3.5, color: '#dc2626', glowColor: 'rgba(220, 38, 38, 0.4)', distanceTier: 'FAR' },
        { name: 'OMEGA BLACKOUT', code: 'OMEGA', xPercent: 0.91, yOffset: -40, w: 55, multiplier: 5.0, color: '#b91c1c', glowColor: 'rgba(185, 28, 28, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.28, 0.35, 0.52, 0.60, 0.77, 0.86],
      terrainOctaves: { baseAmp: 125, w1Freq: 3.5, w1Amp: 115, w2Freq: 7.0, w2Amp: 66, w3Freq: 13.5, w3Amp: 34 },
    },
  ],

  // ==========================================
  // PLANET 2: MARS (10 Levels)
  // ==========================================
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
        { name: 'VIKING SITE 1', code: 'ALPHA', xPercent: 0.22, yOffset: 2, w: 160, multiplier: 1.0, color: '#f97316', glowColor: 'rgba(249, 115, 22, 0.4)', distanceTier: 'NEAR' },
        { name: 'GOLDEN BASIN', code: 'BRAVO', xPercent: 0.46, yOffset: -12, w: 135, multiplier: 2.0, color: '#fb923c', glowColor: 'rgba(251, 146, 60, 0.4)', distanceTier: 'MID' },
        { name: 'ARES STRATA', code: 'CHARLIE', xPercent: 0.70, yOffset: 16, w: 115, multiplier: 3.5, color: '#ea580c', glowColor: 'rgba(234, 88, 12, 0.4)', distanceTier: 'FAR' },
        { name: 'RED SANCTUARY', code: 'OMEGA', xPercent: 0.90, yOffset: -22, w: 95, multiplier: 5.0, color: '#ef4444', glowColor: 'rgba(239, 68, 68, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.33, 0.41, 0.57, 0.65, 0.80, 0.87],
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
        { name: 'UTOPIA STATION', code: 'ALPHA', xPercent: 0.21, yOffset: 8, w: 155, multiplier: 1.0, color: '#ea580c', glowColor: 'rgba(234, 88, 12, 0.4)', distanceTier: 'NEAR' },
        { name: 'FROST SHELF', code: 'BRAVO', xPercent: 0.45, yOffset: -22, w: 130, multiplier: 2.0, color: '#f97316', glowColor: 'rgba(249, 115, 22, 0.4)', distanceTier: 'MID' },
        { name: 'POLYGON RIM', code: 'CHARLIE', xPercent: 0.69, yOffset: 15, w: 110, multiplier: 3.5, color: '#c2410c', glowColor: 'rgba(194, 65, 12, 0.4)', distanceTier: 'FAR' },
        { name: 'UTOPIA DOME', code: 'OMEGA', xPercent: 0.91, yOffset: -28, w: 90, multiplier: 5.0, color: '#dc2626', glowColor: 'rgba(220, 38, 38, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.32, 0.39, 0.55, 0.62, 0.79, 0.86],
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
        { name: 'LABYRINTH GATE', code: 'ALPHA', xPercent: 0.22, yOffset: -10, w: 150, multiplier: 1.0, color: '#c2410c', glowColor: 'rgba(194, 65, 12, 0.4)', distanceTier: 'NEAR' },
        { name: 'VALLEY FORK', code: 'BRAVO', xPercent: 0.47, yOffset: 18, w: 125, multiplier: 2.0, color: '#ea580c', glowColor: 'rgba(234, 88, 12, 0.4)', distanceTier: 'MID' },
        { name: 'SHADOW BLUFF', code: 'CHARLIE', xPercent: 0.71, yOffset: -20, w: 105, multiplier: 3.5, color: '#e11d48', glowColor: 'rgba(225, 29, 72, 0.4)', distanceTier: 'FAR' },
        { name: 'NOCTIS MONOLITH', code: 'OMEGA', xPercent: 0.90, yOffset: 26, w: 85, multiplier: 5.0, color: '#be123c', glowColor: 'rgba(190, 18, 60, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.31, 0.38, 0.56, 0.63, 0.81, 0.87],
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
        { name: 'MARINER CLIFF', code: 'ALPHA', xPercent: 0.20, yOffset: 12, w: 145, multiplier: 1.0, color: '#b45309', glowColor: 'rgba(180, 83, 9, 0.4)', distanceTier: 'NEAR' },
        { name: 'CANYON FLOOR', code: 'BRAVO', xPercent: 0.45, yOffset: -18, w: 120, multiplier: 2.0, color: '#ea580c', glowColor: 'rgba(234, 88, 12, 0.4)', distanceTier: 'MID' },
        { name: 'ECHUS CHASM', code: 'CHARLIE', xPercent: 0.69, yOffset: 14, w: 100, multiplier: 3.5, color: '#f59e0b', glowColor: 'rgba(245, 158, 11, 0.4)', distanceTier: 'FAR' },
        { name: 'MARINERIS APEX', code: 'OMEGA', xPercent: 0.92, yOffset: -32, w: 80, multiplier: 5.0, color: '#ef4444', glowColor: 'rgba(239, 68, 68, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.29, 0.36, 0.53, 0.61, 0.78, 0.85],
      terrainOctaves: { baseAmp: 92, w1Freq: 2.6, w1Amp: 82, w2Freq: 5.6, w2Amp: 44, w3Freq: 10.4, w3Amp: 23 },
    },
    {
      id: 5,
      planetId: 'mars',
      name: 'OLYMPUS CALDERA',
      era: 'STAGE 3: RADAR STROBE',
      retrogressionShort: 'RADAR STROBE',
      themeColor: '#d97706',
      hudStyle: 'y2k',
      mapType: 'Volcanic Shield Summit',
      description: 'The crowning caldera of Olympus Mons, 22 kilometers above datum. Radar strobe decay challenges situational awareness amidst falling volcanic tephra.',
      degradedAvionics: ['Radar Degraded to Strobe Pulses', 'Crosswinds: 28 px/s • Fuel: 130L'],
      worldWidth: 3850,
      worldHeight: 1460,
      windSpeed: 28,
      hazardCount: 8,
      fuelCapacity: 130,
      pads: [
        { name: 'SUMMIT CREST', code: 'ALPHA', xPercent: 0.23, yOffset: -14, w: 140, multiplier: 1.0, color: '#d97706', glowColor: 'rgba(217, 119, 6, 0.4)', distanceTier: 'NEAR' },
        { name: 'CALDERA SHELF', code: 'BRAVO', xPercent: 0.48, yOffset: 22, w: 115, multiplier: 2.0, color: '#ea580c', glowColor: 'rgba(234, 88, 12, 0.4)', distanceTier: 'MID' },
        { name: 'BASALT PLUG', code: 'CHARLIE', xPercent: 0.72, yOffset: -18, w: 95, multiplier: 3.5, color: '#dc2626', glowColor: 'rgba(220, 38, 38, 0.4)', distanceTier: 'FAR' },
        { name: 'OLYMPUS ZENITH', code: 'OMEGA', xPercent: 0.90, yOffset: 34, w: 75, multiplier: 5.0, color: '#b91c1c', glowColor: 'rgba(185, 28, 28, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.32, 0.37, 0.54, 0.62, 0.80, 0.86],
      terrainOctaves: { baseAmp: 98, w1Freq: 2.7, w1Amp: 88, w2Freq: 5.8, w2Amp: 48, w3Freq: 11.2, w3Amp: 25 },
    },
    {
      id: 6,
      planetId: 'mars',
      name: 'HELLAS BASIN',
      era: 'STAGE 3: ALTIMETER OFFLINE',
      retrogressionShort: 'AUDIO ALTIMETER',
      themeColor: '#e11d48',
      hudStyle: 'eighties',
      mapType: 'Dense Atmosphere Sink',
      description: 'The deepest impact basin on Mars where atmospheric pressure is highest. Digital altimeter fails; listen to rising audio sonar chirps as the ground rushes up.',
      degradedAvionics: ['Digital Altimeter OFFLINE', 'Acoustic Proximity Chirps ACTIVE', 'Crosswinds: 32 px/s'],
      worldWidth: 3950,
      worldHeight: 1480,
      windSpeed: 32,
      hazardCount: 9,
      fuelCapacity: 125,
      pads: [
        { name: 'HELLAS RIM', code: 'ALPHA', xPercent: 0.20, yOffset: 16, w: 135, multiplier: 1.0, color: '#e11d48', glowColor: 'rgba(225, 29, 72, 0.4)', distanceTier: 'NEAR' },
        { name: 'SINK FLOOR', code: 'BRAVO', xPercent: 0.46, yOffset: -24, w: 110, multiplier: 2.0, color: '#f43f5e', glowColor: 'rgba(244, 63, 94, 0.4)', distanceTier: 'MID' },
        { name: 'ALFEIOS RIDGE', code: 'CHARLIE', xPercent: 0.70, yOffset: 18, w: 90, multiplier: 3.5, color: '#ea580c', glowColor: 'rgba(234, 88, 12, 0.4)', distanceTier: 'FAR' },
        { name: 'ABYSS ROOST', code: 'OMEGA', xPercent: 0.91, yOffset: -38, w: 70, multiplier: 5.0, color: '#be123c', glowColor: 'rgba(190, 18, 60, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.30, 0.36, 0.53, 0.61, 0.78, 0.87],
      terrainOctaves: { baseAmp: 104, w1Freq: 2.9, w1Amp: 94, w2Freq: 6.1, w2Amp: 52, w3Freq: 11.8, w3Amp: 27 },
    },
    {
      id: 7,
      planetId: 'mars',
      name: 'CERBERUS FOSSAE',
      era: 'STAGE 4: SENSORS FLICKERING',
      retrogressionShort: 'SENSOR GLITCH',
      themeColor: '#c026d3',
      hudStyle: 'eighties',
      mapType: 'Fissure Fault Crags',
      description: 'Recent tectonic fissures that cut across volcanic plains. Radar is completely dark and cockpit screens flicker with CRT electrostatic interference.',
      degradedAvionics: ['Radar Minimap OFFLINE', 'Speedometer CRT Static Glitching', 'Crosswinds: 38 px/s'],
      worldWidth: 4050,
      worldHeight: 1490,
      windSpeed: 38,
      hazardCount: 10,
      fuelCapacity: 120,
      pads: [
        { name: 'FOSSAE SHELF', code: 'ALPHA', xPercent: 0.23, yOffset: -18, w: 130, multiplier: 1.0, color: '#c026d3', glowColor: 'rgba(192, 38, 211, 0.4)', distanceTier: 'NEAR' },
        { name: 'FISSURE GAP', code: 'BRAVO', xPercent: 0.47, yOffset: 26, w: 105, multiplier: 2.0, color: '#e879f9', glowColor: 'rgba(232, 121, 249, 0.4)', distanceTier: 'MID' },
        { name: 'CERBERUS CREST', code: 'CHARLIE', xPercent: 0.71, yOffset: -30, w: 85, multiplier: 3.5, color: '#ea580c', glowColor: 'rgba(234, 88, 12, 0.4)', distanceTier: 'FAR' },
        { name: 'TECTONIC PINNACLE', code: 'OMEGA', xPercent: 0.89, yOffset: 35, w: 68, multiplier: 5.0, color: '#9333ea', glowColor: 'rgba(147, 51, 234, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.31, 0.38, 0.55, 0.63, 0.80, 0.85],
      terrainOctaves: { baseAmp: 110, w1Freq: 3.1, w1Amp: 100, w2Freq: 6.4, w2Amp: 56, w3Freq: 12.2, w3Amp: 29 },
    },
    {
      id: 8,
      planetId: 'mars',
      name: 'CYDONIA MONOLITHS',
      era: 'STAGE 4: ANALOG GAUGES',
      retrogressionShort: 'ANALOG GAUGES',
      themeColor: '#78716c',
      hudStyle: 'apollo',
      mapType: 'Mesa & Butte Fields',
      description: 'Enigmatic rock formations and eroded mesas. Digital instruments are dead; pilot manages descent with a lagged mechanical fuel needle.',
      degradedAvionics: ['Digital Speedometers OFFLINE', 'Mechanical Damped Fuel Needle Active (~300ms lag)', 'Fuel: 115L'],
      worldWidth: 4150,
      worldHeight: 1510,
      windSpeed: 42,
      hazardCount: 11,
      fuelCapacity: 115,
      pads: [
        { name: 'CYDONIA MESA', code: 'ALPHA', xPercent: 0.21, yOffset: 14, w: 125, multiplier: 1.0, color: '#78716c', glowColor: 'rgba(120, 113, 108, 0.4)', distanceTier: 'NEAR' },
        { name: 'FACE PLATEAU', code: 'BRAVO', xPercent: 0.45, yOffset: -22, w: 100, multiplier: 2.0, color: '#a8a29e', glowColor: 'rgba(168, 162, 158, 0.4)', distanceTier: 'MID' },
        { name: 'PYRAMID PASS', code: 'CHARLIE', xPercent: 0.69, yOffset: 28, w: 80, multiplier: 3.5, color: '#f59e0b', glowColor: 'rgba(245, 158, 11, 0.4)', distanceTier: 'FAR' },
        { name: 'ANCIENT ABYSS', code: 'OMEGA', xPercent: 0.92, yOffset: -35, w: 65, multiplier: 5.0, color: '#dc2626', glowColor: 'rgba(220, 38, 38, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.28, 0.35, 0.52, 0.60, 0.77, 0.86],
      terrainOctaves: { baseAmp: 116, w1Freq: 3.2, w1Amp: 106, w2Freq: 6.6, w2Amp: 60, w3Freq: 12.8, w3Amp: 31 },
    },
    {
      id: 9,
      planetId: 'mars',
      name: 'ELYSIUM DUST ABYSS',
      era: 'STAGE 5: DIMMED OPTICS',
      retrogressionShort: '75% BLIND',
      themeColor: '#f43f5e',
      hudStyle: 'apollo',
      mapType: 'Raging Dust Chasm',
      description: 'A blinding planet-wide dust storm engulfs Elysium Planitia. Cockpit view is 75% shrouded in swirling red static; acoustic sonar is essential.',
      degradedAvionics: ['Optical Sensors: 75% BLIND', 'Severe Crosswinds: 45 px/s', 'Fuel Restricted to 110L'],
      worldWidth: 4250,
      worldHeight: 1520,
      windSpeed: 45,
      hazardCount: 13,
      fuelCapacity: 110,
      pads: [
        { name: 'ELYSIUM SHELF', code: 'ALPHA', xPercent: 0.22, yOffset: -18, w: 120, multiplier: 1.0, color: '#f43f5e', glowColor: 'rgba(244, 63, 94, 0.4)', distanceTier: 'NEAR' },
        { name: 'DUST PASS', code: 'BRAVO', xPercent: 0.46, yOffset: 30, w: 95, multiplier: 2.0, color: '#fb7185', glowColor: 'rgba(251, 113, 133, 0.4)', distanceTier: 'MID' },
        { name: 'RED CHASM', code: 'CHARLIE', xPercent: 0.70, yOffset: -28, w: 75, multiplier: 3.5, color: '#e11d48', glowColor: 'rgba(225, 29, 72, 0.4)', distanceTier: 'FAR' },
        { name: 'HURRICANE PINNACLE', code: 'OMEGA', xPercent: 0.90, yOffset: 38, w: 60, multiplier: 5.0, color: '#be123c', glowColor: 'rgba(190, 18, 60, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.29, 0.36, 0.54, 0.62, 0.79, 0.86],
      terrainOctaves: { baseAmp: 122, w1Freq: 3.4, w1Amp: 112, w2Freq: 6.9, w2Amp: 64, w3Freq: 13.2, w3Amp: 33 },
    },
    {
      id: 10,
      planetId: 'mars',
      name: 'ARES APEX GAUNTLET',
      era: 'STAGE 5: SENSORY BLACKOUT',
      retrogressionShort: 'BLIND BLACKOUT',
      themeColor: '#ef4444',
      hudStyle: 'blackout',
      mapType: 'Martian Void Gauntlet',
      description: 'Zero optical visibility. All flight computers dead. Pilot must manage Mars 52 px/s² gravity purely through sonar audio feedback.',
      degradedAvionics: ['ALL INSTRUMENTS OFFLINE', 'Optical Sensors: 95% BLIND', 'Acoustic Sonar Navigation ACTIVE', 'Maximum Gravity & Dust Hazards'],
      worldWidth: 4450,
      worldHeight: 1530,
      windSpeed: 48,
      hazardCount: 14,
      fuelCapacity: 100,
      pads: [
        { name: 'ARES OUTPOST', code: 'ALPHA', xPercent: 0.20, yOffset: 22, w: 110, multiplier: 1.0, color: '#ef4444', glowColor: 'rgba(239, 68, 68, 0.4)', distanceTier: 'NEAR' },
        { name: 'RED CALAMITY', code: 'BRAVO', xPercent: 0.44, yOffset: -32, w: 85, multiplier: 2.0, color: '#f87171', glowColor: 'rgba(248, 113, 113, 0.4)', distanceTier: 'MID' },
        { name: 'SONAR PERCH', code: 'CHARLIE', xPercent: 0.68, yOffset: 28, w: 70, multiplier: 3.5, color: '#dc2626', glowColor: 'rgba(220, 38, 38, 0.4)', distanceTier: 'FAR' },
        { name: 'ARES CALDERA', code: 'OMEGA', xPercent: 0.91, yOffset: -42, w: 55, multiplier: 5.0, color: '#b91c1c', glowColor: 'rgba(185, 28, 28, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.27, 0.35, 0.52, 0.60, 0.77, 0.86],
      terrainOctaves: { baseAmp: 128, w1Freq: 3.6, w1Amp: 118, w2Freq: 7.1, w2Amp: 68, w3Freq: 13.8, w3Amp: 35 },
    },
  ],

  // ==========================================
  // PLANET 3: VENUS (10 Levels)
  // ==========================================
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
      description: 'The largest highland region on Venus. Wide basalt pads allow pilots to acclimate to heavy 68 px/s² gravity with full glass cockpit aids.',
      degradedAvionics: ['100% Avionics Nominal — Dotted Trajectory & Radar Online', '180L Auxiliary Tanks Active'],
      worldWidth: 3500,
      worldHeight: 1440,
      windSpeed: 6,
      hazardCount: 4,
      fuelCapacity: 180,
      pads: [
        { name: 'APHRODITE SHELF', code: 'ALPHA', xPercent: 0.22, yOffset: 0, w: 160, multiplier: 1.0, color: '#eab308', glowColor: 'rgba(234, 179, 8, 0.4)', distanceTier: 'NEAR' },
        { name: 'CYTHEREA BASE', code: 'BRAVO', xPercent: 0.46, yOffset: -14, w: 135, multiplier: 2.0, color: '#facc15', glowColor: 'rgba(250, 204, 21, 0.4)', distanceTier: 'MID' },
        { name: 'SULFUR CREST', code: 'CHARLIE', xPercent: 0.70, yOffset: 14, w: 115, multiplier: 3.5, color: '#ca8a04', glowColor: 'rgba(202, 138, 4, 0.4)', distanceTier: 'FAR' },
        { name: 'GOLDEN CALDERA', code: 'OMEGA', xPercent: 0.90, yOffset: -24, w: 95, multiplier: 5.0, color: '#ea580c', glowColor: 'rgba(234, 88, 12, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.34, 0.42, 0.58, 0.66, 0.81, 0.88],
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
      degradedAvionics: ['Atmospheric Gale Crosswinds (14 px/s)', 'Fuel Capacity: 165L'],
      worldWidth: 3600,
      worldHeight: 1440,
      windSpeed: 14,
      hazardCount: 5,
      fuelCapacity: 165,
      pads: [
        { name: 'ISHTAR PLAINS', code: 'ALPHA', xPercent: 0.20, yOffset: 6, w: 155, multiplier: 1.0, color: '#ca8a04', glowColor: 'rgba(202, 138, 4, 0.4)', distanceTier: 'NEAR' },
        { name: 'ACID BASIN', code: 'BRAVO', xPercent: 0.44, yOffset: -24, w: 130, multiplier: 2.0, color: '#eab308', glowColor: 'rgba(234, 179, 8, 0.4)', distanceTier: 'MID' },
        { name: 'LAKSHMI EDGE', code: 'CHARLIE', xPercent: 0.68, yOffset: 16, w: 110, multiplier: 3.5, color: '#a16207', glowColor: 'rgba(161, 98, 7, 0.4)', distanceTier: 'FAR' },
        { name: 'CYTHEREAN DOME', code: 'OMEGA', xPercent: 0.91, yOffset: -30, w: 90, multiplier: 5.0, color: '#f97316', glowColor: 'rgba(249, 115, 22, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.31, 0.38, 0.54, 0.62, 0.79, 0.86],
      terrainOctaves: { baseAmp: 82, w1Freq: 2.4, w1Amp: 72, w2Freq: 5.1, w2Amp: 38, w3Freq: 9.3, w3Amp: 20 },
    },
    {
      id: 3,
      planetId: 'venus',
      name: 'MAXWELL MONTES',
      era: 'STAGE 2: VECTOR PIP OFFLINE',
      retrogressionShort: 'NO VECTOR PIP',
      themeColor: '#a16207',
      hudStyle: 'modern-nopip',
      mapType: 'Metallic Radar Ridge',
      description: 'The highest mountain range on Venus, towering 11 kilometers. Metallic pyrite snow covers the peaks; vector pip is offline, requiring raw instrument flight.',
      degradedAvionics: ['Velocity Vector Pip OFFLINE', 'Fuel Restricted to 150L'],
      worldWidth: 3700,
      worldHeight: 1460,
      windSpeed: 20,
      hazardCount: 6,
      fuelCapacity: 150,
      pads: [
        { name: 'MAXWELL SHELF', code: 'ALPHA', xPercent: 0.23, yOffset: -12, w: 150, multiplier: 1.0, color: '#a16207', glowColor: 'rgba(161, 98, 7, 0.4)', distanceTier: 'NEAR' },
        { name: 'PYRITE PASS', code: 'BRAVO', xPercent: 0.47, yOffset: 20, w: 125, multiplier: 2.0, color: '#ca8a04', glowColor: 'rgba(202, 138, 4, 0.4)', distanceTier: 'MID' },
        { name: 'MONTES SPIRE', code: 'CHARLIE', xPercent: 0.71, yOffset: -24, w: 105, multiplier: 3.5, color: '#eab308', glowColor: 'rgba(234, 179, 8, 0.4)', distanceTier: 'FAR' },
        { name: 'MAXWELL APEX', code: 'OMEGA', xPercent: 0.89, yOffset: 28, w: 85, multiplier: 5.0, color: '#ef4444', glowColor: 'rgba(239, 68, 68, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.32, 0.39, 0.57, 0.64, 0.81, 0.87],
      terrainOctaves: { baseAmp: 88, w1Freq: 2.6, w1Amp: 78, w2Freq: 5.4, w2Amp: 42, w3Freq: 10.2, w3Amp: 22 },
    },
    {
      id: 4,
      planetId: 'venus',
      name: 'LAKSHMI PLANUM',
      era: 'STAGE 2: PREDICTOR OFFLINE',
      retrogressionShort: 'NO PREDICTOR',
      themeColor: '#854d0e',
      hudStyle: 'y2k',
      mapType: 'Volcanic Lava Plains',
      description: 'A smooth lava plateau ringed by intensely deformed mountain chains. Trajectory prediction line decommissioned; pilots must counter heavy 68 px/s² gravity by feel.',
      degradedAvionics: ['Trajectory Predictor DECOMMISSIONED', 'Crosswinds: 26 px/s • Fuel: 140L'],
      worldWidth: 3800,
      worldHeight: 1460,
      windSpeed: 26,
      hazardCount: 7,
      fuelCapacity: 140,
      pads: [
        { name: 'LAVA SHELF', code: 'ALPHA', xPercent: 0.21, yOffset: 12, w: 145, multiplier: 1.0, color: '#854d0e', glowColor: 'rgba(133, 77, 14, 0.4)', distanceTier: 'NEAR' },
        { name: 'BASALT CORONA', code: 'BRAVO', xPercent: 0.45, yOffset: -20, w: 120, multiplier: 2.0, color: '#a16207', glowColor: 'rgba(161, 98, 7, 0.4)', distanceTier: 'MID' },
        { name: 'PLANUM ROOST', code: 'CHARLIE', xPercent: 0.69, yOffset: 16, w: 100, multiplier: 3.5, color: '#ca8a04', glowColor: 'rgba(202, 138, 4, 0.4)', distanceTier: 'FAR' },
        { name: 'MOLTEN SANCTUARY', code: 'OMEGA', xPercent: 0.92, yOffset: -34, w: 80, multiplier: 5.0, color: '#dc2626', glowColor: 'rgba(220, 38, 38, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.30, 0.37, 0.54, 0.62, 0.79, 0.86],
      terrainOctaves: { baseAmp: 94, w1Freq: 2.7, w1Amp: 84, w2Freq: 5.7, w2Amp: 46, w3Freq: 10.6, w3Amp: 24 },
    },
    {
      id: 5,
      planetId: 'venus',
      name: 'SIF MONS CALDERA',
      era: 'STAGE 3: RADAR STROBE',
      retrogressionShort: 'RADAR STROBE',
      themeColor: '#713f12',
      hudStyle: 'y2k',
      mapType: 'Corrosive Shield Volcano',
      description: 'A massive shield volcano with extensive fluid lava channels. Radar strobe pulses every 2 seconds amidst dense sulfuric mist and thermal turbulence.',
      degradedAvionics: ['Radar Degraded to Strobe Pulses', 'Crosswinds: 30 px/s • Fuel: 130L'],
      worldWidth: 3900,
      worldHeight: 1480,
      windSpeed: 30,
      hazardCount: 8,
      fuelCapacity: 130,
      pads: [
        { name: 'SIF PERCH', code: 'ALPHA', xPercent: 0.22, yOffset: -14, w: 140, multiplier: 1.0, color: '#713f12', glowColor: 'rgba(113, 63, 18, 0.4)', distanceTier: 'NEAR' },
        { name: 'CALDERA RIM', code: 'BRAVO', xPercent: 0.48, yOffset: 24, w: 115, multiplier: 2.0, color: '#854d0e', glowColor: 'rgba(133, 77, 14, 0.4)', distanceTier: 'MID' },
        { name: 'SULFUR TRENCH', code: 'CHARLIE', xPercent: 0.72, yOffset: -20, w: 95, multiplier: 3.5, color: '#ea580c', glowColor: 'rgba(234, 88, 12, 0.4)', distanceTier: 'FAR' },
        { name: 'SIF APEX', code: 'OMEGA', xPercent: 0.90, yOffset: 36, w: 75, multiplier: 5.0, color: '#ef4444', glowColor: 'rgba(239, 68, 68, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.32, 0.38, 0.55, 0.63, 0.81, 0.87],
      terrainOctaves: { baseAmp: 100, w1Freq: 2.8, w1Amp: 90, w2Freq: 5.9, w2Amp: 50, w3Freq: 11.4, w3Amp: 26 },
    },
    {
      id: 6,
      planetId: 'venus',
      name: 'DIANA CHASM',
      era: 'STAGE 3: ALTIMETER OFFLINE',
      retrogressionShort: 'AUDIO ALTIMETER',
      themeColor: '#ea580c',
      hudStyle: 'eighties',
      mapType: 'Tectonic Acid Trench',
      description: 'One of the deepest rift chasms on Venus. Digital altimeter displays blank out; rely on acoustic proximity audio pings to gauge proximity to basalt ridges.',
      degradedAvionics: ['Digital Altimeter OFFLINE', 'Acoustic Proximity Beeps ACTIVE', 'Crosswinds: 35 px/s'],
      worldWidth: 4000,
      worldHeight: 1490,
      windSpeed: 35,
      hazardCount: 9,
      fuelCapacity: 125,
      pads: [
        { name: 'DIANA SHELF', code: 'ALPHA', xPercent: 0.20, yOffset: 16, w: 135, multiplier: 1.0, color: '#ea580c', glowColor: 'rgba(234, 88, 12, 0.4)', distanceTier: 'NEAR' },
        { name: 'CHASM FLOOR', code: 'BRAVO', xPercent: 0.46, yOffset: -26, w: 110, multiplier: 2.0, color: '#f97316', glowColor: 'rgba(249, 115, 22, 0.4)', distanceTier: 'MID' },
        { name: 'RIFT BUTTE', code: 'CHARLIE', xPercent: 0.70, yOffset: 20, w: 90, multiplier: 3.5, color: '#dc2626', glowColor: 'rgba(220, 38, 38, 0.4)', distanceTier: 'FAR' },
        { name: 'DIANA PINNACLE', code: 'OMEGA', xPercent: 0.91, yOffset: -40, w: 70, multiplier: 5.0, color: '#b91c1c', glowColor: 'rgba(185, 28, 28, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.29, 0.36, 0.54, 0.62, 0.79, 0.88],
      terrainOctaves: { baseAmp: 106, w1Freq: 3.0, w1Amp: 96, w2Freq: 6.2, w2Amp: 54, w3Freq: 12.0, w3Amp: 28 },
    },
    {
      id: 7,
      planetId: 'venus',
      name: 'BETA REGIO CRAGS',
      era: 'STAGE 4: SENSORS FLICKERING',
      retrogressionShort: 'SENSOR GLITCH',
      themeColor: '#c2410c',
      hudStyle: 'eighties',
      mapType: 'Volcanic Lightning Rift',
      description: 'A volcanic highland subjected to constant atmospheric lightning. CRT instruments glitch with electrostatic noise; radar is permanently offline.',
      degradedAvionics: ['Radar Minimap OFFLINE', 'Speedometers Flickering CRT Static', 'Crosswinds: 40 px/s'],
      worldWidth: 4100,
      worldHeight: 1500,
      windSpeed: 40,
      hazardCount: 10,
      fuelCapacity: 120,
      pads: [
        { name: 'BETA VALLEY', code: 'ALPHA', xPercent: 0.23, yOffset: -20, w: 130, multiplier: 1.0, color: '#c2410c', glowColor: 'rgba(194, 65, 12, 0.4)', distanceTier: 'NEAR' },
        { name: 'THEIA PERCH', code: 'BRAVO', xPercent: 0.47, yOffset: 28, w: 105, multiplier: 2.0, color: '#ea580c', glowColor: 'rgba(234, 88, 12, 0.4)', distanceTier: 'MID' },
        { name: 'LIGHTNING CREST', code: 'CHARLIE', xPercent: 0.71, yOffset: -32, w: 85, multiplier: 3.5, color: '#dc2626', glowColor: 'rgba(220, 38, 38, 0.4)', distanceTier: 'FAR' },
        { name: 'REGIO APEX', code: 'OMEGA', xPercent: 0.89, yOffset: 36, w: 68, multiplier: 5.0, color: '#991b1b', glowColor: 'rgba(153, 27, 27, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.31, 0.38, 0.56, 0.64, 0.81, 0.86],
      terrainOctaves: { baseAmp: 112, w1Freq: 3.2, w1Amp: 102, w2Freq: 6.5, w2Amp: 58, w3Freq: 12.4, w3Amp: 30 },
    },
    {
      id: 8,
      planetId: 'venus',
      name: 'ATALANTA PLANITIA',
      era: 'STAGE 4: ANALOG GAUGES',
      retrogressionShort: 'ANALOG GAUGES',
      themeColor: '#57534e',
      hudStyle: 'apollo',
      mapType: 'Scorched Lowland Sink',
      description: 'The lowest depression on Venus under maximum atmospheric pressure. Digital readouts are completely disabled; pilot navigates with a lagged analog fuel needle.',
      degradedAvionics: ['Digital Speedometers OFFLINE', 'Mechanical Damped Fuel Gauge Active (~300ms lag)', 'High Hazard Density'],
      worldWidth: 4200,
      worldHeight: 1520,
      windSpeed: 44,
      hazardCount: 11,
      fuelCapacity: 115,
      pads: [
        { name: 'ATALANTA BASE', code: 'ALPHA', xPercent: 0.21, yOffset: 16, w: 125, multiplier: 1.0, color: '#57534e', glowColor: 'rgba(87, 83, 78, 0.4)', distanceTier: 'NEAR' },
        { name: 'SINKHOLE ROOST', code: 'BRAVO', xPercent: 0.45, yOffset: -24, w: 100, multiplier: 2.0, color: '#78716c', glowColor: 'rgba(120, 113, 108, 0.4)', distanceTier: 'MID' },
        { name: 'BOILING CHASM', code: 'CHARLIE', xPercent: 0.69, yOffset: 30, w: 80, multiplier: 3.5, color: '#ea580c', glowColor: 'rgba(234, 88, 12, 0.4)', distanceTier: 'FAR' },
        { name: 'VENUSIAN DEEP', code: 'OMEGA', xPercent: 0.92, yOffset: -38, w: 65, multiplier: 5.0, color: '#dc2626', glowColor: 'rgba(220, 38, 38, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.28, 0.35, 0.52, 0.60, 0.77, 0.86],
      terrainOctaves: { baseAmp: 118, w1Freq: 3.3, w1Amp: 108, w2Freq: 6.7, w2Amp: 62, w3Freq: 13.0, w3Amp: 32 },
    },
    {
      id: 9,
      planetId: 'venus',
      name: 'MAAT MONS CORONA',
      era: 'STAGE 5: DIMMED OPTICS',
      retrogressionShort: '75% BLIND',
      themeColor: '#f43f5e',
      hudStyle: 'apollo',
      mapType: 'Dense Acid Fog Chasm',
      description: 'The highest volcano on Venus enshrouded in corrosive acid fog. Optical cameras 75% blinded; intense 48 px/s crosswinds buffet the heavy craft.',
      degradedAvionics: ['Optical Sensors: 75% BLIND', 'Severe Crosswinds: 48 px/s', 'Fuel Restricted to 110L'],
      worldWidth: 4300,
      worldHeight: 1530,
      windSpeed: 48,
      hazardCount: 13,
      fuelCapacity: 110,
      pads: [
        { name: 'MAAT SHELF', code: 'ALPHA', xPercent: 0.22, yOffset: -18, w: 120, multiplier: 1.0, color: '#f43f5e', glowColor: 'rgba(244, 63, 94, 0.4)', distanceTier: 'NEAR' },
        { name: 'CORONA GORGE', code: 'BRAVO', xPercent: 0.46, yOffset: 32, w: 95, multiplier: 2.0, color: '#fb7185', glowColor: 'rgba(251, 113, 133, 0.4)', distanceTier: 'MID' },
        { name: 'ACID CHASM', code: 'CHARLIE', xPercent: 0.70, yOffset: -30, w: 75, multiplier: 3.5, color: '#e11d48', glowColor: 'rgba(225, 29, 72, 0.4)', distanceTier: 'FAR' },
        { name: 'VOLCANIC APEX', code: 'OMEGA', xPercent: 0.90, yOffset: 40, w: 60, multiplier: 5.0, color: '#be123c', glowColor: 'rgba(190, 18, 60, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.30, 0.37, 0.55, 0.63, 0.80, 0.87],
      terrainOctaves: { baseAmp: 124, w1Freq: 3.5, w1Amp: 114, w2Freq: 7.0, w2Amp: 66, w3Freq: 13.4, w3Amp: 34 },
    },
    {
      id: 10,
      planetId: 'venus',
      name: 'CYTHEREAN INFERNO',
      era: 'STAGE 5: SENSORY BLACKOUT',
      retrogressionShort: 'BLIND BLACKOUT',
      themeColor: '#ef4444',
      hudStyle: 'blackout',
      mapType: 'Crushing Acidic Void',
      description: 'The supreme test of landing capability. Crushing 68 px/s² gravity, violent sulfuric atmospheric turbulence, 95% sensory blackout. Touchdown purely by audio sonar frequency.',
      degradedAvionics: ['ALL INSTRUMENTS OFFLINE', 'Optical Sensors: 95% BLIND', 'Acoustic Sonar Navigation ACTIVE', 'Maximum Gravity & Thermal Hazards'],
      worldWidth: 4500,
      worldHeight: 1550,
      windSpeed: 52,
      hazardCount: 15,
      fuelCapacity: 100,
      pads: [
        { name: 'INFERNO OUTPOST', code: 'ALPHA', xPercent: 0.20, yOffset: 24, w: 110, multiplier: 1.0, color: '#ef4444', glowColor: 'rgba(239, 68, 68, 0.4)', distanceTier: 'NEAR' },
        { name: 'SULFUR ABYSS', code: 'BRAVO', xPercent: 0.44, yOffset: -34, w: 85, multiplier: 2.0, color: '#f87171', glowColor: 'rgba(248, 113, 113, 0.4)', distanceTier: 'MID' },
        { name: 'SONAR ROOST', code: 'CHARLIE', xPercent: 0.68, yOffset: 30, w: 70, multiplier: 3.5, color: '#dc2626', glowColor: 'rgba(220, 38, 38, 0.4)', distanceTier: 'FAR' },
        { name: 'CYTHEREAN VOID', code: 'OMEGA', xPercent: 0.91, yOffset: -45, w: 55, multiplier: 5.0, color: '#b91c1c', glowColor: 'rgba(185, 28, 28, 0.45)', distanceTier: 'EXTREME' },
      ],
      cragPositions: [0.27, 0.35, 0.52, 0.60, 0.77, 0.86],
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
