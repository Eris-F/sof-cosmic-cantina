import {
  UFO_SPAWN_MIN,
  UFO_SPAWN_MAX,
  ENEMY_BASE_SPEED,
  ENEMY_DROP,
} from '../config/constants';
import type { Direction, ModifierId, ModifierEffects } from '../types/game';
import { random } from '../core/Random';
import type {
  Bullet,
  BarrierGroup,
  Companion,
  Powerup,
  Enemy,
  Hazard,
  AsteroidHazard,
  LaserHazard,
  BlackHoleHazard,
} from '../types/systems';

export interface BossState {
  readonly active: boolean;
  readonly x: number;
  readonly y: number;
  readonly targetY: number;
  readonly width: number;
  readonly height: number;
  readonly hp: number;
  readonly maxHp: number;
  readonly type: {
    readonly name: string;
    readonly color1: string;
    readonly color2: string;
    readonly bulletColor: string;
    readonly petals: string;
  };
  readonly direction: Direction;
  readonly speed: number;
  readonly phase: 'enter' | 'fight' | 'dying';
  readonly flashTimer: number;
  readonly attackTimer: number;
  readonly attackPattern: number;
  readonly deathTimer: number;
  readonly time: number;
}

export interface UFOState {
  readonly x: number;
  readonly y: number;
  readonly active: boolean;
  readonly direction: Direction;
  readonly scoreValue: number;
  readonly timer: number;
  readonly spawnInterval: number;
  readonly showScoreTimer: number;
  readonly showScoreX: number;
  readonly showScoreValue: number;
}

export interface EnemyGridState {
  readonly enemies: readonly Enemy[];
  readonly speed: number;
  readonly baseSpeed: number;
  readonly direction: Direction;
  readonly dropAmount: number;
  readonly fireMul: number;
  readonly renderScale: number;
  readonly ghostFlicker: boolean;
  readonly fireTimer: number;
  readonly animFrame: number;
  readonly animTimer: number;
  readonly entryTime: number;
  readonly diveTimer: number;
  readonly divers: readonly Enemy[];
  readonly isEnemyFrozen: boolean;
  readonly freezeTimer: number;
  readonly formationName?: string;
  readonly recentFormations?: readonly string[];
}

export interface HazardState {
  readonly spawnTimer: number;
  readonly asteroids: readonly AsteroidHazard[];
  readonly lasers: readonly LaserHazard[];
  readonly blackHoles: readonly BlackHoleHazard[];
  /** @deprecated Use separate arrays. Kept for migration from single-array systems. */
  readonly active: readonly Hazard[];
}

export interface CombatState {
  readonly wave: number;
  readonly isBossWave: boolean;
  readonly grid: EnemyGridState;
  readonly boss: BossState | null;
  readonly bullets: readonly Bullet[];
  readonly barriers: readonly BarrierGroup[];
  readonly ufo: UFOState;
  readonly powerups: readonly Powerup[];
  readonly hazards: HazardState;
  readonly companions: readonly Companion[];
  readonly waveTextTimer: number;
  readonly hitThisWave: boolean;
  readonly modifier: ModifierId | null;
  readonly modifierEffects: ModifierEffects;
  readonly modifierBannerTimer: number;
}

/**
 * Returns a random UFO spawn interval within configured bounds.
 */
function randomUfoInterval(): number {
  return UFO_SPAWN_MIN + random() * (UFO_SPAWN_MAX - UFO_SPAWN_MIN);
}

/**
 * Creates a fresh combat state with default values.
 */
export function createCombatState(): CombatState {
  return {
    wave: 1,
    isBossWave: false,
    grid: {
      enemies: [],
      speed: ENEMY_BASE_SPEED,
      baseSpeed: ENEMY_BASE_SPEED,
      direction: 1,
      dropAmount: ENEMY_DROP,
      fireMul: 1,
      renderScale: 1,
      ghostFlicker: false,
      fireTimer: 0,
      animFrame: 0,
      animTimer: 0,
      entryTime: 0,
      diveTimer: 0,
      divers: [],
      isEnemyFrozen: false,
      freezeTimer: 0,
    },
    boss: null,
    bullets: [],
    barriers: [],
    ufo: {
      x: 0,
      y: 0,
      active: false,
      direction: 1,
      scoreValue: 0,
      timer: randomUfoInterval(),
      spawnInterval: randomUfoInterval(),
      showScoreTimer: 0,
      showScoreX: 0,
      showScoreValue: 0,
    },
    powerups: [],
    hazards: {
      spawnTimer: 0,
      asteroids: [],
      lasers: [],
      blackHoles: [],
      active: [],
    },
    companions: [],
    waveTextTimer: 0,
    hitThisWave: false,
    modifier: null,
    modifierEffects: {},
    modifierBannerTimer: 0,
  };
}
