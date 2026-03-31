/**
 * Custom Playwright assertions for game state.
 *
 * Usage:
 *   import { gameExpect } from '../helpers/assertions';
 *   await gameExpect(harness).toBeInScene('menu');
 *   await gameExpect(harness).toHaveCoins(500);
 */
import type { GameHarness } from '../fixtures/game.fixture';
import { expect } from '@playwright/test';

/**
 * Wrapper providing domain-specific assertions against the game harness.
 */
export function gameExpect(harness: GameHarness) {
  return {
    /** Assert the current scene matches. */
    async toBeInScene(expected: string) {
      const scene = await harness.getScene();
      expect(scene, `Expected scene "${expected}" but got "${scene}"`).toBe(expected);
    },

    /** Assert coin count matches. */
    async toHaveCoins(expected: number) {
      const coins = await harness.getCoins();
      expect(coins, `Expected ${expected} coins but got ${coins}`).toBe(expected);
    },

    /** Assert coin count is at least N. */
    async toHaveMinCoins(min: number) {
      const coins = await harness.getCoins();
      expect(coins, `Expected at least ${min} coins but got ${coins}`).toBeGreaterThanOrEqual(min);
    },

    /** Assert player health matches. */
    async toHaveHealth(expected: number) {
      const health = await harness.getHealth();
      expect(health, `Expected health ${expected} but got ${health}`).toBe(expected);
    },

    /** Assert player lives matches. */
    async toHaveLives(expected: number) {
      const lives = await harness.getLives();
      expect(lives, `Expected ${expected} lives but got ${lives}`).toBe(expected);
    },

    /** Assert score matches. */
    async toHaveScore(expected: number) {
      const score = await harness.getScore();
      expect(score, `Expected score ${expected} but got ${score}`).toBe(expected);
    },

    /** Assert score is at least N. */
    async toHaveMinScore(min: number) {
      const score = await harness.getScore();
      expect(score, `Expected score >= ${min} but got ${score}`).toBeGreaterThanOrEqual(min);
    },

    /** Assert active enemy count. */
    async toHaveActiveEnemies(expected: number) {
      const count = await harness.getEntityCount('enemy');
      expect(count, `Expected ${expected} enemies but got ${count}`).toBe(expected);
    },

    /** Assert at least N enemies exist. */
    async toHaveMinEnemies(min: number) {
      const count = await harness.getEntityCount('enemy');
      expect(count, `Expected >= ${min} enemies but got ${count}`).toBeGreaterThanOrEqual(min);
    },

    /** Assert no enemies remain. */
    async toHaveNoEnemies() {
      const count = await harness.getEntityCount('enemy');
      expect(count, `Expected 0 enemies but got ${count}`).toBe(0);
    },

    /** Assert entity count for any type. */
    async toHaveEntityCount(type: string, expected: number) {
      const count = await harness.getEntityCount(type);
      expect(count, `Expected ${expected} ${type}(s) but got ${count}`).toBe(expected);
    },

    /** Assert an event was emitted. */
    async toHaveEmitted(eventType: string) {
      const events = await harness.getEvents(eventType);
      expect(events.length, `Expected event "${eventType}" to have been emitted`).toBeGreaterThan(0);
    },

    /** Assert an event was emitted exactly N times. */
    async toHaveEmittedTimes(eventType: string, count: number) {
      const events = await harness.getEvents(eventType);
      expect(events.length, `Expected "${eventType}" emitted ${count} times but got ${events.length}`).toBe(count);
    },

    /** Assert no event of this type was emitted. */
    async toNotHaveEmitted(eventType: string) {
      const events = await harness.getEvents(eventType);
      expect(events.length, `Expected "${eventType}" to NOT be emitted but it was (${events.length} times)`).toBe(0);
    },

    /** Assert wave number. */
    async toBeOnWave(expected: number) {
      const hud = await harness.getHUDState();
      expect(hud.wave, `Expected wave ${expected} but got ${hud.wave}`).toBe(expected);
    },

    /** Assert no JS errors occurred. */
    async toHaveNoErrors() {
      const errors = await harness.getErrors();
      expect(errors, `Expected no errors but got: ${errors.join(', ')}`).toHaveLength(0);
    },

    /** Assert a zone exists. */
    async toHaveZone(zoneName: string) {
      const zone = await harness.getZone(zoneName);
      expect(zone, `Expected zone "${zoneName}" to exist`).not.toBeNull();
    },

    /** Assert particle count. */
    async toHaveParticles(min = 1) {
      const count = await harness.getParticleCount();
      expect(count, `Expected >= ${min} particles but got ${count}`).toBeGreaterThanOrEqual(min);
    },

    /** Assert no particles exist. */
    async toHaveNoParticles() {
      const count = await harness.getParticleCount();
      expect(count, `Expected 0 particles but got ${count}`).toBe(0);
    },

    /** Assert a specific state property matches. */
    async toHaveStateProperty(path: string, expected: unknown) {
      const state = await harness.getState();
      const value = path.split('.').reduce((obj: any, key) => obj?.[key], state);
      expect(value, `Expected state.${path} to be ${JSON.stringify(expected)} but got ${JSON.stringify(value)}`).toEqual(expected);
    },
  };
}
