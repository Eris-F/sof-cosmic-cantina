/**
 * Abstract storage provider interface.
 *
 * Both LocalStorageAdapter and APIStorageAdapter implement this contract,
 * enabling StorageManager to swap or layer them without coupling to a
 * specific persistence mechanism.
 *
 * @module storage/StorageProvider
 */

export abstract class StorageProvider {
  /**
   * Retrieve a value by key.
   */
  abstract get<T = unknown>(key: string): Promise<T | null>;

  /**
   * Store a value by key.
   */
  abstract set<T = unknown>(key: string, value: T): Promise<void>;

  /**
   * Remove a value by key.
   */
  abstract remove(key: string): Promise<void>;

  /**
   * Clear all game-related keys (not auth tokens).
   */
  abstract clear(): Promise<void>;

  /**
   * Read all game data as a single object.
   */
  abstract getAll(): Promise<Record<string, unknown>>;

  /**
   * Bulk-write all game data from an object.
   */
  abstract setAll(data: Record<string, unknown>): Promise<void | Record<string, unknown> | null>;
}
