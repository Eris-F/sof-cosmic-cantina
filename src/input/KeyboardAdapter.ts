/**
 * Converts keyboard events into normalized input actions.
 *
 * Tracks held keys for continuous movement and buffers one-shot
 * presses (Enter, Escape, Space) for per-frame consumption.
 *
 * @module input/KeyboardAdapter
 */

import type { IInputAdapter } from '../types/index';
import type { GameAction } from './Actions';
import {
  MOVE_LEFT,
  MOVE_RIGHT,
  MOVE_UP,
  MOVE_DOWN,
  FIRE,
  PAUSE,
  CONFIRM,
  WEAPON_SWAP,
  createAction,
} from './Actions';

/** Keys that should prevent default browser behaviour. */
const PREVENT_DEFAULT: ReadonlySet<string> = new Set([
  'Space',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
]);

/** Continuous-hold key to action type mapping. */
const HELD_MAP: ReadonlyMap<string, typeof MOVE_LEFT | typeof MOVE_RIGHT | typeof MOVE_UP | typeof MOVE_DOWN> = new Map([
  ['ArrowLeft', MOVE_LEFT],
  ['ArrowRight', MOVE_RIGHT],
  ['ArrowUp', MOVE_UP],
  ['ArrowDown', MOVE_DOWN],
  ['KeyA', MOVE_LEFT],
  ['KeyD', MOVE_RIGHT],
  ['KeyW', MOVE_UP],
  ['KeyS', MOVE_DOWN],
]);

/** One-shot key to action type mapping. */
const PRESS_MAP: ReadonlyMap<string, typeof FIRE | typeof PAUSE | typeof CONFIRM | typeof WEAPON_SWAP> = new Map([
  ['Space', FIRE],
  ['Escape', PAUSE],
  ['Enter', CONFIRM],
  ['Tab', WEAPON_SWAP],
]);

export class KeyboardAdapter implements IInputAdapter {
  private readonly _element: EventTarget;
  private readonly _held: Set<string>;
  private _pressed: string[];
  private readonly _onKeyDown: (e: KeyboardEvent) => void;
  private readonly _onKeyUp: (e: KeyboardEvent) => void;

  constructor(element: EventTarget) {
    this._element = element;
    this._held = new Set();
    this._pressed = [];

    this._onKeyDown = (e: KeyboardEvent): void => {
      if (PREVENT_DEFAULT.has(e.code)) {
        e.preventDefault();
      }
      this._held.add(e.code);

      // Buffer one-shot presses (only on initial press, not repeat)
      if (!e.repeat && PRESS_MAP.has(e.code)) {
        this._pressed.push(e.code);
      }
    };

    this._onKeyUp = (e: KeyboardEvent): void => {
      this._held.delete(e.code);
    };

    element.addEventListener('keydown', this._onKeyDown as EventListener);
    element.addEventListener('keyup', this._onKeyUp as EventListener);
  }

  /**
   * Returns actions for all currently held movement keys.
   */
  getHeldActions(): GameAction[] {
    const actions: GameAction[] = [];
    for (const code of this._held) {
      const type = HELD_MAP.get(code);
      if (type !== undefined) {
        actions.push(createAction(type));
      }
    }
    return actions;
  }

  /**
   * Returns buffered one-shot actions and clears the buffer.
   * Arrow keys in the press buffer produce NAV_ actions for menu navigation.
   */
  consumePressed(): GameAction[] {
    if (this._pressed.length === 0) {
      return [];
    }

    const actions: GameAction[] = [];
    for (const code of this._pressed) {
      const type = PRESS_MAP.get(code);
      if (type !== undefined) {
        actions.push(createAction(type));
      }
    }
    this._pressed = [];
    return actions;
  }

  /** Remove all event listeners. */
  dispose(): void {
    this._element.removeEventListener('keydown', this._onKeyDown as EventListener);
    this._element.removeEventListener('keyup', this._onKeyUp as EventListener);
    this._held.clear();
    this._pressed = [];
  }
}
