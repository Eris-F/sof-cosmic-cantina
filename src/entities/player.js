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
} from '../constants.js';
import { isMoveLeft, isMoveRight, isFiring, getTouchTargetX, getTouchTargetY, isTouchActive } from '../input.js';
import { drawCatShip } from '../sprites.js';
import { sfxShoot } from '../audio.js';
import { getSpreadLevel, getRapidMultiplier, hasShield } from './powerup.js';

const TOUCH_FOLLOW_SPEED = 600; // pixels/sec — how fast cat follows finger
const TOUCH_DEAD_ZONE = 4; // pixels — ignore tiny differences

export function createPlayer(lives) {
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

export function updatePlayer(player, bullets, dt, effects, equippedStats, weapon) {
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
    const diffX = touchX - player.x;
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
    let targetVx = 0;
    if (isMoveLeft()) targetVx = -PLAYER_SPEED * eqSpeedMul;
    if (isMoveRight()) targetVx = PLAYER_SPEED * eqSpeedMul;

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
  const maxBullets = MAX_BULLETS + spreadLvl * 2;
  player.fireTimer = Math.max(0, player.fireTimer - dt);

  if (isFiring() && player.fireTimer <= 0) {
    const activeBullets = bullets.filter((b) => b.active && b.isPlayer).length;
    if (activeBullets < maxBullets) {
      const bulletY = player.y - player.height / 2 - 4;

      if (weapon && weapon.id !== 'standard') {
        // Use weapon's custom fire pattern
        weapon.fire(player.x, bulletY, bullets);
      } else {
        // Standard + spread
        bullets.push({ x: player.x, y: bulletY, vx: 0, vy: -BULLET_SPEED, active: true, isPlayer: true });

        for (let s = 1; s <= spreadLvl; s++) {
          const angle = s * 15;
          const vx = Math.sin(angle * Math.PI / 180) * BULLET_SPEED;
          const vy = -Math.cos(angle * Math.PI / 180) * BULLET_SPEED;
          bullets.push({ x: player.x - s * 4, y: bulletY, vx: -vx, vy, active: true, isPlayer: true });
          bullets.push({ x: player.x + s * 4, y: bulletY, vx: vx, vy, active: true, isPlayer: true });
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

export function hitPlayer(player) {
  if (player.invincibleTimer > 0) return false;

  player.lives -= 1;
  if (player.lives <= 0) {
    player.alive = false;
  } else {
    player.invincibleTimer = INVINCIBILITY_TIME;
  }
  return true;
}

export function addScore(player, points) {
  return { ...player, score: player.score + points };
}

export function renderPlayer(ctx, player, effects, skin) {
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

  // Shield glow — rings scale with stack count
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

export function getPlayerBounds(player) {
  return {
    left: player.x - player.width / 2,
    right: player.x + player.width / 2,
    top: player.y - player.height / 2,
    bottom: player.y + player.height / 2,
  };
}
