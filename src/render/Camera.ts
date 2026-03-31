/**
 * Camera — abstracts position, shake, and zoom for all gameplay rendering.
 *
 * Applied once via ctx.translate/scale before drawing any gameplay entities.
 * Systems write shake/zoom to the camera state; renderers never apply
 * transforms directly.
 *
 * @module render/Camera
 */

export interface CameraState {
  /** Camera offset X (for panning, future boss intros). */
  x: number;
  /** Camera offset Y. */
  y: number;
  /** Shake offset X (set by EffectsSystem). */
  shakeX: number;
  /** Shake offset Y. */
  shakeY: number;
  /** Zoom factor (1 = normal, <1 = zoom out, >1 = zoom in). */
  zoom: number;
}

/** Create a default camera state. */
export function createCameraState(): CameraState {
  return { x: 0, y: 0, shakeX: 0, shakeY: 0, zoom: 1 };
}

/**
 * Apply camera transform to the canvas context.
 * Call once before rendering gameplay entities.
 * The context should be save()'d before and restore()'d after.
 */
export function applyCamera(ctx: CanvasRenderingContext2D, cam: CameraState): void {
  const cx = cam.x + cam.shakeX;
  const cy = cam.y + cam.shakeY;

  if (cam.zoom !== 1) {
    // Zoom around the center of the gameplay area (240, 320)
    ctx.translate(240, 320);
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-240, -320);
  }

  if (cx !== 0 || cy !== 0) {
    ctx.translate(cx, cy);
  }
}

/**
 * Update shake offsets from the effects state.
 * Called each frame before rendering.
 */
export function updateCameraShake(cam: CameraState, shakeIntensity: number, shakeTimer: number): void {
  if (shakeTimer > 0 && shakeIntensity > 0) {
    cam.shakeX = (Math.random() - 0.5) * 2 * shakeIntensity;
    cam.shakeY = (Math.random() - 0.5) * 2 * shakeIntensity;
  } else {
    cam.shakeX = 0;
    cam.shakeY = 0;
  }
}
