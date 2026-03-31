/**
 * AbilitySystem -- auto-triggered abilities (tequila bomb, photo flash).
 *
 * Pure logic: reads state from store, computes via Immer, emits events.
 * No rendering, no DOM.
 *
 * @module systems/AbilitySystem
 */

import {
  TEQUILA_BOMB_TRIGGERED,
  PHOTO_FLASH_TRIGGERED,
} from '../core/events';
import type {
  GameStore,
  IEventBus,
  GameState,
} from '../types/systems';

// ── Constants ────────────────────────────────────────────────────────────────

const TEQUILA_COOLDOWN = 25;
const TEQUILA_COMBO_TRIGGER = 5;
const SPLASH_RADIUS = 80;

const FLASH_COOLDOWN = 15;
const NEAR_MISS_DIST = 20;
const NEAR_MISS_MIN_DIST = 5;
const FREEZE_DURATION = 1.5;

const TEQUILA_FLASH_DURATION = 0.6;
const PHOTO_FLASH_DURATION = 0.4;

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Decrement ability cooldowns and freeze timer each frame.
 */
export function updateAbilities(store: GameStore, dt: number): void {
  store.update((draft) => {
    const a = draft.effects.abilities;

    if (a.tequilaCooldown > 0) {
      a.tequilaCooldown = Math.max(0, a.tequilaCooldown - dt);
    }
    if (a.flashCooldown > 0) {
      a.flashCooldown = Math.max(0, a.flashCooldown - dt);
    }
    if (a.freezeTimer > 0) {
      a.freezeTimer = Math.max(0, a.freezeTimer - dt);
    }
    if (a.tequilaFlash > 0) {
      a.tequilaFlash = Math.max(0, a.tequilaFlash - dt);
    }
    if (a.photoFlash > 0) {
      a.photoFlash = Math.max(0, a.photoFlash - dt);
    }
  });
}

/**
 * Check if the current combo count triggers a tequila bomb.
 * Triggers at every multiple of TEQUILA_COMBO_TRIGGER (5, 10, 15, ...).
 * Kills enemies within SPLASH_RADIUS of lastKillX/lastKillY.
 */
export function checkTequilaTrigger(
  store: GameStore,
  bus: IEventBus,
  lastKillX: number,
  lastKillY: number,
): boolean {
  const state = store.getState();
  const abilities = state.effects.abilities;
  const comboCount = state.effects.combo.count;

  if (abilities.tequilaCooldown > 0) {
    return false;
  }
  if (comboCount < TEQUILA_COMBO_TRIGGER) {
    return false;
  }
  if (comboCount % TEQUILA_COMBO_TRIGGER !== 0) {
    return false;
  }

  store.update((draft) => {
    const a = draft.effects.abilities;
    a.tequilaCooldown = TEQUILA_COOLDOWN;
    a.tequilaFlash = TEQUILA_FLASH_DURATION;
  });

  bus.emit(TEQUILA_BOMB_TRIGGERED, {
    x: lastKillX,
    y: lastKillY,
    radius: SPLASH_RADIUS,
  });

  return true;
}

interface NearMissBullet {
  readonly x: number;
  readonly y: number;
  readonly isPlayer?: boolean;
}

interface NearMissPlayer {
  readonly x: number;
  readonly y: number;
}

/**
 * Check if any enemy bullet is near enough to trigger a photo flash.
 * Freezes all enemies for FREEZE_DURATION seconds.
 */
export function checkNearMiss(
  store: GameStore,
  bus: IEventBus,
  bullets: readonly NearMissBullet[],
  player: NearMissPlayer,
): boolean {
  const state = store.getState();
  const abilities = state.effects.abilities;

  if (abilities.flashCooldown > 0) {
    return false;
  }
  if (abilities.freezeTimer > 0) {
    return false;
  }

  for (const b of bullets) {
    if (b.isPlayer) {
      continue;
    }
    const dx = b.x - player.x;
    const dy = b.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < NEAR_MISS_DIST && dist > NEAR_MISS_MIN_DIST) {
      store.update((draft) => {
        const a = draft.effects.abilities;
        a.flashCooldown = FLASH_COOLDOWN;
        a.freezeTimer = FREEZE_DURATION;
        a.photoFlash = PHOTO_FLASH_DURATION;
      });

      bus.emit(PHOTO_FLASH_TRIGGERED, {
        playerX: player.x,
        playerY: player.y,
        freezeDuration: FREEZE_DURATION,
      });

      return true;
    }
  }

  return false;
}

/**
 * Check whether enemies are currently frozen by photo flash.
 */
export function isEnemyFrozen(state: GameState): boolean {
  return state.effects.abilities.freezeTimer > 0;
}

/**
 * Returns the tequila bomb splash radius constant.
 */
export function getSplashRadius(): number {
  return SPLASH_RADIUS;
}

// ── Exported constants (for tests) ───────────────────────────────────────────

export {
  TEQUILA_COOLDOWN,
  TEQUILA_COMBO_TRIGGER,
  SPLASH_RADIUS,
  FLASH_COOLDOWN,
  NEAR_MISS_DIST,
  FREEZE_DURATION,
};
