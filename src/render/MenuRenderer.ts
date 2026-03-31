import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config/constants';
import { getGameHeight } from '../core/Layout';
import { DIFFICULTIES } from '../difficulty';
import { drawCatShip, drawSmiski, drawJellycat, drawTieFighter } from '../sprites';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HighScoreEntry {
  readonly name: string;
  readonly score: number;
  readonly wave: number;
}

interface MenuSkin {
  readonly glow?: string;
  readonly name: string;
  readonly body?: string;
  readonly stripe?: string;
  readonly ear?: string;
}

interface WalletState {
  readonly coins: number;
}

export interface MenuRenderState {
  readonly time: number;
  readonly skin: MenuSkin;
  readonly wallet: WalletState;
  readonly difficulty: string;
  readonly gameMode: string;
  readonly highScores: readonly HighScoreEntry[];
}

interface DifficultyConfig {
  readonly label: string;
  readonly color: string;
}

/**
 * Renders the title/menu screen. Pure read-only — draws pixels, returns nothing.
 */
export function renderMenu(
  ctx: CanvasRenderingContext2D,
  state: MenuRenderState,
  _gameTime: number,
): void {
  const t = state.time;
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
  for (let sy = 0; sy < getGameHeight(); sy += 3) {
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
    const catY = getGameHeight() + 30 - (getGameHeight() + 30 - catTargetY) * ease;
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

    drawCatShip(ctx, cx, catY + bob, state.skin as unknown as Parameters<typeof drawCatShip>[3]);
  }

  // Shop button + coin display under cat
  if (t > catEnd) {
    const skinFade = Math.min(1, (t - catEnd) / 0.3);
    ctx.globalAlpha = skinFade;

    // Current skin name
    ctx.fillStyle = state.skin.glow || '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(state.skin.name, cx, 228);

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
    ctx.fillText(`${state.wallet.coins} COINS`, cx, 266);

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

    const diff = (DIFFICULTIES as Record<string, DifficultyConfig>)[state.difficulty] ?? { label: state.difficulty, color: '#ffffff' };
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

    const modeLabel = state.gameMode === 'classic' ? 'CLASSIC' : 'ENDLESS';
    const modeColor = state.gameMode === 'classic' ? '#44ddff' : '#ff44ff';
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
    if (state.highScores.length > 0) {
      const hsY = diffY + 145;
      // Table header
      ctx.fillStyle = '#ffcc00';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('- HIGH SCORES -', cx, hsY);

      // Decorative line
      ctx.fillStyle = 'rgba(255, 204, 0, 0.3)';
      ctx.fillRect(cx - 70, hsY + 4, 140, 1);

      ctx.font = '11px monospace';
      for (let i = 0; i < state.highScores.length; i++) {
        const hs = state.highScores[i]!;
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
