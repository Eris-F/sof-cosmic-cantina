import { CANVAS_HEIGHT } from '../constants';

const POWERUP_SIZE = 14;
const POWERUP_FALL_SPEED = 80;
const POWERUP_DURATION = 10;

export type PowerupType = 'spread' | 'rapid' | 'shield' | 'bomb' | 'ricochet' | 'companion';

export const POWERUP_TYPES: Readonly<Record<string, PowerupType>> = {
  SPREAD: 'spread',
  RAPID: 'rapid',
  SHIELD: 'shield',
  BOMB: 'bomb',
  RICOCHET: 'ricochet',
  COMPANION: 'companion',
} as const;

const POWERUP_COLORS: Readonly<Record<PowerupType, string>> = {
  spread: '#ff8844',
  rapid: '#44ccff',
  shield: '#44ff44',
  bomb: '#ff4444',
  ricochet: '#ffff44',
  companion: '#ff88ff',
};

const POWERUP_LABELS: Readonly<Record<PowerupType, string>> = {
  spread: 'S',
  rapid: 'R',
  shield: 'H',
  bomb: 'B',
  ricochet: 'W',
  companion: 'C',
};

const DROP_CHANCE = 0.12;

export interface Powerup {
  x: number;
  y: number;
  readonly type: PowerupType;
  alive: boolean;
}

export interface ActiveEffects {
  spreadStacks: number;
  spreadTimer: number;
  rapidStacks: number;
  rapidTimer: number;
  shieldHits: number;
  ricochetStacks: number;
  ricochetTimer: number;
}

export function maybeSpawnPowerup(x: number, y: number): Powerup | null {
  if (Math.random() > DROP_CHANCE) return null;

  const types = Object.values(POWERUP_TYPES);
  const type = types[Math.floor(Math.random() * types.length)]!;

  return {
    x,
    y,
    type,
    alive: true,
  };
}

export function updatePowerups(powerups: Powerup[], dt: number): void {
  for (let i = powerups.length - 1; i >= 0; i--) {
    const p = powerups[i]!;
    p.y += POWERUP_FALL_SPEED * dt;
    if (p.y > CANVAS_HEIGHT + 20) {
      powerups.splice(i, 1);
    }
  }
}

export function renderPowerups(ctx: CanvasRenderingContext2D, powerups: Powerup[], time: number): void {
  for (const p of powerups) {
    if (!p.alive) continue;

    const pulse = 0.7 + 0.3 * Math.sin(time * 6);
    const color = POWERUP_COLORS[p.type];
    const label = POWERUP_LABELS[p.type];

    ctx.save();
    ctx.translate(Math.floor(p.x), Math.floor(p.y));

    // Glow
    ctx.globalAlpha = pulse * 0.3;
    ctx.fillStyle = color;
    ctx.fillRect(-POWERUP_SIZE / 2 - 2, -POWERUP_SIZE / 2 - 2, POWERUP_SIZE + 4, POWERUP_SIZE + 4);

    // Box
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#111';
    ctx.fillRect(-POWERUP_SIZE / 2, -POWERUP_SIZE / 2, POWERUP_SIZE, POWERUP_SIZE);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(-POWERUP_SIZE / 2, -POWERUP_SIZE / 2, POWERUP_SIZE, POWERUP_SIZE);

    // Letter
    ctx.fillStyle = color;
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, 0, 4);
    ctx.textAlign = 'left';

    ctx.restore();
  }
}

export function checkPowerupPickup(
  powerups: Powerup[],
  playerX: number,
  playerY: number,
  playerW: number,
  playerH: number,
): PowerupType | null {
  for (let i = powerups.length - 1; i >= 0; i--) {
    const p = powerups[i]!;
    const dx = Math.abs(p.x - playerX);
    const dy = Math.abs(p.y - playerY);
    if (dx < (playerW + POWERUP_SIZE) / 2 && dy < (playerH + POWERUP_SIZE) / 2) {
      powerups.splice(i, 1);
      return p.type;
    }
  }
  return null;
}

export function createActiveEffects(): ActiveEffects {
  return {
    spreadStacks: 0,
    spreadTimer: 0,
    rapidStacks: 0,
    rapidTimer: 0,
    shieldHits: 0,
    ricochetStacks: 0,
    ricochetTimer: 0,
  };
}

export function updateActiveEffects(effects: ActiveEffects, dt: number): void {
  if (effects.spreadTimer > 0) {
    effects.spreadTimer = Math.max(0, effects.spreadTimer - dt);
    if (effects.spreadTimer <= 0) effects.spreadStacks = 0;
  }
  if (effects.rapidTimer > 0) {
    effects.rapidTimer = Math.max(0, effects.rapidTimer - dt);
    if (effects.rapidTimer <= 0) effects.rapidStacks = 0;
  }
  if (effects.ricochetTimer > 0) {
    effects.ricochetTimer = Math.max(0, effects.ricochetTimer - dt);
    if (effects.ricochetTimer <= 0) effects.ricochetStacks = 0;
  }
}

export function applyPowerup(effects: ActiveEffects, type: PowerupType): void {
  switch (type) {
    case POWERUP_TYPES.SPREAD:
      effects.spreadStacks = Math.min(effects.spreadStacks + 1, 5);
      effects.spreadTimer += POWERUP_DURATION;
      break;
    case POWERUP_TYPES.RAPID:
      effects.rapidStacks = Math.min(effects.rapidStacks + 1, 5);
      effects.rapidTimer += POWERUP_DURATION;
      break;
    case POWERUP_TYPES.SHIELD:
      effects.shieldHits += 1;
      break;
    case POWERUP_TYPES.RICOCHET:
      effects.ricochetStacks = Math.min(effects.ricochetStacks + 1, 3);
      effects.ricochetTimer += POWERUP_DURATION;
      break;
    case POWERUP_TYPES.BOMB:
      break;
  }
}

// Helpers for gameplay
export function getSpreadLevel(effects: ActiveEffects): number {
  return effects.spreadStacks;
}

export function getRapidMultiplier(effects: ActiveEffects): number {
  if (effects.rapidStacks <= 0) return 1;
  // Each stack = 40% faster (stacking multiplicatively)
  return Math.pow(0.6, effects.rapidStacks);
}

export function hasShield(effects: ActiveEffects): boolean {
  return effects.shieldHits > 0;
}

export function consumeShield(effects: ActiveEffects): boolean {
  if (effects.shieldHits > 0) {
    effects.shieldHits -= 1;
    return true;
  }
  return false;
}

export function renderActiveEffects(ctx: CanvasRenderingContext2D, effects: ActiveEffects, _canvasW: number): void {
  let y = 28;
  ctx.font = '10px monospace';

  if (effects.spreadStacks > 0) {
    const stacks = 'x' + effects.spreadStacks;
    ctx.fillStyle = '#ff8844';
    ctx.fillText(`SPREAD${stacks} ${Math.ceil(effects.spreadTimer)}s`, 10, y);
    y += 10;
  }
  if (effects.rapidStacks > 0) {
    const stacks = 'x' + effects.rapidStacks;
    ctx.fillStyle = '#44ccff';
    ctx.fillText(`RAPID${stacks} ${Math.ceil(effects.rapidTimer)}s`, 10, y);
    y += 10;
  }
  if (effects.ricochetStacks > 0) {
    const stacks = 'x' + effects.ricochetStacks;
    ctx.fillStyle = '#ffff44';
    ctx.fillText(`RICOCHET${stacks} ${Math.ceil(effects.ricochetTimer)}s`, 10, y);
    y += 10;
  }
  if (effects.shieldHits > 0) {
    ctx.fillStyle = '#44ff44';
    ctx.fillText(`SHIELD x${effects.shieldHits}`, 10, y);
  }
}
