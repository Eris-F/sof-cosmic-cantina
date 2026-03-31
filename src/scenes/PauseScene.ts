/**
 * Pause scene handler.
 *
 * Listens for resume (Escape / action) or quit-to-menu input.
 * The pause overlay rendering is handled separately.
 *
 * @module scenes/PauseScene
 */
import { SCENE_EVENT } from '../core/SceneMachine';
import { GAME_PAUSE, GAME_RESUME } from '../core/events';
import type { IEventBus } from '../types/index';
import type { SceneHandler, SceneActions } from './SceneManager';

export function createPauseScene(): SceneHandler {
  return {
    enter(_store: unknown, bus: IEventBus): void {
      bus.emit(GAME_PAUSE);
    },

    update(_dt: number, actions: SceneActions, _store: unknown, bus: IEventBus): void {
      const { consumeKey, isAction } = actions;

      if (consumeKey('Escape') || isAction()) {
        bus.emit(SCENE_EVENT.RESUME);
        return;
      }

      // Quit to menu (Q key)
      if (consumeKey('KeyQ')) {
        bus.emit(SCENE_EVENT.RETURN_TO_MENU);
      }
    },

    exit(_store: unknown, bus: IEventBus): void {
      bus.emit(GAME_RESUME);
    },
  };
}
