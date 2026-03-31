/**
 * ParticleRenderer.ts
 *
 * Renders all particle types from the effects.particles array.
 * Pure read-only — receives particles array + ctx, draws pixels, returns nothing.
 * ZERO mutations to state.
 */

import { drawPetal } from './SpriteRenderer';

// ---------------------------------------------------------------------------
// Particle state type
// ---------------------------------------------------------------------------

export interface ParticleRenderState {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly color: string;
  readonly rotation: number;
  readonly age: number;
  readonly lifetime: number;
}

/**
 * Renders every particle in the array. Each particle object contains its own
 * position, velocity, color, rotation, size, age, and lifetime. The renderer
 * computes alpha from age/lifetime and delegates to drawPetal for the actual
 * pixel art.
 *
 * Particle types (all use the same shape, differ by color palette and size):
 * - Petal particles: flower colors, rotation, fade (enemy kills)
 * - Shatter particles: larger, glass/liquid colors (UFO destruction)
 * - Barrier crumble particles: small debris (barrier block destruction)
 */
export function renderParticles(
  ctx: CanvasRenderingContext2D,
  particles: readonly ParticleRenderState[] | null | undefined,
): void {
  if (!particles || particles.length === 0) return;

  for (const p of particles) {
    const alpha = Math.max(0, 1 - p.age / p.lifetime);
    drawPetal(ctx, p.x, p.y, p.size, p.color, p.rotation, alpha);
  }
}
