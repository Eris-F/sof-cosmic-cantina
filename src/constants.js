export const CANVAS_WIDTH = 480;
export const CANVAS_HEIGHT = 640;
export const SCALE = 1;

// Player
export const PLAYER_WIDTH = 32;
export const PLAYER_HEIGHT = 28;
export const PLAYER_SPEED = 280;
export const PLAYER_ACCEL = 2800;
export const PLAYER_DECEL = 2400;
export const PLAYER_Y_OFFSET = 56;
export const MAX_BULLETS = 3;
export const BULLET_SPEED = 350;
export const BULLET_WIDTH = 4;
export const BULLET_HEIGHT = 8;
export const INVINCIBILITY_TIME = 1.5;
export const INITIAL_LIVES = 3;
export const EXTRA_LIFE_SCORE = 5000;

// Enemies
export const ENEMY_COLS = 10;
export const ENEMY_ROWS = 3;
export const ENEMY_WIDTH = 24;
export const ENEMY_HEIGHT = 20;
export const ENEMY_PADDING_X = 12;
export const ENEMY_PADDING_Y = 14;
export const ENEMY_BASE_SPEED = 30;
export const ENEMY_SPEED_INCREASE = 0.10;
export const ENEMY_DROP = 16;
export const ENEMY_FIRE_INTERVAL_MIN = 0.8;
export const ENEMY_FIRE_INTERVAL_MAX = 2.0;
export const ENEMY_BULLET_SPEED = 180;

// Points (base values, multiplied by wave)
export const POINTS_SMISKI = 10;
export const POINTS_JELLYCAT = 20;
export const POINTS_TIE = 30;
export const POINTS_UFO = [50, 100, 150, 200];

// UFO
export const UFO_WIDTH = 32;
export const UFO_HEIGHT = 18;
export const UFO_SPEED = 100;
export const UFO_SPAWN_MIN = 20;
export const UFO_SPAWN_MAX = 30;

// Barriers
export const BARRIER_COUNT = 4;
export const BARRIER_BLOCK_SIZE = 4;
export const BARRIER_Y = 500;

// Particles
export const PETAL_COUNT_MIN = 8;
export const PETAL_COUNT_MAX = 12;
export const PETAL_LIFETIME_MIN = 0.5;
export const PETAL_LIFETIME_MAX = 0.8;
export const PETAL_GRAVITY = 120;

// Starfield
export const STAR_LAYERS = [
  { count: 40, speed: 10, sizeMin: 1, sizeMax: 1, alpha: 0.4 },
  { count: 25, speed: 25, sizeMin: 1, sizeMax: 2, alpha: 0.7 },
  { count: 15, speed: 50, sizeMin: 2, sizeMax: 3, alpha: 1.0 },
];

// UI
export const WAVE_TEXT_DURATION = 1.5;
export const HIGH_SCORE_MAX = 5;

// Game states
export const STATE_MENU = 0;
export const STATE_PLAYING = 1;
export const STATE_GAME_OVER = 2;
export const STATE_HIGH_SCORE = 3;
export const STATE_PAUSED = 4;
export const STATE_MODE_SELECT = 5;
export const STATE_SHOP = 6;
export const STATE_SKILLS = 7;
export const STATE_TUTORIAL = 8;
