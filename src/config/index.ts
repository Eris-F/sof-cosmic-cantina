/**
 * Config barrel — single import point for all game configuration.
 * All config objects are deeply frozen to prevent runtime mutation.
 *
 * @module config
 */

// Balance: tuning values, difficulty, enemy stats, boss config, etc.
export {
  SHAKE_PRESETS,
  SLOWMO_PRESETS,
  COIN_REWARDS,
  BOSS,
  COMBO,
  ABILITIES,
  HAZARDS,
  POWERUPS,
  EXTRA_LIFE_THRESHOLD,
  ENEMY_COLLISION_THRESHOLD,
  STREAK_MILESTONES,
  ACHIEVEMENT_THRESHOLDS,
  RARITY_THRESHOLDS,
  DARKNESS_SPOTLIGHT,
  DIFFICULTIES,
  DIFFICULTY_KEYS,
  SPECIAL_HP,
  SPECIAL_UNLOCK_WAVES,
  ELITE_START_WAVE,
  ELITE_CHANCE,
  ELITE_HP,
  SPECIAL_BASE_CHANCE,
  SPECIAL_CHANCE_PER_WAVE,
  SPECIAL_MAX_CHANCE,
  DIVE_TIMER_MIN,
  DIVE_TIMER_MAX,
  DIVE_SPEED_MIN,
  DIVE_SPEED_MAX,
  BOSS_TYPES,
  BOSS_ATTACK_TIMERS,
  COMBO_LABELS,
} from './balance';
export type {
  ShakePreset,
  SlowmoPreset,
  CoinRewards,
  BossConfig,
  ComboConfig,
  AbilitiesConfig,
  HazardsConfig,
  PowerupsConfig,
  StreakMilestone,
  AchievementThresholdsConfig,
  DarknessSpotlightConfig,
  DifficultySettings,
  BossTypeConfig,
} from './balance';

// Items: shop catalog, categories, item type interfaces.
export {
  CATEGORIES,
  SHOP_ITEMS,
} from './items';
export type {
  CategoryDef,
  ShopItemBase,
  SkinItem,
  BulletItem,
  TrailItem,
  BarrierItem,
  ShopItemCatalog,
} from './items';

// Formations: enemy grid templates.
export { FORMATIONS } from './formations';

// Modifiers: wave modifier data.
export { MODIFIERS } from './modifiers';
export type { ModifierDef } from './modifiers';

// Achievements: achievement definitions.
// Note: `ACHIEVEMENTS` here is the data array; for the storage key see `ACHIEVEMENTS_KEY`.
export { ACHIEVEMENTS } from './achievements';
export type { AchievementDef } from './achievements';

// Weapons: weapon definitions.
export { WEAPONS } from './weapons';
export type { WeaponDef } from './weapons';

// Skills: skill tree branch definitions.
export { SKILL_BRANCHES } from './skills';
export type { SkillLevel, SkillBranch } from './skills';

// Constants: canvas, physics, UI, timing values.
export {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  SCALE,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_SPEED,
  PLAYER_ACCEL,
  PLAYER_DECEL,
  PLAYER_Y_OFFSET,
  MAX_BULLETS,
  BULLET_SPEED,
  BULLET_WIDTH,
  BULLET_HEIGHT,
  INVINCIBILITY_TIME,
  INITIAL_LIVES,
  EXTRA_LIFE_SCORE,
  ENEMY_COLS,
  ENEMY_ROWS,
  ENEMY_WIDTH,
  ENEMY_HEIGHT,
  ENEMY_PADDING_X,
  ENEMY_PADDING_Y,
  ENEMY_BASE_SPEED,
  ENEMY_SPEED_INCREASE,
  ENEMY_DROP,
  ENEMY_FIRE_INTERVAL_MIN,
  ENEMY_FIRE_INTERVAL_MAX,
  ENEMY_BULLET_SPEED,
  POINTS_SMISKI,
  POINTS_JELLYCAT,
  POINTS_TIE,
  POINTS_UFO,
  UFO_WIDTH,
  UFO_HEIGHT,
  UFO_SPEED,
  UFO_SPAWN_MIN,
  UFO_SPAWN_MAX,
  BARRIER_COUNT,
  BARRIER_BLOCK_SIZE,
  BARRIER_Y,
  PETAL_COUNT_MIN,
  PETAL_COUNT_MAX,
  PETAL_LIFETIME_MIN,
  PETAL_LIFETIME_MAX,
  PETAL_GRAVITY,
  STAR_LAYERS,
  WAVE_TEXT_DURATION,
  HIGH_SCORE_MAX,
  STATE_MENU,
  STATE_PLAYING,
  STATE_GAME_OVER,
  STATE_HIGH_SCORE,
  STATE_PAUSED,
  STATE_MODE_SELECT,
  STATE_SHOP,
  STATE_SKILLS,
  STATE_TUTORIAL,
  PAUSE_ZONE,
  PLAYER_ZONE_TOP_RATIO,
  TOUCH_DEAD_ZONE,
  TOUCH_FOLLOW_SPEED,
  GAME_OVER_DELAY,
  MENU_START_DELAY,
  BOSS_WAVE_INTERVAL,
} from './constants';

// Storage keys: localStorage key strings.
// `ACHIEVEMENTS` from storage-keys collides with the achievements data array above,
// so it is re-exported here under the alias `ACHIEVEMENTS_KEY`.
export {
  WALLET,
  OWNED_ITEMS,
  EQUIPPED,
  SKILL_LEVELS,
  HIGH_SCORES,
  ACHIEVEMENTS as ACHIEVEMENTS_KEY,
  ACCESS_TOKEN,
  REFRESH_TOKEN,
  PLAYER_INFO,
  DIRTY_FLAG,
  SCHEMA_VERSION,
  GAME_DATA_KEYS,
  ALL_KEYS,
} from './storage-keys';
export type { GameDataKey, StorageKey } from './storage-keys';
