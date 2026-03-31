/**
 * Touch zones for the skill tree scene.
 * Coordinates match SkillTreeRenderer.ts draw positions exactly.
 *
 * @module zones/skilltree
 */
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';
import { zone } from './Zone';
import type { Zone } from './Zone';
import { ZoneNames, skillBranch as branchName, skillUpgrade as upgradeName } from './names';

// ── Layout constants ────────────────────────────────────────────────────

export const START_Y = 70;
export const BRANCH_H = 100;
export const BRANCH_COUNT = 5;

// ── Branch rows ─────────────────────────────────────────────────────────

/** Returns the zone for the entire branch row at the given index (0-4). */
export function branchRow(index: number): Zone {
  return zone(branchName(index), 8, START_Y + index * BRANCH_H, CANVAS_WIDTH - 16, BRANCH_H - 6);
}

export const BRANCH_0 = branchRow(0);
export const BRANCH_1 = branchRow(1);
export const BRANCH_2 = branchRow(2);
export const BRANCH_3 = branchRow(3);
export const BRANCH_4 = branchRow(4);

// ── Upgrade button (inside selected branch, at bottom) ──────────────────

/** Returns the upgrade button zone for the branch at the given index. */
export function upgradeButton(index: number): Zone {
  const by = START_Y + index * BRANCH_H;
  // "[ UPGRADE ]" drawn at (cx, by + branchH - 14)
  return zone(upgradeName(index), CANVAS_WIDTH / 2 - 60, by + BRANCH_H - 26, 120, 18);
}

// ── Back button ─────────────────────────────────────────────────────────

// "< BACK" drawn at (cx, CANVAS_HEIGHT - 10)
export const BACK_BTN = zone(ZoneNames.SKILL_BACK, CANVAS_WIDTH / 2 - 40, CANVAS_HEIGHT - 22, 80, 22);
