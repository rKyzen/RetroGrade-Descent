// =============================================================================
// CRAFTS, ECONOMY & UPGRADES SYSTEM
// GradeCoins (GC), Hangar Purchases, Individual Craft Stat Scaling & Persistence
// =============================================================================

export interface CraftUpgradeTier {
  engineTier: number; // 0 to 5 (+8% thrust per tier)
  fuelTier: number;   // 0 to 5 (+15L fuel per tier)
  turnTier: number;   // 0 to 5 (+10% RCS turn agility per tier)
}

export interface CraftDefinition {
  id: string;
  name: string;
  subname: string;
  assetKey: string;
  spriteUrl: string;
  price: number; // 0 for stock starter
  isDefaultOwned?: boolean;
  baseThrustMultiplier: number;
  baseFuelBonus: number;
  baseTurnMultiplier: number;
  description: string;
  accentColor: string;
  classTag: string;
  specs: string[];
}

export const MAX_UPGRADE_TIER = 5;

// Upgrade costs per tier (Tier 1..5)
export const UPGRADE_COSTS: Record<number, number> = {
  1: 150,
  2: 350,
  3: 750,
  4: 1500,
  5: 3000,
};

export function getUpgradeCost(currentTier: number): number {
  if (currentTier >= MAX_UPGRADE_TIER) return 0;
  return UPGRADE_COSTS[currentTier + 1] || 150;
}

// 3 Distinct Playable Craft Models with Clear Tiered Baseline Progression
export const CRAFTS: CraftDefinition[] = [
  {
    id: 'vanguard',
    name: 'VANGUARD APOLLO',
    subname: 'MK-I GENERAL DESCENT MODULE',
    assetKey: 'lander_vanguard',
    spriteUrl: 'assets/images/lander_vessel.png',
    price: 0,
    isDefaultOwned: true,
    baseThrustMultiplier: 1.0,
    baseFuelBonus: 0,
    baseTurnMultiplier: 1.0,
    description: 'Battle-proven Apollo-derived lunar excursion module. Standard baseline dynamics with titanium landing gear.',
    accentColor: '#10b981',
    classTag: 'CLASS-I STANDARD LANDER',
    specs: ['BASELINE THRUST (1.00x)', 'STANDARD FUEL CELLS (180L)', 'STANDARD RCS TORQUE (1.00x)'],
  },
  {
    id: 'ares',
    name: 'ARES PATHFINDER',
    subname: 'MK-II HIGH-AGILITY ION SCOUT',
    assetKey: 'lander_ares',
    spriteUrl: 'assets/images/lander_ares.png',
    price: 1200,
    baseThrustMultiplier: 1.12,
    baseFuelBonus: 30,
    baseTurnMultiplier: 1.25,
    description: 'Advanced planetary scout craft engineered for rapid response and tight navigation between narrow cliff gorges.',
    accentColor: '#38bdf8',
    classTag: 'CLASS-II RECON SCOUT (+12% THRUST, +30L FUEL, +25% TURN)',
    specs: ['UPGRADED MAIN THRUST (1.12x)', 'EXTENDED PROPELLANT CELLS (+30L FUEL)', 'HIGH-FREQUENCY RCS (+25% TURN)'],
  },
  {
    id: 'hyperion',
    name: 'HYPERION SPECTER',
    subname: 'MK-III DEEP-ATMOSPHERE CRUISER',
    assetKey: 'lander_hyperion',
    spriteUrl: 'assets/images/lander_hyperion.png',
    price: 2600,
    baseThrustMultiplier: 1.30,
    baseFuelBonus: 65,
    baseTurnMultiplier: 1.15,
    description: 'Reinforced deep-space flagship designed to punch through turbulent planetary atmospheres with massive dual-burn thrusters.',
    accentColor: '#e879f9',
    classTag: 'CLASS-III HEAVY CRUISER (+30% THRUST, +65L FUEL, +15% TURN)',
    specs: ['HEAVY INDUSTRIAL THRUST (1.30x)', 'MASSIVE DUAL TANKS (+65L FUEL)', 'REINFORCED TITAN HULL (+15% TURN)'],
  },
];

export function getCraft(craftId: string): CraftDefinition {
  return CRAFTS.find((c) => c.id === craftId) || CRAFTS[0];
}

// -----------------------------------------------------------------------------
// LOCAL STORAGE PERSISTENCE
// -----------------------------------------------------------------------------

const STORAGE_KEYS = {
  GRADECOINS: 'retrograde_gradecoins',
  OWNED_CRAFTS: 'retrograde_owned_crafts',
  SELECTED_CRAFT: 'retrograde_selected_craft',
  CRAFT_UPGRADES: 'retrograde_craft_upgrades',
};

// Initial starting balance: 250 GC for fresh pilots
export function getStoredGradeCoins(): number {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.GRADECOINS);
    if (val !== null) {
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed) && parsed >= 0) return parsed;
    }
  } catch {}
  return 250;
}

export function setStoredGradeCoins(amount: number): void {
  try {
    localStorage.setItem(STORAGE_KEYS.GRADECOINS, Math.max(0, Math.floor(amount)).toString());
    window.dispatchEvent(new Event('gradecoins_updated'));
  } catch {}
}

export function addGradeCoins(amount: number): number {
  const current = getStoredGradeCoins();
  const next = current + Math.max(0, Math.floor(amount));
  setStoredGradeCoins(next);
  return next;
}

export function deductGradeCoins(amount: number): boolean {
  const current = getStoredGradeCoins();
  if (current < amount) return false;
  setStoredGradeCoins(current - amount);
  return true;
}

export function getStoredOwnedCrafts(): string[] {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.OWNED_CRAFTS);
    if (val) {
      const list = JSON.parse(val);
      if (Array.isArray(list) && list.length > 0) {
        if (!list.includes('vanguard')) list.push('vanguard');
        return list;
      }
    }
  } catch {}
  return ['vanguard'];
}

export function setStoredOwnedCrafts(craftIds: string[]): void {
  try {
    const unique = Array.from(new Set(['vanguard', ...craftIds]));
    localStorage.setItem(STORAGE_KEYS.OWNED_CRAFTS, JSON.stringify(unique));
  } catch {}
}

export function getStoredSelectedCraftId(): string {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.SELECTED_CRAFT);
    if (val && CRAFTS.some((c) => c.id === val)) {
      const owned = getStoredOwnedCrafts();
      if (owned.includes(val)) return val;
    }
  } catch {}
  return 'vanguard';
}

export function setStoredSelectedCraftId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SELECTED_CRAFT, id);
  } catch {}
}

export function getStoredCraftUpgrades(): Record<string, CraftUpgradeTier> {
  const defaultUpgrades: Record<string, CraftUpgradeTier> = {
    vanguard: { engineTier: 0, fuelTier: 0, turnTier: 0 },
    ares: { engineTier: 0, fuelTier: 0, turnTier: 0 },
    hyperion: { engineTier: 0, fuelTier: 0, turnTier: 0 },
  };

  try {
    const val = localStorage.getItem(STORAGE_KEYS.CRAFT_UPGRADES);
    if (val) {
      const parsed = JSON.parse(val);
      if (typeof parsed === 'object' && parsed !== null) {
        return {
          vanguard: parsed.vanguard || { engineTier: 0, fuelTier: 0, turnTier: 0 },
          ares: parsed.ares || { engineTier: 0, fuelTier: 0, turnTier: 0 },
          hyperion: parsed.hyperion || { engineTier: 0, fuelTier: 0, turnTier: 0 },
        };
      }
    }
  } catch {}
  return defaultUpgrades;
}

export function setStoredCraftUpgrades(upgrades: Record<string, CraftUpgradeTier>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CRAFT_UPGRADES, JSON.stringify(upgrades));
  } catch {}
}

// -----------------------------------------------------------------------------
// EFFECTIVE STAT COMPUTATIONS WITH UPGRADES
// -----------------------------------------------------------------------------

export function computeEffectiveStats(
  craft: CraftDefinition,
  upgradeTier: CraftUpgradeTier = { engineTier: 0, fuelTier: 0, turnTier: 0 },
  basePlanetThrust = 165,
  baseLevelFuel = 180,
  baseRotationSpeed = 3.6
) {
  // Engine Thrust: Base planet thrust * craft multiplier * (1 + 0.08 * engineTier)
  const engineBonusPct = upgradeTier.engineTier * 8;
  const effectiveThrust =
    basePlanetThrust * craft.baseThrustMultiplier * (1 + upgradeTier.engineTier * 0.08);

  // Fuel Capacity: Base level fuel + craft bonus fuel + 15L per fuel tier
  const fuelBonusLiters = craft.baseFuelBonus + upgradeTier.fuelTier * 15;
  const effectiveFuel = baseLevelFuel + fuelBonusLiters;

  // Turn Speed (RCS): Base rotation speed * craft turn multiplier * (1 + 0.10 * turnTier)
  const turnBonusPct = upgradeTier.turnTier * 10;
  const effectiveTurnSpeed =
    baseRotationSpeed * craft.baseTurnMultiplier * (1 + upgradeTier.turnTier * 0.1);

  return {
    thrust: Math.round(effectiveThrust),
    thrustMultiplier: (craft.baseThrustMultiplier * (1 + upgradeTier.engineTier * 0.08)).toFixed(2),
    engineBonusPct,
    fuel: effectiveFuel,
    fuelBonusLiters,
    turnSpeed: Number(effectiveTurnSpeed.toFixed(2)),
    turnBonusPct,
  };
}

// Calculate GC awarded based on run score
export function calculateRunRewardGC(score: number, isLanded: boolean, padMultiplier = 1): number {
  if (!isLanded) {
    // Consolation reward on crash
    return Math.max(25, Math.floor(score / 25));
  }
  // Formula: base 10% of score, with pad multiplier bonus
  const baseReward = Math.floor(score * 0.12);
  const padBonus = Math.floor(padMultiplier * 35);
  return Math.max(60, baseReward + padBonus);
}
