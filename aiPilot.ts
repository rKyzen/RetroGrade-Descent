/**
 * @fileoverview Autonomous AI Lunar Lander Bot for Retrograde Descent.
 * Implements real-time proportional navigation, vector thrust decomposition,
 * attitude stabilization, and terrain/hazard avoidance.
 */

import {LandingPadDef} from './levels';

export interface AiPersona {
  id: string;
  name: string;
  callsign: string;
  hullTheme: string;
  hullColor: string;
  description: string;
  riskPreference: 'SAFE' | 'BALANCED' | 'AGGRESSIVE';
  agility: number;
}

export const AI_PERSONAS: AiPersona[] = [
  {
    id: 'hal9000',
    name: 'HAL-9000',
    callsign: 'HAL-9000',
    hullTheme: 'crimson',
    hullColor: '#ef4444',
    description: 'Heuristic Algorithmic Guidance. Methodical, highly calculated descent targeting high multipliers.',
    riskPreference: 'BALANCED',
    agility: 88,
  },
  {
    id: 'apollo-ai',
    name: 'APOLLO AGC-1',
    callsign: 'AGC-1 BOT',
    hullTheme: 'cyan',
    hullColor: '#38bdf8',
    description: 'Historical MIT AGC Emulation. Conservative flight path prioritizing safe pad touchdowns.',
    riskPreference: 'SAFE',
    agility: 74,
  },
  {
    id: 'voyager-x',
    name: 'VOYAGER-X',
    callsign: 'VOYAGER-X',
    hullTheme: 'gold',
    hullColor: '#f59e0b',
    description: 'Deep Space Autonomous Probe. High speed, aggressive long-range pad hunter.',
    riskPreference: 'AGGRESSIVE',
    agility: 96,
  },
];

export interface AiLanderState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angularVelocity: number;
  fuel: number;
  crashed: boolean;
  landed: boolean;
}

export interface AiInputs {
  thrust: boolean;
  left: boolean;
  right: boolean;
  targetPadCode: string;
}

export interface AiLandingPadTarget {
  name: string;
  code: string;
  x?: number;
  y?: number;
  xPercent?: number;
  yOffset?: number;
  w: number;
  multiplier: number;
}

/**
 * Computes real-time autonomous piloting decisions for the AI opponent.
 */
export function computeAiPilotInputs(
  ai: AiLanderState,
  pads: AiLandingPadTarget[],
  worldWidth: number,
  getSurfaceY: (x: number) => number,
  persona: AiPersona = AI_PERSONAS[0],
): AiInputs {
  if (ai.crashed || ai.landed || pads.length === 0) {
    return {thrust: false, left: false, right: false, targetPadCode: 'NONE'};
  }

  // 1. Target Pad Selection based on Persona and Fuel Reserves
  let targetPad = pads[0]; // Default Alpha (Safe)

  if (persona.riskPreference === 'AGGRESSIVE' && ai.fuel > 40 && pads.length >= 3) {
    // Aims for Charlie or Omega
    targetPad = pads[Math.min(pads.length - 1, 2)];
  } else if (persona.riskPreference === 'BALANCED' && ai.fuel > 50 && pads.length >= 2) {
    // Aims for Bravo or Alpha
    targetPad = pads[1];
  } else {
    // Safe or low fuel -> Alpha
    targetPad = pads[0];
  }

  const padCenterX = targetPad.x !== undefined ? targetPad.x + targetPad.w / 2 : (targetPad.xPercent ?? 0.2) * worldWidth + targetPad.w / 2;
  const padTargetY = targetPad.y !== undefined ? targetPad.y : 1400 * 0.76 + (targetPad.yOffset ?? 0);

  // 2. Toroidal wrapped horizontal error
  let dx = (padCenterX - ai.x) % worldWidth;
  if (dx > worldWidth / 2) dx -= worldWidth;
  if (dx < -worldWidth / 2) dx += worldWidth;

  const dy = padTargetY - ai.y;
  const localGroundY = getSurfaceY(ai.x);
  const clearance = Math.max(0, localGroundY - (ai.y + 18));

  // 3. Horizontal Speed Profile
  let desiredVx = 0;
  if (Math.abs(dx) > 160) {
    desiredVx = Math.sign(dx) * Math.min(32, Math.abs(dx) * 0.2);
  } else {
    desiredVx = (dx / 160) * 16;
  }

  // When approaching ground, damp horizontal speed strictly
  if (dy < 90 || clearance < 90) {
    desiredVx = Math.max(-12, Math.min(12, dx * 0.12));
  }

  // 4. Attitude / Tilt Angle Guidance
  const vxDiff = desiredVx - ai.vx;
  let desiredAngle = Math.max(-0.24, Math.min(0.24, vxDiff * 0.032));

  // Level out upright as vessel nears touchdown
  if (dy < 90 || clearance < 90) {
    const groundFactor = Math.max(0, (Math.min(dy, clearance) - 20) / 70);
    desiredAngle *= groundFactor;
  }

  // 5. RCS Jet Steering Commands
  let left = false;
  let right = false;
  const angleError = desiredAngle - ai.angle;
  const dampedAngleError = angleError - ai.angularVelocity * 0.22;

  if (dampedAngleError > 0.03) {
    right = true; // Rotate clockwise
  } else if (dampedAngleError < -0.03) {
    left = true; // Rotate counter-clockwise
  }

  // 6. Vertical Throttle / Main Engine
  let desiredVy = 38;
  if (dy > 300 && clearance > 220) {
    desiredVy = 36;
  } else if (dy > 120) {
    desiredVy = 26;
  } else {
    // Terminal approach
    desiredVy = Math.max(10, Math.min(22, dy * 0.16));
  }

  let thrust = false;

  // Fire main engine if sinking faster than target velocity
  if (ai.vy > desiredVy) {
    thrust = true;
  }

  // Emergency Terrain Avoidance (protect against basalt spires)
  if (clearance < 65 && ai.vy > 12) {
    thrust = true;
  }

  // Lateral acceleration burn when tilted towards target
  if (Math.abs(ai.angle) > 0.12 && Math.abs(vxDiff) > 10 && ai.vy < 28 && dy > 100) {
    thrust = true;
  }

  // Prevent firing when completely out of fuel
  if (ai.fuel <= 0) {
    thrust = false;
  }

  return {
    thrust,
    left,
    right,
    targetPadCode: targetPad.code,
  };
}
