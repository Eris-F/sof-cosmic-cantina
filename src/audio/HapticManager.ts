/**
 * Event-driven vibration feedback manager.
 *
 * Subscribes to EventBus events and triggers navigator.vibrate()
 * patterns. Gracefully degrades on devices without vibration support.
 *
 * @module audio/HapticManager
 */

import {
  PLAYER_HIT,
  PLAYER_DEATH,
  WAVE_CLEARED,
  POWERUP_COLLECTED,
} from '../core/events';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EventBus {
  on(event: string, callback: (...args: unknown[]) => void, context?: unknown): () => void;
}

type VibratePattern = number | readonly number[];

// ---------------------------------------------------------------------------
// HapticManager
// ---------------------------------------------------------------------------

export class HapticManager {
  private readonly _bus: EventBus;
  private _unsubscribers: Array<() => void>;

  constructor(eventBus: EventBus) {
    this._bus = eventBus;
    this._unsubscribers = [];

    this._subscribe();
  }

  isSupported(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  }

  dispose(): void {
    for (const unsub of this._unsubscribers) {
      unsub();
    }
    this._unsubscribers = [];
  }

  // -- Event subscriptions ----------------------------------------------------

  private _subscribe(): void {
    this._on(PLAYER_HIT, () => this._vibrate(50));
    this._on(PLAYER_DEATH, () => this._vibrate([100, 50, 100]));
    this._on(WAVE_CLEARED, () => this._vibrate([30, 30, 30]));
    this._on(POWERUP_COLLECTED, () => this._vibrate(20));
  }

  /**
   * Helper to subscribe and track the unsubscriber.
   */
  private _on(event: string, callback: (...args: unknown[]) => void): void {
    const unsub = this._bus.on(event, callback, this);
    this._unsubscribers.push(unsub);
  }

  /**
   * Trigger vibration if supported.
   */
  private _vibrate(pattern: VibratePattern): void {
    if (this.isSupported()) {
      navigator.vibrate(pattern as number | number[]);
    }
  }
}
