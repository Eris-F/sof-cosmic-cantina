import {
  WAVE_TEXT_DURATION,
  ENEMY_ROWS,
} from '../constants';
import { pickModifier } from '../modifiers';
import {
  WAVE_CLEARED,
  WAVE_START,
  MODIFIER_APPLIED,
  COINS_EARNED,
} from '../core/events';
import type { Draft } from 'immer';
import type {
  GameStore,
  IEventBus,
  IWaveSystem,
  WaveContext,
  DifficultySettings,
  EnemyGridState,
  BossState,
  BarrierGroup,
  ModifierDef,
} from '../types/systems';

/** Base coin reward for clearing a wave. */
const WAVE_CLEAR_COINS = 60;

/** Bonus coins for a perfect (no-hit) wave. */
const PERFECT_WAVE_COINS = 120;

interface WaveSystemDeps {
  readonly createEnemyGrid?: (wave: number, diff?: DifficultySettings) => EnemyGridState;
  readonly createBoss?: (wave: number) => BossState;
  readonly createBarriers?: () => BarrierGroup[];
}

/**
 * Creates the wave system.
 *
 * Handles wave clear detection, wave progression, modifier selection,
 * boss spawning, and barrier reset.
 */
export function createWaveSystem(
  store: GameStore,
  eventBus: IEventBus,
  deps: WaveSystemDeps = {},
): IWaveSystem {
  const createEnemyGrid = deps.createEnemyGrid ?? null;
  const createBoss = deps.createBoss ?? null;
  const createBarriers = deps.createBarriers ?? null;

  return {
    update(_dt: number, context: WaveContext = {}): void {
      const diffSettings = context.difficulty ?? {};
      const coinMul = context.coinMul ?? 1;
      const modCoinMul = context.modCoinMul ?? 1;

      store.update((state) => {
        const player = state.player;
        const combat = state.combat;

        if (!player.alive) return;
        if (combat.waveTextTimer > 0) return;

        // --- Wave clear detection ---
        const isBossWave = combat.isBossWave;
        let waveCleared = false;

        if (isBossWave) {
          waveCleared = combat.boss !== null && !combat.boss.active;
        } else {
          const aliveCount = combat.grid.enemies
            .filter((e) => e.alive).length;
          waveCleared = aliveCount === 0;
        }

        if (!waveCleared) return;

        // --- Award coins ---
        const baseClearCoins = Math.round(WAVE_CLEAR_COINS * coinMul * modCoinMul);
        state.economy.wallet.coins += baseClearCoins;
        state.economy.wallet.totalEarned += baseClearCoins;

        eventBus.emit(COINS_EARNED, { amount: baseClearCoins, reason: 'waveClear' });
        eventBus.emit(WAVE_CLEARED, { wave: combat.wave, perfect: !combat.hitThisWave });

        // Perfect wave bonus (not for wave 1)
        if (!combat.hitThisWave && combat.wave > 1) {
          const perfectCoins = Math.round(PERFECT_WAVE_COINS * coinMul * modCoinMul);
          state.economy.wallet.coins += perfectCoins;
          state.economy.wallet.totalEarned += perfectCoins;
          eventBus.emit(COINS_EARNED, { amount: perfectCoins, reason: 'perfectWave' });
        }

        // --- Advance wave ---
        combat.hitThisWave = false;
        combat.wave += 1;

        // --- Pick modifier ---
        const modifier = pickModifier(combat.wave) as ModifierDef;
        combat.modifier = modifier.id;
        combat.modifierEffects = modifier.apply() as Draft<typeof combat.modifierEffects>;
        combat.modifierBannerTimer = 3.0;

        eventBus.emit(MODIFIER_APPLIED, {
          wave: combat.wave,
          modifier: modifier.id,
          effects: combat.modifierEffects,
        });

        // oneHitKill modifier: set lives to 1
        if (combat.modifierEffects.oneHitKill) {
          player.lives = 1;
        }

        // reversedControls modifier
        player.reversedControls = !!combat.modifierEffects.reversedControls;

        // --- Spawn next wave ---
        const doubleEnemies = combat.modifierEffects.doubleEnemies;
        const waveDiff: DifficultySettings = doubleEnemies
          ? { ...diffSettings, extraRows: (diffSettings.extraRows ?? 0) + ENEMY_ROWS }
          : diffSettings;

        const gameMode = state.config.gameMode;

        if (gameMode === 'endless') {
          combat.boss = null;
          combat.isBossWave = false;
          if (createEnemyGrid) {
            combat.grid = createEnemyGrid(combat.wave, waveDiff) as Draft<typeof combat.grid>;
          }
        } else {
          combat.isBossWave = combat.wave % 5 === 0;
          if (combat.isBossWave && createBoss) {
            combat.boss = createBoss(combat.wave) as Draft<typeof combat.boss>;
          } else {
            combat.boss = null;
          }
          if (createEnemyGrid) {
            combat.grid = createEnemyGrid(combat.wave, waveDiff) as Draft<typeof combat.grid>;
          }
          if (createBarriers) {
            combat.barriers = createBarriers() as Draft<typeof combat.barriers>;
          }
        }

        // --- Reset per-wave state ---
        combat.bullets.length = 0;
        combat.powerups.length = 0;
        combat.waveTextTimer = WAVE_TEXT_DURATION;

        eventBus.emit(WAVE_START, {
          wave: combat.wave,
          isBossWave: combat.isBossWave,
          modifier: modifier.id,
        });
      });
    },

    dispose(): void {
      // No subscriptions to clean up
    },
  };
}
