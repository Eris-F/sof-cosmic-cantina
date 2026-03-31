/**
 * Combat-entity Zod schemas.
 * Validates enemies, bosses, barriers, UFOs, powerups, hazards, and companions.
 */

import { z } from 'zod';

// --- Enemy ---

const SpecialTypeEnum = z.enum([
  'shielded', 'healer', 'splitter', 'teleporter', 'speed_demon',
  'berserker', 'vampire', 'summoner', 'mirror', 'tank',
  'bomber', 'sniper', 'phaser', 'gravity', 'ghost_enemy',
]);

export const EnemySchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  baseX: z.number().finite(),
  baseY: z.number().finite(),
  targetY: z.number().finite(),
  entering: z.boolean(),
  entryDelay: z.number().min(0),
  row: z.number().int().min(0),
  col: z.number().int().min(0),
  type: z.string(),
  points: z.number().int().min(0),
  alive: z.boolean(),
  flashTimer: z.number().min(0),
  elite: z.boolean(),
  hp: z.number().int().min(0),
  special: SpecialTypeEnum.nullable(),
  pattern: z.string(),
  patternSpeed: z.number().finite(),
  patternRadius: z.number().finite(),
  patternPhase: z.number().finite(),
  moveTime: z.number().min(0),
  guaranteedDrop: z.boolean().optional(),
  teleportTimer: z.number().optional(),
  healTimer: z.number().optional(),
  bomberTimer: z.number().optional(),
  sniperTimer: z.number().optional(),
  vampTimer: z.number().optional(),
  summonTimer: z.number().optional(),
  ghostPhase: z.number().optional(),
  diving: z.boolean().optional(),
  divePhase: z.number().optional(),
  diveTime: z.number().optional(),
  homeX: z.number().optional(),
  homeY: z.number().optional(),
  diveSpeed: z.number().optional(),
});

export type Enemy = z.infer<typeof EnemySchema>;

// --- Enemy Grid ---

export const EnemyGridSchema = z.object({
  enemies: z.array(EnemySchema),
  speed: z.number().finite(),
  baseSpeed: z.number().finite().optional(),
  direction: z.number().int().min(-1).max(1),
  dropAmount: z.number().min(0).optional(),
  fireMul: z.number().finite(),
  renderScale: z.number().positive().optional(),
  ghostFlicker: z.boolean().optional(),
  fireTimer: z.number().min(0),
  animFrame: z.number().int().min(0),
  animTimer: z.number().min(0),
  entryTime: z.number().min(0),
  diveTimer: z.number().min(0),
  divers: z.array(EnemySchema),
  isEnemyFrozen: z.boolean(),
  freezeTimer: z.number().min(0),
  formationName: z.string().optional(),
  recentFormations: z.array(z.string()).optional(),
});

export type EnemyGrid = z.infer<typeof EnemyGridSchema>;

// --- Boss ---

export const BossSchema = z.object({
  active: z.boolean(),
  x: z.number().finite(),
  y: z.number().finite(),
  targetY: z.number().finite(),
  width: z.number().positive(),
  height: z.number().positive(),
  hp: z.number().int().min(0),
  maxHp: z.number().int().positive(),
  type: z.object({
    name: z.string().min(1),
    color1: z.string(),
    color2: z.string(),
    bulletColor: z.string(),
    petals: z.string(),
  }),
  direction: z.number().int().min(-1).max(1),
  speed: z.number().positive(),
  phase: z.enum(['enter', 'fight', 'dying']),
  flashTimer: z.number().min(0),
  attackTimer: z.number().min(0),
  attackPattern: z.number().int().min(0),
  deathTimer: z.number().min(0),
  time: z.number().min(0),
});

export type Boss = z.infer<typeof BossSchema>;

// --- Barrier Block ---

export const BarrierBlockSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  hp: z.number().int().min(0),
  maxHp: z.number().int().positive(),
  type: z.enum(['tulip', 'lily']),
  alive: z.boolean(),
});

export type BarrierBlock = z.infer<typeof BarrierBlockSchema>;

// --- UFO ---

export const UfoSchema = z.object({
  active: z.boolean(),
  x: z.number().finite(),
  y: z.number().finite(),
  direction: z.number().int().min(-1).max(1),
  timer: z.number().min(0),
  scoreValue: z.number().int().min(0),
  showScoreTimer: z.number().min(0),
  showScoreX: z.number().finite(),
  showScoreValue: z.number().int().min(0),
});

export type Ufo = z.infer<typeof UfoSchema>;

// --- Powerup ---

const PowerupTypeEnum = z.enum([
  'spread',
  'rapid',
  'shield',
  'bomb',
  'ricochet',
  'companion',
]);

export const PowerupSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  type: PowerupTypeEnum,
  alive: z.boolean(),
});

export type Powerup = z.infer<typeof PowerupSchema>;

// --- Hazards ---

export const AsteroidSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  vx: z.number().finite(),
  vy: z.number().finite(),
  size: z.number().positive(),
  rotation: z.number().finite(),
  rotSpeed: z.number().finite(),
});

export type Asteroid = z.infer<typeof AsteroidSchema>;

export const LaserSchema = z.object({
  x: z.number().finite(),
  width: z.number().positive(),
  timer: z.number(),
  warmup: z.number(),
});

export type Laser = z.infer<typeof LaserSchema>;

export const BlackHoleSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  radius: z.number().positive(),
  timer: z.number(),
});

export type BlackHole = z.infer<typeof BlackHoleSchema>;

export const HazardsStateSchema = z.object({
  asteroids: z.array(AsteroidSchema),
  lasers: z.array(LaserSchema),
  blackHoles: z.array(BlackHoleSchema),
  spawnTimer: z.number(),
});

export type HazardsState = z.infer<typeof HazardsStateSchema>;

// --- Companion ---

export const CompanionSchema = z.object({
  id: z.number().int().min(0),
  angle: z.number().finite(),
  x: z.number().finite(),
  y: z.number().finite(),
  fireTimer: z.number().min(0),
});

export type Companion = z.infer<typeof CompanionSchema>;

export const CompanionsStateSchema = z.object({
  cats: z.array(CompanionSchema),
  nextId: z.number().int().min(0),
});

export type CompanionsState = z.infer<typeof CompanionsStateSchema>;
