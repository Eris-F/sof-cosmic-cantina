/**
 * Tap feedback — visual ripple on touch + haptic pulse.
 *
 * Renders an expanding circle at the tap point that fades over 150ms.
 * Drawn on top of everything (after debug overlay layer).
 *
 * @module render/TapFeedback
 */

interface Ripple {
  x: number;
  y: number;
  age: number;
  lifetime: number;
}

const RIPPLE_LIFETIME = 0.15; // seconds
const RIPPLE_START_RADIUS = 5;
const RIPPLE_END_RADIUS = 25;
const MAX_RIPPLES = 5;

const ripples: Ripple[] = [];

/**
 * Spawn a ripple at the given gameplay-space coordinates.
 * Call on every zone hit (from scene handlers).
 */
export function spawnRipple(x: number, y: number): void {
  if (ripples.length >= MAX_RIPPLES) ripples.shift();
  ripples.push({ x, y, age: 0, lifetime: RIPPLE_LIFETIME });
}

/**
 * Update all active ripples. Call once per frame.
 */
export function updateRipples(dt: number): void {
  for (let i = ripples.length - 1; i >= 0; i--) {
    ripples[i]!.age += dt;
    if (ripples[i]!.age >= ripples[i]!.lifetime) {
      ripples.splice(i, 1);
    }
  }
}

/**
 * Render all active ripples. Call after all other rendering.
 * Assumes ctx is already translated to gameplay origin.
 */
export function renderRipples(ctx: CanvasRenderingContext2D): void {
  if (ripples.length === 0) return;

  ctx.save();
  for (const r of ripples) {
    const progress = r.age / r.lifetime;
    const radius = RIPPLE_START_RADIUS + (RIPPLE_END_RADIUS - RIPPLE_START_RADIUS) * progress;
    const alpha = 0.4 * (1 - progress);

    ctx.beginPath();
    ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 204, 0, ${alpha})`;
    ctx.lineWidth = 2 * (1 - progress);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Clear all ripples (on scene transition).
 */
export function clearRipples(): void {
  ripples.length = 0;
}
