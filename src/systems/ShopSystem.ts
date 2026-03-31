/**
 * ShopSystem -- item catalog, buy/equip, stat computation.
 *
 * Pure logic: reads state from store, computes via Immer, emits events.
 * No rendering, no DOM.
 *
 * @module systems/ShopSystem
 */

import {
  ITEM_BOUGHT,
  ITEM_EQUIPPED,
} from '../core/events';
import type {
  GameStore,
  IEventBus,
  ShopItem,
  ShopItemCatalog,
  CategoryDef,
  EconomyState,
  MergedStats,
} from '../types/systems';

// ── Item catalog ─────────────────────────────────────────────────────────────

export const CATEGORIES: readonly CategoryDef[] = Object.freeze([
  { id: 'skins', name: 'CATS' },
  { id: 'bullets', name: 'AMMO' },
  { id: 'trails', name: 'TRAILS' },
  { id: 'barriers', name: 'SHIELDS' },
]);

export const SHOP_ITEMS: ShopItemCatalog = Object.freeze({
  skins: [
    {
      id: 'default', name: 'ORANGE TABBY', price: 0,
      desc: 'The classic cantina cat', perk: 'No bonus', stats: {},
    },
    {
      id: 'tuxedo', name: 'TUXEDO', price: 200,
      desc: 'Dressed for the photo booth', perk: 'SCORE +10%',
      stats: { scoreMul: 1.1 },
    },
    {
      id: 'calico', name: 'CALICO', price: 350,
      desc: 'Patchwork coin magnet', perk: 'COINS +15%',
      stats: { coinMul: 1.15 },
    },
    {
      id: 'smiski_cat', name: 'SMISKI CAT', price: 500,
      desc: 'Glows in the dark like a Smiski', perk: 'HITBOX -15%',
      stats: { hitboxMul: 0.85 },
    },
    {
      id: 'jellycat_cat', name: 'JELLYCAT PLUSH', price: 750,
      desc: 'So soft, enemies feel bad shooting', perk: 'DODGE 20%',
      stats: { dodgeChance: 0.2 },
    },
    {
      id: 'ski_cat', name: 'SKI CAT', price: 600,
      desc: 'Fresh off the slopes, lightning fast', perk: 'SPEED +30%',
      stats: { speedMul: 1.3 },
    },
    {
      id: 'diver_cat', name: 'DIVER CAT', price: 800,
      desc: 'Deep sea pressure = tough skin', perk: 'EXTRA LIFE +1',
      stats: { extraStartLife: 1 },
    },
    {
      id: 'photo_cat', name: 'PHOTOG CAT', price: 1000,
      desc: 'Flash blinds enemies on kill', perk: 'COINS x2',
      stats: { coinMul: 2.0 },
    },
    {
      id: 'jedi_cat', name: 'JEDI CAT', price: 1500,
      desc: 'The Force guides your shots', perk: 'FIRE +30% DODGE 15%',
      stats: { fireRateMul: 0.7, dodgeChance: 0.15 },
    },
    {
      id: 'sith_cat', name: 'SITH CAT', price: 2000,
      desc: 'Unlimited power!', perk: 'FIRE +50% DMG +25%',
      stats: { fireRateMul: 0.5, scoreMul: 1.25 },
    },
    {
      id: 'tequila_cat', name: 'TEQUILA CAT', price: 2500,
      desc: 'One shot, one kill (mostly)', perk: 'SHIELD+2 COINS x2.5',
      stats: { startShield: 2, coinMul: 2.5 },
    },
    {
      id: 'fred_cat', name: 'FRED AGAIN CAT', price: 3000,
      desc: 'Turn it up. Again. Again. Again.', perk: 'ALLY+2 POWERUP+50%',
      stats: { startCompanion: 2, powerupDurationMul: 1.5 },
    },
    {
      id: 'boardgame_cat', name: 'DICE MASTER', price: 3500,
      desc: 'Rolls natural 20s on every turn', perk: 'ALL +20% DODGE 25%',
      stats: { scoreMul: 1.2, speedMul: 1.2, dodgeChance: 0.25 },
    },
    {
      id: 'rainbow', name: 'RAINBOW', price: 5000,
      desc: 'Maximum Sofia energy achieved', perk: 'ALL +25% COINS x3',
      stats: { scoreMul: 1.25, coinMul: 3.0, speedMul: 1.25, fireRateMul: 0.75 },
    },
  ],
  bullets: [
    { id: 'bread', name: 'BREAD ROLL', price: 0,
      desc: 'Classic baguette ammo', perk: 'No bonus', stats: {} },
    { id: 'croissant', name: 'CROISSANT', price: 200,
      desc: 'Flaky French projectile', perk: 'SPEED +10%',
      stats: { bulletSpeedMul: 1.1 } },
    { id: 'baguette', name: 'BAGUETTE', price: 400,
      desc: 'Long and piercing', perk: 'PIERCE +1',
      stats: { pierce: 1 } },
    { id: 'pretzel', name: 'PRETZEL', price: 600,
      desc: 'Twisted trajectory', perk: 'RICOCHET +1',
      stats: { ricochetBonus: 1 } },
    { id: 'lime', name: 'LIME WEDGE', price: 500,
      desc: 'Tequila chaser', perk: 'SLOW +COINS',
      stats: { slowOnHit: true, coinMul: 1.1 } },
    { id: 'salt_shot', name: 'SALT SHOT', price: 800,
      desc: 'Salt rim shrapnel', perk: 'SPEED+20% CAP+1',
      stats: { bulletSpeedMul: 1.2, maxBulletBonus: 1 } },
    { id: 'blaster', name: 'BLASTER BOLT', price: 1000,
      desc: 'Pew pew pew!', perk: 'SPEED+30% CAP+2',
      stats: { bulletSpeedMul: 1.3, maxBulletBonus: 2 } },
    { id: 'lightsaber', name: 'SABER THROW', price: 2000,
      desc: 'An elegant weapon for a civilized cat', perk: 'PIERCE+2 DMG+50%',
      stats: { pierce: 2, damageMul: 1.5 } },
    { id: 'flash', name: 'CAMERA FLASH', price: 1500,
      desc: 'Say cheese!', perk: 'PIERCE+1 SLOW',
      stats: { pierce: 1, slowOnHit: true } },
    { id: 'tulip_toss', name: 'TULIP TOSS', price: 300,
      desc: 'Thorny projectile', perk: 'DMG +20%',
      stats: { damageMul: 1.2 } },
    { id: 'bass_drop', name: 'BASS DROP', price: 3000,
      desc: 'Fred Again inspired sonic boom', perk: 'PIERCE+3 SPEED+40%',
      stats: { pierce: 3, bulletSpeedMul: 1.4 } },
  ],
  trails: [
    { id: 'none', name: 'NONE', price: 0,
      desc: 'No trail bonus', perk: 'No bonus', stats: {} },
    { id: 'petals', name: 'PETAL TRAIL', price: 200,
      desc: 'Tulip petals follow you', perk: 'COINS +5%',
      stats: { coinMul: 1.05 } },
    { id: 'lily_dust', name: 'LILY DUST', price: 350,
      desc: 'Golden lily pollen', perk: 'SCORE +10%',
      stats: { scoreMul: 1.1 } },
    { id: 'powder', name: 'POWDER SNOW', price: 400,
      desc: 'Fresh tracks in the cosmos', perk: 'SPEED +10%',
      stats: { speedMul: 1.1 } },
    { id: 'bubbles', name: 'BUBBLE TRAIL', price: 400,
      desc: 'Deep space diving', perk: 'SLOW BULLETS -15%',
      stats: { enemyBulletSlowMul: 0.85 } },
    { id: 'margarita', name: 'MARGARITA MIST', price: 600,
      desc: 'Salt-rimmed wake', perk: 'DODGE 10%',
      stats: { dodgeChance: 0.1 } },
    { id: 'film_strip', name: 'FILM STRIP', price: 800,
      desc: 'Every frame is a memory', perk: 'COMBO +25%',
      stats: { comboScoreMul: 1.25 } },
    { id: 'dice_trail', name: 'DICE ROLL', price: 1000,
      desc: 'Rolling natural 20s', perk: 'MISS 15% COINS+15%',
      stats: { enemyMissChance: 0.15, coinMul: 1.15 } },
    { id: 'soundwave', name: 'SOUNDWAVE', price: 1500,
      desc: 'Bass frequencies trail behind', perk: 'POWERUP +30%',
      stats: { powerupDurationMul: 1.3 } },
    { id: 'hyperspace', name: 'HYPERSPACE', price: 2500,
      desc: 'Stars streak past at lightspeed', perk: 'SPEED+20% MISS 20%',
      stats: { speedMul: 1.2, enemyMissChance: 0.2 } },
  ],
  barriers: [
    { id: 'flowers', name: 'FLOWERS', price: 0,
      desc: 'Classic tulips & lilies', perk: 'No bonus', stats: {} },
    { id: 'bread_wall', name: 'BREAD WALL', price: 300,
      desc: 'Fortified with carbs', perk: 'HP +1',
      stats: { barrierHpBonus: 1 } },
    { id: 'coral', name: 'CORAL REEF', price: 500,
      desc: 'Deep sea defense', perk: 'HP+1 REGEN',
      stats: { barrierHpBonus: 1, barrierRegen: true } },
    { id: 'snow_fort', name: 'SNOW FORT', price: 500,
      desc: 'Packed powder walls', perk: 'HP+2',
      stats: { barrierHpBonus: 2 } },
    { id: 'ray_shield', name: 'RAY SHIELD', price: 800,
      desc: 'Deflector shield generator', perk: 'HP+1 REFLECT',
      stats: { barrierHpBonus: 1, barrierReflect: true } },
    { id: 'card_house', name: 'CARD HOUSE', price: 600,
      desc: 'Fragile but lucky', perk: 'REGEN COINS+20%',
      stats: { barrierRegen: true, coinMul: 1.2 } },
    { id: 'smiski_wall', name: 'SMISKI WALL', price: 1000,
      desc: 'Tiny glowing guardians', perk: 'HP+2 REGEN',
      stats: { barrierHpBonus: 2, barrierRegen: true } },
    { id: 'bottle_wall', name: 'BOTTLE WALL', price: 1200,
      desc: 'Empty bottles make great walls', perk: 'HP+2 BURN',
      stats: { barrierHpBonus: 2, barrierDamage: true } },
    { id: 'plush_fort', name: 'PLUSH FORT', price: 1500,
      desc: 'Stuffed with love and HP', perk: 'HP+3 REGEN',
      stats: { barrierHpBonus: 3, barrierRegen: true } },
    { id: 'photo_booth', name: 'PHOTO BOOTH', price: 2000,
      desc: 'Strike a pose behind the curtain', perk: 'HP+3 REGEN REFLECT',
      stats: { barrierHpBonus: 3, barrierRegen: true, barrierReflect: true } },
  ],
});

// ── Stat computation ─────────────────────────────────────────────────────────

/**
 * Folds a source stat record into a target, mutating target in place.
 * Multiplicative keys (*Mul, *Chance) stack multiplicatively,
 * flat numeric keys stack additively, booleans OR together.
 *
 * Module-private — not exported.
 */
function applyStatModifiers(
  target: Record<string, number | boolean | undefined>,
  source: Record<string, number | boolean | undefined>,
): void {
  for (const [key, val] of Object.entries(source)) {
    if (typeof val === 'boolean') {
      target[key] = (target[key] as boolean | undefined) || val;
    } else if (typeof val === 'number') {
      if (key.endsWith('Mul') || key.endsWith('Chance')) {
        target[key] = ((target[key] as number | undefined) ?? 1) * val;
      } else {
        target[key] = ((target[key] as number | undefined) ?? 0) + val;
      }
    }
  }
}

/**
 * Computes merged stats from all 4 equipped item slots.
 * Multipliers stack multiplicatively, flat bonuses stack additively,
 * booleans OR together.
 */
export function getEquippedStats(economyState: EconomyState): MergedStats {
  const { equipped } = economyState;
  const combined: MergedStats = {};

  for (const category of Object.keys(equipped)) {
    const itemId = equipped[category];
    if (!itemId) continue;
    const items = (SHOP_ITEMS as Record<string, readonly ShopItem[]>)[category];
    if (!items) continue;

    const item = items.find((i) => i.id === itemId);
    if (!item || !item.stats) continue;

    applyStatModifiers(
      combined as Record<string, number | boolean | undefined>,
      item.stats as Record<string, number | boolean | undefined>,
    );
  }

  return combined;
}

/**
 * Merges equipped-item stats with skill-tree bonuses.
 * Multipliers stack multiplicatively, flat bonuses stack additively,
 * booleans OR together.
 */
export function mergeWithSkillBonuses(
  equippedStats: MergedStats,
  skillBonuses: Record<string, number | boolean>,
): MergedStats {
  const merged: MergedStats = { ...equippedStats };

  applyStatModifiers(
    merged as Record<string, number | boolean | undefined>,
    skillBonuses as Record<string, number | boolean | undefined>,
  );

  return merged;
}

/**
 * Recomputes and stores mergedStats on the economy state.
 * Call after any buy/equip/skill-upgrade.
 */
export function recomputeMergedStats(
  store: GameStore,
  skillBonuses: Record<string, number | boolean>,
): void {
  const state = store.getState();
  const equippedStats = getEquippedStats(state.economy);
  const merged = mergeWithSkillBonuses(equippedStats, skillBonuses);

  store.update((draft) => {
    draft.economy.mergedStats = merged;
  });
}

// ── Buy / Equip ──────────────────────────────────────────────────────────────

interface BuyResult {
  readonly success: boolean;
  readonly reason?: string;
}

/**
 * Attempts to buy an item. Validates price, ownership, and balance.
 * On success: deducts coins, adds to owned, auto-equips the item.
 */
export function buyItem(
  store: GameStore,
  category: string,
  itemId: string,
): BuyResult {
  const state = store.getState();
  const items = (SHOP_ITEMS as Record<string, readonly ShopItem[]>)[category];
  if (!items) {
    return { success: false, reason: 'invalid_category' };
  }

  const item = items.find((i) => i.id === itemId);
  if (!item) {
    return { success: false, reason: 'invalid_item' };
  }

  const owned = state.economy.owned[category] ?? [];
  if (owned.includes(itemId)) {
    return { success: false, reason: 'already_owned' };
  }

  if (state.economy.wallet.coins < item.price) {
    return { success: false, reason: 'insufficient_funds' };
  }

  store.update((draft) => {
    draft.economy.wallet.coins -= item.price;
    draft.economy.owned[category] = [...(draft.economy.owned[category] ?? []), itemId];
    draft.economy.equipped[category] = itemId;
  });

  return { success: true };
}

/**
 * Equips an already-owned item.
 */
export function equipItem(
  store: GameStore,
  category: string,
  itemId: string,
): BuyResult {
  const state = store.getState();
  const owned = state.economy.owned[category] ?? [];

  if (!owned.includes(itemId)) {
    return { success: false, reason: 'not_owned' };
  }

  store.update((draft) => {
    draft.economy.equipped[category] = itemId;
  });

  return { success: true };
}

// ── Event wiring ─────────────────────────────────────────────────────────────

interface ShopActions {
  buy(category: string, itemId: string): BuyResult;
  equip(category: string, itemId: string): BuyResult;
}

/**
 * Wires the ShopSystem to the EventBus for buy/equip emissions.
 */
export function createShopActions(
  bus: IEventBus,
  store: GameStore,
  getSkillBonuses: () => Record<string, number | boolean>,
): ShopActions {
  return {
    buy(category: string, itemId: string): BuyResult {
      const result = buyItem(store, category, itemId);
      if (result.success) {
        recomputeMergedStats(store, getSkillBonuses());
        bus.emit(ITEM_BOUGHT, { category, itemId });
      }
      return result;
    },

    equip(category: string, itemId: string): BuyResult {
      const result = equipItem(store, category, itemId);
      if (result.success) {
        recomputeMergedStats(store, getSkillBonuses());
        bus.emit(ITEM_EQUIPPED, { category, itemId });
      }
      return result;
    },
  };
}
