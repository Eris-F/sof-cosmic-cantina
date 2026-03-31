/**
 * Preset game states for common test scenarios.
 *
 * Every export is a *partial* state object that gets deep-merged into the
 * current game state via `harness.setState(PRESET_*)`.  Only the slices you
 * provide are touched — the rest stays at whatever value the store holds.
 *
 * Usage:
 *   import { PRESET_RICH_PLAYER } from '../fixtures/presets/states';
 *   await harness.setState(PRESET_RICH_PLAYER);
 *
 * SceneId values (from src/types/game.ts):
 *   'menu' | 'playing' | 'game_over' | 'high_score' | 'paused'
 *   | 'mode_select' | 'shop' | 'skills' | 'tutorial'
 *
 * PlayerState has no separate `health` field — lives is the HP counter.
 */

// ---------------------------------------------------------------------------
// Baseline
// ---------------------------------------------------------------------------

/**
 * Empty partial — applying this is a no-op.
 * Use as a labelled baseline in parameterised tests.
 */
export const PRESET_FRESH: Record<string, unknown> = {};

// ---------------------------------------------------------------------------
// Economy
// ---------------------------------------------------------------------------

/**
 * Player with a very large coin balance — ideal for shop / skill-tree tests
 * where you want purchases to succeed without worrying about affordability.
 */
export const PRESET_RICH_PLAYER: Record<string, unknown> = {
  economy: {
    wallet: {
      coins: 99_999,
      totalEarned: 99_999,
    },
  },
};

/**
 * Player who is completely broke — useful for testing purchase-denied paths.
 */
export const PRESET_BROKE_PLAYER: Record<string, unknown> = {
  economy: {
    wallet: {
      coins: 0,
      totalEarned: 0,
    },
  },
};

// ---------------------------------------------------------------------------
// Mid-game
// ---------------------------------------------------------------------------

/**
 * A typical mid-game snapshot: wave 5, moderate score, some coins banked,
 * and one life already lost.
 *
 * Suitable as a precondition when the exact values don't matter but the game
 * needs to feel "in progress".
 */
export const PRESET_MID_GAME: Record<string, unknown> = {
  scene: 'playing',
  player: {
    lives: 2,
    maxLives: 5,
    alive: true,
    score: 5_000,
  },
  combat: {
    wave: 5,
    isBossWave: false,
  },
  ui: {
    stats: {
      shotsFired: 120,
      shotsHit: 80,
      kills: { smiski: 25, jellycat: 5 },
      timeSurvived: 90,
      powerupsCollected: 3,
      coinsThisGame: 500,
    },
  },
  economy: {
    wallet: {
      coins: 500,
      totalEarned: 500,
    },
  },
};

// ---------------------------------------------------------------------------
// Danger states
// ---------------------------------------------------------------------------

/**
 * One life left, one hit from game-over.
 * Useful for testing death-transition and last-life UI paths.
 */
export const PRESET_NEAR_DEATH: Record<string, unknown> = {
  scene: 'playing',
  player: {
    lives: 1,
    maxLives: 5,
    alive: true,
  },
  combat: {
    wave: 3,
    isBossWave: false,
  },
};

/**
 * Player at full health to verify that healing / max-life caps behave
 * correctly when lives == maxLives.
 */
export const PRESET_FULL_HEALTH: Record<string, unknown> = {
  scene: 'playing',
  player: {
    lives: 5,
    maxLives: 5,
    alive: true,
  },
};

// ---------------------------------------------------------------------------
// Game over
// ---------------------------------------------------------------------------

/**
 * Terminal game-over state: no lives, not alive, parked on the game_over
 * scene with a respectable score.
 */
export const PRESET_GAME_OVER: Record<string, unknown> = {
  scene: 'game_over',
  player: {
    lives: 0,
    alive: false,
    score: 12_500,
  },
  combat: {
    wave: 8,
  },
  ui: {
    gameOver: {
      timer: 0,
    },
    stats: {
      shotsFired: 340,
      shotsHit: 210,
      kills: { smiski: 60, jellycat: 20, tie_fighter: 5 },
      timeSurvived: 320,
      powerupsCollected: 8,
      coinsThisGame: 1_250,
    },
  },
};

// ---------------------------------------------------------------------------
// Boss encounters
// ---------------------------------------------------------------------------

/**
 * Ready to start a boss wave (wave 5, isBossWave flag raised, no active
 * enemies in the grid yet).  Pair with `makeBoss()` to inject a live boss.
 */
export const PRESET_BOSS_WAVE: Record<string, unknown> = {
  scene: 'playing',
  player: {
    lives: 3,
    maxLives: 5,
    alive: true,
  },
  combat: {
    wave: 5,
    isBossWave: true,
    grid: {
      enemies: [],
      speed: 1.5,
      baseSpeed: 1.5,
      direction: 1,
      dropAmount: 8,
      fireMul: 1,
      renderScale: 1,
      ghostFlicker: false,
      fireTimer: 0,
      animFrame: 0,
      animTimer: 0,
      entryTime: 0,
      diveTimer: 0,
      divers: [],
      isEnemyFrozen: false,
      freezeTimer: 0,
    },
    boss: null, // callers should inject a boss via makeBoss()
  },
};

/**
 * Boss already near death (10 HP remaining).
 * Useful for testing the boss-defeat sequence without running the full fight.
 */
export const PRESET_BOSS_LOW_HP: Record<string, unknown> = {
  scene: 'playing',
  combat: {
    wave: 5,
    isBossWave: true,
    boss: {
      active: true,
      x: 240,
      y: 80,
      targetY: 80,
      width: 60,
      height: 60,
      hp: 10,
      maxHp: 100,
      type: {
        name: 'Cactus King',
        color1: '#4CAF50',
        color2: '#8BC34A',
        bulletColor: '#CDDC39',
        petals: '#FF5722',
      },
      direction: 1,
      speed: 1.5,
      phase: 'fight',
      flashTimer: 0,
      attackTimer: 0,
      attackPattern: 0,
      deathTimer: 0,
      time: 0,
    },
  },
};

// ---------------------------------------------------------------------------
// Menu / navigation
// ---------------------------------------------------------------------------

/**
 * Parked on the main menu.  Player state is irrelevant here but kept neutral.
 */
export const PRESET_MENU: Record<string, unknown> = {
  scene: 'menu',
};

/**
 * Parked on the shop scene with enough coins to buy anything.
 */
export const PRESET_SHOP_READY: Record<string, unknown> = {
  scene: 'shop',
  economy: {
    wallet: {
      coins: 10_000,
      totalEarned: 10_000,
    },
  },
  ui: {
    shop: {
      categoryIndex: 0,
      itemIndex: 0,
      scrollOffset: 0,
      flashMessage: null,
      flashTimer: 0,
    },
  },
};

/**
 * Parked on the skill-tree scene with enough coins to buy any skill.
 */
export const PRESET_SKILLS_READY: Record<string, unknown> = {
  scene: 'skills',
  economy: {
    wallet: {
      coins: 10_000,
      totalEarned: 10_000,
    },
  },
  ui: {
    skillTree: {
      selectedBranch: 0,
      flashMessage: null,
      flashTimer: 0,
    },
  },
};

// ---------------------------------------------------------------------------
// Paused
// ---------------------------------------------------------------------------

/**
 * Game paused mid-wave — useful for testing pause-menu interactions.
 */
export const PRESET_PAUSED: Record<string, unknown> = {
  scene: 'paused',
  player: {
    lives: 3,
    maxLives: 5,
    alive: true,
    score: 2_500,
  },
  combat: {
    wave: 3,
    isBossWave: false,
  },
};

// ---------------------------------------------------------------------------
// Active effects
// ---------------------------------------------------------------------------

/**
 * Spread powerup active — player fires in a fan pattern.
 */
export const PRESET_SPREAD_ACTIVE: Record<string, unknown> = {
  scene: 'playing',
  effects: {
    activeEffects: {
      spreadStacks: 1,
      spreadTimer: 300,
      rapidStacks: 0,
      rapidTimer: 0,
      shieldHits: 0,
      ricochetStacks: 0,
      ricochetTimer: 0,
    },
  },
};

/**
 * Shield powerup active — player absorbs next hit.
 */
export const PRESET_SHIELDED: Record<string, unknown> = {
  scene: 'playing',
  effects: {
    activeEffects: {
      spreadStacks: 0,
      spreadTimer: 0,
      rapidStacks: 0,
      rapidTimer: 0,
      shieldHits: 1,
      ricochetStacks: 0,
      ricochetTimer: 0,
    },
  },
};

// ---------------------------------------------------------------------------
// High-score entry
// ---------------------------------------------------------------------------

/**
 * High-score name-entry scene — player just achieved a top score.
 */
export const PRESET_HIGH_SCORE_ENTRY: Record<string, unknown> = {
  scene: 'high_score',
  player: {
    score: 50_000,
  },
  ui: {
    highScore: {
      initials: ['A', 'A', 'A'],
      initialPos: 0,
    },
  },
};

// ---------------------------------------------------------------------------
// Tutorial
// ---------------------------------------------------------------------------

/**
 * Tutorial scene parked on the first page.
 */
export const PRESET_TUTORIAL: Record<string, unknown> = {
  scene: 'tutorial',
  ui: {
    tutorial: {
      page: 0,
    },
  },
};

// ---------------------------------------------------------------------------
// Difficulty variants
// ---------------------------------------------------------------------------

/**
 * Hard difficulty config override — used to test harder difficulty paths.
 */
export const PRESET_HARD_MODE: Record<string, unknown> = {
  config: {
    difficulty: 'hard',
    gameMode: 'classic',
  },
};

/**
 * Endless mode config override.
 */
export const PRESET_ENDLESS_MODE: Record<string, unknown> = {
  config: {
    difficulty: 'normal',
    gameMode: 'endless',
  },
};
