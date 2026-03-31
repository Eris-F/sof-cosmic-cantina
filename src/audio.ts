type OscillatorShape = 'sine' | 'square' | 'sawtooth' | 'triangle';

interface WebkitWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

let audioCtx: AudioContext | null = null;
let unlocked = false;

function getCtx(): AudioContext {
  if (!audioCtx) {
    const Win = window as WebkitWindow;
    const CtxClass = window.AudioContext || Win.webkitAudioContext;
    audioCtx = new CtxClass!();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function initAudio(): void {
  const unlock = (): void => {
    if (unlocked) return;
    // Create context on first interaction if it doesn't exist
    const ctx = getCtx();
    // Play a silent buffer to fully unlock on iOS/Safari
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
    unlocked = true;
  };
  window.addEventListener('touchstart', unlock, { once: false });
  window.addEventListener('click', unlock, { once: false });
  window.addEventListener('keydown', unlock, { once: false });
}

let activeNodes = 0;
const MAX_ACTIVE_NODES = 20;

function playTone(freq: number, duration: number, type: OscillatorShape = 'square', volume: number = 0.15, ramp: boolean = true): void {
  if (activeNodes >= MAX_ACTIVE_NODES) return;

  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);

  if (ramp) {
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  }

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);

  activeNodes++;
  osc.onended = (): void => {
    gain.disconnect();
    activeNodes--;
  };
}

function playNoise(duration: number, volume: number = 0.08): void {
  if (activeNodes >= MAX_ACTIVE_NODES) return;
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.buffer = buffer;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();

  activeNodes++;
  source.onended = (): void => {
    gain.disconnect();
    activeNodes--;
  };
}

// --- Sound effects ---

export function sfxShoot(): void {
  playTone(880, 0.06, 'square', 0.08);
  playTone(660, 0.04, 'square', 0.05);
}

export function sfxEnemyDeath(): void {
  playTone(200, 0.15, 'square', 0.12);
  playNoise(0.1, 0.06);
}

export function sfxPlayerHit(): void {
  playTone(150, 0.3, 'sawtooth', 0.15);
  playNoise(0.2, 0.1);
}

export function sfxUfoAppear(): void {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.3);
  osc.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.6);
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.6);
  osc.onended = (): void => { osc.disconnect(); gain.disconnect(); };
}

export function sfxUfoHit(): void {
  playTone(600, 0.08, 'square', 0.1);
  playTone(800, 0.08, 'square', 0.08);
  playTone(1000, 0.1, 'square', 0.06);
  playNoise(0.15, 0.08);
}

export function sfxWaveClear(): void {
  const ctx = getCtx();
  const notes: readonly number[] = [523, 659, 784, 1047]; // C5, E5, G5, C6
  notes.forEach((freq: number, i: number): void => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
    gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.1);
    osc.stop(ctx.currentTime + i * 0.1 + 0.2);
    osc.onended = (): void => { osc.disconnect(); gain.disconnect(); };
  });
}

export function sfxGameOver(): void {
  const ctx = getCtx();
  const notes: readonly number[] = [392, 330, 262, 196]; // G4, E4, C4, G3 descending
  notes.forEach((freq: number, i: number): void => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.2);
    gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.2 + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.2);
    osc.stop(ctx.currentTime + i * 0.2 + 0.3);
    osc.onended = (): void => { osc.disconnect(); gain.disconnect(); };
  });
}

export function sfxPowerUp(): void {
  const ctx = getCtx();
  const notes: readonly number[] = [440, 554, 659, 880]; // A4, C#5, E5, A5
  notes.forEach((freq: number, i: number): void => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.06);
    gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.06 + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.06);
    osc.stop(ctx.currentTime + i * 0.06 + 0.15);
    osc.onended = (): void => { osc.disconnect(); gain.disconnect(); };
  });
}

export function sfxMenuSelect(): void {
  playTone(660, 0.08, 'square', 0.08);
}
