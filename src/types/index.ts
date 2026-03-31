export type {
  Difficulty,
  GameMode,
  ItemCategory,
  EnemyType,
  SpecialType,
  PowerupType,
  WeaponType,
  MovementPattern,
  SceneId,
  SkillBranchId,
  ModifierId,
  BossPattern,
  FormationId,
  WeaponPattern,
  Rarity,
  ShakePresetId,
  AchievementId,
  ShopItemStats,
  Rect,
  HighScoreEntry,
  StarLayerConfig,
  Star,
  StarfieldLayer,
  ModifierEffects,
  FormationCell,
  FormationGrid,
  Direction,
} from './game';

// ── Entity types ────────────────────────────────────────────────────────────
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

// ── State types ─────────────────────────────────────────────────────────────
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

// ── Definition types ────────────────────────────────────────────────────────
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

// ── System contracts ────────────────────────────────────────────────────────
export type {
  IStore,
  IEventBus,
  GameStore,
  ISystem,
  IPlayerSystem,
  IBulletSystem,
  ICollisionSystem,
  IWaveSystem,
  IEnemySystem,
  IBossSystem,
  ICompanionSystem,
  IHazardSystem,
} from './systems';

// Re-import types needed by local interfaces below
import type { IStore } from './systems';
import type { GameState } from './state';
import type { IEventBus } from './systems';

// ── Infrastructure interfaces (used by core/ TypeScript modules) ─────────

/** Callback that removes a subscription. */
export type Unsubscribe = () => void;

/** Event handler callback — receives arbitrary data, may be async. */
export type EventCallback = (...args: unknown[]) => void | Promise<void>;

/** Internal listener shape used by EventBus. */
export interface Listener {
  readonly callback: EventCallback;
  readonly context: unknown;
  readonly once: boolean;
}

export interface EventBusOptions {
  readonly debug?: boolean;
  readonly fresh?: boolean;
}

export interface IServiceLocator {
  register<T>(name: string, instance: T): void;
  registerFactory<T>(name: string, factory: () => T): void;
  resolve<T>(name: string): T;
  has(name: string): boolean;
  freeze(): void;
  reset(): void;
}

export interface ServiceLocatorOptions {
  readonly fresh?: boolean;
}

export interface IGameLoop {
  start(): void;
  stop(): void;
  isRunning(): boolean;
  /** Manually step one update + render tick. For testing. */
  tick(dt?: number): void;
}

export interface GameLoopOptions {
  readonly onUpdate: (dt: number) => void;
  readonly onRender: (alpha: number) => void;
  readonly targetFPS?: number;
}

export interface IScene {
  enter(store: IStore<GameState>, bus: IEventBus, services?: IServiceLocator): void;
  update(dt: number, actions: Action[], store: IStore<GameState>, bus: IEventBus): void;
  exit(store: IStore<GameState>, bus: IEventBus): void;
}

export interface ISceneManager {
  getCurrentScene(): string;
  send(event: string, data?: unknown): void;
  canTransition(event: string): boolean;
  onEnter(scene: string, callback: () => void): Unsubscribe;
  onExit(scene: string, callback: () => void): Unsubscribe;
  register(scene: string, handler: IScene): void;
  update(dt: number, actions: Action[], store: IStore<GameState>, bus: IEventBus): void;
}

export interface Action {
  readonly type: string;
  readonly payload?: unknown;
  readonly timestamp: number;
}

export interface IInputAdapter {
  getHeldActions(): Action[];
  consumePressed(): Action[];
  dispose(): void;
}

export interface IInputManager {
  update(): void;
  getActions(): Action[];
  getHeldActions(): Action[];
  hasAction(type: string): boolean;
  consumeAction(type: string): Action | undefined;
  clear(): void;
  dispose(): void;
  resetTouch(): void;
}

export interface OscillatorResult {
  readonly osc: OscillatorNode;
  readonly gain: GainNode;
}

export interface NoiseResult {
  readonly source: AudioBufferSourceNode;
  readonly gain: GainNode;
}

export interface IAudioManager {
  unlock(): void;
  getContext(): AudioContext | null;
  isUnlocked(): boolean;
  createOscillator(
    type: OscillatorType,
    freq: number,
    duration: number,
    volume: number,
    options?: { readonly ramp?: boolean; readonly freqEnvelope?: (osc: OscillatorNode, ctx: AudioContext) => void },
  ): OscillatorResult | null;
  createNoise(duration: number, volume?: number): NoiseResult | null;
  getActiveNodeCount(): number;
  dispose(): void;
}

export interface IStorageProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  getAll(): Promise<Record<string, unknown>>;
  setAll(data: Record<string, unknown>): Promise<void>;
}

export interface IStorageManager {
  load<T>(key: string): Promise<T | null>;
  save<T>(key: string, value: T): Promise<void>;
  sync(): Promise<boolean>;
  isDirty(): boolean;
  dispose(): void;
}

export interface IRenderer {
  renderFrame(ctx: CanvasRenderingContext2D, state: GameState, gameTime: number): void;
}

export type SceneEventType =
  | 'START_GAME'
  | 'PAUSE'
  | 'RESUME'
  | 'OPEN_SHOP'
  | 'CLOSE_SHOP'
  | 'OPEN_SKILLS'
  | 'CLOSE_SKILLS'
  | 'OPEN_TUTORIAL'
  | 'CLOSE_TUTORIAL'
  | 'PLAYER_DIED'
  | 'SUBMIT_SCORE'
  | 'RETURN_TO_MENU';

export type SceneName =
  | 'menu'
  | 'playing'
  | 'paused'
  | 'shop'
  | 'skillTree'
  | 'tutorial'
  | 'gameOver'
  | 'highScore';

export interface SceneMachineEvent {
  readonly type: SceneEventType;
}
