// ============================================
// GAME CONSTANTS — Canvas, Physics, UI
// ============================================

import type { StarLayerConfig } from '../types/game';

// Canvas — re-export from root constants (dynamic CANVAS_HEIGHT)
export { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';
export const SCALE = 1 as const;

// Player
export const PLAYER_WIDTH = 32 as const;
export const PLAYER_HEIGHT = 28 as const;
export const PLAYER_SPEED = 280 as const;
export const PLAYER_ACCEL = 2800 as const;
export const PLAYER_DECEL = 2400 as const;
export const PLAYER_Y_OFFSET = 56 as const;
export const MAX_BULLETS = 3 as const;
export const BULLET_SPEED = 350 as const;
export const BULLET_WIDTH = 4 as const;
export const BULLET_HEIGHT = 8 as const;
export const INVINCIBILITY_TIME = 1.5 as const;
export const INITIAL_LIVES = 3 as const;
export const EXTRA_LIFE_SCORE = 5000 as const;

// Enemies
export const ENEMY_COLS = 10 as const;
export const ENEMY_ROWS = 3 as const;
export const ENEMY_WIDTH = 24 as const;
export const ENEMY_HEIGHT = 20 as const;
export const ENEMY_PADDING_X = 12 as const;
export const ENEMY_PADDING_Y = 14 as const;
export const ENEMY_BASE_SPEED = 30 as const;
export const ENEMY_SPEED_INCREASE = 0.10 as const;
export const ENEMY_DROP = 16 as const;
export const ENEMY_FIRE_INTERVAL_MIN = 0.8 as const;
export const ENEMY_FIRE_INTERVAL_MAX = 2.0 as const;
export const ENEMY_BULLET_SPEED = 180 as const;

// Points (base values, multiplied by wave)
export const POINTS_SMISKI = 10 as const;
export const POINTS_JELLYCAT = 20 as const;
export const POINTS_TIE = 30 as const;
export const POINTS_UFO = [50, 100, 150, 200] as const;

// UFO
export const UFO_WIDTH = 32 as const;
export const UFO_HEIGHT = 18 as const;
export const UFO_SPEED = 100 as const;
export const UFO_SPAWN_MIN = 20 as const;
export const UFO_SPAWN_MAX = 30 as const;

// Barriers
export const BARRIER_COUNT = 4 as const;
export const BARRIER_BLOCK_SIZE = 4 as const;
export const BARRIER_Y = 500 as const;

// Particles
export const PETAL_COUNT_MIN = 8 as const;
export const PETAL_COUNT_MAX = 12 as const;
export const PETAL_LIFETIME_MIN = 0.5 as const;
export const PETAL_LIFETIME_MAX = 0.8 as const;
export const PETAL_GRAVITY = 120 as const;

// Starfield
export const STAR_LAYERS: readonly StarLayerConfig[] = Object.freeze([
  { count: 40, speed: 10, sizeMin: 1, sizeMax: 1, alpha: 0.4 },
  { count: 25, speed: 25, sizeMin: 1, sizeMax: 2, alpha: 0.7 },
  { count: 15, speed: 50, sizeMin: 2, sizeMax: 3, alpha: 1.0 },
] as const);

// UI
export const WAVE_TEXT_DURATION = 1.5 as const;
export const HIGH_SCORE_MAX = 5 as const;

// Game states
export const STATE_MENU = 0 as const;
export const STATE_PLAYING = 1 as const;
export const STATE_GAME_OVER = 2 as const;
export const STATE_HIGH_SCORE = 3 as const;
export const STATE_PAUSED = 4 as const;
export const STATE_MODE_SELECT = 5 as const;
export const STATE_SHOP = 6 as const;
export const STATE_SKILLS = 7 as const;
export const STATE_TUTORIAL = 8 as const;

// Zones & Touch
export const PAUSE_ZONE = Object.freeze({ x: 0, y: 0, width: 60, height: 40 } as const);
export const PLAYER_ZONE_TOP_RATIO = 0.75 as const;
export const TOUCH_DEAD_ZONE = 4 as const;
export const TOUCH_FOLLOW_SPEED = 600 as const;

// Timing
export const GAME_OVER_DELAY = 1.5 as const;
export const MENU_START_DELAY = 3.5 as const;
export const BOSS_WAVE_INTERVAL = 5 as const;
