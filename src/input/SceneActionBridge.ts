/**
 * Bridges the InputManager's action-type API to the SceneActions facade
 * that scene handlers expect.
 *
 * Also builds the flat PlayerActions object for PlayerSystem.
 *
 * @module input/SceneActionBridge
 */
import type { SceneActions } from '../scenes/SceneManager';
import type { Action, IInputManager } from '../types/index';
import type { PlayerActions, EquippedStats } from '../types/definitions';
import type { GameStore } from '../types/systems';
import {
  MOVE_LEFT, MOVE_RIGHT, MOVE_UP, MOVE_DOWN,
  FIRE, WEAPON_SWAP, TOUCH_MOVE,
  PAUSE, CONFIRM, TAP,
} from './Actions';

// Map from key codes to action types
const KEY_TO_ACTION: Readonly<Record<string, string>> = Object.freeze({
  ArrowLeft: MOVE_LEFT,
  ArrowRight: MOVE_RIGHT,
  ArrowUp: MOVE_UP,
  ArrowDown: MOVE_DOWN,
  KeyA: MOVE_LEFT,
  KeyD: MOVE_RIGHT,
  KeyW: MOVE_UP,
  KeyS: MOVE_DOWN,
  Space: FIRE,
  Escape: PAUSE,
  Enter: CONFIRM,
  Tab: WEAPON_SWAP,
});

export interface SceneActionBridge {
  /** Build the SceneActions facade for the current frame. */
  buildSceneActions(): SceneActions;
  /** Build the flat PlayerActions from a SceneActions object. */
  buildPlayerActions(sceneActions: SceneActions): PlayerActions;
  /** Clean up event listeners. */
  dispose(): void;
}

/**
 * Creates a bridge that translates InputManager actions into scene-friendly
 * and player-friendly action objects.
 */
export function createSceneActionBridge(
  inputManager: IInputManager,
  store: GameStore,
): SceneActionBridge {
  // Raw keypress buffer: tracks ALL initial key presses (not just those
  // mapped by the KeyboardAdapter). Needed because scene handlers call
  // consumeKey('KeyP'), consumeKey('KeyK'), etc.
  let rawKeyPresses: Set<string> = new Set();

  const onKeyDown = (e: KeyboardEvent): void => {
    if (!e.repeat) {
      rawKeyPresses.add(e.code);
    }
  };
  window.addEventListener('keydown', onKeyDown);

  return {
    buildSceneActions(): SceneActions {
      const pressed: Action[] = inputManager.getActions();
      const held: Action[] = inputManager.getHeldActions();
      const all: Action[] = [...pressed, ...held];

      const pressedTypes: Set<string> = new Set(pressed.map((a: Action) => a.type));

      const heldPayloads: Map<string, unknown> = new Map();
      for (const a of held) {
        if (a.payload) {
          heldPayloads.set(a.type, a.payload);
        }
      }

      // Snapshot and clear the raw keypress buffer
      const frameKeys: Set<string> = new Set(rawKeyPresses);
      rawKeyPresses = new Set();

      // consumed keys to prevent double-reads
      const consumed: Set<string> = new Set();

      return {
        consumeKey(keyCode: string): boolean {
          if (consumed.has(keyCode)) return false;

          const actionType = KEY_TO_ACTION[keyCode];
          if (actionType && pressedTypes.has(actionType)) {
            consumed.add(keyCode);
            return true;
          }

          if (frameKeys.has(keyCode)) {
            consumed.add(keyCode);
            frameKeys.delete(keyCode);
            return true;
          }

          return false;
        },

        isAction(): boolean {
          return (
            pressedTypes.has(CONFIRM) ||
            pressedTypes.has(TAP)
          );
        },

        time: store.getState().time,

        _pressed: pressed,
        _held: held,
        _all: all,
        _heldPayloads: heldPayloads,
        _pressedTypes: pressedTypes,
      };
    },

    buildPlayerActions(sceneActions: SceneActions): PlayerActions {
      const types: Set<string> = new Set([
        ...sceneActions._pressed.map((a: Action) => a.type),
        ...sceneActions._held.map((a: Action) => a.type),
      ]);

      const touchAction = sceneActions._held.find((a: Action) => a.type === TOUCH_MOVE);
      const mergedStats = store.getState().economy.mergedStats || {};

      return {
        MOVE_LEFT: types.has(MOVE_LEFT),
        MOVE_RIGHT: types.has(MOVE_RIGHT),
        FIRE: types.has(FIRE),
        WEAPON_SWAP: sceneActions._pressedTypes.has(WEAPON_SWAP),
        TOUCH_MOVE: touchAction?.payload as { readonly x: number; readonly y: number } | undefined,
        equippedStats: mergedStats as unknown as EquippedStats,
      };
    },

    dispose(): void {
      window.removeEventListener('keydown', onKeyDown);
    },
  };
}
