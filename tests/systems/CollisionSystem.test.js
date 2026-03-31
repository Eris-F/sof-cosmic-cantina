import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGameStore } from '../../src/core/Store.js';
import { EventBus } from '../../src/core/EventBus.js';
import { createCollisionSystem, rectsOverlap } from '../../src/systems/CollisionSystem.js';
import { createInitialState } from '../../src/state/GameState.js';
import {
  ENEMY_HIT,
  ENEMY_KILLED,
  BOSS_HIT,
  BOSS_DEFEATED,
  UFO_HIT,
  PLAYER_HIT,
  PLAYER_DEATH,
  POWERUP_COLLECTED,
  BARRIER_HIT,
  BARRIER_DESTROYED,
  BULLET_HIT,
  ENEMY_REACHED_BOTTOM,
} from '../../src/core/events.js';

/** Helper: create a fresh store + eventBus + system for each test. */
function setup(stateOverrides, options) {
  const store = createGameStore(createInitialState, stateOverrides);
  const eventBus = new EventBus();
  const system = createCollisionSystem(store, eventBus, options);
  return { store, eventBus, system };
}

/** Helper: create a minimal enemy. */
function makeEnemy(overrides = {}) {
  return {
    x: 100, y: 100, alive: true, entering: false, hp: 1,
    flashTimer: 0, type: 'smiski', points: 10, elite: false,
    special: null, row: 0, col: 0, pattern: 'lock_step',
    patternSpeed: 1, patternRadius: 4, patternPhase: 0, moveTime: 0,
    ...overrides,
  };
}

/** Helper: create a minimal bullet. */
function makeBullet(overrides = {}) {
  return {
    x: 100, y: 100, vx: 0, vy: -350, active: true, isPlayer: true, pierce: 0,
    ...overrides,
  };
}

describe('rectsOverlap', () => {
  it('detects overlapping rects', () => {
    expect(rectsOverlap(10, 10, 20, 20, 15, 15, 20, 20)).toBe(true);
  });

  it('returns false for non-overlapping rects', () => {
    expect(rectsOverlap(0, 0, 10, 10, 100, 100, 10, 10)).toBe(false);
  });

  it('returns false for adjacent rects (touching edges)', () => {
    // Rect A: center (5,5), size 10x10 => right edge at 10
    // Rect B: center (15,5), size 10x10 => left edge at 10
    // They share an edge but < check means no overlap
    expect(rectsOverlap(5, 5, 10, 10, 15, 5, 10, 10)).toBe(false);
  });
});

describe('CollisionSystem', () => {
  describe('player bullets -> enemies', () => {
    it('damages and kills an enemy with 1 hp', () => {
      const enemy = makeEnemy({ x: 100, y: 100, hp: 1 });
      const bullet = makeBullet({ x: 100, y: 100 });

      const { store, eventBus, system } = setup({
        combat: {
          ...createInitialState().combat,
          grid: { ...createInitialState().combat.grid, enemies: [enemy] },
          bullets: [bullet],
        },
      });

      const killed = vi.fn();
      eventBus.on(ENEMY_KILLED, killed);

      system.update(0);

      const state = store.getState();
      expect(state.combat.grid.enemies[0].alive).toBe(false);
      expect(killed).toHaveBeenCalledOnce();
      // Bullet should be removed
      expect(state.combat.bullets.length).toBe(0);

      store.destroy();
    });

    it('damages but does not kill an enemy with 2 hp', () => {
      const enemy = makeEnemy({ x: 100, y: 100, hp: 2 });
      const bullet = makeBullet({ x: 100, y: 100 });

      const { store, eventBus, system } = setup({
        combat: {
          ...createInitialState().combat,
          grid: { ...createInitialState().combat.grid, enemies: [enemy] },
          bullets: [bullet],
        },
      });

      const hit = vi.fn();
      const killed = vi.fn();
      eventBus.on(ENEMY_HIT, hit);
      eventBus.on(ENEMY_KILLED, killed);

      system.update(0);

      const state = store.getState();
      expect(state.combat.grid.enemies[0].alive).toBe(true);
      expect(state.combat.grid.enemies[0].hp).toBe(1);
      expect(hit).toHaveBeenCalledOnce();
      expect(killed).not.toHaveBeenCalled();

      store.destroy();
    });

    it('pierce: bullet survives and hits multiple enemies', () => {
      const enemy1 = makeEnemy({ x: 100, y: 100, hp: 1 });
      const enemy2 = makeEnemy({ x: 100, y: 100, hp: 1 });
      const bullet = makeBullet({ x: 100, y: 100, pierce: 1 });

      const { store, eventBus, system } = setup({
        combat: {
          ...createInitialState().combat,
          grid: { ...createInitialState().combat.grid, enemies: [enemy1, enemy2] },
          bullets: [bullet],
        },
      });

      const killed = vi.fn();
      eventBus.on(ENEMY_KILLED, killed);

      // First update: hits enemy1, pierce decrements to 0
      system.update(0);
      expect(store.getState().combat.grid.enemies[0].alive).toBe(false);
      // Bullet still exists (pierce was 1, now 0)
      expect(store.getState().combat.bullets.length).toBe(1);

      // Second update: hits enemy2, pierce is 0 so bullet is consumed
      system.update(0);
      expect(store.getState().combat.grid.enemies[1].alive).toBe(false);
      expect(store.getState().combat.bullets.length).toBe(0);
      expect(killed).toHaveBeenCalledTimes(2);

      store.destroy();
    });

    it('splitter enemy spawns 2 mini enemies on kill', () => {
      const splitter = makeEnemy({ x: 200, y: 100, hp: 1, special: 'splitter' });
      const bullet = makeBullet({ x: 200, y: 100 });

      const { store, system } = setup({
        combat: {
          ...createInitialState().combat,
          grid: { ...createInitialState().combat.grid, enemies: [splitter] },
          bullets: [bullet],
        },
      });

      system.update(0);

      const enemies = store.getState().combat.grid.enemies;
      // Original splitter (dead) + 2 spawned
      expect(enemies.length).toBe(3);
      expect(enemies[1].type).toBe('smiski');
      expect(enemies[2].type).toBe('smiski');
      expect(enemies[1].alive).toBe(true);
      expect(enemies[2].alive).toBe(true);

      store.destroy();
    });
  });

  describe('enemy bullets -> player', () => {
    it('damages player when hit', () => {
      const enemyBullet = {
        x: 240, y: 584, vx: 0, vy: 180, active: true, isPlayer: false,
      };

      const { store, eventBus, system } = setup({
        combat: {
          ...createInitialState().combat,
          bullets: [enemyBullet],
        },
      });

      const hit = vi.fn();
      eventBus.on(PLAYER_HIT, hit);

      system.update(0);

      const state = store.getState();
      expect(state.player.lives).toBe(2); // Started at 3
      expect(state.player.invincibleTimer).toBeGreaterThan(0);
      expect(hit).toHaveBeenCalledOnce();

      store.destroy();
    });

    it('shield blocks enemy bullet', () => {
      const enemyBullet = {
        x: 240, y: 584, vx: 0, vy: 180, active: true, isPlayer: false,
      };

      const baseState = createInitialState();

      const { store, system } = setup({
        combat: { ...baseState.combat, bullets: [enemyBullet] },
        effects: {
          ...baseState.effects,
          activeEffects: { ...baseState.effects.activeEffects, shieldHits: 1 },
        },
      });

      system.update(0);

      const state = store.getState();
      expect(state.player.lives).toBe(3); // Unchanged
      expect(state.effects.activeEffects.shieldHits).toBe(0);
      expect(state.combat.bullets.length).toBe(0);

      store.destroy();
    });

    it('dodge chance can avoid damage', () => {
      const enemyBullet = {
        x: 240, y: 584, vx: 0, vy: 180, active: true, isPlayer: false,
      };

      // RNG always returns 0, which is < any positive dodge chance
      const { store, system } = setup(
        {
          combat: {
            ...createInitialState().combat,
            bullets: [enemyBullet],
          },
        },
        { random: () => 0 },
      );

      system.update(0, { dodgeChance: 0.5 });

      const state = store.getState();
      expect(state.player.lives).toBe(3); // Dodged
      expect(state.combat.bullets.length).toBe(0);

      store.destroy();
    });

    it('player dies when lives reach 0', () => {
      const enemyBullet = {
        x: 240, y: 584, vx: 0, vy: 180, active: true, isPlayer: false,
      };

      const baseState = createInitialState();

      const { store, eventBus, system } = setup({
        player: { ...baseState.player, lives: 1 },
        combat: { ...baseState.combat, bullets: [enemyBullet] },
      });

      const death = vi.fn();
      eventBus.on(PLAYER_DEATH, death);

      system.update(0);

      const state = store.getState();
      expect(state.player.alive).toBe(false);
      expect(death).toHaveBeenCalledOnce();

      store.destroy();
    });
  });

  describe('barrier damage', () => {
    it('player bullet damages barrier block', () => {
      const block = {
        x: 95, y: 95, hp: 2, maxHp: 2, type: 'lily', alive: true,
      };
      const barrier = { blocks: [block], centerX: 100, yOffset: 0, bobPhase: 0 };
      // Bullet positioned inside the block (top-left based: 95-99)
      const bullet = makeBullet({ x: 97, y: 97 });

      const { store, eventBus, system } = setup({
        combat: {
          ...createInitialState().combat,
          barriers: [barrier],
          bullets: [bullet],
          grid: { ...createInitialState().combat.grid, enemies: [] },
        },
      });

      const barrierHit = vi.fn();
      eventBus.on(BARRIER_HIT, barrierHit);

      system.update(0);

      const state = store.getState();
      expect(state.combat.barriers[0].blocks[0].hp).toBe(1);
      expect(state.combat.barriers[0].blocks[0].alive).toBe(true);
      expect(barrierHit).toHaveBeenCalledOnce();
      expect(state.combat.bullets.length).toBe(0);

      store.destroy();
    });

    it('barrier block destroyed when hp reaches 0', () => {
      const block = {
        x: 95, y: 95, hp: 1, maxHp: 1, type: 'tulip', alive: true,
      };
      const barrier = { blocks: [block], centerX: 100, yOffset: 0, bobPhase: 0 };
      const bullet = makeBullet({ x: 97, y: 97 });

      const { store, eventBus, system } = setup({
        combat: {
          ...createInitialState().combat,
          barriers: [barrier],
          bullets: [bullet],
          grid: { ...createInitialState().combat.grid, enemies: [] },
        },
      });

      const destroyed = vi.fn();
      eventBus.on(BARRIER_DESTROYED, destroyed);

      system.update(0);

      const state = store.getState();
      expect(state.combat.barriers[0].blocks[0].alive).toBe(false);
      expect(destroyed).toHaveBeenCalledOnce();

      store.destroy();
    });
  });

  describe('powerup -> player', () => {
    it('picks up powerup when overlapping player', () => {
      const baseState = createInitialState();
      const powerup = {
        x: baseState.player.x,
        y: baseState.player.y,
        type: 'spread',
        alive: true,
      };

      const { store, eventBus, system } = setup({
        combat: {
          ...baseState.combat,
          powerups: [powerup],
        },
      });

      const collected = vi.fn();
      eventBus.on(POWERUP_COLLECTED, collected);

      system.update(0);

      expect(store.getState().combat.powerups.length).toBe(0);
      expect(collected).toHaveBeenCalledOnce();

      store.destroy();
    });
  });

  describe('enemy grid reaching player Y', () => {
    it('kills player instantly when enemies reach player level', () => {
      const baseState = createInitialState();
      const lowEnemy = makeEnemy({
        x: 100,
        y: baseState.player.y - 5, // Within 10px of player
      });

      const { store, eventBus, system } = setup({
        combat: {
          ...baseState.combat,
          grid: { ...baseState.combat.grid, enemies: [lowEnemy] },
        },
      });

      const death = vi.fn();
      eventBus.on(PLAYER_DEATH, death);

      system.update(0);

      const state = store.getState();
      expect(state.player.alive).toBe(false);
      expect(state.player.lives).toBe(0);
      expect(death).toHaveBeenCalledOnce();

      store.destroy();
    });

    it('does not trigger during boss waves', () => {
      const baseState = createInitialState();
      const lowEnemy = makeEnemy({
        x: 100,
        y: baseState.player.y - 5,
      });

      const { store, system } = setup({
        combat: {
          ...baseState.combat,
          isBossWave: true,
          grid: { ...baseState.combat.grid, enemies: [lowEnemy] },
        },
      });

      system.update(0);
      expect(store.getState().player.alive).toBe(true);

      store.destroy();
    });
  });

  describe('boss collision', () => {
    it('player bullet damages boss', () => {
      const boss = {
        x: 240, y: 80, width: 64, height: 48, hp: 10, maxHp: 10, active: true,
        phase: 1, direction: 1, attackTimer: 5, pattern: null,
      };
      const bullet = makeBullet({ x: 240, y: 80 });

      const { store, eventBus, system } = setup({
        combat: {
          ...createInitialState().combat,
          boss,
          isBossWave: true,
          bullets: [bullet],
          grid: { ...createInitialState().combat.grid, enemies: [] },
        },
      });

      const bossHit = vi.fn();
      eventBus.on(BOSS_HIT, bossHit);

      system.update(0);

      expect(store.getState().combat.boss.hp).toBe(9);
      expect(bossHit).toHaveBeenCalledOnce();

      store.destroy();
    });

    it('boss defeated when hp reaches 0', () => {
      const boss = {
        x: 240, y: 80, width: 64, height: 48, hp: 1, maxHp: 10, active: true,
        phase: 1, direction: 1, attackTimer: 5, pattern: null,
      };
      const bullet = makeBullet({ x: 240, y: 80 });

      const { store, eventBus, system } = setup({
        combat: {
          ...createInitialState().combat,
          boss,
          isBossWave: true,
          bullets: [bullet],
          grid: { ...createInitialState().combat.grid, enemies: [] },
        },
      });

      const defeated = vi.fn();
      eventBus.on(BOSS_DEFEATED, defeated);

      system.update(0);

      expect(store.getState().combat.boss.active).toBe(false);
      expect(defeated).toHaveBeenCalledOnce();

      store.destroy();
    });
  });
});
