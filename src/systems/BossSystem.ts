/**
 * BossSystem -- Pure logic for boss fights (every 5 waves).
 *
 * Reads/writes state via store (Immer drafts). Emits events via eventBus.
 * No rendering, no DOM.
 *
 * @module systems/BossSystem
 */

import {
  CANVAS_WIDTH,
  ENEMY_BULLET_SPEED,
} from '../constants';

import {
  BOSS_SPAWNED,
  BOSS_HIT,
  BOSS_DEFEATED,
} from '../core/events';

import type { Draft } from 'immer';
import type {
  GameStore,
  IEventBus,
  IBossSystem,
  BossState,
  BossType,
  Bullet,
} from '../types/systems';

// ── Boss constants ────────────────────────────────────────────────────────────

const BOSS_WIDTH = 64;
const BOSS_HEIGHT = 48;
const BASE_HP = 40;
const HP_SCALE = 15;
const BOSS_SPEED = 40;
const BOSS_TARGET_Y = 80;
const ENTER_SPEED = 60;
const DEATH_DURATION = 2.0;

const BOSS_TYPES: readonly BossType[] = [
  { name: 'MEGA_SMISKI', color1: '#88cc88', color2: '#a0e0a0', bulletColor: '#88ee88', petals: 'smiski' },
  { name: 'ULTRA_JELLYCAT', color1: '#cc88cc', color2: '#ddaadd', bulletColor: '#ee88cc', petals: 'jellycat' },
  { name: 'DEATH_TIE', color1: '#556677', color2: '#4488cc', bulletColor: '#ff4444', petals: 'tie' },
];

// ── Attack helpers ────────────────────────────────────────────────────────────

/**
 * Spread shot -- 5 bullets in a fan.
 */
function attackSpread(boss: Draft<BossState>, bullets: Draft<Bullet[]>): void {
  for (let i = -2; i <= 2; i++) {
    const angle = Math.PI / 2 + i * 0.25;
    bullets.push({
      x: boss.x + i * 8,
      y: boss.y + boss.height / 2,
      vx: Math.cos(angle) * ENEMY_BULLET_SPEED * 0.6,
      vy: Math.sin(angle) * ENEMY_BULLET_SPEED,
      isPlayer: false,
    } as Draft<Bullet>);
  }
}

/**
 * Rapid burst -- 3 fast bullets straight down.
 */
function attackRapidBurst(boss: Draft<BossState>, bullets: Draft<Bullet[]>): void {
  for (let i = 0; i < 3; i++) {
    bullets.push({
      x: boss.x + (i - 1) * 16,
      y: boss.y + boss.height / 2,
      vx: 0,
      vy: ENEMY_BULLET_SPEED * 1.3,
      isPlayer: false,
    } as Draft<Bullet>);
  }
}

/**
 * Spiral -- 8 bullets in a ring, offset by boss.time.
 */
function attackSpiral(boss: Draft<BossState>, bullets: Draft<Bullet[]>): void {
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8 + boss.time;
    bullets.push({
      x: boss.x,
      y: boss.y + boss.height / 2,
      vx: Math.cos(angle) * ENEMY_BULLET_SPEED * 0.5,
      vy: Math.sin(angle) * ENEMY_BULLET_SPEED * 0.5 + ENEMY_BULLET_SPEED * 0.4,
      isPlayer: false,
    } as Draft<Bullet>);
  }
}

// Attack intervals per pattern index
const ATTACK_INTERVALS: readonly number[] = [1.2, 0.8, 1.5];

// ── System factory ────────────────────────────────────────────────────────────

/**
 * Creates the boss fight system.
 */
export function createBossSystem(store: GameStore, eventBus: IEventBus): IBossSystem {
  function spawnBoss(wave: number): void {
    store.update((draft) => {
      const bossIndex = Math.floor((wave / 5 - 1) % BOSS_TYPES.length);
      const bossType = BOSS_TYPES[bossIndex] ?? BOSS_TYPES[0]!;
      const hp = BASE_HP + Math.floor(wave / 5) * HP_SCALE;

      draft.combat.boss = {
        active: true,
        x: CANVAS_WIDTH / 2,
        y: -BOSS_HEIGHT,
        targetY: BOSS_TARGET_Y,
        width: BOSS_WIDTH,
        height: BOSS_HEIGHT,
        hp,
        maxHp: hp,
        type: bossType,
        direction: 1,
        speed: BOSS_SPEED,
        phase: 'enter',
        flashTimer: 0,
        attackTimer: 0,
        attackPattern: 0,
        deathTimer: 0,
        time: 0,
      } as Draft<BossState>;
    });

    eventBus.emit(BOSS_SPAWNED, { wave });
  }

  function hitBoss(): boolean {
    const state = store.getState();
    if (!state.combat.boss || state.combat.boss.phase !== 'fight') return false;

    let killed = false;

    store.update((draft) => {
      const b = draft.combat.boss;
      if (!b) return;
      b.hp -= 1;
      b.flashTimer = 0.06;

      if (b.hp <= 0) {
        b.phase = 'dying';
        b.deathTimer = 0;
        killed = true;
      }
    });

    if (killed) {
      eventBus.emit(BOSS_DEFEATED, { boss: store.getState().combat.boss });
    } else {
      eventBus.emit(BOSS_HIT, { hp: store.getState().combat.boss?.hp });
    }

    return killed;
  }

  function update(dt: number): void {
    store.update((draft) => {
      const boss = draft.combat.boss;
      if (!boss || !boss.active) return;

      boss.time += dt;

      if (boss.flashTimer > 0) {
        boss.flashTimer = Math.max(0, boss.flashTimer - dt);
      }

      switch (boss.phase) {
        case 'enter':
          boss.y += ENTER_SPEED * dt;
          if (boss.y >= boss.targetY) {
            boss.y = boss.targetY;
            boss.phase = 'fight';
            boss.attackTimer = 1.0;
          }
          break;

        case 'fight':
          // Side-to-side movement
          boss.x += boss.direction * boss.speed * dt;
          if (boss.x - boss.width / 2 <= 10) {
            boss.direction = 1;
          }
          if (boss.x + boss.width / 2 >= CANVAS_WIDTH - 10) {
            boss.direction = -1;
          }

          // Attack patterns
          boss.attackTimer -= dt;
          if (boss.attackTimer <= 0) {
            boss.attackPattern = (boss.attackPattern + 1) % 3;

            switch (boss.attackPattern) {
              case 0:
                attackSpread(boss, draft.combat.bullets);
                break;
              case 1:
                attackRapidBurst(boss, draft.combat.bullets);
                break;
              case 2:
                attackSpiral(boss, draft.combat.bullets);
                break;
            }

            boss.attackTimer = ATTACK_INTERVALS[boss.attackPattern] ?? 1.0;
          }
          break;

        case 'dying':
          boss.deathTimer += dt;
          if (boss.deathTimer > DEATH_DURATION) {
            boss.active = false;
          }
          break;
      }
    });
  }

  function dispose(): void {
    // No subscriptions to clean up
  }

  return {
    update,
    spawnBoss,
    hitBoss,
    dispose,
  };
}
