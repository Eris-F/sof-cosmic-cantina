/**
 * PowerupSystem -- powerup spawning, movement, collection, and active effect tracking.
 *
 * Pure logic: reads state from store, computes via Immer, emits events.
 * No rendering, no DOM.
 *
 * @module systems/PowerupSystem
 */

import { CANVAS_HEIGHT } from '../constants';
import {
  POWERUP_COLLECTED,
  POWERUP_EXPIRED,
  POWERUP_SPAWNED,
  BOMB_ACTIVATED,
} from '../core/events';
import { random } from '../core/Random';
import type {
  GameStore,
  IEventBus,
  GameState,
  Powerup,
} from '../types/systems';

// ── Constants ────────────────────────────────────────────────────────────────

const POWERUP_FALL_SPEED = 80;
const POWERUP_DURATION = 10;
const DROP_CHANCE = 0.12;

const MAX_SPREAD_STACKS = 5;
const MAX_RAPID_STACKS = 5;
const MAX_RICOCHET_STACKS = 3;

export const POWERUP_TYPES = Object.freeze({
  SPREAD: 'spread',
  RAPID: 'rapid',
  SHIELD: 'shield',
  BOMB: 'bomb',
  RICOCHET: 'ricochet',
  COMPANION: 'companion',
} as const);

type PowerupTypeValue = typeof POWERUP_TYPES[keyof typeof POWERUP_TYPES];

const ALL_TYPES: readonly PowerupTypeValue[] = Object.values(POWERUP_TYPES);

// ── Spawning ─────────────────────────────────────────────────────────────────

/**
 * Maybe spawn a powerup at position (x, y). 12% chance normally, 100% if guaranteed.
 * Adds the powerup directly to store combat.powerups.
 */
export function maybeSpawnPowerup(
  store: GameStore,
  bus: IEventBus,
  x: number,
  y: number,
  guaranteedDrop: boolean = false,
): boolean {
  if (!guaranteedDrop && random() > DROP_CHANCE) {
    return false;
  }

  const type = ALL_TYPES[Math.floor(random() * ALL_TYPES.length)] ?? 'spread';
  const powerup: Powerup = { x, y, type, alive: true };

  store.update((draft) => {
    draft.combat.powerups.push(powerup);
  });

  bus.emit(POWERUP_SPAWNED, { x, y, type });
  return true;
}

// ── Movement ─────────────────────────────────────────────────────────────────

/**
 * Move all powerups downward. Remove those that fall off-screen.
 */
export function updatePowerups(store: GameStore, dt: number): void {
  store.update((draft) => {
    const remaining: Powerup[] = [];
    for (const p of draft.combat.powerups) {
      const updated: Powerup = { ...p, y: p.y + POWERUP_FALL_SPEED * dt };
      if (updated.y <= CANVAS_HEIGHT + 20) {
        remaining.push(updated);
      }
    }
    draft.combat.powerups = remaining;
  });
}

// ── Collection / application ─────────────────────────────────────────────────

/**
 * Apply a powerup effect to the active effects in store.
 */
export function applyPowerup(
  store: GameStore,
  bus: IEventBus,
  type: string,
): void {
  store.update((draft) => {
    const fx = draft.effects.activeEffects;

    switch (type) {
      case POWERUP_TYPES.SPREAD:
        fx.spreadStacks = Math.min(fx.spreadStacks + 1, MAX_SPREAD_STACKS);
        fx.spreadTimer += POWERUP_DURATION;
        break;

      case POWERUP_TYPES.RAPID:
        fx.rapidStacks = Math.min(fx.rapidStacks + 1, MAX_RAPID_STACKS);
        fx.rapidTimer += POWERUP_DURATION;
        break;

      case POWERUP_TYPES.SHIELD:
        fx.shieldHits += 1;
        break;

      case POWERUP_TYPES.RICOCHET:
        fx.ricochetStacks = Math.min(fx.ricochetStacks + 1, MAX_RICOCHET_STACKS);
        fx.ricochetTimer += POWERUP_DURATION;
        break;

      case POWERUP_TYPES.BOMB:
        // Bomb effect is handled externally (CollisionSystem kills all enemies)
        break;

      case POWERUP_TYPES.COMPANION:
        // Companion spawning is handled externally
        break;

      default:
        break;
    }
  });

  if (type === POWERUP_TYPES.BOMB) {
    bus.emit(BOMB_ACTIVATED, {});
  }

  bus.emit(POWERUP_COLLECTED, { type });
}

// ── Active effect timers ─────────────────────────────────────────────────────

/**
 * Decrement active effect timers. Expire stacks when timer reaches zero.
 */
export function updateActiveEffects(
  store: GameStore,
  bus: IEventBus,
  dt: number,
): void {
  const expired: string[] = [];

  store.update((draft) => {
    const fx = draft.effects.activeEffects;

    if (fx.spreadTimer > 0) {
      fx.spreadTimer = Math.max(0, fx.spreadTimer - dt);
      if (fx.spreadTimer <= 0) {
        fx.spreadStacks = 0;
        expired.push(POWERUP_TYPES.SPREAD);
      }
    }

    if (fx.rapidTimer > 0) {
      fx.rapidTimer = Math.max(0, fx.rapidTimer - dt);
      if (fx.rapidTimer <= 0) {
        fx.rapidStacks = 0;
        expired.push(POWERUP_TYPES.RAPID);
      }
    }

    if (fx.ricochetTimer > 0) {
      fx.ricochetTimer = Math.max(0, fx.ricochetTimer - dt);
      if (fx.ricochetTimer <= 0) {
        fx.ricochetStacks = 0;
        expired.push(POWERUP_TYPES.RICOCHET);
      }
    }
  });

  for (const type of expired) {
    bus.emit(POWERUP_EXPIRED, { type });
  }
}

// ── Shield helpers ───────────────────────────────────────────────────────────

/**
 * Consume one shield hit. Returns true if shield was available.
 */
export function consumeShield(store: GameStore): boolean {
  const state = store.getState();
  if (state.effects.activeEffects.shieldHits <= 0) {
    return false;
  }

  store.update((draft) => {
    draft.effects.activeEffects.shieldHits -= 1;
  });
  return true;
}

/**
 * Check if shield is active (at least one hit remaining).
 */
export function hasShield(state: GameState): boolean {
  return state.effects.activeEffects.shieldHits > 0;
}

// ── Query helpers ────────────────────────────────────────────────────────────

/**
 * Returns current spread stack count.
 */
export function getSpreadLevel(state: GameState): number {
  return state.effects.activeEffects.spreadStacks;
}

/**
 * Returns the rapid-fire multiplier. Each stack = 40% faster (multiplicative).
 */
export function getRapidMultiplier(state: GameState): number {
  const stacks = state.effects.activeEffects.rapidStacks;
  if (stacks <= 0) {
    return 1;
  }
  return Math.pow(0.6, stacks);
}

// ── Exported constants ───────────────────────────────────────────────────────

export {
  POWERUP_FALL_SPEED,
  POWERUP_DURATION,
  DROP_CHANCE,
  MAX_SPREAD_STACKS,
  MAX_RAPID_STACKS,
  MAX_RICOCHET_STACKS,
};
