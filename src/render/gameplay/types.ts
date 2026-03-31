/**
 * Shared types for gameplay sub-renderers.
 * @module render/gameplay/types
 */
import type { CatSkin } from '../SpriteRenderer';

export interface BarrierBlock {
  readonly alive: boolean;
  readonly type: string;
  readonly x: number;
  readonly y: number;
  readonly hp: number;
}

export interface BarrierGroup {
  readonly blocks: readonly BarrierBlock[];
}

export interface EnemyEntity {
  readonly alive: boolean;
  readonly type: string;
  readonly x: number;
  readonly y: number;
  readonly flashTimer: number;
  readonly elite?: boolean;
  readonly special?: string;
  readonly hp?: number;
  readonly ghostPhase?: number;
}

export interface EnemyGrid {
  readonly enemies: readonly EnemyEntity[];
  readonly animFrame: number;
  readonly renderScale?: number;
  readonly ghostFlicker?: boolean;
}

export interface BossType {
  readonly color1: string;
  readonly color2: string;
  readonly name: string;
}

export interface BossState {
  readonly active: boolean;
  readonly x: number;
  readonly y: number;
  readonly type: BossType;
  readonly phase: string;
  readonly flashTimer: number;
  readonly hp: number;
  readonly maxHp: number;
  readonly deathTimer?: number;
}

export interface UFOState {
  readonly active: boolean;
  readonly x: number;
  readonly y: number;
  readonly showScoreTimer: number;
  readonly showScoreValue?: number;
  readonly showScoreX?: number;
}

export interface Asteroid {
  readonly x: number;
  readonly y: number;
  readonly rotation: number;
  readonly size: number;
}

export interface Laser {
  readonly y: number;
  readonly warmup: number;
  readonly width: number;
}

export interface BlackHole {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

export interface HazardsState {
  readonly asteroids?: readonly Asteroid[];
  readonly lasers?: readonly Laser[];
  readonly blackHoles?: readonly BlackHole[];
}

export interface PowerupEntity {
  readonly alive: boolean;
  readonly type: string;
  readonly x: number;
  readonly y: number;
}

export interface BulletEntity {
  readonly isPlayer: boolean;
  readonly x: number;
  readonly y: number;
}

export interface PlayerState {
  readonly alive: boolean;
  readonly x: number;
  readonly y: number;
  readonly invincibleTimer: number;
  readonly weapon: WeaponState;
  readonly score: number;
  readonly lives: number;
}

export interface WeaponState {
  readonly slots?: readonly string[];
  readonly activeSlot?: number;
  readonly swapFlash?: number;
}

export interface ActiveEffectsState {
  readonly shieldHits: number;
  readonly spreadStacks: number;
  readonly spreadTimer: number;
  readonly rapidStacks: number;
  readonly rapidTimer: number;
  readonly ricochetStacks: number;
  readonly ricochetTimer: number;
}

export interface ComboPopup {
  readonly timer: number;
  readonly text: string;
  readonly x: number;
  readonly y: number;
}

export interface ComboState {
  readonly popups?: readonly ComboPopup[];
}

export interface StreakAnnouncement {
  readonly timer: number;
  readonly text: string;
  readonly color: string;
}

export interface StreakState {
  readonly announcement?: StreakAnnouncement | null;
  readonly kills: number;
}

export interface AchievementPopup {
  readonly timer: number;
  readonly name: string;
  readonly desc: string;
}

export interface ModifierState {
  readonly id: string;
  readonly name: string;
  readonly desc: string;
  readonly color: string;
}

export interface AbilitiesState {
  readonly tequilaFlash: number;
  readonly photoFlash: number;
  readonly freezeTimer: number;
  readonly tequilaCooldown: number;
  readonly flashCooldown: number;
}

export interface ParticleState {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly color: string;
  readonly rotation: number;
  readonly age: number;
  readonly lifetime: number;
}

export interface CompanionCat {
  readonly x: number;
  readonly y: number;
}

export interface CompanionsState {
  readonly cats?: readonly CompanionCat[];
}

export interface GameplayRenderState {
  readonly combat: {
    readonly barriers: readonly BarrierGroup[] | null;
    readonly isBossWave: boolean;
    readonly boss: BossState | null;
    readonly grid: EnemyGrid;
    readonly ufo: UFOState | null;
    readonly hazards: HazardsState | null;
    readonly powerups: readonly PowerupEntity[] | null;
    readonly bullets: readonly BulletEntity[] | null;
    readonly companions: CompanionsState | readonly CompanionCat[] | null;
    readonly modifier: ModifierState | null;
    readonly modifierBannerTimer: number;
    readonly wave: number;
    readonly waveTextTimer: number;
  };
  readonly effects: {
    readonly activeEffects: ActiveEffectsState;
    readonly particles: readonly ParticleState[];
    readonly combo: ComboState;
    readonly streak: StreakState;
    readonly abilities: AbilitiesState;
  };
  readonly player: PlayerState;
  readonly skin?: CatSkin | null;
  readonly ui?: {
    readonly achievementPopups?: readonly AchievementPopup[];
  };
}
