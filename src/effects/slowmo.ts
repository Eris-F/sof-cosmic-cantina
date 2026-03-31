let slowTimer = 0;
let slowFactor = 1;

export function triggerSlowMo(duration: number = 0.4, factor: number = 0.25): void {
  slowTimer = duration;
  slowFactor = factor;
}

export function updateSlowMo(dt: number): void {
  if (slowTimer > 0) {
    slowTimer = Math.max(0, slowTimer - dt);
  }
}

export function getTimeScale(): number {
  if (slowTimer <= 0) return 1;
  // Ease back to normal speed
  const t = slowTimer;
  return slowFactor + (1 - slowFactor) * (1 - t / 0.4);
}

export function isSlowMoActive(): boolean {
  return slowTimer > 0;
}
