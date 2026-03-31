/**
 * API request/response Zod schemas.
 * Mirrors FastAPI Pydantic models for runtime validation of network data.
 */

import { z } from 'zod';
import {
  WalletSchema,
  OwnedSchema,
  EquippedSchema,
  SkillLevelsSchema,
  HighScoreEntrySchema,
  DifficultyEnum,
  GameModeEnum,
  ShopCategoryEnum,
} from './economy.schema';

// ============================================
// Auth
// ============================================

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  username: z.string().min(1).max(32),
  password: z.string().min(8).max(128),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const GoogleAuthRequestSchema = z.object({
  id_token: z.string().min(1),
});

export type GoogleAuthRequest = z.infer<typeof GoogleAuthRequestSchema>;

export const RefreshRequestSchema = z.object({
  refresh_token: z.string().min(1),
});

export type RefreshRequest = z.infer<typeof RefreshRequestSchema>;

export const PlayerInfoSchema = z.object({
  player_id: z.string().min(1),
  email: z.string().email(),
  username: z.string().min(1),
  auth_provider: z.string().min(1),
});

export type PlayerInfo = z.infer<typeof PlayerInfoSchema>;

export const AuthResponseSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  player: PlayerInfoSchema,
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const TokenResponseSchema = z.object({
  access_token: z.string().min(1),
});

export type TokenResponse = z.infer<typeof TokenResponseSchema>;

// ============================================
// Shop
// ============================================

export const BuyRequestSchema = z.object({
  category: ShopCategoryEnum,
  itemId: z.string().min(1),
});

export type BuyRequest = z.infer<typeof BuyRequestSchema>;

export const EquipRequestSchema = z.object({
  category: ShopCategoryEnum,
  itemId: z.string().min(1),
});

export type EquipRequest = z.infer<typeof EquipRequestSchema>;

export const ShopResponseSchema = z.object({
  wallet: WalletSchema,
  owned: OwnedSchema,
  equipped: EquippedSchema,
});

export type ShopResponse = z.infer<typeof ShopResponseSchema>;

export const EquipResponseSchema = z.object({
  equipped: EquippedSchema,
});

export type EquipResponse = z.infer<typeof EquipResponseSchema>;

// ============================================
// Skills
// ============================================

export const UpgradeRequestSchema = z.object({
  branchId: z.enum(['tequila', 'skiing', 'diving', 'photography', 'music']),
});

export type UpgradeRequest = z.infer<typeof UpgradeRequestSchema>;

export const SkillResponseSchema = z.object({
  wallet: WalletSchema,
  skills: SkillLevelsSchema,
});

export type SkillResponse = z.infer<typeof SkillResponseSchema>;

// ============================================
// Scores
// ============================================

export const ScoreSubmitRequestSchema = z.object({
  name: z.string().length(3),
  score: z.number().int().min(0),
  wave: z.number().int().min(1),
  difficulty: DifficultyEnum,
  gameMode: GameModeEnum,
});

export type ScoreSubmitRequest = z.infer<typeof ScoreSubmitRequestSchema>;

export const ScoresResponseSchema = z.object({
  highScores: z.array(HighScoreEntrySchema),
});

export type ScoresResponse = z.infer<typeof ScoresResponseSchema>;

// ============================================
// Achievements
// ============================================

export const AchievementUnlockRequestSchema = z.object({
  achievementIds: z.array(z.string().min(1)).min(1),
});

export type AchievementUnlockRequest = z.infer<typeof AchievementUnlockRequestSchema>;

export const AchievementsResponseSchema = z.object({
  achievements: z.array(z.string().min(1)),
});

export type AchievementsResponse = z.infer<typeof AchievementsResponseSchema>;

// ============================================
// Sync / Full State
// ============================================

export const FullPlayerStateSchema = z.object({
  wallet: WalletSchema,
  owned: OwnedSchema,
  equipped: EquippedSchema,
  skills: SkillLevelsSchema,
  achievements: z.array(z.string()),
  highScores: z.array(HighScoreEntrySchema),
});

export type FullPlayerState = z.infer<typeof FullPlayerStateSchema>;

export const SyncRequestSchema = z.object({
  state: FullPlayerStateSchema,
});

export type SyncRequest = z.infer<typeof SyncRequestSchema>;

export const SyncResponseSchema = z.object({
  player: PlayerInfoSchema,
  state: FullPlayerStateSchema,
});

export type SyncResponse = z.infer<typeof SyncResponseSchema>;

// ============================================
// Player Profile (GET /players/me)
// ============================================

export const PlayerMeResponseSchema = z.object({
  player: PlayerInfoSchema,
  state: FullPlayerStateSchema,
});

export type PlayerMeResponse = z.infer<typeof PlayerMeResponseSchema>;

// ============================================
// Error
// ============================================

export const ErrorResponseSchema = z.object({
  detail: z.string(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
