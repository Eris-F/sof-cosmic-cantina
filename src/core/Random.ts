/**
 * Seedable PRNG — drop-in replacement for Math.random().
 *
 * Uses mulberry32 algorithm (fast, good distribution, 32-bit state).
 * All game code should use random() instead of Math.random().
 * Tests call seed(42) for reproducible runs.
 *
 * @module core/Random
 */

/** Mulberry32 — a fast 32-bit seeded PRNG. */
function mulberry32(s: number): () => number {
  let state = s | 0;
  return (): number => {
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let rng: () => number = Math.random;

/** Returns a random number in [0, 1). Seedable. */
export function random(): number {
  return rng();
}

/** Returns a random integer in [min, max]. */
export function randomInt(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/** Returns a random element from an array. */
export function randomPick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

/** Seed the PRNG for deterministic output. Pass undefined to revert to Math.random. */
export function seed(s?: number): void {
  rng = s !== undefined ? mulberry32(s) : Math.random;
}

/** Reset to non-deterministic Math.random. */
export function unseed(): void {
  rng = Math.random;
}
