import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config/constants';
import { getGameHeight } from '../core/Layout';
import { DIFFICULTIES } from '../difficulty';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KillStats {
  readonly smiski: number;
  readonly jellycat: number;
  readonly tie: number;
  readonly boss: number;
  readonly ufo: number;
}

interface GameStats {
  readonly shotsFired: number;
  readonly shotsHit: number;
  readonly kills: KillStats;
  readonly timeSurvived: number;
  readonly powerupsCollected: number;
}

interface DifficultyConfig {
  readonly label: string;
  readonly color: string;
}

export interface GameOverRenderState {
  readonly player: {
    readonly score: number;
  };
  readonly wave: number;
  readonly difficulty: string;
  readonly stats: GameStats;
  readonly coinsThisGame: number;
  readonly gameOverTimer: number;
  readonly time: number;
}

export interface PauseOverlayRenderState {
  readonly time: number;
}

/**
 * Renders the game-over screen. Pure read-only — draws pixels, returns nothing.
 */
export function renderGameOver(
  ctx: CanvasRenderingContext2D,
  state: GameOverRenderState,
  _gameTime: number,
): void {
  const cx = CANVAS_WIDTH / 2;
  const stats = state.stats;
  const totalKills = stats.kills.smiski + stats.kills.jellycat + stats.kills.tie + stats.kills.boss + stats.kills.ufo;
  const accuracy = stats.shotsFired > 0 ? Math.round((stats.shotsHit / stats.shotsFired) * 100) : 0;
  const minutes = Math.floor(stats.timeSurvived / 60);
  const seconds = Math.floor(stats.timeSurvived % 60);
  const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}`;

  // Dim overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, getGameHeight());

  ctx.textAlign = 'center';

  // Title
  ctx.fillStyle = '#ff4444';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('GAME OVER', cx, 120);

  // Score + wave
  ctx.fillStyle = '#ffcc00';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(`SCORE: ${state.player.score}`, cx, 150);
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px monospace';
  const diff = (DIFFICULTIES as Record<string, DifficultyConfig>)[state.difficulty];
  ctx.fillText(`WAVE ${state.wave}  |  ${diff?.label ?? state.difficulty}`, cx, 168);

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

  interface StatLine {
    readonly label: string;
    readonly value: string;
    readonly color: string;
  }

  const statLines: readonly StatLine[] = [
    { label: 'TIME SURVIVED', value: timeStr, color: '#aaaaaa' },
    { label: 'ACCURACY', value: `${accuracy}%`, color: accuracy > 70 ? '#44ff44' : accuracy > 40 ? '#ffcc00' : '#ff6644' },
    { label: 'TOTAL KILLS', value: `${totalKills}`, color: '#ffffff' },
    { label: 'SMISKIS', value: `${stats.kills.smiski}`, color: '#88cc88' },
    { label: 'JELLYCATS', value: `${stats.kills.jellycat}`, color: '#cc88cc' },
    { label: 'TIE FIGHTERS', value: `${stats.kills.tie}`, color: '#8899aa' },
    { label: 'BOSSES', value: `${stats.kills.boss}`, color: '#ff6644' },
    { label: 'TEQUILA UFOS', value: `${stats.kills.ufo}`, color: '#88aa66' },
    { label: 'POWER-UPS', value: `${stats.powerupsCollected}`, color: '#44ccff' },
    { label: 'COINS EARNED', value: `+${state.coinsThisGame}`, color: '#ffcc00' },
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
  if (state.gameOverTimer > 1.5) {
    const blink = Math.floor(state.time * 2) % 2;
    if (blink === 0) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#aaaaaa';
      ctx.font = '12px monospace';
      ctx.fillText('TAP TO CONTINUE', cx, sy + 24);
    }
  }

  ctx.textAlign = 'left';
}

/**
 * Renders the pause overlay. Pure read-only — draws pixels, returns nothing.
 */
export function renderPauseOverlay(
  ctx: CanvasRenderingContext2D,
  state: PauseOverlayRenderState,
): void {
  // Dim overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, getGameHeight());

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);

  const blink = Math.floor(state.time * 2) % 2;
  if (blink === 0) {
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '12px monospace';
    ctx.fillText('TAP TO RESUME', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  }

  ctx.textAlign = 'left';
}
