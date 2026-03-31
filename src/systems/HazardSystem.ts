/**
 * HazardSystem -- Pure logic for environmental hazards (wave 4+).
 *
 * 3 hazard types: asteroids, lasers, black holes.
 * Reads/writes state via store (Immer drafts). No rendering, no DOM.
 * Collision detection is delegated to CollisionSystem.
 *
 * @module systems/HazardSystem
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';
import type { Draft } from 'immer';
import { random } from '../core/Random';
import type {
  GameStore,
  IEventBus,
  IHazardSystem,
  Hazard,
  AsteroidHazard,
  LaserHazard,
  BlackHoleHazard,
  Bullet,
} from '../types/systems';

// ── Constants ─────────────────────────────────────────────────────────────────

const RESPAWN_DELAY_MIN = 6;
const RESPAWN_DELAY_RANGE = 8;

const ASTEROID_SPEED_MIN = 40;
const ASTEROID_SPEED_RANGE = 60;
const ASTEROID_VY_MIN = 10;
const ASTEROID_VY_RANGE = 30;
const ASTEROID_SIZE_MIN = 8;
const ASTEROID_SIZE_RANGE = 12;
const ASTEROID_OFFSCREEN = 40;

const LASER_WARMUP = 1.5;
const LASER_DURATION = 3.0;
const LASER_WIDTH = 4;
const LASER_Y_MIN = 80;

const BLACK_HOLE_RADIUS_MIN = 50;
const BLACK_HOLE_RADIUS_RANGE = 30;
const BLACK_HOLE_DURATION_MIN = 5;
const BLACK_HOLE_DURATION_RANGE = 3;
const BLACK_HOLE_FORCE = 150;
const BLACK_HOLE_MIN_DIST = 5;
const BLACK_HOLE_MARGIN = 60;

// ── Spawn helpers ─────────────────────────────────────────────────────────────

function spawnAsteroid(active: Draft<Hazard[]>): void {
  const fromLeft = random() > 0.5;
  active.push({
    kind: 'asteroid',
    x: fromLeft ? -20 : CANVAS_WIDTH + 20,
    y: 100 + random() * 300,
    vx: (fromLeft ? 1 : -1) * (ASTEROID_SPEED_MIN + random() * ASTEROID_SPEED_RANGE),
    vy: ASTEROID_VY_MIN + random() * ASTEROID_VY_RANGE,
    size: ASTEROID_SIZE_MIN + random() * ASTEROID_SIZE_RANGE,
    rotation: 0,
    rotSpeed: (random() - 0.5) * 4,
  } as Draft<AsteroidHazard>);
}

function spawnLaser(active: Draft<Hazard[]>): void {
  active.push({
    kind: 'laser',
    y: LASER_Y_MIN + random() * (CANVAS_HEIGHT - 200),
    warmup: LASER_WARMUP,
    timer: LASER_DURATION,
    width: LASER_WIDTH,
  } as Draft<LaserHazard>);
}

function spawnBlackHole(active: Draft<Hazard[]>): void {
  active.push({
    kind: 'blackhole',
    x: BLACK_HOLE_MARGIN + random() * (CANVAS_WIDTH - BLACK_HOLE_MARGIN * 2),
    y: 100 + random() * 300,
    radius: BLACK_HOLE_RADIUS_MIN + random() * BLACK_HOLE_RADIUS_RANGE,
    timer: BLACK_HOLE_DURATION_MIN + random() * BLACK_HOLE_DURATION_RANGE,
  } as Draft<BlackHoleHazard>);
}

// ── System factory ────────────────────────────────────────────────────────────

/**
 * Creates the environmental hazard system.
 */
export function createHazardSystem(store: GameStore, _eventBus: IEventBus): IHazardSystem {
  function update(dt: number): void {
    store.update((draft) => {
      const wave = draft.combat.wave;
      if (wave < 4) return;

      const hazards = draft.combat.hazards;

      // Spawn timer
      hazards.spawnTimer -= dt;
      if (hazards.spawnTimer <= 0) {
        hazards.spawnTimer = RESPAWN_DELAY_MIN + random() * RESPAWN_DELAY_RANGE;
        const roll = random();
        if (roll < 0.4) {
          spawnAsteroid(hazards.active);
        } else if (roll < 0.7) {
          spawnLaser(hazards.active);
        } else {
          spawnBlackHole(hazards.active);
        }
      }

      // Update each hazard
      for (let i = hazards.active.length - 1; i >= 0; i--) {
        const h = hazards.active[i];
        if (!h) continue;

        switch (h.kind) {
          case 'asteroid': {
            const asteroid = h as Draft<AsteroidHazard>;
            asteroid.x += asteroid.vx * dt;
            asteroid.y += asteroid.vy * dt;
            asteroid.rotation += asteroid.rotSpeed * dt;
            if (
              asteroid.x < -ASTEROID_OFFSCREEN ||
              asteroid.x > CANVAS_WIDTH + ASTEROID_OFFSCREEN ||
              asteroid.y > CANVAS_HEIGHT + ASTEROID_OFFSCREEN
            ) {
              hazards.active.splice(i, 1);
            }
            break;
          }

          case 'laser': {
            const laser = h as Draft<LaserHazard>;
            laser.timer -= dt;
            laser.warmup -= dt;
            if (laser.timer <= 0) {
              hazards.active.splice(i, 1);
            }
            break;
          }

          case 'blackhole': {
            const bh = h as Draft<BlackHoleHazard>;
            bh.timer -= dt;
            if (bh.timer <= 0) {
              hazards.active.splice(i, 1);
              continue;
            }
            // Pull bullets toward black hole
            applyBlackHoleGravity(bh, draft.combat.bullets, dt);
            break;
          }
        }
      }
    });
  }

  function dispose(): void {
    // No subscriptions to clean up
  }

  return {
    update,
    dispose,
  };
}

// ── Black hole gravity ────────────────────────────────────────────────────────

/**
 * Applies gravitational pull on nearby bullets.
 */
function applyBlackHoleGravity(
  bh: Draft<BlackHoleHazard>,
  bullets: Draft<Bullet[]>,
  dt: number,
): void {
  for (const b of bullets) {
    const bhX = bh.x;
    const bhY = bh.y;
    const dx = bhX - b.x;
    const dy = bhY - b.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < bh.radius && dist > BLACK_HOLE_MIN_DIST) {
      const force = BLACK_HOLE_FORCE / dist;
      if (!b.vx) b.vx = 0;
      b.vx += (dx / dist) * force * dt;
      b.vy += (dy / dist) * force * dt;
    }
  }
}
