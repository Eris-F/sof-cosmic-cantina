// ============================================
// WEAPON DEFINITIONS — Data only
// ============================================

import type { WeaponType, WeaponPattern } from '../types/game';

export interface WeaponDef {
  readonly id: WeaponType;
  readonly name: string;
  readonly description: string;
  readonly cooldown: number;
  readonly bulletSpeedMul: number;
  readonly pattern: WeaponPattern;
  readonly spreadAngle?: number;
  readonly bulletCount?: number;
  readonly bulletSpacing?: number;
  readonly pierce?: number;
  readonly spreadRandom?: number;
}

export const WEAPONS: Readonly<Record<WeaponType, WeaponDef>> = Object.freeze({
  standard: {
    id: 'standard',
    name: 'STANDARD',
    description: 'Single shot',
    cooldown: 0.18,
    bulletSpeedMul: 1.0,
    pattern: 'single',
  },
  shotgun: {
    id: 'shotgun',
    name: 'SHOTGUN',
    description: 'Wide 5-shot spread, slower',
    cooldown: 0.55,
    bulletSpeedMul: 0.65,
    pattern: 'spread',
    spreadAngle: 14,
    bulletCount: 5,
    bulletSpacing: 4,
  },
  sniper: {
    id: 'sniper',
    name: 'SNIPER',
    description: 'Slow but piercing',
    cooldown: 0.6,
    bulletSpeedMul: 1.8,
    pattern: 'single',
    pierce: 3,
  },
  minigun: {
    id: 'minigun',
    name: 'MINIGUN',
    description: 'Rapid tiny shots',
    cooldown: 0.07,
    bulletSpeedMul: 0.9,
    pattern: 'single',
    spreadRandom: 20,
  },
} as const);
