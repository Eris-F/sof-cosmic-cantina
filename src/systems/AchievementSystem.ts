/**
 * AchievementSystem -- achievement checking and unlocking.
 *
 * Pure logic: reads state from store, computes via Immer, emits events.
 * No rendering, no DOM.
 *
 * Achievement popups and cooldown live in store.ui so the renderer can
 * access them without desync.
 *
 * @module systems/AchievementSystem
 */

import {
  ACHIEVEMENT_UNLOCKED,
  ENEMY_KILLED,
  BOSS_DEFEATED,
  WAVE_CLEARED,
  POWERUP_COLLECTED,
} from '../core/events';
import type {
  GameStore,
  IEventBus,
  AchievementDef,
  GameState,
} from '../types/systems';

// ── Achievement definitions ──────────────────────────────────────────────────

const CHECK_COOLDOWN = 1.0; // seconds between achievement checks
const POPUP_DURATION = 3.0; // seconds a popup stays visible

/**
 * Sums all kill types from ui.stats.kills.
 */
function totalKills(state: GameState): number {
  const kills = state.ui.stats.kills;
  let total = 0;
  for (const count of Object.values(kills)) {
    total += count;
  }
  return total;
}

export const ACHIEVEMENTS: readonly AchievementDef[] = Object.freeze([
  {
    id: 'first_blood', name: 'FIRST BLOOD', desc: 'Kill your first enemy',
    check: (state: GameState) => totalKills(state) >= 1,
  },
  {
    id: 'wave_5', name: 'WARMING UP', desc: 'Reach wave 5',
    check: (state: GameState) => state.combat.wave >= 5,
  },
  {
    id: 'wave_10', name: 'VETERAN', desc: 'Reach wave 10',
    check: (state: GameState) => state.combat.wave >= 10,
  },
  {
    id: 'wave_20', name: 'LEGEND', desc: 'Reach wave 20',
    check: (state: GameState) => state.combat.wave >= 20,
  },
  {
    id: 'perfect_wave', name: 'PERFECT WAVE', desc: 'Clear a wave without taking damage',
    check: null,
  },
  {
    id: 'tequila_1', name: 'CHEERS!', desc: 'Shoot down a tequila UFO',
    check: (state: GameState) => (state.ui.stats.kills['ufo'] ?? 0) >= 1,
  },
  {
    id: 'tequila_5', name: 'TEQUILA HUNTER', desc: 'Shoot down 5 tequila UFOs',
    check: (state: GameState) => (state.ui.stats.kills['ufo'] ?? 0) >= 5,
  },
  {
    id: 'boss_1', name: 'BOSS SLAYER', desc: 'Defeat a boss',
    check: (state: GameState) => (state.ui.stats.kills['boss'] ?? 0) >= 1,
  },
  {
    id: 'accuracy_80', name: 'SHARPSHOOTER', desc: 'Finish with 80%+ accuracy',
    check: (state: GameState) => {
      const { shotsFired, shotsHit } = state.ui.stats;
      return shotsFired > 10 && (shotsHit / shotsFired) >= 0.8;
    },
  },
  {
    id: 'kills_100', name: 'CENTURION', desc: 'Kill 100 enemies in one game',
    check: (state: GameState) => totalKills(state) >= 100,
  },
  {
    id: 'score_10k', name: 'HIGH ROLLER', desc: 'Score 10,000 points',
    check: (state: GameState) => state.player.score >= 10000,
  },
  {
    id: 'powerup_5', name: 'POWERED UP', desc: 'Collect 5 power-ups in one game',
    check: (state: GameState) => state.ui.stats.powerupsCollected >= 5,
  },
]);

// ── Achievement state management ─────────────────────────────────────────────

/**
 * Checks all achievement conditions against the current game state.
 * Respects a 1-second cooldown between checks to avoid spam.
 * Reads and writes cooldown/popups via the store (ui slice).
 */
export function checkAchievements(
  store: GameStore,
  dt: number,
): string[] {
  const preState = store.getState();
  const currentCooldown = preState.ui.achievementCooldown - dt;

  if (currentCooldown > 0) {
    store.update((draft) => {
      draft.ui.achievementCooldown = currentCooldown;
    });
    return [];
  }

  // Reset cooldown
  store.update((draft) => {
    draft.ui.achievementCooldown = CHECK_COOLDOWN;
  });

  const state = store.getState();
  const unlocked = state.economy.achievements;
  const newlyUnlocked: AchievementDef[] = [];

  for (const ach of ACHIEVEMENTS) {
    if (unlocked.includes(ach.id)) continue;
    if (ach.check === null) continue;
    if (ach.check(state)) {
      newlyUnlocked.push(ach);
    }
  }

  if (newlyUnlocked.length > 0) {
    store.update((draft) => {
      for (const ach of newlyUnlocked) {
        draft.economy.achievements.push(ach.id);
        draft.ui.achievementPopups.push({
          name: ach.name,
          desc: ach.desc,
          timer: POPUP_DURATION,
        });
      }
    });
  }

  return newlyUnlocked.map((a) => a.id);
}

/**
 * Unlocks the perfect_wave achievement if not already unlocked.
 * Called on wave clear with no damage taken.
 */
export function unlockPerfectWave(
  store: GameStore,
): boolean {
  const state = store.getState();
  if (state.economy.achievements.includes('perfect_wave')) {
    return false;
  }

  const ach = ACHIEVEMENTS.find((a) => a.id === 'perfect_wave');

  store.update((draft) => {
    draft.economy.achievements.push('perfect_wave');
    if (ach) {
      draft.ui.achievementPopups.push({
        name: ach.name,
        desc: ach.desc,
        timer: POPUP_DURATION,
      });
    }
  });

  return true;
}

/**
 * Updates popup timers, removing expired popups.
 * Reads and writes popups via the store (ui slice).
 */
export function updatePopups(dt: number, store: GameStore): void {
  const state = store.getState();
  if (state.ui.achievementPopups.length === 0) return;

  store.update((draft) => {
    for (let i = draft.ui.achievementPopups.length - 1; i >= 0; i--) {
      const popup = draft.ui.achievementPopups[i];
      if (!popup) continue;
      popup.timer -= dt;
      if (popup.timer <= 0) {
        draft.ui.achievementPopups.splice(i, 1);
      }
    }
  });
}

// ── Event wiring ─────────────────────────────────────────────────────────────

interface WaveClearedData {
  readonly perfect?: boolean;
}

/**
 * Resets the achievement check cooldown to 0 in the store,
 * forcing an immediate re-check on the next tick.
 */
function resetCooldown(store: GameStore): void {
  store.update((draft) => {
    draft.ui.achievementCooldown = 0;
  });
}

/**
 * Subscribes the AchievementSystem to game events for event-based unlocks.
 * Returns an unsubscribe function.
 */
export function subscribeAchievements(
  bus: IEventBus,
  store: GameStore,
): () => void {
  const unsubs: Array<() => void> = [];

  unsubs.push(
    bus.on(ENEMY_KILLED, () => {
      resetCooldown(store);
    }),
  );

  unsubs.push(
    bus.on(BOSS_DEFEATED, () => {
      resetCooldown(store);
    }),
  );

  unsubs.push(
    bus.on(WAVE_CLEARED, (raw: unknown) => {
      resetCooldown(store);
      const data = raw as WaveClearedData | undefined;
      if (data?.perfect === true) {
        const wasNew = unlockPerfectWave(store);
        if (wasNew) {
          bus.emit(ACHIEVEMENT_UNLOCKED, { id: 'perfect_wave' });
        }
      }
    }),
  );

  unsubs.push(
    bus.on(POWERUP_COLLECTED, () => {
      resetCooldown(store);
    }),
  );

  return () => {
    for (const unsub of unsubs) {
      unsub();
    }
  };
}
