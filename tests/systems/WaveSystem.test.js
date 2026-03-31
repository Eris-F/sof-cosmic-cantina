import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGameStore } from '../../src/core/Store.js';
import { EventBus } from '../../src/core/EventBus.js';
import { createWaveSystem } from '../../src/systems/WaveSystem.js';
import { createInitialState } from '../../src/state/GameState.js';
import {
  WAVE_CLEARED,
  WAVE_START,
  MODIFIER_APPLIED,
  COINS_EARNED,
} from '../../src/core/events.js';

/**
 * Helper: create a store where all enemies are already dead (wave cleared state).
 * @param {object} [overrides] - Partial state overrides
 * @param {object} [deps] - System dependencies
 */
function setupCleared(overrides = {}, deps = {}) {
  const base = createInitialState();
  const defaultState = {
    ...base,
    combat: {
      ...base.combat,
      grid: { ...base.combat.grid, enemies: [] }, // All dead
      waveTextTimer: 0,
      ...overrides.combat,
    },
    player: { ...base.player, ...overrides.player },
    economy: { ...base.economy, ...overrides.economy },
    config: { ...base.config, ...overrides.config },
  };

  const store = createGameStore(() => defaultState);
  const eventBus = new EventBus();
  const system = createWaveSystem(store, eventBus, deps);

  return { store, eventBus, system };
}

describe('WaveSystem', () => {
  describe('wave clear detection', () => {
    it('detects wave cleared when all enemies are dead', () => {
      const { store, eventBus, system } = setupCleared();

      const cleared = vi.fn();
      eventBus.on(WAVE_CLEARED, cleared);

      system.update(0);

      expect(cleared).toHaveBeenCalledOnce();
      expect(store.getState().combat.wave).toBe(2);

      store.destroy();
    });

    it('does not trigger if enemies remain alive', () => {
      const base = createInitialState();
      const enemy = {
        x: 100, y: 100, alive: true, entering: false, hp: 1,
        type: 'smiski', special: null,
      };

      const store = createGameStore(() => ({
        ...base,
        combat: {
          ...base.combat,
          grid: { ...base.combat.grid, enemies: [enemy] },
          waveTextTimer: 0,
        },
      }));
      const eventBus = new EventBus();
      const system = createWaveSystem(store, eventBus);

      const cleared = vi.fn();
      eventBus.on(WAVE_CLEARED, cleared);

      system.update(0);

      expect(cleared).not.toHaveBeenCalled();
      expect(store.getState().combat.wave).toBe(1);

      store.destroy();
    });

    it('detects boss wave cleared when boss is defeated', () => {
      const base = createInitialState();
      const boss = {
        x: 240, y: 80, width: 64, height: 48, hp: 0, maxHp: 10, active: false,
        phase: 1, direction: 1, attackTimer: 5, pattern: null,
      };

      const store = createGameStore(() => ({
        ...base,
        combat: {
          ...base.combat,
          isBossWave: true,
          boss,
          waveTextTimer: 0,
        },
      }));
      const eventBus = new EventBus();
      const system = createWaveSystem(store, eventBus);

      const cleared = vi.fn();
      eventBus.on(WAVE_CLEARED, cleared);

      system.update(0);

      expect(cleared).toHaveBeenCalledOnce();

      store.destroy();
    });

    it('does not trigger if waveTextTimer is active', () => {
      const base = createInitialState();
      const store = createGameStore(() => ({
        ...base,
        combat: {
          ...base.combat,
          grid: { ...base.combat.grid, enemies: [] },
          waveTextTimer: 1.5, // Still showing wave text
        },
      }));
      const eventBus = new EventBus();
      const system = createWaveSystem(store, eventBus);

      const cleared = vi.fn();
      eventBus.on(WAVE_CLEARED, cleared);

      system.update(0);

      expect(cleared).not.toHaveBeenCalled();

      store.destroy();
    });

    it('does not trigger if player is dead', () => {
      const { store, eventBus, system } = setupCleared({
        player: { alive: false },
      });

      const cleared = vi.fn();
      eventBus.on(WAVE_CLEARED, cleared);

      system.update(0);

      expect(cleared).not.toHaveBeenCalled();

      store.destroy();
    });
  });

  describe('coin rewards', () => {
    it('awards wave clear coins (60 base)', () => {
      const { store, eventBus, system } = setupCleared();

      const earned = vi.fn();
      eventBus.on(COINS_EARNED, earned);

      system.update(0);

      const wallet = store.getState().economy.wallet;
      expect(wallet.coins).toBeGreaterThanOrEqual(60);
      expect(earned).toHaveBeenCalled();

      const waveClearCall = earned.mock.calls.find(
        (c) => c[0].reason === 'waveClear',
      );
      expect(waveClearCall).toBeDefined();
      expect(waveClearCall[0].amount).toBe(60);

      store.destroy();
    });

    it('awards perfect wave bonus (120) when no hits taken and wave > 1', () => {
      const { store, eventBus, system } = setupCleared({
        combat: {
          wave: 2,
          hitThisWave: false,
          grid: { enemies: [], speed: 30, direction: 1, dropAmount: 16, fireMul: 1, renderScale: 1, ghostFlicker: 0 },
          waveTextTimer: 0,
        },
      });

      const earned = vi.fn();
      eventBus.on(COINS_EARNED, earned);

      system.update(0);

      const perfectCall = earned.mock.calls.find(
        (c) => c[0].reason === 'perfectWave',
      );
      expect(perfectCall).toBeDefined();
      expect(perfectCall[0].amount).toBe(120);

      // Total should be 60 + 120 = 180
      const wallet = store.getState().economy.wallet;
      expect(wallet.coins).toBe(180);

      store.destroy();
    });

    it('no perfect wave bonus on wave 1', () => {
      const { store, eventBus, system } = setupCleared({
        combat: {
          wave: 1,
          hitThisWave: false,
          grid: { enemies: [], speed: 30, direction: 1, dropAmount: 16, fireMul: 1, renderScale: 1, ghostFlicker: 0 },
          waveTextTimer: 0,
        },
      });

      const earned = vi.fn();
      eventBus.on(COINS_EARNED, earned);

      system.update(0);

      const perfectCall = earned.mock.calls.find(
        (c) => c[0].reason === 'perfectWave',
      );
      expect(perfectCall).toBeUndefined();

      store.destroy();
    });

    it('no perfect wave bonus when hit was taken', () => {
      const { store, eventBus, system } = setupCleared({
        combat: {
          wave: 3,
          hitThisWave: true,
          grid: { enemies: [], speed: 30, direction: 1, dropAmount: 16, fireMul: 1, renderScale: 1, ghostFlicker: 0 },
          waveTextTimer: 0,
        },
      });

      const earned = vi.fn();
      eventBus.on(COINS_EARNED, earned);

      system.update(0);

      const perfectCall = earned.mock.calls.find(
        (c) => c[0].reason === 'perfectWave',
      );
      expect(perfectCall).toBeUndefined();

      store.destroy();
    });

    it('applies coin multiplier from context', () => {
      const { store, system } = setupCleared();

      system.update(0, { coinMul: 2 });

      const wallet = store.getState().economy.wallet;
      expect(wallet.coins).toBe(120); // 60 * 2

      store.destroy();
    });
  });

  describe('boss wave spawning', () => {
    it('spawns boss on every 5th wave in classic mode', () => {
      const createBoss = vi.fn((wave) => ({
        x: 240, y: 80, width: 64, height: 48, hp: wave * 10, maxHp: wave * 10,
        active: true, phase: 1, direction: 1, attackTimer: 5, pattern: null,
      }));
      const createEnemyGrid = vi.fn(() => ({
        enemies: [], speed: 30, direction: 1, dropAmount: 16,
        fireMul: 1, renderScale: 1, ghostFlicker: 0,
      }));

      const { store, system } = setupCleared(
        {
          combat: {
            wave: 4, // Will advance to 5
            grid: { enemies: [], speed: 30, direction: 1, dropAmount: 16, fireMul: 1, renderScale: 1, ghostFlicker: 0 },
            waveTextTimer: 0,
          },
          config: { gameMode: 'classic', difficulty: 'normal' },
        },
        { createBoss, createEnemyGrid },
      );

      system.update(0);

      expect(store.getState().combat.isBossWave).toBe(true);
      expect(createBoss).toHaveBeenCalledWith(5);

      store.destroy();
    });

    it('does not spawn boss in endless mode', () => {
      const createBoss = vi.fn();
      const createEnemyGrid = vi.fn(() => ({
        enemies: [], speed: 30, direction: 1, dropAmount: 16,
        fireMul: 1, renderScale: 1, ghostFlicker: 0,
      }));

      const { store, system } = setupCleared(
        {
          combat: {
            wave: 4,
            grid: { enemies: [], speed: 30, direction: 1, dropAmount: 16, fireMul: 1, renderScale: 1, ghostFlicker: 0 },
            waveTextTimer: 0,
          },
          config: { gameMode: 'endless', difficulty: 'normal' },
        },
        { createBoss, createEnemyGrid },
      );

      system.update(0);

      expect(store.getState().combat.isBossWave).toBe(false);
      expect(createBoss).not.toHaveBeenCalled();

      store.destroy();
    });
  });

  describe('modifier application', () => {
    it('applies a modifier on wave advance', () => {
      const { store, eventBus, system } = setupCleared();

      const modApplied = vi.fn();
      eventBus.on(MODIFIER_APPLIED, modApplied);

      system.update(0);

      expect(modApplied).toHaveBeenCalledOnce();
      const state = store.getState();
      expect(state.combat.modifier).toBeDefined();
      expect(state.combat.modifierBannerTimer).toBe(3.0);

      store.destroy();
    });

    it('emits WAVE_START with wave info', () => {
      const { store, eventBus, system } = setupCleared();

      const waveStart = vi.fn();
      eventBus.on(WAVE_START, waveStart);

      system.update(0);

      expect(waveStart).toHaveBeenCalledOnce();
      expect(waveStart.mock.calls[0][0].wave).toBe(2);

      store.destroy();
    });
  });

  describe('per-wave state reset', () => {
    it('clears bullets and powerups on wave advance', () => {
      const base = createInitialState();
      const store = createGameStore(() => ({
        ...base,
        combat: {
          ...base.combat,
          grid: { ...base.combat.grid, enemies: [] },
          bullets: [
            { x: 100, y: 100, vx: 0, vy: -350, active: true, isPlayer: true },
          ],
          powerups: [
            { x: 200, y: 300, type: 'spread', alive: true },
          ],
          waveTextTimer: 0,
        },
      }));
      const eventBus = new EventBus();
      const system = createWaveSystem(store, eventBus);

      system.update(0);

      const state = store.getState();
      expect(state.combat.bullets.length).toBe(0);
      expect(state.combat.powerups.length).toBe(0);

      store.destroy();
    });

    it('resets hitThisWave flag', () => {
      const { store, system } = setupCleared({
        combat: {
          hitThisWave: true,
          grid: { enemies: [], speed: 30, direction: 1, dropAmount: 16, fireMul: 1, renderScale: 1, ghostFlicker: 0 },
          waveTextTimer: 0,
        },
      });

      system.update(0);

      expect(store.getState().combat.hitThisWave).toBe(false);

      store.destroy();
    });
  });
});
