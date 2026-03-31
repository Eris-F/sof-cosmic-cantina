import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';

interface TouchPosition {
  readonly x: number;
  readonly y: number;
}

interface TouchState {
  // Movement touch (first finger)
  moveActive: boolean;
  moveId: number | null;
  targetX: number; // -1 means no target
  targetY: number;
  // Fire touch (second finger or tap)
  fireActive: boolean;
  fireId: number | null;
  tapFired: boolean;
}

const keys: Record<string, boolean> = {};
const touch: TouchState = {
  // Movement touch (first finger)
  moveActive: false,
  moveId: null,
  targetX: -1, // -1 means no target
  targetY: -1,
  // Fire touch (second finger or tap)
  fireActive: false,
  fireId: null,
  tapFired: false,
};

let canvasEl: HTMLCanvasElement | null = null;

export function initInput(canvas: HTMLCanvasElement): void {
  canvasEl = canvas;

  // Keyboard
  window.addEventListener('keydown', (e: KeyboardEvent): void => {
    keys[e.code] = true;
    if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
      e.preventDefault();
    }
  });
  window.addEventListener('keyup', (e: KeyboardEvent): void => {
    keys[e.code] = false;
  });

  // Touch
  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
  canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });
}

function getTouchCanvas(t: Touch): TouchPosition {
  const rect = canvasEl!.getBoundingClientRect();
  return {
    x: ((t.clientX - rect.left) / rect.width) * CANVAS_WIDTH,
    y: ((t.clientY - rect.top) / rect.height) * CANVAS_HEIGHT,
  };
}

function isInPauseZone(t: Touch): boolean {
  const pos = getTouchCanvas(t);
  return pos.x > CANVAS_WIDTH - 40 && pos.y < 30;
}

function handleTouchStart(e: TouchEvent): void {
  e.preventDefault();

  for (let idx = 0; idx < e.changedTouches.length; idx++) {
    const t = e.changedTouches[idx]!;
    // Skip pause button zone — let renderer handle it
    if (isInPauseZone(t)) continue;

    if (!touch.moveActive) {
      // First finger — movement + auto-fire
      touch.moveActive = true;
      touch.moveId = t.identifier;
      const pos = getTouchCanvas(t);
      touch.targetX = pos.x;
      touch.targetY = pos.y;
      touch.tapFired = true;
    } else if (!touch.fireActive) {
      // Second finger — dedicated fire
      touch.fireActive = true;
      touch.fireId = t.identifier;
    }
  }
}

function handleTouchMove(e: TouchEvent): void {
  e.preventDefault();

  for (let idx = 0; idx < e.changedTouches.length; idx++) {
    const t = e.changedTouches[idx]!;
    if (t.identifier === touch.moveId) {
      const pos = getTouchCanvas(t);
      touch.targetX = pos.x;
      touch.targetY = pos.y;
    }
  }
}

function handleTouchEnd(e: TouchEvent): void {
  e.preventDefault();

  for (let idx = 0; idx < e.changedTouches.length; idx++) {
    const t = e.changedTouches[idx]!;
    if (t.identifier === touch.moveId) {
      touch.moveActive = false;
      touch.moveId = null;
      touch.targetX = -1;
      touch.targetY = -1;
      touch.tapFired = false;
    }
    if (t.identifier === touch.fireId) {
      touch.fireActive = false;
      touch.fireId = null;
    }
  }
}

export function isDown(code: string): boolean {
  return keys[code] === true;
}

export function isAnyOf(...codes: string[]): boolean {
  return codes.some((c) => keys[c] === true);
}

export function consumeKey(code: string): boolean {
  if (keys[code]) {
    keys[code] = false;
    return true;
  }
  return false;
}

// Keyboard movement
export function isMoveLeft(): boolean {
  return isAnyOf('ArrowLeft', 'KeyA');
}

export function isMoveRight(): boolean {
  return isAnyOf('ArrowRight', 'KeyD');
}

export function isFiring(): boolean {
  return isDown('Space') || touch.moveActive;
}

export function isAction(): boolean {
  return consumeKey('Space') || consumeTap();
}

function consumeTap(): boolean {
  if (touch.tapFired) {
    touch.tapFired = false;
    return true;
  }
  return false;
}

// Touch target for thumb-follow (-1 if no touch)
export function getTouchTargetX(): number {
  return touch.targetX;
}

export function getTouchTargetY(): number {
  return touch.targetY;
}

export function isTouchActive(): boolean {
  return touch.moveActive;
}

export function resetTouch(): void {
  touch.moveActive = false;
  touch.moveId = null;
  touch.targetX = -1;
  touch.targetY = -1;
  touch.fireActive = false;
  touch.fireId = null;
  touch.tapFired = false;
}
