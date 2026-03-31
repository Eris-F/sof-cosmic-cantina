/**
 * Schema versioning and data migrations.
 *
 * Each migration is a pure function: (data) => transformedData.
 * They run sequentially from the stored version up to CURRENT_VERSION.
 *
 * @module storage/migrations
 */

import { createLogger } from '../infra/logger';

const log = createLogger('migrations');

export const CURRENT_VERSION: number = 1;

type Migration = (data: Record<string, unknown>) => Record<string, unknown>;

/**
 * Ordered list of migrations. Index 0 is the v0 -> v1 migration, etc.
 * Each receives the full snapshot of game-data keys and returns a new snapshot.
 */
const MIGRATIONS: readonly Migration[] = [
  // v0 -> v1: initial schema -- no transform needed, but we normalise
  // any missing keys to their defaults (handled by LocalStorageAdapter).
  (data) => ({ ...data }),
];

/**
 * Apply all migrations from `fromVersion` up to CURRENT_VERSION.
 */
export function migrate(data: Record<string, unknown>, fromVersion: number): Record<string, unknown> {
  const startVersion = typeof fromVersion === 'number' ? fromVersion : 0;

  if (startVersion >= CURRENT_VERSION) {
    return { ...data };
  }

  let current: Record<string, unknown> = { ...data };

  for (let v = startVersion; v < CURRENT_VERSION; v++) {
    const migration: Migration | undefined = MIGRATIONS[v];
    if (!migration) {
      log.warn({ version: v }, 'No migration found — skipping');
      continue;
    }

    log.info({ from: v, to: v + 1 }, 'Running migration');
    current = migration(current);
  }

  return current;
}
