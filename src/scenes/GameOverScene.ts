/**
 * Game-over scene handler.
 *
 * Displays final stats and waits for player input before transitioning
 * to the high-score entry screen or back to menu.
 *
 * @module scenes/GameOverScene
 */
import { SCENE_EVENT } from '../core/SceneMachine';
import { GAME_OVER } from '../core/events';
import type { IEventBus } from '../types/index';
import type { SceneHandler, SceneActions } from './SceneManager';

/** Minimum seconds to display before allowing transition. */
const DISPLAY_DELAY = 1.5;

export function createGameOverScene(): SceneHandler {
  let timer = 0;

  return {
    enter(_store: unknown, bus: IEventBus): void {
      timer = 0;
      bus.emit(GAME_OVER);
    },

    update(dt: number, actions: SceneActions, _store: unknown, bus: IEventBus): void {
      timer += dt;

      if (timer > DISPLAY_DELAY && actions.isAction()) {
        bus.emit(SCENE_EVENT.SUBMIT_SCORE);
      }
    },

    exit(_store: unknown, _bus: IEventBus): void {
      timer = 0;
    },
  };
}
