/**
 * Entity interfaces — shapes for all in-game objects.
 *
 * @module types/entities
 */
import type { SpecialType, MovementPattern } from './game';

// ── Bullet ──────────────────────────────────────────────────────────────────

export interface Bullet {
  id?: number;
  x: number;
  y: number;
  vx?: number;
  vy: number;
  active?: boolean;
  isPlayer: boolean;
  pierce?: number;
  bounceCount?: number;
  vampire?: boolean;
}

// ── Enemy ───────────────────────────────────────────────────────────────────

export interface Enemy {
  id?: number;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  targetY: number;
  entering: boolean;
  entryDelay: number;
  row: number;
  col: number;
  type: string;
  points: number;
  alive: boolean;
  flashTimer: number;
  elite: boolean;
  hp: number;
  special: SpecialType | null;
  pattern: MovementPattern | string;
  patternSpeed: number;
  patternRadius: number;
  patternPhase: number;
  moveTime: number;
  guaranteedDrop?: boolean;
  teleportTimer?: number;
  healTimer?: number;
  bomberTimer?: number;
  sniperTimer?: number;
  vampTimer?: number;
  summonTimer?: number;
  ghostPhase?: number;
  diving?: boolean;
  divePhase?: number;
  diveTime?: number;
  homeX?: number;
  homeY?: number;
  diveSpeed?: number;
}

// ── Enemy Grid ──────────────────────────────────────────────────────────────

export interface EnemyGridState {
  enemies: Enemy[];
  speed: number;
  baseSpeed?: number;
  direction: number;
  dropAmount?: number;
  fireMul: number;
  renderScale?: number;
  ghostFlicker?: boolean;
  fireTimer: number;
  animFrame: number;
  animTimer: number;
  entryTime: number;
  diveTimer: number;
  divers: Enemy[];
  isEnemyFrozen: boolean;
  freezeTimer: number;
  formationName?: string;
  recentFormations?: string[];
}

// ── Boss ────────────────────────────────────────────────────────────────────

export interface BossType {
  readonly name: string;
  readonly color1: string;
  readonly color2: string;
  readonly bulletColor: string;
  readonly petals: string;
}

export interface BossState {
  active: boolean;
  x: number;
  y: number;
  targetY: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  type: BossType;
  direction: number;
  speed: number;
  phase: 'enter' | 'fight' | 'dying';
  flashTimer: number;
  attackTimer: number;
  attackPattern: number;
  deathTimer: number;
  time: number;
}

// ── UFO ─────────────────────────────────────────────────────────────────────

export interface UFOState {
  x: number;
  y: number;
  active: boolean;
  direction: number;
  scoreValue: number;
  timer: number;
  spawnInterval: number;
  showScoreTimer: number;
  showScoreX: number;
  showScoreValue: number;
}

// ── Barrier ─────────────────────────────────────────────────────────────────

export interface BarrierBlock {
  x: number;
  y: number;
  hp: number;
  alive: boolean;
  type: string;
}

export interface BarrierGroup {
  blocks: BarrierBlock[];
}

// ── Hazard ──────────────────────────────────────────────────────────────────

interface HazardBase {
  kind: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
}

export interface AsteroidHazard extends HazardBase {
  kind: 'asteroid';
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotSpeed: number;
}

export interface LaserHazard extends HazardBase {
  kind: 'laser';
  y: number;
  warmup: number;
  timer: number;
  width: number;
}

export interface BlackHoleHazard extends HazardBase {
  kind: 'blackhole';
  x: number;
  y: number;
  radius: number;
  timer: number;
}

export type Hazard = AsteroidHazard | LaserHazard | BlackHoleHazard;

export interface HazardContainerState {
  spawnTimer: number;
  asteroids: AsteroidHazard[];
  lasers: LaserHazard[];
  blackHoles: BlackHoleHazard[];
  /** @deprecated Use separate arrays. Kept for migration from single-array systems. */
  active: Hazard[];
}

// ── Powerup ─────────────────────────────────────────────────────────────────

export interface Powerup {
  id?: number;
  x: number;
  y: number;
  type: string;
  alive: boolean;
}

// ── Companion ───────────────────────────────────────────────────────────────

export interface Companion {
  id: number; // note: Companion already had id for orbit index
  angle: number;
  x: number;
  y: number;
  fireTimer: number;
}
