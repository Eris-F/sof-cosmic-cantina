// ============================================
// WAVE MODIFIERS — Data definitions
// ============================================

import type { ModifierId, ModifierEffects } from '../types/game';

export interface ModifierDef {
  readonly id: ModifierId;
  readonly name: string;
  readonly description: string;
  readonly color: string;
  readonly effects: ModifierEffects;
}

export const MODIFIERS: readonly ModifierDef[] = Object.freeze([
  {
    id: 'normal',
    name: 'STANDARD WAVE',
    description: 'Nothing special',
    color: '#888888',
    effects: {},
  },
  {
    id: 'fast',
    name: 'HYPERSPEED',
    description: 'Enemies move 2x faster!',
    color: '#ff4444',
    effects: { enemySpeedMul: 2.0 },
  },
  {
    id: 'slow',
    name: 'SLOW MOTION',
    description: 'Everything moves at half speed',
    color: '#44ccff',
    effects: { globalTimeMul: 0.5 },
  },
  {
    id: 'swarm',
    name: 'SWARM',
    description: 'Double the enemies!',
    color: '#ff8800',
    effects: { doubleEnemies: true },
  },
  {
    id: 'glass',
    name: 'GLASS CANNON',
    description: 'You deal 3x damage but die in 1 hit',
    color: '#ff44ff',
    effects: { playerDamageMul: 3, oneHitKill: true },
  },
  {
    id: 'rich',
    name: 'GOLD RUSH',
    description: 'Enemies drop 5x coins!',
    color: '#ffcc00',
    effects: { coinMul: 5 },
  },
  {
    id: 'ghost_enemies',
    name: 'PHANTOM WAVE',
    description: 'Enemies flicker in and out',
    color: '#aabbcc',
    effects: { ghostEnemies: true },
  },
  {
    id: 'big',
    name: 'MEGA SIZE',
    description: 'Giant enemies, giant hitboxes',
    color: '#44ff44',
    effects: { enemyScale: 1.8 },
  },
  {
    id: 'tiny',
    name: 'MICRO WAVE',
    description: 'Tiny enemies, hard to hit!',
    color: '#ff88ff',
    effects: { enemyScale: 0.5 },
  },
  {
    id: 'bullet_hell',
    name: 'BULLET HELL',
    description: 'Enemies fire 3x faster!',
    color: '#ff2222',
    effects: { enemyFireMul: 0.33 },
  },
  {
    id: 'pacifist',
    name: 'PACIFIST',
    description: 'Enemies dont shoot! Double score',
    color: '#88ff88',
    effects: { enemiesNoShoot: true, scoreMul: 2 },
  },
  {
    id: 'reversed',
    name: 'MIRROR MODE',
    description: 'Controls are reversed!',
    color: '#cc44ff',
    effects: { reversedControls: true },
  },
  {
    id: 'powerup_rain',
    name: 'POWER RAIN',
    description: 'Every kill drops a power-up!',
    color: '#44ffaa',
    effects: { guaranteedDrops: true },
  },
  {
    id: 'darkness',
    name: 'LIGHTS OUT',
    description: 'Limited visibility!',
    color: '#333366',
    effects: { darkness: true },
  },
  {
    id: 'jackpot',
    name: 'JACKPOT',
    description: '10x coins but 2x enemy speed!',
    color: '#ffdd00',
    effects: { coinMul: 10, enemySpeedMul: 2.0 },
  },
] as const);
