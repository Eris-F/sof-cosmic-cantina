/**
 * Zone name constants — single source of truth for all zone identifiers.
 * Tests and renderers import these instead of hardcoding strings.
 *
 * @module zones/names
 */

export const ZoneNames = {
  // Menu
  MENU_SHOP: 'SHOP',
  MENU_SKILLS: 'SKILLS',
  MENU_TUTORIAL: 'TUTORIAL',
  MENU_DIFF_LEFT: 'DIFF_LEFT',
  MENU_DIFF_RIGHT: 'DIFF_RIGHT',
  MENU_MODE_LEFT: 'MODE_LEFT',
  MENU_MODE_RIGHT: 'MODE_RIGHT',
  MENU_START: 'START',
  MENU_TITLE: 'TITLE',

  // Shop (static)
  SHOP_BACK: 'SHOP_BACK',

  // Shop (dynamic — use functions below)
  // ...

  // SkillTree (static)
  SKILL_BACK: 'SKILL_BACK',

  // Tutorial
  TUT_PREV: 'TUT_PREV',
  TUT_NEXT: 'TUT_NEXT',
  TUT_PREV_BTN: 'TUT_PREV_BTN',
  TUT_NEXT_BTN: 'TUT_NEXT_BTN',
  TUT_BACK: 'TUT_BACK',

  // Gameplay
  PAUSE: 'PAUSE',
  GAMEOVER_TAP: 'GAMEOVER_TAP',

  // High Score
  HS_LETTER_0: 'HS_L0',
  HS_LETTER_1: 'HS_L1',
  HS_LETTER_2: 'HS_L2',
  HS_UP_0: 'HS_UP_0',
  HS_UP_1: 'HS_UP_1',
  HS_UP_2: 'HS_UP_2',
  HS_DOWN_0: 'HS_DOWN_0',
  HS_DOWN_1: 'HS_DOWN_1',
  HS_DOWN_2: 'HS_DOWN_2',
} as const;

// Dynamic zone name generators (for indexed items)
export function shopCategoryTab(index: number): string {
  return `CAT_TAB_${index}`;
}
export function shopItemCard(index: number): string {
  return `ITEM_${index}`;
}
export function shopBuyButton(index: number): string {
  return `BUY_BTN_${index}`;
}
export function skillBranch(index: number): string {
  return `BRANCH_${index}`;
}
export function skillUpgrade(index: number): string {
  return `UPGRADE_${index}`;
}

export type ZoneName = typeof ZoneNames[keyof typeof ZoneNames];
