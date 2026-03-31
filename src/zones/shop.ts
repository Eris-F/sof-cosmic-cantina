/**
 * Touch zones for the shop scene.
 * Coordinates match ShopRenderer.ts draw positions exactly.
 *
 * @module zones/shop
 */
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';
import { zone } from './Zone';
import type { Zone } from './Zone';
import { ZoneNames, shopCategoryTab as catTabName, shopItemCard as itemCardName, shopBuyButton as buyButtonName } from './names';

// ── Layout constants ────────────────────────────────────────────────────

export const TAB_Y = 62;
export const TAB_H = 22;
export const LIST_Y = 92;
export const ITEM_H = 72;
export const VISIBLE_ITEMS = 7;

const CATEGORY_COUNT = 4;
const TAB_W = CANVAS_WIDTH / CATEGORY_COUNT; // 120

// ── Category tabs ───────────────────────────────────────────────────────

/** Returns the zone for category tab at the given index (0-3). */
export function categoryTab(index: number): Zone {
  return zone(catTabName(index), TAB_W * index, TAB_Y, TAB_W, TAB_H);
}

export const CAT_TAB_0 = categoryTab(0);
export const CAT_TAB_1 = categoryTab(1);
export const CAT_TAB_2 = categoryTab(2);
export const CAT_TAB_3 = categoryTab(3);

// ── Item list ───────────────────────────────────────────────────────────

/** Returns the zone for the item card at visual index (0-based from scroll). */
export function itemCard(visualIndex: number): Zone {
  return zone(itemCardName(visualIndex), 8, LIST_Y + visualIndex * ITEM_H, CANVAS_WIDTH - 16, ITEM_H - 4);
}

// ── Buy / Equip button (inside selected item card) ──────────────────────

/** Returns the buy/equip button zone for the item at the given visual index. */
export function buyButton(visualIndex: number): Zone {
  const iy = LIST_Y + visualIndex * ITEM_H;
  return zone(buyButtonName(visualIndex), CANVAS_WIDTH / 2 - 60, iy + 46, 120, 16);
}

// ── Back button ─────────────────────────────────────────────────────────

// "< BACK" drawn at (cx, CANVAS_HEIGHT - 10), text ~40px wide
export const BACK_BTN = zone(ZoneNames.SHOP_BACK, CANVAS_WIDTH / 2 - 40, CANVAS_HEIGHT - 22, 80, 22);
