import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLAYER_SPEED,
  PLAYER_ACCEL,
  PLAYER_DECEL,
  MAX_BULLETS,
  BULLET_SPEED,
  INVINCIBILITY_TIME,
  EXTRA_LIFE_SCORE,
} from '../constants';
import { WEAPON_DEFS } from '../weapons';
import {
  PLAYER_FIRE,
  PLAYER_HIT,
  PLAYER_DEATH,
} from '../core/events';
import type {
  GameStore,
  IEventBus,
  IPlayerSystem,
  PlayerActions,
  Bullet,
  WeaponDef,
} from '../types/systems';

const TOUCH_FOLLOW_SPEED = 600;
const TOUCH_DEAD_ZONE = 4;

/**
 * Resolves the weapon definition for a given weapon id.
 */
function getWeaponDef(weaponId: string): WeaponDef {
  return (WEAPON_DEFS as readonly WeaponDef[]).find((w) => w.id === weaponId) ?? (WEAPON_DEFS[0] as WeaponDef);
}

/**
 * Generates bullet objects for a standard shot (with spread).
 */
function createStandardBullets(
  x: number,
  y: number,
  speed: number,
  spreadLvl: number,
  pierce: number,
): Bullet[] {
  const bullets: Bullet[] = [
    { x, y, vx: 0, vy: -speed, active: true, isPlayer: true, pierce },
  ];

  for (let s = 1; s <= spreadLvl; s++) {
    const angle = s * 15;
    const rad = (angle * Math.PI) / 180;
    const vx = Math.sin(rad) * speed;
    const vy = -Math.cos(rad) * speed;
    bullets.push({
      x: x - s * 4, y, vx: -vx, vy, active: true, isPlayer: true, pierce,
    });
    bullets.push({
      x: x + s * 4, y, vx, vy, active: true, isPlayer: true, pierce,
    });
  }

  return bullets;
}

/**
 * Generates bullet objects for a weapon's fire pattern.
 * Each weapon definition's `fire` pushes into a collector array.
 */
function createWeaponBullets(weaponDef: WeaponDef, x: number, y: number): Bullet[] {
  const collector: Bullet[] = [];
  weaponDef.fire(x, y, collector);
  return collector;
}

/**
 * Creates the player system.
 *
 * Handles movement (keyboard + touch), firing (cooldown, weapon types, spread),
 * damage (invincibility timer), bounds clamping, and hitbox scaling.
 */
export function createPlayerSystem(store: GameStore, eventBus: IEventBus): IPlayerSystem {
  return {
    update(dt: number, actions: PlayerActions): void {
      store.update((state) => {
        const player = state.player;
        if (!player.alive) return;

        const eq = actions.equippedStats ?? {};
        const eqSpeedMul = eq.speedMul ?? 1;
        const eqFireMul = eq.fireRateMul ?? 1;
        const halfW = player.width / 2;
        const halfH = player.height / 2;

        // Movement zone: bottom 25% of canvas
        const minY = CANVAS_HEIGHT * 0.75;
        const maxY = CANVAS_HEIGHT - halfH - 4;

        // --- Movement ---
        if (actions.TOUCH_MOVE) {
          const { x: touchX, y: touchY } = actions.TOUCH_MOVE;
          const touchReverse = player.reversedControls ? -1 : 1;
          const diffX = (touchX - player.x) * touchReverse;

          if (Math.abs(diffX) > TOUCH_DEAD_ZONE) {
            const move = Math.sign(diffX) *
              Math.min(Math.abs(diffX), TOUCH_FOLLOW_SPEED * eqSpeedMul * dt);
            player.x += move;
          }

          if (touchY >= 0) {
            const diffY = touchY - player.y;
            if (Math.abs(diffY) > TOUCH_DEAD_ZONE) {
              const move = Math.sign(diffY) *
                Math.min(Math.abs(diffY), TOUCH_FOLLOW_SPEED * eqSpeedMul * dt);
              player.y += move;
            }
          }

          player.vx = 0;
        } else {
          // Keyboard: acceleration/deceleration
          const reversed = player.reversedControls ? -1 : 1;
          let targetVx = 0;
          if (actions.MOVE_LEFT) targetVx = -PLAYER_SPEED * eqSpeedMul * reversed;
          if (actions.MOVE_RIGHT) targetVx = PLAYER_SPEED * eqSpeedMul * reversed;

          if (targetVx !== 0) {
            if (player.vx < targetVx) {
              player.vx = Math.min(player.vx + PLAYER_ACCEL * dt, targetVx);
            } else if (player.vx > targetVx) {
              player.vx = Math.max(player.vx - PLAYER_ACCEL * dt, targetVx);
            }
          } else {
            if (player.vx > 0) {
              player.vx = Math.max(player.vx - PLAYER_DECEL * dt, 0);
            } else if (player.vx < 0) {
              player.vx = Math.min(player.vx + PLAYER_DECEL * dt, 0);
            }
          }

          player.x += player.vx * dt;
        }

        // Bounds clamping
        player.x = Math.max(halfW, Math.min(CANVAS_WIDTH - halfW, player.x));
        player.y = Math.max(minY, Math.min(maxY, player.y));

        // --- Invincibility countdown ---
        if (player.invincibleTimer > 0) {
          player.invincibleTimer = Math.max(0, player.invincibleTimer - dt);
        }

        // --- Weapon swap ---
        const weapon = player.weapon;
        if (weapon.swapFlash > 0) {
          weapon.swapFlash = Math.max(0, weapon.swapFlash - dt);
        }

        if (actions.WEAPON_SWAP && weapon.slots.length > 1) {
          weapon.activeSlot = (weapon.activeSlot + 1) % weapon.slots.length;
          weapon.swapFlash = 0.5;
        }

        // --- Firing ---
        const activeWeaponId = weapon.slots[weapon.activeSlot] ?? 'standard';
        const weaponDef = getWeaponDef(activeWeaponId);
        const spreadLvl = state.effects.activeEffects.spreadStacks ?? 0;
        const rapidStacks = state.effects.activeEffects.rapidStacks ?? 0;
        const rapidMul = rapidStacks > 0 ? Math.pow(0.6, rapidStacks) : 1;
        const cooldown = weaponDef.cooldown * rapidMul * eqFireMul;

        const eqMaxBulletBonus = eq.maxBulletBonus ?? 0;
        const maxBullets = MAX_BULLETS + spreadLvl * 2 + (typeof eqMaxBulletBonus === 'number' ? eqMaxBulletBonus : 0);

        weapon.cooldownTimer = Math.max(0, weapon.cooldownTimer - dt);

        if (actions.FIRE && weapon.cooldownTimer <= 0) {
          const activeBullets = state.combat.bullets
            .filter((b) => b.active && b.isPlayer).length;

          if (activeBullets < maxBullets) {
            const bulletY = player.y - player.height / 2 - 4;
            const bSpeedMul = eq.bulletSpeedMul ?? 1;
            const bSpeed = BULLET_SPEED * (typeof bSpeedMul === 'number' ? bSpeedMul : 1);
            const pierceCount = eq.pierce ?? 0;

            let newBullets: Bullet[];
            if (activeWeaponId !== 'standard') {
              newBullets = createWeaponBullets(weaponDef, player.x, bulletY);
            } else {
              newBullets = createStandardBullets(
                player.x, bulletY, bSpeed, spreadLvl, typeof pierceCount === 'number' ? pierceCount : 0,
              );
            }

            for (const b of newBullets) {
              state.combat.bullets.push(b);
            }

            weapon.cooldownTimer = cooldown;

            eventBus.emit(PLAYER_FIRE, {
              x: player.x,
              y: bulletY,
              weapon: activeWeaponId,
              bulletCount: newBullets.length,
            });
          }
        }

        // --- Extra life check ---
        if (player.score >= (player._nextLifeAt ?? EXTRA_LIFE_SCORE)) {
          player.lives += 1;
          player._nextLifeAt = (player._nextLifeAt ?? EXTRA_LIFE_SCORE) + EXTRA_LIFE_SCORE;
        }
      });
    },

    applyDamage(): void {
      store.update((state) => {
        const player = state.player;
        if (player.invincibleTimer > 0) return;

        player.lives -= 1;
        state.combat.hitThisWave = true;

        if (player.lives <= 0) {
          player.alive = false;
          eventBus.emit(PLAYER_DEATH, { x: player.x, y: player.y });
        } else {
          player.invincibleTimer = INVINCIBILITY_TIME;
          eventBus.emit(PLAYER_HIT, { x: player.x, y: player.y, livesRemaining: player.lives });
        }
      });
    },

    dispose(): void {
      // No subscriptions to clean up
    },
  };
}
