/**
 * CompanionSystem -- Pure logic for orbiting cat companions.
 *
 * Reads/writes state via store (Immer drafts). Emits events via eventBus.
 * No rendering, no DOM.
 *
 * @module systems/CompanionSystem
 */

import { BULLET_SPEED } from '../constants';
import type { Draft } from 'immer';
import { random } from '../core/Random';
import type {
  GameStore,
  IEventBus,
  ICompanionSystem,
  Bullet,
} from '../types/systems';

// ── Constants ─────────────────────────────────────────────────────────────────

const ORBIT_RADIUS = 28;
const ORBIT_SPEED = 3;
const COMPANION_FIRE_COOLDOWN = 0.6;
const MAX_COMPANIONS = 4;

// ── System factory ────────────────────────────────────────────────────────────

/**
 * Creates the companion cat system.
 */
export function createCompanionSystem(store: GameStore, _eventBus: IEventBus): ICompanionSystem {
  function addCompanion(): void {
    store.update((draft) => {
      if (draft.combat.companions.length >= MAX_COMPANIONS) return;

      const nextId = draft.combat.companions.length > 0
        ? Math.max(...draft.combat.companions.map((c) => c.id)) + 1
        : 0;

      draft.combat.companions.push({
        id: nextId,
        angle: 0,
        x: 0,
        y: 0,
        fireTimer: random() * COMPANION_FIRE_COOLDOWN,
      });

      // Re-distribute angles evenly
      const count = draft.combat.companions.length;
      for (let i = 0; i < count; i++) {
        const companion = draft.combat.companions[i];
        if (companion) {
          companion.angle = (Math.PI * 2 * i) / count;
        }
      }
    });
  }

  function clearCompanions(): void {
    store.update((draft) => {
      draft.combat.companions = [];
    });
  }

  function update(dt: number): void {
    store.update((draft) => {
      if (!draft.combat.companions || draft.combat.companions.length === 0) return;
      if (!draft.player) return;

      const playerX = draft.player.x;
      const playerY = draft.player.y;

      for (const c of draft.combat.companions) {
        c.angle += ORBIT_SPEED * dt;
        c.x = playerX + Math.cos(c.angle) * ORBIT_RADIUS;
        c.y = playerY + Math.sin(c.angle) * ORBIT_RADIUS;

        // Fire weaker bullets
        c.fireTimer -= dt;
        if (c.fireTimer <= 0) {
          c.fireTimer = COMPANION_FIRE_COOLDOWN;
          draft.combat.bullets.push({
            x: c.x,
            y: c.y - 6,
            vx: 0,
            vy: -BULLET_SPEED * 0.7,
            active: true,
            isPlayer: true,
          } as Draft<Bullet>);
        }
      }
    });
  }

  function dispose(): void {
    // No subscriptions to clean up
  }

  return {
    update,
    addCompanion,
    clearCompanions,
    dispose,
  };
}
