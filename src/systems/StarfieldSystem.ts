/**
 * Starfield + UFO update logic.
 *
 * Pure state updates via store — no rendering.
 *
 * @module systems/StarfieldSystem
 */
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';
import { UFO_SPAWNED } from '../core/events';
import type { Draft } from 'immer';
import type { GameStore, IEventBus } from '../types/systems';
import type { GameState } from '../types/state';
import { random } from '../core/Random';

interface StarfieldStar {
  x: number;
  y: number;
  size: number;
}

interface StarfieldLayer {
  speed: number;
  alpha: number;
  stars: StarfieldStar[];
}

interface LayeredStarfield {
  layers?: StarfieldLayer[];
}

/**
 * Moves starfield stars downward. Call every frame regardless of scene.
 */
export function updateStarfield(store: GameStore, dt: number): void {
  store.update((draft: Draft<GameState>) => {
    const starfield = draft.effects.starfield as unknown as LayeredStarfield | undefined;
    if (!starfield || !starfield.layers) return;

    for (const layer of starfield.layers) {
      for (const star of layer.stars) {
        star.y += layer.speed * dt;
        if (star.y > CANVAS_HEIGHT) {
          star.y -= CANVAS_HEIGHT;
          star.x = random() * CANVAS_WIDTH;
        }
      }
    }
  });
}

/**
 * Updates UFO spawn timer and movement. Call during gameplay.
 */
export function updateUfo(store: GameStore, bus: IEventBus, dt: number): void {
  store.update((draft: Draft<GameState>) => {
    const ufo = draft.combat.ufo;
    if (!ufo) return;

    if (ufo.active) {
      ufo.x += ufo.direction * 100 * dt;
      if (ufo.x < -40 || ufo.x > CANVAS_WIDTH + 40) {
        ufo.active = false;
      }
    } else {
      ufo.timer -= dt;
      if (ufo.timer <= 0) {
        const fromLeft: boolean = random() > 0.5;
        ufo.x = fromLeft ? -32 : CANVAS_WIDTH + 32;
        ufo.direction = fromLeft ? 1 : -1;
        ufo.y = 30 + random() * 20;
        ufo.active = true;
        ufo.scoreValue = [50, 100, 150, 200][Math.floor(random() * 4)] ?? 100;
        ufo.timer = 20 + random() * 10;
        bus.emit(UFO_SPAWNED, { x: ufo.x, y: ufo.y });
      }
    }
  });
}
