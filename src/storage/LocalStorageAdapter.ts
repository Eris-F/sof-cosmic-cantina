/**
 * StorageProvider backed by localStorage.
 *
 * - JSON parse/stringify with defensive try/catch
 * - Zod validation on reads with fallback to defaults
 * - Schema version checking via migrations
 *
 * @module storage/LocalStorageAdapter
 */

import { StorageProvider } from './StorageProvider';
import { GAME_DATA_KEYS, SCHEMA_VERSION } from '../config/storage-keys';
import { getSchemaForKey } from '../schemas/storage';
import { migrate, CURRENT_VERSION } from './migrations';
import { createLogger } from '../infra/logger';

const log = createLogger('LocalStorageAdapter');

export class LocalStorageAdapter extends StorageProvider {
  private readonly _storage: Storage;

  constructor(storage?: Storage) {
    super();
    this._storage = storage ?? globalThis.localStorage;
    this._ensureSchemaVersion();
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const raw = this._storage.getItem(key);
    if (raw === null) {
      return this._defaultFor<T>(key);
    }

    const parsed = this._safeParse(raw, key);
    if (parsed === null) {
      return this._defaultFor<T>(key);
    }

    return this._validate<T>(key, parsed);
  }

  async set<T = unknown>(key: string, value: T): Promise<void> {
    try {
      this._storage.setItem(key, JSON.stringify(value));
    } catch (err: unknown) {
      log.error({ err, key }, 'Failed to write localStorage');
    }
  }

  async remove(key: string): Promise<void> {
    this._storage.removeItem(key);
  }

  async clear(): Promise<void> {
    for (const key of GAME_DATA_KEYS) {
      this._storage.removeItem(key);
    }
  }

  async getAll(): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {};
    for (const key of GAME_DATA_KEYS) {
      result[key] = await this.get(key);
    }
    return result;
  }

  async setAll(data: Record<string, unknown>): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      if ((GAME_DATA_KEYS as readonly string[]).includes(key)) {
        await this.set(key, value);
      }
    }
  }

  // ── Internals ──────────────────────────────────────────────────────────

  /**
   * On first access, run migrations if the stored schema version
   * is behind CURRENT_VERSION.
   */
  private _ensureSchemaVersion(): void {
    const raw = this._storage.getItem(SCHEMA_VERSION);
    const stored = raw !== null ? Number(raw) : 0;

    if (stored < CURRENT_VERSION) {
      this._runMigrations(stored);
      this._storage.setItem(SCHEMA_VERSION, String(CURRENT_VERSION));
    }
  }

  /**
   * Load all game data, run migrations, write back.
   */
  private _runMigrations(fromVersion: number): void {
    const snapshot: Record<string, unknown> = {};
    for (const key of GAME_DATA_KEYS) {
      const raw = this._storage.getItem(key);
      if (raw !== null) {
        snapshot[key] = this._safeParse(raw, key);
      }
    }

    const migrated = migrate(snapshot, fromVersion);

    for (const [key, value] of Object.entries(migrated)) {
      if ((GAME_DATA_KEYS as readonly string[]).includes(key)) {
        try {
          this._storage.setItem(key, JSON.stringify(value));
        } catch (err: unknown) {
          log.error({ err, key }, 'Migration write failed');
        }
      }
    }
  }

  private _safeParse(raw: string, key: string): unknown | null {
    try {
      return JSON.parse(raw) as unknown;
    } catch (err: unknown) {
      log.warn({ err, key }, 'Corrupt JSON in localStorage — returning default');
      return null;
    }
  }

  /**
   * Validate parsed data against its Zod schema.
   * Returns the parsed value on success, or the default on failure.
   */
  private _validate<T>(key: string, parsed: unknown): T {
    const entry = getSchemaForKey(key);
    if (!entry) {
      return parsed as T;
    }

    const result = entry.schema.safeParse(parsed);
    if (result.success) {
      return result.data as T;
    }

    log.warn({ key, issues: result.error.issues }, 'Validation failed — using default');
    return structuredClone(entry.default) as T;
  }

  private _defaultFor<T>(key: string): T | null {
    const entry = getSchemaForKey(key);
    return entry ? (structuredClone(entry.default) as T) : null;
  }
}
