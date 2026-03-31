/**
 * Renderer.ts
 *
 * Main render coordinator. Takes ctx and the full game state from the store.
 * Pure read-only — receives state + ctx, draws pixels, returns nothing.
 * ZERO mutations to state.
 *
 * Responsibilities:
 * - Starfield background (always renders)
 * - Screenshake transform via save/restore
 * - Dispatches to the appropriate scene renderer
 * - Darkness modifier overlay (radial gradient spotlight)
 * - Clean ctx.save/ctx.restore — NO LEAKS
 */

import { CANVAS_WIDTH } from '../constants';
import { getGameHeight } from '../core/Layout';
import { renderGameplay } from './GameplayRenderer';
import { renderHUD, renderWaveText } from './HUDRenderer';
import { random } from '../core/Random';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SkyTheme {
  readonly top: string;
  readonly bottom: string;
}

interface NebulaWisp {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly color: string;
  readonly alpha: string;
}

interface StarfieldStar {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly color: string;
  readonly alpha: number;
}

interface StarfieldData {
  readonly stars?: readonly StarfieldStar[];
  readonly nebulae?: readonly NebulaWisp[];
}

interface ShakeState {
  readonly timer: number;
  readonly intensity: number;
}

interface RendererState {
  readonly scene?: string;
  readonly state?: string | number;
  readonly combat: {
    readonly wave: number;
    readonly waveTextTimer: number;
    readonly modifierEffects?: Readonly<Record<string, unknown>>;
    [key: string]: unknown;
  };
  readonly effects?: {
    readonly starfield?: StarfieldData | null;
    readonly shake?: ShakeState | null;
    [key: string]: unknown;
  };
  readonly player: {
    readonly x: number;
    readonly y: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Starfield rendering (always visible behind every scene)
// ---------------------------------------------------------------------------

/**
 * Sky themes that cycle every few waves.
 */
const SKY_THEMES: readonly SkyTheme[] = [
  { top: '#000011', bottom: '#000833' },       // deep night (default)
  { top: '#0a0020', bottom: '#1a0044' },       // purple nebula
  { top: '#001122', bottom: '#002244' },       // deep blue
  { top: '#110808', bottom: '#220011' },       // crimson void
  { top: '#081108', bottom: '#002200' },       // emerald space
  { top: '#111100', bottom: '#332200' },       // golden dusk
];

/**
 * Linearly interpolates between two hex colors.
 */
function lerpColor(hex1: string, hex2: string, t: number): string {
  const r1 = parseInt(hex1.slice(1, 3), 16);
  const g1 = parseInt(hex1.slice(3, 5), 16);
  const b1 = parseInt(hex1.slice(5, 7), 16);
  const r2 = parseInt(hex2.slice(1, 3), 16);
  const g2 = parseInt(hex2.slice(3, 5), 16);
  const b2 = parseInt(hex2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return (
    '#' +
    r.toString(16).padStart(2, '0') +
    g.toString(16).padStart(2, '0') +
    b.toString(16).padStart(2, '0')
  );
}

/**
 * Renders the starfield background: gradient sky, nebula wisps, and stars.
 */
export function renderStarfield(
  ctx: CanvasRenderingContext2D,
  starfield: StarfieldData | null | undefined,
  wave: number,
): void {
  const w = wave || 1;
  const themeIdx = Math.floor((w - 1) / 3) % SKY_THEMES.length;
  const nextIdx = (themeIdx + 1) % SKY_THEMES.length;
  const blend = ((w - 1) % 3) / 3;

  const theme = SKY_THEMES[themeIdx]!;
  const next = SKY_THEMES[nextIdx]!;

  const topColor = lerpColor(theme.top, next.top, blend);
  const bottomColor = lerpColor(theme.bottom, next.bottom, blend);

  const grad = ctx.createLinearGradient(0, 0, 0, getGameHeight());
  grad.addColorStop(0, topColor);
  grad.addColorStop(1, bottomColor);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, getGameHeight());

  if (!starfield) return;

  // Nebula wisps
  const nebulae = starfield.nebulae || [];
  for (const neb of nebulae) {
    ctx.fillStyle = neb.color + neb.alpha + ')';
    ctx.beginPath();
    ctx.ellipse(neb.x, neb.y, neb.width / 2, neb.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Stars
  const stars = starfield.stars || [];
  for (const star of stars) {
    ctx.globalAlpha = star.alpha;
    ctx.fillStyle = star.color;
    ctx.fillRect(Math.floor(star.x), Math.floor(star.y), star.size, star.size);
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------------
// Screenshake
// ---------------------------------------------------------------------------

/**
 * Applies a screen-shake transform to the canvas context.
 * Reads shake state, applies random translation. Does NOT mutate state.
 */
function applyShake(
  ctx: CanvasRenderingContext2D,
  shake: ShakeState | null | undefined,
): void {
  if (!shake || shake.timer <= 0) return;
  const ox = (random() - 0.5) * 2 * shake.intensity;
  const oy = (random() - 0.5) * 2 * shake.intensity;
  ctx.translate(Math.floor(ox), Math.floor(oy));
}

// ---------------------------------------------------------------------------
// Darkness modifier overlay
// ---------------------------------------------------------------------------

/**
 * Draws the "LIGHTS OUT" darkness overlay with a spotlight around the player.
 */
function renderDarknessOverlay(
  ctx: CanvasRenderingContext2D,
  playerX: number,
  playerY: number,
): void {
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, getGameHeight());

  // Spotlight around player
  const grd = ctx.createRadialGradient(
    playerX, playerY, 30,
    playerX, playerY, 120,
  );
  grd.addColorStop(0, 'rgba(0,0,0,0.8)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, CANVAS_WIDTH, getGameHeight());
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Renders a complete frame. Dispatches to the appropriate scene renderer
 * based on the current game scene/state.
 */
export function renderFrame(
  ctx: CanvasRenderingContext2D,
  state: RendererState,
  gameTime: number,
): void {
  // Starfield is now rendered centrally in main.ts before scene dispatch.

  ctx.imageSmoothingEnabled = false;

  // 2. Save context, apply screenshake
  ctx.save();
  const shake = state.effects ? state.effects.shake : null;
  applyShake(ctx, shake);

  // 3. Dispatch to scene-specific renderer
  const scene = state.scene || state.state;

  if (scene === 'playing' || scene === 1) {
    renderGameplay(ctx, state as unknown as Parameters<typeof renderGameplay>[1], gameTime);
    renderHUD(ctx, state as unknown as Parameters<typeof renderHUD>[1]);
    renderWaveText(
      ctx,
      state.combat.wave,
      state.combat.waveTextTimer,
    );

    // Darkness modifier overlay
    const mods = state.combat.modifierEffects || {};
    if (mods.darkness) {
      renderDarknessOverlay(ctx, state.player.x, state.player.y);
    }
  } else if (scene === 'paused' || scene === 4) {
    renderGameplay(ctx, state as unknown as Parameters<typeof renderGameplay>[1], gameTime);
    renderHUD(ctx, state as unknown as Parameters<typeof renderHUD>[1]);

    // Darkness modifier overlay
    const mods = state.combat.modifierEffects || {};
    if (mods.darkness) {
      renderDarknessOverlay(ctx, state.player.x, state.player.y);
    }
  } else if (scene === 'gameOver' || scene === 2) {
    renderGameplay(ctx, state as unknown as Parameters<typeof renderGameplay>[1], gameTime);
    renderHUD(ctx, state as unknown as Parameters<typeof renderHUD>[1]);

    // Darkness modifier overlay
    const mods = state.combat.modifierEffects || {};
    if (mods.darkness) {
      renderDarknessOverlay(ctx, state.player.x, state.player.y);
    }
  }
  // Other scenes (shop, skills, tutorial, menu) are handled by their own
  // scene renderers — this module only coordinates the gameplay rendering
  // layer. The caller is responsible for dispatching to those.

  // 4. ALWAYS restore — no leaks, even for shop/skills/tutorial
  ctx.restore();
}
