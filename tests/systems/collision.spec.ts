/**
 * Collision system tests @system:collision
 *
 * Tests every collision pair handled by CollisionSystem.ts:
 *   - Player bullets vs enemies, boss, barriers
 *   - Enemy bullets vs barriers, player
 *   - Player vs powerups, hazards, enemy grid (reached-bottom)
 *   - Edge cases: empty state, invincibility, shield, pierce, splitter
 *
 * Key constants (from src/constants.ts):
 *   BULLET_WIDTH = 4, BULLET_HEIGHT = 8
 *   ENEMY_WIDTH  = 24, ENEMY_HEIGHT  = 20
 *   BARRIER_BLOCK_SIZE = 4
 *   PLAYER_WIDTH = 32, PLAYER_HEIGHT = 28
 *
 * Collision geometry notes from CollisionSystem.ts:
 *   - All entity vs entity: center-based AABB (rectsOverlap)
 *   - Barrier blocks: top-left coords — bullet hits when
 *       bullet.x in [block.x, block.x + 4] AND bullet.y in [block.y, block.y + 4]
 *   - Powerup vs player: strictly inside player bounds (no edge-on match)
 *   - Enemy grid touches player: lowestY >= player.y - 10 → instant death
 *     (only when !isBossWave)
 */

import { test, expect } from '../fixtures/game.fixture';
import { gameExpect } from '../helpers/assertions';
import {
  makeEnemy,
  makeBullet,
  makeEnemyBullet,
  makeBoss,
  makePowerup,
  makeBarrierBlock,
  makeBarrierGroup,
  resetFactoryIds,
} from '../fixtures/presets/factories';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Minimal playing-scene player centred at (240, 400). */
const PLAYER_AT_400 = {
  x: 240,
  y: 400,
  width: 32,
  height: 28,
  lives: 3,
  maxLives: 5,
  alive: true,
  invincibleTimer: 0,
  hitboxMul: 1,
  score: 0,
};

/** Minimal grid state with no enemies (populated per-test). */
function emptyGrid(): Record<string, unknown> {
  return {
    enemies: [],
    speed: 30,
    baseSpeed: 30,
    direction: 1,
    dropAmount: 16,
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
  };
}

test.beforeEach(() => {
  resetFactoryIds();
});

// ===========================================================================
// 1. Bullet-Enemy collisions
// ===========================================================================

test.describe('Bullet-Enemy collisions @system:collision', () => {
  test('player bullet hitting enemy kills it (hp 1)', async ({ harness }) => {
    // Enemy at (100, 200), bullet at same position
    const enemy = makeEnemy({ x: 100, y: 200, hp: 1 });
    const bullet = makeBullet({ x: 100, y: 200, active: true, isPlayer: true, pierce: 0 });

    await harness.setState({
      scene: 'playing',
      player: PLAYER_AT_400,
      combat: {
        isBossWave: true, // prevent grid-reaches-bottom side effect
        grid: { ...emptyGrid(), enemies: [enemy] },
        bullets: [bullet],
        barriers: [],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });

    await harness.tickN(1);

    const state = await harness.getState() as Record<string, Record<string, unknown>>;
    const combat = state['combat'] as Record<string, unknown>;
    const grid = combat['grid'] as Record<string, unknown>;
    const enemies = grid['enemies'] as Array<Record<string, unknown>>;
    expect(enemies[0]?.['alive']).toBe(false);
  });

  test('ENEMY_KILLED event emitted when enemy health reaches 0', async ({ harness }) => {
    const enemy = makeEnemy({ x: 120, y: 150, hp: 1 });
    const bullet = makeBullet({ x: 120, y: 150, active: true, isPlayer: true, pierce: 0 });

    await harness.setState({
      scene: 'playing',
      player: PLAYER_AT_400,
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [enemy] },
        bullets: [bullet],
        barriers: [],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });
    await harness.clearEventLog();
    await harness.tickN(1);

    await gameExpect(harness).toHaveEmitted('enemy:killed');
  });

  test('BULLET_HIT event emitted when bullet contacts enemy', async ({ harness }) => {
    const enemy = makeEnemy({ x: 80, y: 180, hp: 5 });
    const bullet = makeBullet({ x: 80, y: 180, active: true, isPlayer: true, pierce: 0 });

    await harness.setState({
      scene: 'playing',
      player: PLAYER_AT_400,
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [enemy] },
        bullets: [bullet],
        barriers: [],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });
    await harness.clearEventLog();
    await harness.tickN(1);

    await gameExpect(harness).toHaveEmitted('combat:bulletHit');
  });

  test('non-pierce bullet is removed after hitting enemy', async ({ harness }) => {
    const enemy = makeEnemy({ x: 100, y: 200, hp: 5 });
    const bullet = makeBullet({ x: 100, y: 200, active: true, isPlayer: true, pierce: 0 });

    await harness.setState({
      scene: 'playing',
      player: PLAYER_AT_400,
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [enemy] },
        bullets: [bullet],
        barriers: [],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });
    await harness.tickN(1);

    const state = await harness.getState() as Record<string, Record<string, unknown>>;
    const combat = state['combat'] as Record<string, unknown>;
    const bullets = combat['bullets'] as unknown[];
    expect(bullets).toHaveLength(0);
  });

  test('pierce bullet survives after hitting enemy (pierce=2 decrements to 1)', async ({ harness }) => {
    const enemy = makeEnemy({ x: 100, y: 200, hp: 5 });
    const bullet = makeBullet({ x: 100, y: 200, active: true, isPlayer: true, pierce: 2 });

    await harness.setState({
      scene: 'playing',
      player: PLAYER_AT_400,
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [enemy] },
        bullets: [bullet],
        barriers: [],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });
    await harness.tickN(1);

    const state = await harness.getState() as Record<string, Record<string, unknown>>;
    const combat = state['combat'] as Record<string, unknown>;
    const bullets = combat['bullets'] as Array<Record<string, unknown>>;
    // Bullet should still be present (active)
    expect(bullets.length).toBeGreaterThan(0);
    expect(bullets[0]?.['pierce']).toBe(1);
  });

  test('bullet that misses enemy (no overlap) — both survive', async ({ harness }) => {
    // Enemy at (100, 200), bullet far away at (300, 400)
    const enemy = makeEnemy({ x: 100, y: 200, hp: 1 });
    const bullet = makeBullet({ x: 300, y: 400, active: true, isPlayer: true, pierce: 0 });

    await harness.setState({
      scene: 'playing',
      player: PLAYER_AT_400,
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [enemy] },
        bullets: [bullet],
        barriers: [],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });
    await harness.tickN(1);

    const state = await harness.getState() as Record<string, Record<string, unknown>>;
    const combat = state['combat'] as Record<string, unknown>;
    const grid = combat['grid'] as Record<string, unknown>;
    const enemies = grid['enemies'] as Array<Record<string, unknown>>;
    const bullets = combat['bullets'] as Array<Record<string, unknown>>;

    expect(enemies[0]?.['alive']).toBe(true);
    expect(bullets).toHaveLength(1);
  });

  test('dead enemy does not trigger collision', async ({ harness }) => {
    // Enemy already dead — bullet should NOT be consumed
    const enemy = makeEnemy({ x: 100, y: 200, hp: 0, alive: false });
    const bullet = makeBullet({ x: 100, y: 200, active: true, isPlayer: true, pierce: 0 });

    await harness.setState({
      scene: 'playing',
      player: PLAYER_AT_400,
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [enemy] },
        bullets: [bullet],
        barriers: [],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });
    await harness.clearEventLog();
    await harness.tickN(1);

    // No kill event should fire for an already-dead enemy
    await gameExpect(harness).toNotHaveEmitted('enemy:killed');
    // Bullet remains (no enemy to consume it)
    const state = await harness.getState() as Record<string, Record<string, unknown>>;
    const combat = state['combat'] as Record<string, unknown>;
    const bullets = combat['bullets'] as unknown[];
    expect(bullets).toHaveLength(1);
  });

  test('entering enemy does not trigger collision', async ({ harness }) => {
    // Enemy still entering — should not collide
    const enemy = makeEnemy({ x: 100, y: 200, hp: 1, entering: true });
    const bullet = makeBullet({ x: 100, y: 200, active: true, isPlayer: true, pierce: 0 });

    await harness.setState({
      scene: 'playing',
      player: PLAYER_AT_400,
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [enemy] },
        bullets: [bullet],
        barriers: [],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });
    await harness.clearEventLog();
    await harness.tickN(1);

    await gameExpect(harness).toNotHaveEmitted('enemy:killed');
    const state = await harness.getState() as Record<string, Record<string, unknown>>;
    const combat = state['combat'] as Record<string, unknown>;
    const grid = combat['grid'] as Record<string, unknown>;
    const enemies = grid['enemies'] as Array<Record<string, unknown>>;
    expect(enemies[0]?.['alive']).toBe(true);
  });

  test('multi-hp enemy survives partial damage', async ({ harness }) => {
    const enemy = makeEnemy({ x: 100, y: 200, hp: 3 });
    const bullet = makeBullet({ x: 100, y: 200, active: true, isPlayer: true, pierce: 0 });

    await harness.setState({
      scene: 'playing',
      player: PLAYER_AT_400,
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [enemy] },
        bullets: [bullet],
        barriers: [],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });
    await harness.tickN(1);

    const state = await harness.getState() as Record<string, Record<string, unknown>>;
    const combat = state['combat'] as Record<string, unknown>;
    const grid = combat['grid'] as Record<string, unknown>;
    const enemies = grid['enemies'] as Array<Record<string, unknown>>;
    // Enemy takes 1 damage, survives with 2 HP
    expect(enemies[0]?.['alive']).toBe(true);
    expect(enemies[0]?.['hp']).toBe(2);
  });

  test('ENEMY_HIT event emitted even when enemy does not die', async ({ harness }) => {
    const enemy = makeEnemy({ x: 100, y: 200, hp: 5 });
    const bullet = makeBullet({ x: 100, y: 200, active: true, isPlayer: true, pierce: 0 });

    await harness.setState({
      scene: 'playing',
      player: PLAYER_AT_400,
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [enemy] },
        bullets: [bullet],
        barriers: [],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });
    await harness.clearEventLog();
    await harness.tickN(1);

    await gameExpect(harness).toHaveEmitted('enemy:hit');
    await gameExpect(harness).toNotHaveEmitted('enemy:killed');
  });

  test('splitter enemy spawns 2 mini enemies on death', async ({ harness }) => {
    const splitter = makeEnemy({ x: 150, y: 180, hp: 1, special: 'splitter' });
    const bullet = makeBullet({ x: 150, y: 180, active: true, isPlayer: true, pierce: 0 });

    await harness.setState({
      scene: 'playing',
      player: PLAYER_AT_400,
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [splitter] },
        bullets: [bullet],
        barriers: [],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });
    await harness.tickN(1);

    const state = await harness.getState() as Record<string, Record<string, unknown>>;
    const combat = state['combat'] as Record<string, unknown>;
    const grid = combat['grid'] as Record<string, unknown>;
    const enemies = grid['enemies'] as Array<Record<string, unknown>>;
    // Original splitter (dead) + 2 spawned minis
    expect(enemies).toHaveLength(3);
    const miniEnemies = enemies.filter((e) => e['alive'] === true);
    expect(miniEnemies).toHaveLength(2);
  });

  test('bullet at far edge of enemy hitbox (just inside) collides', async ({ harness }) => {
    // Enemy at (100, 200), width=24, height=20 (center-based)
    // Right edge: 100 + 12 = 112. Bullet width=4 so bullet center at 111 overlaps.
    const enemy = makeEnemy({ x: 100, y: 200, hp: 1 });
    // bullet.x=111 → bullet half-width=2 → bullet right=113 > enemy left(88), bullet left=109 < enemy right(112) → overlap
    const bullet = makeBullet({ x: 111, y: 200, active: true, isPlayer: true, pierce: 0 });

    await harness.setState({
      scene: 'playing',
      player: PLAYER_AT_400,
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [enemy] },
        bullets: [bullet],
        barriers: [],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });
    await harness.clearEventLog();
    await harness.tickN(1);

    await gameExpect(harness).toHaveEmitted('enemy:killed');
  });

  test('bullet just outside enemy hitbox does not collide', async ({ harness }) => {
    // Enemy at (100, 200), right edge at 112. Bullet at x=115 → bullet left=113 > enemy right=112 → no overlap
    const enemy = makeEnemy({ x: 100, y: 200, hp: 1 });
    const bullet = makeBullet({ x: 115, y: 200, active: true, isPlayer: true, pierce: 0 });

    await harness.setState({
      scene: 'playing',
      player: PLAYER_AT_400,
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [enemy] },
        bullets: [bullet],
        barriers: [],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });
    await harness.clearEventLog();
    await harness.tickN(1);

    await gameExpect(harness).toNotHaveEmitted('enemy:killed');
  });
});

// ===========================================================================
// 2. Player-Enemy collisions (enemy grid reaching player Y)
// ===========================================================================

test.describe('Enemy grid reaches player @system:collision', () => {
  test('enemy reaching player Y triggers PLAYER_DEATH', async ({ harness }) => {
    // Player at y=400 — enemy at y=391 triggers (391 >= 400-10=390)
    const enemy = makeEnemy({ x: 240, y: 391, hp: 1, entering: false });

    await harness.setState({
      scene: 'playing',
      player: { ...PLAYER_AT_400, lives: 3 },
      combat: {
        isBossWave: false,
        grid: { ...emptyGrid(), enemies: [enemy] },
        bullets: [],
        barriers: [],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });
    await harness.clearEventLog();
    await harness.tickN(1);

    await gameExpect(harness).toHaveEmitted('player:death');
  });

  test('enemy reaching player Y sets player alive=false and lives=0', async ({ harness }) => {
    const enemy = makeEnemy({ x: 240, y: 395, hp: 1 });

    await harness.setState({
      scene: 'playing',
      player: { ...PLAYER_AT_400, lives: 3 },
      combat: {
        isBossWave: false,
        grid: { ...emptyGrid(), enemies: [enemy] },
        bullets: [],
        barriers: [],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });
    await harness.tickN(1);

    const state = await harness.getState() as Record<string, Record<string, unknown>>;
    const player = state['player'] as Record<string, unknown>;
    expect(player['alive']).toBe(false);
    expect(player['lives']).toBe(0);
  });

  test('enemy above player Y threshold does not trigger death', async ({ harness }) => {
    // Enemy at y=350, player at y=400. Threshold = 400 - 10 = 390. 350 < 390 → no death
    const enemy = makeEnemy({ x: 240, y: 350, hp: 1 });

    await harness.setState({
      scene: 'playing',
      player: { ...PLAYER_AT_400, lives: 3 },
      combat: {
        isBossWave: false,
        grid: { ...emptyGrid(), enemies: [enemy] },
        bullets: [],
        barriers: [],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });
    await harness.clearEventLog();
    await harness.tickN(1);

    await gameExpect(harness).toNotHaveEmitted('player:death');
    const state = await harness.getState() as Record<string, Record<string, unknown>>;
    const player = state['player'] as Record<string, unknown>;
    expect(player['alive']).toBe(true);
  });

  test('boss wave flag suppresses enemy-reached-bottom instant death', async ({ harness }) => {
    // isBossWave=true — the grid-reaches-player check is skipped entirely
    const enemy = makeEnemy({ x: 240, y: 450, hp: 1 }); // well past threshold

    await harness.setState({
      scene: 'playing',
      player: { ...PLAYER_AT_400, lives: 3 },
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [enemy] },
        bullets: [],
        barriers: [],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });
    await harness.clearEventLog();
    await harness.tickN(1);

    await gameExpect(harness).toNotHaveEmitted('player:death');
  });

  test('ENEMY_REACHED_BOTTOM event emitted alongside PLAYER_DEATH', async ({ harness }) => {
    const enemy = makeEnemy({ x: 240, y: 395, hp: 1 });

    await harness.setState({
      scene: 'playing',
      player: { ...PLAYER_AT_400, lives: 3 },
      combat: {
        isBossWave: false,
        grid: { ...emptyGrid(), enemies: [enemy] },
        bullets: [],
        barriers: [],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });
    await harness.clearEventLog();
    await harness.tickN(1);

    await gameExpect(harness).toHaveEmitted('enemy:reachedBottom');
  });

  test('only dead enemies in grid do not trigger reached-bottom', async ({ harness }) => {
    // All enemies dead — aliveEnemies.length === 0 → no check runs
    const enemy = makeEnemy({ x: 240, y: 395, hp: 0, alive: false });

    await harness.setState({
      scene: 'playing',
      player: { ...PLAYER_AT_400, lives: 3 },
      combat: {
        isBossWave: false,
        grid: { ...emptyGrid(), enemies: [enemy] },
        bullets: [],
        barriers: [],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });
    await harness.clearEventLog();
    await harness.tickN(1);

    await gameExpect(harness).toNotHaveEmitted('player:death');
  });
});

// ===========================================================================
// 3. Enemy bullet → player collisions
// ===========================================================================

test.describe('Enemy bullet-Player collisions @system:collision', () => {
  test('enemy bullet overlapping player causes PLAYER_HIT', async ({ harness }) => {
    // Player at (240, 400), bullet placed exactly at player center
    const bullet = makeEnemyBullet({ x: 240, y: 400, active: true });

    await harness.setState({
      scene: 'playing',
      player: { ...PLAYER_AT_400, invincibleTimer: 0, lives: 3 },
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [] },
        bullets: [bullet],
        barriers: [],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
      effects: {
        activeEffects: { shieldHits: 0, spreadStacks: 0, spreadTimer: 0, rapidStacks: 0, rapidTimer: 0, ricochetStacks: 0, ricochetTimer: 0 },
      },
    });
    await harness.clearEventLog();
    await harness.tickN(1);

    await gameExpect(harness).toHaveEmitted('player:hit');
  });

  test('player loses a life when hit by enemy bullet', async ({ harness }) => {
    const bullet = makeEnemyBullet({ x: 240, y: 400, active: true });

    await harness.setState({
      scene: 'playing',
      player: { ...PLAYER_AT_400, invincibleTimer: 0, lives: 3 },
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [] },
        bullets: [bullet],
        barriers: [],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
      effects: {
        activeEffects: { shieldHits: 0, spreadStacks: 0, spreadTimer: 0, rapidStacks: 0, rapidTimer: 0, ricochetStacks: 0, ricochetTimer: 0 },
      },
    });
    await harness.tickN(1);

    await gameExpect(harness).toHaveLives(2);
  });

  test('invincible player (invincibleTimer > 0) is not damaged by enemy bullet', async ({ harness }) => {
    const bullet = makeEnemyBullet({ x: 240, y: 400, active: true });

    await harness.setState({
      scene: 'playing',
      // invincibleTimer > 0 → collision block skipped entirely
      player: { ...PLAYER_AT_400, invincibleTimer: 1.0, lives: 3 },
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [] },
        bullets: [bullet],
        barriers: [],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
      effects: {
        activeEffects: { shieldHits: 0, spreadStacks: 0, spreadTimer: 0, rapidStacks: 0, rapidTimer: 0, ricochetStacks: 0, ricochetTimer: 0 },
      },
    });
    await harness.clearEventLog();
    await harness.tickN(1);

    await gameExpect(harness).toNotHaveEmitted('player:hit');
    await gameExpect(harness).toHaveLives(3);
  });

  test('shielded player absorbs enemy bullet (shieldHits decrements)', async ({ harness }) => {
    const bullet = makeEnemyBullet({ x: 240, y: 400, active: true });

    await harness.setState({
      scene: 'playing',
      player: { ...PLAYER_AT_400, invincibleTimer: 0, lives: 3 },
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [] },
        bullets: [bullet],
        barriers: [],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
      effects: {
        activeEffects: { shieldHits: 1, spreadStacks: 0, spreadTimer: 0, rapidStacks: 0, rapidTimer: 0, ricochetStacks: 0, ricochetTimer: 0 },
      },
    });
    await harness.clearEventLog();
    await harness.tickN(1);

    // Shield absorbed → no damage
    await gameExpect(harness).toNotHaveEmitted('player:hit');
    await gameExpect(harness).toHaveLives(3);

    // Shield hits should now be 0
    const state = await harness.getState() as Record<string, Record<string, unknown>>;
    const effects = state['effects'] as Record<string, Record<string, unknown>>;
    expect(effects['activeEffects']?.['shieldHits']).toBe(0);
  });

  test('enemy bullet removed after hitting player', async ({ harness }) => {
    const bullet = makeEnemyBullet({ x: 240, y: 400, active: true });

    await harness.setState({
      scene: 'playing',
      player: { ...PLAYER_AT_400, invincibleTimer: 0, lives: 3 },
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [] },
        bullets: [bullet],
        barriers: [],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
      effects: {
        activeEffects: { shieldHits: 0, spreadStacks: 0, spreadTimer: 0, rapidStacks: 0, rapidTimer: 0, ricochetStacks: 0, ricochetTimer: 0 },
      },
    });
    await harness.tickN(1);

    const state = await harness.getState() as Record<string, Record<string, unknown>>;
    const combat = state['combat'] as Record<string, unknown>;
    const bullets = combat['bullets'] as unknown[];
    expect(bullets).toHaveLength(0);
  });

  test('player last life lost → PLAYER_DEATH not PLAYER_HIT', async ({ harness }) => {
    const bullet = makeEnemyBullet({ x: 240, y: 400, active: true });

    await harness.setState({
      scene: 'playing',
      player: { ...PLAYER_AT_400, invincibleTimer: 0, lives: 1 },
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [] },
        bullets: [bullet],
        barriers: [],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
      effects: {
        activeEffects: { shieldHits: 0, spreadStacks: 0, spreadTimer: 0, rapidStacks: 0, rapidTimer: 0, ricochetStacks: 0, ricochetTimer: 0 },
      },
    });
    await harness.clearEventLog();
    await harness.tickN(1);

    await gameExpect(harness).toHaveEmitted('player:death');
    await gameExpect(harness).toNotHaveEmitted('player:hit');

    const state = await harness.getState() as Record<string, Record<string, unknown>>;
    const player = state['player'] as Record<string, unknown>;
    expect(player['alive']).toBe(false);
  });

  test('enemy bullet misses player (outside bounds) — no damage', async ({ harness }) => {
    // Bullet at (10, 10) — far from player at (240, 400)
    const bullet = makeEnemyBullet({ x: 10, y: 10, active: true });

    await harness.setState({
      scene: 'playing',
      player: { ...PLAYER_AT_400, invincibleTimer: 0, lives: 3 },
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [] },
        bullets: [bullet],
        barriers: [],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
      effects: {
        activeEffects: { shieldHits: 0, spreadStacks: 0, spreadTimer: 0, rapidStacks: 0, rapidTimer: 0, ricochetStacks: 0, ricochetTimer: 0 },
      },
    });
    await harness.clearEventLog();
    await harness.tickN(1);

    await gameExpect(harness).toNotHaveEmitted('player:hit');
    await gameExpect(harness).toHaveLives(3);
  });

  test('hitThisWave flag set true when player takes damage', async ({ harness }) => {
    const bullet = makeEnemyBullet({ x: 240, y: 400, active: true });

    await harness.setState({
      scene: 'playing',
      player: { ...PLAYER_AT_400, invincibleTimer: 0, lives: 3 },
      combat: {
        isBossWave: true,
        hitThisWave: false,
        grid: { ...emptyGrid(), enemies: [] },
        bullets: [bullet],
        barriers: [],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
      effects: {
        activeEffects: { shieldHits: 0, spreadStacks: 0, spreadTimer: 0, rapidStacks: 0, rapidTimer: 0, ricochetStacks: 0, ricochetTimer: 0 },
      },
    });
    await harness.tickN(1);

    const state = await harness.getState() as Record<string, Record<string, unknown>>;
    const combat = state['combat'] as Record<string, unknown>;
    expect(combat['hitThisWave']).toBe(true);
  });
});

// ===========================================================================
// 4. Player bullet → Boss collisions
// ===========================================================================

test.describe('Bullet-Boss collisions @system:collision', () => {
  test('player bullet hitting boss reduces boss HP', async ({ harness }) => {
    const boss = makeBoss({ x: 240, y: 80, width: 60, height: 60, hp: 20, active: true });
    // Bullet at boss center
    const bullet = makeBullet({ x: 240, y: 80, active: true, isPlayer: true, pierce: 0 });

    await harness.setState({
      scene: 'playing',
      player: PLAYER_AT_400,
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [] },
        boss,
        bullets: [bullet],
        barriers: [],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });
    await harness.tickN(1);

    const state = await harness.getState() as Record<string, Record<string, unknown>>;
    const combat = state['combat'] as Record<string, unknown>;
    const bossState = combat['boss'] as Record<string, unknown>;
    expect(bossState['hp']).toBe(19);
  });

  test('BOSS_HIT event emitted when bullet contacts boss', async ({ harness }) => {
    const boss = makeBoss({ x: 240, y: 80, width: 60, height: 60, hp: 10, active: true });
    const bullet = makeBullet({ x: 240, y: 80, active: true, isPlayer: true, pierce: 0 });

    await harness.setState({
      scene: 'playing',
      player: PLAYER_AT_400,
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [] },
        boss,
        bullets: [bullet],
        barriers: [],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });
    await harness.clearEventLog();
    await harness.tickN(1);

    await gameExpect(harness).toHaveEmitted('boss:hit');
  });

  test('boss killed when HP reaches 0 — BOSS_DEFEATED event', async ({ harness }) => {
    const boss = makeBoss({ x: 240, y: 80, width: 60, height: 60, hp: 1, active: true });
    const bullet = makeBullet({ x: 240, y: 80, active: true, isPlayer: true, pierce: 0 });

    await harness.setState({
      scene: 'playing',
      player: PLAYER_AT_400,
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [] },
        boss,
        bullets: [bullet],
        barriers: [],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });
    await harness.clearEventLog();
    await harness.tickN(1);

    await gameExpect(harness).toHaveEmitted('boss:defeated');
  });

  test('boss active=false after being defeated', async ({ harness }) => {
    const boss = makeBoss({ x: 240, y: 80, width: 60, height: 60, hp: 1, active: true });
    const bullet = makeBullet({ x: 240, y: 80, active: true, isPlayer: true, pierce: 0 });

    await harness.setState({
      scene: 'playing',
      player: PLAYER_AT_400,
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [] },
        boss,
        bullets: [bullet],
        barriers: [],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });
    await harness.tickN(1);

    const state = await harness.getState() as Record<string, Record<string, unknown>>;
    const combat = state['combat'] as Record<string, unknown>;
    const bossState = combat['boss'] as Record<string, unknown>;
    expect(bossState['active']).toBe(false);
  });

  test('bullet removed after hitting boss (non-pierce)', async ({ harness }) => {
    const boss = makeBoss({ x: 240, y: 80, width: 60, height: 60, hp: 50, active: true });
    const bullet = makeBullet({ x: 240, y: 80, active: true, isPlayer: true, pierce: 0 });

    await harness.setState({
      scene: 'playing',
      player: PLAYER_AT_400,
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [] },
        boss,
        bullets: [bullet],
        barriers: [],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });
    await harness.tickN(1);

    const state = await harness.getState() as Record<string, Record<string, unknown>>;
    const combat = state['combat'] as Record<string, unknown>;
    const bullets = combat['bullets'] as unknown[];
    expect(bullets).toHaveLength(0);
  });

  test('inactive boss is not hit by bullet', async ({ harness }) => {
    const boss = makeBoss({ x: 240, y: 80, width: 60, height: 60, hp: 50, active: false });
    const bullet = makeBullet({ x: 240, y: 80, active: true, isPlayer: true, pierce: 0 });

    await harness.setState({
      scene: 'playing',
      player: PLAYER_AT_400,
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [] },
        boss,
        bullets: [bullet],
        barriers: [],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });
    await harness.clearEventLog();
    await harness.tickN(1);

    await gameExpect(harness).toNotHaveEmitted('boss:hit');
    // Bullet is not consumed by boss — still present
    const state = await harness.getState() as Record<string, Record<string, unknown>>;
    const combat = state['combat'] as Record<string, unknown>;
    const bullets = combat['bullets'] as unknown[];
    expect(bullets).toHaveLength(1);
  });

  test('bullet missing boss (outside hitbox) does not trigger BOSS_HIT', async ({ harness }) => {
    // Boss at (240, 80) width=60 height=60. Bullet at (400, 300) — far away
    const boss = makeBoss({ x: 240, y: 80, width: 60, height: 60, hp: 50, active: true });
    const bullet = makeBullet({ x: 400, y: 300, active: true, isPlayer: true, pierce: 0 });

    await harness.setState({
      scene: 'playing',
      player: PLAYER_AT_400,
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [] },
        boss,
        bullets: [bullet],
        barriers: [],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });
    await harness.clearEventLog();
    await harness.tickN(1);

    await gameExpect(harness).toNotHaveEmitted('boss:hit');
  });
});

// ===========================================================================
// 5. Player-Powerup collisions
// ===========================================================================

test.describe('Player-Powerup collisions @system:collision', () => {
  test('player overlapping powerup emits POWERUP_COLLECTED', async ({ harness }) => {
    // Player center (240, 400), bounds left=224 right=256 top=386 bottom=414
    // Powerup strictly inside: x=240, y=400
    const powerup = makePowerup({ x: 240, y: 400, type: 'spread', alive: true });

    await harness.setState({
      scene: 'playing',
      player: PLAYER_AT_400,
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [] },
        bullets: [],
        barriers: [],
        powerups: [powerup],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });
    await harness.clearEventLog();
    await harness.tickN(1);

    await gameExpect(harness).toHaveEmitted('powerup:collected');
  });

  test('powerup removed from state after collection', async ({ harness }) => {
    const powerup = makePowerup({ x: 240, y: 400, type: 'rapid', alive: true });

    await harness.setState({
      scene: 'playing',
      player: PLAYER_AT_400,
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [] },
        bullets: [],
        barriers: [],
        powerups: [powerup],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });
    await harness.tickN(1);

    const state = await harness.getState() as Record<string, Record<string, unknown>>;
    const combat = state['combat'] as Record<string, unknown>;
    const powerups = combat['powerups'] as unknown[];
    expect(powerups).toHaveLength(0);
  });

  test('powerup far from player is not collected', async ({ harness }) => {
    // Powerup at (10, 10) — completely outside player bounds at (240, 400)
    const powerup = makePowerup({ x: 10, y: 10, type: 'shield', alive: true });

    await harness.setState({
      scene: 'playing',
      player: PLAYER_AT_400,
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [] },
        bullets: [],
        barriers: [],
        powerups: [powerup],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });
    await harness.clearEventLog();
    await harness.tickN(1);

    await gameExpect(harness).toNotHaveEmitted('powerup:collected');

    const state = await harness.getState() as Record<string, Record<string, unknown>>;
    const combat = state['combat'] as Record<string, unknown>;
    const powerups = combat['powerups'] as unknown[];
    expect(powerups).toHaveLength(1);
  });

  test('each powerup type can be collected: bomb', async ({ harness }) => {
    const powerup = makePowerup({ x: 240, y: 400, type: 'bomb', alive: true });

    await harness.setState({
      scene: 'playing',
      player: PLAYER_AT_400,
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [] },
        bullets: [],
        barriers: [],
        powerups: [powerup],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });
    await harness.clearEventLog();
    await harness.tickN(1);

    const events = await harness.getEvents('powerup:collected');
    expect(events.length).toBeGreaterThan(0);
    const eventData = events[0]?.['data'] as Record<string, unknown> | undefined;
    expect(eventData?.['type']).toBe('bomb');
  });

  test('each powerup type can be collected: ricochet', async ({ harness }) => {
    const powerup = makePowerup({ x: 240, y: 400, type: 'ricochet', alive: true });

    await harness.setState({
      scene: 'playing',
      player: PLAYER_AT_400,
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [] },
        bullets: [],
        barriers: [],
        powerups: [powerup],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });
    await harness.clearEventLog();
    await harness.tickN(1);

    const events = await harness.getEvents('powerup:collected');
    expect(events.length).toBeGreaterThan(0);
    const eventData = events[0]?.['data'] as Record<string, unknown> | undefined;
    expect(eventData?.['type']).toBe('ricochet');
  });

  test('each powerup type can be collected: companion', async ({ harness }) => {
    const powerup = makePowerup({ x: 240, y: 400, type: 'companion', alive: true });

    await harness.setState({
      scene: 'playing',
      player: PLAYER_AT_400,
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [] },
        bullets: [],
        barriers: [],
        powerups: [powerup],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });
    await harness.clearEventLog();
    await harness.tickN(1);

    const events = await harness.getEvents('powerup:collected');
    expect(events.length).toBeGreaterThan(0);
  });

  test('dead powerup (alive=false) is ignored', async ({ harness }) => {
    const powerup = makePowerup({ x: 240, y: 400, type: 'spread', alive: false });

    await harness.setState({
      scene: 'playing',
      player: PLAYER_AT_400,
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [] },
        bullets: [],
        barriers: [],
        powerups: [powerup],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });
    await harness.clearEventLog();
    await harness.tickN(1);

    await gameExpect(harness).toNotHaveEmitted('powerup:collected');
  });
});

// ===========================================================================
// 6. Bullet-Barrier collisions
// ===========================================================================

test.describe('Bullet-Barrier collisions @system:collision', () => {
  test('player bullet hitting barrier block emits BARRIER_HIT', async ({ harness }) => {
    // BarrierBlock uses top-left coords: block at (120, 480), size=4
    // Bullet hits when bullet.x in [120, 124] AND bullet.y in [480, 484]
    const block = makeBarrierBlock({ x: 120, y: 480, hp: 3, alive: true });
    const group = { blocks: [block] };
    // Bullet placed at (121, 481) — inside block
    const bullet = makeBullet({ x: 121, y: 481, active: true, isPlayer: true, pierce: 0 });

    await harness.setState({
      scene: 'playing',
      player: PLAYER_AT_400,
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [] },
        bullets: [bullet],
        barriers: [group],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });
    await harness.clearEventLog();
    await harness.tickN(1);

    await gameExpect(harness).toHaveEmitted('combat:barrierHit');
  });

  test('barrier block hp decrements when hit by player bullet', async ({ harness }) => {
    const block = makeBarrierBlock({ x: 120, y: 480, hp: 3, alive: true });
    const group = { blocks: [block] };
    const bullet = makeBullet({ x: 121, y: 481, active: true, isPlayer: true, pierce: 0 });

    await harness.setState({
      scene: 'playing',
      player: PLAYER_AT_400,
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [] },
        bullets: [bullet],
        barriers: [group],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });
    await harness.tickN(1);

    const state = await harness.getState() as Record<string, Record<string, unknown>>;
    const combat = state['combat'] as Record<string, unknown>;
    const barriers = combat['barriers'] as Array<Record<string, unknown>>;
    const blocks = barriers[0]?.['blocks'] as Array<Record<string, unknown>>;
    expect(blocks[0]?.['hp']).toBe(2);
  });

  test('barrier block destroyed when hp reaches 0 — emits BARRIER_DESTROYED', async ({ harness }) => {
    const block = makeBarrierBlock({ x: 120, y: 480, hp: 1, alive: true });
    const group = { blocks: [block] };
    const bullet = makeBullet({ x: 121, y: 481, active: true, isPlayer: true, pierce: 0 });

    await harness.setState({
      scene: 'playing',
      player: PLAYER_AT_400,
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [] },
        bullets: [bullet],
        barriers: [group],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });
    await harness.clearEventLog();
    await harness.tickN(1);

    await gameExpect(harness).toHaveEmitted('combat:barrierDestroyed');

    const state = await harness.getState() as Record<string, Record<string, unknown>>;
    const combat = state['combat'] as Record<string, unknown>;
    const barriers = combat['barriers'] as Array<Record<string, unknown>>;
    const blocks = barriers[0]?.['blocks'] as Array<Record<string, unknown>>;
    expect(blocks[0]?.['alive']).toBe(false);
  });

  test('player bullet consumed after hitting barrier', async ({ harness }) => {
    const block = makeBarrierBlock({ x: 120, y: 480, hp: 3, alive: true });
    const group = { blocks: [block] };
    const bullet = makeBullet({ x: 121, y: 481, active: true, isPlayer: true, pierce: 0 });

    await harness.setState({
      scene: 'playing',
      player: PLAYER_AT_400,
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [] },
        bullets: [bullet],
        barriers: [group],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });
    await harness.tickN(1);

    const state = await harness.getState() as Record<string, Record<string, unknown>>;
    const combat = state['combat'] as Record<string, unknown>;
    const bullets = combat['bullets'] as unknown[];
    expect(bullets).toHaveLength(0);
  });

  test('enemy bullet hitting barrier reduces block hp', async ({ harness }) => {
    const block = makeBarrierBlock({ x: 200, y: 480, hp: 3, alive: true });
    const group = { blocks: [block] };
    // Enemy bullet placed inside block
    const bullet = makeEnemyBullet({ x: 201, y: 481, active: true });

    await harness.setState({
      scene: 'playing',
      player: { ...PLAYER_AT_400, invincibleTimer: 0 },
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [] },
        bullets: [bullet],
        barriers: [group],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
      effects: {
        activeEffects: { shieldHits: 0, spreadStacks: 0, spreadTimer: 0, rapidStacks: 0, rapidTimer: 0, ricochetStacks: 0, ricochetTimer: 0 },
      },
    });
    await harness.tickN(1);

    const state = await harness.getState() as Record<string, Record<string, unknown>>;
    const combat = state['combat'] as Record<string, unknown>;
    const barriers = combat['barriers'] as Array<Record<string, unknown>>;
    const blocks = barriers[0]?.['blocks'] as Array<Record<string, unknown>>;
    expect(blocks[0]?.['hp']).toBe(2);
  });

  test('dead barrier block ignored by bullets', async ({ harness }) => {
    // Block is dead (alive=false) — should not intercept bullet
    const deadBlock = makeBarrierBlock({ x: 120, y: 480, hp: 0, alive: false });
    const aliveBlock = makeBarrierBlock({ x: 200, y: 480, hp: 3, alive: true });
    const group = { blocks: [deadBlock, aliveBlock] };
    // Bullet aimed at dead block position
    const bullet = makeBullet({ x: 121, y: 481, active: true, isPlayer: true, pierce: 0 });

    await harness.setState({
      scene: 'playing',
      player: PLAYER_AT_400,
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [] },
        bullets: [bullet],
        barriers: [group],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });
    await harness.clearEventLog();
    await harness.tickN(1);

    // Bullet passed through dead block — no barrier:hit should fire for it
    // (alive block at 200 is not hit since bullet at x=121)
    // Bullet should still be present if it missed all alive blocks
    // (no enemies, no boss either)
    const state = await harness.getState() as Record<string, Record<string, unknown>>;
    const combat = state['combat'] as Record<string, unknown>;
    // Dead block hp stays at 0 (unchanged)
    const barriers = combat['barriers'] as Array<Record<string, unknown>>;
    const blocks = barriers[0]?.['blocks'] as Array<Record<string, unknown>>;
    expect(blocks[0]?.['hp']).toBe(0);
    expect(blocks[0]?.['alive']).toBe(false);
  });
});

// ===========================================================================
// 7. Player-Hazard collisions
// ===========================================================================

test.describe('Player-Hazard collisions @system:collision', () => {
  test('hazard overlapping player causes PLAYER_HIT', async ({ harness }) => {
    // Hazard placed at player center with large dimensions
    const hazard = {
      kind: 'asteroid',
      x: 240,
      y: 400,
      vx: 0,
      vy: 0,
      size: 18,
      width: 32,
      height: 32,
      rotation: 0,
      rotSpeed: 0,
    };

    await harness.setState({
      scene: 'playing',
      player: { ...PLAYER_AT_400, invincibleTimer: 0, lives: 3 },
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [] },
        bullets: [],
        barriers: [],
        powerups: [],
        hazards: {
          spawnTimer: 0,
          asteroids: [],
          lasers: [],
          blackHoles: [],
          active: [hazard],
        },
      },
      effects: {
        activeEffects: { shieldHits: 0, spreadStacks: 0, spreadTimer: 0, rapidStacks: 0, rapidTimer: 0, ricochetStacks: 0, ricochetTimer: 0 },
      },
    });
    await harness.clearEventLog();
    await harness.tickN(1);

    await gameExpect(harness).toHaveEmitted('player:hit');
  });

  test('hazard hitting player reduces lives', async ({ harness }) => {
    const hazard = {
      kind: 'asteroid',
      x: 240,
      y: 400,
      vx: 0,
      vy: 0,
      size: 18,
      width: 32,
      height: 32,
      rotation: 0,
      rotSpeed: 0,
    };

    await harness.setState({
      scene: 'playing',
      player: { ...PLAYER_AT_400, invincibleTimer: 0, lives: 3 },
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [] },
        bullets: [],
        barriers: [],
        powerups: [],
        hazards: {
          spawnTimer: 0,
          asteroids: [],
          lasers: [],
          blackHoles: [],
          active: [hazard],
        },
      },
      effects: {
        activeEffects: { shieldHits: 0, spreadStacks: 0, spreadTimer: 0, rapidStacks: 0, rapidTimer: 0, ricochetStacks: 0, ricochetTimer: 0 },
      },
    });
    await harness.tickN(1);

    await gameExpect(harness).toHaveLives(2);
  });

  test('hazard does not damage invincible player', async ({ harness }) => {
    const hazard = {
      kind: 'asteroid',
      x: 240,
      y: 400,
      vx: 0,
      vy: 0,
      size: 18,
      width: 32,
      height: 32,
      rotation: 0,
      rotSpeed: 0,
    };

    await harness.setState({
      scene: 'playing',
      player: { ...PLAYER_AT_400, invincibleTimer: 1.0, lives: 3 },
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [] },
        bullets: [],
        barriers: [],
        powerups: [],
        hazards: {
          spawnTimer: 0,
          asteroids: [],
          lasers: [],
          blackHoles: [],
          active: [hazard],
        },
      },
      effects: {
        activeEffects: { shieldHits: 0, spreadStacks: 0, spreadTimer: 0, rapidStacks: 0, rapidTimer: 0, ricochetStacks: 0, ricochetTimer: 0 },
      },
    });
    await harness.clearEventLog();
    await harness.tickN(1);

    await gameExpect(harness).toNotHaveEmitted('player:hit');
    await gameExpect(harness).toHaveLives(3);
  });

  test('shield absorbs hazard hit (shieldHits decrements, no damage)', async ({ harness }) => {
    const hazard = {
      kind: 'asteroid',
      x: 240,
      y: 400,
      vx: 0,
      vy: 0,
      size: 18,
      width: 32,
      height: 32,
      rotation: 0,
      rotSpeed: 0,
    };

    await harness.setState({
      scene: 'playing',
      player: { ...PLAYER_AT_400, invincibleTimer: 0, lives: 3 },
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [] },
        bullets: [],
        barriers: [],
        powerups: [],
        hazards: {
          spawnTimer: 0,
          asteroids: [],
          lasers: [],
          blackHoles: [],
          active: [hazard],
        },
      },
      effects: {
        activeEffects: { shieldHits: 1, spreadStacks: 0, spreadTimer: 0, rapidStacks: 0, rapidTimer: 0, ricochetStacks: 0, ricochetTimer: 0 },
      },
    });
    await harness.clearEventLog();
    await harness.tickN(1);

    await gameExpect(harness).toNotHaveEmitted('player:hit');
    await gameExpect(harness).toHaveLives(3);

    const state = await harness.getState() as Record<string, Record<string, unknown>>;
    const effects = state['effects'] as Record<string, Record<string, unknown>>;
    expect(effects['activeEffects']?.['shieldHits']).toBe(0);
  });

  test('hazard removed from active list after hitting player', async ({ harness }) => {
    const hazard = {
      kind: 'asteroid',
      x: 240,
      y: 400,
      vx: 0,
      vy: 0,
      size: 18,
      width: 32,
      height: 32,
      rotation: 0,
      rotSpeed: 0,
    };

    await harness.setState({
      scene: 'playing',
      player: { ...PLAYER_AT_400, invincibleTimer: 0, lives: 3 },
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [] },
        bullets: [],
        barriers: [],
        powerups: [],
        hazards: {
          spawnTimer: 0,
          asteroids: [],
          lasers: [],
          blackHoles: [],
          active: [hazard],
        },
      },
      effects: {
        activeEffects: { shieldHits: 0, spreadStacks: 0, spreadTimer: 0, rapidStacks: 0, rapidTimer: 0, ricochetStacks: 0, ricochetTimer: 0 },
      },
    });
    await harness.tickN(1);

    const state = await harness.getState() as Record<string, Record<string, unknown>>;
    const combat = state['combat'] as Record<string, unknown>;
    const hazards = combat['hazards'] as Record<string, unknown>;
    const active = hazards['active'] as unknown[];
    expect(active).toHaveLength(0);
  });
});

// ===========================================================================
// 8. Edge cases
// ===========================================================================

test.describe('Edge cases @system:collision', () => {
  test('empty combat state — no entities — no crash', async ({ harness }) => {
    await harness.setState({
      scene: 'playing',
      player: PLAYER_AT_400,
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [] },
        bullets: [],
        barriers: [],
        powerups: [],
        boss: null,
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });

    // Should complete without throwing
    await harness.tickN(5);
    await gameExpect(harness).toHaveNoErrors();
  });

  test('entity at exact same position as player — collision detected correctly', async ({ harness }) => {
    // Enemy bullet at player exact center
    const bullet = makeEnemyBullet({ x: 240, y: 400 });

    await harness.setState({
      scene: 'playing',
      player: { ...PLAYER_AT_400, invincibleTimer: 0, lives: 3 },
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [] },
        bullets: [bullet],
        barriers: [],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
      effects: {
        activeEffects: { shieldHits: 0, spreadStacks: 0, spreadTimer: 0, rapidStacks: 0, rapidTimer: 0, ricochetStacks: 0, ricochetTimer: 0 },
      },
    });
    await harness.clearEventLog();
    await harness.tickN(1);

    await gameExpect(harness).toHaveEmitted('player:hit');
  });

  test('many simultaneous enemy bullets in one frame — only one hits (one hit per frame)', async ({ harness }) => {
    // CollisionSystem breaks after one hit per frame
    const bullets = Array.from({ length: 5 }, () =>
      makeEnemyBullet({ x: 240, y: 400, active: true }),
    );

    await harness.setState({
      scene: 'playing',
      player: { ...PLAYER_AT_400, invincibleTimer: 0, lives: 3 },
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [] },
        bullets,
        barriers: [],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
      effects: {
        activeEffects: { shieldHits: 0, spreadStacks: 0, spreadTimer: 0, rapidStacks: 0, rapidTimer: 0, ricochetStacks: 0, ricochetTimer: 0 },
      },
    });
    await harness.tickN(1);

    // Only 1 life deducted (one hit per frame)
    await gameExpect(harness).toHaveLives(2);
  });

  test('invincibility prevents damage from all sources in one frame', async ({ harness }) => {
    const enemyBullet = makeEnemyBullet({ x: 240, y: 400, active: true });
    const hazard = {
      kind: 'asteroid',
      x: 240,
      y: 400,
      vx: 0,
      vy: 0,
      size: 18,
      width: 32,
      height: 32,
      rotation: 0,
      rotSpeed: 0,
    };

    await harness.setState({
      scene: 'playing',
      player: { ...PLAYER_AT_400, invincibleTimer: 2.0, lives: 3 },
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [] },
        bullets: [enemyBullet],
        barriers: [],
        powerups: [],
        hazards: {
          spawnTimer: 0,
          asteroids: [],
          lasers: [],
          blackHoles: [],
          active: [hazard],
        },
      },
      effects: {
        activeEffects: { shieldHits: 0, spreadStacks: 0, spreadTimer: 0, rapidStacks: 0, rapidTimer: 0, ricochetStacks: 0, ricochetTimer: 0 },
      },
    });
    await harness.clearEventLog();
    await harness.tickN(1);

    await gameExpect(harness).toNotHaveEmitted('player:hit');
    await gameExpect(harness).toNotHaveEmitted('player:death');
    await gameExpect(harness).toHaveLives(3);
  });

  test('player bullet at canvas boundary (x=0, y=0) does not crash', async ({ harness }) => {
    const bullet = makeBullet({ x: 0, y: 0, active: true, isPlayer: true, pierce: 0 });

    await harness.setState({
      scene: 'playing',
      player: PLAYER_AT_400,
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [] },
        bullets: [bullet],
        barriers: [],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });

    await harness.tickN(1);
    await gameExpect(harness).toHaveNoErrors();
  });

  test('player bullet at max canvas boundary does not crash', async ({ harness }) => {
    const bullet = makeBullet({ x: 480, y: 640, active: true, isPlayer: true, pierce: 0 });

    await harness.setState({
      scene: 'playing',
      player: PLAYER_AT_400,
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [] },
        bullets: [bullet],
        barriers: [],
        powerups: [],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });

    await harness.tickN(1);
    await gameExpect(harness).toHaveNoErrors();
  });

  test('multiple simultaneous collisions in one frame — enemies, boss, powerup all resolve', async ({ harness }) => {
    const enemy = makeEnemy({ x: 100, y: 100, hp: 1 });
    const boss = makeBoss({ x: 240, y: 60, width: 60, height: 60, hp: 1, active: true });
    const powerup = makePowerup({ x: 240, y: 400, type: 'spread', alive: true });

    const bulletForEnemy = makeBullet({ x: 100, y: 100, active: true, isPlayer: true, pierce: 0 });
    const bulletForBoss = makeBullet({ x: 240, y: 60, active: true, isPlayer: true, pierce: 0 });

    await harness.setState({
      scene: 'playing',
      player: { ...PLAYER_AT_400, invincibleTimer: 0 },
      combat: {
        isBossWave: true,
        grid: { ...emptyGrid(), enemies: [enemy] },
        boss,
        bullets: [bulletForEnemy, bulletForBoss],
        barriers: [],
        powerups: [powerup],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
    });
    await harness.clearEventLog();
    await harness.tickN(1);

    await gameExpect(harness).toHaveEmitted('enemy:killed');
    await gameExpect(harness).toHaveEmitted('boss:defeated');
    await gameExpect(harness).toHaveEmitted('powerup:collected');
  });

  test('no JS errors after 10 ticks of active combat', async ({ harness }) => {
    const enemies = [
      makeEnemy({ x: 80, y: 100, hp: 2 }),
      makeEnemy({ x: 160, y: 100, hp: 2 }),
      makeEnemy({ x: 240, y: 100, hp: 2 }),
    ];
    const bullets = [
      makeBullet({ x: 80, y: 100, active: true, isPlayer: true, pierce: 0 }),
      makeBullet({ x: 160, y: 100, active: true, isPlayer: true, pierce: 0 }),
    ];

    await harness.setState({
      scene: 'playing',
      player: { ...PLAYER_AT_400, invincibleTimer: 0, lives: 3 },
      combat: {
        isBossWave: false,
        grid: { ...emptyGrid(), enemies },
        bullets,
        barriers: [makeBarrierGroup()],
        powerups: [makePowerup({ x: 240, y: 400, alive: true })],
        hazards: { spawnTimer: 0, asteroids: [], lasers: [], blackHoles: [], active: [] },
      },
      effects: {
        activeEffects: { shieldHits: 0, spreadStacks: 0, spreadTimer: 0, rapidStacks: 0, rapidTimer: 0, ricochetStacks: 0, ricochetTimer: 0 },
      },
    });

    await harness.tickN(10);
    await gameExpect(harness).toHaveNoErrors();
  });
});
