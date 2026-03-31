import {
  CANVAS_WIDTH,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_SPEED,
  PLAYER_ACCEL,
  PLAYER_DECEL,
  PLAYER_Y_OFFSET,
  CANVAS_HEIGHT,
  INVINCIBILITY_TIME,
  INITIAL_LIVES,
  MAX_BULLETS,
  BULLET_SPEED,
  EXTRA_LIFE_SCORE,
} from '../constants';
import { isMoveLeft, isMoveRight, isFiring, getTouchTargetX, getTouchTargetY, isTouchActive } from '../input';
import { drawCatShip } from '../sprites';
import type { CatSkin } from '../sprites';
import { sfxShoot } from '../audio';
import { getSpreadLevel, getRapidMultiplier, hasShield } from './powerup';
import type { ActiveEffects } from './powerup';
import type { Bullet } from './bullet';

export interface PlayerEntity {
  x: number;
  y: number;
  vx: number;
  readonly width: number;
  readonly height: number;
  lives: number;
  invincibleTimer: number;
  fireTimer: number;
  fireCooldown: number;
  score: number;
  nextLifeAt: number;
  alive: boolean;
  reversedControls?: boolean;
  hitboxMul?: number;
}

export interface EquippedStats {
  readonly speedMul?: number;
  readonly fireRateMul?: number;
  readonly maxBulletBonus?: number;
  readonly bulletSpeedMul?: number;
  readonly pierce?: number;
}

export interface Weapon {
  readonly id: string;
  readonly cooldown: number;
  fire(x: number, y: number, bullets: Bullet[]): void;
}

export interface PlayerBounds {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

const TOUCH_FOLLOW_SPEED = 600; // pixels/sec -- how fast cat follows finger
const TOUCH_DEAD_ZONE = 4; // pixels -- ignore tiny differences

export function createPlayer(lives?: number): PlayerEntity {
  return {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - PLAYER_Y_OFFSET,
    vx: 0,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    lives: lives || INITIAL_LIVES,
    invincibleTimer: 0,
    fireTimer: 0,
    fireCooldown: 0.18,
    score: 0,
    nextLifeAt: EXTRA_LIFE_SCORE,
    alive: true,
  };
}

export function updatePlayer(
  player: PlayerEntity,
  bullets: Bullet[],
  dt: number,
  effects: ActiveEffects | null,
  equippedStats: EquippedStats | null,
  weapon: Weapon | null,
): void {
  const eqSpeedMul = (equippedStats && equippedStats.speedMul) || 1;
  const eqFireMul = (equippedStats && equippedStats.fireRateMul) || 1;
  const halfW = player.width / 2;
  const halfH = player.height / 2;
  const touchX = getTouchTargetX();
  const touchY = getTouchTargetY();

  // Movement zone: bottom third of screen
  const minY = CANVAS_HEIGHT * 0.75;
  const maxY = CANVAS_HEIGHT - halfH - 4;

  if (isTouchActive() && touchX >= 0) {
    // Touch: cat follows finger in both X and Y
    const touchReverse = player.reversedControls ? -1 : 1;
    const diffX = (touchX - player.x) * touchReverse;
    if (Math.abs(diffX) > TOUCH_DEAD_ZONE) {
      const move = Math.sign(diffX) * Math.min(Math.abs(diffX), TOUCH_FOLLOW_SPEED * eqSpeedMul * dt);
      player.x += move;
    }

    if (touchY >= 0) {
      const diffY = touchY - player.y;
      if (Math.abs(diffY) > TOUCH_DEAD_ZONE) {
        const move = Math.sign(diffY) * Math.min(Math.abs(diffY), TOUCH_FOLLOW_SPEED * eqSpeedMul * dt);
        player.y += move;
      }
    }

    player.vx = 0;
  } else {
    // Keyboard: left/right acceleration
    const reversed = player.reversedControls ? -1 : 1;
    let targetVx = 0;
    if (isMoveLeft()) targetVx = -PLAYER_SPEED * eqSpeedMul * reversed;
    if (isMoveRight()) targetVx = PLAYER_SPEED * eqSpeedMul * reversed;

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

  player.x = Math.max(halfW, Math.min(CANVAS_WIDTH - halfW, player.x));
  player.y = Math.max(minY, Math.min(maxY, player.y));

  // Invincibility countdown
  if (player.invincibleTimer > 0) {
    player.invincibleTimer = Math.max(0, player.invincibleTimer - dt);
  }

  // Firing
  const spreadLvl = effects ? getSpreadLevel(effects) : 0;
  const rapidMul = effects ? getRapidMultiplier(effects) : 1;
  const weaponCooldown = weapon ? weapon.cooldown : player.fireCooldown;
  const cooldown = weaponCooldown * rapidMul * eqFireMul;
  const eqMaxBulletBonus = (equippedStats && equippedStats.maxBulletBonus) || 0;
  const maxBullets = MAX_BULLETS + spreadLvl * 2 + eqMaxBulletBonus;
  player.fireTimer = Math.max(0, player.fireTimer - dt);

  if (isFiring() && player.fireTimer <= 0) {
    const activeBullets = bullets.filter((b) => b.active && b.isPlayer).length;
    if (activeBullets < maxBullets) {
      const bulletY = player.y - player.height / 2 - 4;

      const bSpeedMul = (equippedStats && equippedStats.bulletSpeedMul) || 1;
      const bSpeed = BULLET_SPEED * bSpeedMul;
      const pierceCount = (equippedStats && equippedStats.pierce) || 0;

      if (weapon && weapon.id !== 'standard') {
        // Use weapon's custom fire pattern
        weapon.fire(player.x, bulletY, bullets);
      } else {
        // Standard + spread
        bullets.push({ x: player.x, y: bulletY, vx: 0, vy: -bSpeed, active: true, isPlayer: true, pierce: pierceCount });

        for (let s = 1; s <= spreadLvl; s++) {
          const angle = s * 15;
          const vx = Math.sin(angle * Math.PI / 180) * bSpeed;
          const vy = -Math.cos(angle * Math.PI / 180) * bSpeed;
          bullets.push({ x: player.x - s * 4, y: bulletY, vx: -vx, vy, active: true, isPlayer: true, pierce: pierceCount });
          bullets.push({ x: player.x + s * 4, y: bulletY, vx: vx, vy, active: true, isPlayer: true, pierce: pierceCount });
        }
      }

      player.fireTimer = cooldown;
      sfxShoot();
    }
  }

  // Extra life check
  if (player.score >= player.nextLifeAt) {
    player.lives += 1;
    player.nextLifeAt += EXTRA_LIFE_SCORE;
  }
}

export function hitPlayer(player: PlayerEntity): boolean {
  if (player.invincibleTimer > 0) return false;

  player.lives -= 1;
  if (player.lives <= 0) {
    player.alive = false;
  } else {
    player.invincibleTimer = INVINCIBILITY_TIME;
  }
  return true;
}

export function addScore(player: PlayerEntity, points: number): PlayerEntity {
  return { ...player, score: player.score + points };
}

export function renderPlayer(
  ctx: CanvasRenderingContext2D,
  player: PlayerEntity,
  effects: ActiveEffects | null,
  skin: CatSkin | undefined,
): void {
  // Flash during invincibility (blink every 0.1s)
  if (player.invincibleTimer > 0) {
    const blink = Math.floor(player.invincibleTimer / 0.1) % 2;
    if (blink === 1) {
      ctx.globalAlpha = 0.3;
      ctx.save();
      drawCatShip(ctx, player.x, player.y, skin);
      ctx.restore();
      ctx.globalAlpha = 1;
      return;
    }
  }

  // Shield glow -- rings scale with stack count
  if (effects && hasShield(effects)) {
    for (let s = 0; s < effects.shieldHits; s++) {
      ctx.save();
      ctx.globalAlpha = 0.2 + 0.08 * Math.sin(performance.now() / 150 + s);
      ctx.strokeStyle = '#44ff44';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 18 + s * 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawCatShip(ctx, player.x, player.y, skin);
}

export function getPlayerBounds(player: PlayerEntity): PlayerBounds {
  const hm = player.hitboxMul || 1;
  const hw = player.width * hm / 2;
  const hh = player.height * hm / 2;
  return {
    left: player.x - hw,
    right: player.x + hw,
    top: player.y - hh,
    bottom: player.y + hh,
  };
}
