/**
 * ComboSystem -- kill combo and streak tracking.
 *
 * Pure logic: reads state from store, computes via Immer, emits events.
 * No rendering, no DOM.
 *
 * @module systems/ComboSystem
 */

import {
  COMBO_INCREMENT,
  COMBO_RESET,
  STREAK_MILESTONE,
  COINS_EARNED,
} from '../core/events';
import type {
  GameStore,
  IEventBus,
  GameState,
  StreakMilestone,
} from '../types/systems';

// ── Constants ────────────────────────────────────────────────────────────────

const COMBO_WINDOW = 0.8;
const POPUP_LIFETIME = 1.0;
const POPUP_RISE_SPEED = 30;
const STREAK_ANNOUNCEMENT_DURATION = 2.0;

const COMBO_LABELS: readonly string[] = [
  '', '', 'DOUBLE!', 'TRIPLE!', 'QUAD!', 'PENTA!', 'MEGA!', 'ULTRA!', 'INSANE!',
];

const STREAK_MILESTONES: readonly StreakMilestone[] = Object.freeze([
  { kills: 10, text: 'KILLING SPREE!', color: '#ff8844' },
  { kills: 20, text: 'UNSTOPPABLE!', color: '#ff4488' },
  { kills: 35, text: 'RAMPAGE!', color: '#ff2222' },
  { kills: 50, text: 'GODLIKE!', color: '#ffcc00' },
  { kills: 75, text: 'LEGENDARY!', color: '#ff44ff' },
  { kills: 100, text: 'BEYOND GODLIKE!', color: '#44ffff' },
]);

/** Combo thresholds that award bonus coins: { threshold: coins } */
const COMBO_COIN_REWARDS: Readonly<Record<number, number>> = Object.freeze({
  3: 5,
  5: 15,
  8: 30,
});

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the combo label for a given count.
 */
function getComboLabel(count: number): string {
  if (count < COMBO_LABELS.length) {
    return COMBO_LABELS[count] ?? `${count}x COMBO!`;
  }
  return `${count}x COMBO!`;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Register a kill at position (x, y). Increments combo, resets timer,
 * increments streak, spawns popup, checks milestones and coin rewards.
 */
export function registerKill(
  store: GameStore,
  bus: IEventBus,
  x: number,
  y: number,
): void {
  let comboCount = 0;
  let streakKills = 0;

  store.update((draft) => {
    const combo = draft.effects.combo;
    const streak = draft.effects.streak;

    combo.timer = COMBO_WINDOW;
    combo.count += 1;
    comboCount = combo.count;

    streak.kills += 1;
    streakKills = streak.kills;

    // Spawn popup for combo >= 2
    if (comboCount >= 2) {
      combo.popups.push({
        x,
        y: y - 10,
        text: getComboLabel(comboCount),
        timer: POPUP_LIFETIME,
        lifetime: POPUP_LIFETIME,
      });
    }

    // Check streak milestones
    for (const m of STREAK_MILESTONES) {
      if (streakKills >= m.kills && streak.lastMilestone < m.kills) {
        streak.lastMilestone = m.kills;
        streak.announcement = {
          text: m.text,
          color: m.color,
          timer: STREAK_ANNOUNCEMENT_DURATION,
        };
      }
    }
  });

  bus.emit(COMBO_INCREMENT, { count: comboCount, x, y });

  // Check combo coin reward thresholds
  const reward = COMBO_COIN_REWARDS[comboCount];
  if (reward !== undefined) {
    bus.emit(COINS_EARNED, { amount: reward, reason: 'combo', comboCount });
  }

  // Check streak milestone (emit after state update)
  for (const m of STREAK_MILESTONES) {
    if (streakKills === m.kills) {
      bus.emit(STREAK_MILESTONE, {
        kills: m.kills,
        text: m.text,
        color: m.color,
      });
    }
  }
}

/**
 * Update combo timer and popups each frame.
 * Resets combo on expiry, removes expired popups.
 */
export function updateCombo(
  store: GameStore,
  bus: IEventBus,
  dt: number,
): void {
  let didReset = false;

  store.update((draft) => {
    const combo = draft.effects.combo;

    // Decrement combo timer
    if (combo.timer > 0) {
      combo.timer -= dt;
      if (combo.timer <= 0) {
        combo.timer = 0;
        combo.count = 0;
        didReset = true;
      }
    }

    // Update popups: float upward, decrement timer, remove expired
    const remaining: typeof combo.popups = [];
    for (const p of combo.popups) {
      const updated = {
        ...p,
        timer: p.timer - dt,
        y: p.y - POPUP_RISE_SPEED * dt,
      };
      if (updated.timer > 0) {
        remaining.push(updated);
      }
    }
    combo.popups = remaining;

    // Update streak announcement
    const streak = draft.effects.streak;
    if (streak.announcement !== null) {
      const newTimer = streak.announcement.timer - dt;
      if (newTimer <= 0) {
        streak.announcement = null;
      } else {
        streak.announcement = { ...streak.announcement, timer: newTimer };
      }
    }
  });

  if (didReset) {
    bus.emit(COMBO_RESET, {});
  }
}

/**
 * Forcefully reset the combo counter and timer.
 */
export function resetCombo(store: GameStore): void {
  store.update((draft) => {
    draft.effects.combo.count = 0;
    draft.effects.combo.timer = 0;
    draft.effects.combo.popups = [];
  });
}

/**
 * Forcefully reset the streak counter.
 */
export function resetStreak(store: GameStore): void {
  store.update((draft) => {
    draft.effects.streak.kills = 0;
    draft.effects.streak.lastMilestone = 0;
    draft.effects.streak.announcement = null;
  });
}

/**
 * Returns the combo multiplier for scoring.
 */
export function getComboMultiplier(state: GameState): number {
  const count = state.effects.combo.count;
  return count >= 2 ? 1 + (count - 1) * 0.1 : 1;
}

// ── Exported constants (for tests and other systems) ─────────────────────────

export { COMBO_WINDOW, STREAK_MILESTONES, COMBO_COIN_REWARDS };
