/**
 * Play scene handler.
 *
 * Orchestrates all gameplay systems during the "playing" state:
 * player movement, enemy grid, bullets, powerups, wave progression, etc.
 * The heavy lifting lives in dedicated system modules -- this scene
 * wires them together per-frame.
 *
 * @module scenes/PlayScene
 */
import { SCENE_EVENT } from '../core/SceneMachine';
import { GAME_START } from '../core/events';
import type { IEventBus } from '../types/index';
import type { SceneHandler, SceneActions } from './SceneManager';

export interface PlayServices {
  resetGame: (store: unknown) => void;
  updatePlay: (store: unknown, dt: number, actions: SceneActions) => void;
}

export function createPlayScene(): SceneHandler {
  let services: PlayServices | null = null;

  return {
    enter(store: unknown, bus: IEventBus, svc?: unknown): void {
      services = (svc as PlayServices) ?? null;

      if (services?.resetGame) {
        services.resetGame(store);
      }

      bus.emit(GAME_START);
    },

    update(dt: number, actions: SceneActions, store: unknown, bus: IEventBus): void {
      const { consumeKey } = actions;

      // Pause check
      if (consumeKey('Escape')) {
        bus.emit(SCENE_EVENT.PAUSE);
        return;
      }

      if (services?.updatePlay) {
        services.updatePlay(store, dt, actions);
      }

      // Player death is detected inside updatePlay; the game module
      // emits PLAYER_DIED through the bus when it happens.
    },

    exit(_store: unknown, _bus: IEventBus): void {
      services = null;
    },
  };
}
