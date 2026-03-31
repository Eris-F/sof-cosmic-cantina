/**
 * Core contracts (IStore, IEventBus) and system interfaces.
 *
 * Entity, state, and definition types have been split into:
 *   - types/entities.ts
 *   - types/state.ts
 *   - types/definitions.ts
 *
 * This file re-exports everything for backwards compatibility.
 *
 * @module types/systems
 */
import type { Draft } from 'immer';
import type { Enemy } from './entities';
import type { GameState } from './state';
import type { DifficultySettings, PlayerActions, CollisionContext, WaveContext } from './definitions';

// ── Store contract ──────────────────────────────────────────────────────────

export interface IStore<S> {
  getState(): S;
  update(fn: (draft: Draft<S>) => void): void;
  subscribe<T>(selector: (state: S) => T, callback: (slice: T) => void): () => void;
  snapshot(): Readonly<S>;
  restore(snap: Readonly<S>): void;
  reset(): void;
  destroy(): void;
}

// ── EventBus contract ───────────────────────────────────────────────────────

export interface IEventBus {
  on(event: string, callback: (data: unknown) => void, context?: unknown): () => void;
  once(event: string, callback: (data: unknown) => void, context?: unknown): () => void;
  off(event: string, callback?: (data: unknown) => void): void;
  emit(event: string, data?: unknown): void;
  emitAsync(event: string, data?: unknown): Promise<void>;
  clear(): void;
  getListenerCount(event?: string): number;
  setDebug(enabled: boolean): void;
}

// ── Convenience aliases ─────────────────────────────────────────────────────

export type GameStore = IStore<GameState>;

// ── System interfaces ───────────────────────────────────────────────────────

export interface ISystem {
  dispose(): void;
}

export interface IPlayerSystem extends ISystem {
  update(dt: number, actions: PlayerActions): void;
  applyDamage(): void;
}

export interface IBulletSystem extends ISystem {
  update(dt: number): void;
}

export interface ICollisionSystem extends ISystem {
  update(dt: number, context?: CollisionContext): void;
}

export interface IWaveSystem extends ISystem {
  update(dt: number, context?: WaveContext): void;
}

export interface IEnemySystem extends ISystem {
  update(dt: number): void;
  createGrid(wave: number, difficulty?: DifficultySettings, doubleEnemies?: boolean): void;
  getAliveEnemies(): readonly Enemy[];
  getLowestEnemyY(): number;
  spawnSplitEnemies(parent: Readonly<Enemy>): void;
}

export interface IBossSystem extends ISystem {
  update(dt: number): void;
  spawnBoss(wave: number): void;
  hitBoss(): boolean;
}

export interface ICompanionSystem extends ISystem {
  update(dt: number): void;
  addCompanion(): void;
  clearCompanions(): void;
}

export interface IHazardSystem extends ISystem {
  update(dt: number): void;
}

// ── Re-exports for backwards compatibility ──────────────────────────────────
// All consumers import from types/index.ts or types/systems.ts — re-export
// everything so existing imports continue to work.

export type {
  Bullet,
  Enemy,
  EnemyGridState,
  BossType,
  BossState,
  UFOState,
  BarrierBlock,
  BarrierGroup,
  AsteroidHazard,
  LaserHazard,
  BlackHoleHazard,
  Hazard,
  HazardContainerState,
  Powerup,
  Companion,
} from './entities';

export type {
  WeaponState,
  PlayerState,
  ComboPopup,
  ComboState,
  StreakAnnouncement,
  StreakState,
  ShakeState,
  SlowmoState,
  ActiveEffects,
  AbilitiesState,
  Particle,
  EffectsState,
  WalletState,
  OwnedItems,
  EquippedItems,
  SkillLevels,
  MergedStats,
  EconomyState,
  GameStats,
  AchievementPopup,
  UIState,
  CombatState,
  GameConfig,
  GameState,
} from './state';

export type {
  WeaponDef,
  ShopItem,
  ShopItemCatalog,
  CategoryDef,
  SkillStatKey,
  SkillLevel,
  SkillBranch,
  SkillBonuses,
  AchievementDef,
  AchievementSystemState,
  DifficultySettings,
  EquippedStats,
  PlayerActions,
  CollisionContext,
  WaveContext,
  ModifierDef,
  EnemyTypeDef,
  CoinRewards,
  StreakMilestone,
  PetalColorKey,
} from './definitions';
