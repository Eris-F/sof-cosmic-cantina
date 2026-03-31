/**
 * Render dispatcher — reads game state and delegates to scene-specific
 * renderers. Pure read-only, no mutations.
 *
 * @module render/RenderDispatcher
 */
// Canvas dimensions now come from ViewportInfo — no constants import needed
import { SCENE } from '../core/SceneMachine';
import { renderFrame, renderStarfield } from './Renderer';
import { renderMenu } from './MenuRenderer';
import { renderShop } from './ShopRenderer';
import { renderSkillTree } from './SkillTreeRenderer';
import { renderTutorial } from './TutorialRenderer';
import { renderHighScore } from './HighScoreRenderer';
import { renderPauseOverlay } from './GameOverRenderer';
import { renderDebugOverlay } from './DebugOverlay';
import { updateRipples, renderRipples } from './TapFeedback';
import { setRenderAlpha } from './RenderAlpha';
import type { ViewportInfo } from '../core/Viewport';
import type { GameState } from '../types/state';
import type { GameStore } from '../types/systems';

// ── Local types ─────────────────────────────────────────────────────────────

interface SkinObject {
  id: string;
  name: string;
  body: string;
  stripe: string;
  ear: string;
  glow?: string;
}

interface StarfieldStar {
  x: number;
  y: number;
  size: number;
}

interface StarfieldLayer {
  speed: number;
  alpha: number;
  stars: StarfieldStar[];
}

interface FlatStar {
  x: number;
  y: number;
  size: number;
  alpha: number;
  color: string;
}

interface FlatStarfield {
  stars: FlatStar[];
  nebulae: unknown[];
}

interface LayeredStarfield {
  layers?: StarfieldLayer[];
}

interface MenuState {
  time: number;
  skin: SkinObject;
  wallet: GameState['economy']['wallet'];
  difficulty: string;
  gameMode: string;
  highScores: GameState['economy']['highScores'];
}

// ── Skin lookup ─────────────────────────────────────────────────────────────

let skinCatalog: readonly SkinObject[] = [];

/**
 * Provide the skin catalog from config/items. Call once at boot.
 */
export function setSkinCatalog(catalog: readonly SkinObject[]): void {
  skinCatalog = catalog;
}

function getSkinObject(skinId: string): SkinObject {
  const found = skinCatalog.find((s: SkinObject) => s.id === skinId);
  return found || skinCatalog[0] || {
    id: 'default', name: 'ORANGE TABBY',
    body: '#ff9933', stripe: '#cc7722', ear: '#ff6688',
  };
}

// ── Starfield flattening ────────────────────────────────────────────────────

function flattenStarfield(
  starfield: LayeredStarfield | undefined,
): FlatStarfield | LayeredStarfield | undefined {
  if (!starfield || !starfield.layers) return starfield;

  const flat: FlatStar[] = [];
  for (const layer of starfield.layers) {
    for (const star of layer.stars) {
      flat.push({
        x: star.x,
        y: star.y,
        size: star.size,
        alpha: layer.alpha,
        color: '#ffffff',
      });
    }
  }

  return { stars: flat, nebulae: [] };
}

// ── Menu state builder ──────────────────────────────────────────────────────

function buildMenuState(state: GameState): MenuState {
  return {
    time: state.time,
    skin: getSkinObject(state.economy.equipped.skins),
    wallet: state.economy.wallet,
    difficulty: state.config.difficulty,
    gameMode: state.config.gameMode,
    highScores: state.economy.highScores,
  };
}

// ── Main render function ────────────────────────────────────────────────────

/**
 * Creates the render callback for the game loop.
 * getViewport is called each frame to support dynamic resize.
 */
export function createRenderDispatcher(
  ctx: CanvasRenderingContext2D,
  store: GameStore,
  getViewport: () => ViewportInfo,
): (alpha: number) => void {
  return function render(alpha: number): void {
    setRenderAlpha(alpha);
    const vp = getViewport();
    const rawState = store.getState();
    const scene = rawState.scene;
    const gameTime = rawState.time;

    const state = {
      ...rawState,
      skin: getSkinObject(rawState.economy.equipped.skins),
      effects: {
        ...rawState.effects,
        starfield: flattenStarfield(
          rawState.effects.starfield as unknown as LayeredStarfield | undefined,
        ),
      },
      shop: rawState.ui.shop,
      wallet: rawState.economy.wallet,
      owned: rawState.economy.owned,
      equipped: rawState.economy.equipped,
      skillTree: {
        ...rawState.ui.skillTree,
        levels: rawState.economy.skillLevels,
      },
      highScores: rawState.economy.highScores,
      initials: rawState.ui.highScore.initials,
      initialPos: rawState.ui.highScore.initialPos,
      tutorial: rawState.ui.tutorial,
      gameOver: rawState.ui.gameOver,
      gameOverTimer: rawState.ui.gameOver.timer,
      wave: rawState.combat.wave,
      difficulty: rawState.config.difficulty,
      coinsThisGame: rawState.ui.stats.coinsThisGame,
      stats: rawState.ui.stats,
    };

    // Clear canvas
    ctx.clearRect(0, 0, vp.canvasWidth, vp.canvasHeight);

    // Starfield background — fills full canvas
    const wave = rawState.combat ? rawState.combat.wave : 1;
    renderStarfield(
      ctx,
      state.effects.starfield as unknown as Parameters<typeof renderStarfield>[1],
      wave,
    );

    // No translate needed — game fills the full canvas
    ctx.save();

    switch (scene) {
      case SCENE.MENU:
        renderMenu(
          ctx,
          buildMenuState(rawState) as unknown as Parameters<typeof renderMenu>[1],
          gameTime,
        );
        break;

      case SCENE.PLAYING:
        renderFrame(ctx, state as unknown as Parameters<typeof renderFrame>[1], gameTime);
        break;

      case SCENE.PAUSED:
        renderFrame(ctx, state as unknown as Parameters<typeof renderFrame>[1], gameTime);
        renderPauseOverlay(ctx, state as unknown as Parameters<typeof renderPauseOverlay>[1]);
        break;

      case SCENE.SHOP:
        renderShop(ctx, state as unknown as Parameters<typeof renderShop>[1], gameTime);
        break;

      case SCENE.SKILL_TREE:
        renderSkillTree(ctx, state as unknown as Parameters<typeof renderSkillTree>[1], gameTime);
        break;

      case SCENE.TUTORIAL:
        renderTutorial(ctx, state as unknown as Parameters<typeof renderTutorial>[1], gameTime);
        break;

      case SCENE.GAME_OVER:
        renderFrame(ctx, state as unknown as Parameters<typeof renderFrame>[1], gameTime);
        break;

      case SCENE.HIGH_SCORE:
        renderHighScore(ctx, state as unknown as Parameters<typeof renderHighScore>[1], gameTime);
        break;

      default:
        renderMenu(
          ctx,
          buildMenuState(rawState) as unknown as Parameters<typeof renderMenu>[1],
          gameTime,
        );
        break;
    }

    ctx.restore();

    // Overlays
    updateRipples(1 / 144);
    renderRipples(ctx);
    renderDebugOverlay(ctx, scene);
  };
}
