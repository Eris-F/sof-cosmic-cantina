// ============================================
// SHARED GAME TYPES — Central type definitions
// ============================================

export type Difficulty = 'easy' | 'normal' | 'hard';
export type GameMode = 'classic' | 'endless' | 'boss_rush';
export type ItemCategory = 'skins' | 'bullets' | 'trails' | 'barriers';
export type EnemyType = 'smiski' | 'jellycat' | 'tie_fighter';
export type SpecialType =
  | 'shielded'
  | 'healer'
  | 'splitter'
  | 'teleporter'
  | 'speed_demon'
  | 'berserker'
  | 'vampire'
  | 'summoner'
  | 'mirror'
  | 'tank'
  | 'bomber'
  | 'sniper'
  | 'phaser'
  | 'gravity'
  | 'ghost_enemy';
export type PowerupType = 'spread' | 'rapid' | 'shield' | 'bomb' | 'ricochet' | 'companion';
export type WeaponType = 'standard' | 'shotgun' | 'sniper' | 'minigun';
export type MovementPattern = 'lock_step' | 'pulse' | 'zigzag_march' | 'breathe' | 'figure8' | 'orbit';

export type SceneId =
  | 'menu'
  | 'playing'
  | 'game_over'
  | 'high_score'
  | 'paused'
  | 'mode_select'
  | 'shop'
  | 'skills'
  | 'tutorial';

export type SkillBranchId = 'tequila' | 'skiing' | 'diving' | 'photography' | 'music';

export type ModifierId =
  | 'normal'
  | 'fast'
  | 'slow'
  | 'swarm'
  | 'glass'
  | 'rich'
  | 'ghost_enemies'
  | 'big'
  | 'tiny'
  | 'bullet_hell'
  | 'pacifist'
  | 'reversed'
  | 'powerup_rain'
  | 'darkness'
  | 'jackpot';

export type BossPattern = 'spread' | 'rapidBurst' | 'spiral' | null;

export type FormationId =
  | 'rectangle'
  | 'diamond'
  | 'arrow'
  | 'x_shape'
  | 'zigzag'
  | 'walls'
  | 'heart'
  | 'spiral'
  | 'cross'
  | 'scatter'
  | 'pincer'
  | 'wave_form'
  | 'fortress'
  | 'checkers'
  | 'tulip'
  | 'cat_face'
  | 'tequila'
  | 'star_wars'
  | 'ski_slope'
  | 'camera'
  | 'dice';

export type WeaponPattern = 'single' | 'spread';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export type ShakePresetId = 'tequilaBomb' | 'bossDefeat' | 'bombPickup' | 'enemyHit' | 'waveClear';

export type AchievementId =
  | 'first_blood'
  | 'wave_5'
  | 'wave_10'
  | 'wave_20'
  | 'perfect_wave'
  | 'tequila_1'
  | 'tequila_5'
  | 'boss_1'
  | 'accuracy_80'
  | 'kills_100'
  | 'score_10k'
  | 'powerup_5';

/** Stat bonuses that a shop item, skill, or modifier can provide. */
export interface ShopItemStats {
  readonly scoreMul?: number;
  readonly coinMul?: number;
  readonly hitboxMul?: number;
  readonly dodgeChance?: number;
  readonly speedMul?: number;
  readonly extraStartLife?: number;
  readonly fireRateMul?: number;
  readonly startShield?: number;
  readonly startCompanion?: number;
  readonly powerupDurationMul?: number;
  readonly bulletSpeedMul?: number;
  readonly pierce?: number;
  readonly ricochetBonus?: number;
  readonly slowOnHit?: boolean;
  readonly maxBulletBonus?: number;
  readonly damageMul?: number;
  readonly enemyBulletSlowMul?: number;
  readonly comboScoreMul?: number;
  readonly enemyMissChance?: number;
  readonly barrierHpBonus?: number;
  readonly barrierRegen?: boolean;
  readonly barrierReflect?: boolean;
  readonly barrierDamage?: boolean;
}

/** Generic entity with position and size. */
export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** A high-score entry. */
export interface HighScoreEntry {
  readonly name: string;
  readonly score: number;
}

/** Star layer configuration. */
export interface StarLayerConfig {
  readonly count: number;
  readonly speed: number;
  readonly sizeMin: number;
  readonly sizeMax: number;
  readonly alpha: number;
}

/** Individual star in the starfield. */
export interface Star {
  readonly x: number;
  readonly y: number;
  readonly size: number;
}

/** Rendered starfield layer. */
export interface StarfieldLayer {
  readonly speed: number;
  readonly alpha: number;
  readonly stars: readonly Star[];
}

/** Modifier effect flags/values. */
export interface ModifierEffects {
  readonly enemySpeedMul?: number;
  readonly globalTimeMul?: number;
  readonly doubleEnemies?: boolean;
  readonly playerDamageMul?: number;
  readonly oneHitKill?: boolean;
  readonly coinMul?: number;
  readonly ghostEnemies?: boolean;
  readonly enemyScale?: number;
  readonly enemyFireMul?: number;
  readonly enemiesNoShoot?: boolean;
  readonly scoreMul?: number;
  readonly reversedControls?: boolean;
  readonly guaranteedDrops?: boolean;
  readonly darkness?: boolean;
}

/** Formation grid cell: 0 = empty, 1 = enemy present. */
export type FormationCell = 0 | 1;

/** A formation grid is a 5-row x 10-col array, or null for full grid. */
export type FormationGrid = readonly (readonly FormationCell[])[] | null;

/** Direction: 1 = right, -1 = left. */
export type Direction = 1 | -1;
