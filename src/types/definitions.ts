/**
 * Definition interfaces — shapes for config objects, system contexts,
 * and action payloads.
 *
 * @module types/definitions
 */
import type { ShopItemStats, SkillBranchId, ModifierEffects } from './game';
import type { Bullet } from './entities';
import type { GameState } from './state';

// ── Weapon definitions ──────────────────────────────────────────────────────

export interface WeaponDef {
  readonly id: string;
  readonly name: string;
  readonly desc: string;
  readonly cooldown: number;
  readonly fire: (x: number, y: number, bullets: Bullet[]) => void;
}

// ── Shop item ───────────────────────────────────────────────────────────────

export interface ShopItem {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  readonly desc: string;
  readonly perk: string;
  readonly stats: ShopItemStats;
}

export interface ShopItemCatalog {
  readonly [category: string]: readonly ShopItem[];
  readonly skins: readonly ShopItem[];
  readonly bullets: readonly ShopItem[];
  readonly trails: readonly ShopItem[];
  readonly barriers: readonly ShopItem[];
}

export interface CategoryDef {
  readonly id: string;
  readonly name: string;
}

// ── Skill definitions ───────────────────────────────────────────────────────

export type SkillStatKey =
  | 'fireRate' | 'bulletSpeed' | 'maxBullets' | 'allFire'
  | 'speed' | 'dodge' | 'allSpeed'
  | 'lives' | 'startShield' | 'invincTime' | 'livesDodge' | 'allSurvival'
  | 'coins' | 'score' | 'allMoney'
  | 'powerDur' | 'powerDrop' | 'startAlly' | 'allPower';

export interface SkillLevel {
  readonly name: string;
  readonly cost: number;
  readonly perk: string;
  readonly stat: SkillStatKey;
  readonly value: number;
}

export interface SkillBranch {
  readonly id: SkillBranchId;
  readonly name: string;
  readonly desc: string;
  readonly levels: readonly SkillLevel[];
}

export interface SkillBonuses {
  fireRateMul: number;
  bulletSpeedMul: number;
  maxBulletBonus: number;
  speedMul: number;
  dodgeChance: number;
  extraLives: number;
  startShield: number;
  invincTimeBonus: number;
  coinMul: number;
  scoreMul: number;
  powerupDurationMul: number;
  powerupDropBonus: number;
  startCompanions: number;
}

// ── Achievement ─────────────────────────────────────────────────────────────

export interface AchievementDef {
  readonly id: string;
  readonly name: string;
  readonly desc: string;
  readonly check: ((state: GameState) => boolean) | null;
}

export interface AchievementSystemState {
  cooldown: number;
  popups: Array<{ name: string; desc: string; timer: number }>;
}

// ── Difficulty ──────────────────────────────────────────────────────────────

export interface DifficultySettings {
  extraRows?: number;
  enemySpeedMul?: number;
  enemyFireMul?: number;
}

// ── Input / Player actions ──────────────────────────────────────────────────

export interface EquippedStats {
  speedMul?: number;
  fireRateMul?: number;
  bulletSpeedMul?: number;
  maxBulletBonus?: number;
  pierce?: number;
  coinMul?: number;
  scoreMul?: number;
  hitboxMul?: number;
  dodgeChance?: number;
  damageMul?: number;
  [key: string]: number | boolean | undefined;
}

export interface PlayerActions {
  MOVE_LEFT?: boolean;
  MOVE_RIGHT?: boolean;
  FIRE?: boolean;
  WEAPON_SWAP?: boolean;
  TOUCH_MOVE?: { readonly x: number; readonly y: number };
  equippedStats?: EquippedStats;
}

// ── System contexts ─────────────────────────────────────────────────────────

export interface CollisionContext {
  dodgeChance?: number;
  damageMul?: number;
  scoreMul?: number;
}

export interface WaveContext {
  difficulty?: DifficultySettings;
  coinMul?: number;
  modCoinMul?: number;
}

// ── Modifier definition ─────────────────────────────────────────────────────

export interface ModifierDef {
  readonly id: string;
  readonly name: string;
  readonly desc: string;
  readonly color: string;
  readonly apply: () => ModifierEffects;
}

// ── Enemy type definition ───────────────────────────────────────────────────

export interface EnemyTypeDef {
  readonly name: string;
  readonly points: number;
}

// ── Coin rewards ────────────────────────────────────────────────────────────

export interface CoinRewards {
  readonly kill: number;
  readonly eliteKill: number;
  readonly bossKill: number;
  readonly ufoKill: number;
  readonly waveClear: number;
  readonly perfectWave: number;
  readonly combo3: number;
  readonly combo5: number;
  readonly combo8: number;
}

// ── Streak milestone ────────────────────────────────────────────────────────

export interface StreakMilestone {
  readonly kills: number;
  readonly text: string;
  readonly color: string;
}

// ── Petal color palettes ────────────────────────────────────────────────────

export type PetalColorKey =
  | 'smiski' | 'jellycat' | 'tie'
  | 'barrier_tulip' | 'barrier_lily'
  | 'ufo_glass' | 'ufo_liquid';
