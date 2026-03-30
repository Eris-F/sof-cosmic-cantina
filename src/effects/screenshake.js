let shakeTimer = 0;
let shakeIntensity = 0;

export function triggerShake(intensity = 4, duration = 0.2) {
  shakeIntensity = intensity;
  shakeTimer = duration;
}

export function updateShake(dt) {
  if (shakeTimer > 0) {
    shakeTimer = Math.max(0, shakeTimer - dt);
  }
}

export function applyShake(ctx) {
  if (shakeTimer <= 0) return;
  const ox = (Math.random() - 0.5) * 2 * shakeIntensity;
  const oy = (Math.random() - 0.5) * 2 * shakeIntensity;
  ctx.translate(Math.floor(ox), Math.floor(oy));
}

export function isShaking() {
  return shakeTimer > 0;
}
