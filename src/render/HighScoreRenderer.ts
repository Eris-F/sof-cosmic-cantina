import {
  CANVAS_WIDTH,
} from '../config/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HighScoreRenderState {
  readonly player: {
    readonly score: number;
  };
  readonly initials: readonly string[];
  readonly initialPos: number;
  readonly time: number;
}

/**
 * Renders the high-score initial entry screen. Pure read-only — draws pixels, returns nothing.
 */
export function renderHighScore(
  ctx: CanvasRenderingContext2D,
  state: HighScoreRenderState,
  _gameTime: number,
): void {
  ctx.fillStyle = '#ffcc00';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ENTER YOUR INITIALS', CANVAS_WIDTH / 2, 200);

  ctx.fillStyle = '#ffffff';
  ctx.font = '12px monospace';
  ctx.fillText(`SCORE: ${state.player.score}`, CANVAS_WIDTH / 2, 230);

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
    ctx.fillStyle = i === state.initialPos ? '#ffff00' : '#ffffff';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(state.initials[i] ?? '', lx, 310);

    // Down arrow
    ctx.fillStyle = '#666666';
    ctx.font = '14px monospace';
    ctx.fillText('\u25BC', lx, 340);

    // Underline active
    if (i === state.initialPos) {
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(lx - 10, 316, 20, 2);
    }
  }

  // Touch zones for letter cycling
  ctx.fillStyle = '#888888';
  ctx.font = '12px monospace';
  ctx.fillText('TAP ARROWS OR USE KEYBOARD', CANVAS_WIDTH / 2, 380);

  // Submit button
  const blink = Math.floor(state.time * 2) % 2;
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
