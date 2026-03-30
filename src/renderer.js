import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  STATE_MENU,
  STATE_PLAYING,
  STATE_GAME_OVER,
  STATE_HIGH_SCORE,
  STATE_PAUSED,
  WAVE_TEXT_DURATION,
} from './constants.js';
import { consumeKey } from './input.js';
import { submitHighScore, startNewGame } from './game.js';
import { shareScore } from './share.js';
import { drawCatLife, drawCatShip, drawSmiski, drawJellycat, drawTieFighter } from './sprites.js';
import { DIFFICULTIES, DIFFICULTY_KEYS } from './difficulty.js';
import { sfxMenuSelect } from './audio.js';
import { SHOP_ITEMS, loadEquipped } from './shop.js';
import { handleShopTouch } from './shopui.js';
import { swapWeapon } from './weapons.js';
import { STATE_SHOP, STATE_SKILLS, STATE_TUTORIAL } from './constants.js';
import { SKILL_BRANCHES, upgradeSkill, loadSkillLevels } from './skilltree.js';

export function renderUI(ctx, game) {
  switch (game.state) {
    case STATE_MENU:
      renderMenu(ctx, game);
      break;
    case STATE_PLAYING:
      renderHUD(ctx, game);
      renderWaveText(ctx, game);
      break;
    case STATE_GAME_OVER:
      renderHUD(ctx, game);
      renderGameOver(ctx, game);
      break;
    case STATE_PAUSED:
      renderHUD(ctx, game);
      renderPaused(ctx, game);
      break;
    case STATE_HIGH_SCORE:
      handleHighScoreInput(game);
      renderHighScoreEntry(ctx, game);
      break;
  }
}

function renderMenu(ctx, game) {
  const t = game.time;
  const cx = CANVAS_WIDTH / 2;
  ctx.textAlign = 'center';

  // Phase timings
  const titleDelay = 0.3;
  const line1End = titleDelay + 0.6;
  const line2End = line1End + 0.5;
  const line3End = line2End + 0.5;
  const catStart = line3End + 0.1;
  const catEnd = catStart + 0.5;
  const enemyStart = catEnd + 0.2;
  const restStart = enemyStart + 0.6;

  // Scanline overlay (arcade CRT feel)
  for (let sy = 0; sy < CANVAS_HEIGHT; sy += 3) {
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(0, sy, CANVAS_WIDTH, 1);
  }

  // Top border decoration — pixel art line
  const borderPulse = 0.6 + 0.4 * Math.sin(t * 3);
  ctx.fillStyle = `rgba(255, 204, 0, ${borderPulse * 0.3})`;
  ctx.fillRect(30, 50, CANVAS_WIDTH - 60, 1);
  ctx.fillRect(30, 52, CANVAS_WIDTH - 60, 1);

  // Title — "SOFIA'S" with shadow
  const line1 = "SOFIA'S";
  if (t > titleDelay) {
    const charsShown1 = Math.min(line1.length, Math.floor((t - titleDelay) / 0.07));
    const text1 = line1.substring(0, charsShown1);
    // Shadow
    ctx.fillStyle = '#664400';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(text1, cx + 2, 82);
    // Main
    ctx.fillStyle = '#ffcc00';
    ctx.fillText(text1, cx, 80);
  }

  // "COSMIC" — big, glowing
  const line2 = 'COSMIC';
  if (t > line1End) {
    const charsShown2 = Math.min(line2.length, Math.floor((t - line1End) / 0.07));
    const text2 = line2.substring(0, charsShown2);
    const glow = 0.8 + 0.2 * Math.sin(t * 5);
    // Glow background
    ctx.fillStyle = `rgba(255, 80, 40, ${glow * 0.15})`;
    ctx.fillRect(cx - 90, 90, 180, 30);
    // Shadow
    ctx.fillStyle = '#662200';
    ctx.font = 'bold 30px monospace';
    ctx.fillText(text2, cx + 2, 117);
    // Main
    ctx.fillStyle = `rgba(255, 102, 68, ${glow})`;
    ctx.fillText(text2, cx, 115);
  }

  // "CANTINA" — big, glowing blue
  const line3 = 'CANTINA';
  if (t > line2End) {
    const charsShown3 = Math.min(line3.length, Math.floor((t - line2End) / 0.07));
    const text3 = line3.substring(0, charsShown3);
    const glow = 0.8 + 0.2 * Math.sin(t * 5 + 1);
    ctx.fillStyle = `rgba(40, 150, 200, ${glow * 0.15})`;
    ctx.fillRect(cx - 100, 125, 200, 30);
    ctx.fillStyle = '#113344';
    ctx.font = 'bold 30px monospace';
    ctx.fillText(text3, cx + 2, 152);
    ctx.fillStyle = `rgba(68, 221, 255, ${glow})`;
    ctx.fillText(text3, cx, 150);
  }

  // Decorative line under title
  if (t > line3End) {
    ctx.fillStyle = `rgba(68, 221, 255, ${borderPulse * 0.4})`;
    ctx.fillRect(60, 162, CANVAS_WIDTH - 120, 1);
    ctx.fillStyle = `rgba(255, 102, 68, ${borderPulse * 0.4})`;
    ctx.fillRect(60, 164, CANVAS_WIDTH - 120, 1);
  }

  // Cat flies in from bottom with trail
  if (t > catStart) {
    const progress = Math.min(1, (t - catStart) / (catEnd - catStart));
    const ease = 1 - Math.pow(1 - progress, 3);
    const catTargetY = 200;
    const catY = CANVAS_HEIGHT + 30 - (CANVAS_HEIGHT + 30 - catTargetY) * ease;
    const bob = progress >= 1 ? Math.sin(t * 3) * 2 : 0;

    // Engine trail while flying in
    if (progress < 1) {
      for (let i = 1; i <= 3; i++) {
        ctx.globalAlpha = 0.3 / i;
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(cx - 3, catY + 14 + i * 8, 6, 6);
      }
      ctx.globalAlpha = 1;
    }

    drawCatShip(ctx, cx, catY + bob, game.skin);
  }

  // Shop button + coin display under cat
  if (t > catEnd) {
    const skinFade = Math.min(1, (t - catEnd) / 0.3);
    ctx.globalAlpha = skinFade;

    // Current skin name
    ctx.fillStyle = game.skin.glow || '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(game.skin.name, cx, 228);

    // Shop + Skills buttons — side by side
    const breathe = t * 1.5;
    const rs = Math.floor(200 + 55 * Math.sin(breathe));
    const gs = Math.floor(150 + 105 * Math.sin(breathe + 2));
    const bs = Math.floor(100 + 155 * Math.sin(breathe + 4));
    ctx.fillStyle = `rgb(${rs},${gs},${bs})`;
    ctx.font = 'bold 13px monospace';
    ctx.fillText('[ SHOP ]', cx - 65, 248);

    const rt = Math.floor(100 + 155 * Math.sin(breathe + 1));
    const gt = Math.floor(200 + 55 * Math.sin(breathe + 3));
    const bt = Math.floor(150 + 105 * Math.sin(breathe + 5));
    ctx.fillStyle = `rgb(${rt},${gt},${bt})`;
    ctx.fillText('[ SKILLS ]', cx + 65, 248);

    // Coin balance
    ctx.fillStyle = '#ffcc00';
    ctx.font = '12px monospace';
    ctx.fillText(`${game.wallet.coins} COINS`, cx, 266);

    // How to play
    ctx.fillStyle = '#888888';
    ctx.font = '10px monospace';
    ctx.fillText('[ HOW TO PLAY? ]', cx, 282);

    ctx.globalAlpha = 1;
  }

  // Enemy showcase — parade of enemies below the cat
  if (t > enemyStart) {
    const ep = Math.min(1, (t - enemyStart) / 0.4);
    ctx.globalAlpha = ep;
    const frame = Math.floor(t * 2) % 2;
    const showcaseY = 300;

    // Point values
    ctx.font = '12px monospace';

    // Smiski
    drawSmiski(ctx, cx - 80, showcaseY, frame);
    ctx.fillStyle = '#88cc88';
    ctx.fillText('10 PTS', cx - 80, showcaseY + 18);

    // Jellycat
    drawJellycat(ctx, cx, showcaseY, frame);
    ctx.fillStyle = '#cc88cc';
    ctx.fillText('20 PTS', cx, showcaseY + 18);

    // TIE Fighter
    drawTieFighter(ctx, cx + 80, showcaseY, frame);
    ctx.fillStyle = '#8899aa';
    ctx.fillText('30 PTS', cx + 80, showcaseY + 18);

    ctx.globalAlpha = 1;
  }

  // Difficulty selector + start prompt
  if (t > restStart) {
    const fadeIn = Math.min(1, (t - restStart) / 0.5);
    ctx.globalAlpha = fadeIn;

    // Difficulty selector
    const diffY = 360;
    ctx.fillStyle = '#888888';
    ctx.font = '11px monospace';
    ctx.fillText('DIFFICULTY', cx, diffY);

    const diff = DIFFICULTIES[game.difficulty];
    const diffLabel = diff.label;

    // Left arrow
    ctx.fillStyle = '#666';
    ctx.font = '14px monospace';
    ctx.fillText('\u25C0', cx - 60, diffY + 18);
    // Right arrow
    ctx.fillText('\u25B6', cx + 60, diffY + 18);
    // Current difficulty
    ctx.fillStyle = diff.color;
    ctx.font = 'bold 14px monospace';
    ctx.fillText(diffLabel, cx, diffY + 18);

    // Mode selector
    const modeY = diffY + 45;
    ctx.fillStyle = '#888';
    ctx.font = '11px monospace';
    ctx.fillText('MODE', cx, modeY);

    ctx.fillStyle = '#666';
    ctx.font = '14px monospace';
    ctx.fillText('\u25C0', cx - 55, modeY + 18);
    ctx.fillText('\u25B6', cx + 55, modeY + 18);

    const modeLabel = game.gameMode === 'classic' ? 'CLASSIC' : 'ENDLESS';
    const modeColor = game.gameMode === 'classic' ? '#44ddff' : '#ff44ff';
    ctx.fillStyle = modeColor;
    ctx.font = 'bold 12px monospace';
    ctx.fillText(modeLabel, cx, modeY + 18);

    // "INSERT COIN" / tap to start — classic arcade
    const blink = Math.floor(t * 2.5) % 2;
    if (blink === 0) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('- TAP TO START -', cx, modeY + 48);
    }

    // Credits line
    ctx.fillStyle = '#555555';
    ctx.font = '12px monospace';
    ctx.fillText('CREDIT 1', cx, modeY + 66);

    // High scores table
    if (game.highScores.length > 0) {
      const hsY = diffY + 145;
      // Table header
      ctx.fillStyle = '#ffcc00';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('- HIGH SCORES -', cx, hsY);

      // Decorative line
      ctx.fillStyle = 'rgba(255, 204, 0, 0.3)';
      ctx.fillRect(cx - 70, hsY + 4, 140, 1);

      ctx.font = '11px monospace';
      for (let i = 0; i < game.highScores.length; i++) {
        const hs = game.highScores[i];
        const rank = `${i + 1}.`;
        // Alternate row colors
        ctx.fillStyle = i % 2 === 0 ? '#cccccc' : '#999999';
        ctx.fillText(
          `${rank} ${hs.name}  ${String(hs.score).padStart(6, ' ')}  W${hs.wave}`,
          cx,
          hsY + 16 + i * 13
        );
      }
    }

    ctx.globalAlpha = 1;
  }

  // Bottom border
  ctx.fillStyle = `rgba(255, 204, 0, ${borderPulse * 0.2})`;
  ctx.fillRect(30, CANVAS_HEIGHT - 20, CANVAS_WIDTH - 60, 1);

  ctx.textAlign = 'left';
}

function renderHUD(ctx, game) {
  const { player, wave } = game;

  // Score
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE: ${player.score}`, 10, 16);

  // Wave / mode
  ctx.textAlign = 'center';
  if (game.gameMode === 'endless') {
    ctx.fillText(`ENDLESS W${wave}`, CANVAS_WIDTH / 2, 16);
  } else {
    ctx.fillText(`WAVE ${wave}`, CANVAS_WIDTH / 2, 16);
  }

  // Lives
  ctx.textAlign = 'left';
  for (let i = 0; i < player.lives; i++) {
    drawCatLife(ctx, CANVAS_WIDTH - 50 - i * 18, 14);
  }

  // Coins (top-right, above pause icon)
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffcc00';
  ctx.font = '10px monospace';
  ctx.fillText(`${game.wallet.coins}C`, CANVAS_WIDTH - 26, 28);
  ctx.textAlign = 'left';

  // Pause icon (top-right)
  ctx.fillStyle = '#888888';
  ctx.fillRect(CANVAS_WIDTH - 18, 6, 3, 10);
  ctx.fillRect(CANVAS_WIDTH - 12, 6, 3, 10);
}

function renderWaveText(ctx, game) {
  if (game.waveTextTimer <= 0) return;

  const alpha = game.waveTextTimer / WAVE_TEXT_DURATION;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#ffff00';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`WAVE ${game.wave}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  ctx.restore();
  ctx.textAlign = 'left';
}

function renderPaused(ctx, game) {
  // Dim overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);

  const blink = Math.floor(game.time * 2) % 2;
  if (blink === 0) {
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '12px monospace';
    ctx.fillText('TAP TO RESUME', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  }

  ctx.textAlign = 'left';
}

function renderGameOver(ctx, game) {
  const cx = CANVAS_WIDTH / 2;
  const stats = game.stats;
  const totalKills = stats.kills.smiski + stats.kills.jellycat + stats.kills.tie + stats.kills.boss + stats.kills.ufo;
  const accuracy = stats.shotsFired > 0 ? Math.round((stats.shotsHit / stats.shotsFired) * 100) : 0;
  const minutes = Math.floor(stats.timeSurvived / 60);
  const seconds = Math.floor(stats.timeSurvived % 60);
  const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}`;

  // Dim overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign = 'center';

  // Title
  ctx.fillStyle = '#ff4444';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('GAME OVER', cx, 120);

  // Score + wave
  ctx.fillStyle = '#ffcc00';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(`SCORE: ${game.player.score}`, cx, 150);
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px monospace';
  ctx.fillText(`WAVE ${game.wave}  |  ${DIFFICULTIES[game.difficulty].label}`, cx, 168);

  // Divider
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(cx - 80, 178, 160, 1);

  // Stats
  ctx.font = '11px monospace';
  let sy = 198;
  const lineH = 16;

  ctx.fillStyle = '#888';
  ctx.fillText('- BATTLE REPORT -', cx, sy);
  sy += lineH + 4;

  const statLines = [
    { label: 'TIME SURVIVED', value: timeStr, color: '#aaaaaa' },
    { label: 'ACCURACY', value: `${accuracy}%`, color: accuracy > 70 ? '#44ff44' : accuracy > 40 ? '#ffcc00' : '#ff6644' },
    { label: 'TOTAL KILLS', value: `${totalKills}`, color: '#ffffff' },
    { label: 'SMISKIS', value: `${stats.kills.smiski}`, color: '#88cc88' },
    { label: 'JELLYCATS', value: `${stats.kills.jellycat}`, color: '#cc88cc' },
    { label: 'TIE FIGHTERS', value: `${stats.kills.tie}`, color: '#8899aa' },
    { label: 'BOSSES', value: `${stats.kills.boss}`, color: '#ff6644' },
    { label: 'TEQUILA UFOS', value: `${stats.kills.ufo}`, color: '#88aa66' },
    { label: 'POWER-UPS', value: `${stats.powerupsCollected}`, color: '#44ccff' },
    { label: 'COINS EARNED', value: `+${game.coinsThisGame}`, color: '#ffcc00' },
  ];

  for (const line of statLines) {
    ctx.fillStyle = '#666';
    ctx.textAlign = 'left';
    ctx.fillText(line.label, cx - 90, sy);
    ctx.fillStyle = line.color;
    ctx.textAlign = 'right';
    ctx.fillText(line.value, cx + 90, sy);
    sy += lineH;
  }

  // Divider
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(cx - 80, sy + 2, 160, 1);

  // Continue prompt
  if (game.gameOverTimer > 1.5) {
    const blink = Math.floor(game.time * 2) % 2;
    if (blink === 0) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#aaaaaa';
      ctx.font = '12px monospace';
      ctx.fillText('TAP TO CONTINUE', cx, sy + 24);
    }
  }

  ctx.textAlign = 'left';
}

function handleHighScoreInput(game) {
  // Letter cycling with up/down or tap zones
  if (consumeKey('ArrowUp') || consumeKey('KeyW')) {
    const newInitials = [...game.initials];
    const code = newInitials[game.initialPos].charCodeAt(0);
    newInitials[game.initialPos] = String.fromCharCode(code >= 90 ? 65 : code + 1);
    game.initials = newInitials;
  }
  if (consumeKey('ArrowDown') || consumeKey('KeyS')) {
    const newInitials = [...game.initials];
    const code = newInitials[game.initialPos].charCodeAt(0);
    newInitials[game.initialPos] = String.fromCharCode(code <= 65 ? 90 : code - 1);
    game.initials = newInitials;
  }
  if (consumeKey('ArrowRight') || consumeKey('KeyD')) {
    game.initialPos = Math.min(2, game.initialPos + 1);
  }
  if (consumeKey('ArrowLeft') || consumeKey('KeyA')) {
    game.initialPos = Math.max(0, game.initialPos - 1);
  }
  if (consumeKey('Enter')) {
    submitHighScore(game);
  }
}

function renderHighScoreEntry(ctx, game) {
  ctx.fillStyle = '#ffcc00';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ENTER YOUR INITIALS', CANVAS_WIDTH / 2, 200);

  ctx.fillStyle = '#ffffff';
  ctx.font = '12px monospace';
  ctx.fillText(`SCORE: ${game.player.score}`, CANVAS_WIDTH / 2, 230);

  // Initials display
  const letterSpacing = 36;
  const startLetterX = CANVAS_WIDTH / 2 - letterSpacing;

  for (let i = 0; i < 3; i++) {
    const lx = startLetterX + i * letterSpacing;

    // Up arrow
    ctx.fillStyle = '#666666';
    ctx.font = '14px monospace';
    ctx.fillText('\u25B2', lx, 275);

    // Letter
    ctx.fillStyle = i === game.initialPos ? '#ffff00' : '#ffffff';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(game.initials[i], lx, 310);

    // Down arrow
    ctx.fillStyle = '#666666';
    ctx.font = '14px monospace';
    ctx.fillText('\u25BC', lx, 340);

    // Underline active
    if (i === game.initialPos) {
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(lx - 10, 316, 20, 2);
    }
  }

  // Touch zones for letter cycling
  ctx.fillStyle = '#888888';
  ctx.font = '12px monospace';
  ctx.fillText('TAP ARROWS OR USE KEYBOARD', CANVAS_WIDTH / 2, 380);

  // Submit button
  const blink = Math.floor(game.time * 2) % 2;
  if (blink === 0) {
    ctx.fillStyle = '#44ff44';
    ctx.font = '12px monospace';
    ctx.fillText('TAP HERE TO SUBMIT', CANVAS_WIDTH / 2, 420);
  }

  // Share button
  ctx.fillStyle = '#44ccff';
  ctx.font = '12px monospace';
  ctx.fillText('SHARE SCORE', CANVAS_WIDTH / 2, 450);

  ctx.textAlign = 'left';
}

// Touch handling for pause + high score screen
export function handleHighScoreTouches(canvas, game) {
  canvas.addEventListener('touchstart', (e) => {
    const rect = canvas.getBoundingClientRect();
    const tx = ((e.touches[0].clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const ty = ((e.touches[0].clientY - rect.top) / rect.height) * CANVAS_HEIGHT;

    // Tutorial touch handling
    if (game.state === STATE_TUTORIAL) {
      if (ty > CANVAS_HEIGHT - 30) {
        // Bottom row — prev / back / next
        if (tx < CANVAS_WIDTH / 3) {
          // Prev
          game.tutorial.page = Math.max(0, game.tutorial.page - 1);
        } else if (tx > CANVAS_WIDTH * 2 / 3) {
          // Next or close
          if (game.tutorial.page >= 5) {
            game.state = 0;
          } else {
            game.tutorial.page += 1;
          }
        } else {
          // Back (center)
          game.state = 0;
        }
        sfxMenuSelect();
      }
      e.preventDefault();
      return;
    }

    // Skill tree touch handling
    if (game.state === STATE_SKILLS) {
      // Back button
      if (ty > CANVAS_HEIGHT - 30) {
        game.state = 0;
        sfxMenuSelect();
        e.preventDefault();
        return;
      }
      // Branch selection + upgrade
      const startY = 70;
      const branchH = 100;
      for (let bi = 0; bi < SKILL_BRANCHES.length; bi++) {
        const by = startY + bi * branchH;
        if (ty >= by && ty < by + branchH - 6) {
          if (bi === game.skillTree.selectedBranch) {
            // Try upgrade
            const branch = SKILL_BRANCHES[bi];
            const result = upgradeSkill(branch.id, game.wallet);
            if (result.success) {
              game.wallet = result.wallet;
              game.skillTree.levels = loadSkillLevels();
              game.skillTree.flashMessage = `${branch.name} LV${result.newLevel}!`;
              game.skillTree.flashTimer = 1.5;
              sfxMenuSelect();
            }
          } else {
            game.skillTree.selectedBranch = bi;
            sfxMenuSelect();
          }
          break;
        }
      }
      e.preventDefault();
      return;
    }

    // Shop touch handling
    if (game.state === STATE_SHOP) {
      handleShopTouch(game.shop, tx, ty, game);
      e.preventDefault();
      return;
    }

    // Double-tap weapon swap during gameplay
    if (game.state === STATE_PLAYING) {
      const now = performance.now();
      if (now - game.lastTapTime < 300) {
        swapWeapon(game.weapons);
        game.lastTapTime = 0;
      } else {
        game.lastTapTime = now;
      }
    }

    // Pause button: top-right 40x30 zone
    if (game.state === STATE_PLAYING && tx > CANVAS_WIDTH - 40 && ty < 30) {
      game.state = STATE_PAUSED;
      e.preventDefault();
      return;
    }

    // Menu touch zones
    if (game.state === STATE_MENU && game.time > 3.5) {
      const diffY = 360;

      // How to play button: y ~274-290
      if (ty > 274 && ty < 292) {
        game.state = STATE_TUTORIAL;
        game.tutorial.page = 0;
        sfxMenuSelect();
        e.preventDefault();
        return;
      }

      // Shop + Skills buttons: y ~238-260
      if (ty > 238 && ty < 260) {
        if (tx < CANVAS_WIDTH / 2) {
          // Shop
          game.state = STATE_SHOP;
          game.shop.wallet = game.wallet;
        } else {
          // Skills
          game.state = STATE_SKILLS;
          game.skillTree.levels = loadSkillLevels();
        }
        sfxMenuSelect();
        e.preventDefault();
        return;
      }

      // Difficulty arrows: y 324-348
      if (ty > diffY + 4 && ty < diffY + 28) {
        if (tx < CANVAS_WIDTH / 2 - 30) {
          game.difficultyIndex = (game.difficultyIndex - 1 + DIFFICULTY_KEYS.length) % DIFFICULTY_KEYS.length;
          game.difficulty = DIFFICULTY_KEYS[game.difficultyIndex];
          e.preventDefault();
          return;
        } else if (tx > CANVAS_WIDTH / 2 + 30) {
          game.difficultyIndex = (game.difficultyIndex + 1) % DIFFICULTY_KEYS.length;
          game.difficulty = DIFFICULTY_KEYS[game.difficultyIndex];
          e.preventDefault();
          return;
        }
      }

      // Mode selector arrows: y ~356-376
      const modeY = diffY + 45;
      if (ty > modeY + 4 && ty < modeY + 28) {
        if (tx < CANVAS_WIDTH / 2 - 30 || tx > CANVAS_WIDTH / 2 + 30) {
          game.gameMode = game.gameMode === 'classic' ? 'endless' : 'classic';
          e.preventDefault();
          return;
        }
      }

      // "TAP TO START" zone
      if (ty > modeY + 34 && ty < modeY + 62) {
        sfxMenuSelect();
        startNewGame(game);
        e.preventDefault();
        return;
      }
    }

    if (game.state !== STATE_HIGH_SCORE) return;

    const letterSpacing = 36;
    const startLetterX = CANVAS_WIDTH / 2 - letterSpacing;

    // Check which letter column was tapped
    for (let i = 0; i < 3; i++) {
      const lx = startLetterX + i * letterSpacing;
      if (Math.abs(tx - lx) < 20) {
        game.initialPos = i;

        if (ty < 295) {
          // Up arrow zone
          const newInitials = [...game.initials];
          const code = newInitials[i].charCodeAt(0);
          newInitials[i] = String.fromCharCode(code >= 90 ? 65 : code + 1);
          game.initials = newInitials;
        } else if (ty > 315) {
          // Down arrow zone
          const newInitials = [...game.initials];
          const code = newInitials[i].charCodeAt(0);
          newInitials[i] = String.fromCharCode(code <= 65 ? 90 : code - 1);
          game.initials = newInitials;
        }
        break;
      }
    }

    // Submit zone
    if (ty > 400 && ty < 440) {
      submitHighScore(game);
    }

    // Share zone
    if (ty > 440 && ty < 465) {
      shareScore(game.player.score, game.wave, game.gameMode, game.difficulty);
    }
  });
}
