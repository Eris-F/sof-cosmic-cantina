/**
 * Zod schemas for all persisted game data.
 *
 * Used by LocalStorageAdapter to validate reads and provide typed defaults.
 *
 * @module schemas/storage
 */

import { z } from 'zod';

export const walletSchema = z.object({
  coins: z.number().int().min(0),
  totalEarned: z.number().int().min(0),
});

export const ownedItemsSchema = z.object({
  skins: z.array(z.string()).min(1),
  bullets: z.array(z.string()).min(1),
  trails: z.array(z.string()).min(1),
  barriers: z.array(z.string()).min(1),
});

export const equippedSchema = z.object({
  skins: z.string(),
  bullets: z.string(),
  trails: z.string(),
  barriers: z.string(),
});

export const skillLevelsSchema = z.object({
  tequila: z.number().int().min(0),
  skiing: z.number().int().min(0),
  diving: z.number().int().min(0),
  photography: z.number().int().min(0),
  music: z.number().int().min(0),
});

export const highScoreEntrySchema = z.object({
  name: z.string(),
  score: z.number().int().min(0),
  wave: z.number().int().min(0).optional(),
  difficulty: z.string().optional(),
  gameMode: z.string().optional(),
  date: z.string().optional(),
});

export const highScoresSchema = z.array(highScoreEntrySchema);

export const achievementsSchema = z.array(z.string());

// ── Inferred types from schemas ──────────────────────────────────────────────

export type Wallet = z.infer<typeof walletSchema>;
export type OwnedItems = z.infer<typeof ownedItemsSchema>;
export type Equipped = z.infer<typeof equippedSchema>;
export type SkillLevels = z.infer<typeof skillLevelsSchema>;
export type HighScoreEntry = z.infer<typeof highScoreEntrySchema>;
export type HighScores = z.infer<typeof highScoresSchema>;
export type Achievements = z.infer<typeof achievementsSchema>;

// ── Schema entry type ────────────────────────────────────────────────────────

interface SchemaEntry<T extends z.ZodType> {
  readonly schema: T;
  readonly default: z.infer<T>;
}

interface SchemaMap {
  readonly wallet: SchemaEntry<typeof walletSchema>;
  readonly owned: SchemaEntry<typeof ownedItemsSchema>;
  readonly equipped: SchemaEntry<typeof equippedSchema>;
  readonly skills: SchemaEntry<typeof skillLevelsSchema>;
  readonly scores: SchemaEntry<typeof highScoresSchema>;
  readonly achievements: SchemaEntry<typeof achievementsSchema>;
}

/**
 * Map from storage key suffix to { schema, default }.
 * The key suffix matches what comes after the prefix in storage-keys.
 */
export const SCHEMA_MAP: SchemaMap = {
  wallet: { schema: walletSchema, default: { coins: 0, totalEarned: 0 } },
  owned: {
    schema: ownedItemsSchema,
    default: {
      skins: ['default'],
      bullets: ['bread'],
      trails: ['none'],
      barriers: ['flowers'],
    },
  },
  equipped: {
    schema: equippedSchema,
    default: {
      skins: 'default',
      bullets: 'bread',
      trails: 'none',
      barriers: 'flowers',
    },
  },
  skills: {
    schema: skillLevelsSchema,
    default: { tequila: 0, skiing: 0, diving: 0, photography: 0, music: 0 },
  },
  scores: { schema: highScoresSchema, default: [] },
  achievements: { schema: achievementsSchema, default: [] },
};

type SchemaMapKey = keyof SchemaMap;

/** Result type for getSchemaForKey -- schema and default value. */
export interface SchemaLookupResult {
  readonly schema: z.ZodType;
  readonly default: unknown;
}

/**
 * Resolve a full storage key (e.g. "sofia_cantina_wallet") to its schema entry.
 */
export function getSchemaForKey(key: string): SchemaLookupResult | null {
  const suffix = key.replace(/^sofia_cantina_/, '') as SchemaMapKey;
  return (SCHEMA_MAP[suffix] as SchemaLookupResult | undefined) ?? null;
}
