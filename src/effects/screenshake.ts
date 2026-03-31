let shakeTimer = 0;
let shakeIntensity = 0;

export function triggerShake(intensity: number = 4, duration: number = 0.2): void {
  shakeIntensity = intensity;
  shakeTimer = duration;
}

export function updateShake(dt: number): void {
  if (shakeTimer > 0) {
    shakeTimer = Math.max(0, shakeTimer - dt);
  }
}

export function applyShake(ctx: CanvasRenderingContext2D): void {
  if (shakeTimer <= 0) return;
  const ox = (Math.random() - 0.5) * 2 * shakeIntensity;
  const oy = (Math.random() - 0.5) * 2 * shakeIntensity;
  ctx.translate(Math.floor(ox), Math.floor(oy));
}

export function isShaking(): boolean {
  return shakeTimer > 0;
}
