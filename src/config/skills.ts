// ============================================
// SKILL TREE DEFINITIONS — Data only
// ============================================

import type { SkillBranchId } from '../types/game';

export interface SkillLevel {
  readonly name: string;
  readonly cost: number;
  readonly perk: string;
  readonly stat: string;
  readonly value: number;
}

export interface SkillBranch {
  readonly id: SkillBranchId;
  readonly name: string;
  readonly icon: string;
  readonly color: string;
  readonly description: string;
  readonly levels: readonly SkillLevel[];
}

export const SKILL_BRANCHES: readonly SkillBranch[] = Object.freeze([
  {
    id: 'tequila',
    name: 'TEQUILA TOLERANCE',
    icon: 'T',
    color: '#ccaa44',
    description: 'Offensive power',
    levels: [
      { name: 'Sip', cost: 100, perk: 'Fire Rate +5%', stat: 'fireRate', value: 0.05 },
      { name: 'Shot', cost: 250, perk: 'Fire Rate +10%', stat: 'fireRate', value: 0.10 },
      { name: 'Double', cost: 500, perk: 'Bullet Speed +15%', stat: 'bulletSpeed', value: 0.15 },
      { name: 'Bottle', cost: 1000, perk: 'Extra Bullet +1', stat: 'maxBullets', value: 1 },
      { name: 'Barrel', cost: 2000, perk: 'All Fire Stats +20%', stat: 'allFire', value: 0.20 },
    ],
  },
  {
    id: 'skiing',
    name: 'SKI LEGS',
    icon: 'S',
    color: '#44ccff',
    description: 'Speed & agility',
    levels: [
      { name: 'Bunny Slope', cost: 100, perk: 'Speed +5%', stat: 'speed', value: 0.05 },
      { name: 'Blue Run', cost: 250, perk: 'Speed +10%', stat: 'speed', value: 0.10 },
      { name: 'Red Run', cost: 500, perk: 'Dodge +5%', stat: 'dodge', value: 0.05 },
      { name: 'Black Diamond', cost: 1000, perk: 'Speed +15%', stat: 'speed', value: 0.15 },
      { name: 'Heli-Ski', cost: 2000, perk: 'Dodge +15% Speed +10%', stat: 'allSpeed', value: 0.15 },
    ],
  },
  {
    id: 'diving',
    name: 'DEEP LUNGS',
    icon: 'D',
    color: '#2288cc',
    description: 'Survivability',
    levels: [
      { name: 'Snorkel', cost: 100, perk: '+1 Starting Life', stat: 'lives', value: 1 },
      { name: 'Scuba', cost: 300, perk: 'Shield on Spawn', stat: 'startShield', value: 1 },
      { name: 'Free Dive', cost: 600, perk: 'Invincibility +0.5s', stat: 'invincTime', value: 0.5 },
      { name: 'Saturation', cost: 1200, perk: '+1 Life, Dodge +5%', stat: 'livesDodge', value: 1 },
      { name: 'Mariana', cost: 2500, perk: '+2 Lives, Shield x2', stat: 'allSurvival', value: 2 },
    ],
  },
  {
    id: 'photography',
    name: 'SHARP EYE',
    icon: 'P',
    color: '#ff8844',
    description: 'Coins & scoring',
    levels: [
      { name: 'Point & Shoot', cost: 100, perk: 'Coins +10%', stat: 'coins', value: 0.10 },
      { name: 'DSLR', cost: 250, perk: 'Score +10%', stat: 'score', value: 0.10 },
      { name: 'Mirrorless', cost: 500, perk: 'Coins +20%', stat: 'coins', value: 0.20 },
      { name: 'Medium Format', cost: 1000, perk: 'Score +20%', stat: 'score', value: 0.20 },
      { name: 'Hasselblad', cost: 2000, perk: 'Coins x2 Score +25%', stat: 'allMoney', value: 1.0 },
    ],
  },
  {
    id: 'music',
    name: 'RAVE ENERGY',
    icon: 'R',
    color: '#e94560',
    description: 'Power-ups & allies',
    levels: [
      { name: 'Pre-game', cost: 150, perk: 'Power-Up Duration +10%', stat: 'powerDur', value: 0.10 },
      { name: 'Warm Up', cost: 350, perk: 'Power-Up Drop Rate +5%', stat: 'powerDrop', value: 0.05 },
      { name: 'Main Stage', cost: 700, perk: 'Start with 1 Companion', stat: 'startAlly', value: 1 },
      { name: 'Peak Hour', cost: 1500, perk: 'Power-Up Duration +25%', stat: 'powerDur', value: 0.25 },
      { name: 'After Party', cost: 3000, perk: '+2 Companions, Duration +50%', stat: 'allPower', value: 2 },
    ],
  },
] as const);
