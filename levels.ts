/**
 * @fileoverview 10 Lunar Maps for Retrograde Descent.
 * The Level IS the Map (a distinct lunar sector with unique procedural terrain,
 * platform layouts, and basalt obstacles).
 *
 * RETROGRESSION PROGRESSION:
 * With each subsequent map, the spacecraft experiences progressive avionics degradation:
 * - Maps 1-2: STAGE 1 (Full Glass Cockpit) — Real-time dotted trajectory predictor, velocity pip, tactical radar.
 * - Maps 3-4: STAGE 2 (Predictor Stripped) — Trajectory predictor offline; pilot flies by speed numbers & intuition.
 * - Maps 5-6: STAGE 3 (Sensor Degradation) — Radar refresh degraded to low-frequency strobe; crosswinds intensify.
 * - Maps 7-8: STAGE 4 (Analog Fallback) — Digital speedometers offline; mechanical damped fuel needle (~300ms lag).
 * - Maps 9-10: STAGE 5 (Sensory Blackout) — Optical sensors fail (95% blind); pilot navigates strictly by acoustic sonar audio chirps.
 */

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
  name: string; // The Map Name
  era: string; // The Retrogression Stage (Avionics Status)
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

export const LEVELS: LevelConfig[] = [
  // MAP 1
  {
    id: 1,
    name: 'TRANQUILLITY BASE',
    era: 'STAGE 1: FULL GLASS COCKPIT',
    retrogressionShort: 'FULL AVIONICS',
    themeColor: '#10b981', // Emerald
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

  // MAP 2
  {
    id: 2,
    name: 'OCEAN OF STORMS',
    era: 'STAGE 1: TELEMETRY DRIFT',
    retrogressionShort: 'LIGHT TURBULENCE',
    themeColor: '#06b6d4', // Cyan
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

  // MAP 3
  {
    id: 3,
    name: 'TYCHO HIGHLANDS',
    era: 'STAGE 2: VECTOR PIP OFFLINE',
    retrogressionShort: 'NO VECTOR PIP',
    themeColor: '#3b82f6', // Sky Blue
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

  // MAP 4
  {
    id: 4,
    name: 'BASALT CANYONS',
    era: 'STAGE 2: PREDICTOR OFFLINE',
    retrogressionShort: 'NO PREDICTOR',
    themeColor: '#22c55e', // Green
    hudStyle: 'y2k',
    mapType: 'Basalt Rift Gorge',
    description: 'Deep jagged basalt canyons with shear vertical drops. Live trajectory prediction and landing guidance reticles are completely decommissioned.',
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

  // MAP 5
  {
    id: 5,
    name: 'FRA MAURO CRATERS',
    era: 'STAGE 3: RADAR STROBE',
    retrogressionShort: 'RADAR STROBE',
    themeColor: '#84cc16', // Lime
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

  // MAP 6
  {
    id: 6,
    name: 'SINUS IRIDUM',
    era: 'STAGE 3: ALTIMETER OFFLINE',
    retrogressionShort: 'AUDIO ALTIMETER',
    themeColor: '#f59e0b', // Amber
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

  // MAP 7
  {
    id: 7,
    name: 'APENNINE CRAGS',
    era: 'STAGE 4: SENSORS FLICKERING',
    retrogressionShort: 'SENSOR GLITCH',
    themeColor: '#ea580c', // Orange
    hudStyle: 'eighties',
    mapType: 'Mountain Mountain Spire Trench',
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

  // MAP 8
  {
    id: 8,
    name: 'CLAVIUS CHASM',
    era: 'STAGE 4: ANALOG GAUGES',
    retrogressionShort: 'ANALOG GAUGES',
    themeColor: '#94a3b8', // Silver / Slate
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

  // MAP 9
  {
    id: 9,
    name: 'DARK SIDE TRENCH',
    era: 'STAGE 5: DIMMED OPTICS',
    retrogressionShort: '70% BLIND',
    themeColor: '#f43f5e', // Rose
    hudStyle: 'apollo',
    mapType: 'Lunar Far Side Ravine',
    description: 'Far side lunar corridor enveloped in heavy shadow. Cockpit optical sensors dimmed by 70%; intense crosswinds buffet the lander over shear drops.',
    degradedAvionics: ['Optical Sensors: 70% DIMMED', 'Severe Crosswinds: 42 px/s', 'Fuel Restricted to 110L'],
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

  // MAP 10
  {
    id: 10,
    name: 'THE VOID GAUNTLET',
    era: 'STAGE 5: SENSORY BLACKOUT',
    retrogressionShort: 'BLIND BLACKOUT',
    themeColor: '#ef4444', // Red
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
];

/**
 * Retrieves level/map configuration by ID (1..10) with fallback.
 */
export function getLevel(id: number): LevelConfig {
  const index = Math.max(0, Math.min(LEVELS.length - 1, id - 1));
  return LEVELS[index];
}
