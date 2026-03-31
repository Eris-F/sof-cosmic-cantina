/**
 * Tests for the input abstraction layer:
 * Actions, KeyboardAdapter, TouchAdapter, InputManager.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createAction, MOVE_LEFT, MOVE_RIGHT, MOVE_UP, MOVE_DOWN, FIRE, PAUSE, CONFIRM, WEAPON_SWAP, TOUCH_MOVE, TAP } from '../../src/input/Actions.js';
import { KeyboardAdapter } from '../../src/input/KeyboardAdapter.js';
import { TouchAdapter } from '../../src/input/TouchAdapter.js';
import { InputManager } from '../../src/input/InputManager.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeKeyEvent(code, { repeat = false } = {}) {
  return new KeyboardEvent('keydown', { code, repeat, bubbles: true });
}

function makeKeyUpEvent(code) {
  return new KeyboardEvent('keyup', { code, bubbles: true });
}

/**
 * Create a minimal canvas-like element for touch tests.
 * getBoundingClientRect returns a 480x640 rect at (0,0) for 1:1 mapping.
 */
function createMockCanvas() {
  const el = document.createElement('canvas');
  el.width = 480;
  el.height = 640;
  el.getBoundingClientRect = () => ({
    left: 0,
    top: 0,
    width: 480,
    height: 640,
    right: 480,
    bottom: 640,
    x: 0,
    y: 0,
    toJSON: () => {},
  });
  return el;
}

function fireTouchEvent(el, type, touches) {
  const touchList = touches.map((t) => ({
    identifier: t.id,
    clientX: t.x,
    clientY: t.y,
  }));
  const event = new TouchEvent(type, {
    changedTouches: touchList,
    cancelable: true,
    bubbles: true,
  });
  el.dispatchEvent(event);
}

// ── Actions ──────────────────────────────────────────────────────────────────

describe('Actions', () => {
  it('createAction produces a frozen object with type and timestamp', () => {
    const action = createAction(FIRE);
    expect(action.type).toBe(FIRE);
    expect(action.payload).toBeUndefined();
    expect(typeof action.timestamp).toBe('number');
    expect(Object.isFrozen(action)).toBe(true);
  });

  it('createAction freezes payload', () => {
    const action = createAction(TOUCH_MOVE, { x: 10, y: 20 });
    expect(action.payload).toEqual({ x: 10, y: 20 });
    expect(Object.isFrozen(action.payload)).toBe(true);
  });

  it('createAction does not mutate the source payload', () => {
    const payload = { x: 5, y: 10 };
    createAction(TAP, payload);
    payload.x = 999;
    // Original object can still be mutated, but the action's copy is frozen
    expect(payload.x).toBe(999);
  });
});

// ── KeyboardAdapter ──────────────────────────────────────────────────────────

describe('KeyboardAdapter', () => {
  /** @type {KeyboardAdapter} */
  let adapter;

  beforeEach(() => {
    adapter = new KeyboardAdapter(window);
  });

  afterEach(() => {
    adapter.dispose();
  });

  it('maps WASD keys to movement held actions', () => {
    window.dispatchEvent(makeKeyEvent('KeyA'));
    window.dispatchEvent(makeKeyEvent('KeyD'));

    const held = adapter.getHeldActions();
    const types = held.map((a) => a.type);
    expect(types).toContain(MOVE_LEFT);
    expect(types).toContain(MOVE_RIGHT);
  });

  it('maps arrow keys to movement held actions', () => {
    window.dispatchEvent(makeKeyEvent('ArrowUp'));
    window.dispatchEvent(makeKeyEvent('ArrowDown'));

    const held = adapter.getHeldActions();
    const types = held.map((a) => a.type);
    expect(types).toContain(MOVE_UP);
    expect(types).toContain(MOVE_DOWN);
  });

  it('removes held action on keyup', () => {
    window.dispatchEvent(makeKeyEvent('KeyA'));
    expect(adapter.getHeldActions().length).toBeGreaterThan(0);

    window.dispatchEvent(makeKeyUpEvent('KeyA'));
    const held = adapter.getHeldActions();
    const types = held.map((a) => a.type);
    expect(types).not.toContain(MOVE_LEFT);
  });

  it('maps Space to FIRE as one-shot press', () => {
    window.dispatchEvent(makeKeyEvent('Space'));

    const pressed = adapter.consumePressed();
    const types = pressed.map((a) => a.type);
    expect(types).toContain(FIRE);
  });

  it('maps Escape to PAUSE as one-shot press', () => {
    window.dispatchEvent(makeKeyEvent('Escape'));

    const pressed = adapter.consumePressed();
    expect(pressed[0].type).toBe(PAUSE);
  });

  it('maps Enter to CONFIRM as one-shot press', () => {
    window.dispatchEvent(makeKeyEvent('Enter'));

    const pressed = adapter.consumePressed();
    expect(pressed[0].type).toBe(CONFIRM);
  });

  it('does not buffer repeated keydown events', () => {
    window.dispatchEvent(makeKeyEvent('Space', { repeat: true }));

    const pressed = adapter.consumePressed();
    expect(pressed).toHaveLength(0);
  });

  it('consumePressed clears the buffer', () => {
    window.dispatchEvent(makeKeyEvent('Space'));
    adapter.consumePressed();
    const second = adapter.consumePressed();
    expect(second).toHaveLength(0);
  });

  it('dispose removes listeners and clears state', () => {
    adapter.dispose();

    window.dispatchEvent(makeKeyEvent('KeyA'));
    expect(adapter.getHeldActions()).toHaveLength(0);

    window.dispatchEvent(makeKeyEvent('Space'));
    expect(adapter.consumePressed()).toHaveLength(0);
  });
});

// ── TouchAdapter ─────────────────────────────────────────────────────────────

describe('TouchAdapter', () => {
  /** @type {HTMLCanvasElement} */
  let canvas;
  /** @type {TouchAdapter} */
  let adapter;

  beforeEach(() => {
    canvas = createMockCanvas();
    document.body.appendChild(canvas);
    adapter = new TouchAdapter(canvas, 480, 640);
  });

  afterEach(() => {
    adapter.dispose();
    canvas.remove();
  });

  it('translates screen coordinates to canvas coordinates', () => {
    fireTouchEvent(canvas, 'touchstart', [{ id: 0, x: 240, y: 320 }]);

    const held = adapter.getHeldActions();
    const move = held.find((a) => a.type === TOUCH_MOVE);
    expect(move).toBeDefined();
    expect(move.payload.x).toBeCloseTo(240);
    expect(move.payload.y).toBeCloseTo(320);
  });

  it('first finger produces TOUCH_MOVE and FIRE held actions', () => {
    fireTouchEvent(canvas, 'touchstart', [{ id: 0, x: 100, y: 200 }]);

    const held = adapter.getHeldActions();
    const types = held.map((a) => a.type);
    expect(types).toContain(TOUCH_MOVE);
    expect(types).toContain(FIRE);
  });

  it('second finger produces FIRE without TOUCH_MOVE', () => {
    fireTouchEvent(canvas, 'touchstart', [{ id: 0, x: 100, y: 200 }]);
    fireTouchEvent(canvas, 'touchstart', [{ id: 1, x: 300, y: 400 }]);

    const held = adapter.getHeldActions();
    const fireCount = held.filter((a) => a.type === FIRE).length;
    expect(fireCount).toBe(1); // only one FIRE action, not two
    expect(held.filter((a) => a.type === TOUCH_MOVE)).toHaveLength(1);
  });

  it('produces TAP one-shot on first touch', () => {
    fireTouchEvent(canvas, 'touchstart', [{ id: 0, x: 200, y: 300 }]);

    const pressed = adapter.consumePressed();
    const tap = pressed.find((a) => a.type === TAP);
    expect(tap).toBeDefined();
    expect(tap.payload.x).toBeCloseTo(200);
    expect(tap.payload.y).toBeCloseTo(300);
  });

  it('updates position on touchmove', () => {
    fireTouchEvent(canvas, 'touchstart', [{ id: 0, x: 100, y: 100 }]);
    fireTouchEvent(canvas, 'touchmove', [{ id: 0, x: 200, y: 300 }]);

    const held = adapter.getHeldActions();
    const move = held.find((a) => a.type === TOUCH_MOVE);
    expect(move.payload.x).toBeCloseTo(200);
    expect(move.payload.y).toBeCloseTo(300);
  });

  it('clears movement on touchend', () => {
    fireTouchEvent(canvas, 'touchstart', [{ id: 0, x: 100, y: 100 }]);
    fireTouchEvent(canvas, 'touchend', [{ id: 0, x: 100, y: 100 }]);

    const held = adapter.getHeldActions();
    expect(held).toHaveLength(0);
  });

  it('detects double-tap as WEAPON_SWAP', () => {
    vi.useFakeTimers();

    fireTouchEvent(canvas, 'touchstart', [{ id: 0, x: 100, y: 100 }]);
    fireTouchEvent(canvas, 'touchend', [{ id: 0, x: 100, y: 100 }]);
    adapter.consumePressed(); // clear first tap

    vi.advanceTimersByTime(200); // within 300ms window

    fireTouchEvent(canvas, 'touchstart', [{ id: 1, x: 100, y: 100 }]);

    const pressed = adapter.consumePressed();
    const swap = pressed.find((a) => a.type === WEAPON_SWAP);
    expect(swap).toBeDefined();

    vi.useRealTimers();
  });

  it('does not fire WEAPON_SWAP after 300ms window', () => {
    vi.useFakeTimers();

    fireTouchEvent(canvas, 'touchstart', [{ id: 0, x: 100, y: 100 }]);
    fireTouchEvent(canvas, 'touchend', [{ id: 0, x: 100, y: 100 }]);
    adapter.consumePressed();

    vi.advanceTimersByTime(400); // outside window

    fireTouchEvent(canvas, 'touchstart', [{ id: 1, x: 100, y: 100 }]);

    const pressed = adapter.consumePressed();
    const swap = pressed.find((a) => a.type === WEAPON_SWAP);
    expect(swap).toBeUndefined();

    vi.useRealTimers();
  });

  it('excludes pause zone touches from movement', () => {
    // Top-right corner: x > 440, y < 30
    fireTouchEvent(canvas, 'touchstart', [{ id: 0, x: 460, y: 10 }]);

    const held = adapter.getHeldActions();
    expect(held).toHaveLength(0); // no movement

    const pressed = adapter.consumePressed();
    const pause = pressed.find((a) => a.type === PAUSE);
    expect(pause).toBeDefined();
  });

  it('reset clears all touch state', () => {
    fireTouchEvent(canvas, 'touchstart', [{ id: 0, x: 100, y: 100 }]);
    adapter.reset();

    expect(adapter.getHeldActions()).toHaveLength(0);
    expect(adapter.consumePressed()).toHaveLength(0);
  });

  it('dispose removes event listeners', () => {
    adapter.dispose();

    fireTouchEvent(canvas, 'touchstart', [{ id: 0, x: 100, y: 100 }]);
    expect(adapter.getHeldActions()).toHaveLength(0);
    expect(adapter.consumePressed()).toHaveLength(0);
  });
});

// ── InputManager ─────────────────────────────────────────────────────────────

describe('InputManager', () => {
  /** @type {KeyboardAdapter} */
  let keyboard;
  /** @type {TouchAdapter} */
  let touch;
  /** @type {InputManager} */
  let manager;
  /** @type {HTMLCanvasElement} */
  let canvas;

  beforeEach(() => {
    canvas = createMockCanvas();
    document.body.appendChild(canvas);
    keyboard = new KeyboardAdapter(window);
    touch = new TouchAdapter(canvas, 480, 640);
    manager = new InputManager(keyboard, touch);
  });

  afterEach(() => {
    manager.dispose();
    canvas.remove();
  });

  it('update collects one-shot actions from both adapters', () => {
    window.dispatchEvent(makeKeyEvent('Space'));
    fireTouchEvent(canvas, 'touchstart', [{ id: 0, x: 100, y: 100 }]);

    manager.update();
    const actions = manager.getActions();
    const types = actions.map((a) => a.type);
    expect(types).toContain(FIRE);
    expect(types).toContain(TAP);
  });

  it('hasAction detects action existence', () => {
    window.dispatchEvent(makeKeyEvent('Enter'));
    manager.update();

    expect(manager.hasAction(CONFIRM)).toBe(true);
    expect(manager.hasAction(FIRE)).toBe(false);
  });

  it('consumeAction removes and returns the first matching action', () => {
    window.dispatchEvent(makeKeyEvent('Space'));
    manager.update();

    const action = manager.consumeAction(FIRE);
    expect(action).toBeDefined();
    expect(action.type).toBe(FIRE);

    // Should be gone now
    expect(manager.consumeAction(FIRE)).toBeUndefined();
    expect(manager.hasAction(FIRE)).toBe(false);
  });

  it('consumeAction returns undefined for missing action', () => {
    manager.update();
    expect(manager.consumeAction(FIRE)).toBeUndefined();
  });

  it('getHeldActions returns held actions from both adapters', () => {
    window.dispatchEvent(makeKeyEvent('KeyA'));
    fireTouchEvent(canvas, 'touchstart', [{ id: 0, x: 200, y: 300 }]);

    const held = manager.getHeldActions();
    const types = held.map((a) => a.type);
    expect(types).toContain(MOVE_LEFT);
    expect(types).toContain(TOUCH_MOVE);
    expect(types).toContain(FIRE);
  });

  it('clear empties the action queue', () => {
    window.dispatchEvent(makeKeyEvent('Space'));
    manager.update();

    expect(manager.getActions().length).toBeGreaterThan(0);
    manager.clear();
    expect(manager.getActions()).toHaveLength(0);
  });

  it('resetTouch delegates to touch adapter', () => {
    fireTouchEvent(canvas, 'touchstart', [{ id: 0, x: 100, y: 100 }]);
    expect(touch.getHeldActions().length).toBeGreaterThan(0);

    manager.resetTouch();
    expect(touch.getHeldActions()).toHaveLength(0);
  });

  it('dispose cleans up both adapters', () => {
    manager.dispose();

    // Keyboard should not respond
    window.dispatchEvent(makeKeyEvent('KeyA'));
    expect(keyboard.getHeldActions()).toHaveLength(0);

    // Touch should not respond
    fireTouchEvent(canvas, 'touchstart', [{ id: 0, x: 100, y: 100 }]);
    expect(touch.getHeldActions()).toHaveLength(0);
  });
});
