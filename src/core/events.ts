/**
 * Game event type constants.
 *
 * Naming convention: DOMAIN_ACTION (e.g. PLAYER_MOVE, WAVE_START).
 * Every value is a plain string so events are serialisable and debuggable.
 *
 * @module core/events
 */

// ── Player ──────────────────────────────────────────────────────────────────
export const PLAYER_MOVE = 'player:move' as const;
export const PLAYER_FIRE = 'player:fire' as const;
export const PLAYER_HIT = 'player:hit' as const;
export const PLAYER_DEATH = 'player:death' as const;
export const PLAYER_RESPAWN = 'player:respawn' as const;

// ── Enemy ───────────────────────────────────────────────────────────────────
export const ENEMY_HIT = 'enemy:hit' as const;
export const ENEMY_KILLED = 'enemy:killed' as const;
export const ENEMY_REACHED_BOTTOM = 'enemy:reachedBottom' as const;
export const ENEMIES_CLEARED = 'enemy:allCleared' as const;

// ── Boss ────────────────────────────────────────────────────────────────────
export const BOSS_SPAWNED = 'boss:spawned' as const;
export const BOSS_HIT = 'boss:hit' as const;
export const BOSS_DEFEATED = 'boss:defeated' as const;

// ── UFO ─────────────────────────────────────────────────────────────────────
export const UFO_SPAWNED = 'ufo:spawned' as const;
export const UFO_HIT = 'ufo:hit' as const;
export const UFO_ESCAPED = 'ufo:escaped' as const;

// ── Wave ────────────────────────────────────────────────────────────────────
export const WAVE_START = 'wave:start' as const;
export const WAVE_CLEARED = 'wave:cleared' as const;
export const MODIFIER_APPLIED = 'wave:modifierApplied' as const;

// ── Combat ──────────────────────────────────────────────────────────────────
export const BULLET_FIRED = 'combat:bulletFired' as const;
export const BULLET_HIT = 'combat:bulletHit' as const;
export const BARRIER_HIT = 'combat:barrierHit' as const;
export const BARRIER_DESTROYED = 'combat:barrierDestroyed' as const;

// ── Powerup ─────────────────────────────────────────────────────────────────
export const POWERUP_SPAWNED = 'powerup:spawned' as const;
export const POWERUP_COLLECTED = 'powerup:collected' as const;
export const POWERUP_EXPIRED = 'powerup:expired' as const;
export const BOMB_ACTIVATED = 'powerup:bombActivated' as const;

// ── Combo ───────────────────────────────────────────────────────────────────
export const COMBO_INCREMENT = 'combo:increment' as const;
export const COMBO_RESET = 'combo:reset' as const;
export const STREAK_MILESTONE = 'combo:streakMilestone' as const;

// ── Ability ─────────────────────────────────────────────────────────────────
export const TEQUILA_BOMB_TRIGGERED = 'ability:tequilaBomb' as const;
export const PHOTO_FLASH_TRIGGERED = 'ability:photoFlash' as const;

// ── Economy ─────────────────────────────────────────────────────────────────
export const COINS_EARNED = 'economy:coinsEarned' as const;
export const ITEM_BOUGHT = 'economy:itemBought' as const;
export const ITEM_EQUIPPED = 'economy:itemEquipped' as const;
export const SKILL_UPGRADED = 'economy:skillUpgraded' as const;

// ── Achievement ─────────────────────────────────────────────────────────────
export const ACHIEVEMENT_UNLOCKED = 'achievement:unlocked' as const;

// ── Scene ───────────────────────────────────────────────────────────────────
export const SCENE_ENTER = 'scene:enter' as const;
export const SCENE_EXIT = 'scene:exit' as const;
export const SCENE_TRANSITION = 'scene:transition' as const;

// ── Game ────────────────────────────────────────────────────────────────────
export const GAME_START = 'game:start' as const;
export const GAME_OVER = 'game:over' as const;
export const GAME_PAUSE = 'game:pause' as const;
export const GAME_RESUME = 'game:resume' as const;

// ── Audio ───────────────────────────────────────────────────────────────────
export const SFX_PLAY = 'audio:sfxPlay' as const;
export const MUSIC_START = 'audio:musicStart' as const;
export const MUSIC_STOP = 'audio:musicStop' as const;

// ── UI ──────────────────────────────────────────────────────────────────────
export const SHOP_OPENED = 'ui:shopOpened' as const;
export const SHOP_CLOSED = 'ui:shopClosed' as const;
export const TUTORIAL_OPENED = 'ui:tutorialOpened' as const;
export const TUTORIAL_CLOSED = 'ui:tutorialClosed' as const;

// ── System ──────────────────────────────────────────────────────────────────
export const STATE_SYNCED = 'system:stateSynced' as const;
export const ERROR_OCCURRED = 'system:errorOccurred' as const;

/** Union of all game event string literals. */
export type GameEventType =
  | typeof PLAYER_MOVE
  | typeof PLAYER_FIRE
  | typeof PLAYER_HIT
  | typeof PLAYER_DEATH
  | typeof PLAYER_RESPAWN
  | typeof ENEMY_HIT
  | typeof ENEMY_KILLED
  | typeof ENEMY_REACHED_BOTTOM
  | typeof ENEMIES_CLEARED
  | typeof BOSS_SPAWNED
  | typeof BOSS_HIT
  | typeof BOSS_DEFEATED
  | typeof UFO_SPAWNED
  | typeof UFO_HIT
  | typeof UFO_ESCAPED
  | typeof WAVE_START
  | typeof WAVE_CLEARED
  | typeof MODIFIER_APPLIED
  | typeof BULLET_FIRED
  | typeof BULLET_HIT
  | typeof BARRIER_HIT
  | typeof BARRIER_DESTROYED
  | typeof POWERUP_SPAWNED
  | typeof POWERUP_COLLECTED
  | typeof POWERUP_EXPIRED
  | typeof BOMB_ACTIVATED
  | typeof COMBO_INCREMENT
  | typeof COMBO_RESET
  | typeof STREAK_MILESTONE
  | typeof TEQUILA_BOMB_TRIGGERED
  | typeof PHOTO_FLASH_TRIGGERED
  | typeof COINS_EARNED
  | typeof ITEM_BOUGHT
  | typeof ITEM_EQUIPPED
  | typeof SKILL_UPGRADED
  | typeof ACHIEVEMENT_UNLOCKED
  | typeof SCENE_ENTER
  | typeof SCENE_EXIT
  | typeof SCENE_TRANSITION
  | typeof GAME_START
  | typeof GAME_OVER
  | typeof GAME_PAUSE
  | typeof GAME_RESUME
  | typeof SFX_PLAY
  | typeof MUSIC_START
  | typeof MUSIC_STOP
  | typeof SHOP_OPENED
  | typeof SHOP_CLOSED
  | typeof TUTORIAL_OPENED
  | typeof TUTORIAL_CLOSED
  | typeof STATE_SYNCED
  | typeof ERROR_OCCURRED;

/**
 * Convenience object that re-exports every event constant under a single
 * namespace.  Import with:
 *
 *   import { GameEvents } from './core/events';
 *   bus.on(GameEvents.PLAYER_FIRE, handler);
 */
export const GameEvents = {
  // Player
  PLAYER_MOVE,
  PLAYER_FIRE,
  PLAYER_HIT,
  PLAYER_DEATH,
  PLAYER_RESPAWN,
  // Enemy
  ENEMY_HIT,
  ENEMY_KILLED,
  ENEMY_REACHED_BOTTOM,
  ENEMIES_CLEARED,
  // Boss
  BOSS_SPAWNED,
  BOSS_HIT,
  BOSS_DEFEATED,
  // UFO
  UFO_SPAWNED,
  UFO_HIT,
  UFO_ESCAPED,
  // Wave
  WAVE_START,
  WAVE_CLEARED,
  MODIFIER_APPLIED,
  // Combat
  BULLET_FIRED,
  BULLET_HIT,
  BARRIER_HIT,
  BARRIER_DESTROYED,
  // Powerup
  POWERUP_SPAWNED,
  POWERUP_COLLECTED,
  POWERUP_EXPIRED,
  BOMB_ACTIVATED,
  // Combo
  COMBO_INCREMENT,
  COMBO_RESET,
  STREAK_MILESTONE,
  // Ability
  TEQUILA_BOMB_TRIGGERED,
  PHOTO_FLASH_TRIGGERED,
  // Economy
  COINS_EARNED,
  ITEM_BOUGHT,
  ITEM_EQUIPPED,
  SKILL_UPGRADED,
  // Achievement
  ACHIEVEMENT_UNLOCKED,
  // Scene
  SCENE_ENTER,
  SCENE_EXIT,
  SCENE_TRANSITION,
  // Game
  GAME_START,
  GAME_OVER,
  GAME_PAUSE,
  GAME_RESUME,
  // Audio
  SFX_PLAY,
  MUSIC_START,
  MUSIC_STOP,
  // UI
  SHOP_OPENED,
  SHOP_CLOSED,
  TUTORIAL_OPENED,
  TUTORIAL_CLOSED,
  // System
  STATE_SYNCED,
  ERROR_OCCURRED,
} as const;
