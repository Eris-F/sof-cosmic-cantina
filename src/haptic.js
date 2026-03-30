export function vibrateHit() {
  if (navigator.vibrate) navigator.vibrate(50);
}

export function vibrateDeath() {
  if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
}

export function vibrateWaveClear() {
  if (navigator.vibrate) navigator.vibrate([30, 30, 30]);
}

export function vibratePowerup() {
  if (navigator.vibrate) navigator.vibrate(20);
}
