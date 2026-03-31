/**
 * Debug overlay — renders translucent rectangles over all touch zones.
 * Toggle with backtick key. Zero cost when disabled.
 *
 * @module render/DebugOverlay
 */
import type { Zone } from '../zones/Zone';
import * as MenuZones from '../zones/menu';
import * as ShopZones from '../zones/shop';
import * as SkillTreeZones from '../zones/skilltree';
import * as TutorialZones from '../zones/tutorial';
import * as GameplayZones from '../zones/gameplay';

let enabled = false;

/** Toggle the debug overlay on/off. */
export function toggleDebugOverlay(): void {
  enabled = !enabled;
}

/** Check if overlay is active. */
export function isDebugOverlayEnabled(): boolean {
  return enabled;
}

/** Set overlay state directly. */
export function setDebugOverlay(on: boolean): void {
  enabled = on;
}

const ZONE_COLORS: Record<string, string> = {
  Menu: 'rgba(255, 204, 0, 0.25)',
  Shop: 'rgba(0, 200, 255, 0.25)',
  Skill: 'rgba(200, 0, 255, 0.25)',
  Tutorial: 'rgba(0, 255, 100, 0.25)',
  Gameplay: 'rgba(255, 50, 50, 0.25)',
};

function getZonesForScene(scene: string): { zones: Zone[]; color: string } {
  switch (scene) {
    case 'menu':
      return {
        zones: [
          MenuZones.SHOP_BTN, MenuZones.SKILLS_BTN, MenuZones.TUTORIAL_BTN,
          MenuZones.DIFF_LEFT, MenuZones.DIFF_RIGHT,
          MenuZones.MODE_LEFT, MenuZones.MODE_RIGHT,
          MenuZones.START_ZONE, MenuZones.TITLE_ZONE,
        ],
        color: ZONE_COLORS.Menu!,
      };
    case 'shop':
      return {
        zones: [
          ShopZones.CAT_TAB_0, ShopZones.CAT_TAB_1, ShopZones.CAT_TAB_2, ShopZones.CAT_TAB_3,
          ShopZones.BACK_BTN,
        ],
        color: ZONE_COLORS.Shop!,
      };
    case 'skillTree':
      return {
        zones: [
          SkillTreeZones.BRANCH_0, SkillTreeZones.BRANCH_1, SkillTreeZones.BRANCH_2,
          SkillTreeZones.BRANCH_3, SkillTreeZones.BRANCH_4,
          SkillTreeZones.BACK_BTN,
        ],
        color: ZONE_COLORS.Skill!,
      };
    case 'tutorial':
      return {
        zones: [
          TutorialZones.PREV_HALF, TutorialZones.NEXT_HALF,
          TutorialZones.PREV_BTN, TutorialZones.NEXT_BTN, TutorialZones.BACK_BTN,
        ],
        color: ZONE_COLORS.Tutorial!,
      };
    case 'playing':
    case 'paused':
      return {
        zones: [GameplayZones.PAUSE_BTN],
        color: ZONE_COLORS.Gameplay!,
      };
    default:
      return { zones: [], color: 'rgba(255,255,255,0.2)' };
  }
}

/**
 * Renders the debug overlay if enabled. Call at the end of the render pipeline.
 */
export function renderDebugOverlay(ctx: CanvasRenderingContext2D, scene: string): void {
  if (!enabled) return;

  const { zones, color } = getZonesForScene(scene);

  ctx.save();
  for (const z of zones) {
    // Fill
    ctx.fillStyle = color;
    ctx.fillRect(z.x, z.y, z.w, z.h);

    // Border
    ctx.strokeStyle = color.replace('0.25', '0.8');
    ctx.lineWidth = 1;
    ctx.strokeRect(z.x, z.y, z.w, z.h);

    // Label
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '7px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(z.name, z.x + 2, z.y + 8);
  }
  ctx.restore();
}
