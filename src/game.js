import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  ENEMY_WIDTH,
  ENEMY_HEIGHT,
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
} from './constants.js';
import { isAction, consumeKey } from './input.js';
import { createStarfield, updateStarfield, renderStarfield } from './effects/starfield.js';
import { spawnPetals, spawnShatter, updateParticles, renderParticles, clearParticles } from './effects/particles.js';
import { createPlayer, updatePlayer, renderPlayer, getPlayerBounds, hitPlayer } from './entities/player.js';
import { updateBullets, renderBullets, bulletHitsRect, clearBullets } from './entities/bullet.js';
import { createEnemyGrid, updateEnemyGrid, renderEnemyGrid, killEnemy, hitEnemy, flashEnemy, getAliveEnemies, getLowestEnemyY, spawnSplitEnemies } from './entities/enemy.js';
import { createUfoState, updateUfo, hitUfo, renderUfo } from './entities/ufo.js';
import { createBarriers, updateBarriers, renderBarriers } from './entities/barrier.js';
import { maybeSpawnPowerup, updatePowerups, renderPowerups, checkPowerupPickup, createActiveEffects, updateActiveEffects, applyPowerup, renderActiveEffects, consumeShield, hasShield, POWERUP_TYPES } from './entities/powerup.js';
import { createCompanions, addCompanion, updateCompanions, renderCompanions, clearCompanions } from './entities/companion.js';
import { createBoss, updateBoss, hitBoss, isBossDefeated, isBossFighting, renderBoss } from './entities/boss.js';
import { DIFFICULTIES, DIFFICULTY_KEYS } from './difficulty.js';
import { sfxShoot, sfxEnemyDeath, sfxPlayerHit, sfxUfoHit, sfxWaveClear, sfxGameOver, sfxMenuSelect, sfxPowerUp } from './audio.js';
import { triggerShake, updateShake, applyShake } from './effects/screenshake.js';
import { triggerSlowMo, updateSlowMo, getTimeScale } from './effects/slowmo.js';
import { pickModifier, renderModifierBanner, renderModifierHUD } from './modifiers.js';
import { createAbilities, updateAbilities, checkTequilaTrigger, checkNearMiss, isEnemyFrozen, renderAbilityEffects, getSplashRadius } from './abilities.js';
import { createWeaponState, getActiveWeapon, swapWeapon, updateWeaponState, renderWeaponHUD } from './weapons.js';
import { createHazards, updateHazards, checkHazardCollision, renderHazards } from './hazards.js';
import { registerKill, getComboCount, updateCombo, renderCombo, renderStreakAnnouncement, resetCombo, resetStreak } from './effects/combo.js';
import { checkAchievements, unlockPerfectWave, updateAchievementPopups, renderAchievementPopups } from './achievements.js';
import { vibrateHit, vibrateDeath, vibrateWaveClear, vibratePowerup } from './haptic.js';
import { loadWallet, saveWallet, addCoins, COIN_REWARDS, getEquippedSkin, getEquippedStats } from './shop.js';
import { SKILL_BRANCHES, getSkillBonuses, createSkillTreeState, renderSkillTree, upgradeSkill, loadSkillLevels } from './skilltree.js';
import { createTutorialState, renderTutorial, getTutorialPageCount } from './tutorial.js';
import { createShopState, updateShopUI, renderShopUI, handleShopKeyboard } from './shopui.js';
import { updateMusic, setMusicIntensity, startMusic, stopMusic } from './music.js';

export function createGame() {
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
    gameMode: 'classic', // 'classic' or 'endless'
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

export function updateGame(game, dt) {
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
        const branch = SKILL_BRANCHES[game.skillTree.selectedBranch];
        const result = upgradeSkill(branch.id, game.wallet);
        if (result.success) {
          game.wallet = result.wallet;
          game.skillTree.levels = loadSkillLevels();
          game.skillTree.flashMessage = `${branch.name} LV${result.newLevel}!`;
          game.skillTree.flashTimer = 1.5;
        }
      }
      break;
  }
}

function updateMenu(game) {
  if (consumeKey('ArrowLeft') || consumeKey('KeyA')) {
    game.difficultyIndex = (game.difficultyIndex - 1 + DIFFICULTY_KEYS.length) % DIFFICULTY_KEYS.length;
    game.difficulty = DIFFICULTY_KEYS[game.difficultyIndex];
    sfxMenuSelect();
  }
  if (consumeKey('ArrowRight') || consumeKey('KeyD')) {
    game.difficultyIndex = (game.difficultyIndex + 1) % DIFFICULTY_KEYS.length;
    game.difficulty = DIFFICULTY_KEYS[game.difficultyIndex];
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

export function startNewGame(game) {
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
    game.player.lives += game.equippedStats.extraStartLife;
  }

  startMusic();
  setMusicIntensity(1);
}

function earnCoins(game, amount) {
  const equipMul = game.equippedStats.coinMul || 1;
  const modMul = game.modifierEffects.coinMul || 1;
  const earned = Math.round(amount * equipMul * modMul);
  game.coinsThisGame += earned;
  game.wallet = addCoins(game.wallet, earned);
}

function createStats() {
  return {
    shotsFired: 0,
    shotsHit: 0,
    kills: { smiski: 0, jellycat: 0, tie: 0, boss: 0, ufo: 0 },
    timeSurvived: 0,
    powerupsCollected: 0,
    maxCombo: 0,
  };
}

function updatePlaying(game, dt) {
  // Pause check
  if (consumeKey('Escape')) {
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
    updatePlayer(player, bullets, dt, effects, game.equippedStats, getActiveWeapon(game.weapons));
    const bulletsAfter = bullets.length;
    if (bulletsAfter > bulletsBefore) {
      game.stats.shotsFired += bulletsAfter - bulletsBefore;
    }
    if (!isEnemyFrozen(game.abilities)) {
      if (game.isBossWave) {
        updateBoss(game.boss, bullets, dt);
      } else {
        updateEnemyGrid(grid, bullets, dt);
      }
    }
    updateUfo(ufo, dt, game.time);
  }

  // Auto-trigger tequila bomb from combo system
  if (game.abilities.tequilaTriggered) {
    game.abilities.tequilaTriggered = false;
    const allAlive = getAliveEnemies(grid);
    // Splash damage — kill enemies near the last kill position
    for (const e of allAlive) {
      killEnemy(e);
      spawnPetals(e.x, e.y, e.type);
      const scoreMul = game.equippedStats.scoreMul || 1;
      player.score += Math.round(e.points * game.wave * scoreMul);
      earnCoins(game, COIN_REWARDS.kill);
    }
    triggerShake(10, 0.5);
    sfxWaveClear();
  }

  // Auto-trigger photo flash on near miss
  checkNearMiss(game.abilities, player.x, player.y, bullets);

  updatePowerups(powerups, dt);
  updateActiveEffects(effects, dt);
  updateCompanions(game.companions, player.x, player.y, bullets, dt);
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
    const b = bullets[i];
    if (!b.isPlayer) continue;

    for (const e of alive) {
      if (bulletHitsRect(b, e.x, e.y, ENEMY_WIDTH, ENEMY_HEIGHT)) {
        flashEnemy(e);
        game.stats.shotsHit += 1;
        const killed = hitEnemy(e);
        if (killed) {
          spawnPetals(e.x, e.y, e.type);
          sfxEnemyDeath();
          registerKill(e.x, e.y);
          game.stats.kills[e.type] = (game.stats.kills[e.type] || 0) + 1;
          const scoreMul = game.equippedStats.scoreMul || 1;
          player.score += Math.round(e.points * game.wave * scoreMul);
          earnCoins(game, e.elite ? COIN_REWARDS.eliteKill : COIN_REWARDS.kill);
          // Splitter spawns 2 mini enemies
          if (e.special === 'splitter') {
            spawnSplitEnemies(grid, e);
          }
          // Check tequila bomb auto-trigger on combo
          checkTequilaTrigger(game.abilities, getComboCount(), player.x, player.y);
          // Guaranteed drop for elites, random for normal
          if (e.guaranteedDrop) {
            const pu = maybeSpawnPowerup(e.x, e.y);
            if (pu) powerups.push(pu);
            else {
              // Force a drop
              const forced = maybeSpawnPowerup(e.x, e.y);
              powerups.push(forced || { x: e.x, y: e.y, type: 'spread', alive: true });
            }
          } else {
            const pu = maybeSpawnPowerup(e.x, e.y);
            if (pu) powerups.push(pu);
          }
        }
        bullets.splice(i, 1);
        break;
      }
    }
  }

  // Player bullets → boss
  if (game.isBossWave && isBossFighting(game.boss)) {
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      if (!b.isPlayer) continue;
      if (bulletHitsRect(b, game.boss.x, game.boss.y, game.boss.width, game.boss.height)) {
        const killed = hitBoss(game.boss);
        sfxEnemyDeath();
        game.stats.shotsHit += 1;
        if (killed) {
          game.stats.kills.boss += 1;
          earnCoins(game, COIN_REWARDS.bossKill);
          // Boss defeated — big explosion
          for (let j = 0; j < 5; j++) {
            spawnPetals(
              game.boss.x + (Math.random() - 0.5) * 50,
              game.boss.y + (Math.random() - 0.5) * 30,
              game.boss.type.petals
            );
          }
          spawnShatter(game.boss.x, game.boss.y);
          player.score += 500 * game.wave;
          triggerShake(10, 0.5);
          sfxWaveClear();
        }
        bullets.splice(i, 1);
      }
    }
  }

  // Player bullets → UFO
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    if (!b.isPlayer || !ufo.active) continue;

    if (bulletHitsRect(b, ufo.x, ufo.y, UFO_WIDTH, UFO_HEIGHT)) {
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
  const pickedUp = checkPowerupPickup(powerups, player.x, player.y, pb.right - pb.left, pb.bottom - pb.top);
  if (pickedUp) {
    sfxPowerUp();
    vibratePowerup();
    game.stats.powerupsCollected += 1;
    if (pickedUp === POWERUP_TYPES.COMPANION) {
      addCompanion(game.companions);
    } else if (pickedUp === POWERUP_TYPES.BOMB) {
      // Bomb: kill all alive enemies
      const allAlive = getAliveEnemies(grid);
      for (const e of allAlive) {
        killEnemy(e);
        spawnPetals(e.x, e.y, e.type);
        player.score += e.points * game.wave;
      }
      triggerShake(8, 0.4);
    } else {
      applyPowerup(effects, pickedUp);
    }
  }

  // Enemy bullets → player
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    if (b.isPlayer) continue;
    if (bulletHitsRect(b, player.x, player.y, pb.right - pb.left, pb.bottom - pb.top)) {
      // Shield absorbs hit
      if (hasShield(effects)) {
        consumeShield(effects);
        bullets.splice(i, 1);
        continue;
      }
      // Dodge chance
      const dodgeChance = game.equippedStats.dodgeChance || 0;
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
      const dodgeChance = game.equippedStats.dodgeChance || 0;
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

    const diff = DIFFICULTIES[game.difficulty];
    if (game.gameMode === 'endless') {
      // Endless: no bosses, wave number keeps climbing for speed scaling
      game.boss = null;
      game.isBossWave = false;
      game.grid = createEnemyGrid(game.wave, diff);
      // Don't reset barriers in endless
    } else {
      // Classic mode
      game.isBossWave = game.wave % 5 === 0;
      if (game.isBossWave) {
        game.boss = createBoss(game.wave);
        game.grid = createEnemyGrid(game.wave, diff);
      } else {
        game.boss = null;
        game.grid = createEnemyGrid(game.wave, diff);
      }
      game.barriers = createBarriers();
    }
    game.bullets.length = 0;
    game.powerups.length = 0;
    game.waveTextTimer = WAVE_TEXT_DURATION;
  }
}

function updateGameOver(game, dt) {
  game.gameOverTimer += dt;
  updateParticles(dt);

  // Wait 1.5s then allow transition
  if (game.gameOverTimer > 1.5 && isAction()) {
    game.state = STATE_HIGH_SCORE;
    game.initials = ['A', 'A', 'A'];
    game.initialPos = 0;
  }
}

function updatePaused(game) {
  if (consumeKey('Escape') || isAction()) {
    game.state = STATE_PLAYING;
  }
}

function updateHighScore(game) {
  // Handled by UI renderer (keyboard/touch input for initials)
}

export function submitHighScore(game) {
  const entry = {
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

export function renderGame(ctx, game) {
  renderStarfield(ctx, game.starfield, game.wave || 1);
  ctx.imageSmoothingEnabled = false;

  ctx.save();
  applyShake(ctx);

  if (game.state === STATE_SHOP) {
    renderShopUI(ctx, game.shop, game.time);
    return;
  }

  if (game.state === STATE_SKILLS) {
    renderSkillTree(ctx, game.skillTree, game.wallet, game.time);
    return;
  }

  if (game.state === STATE_TUTORIAL) {
    renderTutorial(ctx, game.tutorial, game.time);
    return;
  }

  if (game.state === STATE_PLAYING || game.state === STATE_GAME_OVER || game.state === STATE_PAUSED) {
    renderBarriers(ctx, game.barriers);
    if (game.isBossWave) {
      renderBoss(ctx, game.boss, game.time);
    } else {
      renderEnemyGrid(ctx, game.grid, game.time);
    }
    renderUfo(ctx, game.ufo, game.time);
    renderHazards(ctx, game.hazards, game.time);
    renderPowerups(ctx, game.powerups, game.time);
    renderBullets(ctx, game.bullets);
    renderPlayer(ctx, game.player, game.effects, game.skin);
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
  }

  ctx.restore();
}

// localStorage high scores
function loadHighScores() {
  try {
    const data = localStorage.getItem('sofia_cantina_scores');
    if (data) return JSON.parse(data);
  } catch (_) {
    // ignore
  }
  return [];
}

function saveHighScores(scores) {
  try {
    localStorage.setItem('sofia_cantina_scores', JSON.stringify(scores));
  } catch (_) {
    // ignore
  }
}
