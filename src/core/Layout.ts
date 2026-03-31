/**
 * Layout — dynamic game dimensions and derived positions.
 *
 * GAME_WIDTH is always 480. GAME_HEIGHT adapts to the device viewport.
 * All Y-dependent positions (barriers, player spawn, HUD) derive from
 * the current game height.
 *
 * The HUD lives at the top (y = 0 to HUD_HEIGHT). Gameplay runs from
 * HUD_HEIGHT to GAME_HEIGHT.
 *
 * @module core/Layout
 */

/** Fixed game width. */
export const GAME_WIDTH = 480;

/** Minimum game height (original design). */
export const MIN_GAME_HEIGHT = 640;

/** HUD bar height at the top of the screen. */
export const HUD_HEIGHT = 52;

/** Current dynamic game height — set by applyLayout(). */
let gameHeight = MIN_GAME_HEIGHT;

/** Get the current game height. */
export function getGameHeight(): number {
  return gameHeight;
}

/** Set game height from viewport calculation. Called on boot + resize. */
export function setGameHeight(h: number): void {
  gameHeight = Math.max(MIN_GAME_HEIGHT, Math.round(h));
}

// ── Derived positions (all relative to current gameHeight) ──────────────

/** Y position where barriers start. ~140px from bottom. */
export function getBarrierY(): number {
  return gameHeight - 140;
}

/** Y position where player spawns. ~56px from bottom. */
export function getPlayerSpawnY(): number {
  return gameHeight - 56;
}

/** Top of the gameplay area (below HUD). */
export function getGameplayTop(): number {
  return HUD_HEIGHT;
}

/** Y threshold where enemies reaching means game over. */
export function getEnemyDeathLine(): number {
  return gameHeight - 80;
}

/** Center Y of the gameplay area (for centered text, banners). */
export function getGameplayCenterY(): number {
  return HUD_HEIGHT + (gameHeight - HUD_HEIGHT) / 2;
}
