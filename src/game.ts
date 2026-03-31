import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  ENEMY_WIDTH,
  ENEMY_HEIGHT,
  ENEMY_ROWS,
  UFO_WIDTH,
  UFO_HEIGHT,
  STATE_MENU,
  STATE_PLAYING,
  STATE_GAME_OVER,
  STATE_HIGH_SCORE,
  STATE_PAUSED,
  STATE_SHOP,
  STATE_SKILLS,
  STATE_TUTORIAL,
  WAVE_TEXT_DURATION,
  HIGH_SCORE_MAX,
} from './constants';
import { isAction, consumeKey, resetTouch } from './input';
import { createStarfield, updateStarfield, renderStarfield } from './effects/starfield';
import { spawnPetals, spawnShatter, updateParticles, renderParticles, clearParticles } from './effects/particles';
import { createPlayer, updatePlayer, renderPlayer, getPlayerBounds, hitPlayer } from './entities/player';
import { updateBullets, renderBullets, bulletHitsRect } from './entities/bullet';
import { createEnemyGrid, updateEnemyGrid, renderEnemyGrid, killEnemy, hitEnemy, flashEnemy, getAliveEnemies, getLowestEnemyY, spawnSplitEnemies } from './entities/enemy';
import { createUfoState, updateUfo, hitUfo, renderUfo } from './entities/ufo';
import { createBarriers, updateBarriers, renderBarriers } from './entities/barrier';
import { maybeSpawnPowerup, updatePowerups, renderPowerups, checkPowerupPickup, createActiveEffects, updateActiveEffects, applyPowerup, renderActiveEffects, consumeShield, hasShield, POWERUP_TYPES } from './entities/powerup';
import type { Powerup } from './entities/powerup';
import type { Bullet } from './entities/bullet';
import { createCompanions, addCompanion, updateCompanions, renderCompanions } from './entities/companion';
import { createBoss, updateBoss, hitBoss, isBossDefeated, isBossFighting, renderBoss } from './entities/boss';
import { DIFFICULTIES, DIFFICULTY_KEYS } from './difficulty';
import type { DifficultyKey, DifficultySettings } from './difficulty';
import { sfxEnemyDeath, sfxPlayerHit, sfxUfoHit, sfxWaveClear, sfxGameOver, sfxMenuSelect, sfxPowerUp } from './audio';
import { triggerShake, updateShake, applyShake } from './effects/screenshake';
import { triggerSlowMo, updateSlowMo, getTimeScale } from './effects/slowmo';
import { pickModifier, renderModifierBanner, renderModifierHUD } from './modifiers';
import type { Modifier, ModifierEffects } from './modifiers';
import { createAbilities, updateAbilities, checkTequilaTrigger, checkNearMiss, isEnemyFrozen, renderAbilityEffects, getSplashRadius } from './abilities';
import type { AbilitiesState } from './abilities';
import { createWeaponState, getActiveWeapon, updateWeaponState, renderWeaponHUD } from './weapons';
import type { WeaponState } from './weapons';
import { createHazards, updateHazards, checkHazardCollision, renderHazards } from './hazards';
import type { HazardsState } from './hazards';
import { registerKill, getComboCount, updateCombo, renderCombo, renderStreakAnnouncement, resetCombo, resetStreak } from './effects/combo';
import { checkAchievements, unlockPerfectWave, updateAchievementPopups, renderAchievementPopups } from './achievements';
import { vibrateHit, vibrateDeath, vibrateWaveClear, vibratePowerup } from './haptic';
import { loadWallet, saveWallet, addCoins, COIN_REWARDS, getEquippedSkin, getEquippedStats } from './shop';
import type { Wallet, SkinItem, CombinedStats } from './shop';
import { SKILL_BRANCHES, getSkillBonuses, createSkillTreeState, renderSkillTree, upgradeSkill, loadSkillLevels } from './skilltree';
import type { SkillBonuses, SkillTreeState } from './skilltree';
import { createTutorialState, renderTutorial, getTutorialPageCount } from './tutorial';
import type { TutorialState } from './tutorial';
import { createShopState, updateShopUI, renderShopUI, handleShopKeyboard } from './shopui';
import type { ShopUIState } from './shopui';
import { updateMusic, setMusicIntensity, startMusic, stopMusic } from './music';

// Use `any` equivalent via index signatures for dynamic entities from non-TS modules
// These will be refined when entity modules are converted

interface KillStats {
  smiski: number;
  jellycat: number;
  tie: number;
  boss: number;
  ufo: number;
  [key: string]: number;
}

interface GameStatsInternal {
  shotsFired: number;
  shotsHit: number;
  kills: KillStats;
  timeSurvived: number;
  powerupsCollected: number;
  maxCombo: number;
}

interface HighScoreEntry {
  readonly name: string;
  readonly score: number;
  readonly wave: number;
}

type GameMode = 'classic' | 'endless';

export interface Game {
  state: number;
  starfield: ReturnType<typeof createStarfield>;
  player: ReturnType<typeof createPlayer> | null;
  bullets: Array<{ x: number; y: number; vx: number; vy: number; active: boolean; isPlayer: boolean; pierce?: number }>;
  grid: ReturnType<typeof createEnemyGrid> | null;
  ufo: ReturnType<typeof createUfoState> | null;
  barriers: ReturnType<typeof createBarriers> | null;
  wave: number;
  time: number;
  waveTextTimer: number;
  gameOverTimer: number;
  powerups: Array<{ x: number; y: number; type: string; alive: boolean }>;
  effects: ReturnType<typeof createActiveEffects>;
  boss: ReturnType<typeof createBoss> | null;
  isBossWave: boolean;
  difficulty: DifficultyKey;
  difficultyIndex: number;
  gameMode: GameMode;
  skin: SkinItem;
  wallet: Wallet;
  shop: ShopUIState;
  skillTree: SkillTreeState;
  tutorial: TutorialState;
  coinsThisGame: number;
  modifier: Modifier | null;
  modifierBannerTimer: number;
  modifierEffects: ModifierEffects;
  abilities: AbilitiesState;
  weapons: WeaponState;
  hazards: HazardsState;
  lastTapTime: number;
  companions: ReturnType<typeof createCompanions>;
  stats: GameStatsInternal;
  hitThisWave?: boolean;
  equippedStats?: CombinedStats;
  skillBonuses?: SkillBonuses;
  mergedStats?: CombinedStats;
  // High score entry
  initials: string[];
  initialPos: number;
  highScores: HighScoreEntry[];
}

export function createGame(): Game {
  return {
    state: STATE_MENU,
    starfield: createStarfield(),
    player: null,
    bullets: [],
    grid: null,
    ufo: null,
    barriers: null,
    wave: 1,
    time: 0,
    waveTextTimer: 0,
    gameOverTimer: 0,
    powerups: [],
    effects: createActiveEffects(),
    boss: null,
    isBossWave: false,
    difficulty: 'normal',
    difficultyIndex: 1,
    gameMode: 'classic',
    skin: getEquippedSkin(),
    wallet: loadWallet(),
    shop: createShopState(),
    skillTree: createSkillTreeState(),
    tutorial: createTutorialState(),
    coinsThisGame: 0,
    modifier: null,
    modifierBannerTimer: 0,
    modifierEffects: {},
    abilities: createAbilities(),
    weapons: createWeaponState(),
    hazards: createHazards(),
    lastTapTime: 0,
    companions: createCompanions(),
    stats: createStats(),
    // High score entry
    initials: ['A', 'A', 'A'],
    initialPos: 0,
    highScores: loadHighScores(),
  };
}

export function updateGame(game: Game, dt: number): void {
  game.time += dt;
  updateStarfield(game.starfield, dt);

  switch (game.state) {
    case STATE_MENU:
      updateMenu(game);
      break;
    case STATE_PLAYING:
      updatePlaying(game, dt);
      break;
    case STATE_GAME_OVER:
      updateGameOver(game, dt);
      break;
    case STATE_HIGH_SCORE:
      updateHighScore(game);
      break;
    case STATE_PAUSED:
      updatePaused(game);
      break;
    case STATE_SHOP:
      updateShopUI(game.shop, dt);
      handleShopKeyboard(game.shop, game, consumeKey);
      break;
    case STATE_TUTORIAL:
      if (consumeKey('Escape')) {
        game.state = STATE_MENU;
      }
      if (consumeKey('ArrowLeft') || consumeKey('KeyA')) {
        game.tutorial.page = Math.max(0, game.tutorial.page - 1);
      }
      if (consumeKey('ArrowRight') || consumeKey('KeyD')) {
        if (game.tutorial.page >= getTutorialPageCount() - 1) {
          game.state = STATE_MENU;
        } else {
          game.tutorial.page += 1;
        }
      }
      break;
    case STATE_SKILLS:
      if (game.skillTree.flashTimer > 0) {
        game.skillTree.flashTimer = Math.max(0, game.skillTree.flashTimer - dt);
      }
      // Keyboard navigation
      if (consumeKey('Escape')) {
        game.state = STATE_MENU;
      }
      if (consumeKey('ArrowUp') || consumeKey('KeyW')) {
        game.skillTree.selectedBranch = Math.max(0, game.skillTree.selectedBranch - 1);
      }
      if (consumeKey('ArrowDown') || consumeKey('KeyS')) {
        game.skillTree.selectedBranch = Math.min(SKILL_BRANCHES.length - 1, game.skillTree.selectedBranch + 1);
      }
      if (consumeKey('Enter') || consumeKey('Space')) {
        const branch = SKILL_BRANCHES[game.skillTree.selectedBranch]!;
        const result = upgradeSkill(branch.id, game.wallet);
        if (result.success) {
          game.wallet = result.wallet;
          saveWallet(game.wallet);
          game.skillTree.levels = loadSkillLevels();
          game.skillTree.flashMessage = `${branch.name} LV${result.newLevel}!`;
          game.skillTree.flashTimer = 1.5;
        }
      }
      break;
  }
}

function updateMenu(game: Game): void {
  if (consumeKey('ArrowLeft') || consumeKey('KeyA')) {
    game.difficultyIndex = (game.difficultyIndex - 1 + DIFFICULTY_KEYS.length) % DIFFICULTY_KEYS.length;
    game.difficulty = DIFFICULTY_KEYS[game.difficultyIndex]!;
    sfxMenuSelect();
  }
  if (consumeKey('ArrowRight') || consumeKey('KeyD')) {
    game.difficultyIndex = (game.difficultyIndex + 1) % DIFFICULTY_KEYS.length;
    game.difficulty = DIFFICULTY_KEYS[game.difficultyIndex]!;
    sfxMenuSelect();
  }
  if (consumeKey('ArrowUp') || consumeKey('ArrowDown') || consumeKey('KeyW') || consumeKey('KeyS')) {
    game.gameMode = game.gameMode === 'classic' ? 'endless' : 'classic';
    sfxMenuSelect();
  }
  // Only keyboard starts the game from updateMenu
  // Touch start is handled in renderer touch handler
  if (game.time > 3.5 && (consumeKey('Space') || consumeKey('Enter'))) {
    sfxMenuSelect();
    startNewGame(game);
  }
}

export function startNewGame(game: Game): void {
  resetTouch();
  game.state = STATE_PLAYING;
  const diff = DIFFICULTIES[game.difficulty];
  game.player = createPlayer(diff.lives);
  game.bullets = [];
  game.wave = 1;
  game.isBossWave = false;
  game.boss = null;
  game.grid = createEnemyGrid(game.wave, diff);
  game.ufo = createUfoState();
  game.barriers = createBarriers();
  game.waveTextTimer = WAVE_TEXT_DURATION;
  game.gameOverTimer = 0;
  clearParticles();
  resetCombo();
  resetStreak();
  game.powerups = [];
  game.effects = createActiveEffects();
  game.companions = createCompanions();
  game.stats = createStats();
  game.hitThisWave = false;
  game.coinsThisGame = 0;
  game.wallet = loadWallet();
  game.equippedStats = getEquippedStats();
  game.skillBonuses = getSkillBonuses();
  game.mergedStats = mergeStats(game.equippedStats, game.skillBonuses);

  // Apply skill tree lives and shields
  if (game.skillBonuses.extraLives > 0) {
    game.player.lives += game.skillBonuses.extraLives;
  }
  if (game.skillBonuses.startShield > 0) {
    game.effects.shieldHits += game.skillBonuses.startShield;
  }
  if (game.skillBonuses.startCompanions > 0) {
    for (let c = 0; c < game.skillBonuses.startCompanions; c++) {
      addCompanion(game.companions);
    }
  }
  game.modifier = pickModifier(1);
  game.modifierBannerTimer = 0;
  game.modifierEffects = game.modifier.apply();
  game.abilities = createAbilities();
  game.weapons = createWeaponState();
  game.hazards = createHazards();
  game.lastTapTime = 0;

  // Apply start bonuses from equipped items
  const shieldStart = game.equippedStats.startShield || 0;
  if (shieldStart === true) {
    game.effects.shieldHits += 1;
  } else if (typeof shieldStart === 'number' && shieldStart > 0) {
    game.effects.shieldHits += shieldStart;
  }

  const companionStart = game.equippedStats.startCompanion || 0;
  if (companionStart === true) {
    addCompanion(game.companions);
  } else if (typeof companionStart === 'number') {
    for (let c = 0; c < companionStart; c++) {
      addCompanion(game.companions);
    }
  }

  // Extra starting life
  if (game.equippedStats.extraStartLife) {
    game.player.lives += game.equippedStats.extraStartLife as number;
  }

  // Apply hitbox multiplier to player
  if (game.mergedStats!.hitboxMul) {
    game.player.hitboxMul = game.mergedStats!.hitboxMul as number;
  }

  startMusic();
  setMusicIntensity(1);
}

function earnCoins(game: Game, amount: number): void {
  const equipMul = (game.mergedStats?.coinMul as number) || 1;
  const modMul = game.modifierEffects.coinMul || 1;
  const earned = Math.round(amount * equipMul * modMul);
  game.coinsThisGame += earned;
  game.wallet = addCoins(game.wallet, earned);
}

function createStats(): GameStatsInternal {
  return {
    shotsFired: 0,
    shotsHit: 0,
    kills: { smiski: 0, jellycat: 0, tie: 0, boss: 0, ufo: 0 },
    timeSurvived: 0,
    powerupsCollected: 0,
    maxCombo: 0,
  };
}

// Merge shop equippedStats and skillBonuses into one stats object.
// Multiplicative keys (*Mul, *Chance) multiply together; additive keys add.
function mergeStats(equipped: CombinedStats, skills: SkillBonuses): CombinedStats {
  const MUL_KEYS = ['fireRateMul', 'bulletSpeedMul', 'speedMul', 'coinMul', 'scoreMul', 'powerupDurationMul', 'hitboxMul'];
  const ADD_KEYS = ['dodgeChance', 'maxBulletBonus', 'pierce', 'invincTimeBonus', 'powerupDropBonus'];

  const merged: CombinedStats = {};

  // Copy all equipped stats as base
  for (const [k, v] of Object.entries(equipped)) {
    merged[k] = v;
  }

  // Merge skill bonuses
  const skillsRec = skills as unknown as Record<string, number | boolean>;

  for (const k of MUL_KEYS) {
    const eqVal = (typeof equipped[k] === 'number') ? equipped[k] as number : 1;
    const skVal = (typeof skillsRec[k] === 'number') ? skillsRec[k] as number : 1;
    merged[k] = eqVal * skVal;
  }
  for (const k of ADD_KEYS) {
    const eqVal = (typeof equipped[k] === 'number') ? equipped[k] as number : 0;
    const skVal = (typeof skillsRec[k] === 'number') ? skillsRec[k] as number : 0;
    merged[k] = eqVal + skVal;
  }

  // Copy remaining skill keys that aren't in equipped
  for (const [k, v] of Object.entries(skills)) {
    if (!(k in merged)) {
      merged[k] = v;
    }
  }

  return merged;
}

function updatePlaying(game: Game, dt: number): void {
  // Pause check
  if (consumeKey('Escape')) {
    resetTouch();
    game.state = STATE_PAUSED;
    return;
  }

  // Modifier banner
  if (game.modifierBannerTimer > 0) {
    game.modifierBannerTimer = Math.max(0, game.modifierBannerTimer - dt);
  }

  // Apply slow-mo time scale
  updateSlowMo(dt);
  updateMusic(dt);
  dt = dt * getTimeScale();

  // Apply modifier global time scale
  if (game.modifierEffects.globalTimeMul) {
    dt = dt * game.modifierEffects.globalTimeMul;
  }

  const { player, bullets, grid, ufo, barriers, powerups, effects } = game;
  if (!player || !grid || !ufo || !barriers) return;
  const mods = game.modifierEffects;

  // Apply modifier: reversed controls flag on player
  player.reversedControls = !!mods.reversedControls;

  // Apply modifier: enemy speed multiplier
  if (mods.enemySpeedMul && grid) {
    grid.speed = grid.baseSpeed * mods.enemySpeedMul;
  }

  // Apply modifier: enemy fire rate multiplier (lower = faster)
  if (mods.enemyFireMul && grid) {
    (grid as unknown as Record<string, unknown>).fireMul = mods.enemyFireMul;
  }

  // Apply modifier: player damage multiplier (stored for bullet hit checks)
  (player as unknown as Record<string, unknown>).damageMul = mods.playerDamageMul || 1;

  // Wave text countdown
  if (game.waveTextTimer > 0) {
    game.waveTextTimer = Math.max(0, game.waveTextTimer - dt);
  }

  // Track time survived
  if (player.alive) {
    game.stats.timeSurvived += dt;
  }

  if (player.alive) {
    const bulletsBefore = bullets.length;
    updatePlayer(player, bullets, dt, effects, game.mergedStats as never, getActiveWeapon(game.weapons));
    const bulletsAfter = bullets.length;
    if (bulletsAfter > bulletsBefore) {
      game.stats.shotsFired += bulletsAfter - bulletsBefore;
    }
    if (!isEnemyFrozen(game.abilities)) {
      // enemiesNoShoot: pass empty array so enemy bullets are discarded
      const enemyBulletTarget = mods.enemiesNoShoot ? [] : bullets;
      if (game.isBossWave) {
        updateBoss(game.boss, enemyBulletTarget, dt);
      } else {
        updateEnemyGrid(grid, enemyBulletTarget, dt);
      }
    }
    updateUfo(ufo, dt, game.time);
  }

  // Auto-trigger tequila bomb from combo system
  if (game.abilities.tequilaTriggered) {
    game.abilities.tequilaTriggered = false;
    const allAlive = getAliveEnemies(grid);
    const splashR = getSplashRadius();
    const splashX = player.x;
    const splashY = player.y;
    // Splash damage — kill enemies within splash radius of player
    for (const e of allAlive) {
      const dx = e.x - splashX;
      const dy = e.y - splashY;
      if (dx * dx + dy * dy > splashR * splashR) continue;
      killEnemy(e);
      spawnPetals(e.x, e.y, e.type);
      const scoreMul = ((game.mergedStats?.scoreMul as number) || 1) * (mods.scoreMul || 1);
      player.score += Math.round(e.points * game.wave * scoreMul);
      earnCoins(game, COIN_REWARDS.kill);
    }
    triggerShake(10, 0.5);
    sfxWaveClear();
  }

  // Auto-trigger photo flash on near miss
  checkNearMiss(game.abilities, player.x, player.y, bullets);

  updatePowerups(powerups as never, dt);
  updateActiveEffects(effects, dt);
  updateCompanions(game.companions, player.x, player.y, bullets as never, dt);
  updateAbilities(game.abilities, dt);
  updateWeaponState(game.weapons, dt);
  updateHazards(game.hazards, bullets, player.x, player.y, dt, game.wave);

  updateBullets(bullets, dt, effects.ricochetStacks);
  updateBarriers(barriers, bullets, player.x, dt);
  updateParticles(dt);
  updateShake(dt);
  updateCombo(dt);
  updateAchievementPopups(dt);
  checkAchievements(game.stats, game.wave, player.score, dt);

  // Player bullets → enemies
  const alive = getAliveEnemies(grid);
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i]!;
    if (!b.isPlayer) continue;

    for (const e of alive) {
      if (bulletHitsRect(b as never, e.x, e.y, ENEMY_WIDTH, ENEMY_HEIGHT)) {
        flashEnemy(e);
        game.stats.shotsHit += 1;
        const dmgMul = (player as unknown as Record<string, unknown>).damageMul as number || 1;
        if (dmgMul > 1) {
          e.hp -= (dmgMul - 1); // extra damage beyond the 1 that hitEnemy does
        }
        const killed = hitEnemy(e);
        if (killed) {
          spawnPetals(e.x, e.y, e.type);
          sfxEnemyDeath();
          registerKill(e.x, e.y);
          game.stats.kills[e.type] = (game.stats.kills[e.type] || 0) + 1;
          const scoreMul = ((game.mergedStats?.scoreMul as number) || 1) * (game.modifierEffects.scoreMul || 1);
          player.score += Math.round(e.points * game.wave * scoreMul);
          earnCoins(game, e.elite ? COIN_REWARDS.eliteKill : COIN_REWARDS.kill);
          // Splitter spawns 2 mini enemies
          if (e.special === 'splitter') {
            spawnSplitEnemies(grid, e);
          }
          // Check tequila bomb auto-trigger on combo
          checkTequilaTrigger(game.abilities, getComboCount(), player.x, player.y);
          // Guaranteed drop for elites, or guaranteedDrops modifier, or random for normal
          if (e.guaranteedDrop || mods.guaranteedDrops) {
            const pu = maybeSpawnPowerup(e.x, e.y);
            if (pu) powerups.push(pu);
            else {
              const forced = maybeSpawnPowerup(e.x, e.y);
              powerups.push(forced || { x: e.x, y: e.y, type: 'spread', alive: true });
            }
          } else {
            const pu = maybeSpawnPowerup(e.x, e.y);
            if (pu) powerups.push(pu);
          }
        }
        // Pierce: bullet passes through if it has pierce remaining
        if (b.pierce && b.pierce > 0) {
          b.pierce -= 1;
        } else {
          bullets.splice(i, 1);
        }
        break;
      }
    }
  }

  // Player bullets → boss
  if (game.isBossWave && game.boss && isBossFighting(game.boss)) {
    const boss = game.boss;
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i]!;
      if (!b.isPlayer) continue;
      if (bulletHitsRect(b as never, boss.x, boss.y, boss.width, boss.height)) {
        const killed = hitBoss(boss);
        sfxEnemyDeath();
        game.stats.shotsHit += 1;
        if (killed) {
          game.stats.kills.boss += 1;
          earnCoins(game, COIN_REWARDS.bossKill);
          // Boss defeated — big explosion
          for (let j = 0; j < 5; j++) {
            spawnPetals(
              boss.x + (Math.random() - 0.5) * 50,
              boss.y + (Math.random() - 0.5) * 30,
              boss.type.petals
            );
          }
          spawnShatter(boss.x, boss.y);
          const bossScoreMul = ((game.mergedStats?.scoreMul as number) || 1) * (game.modifierEffects.scoreMul || 1);
          player.score += Math.round(500 * game.wave * bossScoreMul);
          triggerShake(10, 0.5);
          sfxWaveClear();
        }
        bullets.splice(i, 1);
      }
    }
  }

  // Player bullets → UFO
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i]!;
    if (!b.isPlayer || !ufo.active) continue;

    if (bulletHitsRect(b as never, ufo.x, ufo.y, UFO_WIDTH, UFO_HEIGHT)) {
      const score = hitUfo(ufo, game.wave);
      player.score += score;
      spawnShatter(ufo.x, ufo.y);
      sfxUfoHit();
      game.stats.shotsHit += 1;
      game.stats.kills.ufo += 1;
      earnCoins(game, COIN_REWARDS.ufoKill);
      bullets.splice(i, 1);
      break;
    }
  }

  // Power-up pickup
  const pb = getPlayerBounds(player);
  const pickedUp = checkPowerupPickup(powerups as never, player.x, player.y, pb.right - pb.left, pb.bottom - pb.top);
  if (pickedUp) {
    sfxPowerUp();
    vibratePowerup();
    game.stats.powerupsCollected += 1;
    if (pickedUp === POWERUP_TYPES.COMPANION) {
      addCompanion(game.companions);
    } else if (pickedUp === POWERUP_TYPES.BOMB) {
      // Bomb: kill all alive enemies
      const allAlive = getAliveEnemies(grid);
      const bombScoreMul = ((game.mergedStats?.scoreMul as number) || 1) * (mods.scoreMul || 1);
      for (const e of allAlive) {
        killEnemy(e);
        spawnPetals(e.x, e.y, e.type);
        player.score += Math.round(e.points * game.wave * bombScoreMul);
      }
      triggerShake(8, 0.4);
    } else {
      applyPowerup(effects, pickedUp);
    }
  }

  // Enemy bullets → player
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i]!;
    if (b.isPlayer) continue;
    if (bulletHitsRect(b as never, player.x, player.y, pb.right - pb.left, pb.bottom - pb.top)) {
      // Shield absorbs hit
      if (hasShield(effects)) {
        consumeShield(effects);
        bullets.splice(i, 1);
        continue;
      }
      // Dodge chance
      const dodgeChance = (game.mergedStats?.dodgeChance as number) || 0;
      if (dodgeChance > 0 && Math.random() < dodgeChance) {
        bullets.splice(i, 1);
        continue;
      }
      const wasHit = hitPlayer(player);
      if (wasHit) {
        spawnPetals(player.x, player.y, 'jellycat');
        sfxPlayerHit();
        triggerShake(6, 0.3);
        vibrateHit();
        resetStreak();
        game.hitThisWave = true;
      }
      bullets.splice(i, 1);
    }
  }

  // Hazard collision
  if (player.alive && checkHazardCollision(game.hazards, player.x, player.y, player.width, player.height)) {
    if (hasShield(effects)) {
      consumeShield(effects);
    } else {
      const dodgeChance = (game.mergedStats?.dodgeChance as number) || 0;
      if (!(dodgeChance > 0 && Math.random() < dodgeChance)) {
        const wasHit = hitPlayer(player);
        if (wasHit) {
          spawnPetals(player.x, player.y, 'jellycat');
          sfxPlayerHit();
          triggerShake(6, 0.3);
          vibrateHit();
          resetStreak();
          game.hitThisWave = true;
        }
      }
    }
  }

  // Enemies reach player level — instant death (skip during boss waves)
  const lowestY = getLowestEnemyY(grid);
  if (!game.isBossWave && lowestY >= player.y - 10 && getAliveEnemies(grid).length > 0) {
    player.alive = false;
    player.lives = 0;
  }

  // Player dead → game over
  if (!player.alive) {
    game.state = STATE_GAME_OVER;
    game.gameOverTimer = 0;
    sfxGameOver();
    vibrateDeath();
    stopMusic();
    saveWallet(game.wallet);
  }

  // Wave cleared
  const waveCleared = game.isBossWave
    ? isBossDefeated(game.boss)
    : getAliveEnemies(grid).length === 0;

  if (waveCleared && player.alive && game.waveTextTimer <= 0) {
    if (!game.isBossWave) {
      sfxWaveClear();
      triggerShake(3, 0.15);
      vibrateWaveClear();
      triggerSlowMo(0.4, 0.2);
    }
    earnCoins(game, COIN_REWARDS.waveClear);
    if (!game.hitThisWave && game.wave > 1) {
      unlockPerfectWave();
      earnCoins(game, COIN_REWARDS.perfectWave);
    }
    game.hitThisWave = false;
    game.wave += 1;
    setMusicIntensity(game.wave);
    game.modifier = pickModifier(game.wave);
    game.modifierEffects = game.modifier.apply();
    game.modifierBannerTimer = 3.0;

    // oneHitKill modifier: set lives to 1 at wave start
    if (game.modifierEffects.oneHitKill) {
      player.lives = 1;
    }

    const diff = DIFFICULTIES[game.difficulty];
    // doubleEnemies modifier: create extra rows by running grid twice
    const waveDiff: DifficultySettings = game.modifierEffects.doubleEnemies
      ? { ...diff, extraRows: (diff.extraRows || 0) + ENEMY_ROWS }
      : diff;

    if (game.gameMode === 'endless') {
      game.boss = null;
      game.isBossWave = false;
      game.grid = createEnemyGrid(game.wave, waveDiff);
    } else {
      game.isBossWave = game.wave % 5 === 0;
      if (game.isBossWave) {
        game.boss = createBoss(game.wave);
        game.grid = createEnemyGrid(game.wave, waveDiff);
      } else {
        game.boss = null;
        game.grid = createEnemyGrid(game.wave, waveDiff);
      }
      game.barriers = createBarriers();
    }
    game.bullets.length = 0;
    game.powerups.length = 0;
    game.waveTextTimer = WAVE_TEXT_DURATION;
  }
}

function updateGameOver(game: Game, dt: number): void {
  game.gameOverTimer += dt;
  updateParticles(dt);

  // Wait 1.5s then allow transition
  if (game.gameOverTimer > 1.5 && isAction()) {
    game.state = STATE_HIGH_SCORE;
    game.initials = ['A', 'A', 'A'];
    game.initialPos = 0;
  }
}

function updatePaused(game: Game): void {
  if (consumeKey('Escape') || isAction()) {
    game.state = STATE_PLAYING;
  }
}

function updateHighScore(_game: Game): void {
  // Handled by UI renderer (keyboard/touch input for initials)
}

export function submitHighScore(game: Game): void {
  if (!game.player) return;
  const entry: HighScoreEntry = {
    name: game.initials.join(''),
    score: game.player.score,
    wave: game.wave,
  };

  game.highScores.push(entry);
  game.highScores.sort((a, b) => b.score - a.score);
  if (game.highScores.length > HIGH_SCORE_MAX) {
    game.highScores.length = HIGH_SCORE_MAX;
  }

  saveHighScores(game.highScores);
  game.state = STATE_MENU;
}

export function renderGame(ctx: CanvasRenderingContext2D, game: Game): void {
  renderStarfield(ctx, game.starfield, game.wave || 1);
  ctx.imageSmoothingEnabled = false;

  ctx.save();
  applyShake(ctx);

  if (game.state === STATE_SHOP) {
    renderShopUI(ctx, game.shop, game.time);
    ctx.restore();
    return;
  }

  if (game.state === STATE_SKILLS) {
    renderSkillTree(ctx, game.skillTree, game.wallet, game.time);
    ctx.restore();
    return;
  }

  if (game.state === STATE_TUTORIAL) {
    renderTutorial(ctx, game.tutorial, game.time);
    ctx.restore();
    return;
  }

  if (game.state === STATE_PLAYING || game.state === STATE_GAME_OVER || game.state === STATE_PAUSED) {
    const mods = game.modifierEffects || {};

    // enemyScale modifier: scale enemy rendering
    if (mods.enemyScale && mods.enemyScale !== 1 && game.grid) {
      game.grid.renderScale = mods.enemyScale;
    }

    // ghostEnemies modifier: flicker enemy alpha
    if (mods.ghostEnemies && game.grid) {
      game.grid.ghostFlicker = true;
    }

    renderBarriers(ctx, game.barriers!);
    if (game.isBossWave) {
      renderBoss(ctx, game.boss, game.time);
    } else {
      renderEnemyGrid(ctx, game.grid!, game.time);
    }
    renderUfo(ctx, game.ufo!, game.time);
    renderHazards(ctx, game.hazards, game.time);
    renderPowerups(ctx, game.powerups as Powerup[], game.time);
    renderBullets(ctx, game.bullets as Bullet[]);
    renderPlayer(ctx, game.player!, game.effects, game.skin);
    renderCompanions(ctx, game.companions);
    renderParticles(ctx);
    renderCombo(ctx);
    renderStreakAnnouncement(ctx);
    renderActiveEffects(ctx, game.effects, CANVAS_WIDTH);
    renderAchievementPopups(ctx, CANVAS_WIDTH);
    renderModifierBanner(ctx, game.modifier, game.modifierBannerTimer);
    renderModifierHUD(ctx, game.modifier);
    renderAbilityEffects(ctx, game.abilities, game.time);
    renderWeaponHUD(ctx, game.weapons, CANVAS_WIDTH, game.time);

    // darkness modifier: overlay limiting visibility
    if (mods.darkness && game.player) {
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      // Spotlight around player
      const grd = ctx.createRadialGradient(
        game.player.x, game.player.y, 30,
        game.player.x, game.player.y, 120
      );
      grd.addColorStop(0, 'rgba(0,0,0,0.8)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.restore();
    }
  }

  ctx.restore();
}

// localStorage high scores
function loadHighScores(): HighScoreEntry[] {
  try {
    const data = localStorage.getItem('sofia_cantina_scores');
    if (data) return JSON.parse(data) as HighScoreEntry[];
  } catch (_) {
    // ignore
  }
  return [];
}

function saveHighScores(scores: readonly HighScoreEntry[]): void {
  try {
    localStorage.setItem('sofia_cantina_scores', JSON.stringify(scores));
  } catch (_) {
    // ignore
  }
}
