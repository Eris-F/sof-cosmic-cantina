import {
  CANVAS_WIDTH,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_Y_OFFSET,
  INITIAL_LIVES,
} from '../config/constants';
import { getGameHeight } from '../core/Layout';
import type { WeaponType } from '../types/game';

export interface WeaponState {
  readonly activeSlot: number;
  readonly slots: readonly WeaponType[];
  readonly cooldownTimer: number;
  readonly swapFlash: number;
}

export interface PlayerState {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly lives: number;
  readonly maxLives: number;
  readonly alive: boolean;
  readonly score: number;
  readonly invincibleTimer: number;
  readonly hitboxMul: number;
  readonly damageMul: number;
  readonly reversedControls: boolean;
  readonly vx: number;
  readonly vy: number;
  readonly weapon: WeaponState;
}

/**
 * Creates a fresh player state with default values.
 */
export function createPlayerState(): PlayerState {
  return {
    x: CANVAS_WIDTH / 2,
    y: getGameHeight() - PLAYER_Y_OFFSET,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    lives: INITIAL_LIVES,
    maxLives: INITIAL_LIVES + 2,
    alive: true,
    score: 0,
    invincibleTimer: 0,
    hitboxMul: 1,
    damageMul: 1,
    reversedControls: false,
    vx: 0,
    vy: 0,
    weapon: {
      activeSlot: 0,
      slots: ['standard'],
      cooldownTimer: 0,
      swapFlash: 0,
    },
  };
}
