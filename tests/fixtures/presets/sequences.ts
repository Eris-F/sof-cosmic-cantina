/**
 * Composable action sequences — multi-step helpers for common test flows.
 * Each sequence uses the GameHarness to orchestrate player actions.
 */
import type { GameHarness } from '../game.fixture';
import { ZoneNames } from '../../../src/zones/names';

// ── Navigation ──────────────────────────────────────────────────────────

/** Navigate from menu to a target scene by tapping the appropriate button. */
export async function navigateFromMenu(
  harness: GameHarness,
  target: 'shop' | 'skills' | 'tutorial',
): Promise<void> {
  const scene = await harness.getScene();
  if (scene !== 'menu') {
    await harness.setScene('menu');
    await harness.tickN(5);
  }

  const zoneMap = {
    shop: ZoneNames.MENU_SHOP,
    skills: ZoneNames.MENU_SKILLS,
    tutorial: ZoneNames.MENU_TUTORIAL,
  } as const;

  await harness.tapZone(zoneMap[target]);
  await harness.tickN(10); // Allow scene transition
}

/** Start a game from the menu. */
export async function startGame(harness: GameHarness): Promise<void> {
  await harness.setScene('menu');
  await harness.tickN(5);
  await harness.tapZone(ZoneNames.MENU_START);
  await harness.tickN(10);
}

/** Return to menu from any scene (via setting scene directly). */
export async function returnToMenu(harness: GameHarness): Promise<void> {
  await harness.setScene('menu');
  await harness.tickN(5);
}

// ── Gameplay ────────────────────────────────────────────────────────────

/** Start game and advance to a specific wave number. */
export async function playUntilWave(
  harness: GameHarness,
  targetWave: number,
): Promise<void> {
  await startGame(harness);

  await harness.setState({
    combat: { wave: targetWave },
  });
  await harness.tickN(10);
}

/** Start game and let the player die (set health/lives to 0). */
export async function playUntilDeath(harness: GameHarness): Promise<void> {
  await startGame(harness);
  await harness.tickN(30); // Let game settle

  await harness.setState({
    player: { lives: 0, alive: false },
  });
  await harness.tickN(30);
}

/** Pause the game (assumes currently playing). */
export async function pauseGame(harness: GameHarness): Promise<void> {
  await harness.tapZone(ZoneNames.PAUSE);
  await harness.tickN(5);
}

/** Resume from pause (sets scene directly to 'playing'). */
export async function resumeGame(harness: GameHarness): Promise<void> {
  await harness.setScene('playing');
  await harness.tickN(5);
}

// ── Tutorial ────────────────────────────────────────────────────────────

/** Navigate through all tutorial pages. */
export async function completeTutorial(
  harness: GameHarness,
  pageCount: number,
): Promise<void> {
  await navigateFromMenu(harness, 'tutorial');

  for (let i = 0; i < pageCount - 1; i++) {
    await harness.tapZone(ZoneNames.TUT_NEXT);
    await harness.tickN(5);
  }

  // Last page — tap "GOT IT!" (same zone as NEXT)
  await harness.tapZone(ZoneNames.TUT_NEXT);
  await harness.tickN(10);
}

/** Go to next tutorial page. */
export async function tutorialNext(harness: GameHarness): Promise<void> {
  await harness.tapZone(ZoneNames.TUT_NEXT);
  await harness.tickN(5);
}

/** Go to previous tutorial page. */
export async function tutorialPrev(harness: GameHarness): Promise<void> {
  await harness.tapZone(ZoneNames.TUT_PREV);
  await harness.tickN(5);
}

// ── High Score ──────────────────────────────────────────────────────────

/** Enter a 3-letter high score name. */
export async function enterHighScore(
  harness: GameHarness,
  letters: [number, number, number],
): Promise<void> {
  const scene = await harness.getScene();
  if (scene !== 'high_score') {
    await harness.setScene('high_score');
    await harness.tickN(5);
  }

  const upZones = [ZoneNames.HS_UP_0, ZoneNames.HS_UP_1, ZoneNames.HS_UP_2] as const;

  for (let pos = 0; pos < 3; pos++) {
    const target = letters[pos]!; // 0=A, 1=B, ... 25=Z
    for (let i = 0; i < target; i++) {
      await harness.tapZone(upZones[pos]!);
      await harness.tickN(3);
    }
  }
}

// ── Difficulty ──────────────────────────────────────────────────────────

/** Cycle difficulty on menu. Direction: 'left' or 'right'. */
export async function cycleDifficulty(
  harness: GameHarness,
  direction: 'left' | 'right',
): Promise<void> {
  const zone =
    direction === 'left' ? ZoneNames.MENU_DIFF_LEFT : ZoneNames.MENU_DIFF_RIGHT;
  await harness.tapZone(zone);
  await harness.tickN(5);
}

/** Cycle game mode on menu. Direction: 'left' or 'right'. */
export async function cycleMode(
  harness: GameHarness,
  direction: 'left' | 'right',
): Promise<void> {
  const zone =
    direction === 'left' ? ZoneNames.MENU_MODE_LEFT : ZoneNames.MENU_MODE_RIGHT;
  await harness.tapZone(zone);
  await harness.tickN(5);
}

// ── Utility ─────────────────────────────────────────────────────────────

/** Give the player coins by setting economy state. */
export async function giveCoins(
  harness: GameHarness,
  amount: number,
): Promise<void> {
  await harness.setCoins(amount);
}

/** Set player to near-death state (1 life, 1 health). */
export async function setNearDeath(harness: GameHarness): Promise<void> {
  await harness.setState({
    player: { lives: 1 },
  });
  await harness.tickN(1);
}
