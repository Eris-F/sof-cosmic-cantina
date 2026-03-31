/**
 * Pub/sub event bus with wildcard support, error isolation, and async emit.
 *
 * @module core/EventBus
 */

import type { IEventBus, EventBusOptions, EventCallback, Listener, Unsubscribe } from '../types/index';

const WILDCARD = '*';

export class EventBus implements IEventBus {
  private _listeners: Map<string, Listener[]>;
  private _debug: boolean;

  constructor(options: Pick<EventBusOptions, 'debug'> = {}) {
    this._listeners = new Map();
    this._debug = options.debug ?? false;
  }

  // ── Public API ──────────────────────────────────────────────────────────

  /**
   * Subscribe to an event. Returns an unsubscribe function.
   */
  on(event: string, callback: EventCallback, context?: unknown): Unsubscribe {
    this._validateArgs(event, callback);
    const listener: Listener = { callback, context, once: false };
    this._addListener(event, listener);
    return () => this._removeListener(event, listener);
  }

  /**
   * Subscribe for a single emission, then auto-unsubscribe.
   */
  once(event: string, callback: EventCallback, context?: unknown): Unsubscribe {
    this._validateArgs(event, callback);
    const listener: Listener = { callback, context, once: true };
    this._addListener(event, listener);
    return () => this._removeListener(event, listener);
  }

  /**
   * Unsubscribe. If callback is omitted, removes ALL listeners for the event.
   */
  off(event: string, callback?: EventCallback): void {
    if (typeof event !== 'string') {
      throw new TypeError('EventBus.off: event must be a string');
    }

    if (callback === undefined) {
      this._listeners.delete(event);
      return;
    }

    const list = this._listeners.get(event);
    if (!list) return;

    const filtered = list.filter((l) => l.callback !== callback);
    if (filtered.length === 0) {
      this._listeners.delete(event);
    } else {
      this._listeners.set(event, filtered);
    }
  }

  /**
   * Fire an event synchronously. Errors in handlers are caught and logged
   * so one bad handler never kills the rest.
   */
  emit(event: string, data?: unknown): void {
    if (typeof event !== 'string') {
      throw new TypeError('EventBus.emit: event must be a string');
    }

    if (this._debug) {
      this._log(event, data);
    }

    this._invokeListeners(event, data);

    if (event !== WILDCARD) {
      this._invokeListeners(WILDCARD, data, event);
    }
  }

  /**
   * Fire an event and await all handlers (including async ones).
   */
  async emitAsync(event: string, data?: unknown): Promise<void> {
    if (typeof event !== 'string') {
      throw new TypeError('EventBus.emitAsync: event must be a string');
    }

    if (this._debug) {
      this._log(event, data);
    }

    const promises: Promise<unknown>[] = [
      ...this._collectInvocations(event, data),
    ];

    if (event !== WILDCARD) {
      promises.push(...this._collectInvocations(WILDCARD, data, event));
    }

    const results = await Promise.allSettled(promises);
    for (const result of results) {
      if (result.status === 'rejected') {
        this._handleError(event, result.reason);
      }
    }
  }

  /** Remove every listener on every event. */
  clear(): void {
    this._listeners = new Map();
  }

  /**
   * Debug helper — returns listener count.
   * If event is omitted, returns total across all events.
   */
  getListenerCount(event?: string): number {
    if (event !== undefined) {
      return this._listeners.get(event)?.length ?? 0;
    }
    let total = 0;
    for (const list of this._listeners.values()) {
      total += list.length;
    }
    return total;
  }

  /**
   * Enable or disable debug logging at runtime.
   */
  setDebug(enabled: boolean): void {
    this._debug = enabled;
  }

  // ── Internals ───────────────────────────────────────────────────────────

  private _validateArgs(event: string, callback: EventCallback): void {
    if (typeof event !== 'string') {
      throw new TypeError('EventBus: event must be a string');
    }
    if (typeof callback !== 'function') {
      throw new TypeError('EventBus: callback must be a function');
    }
  }

  private _addListener(event: string, listener: Listener): void {
    const list = this._listeners.get(event);
    if (list) {
      this._listeners.set(event, [...list, listener]);
    } else {
      this._listeners.set(event, [listener]);
    }
  }

  private _removeListener(event: string, listener: Listener): void {
    const list = this._listeners.get(event);
    if (!list) return;
    const filtered = list.filter((l) => l !== listener);
    if (filtered.length === 0) {
      this._listeners.delete(event);
    } else {
      this._listeners.set(event, filtered);
    }
  }

  /**
   * Invoke listeners synchronously with error isolation.
   * @param key        — the Map key to look up
   * @param data
   * @param eventName  — original event name (for wildcard listeners)
   */
  private _invokeListeners(key: string, data: unknown, eventName?: string): void {
    const list = this._listeners.get(key);
    if (!list || list.length === 0) return;

    const toRemove: Listener[] = [];

    for (const listener of list) {
      try {
        if (eventName !== undefined) {
          listener.callback.call(listener.context, eventName, data);
        } else {
          listener.callback.call(listener.context, data);
        }
      } catch (err: unknown) {
        this._handleError(eventName ?? key, err);
      }
      if (listener.once) {
        toRemove.push(listener);
      }
    }

    if (toRemove.length > 0) {
      const filtered = list.filter((l) => !toRemove.includes(l));
      if (filtered.length === 0) {
        this._listeners.delete(key);
      } else {
        this._listeners.set(key, filtered);
      }
    }
  }

  /**
   * Collect promises from handler invocations (for emitAsync).
   */
  private _collectInvocations(key: string, data: unknown, eventName?: string): Promise<unknown>[] {
    const list = this._listeners.get(key);
    if (!list || list.length === 0) return [];

    const toRemove: Listener[] = [];
    const promises: Promise<unknown>[] = [];

    for (const listener of list) {
      try {
        const result: unknown = eventName !== undefined
          ? listener.callback.call(listener.context, eventName, data)
          : listener.callback.call(listener.context, data);
        promises.push(Promise.resolve(result));
      } catch (err: unknown) {
        promises.push(Promise.reject(err));
      }
      if (listener.once) {
        toRemove.push(listener);
      }
    }

    if (toRemove.length > 0) {
      const filtered = list.filter((l) => !toRemove.includes(l));
      if (filtered.length === 0) {
        this._listeners.delete(key);
      } else {
        this._listeners.set(key, filtered);
      }
    }

    return promises;
  }

  private _handleError(event: string, err: unknown): void {
    // eslint-disable-next-line no-console -- intentional: surface handler bugs
    console.error(`[EventBus] Error in handler for "${event}":`, err);
  }

  private _log(event: string, data: unknown): void {
    // eslint-disable-next-line no-console -- debug mode only
    console.debug(`[EventBus] ${event}`, data);
  }
}

// ── Singleton factory ─────────────────────────────────────────────────────────

let _instance: EventBus | null = null;

/**
 * Returns the shared EventBus singleton.
 * Calling `createEventBus` again returns the same instance unless you
 * pass `{ fresh: true }` (useful in tests).
 */
export function createEventBus(options: EventBusOptions = {}): EventBus {
  if (options.fresh || _instance === null) {
    _instance = new EventBus({ debug: options.debug });
  }
  return _instance;
}
