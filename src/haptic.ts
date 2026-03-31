export function vibrateHit(): void {
  if (navigator.vibrate) navigator.vibrate(50);
}

export function vibrateDeath(): void {
  if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
}

export function vibrateWaveClear(): void {
  if (navigator.vibrate) navigator.vibrate([30, 30, 30]);
}

export function vibratePowerup(): void {
  if (navigator.vibrate) navigator.vibrate(20);
}
