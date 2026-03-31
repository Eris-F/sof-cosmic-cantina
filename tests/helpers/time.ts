/**
 * Time control helpers for deterministic testing.
 */
import type { GameHarness } from '../fixtures/game.fixture';

/** Advance N frames at default dt (1/144 sec). */
export async function tickFrames(harness: GameHarness, n: number): Promise<void> {
  await harness.tickN(n);
}

/** Advance approximately N seconds of game time. */
export async function tickSeconds(harness: GameHarness, seconds: number): Promise<void> {
  await harness.tickSeconds(seconds);
}

/** Advance frames until a state condition is met (evaluated in browser). */
export async function tickUntilState(
  harness: GameHarness,
  condition: string,
  maxFrames = 1000,
): Promise<number> {
  return harness.tickUntil(condition, maxFrames);
}

/** Advance frames until a specific scene is reached. */
export async function tickUntilScene(
  harness: GameHarness,
  sceneId: string,
  maxFrames = 500,
): Promise<void> {
  await harness.tickUntil(
    `(window).__getState().scene === '${sceneId}'`,
    maxFrames,
  );
}

/** Advance frames until all enemies are cleared. */
export async function tickUntilEnemiesCleared(
  harness: GameHarness,
  maxFrames = 2000,
): Promise<number> {
  return harness.tickUntil(
    `(window).__getEntityCount('enemy') === 0`,
    maxFrames,
  );
}
