import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';

const keys = {};
const touch = {
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

let canvasEl = null;

export function initInput(canvas) {
  canvasEl = canvas;

  // Keyboard
  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
      e.preventDefault();
    }
  });
  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  // Touch
  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
  canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });
}

function getTouchCanvas(t) {
  const rect = canvasEl.getBoundingClientRect();
  return {
    x: ((t.clientX - rect.left) / rect.width) * CANVAS_WIDTH,
    y: ((t.clientY - rect.top) / rect.height) * CANVAS_HEIGHT,
  };
}

function getTouchCanvasX(t) {
  return getTouchCanvas(t).x;
}

function isInPauseZone(t) {
  const pos = getTouchCanvas(t);
  return pos.x > CANVAS_WIDTH - 40 && pos.y < 30;
}

function handleTouchStart(e) {
  e.preventDefault();

  for (const t of e.changedTouches) {
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

function handleTouchMove(e) {
  e.preventDefault();

  for (const t of e.changedTouches) {
    if (t.identifier === touch.moveId) {
      const pos = getTouchCanvas(t);
      touch.targetX = pos.x;
      touch.targetY = pos.y;
    }
  }
}

function handleTouchEnd(e) {
  e.preventDefault();

  for (const t of e.changedTouches) {
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

export function isDown(code) {
  return keys[code] === true;
}

export function isAnyOf(...codes) {
  return codes.some((c) => keys[c] === true);
}

export function consumeKey(code) {
  if (keys[code]) {
    keys[code] = false;
    return true;
  }
  return false;
}

// Keyboard movement
export function isMoveLeft() {
  return isAnyOf('ArrowLeft', 'KeyA');
}

export function isMoveRight() {
  return isAnyOf('ArrowRight', 'KeyD');
}

export function isFiring() {
  return isDown('Space') || touch.moveActive;
}

export function isAction() {
  return consumeKey('Space') || consumeTap();
}

function consumeTap() {
  if (touch.tapFired) {
    touch.tapFired = false;
    return true;
  }
  return false;
}

// Touch target for thumb-follow (-1 if no touch)
export function getTouchTargetX() {
  return touch.targetX;
}

export function getTouchTargetY() {
  return touch.targetY;
}

export function isTouchActive() {
  return touch.moveActive;
}
