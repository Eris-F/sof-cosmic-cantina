import { CANVAS_WIDTH, ENEMY_BULLET_SPEED } from '../constants';
import type { Bullet } from './bullet';

const BOSS_WIDTH = 64;
const BOSS_HEIGHT = 48;
const BASE_HP = 40;
const HP_SCALE = 15; // extra HP per boss encounter
const BOSS_SPEED = 40;
const BOSS_Y = 80;

export type BossPhase = 'enter' | 'fight' | 'dying';

export interface BossType {
  readonly name: string;
  readonly color1: string;
  readonly color2: string;
  readonly bulletColor: string;
  readonly petals: string;
}

export interface BossEntity {
  active: boolean;
  x: number;
  y: number;
  readonly targetY: number;
  readonly width: number;
  readonly height: number;
  hp: number;
  readonly maxHp: number;
  readonly type: BossType;
  direction: 1 | -1;
  readonly speed: number;
  phase: BossPhase;
  flashTimer: number;
  attackTimer: number;
  attackPattern: number;
  deathTimer: number;
  time: number;
}

// Boss types cycle
const BOSS_TYPES: readonly BossType[] = [
  { name: 'MEGA SMISKI', color1: '#88cc88', color2: '#a0e0a0', bulletColor: '#88ee88', petals: 'smiski' },
  { name: 'ULTRA JELLYCAT', color1: '#cc88cc', color2: '#ddaadd', bulletColor: '#ee88cc', petals: 'jellycat' },
  { name: 'DEATH TIE', color1: '#556677', color2: '#4488cc', bulletColor: '#ff4444', petals: 'tie' },
];

export function createBoss(wave: number): BossEntity {
  const bossIndex = Math.floor((wave / 5 - 1) % BOSS_TYPES.length);
  const bossType = BOSS_TYPES[bossIndex]!;
  const hp = BASE_HP + Math.floor(wave / 5) * HP_SCALE;

  return {
    active: true,
    x: CANVAS_WIDTH / 2,
    y: -BOSS_HEIGHT,
    targetY: BOSS_Y,
    width: BOSS_WIDTH,
    height: BOSS_HEIGHT,
    hp,
    maxHp: hp,
    type: bossType,
    direction: 1,
    speed: BOSS_SPEED,
    phase: 'enter',
    flashTimer: 0,
    attackTimer: 0,
    attackPattern: 0,
    deathTimer: 0,
    time: 0,
  };
}

export function updateBoss(boss: BossEntity | null, bullets: Bullet[], dt: number): void {
  if (!boss || !boss.active) return;

  boss.time += dt;

  if (boss.flashTimer > 0) {
    boss.flashTimer = Math.max(0, boss.flashTimer - dt);
  }

  switch (boss.phase) {
    case 'enter':
      // Slide down to target Y
      boss.y += 60 * dt;
      if (boss.y >= boss.targetY) {
        boss.y = boss.targetY;
        boss.phase = 'fight';
        boss.attackTimer = 1.0;
      }
      break;

    case 'fight':
      // Move side to side
      boss.x += boss.direction * boss.speed * dt;
      if (boss.x - boss.width / 2 <= 10) {
        boss.direction = 1;
      }
      if (boss.x + boss.width / 2 >= CANVAS_WIDTH - 10) {
        boss.direction = -1;
      }

      // Attack patterns
      boss.attackTimer -= dt;
      if (boss.attackTimer <= 0) {
        boss.attackPattern = (boss.attackPattern + 1) % 3;

        switch (boss.attackPattern) {
          case 0:
            // Spread shot -- 5 bullets in a fan
            for (let i = -2; i <= 2; i++) {
              const angle = Math.PI / 2 + i * 0.25;
              bullets.push({
                x: boss.x + i * 8,
                y: boss.y + boss.height / 2,
                vx: Math.cos(angle) * ENEMY_BULLET_SPEED * 0.6,
                vy: Math.sin(angle) * ENEMY_BULLET_SPEED,
                isPlayer: false,
              });
            }
            boss.attackTimer = 1.2;
            break;

          case 1:
            // Rapid burst -- 3 fast bullets straight down
            for (let i = 0; i < 3; i++) {
              bullets.push({
                x: boss.x + (i - 1) * 16,
                y: boss.y + boss.height / 2,
                vy: ENEMY_BULLET_SPEED * 1.3,
                isPlayer: false,
              });
            }
            boss.attackTimer = 0.8;
            break;

          case 2:
            // Spiral -- 8 bullets in a ring
            for (let i = 0; i < 8; i++) {
              const angle = (Math.PI * 2 * i) / 8 + boss.time;
              bullets.push({
                x: boss.x,
                y: boss.y + boss.height / 2,
                vx: Math.cos(angle) * ENEMY_BULLET_SPEED * 0.5,
                vy: Math.sin(angle) * ENEMY_BULLET_SPEED * 0.5 + ENEMY_BULLET_SPEED * 0.4,
                isPlayer: false,
              });
            }
            boss.attackTimer = 1.5;
            break;
        }
      }
      break;

    case 'dying':
      boss.deathTimer += dt;
      if (boss.deathTimer > 2.0) {
        boss.active = false;
      }
      break;
  }
}

export function hitBoss(boss: BossEntity | null): boolean {
  if (!boss || boss.phase !== 'fight') return false;

  boss.hp -= 1;
  boss.flashTimer = 0.06;

  if (boss.hp <= 0) {
    boss.phase = 'dying';
    boss.deathTimer = 0;
    return true; // killed
  }
  return false; // damaged
}

export function isBossDefeated(boss: BossEntity | null): boolean {
  return boss != null && !boss.active;
}

export function isBossFighting(boss: BossEntity | null): boolean {
  return boss != null && boss.active && boss.phase === 'fight';
}

export function renderBoss(ctx: CanvasRenderingContext2D, boss: BossEntity | null, _time: number): void {
  if (!boss || !boss.active) return;

  ctx.save();
  ctx.translate(Math.floor(boss.x), Math.floor(boss.y));

  const { color1, color2 } = boss.type;

  if (boss.phase === 'dying') {
    // Flash and shake while dying
    const shake = (Math.random() - 0.5) * 6;
    ctx.translate(shake, shake);
    const blink = Math.floor(boss.deathTimer * 10) % 2;
    if (blink) {
      ctx.globalAlpha = 0.5;
    }
  }

  if (boss.flashTimer > 0) {
    // White flash on hit
    ctx.fillStyle = '#ffffff';
  } else {
    ctx.fillStyle = color1;
  }

  // Main body
  ctx.fillRect(-28, -12, 56, 28);
  ctx.fillRect(-32, -8, 64, 20);

  // Details
  ctx.fillStyle = boss.flashTimer > 0 ? '#ffffff' : color2;
  ctx.fillRect(-24, -8, 48, 16);

  // Eyes (angry)
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(-14, -6, 6, 6);
  ctx.fillRect(8, -6, 6, 6);

  // Eye pupils
  ctx.fillStyle = '#000';
  ctx.fillRect(-12, -4, 3, 3);
  ctx.fillRect(10, -4, 3, 3);

  // Mouth
  ctx.fillStyle = '#000';
  ctx.fillRect(-8, 4, 16, 3);
  ctx.fillRect(-10, 2, 4, 2);
  ctx.fillRect(6, 2, 4, 2);

  // Horns/spikes
  ctx.fillStyle = boss.flashTimer > 0 ? '#ffffff' : color1;
  ctx.fillRect(-30, -18, 6, 8);
  ctx.fillRect(24, -18, 6, 8);
  ctx.fillRect(-20, -20, 6, 10);
  ctx.fillRect(14, -20, 6, 10);

  // Side cannons
  ctx.fillStyle = '#444';
  ctx.fillRect(-36, 0, 8, 8);
  ctx.fillRect(28, 0, 8, 8);
  ctx.fillStyle = '#ff6600';
  ctx.fillRect(-34, 2, 4, 4);
  ctx.fillRect(30, 2, 4, 4);

  ctx.restore();

  // HP bar
  if (boss.phase === 'fight' || boss.phase === 'dying') {
    const barW = 120;
    const barH = 6;
    const barX = (CANVAS_WIDTH - barW) / 2;
    const barY = 32;
    const hpRatio = Math.max(0, boss.hp / boss.maxHp);

    // Background
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);

    // HP fill -- green -> yellow -> red
    let hpColor: string;
    if (hpRatio > 0.5) hpColor = '#44ff44';
    else if (hpRatio > 0.25) hpColor = '#ffcc00';
    else hpColor = '#ff4444';

    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, barW * hpRatio, barH);

    // Border
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    // Boss name
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(boss.type.name, CANVAS_WIDTH / 2, barY - 3);
    ctx.textAlign = 'left';
  }
}
