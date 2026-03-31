/**
 * EffectsSystem -- particles, screen shake, slow-motion.
 *
 * Pure logic: reads state from store, computes via Immer, emits events.
 * No rendering, no DOM.
 *
 * @module systems/EffectsSystem
 */

import {
  PETAL_COUNT_MIN,
  PETAL_COUNT_MAX,
  PETAL_LIFETIME_MIN,
  PETAL_LIFETIME_MAX,
  PETAL_GRAVITY,
} from '../constants';
import { random } from '../core/Random';
import type {
  GameStore,
  GameState,
  Particle,
  PetalColorKey,
} from '../types/systems';

// ── Petal color palettes ─────────────────────────────────────────────────────

const PETAL_COLORS: Readonly<Record<PetalColorKey, readonly string[]>> = Object.freeze({
  smiski: ['#88ee88', '#aaffaa', '#ccffcc', '#66cc66'],
  jellycat: ['#ee88cc', '#cc77bb', '#ddaadd', '#ffbbee'],
  tie: ['#ff6633', '#ff4422', '#ee8844', '#ffaa66'],
  barrier_tulip: ['#ee5577', '#ff7799', '#cc3355'],
  barrier_lily: ['#ffffee', '#ffcc44', '#eedd88'],
  ufo_glass: ['#88aa66', '#aaddaa', '#cceecc', '#eedd99'],
  ufo_liquid: ['#ccdd44', '#aacc33', '#eeff66'],
});

// ── Particle helpers ─────────────────────────────────────────────────────────

/**
 * Build a single particle object.
 */
function makeParticle(
  x: number, y: number,
  angle: number, speed: number,
  size: number, color: string,
  lifetime: number, rotationSpeed: number,
): Particle {
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 30,
    size,
    color,
    rotation: random() * Math.PI * 2,
    rotationSpeed,
    lifetime,
    age: 0,
  };
}

/**
 * Pick a random color from an array.
 */
function randomColor(colors: readonly string[]): string {
  return colors[Math.floor(random() * colors.length)] ?? '#ffffff';
}

// ── Particle spawning ────────────────────────────────────────────────────────

/**
 * Spawn petal particles at (x, y) for an enemy kill.
 */
export function spawnPetals(
  store: GameStore,
  x: number,
  y: number,
  count: number | undefined,
  type: string = 'smiski',
): void {
  const colors = PETAL_COLORS[type as PetalColorKey] ?? PETAL_COLORS.smiski;
  const petalCount = count ?? (PETAL_COUNT_MIN + Math.floor(
    random() * (PETAL_COUNT_MAX - PETAL_COUNT_MIN + 1),
  ));

  const newParticles: Particle[] = [];
  for (let i = 0; i < petalCount; i++) {
    const angle = (Math.PI * 2 * i) / petalCount + (random() - 0.5) * 0.5;
    const speed = 40 + random() * 80;
    const size = 3 + Math.floor(random() * 3);
    const lifetime = PETAL_LIFETIME_MIN + random() * (PETAL_LIFETIME_MAX - PETAL_LIFETIME_MIN);
    const rotSpeed = (random() - 0.5) * 8;

    newParticles.push(makeParticle(x, y, angle, speed, size, randomColor(colors), lifetime, rotSpeed));
  }

  store.update((draft) => {
    draft.effects.particles.push(...newParticles);
  });
}

/**
 * Spawn shatter particles (glass shards + liquid) for tequila UFO destruction.
 */
export function spawnShatter(
  store: GameStore,
  x: number,
  y: number,
  count: number = 11,
): void {
  const glassCount = Math.ceil(count * 0.55);
  const liquidCount = count - glassCount;
  const glassColors = PETAL_COLORS.ufo_glass;
  const liquidColors = PETAL_COLORS.ufo_liquid;

  const newParticles: Particle[] = [];

  for (let i = 0; i < glassCount; i++) {
    const angle = (Math.PI * 2 * i) / glassCount + (random() - 0.5) * 0.4;
    const speed = 60 + random() * 100;
    const size = 2 + Math.floor(random() * 2);
    const lifetime = 0.6 + random() * 0.3;
    const rotSpeed = (random() - 0.5) * 12;

    const p = makeParticle(x, y, angle, speed, size, randomColor(glassColors), lifetime, rotSpeed);
    // Override vy for shatter (more upward force)
    p.vy = Math.sin(angle) * speed - 50;
    newParticles.push(p);
  }

  for (let i = 0; i < liquidCount; i++) {
    const angle = (Math.PI * 2 * i) / liquidCount + (random() - 0.5) * 0.6;
    const speed = 30 + random() * 60;
    const size = 2 + Math.floor(random() * 2);
    const lifetime = 0.5 + random() * 0.3;
    const rotSpeed = (random() - 0.5) * 6;

    const p = makeParticle(x, y, angle, speed, size, randomColor(liquidColors), lifetime, rotSpeed);
    p.vy = Math.sin(angle) * speed - 20;
    newParticles.push(p);
  }

  store.update((draft) => {
    draft.effects.particles.push(...newParticles);
  });
}

/**
 * Spawn small debris particles for barrier destruction.
 */
export function spawnBarrierCrumble(
  store: GameStore,
  x: number,
  y: number,
  barrierType: string = 'tulip',
): void {
  const count = 2 + Math.floor(random() * 2);
  const colors = barrierType === 'tulip'
    ? PETAL_COLORS.barrier_tulip
    : PETAL_COLORS.barrier_lily;

  const newParticles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (random() - 0.5) * Math.PI;
    const speed = 20 + random() * 40;
    const size = 2 + Math.floor(random() * 2);
    const lifetime = 0.3 + random() * 0.3;
    const rotSpeed = (random() - 0.5) * 6;

    const p = makeParticle(x, y, angle, speed, size, randomColor(colors), lifetime, rotSpeed);
    // Barrier crumble doesn't have upward bias
    p.vy = Math.sin(angle) * speed;
    newParticles.push(p);
  }

  store.update((draft) => {
    draft.effects.particles.push(...newParticles);
  });
}

/**
 * Update all particles: apply velocity, gravity, aging. Remove expired.
 */
export function updateParticles(store: GameStore, dt: number): void {
  store.update((draft) => {
    const remaining: Particle[] = [];
    for (const p of draft.effects.particles) {
      const age = p.age + dt;
      if (age >= p.lifetime) {
        continue;
      }
      remaining.push({
        ...p,
        x: p.x + p.vx * dt,
        y: p.y + p.vy * dt,
        vy: p.vy + PETAL_GRAVITY * dt,
        rotation: p.rotation + p.rotationSpeed * dt,
        age,
      });
    }
    draft.effects.particles = remaining;
  });
}

// ── Screen shake ─────────────────────────────────────────────────────────────

/**
 * Trigger screen shake with given intensity and duration.
 */
export function triggerShake(
  store: GameStore,
  intensity: number = 4,
  duration: number = 0.2,
): void {
  store.update((draft) => {
    draft.effects.shake.intensity = intensity;
    draft.effects.shake.timer = duration;
  });
}

/**
 * Update screen shake timer.
 */
export function updateShake(store: GameStore, dt: number): void {
  store.update((draft) => {
    const shake = draft.effects.shake;
    if (shake.timer > 0) {
      shake.timer = Math.max(0, shake.timer - dt);
    }
  });
}

/**
 * Compute current shake offset for rendering.
 * Returns {x: 0, y: 0} when not shaking.
 */
export function getShakeOffset(state: GameState): { readonly x: number; readonly y: number } {
  const shake = state.effects.shake;
  if (shake.timer <= 0) {
    return { x: 0, y: 0 };
  }
  return {
    x: Math.floor((random() - 0.5) * 2 * shake.intensity),
    y: Math.floor((random() - 0.5) * 2 * shake.intensity),
  };
}

// ── Slow motion ──────────────────────────────────────────────────────────────

/**
 * Trigger slow-motion effect.
 */
export function triggerSlowMo(
  store: GameStore,
  duration: number = 0.4,
  factor: number = 0.25,
): void {
  store.update((draft) => {
    draft.effects.slowmo.timer = duration;
    draft.effects.slowmo.factor = factor;
  });
}

/**
 * Update slow-motion timer.
 */
export function updateSlowMo(store: GameStore, dt: number): void {
  store.update((draft) => {
    const slowmo = draft.effects.slowmo;
    if (slowmo.timer > 0) {
      slowmo.timer = Math.max(0, slowmo.timer - dt);
    }
  });
}

/**
 * Get the current time scale multiplier.
 * Eases back to 1.0 as the timer runs down.
 */
export function getTimeScale(state: GameState): number {
  const { timer, factor } = state.effects.slowmo;
  if (timer <= 0) {
    return 1;
  }
  const easeThreshold = 0.15;
  if (timer > easeThreshold) {
    return factor;
  }
  // Ease from factor to 1.0 in the last easeThreshold seconds
  const t = timer / easeThreshold;
  return factor + (1 - factor) * (1 - t);
}
