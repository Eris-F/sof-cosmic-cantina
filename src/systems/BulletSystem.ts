import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';
import type {
  GameStore,
  IEventBus,
  IBulletSystem,
} from '../types/systems';

/** Margin beyond canvas edges before bullets are removed. */
const OFF_SCREEN_MARGIN_Y = 12;
const OFF_SCREEN_MARGIN_X = 20;

/** Wall bounce boundary offset. */
const WALL_MARGIN = 4;

/**
 * Creates the bullet system.
 *
 * Handles bullet movement, out-of-bounds cleanup, and ricochet bouncing
 * for player bullets with bounceCount > 0.
 */
export function createBulletSystem(store: GameStore, _eventBus: IEventBus): IBulletSystem {
  return {
    update(dt: number): void {
      store.update((state) => {
        const bullets = state.combat.bullets;
        const ricochetBounces = state.effects.activeEffects.ricochetStacks ?? 0;

        // Process in reverse so splice indices stay valid
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i];
          if (!b) continue;

          // Move
          b.y += b.vy * dt;
          if (b.vx) {
            b.x += b.vx * dt;
          }

          // Ricochet: player bullets bounce off side walls
          if (b.isPlayer && ricochetBounces > 0 && b.vx) {
            const maxBounces = ricochetBounces;
            const bounceCount = b.bounceCount ?? 0;

            if (b.x <= WALL_MARGIN && b.vx < 0 && bounceCount < maxBounces) {
              b.vx = -b.vx;
              b.x = WALL_MARGIN;
              b.bounceCount = bounceCount + 1;
            } else if (
              b.x >= CANVAS_WIDTH - WALL_MARGIN &&
              b.vx > 0 &&
              bounceCount < maxBounces
            ) {
              b.vx = -b.vx;
              b.x = CANVAS_WIDTH - WALL_MARGIN;
              b.bounceCount = bounceCount + 1;
            }
          }

          // Remove off-screen bullets
          if (
            b.y < -OFF_SCREEN_MARGIN_Y ||
            b.y > CANVAS_HEIGHT + OFF_SCREEN_MARGIN_Y ||
            b.x < -OFF_SCREEN_MARGIN_X ||
            b.x > CANVAS_WIDTH + OFF_SCREEN_MARGIN_X
          ) {
            bullets.splice(i, 1);
          }
        }
      });
    },

    dispose(): void {
      // No subscriptions to clean up
    },
  };
}
