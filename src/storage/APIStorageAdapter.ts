/**
 * StorageProvider backed by the FastAPI server.
 *
 * Maps get/set/getAll to the existing api.js functions.
 * All methods return null (rather than throwing) when the server is
 * unreachable, so the StorageManager can fall back to local data.
 *
 * @module storage/APIStorageAdapter
 */

import { StorageProvider } from './StorageProvider';
import {
  WALLET,
  OWNED_ITEMS,
  EQUIPPED,
  SKILL_LEVELS,
  HIGH_SCORES,
  ACHIEVEMENTS,
  GAME_DATA_KEYS,
} from '../config/storage-keys';
import {
  fetchPlayerState,
  syncState,
} from '../api';
import type { FullPlayerState } from '../schemas/api.schema';
import { createLogger } from '../infra/logger';

const log = createLogger('APIStorageAdapter');

/**
 * Map a full storage key to the field name used in the server's player-state
 * response (returned by GET /players/me and POST /sync).
 */
const KEY_TO_SERVER_FIELD: Readonly<Record<string, string>> = {
  [WALLET]: 'wallet',
  [OWNED_ITEMS]: 'owned',
  [EQUIPPED]: 'equipped',
  [SKILL_LEVELS]: 'skills',
  [HIGH_SCORES]: 'highScores',
  [ACHIEVEMENTS]: 'achievements',
};

export class APIStorageAdapter extends StorageProvider {
  async get<T = unknown>(key: string): Promise<T | null> {
    const field = KEY_TO_SERVER_FIELD[key];
    if (!field) {
      return null;
    }

    try {
      const state = await fetchPlayerState() as Record<string, unknown> | null;
      if (!state) return null;
      return (state[field] as T) ?? null;
    } catch (err: unknown) {
      log.warn({ err, key }, 'Remote get failed');
      return null;
    }
  }

  /**
   * Individual key writes are intentionally no-ops.
   * Writes go through StorageManager.sync() which calls syncState() to push
   * the full local snapshot in one request, avoiding race conditions.
   */
  async set<T = unknown>(_key: string, _value: T): Promise<void> {
    // Writes are batched through sync() -- see StorageManager
  }

  async remove(_key: string): Promise<void> {
    // No single-key delete on the server; handled via full sync
  }

  async clear(): Promise<void> {
    // Server-side clear is not exposed; noop
  }

  async getAll(): Promise<Record<string, unknown>> {
    try {
      const state = await fetchPlayerState() as Record<string, unknown> | null;
      if (!state) return {};

      const result: Record<string, unknown> = {};
      for (const key of GAME_DATA_KEYS) {
        const field = KEY_TO_SERVER_FIELD[key];
        if (field && state[field] !== undefined) {
          result[key] = state[field];
        }
      }
      return result;
    } catch (err: unknown) {
      log.warn({ err }, 'Remote getAll failed');
      return {};
    }
  }

  /**
   * Push a full local snapshot to the server via POST /sync.
   */
  async setAll(data: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    try {
      const payload: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        const field = KEY_TO_SERVER_FIELD[key];
        if (field) {
          payload[field] = value;
        }
      }

      const result = await syncState(payload as FullPlayerState) as Record<string, unknown> | null;
      if (!result) return null;

      const mapped: Record<string, unknown> = {};
      for (const key of GAME_DATA_KEYS) {
        const field = KEY_TO_SERVER_FIELD[key];
        if (field && result[field] !== undefined) {
          mapped[key] = result[field];
        }
      }
      return mapped;
    } catch (err: unknown) {
      log.warn({ err }, 'Remote setAll (sync) failed');
      return null;
    }
  }
}
