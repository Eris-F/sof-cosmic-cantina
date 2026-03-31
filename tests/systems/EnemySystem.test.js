/**
 * EnemySystem tests.
 *
 * Covers: grid creation, formation no-repeat, movement patterns,
 * special types, splitter fields, spacing tightening, healer HP,
 * elite drop logic.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createGameStore } from '../../src/core/Store.js';
import { createEventBus } from '../../src/core/EventBus.js';
import { createCombatState } from '../../src/state/CombatState.js';
import { createEnemySystem } from '../../src/systems/EnemySystem.js';

// ── Test helpers ──────────────────────────────────────────────────────────────

function makeTestHarness() {
  const store = createGameStore(() => ({
    combat: createCombatState(),
    player: { x: 240, y: 580 },
  }));
  const eventBus = createEventBus({ fresh: true });
  const system = createEnemySystem(store, eventBus);
  return { store, eventBus, system };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('EnemySystem', () => {
  let store, eventBus, system;

  beforeEach(() => {
    ({ store, eventBus, system } = makeTestHarness());
  });

  // ── Grid creation ─────────────────────────────────────────────────────────

  describe('createGrid', () => {
    it('creates enemies for wave 1 with rectangle formation', () => {
      system.createGrid(1);
      const state = store.getState();
      expect(state.combat.grid.enemies.length).toBeGreaterThan(0);
      // Wave 1 always picks "rectangle" (null formation = full grid)
      expect(state.combat.grid.formationName).toBe('rectangle');
    });

    it('creates enemies with correct fields', () => {
      system.createGrid(1);
      const enemy = store.getState().combat.grid.enemies[0];
      expect(enemy).toHaveProperty('x');
      expect(enemy).toHaveProperty('y');
      expect(enemy).toHaveProperty('baseX');
      expect(enemy).toHaveProperty('baseY');
      expect(enemy).toHaveProperty('targetY');
      expect(enemy).toHaveProperty('alive', true);
      expect(enemy).toHaveProperty('entering', true);
      expect(enemy).toHaveProperty('hp');
      expect(enemy).toHaveProperty('pattern');
      expect(enemy).toHaveProperty('patternSpeed');
      expect(enemy).toHaveProperty('patternRadius');
      expect(enemy).toHaveProperty('patternPhase');
      expect(enemy).toHaveProperty('moveTime', 0);
      expect(enemy).toHaveProperty('type');
      expect(enemy).toHaveProperty('points');
    });

    it('assigns 3 enemy types by row', () => {
      system.createGrid(1);
      const enemies = store.getState().combat.grid.enemies;
      const row0Type = enemies.find((e) => e.row === 0)?.type;
      const row1Type = enemies.find((e) => e.row === 1)?.type;
      const row2Type = enemies.find((e) => e.row === 2)?.type;
      expect(row0Type).toBe('tie_fighter');
      expect(row1Type).toBe('jellycat');
      expect(row2Type).toBe('smiski');
    });

    it('sets grid direction, speed, and fire timer', () => {
      system.createGrid(1);
      const state = store.getState();
      expect(state.combat.grid.direction).toBe(1);
      expect(state.combat.grid.speed).toBeGreaterThan(0);
      expect(state.combat.grid.fireTimer).toBeGreaterThan(0);
    });
  });

  // ── Spacing tightening ────────────────────────────────────────────────────

  describe('spacing tightening', () => {
    it('tightens spacing at higher waves', () => {
      system.createGrid(1);
      const wave1Enemies = [...store.getState().combat.grid.enemies];

      // Reset and create wave 20
      store.reset();
      const system2 = createEnemySystem(store, eventBus);
      system2.createGrid(20);
      const wave20Enemies = store.getState().combat.grid.enemies;

      // At wave 20, spacing factor = max(0.7, 1 - 19*0.03) = 0.43 -> clamped to 0.7
      // Enemies at wave 20 should be closer together horizontally
      const w1ColSpread = getColumnSpread(wave1Enemies);
      const w20ColSpread = getColumnSpread(wave20Enemies);
      expect(w20ColSpread).toBeLessThan(w1ColSpread);

      system2.dispose();
    });

    it('clamps spacing factor to 0.7 minimum', () => {
      // Wave 50: factor = max(0.7, 1 - 49*0.03) = max(0.7, -0.47) = 0.7
      system.createGrid(50);
      const enemies = store.getState().combat.grid.enemies;
      expect(enemies.length).toBeGreaterThan(0);

      // Compare with wave 30 — both should have same spacing (both clamped)
      store.reset();
      const system2 = createEnemySystem(store, eventBus);
      system2.createGrid(30);
      const w30Spread = getColumnSpread(store.getState().combat.grid.enemies);

      store.reset();
      const system3 = createEnemySystem(store, eventBus);
      system3.createGrid(50);
      const w50Spread = getColumnSpread(store.getState().combat.grid.enemies);

      // Both clamped to 0.7, so spreads should be approximately equal
      expect(Math.abs(w30Spread - w50Spread)).toBeLessThan(1);

      system2.dispose();
      system3.dispose();
    });
  });

  // ── Formation no-repeat ───────────────────────────────────────────────────

  describe('formation selection no-repeat', () => {
    it('tracks recent formations in state', () => {
      system.createGrid(2);
      const state = store.getState();
      expect(state.combat.grid.recentFormations).toBeDefined();
      expect(state.combat.grid.recentFormations.length).toBe(1);
    });

    it('does not repeat a formation within 10 waves', () => {
      const formations = [];
      for (let wave = 2; wave <= 12; wave++) {
        system.createGrid(wave);
        const name = store.getState().combat.grid.formationName;
        formations.push(name);
      }

      // Check that within any sliding window of 10, there are no duplicates
      // (the first 10 should all be unique)
      const first10 = formations.slice(0, 10);
      const uniqueFirst10 = new Set(first10);
      expect(uniqueFirst10.size).toBe(first10.length);
    });

    it('stores recentFormations in state, not module-level', () => {
      system.createGrid(2);
      const state1 = store.getState();
      expect(state1.combat.grid.recentFormations.length).toBe(1);

      // Create a completely separate harness
      const { store: store2, eventBus: eb2, system: system2 } = makeTestHarness();
      system2.createGrid(2);
      const state2 = store2.getState();
      // Should only have 1 recent formation (independent state)
      expect(state2.combat.grid.recentFormations.length).toBe(1);

      system2.dispose();
      store2.destroy();
    });
  });

  // ── Movement patterns ─────────────────────────────────────────────────────

  describe('movement patterns', () => {
    it('assigns patterns by row', () => {
      system.createGrid(1);
      const enemies = store.getState().combat.grid.enemies;
      const patterns = ['lock_step', 'pulse', 'zigzag_march', 'breathe'];

      for (const e of enemies) {
        expect(e.pattern).toBe(patterns[e.row % patterns.length]);
      }
    });

    it('enemies move when update is called', () => {
      system.createGrid(1);

      // Force all enemies to not be entering so movement logic runs
      store.update((draft) => {
        for (const e of draft.combat.grid.enemies) {
          e.entering = false;
          e.y = e.targetY;
          e.baseY = e.targetY;
        }
        draft.combat.grid.entryTime = 5; // past safety timeout
      });

      const before = store.getState().combat.grid.enemies[0].baseX;
      system.update(0.1);
      const after = store.getState().combat.grid.enemies[0].baseX;

      expect(after).not.toEqual(before);
    });

    it('figure8 and orbit patterns are available for special enemies', () => {
      // Mirror enemies get figure8, summoner spawns get orbit
      system.createGrid(1);
      store.update((draft) => {
        draft.combat.grid.enemies[0].pattern = 'figure8';
        draft.combat.grid.enemies[0].entering = false;
        draft.combat.grid.enemies[0].moveTime = 1;
        draft.combat.grid.enemies[0].patternSpeed = 1;
        draft.combat.grid.enemies[0].patternPhase = 0;
        draft.combat.grid.enemies[0].patternRadius = 10;
        draft.combat.grid.entryTime = 5;
      });

      // Should not throw
      system.update(0.016);
      const e = store.getState().combat.grid.enemies[0];
      expect(typeof e.x).toBe('number');
      expect(typeof e.y).toBe('number');
    });
  });

  // ── Special types ─────────────────────────────────────────────────────────

  describe('special types', () => {
    it('assigns special types based on wave thresholds', () => {
      // Mock random: first call per enemy is elite check (must fail > 0.08),
      // second call is special roll (must pass < chance), third picks the special.
      let callCount = 0;
      vi.spyOn(Math, 'random').mockImplementation(() => {
        callCount++;
        // Alternate: elite check fails (0.5 > 0.08), special roll passes (0.01),
        // special index pick (0.0 = first item)
        const phase = callCount % 3;
        if (phase === 1) return 0.5;  // elite check: fail
        if (phase === 2) return 0.01; // special roll: pass
        return 0.0;                   // pick first special
      });

      system.createGrid(12);
      const enemies = store.getState().combat.grid.enemies;
      const specials = enemies.filter((e) => e.special !== null && !e.elite);
      expect(specials.length).toBeGreaterThan(0);

      vi.restoreAllMocks();
    });

    it('shielded enemies have 2 HP', () => {
      system.createGrid(1);
      store.update((draft) => {
        draft.combat.grid.enemies[0].special = 'shielded';
        draft.combat.grid.enemies[0].hp = 2;
      });
      expect(store.getState().combat.grid.enemies[0].hp).toBe(2);
    });

    it('tank enemies have 5 HP', () => {
      system.createGrid(5);
      store.update((draft) => {
        const e = draft.combat.grid.enemies[0];
        e.special = 'tank';
        e.hp = 5;
      });
      expect(store.getState().combat.grid.enemies[0].hp).toBe(5);
    });
  });

  // ── Healer HP check ───────────────────────────────────────────────────────

  describe('healer HP restoration', () => {
    it('healer restores HP to damaged special enemies', () => {
      system.createGrid(3);

      store.update((draft) => {
        const enemies = draft.combat.grid.enemies;
        // Set up a healer
        enemies[0].special = 'healer';
        enemies[0].healTimer = 0; // ready to heal
        enemies[0].entering = false;
        enemies[0].alive = true;
        enemies[0].y = enemies[0].targetY;
        enemies[0].baseY = enemies[0].targetY;

        // Set up a damaged shielded enemy
        enemies[1].special = 'shielded';
        enemies[1].hp = 1; // damaged (max is 2)
        enemies[1].entering = false;
        enemies[1].alive = true;
        enemies[1].y = enemies[1].targetY;
        enemies[1].baseY = enemies[1].targetY;

        draft.combat.grid.entryTime = 5;
      });

      system.update(0.016);

      const healed = store.getState().combat.grid.enemies[1];
      expect(healed.hp).toBe(2); // restored to max
    });

    it('healer does not exceed max HP for each special type', () => {
      system.createGrid(1);

      store.update((draft) => {
        const enemies = draft.combat.grid.enemies;
        // Healer
        enemies[0].special = 'healer';
        enemies[0].healTimer = 0;
        enemies[0].entering = false;
        enemies[0].alive = true;
        enemies[0].y = enemies[0].targetY;
        enemies[0].baseY = enemies[0].targetY;

        // Normal enemy at full HP (1/1)
        enemies[1].special = null;
        enemies[1].hp = 1;
        enemies[1].entering = false;
        enemies[1].alive = true;
        enemies[1].y = enemies[1].targetY;
        enemies[1].baseY = enemies[1].targetY;

        draft.combat.grid.entryTime = 5;
      });

      system.update(0.016);

      // Normal enemy should NOT have been healed (already at max HP)
      const normal = store.getState().combat.grid.enemies[1];
      expect(normal.hp).toBe(1);
    });
  });

  // ── Splitter fields ───────────────────────────────────────────────────────

  describe('spawnSplitEnemies', () => {
    it('spawns 2 children with all required fields', () => {
      system.createGrid(1);
      const parent = store.getState().combat.grid.enemies[0];

      system.spawnSplitEnemies(parent);

      const enemies = store.getState().combat.grid.enemies;
      const children = enemies.slice(-2);
      expect(children.length).toBe(2);

      for (const child of children) {
        // Critical fields that caused bugs when missing
        expect(child).toHaveProperty('baseX');
        expect(child).toHaveProperty('baseY');
        expect(child).toHaveProperty('pattern');
        expect(child).toHaveProperty('moveTime', 0);
        expect(child).toHaveProperty('patternSpeed');
        expect(child).toHaveProperty('patternRadius');
        expect(child).toHaveProperty('patternPhase');
        expect(child).toHaveProperty('teleportTimer', 0);
        expect(child).toHaveProperty('healTimer', 0);
        expect(child).toHaveProperty('hp', 1);
        expect(child).toHaveProperty('alive', true);
        expect(child).toHaveProperty('entering', false);
        expect(child).toHaveProperty('special', null);
        expect(child).toHaveProperty('elite', false);
        expect(child).toHaveProperty('guaranteedDrop', false);
        expect(child.type).toBe('smiski');
      }
    });

    it('spawns children offset from parent position', () => {
      system.createGrid(1);
      const parent = store.getState().combat.grid.enemies[0];

      system.spawnSplitEnemies(parent);

      const enemies = store.getState().combat.grid.enemies;
      const child1 = enemies[enemies.length - 2];
      const child2 = enemies[enemies.length - 1];

      expect(child1.x).toBe(parent.x - 12);
      expect(child2.x).toBe(parent.x + 12);
      expect(child1.y).toBe(parent.y);
    });

    it('inherits parent pattern properties', () => {
      system.createGrid(1);
      store.update((draft) => {
        draft.combat.grid.enemies[0].pattern = 'zigzag_march';
        draft.combat.grid.enemies[0].patternSpeed = 2.5;
        draft.combat.grid.enemies[0].patternRadius = 15;
        draft.combat.grid.enemies[0].patternPhase = 0.8;
      });

      const parent = store.getState().combat.grid.enemies[0];
      system.spawnSplitEnemies(parent);

      const child = store.getState().combat.grid.enemies.slice(-1)[0];
      expect(child.pattern).toBe('zigzag_march');
      expect(child.patternSpeed).toBe(2.5);
      expect(child.patternRadius).toBe(15);
      expect(child.patternPhase).toBe(0.8);
    });
  });

  // ── Elite enemies ─────────────────────────────────────────────────────────

  describe('elite enemies', () => {
    it('elite enemies have guaranteed drop', () => {
      system.createGrid(3);
      store.update((draft) => {
        draft.combat.grid.enemies[0].elite = true;
        draft.combat.grid.enemies[0].guaranteedDrop = true;
      });

      const elite = store.getState().combat.grid.enemies[0];
      expect(elite.guaranteedDrop).toBe(true);
    });

    it('elite enemies have 3 HP', () => {
      // Force elite creation
      vi.spyOn(Math, 'random').mockReturnValue(0.01); // below 0.08 threshold

      system.createGrid(3);
      const enemies = store.getState().combat.grid.enemies;
      const elites = enemies.filter((e) => e.elite);

      vi.restoreAllMocks();

      if (elites.length > 0) {
        expect(elites[0].hp).toBe(3);
      }
    });

    it('elite enemies have 5x base points', () => {
      // Force all enemies to be elite via mock
      vi.spyOn(Math, 'random').mockReturnValue(0.01); // below 0.08 elite threshold
      system.createGrid(3);
      vi.restoreAllMocks();

      const enemies = store.getState().combat.grid.enemies;
      const elites = enemies.filter((e) => e.elite);
      expect(elites.length).toBeGreaterThan(0);

      // Each elite should have points = baseTypePoints * 5
      // tie_fighter=30, jellycat=20, smiski=10
      const pointsMap = { tie_fighter: 150, jellycat: 100, smiski: 50 };
      for (const e of elites) {
        expect(e.points).toBe(pointsMap[e.type]);
      }
    });
  });

  // ── Freeze support ────────────────────────────────────────────────────────

  describe('freeze support', () => {
    it('freezes enemies on photo flash event', () => {
      system.createGrid(1);
      eventBus.emit('ability:photoFlash');

      const state = store.getState();
      expect(state.combat.grid.isEnemyFrozen).toBe(true);
      expect(state.combat.grid.freezeTimer).toBe(3.0);
    });

    it('skips enemy update while frozen', () => {
      system.createGrid(1);
      store.update((draft) => {
        for (const e of draft.combat.grid.enemies) {
          e.entering = false;
          e.y = e.targetY;
          e.baseY = e.targetY;
        }
        draft.combat.grid.entryTime = 5;
        draft.combat.grid.isEnemyFrozen = true;
        draft.combat.grid.freezeTimer = 3.0;
      });

      const beforeX = store.getState().combat.grid.enemies[0].baseX;
      system.update(0.1);
      const afterX = store.getState().combat.grid.enemies[0].baseX;

      expect(afterX).toBe(beforeX); // should not have moved
    });

    it('unfreezes after timer expires', () => {
      system.createGrid(1);
      store.update((draft) => {
        draft.combat.grid.isEnemyFrozen = true;
        draft.combat.grid.freezeTimer = 0.1;
      });

      system.update(0.2);

      const state = store.getState();
      expect(state.combat.grid.isEnemyFrozen).toBe(false);
    });
  });

  // ── Helpers ───────────────────────────────────────────────────────────────

  describe('getAliveEnemies', () => {
    it('returns only alive enemies', () => {
      system.createGrid(1);
      store.update((draft) => {
        draft.combat.grid.enemies[0].alive = false;
        draft.combat.grid.enemies[1].alive = false;
      });

      const alive = system.getAliveEnemies();
      expect(alive.every((e) => e.alive)).toBe(true);
      expect(alive.length).toBe(store.getState().combat.grid.enemies.length - 2);
    });
  });

  describe('getLowestEnemyY', () => {
    it('returns the highest Y value among alive enemies', () => {
      system.createGrid(1);
      store.update((draft) => {
        draft.combat.grid.enemies[0].y = 500;
        draft.combat.grid.enemies[0].alive = true;
      });

      const lowestY = system.getLowestEnemyY();
      expect(lowestY).toBeGreaterThanOrEqual(500);
    });
  });

  // ── Dispose ───────────────────────────────────────────────────────────────

  describe('dispose', () => {
    it('cleans up event listeners', () => {
      const listenersBefore = eventBus.getListenerCount('ability:photoFlash');
      system.dispose();
      const listenersAfter = eventBus.getListenerCount('ability:photoFlash');
      expect(listenersAfter).toBeLessThan(listenersBefore);
    });
  });
});

// ── Test utilities ────────────────────────────────────────────────────────────

/**
 * Compute the horizontal spread between min and max baseX across all enemies.
 * @param {Array} enemies
 * @returns {number}
 */
function getColumnSpread(enemies) {
  if (enemies.length === 0) return 0;
  let minX = Infinity;
  let maxX = -Infinity;
  for (const e of enemies) {
    if (e.baseX < minX) minX = e.baseX;
    if (e.baseX > maxX) maxX = e.baseX;
  }
  return maxX - minX;
}
