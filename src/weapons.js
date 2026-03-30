import { BULLET_SPEED } from './constants.js';

export const WEAPON_DEFS = [
  {
    id: 'standard',
    name: 'STANDARD',
    desc: 'Single shot',
    cooldown: 0.18,
    fire: (x, y, bullets) => {
      bullets.push({ x, y, vx: 0, vy: -BULLET_SPEED, active: true, isPlayer: true });
    },
  },
  {
    id: 'shotgun',
    name: 'SHOTGUN',
    desc: 'Wide 5-shot spread, slower',
    cooldown: 0.55,
    fire: (x, y, bullets) => {
      for (let i = -2; i <= 2; i++) {
        const angle = i * 14 * Math.PI / 180;
        bullets.push({
          x: x + i * 4,
          y,
          vx: Math.sin(angle) * BULLET_SPEED * 0.65,
          vy: -Math.cos(angle) * BULLET_SPEED * 0.65,
          active: true,
          isPlayer: true,
        });
      }
    },
  },
  {
    id: 'sniper',
    name: 'SNIPER',
    desc: 'Slow but piercing',
    cooldown: 0.6,
    fire: (x, y, bullets) => {
      bullets.push({
        x, y,
        vx: 0,
        vy: -BULLET_SPEED * 1.8,
        active: true,
        isPlayer: true,
        pierce: 3,
      });
    },
  },
  {
    id: 'minigun',
    name: 'MINIGUN',
    desc: 'Rapid tiny shots',
    cooldown: 0.07,
    fire: (x, y, bullets) => {
      const spread = (Math.random() - 0.5) * 20;
      bullets.push({
        x: x + spread,
        y,
        vx: spread * 2,
        vy: -BULLET_SPEED * 0.9,
        active: true,
        isPlayer: true,
      });
    },
  },
];

export function createWeaponState() {
  return {
    slotA: 0, // index into WEAPON_DEFS
    slotB: 1,
    activeSlot: 'A',
    swapFlash: 0,
  };
}

export function getActiveWeapon(weaponState) {
  const idx = weaponState.activeSlot === 'A' ? weaponState.slotA : weaponState.slotB;
  return WEAPON_DEFS[idx];
}

export function swapWeapon(weaponState) {
  weaponState.activeSlot = weaponState.activeSlot === 'A' ? 'B' : 'A';
  weaponState.swapFlash = 0.5;
  return getActiveWeapon(weaponState);
}

export function updateWeaponState(weaponState, dt) {
  if (weaponState.swapFlash > 0) {
    weaponState.swapFlash = Math.max(0, weaponState.swapFlash - dt);
  }
}

export function renderWeaponHUD(ctx, weaponState, canvasW, time) {
  const active = getActiveWeapon(weaponState);
  const inactiveIdx = weaponState.activeSlot === 'A' ? weaponState.slotB : weaponState.slotA;
  const inactive = WEAPON_DEFS[inactiveIdx];

  // Small weapon indicator at bottom center
  const y = canvasW > 0 ? 580 : 580; // just below play area
  const cx = canvasW / 2;

  // Swap flash
  if (weaponState.swapFlash > 0) {
    ctx.save();
    ctx.globalAlpha = weaponState.swapFlash;
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(active.name, cx, y - 10);
    ctx.restore();
  }

  // Active weapon name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(active.name, cx - 30, y);

  // Swap indicator
  ctx.fillStyle = '#666';
  ctx.font = '8px monospace';
  ctx.fillText('/', cx, y);

  // Inactive weapon
  ctx.fillStyle = '#444';
  ctx.fillText(inactive.name, cx + 30, y);

  // Double-tap hint (faint)
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.font = '7px monospace';
  ctx.fillText('2x TAP = SWAP', cx, y + 10);

  ctx.textAlign = 'left';
}
