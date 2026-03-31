/**
 * Render interpolation alpha — used for smooth sub-frame positioning.
 *
 * The game loop's fixed timestep means physics positions update at 144fps,
 * but rendering may happen between physics steps. Alpha (0-1) represents
 * how far between the last and next physics step we are.
 *
 * Renderers use: renderX = prevX + (currX - prevX) * alpha
 *
 * @module render/RenderAlpha
 */

let currentAlpha = 0;

/** Set the current interpolation alpha. Called by the render dispatcher. */
export function setRenderAlpha(alpha: number): void {
  currentAlpha = alpha;
}

/** Get the current interpolation alpha for use in renderers. */
export function getRenderAlpha(): number {
  return currentAlpha;
}

/** Interpolate between two values using the current alpha. */
export function lerp(prev: number, curr: number): number {
  return prev + (curr - prev) * currentAlpha;
}

/** Interpolate position using stored previous position. */
export function lerpPos(
  prevX: number, prevY: number,
  currX: number, currY: number,
): { x: number; y: number } {
  return {
    x: prevX + (currX - prevX) * currentAlpha,
    y: prevY + (currY - prevY) * currentAlpha,
  };
}
