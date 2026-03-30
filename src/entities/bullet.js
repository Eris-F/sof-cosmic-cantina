import { CANVAS_WIDTH, CANVAS_HEIGHT, BULLET_WIDTH, BULLET_HEIGHT } from '../constants.js';
import { drawBreadBullet, drawEnemyBullet } from '../sprites.js';

export function updateBullets(bullets, dt, ricochetBounces) {
  const bounces = ricochetBounces || 0;

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.y += b.vy * dt;
    if (b.vx) b.x += b.vx * dt;

    // Ricochet: player bullets bounce off side walls
    if (b.isPlayer && bounces > 0 && b.vx) {
      const maxBounces = bounces;
      if (!b.bounceCount) b.bounceCount = 0;

      if (b.x <= 4 && b.vx < 0 && b.bounceCount < maxBounces) {
        b.vx = -b.vx;
        b.x = 4;
        b.bounceCount++;
      } else if (b.x >= CANVAS_WIDTH - 4 && b.vx > 0 && b.bounceCount < maxBounces) {
        b.vx = -b.vx;
        b.x = CANVAS_WIDTH - 4;
        b.bounceCount++;
      }
    }

    // Remove off-screen
    if (b.y < -12 || b.y > CANVAS_HEIGHT + 12) {
      bullets.splice(i, 1);
    } else if (b.x < -20 || b.x > CANVAS_WIDTH + 20) {
      bullets.splice(i, 1);
    }
  }
}

export function renderBullets(ctx, bullets) {
  for (const b of bullets) {
    if (b.isPlayer) {
      drawBreadBullet(ctx, b.x, b.y);
    } else {
      drawEnemyBullet(ctx, b.x, b.y);
    }
  }
}

// AABB collision check
export function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return (
    ax - aw / 2 < bx + bw / 2 &&
    ax + aw / 2 > bx - bw / 2 &&
    ay - ah / 2 < by + bh / 2 &&
    ay + ah / 2 > by - bh / 2
  );
}

// Check if a bullet hits a rectangular target (center x,y + width,height)
export function bulletHitsRect(bullet, tx, ty, tw, th) {
  return rectsOverlap(
    bullet.x, bullet.y, BULLET_WIDTH, BULLET_HEIGHT,
    tx, ty, tw, th
  );
}

export function clearBullets(bullets) {
  bullets.length = 0;
}
