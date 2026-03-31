import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';

export interface ModifierEffects {
  readonly enemySpeedMul?: number;
  readonly globalTimeMul?: number;
  readonly doubleEnemies?: boolean;
  readonly playerDamageMul?: number;
  readonly oneHitKill?: boolean;
  readonly coinMul?: number;
  readonly ghostEnemies?: boolean;
  readonly enemyScale?: number;
  readonly enemyFireMul?: number;
  readonly enemiesNoShoot?: boolean;
  readonly scoreMul?: number;
  readonly reversedControls?: boolean;
  readonly guaranteedDrops?: boolean;
  readonly darkness?: boolean;
}

export interface Modifier {
  readonly id: string;
  readonly name: string;
  readonly desc: string;
  readonly color: string;
  readonly apply: () => ModifierEffects;
}

export const MODIFIERS: readonly Modifier[] = [
  {
    id: 'normal',
    name: 'STANDARD WAVE',
    desc: 'Nothing special',
    color: '#888888',
    apply: () => ({}),
  },
  {
    id: 'fast',
    name: 'HYPERSPEED',
    desc: 'Enemies move 2x faster!',
    color: '#ff4444',
    apply: () => ({ enemySpeedMul: 2.0 }),
  },
  {
    id: 'slow',
    name: 'SLOW MOTION',
    desc: 'Everything moves at half speed',
    color: '#44ccff',
    apply: () => ({ globalTimeMul: 0.5 }),
  },
  {
    id: 'swarm',
    name: 'SWARM',
    desc: 'Double the enemies!',
    color: '#ff8800',
    apply: () => ({ doubleEnemies: true }),
  },
  {
    id: 'glass',
    name: 'GLASS CANNON',
    desc: 'You deal 3x damage but die in 1 hit',
    color: '#ff44ff',
    apply: () => ({ playerDamageMul: 3, oneHitKill: true }),
  },
  {
    id: 'rich',
    name: 'GOLD RUSH',
    desc: 'Enemies drop 5x coins!',
    color: '#ffcc00',
    apply: () => ({ coinMul: 5 }),
  },
  {
    id: 'ghost_enemies',
    name: 'PHANTOM WAVE',
    desc: 'Enemies flicker in and out',
    color: '#aabbcc',
    apply: () => ({ ghostEnemies: true }),
  },
  {
    id: 'big',
    name: 'MEGA SIZE',
    desc: 'Giant enemies, giant hitboxes',
    color: '#44ff44',
    apply: () => ({ enemyScale: 1.8 }),
  },
  {
    id: 'tiny',
    name: 'MICRO WAVE',
    desc: 'Tiny enemies, hard to hit!',
    color: '#ff88ff',
    apply: () => ({ enemyScale: 0.5 }),
  },
  {
    id: 'bullet_hell',
    name: 'BULLET HELL',
    desc: 'Enemies fire 3x faster!',
    color: '#ff2222',
    apply: () => ({ enemyFireMul: 0.33 }),
  },
  {
    id: 'pacifist',
    name: 'PACIFIST',
    desc: 'Enemies dont shoot! Double score',
    color: '#88ff88',
    apply: () => ({ enemiesNoShoot: true, scoreMul: 2 }),
  },
  {
    id: 'reversed',
    name: 'MIRROR MODE',
    desc: 'Controls are reversed!',
    color: '#cc44ff',
    apply: () => ({ reversedControls: true }),
  },
  {
    id: 'powerup_rain',
    name: 'POWER RAIN',
    desc: 'Every kill drops a power-up!',
    color: '#44ffaa',
    apply: () => ({ guaranteedDrops: true }),
  },
  {
    id: 'darkness',
    name: 'LIGHTS OUT',
    desc: 'Limited visibility!',
    color: '#333366',
    apply: () => ({ darkness: true }),
  },
  {
    id: 'jackpot',
    name: 'JACKPOT',
    desc: '10x coins but 2x enemy speed!',
    color: '#ffdd00',
    apply: () => ({ coinMul: 10, enemySpeedMul: 2.0 }),
  },
] as const;

// Never pick 'normal' randomly — it's the default for waves 1-2
const RANDOM_POOL: readonly Modifier[] = MODIFIERS.filter((m) => m.id !== 'normal');

export function pickModifier(wave: number): Modifier {
  if (wave <= 2) return MODIFIERS[0]!; // normal for first 2 waves
  return RANDOM_POOL[Math.floor(Math.random() * RANDOM_POOL.length)]!;
}

export function renderModifierBanner(ctx: CanvasRenderingContext2D, modifier: Modifier | null, timer: number): void {
  if (!modifier || modifier.id === 'normal') return;
  if (timer <= 0) return;

  const alpha = Math.min(1, timer / 0.5);
  const cx = CANVAS_WIDTH / 2;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Banner background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, CANVAS_HEIGHT / 2 - 35, CANVAS_WIDTH, 50);

  // Color accent bar
  ctx.fillStyle = modifier.color;
  ctx.fillRect(0, CANVAS_HEIGHT / 2 - 35, CANVAS_WIDTH, 2);
  ctx.fillRect(0, CANVAS_HEIGHT / 2 + 13, CANVAS_WIDTH, 2);

  // Modifier name
  ctx.fillStyle = modifier.color;
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(modifier.name, cx, CANVAS_HEIGHT / 2 - 14);

  // Description
  ctx.fillStyle = '#cccccc';
  ctx.font = '10px monospace';
  ctx.fillText(modifier.desc, cx, CANVAS_HEIGHT / 2 + 4);

  ctx.textAlign = 'left';
  ctx.restore();
}

// Small HUD indicator for active modifier
export function renderModifierHUD(ctx: CanvasRenderingContext2D, modifier: Modifier | null): void {
  if (!modifier || modifier.id === 'normal') return;

  ctx.fillStyle = modifier.color;
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(modifier.name, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 8);
  ctx.textAlign = 'left';
}
