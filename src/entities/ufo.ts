import {
  CANVAS_WIDTH,
  UFO_WIDTH,
  UFO_HEIGHT,
  UFO_SPEED,
  UFO_SPAWN_MIN,
  UFO_SPAWN_MAX,
  POINTS_UFO,
} from '../constants';
import { drawTequilaUFO } from '../sprites';
import { sfxUfoAppear } from '../audio';

export interface UFOEntity {
  active: boolean;
  x: number;
  readonly y: number;
  direction: 1 | -1;
  timer: number;
  scoreValue: number;
  showScoreTimer: number;
  showScoreX: number;
  showScoreValue: number;
}

export interface UFOBounds {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export function createUfoState(): UFOEntity {
  return {
    active: false,
    x: 0,
    y: 28,
    direction: 1,
    timer: UFO_SPAWN_MIN + Math.random() * (UFO_SPAWN_MAX - UFO_SPAWN_MIN),
    scoreValue: 0,
    showScoreTimer: 0,
    showScoreX: 0,
    showScoreValue: 0,
  };
}

export function updateUfo(ufo: UFOEntity, dt: number, _time: number): void {
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
      ufo.scoreValue = POINTS_UFO[Math.floor(Math.random() * POINTS_UFO.length)]!;
      sfxUfoAppear();
    }
  }
}

export function hitUfo(ufo: UFOEntity, wave: number): number {
  if (!ufo.active) return 0;

  const score = ufo.scoreValue * wave;
  ufo.showScoreTimer = 1.2;
  ufo.showScoreX = ufo.x;
  ufo.showScoreValue = score;
  ufo.active = false;
  ufo.timer = UFO_SPAWN_MIN + Math.random() * (UFO_SPAWN_MAX - UFO_SPAWN_MIN);

  return score;
}

export function renderUfo(ctx: CanvasRenderingContext2D, ufo: UFOEntity, time: number): void {
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

export function getUfoBounds(ufo: UFOEntity): UFOBounds {
  return {
    x: ufo.x,
    y: ufo.y,
    w: UFO_WIDTH,
    h: UFO_HEIGHT,
  };
}
