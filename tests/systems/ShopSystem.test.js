import { describe, it, expect, beforeEach } from 'vitest';
import { createGameStore } from '../../src/core/Store.js';
import { createInitialState } from '../../src/state/GameState.js';
import {
  SHOP_ITEMS,
  buyItem,
  equipItem,
  getEquippedStats,
  mergeWithSkillBonuses,
} from '../../src/systems/ShopSystem.js';

/** @returns {import('../../src/core/Store.js').GameStore} */
function makeStore(overrides) {
  return createGameStore(createInitialState, overrides);
}

describe('ShopSystem', () => {
  /** @type {ReturnType<typeof makeStore>} */
  let store;

  beforeEach(() => {
    store = makeStore();
  });

  // ── buyItem ──────────────────────────────────────────────────────────────

  describe('buyItem', () => {
    it('deducts coins and adds item to owned on purchase', () => {
      store.update((d) => { d.economy.wallet.coins = 500; });

      const result = buyItem(store, 'skins', 'tuxedo');

      expect(result.success).toBe(true);
      expect(store.getState().economy.wallet.coins).toBe(300); // 500 - 200
      expect(store.getState().economy.owned.skins).toContain('tuxedo');
    });

    it('auto-equips the purchased item', () => {
      store.update((d) => { d.economy.wallet.coins = 500; });
      buyItem(store, 'skins', 'tuxedo');

      expect(store.getState().economy.equipped.skins).toBe('tuxedo');
    });

    it('fails when balance is insufficient', () => {
      store.update((d) => { d.economy.wallet.coins = 100; });

      const result = buyItem(store, 'skins', 'tuxedo');

      expect(result.success).toBe(false);
      expect(result.reason).toBe('insufficient_funds');
      expect(store.getState().economy.wallet.coins).toBe(100);
    });

    it('fails when item is already owned', () => {
      store.update((d) => {
        d.economy.wallet.coins = 1000;
        d.economy.owned.skins.push('tuxedo');
      });

      const result = buyItem(store, 'skins', 'tuxedo');

      expect(result.success).toBe(false);
      expect(result.reason).toBe('already_owned');
    });

    it('fails for invalid category', () => {
      const result = buyItem(store, 'invalid', 'tuxedo');

      expect(result.success).toBe(false);
      expect(result.reason).toBe('invalid_category');
    });

    it('fails for invalid item ID', () => {
      const result = buyItem(store, 'skins', 'nonexistent');

      expect(result.success).toBe(false);
      expect(result.reason).toBe('invalid_item');
    });

    it('does not mutate coins when purchase fails', () => {
      store.update((d) => { d.economy.wallet.coins = 50; });
      buyItem(store, 'skins', 'tuxedo');

      expect(store.getState().economy.wallet.coins).toBe(50);
    });
  });

  // ── equipItem ────────────────────────────────────────────────────────────

  describe('equipItem', () => {
    it('equips an owned item', () => {
      store.update((d) => { d.economy.owned.skins.push('tuxedo'); });

      const result = equipItem(store, 'skins', 'tuxedo');

      expect(result.success).toBe(true);
      expect(store.getState().economy.equipped.skins).toBe('tuxedo');
    });

    it('fails when item is not owned', () => {
      const result = equipItem(store, 'skins', 'tuxedo');

      expect(result.success).toBe(false);
      expect(result.reason).toBe('not_owned');
    });

    it('switches between owned items', () => {
      store.update((d) => {
        d.economy.owned.skins.push('tuxedo');
        d.economy.owned.skins.push('calico');
      });

      equipItem(store, 'skins', 'tuxedo');
      expect(store.getState().economy.equipped.skins).toBe('tuxedo');

      equipItem(store, 'skins', 'calico');
      expect(store.getState().economy.equipped.skins).toBe('calico');
    });
  });

  // ── getEquippedStats ─────────────────────────────────────────────────────

  describe('getEquippedStats', () => {
    it('returns empty stats for default items', () => {
      const stats = getEquippedStats(store.getState().economy);

      expect(stats).toEqual({});
    });

    it('returns stats from a single equipped item', () => {
      store.update((d) => {
        d.economy.owned.skins.push('tuxedo');
        d.economy.equipped.skins = 'tuxedo';
      });

      const stats = getEquippedStats(store.getState().economy);

      expect(stats.scoreMul).toBe(1.1);
    });

    it('stacks multipliers multiplicatively across categories', () => {
      store.update((d) => {
        // tuxedo: scoreMul 1.1
        d.economy.owned.skins.push('tuxedo');
        d.economy.equipped.skins = 'tuxedo';
        // lily_dust trail: scoreMul 1.1
        d.economy.owned.trails.push('lily_dust');
        d.economy.equipped.trails = 'lily_dust';
      });

      const stats = getEquippedStats(store.getState().economy);

      // 1.1 * 1.1 = 1.21
      expect(stats.scoreMul).toBeCloseTo(1.21, 5);
    });

    it('stacks flat bonuses additively', () => {
      store.update((d) => {
        // baguette: pierce 1
        d.economy.owned.bullets.push('baguette');
        d.economy.equipped.bullets = 'baguette';
        // snow_fort: barrierHpBonus 2
        d.economy.owned.barriers.push('snow_fort');
        d.economy.equipped.barriers = 'snow_fort';
      });

      const stats = getEquippedStats(store.getState().economy);

      expect(stats.pierce).toBe(1);
      expect(stats.barrierHpBonus).toBe(2);
    });

    it('handles boolean stats', () => {
      store.update((d) => {
        // lime: slowOnHit true
        d.economy.owned.bullets.push('lime');
        d.economy.equipped.bullets = 'lime';
      });

      const stats = getEquippedStats(store.getState().economy);

      expect(stats.slowOnHit).toBe(true);
    });

    it('combines stats from all 4 categories', () => {
      store.update((d) => {
        // calico: coinMul 1.15
        d.economy.owned.skins.push('calico');
        d.economy.equipped.skins = 'calico';
        // lime: slowOnHit true, coinMul 1.1
        d.economy.owned.bullets.push('lime');
        d.economy.equipped.bullets = 'lime';
        // petals: coinMul 1.05
        d.economy.owned.trails.push('petals');
        d.economy.equipped.trails = 'petals';
        // card_house: barrierRegen true, coinMul 1.2
        d.economy.owned.barriers.push('card_house');
        d.economy.equipped.barriers = 'card_house';
      });

      const stats = getEquippedStats(store.getState().economy);

      // 1.15 * 1.1 * 1.05 * 1.2 = ~1.5939
      expect(stats.coinMul).toBeCloseTo(1.15 * 1.1 * 1.05 * 1.2, 5);
      expect(stats.slowOnHit).toBe(true);
      expect(stats.barrierRegen).toBe(true);
    });
  });

  // ── mergeWithSkillBonuses ────────────────────────────────────────────────

  describe('mergeWithSkillBonuses', () => {
    it('merges multipliers multiplicatively', () => {
      const equipped = { coinMul: 1.5, scoreMul: 1.2 };
      const skills = { coinMul: 1.3, scoreMul: 1.1 };

      const merged = mergeWithSkillBonuses(equipped, skills);

      expect(merged.coinMul).toBeCloseTo(1.95, 5);   // 1.5 * 1.3
      expect(merged.scoreMul).toBeCloseTo(1.32, 5);   // 1.2 * 1.1
    });

    it('merges flat bonuses additively', () => {
      const equipped = { pierce: 2, maxBulletBonus: 1 };
      const skills = { extraLives: 3, maxBulletBonus: 2 };

      const merged = mergeWithSkillBonuses(equipped, skills);

      expect(merged.pierce).toBe(2);
      expect(merged.maxBulletBonus).toBe(3);  // 1 + 2
      expect(merged.extraLives).toBe(3);
    });

    it('preserves equipped booleans', () => {
      const equipped = { slowOnHit: true, barrierRegen: true };
      const skills = { coinMul: 1.2 };

      const merged = mergeWithSkillBonuses(equipped, skills);

      expect(merged.slowOnHit).toBe(true);
      expect(merged.barrierRegen).toBe(true);
      expect(merged.coinMul).toBe(1.2);
    });

    it('adds skill-only stats that are not in equipped', () => {
      const equipped = {};
      const skills = { speedMul: 1.3, dodgeChance: 0.15, startShield: 2 };

      const merged = mergeWithSkillBonuses(equipped, skills);

      expect(merged.speedMul).toBeCloseTo(1.3, 5);
      expect(merged.dodgeChance).toBeCloseTo(0.15, 5);
      expect(merged.startShield).toBe(2);
    });

    it('returns empty-ish result when both inputs are empty', () => {
      const merged = mergeWithSkillBonuses({}, {});

      expect(Object.keys(merged).length).toBe(0);
    });
  });

  // ── Catalog completeness ─────────────────────────────────────────────────

  describe('item catalog', () => {
    it('has 14 skins', () => {
      expect(SHOP_ITEMS.skins.length).toBe(14);
    });

    it('has 11 bullets', () => {
      expect(SHOP_ITEMS.bullets.length).toBe(11);
    });

    it('has 10 trails', () => {
      expect(SHOP_ITEMS.trails.length).toBe(10);
    });

    it('has 10 barriers', () => {
      expect(SHOP_ITEMS.barriers.length).toBe(10);
    });

    it('every item has id, name, price, desc, perk, and stats', () => {
      for (const [category, items] of Object.entries(SHOP_ITEMS)) {
        for (const item of items) {
          expect(item.id, `${category}/${item.id} missing id`).toBeDefined();
          expect(item.name, `${category}/${item.id} missing name`).toBeDefined();
          expect(typeof item.price, `${category}/${item.id} price not number`).toBe('number');
          expect(item.desc, `${category}/${item.id} missing desc`).toBeDefined();
          expect(item.perk, `${category}/${item.id} missing perk`).toBeDefined();
          expect(item.stats, `${category}/${item.id} missing stats`).toBeDefined();
        }
      }
    });
  });
});
