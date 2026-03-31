/**
 * Config Zod schemas.
 * Validates game tuning values, difficulty settings, weapon definitions, and modifiers.
 */

import { z } from 'zod';

// --- Difficulty ---

export const DifficultySchema = z.object({
  label: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  lives: z.number().int().min(1).max(10),
  enemySpeedMul: z.number().positive(),
  enemyFireMul: z.number().positive(),
  playerSpeedMul: z.number().positive(),
  scoreMul: z.number().positive(),
});

export type Difficulty = z.infer<typeof DifficultySchema>;

// --- Weapon Definition ---

export const WeaponDefSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  desc: z.string(),
  cooldown: z.number().positive(),
  fire: z.function(),
});

export type WeaponDef = z.infer<typeof WeaponDefSchema>;

// --- Modifier Definition ---

export const ModifierDefSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  desc: z.string(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  apply: z.function(),
});

export type ModifierDef = z.infer<typeof ModifierDefSchema>;

// --- Star Layer ---

const StarLayerSchema = z.object({
  count: z.number().int().positive(),
  speed: z.number().positive(),
  sizeMin: z.number().positive(),
  sizeMax: z.number().positive(),
  alpha: z.number().min(0).max(1),
});

export type StarLayer = z.infer<typeof StarLayerSchema>;

// --- Balance Config ---

export const BalanceConfigSchema = z.object({
  // Canvas
  canvasWidth: z.number().int().positive(),
  canvasHeight: z.number().int().positive(),

  // Player
  playerWidth: z.number().int().positive(),
  playerHeight: z.number().int().positive(),
  playerSpeed: z.number().positive(),
  playerAccel: z.number().positive(),
  playerDecel: z.number().positive(),
  playerYOffset: z.number().int().min(0),
  maxBullets: z.number().int().min(1),
  bulletSpeed: z.number().positive(),
  bulletWidth: z.number().int().positive(),
  bulletHeight: z.number().int().positive(),
  invincibilityTime: z.number().positive(),
  initialLives: z.number().int().min(1),
  extraLifeScore: z.number().int().positive(),

  // Enemies
  enemyCols: z.number().int().min(1),
  enemyRows: z.number().int().min(1),
  enemyWidth: z.number().int().positive(),
  enemyHeight: z.number().int().positive(),
  enemyPaddingX: z.number().int().min(0),
  enemyPaddingY: z.number().int().min(0),
  enemyBaseSpeed: z.number().positive(),
  enemySpeedIncrease: z.number().min(0),
  enemyDrop: z.number().int().positive(),
  enemyFireIntervalMin: z.number().positive(),
  enemyFireIntervalMax: z.number().positive(),
  enemyBulletSpeed: z.number().positive(),

  // Points
  pointsSmiski: z.number().int().positive(),
  pointsJellycat: z.number().int().positive(),
  pointsTie: z.number().int().positive(),
  pointsUfo: z.array(z.number().int().positive()).min(1),

  // UFO
  ufoWidth: z.number().int().positive(),
  ufoHeight: z.number().int().positive(),
  ufoSpeed: z.number().positive(),
  ufoSpawnMin: z.number().positive(),
  ufoSpawnMax: z.number().positive(),

  // Barriers
  barrierCount: z.number().int().min(1),
  barrierBlockSize: z.number().int().positive(),
  barrierY: z.number().int().positive(),

  // Particles
  petalCountMin: z.number().int().min(0),
  petalCountMax: z.number().int().positive(),
  petalLifetimeMin: z.number().positive(),
  petalLifetimeMax: z.number().positive(),
  petalGravity: z.number().positive(),

  // Starfield
  starLayers: z.array(StarLayerSchema).min(1),

  // UI
  waveTextDuration: z.number().positive(),
  highScoreMax: z.number().int().min(1),

  // Difficulties
  difficulties: z.record(z.string(), DifficultySchema),
});

export type BalanceConfig = z.infer<typeof BalanceConfigSchema>;
