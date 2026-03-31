/**
 * Player-related Zod schemas.
 * Validates player state, bullets, and weapon state at runtime boundaries.
 */

import { z } from 'zod';

// --- Bullet ---

export const BulletSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  vx: z.number().finite().optional(),
  vy: z.number().finite(),
  active: z.boolean().optional(),
  isPlayer: z.boolean(),
  pierce: z.number().int().min(0).optional(),
  bounceCount: z.number().int().min(0).optional(),
  vampire: z.boolean().optional(),
});

export type Bullet = z.infer<typeof BulletSchema>;

// --- Weapon State ---

export const WeaponStateSchema = z.object({
  activeSlot: z.number().int().min(0),
  slots: z.array(z.string()),
  cooldownTimer: z.number().min(0),
  swapFlash: z.number().min(0),
});

export type WeaponState = z.infer<typeof WeaponStateSchema>;

// --- Player State ---

export const PlayerStateSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  vx: z.number().finite(),
  vy: z.number().finite(),
  width: z.number().positive(),
  height: z.number().positive(),
  lives: z.number().int().min(0),
  maxLives: z.number().int().min(1),
  alive: z.boolean(),
  score: z.number().int().min(0),
  invincibleTimer: z.number().min(0),
  hitboxMul: z.number().positive(),
  damageMul: z.number().positive(),
  reversedControls: z.boolean(),
  weapon: WeaponStateSchema,
  _nextLifeAt: z.number().int().optional(),
});

export type PlayerState = z.infer<typeof PlayerStateSchema>;
