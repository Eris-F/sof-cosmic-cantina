import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGameStore } from '../../src/core/Store.js';
import { createInitialState } from '../../src/state/GameState.js';
import { EventBus } from '../../src/core/EventBus.js';
import {
  COMBO_INCREMENT,
  COMBO_RESET,
  STREAK_MILESTONE,
  COINS_EARNED,
} from '../../src/core/events.js';
import {
  registerKill,
  updateCombo,
  resetCombo,
  resetStreak,
  getComboMultiplier,
  COMBO_WINDOW,
  STREAK_MILESTONES,
  COMBO_COIN_REWARDS,
} from '../../src/systems/ComboSystem.js';

describe('ComboSystem', () => {
  /** @type {ReturnType<typeof createGameStore>} */
  let store;
  /** @type {EventBus} */
  let bus;

  beforeEach(() => {
    store = createGameStore(createInitialState);
    bus = new EventBus();
  });

  // ── Combo increment ──────────────────────────────────────────────────────

  describe('registerKill', () => {
    it('increments combo count on each kill', () => {
      registerKill(store, bus, 100, 200);
      expect(store.getState().effects.combo.count).toBe(1);

      registerKill(store, bus, 100, 200);
      expect(store.getState().effects.combo.count).toBe(2);

      registerKill(store, bus, 100, 200);
      expect(store.getState().effects.combo.count).toBe(3);
    });

    it('resets combo timer to COMBO_WINDOW on each kill', () => {
      registerKill(store, bus, 100, 200);
      expect(store.getState().effects.combo.timer).toBe(COMBO_WINDOW);
    });

    it('emits COMBO_INCREMENT on each kill', () => {
      const handler = vi.fn();
      bus.on(COMBO_INCREMENT, handler);

      registerKill(store, bus, 50, 75);
      expect(handler).toHaveBeenCalledWith({
        count: 1,
        x: 50,
        y: 75,
      });
    });

    it('increments streak kills on each kill', () => {
      registerKill(store, bus, 100, 200);
      registerKill(store, bus, 100, 200);
      registerKill(store, bus, 100, 200);

      expect(store.getState().effects.streak.kills).toBe(3);
    });
  });

  // ── Combo popups ─────────────────────────────────────────────────────────

  describe('combo popups', () => {
    it('does NOT spawn a popup for the first kill', () => {
      registerKill(store, bus, 100, 200);
      expect(store.getState().effects.combo.popups).toHaveLength(0);
    });

    it('spawns a popup at kill position for combo >= 2', () => {
      registerKill(store, bus, 100, 200);
      registerKill(store, bus, 150, 250);

      const popups = store.getState().effects.combo.popups;
      expect(popups).toHaveLength(1);
      expect(popups[0].x).toBe(150);
      expect(popups[0].y).toBe(240); // y - 10
      expect(popups[0].text).toBe('DOUBLE!');
    });

    it('uses "Nx COMBO!" label for high counts', () => {
      for (let i = 0; i < 10; i++) {
        registerKill(store, bus, 100, 200);
      }

      const popups = store.getState().effects.combo.popups;
      // Last popup should be for combo 10
      const last = popups[popups.length - 1];
      expect(last.text).toBe('10x COMBO!');
    });

    it('removes expired popups during update', () => {
      registerKill(store, bus, 100, 200);
      registerKill(store, bus, 100, 200);
      expect(store.getState().effects.combo.popups).toHaveLength(1);

      // Advance past popup lifetime (1.0s)
      updateCombo(store, bus, 1.1);
      expect(store.getState().effects.combo.popups).toHaveLength(0);
    });

    it('floats popups upward during update', () => {
      registerKill(store, bus, 100, 200);
      registerKill(store, bus, 100, 200);

      const yBefore = store.getState().effects.combo.popups[0].y;
      updateCombo(store, bus, 0.1);
      const yAfter = store.getState().effects.combo.popups[0].y;

      expect(yAfter).toBeLessThan(yBefore);
    });
  });

  // ── Timer expiry & reset ─────────────────────────────────────────────────

  describe('updateCombo', () => {
    it('decrements combo timer', () => {
      registerKill(store, bus, 100, 200);
      updateCombo(store, bus, 0.3);
      expect(store.getState().effects.combo.timer).toBeCloseTo(COMBO_WINDOW - 0.3, 5);
    });

    it('resets combo count when timer expires', () => {
      registerKill(store, bus, 100, 200);
      registerKill(store, bus, 100, 200);
      expect(store.getState().effects.combo.count).toBe(2);

      updateCombo(store, bus, COMBO_WINDOW + 0.1);
      expect(store.getState().effects.combo.count).toBe(0);
      expect(store.getState().effects.combo.timer).toBe(0);
    });

    it('emits COMBO_RESET when timer expires', () => {
      const handler = vi.fn();
      bus.on(COMBO_RESET, handler);

      registerKill(store, bus, 100, 200);
      updateCombo(store, bus, COMBO_WINDOW + 0.1);

      expect(handler).toHaveBeenCalledOnce();
    });

    it('does NOT emit COMBO_RESET when timer has not expired', () => {
      const handler = vi.fn();
      bus.on(COMBO_RESET, handler);

      registerKill(store, bus, 100, 200);
      updateCombo(store, bus, 0.1);

      expect(handler).not.toHaveBeenCalled();
    });
  });

  // ── Coin rewards at thresholds ───────────────────────────────────────────

  describe('combo coin rewards', () => {
    it('emits COINS_EARNED at combo threshold 3', () => {
      const handler = vi.fn();
      bus.on(COINS_EARNED, handler);

      registerKill(store, bus, 100, 200);
      registerKill(store, bus, 100, 200);
      registerKill(store, bus, 100, 200);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ amount: COMBO_COIN_REWARDS[3], comboCount: 3 }),
      );
    });

    it('emits COINS_EARNED at combo threshold 5', () => {
      const handler = vi.fn();
      bus.on(COINS_EARNED, handler);

      for (let i = 0; i < 5; i++) {
        registerKill(store, bus, 100, 200);
      }

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ amount: COMBO_COIN_REWARDS[5], comboCount: 5 }),
      );
    });

    it('emits COINS_EARNED at combo threshold 8', () => {
      const handler = vi.fn();
      bus.on(COINS_EARNED, handler);

      for (let i = 0; i < 8; i++) {
        registerKill(store, bus, 100, 200);
      }

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ amount: COMBO_COIN_REWARDS[8], comboCount: 8 }),
      );
    });

    it('does NOT emit COINS_EARNED for non-threshold combos', () => {
      const handler = vi.fn();
      bus.on(COINS_EARNED, handler);

      registerKill(store, bus, 100, 200);
      registerKill(store, bus, 100, 200);

      expect(handler).not.toHaveBeenCalled();
    });
  });

  // ── Streak milestones ────────────────────────────────────────────────────

  describe('streak milestones', () => {
    it('sets announcement at 10-kill milestone', () => {
      for (let i = 0; i < 10; i++) {
        registerKill(store, bus, 100, 200);
      }

      const streak = store.getState().effects.streak;
      expect(streak.lastMilestone).toBe(10);
      expect(streak.announcement).not.toBeNull();
      expect(streak.announcement.text).toBe('KILLING SPREE!');
    });

    it('emits STREAK_MILESTONE event at milestone', () => {
      const handler = vi.fn();
      bus.on(STREAK_MILESTONE, handler);

      for (let i = 0; i < 10; i++) {
        registerKill(store, bus, 100, 200);
      }

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ kills: 10, text: 'KILLING SPREE!' }),
      );
    });

    it('does NOT re-emit same milestone', () => {
      const handler = vi.fn();
      bus.on(STREAK_MILESTONE, handler);

      for (let i = 0; i < 12; i++) {
        registerKill(store, bus, 100, 200);
      }

      // Should only fire once for milestone 10
      const calls = handler.mock.calls.filter(
        ([data]) => data.kills === 10,
      );
      expect(calls).toHaveLength(1);
    });

    it('announcement expires after 2s in updateCombo', () => {
      for (let i = 0; i < 10; i++) {
        registerKill(store, bus, 100, 200);
      }
      expect(store.getState().effects.streak.announcement).not.toBeNull();

      updateCombo(store, bus, 2.1);
      expect(store.getState().effects.streak.announcement).toBeNull();
    });
  });

  // ── Reset functions ──────────────────────────────────────────────────────

  describe('resetCombo', () => {
    it('clears combo count, timer, and popups', () => {
      registerKill(store, bus, 100, 200);
      registerKill(store, bus, 100, 200);

      resetCombo(store);

      const combo = store.getState().effects.combo;
      expect(combo.count).toBe(0);
      expect(combo.timer).toBe(0);
      expect(combo.popups).toEqual([]);
    });
  });

  describe('resetStreak', () => {
    it('clears streak kills, milestone, and announcement', () => {
      for (let i = 0; i < 10; i++) {
        registerKill(store, bus, 100, 200);
      }

      resetStreak(store);

      const streak = store.getState().effects.streak;
      expect(streak.kills).toBe(0);
      expect(streak.lastMilestone).toBe(0);
      expect(streak.announcement).toBeNull();
    });
  });

  // ── Multiplier helper ────────────────────────────────────────────────────

  describe('getComboMultiplier', () => {
    it('returns 1 for combo < 2', () => {
      expect(getComboMultiplier(store.getState())).toBe(1);

      registerKill(store, bus, 100, 200);
      expect(getComboMultiplier(store.getState())).toBe(1);
    });

    it('returns increasing multiplier for combo >= 2', () => {
      registerKill(store, bus, 100, 200);
      registerKill(store, bus, 100, 200);
      expect(getComboMultiplier(store.getState())).toBeCloseTo(1.1, 5);

      registerKill(store, bus, 100, 200);
      expect(getComboMultiplier(store.getState())).toBeCloseTo(1.2, 5);
    });
  });
});
