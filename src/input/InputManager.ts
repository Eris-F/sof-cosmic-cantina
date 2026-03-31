/**
 * Coordinates input adapters and provides a unified per-frame action queue.
 *
 * Scenes call `update()` once per frame, then read actions via
 * `getActions()`, `hasAction()`, or `consumeAction()`.
 *
 * @module input/InputManager
 */

import type { IInputManager } from '../types/index';
import type { GameAction, ActionType } from './Actions';
import type { KeyboardAdapter } from './KeyboardAdapter';
import type { TouchAdapter } from './TouchAdapter';

export class InputManager implements IInputManager {
  private readonly _keyboard: KeyboardAdapter;
  private readonly _touch: TouchAdapter;
  private _actions: GameAction[];

  constructor(keyboard: KeyboardAdapter, touch: TouchAdapter) {
    this._keyboard = keyboard;
    this._touch = touch;
    this._actions = [];
  }

  /**
   * Collect all actions from adapters for this frame.
   * Call exactly once per frame, before reading actions.
   */
  update(): void {
    this._actions = [
      ...this._keyboard.consumePressed(),
      ...this._touch.consumePressed(),
    ];
  }

  /**
   * Returns this frame's one-shot action array (does not include held actions).
   */
  getActions(): GameAction[] {
    return [...this._actions];
  }

  /**
   * Returns all currently held actions (movement, fire) from both adapters.
   */
  getHeldActions(): GameAction[] {
    return [
      ...this._keyboard.getHeldActions(),
      ...this._touch.getHeldActions(),
    ];
  }

  /**
   * Check whether an action of the given type exists in this frame's queue.
   */
  hasAction(type: ActionType | string): boolean {
    return this._actions.some((a) => a.type === type);
  }

  /**
   * Get and remove the first action of the given type from this frame's queue.
   * Returns `undefined` if no matching action exists.
   */
  consumeAction(type: ActionType | string): GameAction | undefined {
    const index = this._actions.findIndex((a) => a.type === type);
    if (index === -1) {
      return undefined;
    }
    const [action] = this._actions.splice(index, 1);
    return action;
  }

  /** Clear the action queue. */
  clear(): void {
    this._actions = [];
  }

  /** Dispose all adapters and clear state. */
  dispose(): void {
    this._keyboard.dispose();
    this._touch.dispose();
    this._actions = [];
  }

  /** Delegate to touch adapter reset (for scene transitions). */
  resetTouch(): void {
    this._touch.reset();
  }
}
