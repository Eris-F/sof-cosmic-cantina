import type {
  HighScoreEntry,
  AchievementId,
  ShopItemStats,
} from '../types/game';

export interface WalletState {
  readonly coins: number;
  readonly totalEarned: number;
}

export interface OwnedItems {
  readonly skins: readonly string[];
  readonly bullets: readonly string[];
  readonly trails: readonly string[];
  readonly barriers: readonly string[];
}

export interface EquippedItems {
  readonly skins: string;
  readonly bullets: string;
  readonly trails: string;
  readonly barriers: string;
}

export interface SkillLevels {
  readonly tequila: number;
  readonly skiing: number;
  readonly diving: number;
  readonly photography: number;
  readonly music: number;
}

export interface EconomyState {
  readonly wallet: WalletState;
  readonly owned: OwnedItems;
  readonly equipped: EquippedItems;
  readonly achievements: readonly AchievementId[];
  readonly highScores: readonly HighScoreEntry[];
  readonly skillLevels: SkillLevels;
  readonly mergedStats: ShopItemStats;
}

/**
 * Creates a fresh economy state with default values.
 */
export function createEconomyState(): EconomyState {
  return {
    wallet: {
      coins: 0,
      totalEarned: 0,
    },
    owned: {
      skins: ['default'],
      bullets: ['bread'],
      trails: ['none'],
      barriers: ['flowers'],
    },
    equipped: {
      skins: 'default',
      bullets: 'bread',
      trails: 'none',
      barriers: 'flowers',
    },
    achievements: [],
    highScores: [],
    skillLevels: {
      tequila: 0,
      skiing: 0,
      diving: 0,
      photography: 0,
      music: 0,
    },
    mergedStats: {},
  };
}
