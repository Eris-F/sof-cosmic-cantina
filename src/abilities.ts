import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';

const TEQUILA_COOLDOWN = 25;
const TEQUILA_COMBO_TRIGGER = 5;
const TEQUILA_SPLASH_RADIUS = 80;

const FLASH_COOLDOWN = 15;
const FLASH_NEAR_MISS_DIST = 20;
const FLASH_FREEZE_DURATION = 1.5;

export interface AbilitiesState {
  tequilaCooldown: number;
  tequilaTriggered: boolean;
  flashCooldown: number;
  freezeTimer: number;
  tequilaFlash: number;
  photoFlash: number;
}

interface BulletLike {
  readonly x: number;
  readonly y: number;
  readonly isPlayer?: boolean;
}

export function createAbilities(): AbilitiesState {
  return {
    tequilaCooldown: 0,
    tequilaTriggered: false, // set true when triggered, game.js reads + clears
    flashCooldown: 0,
    freezeTimer: 0,
    // Visual feedback
    tequilaFlash: 0,
    photoFlash: 0,
  };
}

export function updateAbilities(abilities: AbilitiesState, dt: number): void {
  if (abilities.tequilaCooldown > 0) {
    abilities.tequilaCooldown = Math.max(0, abilities.tequilaCooldown - dt);
  }
  if (abilities.flashCooldown > 0) {
    abilities.flashCooldown = Math.max(0, abilities.flashCooldown - dt);
  }
  if (abilities.freezeTimer > 0) {
    abilities.freezeTimer = Math.max(0, abilities.freezeTimer - dt);
  }
  if (abilities.tequilaFlash > 0) {
    abilities.tequilaFlash = Math.max(0, abilities.tequilaFlash - dt);
  }
  if (abilities.photoFlash > 0) {
    abilities.photoFlash = Math.max(0, abilities.photoFlash - dt);
  }
}

// Called when player gets a combo kill — triggers tequila bomb at 5x combo
export function checkTequilaTrigger(abilities: AbilitiesState, comboCount: number, _playerX: number, _playerY: number): boolean {
  if (abilities.tequilaCooldown > 0) return false;
  if (comboCount >= TEQUILA_COMBO_TRIGGER && comboCount % TEQUILA_COMBO_TRIGGER === 0) {
    abilities.tequilaCooldown = TEQUILA_COOLDOWN;
    abilities.tequilaTriggered = true;
    abilities.tequilaFlash = 0.6;
    return true;
  }
  return false;
}

// Called every frame with enemy bullet positions — triggers flash on near miss
export function checkNearMiss(abilities: AbilitiesState, playerX: number, playerY: number, bullets: readonly BulletLike[]): boolean {
  if (abilities.flashCooldown > 0) return false;
  if (abilities.freezeTimer > 0) return false;

  for (const b of bullets) {
    if (b.isPlayer) continue;
    const dx = b.x - playerX;
    const dy = b.y - playerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < FLASH_NEAR_MISS_DIST && dist > 5) {
      abilities.flashCooldown = FLASH_COOLDOWN;
      abilities.freezeTimer = FLASH_FREEZE_DURATION;
      abilities.photoFlash = 0.4;
      return true;
    }
  }
  return false;
}

export function isEnemyFrozen(abilities: AbilitiesState): boolean {
  return abilities.freezeTimer > 0;
}

export function getSplashRadius(): number {
  return TEQUILA_SPLASH_RADIUS;
}

// Render visual effects — no buttons, just feedback
export function renderAbilityEffects(ctx: CanvasRenderingContext2D, abilities: AbilitiesState, time: number): void {
  // Tequila bomb flash — golden screen pulse
  if (abilities.tequilaFlash > 0) {
    const alpha = abilities.tequilaFlash / 0.6 * 0.25;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
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
    const alpha = abilities.photoFlash / 0.4 * 0.35;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
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
    const alpha = 0.05 + 0.03 * Math.sin(time * 6);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#4488ff';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();
  }

  // Cooldown indicators — small, unobtrusive at bottom center
  const cy = CANVAS_HEIGHT - 16;
  ctx.textAlign = 'center';
  ctx.font = '8px monospace';

  if (abilities.tequilaCooldown > 0) {
    ctx.fillStyle = 'rgba(255, 204, 0, 0.4)';
    ctx.fillText(`BOMB ${Math.ceil(abilities.tequilaCooldown)}s`, CANVAS_WIDTH / 2 - 45, cy);
  } else {
    ctx.fillStyle = 'rgba(255, 204, 0, 0.2)';
    ctx.fillText('BOMB RDY', CANVAS_WIDTH / 2 - 45, cy);
  }

  if (abilities.flashCooldown > 0) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText(`FLASH ${Math.ceil(abilities.flashCooldown)}s`, CANVAS_WIDTH / 2 + 45, cy);
  } else {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillText('FLASH RDY', CANVAS_WIDTH / 2 + 45, cy);
  }

  ctx.textAlign = 'left';
}
