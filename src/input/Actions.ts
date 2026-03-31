/**
 * Input action type constants and factory functions.
 *
 * Actions are immutable value objects that describe player intent,
 * decoupled from the raw input source (keyboard, touch, gamepad).
 *
 * @module input/Actions
 */

// ── Movement ─────────────────────────────────────────────────────────────────
export const MOVE_LEFT = 'input:moveLeft' as const;
export const MOVE_RIGHT = 'input:moveRight' as const;
export const MOVE_UP = 'input:moveUp' as const;
export const MOVE_DOWN = 'input:moveDown' as const;
export const TOUCH_MOVE = 'input:touchMove' as const; // payload: { x, y }

// ── Combat ───────────────────────────────────────────────────────────────────
export const FIRE = 'input:fire' as const;
export const WEAPON_SWAP = 'input:weaponSwap' as const;

// ── Navigation ───────────────────────────────────────────────────────────────
export const CONFIRM = 'input:confirm' as const;
export const CANCEL = 'input:cancel' as const;
export const PAUSE = 'input:pause' as const;
export const NAV_LEFT = 'input:navLeft' as const;
export const NAV_RIGHT = 'input:navRight' as const;
export const NAV_UP = 'input:navUp' as const;
export const NAV_DOWN = 'input:navDown' as const;

// ── Menu ─────────────────────────────────────────────────────────────────────
export const SELECT_DIFFICULTY = 'input:selectDifficulty' as const;
export const TOGGLE_MODE = 'input:toggleMode' as const;
export const START_GAME = 'input:startGame' as const;
export const OPEN_SHOP = 'input:openShop' as const;
export const OPEN_SKILLS = 'input:openSkills' as const;
export const OPEN_TUTORIAL = 'input:openTutorial' as const;

// ── High Score ───────────────────────────────────────────────────────────────
export const LETTER_UP = 'input:letterUp' as const;
export const LETTER_DOWN = 'input:letterDown' as const;
export const LETTER_NEXT = 'input:letterNext' as const;
export const LETTER_PREV = 'input:letterPrev' as const;
export const SUBMIT_SCORE = 'input:submitScore' as const;
export const SHARE_SCORE = 'input:shareScore' as const;

// ── UI ───────────────────────────────────────────────────────────────────────
export const TAP = 'input:tap' as const; // payload: { x, y }

// ── Action type constants union ──────────────────────────────────────────────

export type ActionType =
  | typeof MOVE_LEFT
  | typeof MOVE_RIGHT
  | typeof MOVE_UP
  | typeof MOVE_DOWN
  | typeof TOUCH_MOVE
  | typeof FIRE
  | typeof WEAPON_SWAP
  | typeof CONFIRM
  | typeof CANCEL
  | typeof PAUSE
  | typeof NAV_LEFT
  | typeof NAV_RIGHT
  | typeof NAV_UP
  | typeof NAV_DOWN
  | typeof SELECT_DIFFICULTY
  | typeof TOGGLE_MODE
  | typeof START_GAME
  | typeof OPEN_SHOP
  | typeof OPEN_SKILLS
  | typeof OPEN_TUTORIAL
  | typeof LETTER_UP
  | typeof LETTER_DOWN
  | typeof LETTER_NEXT
  | typeof LETTER_PREV
  | typeof SUBMIT_SCORE
  | typeof SHARE_SCORE
  | typeof TAP;

// ── Payload types ────────────────────────────────────────────────────────────

interface PositionPayload {
  readonly x: number;
  readonly y: number;
}

// ── Discriminated union of all game actions ──────────────────────────────────

interface BaseAction {
  readonly timestamp: number;
}

export interface MoveAction extends BaseAction {
  readonly type: typeof TOUCH_MOVE;
  readonly payload: PositionPayload;
}

export interface TapAction extends BaseAction {
  readonly type: typeof TAP;
  readonly payload: PositionPayload;
}

export interface SimpleAction extends BaseAction {
  readonly type: Exclude<ActionType, typeof TOUCH_MOVE | typeof TAP>;
  readonly payload: undefined;
}

export type GameAction = MoveAction | TapAction | SimpleAction;

// ── Factory function ─────────────────────────────────────────────────────────

/**
 * Create an immutable action object.
 */
export function createAction<T extends typeof TOUCH_MOVE | typeof TAP>(
  type: T,
  payload: PositionPayload,
): T extends typeof TOUCH_MOVE ? MoveAction : TapAction;
export function createAction<T extends Exclude<ActionType, typeof TOUCH_MOVE | typeof TAP>>(
  type: T,
  payload?: undefined,
): SimpleAction;
export function createAction(
  type: ActionType,
  payload?: PositionPayload,
): GameAction {
  return Object.freeze({
    type,
    payload: payload !== undefined ? Object.freeze({ ...payload }) : undefined,
    timestamp: Date.now(),
  }) as GameAction;
}
