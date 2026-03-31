/**
 * SkillSystem -- skill tree upgrades and bonus computation.
 *
 * Pure logic: reads state from store, computes via Immer, emits events.
 * No rendering, no DOM.
 *
 * @module systems/SkillSystem
 */

import { SKILL_UPGRADED } from '../core/events';
import type {
  GameStore,
  IEventBus,
  SkillBranch,
  SkillBonuses,
  SkillLevels,
} from '../types/systems';
import type { SkillBranchId } from '../types/game';

// ── Skill branch definitions ─────────────────────────────────────────────────

export const SKILL_BRANCHES: readonly SkillBranch[] = Object.freeze([
  {
    id: 'tequila' as SkillBranchId,
    name: 'TEQUILA TOLERANCE',
    desc: 'Offensive power',
    levels: [
      { name: 'Sip', cost: 100, perk: 'Fire Rate +5%', stat: 'fireRate' as const, value: 0.05 },
      { name: 'Shot', cost: 250, perk: 'Fire Rate +10%', stat: 'fireRate' as const, value: 0.10 },
      { name: 'Double', cost: 500, perk: 'Bullet Speed +15%', stat: 'bulletSpeed' as const, value: 0.15 },
      { name: 'Bottle', cost: 1000, perk: 'Extra Bullet +1', stat: 'maxBullets' as const, value: 1 },
      { name: 'Barrel', cost: 2000, perk: 'All Fire Stats +20%', stat: 'allFire' as const, value: 0.20 },
    ],
  },
  {
    id: 'skiing' as SkillBranchId,
    name: 'SKI LEGS',
    desc: 'Speed & agility',
    levels: [
      { name: 'Bunny Slope', cost: 100, perk: 'Speed +5%', stat: 'speed' as const, value: 0.05 },
      { name: 'Blue Run', cost: 250, perk: 'Speed +10%', stat: 'speed' as const, value: 0.10 },
      { name: 'Red Run', cost: 500, perk: 'Dodge +5%', stat: 'dodge' as const, value: 0.05 },
      { name: 'Black Diamond', cost: 1000, perk: 'Speed +15%', stat: 'speed' as const, value: 0.15 },
      { name: 'Heli-Ski', cost: 2000, perk: 'Dodge +15% Speed +10%', stat: 'allSpeed' as const, value: 0.15 },
    ],
  },
  {
    id: 'diving' as SkillBranchId,
    name: 'DEEP LUNGS',
    desc: 'Survivability',
    levels: [
      { name: 'Snorkel', cost: 100, perk: '+1 Starting Life', stat: 'lives' as const, value: 1 },
      { name: 'Scuba', cost: 300, perk: 'Shield on Spawn', stat: 'startShield' as const, value: 1 },
      { name: 'Free Dive', cost: 600, perk: 'Invincibility +0.5s', stat: 'invincTime' as const, value: 0.5 },
      { name: 'Saturation', cost: 1200, perk: '+1 Life, Dodge +5%', stat: 'livesDodge' as const, value: 1 },
      { name: 'Mariana', cost: 2500, perk: '+2 Lives, Shield x2', stat: 'allSurvival' as const, value: 2 },
    ],
  },
  {
    id: 'photography' as SkillBranchId,
    name: 'SHARP EYE',
    desc: 'Coins & scoring',
    levels: [
      { name: 'Point & Shoot', cost: 100, perk: 'Coins +10%', stat: 'coins' as const, value: 0.10 },
      { name: 'DSLR', cost: 250, perk: 'Score +10%', stat: 'score' as const, value: 0.10 },
      { name: 'Mirrorless', cost: 500, perk: 'Coins +20%', stat: 'coins' as const, value: 0.20 },
      { name: 'Medium Format', cost: 1000, perk: 'Score +20%', stat: 'score' as const, value: 0.20 },
      { name: 'Hasselblad', cost: 2000, perk: 'Coins x2 Score +25%', stat: 'allMoney' as const, value: 1.0 },
    ],
  },
  {
    id: 'music' as SkillBranchId,
    name: 'RAVE ENERGY',
    desc: 'Power-ups & allies',
    levels: [
      { name: 'Pre-game', cost: 150, perk: 'Power-Up Duration +10%', stat: 'powerDur' as const, value: 0.10 },
      { name: 'Warm Up', cost: 350, perk: 'Power-Up Drop Rate +5%', stat: 'powerDrop' as const, value: 0.05 },
      { name: 'Main Stage', cost: 700, perk: 'Start with 1 Companion', stat: 'startAlly' as const, value: 1 },
      { name: 'Peak Hour', cost: 1500, perk: 'Power-Up Duration +25%', stat: 'powerDur' as const, value: 0.25 },
      { name: 'After Party', cost: 3000, perk: '+2 Companions, Duration +50%', stat: 'allPower' as const, value: 2 },
    ],
  },
]);

const MAX_LEVEL = 5;

// ── Bonus computation ────────────────────────────────────────────────────────

/**
 * Computes all cumulative bonuses from the given skill levels.
 * Multipliers stack multiplicatively, flat bonuses stack additively.
 */
export function getSkillBonuses(skillLevels: SkillLevels): SkillBonuses {
  const bonuses: SkillBonuses = {
    fireRateMul: 1,
    bulletSpeedMul: 1,
    maxBulletBonus: 0,
    speedMul: 1,
    dodgeChance: 0,
    extraLives: 0,
    startShield: 0,
    invincTimeBonus: 0,
    coinMul: 1,
    scoreMul: 1,
    powerupDurationMul: 1,
    powerupDropBonus: 0,
    startCompanions: 0,
  };

  for (const branch of SKILL_BRANCHES) {
    const level = skillLevels[branch.id] ?? 0;
    for (let i = 0; i < level; i++) {
      const skill = branch.levels[i];
      if (!skill) continue;
      switch (skill.stat) {
        case 'fireRate':
          bonuses.fireRateMul *= (1 + skill.value);
          break;
        case 'bulletSpeed':
          bonuses.bulletSpeedMul *= (1 + skill.value);
          break;
        case 'maxBullets':
          bonuses.maxBulletBonus += skill.value;
          break;
        case 'allFire':
          bonuses.fireRateMul *= (1 + skill.value);
          bonuses.bulletSpeedMul *= (1 + skill.value);
          bonuses.maxBulletBonus += 1;
          break;
        case 'speed':
          bonuses.speedMul *= (1 + skill.value);
          break;
        case 'dodge':
          bonuses.dodgeChance += skill.value;
          break;
        case 'allSpeed':
          bonuses.speedMul *= (1 + skill.value);
          bonuses.dodgeChance += skill.value;
          break;
        case 'lives':
          bonuses.extraLives += skill.value;
          break;
        case 'startShield':
          bonuses.startShield += skill.value;
          break;
        case 'invincTime':
          bonuses.invincTimeBonus += skill.value;
          break;
        case 'livesDodge':
          bonuses.extraLives += skill.value;
          bonuses.dodgeChance += 0.05;
          break;
        case 'allSurvival':
          bonuses.extraLives += skill.value;
          bonuses.startShield += 2;
          bonuses.dodgeChance += 0.1;
          break;
        case 'coins':
          bonuses.coinMul *= (1 + skill.value);
          break;
        case 'score':
          bonuses.scoreMul *= (1 + skill.value);
          break;
        case 'allMoney':
          bonuses.coinMul *= 2;
          bonuses.scoreMul *= 1.25;
          break;
        case 'powerDur':
          bonuses.powerupDurationMul *= (1 + skill.value);
          break;
        case 'powerDrop':
          bonuses.powerupDropBonus += skill.value;
          break;
        case 'startAlly':
          bonuses.startCompanions += skill.value;
          break;
        case 'allPower':
          bonuses.startCompanions += skill.value;
          bonuses.powerupDurationMul *= 1.5;
          break;
        default:
          break;
      }
    }
  }

  return bonuses;
}

// ── Upgrade ──────────────────────────────────────────────────────────────────

interface UpgradeResult {
  readonly success: boolean;
  readonly newLevel?: number;
  readonly reason?: string;
}

/**
 * Attempts to upgrade a skill branch. Validates cost, level cap, and balance.
 * On success: deducts coins, increments skill level.
 */
export function upgradeSkill(store: GameStore, branchId: string): UpgradeResult {
  const state = store.getState();
  const branch = SKILL_BRANCHES.find((b) => b.id === branchId);
  if (!branch) {
    return { success: false, reason: 'invalid_branch' };
  }

  const currentLevel = state.economy.skillLevels[branchId as SkillBranchId] ?? 0;
  if (currentLevel >= MAX_LEVEL) {
    return { success: false, reason: 'max_level' };
  }

  const nextSkill = branch.levels[currentLevel];
  if (!nextSkill) {
    return { success: false, reason: 'invalid_level' };
  }
  if (state.economy.wallet.coins < nextSkill.cost) {
    return { success: false, reason: 'insufficient_funds' };
  }

  const newLevel = currentLevel + 1;

  store.update((draft) => {
    draft.economy.wallet.coins -= nextSkill.cost;
    draft.economy.skillLevels[branchId as SkillBranchId] = newLevel;
  });

  return { success: true, newLevel };
}

// ── Event wiring ─────────────────────────────────────────────────────────────

interface SkillActions {
  upgrade(branchId: string): UpgradeResult;
  getBonuses(): SkillBonuses;
}

/**
 * Creates a skill upgrade action that emits SKILL_UPGRADED on success
 * and triggers merged-stats recomputation.
 */
export function createSkillActions(
  bus: IEventBus,
  store: GameStore,
  recomputeStats: () => void,
): SkillActions {
  return {
    upgrade(branchId: string): UpgradeResult {
      const result = upgradeSkill(store, branchId);
      if (result.success) {
        recomputeStats();
        bus.emit(SKILL_UPGRADED, { branchId, newLevel: result.newLevel });
      }
      return result;
    },

    getBonuses(): SkillBonuses {
      const state = store.getState();
      return getSkillBonuses(state.economy.skillLevels);
    },
  };
}
