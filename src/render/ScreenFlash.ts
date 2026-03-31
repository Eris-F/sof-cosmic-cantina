/**
 * Screen flash effects — full-canvas color overlay that decays.
 *
 * Triggered by abilities (bomb, tequila, shield) and powerup collection.
 * Renders as the last gameplay layer before HUD.
 *
 * @module render/ScreenFlash
 */
import { CANVAS_WIDTH } from '../constants';
import { getGameHeight } from '../core/Layout';

interface Flash {
  r: number;
  g: number;
  b: number;
  alpha: number;
  decay: number; // alpha decrease per second
}

let activeFlash: Flash | null = null;

/** Trigger a screen flash. */
export function triggerFlash(color: string, duration = 0.2, maxAlpha = 0.5): void {
  const [r, g, b] = parseColor(color);
  activeFlash = {
    r, g, b,
    alpha: maxAlpha,
    decay: maxAlpha / duration,
  };
}

/** Preset flashes. */
export function flashWhite(duration = 0.15): void { triggerFlash('#ffffff', duration, 0.6); }
export function flashOrange(duration = 0.2): void { triggerFlash('#ff8800', duration, 0.4); }
export function flashBlue(duration = 0.2): void { triggerFlash('#4488ff', duration, 0.35); }
export function flashGreen(duration = 0.15): void { triggerFlash('#44ff44', duration, 0.3); }
export function flashRed(duration = 0.3): void { triggerFlash('#ff2222', duration, 0.5); }

/** Update flash decay. Call once per frame. */
export function updateFlash(dt: number): void {
  if (!activeFlash) return;
  activeFlash.alpha -= activeFlash.decay * dt;
  if (activeFlash.alpha <= 0) {
    activeFlash = null;
  }
}

/** Render the flash overlay. Call after gameplay entities, before HUD. */
export function renderFlash(ctx: CanvasRenderingContext2D): void {
  if (!activeFlash || activeFlash.alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = activeFlash.alpha;
  ctx.fillStyle = `rgb(${activeFlash.r}, ${activeFlash.g}, ${activeFlash.b})`;
  ctx.fillRect(0, 0, CANVAS_WIDTH, getGameHeight());
  ctx.restore();
}

/** Clear active flash (on scene transition). */
export function clearFlash(): void {
  activeFlash = null;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function parseColor(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}
