/**
 * Test data factories — create valid game entities with sensible defaults.
 *
 * All factories return plain objects (no class instances) so they survive
 * JSON serialisation when passed through page.evaluate().
 *
 * Every factory accepts an optional `overrides` bag that is shallow-merged
 * onto the default object, letting callers set only the fields they care about.
 *
 * Usage:
 *   const enemy = makeEnemy({ type: 'jellycat', elite: true });
 *   await harness.setState({ combat: { grid: { enemies: [enemy] } } });
 */

// ---------------------------------------------------------------------------
// Shared counter for unique IDs within a single test run.
// Tests needing determinism should pass an explicit id override.
// ---------------------------------------------------------------------------

let _nextId = 1;
function nextId(): number {
  return _nextId++;
}

/** Reset the factory ID counter — useful in beforeEach hooks. */
export function resetFactoryIds(): void {
  _nextId = 1;
}

// ---------------------------------------------------------------------------
// Enemy
// ---------------------------------------------------------------------------

export interface EnemyOverrides {
  id?: number;
  x?: number;
  y?: number;
  baseX?: number;
  baseY?: number;
  targetY?: number;
  entering?: boolean;
  entryDelay?: number;
  row?: number;
  col?: number;
  type?: string;
  points?: number;
  alive?: boolean;
  flashTimer?: number;
  elite?: boolean;
  hp?: number;
  special?: string | null;
  pattern?: string;
  patternSpeed?: number;
  patternRadius?: number;
  patternPhase?: number;
  moveTime?: number;
  guaranteedDrop?: boolean;
  [key: string]: unknown;
}

/**
 * Returns a valid Enemy object.
 *
 * Defaults represent a live, standard non-elite enemy in the top-left grid
 * cell with 1 HP and no special behaviour.
 */
export function makeEnemy(overrides: EnemyOverrides = {}): Record<string, unknown> {
  return {
    id: nextId(),
    x: 60,
    y: 80,
    baseX: 60,
    baseY: 80,
    targetY: 80,
    entering: false,
    entryDelay: 0,
    row: 0,
    col: 0,
    type: 'smiski',
    points: 10,
    alive: true,
    flashTimer: 0,
    elite: false,
    hp: 1,
    special: null,
    pattern: 'lock_step',
    patternSpeed: 0,
    patternRadius: 0,
    patternPhase: 0,
    moveTime: 0,
    guaranteedDrop: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Bullet
// ---------------------------------------------------------------------------

export interface BulletOverrides {
  id?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  active?: boolean;
  isPlayer?: boolean;
  pierce?: number;
  bounceCount?: number;
  vampire?: boolean;
  [key: string]: unknown;
}

/**
 * Returns a valid Bullet object.
 *
 * Defaults represent a player bullet moving upward from mid-screen.
 */
export function makeBullet(overrides: BulletOverrides = {}): Record<string, unknown> {
  return {
    id: nextId(),
    x: 240,
    y: 500,
    vx: 0,
    vy: -8,
    active: true,
    isPlayer: true,
    pierce: 0,
    bounceCount: 0,
    vampire: false,
    ...overrides,
  };
}

/**
 * Returns a valid enemy Bullet object (isPlayer = false, moving downward).
 */
export function makeEnemyBullet(overrides: BulletOverrides = {}): Record<string, unknown> {
  return makeBullet({
    vy: 4,
    isPlayer: false,
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// Boss
// ---------------------------------------------------------------------------

export interface BossOverrides {
  active?: boolean;
  x?: number;
  y?: number;
  targetY?: number;
  width?: number;
  height?: number;
  hp?: number;
  maxHp?: number;
  type?: {
    name?: string;
    color1?: string;
    color2?: string;
    bulletColor?: string;
    petals?: string;
  };
  direction?: number;
  speed?: number;
  phase?: 'enter' | 'fight' | 'dying';
  flashTimer?: number;
  attackTimer?: number;
  attackPattern?: number;
  deathTimer?: number;
  time?: number;
  [key: string]: unknown;
}

/**
 * Returns a valid BossState object.
 *
 * Defaults represent an active boss in the fight phase at half health.
 */
export function makeBoss(overrides: BossOverrides = {}): Record<string, unknown> {
  const type = {
    name: 'Cactus King',
    color1: '#4CAF50',
    color2: '#8BC34A',
    bulletColor: '#CDDC39',
    petals: '#FF5722',
    ...(overrides.type ?? {}),
  };

  const { type: _type, ...rest } = overrides;
  void _type; // consumed above

  return {
    active: true,
    x: 240,
    y: 80,
    targetY: 80,
    width: 60,
    height: 60,
    hp: 50,
    maxHp: 100,
    type,
    direction: 1,
    speed: 1.5,
    phase: 'fight',
    flashTimer: 0,
    attackTimer: 0,
    attackPattern: 0,
    deathTimer: 0,
    time: 0,
    ...rest,
  };
}

// ---------------------------------------------------------------------------
// Powerup
// ---------------------------------------------------------------------------

export interface PowerupOverrides {
  id?: number;
  x?: number;
  y?: number;
  type?: string;
  alive?: boolean;
  [key: string]: unknown;
}

/**
 * Returns a valid Powerup object.
 *
 * Defaults represent a live spread powerup falling near mid-screen.
 */
export function makePowerup(overrides: PowerupOverrides = {}): Record<string, unknown> {
  return {
    id: nextId(),
    x: 240,
    y: 200,
    type: 'spread',
    alive: true,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Hazards
// ---------------------------------------------------------------------------

export interface AsteroidOverrides {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  size?: number;
  rotation?: number;
  rotSpeed?: number;
  [key: string]: unknown;
}

/**
 * Returns a valid AsteroidHazard object moving diagonally downward.
 */
export function makeAsteroid(overrides: AsteroidOverrides = {}): Record<string, unknown> {
  return {
    kind: 'asteroid',
    x: 120,
    y: -20,
    vx: 0.5,
    vy: 2,
    size: 18,
    rotation: 0,
    rotSpeed: 0.05,
    ...overrides,
  };
}

export interface LaserOverrides {
  y?: number;
  warmup?: number;
  timer?: number;
  width?: number;
  [key: string]: unknown;
}

/**
 * Returns a valid LaserHazard object in warm-up phase.
 */
export function makeLaser(overrides: LaserOverrides = {}): Record<string, unknown> {
  return {
    kind: 'laser',
    y: 300,
    warmup: 60,
    timer: 60,
    width: 480,
    ...overrides,
  };
}

export interface BlackHoleOverrides {
  x?: number;
  y?: number;
  radius?: number;
  timer?: number;
  [key: string]: unknown;
}

/**
 * Returns a valid BlackHoleHazard object at mid-screen.
 */
export function makeBlackHole(overrides: BlackHoleOverrides = {}): Record<string, unknown> {
  return {
    kind: 'blackhole',
    x: 240,
    y: 300,
    radius: 40,
    timer: 300,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Companion
// ---------------------------------------------------------------------------

export interface CompanionOverrides {
  id?: number;
  angle?: number;
  x?: number;
  y?: number;
  fireTimer?: number;
  [key: string]: unknown;
}

/**
 * Returns a valid Companion object orbiting the player.
 *
 * The `id` doubles as the orbit index (0-based slot).
 */
export function makeCompanion(overrides: CompanionOverrides = {}): Record<string, unknown> {
  return {
    id: 0,
    angle: 0,
    x: 260,
    y: 530,
    fireTimer: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Barrier block / group
// ---------------------------------------------------------------------------

export interface BarrierBlockOverrides {
  x?: number;
  y?: number;
  hp?: number;
  alive?: boolean;
  type?: string;
  [key: string]: unknown;
}

/**
 * Returns a valid BarrierBlock object.
 */
export function makeBarrierBlock(overrides: BarrierBlockOverrides = {}): Record<string, unknown> {
  return {
    x: 120,
    y: 480,
    hp: 3,
    alive: true,
    type: 'flowers',
    ...overrides,
  };
}

export interface BarrierGroupOverrides {
  blocks?: ReturnType<typeof makeBarrierBlock>[];
  [key: string]: unknown;
}

/**
 * Returns a valid BarrierGroup containing a small row of blocks.
 *
 * By default produces 4 adjacent blocks at y=480.
 */
export function makeBarrierGroup(overrides: BarrierGroupOverrides = {}): Record<string, unknown> {
  const { blocks, ...rest } = overrides;
  return {
    blocks: blocks ?? [
      makeBarrierBlock({ x: 100, y: 480 }),
      makeBarrierBlock({ x: 112, y: 480 }),
      makeBarrierBlock({ x: 124, y: 480 }),
      makeBarrierBlock({ x: 136, y: 480 }),
    ],
    ...rest,
  };
}
