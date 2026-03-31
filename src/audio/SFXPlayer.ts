/**
 * Event-driven sound effects player.
 *
 * Subscribes to EventBus events and plays the appropriate SFX using
 * AudioManager for proper node lifecycle. Sound designs are copied
 * exactly from the old audio.js (frequencies, durations, wave types,
 * gain envelopes).
 *
 * @module audio/SFXPlayer
 */

import {
  PLAYER_FIRE,
  ENEMY_KILLED,
  PLAYER_HIT,
  UFO_SPAWNED,
  UFO_HIT,
  WAVE_CLEARED,
  GAME_OVER,
  POWERUP_COLLECTED,
  SCENE_ENTER,
  ITEM_BOUGHT,
  TEQUILA_BOMB_TRIGGERED,
} from '../core/events';

import type { AudioManager } from './AudioManager';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EventBus {
  on(event: string, callback: (...args: unknown[]) => void, context?: unknown): () => void;
}

interface SceneEnterData {
  readonly scene?: string;
}

// ---------------------------------------------------------------------------
// SFXPlayer
// ---------------------------------------------------------------------------

export class SFXPlayer {
  private readonly _audio: AudioManager;
  private readonly _bus: EventBus;
  private _unsubscribers: Array<() => void>;

  constructor(audioManager: AudioManager, eventBus: EventBus) {
    this._audio = audioManager;
    this._bus = eventBus;
    this._unsubscribers = [];

    this._subscribe();
  }

  dispose(): void {
    for (const unsub of this._unsubscribers) {
      unsub();
    }
    this._unsubscribers = [];
  }

  // -- Event subscriptions ----------------------------------------------------

  private _subscribe(): void {
    this._on(PLAYER_FIRE, () => this._sfxShoot());
    this._on(ENEMY_KILLED, () => this._sfxEnemyDeath());
    this._on(PLAYER_HIT, () => this._sfxPlayerHit());
    this._on(UFO_SPAWNED, () => this._sfxUfoAppear());
    this._on(UFO_HIT, () => this._sfxUfoHit());
    this._on(WAVE_CLEARED, () => this._sfxWaveClear());
    this._on(GAME_OVER, () => this._sfxGameOver());
    this._on(POWERUP_COLLECTED, () => this._sfxPowerUp());
    this._on(SCENE_ENTER, (...args: unknown[]) => {
      const data = args[0] as SceneEnterData | undefined;
      if (data && data.scene === 'menu') {
        this._sfxMenuSelect();
      }
    });
    this._on(ITEM_BOUGHT, () => this._sfxMenuSelect());
    this._on(TEQUILA_BOMB_TRIGGERED, () => this._sfxWaveClear());
  }

  /**
   * Helper to subscribe and track the unsubscriber.
   */
  private _on(event: string, callback: (...args: unknown[]) => void): void {
    const unsub = this._bus.on(event, callback, this);
    this._unsubscribers.push(unsub);
  }

  // -- Sound effects ----------------------------------------------------------
  // Exact replicas of the old audio.js sound designs.

  /** Short noise burst -- player shoots. */
  private _sfxShoot(): void {
    // playTone(880, 0.06, 'square', 0.08)
    this._audio.createOscillator('square', 880, 0.06, 0.08);
    // playTone(660, 0.04, 'square', 0.05)
    this._audio.createOscillator('square', 660, 0.04, 0.05);
  }

  /** Descending tone + noise -- enemy destroyed. */
  private _sfxEnemyDeath(): void {
    // playTone(200, 0.15, 'square', 0.12)
    this._audio.createOscillator('square', 200, 0.15, 0.12);
    // playNoise(0.1, 0.06)
    this._audio.createNoise(0.1, 0.06);
  }

  /** Low thud + noise -- player takes damage. */
  private _sfxPlayerHit(): void {
    // playTone(150, 0.3, 'sawtooth', 0.15)
    this._audio.createOscillator('sawtooth', 150, 0.3, 0.15);
    // playNoise(0.2, 0.1)
    this._audio.createNoise(0.2, 0.1);
  }

  /** Rising warble -- UFO appears. */
  private _sfxUfoAppear(): void {
    // Custom frequency envelope: 300 -> 600 -> 300 over 0.6s
    this._audio.createOscillator('sine', 300, 0.6, 0.08, {
      freqEnvelope: (osc: OscillatorNode, ctx: AudioContext): void => {
        osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.3);
        osc.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.6);
      },
    });
  }

  /** Explosion -- UFO destroyed. */
  private _sfxUfoHit(): void {
    // playTone(600, 0.08, 'square', 0.1)
    this._audio.createOscillator('square', 600, 0.08, 0.1);
    // playTone(800, 0.08, 'square', 0.08)
    this._audio.createOscillator('square', 800, 0.08, 0.08);
    // playTone(1000, 0.1, 'square', 0.06)
    this._audio.createOscillator('square', 1000, 0.1, 0.06);
    // playNoise(0.15, 0.08)
    this._audio.createNoise(0.15, 0.08);
  }

  /** Ascending chord -- wave complete. C5 E5 G5 C6. */
  private _sfxWaveClear(): void {
    const notes: readonly number[] = [523, 659, 784, 1047];
    for (let i = 0; i < notes.length; i++) {
      this._audio.createScheduledOscillator(
        'square', notes[i]!, 0.2, 0.1, i * 0.1
      );
    }
  }

  /** Descending chord -- game over. G4 E4 C4 G3. */
  private _sfxGameOver(): void {
    const notes: readonly number[] = [392, 330, 262, 196];
    for (let i = 0; i < notes.length; i++) {
      this._audio.createScheduledOscillator(
        'sawtooth', notes[i]!, 0.3, 0.12, i * 0.2
      );
    }
  }

  /** Bright ascending arpeggio -- powerup collected. A4 C#5 E5 A5. */
  private _sfxPowerUp(): void {
    const notes: readonly number[] = [440, 554, 659, 880];
    for (let i = 0; i < notes.length; i++) {
      this._audio.createScheduledOscillator(
        'sine', notes[i]!, 0.15, 0.1, i * 0.06
      );
    }
  }

  /** Click -- menu selection. */
  private _sfxMenuSelect(): void {
    // playTone(660, 0.08, 'square', 0.08)
    this._audio.createOscillator('square', 660, 0.08, 0.08);
  }
}
