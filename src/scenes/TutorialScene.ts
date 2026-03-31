/**
 * Tutorial scene handler.
 *
 * Supports page-by-page navigation through tutorial content.
 * Exiting on the last page or pressing Escape returns to menu.
 *
 * @module scenes/TutorialScene
 */
import { SCENE_EVENT } from '../core/SceneMachine';
import { TUTORIAL_OPENED, TUTORIAL_CLOSED } from '../core/events';
import { TAP } from '../input/Actions';
import type { IEventBus } from '../types/index';
import type { GameStore } from '../types/systems';
import type { GameState } from '../types/state';
import type { SceneHandler, SceneActions } from './SceneManager';
import type { Draft } from 'immer';

interface TutorialDeps {
  getPageCount: () => number;
}

export function createTutorialScene(deps?: TutorialDeps): SceneHandler {
  const getPageCount = deps?.getPageCount ?? ((): number => 1);
  let page = 0;
  let enteredThisFrame = false;

  function setPage(store: GameStore, newPage: number): void {
    page = newPage;
    store.update((draft: Draft<GameState>) => {
      draft.ui.tutorial.page = newPage;
    });
  }

  return {
    enter(store: unknown, bus: IEventBus): void {
      page = 0;
      enteredThisFrame = true;
      const gameStore = store as GameStore;
      if (gameStore.update) {
        gameStore.update((draft: Draft<GameState>) => {
          draft.ui.tutorial.page = 0;
        });
      }
      bus.emit(TUTORIAL_OPENED);
    },

    update(_dt: number, actions: SceneActions, store: unknown, bus: IEventBus): void {
      if (enteredThisFrame) {
        enteredThisFrame = false;
        return;
      }

      const { consumeKey } = actions;
      const gameStore = store as GameStore;

      if (consumeKey('Escape')) {
        bus.emit(SCENE_EVENT.CLOSE_TUTORIAL);
        return;
      }

      // Touch: tap left half → back, tap right half → forward
      const tap = actions._pressed.find(a => a.type === TAP);
      if (tap && tap.payload) {
        const { x } = tap.payload as { x: number };
        if (x < 240) {
          // Left half → back
          setPage(gameStore, Math.max(0, page - 1));
        } else {
          // Right half → forward
          if (page >= getPageCount() - 1) {
            bus.emit(SCENE_EVENT.CLOSE_TUTORIAL);
          } else {
            setPage(gameStore, page + 1);
          }
        }
        return;
      }

      // Keyboard back
      if (consumeKey('ArrowLeft') || consumeKey('KeyA')) {
        setPage(gameStore, Math.max(0, page - 1));
        return;
      }

      // Keyboard forward
      if (consumeKey('ArrowRight') || consumeKey('KeyD')) {
        if (page >= getPageCount() - 1) {
          bus.emit(SCENE_EVENT.CLOSE_TUTORIAL);
        } else {
          setPage(gameStore, page + 1);
        }
      }
    },

    exit(_store: unknown, bus: IEventBus): void {
      page = 0;
      bus.emit(TUTORIAL_CLOSED);
    },
  };
}
