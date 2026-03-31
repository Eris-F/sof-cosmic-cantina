/**
 * Touch zones for the tutorial scene.
 * Coordinates match TutorialRenderer.ts draw positions exactly.
 *
 * @module zones/tutorial
 */
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';
import { zone } from './Zone';
import { ZoneNames } from './names';

// ── Split-screen navigation ─────────────────────────────────────────────

// Tap left half → previous page, tap right half → next page
export const PREV_HALF = zone(ZoneNames.TUT_PREV, 0, 0, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
export const NEXT_HALF = zone(ZoneNames.TUT_NEXT, CANVAS_WIDTH / 2, 0, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);

// ── Bottom nav buttons ──────────────────────────────────────────────────

// "◀ PREV" drawn at (60, CANVAS_HEIGHT - 14)
export const PREV_BTN = zone(ZoneNames.TUT_PREV_BTN, 10, CANVAS_HEIGHT - 28, 100, 24);

// "NEXT ▶" / "GOT IT!" drawn at (CANVAS_WIDTH - 60, CANVAS_HEIGHT - 14)
export const NEXT_BTN = zone(ZoneNames.TUT_NEXT_BTN, CANVAS_WIDTH - 110, CANVAS_HEIGHT - 28, 100, 24);

// "< BACK" drawn at (cx, CANVAS_HEIGHT - 14)
export const BACK_BTN = zone(ZoneNames.TUT_BACK, CANVAS_WIDTH / 2 - 40, CANVAS_HEIGHT - 28, 80, 24);
