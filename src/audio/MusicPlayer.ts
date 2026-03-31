/**
 * Procedural chiptune background music with step sequencer.
 *
 * Copied from the old music.js but uses AudioManager for proper node
 * lifecycle (every node is tracked, cleaned up on end, and respects
 * the global active-node limit).
 *
 * @module audio/MusicPlayer
 */

import type { AudioManager } from './AudioManager';

// ---------------------------------------------------------------------------
// Scale notes
// ---------------------------------------------------------------------------

// Pentatonic scale notes for a spacey feel
const BASS_NOTES: readonly number[] = [65.4, 73.4, 82.4, 98.0, 110.0]; // C2-A2
const MELODY_NOTES: readonly number[] = [261.6, 293.7, 329.6, 392.0, 440.0, 523.3, 587.3, 659.3]; // C4-E5
const ARP_NOTES: readonly number[] = [130.8, 146.8, 164.8, 196.0, 220.0]; // C3-A3

// ---------------------------------------------------------------------------
// MusicPlayer
// ---------------------------------------------------------------------------

export class MusicPlayer {
  private readonly _audio: AudioManager;
  private _playing: boolean;
  private _currentStep: number;
  private _stepTimer: number;
  private _bpm: number;
  private _intensity: number; // 0-1, scales with wave

  constructor(audioManager: AudioManager) {
    this._audio = audioManager;
    this._playing = false;
    this._currentStep = 0;
    this._stepTimer = 0;
    this._bpm = 140;
    this._intensity = 0;
  }

  /** Start the step sequencer from the beginning. */
  start(): void {
    if (this._playing) return;
    this._playing = true;
    this._currentStep = 0;
    this._stepTimer = 0;
  }

  /** Stop the sequencer. Currently-playing notes finish naturally. */
  stop(): void {
    this._playing = false;
  }

  isPlaying(): boolean {
    return this._playing;
  }

  /**
   * Adjust tempo and complexity based on wave number.
   * Matches old music.js: intensity ramps 0..1 over waves 1..16,
   * BPM ramps 140..170.
   */
  setIntensity(wave: number): void {
    this._intensity = Math.min(1, (wave - 1) / 15);
    this._bpm = 140 + Math.floor(this._intensity * 30);
  }

  /**
   * Advance the step sequencer. Call once per frame.
   */
  update(dt: number): void {
    if (!this._playing) return;

    const stepDuration = 60 / this._bpm / 2; // 8th notes
    this._stepTimer += dt;

    if (this._stepTimer >= stepDuration) {
      this._stepTimer -= stepDuration;

      this._stepBass(this._currentStep);
      this._stepArp(this._currentStep);
      this._stepMelody(this._currentStep);
      this._stepHihat(this._currentStep);

      this._currentStep++;
    }
  }

  /** Stop sequencer and release references. */
  dispose(): void {
    this.stop();
  }

  // -- Step patterns ----------------------------------------------------------
  // Exact replicas of the old music.js step functions.

  private _stepBass(step: number): void {
    const noteIdx = step % BASS_NOTES.length;
    const freq = BASS_NOTES[noteIdx]!;
    const vol = 0.06 + this._intensity * 0.03;
    this._audio.createPannedOscillator(freq, 0.3, 'triangle', vol, 0);
  }

  private _stepArp(step: number): void {
    if (this._intensity < 0.3) return;
    const noteIdx = (step * 3) % ARP_NOTES.length;
    const freq = ARP_NOTES[noteIdx]!;
    const vol = 0.03 + this._intensity * 0.02;
    const pan = (step % 2 === 0) ? -0.5 : 0.5;
    this._audio.createPannedOscillator(freq, 0.1, 'square', vol, pan);
  }

  private _stepMelody(step: number): void {
    if (this._intensity < 0.5) return;
    // Only play melody on certain beats
    if (step % 4 !== 0 && step % 4 !== 3) return;
    const noteIdx = (step + Math.floor(step / 8)) % MELODY_NOTES.length;
    const freq = MELODY_NOTES[noteIdx]!;
    const vol = 0.025 + this._intensity * 0.02;
    this._audio.createPannedOscillator(freq, 0.15, 'sine', vol, 0);
  }

  private _stepHihat(step: number): void {
    if (this._intensity < 0.2) return;
    const baseVol = step % 2 === 0 ? 0.04 : 0.02;
    const vol = baseVol * (0.5 + this._intensity * 0.5);
    this._audio.createNoise(0.03, vol);
  }
}
