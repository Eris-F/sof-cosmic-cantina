import {
  BULLET_WIDTH,
  BULLET_HEIGHT,
  BARRIER_BLOCK_SIZE,
  ENEMY_WIDTH,
  ENEMY_HEIGHT,
} from '../constants';
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
} from '../core/events';
import type {
  GameStore,
  IEventBus,
  ICollisionSystem,
  CollisionContext,
  Bullet,
  BarrierBlock,
  PlayerState,
  Enemy,
} from '../types/systems';

// ── AABB Overlap ─────────────────────────────────────────────────────────────

/**
 * Axis-aligned bounding box overlap test (center-based).
 */
export function rectsOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): boolean {
  return (
    ax - aw / 2 < bx + bw / 2 &&
    ax + aw / 2 > bx - bw / 2 &&
    ay - ah / 2 < by + bh / 2 &&
    ay + ah / 2 > by - bh / 2
  );
}

/**
 * Returns AABB bounds for the player, accounting for hitboxMul.
 */
function getPlayerBounds(player: PlayerState): {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
} {
  const hm = player.hitboxMul ?? 1;
  const hw = (player.width * hm) / 2;
  const hh = (player.height * hm) / 2;
  return {
    left: player.x - hw,
    right: player.x + hw,
    top: player.y - hh,
    bottom: player.y + hh,
  };
}

/**
 * Check if a bullet overlaps a center-based rect.
 */
function bulletHitsRect(
  bullet: Bullet,
  tx: number, ty: number, tw: number, th: number,
): boolean {
  return rectsOverlap(
    bullet.x, bullet.y, BULLET_WIDTH, BULLET_HEIGHT,
    tx, ty, tw, th,
  );
}

/**
 * Check if a bullet overlaps a top-left-based barrier block.
 * Barrier blocks use top-left (x, y) + size, so we convert to center-based.
 */
function bulletHitsBlock(bullet: Bullet, block: BarrierBlock): boolean {
  const bs = BARRIER_BLOCK_SIZE;
  return (
    bullet.x >= block.x &&
    bullet.x <= block.x + bs &&
    bullet.y >= block.y &&
    bullet.y <= block.y + bs
  );
}

// ── Collision System ─────────────────────────────────────────────────────────

interface CollisionSystemOptions {
  readonly random?: () => number;
}

/**
 * Creates the collision system.
 *
 * ALL collision detection is centralized here.
 */
export function createCollisionSystem(
  store: GameStore,
  eventBus: IEventBus,
  options: CollisionSystemOptions = {},
): ICollisionSystem {
  const random = options.random ?? Math.random;

  return {
    update(_dt: number, context: CollisionContext = {}): void {
      const dodgeChance = context.dodgeChance ?? 0;
      const damageMul = context.damageMul ?? 1;

      store.update((state) => {
        const player = state.player;
        const combat = state.combat;
        const effects = state.effects;
        const bullets = combat.bullets;
        const grid = combat.grid;
        const barriers = combat.barriers;

        // ── Player bullets -> enemies ──────────────────────────────
        for (let bi = bullets.length - 1; bi >= 0; bi--) {
          const b = bullets[bi];
          if (!b || !b.active || !b.isPlayer) continue;

          let bulletConsumed = false;

          for (const enemy of grid.enemies) {
            if (!enemy.alive || enemy.entering) continue;

            const scale = grid.renderScale ?? 1;
            const ew = ENEMY_WIDTH * scale;
            const eh = ENEMY_HEIGHT * scale;

            if (bulletHitsRect(b, enemy.x, enemy.y, ew, eh)) {
              const damage = Math.max(1, Math.round(1 * damageMul));
              enemy.hp -= damage;
              enemy.flashTimer = 0.1;

              eventBus.emit(BULLET_HIT, { x: b.x, y: b.y });
              eventBus.emit(ENEMY_HIT, {
                x: enemy.x, y: enemy.y, hp: enemy.hp, type: enemy.type,
              });

              if (enemy.hp <= 0) {
                enemy.alive = false;
                eventBus.emit(ENEMY_KILLED, {
                  x: enemy.x,
                  y: enemy.y,
                  type: enemy.type,
                  points: enemy.points,
                  elite: enemy.elite,
                  special: enemy.special,
                  wave: combat.wave,
                });

                // Splitter spawns 2 mini enemies
                if (enemy.special === 'splitter') {
                  for (let si = 0; si < 2; si++) {
                    const spawnX = enemy.x + (si === 0 ? -12 : 12);
                    grid.enemies.push({
                      x: spawnX,
                      y: enemy.y,
                      baseX: spawnX,
                      baseY: enemy.y,
                      targetY: enemy.y,
                      entering: false,
                      entryDelay: 0,
                      row: enemy.row,
                      col: enemy.col,
                      type: 'smiski',
                      points: 10,
                      alive: true,
                      flashTimer: 0,
                      elite: false,
                      hp: 1,
                      special: null,
                      pattern: 'lock_step',
                      patternSpeed: 1,
                      patternRadius: 4,
                      patternPhase: 0,
                      moveTime: 0,
                    } as Enemy);
                  }
                }
              }

              // Pierce: bullet survives if pierce > 0
              if (b.pierce != null && b.pierce > 0) {
                b.pierce -= 1;
              } else {
                b.active = false;
                bulletConsumed = true;
              }

              break; // One enemy per bullet per frame (unless pierce)
            }
          }

          if (bulletConsumed) {
            bullets.splice(bi, 1);
            continue;
          }

          // ── Player bullets -> boss ──────────────────────────────
          if (!bulletConsumed && combat.boss && combat.boss.active) {
            const boss = combat.boss;
            if (bulletHitsRect(b, boss.x, boss.y, boss.width, boss.height)) {
              const damage = Math.max(1, Math.round(1 * damageMul));
              boss.hp -= damage;

              eventBus.emit(BULLET_HIT, { x: b.x, y: b.y });
              eventBus.emit(BOSS_HIT, { x: boss.x, y: boss.y, hp: boss.hp });

              if (boss.hp <= 0) {
                boss.active = false;
                eventBus.emit(BOSS_DEFEATED, { x: boss.x, y: boss.y, wave: combat.wave });
              }

              if (b.pierce != null && b.pierce > 0) {
                b.pierce -= 1;
              } else {
                bullets.splice(bi, 1);
              }
              continue;
            }
          }

          // ── Player bullets -> UFO ───────────────────────────────
          if (!bulletConsumed && combat.ufo.active) {
            const ufo = combat.ufo;
            if (bulletHitsRect(b, ufo.x, ufo.y, 32, 18)) {
              ufo.active = false;
              eventBus.emit(UFO_HIT, {
                x: ufo.x, y: ufo.y, scoreValue: ufo.scoreValue,
              });
              bullets.splice(bi, 1);
              continue;
            }
          }

          // ── Player bullets -> barriers ──────────────────────────
          if (!bulletConsumed) {
            let hitBarrier = false;
            for (const group of barriers) {
              if (hitBarrier) break;
              for (const block of group.blocks) {
                if (!block.alive) continue;
                if (bulletHitsBlock(b, block)) {
                  block.hp -= 1;
                  eventBus.emit(BARRIER_HIT, {
                    x: block.x, y: block.y, hp: block.hp, type: block.type,
                  });
                  if (block.hp <= 0) {
                    block.alive = false;
                    eventBus.emit(BARRIER_DESTROYED, {
                      x: block.x + BARRIER_BLOCK_SIZE / 2,
                      y: block.y + BARRIER_BLOCK_SIZE / 2,
                      type: block.type,
                    });
                  }
                  bullets.splice(bi, 1);
                  hitBarrier = true;
                  break;
                }
              }
            }
          }
        }

        // ── Enemy bullets -> barriers ─────────────────────────────
        for (let bi = bullets.length - 1; bi >= 0; bi--) {
          const b = bullets[bi];
          if (!b || b.isPlayer) continue;

          let hitBarrier = false;
          for (const group of barriers) {
            if (hitBarrier) break;
            for (const block of group.blocks) {
              if (!block.alive) continue;
              if (bulletHitsBlock(b, block)) {
                block.hp -= 1;
                eventBus.emit(BARRIER_HIT, {
                  x: block.x, y: block.y, hp: block.hp, type: block.type,
                });
                if (block.hp <= 0) {
                  block.alive = false;
                  eventBus.emit(BARRIER_DESTROYED, {
                    x: block.x + BARRIER_BLOCK_SIZE / 2,
                    y: block.y + BARRIER_BLOCK_SIZE / 2,
                    type: block.type,
                  });
                }
                bullets.splice(bi, 1);
                hitBarrier = true;
                break;
              }
            }
          }
        }

        // ── Enemy bullets -> player ───────────────────────────────
        if (player.alive && player.invincibleTimer <= 0) {
          const pb = getPlayerBounds(player);

          for (let bi = bullets.length - 1; bi >= 0; bi--) {
            const b = bullets[bi];
            if (!b || b.isPlayer) continue;

            const bHalf = BULLET_WIDTH / 2;
            const bHalfH = BULLET_HEIGHT / 2;
            const overlaps =
              b.x - bHalf < pb.right &&
              b.x + bHalf > pb.left &&
              b.y - bHalfH < pb.bottom &&
              b.y + bHalfH > pb.top;

            if (!overlaps) continue;

            // Shield check
            if (effects.activeEffects.shieldHits > 0) {
              effects.activeEffects.shieldHits -= 1;
              bullets.splice(bi, 1);
              continue;
            }

            // Dodge check
            if (dodgeChance > 0 && random() < dodgeChance) {
              bullets.splice(bi, 1);
              continue;
            }

            // Damage player
            combat.hitThisWave = true;
            player.lives -= 1;
            bullets.splice(bi, 1);

            if (player.lives <= 0) {
              player.alive = false;
              eventBus.emit(PLAYER_DEATH, { x: player.x, y: player.y });
            } else {
              player.invincibleTimer = 1.5;
              eventBus.emit(PLAYER_HIT, {
                x: player.x, y: player.y, livesRemaining: player.lives,
              });
            }

            break; // One hit per frame
          }
        }

        // ── Powerup -> player ─────────────────────────────────────
        if (player.alive) {
          const pb = getPlayerBounds(player);

          for (let pi = combat.powerups.length - 1; pi >= 0; pi--) {
            const pu = combat.powerups[pi];
            if (!pu || !pu.alive) continue;

            const overlap =
              pu.x > pb.left &&
              pu.x < pb.right &&
              pu.y > pb.top &&
              pu.y < pb.bottom;

            if (overlap) {
              pu.alive = false;
              eventBus.emit(POWERUP_COLLECTED, {
                x: pu.x, y: pu.y, type: pu.type,
              });
              combat.powerups.splice(pi, 1);
            }
          }
        }

        // ── Hazards -> player ─────────────────────────────────────
        if (player.alive && player.invincibleTimer <= 0) {
          const pb = getPlayerBounds(player);

          for (let hi = combat.hazards.active.length - 1; hi >= 0; hi--) {
            const hz = combat.hazards.active[hi];
            if (!hz) continue;
            const hzW = hz.width ?? 16;
            const hzH = hz.height ?? 16;
            const hzX = hz.x ?? 0;
            const hzY = hz.y ?? 0;

            const overlap =
              hzX - hzW / 2 < pb.right &&
              hzX + hzW / 2 > pb.left &&
              hzY - hzH / 2 < pb.bottom &&
              hzY + hzH / 2 > pb.top;

            if (!overlap) continue;

            // Shield check
            if (effects.activeEffects.shieldHits > 0) {
              effects.activeEffects.shieldHits -= 1;
              combat.hazards.active.splice(hi, 1);
              continue;
            }

            // Dodge check
            if (dodgeChance > 0 && random() < dodgeChance) {
              combat.hazards.active.splice(hi, 1);
              continue;
            }

            // Damage player
            combat.hitThisWave = true;
            player.lives -= 1;
            combat.hazards.active.splice(hi, 1);

            if (player.lives <= 0) {
              player.alive = false;
              eventBus.emit(PLAYER_DEATH, { x: player.x, y: player.y });
            } else {
              player.invincibleTimer = 1.5;
              eventBus.emit(PLAYER_HIT, {
                x: player.x, y: player.y, livesRemaining: player.lives,
              });
            }

            break;
          }
        }

        // ── Enemy grid reaching player Y -> instant death ─────────
        if (player.alive && !combat.isBossWave) {
          const aliveEnemies = grid.enemies.filter((e) => e.alive);
          if (aliveEnemies.length > 0) {
            let lowestY = -Infinity;
            for (const e of aliveEnemies) {
              if (e.y > lowestY) lowestY = e.y;
            }
            if (lowestY >= player.y - 10) {
              player.alive = false;
              player.lives = 0;
              eventBus.emit(ENEMY_REACHED_BOTTOM, {});
              eventBus.emit(PLAYER_DEATH, { x: player.x, y: player.y });
            }
          }
        }
      });
    },

    dispose(): void {
      // No subscriptions to clean up
    },
  };
}
