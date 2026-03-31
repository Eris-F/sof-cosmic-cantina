import { STAR_LAYERS, CANVAS_HEIGHT } from '../config/constants';
import type { StarfieldLayer, Star } from '../types/game';
import { random } from '../core/Random';

export interface ComboState {
  readonly count: number;
  readonly timer: number;
  readonly popups: readonly unknown[];
}

export interface StreakAnnouncement {
  readonly text: string;
  readonly color: string;
  readonly timer: number;
}

export interface StreakState {
  readonly kills: number;
  readonly lastMilestone: number;
  readonly announcement: StreakAnnouncement | null;
}

export interface ShakeState {
  readonly timer: number;
  readonly intensity: number;
}

export interface SlowmoState {
  readonly timer: number;
  readonly factor: number;
}

export interface ActiveEffects {
  readonly spreadStacks: number;
  readonly spreadTimer: number;
  readonly rapidStacks: number;
  readonly rapidTimer: number;
  readonly shieldHits: number;
  readonly ricochetStacks: number;
  readonly ricochetTimer: number;
}

export interface AbilitiesState {
  readonly tequilaCooldown: number;
  readonly flashCooldown: number;
  readonly freezeTimer: number;
  readonly tequilaFlash: number;
  readonly photoFlash: number;
}

export interface StarfieldState {
  readonly layers: readonly StarfieldLayer[];
}

export interface EffectsState {
  readonly combo: ComboState;
  readonly streak: StreakState;
  readonly particles: readonly unknown[];
  readonly shake: ShakeState;
  readonly slowmo: SlowmoState;
  readonly activeEffects: ActiveEffects;
  readonly abilities: AbilitiesState;
  readonly starfield: StarfieldState;
}

/**
 * Builds the initial starfield layers from config.
 * Each star gets a random x/y within the canvas bounds.
 */
function buildStarfieldLayers(): StarfieldLayer[] {
  return STAR_LAYERS.map((cfg) => {
    const stars: Star[] = [];
    for (let i = 0; i < cfg.count; i++) {
      stars.push({
        x: random() * 480,
        y: random() * CANVAS_HEIGHT,
        size: cfg.sizeMin + random() * (cfg.sizeMax - cfg.sizeMin),
      });
    }
    return {
      speed: cfg.speed,
      alpha: cfg.alpha,
      stars,
    };
  });
}

/**
 * Creates a fresh effects state with default values.
 */
export function createEffectsState(): EffectsState {
  return {
    combo: {
      count: 0,
      timer: 0,
      popups: [],
    },
    streak: {
      kills: 0,
      lastMilestone: 0,
      announcement: null,
    },
    particles: [],
    shake: {
      timer: 0,
      intensity: 0,
    },
    slowmo: {
      timer: 0,
      factor: 1,
    },
    activeEffects: {
      spreadStacks: 0,
      spreadTimer: 0,
      rapidStacks: 0,
      rapidTimer: 0,
      shieldHits: 0,
      ricochetStacks: 0,
      ricochetTimer: 0,
    },
    abilities: {
      tequilaCooldown: 0,
      flashCooldown: 0,
      freezeTimer: 0,
      tequilaFlash: 0,
      photoFlash: 0,
    },
    starfield: {
      layers: buildStarfieldLayers(),
    },
  };
}
