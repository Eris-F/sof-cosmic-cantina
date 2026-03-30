import { BULLET_SPEED, CANVAS_WIDTH } from '../constants.js';

const ORBIT_RADIUS = 28;
const ORBIT_SPEED = 3;
const COMPANION_FIRE_COOLDOWN = 0.6;

export function createCompanions() {
  return {
    cats: [],
    nextId: 0,
  };
}

export function addCompanion(companions) {
  const id = companions.nextId++;
  companions.cats.push({
    id,
    angle: (Math.PI * 2 * companions.cats.length) / (companions.cats.length + 1),
    x: 0,
    y: 0,
    fireTimer: Math.random() * COMPANION_FIRE_COOLDOWN,
  });

  // Re-distribute angles evenly
  const count = companions.cats.length;
  for (let i = 0; i < count; i++) {
    companions.cats[i].angle = (Math.PI * 2 * i) / count;
  }
}

export function updateCompanions(companions, playerX, playerY, bullets, dt) {
  for (const c of companions.cats) {
    c.angle += ORBIT_SPEED * dt;
    c.x = playerX + Math.cos(c.angle) * ORBIT_RADIUS;
    c.y = playerY + Math.sin(c.angle) * ORBIT_RADIUS;

    // Fire weaker bullets
    c.fireTimer -= dt;
    if (c.fireTimer <= 0) {
      c.fireTimer = COMPANION_FIRE_COOLDOWN;
      bullets.push({
        x: c.x,
        y: c.y - 6,
        vx: 0,
        vy: -BULLET_SPEED * 0.7,
        active: true,
        isPlayer: true,
      });
    }
  }
}

export function renderCompanions(ctx, companions) {
  for (const c of companions.cats) {
    ctx.save();
    ctx.translate(Math.floor(c.x), Math.floor(c.y));

    // Tiny cat — 8x8 pixel art
    ctx.fillStyle = '#ffaa44';
    ctx.fillRect(-3, -2, 6, 5);
    // Head
    ctx.fillRect(-3, -5, 6, 4);
    // Ears
    ctx.fillRect(-4, -7, 2, 3);
    ctx.fillRect(2, -7, 2, 3);
    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(-2, -4, 1, 1);
    ctx.fillRect(1, -4, 1, 1);
    // Tiny cannon
    ctx.fillStyle = '#888';
    ctx.fillRect(-1, -8, 2, 3);

    ctx.restore();
  }
}

export function clearCompanions(companions) {
  companions.cats.length = 0;
}
