import { createPlayerState } from './PlayerState';
import { createCombatState } from './CombatState';
import { createUIState } from './UIState';
import { createEconomyState } from './EconomyState';
import { createEffectsState } from './EffectsState';
import type { PlayerState } from './PlayerState';
import type { CombatState } from './CombatState';
import type { UIState } from './UIState';
import type { EconomyState } from './EconomyState';
import type { EffectsState } from './EffectsState';
import type { Difficulty, GameMode, SceneId } from '../types/game';

export interface GameConfig {
  readonly difficulty: Difficulty;
  readonly gameMode: GameMode;
}

export interface GameState {
  readonly time: number;
  readonly scene: SceneId;
  readonly player: PlayerState;
  readonly combat: CombatState;
  readonly ui: UIState;
  readonly economy: EconomyState;
  readonly effects: EffectsState;
  readonly config: GameConfig;
}

/**
 * Creates the full initial game state by composing all sub-state factories.
 */
export function createInitialState(): GameState {
  return {
    time: 0,
    scene: 'menu',
    player: createPlayerState(),
    combat: createCombatState(),
    ui: createUIState(),
    economy: createEconomyState(),
    effects: createEffectsState(),
    config: {
      difficulty: 'normal',
      gameMode: 'classic',
    },
  };
}

/**
 * Resets gameplay-related state (player, combat, effects, UI stats) while
 * preserving persistent data (economy, config, scene).
 *
 * Intended for use between rounds / on "play again".
 *
 * Note: This function mutates the Immer draft passed to it.
 */
export function resetGameplayState(state: GameState): void {
  const freshPlayer = createPlayerState();
  const freshCombat = createCombatState();
  const freshEffects = createEffectsState();
  const freshUI = createUIState();

  // Immer draft mutation (these are intentional — Immer wraps in a Proxy)
  (state as { time: number }).time = 0;
  (state as { player: PlayerState }).player = freshPlayer;
  (state as { combat: CombatState }).combat = freshCombat;
  (state as { effects: EffectsState }).effects = freshEffects;

  // Reset per-game stats but keep persistent UI state (shop/skillTree selections)
  (state.ui as { stats: UIState['stats'] }).stats = freshUI.stats;
  (state.ui as { gameOver: UIState['gameOver'] }).gameOver = freshUI.gameOver;
  (state.ui as { highScore: UIState['highScore'] }).highScore = freshUI.highScore;
  (state.ui as { achievementPopups: UIState['achievementPopups'] }).achievementPopups = freshUI.achievementPopups;
  (state.ui as { achievementCooldown: UIState['achievementCooldown'] }).achievementCooldown = freshUI.achievementCooldown;
}
