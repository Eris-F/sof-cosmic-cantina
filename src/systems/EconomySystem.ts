/**
 * EconomySystem -- coin earning and score calculation.
 *
 * Pure logic: reads state from store, computes via Immer, emits events.
 * No rendering, no DOM.
 *
 * @module systems/EconomySystem
 */

import {
  ENEMY_KILLED,
  BOSS_DEFEATED,
  UFO_HIT,
  WAVE_CLEARED,
  COMBO_INCREMENT,
  COINS_EARNED,
} from '../core/events';
import type {
  GameStore,
  IEventBus,
  GameState,
  CoinRewards,
} from '../types/systems';

// ── Coin reward table ────────────────────────────────────────────────────────

export const COIN_REWARDS: CoinRewards = Object.freeze({
  kill: 4,
  eliteKill: 20,
  bossKill: 200,
  ufoKill: 40,
  waveClear: 60,
  perfectWave: 120,
  combo3: 12,
  combo5: 32,
  combo8: 60,
});

// ── Extra life threshold ─────────────────────────────────────────────────────

const EXTRA_LIFE_INTERVAL = 5000;

// ── Core functions ───────────────────────────────────────────────────────────

/**
 * Computes the effective coin multiplier from equipped stats, skill bonuses,
 * and active wave modifier.
 */
function getCoinMultiplier(state: GameState): number {
  const equippedCoinMul = state.economy.mergedStats.coinMul ?? 1;
  const modifierCoinMul = state.combat.modifierEffects.coinMul ?? 1;
  return (typeof equippedCoinMul === 'number' ? equippedCoinMul : 1) *
    (typeof modifierCoinMul === 'number' ? modifierCoinMul : 1);
}

/**
 * Computes the effective score multiplier from equipped stats, skill bonuses,
 * and active wave modifier.
 */
function getScoreMultiplier(state: GameState): number {
  const equippedScoreMul = state.economy.mergedStats.scoreMul ?? 1;
  const modifierScoreMul = state.combat.modifierEffects.scoreMul ?? 1;
  return (typeof equippedScoreMul === 'number' ? equippedScoreMul : 1) *
    (typeof modifierScoreMul === 'number' ? modifierScoreMul : 1);
}

/**
 * Awards coins to the player. Applies coinMul from equipped stats + skill
 * bonuses + modifier. Updates wallet and per-game coin counter.
 */
export function earnCoins(
  store: GameStore,
  baseAmount: number,
): { readonly earned: number } {
  const state = store.getState();
  const multiplier = getCoinMultiplier(state);
  const earned = Math.round(baseAmount * multiplier);

  store.update((draft) => {
    draft.economy.wallet.coins += earned;
    draft.economy.wallet.totalEarned += earned;
    draft.ui.stats.coinsThisGame += earned;
  });

  return { earned };
}

/**
 * Awards score to the player. Applies scoreMul from equipped stats + skill
 * bonuses + modifier. Checks for extra life threshold.
 */
export function earnScore(
  store: GameStore,
  basePoints: number,
): { readonly points: number; readonly extraLife: boolean } {
  const state = store.getState();
  const multiplier = getScoreMultiplier(state);
  const points = Math.round(basePoints * multiplier);

  const prevScore = state.player.score;
  const newScore = prevScore + points;

  const prevMilestone = Math.floor(prevScore / EXTRA_LIFE_INTERVAL);
  const newMilestone = Math.floor(newScore / EXTRA_LIFE_INTERVAL);
  const extraLife = newMilestone > prevMilestone;

  store.update((draft) => {
    draft.player.score = newScore;
    if (extraLife && draft.player.lives < draft.player.maxLives) {
      draft.player.lives += 1;
    }
  });

  return { points, extraLife };
}

// ── Event subscriptions ──────────────────────────────────────────────────────

interface EnemyKilledData {
  readonly elite?: boolean;
}

interface WaveClearedData {
  readonly perfect?: boolean;
}

interface ComboIncrementData {
  readonly combo?: number;
}

/**
 * Wires the EconomySystem to the EventBus. Returns an unsubscribe function.
 */
export function subscribeEconomy(bus: IEventBus, store: GameStore): () => void {
  const unsubs: Array<() => void> = [];

  unsubs.push(
    bus.on(ENEMY_KILLED, (raw: unknown) => {
      const data = raw as EnemyKilledData | undefined;
      const rewardKey: keyof CoinRewards = data?.elite ? 'eliteKill' : 'kill';
      const base = COIN_REWARDS[rewardKey];
      const result = earnCoins(store, base);
      earnScore(store, base * 10);
      bus.emit(COINS_EARNED, { source: rewardKey, amount: result.earned });
    }),
  );

  unsubs.push(
    bus.on(BOSS_DEFEATED, () => {
      const result = earnCoins(store, COIN_REWARDS.bossKill);
      earnScore(store, COIN_REWARDS.bossKill * 10);
      bus.emit(COINS_EARNED, { source: 'bossKill', amount: result.earned });
    }),
  );

  unsubs.push(
    bus.on(UFO_HIT, () => {
      const result = earnCoins(store, COIN_REWARDS.ufoKill);
      earnScore(store, COIN_REWARDS.ufoKill * 10);
      bus.emit(COINS_EARNED, { source: 'ufoKill', amount: result.earned });
    }),
  );

  unsubs.push(
    bus.on(WAVE_CLEARED, (raw: unknown) => {
      const data = raw as WaveClearedData | undefined;
      const isPerfect = data?.perfect === true;
      const base = isPerfect
        ? COIN_REWARDS.waveClear + COIN_REWARDS.perfectWave
        : COIN_REWARDS.waveClear;
      const result = earnCoins(store, base);
      earnScore(store, base * 5);
      bus.emit(COINS_EARNED, {
        source: isPerfect ? 'perfectWave' : 'waveClear',
        amount: result.earned,
      });
    }),
  );

  unsubs.push(
    bus.on(COMBO_INCREMENT, (raw: unknown) => {
      const data = raw as ComboIncrementData | undefined;
      const combo = data?.combo ?? 0;
      let base = 0;
      if (combo >= 8) {
        base = COIN_REWARDS.combo8;
      } else if (combo >= 5) {
        base = COIN_REWARDS.combo5;
      } else if (combo >= 3) {
        base = COIN_REWARDS.combo3;
      }
      if (base > 0) {
        const result = earnCoins(store, base);
        earnScore(store, base * 5);
        bus.emit(COINS_EARNED, { source: `combo${combo}`, amount: result.earned });
      }
    }),
  );

  return () => {
    for (const unsub of unsubs) {
      unsub();
    }
  };
}
