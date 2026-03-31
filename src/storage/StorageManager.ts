/**
 * Coordinates local (fast) and remote (authoritative) storage.
 *
 * Reads always hit localStorage first for instant UI updates.
 * Writes go to localStorage immediately, then queue a debounced push
 * to the server. On reconnection the full dirty state is synced.
 *
 * @module storage/StorageManager
 */

import { DIRTY_FLAG, GAME_DATA_KEYS } from '../config/storage-keys';
import { STATE_SYNCED } from '../core/events';
import { createLogger } from '../infra/logger';
import type { LocalStorageAdapter } from './LocalStorageAdapter';
import type { APIStorageAdapter } from './APIStorageAdapter';
import type { IEventBus, IStorageManager } from '../types/index';

const log = createLogger('StorageManager');

const DEBOUNCE_MS = 300;

export class StorageManager implements IStorageManager {
  private readonly _local: LocalStorageAdapter;
  private readonly _remote: APIStorageAdapter;
  private readonly _eventBus: IEventBus;
  private readonly _dirtyKeys: Set<string>;
  private _debounceTimer: ReturnType<typeof setTimeout> | null;
  private _syncing: boolean;
  private _onlineHandler: (() => void) | null;

  constructor(local: LocalStorageAdapter, remote: APIStorageAdapter, eventBus: IEventBus) {
    this._local = local;
    this._remote = remote;
    this._eventBus = eventBus;

    this._dirtyKeys = new Set();
    this._debounceTimer = null;
    this._syncing = false;
    this._onlineHandler = null;

    this._bindOnlineListener();
    this._hydrateFromDirtyFlag();
  }

  // ── Public API ─────────────────────────────────────────────────────────

  /**
   * Read a value. Returns from local cache immediately.
   */
  async load<T = unknown>(key: string): Promise<T | null> {
    return this._local.get<T>(key);
  }

  /**
   * Write a value. Persists to localStorage immediately, then
   * queues a debounced remote push.
   */
  async save<T = unknown>(key: string, value: T): Promise<void> {
    await this._local.set(key, value);
    this._markKeyDirty(key);
    this._schedulePush();
  }

  /**
   * Push all dirty data to the server and pull the authoritative state back.
   * Safe to call multiple times -- concurrent calls are coalesced.
   */
  async sync(): Promise<boolean> {
    if (this._syncing) {
      return false;
    }

    this._syncing = true;

    try {
      const localData = await this._local.getAll();
      const serverData = await this._remote.setAll(localData);

      if (serverData) {
        await this._local.setAll(serverData);
        this._clearDirty();
        this._eventBus.emit(STATE_SYNCED, serverData);
        return true;
      }

      log.warn('Sync returned null — server may be unreachable');
      return false;
    } catch (err: unknown) {
      log.error({ err }, 'Sync failed');
      return false;
    } finally {
      this._syncing = false;
    }
  }

  /**
   * Returns true if there are unsynced local changes.
   */
  isDirty(): boolean {
    return this._dirtyKeys.size > 0;
  }

  markDirty(): void {
    for (const key of GAME_DATA_KEYS) {
      this._dirtyKeys.add(key);
    }
    this._persistDirtyFlag(true);
  }

  clearDirty(): void {
    this._clearDirty();
  }

  /**
   * Clean up timers and event listeners.
   * Call when the manager is no longer needed (e.g. tests, hot-reload).
   */
  dispose(): void {
    if (this._debounceTimer !== null) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }
    if (this._onlineHandler) {
      globalThis.removeEventListener('online', this._onlineHandler);
      this._onlineHandler = null;
    }
  }

  // ── Internals ──────────────────────────────────────────────────────────

  private _bindOnlineListener(): void {
    this._onlineHandler = (): void => {
      if (this.isDirty()) {
        this.sync().catch((err: unknown) => {
          log.error({ err }, 'Auto-sync on reconnect failed');
        });
      }
    };
    globalThis.addEventListener('online', this._onlineHandler);
  }

  /**
   * On construction, if the persisted dirty flag is set, mark all keys dirty.
   * This handles the case where the tab was closed while offline.
   */
  private _hydrateFromDirtyFlag(): void {
    try {
      const raw = globalThis.localStorage?.getItem(DIRTY_FLAG);
      if (raw === '1') {
        this.markDirty();
      }
    } catch {
      // localStorage may be unavailable (SSR, privacy mode)
    }
  }

  private _markKeyDirty(key: string): void {
    this._dirtyKeys.add(key);
    this._persistDirtyFlag(true);
  }

  private _clearDirty(): void {
    this._dirtyKeys.clear();
    this._persistDirtyFlag(false);
  }

  private _persistDirtyFlag(dirty: boolean): void {
    try {
      if (dirty) {
        globalThis.localStorage?.setItem(DIRTY_FLAG, '1');
      } else {
        globalThis.localStorage?.removeItem(DIRTY_FLAG);
      }
    } catch {
      // best-effort
    }
  }

  /**
   * Schedule a debounced push. Resets timer on each call so rapid
   * saves are batched into a single sync.
   */
  private _schedulePush(): void {
    if (this._debounceTimer !== null) {
      clearTimeout(this._debounceTimer);
    }

    this._debounceTimer = setTimeout(() => {
      this._debounceTimer = null;
      this.sync().catch((err: unknown) => {
        log.error({ err }, 'Debounced sync failed');
      });
    }, DEBOUNCE_MS);
  }
}
