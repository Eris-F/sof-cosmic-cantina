/**
 * Touch zones for the gameplay scene.
 *
 * @module zones/gameplay
 */
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';
import { zone } from './Zone';
import { ZoneNames } from './names';

// ── Pause button (top-right corner) ─────────────────────────────────────

// TouchAdapter pause zone: top-right 40x30
export const PAUSE_BTN = zone(ZoneNames.PAUSE, CANVAS_WIDTH - 40, 0, 40, 30);

// ── Game over "tap to continue" ─────────────────────────────────────────

export const GAMEOVER_TAP = zone(ZoneNames.GAMEOVER_TAP, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

// ── High score letter zones ─────────────────────────────────────────────

// Letters are drawn centered, spaced ~30px apart at ~y=300
// Up arrow above, down arrow below each letter
const HS_CX = CANVAS_WIDTH / 2;
const HS_Y = 300;
const HS_SPACING = 40;

export const HS_LETTER_0 = zone(ZoneNames.HS_LETTER_0, HS_CX - HS_SPACING - 15, HS_Y - 15, 30, 30);
export const HS_LETTER_1 = zone(ZoneNames.HS_LETTER_1, HS_CX - 15, HS_Y - 15, 30, 30);
export const HS_LETTER_2 = zone(ZoneNames.HS_LETTER_2, HS_CX + HS_SPACING - 15, HS_Y - 15, 30, 30);

export const HS_UP_0 = zone(ZoneNames.HS_UP_0, HS_CX - HS_SPACING - 15, HS_Y - 45, 30, 25);
export const HS_UP_1 = zone(ZoneNames.HS_UP_1, HS_CX - 15, HS_Y - 45, 30, 25);
export const HS_UP_2 = zone(ZoneNames.HS_UP_2, HS_CX + HS_SPACING - 15, HS_Y - 45, 30, 25);

export const HS_DOWN_0 = zone(ZoneNames.HS_DOWN_0, HS_CX - HS_SPACING - 15, HS_Y + 20, 30, 25);
export const HS_DOWN_1 = zone(ZoneNames.HS_DOWN_1, HS_CX - 15, HS_Y + 20, 30, 25);
export const HS_DOWN_2 = zone(ZoneNames.HS_DOWN_2, HS_CX + HS_SPACING - 15, HS_Y + 20, 30, 25);
