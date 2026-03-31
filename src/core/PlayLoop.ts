/**
 * Play loop — orchestrates all game systems during the PLAYING scene.
 *
 * Encapsulates resetGame() and updatePlay() behind a deps interface
 * so the module is testable and all dependencies are explicit.
 *
 * @module core/PlayLoop
 */
import { resetGameplayState } from '../state/GameState';
import type { GameState as StateGameState } from '../state/GameState';
import type { SceneActions } from '../scenes/SceneManager';
import type { Draft } from 'immer';
import type { GameStore, IEventBus } from '../types/systems';
import type { GameState } from '../types/state';
import { createLogger } from '../infra/logger';
import { resetEntityIds } from './IdGen';

const log = createLogger('PlayLoop');
import type {
  PlayerActions,
  IPlayerSystem,
  IBulletSystem,
  ICollisionSystem,
  IWaveSystem,
  IEnemySystem,
  IBossSystem,
  ICompanionSystem,
  IHazardSystem,
} from '../types/index';

// ── Dependencies interface ──────────────────────────────────────────────────

export interface PlayLoopDeps {
  // Core
  readonly store: GameStore;
  readonly bus: IEventBus;

  // Systems
  readonly playerSystem: IPlayerSystem;
  readonly bulletSystem: IBulletSystem;
  readonly collisionSystem: ICollisionSystem;
  readonly waveSystem: IWaveSystem;
  readonly enemySystem: IEnemySystem;
  readonly bossSystem: IBossSystem;
  readonly companionSystem: ICompanionSystem;
  readonly hazardSystem: IHazardSystem;

  // Music
  readonly musicPlayer: {
    setIntensity(wave: number): void;
    start(): void;
    update(dt: number): void;
  };

  // Stateless system functions
  readonly getTimeScale: (state: GameState) => number;
  readonly getSkillBonuses: (levels: GameState['economy']['skillLevels']) => Record<string, number | boolean>;
  readonly recomputeMergedStats: (store: GameStore, bonuses: Record<string, number | boolean>) => void;
  readonly resetCombo: (store: GameStore) => void;
  readonly resetStreak: (store: GameStore) => void;
  readonly updatePowerups: (store: GameStore, dt: number) => void;
  readonly updateActiveEffects: (store: GameStore, bus: IEventBus, dt: number) => void;
  readonly updateCombo: (store: GameStore, bus: IEventBus, dt: number) => void;
  readonly updateAbilities: (store: GameStore, dt: number) => void;
  readonly checkNearMiss: (store: GameStore, bus: IEventBus, bullets: readonly { readonly x: number; readonly y: number; readonly isPlayer?: boolean }[], player: { readonly x: number; readonly y: number }) => boolean;
  readonly updateParticles: (store: GameStore, dt: number) => void;
  readonly updateShake: (store: GameStore, dt: number) => void;
  readonly updateSlowMo: (store: GameStore, dt: number) => void;
  readonly checkAchievements: (store: GameStore, dt: number) => void;
  readonly updateAchPopups: (dt: number, store: GameStore) => void;
  readonly updateUfo: (store: GameStore, bus: IEventBus, dt: number) => void;

  // Action builder
  readonly buildPlayerActions: (sceneActions: SceneActions) => PlayerActions;
}

// ── Play services interface ─────────────────────────────────────────────────

export interface PlayServices {
  resetGame(store: GameStore): void;
  updatePlay(store: GameStore, dt: number, actions: SceneActions): void;
}

// ── Factory ─────────────────────────────────────────────────────────────────

/** Wraps a system call with error isolation. Game continues on failure. */
function safeCall(name: string, fn: () => void): void {
  try {
    fn();
  } catch (err: unknown) {
    log.error({ system: name, err }, `System "${name}" threw during update`);
    if (typeof window !== 'undefined' && Array.isArray((window as unknown as Record<string, unknown>).__errors)) {
      ((window as unknown as Record<string, unknown>).__errors as string[]).push(`[${name}] ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

export function createPlayServices(deps: PlayLoopDeps): PlayServices {
  const {
    store, bus,
    playerSystem, bulletSystem, collisionSystem, waveSystem,
    enemySystem, bossSystem, companionSystem, hazardSystem,
    musicPlayer,
    getTimeScale, getSkillBonuses, recomputeMergedStats,
    resetCombo, resetStreak,
    updatePowerups, updateActiveEffects, updateCombo, updateAbilities,
    checkNearMiss, updateParticles, updateShake, updateSlowMo,
    checkAchievements, updateAchPopups, updateUfo,
    buildPlayerActions,
  } = deps;

  return {
    resetGame(_store: GameStore): void {
      resetEntityIds();

      store.update((draft: Draft<GameState>) => {
        resetGameplayState(draft as unknown as StateGameState);
      });

      enemySystem.createGrid(1);
      companionSystem.clearCompanions();
      resetCombo(store);
      resetStreak(store);

      const state = store.getState();
      const bonuses = getSkillBonuses(state.economy.skillLevels);
      recomputeMergedStats(store, bonuses);

      musicPlayer.setIntensity(1);
      musicPlayer.start();
    },

    updatePlay(_store: GameStore, dt: number, actions: SceneActions): void {
      const state = store.getState();
      if (!state.player.alive) return;

      const timeScale: number = getTimeScale(state);
      const scaledDt: number = dt * timeScale;

      store.update((draft: Draft<GameState>) => {
        draft.time += scaledDt;
        draft.ui.stats.timeSurvived += scaledDt;

        if (draft.combat.waveTextTimer > 0) {
          draft.combat.waveTextTimer = Math.max(0, draft.combat.waveTextTimer - scaledDt);
        }

        if (draft.combat.modifierBannerTimer > 0) {
          draft.combat.modifierBannerTimer = Math.max(0, draft.combat.modifierBannerTimer - scaledDt);
        }
      });

      const playerActions = buildPlayerActions(actions);
      safeCall('PlayerSystem', () => playerSystem.update(scaledDt, playerActions));
      safeCall('EnemySystem', () => enemySystem.update(scaledDt));
      safeCall('BossSystem', () => bossSystem.update(scaledDt));
      safeCall('BulletSystem', () => bulletSystem.update(scaledDt));

      const mergedStats = store.getState().economy.mergedStats || {};
      safeCall('CollisionSystem', () => collisionSystem.update(scaledDt, {
        dodgeChance: mergedStats.dodgeChance || 0,
        damageMul: mergedStats.damageMul || 1,
        scoreMul: mergedStats.scoreMul || 1,
      }));

      const combatState = store.getState().combat;
      safeCall('WaveSystem', () => waveSystem.update(scaledDt, {
        difficulty: {},
        coinMul: (mergedStats.coinMul as number | undefined) || 1,
        modCoinMul: (combatState.modifierEffects?.coinMul as number | undefined) || 1,
      }));

      safeCall('PowerupSystem', () => updatePowerups(store, scaledDt));
      safeCall('ActiveEffects', () => updateActiveEffects(store, bus, scaledDt));
      safeCall('CompanionSystem', () => companionSystem.update(scaledDt));
      safeCall('HazardSystem', () => hazardSystem.update(scaledDt));
      safeCall('ComboSystem', () => updateCombo(store, bus, scaledDt));
      safeCall('AbilitySystem', () => updateAbilities(store, scaledDt));

      safeCall('NearMiss', () => {
        const freshState = store.getState();
        checkNearMiss(
          store, bus,
          freshState.combat.bullets,
          { x: freshState.player.x, y: freshState.player.y },
        );
      });

      safeCall('Particles', () => updateParticles(store, scaledDt));
      safeCall('ScreenShake', () => updateShake(store, scaledDt));
      safeCall('SlowMo', () => updateSlowMo(store, scaledDt));
      safeCall('Achievements', () => checkAchievements(store, scaledDt));
      safeCall('AchPopups', () => updateAchPopups(scaledDt, store));
      safeCall('Music', () => musicPlayer.update(scaledDt));
      safeCall('UFO', () => updateUfo(store, bus, scaledDt));
    },
  };
}
