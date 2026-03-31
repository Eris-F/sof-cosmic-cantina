import { CANVAS_WIDTH, CANVAS_HEIGHT, BULLET_WIDTH, BULLET_HEIGHT } from '../constants';
import { drawBreadBullet, drawEnemyBullet } from '../sprites';

export interface Bullet {
  x: number;
  y: number;
  vx?: number;
  vy: number;
  active?: boolean;
  isPlayer: boolean;
  pierce?: number;
  bounceCount?: number;
  vampire?: boolean;
}

export function updateBullets(bullets: Bullet[], dt: number, ricochetBounces?: number): void {
  const bounces = ricochetBounces || 0;

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i]!;
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

export function renderBullets(ctx: CanvasRenderingContext2D, bullets: Bullet[]): void {
  for (const b of bullets) {
    if (b.isPlayer) {
      drawBreadBullet(ctx, b.x, b.y);
    } else {
      drawEnemyBullet(ctx, b.x, b.y);
    }
  }
}

// AABB collision check
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

// Check if a bullet hits a rectangular target (center x,y + width,height)
export function bulletHitsRect(
  bullet: Bullet,
  tx: number, ty: number, tw: number, th: number,
): boolean {
  return rectsOverlap(
    bullet.x, bullet.y, BULLET_WIDTH, BULLET_HEIGHT,
    tx, ty, tw, th,
  );
}

export function clearBullets(bullets: Bullet[]): void {
  bullets.length = 0;
}
