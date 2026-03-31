/**
 * Shop scene handler.
 *
 * Handles keyboard + touch navigation, buy/equip actions.
 * Touch zones imported from zones/shop.
 *
 * @module scenes/ShopScene
 */
import { SCENE_EVENT } from '../core/SceneMachine';
import { SHOP_OPENED, SHOP_CLOSED } from '../core/events';
import { CATEGORIES, SHOP_ITEMS } from '../systems/ShopSystem';
import { TAP } from '../input/Actions';
import { zoneHit } from '../zones/Zone';
import { categoryTab, BACK_BTN, VISIBLE_ITEMS, ITEM_H, LIST_Y } from '../zones/shop';
import type { IEventBus } from '../types/index';
import type { GameStore } from '../types/systems';
import type { GameState } from '../types/state';
import type { SceneHandler, SceneActions } from './SceneManager';
import type { Draft } from 'immer';

interface ShopActions {
  buy(category: string, itemId: string): { success: boolean; reason?: string };
  equip(category: string, itemId: string): { success: boolean; reason?: string };
}

export function createShopScene(shopActions?: ShopActions): SceneHandler {
  let enteredThisFrame = false;
  let actions: ShopActions | null = shopActions ?? null;

  return {
    enter(_store: unknown, bus: IEventBus, svc?: unknown): void {
      enteredThisFrame = true;
      if (svc && typeof svc === 'object' && 'buy' in svc) {
        actions = svc as ShopActions;
      }
      bus.emit(SHOP_OPENED);
    },

    update(_dt: number, sceneActions: SceneActions, store: unknown, bus: IEventBus): void {
      if (enteredThisFrame) { enteredThisFrame = false; return; }

      const { consumeKey } = sceneActions;
      const gameStore = store as GameStore;
      const shopState = gameStore.getState().ui.shop;

      // Flash timer decay
      if (shopState.flashTimer > 0) {
        gameStore.update((draft: Draft<GameState>) => {
          draft.ui.shop.flashTimer = Math.max(0, draft.ui.shop.flashTimer - 0.016);
          if (draft.ui.shop.flashTimer <= 0) draft.ui.shop.flashMessage = null;
        });
      }

      // ── Exit ──────────────────────────────────────────────────────────
      if (consumeKey('Escape')) { bus.emit(SCENE_EVENT.CLOSE_SHOP); return; }

      // ── Touch input ───────────────────────────────────────────────────
      const tap = sceneActions._pressed.find(a => a.type === TAP);
      if (tap && tap.payload) {
        const { x, y } = tap.payload as { x: number; y: number };

        // Back button
        if (zoneHit(BACK_BTN, x, y)) { bus.emit(SCENE_EVENT.CLOSE_SHOP); return; }

        // Category tabs
        for (let i = 0; i < CATEGORIES.length; i++) {
          if (zoneHit(categoryTab(i), x, y)) {
            gameStore.update((draft: Draft<GameState>) => {
              draft.ui.shop.categoryIndex = i;
              draft.ui.shop.itemIndex = 0;
              draft.ui.shop.scrollOffset = 0;
            });
            return;
          }
        }

        // Item cards
        if (y >= LIST_Y) {
          const vi = Math.floor((y - LIST_Y) / ITEM_H);
          const itemIdx = vi + shopState.scrollOffset;
          const cat = CATEGORIES[shopState.categoryIndex];
          if (!cat) return;
          const items = (SHOP_ITEMS as Record<string, readonly { id: string }[]>)[cat.id];
          if (items && itemIdx >= 0 && itemIdx < items.length) {
            if (itemIdx === shopState.itemIndex) {
              performAction(gameStore, actions, cat.id, items[itemIdx]!.id);
            } else {
              gameStore.update((draft: Draft<GameState>) => { draft.ui.shop.itemIndex = itemIdx; });
            }
          }
          return;
        }
      }

      // ── Keyboard navigation ───────────────────────────────────────────
      if (consumeKey('KeyA') || consumeKey('ArrowLeft')) {
        gameStore.update((draft: Draft<GameState>) => {
          draft.ui.shop.categoryIndex = (draft.ui.shop.categoryIndex - 1 + CATEGORIES.length) % CATEGORIES.length;
          draft.ui.shop.itemIndex = 0;
          draft.ui.shop.scrollOffset = 0;
        });
      }
      if (consumeKey('KeyD') || consumeKey('ArrowRight')) {
        gameStore.update((draft: Draft<GameState>) => {
          draft.ui.shop.categoryIndex = (draft.ui.shop.categoryIndex + 1) % CATEGORIES.length;
          draft.ui.shop.itemIndex = 0;
          draft.ui.shop.scrollOffset = 0;
        });
      }
      if (consumeKey('KeyW') || consumeKey('ArrowUp')) {
        gameStore.update((draft: Draft<GameState>) => {
          if (draft.ui.shop.itemIndex > 0) {
            draft.ui.shop.itemIndex -= 1;
            if (draft.ui.shop.itemIndex < draft.ui.shop.scrollOffset) {
              draft.ui.shop.scrollOffset = draft.ui.shop.itemIndex;
            }
          }
        });
      }
      if (consumeKey('KeyS') || consumeKey('ArrowDown')) {
        const cat = CATEGORIES[shopState.categoryIndex];
        const itemCount = cat ? ((SHOP_ITEMS as Record<string, readonly unknown[]>)[cat.id]?.length ?? 0) : 0;
        gameStore.update((draft: Draft<GameState>) => {
          if (draft.ui.shop.itemIndex < itemCount - 1) {
            draft.ui.shop.itemIndex += 1;
            if (draft.ui.shop.itemIndex >= draft.ui.shop.scrollOffset + VISIBLE_ITEMS) {
              draft.ui.shop.scrollOffset = draft.ui.shop.itemIndex - VISIBLE_ITEMS + 1;
            }
          }
        });
      }
      if (consumeKey('Enter') || consumeKey('Space')) {
        const cat = CATEGORIES[shopState.categoryIndex];
        const items = cat ? (SHOP_ITEMS as Record<string, readonly { id: string }[]>)[cat.id] : undefined;
        const item = items?.[shopState.itemIndex];
        if (cat && item) performAction(gameStore, actions, cat.id, item.id);
      }
    },

    exit(_store: unknown, bus: IEventBus): void { bus.emit(SHOP_CLOSED); },
  };
}

function performAction(store: GameStore, actions: ShopActions | null, category: string, itemId: string): void {
  if (!actions) return;
  const state = store.getState();
  const owned = state.economy.owned[category] ?? [];
  const equipped = state.economy.equipped[category];
  if (equipped === itemId) return;

  if (owned.includes(itemId)) {
    const result = actions.equip(category, itemId);
    showFlash(store, result.success ? 'EQUIPPED!' : 'EQUIP FAILED');
  } else {
    const result = actions.buy(category, itemId);
    showFlash(store, result.success ? 'PURCHASED!' : result.reason === 'insufficient_funds' ? 'NOT ENOUGH COINS' : 'ALREADY OWNED');
  }
}

function showFlash(store: GameStore, message: string): void {
  store.update((draft: Draft<GameState>) => {
    draft.ui.shop.flashMessage = message;
    draft.ui.shop.flashTimer = 1.5;
  });
}
