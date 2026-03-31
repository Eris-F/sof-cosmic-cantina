import { CANVAS_HEIGHT } from '../config/constants';
import type { AchievementPopup } from '../types/systems';

export interface MenuState {
  readonly catY: number;
  readonly catTargetY: number;
}

export interface ShopState {
  readonly categoryIndex: number;
  readonly itemIndex: number;
  readonly scrollOffset: number;
  readonly flashMessage: string | null;
  readonly flashTimer: number;
}

export interface SkillTreeState {
  readonly selectedBranch: number;
  readonly flashMessage: string | null;
  readonly flashTimer: number;
}

export interface TutorialState {
  readonly page: number;
}

export interface HighScoreEntryState {
  readonly initials: readonly string[];
  readonly initialPos: number;
}

export interface GameOverState {
  readonly timer: number;
}

export interface GameStats {
  readonly shotsFired: number;
  readonly shotsHit: number;
  readonly kills: Readonly<Record<string, number>>;
  readonly timeSurvived: number;
  readonly powerupsCollected: number;
  readonly coinsThisGame: number;
}

export interface UIState {
  readonly menu: MenuState;
  readonly shop: ShopState;
  readonly skillTree: SkillTreeState;
  readonly tutorial: TutorialState;
  readonly highScore: HighScoreEntryState;
  readonly gameOver: GameOverState;
  readonly stats: GameStats;
  readonly achievementPopups: readonly AchievementPopup[];
  readonly achievementCooldown: number;
}

/**
 * Creates a fresh UI state with default values.
 */
export function createUIState(): UIState {
  return {
    menu: {
      catY: CANVAS_HEIGHT / 2,
      catTargetY: CANVAS_HEIGHT / 2,
    },
    shop: {
      categoryIndex: 0,
      itemIndex: 0,
      scrollOffset: 0,
      flashMessage: null,
      flashTimer: 0,
    },
    skillTree: {
      selectedBranch: 0,
      flashMessage: null,
      flashTimer: 0,
    },
    tutorial: {
      page: 0,
    },
    highScore: {
      initials: ['A', 'A', 'A'],
      initialPos: 0,
    },
    gameOver: {
      timer: 0,
    },
    stats: {
      shotsFired: 0,
      shotsHit: 0,
      kills: {},
      timeSurvived: 0,
      powerupsCollected: 0,
      coinsThisGame: 0,
    },
    achievementPopups: [],
    achievementCooldown: 0,
  };
}
