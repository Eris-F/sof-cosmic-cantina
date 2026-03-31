/**
 * GameplayRenderer.ts
 *
 * Renders all gameplay entities during the 'playing' scene. Pure read-only —
 * receives state + ctx + gameTime, draws pixels, returns nothing.
 * ZERO mutations to state.
 *
 * Uses `gameTime` parameter instead of performance.now() for all animations.
 */

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  ENEMY_WIDTH,
  ENEMY_HEIGHT,
  BARRIER_Y,
} from '../constants';
import { getGameHeight } from '../core/Layout';

import {
  drawCatShip,
  drawBreadBullet,
  drawEnemyBullet,
  drawTulipBlock,
  drawLilyBlock,
  drawSmiski,
  drawJellycat,
  drawTieFighter,
  drawTequilaUFO,
} from './SpriteRenderer';

import type { CatSkin } from './SpriteRenderer';

import { renderParticles } from './ParticleRenderer';
import { random } from '../core/Random';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BarrierBlock {
  readonly alive: boolean;
  readonly type: string;
  readonly x: number;
  readonly y: number;
  readonly hp: number;
}

interface BarrierGroup {
  readonly blocks: readonly BarrierBlock[];
}

interface EnemyEntity {
  readonly alive: boolean;
  readonly type: string;
  readonly x: number;
  readonly y: number;
  readonly flashTimer: number;
  readonly elite?: boolean;
  readonly special?: string;
  readonly hp?: number;
  readonly ghostPhase?: number;
}

interface EnemyGrid {
  readonly enemies: readonly EnemyEntity[];
  readonly animFrame: number;
  readonly renderScale?: number;
  readonly ghostFlicker?: boolean;
}

interface BossType {
  readonly color1: string;
  readonly color2: string;
  readonly name: string;
}

interface BossState {
  readonly active: boolean;
  readonly x: number;
  readonly y: number;
  readonly type: BossType;
  readonly phase: string;
  readonly flashTimer: number;
  readonly hp: number;
  readonly maxHp: number;
  readonly deathTimer?: number;
}

interface UFOState {
  readonly active: boolean;
  readonly x: number;
  readonly y: number;
  readonly showScoreTimer: number;
  readonly showScoreValue?: number;
  readonly showScoreX?: number;
}

interface Asteroid {
  readonly x: number;
  readonly y: number;
  readonly rotation: number;
  readonly size: number;
}

interface Laser {
  readonly y: number;
  readonly warmup: number;
  readonly width: number;
}

interface BlackHole {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

interface HazardsState {
  readonly asteroids?: readonly Asteroid[];
  readonly lasers?: readonly Laser[];
  readonly blackHoles?: readonly BlackHole[];
}

interface PowerupEntity {
  readonly alive: boolean;
  readonly type: string;
  readonly x: number;
  readonly y: number;
}

interface BulletEntity {
  readonly isPlayer: boolean;
  readonly x: number;
  readonly y: number;
}

interface PlayerState {
  readonly alive: boolean;
  readonly x: number;
  readonly y: number;
  readonly invincibleTimer: number;
  readonly weapon: WeaponState;
  readonly score: number;
  readonly lives: number;
}

interface WeaponState {
  readonly slots?: readonly string[];
  readonly activeSlot?: number;
  readonly swapFlash?: number;
}

interface ActiveEffectsState {
  readonly shieldHits: number;
  readonly spreadStacks: number;
  readonly spreadTimer: number;
  readonly rapidStacks: number;
  readonly rapidTimer: number;
  readonly ricochetStacks: number;
  readonly ricochetTimer: number;
}

interface ComboPopup {
  readonly timer: number;
  readonly text: string;
  readonly x: number;
  readonly y: number;
}

interface ComboState {
  readonly popups?: readonly ComboPopup[];
}

interface StreakAnnouncement {
  readonly timer: number;
  readonly text: string;
  readonly color: string;
}

interface StreakState {
  readonly announcement?: StreakAnnouncement | null;
  readonly kills: number;
}

interface AchievementPopup {
  readonly timer: number;
  readonly name: string;
  readonly desc: string;
}

interface ModifierState {
  readonly id: string;
  readonly name: string;
  readonly desc: string;
  readonly color: string;
}

interface AbilitiesState {
  readonly tequilaFlash: number;
  readonly photoFlash: number;
  readonly freezeTimer: number;
  readonly tequilaCooldown: number;
  readonly flashCooldown: number;
}

interface ParticleState {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly color: string;
  readonly rotation: number;
  readonly age: number;
  readonly lifetime: number;
}

interface CompanionCat {
  readonly x: number;
  readonly y: number;
}

interface CompanionsState {
  readonly cats?: readonly CompanionCat[];
}

export interface GameplayRenderState {
  readonly combat: {
    readonly barriers: readonly BarrierGroup[] | null;
    readonly isBossWave: boolean;
    readonly boss: BossState | null;
    readonly grid: EnemyGrid;
    readonly ufo: UFOState | null;
    readonly hazards: HazardsState | null;
    readonly powerups: readonly PowerupEntity[] | null;
    readonly bullets: readonly BulletEntity[] | null;
    readonly companions: CompanionsState | readonly CompanionCat[] | null;
    readonly modifier: ModifierState | null;
    readonly modifierBannerTimer: number;
    readonly wave: number;
    readonly waveTextTimer: number;
  };
  readonly effects: {
    readonly activeEffects: ActiveEffectsState;
    readonly particles: readonly ParticleState[];
    readonly combo: ComboState;
    readonly streak: StreakState;
    readonly abilities: AbilitiesState;
  };
  readonly player: PlayerState;
  readonly skin?: CatSkin | null;
  readonly ui?: {
    readonly achievementPopups?: readonly AchievementPopup[];
  };
}

// ---------------------------------------------------------------------------
// Enemy sprite lookup — maps type name to draw function
// ---------------------------------------------------------------------------

type EnemyDrawFn = (ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) => void;

const ENEMY_DRAW_FNS: Readonly<Record<string, EnemyDrawFn>> = {
  smiski: drawSmiski,
  jellycat: drawJellycat,
  tie: drawTieFighter,
};

// ---------------------------------------------------------------------------
// Main gameplay renderer
// ---------------------------------------------------------------------------

/**
 * Renders all gameplay entities in correct z-order.
 */
export function renderGameplay(
  ctx: CanvasRenderingContext2D,
  state: GameplayRenderState,
  gameTime: number,
): void {
  const combat = state.combat;
  const effects = state.effects;
  const player = state.player;

  // 1. Barriers
  renderBarriers(ctx, combat.barriers);

  // 2. Boss OR enemy grid
  if (combat.isBossWave) {
    renderBoss(ctx, combat.boss, gameTime);
  } else {
    renderEnemyGrid(ctx, combat.grid, gameTime);
  }

  // 3. UFO
  renderUfo(ctx, combat.ufo, gameTime);

  // 4. Hazards
  renderHazards(ctx, combat.hazards, gameTime);

  // 5. Powerups
  renderPowerups(ctx, combat.powerups, gameTime);

  // 6. Bullets
  renderBullets(ctx, combat.bullets);

  // 7. Player (with shield rings, invincibility flash)
  renderPlayer(ctx, player, effects.activeEffects, state.skin || null, gameTime);

  // 8. Companions
  renderCompanions(ctx, combat.companions);

  // 9. Particles
  renderParticles(ctx, effects.particles);

  // 10. Combo popups + streak announcements
  renderComboPopups(ctx, effects.combo);
  renderStreakAnnouncement(ctx, effects.streak);

  // 11. Active effects UI (shield/spread/rapid indicators)
  renderActiveEffects(ctx, effects.activeEffects);

  // 12. Achievement popups
  renderAchievementPopups(ctx, state.ui?.achievementPopups);

  // 13. Modifier banner + modifier HUD
  renderModifierBanner(ctx, combat.modifier, combat.modifierBannerTimer);
  renderModifierHUD(ctx, combat.modifier);

  // 14. Ability effects (tequila flash, photo flash)
  renderAbilityEffects(ctx, effects.abilities, gameTime);

  // 15. Weapon HUD
  renderWeaponHUD(ctx, player.weapon, gameTime);
}

// ---------------------------------------------------------------------------
// 1. Barriers
// ---------------------------------------------------------------------------

function renderBarriers(
  ctx: CanvasRenderingContext2D,
  barriers: readonly BarrierGroup[] | null,
): void {
  if (!barriers) return;

  for (const group of barriers) {
    for (const block of group.blocks) {
      if (!block.alive) continue;

      if (block.type === 'tulip') {
        drawTulipBlock(ctx, block.x, block.y, block.hp);
      } else {
        drawLilyBlock(ctx, block.x, block.y, block.hp);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 2a. Enemy grid
// ---------------------------------------------------------------------------

/**
 * Finds the lowest Y position among alive enemies.
 */
function getLowestEnemyY(grid: EnemyGrid): number {
  let maxY = 0;
  for (const e of grid.enemies) {
    if (e.alive && e.y > maxY) maxY = e.y;
  }
  return maxY;
}

function renderEnemyGrid(
  ctx: CanvasRenderingContext2D,
  grid: EnemyGrid | null,
  gameTime: number,
): void {
  if (!grid || !grid.enemies) return;

  const lowestY = getLowestEnemyY(grid);
  const dangerZone = lowestY > BARRIER_Y - 60;
  const scale = grid.renderScale || 1;
  const ghostFlicker = grid.ghostFlicker || false;

  for (const e of grid.enemies) {
    if (!e.alive) continue;

    const drawFn = ENEMY_DRAW_FNS[e.type] || drawSmiski;

    // ghostFlicker: enemies flicker in and out
    if (ghostFlicker || e.special === 'ghost_enemy') {
      const phase = e.ghostPhase || (e.x * 0.1 + gameTime * 3);
      const alpha = 0.2 + 0.6 * Math.abs(Math.sin(phase));
      ctx.globalAlpha = alpha;
    }

    // enemyScale modifier
    if (scale !== 1) {
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.scale(scale, scale);
      ctx.translate(-e.x, -e.y);
    }

    // Danger warning: red pulse on bottom-most enemies when close to barriers
    const isBottomEnemy = dangerZone && e.y === lowestY;

    if (e.flashTimer > 0) {
      // White flash on hit
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      drawFn(ctx, e.x, e.y, grid.animFrame);
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(
        e.x - ENEMY_WIDTH / 2,
        e.y - ENEMY_HEIGHT / 2,
        ENEMY_WIDTH,
        ENEMY_HEIGHT,
      );
      ctx.restore();
    } else if (isBottomEnemy) {
      // Red warning pulse
      const pulse = 0.4 + 0.3 * Math.sin(gameTime * 8);
      drawFn(ctx, e.x, e.y, grid.animFrame);
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(
        e.x - ENEMY_WIDTH / 2,
        e.y - ENEMY_HEIGHT / 2,
        ENEMY_WIDTH,
        ENEMY_HEIGHT,
      );
      ctx.restore();
    } else {
      drawFn(ctx, e.x, e.y, grid.animFrame);
    }

    // Elite glow ring
    if (e.elite && e.alive) {
      const pulse = 0.3 + 0.2 * Math.sin(gameTime * 6);
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = '#ffcc00';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(
        e.x - ENEMY_WIDTH / 2 - 2,
        e.y - ENEMY_HEIGHT / 2 - 2,
        ENEMY_WIDTH + 4,
        ENEMY_HEIGHT + 4,
      );
      ctx.restore();
    }

    // Special enemy indicators
    if (e.special && e.alive) {
      renderSpecialIndicator(ctx, e, gameTime);
    }

    // Restore scale transform
    if (scale !== 1) {
      ctx.restore();
    }
    // Reset ghost alpha
    ctx.globalAlpha = 1;
  }
}

/**
 * Draws visual indicators for special enemy types.
 */
function renderSpecialIndicator(
  ctx: CanvasRenderingContext2D,
  e: EnemyEntity,
  gameTime: number,
): void {
  const sp = 0.5 + 0.3 * Math.sin(gameTime * 5);
  ctx.save();
  ctx.globalAlpha = sp;

  switch (e.special) {
    case 'shielded':
      ctx.strokeStyle = '#4488ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(e.x, e.y, ENEMY_WIDTH / 2 + 3, -Math.PI * 0.8, Math.PI * 0.8);
      ctx.stroke();
      break;

    case 'healer':
      ctx.fillStyle = '#44ff44';
      ctx.fillRect(e.x - 1, e.y - ENEMY_HEIGHT / 2 - 5, 2, 5);
      ctx.fillRect(e.x - 2, e.y - ENEMY_HEIGHT / 2 - 4, 4, 2);
      break;

    case 'splitter':
      ctx.fillStyle = '#ff8844';
      ctx.fillRect(e.x - 6, e.y + ENEMY_HEIGHT / 2 + 1, 3, 3);
      ctx.fillRect(e.x + 3, e.y + ENEMY_HEIGHT / 2 + 1, 3, 3);
      break;

    case 'teleporter':
      ctx.fillStyle = '#cc44ff';
      ctx.fillRect(e.x - ENEMY_WIDTH / 2 - 3, e.y - 1, 2, 2);
      ctx.fillRect(e.x + ENEMY_WIDTH / 2 + 1, e.y - 1, 2, 2);
      break;

    case 'bomber':
      ctx.fillStyle = '#ff4400';
      ctx.fillRect(e.x - 3, e.y + ENEMY_HEIGHT / 2, 6, 3);
      ctx.fillRect(e.x - 5, e.y + ENEMY_HEIGHT / 2 + 1, 2, 2);
      ctx.fillRect(e.x + 3, e.y + ENEMY_HEIGHT / 2 + 1, 2, 2);
      break;

    case 'sniper':
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(e.x, e.y + ENEMY_HEIGHT / 2);
      ctx.lineTo(e.x, e.y + ENEMY_HEIGHT / 2 + 10);
      ctx.stroke();
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.arc(e.x, e.y + ENEMY_HEIGHT / 2 + 12, 2, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'tank':
      ctx.strokeStyle = '#888888';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        e.x - ENEMY_WIDTH / 2 - 2,
        e.y - ENEMY_HEIGHT / 2 - 2,
        ENEMY_WIDTH + 4,
        ENEMY_HEIGHT + 4,
      );
      break;

    case 'speed_demon':
      ctx.fillStyle = '#ff44ff';
      for (let si = 1; si <= 3; si++) {
        ctx.globalAlpha = 0.2 / si;
        ctx.fillRect(e.x - ENEMY_WIDTH / 2 - si * 4, e.y - 2, 3, 4);
      }
      break;

    case 'mirror':
      ctx.strokeStyle = '#aaccff';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.strokeRect(
        e.x - ENEMY_WIDTH / 2 - 1,
        e.y - ENEMY_HEIGHT / 2 - 1,
        ENEMY_WIDTH + 2,
        ENEMY_HEIGHT + 2,
      );
      ctx.setLineDash([]);
      break;

    case 'vampire':
      ctx.fillStyle = '#cc0000';
      ctx.fillRect(e.x - 3, e.y + ENEMY_HEIGHT / 2 - 2, 2, 4);
      ctx.fillRect(e.x + 1, e.y + ENEMY_HEIGHT / 2 - 2, 2, 4);
      break;

    case 'summoner':
      ctx.strokeStyle = '#ffaa00';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(e.x, e.y, ENEMY_WIDTH / 2 + 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#ffaa00';
      ctx.font = '6px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('+', e.x, e.y + ENEMY_HEIGHT / 2 + 8);
      ctx.textAlign = 'left';
      break;

    case 'ghost_enemy': {
      const ghostAlpha = 0.3 + 0.3 * Math.sin(e.ghostPhase || gameTime * 2);
      ctx.globalAlpha = ghostAlpha;
      ctx.fillStyle = '#aabbdd';
      ctx.fillRect(
        e.x - ENEMY_WIDTH / 2,
        e.y - ENEMY_HEIGHT / 2,
        ENEMY_WIDTH,
        ENEMY_HEIGHT,
      );
      break;
    }

    case 'berserker': {
      const rage = (e.hp !== undefined && e.hp <= 1) ? 0.8 : 0.3;
      ctx.globalAlpha = rage;
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(
        e.x - ENEMY_WIDTH / 2 - 1,
        e.y - ENEMY_HEIGHT / 2 - 1,
        ENEMY_WIDTH + 2,
        ENEMY_HEIGHT + 2,
      );
      break;
    }

    default:
      break;
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// 2b. Boss
// ---------------------------------------------------------------------------

function renderBoss(
  ctx: CanvasRenderingContext2D,
  boss: BossState | null,
  _gameTime: number,
): void {
  if (!boss || !boss.active) return;

  ctx.save();
  ctx.translate(Math.floor(boss.x), Math.floor(boss.y));

  const { color1, color2 } = boss.type;

  if (boss.phase === 'dying') {
    // Flash and shake while dying
    const shake = (random() - 0.5) * 6;
    ctx.translate(shake, shake);
    const blink = Math.floor((boss.deathTimer || 0) * 10) % 2;
    if (blink) {
      ctx.globalAlpha = 0.5;
    }
  }

  if (boss.flashTimer > 0) {
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

    // HP fill
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

// ---------------------------------------------------------------------------
// 3. UFO
// ---------------------------------------------------------------------------

function renderUfo(
  ctx: CanvasRenderingContext2D,
  ufo: UFOState | null,
  gameTime: number,
): void {
  if (!ufo) return;

  if (ufo.active) {
    drawTequilaUFO(ctx, ufo.x, ufo.y, gameTime);
  }

  // Floating score popup
  if (ufo.showScoreTimer > 0) {
    const alpha = Math.min(1, ufo.showScoreTimer / 0.3);
    const offsetY = (1.2 - ufo.showScoreTimer) * 20;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffff00';
    ctx.font = '12px monospace';
    ctx.fillText(`+${ufo.showScoreValue}`, (ufo.showScoreX || ufo.x) - 16, ufo.y - offsetY);
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// 4. Hazards
// ---------------------------------------------------------------------------

function renderHazards(
  ctx: CanvasRenderingContext2D,
  hazards: HazardsState | null,
  gameTime: number,
): void {
  if (!hazards) return;

  // Asteroids
  const asteroids = hazards.asteroids || [];
  for (const a of asteroids) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.rotation);
    ctx.fillStyle = '#667788';
    ctx.fillRect(-a.size / 2, -a.size / 2, a.size, a.size * 0.8);
    ctx.fillStyle = '#556677';
    ctx.fillRect(
      -a.size / 2 + 2,
      -a.size / 2 + 2,
      a.size - 4,
      a.size * 0.8 - 4,
    );
    // Craters
    ctx.fillStyle = '#445566';
    ctx.fillRect(-a.size / 4, -a.size / 4, a.size / 4, a.size / 4);
    ctx.restore();
  }

  // Lasers
  const lasers = hazards.lasers || [];
  for (const l of lasers) {
    if (l.warmup > 0) {
      // Warning line
      const pulse = 0.3 + 0.3 * Math.sin(gameTime * 10);
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
      const intensity = 0.6 + 0.4 * Math.sin(gameTime * 20);
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
  const blackHoles = hazards.blackHoles || [];
  for (const bh of blackHoles) {
    ctx.save();
    // Gravitational ring effect
    for (let r = 0; r < 3; r++) {
      const ringR = bh.radius - r * 12;
      if (ringR <= 0) continue;
      const alpha = 0.1 + 0.05 * Math.sin(gameTime * 3 + r);
      ctx.strokeStyle = `rgba(100, 50, 200, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(
        bh.x,
        bh.y,
        ringR,
        gameTime * (1 + r * 0.5),
        gameTime * (1 + r * 0.5) + Math.PI * 1.5,
      );
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

// ---------------------------------------------------------------------------
// 5. Powerups
// ---------------------------------------------------------------------------

const POWERUP_COLORS: Readonly<Record<string, string>> = {
  spread: '#ff8844',
  rapid: '#44ccff',
  shield: '#44ff44',
  bomb: '#ff4444',
  ricochet: '#ffff44',
  companion: '#ff88ff',
};

const POWERUP_LABELS: Readonly<Record<string, string>> = {
  spread: 'S',
  rapid: 'R',
  shield: 'H',
  bomb: 'B',
  ricochet: 'W',
  companion: 'C',
};

const POWERUP_SIZE = 14;

function renderPowerups(
  ctx: CanvasRenderingContext2D,
  powerups: readonly PowerupEntity[] | null,
  gameTime: number,
): void {
  if (!powerups) return;

  for (const p of powerups) {
    if (!p.alive) continue;

    const pulse = 0.7 + 0.3 * Math.sin(gameTime * 6);
    const color = POWERUP_COLORS[p.type] || '#ffffff';
    const label = POWERUP_LABELS[p.type] || '?';

    ctx.save();
    ctx.translate(Math.floor(p.x), Math.floor(p.y));

    // Glow
    ctx.globalAlpha = pulse * 0.3;
    ctx.fillStyle = color;
    ctx.fillRect(
      -POWERUP_SIZE / 2 - 2,
      -POWERUP_SIZE / 2 - 2,
      POWERUP_SIZE + 4,
      POWERUP_SIZE + 4,
    );

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

// ---------------------------------------------------------------------------
// 6. Bullets
// ---------------------------------------------------------------------------

function renderBullets(
  ctx: CanvasRenderingContext2D,
  bullets: readonly BulletEntity[] | null,
): void {
  if (!bullets) return;

  for (const b of bullets) {
    if (b.isPlayer) {
      drawBreadBullet(ctx, b.x, b.y);
    } else {
      drawEnemyBullet(ctx, b.x, b.y);
    }
  }
}

// ---------------------------------------------------------------------------
// 7. Player
// ---------------------------------------------------------------------------

function renderPlayer(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  activeEffects: ActiveEffectsState,
  skin: CatSkin | null,
  gameTime: number,
): void {
  if (!player || !player.alive) return;

  // Flash during invincibility (blink every 0.1s)
  if (player.invincibleTimer > 0) {
    const blink = Math.floor(player.invincibleTimer / 0.1) % 2;
    if (blink === 1) {
      ctx.globalAlpha = 0.3;
      ctx.save();
      drawCatShip(ctx, player.x, player.y, skin, gameTime);
      ctx.restore();
      ctx.globalAlpha = 1;
      return;
    }
  }

  // Shield glow — rings scale with stack count
  if (activeEffects && activeEffects.shieldHits > 0) {
    for (let s = 0; s < activeEffects.shieldHits; s++) {
      ctx.save();
      ctx.globalAlpha = 0.2 + 0.08 * Math.sin(gameTime / 0.15 + s);
      ctx.strokeStyle = '#44ff44';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 18 + s * 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawCatShip(ctx, player.x, player.y, skin, gameTime);
}

// ---------------------------------------------------------------------------
// 8. Companions
// ---------------------------------------------------------------------------

function renderCompanions(
  ctx: CanvasRenderingContext2D,
  companions: CompanionsState | readonly CompanionCat[] | null,
): void {
  if (!companions) return;

  const cats = (companions as CompanionsState).cats || companions;
  if (!Array.isArray(cats)) return;

  for (const c of cats) {
    ctx.save();
    ctx.translate(Math.floor(c.x), Math.floor(c.y));

    // Tiny cat
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

// ---------------------------------------------------------------------------
// 10. Combo popups + streak announcements
// ---------------------------------------------------------------------------

function renderComboPopups(
  ctx: CanvasRenderingContext2D,
  combo: ComboState | null,
): void {
  if (!combo || !combo.popups) return;

  for (const p of combo.popups) {
    const alpha = Math.min(1, p.timer / 0.3);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ff44ff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(p.text, p.x, p.y);
    ctx.textAlign = 'left';
    ctx.restore();
  }
}

function renderStreakAnnouncement(
  ctx: CanvasRenderingContext2D,
  streak: StreakState | null,
): void {
  if (!streak || !streak.announcement) return;

  const a = streak.announcement;
  const fadeIn = a.timer > 1.7 ? (2.0 - a.timer) / 0.3 : 1;
  const fadeOut = a.timer < 0.5 ? a.timer / 0.5 : 1;
  const alpha = Math.min(fadeIn, fadeOut);
  const scale = a.timer > 1.7 ? 1 + (2.0 - a.timer) * 2 : 1;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';

  // Flash background
  ctx.fillStyle = a.color;
  ctx.globalAlpha = alpha * 0.08;
  ctx.fillRect(0, CANVAS_HEIGHT / 2 - 30, CANVAS_WIDTH, 60);

  // Text shadow
  ctx.globalAlpha = alpha * 0.5;
  ctx.fillStyle = '#000';
  ctx.font = `bold ${Math.floor(20 * scale)}px monospace`;
  ctx.fillText(a.text, CANVAS_WIDTH / 2 + 2, CANVAS_HEIGHT / 2 + 2);

  // Text
  ctx.globalAlpha = alpha;
  ctx.fillStyle = a.color;
  ctx.fillText(a.text, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  // Kill count
  ctx.font = '10px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`${streak.kills} KILLS`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 18);

  ctx.textAlign = 'left';
  ctx.restore();
}

// ---------------------------------------------------------------------------
// 11. Active effects UI
// ---------------------------------------------------------------------------

function renderActiveEffects(
  ctx: CanvasRenderingContext2D,
  effects: ActiveEffectsState | null,
): void {
  if (!effects) return;

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

// ---------------------------------------------------------------------------
// 12. Achievement popups
// ---------------------------------------------------------------------------

function renderAchievementPopups(
  ctx: CanvasRenderingContext2D,
  popups: readonly AchievementPopup[] | undefined,
): void {
  if (!popups || popups.length === 0) return;

  for (let i = 0; i < popups.length; i++) {
    const p = popups[i]!;
    const fadeAlpha = p.timer < 0.5 ? p.timer / 0.5 : 1;

    ctx.save();
    ctx.globalAlpha = fadeAlpha;

    const boxW = 180;
    const boxH = 30;
    const boxX = (CANVAS_WIDTH - boxW) / 2;
    const boxY = 40 + i * 36;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Star icon
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('\u2605', boxX + 10, boxY + 14);

    // Name
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 8px monospace';
    ctx.fillText(p.name, boxX + 24, boxY + 12);

    // Description
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '10px monospace';
    ctx.fillText(p.desc, boxX + 24, boxY + 23);

    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// 13. Modifier banner + HUD
// ---------------------------------------------------------------------------

function renderModifierBanner(
  ctx: CanvasRenderingContext2D,
  modifier: ModifierState | null,
  timer: number,
): void {
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

function renderModifierHUD(
  ctx: CanvasRenderingContext2D,
  modifier: ModifierState | null,
): void {
  if (!modifier || modifier.id === 'normal') return;

  ctx.fillStyle = modifier.color;
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(modifier.name, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 8);
  ctx.textAlign = 'left';
}

// ---------------------------------------------------------------------------
// 14. Ability effects
// ---------------------------------------------------------------------------

function renderAbilityEffects(
  ctx: CanvasRenderingContext2D,
  abilities: AbilitiesState | null,
  gameTime: number,
): void {
  if (!abilities) return;

  // Tequila bomb flash — golden screen pulse
  if (abilities.tequilaFlash > 0) {
    const alpha = (abilities.tequilaFlash / 0.6) * 0.25;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(0, 0, CANVAS_WIDTH, getGameHeight());
    ctx.restore();

    // "TEQUILA BOMB!" text
    const textAlpha = Math.min(1, abilities.tequilaFlash / 0.2);
    ctx.save();
    ctx.globalAlpha = textAlpha;
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TEQUILA BOMB!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    ctx.textAlign = 'left';
    ctx.restore();
  }

  // Photo flash — white screen flash
  if (abilities.photoFlash > 0) {
    const alpha = (abilities.photoFlash / 0.4) * 0.35;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_WIDTH, getGameHeight());
    ctx.restore();

    const textAlpha = Math.min(1, abilities.photoFlash / 0.15);
    ctx.save();
    ctx.globalAlpha = textAlpha;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('FLASH!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    ctx.textAlign = 'left';
    ctx.restore();
  }

  // Freeze indicator — blue tint
  if (abilities.freezeTimer > 0) {
    const alpha = 0.05 + 0.03 * Math.sin(gameTime * 6);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#4488ff';
    ctx.fillRect(0, 0, CANVAS_WIDTH, getGameHeight());
    ctx.restore();
  }

  // Cooldown indicators
  const cy = getGameHeight() - 16;
  ctx.textAlign = 'center';
  ctx.font = '8px monospace';

  if (abilities.tequilaCooldown > 0) {
    ctx.fillStyle = 'rgba(255, 204, 0, 0.4)';
    ctx.fillText(
      `BOMB ${Math.ceil(abilities.tequilaCooldown)}s`,
      CANVAS_WIDTH / 2 - 45,
      cy,
    );
  } else {
    ctx.fillStyle = 'rgba(255, 204, 0, 0.2)';
    ctx.fillText('BOMB RDY', CANVAS_WIDTH / 2 - 45, cy);
  }

  if (abilities.flashCooldown > 0) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText(
      `FLASH ${Math.ceil(abilities.flashCooldown)}s`,
      CANVAS_WIDTH / 2 + 45,
      cy,
    );
  } else {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillText('FLASH RDY', CANVAS_WIDTH / 2 + 45, cy);
  }

  ctx.textAlign = 'left';
}

// ---------------------------------------------------------------------------
// 15. Weapon HUD
// ---------------------------------------------------------------------------

const WEAPON_NAMES: Readonly<Record<string, string>> = {
  standard: 'STANDARD',
  shotgun: 'SHOTGUN',
  sniper: 'SNIPER',
  minigun: 'MINIGUN',
};

function renderWeaponHUD(
  ctx: CanvasRenderingContext2D,
  weapon: WeaponState,
  _gameTime: number,
): void {
  if (!weapon || !weapon.slots) return;

  const activeIdx = weapon.activeSlot || 0;
  const activeId = weapon.slots[activeIdx] || 'standard';
  const activeName = WEAPON_NAMES[activeId] || activeId.toUpperCase();

  // Find inactive weapon name
  const inactiveIdx = activeIdx === 0 ? (weapon.slots.length > 1 ? 1 : 0) : 0;
  const inactiveId = weapon.slots[inactiveIdx] || 'standard';
  const inactiveName = WEAPON_NAMES[inactiveId] || inactiveId.toUpperCase();

  const y = 580;
  const cx = CANVAS_WIDTH / 2;

  // Swap flash
  if (weapon.swapFlash && weapon.swapFlash > 0) {
    ctx.save();
    ctx.globalAlpha = weapon.swapFlash;
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(activeName, cx, y - 10);
    ctx.restore();
  }

  // Active weapon name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(activeName, cx - 30, y);

  // Swap indicator
  ctx.fillStyle = '#666';
  ctx.font = '8px monospace';
  ctx.fillText('/', cx, y);

  // Inactive weapon
  ctx.fillStyle = '#444';
  ctx.fillText(inactiveName, cx + 30, y);

  // Double-tap hint
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.font = '7px monospace';
  ctx.fillText('2x TAP = SWAP', cx, y + 10);

  ctx.textAlign = 'left';
}
