/**
 * Economy Zod schemas.
 * Validates wallet, owned items, equipped loadout, skills, scores, and shop items.
 */

import { z } from 'zod';

// --- Wallet ---

export const WalletSchema = z.object({
  coins: z.number().int().min(0),
  totalEarned: z.number().int().min(0),
});

export type Wallet = z.infer<typeof WalletSchema>;

// --- Owned Items ---

export const OwnedSchema = z.object({
  skins: z.array(z.string().min(1)).min(1),
  bullets: z.array(z.string().min(1)).min(1),
  trails: z.array(z.string().min(1)).min(1),
  barriers: z.array(z.string().min(1)).min(1),
});

export type Owned = z.infer<typeof OwnedSchema>;

// --- Equipped Items ---

export const EquippedSchema = z.object({
  skins: z.string().min(1),
  bullets: z.string().min(1),
  trails: z.string().min(1),
  barriers: z.string().min(1),
});

export type Equipped = z.infer<typeof EquippedSchema>;

// --- Skill Levels ---

const SkillLevel = z.number().int().min(0).max(5);

export const SkillLevelsSchema = z.object({
  tequila: SkillLevel,
  skiing: SkillLevel,
  diving: SkillLevel,
  photography: SkillLevel,
  music: SkillLevel,
});

export type SkillLevels = z.infer<typeof SkillLevelsSchema>;

// --- High Score Entry ---

const DifficultyEnum = z.enum(['easy', 'normal', 'hard']);
const GameModeEnum = z.enum(['classic', 'endless', 'boss_rush']);

export const HighScoreEntrySchema = z.object({
  name: z.string().length(3),
  score: z.number().int().min(0),
  wave: z.number().int().min(1),
  difficulty: DifficultyEnum,
  gameMode: GameModeEnum,
  date: z.string().min(1),
});

export type HighScoreEntry = z.infer<typeof HighScoreEntrySchema>;

// --- Shop Item ---

const ShopCategoryEnum = z.enum(['skins', 'bullets', 'trails', 'barriers']);

export const ShopItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  price: z.number().int().min(0),
  category: ShopCategoryEnum,
  desc: z.string(),
  perk: z.string(),
  stats: z.record(z.string(), z.number()),
});

export type ShopItem = z.infer<typeof ShopItemSchema>;

// Re-export enums for API schemas
export { DifficultyEnum, GameModeEnum, ShopCategoryEnum };
