/**
 * Storage key constants for all persisted game data.
 *
 * Every key that touches localStorage or the sync API lives here.
 * Centralising keys prevents typos and makes auditing storage trivial.
 *
 * @module config/storage-keys
 */

const PREFIX = 'sofia_cantina_' as const;

export const WALLET = `${PREFIX}wallet` as const;
export const OWNED_ITEMS = `${PREFIX}owned` as const;
export const EQUIPPED = `${PREFIX}equipped` as const;
export const SKILL_LEVELS = `${PREFIX}skills` as const;
export const HIGH_SCORES = `${PREFIX}scores` as const;
export const ACHIEVEMENTS = `${PREFIX}achievements` as const;
export const ACCESS_TOKEN = `${PREFIX}access_token` as const;
export const REFRESH_TOKEN = `${PREFIX}refresh_token` as const;
export const PLAYER_INFO = `${PREFIX}player` as const;
export const DIRTY_FLAG = `${PREFIX}dirty` as const;
export const SCHEMA_VERSION = `${PREFIX}schema_version` as const;

export type GameDataKey =
  | typeof WALLET
  | typeof OWNED_ITEMS
  | typeof EQUIPPED
  | typeof SKILL_LEVELS
  | typeof HIGH_SCORES
  | typeof ACHIEVEMENTS;

export type StorageKey =
  | GameDataKey
  | typeof ACCESS_TOKEN
  | typeof REFRESH_TOKEN
  | typeof PLAYER_INFO
  | typeof DIRTY_FLAG
  | typeof SCHEMA_VERSION;

/** All game-data keys (excludes auth tokens). */
export const GAME_DATA_KEYS: readonly GameDataKey[] = Object.freeze([
  WALLET,
  OWNED_ITEMS,
  EQUIPPED,
  SKILL_LEVELS,
  HIGH_SCORES,
  ACHIEVEMENTS,
]);

/** Every key managed by the storage layer. */
export const ALL_KEYS: readonly StorageKey[] = Object.freeze([
  ...GAME_DATA_KEYS,
  ACCESS_TOKEN,
  REFRESH_TOKEN,
  PLAYER_INFO,
  DIRTY_FLAG,
  SCHEMA_VERSION,
]);
