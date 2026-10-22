import {SpriteConfig} from './utils/helper';

/**
 * Configuration for Retrograde Descent.
 */
export const CONFIG = {
  // Game Initialization
  title: {
    value: 'Retrograde Descent',
    type: 'string',
    label: 'Game Title',
    group: 'GAME',
  },
  baseCanvasWidth: {
    value: 1280,
    type: 'number',
    label: 'Base Canvas Width',
    group: 'GAME',
  },
  baseCanvasHeight: {
    value: 720,
    type: 'number',
    label: 'Base Canvas Height',
    group: 'GAME',
  },
  worldBaseWidth: {
    value: 2600,
    type: 'number',
    label: 'World Map Base Width',
    group: 'GAME',
  },
  worldBaseHeight: {
    value: 1500,
    type: 'number',
    label: 'World Map Base Height',
    group: 'GAME',
  },

  // System Constants for the physics loop
  targetFPS: {
    value: 60,
    type: 'number',
    label: 'Target FPS',
    group: 'SYSTEM',
  },
  stepMs: {
    value: 1000 / 60,
    type: 'number',
    label: 'Step MS',
    group: 'SYSTEM',
  },
  maxSubSteps: {
    value: 5,
    type: 'number',
    label: 'Max Sub Steps',
    group: 'SYSTEM',
  },

  // Thematic Elements
  backgroundColor: {
    value: '#030712',
    type: 'color',
    label: 'Background Color',
    group: 'THEME',
  },
  primaryColor: {
    value: '#10b981',
    type: 'color',
    label: 'Primary Color',
    group: 'THEME',
  },
  fontFamily: {
    value: '"Press Start 2P", Courier, monospace',
    type: 'string',
    label: 'Font Family',
    group: 'THEME',
  },

  // Audio Levels
  defaultMusicVolume: {
    value: 0.5,
    type: 'number',
    label: 'Default Music Volume',
    group: 'AUDIO',
  },
  defaultSfxVolume: {
    value: 0.6,
    type: 'number',
    label: 'Default SFX Volume',
    group: 'AUDIO',
  },

  // Physics / Flight Mechanics
  gravity: {
    value: 38,
    type: 'number',
    label: 'Lunar Gravity',
    group: 'Physics',
  },
  mainThrust: {
    value: 95,
    type: 'number',
    label: 'Main Engine Thrust',
    group: 'Physics',
  },
  rotationSpeed: {
    value: 2.4,
    type: 'number',
    label: 'RCS Rotation Speed',
    group: 'Physics',
  },
  fuelConsumptionRate: {
    value: 9.5,
    type: 'number',
    label: 'Fuel Consumption Rate',
    group: 'Physics',
  },
  level1FuelCapacity: {
    value: 180,
    type: 'number',
    label: 'Level 1 Fuel Capacity',
    group: 'Physics',
  },

  // Rules & Safe Landing Tolerances
  maxSafeLandingVy: {
    value: 45,
    type: 'number',
    label: 'Max Safe Vertical Speed (px/s)',
    group: 'Rules',
  },
  maxSafeLandingVx: {
    value: 25,
    type: 'number',
    label: 'Max Safe Horizontal Speed (px/s)',
    group: 'Rules',
  },
  maxSafeAngleDeg: {
    value: 8,
    type: 'number',
    label: 'Max Safe Tilt (deg)',
    group: 'Rules',
  },
  startingLives: {
    value: 3,
    type: 'number',
    label: 'Starting Lander Reserves',
    group: 'Rules',
  },
  visualSonarAssist: {
    value: true,
    type: 'boolean',
    label: 'Sonar Visual Accessibility Wave',
    group: 'Rules',
  },

  // Asset Dimensions & Aspect Ratios (derived from read_assets_metadata)
  assetLanderVesselAspectRatio: {
    value: 1.3547, // 802 / 592
    type: 'number',
    label: 'Lander Vessel Aspect Ratio',
    group: 'ASSETS',
  },
  assetLanderVesselWidth: {
    value: 58,
    type: 'number',
    label: 'Lander Vessel Width',
    group: 'ASSETS',
  },
  assetLanderVesselHeight: {
    value: 43, // 58 / 1.3547 ≈ 42.8
    type: 'number',
    label: 'Lander Vessel Height',
    group: 'ASSETS',
  },

  assetLunarBackdropAspectRatio: {
    value: 1.7917, // 1376 / 768
    type: 'number',
    label: 'Lunar Backdrop Aspect Ratio',
    group: 'ASSETS',
  },
  assetLunarBackdropWidth: {
    value: 1280,
    type: 'number',
    label: 'Lunar Backdrop Width',
    group: 'ASSETS',
  },
  assetLunarBackdropHeight: {
    value: 720,
    type: 'number',
    label: 'Lunar Backdrop Height',
    group: 'ASSETS',
  },

  assetLandingPlatformAspectRatio: {
    value: 3.1569, // 865 / 274
    type: 'number',
    label: 'Landing Platform Aspect Ratio',
    group: 'ASSETS',
  },
  assetLandingPlatformWidth: {
    value: 140,
    type: 'number',
    label: 'Landing Platform Width',
    group: 'ASSETS',
  },
  assetLandingPlatformHeight: {
    value: 44, // 140 / 3.1569 ≈ 44.3
    type: 'number',
    label: 'Landing Platform Height',
    group: 'ASSETS',
  },

  assetLunarCragAspectRatio: {
    value: 1.1171, // 782 / 700
    type: 'number',
    label: 'Lunar Crag Aspect Ratio',
    group: 'ASSETS',
  },
  assetLunarCragWidth: {
    value: 110,
    type: 'number',
    label: 'Lunar Crag Width',
    group: 'ASSETS',
  },
  assetLunarCragHeight: {
    value: 98, // 110 / 1.1171 ≈ 98.4
    type: 'number',
    label: 'Lunar Crag Height',
    group: 'ASSETS',
  },

  playerSprite: {
    value: undefined as SpriteConfig | undefined,
    type: 'sprite',
    label: 'Player Sprite',
    group: 'Visuals',
  },
};

// Merge customized config values if present (injected by Playground)
const {playgroundConfig} = globalThis as {
  playgroundConfig?: Record<string, unknown>;
};
if (playgroundConfig) {
  for (const [key, value] of Object.entries(playgroundConfig)) {
    if (key in CONFIG) {
      Object.assign(CONFIG[key as keyof typeof CONFIG], {value});
    }
  }
}

/**
 * Type helper for reading values in game code
 */
export type ConfigKey = keyof typeof CONFIG;

/**
 * Gets a configuration value by key.
 * @param key The configuration key.
 * @return The configuration value.
 */
export function getConfig<K extends ConfigKey>(
  key: K,
): (typeof CONFIG)[K]['value'] {
  return CONFIG[key].value;
}

export const PRESETS = {};
