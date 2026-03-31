import {
  PETAL_COUNT_MIN,
  PETAL_COUNT_MAX,
  PETAL_LIFETIME_MIN,
  PETAL_LIFETIME_MAX,
  PETAL_GRAVITY,
} from '../constants';
import { drawPetal } from '../sprites';

export type ParticleType =
  | 'smiski'
  | 'jellycat'
  | 'tie'
  | 'barrier_tulip'
  | 'barrier_lily'
  | 'ufo_glass'
  | 'ufo_liquid';

// Color palettes per enemy type
const PETAL_COLORS: Readonly<Record<string, readonly string[]>> = {
  smiski: ['#88ee88', '#aaffaa', '#ccffcc', '#66cc66'],
  jellycat: ['#ee88cc', '#cc77bb', '#ddaadd', '#ffbbee'],
  tie: ['#ff6633', '#ff4422', '#ee8844', '#ffaa66'],
  barrier_tulip: ['#ee5577', '#ff7799', '#cc3355'],
  barrier_lily: ['#ffffee', '#ffcc44', '#eedd88'],
  ufo_glass: ['#88aa66', '#aaddaa', '#cceecc', '#eedd99'],
  ufo_liquid: ['#ccdd44', '#aacc33', '#eeff66'],
};

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  readonly size: number;
  readonly color: string;
  rotation: number;
  readonly rotationSpeed: number;
  readonly lifetime: number;
  age: number;
}

const particles: Particle[] = [];

export function spawnPetals(x: number, y: number, type: string): void {
  const count = PETAL_COUNT_MIN + Math.floor(Math.random() * (PETAL_COUNT_MAX - PETAL_COUNT_MIN + 1));
  const colors = PETAL_COLORS[type] ?? PETAL_COLORS.smiski!;

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 40 + Math.random() * 80;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 30,
      size: 3 + Math.floor(Math.random() * 3),
      color: colors[Math.floor(Math.random() * colors.length)]!,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 8,
      lifetime: PETAL_LIFETIME_MIN + Math.random() * (PETAL_LIFETIME_MAX - PETAL_LIFETIME_MIN),
      age: 0,
    });
  }
}

export function spawnShatter(x: number, y: number): void {
  // Glass shards for tequila UFO
  const glassCount = 6;
  const liquidCount = 5;
  const glassColors = PETAL_COLORS.ufo_glass!;
  const liquidColors = PETAL_COLORS.ufo_liquid!;

  for (let i = 0; i < glassCount; i++) {
    const angle = (Math.PI * 2 * i) / glassCount + (Math.random() - 0.5) * 0.4;
    const speed = 60 + Math.random() * 100;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 50,
      size: 2 + Math.floor(Math.random() * 2),
      color: glassColors[Math.floor(Math.random() * glassColors.length)]!,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 12,
      lifetime: 0.6 + Math.random() * 0.3,
      age: 0,
    });
  }

  for (let i = 0; i < liquidCount; i++) {
    const angle = (Math.PI * 2 * i) / liquidCount + (Math.random() - 0.5) * 0.6;
    const speed = 30 + Math.random() * 60;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 20,
      size: 2 + Math.floor(Math.random() * 2),
      color: liquidColors[Math.floor(Math.random() * liquidColors.length)]!,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 6,
      lifetime: 0.5 + Math.random() * 0.3,
      age: 0,
    });
  }
}

export function spawnBarrierCrumble(x: number, y: number, type: string): void {
  const count = 2 + Math.floor(Math.random() * 2);
  const colors = (type === 'tulip' ? PETAL_COLORS.barrier_tulip : PETAL_COLORS.barrier_lily)!;

  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
    const speed = 20 + Math.random() * 40;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2 + Math.floor(Math.random() * 2),
      color: colors[Math.floor(Math.random() * colors.length)]!,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 6,
      lifetime: 0.3 + Math.random() * 0.3,
      age: 0,
    });
  }
}

export function updateParticles(dt: number): void {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]!;
    p.age += dt;
    if (p.age >= p.lifetime) {
      particles.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += PETAL_GRAVITY * dt;
    p.rotation += p.rotationSpeed * dt;
  }
}

export function renderParticles(ctx: CanvasRenderingContext2D): void {
  for (const p of particles) {
    const alpha = 1 - p.age / p.lifetime;
    drawPetal(ctx, p.x, p.y, p.size, p.color, p.rotation, alpha);
  }
}

export function getParticleCount(): number {
  return particles.length;
}

export function clearParticles(): void {
  particles.length = 0;
}
