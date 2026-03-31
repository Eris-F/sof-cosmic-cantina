import { describe, it, expect } from 'vitest';

import {
  PlayerStateSchema,
  BulletSchema,
  WeaponStateSchema,
} from '../../src/schemas/player.schema.js';

import {
  EnemySchema,
  EnemyGridSchema,
  BossSchema,
  BarrierBlockSchema,
  UfoSchema,
  PowerupSchema,
  AsteroidSchema,
  LaserSchema,
  BlackHoleSchema,
  HazardsStateSchema,
  CompanionSchema,
  CompanionsStateSchema,
} from '../../src/schemas/combat.schema.js';

import {
  WalletSchema,
  OwnedSchema,
  EquippedSchema,
  SkillLevelsSchema,
  HighScoreEntrySchema,
  ShopItemSchema,
} from '../../src/schemas/economy.schema.js';

import {
  RegisterRequestSchema,
  LoginRequestSchema,
  GoogleAuthRequestSchema,
  RefreshRequestSchema,
  AuthResponseSchema,
  TokenResponseSchema,
  PlayerInfoSchema,
  BuyRequestSchema,
  EquipRequestSchema,
  ShopResponseSchema,
  EquipResponseSchema,
  UpgradeRequestSchema,
  SkillResponseSchema,
  ScoreSubmitRequestSchema,
  ScoresResponseSchema,
  AchievementUnlockRequestSchema,
  AchievementsResponseSchema,
  FullPlayerStateSchema,
  SyncRequestSchema,
  SyncResponseSchema,
  PlayerMeResponseSchema,
  ErrorResponseSchema,
} from '../../src/schemas/api.schema.js';

import {
  DifficultySchema,
  WeaponDefSchema,
  ModifierDefSchema,
  BalanceConfigSchema,
} from '../../src/schemas/config.schema.js';

// ============================================
// Helpers
// ============================================

/** Expect schema.parse to succeed and return the data. */
function expectValid(schema, data) {
  const result = schema.safeParse(data);
  expect(result.success).toBe(true);
  return result.data;
}

/** Expect schema.parse to fail. */
function expectInvalid(schema, data) {
  const result = schema.safeParse(data);
  expect(result.success).toBe(false);
  return result;
}

// ============================================
// Fixtures
// ============================================

function validPlayer() {
  return {
    x: 240, y: 584, vx: 0, vy: 0,
    width: 32, height: 28,
    lives: 3, maxLives: 3,
    invincibleTimer: 0,
    score: 0, alive: true,
    hitboxMul: 1.0, damageMul: 1.0,
    reversedControls: false,
    weapon: { activeSlot: 0, slots: ['standard', 'spread'], cooldownTimer: 0, swapFlash: 0 },
  };
}

function validBullet() {
  return { x: 240, y: 580, vx: 0, vy: -350, active: true, isPlayer: true };
}

function validEnemy() {
  return {
    x: 100, y: 50, baseX: 100, baseY: 50, targetY: 50,
    entering: false, entryDelay: 0,
    row: 0, col: 0,
    type: 'smiski', hp: 1, alive: true,
    points: 10, flashTimer: 0, elite: false,
    special: null, pattern: 'none',
    patternSpeed: 0, patternRadius: 0, patternPhase: 0,
    moveTime: 0,
  };
}

function validBoss() {
  return {
    active: true, x: 240, y: 80,
    targetY: 80, width: 64, height: 48,
    hp: 40, maxHp: 40,
    type: { name: 'MEGA SMISKI', color1: '#88cc88', color2: '#a0e0a0', bulletColor: '#88ee88', petals: 'smiski' },
    direction: 1, speed: 40, phase: 'fight',
    flashTimer: 0, attackTimer: 1.0, attackPattern: 0,
    deathTimer: 0, time: 0,
  };
}

function validWallet() {
  return { coins: 500, totalEarned: 1200 };
}

function validOwned() {
  return {
    skins: ['default', 'tuxedo'],
    bullets: ['bread'],
    trails: ['none'],
    barriers: ['flowers'],
  };
}

function validEquipped() {
  return { skins: 'default', bullets: 'bread', trails: 'none', barriers: 'flowers' };
}

function validSkills() {
  return { tequila: 2, skiing: 0, diving: 1, photography: 3, music: 0 };
}

function validHighScore() {
  return {
    name: 'SOF', score: 5000, wave: 10,
    difficulty: 'normal', gameMode: 'classic',
    date: '2026-03-30T12:00:00Z',
  };
}

function validPlayerInfo() {
  return {
    player_id: 'abc-123', username: 'sofia',
    email: 'sofia@example.com', auth_provider: 'email',
  };
}

function validFullState() {
  return {
    wallet: validWallet(),
    owned: validOwned(),
    equipped: validEquipped(),
    skills: validSkills(),
    achievements: ['first_blood', 'wave_5'],
    highScores: [validHighScore()],
  };
}

// ============================================
// Player schemas
// ============================================

describe('PlayerStateSchema', () => {
  it('accepts valid player state', () => {
    expectValid(PlayerStateSchema, validPlayer());
  });

  it('accepts optional reversedControls and hitboxMul', () => {
    expectValid(PlayerStateSchema, { ...validPlayer(), reversedControls: true, hitboxMul: 0.85 });
  });

  it('rejects negative lives', () => {
    expectInvalid(PlayerStateSchema, { ...validPlayer(), lives: -1 });
  });

  it('rejects missing required fields', () => {
    expectInvalid(PlayerStateSchema, { x: 240, y: 584 });
  });

  it('rejects non-numeric x', () => {
    expectInvalid(PlayerStateSchema, { ...validPlayer(), x: 'abc' });
  });

  it('rejects NaN values', () => {
    expectInvalid(PlayerStateSchema, { ...validPlayer(), x: NaN });
  });

  it('rejects Infinity values', () => {
    expectInvalid(PlayerStateSchema, { ...validPlayer(), vx: Infinity });
  });

  it('rejects zero width', () => {
    expectInvalid(PlayerStateSchema, { ...validPlayer(), width: 0 });
  });
});

describe('BulletSchema', () => {
  it('accepts valid bullet', () => {
    expectValid(BulletSchema, validBullet());
  });

  it('accepts bullet with pierce', () => {
    expectValid(BulletSchema, { ...validBullet(), pierce: 3 });
  });

  it('rejects negative pierce', () => {
    expectInvalid(BulletSchema, { ...validBullet(), pierce: -1 });
  });

  it('accepts enemy bullets', () => {
    expectValid(BulletSchema, { x: 100, y: 200, vx: 0, vy: 180, active: true, isPlayer: false });
  });
});

describe('WeaponStateSchema', () => {
  it('accepts valid weapon state', () => {
    expectValid(WeaponStateSchema, { activeSlot: 0, slots: ['standard', 'spread'], cooldownTimer: 0, swapFlash: 0 });
  });

  it('rejects invalid activeSlot', () => {
    expectInvalid(WeaponStateSchema, { activeSlot: -1, slots: ['standard'], cooldownTimer: 0, swapFlash: 0 });
  });

  it('rejects slot index out of range', () => {
    expectInvalid(WeaponStateSchema, { activeSlot: -5, slots: ['standard'], cooldownTimer: 0, swapFlash: 0 });
  });
});

// ============================================
// Combat schemas
// ============================================

describe('EnemySchema', () => {
  it('accepts valid enemy', () => {
    expectValid(EnemySchema, validEnemy());
  });

  it('accepts enemy with optional special fields', () => {
    expectValid(EnemySchema, {
      ...validEnemy(),
      special: 'shielded', elite: true, entering: true,
      enterY: -20, flashTimer: 0.1, pattern: 'diamond',
    });
  });

  it('rejects invalid enemy type', () => {
    expectInvalid(EnemySchema, { ...validEnemy(), type: 42 });
  });

  it('rejects missing type', () => {
    const { type, ...noType } = validEnemy();
    expectInvalid(EnemySchema, noType);
  });
});

function validGrid(enemies) {
  return {
    enemies: enemies ?? [validEnemy()],
    speed: 30, direction: 1, dropAmount: 16,
    fireMul: 1.0, fireTimer: 1.5,
    animFrame: 0, animTimer: 0,
    entryTime: 0, diveTimer: 0,
    divers: [],
    isEnemyFrozen: false, freezeTimer: 0,
  };
}

describe('EnemyGridSchema', () => {
  it('accepts valid grid', () => {
    expectValid(EnemyGridSchema, validGrid());
  });

  it('accepts empty enemies array', () => {
    expectValid(EnemyGridSchema, { ...validGrid([]), direction: -1, fireTimer: 1.0 });
  });

  it('rejects direction outside -1..1', () => {
    expectInvalid(EnemyGridSchema, { ...validGrid([]), direction: 2 });
  });
});

describe('BossSchema', () => {
  it('accepts valid boss', () => {
    expectValid(BossSchema, validBoss());
  });

  it('rejects invalid phase', () => {
    expectInvalid(BossSchema, { ...validBoss(), phase: 'idle' });
  });

  it('rejects zero maxHp', () => {
    expectInvalid(BossSchema, { ...validBoss(), maxHp: 0 });
  });

  it('rejects missing type fields', () => {
    expectInvalid(BossSchema, { ...validBoss(), type: { name: 'BOSS' } });
  });
});

describe('BarrierBlockSchema', () => {
  it('accepts tulip block', () => {
    expectValid(BarrierBlockSchema, { x: 100, y: 500, hp: 1, maxHp: 1, type: 'tulip', alive: true });
  });

  it('accepts lily block', () => {
    expectValid(BarrierBlockSchema, { x: 100, y: 500, hp: 2, maxHp: 2, type: 'lily', alive: true });
  });

  it('rejects invalid block type', () => {
    expectInvalid(BarrierBlockSchema, { x: 100, y: 500, hp: 1, maxHp: 1, type: 'oak', alive: true });
  });
});

describe('UfoSchema', () => {
  it('accepts valid UFO', () => {
    expectValid(UfoSchema, {
      active: false, x: 0, y: 28, direction: 1,
      timer: 25, scoreValue: 0, showScoreTimer: 0,
      showScoreX: 0, showScoreValue: 0,
    });
  });

  it('accepts active UFO', () => {
    expectValid(UfoSchema, {
      active: true, x: 200, y: 28, direction: -1,
      timer: 0, scoreValue: 150, showScoreTimer: 1.0,
      showScoreX: 200, showScoreValue: 150,
    });
  });
});

describe('PowerupSchema', () => {
  it('accepts all powerup types', () => {
    const types = ['spread', 'rapid', 'shield', 'bomb', 'ricochet', 'companion'];
    for (const type of types) {
      expectValid(PowerupSchema, { x: 100, y: 200, type, alive: true });
    }
  });

  it('rejects unknown powerup type', () => {
    expectInvalid(PowerupSchema, { x: 100, y: 200, type: 'laser', alive: true });
  });
});

describe('HazardsStateSchema', () => {
  it('accepts empty hazards', () => {
    expectValid(HazardsStateSchema, {
      asteroids: [], lasers: [], blackHoles: [], spawnTimer: 10,
    });
  });

  it('accepts populated hazards', () => {
    expectValid(HazardsStateSchema, {
      asteroids: [{ x: 100, y: 200, vx: 50, vy: 20, size: 10, rotation: 0, rotSpeed: 2 }],
      lasers: [{ x: 200, width: 40, timer: 3, warmup: 1 }],
      blackHoles: [{ x: 300, y: 300, radius: 50, timer: 5 }],
      spawnTimer: 8,
    });
  });

  it('rejects asteroid with zero size', () => {
    expectInvalid(HazardsStateSchema, {
      asteroids: [{ x: 100, y: 200, vx: 50, vy: 20, size: 0, rotation: 0, rotSpeed: 2 }],
      lasers: [], blackHoles: [], spawnTimer: 8,
    });
  });
});

describe('CompanionSchema / CompanionsStateSchema', () => {
  it('accepts valid companion', () => {
    expectValid(CompanionSchema, { id: 0, angle: 1.5, x: 240, y: 570, fireTimer: 0.3 });
  });

  it('accepts companions state with empty cats', () => {
    expectValid(CompanionsStateSchema, { cats: [], nextId: 0 });
  });

  it('accepts companions state with cats', () => {
    expectValid(CompanionsStateSchema, {
      cats: [{ id: 0, angle: 0, x: 250, y: 560, fireTimer: 0.6 }],
      nextId: 1,
    });
  });
});

// ============================================
// Economy schemas
// ============================================

describe('WalletSchema', () => {
  it('accepts valid wallet', () => {
    expectValid(WalletSchema, validWallet());
  });

  it('accepts zero coins', () => {
    expectValid(WalletSchema, { coins: 0, totalEarned: 0 });
  });

  it('rejects negative coins', () => {
    expectInvalid(WalletSchema, { coins: -10, totalEarned: 0 });
  });

  it('rejects float coins', () => {
    expectInvalid(WalletSchema, { coins: 10.5, totalEarned: 0 });
  });
});

describe('OwnedSchema', () => {
  it('accepts valid owned', () => {
    expectValid(OwnedSchema, validOwned());
  });

  it('rejects empty skins array', () => {
    expectInvalid(OwnedSchema, { ...validOwned(), skins: [] });
  });

  it('rejects empty string in array', () => {
    expectInvalid(OwnedSchema, { ...validOwned(), skins: [''] });
  });
});

describe('EquippedSchema', () => {
  it('accepts valid equipped', () => {
    expectValid(EquippedSchema, validEquipped());
  });

  it('rejects empty string value', () => {
    expectInvalid(EquippedSchema, { ...validEquipped(), skins: '' });
  });
});

describe('SkillLevelsSchema', () => {
  it('accepts valid skills', () => {
    expectValid(SkillLevelsSchema, validSkills());
  });

  it('accepts all zeros', () => {
    expectValid(SkillLevelsSchema, { tequila: 0, skiing: 0, diving: 0, photography: 0, music: 0 });
  });

  it('accepts all maxed', () => {
    expectValid(SkillLevelsSchema, { tequila: 5, skiing: 5, diving: 5, photography: 5, music: 5 });
  });

  it('rejects level above 5', () => {
    expectInvalid(SkillLevelsSchema, { ...validSkills(), tequila: 6 });
  });

  it('rejects negative level', () => {
    expectInvalid(SkillLevelsSchema, { ...validSkills(), music: -1 });
  });

  it('rejects missing branch', () => {
    const { music, ...incomplete } = validSkills();
    expectInvalid(SkillLevelsSchema, incomplete);
  });
});

describe('HighScoreEntrySchema', () => {
  it('accepts valid high score', () => {
    expectValid(HighScoreEntrySchema, validHighScore());
  });

  it('rejects name with wrong length', () => {
    expectInvalid(HighScoreEntrySchema, { ...validHighScore(), name: 'AB' });
    expectInvalid(HighScoreEntrySchema, { ...validHighScore(), name: 'ABCD' });
  });

  it('rejects invalid difficulty', () => {
    expectInvalid(HighScoreEntrySchema, { ...validHighScore(), difficulty: 'insane' });
  });

  it('rejects invalid gameMode', () => {
    expectInvalid(HighScoreEntrySchema, { ...validHighScore(), gameMode: 'survival' });
  });

  it('rejects wave 0', () => {
    expectInvalid(HighScoreEntrySchema, { ...validHighScore(), wave: 0 });
  });
});

describe('ShopItemSchema', () => {
  it('accepts valid shop item', () => {
    expectValid(ShopItemSchema, {
      id: 'tuxedo', name: 'TUXEDO', price: 200, category: 'skins',
      desc: 'Dressed for the photo booth', perk: 'SCORE +10%',
      stats: { scoreMul: 1.1 },
    });
  });

  it('accepts free item with empty stats', () => {
    expectValid(ShopItemSchema, {
      id: 'default', name: 'ORANGE TABBY', price: 0, category: 'skins',
      desc: 'The classic cantina cat', perk: 'No bonus', stats: {},
    });
  });

  it('rejects invalid category', () => {
    expectInvalid(ShopItemSchema, {
      id: 'x', name: 'X', price: 0, category: 'weapons',
      desc: '', perk: '', stats: {},
    });
  });
});

// ============================================
// API schemas
// ============================================

describe('Auth request schemas', () => {
  it('RegisterRequestSchema accepts valid data', () => {
    expectValid(RegisterRequestSchema, {
      email: 'test@example.com', username: 'sofia', password: 'securepass1',
    });
  });

  it('RegisterRequestSchema rejects invalid email', () => {
    expectInvalid(RegisterRequestSchema, {
      email: 'not-an-email', username: 'sofia', password: 'securepass1',
    });
  });

  it('RegisterRequestSchema rejects short password', () => {
    expectInvalid(RegisterRequestSchema, {
      email: 'test@example.com', username: 'sofia', password: 'short',
    });
  });

  it('RegisterRequestSchema rejects empty username', () => {
    expectInvalid(RegisterRequestSchema, {
      email: 'test@example.com', username: '', password: 'securepass1',
    });
  });

  it('LoginRequestSchema accepts valid data', () => {
    expectValid(LoginRequestSchema, { email: 'test@example.com', password: 'pass1234' });
  });

  it('GoogleAuthRequestSchema accepts valid token', () => {
    expectValid(GoogleAuthRequestSchema, { id_token: 'eyJhbGciOiJSUzI1NiJ9.test' });
  });

  it('GoogleAuthRequestSchema rejects empty token', () => {
    expectInvalid(GoogleAuthRequestSchema, { id_token: '' });
  });

  it('RefreshRequestSchema accepts valid token', () => {
    expectValid(RefreshRequestSchema, { refresh_token: 'abc-refresh-token-123' });
  });
});

describe('AuthResponseSchema', () => {
  it('accepts valid auth response', () => {
    expectValid(AuthResponseSchema, {
      access_token: 'jwt.access.token',
      refresh_token: 'jwt.refresh.token',
      player: validPlayerInfo(),
    });
  });

  it('rejects missing player', () => {
    expectInvalid(AuthResponseSchema, {
      access_token: 'jwt.access.token',
      refresh_token: 'jwt.refresh.token',
    });
  });

  it('rejects empty access_token', () => {
    expectInvalid(AuthResponseSchema, {
      access_token: '',
      refresh_token: 'jwt.refresh.token',
      player: validPlayerInfo(),
    });
  });
});

describe('TokenResponseSchema', () => {
  it('accepts valid token response', () => {
    expectValid(TokenResponseSchema, { access_token: 'new-jwt-token' });
  });
});

describe('Shop API schemas', () => {
  it('BuyRequestSchema accepts valid buy request', () => {
    expectValid(BuyRequestSchema, { category: 'skins', itemId: 'tuxedo' });
  });

  it('BuyRequestSchema rejects invalid category', () => {
    expectInvalid(BuyRequestSchema, { category: 'weapons', itemId: 'sword' });
  });

  it('EquipRequestSchema accepts valid equip request', () => {
    expectValid(EquipRequestSchema, { category: 'bullets', itemId: 'bread' });
  });

  it('ShopResponseSchema accepts valid shop response', () => {
    expectValid(ShopResponseSchema, {
      wallet: validWallet(),
      owned: validOwned(),
      equipped: validEquipped(),
    });
  });

  it('EquipResponseSchema accepts valid equip response', () => {
    expectValid(EquipResponseSchema, { equipped: validEquipped() });
  });
});

describe('Skill API schemas', () => {
  it('UpgradeRequestSchema accepts valid branch', () => {
    expectValid(UpgradeRequestSchema, { branchId: 'tequila' });
    expectValid(UpgradeRequestSchema, { branchId: 'music' });
  });

  it('UpgradeRequestSchema rejects invalid branch', () => {
    expectInvalid(UpgradeRequestSchema, { branchId: 'cooking' });
  });

  it('SkillResponseSchema accepts valid response', () => {
    expectValid(SkillResponseSchema, {
      wallet: validWallet(),
      skills: validSkills(),
    });
  });
});

describe('Score API schemas', () => {
  it('ScoreSubmitRequestSchema accepts valid submission', () => {
    expectValid(ScoreSubmitRequestSchema, {
      name: 'SOF', score: 5000, wave: 10,
      difficulty: 'hard', gameMode: 'endless',
    });
  });

  it('ScoreSubmitRequestSchema rejects score as float', () => {
    expectInvalid(ScoreSubmitRequestSchema, {
      name: 'SOF', score: 50.5, wave: 10,
      difficulty: 'normal', gameMode: 'classic',
    });
  });

  it('ScoresResponseSchema accepts empty highScores', () => {
    expectValid(ScoresResponseSchema, { highScores: [] });
  });

  it('ScoresResponseSchema accepts populated highScores', () => {
    expectValid(ScoresResponseSchema, { highScores: [validHighScore()] });
  });
});

describe('Achievement API schemas', () => {
  it('AchievementUnlockRequestSchema accepts valid ids', () => {
    expectValid(AchievementUnlockRequestSchema, { achievementIds: ['first_blood', 'wave_5'] });
  });

  it('AchievementUnlockRequestSchema rejects empty array', () => {
    expectInvalid(AchievementUnlockRequestSchema, { achievementIds: [] });
  });

  it('AchievementUnlockRequestSchema rejects empty string id', () => {
    expectInvalid(AchievementUnlockRequestSchema, { achievementIds: [''] });
  });

  it('AchievementsResponseSchema accepts valid response', () => {
    expectValid(AchievementsResponseSchema, { achievements: ['first_blood'] });
  });

  it('AchievementsResponseSchema accepts empty achievements', () => {
    expectValid(AchievementsResponseSchema, { achievements: [] });
  });
});

describe('Sync API schemas', () => {
  it('FullPlayerStateSchema accepts valid full state', () => {
    expectValid(FullPlayerStateSchema, validFullState());
  });

  it('FullPlayerStateSchema rejects missing wallet', () => {
    const { wallet, ...noWallet } = validFullState();
    expectInvalid(FullPlayerStateSchema, noWallet);
  });

  it('SyncRequestSchema accepts valid request', () => {
    expectValid(SyncRequestSchema, { state: validFullState() });
  });

  it('SyncResponseSchema accepts valid response', () => {
    expectValid(SyncResponseSchema, {
      player: validPlayerInfo(),
      state: validFullState(),
    });
  });

  it('PlayerMeResponseSchema accepts valid response', () => {
    expectValid(PlayerMeResponseSchema, {
      player: validPlayerInfo(),
      state: validFullState(),
    });
  });
});

describe('ErrorResponseSchema', () => {
  it('accepts error with detail', () => {
    expectValid(ErrorResponseSchema, { detail: 'Not found' });
  });

  it('rejects missing detail', () => {
    expectInvalid(ErrorResponseSchema, {});
  });

  it('rejects non-string detail', () => {
    expectInvalid(ErrorResponseSchema, { detail: 404 });
  });
});

// ============================================
// Config schemas
// ============================================

describe('DifficultySchema', () => {
  it('accepts valid difficulty', () => {
    expectValid(DifficultySchema, {
      label: 'NORMAL', color: '#ffcc00',
      lives: 3, enemySpeedMul: 1.0, enemyFireMul: 1.0,
      playerSpeedMul: 1.0, scoreMul: 1.0,
    });
  });

  it('rejects invalid hex color', () => {
    expectInvalid(DifficultySchema, {
      label: 'NORMAL', color: 'red',
      lives: 3, enemySpeedMul: 1.0, enemyFireMul: 1.0,
      playerSpeedMul: 1.0, scoreMul: 1.0,
    });
  });

  it('rejects zero lives', () => {
    expectInvalid(DifficultySchema, {
      label: 'NORMAL', color: '#ffcc00',
      lives: 0, enemySpeedMul: 1.0, enemyFireMul: 1.0,
      playerSpeedMul: 1.0, scoreMul: 1.0,
    });
  });

  it('rejects negative speed multiplier', () => {
    expectInvalid(DifficultySchema, {
      label: 'NORMAL', color: '#ffcc00',
      lives: 3, enemySpeedMul: -1, enemyFireMul: 1.0,
      playerSpeedMul: 1.0, scoreMul: 1.0,
    });
  });
});

describe('WeaponDefSchema', () => {
  it('accepts valid weapon def', () => {
    expectValid(WeaponDefSchema, {
      id: 'standard', name: 'STANDARD', desc: 'Single shot',
      cooldown: 0.18, fire: () => {},
    });
  });

  it('rejects missing fire function', () => {
    expectInvalid(WeaponDefSchema, {
      id: 'standard', name: 'STANDARD', desc: 'Single shot',
      cooldown: 0.18,
    });
  });

  it('rejects zero cooldown', () => {
    expectInvalid(WeaponDefSchema, {
      id: 'standard', name: 'STANDARD', desc: 'Single shot',
      cooldown: 0, fire: () => {},
    });
  });
});

describe('ModifierDefSchema', () => {
  it('accepts valid modifier def', () => {
    expectValid(ModifierDefSchema, {
      id: 'fast', name: 'HYPERSPEED', desc: 'Enemies move 2x faster!',
      color: '#ff4444', apply: () => ({ enemySpeedMul: 2.0 }),
    });
  });

  it('rejects invalid color format', () => {
    expectInvalid(ModifierDefSchema, {
      id: 'fast', name: 'HYPERSPEED', desc: 'Enemies move 2x faster!',
      color: '#fff', apply: () => ({}),
    });
  });
});

describe('BalanceConfigSchema', () => {
  const validBalance = {
    canvasWidth: 480, canvasHeight: 640,
    playerWidth: 32, playerHeight: 28,
    playerSpeed: 280, playerAccel: 2800, playerDecel: 2400,
    playerYOffset: 56,
    maxBullets: 3, bulletSpeed: 350, bulletWidth: 4, bulletHeight: 8,
    invincibilityTime: 1.5, initialLives: 3, extraLifeScore: 5000,
    enemyCols: 10, enemyRows: 3,
    enemyWidth: 24, enemyHeight: 20,
    enemyPaddingX: 12, enemyPaddingY: 14,
    enemyBaseSpeed: 30, enemySpeedIncrease: 0.10,
    enemyDrop: 16,
    enemyFireIntervalMin: 0.8, enemyFireIntervalMax: 2.0,
    enemyBulletSpeed: 180,
    pointsSmiski: 10, pointsJellycat: 20, pointsTie: 30,
    pointsUfo: [50, 100, 150, 200],
    ufoWidth: 32, ufoHeight: 18, ufoSpeed: 100,
    ufoSpawnMin: 20, ufoSpawnMax: 30,
    barrierCount: 4, barrierBlockSize: 4, barrierY: 500,
    petalCountMin: 8, petalCountMax: 12,
    petalLifetimeMin: 0.5, petalLifetimeMax: 0.8,
    petalGravity: 120,
    starLayers: [
      { count: 40, speed: 10, sizeMin: 1, sizeMax: 1, alpha: 0.4 },
      { count: 25, speed: 25, sizeMin: 1, sizeMax: 2, alpha: 0.7 },
      { count: 15, speed: 50, sizeMin: 2, sizeMax: 3, alpha: 1.0 },
    ],
    waveTextDuration: 1.5, highScoreMax: 5,
    difficulties: {
      easy: {
        label: 'EASY', color: '#44ff44', lives: 5,
        enemySpeedMul: 0.7, enemyFireMul: 1.5, playerSpeedMul: 1.1, scoreMul: 0.5,
      },
      normal: {
        label: 'NORMAL', color: '#ffcc00', lives: 3,
        enemySpeedMul: 1.0, enemyFireMul: 1.0, playerSpeedMul: 1.0, scoreMul: 1.0,
      },
      hard: {
        label: 'HARD', color: '#ff4444', lives: 2,
        enemySpeedMul: 1.4, enemyFireMul: 0.6, playerSpeedMul: 1.0, scoreMul: 2.0,
      },
    },
  };

  it('accepts valid balance config', () => {
    expectValid(BalanceConfigSchema, validBalance);
  });

  it('rejects missing canvasWidth', () => {
    const { canvasWidth, ...noWidth } = validBalance;
    expectInvalid(BalanceConfigSchema, noWidth);
  });

  it('rejects empty pointsUfo array', () => {
    expectInvalid(BalanceConfigSchema, { ...validBalance, pointsUfo: [] });
  });

  it('rejects empty starLayers', () => {
    expectInvalid(BalanceConfigSchema, { ...validBalance, starLayers: [] });
  });

  it('rejects invalid alpha in star layer', () => {
    expectInvalid(BalanceConfigSchema, {
      ...validBalance,
      starLayers: [{ count: 10, speed: 10, sizeMin: 1, sizeMax: 2, alpha: 1.5 }],
    });
  });

  it('rejects zero maxBullets', () => {
    expectInvalid(BalanceConfigSchema, { ...validBalance, maxBullets: 0 });
  });

  it('rejects negative enemySpeedIncrease', () => {
    expectInvalid(BalanceConfigSchema, { ...validBalance, enemySpeedIncrease: -0.1 });
  });
});

// ============================================
// Edge cases
// ============================================

describe('Edge cases', () => {
  it('PlayerStateSchema boundary: score at zero', () => {
    expectValid(PlayerStateSchema, validPlayer());
  });

  it('WalletSchema boundary: max safe integer coins', () => {
    expectValid(WalletSchema, { coins: Number.MAX_SAFE_INTEGER, totalEarned: Number.MAX_SAFE_INTEGER });
  });

  it('HighScoreEntrySchema boundary: minimum wave 1', () => {
    expectValid(HighScoreEntrySchema, { ...validHighScore(), wave: 1 });
  });

  it('SkillLevelsSchema boundary: all at 0 and all at 5', () => {
    expectValid(SkillLevelsSchema, { tequila: 0, skiing: 0, diving: 0, photography: 0, music: 0 });
    expectValid(SkillLevelsSchema, { tequila: 5, skiing: 5, diving: 5, photography: 5, music: 5 });
  });

  it('BulletSchema: large velocity values', () => {
    expectValid(BulletSchema, { x: 0, y: 0, vx: 99999, vy: -99999, active: true, isPlayer: true });
  });

  it('FullPlayerStateSchema: empty arrays where allowed', () => {
    expectValid(FullPlayerStateSchema, {
      wallet: { coins: 0, totalEarned: 0 },
      owned: { skins: ['default'], bullets: ['bread'], trails: ['none'], barriers: ['flowers'] },
      equipped: { skins: 'default', bullets: 'bread', trails: 'none', barriers: 'flowers' },
      skills: { tequila: 0, skiing: 0, diving: 0, photography: 0, music: 0 },
      achievements: [],
      highScores: [],
    });
  });

  it('rejects completely wrong type passed to schema', () => {
    expectInvalid(PlayerStateSchema, 'not an object');
    expectInvalid(WalletSchema, 42);
    expectInvalid(EnemySchema, null);
    expectInvalid(HighScoreEntrySchema, []);
  });
});
