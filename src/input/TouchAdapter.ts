/**
 * Converts touch events into normalized input actions.
 *
 * Finger 1 = movement (thumb follow), Finger 2 = fire.
 * Translates screen coordinates to canvas coordinates.
 *
 * @module input/TouchAdapter
 */

import type { IInputAdapter } from '../types/index';
import type { GameAction } from './Actions';
import {
  TOUCH_MOVE,
  FIRE,
  WEAPON_SWAP,
  TAP,
  PAUSE,
  createAction,
} from './Actions';

/** Double-tap detection window in milliseconds. */
const DOUBLE_TAP_MS = 300;

/** Pause zone: top-right corner dimensions. */
const PAUSE_ZONE_W = 40;
const PAUSE_ZONE_H = 30;

interface CanvasPosition {
  readonly x: number;
  readonly y: number;
}

export class TouchAdapter implements IInputAdapter {
  private readonly _canvas: HTMLCanvasElement;
  private readonly _canvasWidth: number;
  private readonly _canvasHeight: number;

  // ── Movement finger state ──────────────────────────────────────────────
  private _moveActive: boolean;
  private _moveId: number | null;
  private _moveX: number;
  private _moveY: number;

  // ── Fire finger state ──────────────────────────────────────────────────
  private _fireActive: boolean;
  private _fireId: number | null;

  // ── One-shot buffers ───────────────────────────────────────────────────
  private _pressedQueue: GameAction[];

  // ── Double-tap tracking ────────────────────────────────────────────────
  private _lastTapTime: number;

  // ── Bound handlers ─────────────────────────────────────────────────────
  private readonly _onTouchStart: (e: TouchEvent) => void;
  private readonly _onTouchMove: (e: TouchEvent) => void;
  private readonly _onTouchEnd: (e: TouchEvent) => void;

  private _getOrigin: () => { x: number; y: number };

  constructor(
    canvas: HTMLCanvasElement,
    canvasWidth: number,
    canvasHeight: number,
    getOrigin?: () => { x: number; y: number },
  ) {
    this._canvas = canvas;
    this._canvasWidth = canvasWidth;
    this._canvasHeight = canvasHeight;
    this._getOrigin = getOrigin ?? (() => ({ x: 0, y: 0 }));

    this._moveActive = false;
    this._moveId = null;
    this._moveX = -1;
    this._moveY = -1;

    this._fireActive = false;
    this._fireId = null;

    this._pressedQueue = [];
    this._lastTapTime = 0;

    this._onTouchStart = (e: TouchEvent): void => this._handleTouchStart(e);
    this._onTouchMove = (e: TouchEvent): void => this._handleTouchMove(e);
    this._onTouchEnd = (e: TouchEvent): void => this._handleTouchEnd(e);

    canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', this._onTouchMove, { passive: false });
    canvas.addEventListener('touchend', this._onTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', this._onTouchEnd, { passive: false });
  }

  // ── Public API ─────────────────────────────────────────────────────────

  /**
   * Returns continuous held actions (TOUCH_MOVE + FIRE if fingers active).
   */
  getHeldActions(): GameAction[] {
    const actions: GameAction[] = [];

    if (this._moveActive) {
      actions.push(
        createAction(TOUCH_MOVE, { x: this._moveX, y: this._moveY }),
      );
    }

    if (this._moveActive || this._fireActive) {
      actions.push(createAction(FIRE));
    }

    return actions;
  }

  /**
   * Returns buffered one-shot actions (TAP, WEAPON_SWAP, PAUSE) and clears them.
   */
  consumePressed(): GameAction[] {
    if (this._pressedQueue.length === 0) {
      return [];
    }
    const actions = [...this._pressedQueue];
    this._pressedQueue = [];
    return actions;
  }

  /** Clear all touch state. Call on scene transitions. */
  reset(): void {
    this._moveActive = false;
    this._moveId = null;
    this._moveX = -1;
    this._moveY = -1;
    this._fireActive = false;
    this._fireId = null;
    this._pressedQueue = [];
    this._lastTapTime = 0;
  }

  /** Remove all event listeners and clear state. */
  dispose(): void {
    this._canvas.removeEventListener('touchstart', this._onTouchStart);
    this._canvas.removeEventListener('touchmove', this._onTouchMove);
    this._canvas.removeEventListener('touchend', this._onTouchEnd);
    this._canvas.removeEventListener('touchcancel', this._onTouchEnd);
    this.reset();
  }

  // ── Coordinate translation ─────────────────────────────────────────────

  /**
   * Translate a Touch's screen coordinates to logical canvas coordinates.
   */
  private _toCanvas(t: Touch): CanvasPosition {
    const rect = this._canvas.getBoundingClientRect();
    const origin = this._getOrigin();
    // Use actual canvas backing size / DPR for logical dimensions.
    // Fallback to constructor values if canvas hasn't been DPR-scaled (test env).
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const logicalW = this._canvas.width > 0 ? this._canvas.width / dpr : this._canvasWidth;
    const logicalH = this._canvas.height > 0 ? this._canvas.height / dpr : this._canvasHeight;
    return {
      x: ((t.clientX - rect.left) / rect.width) * logicalW - origin.x,
      y: ((t.clientY - rect.top) / rect.height) * logicalH - origin.y,
    };
  }

  /**
   * Check if a touch is inside the pause zone (top-right corner).
   */
  private _isInPauseZone(pos: CanvasPosition): boolean {
    return pos.x > this._canvasWidth - PAUSE_ZONE_W && pos.y < PAUSE_ZONE_H;
  }

  // ── Event handlers ─────────────────────────────────────────────────────

  private _handleTouchStart(e: TouchEvent): void {
    e.preventDefault();

    for (const t of Array.from(e.changedTouches)) {
      const pos = this._toCanvas(t);

      // Pause zone tap
      if (this._isInPauseZone(pos)) {
        this._pressedQueue.push(createAction(PAUSE));
        continue;
      }

      // Double-tap detection
      const now = Date.now();
      if (now - this._lastTapTime < DOUBLE_TAP_MS) {
        this._pressedQueue.push(createAction(WEAPON_SWAP));
        this._lastTapTime = 0; // reset so triple-tap doesn't fire again
      } else {
        this._lastTapTime = now;
      }

      if (!this._moveActive) {
        // First finger -- movement
        this._moveActive = true;
        this._moveId = t.identifier;
        this._moveX = pos.x;
        this._moveY = pos.y;
        this._pressedQueue.push(createAction(TAP, { x: pos.x, y: pos.y }));
      } else if (!this._fireActive) {
        // Second finger -- dedicated fire
        this._fireActive = true;
        this._fireId = t.identifier;
      }
    }
  }

  private _handleTouchMove(e: TouchEvent): void {
    e.preventDefault();

    for (const t of Array.from(e.changedTouches)) {
      if (t.identifier === this._moveId) {
        const pos = this._toCanvas(t);
        this._moveX = pos.x;
        this._moveY = pos.y;
      }
    }
  }

  private _handleTouchEnd(e: TouchEvent): void {
    e.preventDefault();

    for (const t of Array.from(e.changedTouches)) {
      if (t.identifier === this._moveId) {
        this._moveActive = false;
        this._moveId = null;
        this._moveX = -1;
        this._moveY = -1;
      }
      if (t.identifier === this._fireId) {
        this._fireActive = false;
        this._fireId = null;
      }
    }
  }
}
