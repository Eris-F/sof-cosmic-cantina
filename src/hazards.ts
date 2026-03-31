import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';

export interface Asteroid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotSpeed: number;
}

export interface Laser {
  y: number;
  warmup: number;
  timer: number;
  width: number;
}

export interface BlackHole {
  x: number;
  y: number;
  radius: number;
  timer: number;
}

export interface HazardsState {
  asteroids: Asteroid[];
  lasers: Laser[];
  blackHoles: BlackHole[];
  spawnTimer: number;
}

interface BulletLike {
  x: number;
  y: number;
  vx?: number;
  vy: number;
}

export function createHazards(): HazardsState {
  return {
    asteroids: [],
    lasers: [],
    blackHoles: [],
    spawnTimer: 8 + Math.random() * 5,
  };
}

export function updateHazards(hazards: HazardsState, bullets: BulletLike[], _playerX: number, _playerY: number, dt: number, wave: number): void {
  if (wave < 4) return; // No hazards before wave 4

  // Spawn timer
  hazards.spawnTimer -= dt;
  if (hazards.spawnTimer <= 0) {
    hazards.spawnTimer = 6 + Math.random() * 8;
    const roll = Math.random();
    if (roll < 0.4) spawnAsteroid(hazards);
    else if (roll < 0.7) spawnLaser(hazards);
    else spawnBlackHole(hazards);
  }

  // Update asteroids
  for (let i = hazards.asteroids.length - 1; i >= 0; i--) {
    const a = hazards.asteroids[i]!;
    a.x += a.vx * dt;
    a.y += a.vy * dt;
    a.rotation += a.rotSpeed * dt;
    if (a.x < -40 || a.x > CANVAS_WIDTH + 40 || a.y > CANVAS_HEIGHT + 40) {
      hazards.asteroids.splice(i, 1);
    }
  }

  // Update lasers
  for (let i = hazards.lasers.length - 1; i >= 0; i--) {
    const l = hazards.lasers[i]!;
    l.timer -= dt;
    l.warmup -= dt;
    if (l.timer <= 0) {
      hazards.lasers.splice(i, 1);
    }
  }

  // Update black holes
  for (let i = hazards.blackHoles.length - 1; i >= 0; i--) {
    const bh = hazards.blackHoles[i]!;
    bh.timer -= dt;
    if (bh.timer <= 0) {
      hazards.blackHoles.splice(i, 1);
      continue;
    }

    // Pull bullets toward black hole
    for (const b of bullets) {
      const dx = bh.x - b.x;
      const dy = bh.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bh.radius && dist > 5) {
        const force = 150 / dist;
        if (!b.vx) b.vx = 0;
        b.vx! += (dx / dist) * force * dt;
        b.vy += (dy / dist) * force * dt;
      }
    }
  }
}

function spawnAsteroid(hazards: HazardsState): void {
  const fromLeft = Math.random() > 0.5;
  hazards.asteroids.push({
    x: fromLeft ? -20 : CANVAS_WIDTH + 20,
    y: 100 + Math.random() * 300,
    vx: (fromLeft ? 1 : -1) * (40 + Math.random() * 60),
    vy: 10 + Math.random() * 30,
    size: 8 + Math.random() * 12,
    rotation: 0,
    rotSpeed: (Math.random() - 0.5) * 4,
  });
}

function spawnLaser(hazards: HazardsState): void {
  hazards.lasers.push({
    y: 80 + Math.random() * (CANVAS_HEIGHT - 200),
    warmup: 1.5, // warning time before it fires
    timer: 3.0,  // total duration
    width: 4,
  });
}

function spawnBlackHole(hazards: HazardsState): void {
  hazards.blackHoles.push({
    x: 60 + Math.random() * (CANVAS_WIDTH - 120),
    y: 100 + Math.random() * 300,
    radius: 50 + Math.random() * 30,
    timer: 5 + Math.random() * 3,
  });
}

// Check if player is hit by hazards
export function checkHazardCollision(hazards: HazardsState, playerX: number, playerY: number, playerW: number, playerH: number): boolean {
  // Asteroid collision
  for (const a of hazards.asteroids) {
    const dx = a.x - playerX;
    const dy = a.y - playerY;
    if (Math.abs(dx) < (a.size + playerW) / 2 && Math.abs(dy) < (a.size + playerH) / 2) {
      return true;
    }
  }

  // Laser collision (only when warmup is done)
  for (const l of hazards.lasers) {
    if (l.warmup > 0) continue;
    if (Math.abs(l.y - playerY) < (l.width + playerH) / 2) {
      return true;
    }
  }

  return false;
}

export function renderHazards(ctx: CanvasRenderingContext2D, hazards: HazardsState, time: number): void {
  // Asteroids
  for (const a of hazards.asteroids) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.rotation);
    ctx.fillStyle = '#667788';
    ctx.fillRect(-a.size / 2, -a.size / 2, a.size, a.size * 0.8);
    ctx.fillStyle = '#556677';
    ctx.fillRect(-a.size / 2 + 2, -a.size / 2 + 2, a.size - 4, a.size * 0.8 - 4);
    // Craters
    ctx.fillStyle = '#445566';
    ctx.fillRect(-a.size / 4, -a.size / 4, a.size / 4, a.size / 4);
    ctx.restore();
  }

  // Lasers
  for (const l of hazards.lasers) {
    if (l.warmup > 0) {
      // Warning line — dashed, pulsing
      const pulse = 0.3 + 0.3 * Math.sin(time * 10);
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(0, l.y);
      ctx.lineTo(CANVAS_WIDTH, l.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // "WARNING" text
      ctx.fillStyle = '#ff4444';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('WARNING', CANVAS_WIDTH / 2, l.y - 6);
      ctx.textAlign = 'left';
      ctx.restore();
    } else {
      // Active laser beam
      const intensity = 0.6 + 0.4 * Math.sin(time * 20);
      ctx.save();
      ctx.globalAlpha = intensity;
      // Glow
      ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
      ctx.fillRect(0, l.y - 8, CANVAS_WIDTH, 16);
      // Core beam
      ctx.fillStyle = '#ff2222';
      ctx.fillRect(0, l.y - l.width / 2, CANVAS_WIDTH, l.width);
      ctx.fillStyle = '#ff8888';
      ctx.fillRect(0, l.y - 1, CANVAS_WIDTH, 2);
      ctx.restore();
    }
  }

  // Black holes
  for (const bh of hazards.blackHoles) {
    ctx.save();
    // Gravitational ring effect
    for (let r = 0; r < 3; r++) {
      const ringR = bh.radius - r * 12;
      if (ringR <= 0) continue;
      const alpha = 0.1 + 0.05 * Math.sin(time * 3 + r);
      ctx.strokeStyle = `rgba(100, 50, 200, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(bh.x, bh.y, ringR, time * (1 + r * 0.5), time * (1 + r * 0.5) + Math.PI * 1.5);
      ctx.stroke();
    }
    // Core
    ctx.fillStyle = '#110022';
    ctx.beginPath();
    ctx.arc(bh.x, bh.y, 6, 0, Math.PI * 2);
    ctx.fill();
    // Inner glow
    ctx.fillStyle = 'rgba(100, 50, 200, 0.3)';
    ctx.beginPath();
    ctx.arc(bh.x, bh.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
