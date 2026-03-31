type OscillatorShape = 'sine' | 'square' | 'sawtooth' | 'triangle';

interface WebkitWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

let musicCtx: AudioContext | null = null;
let playing = false;
let currentStep = 0;
let stepTimer = 0;
let bpm = 140;
let intensity = 0; // 0-1, scales with wave

// Pentatonic scale notes for a spacey feel
const BASS_NOTES: readonly number[] = [65.4, 73.4, 82.4, 98.0, 110.0]; // C2-A2
const MELODY_NOTES: readonly number[] = [261.6, 293.7, 329.6, 392.0, 440.0, 523.3, 587.3, 659.3]; // C4-E5
const ARP_NOTES: readonly number[] = [130.8, 146.8, 164.8, 196.0, 220.0]; // C3-A3

function getCtx(): AudioContext {
  if (!musicCtx) {
    const Win = window as WebkitWindow;
    const CtxClass = window.AudioContext || Win.webkitAudioContext;
    musicCtx = new CtxClass!();
  }
  if (musicCtx.state === 'suspended') {
    musicCtx.resume();
  }
  return musicCtx;
}

function playNote(freq: number, duration: number, type: OscillatorShape, volume: number, pan?: number): void {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  let pannerNode: StereoPannerNode | null = null;

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  if (pan !== undefined && ctx.createStereoPanner) {
    pannerNode = ctx.createStereoPanner();
    pannerNode.pan.value = pan;
    osc.connect(gain);
    gain.connect(pannerNode);
    pannerNode.connect(ctx.destination);
  } else {
    osc.connect(gain);
    gain.connect(ctx.destination);
  }

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
  osc.onended = (): void => {
    osc.disconnect();
    gain.disconnect();
    if (pannerNode) pannerNode.disconnect();
  };
}

function stepBass(step: number): void {
  const noteIdx = step % BASS_NOTES.length;
  const freq = BASS_NOTES[noteIdx]!;
  playNote(freq, 0.3, 'triangle', 0.06 + intensity * 0.03, 0);
}

function stepArp(step: number): void {
  if (intensity < 0.3) return;
  const noteIdx = (step * 3) % ARP_NOTES.length;
  const freq = ARP_NOTES[noteIdx]!;
  const vol = 0.03 + intensity * 0.02;
  playNote(freq, 0.1, 'square', vol, (step % 2 === 0) ? -0.5 : 0.5);
}

function stepMelody(step: number): void {
  if (intensity < 0.5) return;
  // Only play melody on certain beats
  if (step % 4 !== 0 && step % 4 !== 3) return;
  const noteIdx = (step + Math.floor(step / 8)) % MELODY_NOTES.length;
  const freq = MELODY_NOTES[noteIdx]!;
  const vol = 0.025 + intensity * 0.02;
  playNote(freq, 0.15, 'sine', vol, 0);
}

function stepHihat(step: number): void {
  if (intensity < 0.2) return;
  const ctx = getCtx();
  const bufSize = ctx.sampleRate * 0.03;
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
  }
  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  src.buffer = buf;
  const vol = step % 2 === 0 ? 0.04 : 0.02;
  gain.gain.setValueAtTime(vol * (0.5 + intensity * 0.5), ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
  src.connect(gain);
  gain.connect(ctx.destination);
  src.start();
  src.onended = (): void => {
    src.disconnect();
    gain.disconnect();
  };
}

export function updateMusic(dt: number): void {
  if (!playing) return;

  const stepDuration = 60 / bpm / 2; // 8th notes
  stepTimer += dt;

  if (stepTimer >= stepDuration) {
    stepTimer -= stepDuration;

    stepBass(currentStep);
    stepArp(currentStep);
    stepMelody(currentStep);
    stepHihat(currentStep);

    currentStep++;
  }
}

export function setMusicIntensity(wave: number): void {
  // Ramp up intensity with wave number
  intensity = Math.min(1, (wave - 1) / 15);
  bpm = 140 + Math.floor(intensity * 30); // 140-170 BPM
}

export function startMusic(): void {
  if (playing) return;
  getCtx(); // ensure context exists
  playing = true;
  currentStep = 0;
  stepTimer = 0;
}

export function stopMusic(): void {
  playing = false;
}

export function isMusicPlaying(): boolean {
  return playing;
}
