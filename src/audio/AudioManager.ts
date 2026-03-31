/**
 * Web Audio API lifecycle manager with node pooling and proper cleanup.
 *
 * Replaces the old scattered AudioContext usage in audio.js and music.js
 * with a single managed context, lazy initialization, and hard limits
 * on active nodes to prevent memory leaks.
 *
 * @module audio/AudioManager
 */

import type { IAudioManager } from '../types/index';
import { random } from '../core/Random';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OscillatorResult {
  readonly osc: OscillatorNode;
  readonly gain: GainNode;
}

interface ScheduledOscillatorResult {
  readonly osc: OscillatorNode;
  readonly gain: GainNode;
}

interface NoiseResult {
  readonly source: AudioBufferSourceNode;
  readonly gain: GainNode;
}

interface PannedOscillatorResult {
  readonly osc: OscillatorNode;
  readonly gain: GainNode;
  readonly panner: StereoPannerNode | null;
}

interface OscillatorOptions {
  readonly ramp?: boolean;
  readonly freqEnvelope?: (osc: OscillatorNode, ctx: AudioContext) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_ACTIVE_NODES = 24;

// ---------------------------------------------------------------------------
// AudioManager
// ---------------------------------------------------------------------------

export class AudioManager implements IAudioManager {
  private _ctx: AudioContext | null;
  private _unlocked: boolean;
  private _activeNodes: number;
  private _cleanupListeners: Array<() => void>;

  constructor() {
    this._ctx = null;
    this._unlocked = false;
    this._activeNodes = 0;
    this._cleanupListeners = [];
  }

  /**
   * Resume AudioContext on first user gesture (required by iOS/Safari).
   * Registers listeners with `{ once: true }` so they auto-remove.
   */
  unlock(): void {
    if (this._unlocked) return;

    const handler = (): void => {
      if (this._unlocked) return;

      const ctx = this._ensureContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Play a silent buffer to fully unlock on iOS/Safari
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);

      this._unlocked = true;
    };

    const events: readonly string[] = ['touchstart', 'click', 'keydown'];
    for (const event of events) {
      window.addEventListener(event, handler, { once: true });
      this._cleanupListeners.push(() => {
        window.removeEventListener(event, handler);
      });
    }
  }

  /**
   * Returns the AudioContext, or null if not yet created.
   */
  getContext(): AudioContext | null {
    return this._ctx;
  }

  isUnlocked(): boolean {
    return this._unlocked;
  }

  /**
   * Create an oscillator node with gain envelope and automatic cleanup.
   * Returns null if the node limit is reached.
   */
  createOscillator(
    type: OscillatorType,
    freq: number,
    duration: number,
    volume: number,
    options: OscillatorOptions = {},
  ): OscillatorResult | null {
    if (this._activeNodes >= MAX_ACTIVE_NODES) return null;

    const ctx = this._ensureContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);

    const ramp = options.ramp !== undefined ? options.ramp : true;
    if (ramp) {
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    }

    if (options.freqEnvelope) {
      options.freqEnvelope(osc, ctx);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);

    this._activeNodes++;
    osc.onended = (): void => {
      osc.disconnect();
      gain.disconnect();
      this._activeNodes--;
    };

    return { osc, gain };
  }

  /**
   * Create a scheduled oscillator that starts at an offset from now.
   * Returns null if the node limit is reached.
   */
  createScheduledOscillator(
    type: OscillatorType,
    freq: number,
    duration: number,
    volume: number,
    startOffset: number,
  ): ScheduledOscillatorResult | null {
    if (this._activeNodes >= MAX_ACTIVE_NODES) return null;

    const ctx = this._ensureContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = ctx.currentTime + startOffset;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration);

    this._activeNodes++;
    osc.onended = (): void => {
      osc.disconnect();
      gain.disconnect();
      this._activeNodes--;
    };

    return { osc, gain };
  }

  /**
   * Create a noise burst via buffer source with automatic cleanup.
   * Returns null if the node limit is reached.
   */
  createNoise(duration: number, volume: number = 0.08): NoiseResult | null {
    if (this._activeNodes >= MAX_ACTIVE_NODES) return null;

    const ctx = this._ensureContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (random() * 2 - 1) * (1 - i / bufferSize);
    }

    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();

    this._activeNodes++;
    source.onended = (): void => {
      source.disconnect();
      gain.disconnect();
      this._activeNodes--;
    };

    return { source, gain };
  }

  /**
   * Create a note with optional stereo panning (used by MusicPlayer).
   * Returns null if the node limit is reached.
   */
  createPannedOscillator(
    freq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    pan?: number,
  ): PannedOscillatorResult | null {
    if (this._activeNodes >= MAX_ACTIVE_NODES) return null;

    const ctx = this._ensureContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

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

    this._activeNodes++;
    osc.onended = (): void => {
      osc.disconnect();
      gain.disconnect();
      if (pannerNode) pannerNode.disconnect();
      this._activeNodes--;
    };

    return { osc, gain, panner: pannerNode };
  }

  getActiveNodeCount(): number {
    return this._activeNodes;
  }

  /** Close the AudioContext and remove all gesture listeners. */
  dispose(): void {
    for (const remove of this._cleanupListeners) {
      remove();
    }
    this._cleanupListeners = [];

    if (this._ctx) {
      this._ctx.close();
      this._ctx = null;
    }

    this._unlocked = false;
    this._activeNodes = 0;
  }

  // -- Internals ---------------------------------------------------------------

  /**
   * Lazily create the AudioContext on first use.
   */
  private _ensureContext(): AudioContext {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return this._ctx;
  }
}
