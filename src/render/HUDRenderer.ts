/**
 * HUDRenderer.ts
 *
 * Heads-up display rendered during gameplay. Pure read-only — receives state +
 * ctx, draws pixels, returns nothing. ZERO mutations to state.
 */

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  WAVE_TEXT_DURATION,
} from '../constants';
import { drawCatLife } from './SpriteRenderer';

// ---------------------------------------------------------------------------
// State types read by the HUD
// ---------------------------------------------------------------------------

export interface HUDRenderState {
  readonly player: {
    readonly score: number;
    readonly lives: number;
  };
  readonly combat: {
    readonly wave: number;
  };
  readonly gameMode?: string;
  readonly wallet?: {
    readonly coins: number;
  };
}

/**
 * Renders the full HUD overlay: score, wave, lives, coins, pause icon.
 */
export function renderHUD(
  ctx: CanvasRenderingContext2D,
  state: HUDRenderState,
): void {
  const player = state.player;
  const wave = state.combat.wave;
  const gameMode = state.gameMode;
  const coins = state.wallet ? state.wallet.coins : 0;

  // Score (top-left)
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE: ${player.score}`, 10, 16);

  // Wave text (top-center)
  ctx.textAlign = 'center';
  if (gameMode === 'endless') {
    ctx.fillText(`ENDLESS W${wave}`, CANVAS_WIDTH / 2, 16);
  } else {
    ctx.fillText(`WAVE ${wave}`, CANVAS_WIDTH / 2, 16);
  }

  // Lives (top-right, cat head icons)
  ctx.textAlign = 'left';
  for (let i = 0; i < player.lives; i++) {
    drawCatLife(ctx, CANVAS_WIDTH - 50 - i * 18, 14);
  }

  // Coins (top-right, below lives)
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffcc00';
  ctx.font = '10px monospace';
  ctx.fillText(`${coins}C`, CANVAS_WIDTH - 26, 28);
  ctx.textAlign = 'left';

  // Pause icon (top-right corner, 3 bars as 2 vertical rectangles)
  ctx.fillStyle = '#888888';
  ctx.fillRect(CANVAS_WIDTH - 18, 6, 3, 10);
  ctx.fillRect(CANVAS_WIDTH - 12, 6, 3, 10);
}

/**
 * Renders the big "WAVE N" announcement text with fade.
 */
export function renderWaveText(
  ctx: CanvasRenderingContext2D,
  wave: number,
  waveTextTimer: number,
): void {
  if (waveTextTimer <= 0) return;

  const alpha = waveTextTimer / WAVE_TEXT_DURATION;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#ffff00';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`WAVE ${wave}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  ctx.restore();
  ctx.textAlign = 'left';
}

/**
 * Renders an FPS counter for debug purposes.
 * Only call this when debug mode is active.
 */
export function renderFPS(
  ctx: CanvasRenderingContext2D,
  fps: number,
): void {
  ctx.fillStyle = '#44ff44';
  ctx.font = '10px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`FPS: ${Math.round(fps)}`, 10, CANVAS_HEIGHT - 6);
}
