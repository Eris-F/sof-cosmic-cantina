/**
 * High-score entry scene handler.
 *
 * Allows the player to enter their initials and submit the score.
 * Actual initial-letter input is handled by the UI renderer touch/key
 * handlers; this scene owns the submit transition.
 *
 * @module scenes/HighScoreScene
 */
import { SCENE_EVENT } from '../core/SceneMachine';
import type { IEventBus } from '../types/index';
import type { SceneHandler, SceneActions } from './SceneManager';

interface HighScoreStore {
  initials?: string[];
  initialPos?: number;
}

export function createHighScoreScene(): SceneHandler {
  let enteredThisFrame = false;

  return {
    enter(store: unknown, _bus: IEventBus): void {
      enteredThisFrame = true;
      const s = store as HighScoreStore | null;
      if (s) {
        s.initials = ['A', 'A', 'A'];
        s.initialPos = 0;
      }
    },

    update(_dt: number, actions: SceneActions, _store: unknown, bus: IEventBus): void {
      // Skip first frame — the TAP that entered this scene is still in the queue
      if (enteredThisFrame) {
        enteredThisFrame = false;
        return;
      }

      const { consumeKey } = actions;

      // Initial-letter cycling and cursor movement is handled by
      // the existing renderer key/touch handlers.

      // Submit on Enter only — TAP is used for letter cycling in this scene
      if (consumeKey('Enter')) {
        bus.emit(SCENE_EVENT.RETURN_TO_MENU);
      }
    },

    exit(_store: unknown, _bus: IEventBus): void {
      // Score submission (localStorage write) is handled by the
      // game module's submitHighScore function.
    },
  };
}
