// ============================================
// GAME BALANCE — All tuning values
// ============================================

import type { Difficulty, ShakePresetId, SpecialType, Rarity } from '../types/game';

// --- Screen Shake Presets ---
export interface ShakePreset {
  readonly intensity: number;
  readonly duration: number;
}

export const SHAKE_PRESETS: Readonly<Record<ShakePresetId, ShakePreset>> = Object.freeze({
  tequilaBomb: { intensity: 10, duration: 0.5 },
  bossDefeat: { intensity: 10, duration: 0.5 },
  bombPickup: { intensity: 8, duration: 0.4 },
  enemyHit: { intensity: 6, duration: 0.3 },
  waveClear: { intensity: 3, duration: 0.15 },
} as const);

// --- Slow-Mo Presets ---
export interface SlowmoPreset {
  readonly duration: number;
  readonly factor: number;
}

export const SLOWMO_PRESETS = Object.freeze({
  waveClear: { duration: 0.4, factor: 0.2 },
} as const);

// --- Coin Rewards ---
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

export const COIN_REWARDS: CoinRewards = Object.freeze({
  kill: 4,
  eliteKill: 20,
  bossKill: 200,
  ufoKill: 40,
  waveClear: 60,
  perfectWave: 120,
  combo3: 12,
  combo5: 32,
  combo8: 60,
} as const);

// --- Boss ---
export interface BossConfig {
  readonly baseHp: number;
  readonly hpPerTier: number;
  readonly baseScore: number;
  readonly entrySpeed: number;
  readonly width: number;
  readonly height: number;
  readonly moveSpeed: number;
  readonly targetY: number;
  readonly deathDuration: number;
}

export const BOSS: BossConfig = Object.freeze({
  baseHp: 40,
  hpPerTier: 15,
  baseScore: 500,
  entrySpeed: 60,
  width: 64,
  height: 48,
  moveSpeed: 40,
  targetY: 80,
  deathDuration: 2.0,
} as const);

// --- Combo ---
export interface ComboConfig {
  readonly window: number;
  readonly tequilaTrigger: number;
  readonly multiplierPerHit: number;
}

export const COMBO: ComboConfig = Object.freeze({
  window: 0.8,
  tequilaTrigger: 5,
  multiplierPerHit: 0.1,
} as const);

// --- Abilities ---
export interface AbilitiesConfig {
  readonly tequilaCooldown: number;
  readonly tequilaSplashRadius: number;
  readonly tequilaFlashDuration: number;
  readonly flashCooldown: number;
  readonly flashNearMissDist: number;
  readonly flashFreezeDuration: number;
  readonly photoFlashDuration: number;
}

export const ABILITIES: AbilitiesConfig = Object.freeze({
  tequilaCooldown: 25,
  tequilaSplashRadius: 80,
  tequilaFlashDuration: 0.6,
  flashCooldown: 15,
  flashNearMissDist: 20,
  flashFreezeDuration: 1.5,
  photoFlashDuration: 0.4,
} as const);

// --- Hazards ---
export interface HazardsConfig {
  readonly startWave: number;
  readonly spawnWindowMin: number;
  readonly spawnWindowMax: number;
  readonly initialSpawnMin: number;
  readonly initialSpawnMax: number;
  readonly asteroidChance: number;
  readonly laserChance: number;
  readonly blackHoleForce: number;
  readonly laserWarmup: number;
  readonly laserDuration: number;
  readonly laserWidth: number;
  readonly blackHoleDurationMin: number;
  readonly blackHoleDurationMax: number;
}

export const HAZARDS: HazardsConfig = Object.freeze({
  startWave: 4,
  spawnWindowMin: 6,
  spawnWindowMax: 8,
  initialSpawnMin: 8,
  initialSpawnMax: 5,
  asteroidChance: 0.4,
  laserChance: 0.7,
  blackHoleForce: 150,
  laserWarmup: 1.5,
  laserDuration: 3.0,
  laserWidth: 4,
  blackHoleDurationMin: 5,
  blackHoleDurationMax: 3,
} as const);

// --- Powerups ---
export interface PowerupsConfig {
  readonly dropChance: number;
  readonly fallSpeed: number;
  readonly spreadDuration: number;
  readonly rapidDuration: number;
  readonly ricochetDuration: number;
  readonly maxSpreadStacks: number;
  readonly maxRapidStacks: number;
  readonly maxRicochetStacks: number;
}

export const POWERUPS: PowerupsConfig = Object.freeze({
  dropChance: 0.12,
  fallSpeed: 80,
  spreadDuration: 10,
  rapidDuration: 10,
  ricochetDuration: 10,
  maxSpreadStacks: 5,
  maxRapidStacks: 5,
  maxRicochetStacks: 3,
} as const);

// --- Extra Life ---
export const EXTRA_LIFE_THRESHOLD = 5000 as const;

// --- Enemy Collision ---
export const ENEMY_COLLISION_THRESHOLD = 10 as const;

// --- Streak Milestones ---
export interface StreakMilestone {
  readonly kills: number;
  readonly text: string;
  readonly color: string;
}

export const STREAK_MILESTONES: readonly StreakMilestone[] = Object.freeze([
  { kills: 10, text: 'KILLING SPREE!', color: '#ff8844' },
  { kills: 20, text: 'UNSTOPPABLE!', color: '#ff4488' },
  { kills: 35, text: 'RAMPAGE!', color: '#ff2222' },
  { kills: 50, text: 'GODLIKE!', color: '#ffcc00' },
  { kills: 75, text: 'LEGENDARY!', color: '#ff44ff' },
  { kills: 100, text: 'BEYOND GODLIKE!', color: '#44ffff' },
] as const);

// --- Achievement Thresholds ---
export interface AchievementThresholdsConfig {
  readonly scoreThreshold: number;
  readonly killsThreshold: number;
  readonly accuracyThreshold: number;
  readonly achievementCheckCooldown: number;
  readonly popupDuration: number;
}

export const ACHIEVEMENT_THRESHOLDS: AchievementThresholdsConfig = Object.freeze({
  scoreThreshold: 10000,
  killsThreshold: 100,
  accuracyThreshold: 80,
  achievementCheckCooldown: 1.0,
  popupDuration: 3.0,
} as const);

// --- Rarity Thresholds (by price) ---
export const RARITY_THRESHOLDS: Readonly<Record<Rarity, number>> = Object.freeze({
  common: 300,
  rare: 600,
  epic: 1000,
  legendary: 2000,
} as const);

// --- Darkness Spotlight ---
export interface DarknessSpotlightConfig {
  readonly inner: number;
  readonly outer: number;
}

export const DARKNESS_SPOTLIGHT: DarknessSpotlightConfig = Object.freeze({
  inner: 30,
  outer: 120,
} as const);

// --- Difficulty Settings ---
export interface DifficultySettings {
  readonly label: string;
  readonly color: string;
  readonly lives: number;
  readonly enemySpeedMul: number;
  readonly enemyFireMul: number;
  readonly playerSpeedMul: number;
  readonly scoreMul: number;
}

export const DIFFICULTIES: Readonly<Record<Difficulty, DifficultySettings>> = Object.freeze({
  easy: {
    label: 'EASY',
    color: '#44ff44',
    lives: 5,
    enemySpeedMul: 0.7,
    enemyFireMul: 1.5,
    playerSpeedMul: 1.1,
    scoreMul: 0.5,
  },
  normal: {
    label: 'NORMAL',
    color: '#ffcc00',
    lives: 3,
    enemySpeedMul: 1.0,
    enemyFireMul: 1.0,
    playerSpeedMul: 1.0,
    scoreMul: 1.0,
  },
  hard: {
    label: 'HARD',
    color: '#ff4444',
    lives: 2,
    enemySpeedMul: 1.4,
    enemyFireMul: 0.6,
    playerSpeedMul: 1.0,
    scoreMul: 2.0,
  },
} as const);

export const DIFFICULTY_KEYS: readonly Difficulty[] = Object.freeze(['easy', 'normal', 'hard'] as const);

// --- Enemy Special Type HP ---
export const SPECIAL_HP: Readonly<Partial<Record<SpecialType, number>>> = Object.freeze({
  shielded: 2,
  tank: 5,
  berserker: 2,
  vampire: 2,
  summoner: 3,
} as const);

// --- Enemy Special Unlocks by Wave ---
export const SPECIAL_UNLOCK_WAVES: Readonly<Partial<Record<SpecialType, number>>> = Object.freeze({
  shielded: 1,
  bomber: 1,
  sniper: 2,
  speed_demon: 2,
  healer: 3,
  splitter: 3,
  teleporter: 5,
  tank: 5,
  mirror: 7,
  vampire: 7,
  summoner: 10,
  ghost_enemy: 10,
  berserker: 12,
} as const);

// --- Elite Chance ---
export const ELITE_START_WAVE = 3 as const;
export const ELITE_CHANCE = 0.08 as const;
export const ELITE_HP = 3 as const;

// --- Special Enemy Chance ---
export const SPECIAL_BASE_CHANCE = 0.10 as const;
export const SPECIAL_CHANCE_PER_WAVE = 0.01 as const;
export const SPECIAL_MAX_CHANCE = 0.25 as const;

// --- Dive Bomb Timing ---
export const DIVE_TIMER_MIN = 4 as const;
export const DIVE_TIMER_MAX = 6 as const;
export const DIVE_SPEED_MIN = 120 as const;
export const DIVE_SPEED_MAX = 60 as const;

// --- Boss Types ---
export interface BossTypeConfig {
  readonly name: string;
  readonly color1: string;
  readonly color2: string;
  readonly bulletColor: string;
  readonly petals: string;
}

export const BOSS_TYPES: readonly BossTypeConfig[] = Object.freeze([
  { name: 'MEGA SMISKI', color1: '#88cc88', color2: '#a0e0a0', bulletColor: '#88ee88', petals: 'smiski' },
  { name: 'ULTRA JELLYCAT', color1: '#cc88cc', color2: '#ddaadd', bulletColor: '#ee88cc', petals: 'jellycat' },
  { name: 'DEATH TIE', color1: '#556677', color2: '#4488cc', bulletColor: '#ff4444', petals: 'tie' },
] as const);

// --- Boss Attack Timers ---
export const BOSS_ATTACK_TIMERS = Object.freeze({
  spread: 1.2,
  rapidBurst: 0.8,
  spiral: 1.5,
} as const);

// --- Combo Labels ---
export const COMBO_LABELS = Object.freeze(['', '', 'DOUBLE!', 'TRIPLE!', 'QUAD!', 'PENTA!', 'MEGA!', 'ULTRA!', 'INSANE!'] as const);
