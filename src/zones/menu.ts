/**
 * Touch zones for the menu scene.
 * Coordinates match MenuRenderer.ts draw positions exactly.
 *
 * @module zones/menu
 */
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';
import { zone } from './Zone';
import { ZoneNames } from './names';

const CX = CANVAS_WIDTH / 2; // 240

// ── Buttons (drawn at textAlign='center', so x is centered) ─────────────

// "[ SHOP ]" drawn at (cx - 65, 248) — text ~50px wide, 12px tall
export const SHOP_BTN = zone(ZoneNames.MENU_SHOP, CX - 115, 236, 100, 24);

// "[ SKILLS ]" drawn at (cx + 65, 248) — text ~60px wide, 12px tall
export const SKILLS_BTN = zone(ZoneNames.MENU_SKILLS, CX + 15, 236, 100, 24);

// "[ HOW TO PLAY? ]" drawn at (cx, 282) — text ~120px wide
export const TUTORIAL_BTN = zone(ZoneNames.MENU_TUTORIAL, CX - 80, 270, 160, 24);

// ── Difficulty selector (diffY = 360) ───────────────────────────────────

const DIFF_Y = 360;

// "◀" drawn at (cx - 60, diffY + 18)
export const DIFF_LEFT = zone(ZoneNames.MENU_DIFF_LEFT, CX - 80, DIFF_Y + 6, 40, 24);

// "▶" drawn at (cx + 60, diffY + 18)
export const DIFF_RIGHT = zone(ZoneNames.MENU_DIFF_RIGHT, CX + 40, DIFF_Y + 6, 40, 24);

// ── Mode selector (modeY = diffY + 45 = 405) ───────────────────────────

const MODE_Y = DIFF_Y + 45;

// "◀" drawn at (cx - 55, modeY + 18)
export const MODE_LEFT = zone(ZoneNames.MENU_MODE_LEFT, CX - 75, MODE_Y + 6, 40, 24);

// "▶" drawn at (cx + 55, modeY + 18)
export const MODE_RIGHT = zone(ZoneNames.MENU_MODE_RIGHT, CX + 35, MODE_Y + 6, 40, 24);

// ── Start zone — "TAP TO START" at (cx, modeY + 48 = 453) ──────────────

// Everything below mode arrows is the start zone
export const START_ZONE = zone(ZoneNames.MENU_START, 0, MODE_Y + 30, CANVAS_WIDTH, CANVAS_HEIGHT - (MODE_Y + 30));

// ── Cat / title area (above buttons — also tappable to start) ───────────

export const TITLE_ZONE = zone(ZoneNames.MENU_TITLE, 0, 0, CANVAS_WIDTH, SHOP_BTN.y - 10);
