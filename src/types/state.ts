/**
 * State interfaces — shapes for the Zustand store slices.
 *
 * @module types/state
 */
import type { SkillBranchId, ShopItemStats, ModifierEffects } from './game';
import type {
  Bullet,
  EnemyGridState,
  BossState,
  UFOState,
  BarrierGroup,
  Powerup,
  HazardContainerState,
  Companion,
} from './entities';

// ── Weapon ──────────────────────────────────────────────────────────────────

export interface WeaponState {
  activeSlot: number;
  slots: string[];
  cooldownTimer: number;
  swapFlash: number;
}

// ── Player ──────────────────────────────────────────────────────────────────

export interface PlayerState {
  x: number;
  y: number;
  width: number;
  height: number;
  lives: number;
  maxLives: number;
  alive: boolean;
  score: number;
  invincibleTimer: number;
  hitboxMul: number;
  damageMul: number;
  reversedControls: boolean;
  vx: number;
  vy: number;
  weapon: WeaponState;
  _nextLifeAt?: number;
}

// ── Effects sub-states ──────────────────────────────────────────────────────

export interface ComboPopup {
  x: number;
  y: number;
  text: string;
  timer: number;
  lifetime: number;
}

export interface ComboState {
  count: number;
  timer: number;
  popups: ComboPopup[];
}

export interface StreakAnnouncement {
  text: string;
  color: string;
  timer: number;
}

export interface StreakState {
  kills: number;
  lastMilestone: number;
  announcement: StreakAnnouncement | null;
}

export interface ShakeState {
  timer: number;
  intensity: number;
}

export interface SlowmoState {
  timer: number;
  factor: number;
}

export interface ActiveEffects {
  spreadStacks: number;
  spreadTimer: number;
  rapidStacks: number;
  rapidTimer: number;
  shieldHits: number;
  ricochetStacks: number;
  ricochetTimer: number;
}

export interface AbilitiesState {
  tequilaCooldown: number;
  flashCooldown: number;
  freezeTimer: number;
  tequilaFlash: number;
  photoFlash: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  lifetime: number;
  age: number;
}

export interface EffectsState {
  combo: ComboState;
  streak: StreakState;
  particles: Particle[];
  shake: ShakeState;
  slowmo: SlowmoState;
  activeEffects: ActiveEffects;
  abilities: AbilitiesState;
  starfield: { layers: unknown[] };
}

// ── Economy ─────────────────────────────────────────────────────────────────

export interface WalletState {
  coins: number;
  totalEarned: number;
}

export interface OwnedItems {
  [key: string]: string[];
  skins: string[];
  bullets: string[];
  trails: string[];
  barriers: string[];
}

export interface EquippedItems {
  [key: string]: string;
  skins: string;
  bullets: string;
  trails: string;
  barriers: string;
}

export type SkillLevels = Record<SkillBranchId, number> & Record<string, number>;

export type MergedStats = ShopItemStats;

export interface EconomyState {
  wallet: WalletState;
  owned: OwnedItems;
  equipped: EquippedItems;
  achievements: string[];
  highScores: Array<{ name: string; score: number }>;
  skillLevels: SkillLevels;
  mergedStats: MergedStats;
}

// ── UI ──────────────────────────────────────────────────────────────────────

export interface GameStats {
  shotsFired: number;
  shotsHit: number;
  kills: Record<string, number>;
  timeSurvived: number;
  powerupsCollected: number;
  coinsThisGame: number;
}

export interface AchievementPopup {
  name: string;
  desc: string;
  timer: number;
}

export interface UIState {
  menu: { catY: number; catTargetY: number };
  shop: {
    categoryIndex: number;
    itemIndex: number;
    scrollOffset: number;
    flashMessage: string | null;
    flashTimer: number;
  };
  skillTree: {
    selectedBranch: number;
    flashMessage: string | null;
    flashTimer: number;
  };
  tutorial: { page: number };
  highScore: { initials: string[]; initialPos: number };
  gameOver: { timer: number };
  stats: GameStats;
  achievementPopups: AchievementPopup[];
  achievementCooldown: number;
}

// ── Combat ──────────────────────────────────────────────────────────────────

export interface CombatState {
  wave: number;
  isBossWave: boolean;
  grid: EnemyGridState;
  boss: BossState | null;
  bullets: Bullet[];
  barriers: BarrierGroup[];
  ufo: UFOState;
  powerups: Powerup[];
  hazards: HazardContainerState;
  companions: Companion[];
  waveTextTimer: number;
  hitThisWave: boolean;
  modifier: string | null;
  modifierEffects: ModifierEffects & Record<string, unknown>;
  modifierBannerTimer: number;
}

// ── Config ──────────────────────────────────────────────────────────────────

export interface GameConfig {
  difficulty: string;
  gameMode: string;
}

// ── Full Game State ─────────────────────────────────────────────────────────

export interface GameState {
  time: number;
  scene: string;
  player: PlayerState;
  combat: CombatState;
  ui: UIState;
  economy: EconomyState;
  effects: EffectsState;
  config: GameConfig;
}
