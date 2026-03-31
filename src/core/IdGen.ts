/**
 * Auto-incrementing ID generator for game entities.
 *
 * Supports both numeric IDs (backward compat) and prefixed string IDs
 * for precise entity tracking in tests and debug logs.
 *
 * @module core/IdGen
 */

let nextId = 1;

/** Returns the next unique numeric entity ID. */
export function nextEntityId(): number {
  return nextId++;
}

/** Returns a prefixed entity ID like 'enemy_42'. */
export function nextPrefixedId(prefix: string): string {
  return `${prefix}_${nextId++}`;
}

/** Returns all entities matching a prefix from an array of prefixed IDs. */
export function filterByPrefix(ids: readonly string[], prefix: string): string[] {
  const p = `${prefix}_`;
  return ids.filter(id => id.startsWith(p));
}

/** Extracts the prefix from a prefixed ID (e.g., 'enemy_42' → 'enemy'). */
export function getIdPrefix(id: string): string {
  const idx = id.lastIndexOf('_');
  return idx === -1 ? '' : id.slice(0, idx);
}

/** Entity type prefixes — use these with nextPrefixedId(). */
export const EntityPrefix = {
  ENEMY: 'enemy',
  BULLET: 'bullet',
  POWERUP: 'powerup',
  COMPANION: 'companion',
  HAZARD: 'hazard',
  BOSS: 'boss',
  BARRIER: 'barrier',
  UFO: 'ufo',
  PLAYER: 'player',
  PARTICLE: 'particle',
} as const;

/** Reset the counter (call on game reset). */
export function resetEntityIds(): void {
  nextId = 1;
}

/** Current counter value (for debugging). */
export function peekNextId(): number {
  return nextId;
}
