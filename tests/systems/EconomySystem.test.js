import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGameStore } from '../../src/core/Store.js';
import { createInitialState } from '../../src/state/GameState.js';
import { EventBus } from '../../src/core/EventBus.js';
import {
  COIN_REWARDS,
  earnCoins,
  earnScore,
  subscribeEconomy,
} from '../../src/systems/EconomySystem.js';
import {
  ENEMY_KILLED,
  BOSS_DEFEATED,
  UFO_HIT,
  WAVE_CLEARED,
  COMBO_INCREMENT,
  COINS_EARNED,
} from '../../src/core/events.js';

/** @returns {import('../../src/core/Store.js').GameStore} */
function makeStore(overrides) {
  return createGameStore(createInitialState, overrides);
}

describe('EconomySystem', () => {
  /** @type {ReturnType<typeof makeStore>} */
  let store;
  /** @type {EventBus} */
  let bus;

  beforeEach(() => {
    store = makeStore();
    bus = new EventBus();
  });

  // ── earnCoins ────────────────────────────────────────────────────────────

  describe('earnCoins', () => {
    it('adds base coins with no multiplier', () => {
      const { earned } = earnCoins(store, 10);

      expect(earned).toBe(10);
      expect(store.getState().economy.wallet.coins).toBe(10);
      expect(store.getState().economy.wallet.totalEarned).toBe(10);
    });

    it('applies coinMul from mergedStats', () => {
      store.update((d) => { d.economy.mergedStats.coinMul = 2; });
      const { earned } = earnCoins(store, 10);

      expect(earned).toBe(20);
      expect(store.getState().economy.wallet.coins).toBe(20);
    });

    it('applies coinMul from modifier effects', () => {
      store.update((d) => { d.combat.modifierEffects.coinMul = 1.5; });
      const { earned } = earnCoins(store, 10);

      expect(earned).toBe(15);
    });

    it('stacks mergedStats and modifier coinMul multiplicatively', () => {
      store.update((d) => {
        d.economy.mergedStats.coinMul = 2;
        d.combat.modifierEffects.coinMul = 1.5;
      });
      const { earned } = earnCoins(store, 10);

      expect(earned).toBe(30);
    });

    it('accumulates across multiple calls', () => {
      earnCoins(store, 5);
      earnCoins(store, 7);

      expect(store.getState().economy.wallet.coins).toBe(12);
      expect(store.getState().economy.wallet.totalEarned).toBe(12);
    });

    it('updates coinsThisGame in ui stats', () => {
      earnCoins(store, 25);

      expect(store.getState().ui.stats.coinsThisGame).toBe(25);
    });
  });

  // ── earnScore ────────────────────────────────────────────────────────────

  describe('earnScore', () => {
    it('adds base score with no multiplier', () => {
      const { points, extraLife } = earnScore(store, 100);

      expect(points).toBe(100);
      expect(extraLife).toBe(false);
      expect(store.getState().player.score).toBe(100);
    });

    it('applies scoreMul from mergedStats', () => {
      store.update((d) => { d.economy.mergedStats.scoreMul = 1.5; });
      const { points } = earnScore(store, 100);

      expect(points).toBe(150);
      expect(store.getState().player.score).toBe(150);
    });

    it('applies scoreMul from modifier effects', () => {
      store.update((d) => { d.combat.modifierEffects.scoreMul = 2; });
      const { points } = earnScore(store, 100);

      expect(points).toBe(200);
    });

    it('grants extra life at 5000 point threshold', () => {
      store.update((d) => { d.player.score = 4900; });
      const { extraLife } = earnScore(store, 200);

      expect(extraLife).toBe(true);
      expect(store.getState().player.score).toBe(5100);
      // Starting lives + 1
      expect(store.getState().player.lives).toBe(store.getState().player.lives);
    });

    it('grants extra life crossing threshold', () => {
      const initialLives = store.getState().player.lives;
      store.update((d) => { d.player.score = 4999; });
      const { extraLife } = earnScore(store, 1);

      expect(extraLife).toBe(true);
      expect(store.getState().player.lives).toBe(initialLives + 1);
    });

    it('does not exceed maxLives', () => {
      store.update((d) => {
        d.player.lives = d.player.maxLives;
        d.player.score = 4999;
      });
      const maxLives = store.getState().player.maxLives;
      earnScore(store, 1);

      expect(store.getState().player.lives).toBe(maxLives);
    });

    it('does not grant extra life below threshold', () => {
      const initialLives = store.getState().player.lives;
      earnScore(store, 4999);

      expect(store.getState().player.lives).toBe(initialLives);
    });
  });

  // ── COIN_REWARDS values ──────────────────────────────────────────────────

  describe('COIN_REWARDS', () => {
    it('has correct coin values for all sources', () => {
      expect(COIN_REWARDS.kill).toBe(4);
      expect(COIN_REWARDS.eliteKill).toBe(20);
      expect(COIN_REWARDS.bossKill).toBe(200);
      expect(COIN_REWARDS.ufoKill).toBe(40);
      expect(COIN_REWARDS.waveClear).toBe(60);
      expect(COIN_REWARDS.perfectWave).toBe(120);
      expect(COIN_REWARDS.combo3).toBe(12);
      expect(COIN_REWARDS.combo5).toBe(32);
      expect(COIN_REWARDS.combo8).toBe(60);
    });
  });

  // ── Event subscriptions ────────────────────────────────────────────────

  describe('subscribeEconomy', () => {
    it('awards coins on ENEMY_KILLED', () => {
      subscribeEconomy(bus, store);
      bus.emit(ENEMY_KILLED, { elite: false });

      expect(store.getState().economy.wallet.coins).toBe(COIN_REWARDS.kill);
    });

    it('awards elite coins on ENEMY_KILLED with elite flag', () => {
      subscribeEconomy(bus, store);
      bus.emit(ENEMY_KILLED, { elite: true });

      expect(store.getState().economy.wallet.coins).toBe(COIN_REWARDS.eliteKill);
    });

    it('awards coins on BOSS_DEFEATED', () => {
      subscribeEconomy(bus, store);
      bus.emit(BOSS_DEFEATED);

      expect(store.getState().economy.wallet.coins).toBe(COIN_REWARDS.bossKill);
    });

    it('awards coins on UFO_HIT', () => {
      subscribeEconomy(bus, store);
      bus.emit(UFO_HIT);

      expect(store.getState().economy.wallet.coins).toBe(COIN_REWARDS.ufoKill);
    });

    it('awards coins on WAVE_CLEARED', () => {
      subscribeEconomy(bus, store);
      bus.emit(WAVE_CLEARED, { perfect: false });

      expect(store.getState().economy.wallet.coins).toBe(COIN_REWARDS.waveClear);
    });

    it('awards wave + perfect bonus on perfect WAVE_CLEARED', () => {
      subscribeEconomy(bus, store);
      bus.emit(WAVE_CLEARED, { perfect: true });

      expect(store.getState().economy.wallet.coins).toBe(
        COIN_REWARDS.waveClear + COIN_REWARDS.perfectWave,
      );
    });

    it('awards combo coins at threshold 3', () => {
      subscribeEconomy(bus, store);
      bus.emit(COMBO_INCREMENT, { combo: 3 });

      expect(store.getState().economy.wallet.coins).toBe(COIN_REWARDS.combo3);
    });

    it('awards combo coins at threshold 5', () => {
      subscribeEconomy(bus, store);
      bus.emit(COMBO_INCREMENT, { combo: 5 });

      expect(store.getState().economy.wallet.coins).toBe(COIN_REWARDS.combo5);
    });

    it('awards combo coins at threshold 8', () => {
      subscribeEconomy(bus, store);
      bus.emit(COMBO_INCREMENT, { combo: 8 });

      expect(store.getState().economy.wallet.coins).toBe(COIN_REWARDS.combo8);
    });

    it('does not award combo coins below threshold 3', () => {
      subscribeEconomy(bus, store);
      bus.emit(COMBO_INCREMENT, { combo: 2 });

      expect(store.getState().economy.wallet.coins).toBe(0);
    });

    it('emits COINS_EARNED event', () => {
      const handler = vi.fn();
      bus.on(COINS_EARNED, handler);
      subscribeEconomy(bus, store);

      bus.emit(ENEMY_KILLED, { elite: false });

      expect(handler).toHaveBeenCalledWith({
        source: 'kill',
        amount: COIN_REWARDS.kill,
      });
    });

    it('unsubscribes cleanly', () => {
      const unsub = subscribeEconomy(bus, store);
      unsub();

      bus.emit(ENEMY_KILLED, { elite: false });
      expect(store.getState().economy.wallet.coins).toBe(0);
    });
  });
});
