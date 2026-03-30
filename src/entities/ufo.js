import {
  CANVAS_WIDTH,
  UFO_WIDTH,
  UFO_HEIGHT,
  UFO_SPEED,
  UFO_SPAWN_MIN,
  UFO_SPAWN_MAX,
  POINTS_UFO,
} from '../constants.js';
import { drawTequilaUFO } from '../sprites.js';
import { sfxUfoAppear } from '../audio.js';

export function createUfoState() {
  return {
    active: false,
    x: 0,
    y: 28,
    direction: 1,
    timer: UFO_SPAWN_MIN + Math.random() * (UFO_SPAWN_MAX - UFO_SPAWN_MIN),
    pointValue: 0,
    showScoreTimer: 0,
    showScoreX: 0,
    showScoreValue: 0,
  };
}

export function updateUfo(ufo, dt, time) {
  // Score popup countdown
  if (ufo.showScoreTimer > 0) {
    ufo.showScoreTimer = Math.max(0, ufo.showScoreTimer - dt);
  }

  if (ufo.active) {
    ufo.x += ufo.direction * UFO_SPEED * dt;

    // Off screen
    if (ufo.x < -UFO_WIDTH && ufo.direction === -1) {
      ufo.active = false;
      ufo.timer = UFO_SPAWN_MIN + Math.random() * (UFO_SPAWN_MAX - UFO_SPAWN_MIN);
    }
    if (ufo.x > CANVAS_WIDTH + UFO_WIDTH && ufo.direction === 1) {
      ufo.active = false;
      ufo.timer = UFO_SPAWN_MIN + Math.random() * (UFO_SPAWN_MAX - UFO_SPAWN_MIN);
    }
  } else {
    ufo.timer -= dt;
    if (ufo.timer <= 0) {
      ufo.active = true;
      ufo.direction = Math.random() > 0.5 ? 1 : -1;
      ufo.x = ufo.direction === 1 ? -UFO_WIDTH : CANVAS_WIDTH + UFO_WIDTH;
      ufo.pointValue = POINTS_UFO[Math.floor(Math.random() * POINTS_UFO.length)];
      sfxUfoAppear();
    }
  }
}

export function hitUfo(ufo, wave) {
  if (!ufo.active) return 0;

  const score = ufo.pointValue * wave;
  ufo.showScoreTimer = 1.2;
  ufo.showScoreX = ufo.x;
  ufo.showScoreValue = score;
  ufo.active = false;
  ufo.timer = UFO_SPAWN_MIN + Math.random() * (UFO_SPAWN_MAX - UFO_SPAWN_MIN);

  return score;
}

export function renderUfo(ctx, ufo, time) {
  if (ufo.active) {
    drawTequilaUFO(ctx, ufo.x, ufo.y, time);
  }

  // Floating score popup
  if (ufo.showScoreTimer > 0) {
    const alpha = Math.min(1, ufo.showScoreTimer / 0.3);
    const offsetY = (1.2 - ufo.showScoreTimer) * 20;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffff00';
    ctx.font = '12px monospace';
    ctx.fillText(`+${ufo.showScoreValue}`, ufo.showScoreX - 16, ufo.y - offsetY);
    ctx.restore();
  }
}

export function getUfoBounds(ufo) {
  return {
    x: ufo.x,
    y: ufo.y,
    w: UFO_WIDTH,
    h: UFO_HEIGHT,
  };
}
