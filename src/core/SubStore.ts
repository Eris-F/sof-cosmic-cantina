/**
 * Sub-store adapters — scope reads/writes to nested state paths.
 *
 * Systems written for combat-level state (grid, boss, bullets as top-level
 * keys) use these adapters to work against the full GameState store without
 * modification.
 *
 * @module core/SubStore
 */
import type { Draft } from 'immer';
import type { GameStore } from '../types/systems';
import type { GameState } from '../types/state';

export interface SubStore {
  getState(): Record<string, unknown>;
  update(fn: (draft: Record<string, unknown>) => void): void;
}

/**
 * Creates a store adapter that scopes reads/writes to a nested path.
 */
export function createSubStore(
  parentStore: GameStore,
  selector: (state: GameState) => Record<string, unknown>,
  draftSelector: (draft: Draft<GameState>) => Record<string, unknown>,
): SubStore {
  return {
    getState(): Record<string, unknown> {
      return selector(parentStore.getState());
    },
    update(fn: (draft: Record<string, unknown>) => void): void {
      parentStore.update((draft: Draft<GameState>) => {
        fn(draftSelector(draft));
      });
    },
  };
}

/**
 * Creates a hybrid store adapter for systems that need both combat-level
 * fields (companions, bullets, grid) and root-level fields (player).
 */
export function createCombatPlayerStore(parentStore: GameStore): SubStore {
  return {
    getState(): Record<string, unknown> {
      const full = parentStore.getState();
      return {
        ...(full.combat as unknown as Record<string, unknown>),
        player: full.player,
      };
    },
    update(fn: (draft: Record<string, unknown>) => void): void {
      parentStore.update((draft: Draft<GameState>) => {
        const combat = draft.combat as unknown as Record<string, unknown>;
        const hybrid = new Proxy(combat, {
          get(target: Record<string, unknown>, prop: string | symbol): unknown {
            if (prop === 'player') return draft.player;
            return target[prop as string];
          },
          set(target: Record<string, unknown>, prop: string | symbol, value: unknown): boolean {
            if (prop === 'player') {
              (draft as unknown as Record<string, unknown>).player = value;
            } else {
              target[prop as string] = value;
            }
            return true;
          },
        });
        fn(hybrid as Record<string, unknown>);
      });
    },
  };
}

/**
 * Creates the standard combat sub-store (scoped to state.combat).
 */
export function createCombatStore(parentStore: GameStore): SubStore {
  return createSubStore(
    parentStore,
    (state) => state.combat as unknown as Record<string, unknown>,
    (draft) => draft.combat as unknown as Record<string, unknown>,
  );
}
