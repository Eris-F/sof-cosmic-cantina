/**
 * Viewport — computes the logical canvas size and gameplay area offset
 * so the 480x640 gameplay fits within any device without distortion.
 *
 * Strategy: keep width at 480, compute height to match device aspect ratio.
 * The 480x640 gameplay area is centered vertically. Extra space above/below
 * shows extended starfield. No black bars. No distortion.
 *
 * @module core/Viewport
 */

import { GAME_WIDTH, MIN_GAME_HEIGHT, setGameHeight } from './Layout';
import { updateCanvasHeight } from '../constants';

export interface ViewportInfo {
  /** Canvas logical width (always 480 in portrait). */
  readonly canvasWidth: number;
  /** Canvas logical height (>= 640, matches device aspect). */
  readonly canvasHeight: number;
  /** X offset to center gameplay horizontally (usually 0). */
  readonly originX: number;
  /** Y offset to center gameplay vertically (margin top). */
  readonly originY: number;
  /** Extra pixels above gameplay area. */
  readonly marginTop: number;
  /** Extra pixels below gameplay area. */
  readonly marginBottom: number;
  /** Extra pixels left of gameplay area (usually 0). */
  readonly marginLeft: number;
  /** Extra pixels right of gameplay area (usually 0). */
  readonly marginRight: number;
  /** Device pixel ratio (capped at 2). */
  readonly dpr: number;
}

/**
 * Compute viewport info from the current window dimensions.
 * Call on boot and on resize/orientation change.
 */
export function computeViewport(): ViewportInfo {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const viewportAspect = vw / vh;
  const gameAspect = GAME_WIDTH / MIN_GAME_HEIGHT;

  let canvasWidth: number;
  let canvasHeight: number;

  if (viewportAspect <= gameAspect) {
    // Viewport is taller or equal to 3:4 (most phones)
    // Width stays at 480, height EXTENDS to fill — no margins!
    canvasWidth = GAME_WIDTH;
    canvasHeight = Math.round(GAME_WIDTH / viewportAspect);
  } else {
    // Viewport is wider than 3:4 (tablet, desktop)
    // Height stays at minimum, width extends
    canvasHeight = MIN_GAME_HEIGHT;
    canvasWidth = Math.round(MIN_GAME_HEIGHT * viewportAspect);
  }

  // Update the dynamic game height — all systems use this
  setGameHeight(canvasHeight);
  updateCanvasHeight();

  // No origin offset — the game fills the entire canvas
  return {
    canvasWidth,
    canvasHeight,
    originX: 0,
    originY: 0,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: canvasWidth > GAME_WIDTH ? Math.round((canvasWidth - GAME_WIDTH) / 2) : 0,
    marginRight: canvasWidth > GAME_WIDTH ? Math.round((canvasWidth - GAME_WIDTH) / 2) : 0,
    dpr,
  };
}

/**
 * Apply viewport to a canvas element — sets size, style, and DPR scaling.
 * Returns the viewport info for use by renderers and touch translation.
 */
export function applyViewport(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): ViewportInfo {
  const vp = computeViewport();

  // Set canvas backing store size (DPR-scaled for retina)
  canvas.width = vp.canvasWidth * vp.dpr;
  canvas.height = vp.canvasHeight * vp.dpr;

  // Scale context so all drawing code uses logical coordinates
  ctx.setTransform(vp.dpr, 0, 0, vp.dpr, 0, 0);

  // CSS fills the full viewport
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  canvas.style.position = 'fixed';
  canvas.style.left = '0';
  canvas.style.top = '0';

  return vp;
}

/**
 * Convert a canvas-space coordinate (from getBoundingClientRect mapping)
 * to gameplay-space by subtracting the viewport origin.
 */
export function canvasToGameplay(
  canvasX: number,
  canvasY: number,
  vp: ViewportInfo,
): { x: number; y: number } {
  return {
    x: canvasX - vp.originX,
    y: canvasY - vp.originY,
  };
}
