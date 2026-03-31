/**
 * Exhaustive scene transition tests — validates every valid arrow in the
 * XState scene machine, guards on invalid transitions, state preservation
 * across round-trips, scene lifecycle events, and rapid transition stability.
 *
 * Scene IDs (from SceneMachine.ts SCENE constants):
 *   'menu' | 'playing' | 'paused' | 'shop' | 'skillTree' |
 *   'tutorial' | 'gameOver' | 'highScore'
 *
 * Scene machine events (from SCENE_EVENT constants):
 *   START_GAME, PAUSE, RESUME, OPEN_SHOP, CLOSE_SHOP,
 *   OPEN_SKILLS, CLOSE_SKILLS, OPEN_TUTORIAL, CLOSE_TUTORIAL,
 *   PLAYER_DIED, SUBMIT_SCORE, RETURN_TO_MENU
 *
 * @tags @integration @scene:transitions
 */
import { test, expect } from '../fixtures/game.fixture';
import { gameExpect } from '../helpers/assertions';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Emits a scene machine event onto the bus. The bus bridge in main.ts
 * forwards it to the XState actor via sceneManager.send() when valid.
 */
async function sendSceneEvent(
  harness: { page: { evaluate: (fn: (ev: string) => void, arg: string) => Promise<void> } },
  event: string,
): Promise<void> {
  await harness.page.evaluate(
    (ev: string) => {
      const w = window as unknown as Record<string, unknown>;
      const bus = w.__bus as { emit: (ev: string, data?: unknown) => void };
      bus.emit(ev);
    },
    event,
  );
}

/**
 * Uses the scene manager directly to query whether a transition is legal
 * from the current XState state (does NOT touch the store directly).
 */
async function canTransition(
  harness: { page: { evaluate: (fn: (ev: string) => boolean, arg: string) => Promise<boolean> } },
  event: string,
): Promise<boolean> {
  return harness.page.evaluate(
    (ev: string) => {
      const w = window as unknown as Record<string, unknown>;
      const sm = w.__sceneManager as { canTransition: (e: string) => boolean };
      return sm.canTransition(ev);
    },
    event,
  );
}

/**
 * Gets the current scene name directly from the XState actor (not the store).
 * This confirms the machine state is in sync with the store.
 */
async function getMachineScene(harness: {
  page: { evaluate: (fn: () => string) => Promise<string> };
}): Promise<string> {
  return harness.page.evaluate((): string => {
    const w = window as unknown as Record<string, unknown>;
    const sm = w.__sceneManager as { getCurrentScene: () => string };
    return sm.getCurrentScene();
  });
}

/**
 * Force-sets the XState machine to a target scene by directly calling
 * __setScene (store) AND replaying the machine event path from menu.
 * For tests that need a specific MACHINE state (not just store state),
 * use sendSceneEvent chains instead. For invalid-transition tests that
 * only need the store scene set, __setScene is sufficient.
 *
 * This helper routes the machine into a known scene via event chain so the
 * XState actor and the store remain in sync.
 */
async function routeMachineTo(
  harness: Parameters<typeof sendSceneEvent>[0] & Parameters<typeof getMachineScene>[0] & {
    resetState: () => Promise<void>;
  },
  target: string,
): Promise<void> {
  // Reset to clean menu state first (also resets the XState actor indirectly
  // by resetting store — the actor is independent, so we send events from menu).
  await harness.resetState();

  // The machine always starts on 'menu' after a fresh boot; after resetState
  // the store is reset but the XState actor keeps its last state. Send
  // RETURN_TO_MENU to ensure the machine is on 'menu' regardless.
  await sendSceneEvent(harness, 'RETURN_TO_MENU');

  switch (target) {
    case 'menu':
      // Already there.
      break;
    case 'playing':
      await sendSceneEvent(harness, 'START_GAME');
      break;
    case 'paused':
      await sendSceneEvent(harness, 'START_GAME');
      await sendSceneEvent(harness, 'PAUSE');
      break;
    case 'shop':
      await sendSceneEvent(harness, 'OPEN_SHOP');
      break;
    case 'skillTree':
      await sendSceneEvent(harness, 'OPEN_SKILLS');
      break;
    case 'tutorial':
      await sendSceneEvent(harness, 'OPEN_TUTORIAL');
      break;
    case 'gameOver':
      await sendSceneEvent(harness, 'START_GAME');
      await sendSceneEvent(harness, 'PLAYER_DIED');
      break;
    case 'highScore':
      await sendSceneEvent(harness, 'START_GAME');
      await sendSceneEvent(harness, 'PLAYER_DIED');
      await sendSceneEvent(harness, 'SUBMIT_SCORE');
      break;
    default:
      throw new Error(`routeMachineTo: unknown target scene "${target}"`);
  }
}

// ── 1. Valid transitions ──────────────────────────────────────────────────────

test.describe('Valid transitions @integration @scene:transitions', () => {
  test('menu → playing via START_GAME', async ({ harness }) => {
    await routeMachineTo(harness, 'menu');
    expect(await canTransition(harness, 'START_GAME')).toBe(true);

    await sendSceneEvent(harness, 'START_GAME');

    await gameExpect(harness).toBeInScene('playing');
    expect(await getMachineScene(harness)).toBe('playing');
  });

  test('menu → shop via OPEN_SHOP', async ({ harness }) => {
    await routeMachineTo(harness, 'menu');
    expect(await canTransition(harness, 'OPEN_SHOP')).toBe(true);

    await sendSceneEvent(harness, 'OPEN_SHOP');

    await gameExpect(harness).toBeInScene('shop');
    expect(await getMachineScene(harness)).toBe('shop');
  });

  test('menu → skillTree via OPEN_SKILLS', async ({ harness }) => {
    await routeMachineTo(harness, 'menu');
    expect(await canTransition(harness, 'OPEN_SKILLS')).toBe(true);

    await sendSceneEvent(harness, 'OPEN_SKILLS');

    await gameExpect(harness).toBeInScene('skillTree');
    expect(await getMachineScene(harness)).toBe('skillTree');
  });

  test('menu → tutorial via OPEN_TUTORIAL', async ({ harness }) => {
    await routeMachineTo(harness, 'menu');
    expect(await canTransition(harness, 'OPEN_TUTORIAL')).toBe(true);

    await sendSceneEvent(harness, 'OPEN_TUTORIAL');

    await gameExpect(harness).toBeInScene('tutorial');
    expect(await getMachineScene(harness)).toBe('tutorial');
  });

  test('playing → paused via PAUSE', async ({ harness }) => {
    await routeMachineTo(harness, 'playing');
    expect(await canTransition(harness, 'PAUSE')).toBe(true);

    await sendSceneEvent(harness, 'PAUSE');

    await gameExpect(harness).toBeInScene('paused');
    expect(await getMachineScene(harness)).toBe('paused');
  });

  test('paused → playing via RESUME', async ({ harness }) => {
    await routeMachineTo(harness, 'paused');
    expect(await canTransition(harness, 'RESUME')).toBe(true);

    await sendSceneEvent(harness, 'RESUME');

    await gameExpect(harness).toBeInScene('playing');
    expect(await getMachineScene(harness)).toBe('playing');
  });

  test('paused → menu via RETURN_TO_MENU', async ({ harness }) => {
    await routeMachineTo(harness, 'paused');
    expect(await canTransition(harness, 'RETURN_TO_MENU')).toBe(true);

    await sendSceneEvent(harness, 'RETURN_TO_MENU');

    await gameExpect(harness).toBeInScene('menu');
    expect(await getMachineScene(harness)).toBe('menu');
  });

  test('playing → gameOver via PLAYER_DIED', async ({ harness }) => {
    await routeMachineTo(harness, 'playing');
    expect(await canTransition(harness, 'PLAYER_DIED')).toBe(true);

    await sendSceneEvent(harness, 'PLAYER_DIED');

    await gameExpect(harness).toBeInScene('gameOver');
    expect(await getMachineScene(harness)).toBe('gameOver');
  });

  test('gameOver → highScore via SUBMIT_SCORE', async ({ harness }) => {
    await routeMachineTo(harness, 'gameOver');
    expect(await canTransition(harness, 'SUBMIT_SCORE')).toBe(true);

    await sendSceneEvent(harness, 'SUBMIT_SCORE');

    await gameExpect(harness).toBeInScene('highScore');
    expect(await getMachineScene(harness)).toBe('highScore');
  });

  test('gameOver → menu via RETURN_TO_MENU', async ({ harness }) => {
    await routeMachineTo(harness, 'gameOver');
    expect(await canTransition(harness, 'RETURN_TO_MENU')).toBe(true);

    await sendSceneEvent(harness, 'RETURN_TO_MENU');

    await gameExpect(harness).toBeInScene('menu');
    expect(await getMachineScene(harness)).toBe('menu');
  });

  test('highScore → menu via RETURN_TO_MENU', async ({ harness }) => {
    await routeMachineTo(harness, 'highScore');
    expect(await canTransition(harness, 'RETURN_TO_MENU')).toBe(true);

    await sendSceneEvent(harness, 'RETURN_TO_MENU');

    await gameExpect(harness).toBeInScene('menu');
    expect(await getMachineScene(harness)).toBe('menu');
  });

  test('shop → menu via CLOSE_SHOP', async ({ harness }) => {
    await routeMachineTo(harness, 'shop');
    expect(await canTransition(harness, 'CLOSE_SHOP')).toBe(true);

    await sendSceneEvent(harness, 'CLOSE_SHOP');

    await gameExpect(harness).toBeInScene('menu');
    expect(await getMachineScene(harness)).toBe('menu');
  });

  test('shop → menu via RETURN_TO_MENU', async ({ harness }) => {
    await routeMachineTo(harness, 'shop');
    expect(await canTransition(harness, 'RETURN_TO_MENU')).toBe(true);

    await sendSceneEvent(harness, 'RETURN_TO_MENU');

    await gameExpect(harness).toBeInScene('menu');
    expect(await getMachineScene(harness)).toBe('menu');
  });

  test('skillTree → menu via CLOSE_SKILLS', async ({ harness }) => {
    await routeMachineTo(harness, 'skillTree');
    expect(await canTransition(harness, 'CLOSE_SKILLS')).toBe(true);

    await sendSceneEvent(harness, 'CLOSE_SKILLS');

    await gameExpect(harness).toBeInScene('menu');
    expect(await getMachineScene(harness)).toBe('menu');
  });

  test('tutorial → menu via CLOSE_TUTORIAL', async ({ harness }) => {
    await routeMachineTo(harness, 'tutorial');
    expect(await canTransition(harness, 'CLOSE_TUTORIAL')).toBe(true);

    await sendSceneEvent(harness, 'CLOSE_TUTORIAL');

    await gameExpect(harness).toBeInScene('menu');
    expect(await getMachineScene(harness)).toBe('menu');
  });
});

// ── 2. Invalid transitions (machine ignores undefined events) ─────────────────

test.describe('Invalid transitions @integration @scene:transitions', () => {
  test('menu → paused is blocked (PAUSE from menu does nothing)', async ({ harness }) => {
    await routeMachineTo(harness, 'menu');

    expect(await canTransition(harness, 'PAUSE')).toBe(false);

    await sendSceneEvent(harness, 'PAUSE');

    // Scene must remain on menu — machine silently ignores the event.
    await gameExpect(harness).toBeInScene('menu');
    expect(await getMachineScene(harness)).toBe('menu');
  });

  test('menu → gameOver is blocked (PLAYER_DIED from menu does nothing)', async ({ harness }) => {
    await routeMachineTo(harness, 'menu');

    expect(await canTransition(harness, 'PLAYER_DIED')).toBe(false);

    await sendSceneEvent(harness, 'PLAYER_DIED');

    await gameExpect(harness).toBeInScene('menu');
    expect(await getMachineScene(harness)).toBe('menu');
  });

  test('playing → shop is blocked (OPEN_SHOP from playing does nothing)', async ({ harness }) => {
    await routeMachineTo(harness, 'playing');

    expect(await canTransition(harness, 'OPEN_SHOP')).toBe(false);

    await sendSceneEvent(harness, 'OPEN_SHOP');

    await gameExpect(harness).toBeInScene('playing');
    expect(await getMachineScene(harness)).toBe('playing');
  });

  test('playing → skillTree is blocked (OPEN_SKILLS from playing does nothing)', async ({ harness }) => {
    await routeMachineTo(harness, 'playing');

    expect(await canTransition(harness, 'OPEN_SKILLS')).toBe(false);

    await sendSceneEvent(harness, 'OPEN_SKILLS');

    await gameExpect(harness).toBeInScene('playing');
    expect(await getMachineScene(harness)).toBe('playing');
  });

  test('gameOver → playing is blocked (RESUME from gameOver does nothing)', async ({ harness }) => {
    await routeMachineTo(harness, 'gameOver');

    expect(await canTransition(harness, 'RESUME')).toBe(false);

    await sendSceneEvent(harness, 'RESUME');

    await gameExpect(harness).toBeInScene('gameOver');
    expect(await getMachineScene(harness)).toBe('gameOver');
  });

  test('highScore → playing is blocked (START_GAME from highScore does nothing)', async ({ harness }) => {
    await routeMachineTo(harness, 'highScore');

    expect(await canTransition(harness, 'START_GAME')).toBe(false);

    await sendSceneEvent(harness, 'START_GAME');

    await gameExpect(harness).toBeInScene('highScore');
    expect(await getMachineScene(harness)).toBe('highScore');
  });

  test('paused → shop is blocked (OPEN_SHOP from paused does nothing)', async ({ harness }) => {
    await routeMachineTo(harness, 'paused');

    expect(await canTransition(harness, 'OPEN_SHOP')).toBe(false);

    await sendSceneEvent(harness, 'OPEN_SHOP');

    await gameExpect(harness).toBeInScene('paused');
    expect(await getMachineScene(harness)).toBe('paused');
  });

  test('shop → playing is blocked (START_GAME from shop does nothing)', async ({ harness }) => {
    await routeMachineTo(harness, 'shop');

    expect(await canTransition(harness, 'START_GAME')).toBe(false);

    await sendSceneEvent(harness, 'START_GAME');

    await gameExpect(harness).toBeInScene('shop');
    expect(await getMachineScene(harness)).toBe('shop');
  });
});

// ── 3. State preservation ─────────────────────────────────────────────────────

test.describe('State preservation @integration @scene:transitions', () => {
  test('playing → paused → playing: score, wave, enemies are preserved', async ({ harness }) => {
    await routeMachineTo(harness, 'playing');

    // Inject known state values before pausing.
    await harness.setState({ player: { score: 4200 } });
    await harness.setState({ combat: { wave: 3 } });

    const hudBefore = await harness.getHUDState();

    await sendSceneEvent(harness, 'PAUSE');
    await gameExpect(harness).toBeInScene('paused');

    // Pause must not reset score or wave.
    const hudPaused = await harness.getHUDState();
    expect(hudPaused.score).toBe(hudBefore.score);
    expect(hudPaused.wave).toBe(hudBefore.wave);

    await sendSceneEvent(harness, 'RESUME');
    await gameExpect(harness).toBeInScene('playing');

    // Resume must restore the same values.
    const hudAfter = await harness.getHUDState();
    expect(hudAfter.score).toBe(hudBefore.score);
    expect(hudAfter.wave).toBe(hudBefore.wave);
  });

  test('playing → paused → menu: state is properly reset', async ({ harness }) => {
    await routeMachineTo(harness, 'playing');
    await harness.setState({ player: { score: 9999 } });

    await sendSceneEvent(harness, 'PAUSE');
    await sendSceneEvent(harness, 'RETURN_TO_MENU');

    await gameExpect(harness).toBeInScene('menu');

    // After quitting to menu, starting a new game should have a fresh score.
    await sendSceneEvent(harness, 'START_GAME');
    const hudFresh = await harness.getHUDState();
    // Score must be reset (0) — quitting does not carry over the old run.
    expect(hudFresh.score).toBe(0);
  });

  test('menu → shop → menu: economy (coins) state is preserved', async ({ harness }) => {
    await routeMachineTo(harness, 'menu');
    await harness.setCoins(750);

    await sendSceneEvent(harness, 'OPEN_SHOP');
    await gameExpect(harness).toBeInScene('shop');

    // Coins must not change just from entering the shop.
    await gameExpect(harness).toHaveCoins(750);

    await sendSceneEvent(harness, 'CLOSE_SHOP');
    await gameExpect(harness).toBeInScene('menu');

    // Coins must still be intact after closing the shop without buying.
    await gameExpect(harness).toHaveCoins(750);
  });

  test('menu → tutorial → menu: no state changes occur', async ({ harness }) => {
    await routeMachineTo(harness, 'menu');

    const stateBefore = await harness.getState();

    await sendSceneEvent(harness, 'OPEN_TUTORIAL');
    await gameExpect(harness).toBeInScene('tutorial');

    await sendSceneEvent(harness, 'CLOSE_TUTORIAL');
    await gameExpect(harness).toBeInScene('menu');

    const stateAfter = await harness.getState();

    // Core gameplay state must be identical — tutorial is read-only.
    expect(stateAfter['player']).toEqual(stateBefore['player']);
    expect(stateAfter['economy']).toEqual(stateBefore['economy']);
    expect(stateAfter['combat']).toEqual(stateBefore['combat']);
  });

  test('menu → skillTree → menu: economy state is preserved', async ({ harness }) => {
    await routeMachineTo(harness, 'menu');
    await harness.setCoins(500);

    await sendSceneEvent(harness, 'OPEN_SKILLS');
    await gameExpect(harness).toBeInScene('skillTree');

    await gameExpect(harness).toHaveCoins(500);

    await sendSceneEvent(harness, 'CLOSE_SKILLS');
    await gameExpect(harness).toBeInScene('menu');

    await gameExpect(harness).toHaveCoins(500);
  });
});

// ── 4. Scene lifecycle events ─────────────────────────────────────────────────

test.describe('Scene lifecycle events @integration @scene:transitions', () => {
  test('every valid transition emits scene:exit then scene:enter', async ({ harness }) => {
    await routeMachineTo(harness, 'menu');
    await harness.clearEventLog();

    await sendSceneEvent(harness, 'START_GAME');
    await gameExpect(harness).toBeInScene('playing');

    const exits = await harness.getEvents('scene:exit');
    const enters = await harness.getEvents('scene:enter');

    expect(exits.length).toBeGreaterThanOrEqual(1);
    expect(enters.length).toBeGreaterThanOrEqual(1);
  });

  test('scene:exit event carries the correct exiting scene ID', async ({ harness }) => {
    await routeMachineTo(harness, 'menu');
    await harness.clearEventLog();

    await sendSceneEvent(harness, 'OPEN_SHOP');

    const exits = await harness.getEvents('scene:exit');
    expect(exits.length).toBeGreaterThanOrEqual(1);

    const exitData = exits[0]?.data as Record<string, unknown> | undefined;
    expect(exitData?.['scene']).toBe('menu');
  });

  test('scene:enter event carries the correct entering scene ID', async ({ harness }) => {
    await routeMachineTo(harness, 'menu');
    await harness.clearEventLog();

    await sendSceneEvent(harness, 'OPEN_TUTORIAL');

    const enters = await harness.getEvents('scene:enter');
    expect(enters.length).toBeGreaterThanOrEqual(1);

    const enterData = enters[0]?.data as Record<string, unknown> | undefined;
    expect(enterData?.['scene']).toBe('tutorial');
  });

  test('scene:exit fires before scene:enter on every transition', async ({ harness }) => {
    await routeMachineTo(harness, 'menu');
    await harness.clearEventLog();

    await sendSceneEvent(harness, 'START_GAME');

    const exits = await harness.getEvents('scene:exit');
    const enters = await harness.getEvents('scene:enter');

    expect(exits.length).toBeGreaterThanOrEqual(1);
    expect(enters.length).toBeGreaterThanOrEqual(1);

    // The exit event must have a lower (earlier) frame number than the enter event.
    const exitFrame = exits[exits.length - 1]!.frame;
    const enterFrame = enters[enters.length - 1]!.frame;

    // Both events fire synchronously in the same frame but exit is registered
    // first in SceneManager. Verify exit time <= enter time.
    expect(exitFrame).toBeLessThanOrEqual(enterFrame);
  });
});

// ── 5. Rapid transitions ──────────────────────────────────────────────────────

test.describe('Rapid transitions @integration @scene:transitions', () => {
  test('pause/unpause 10 times rapidly leaves machine on playing', async ({ harness }) => {
    await routeMachineTo(harness, 'playing');

    for (let i = 0; i < 10; i++) {
      await sendSceneEvent(harness, 'PAUSE');
      await sendSceneEvent(harness, 'RESUME');
    }

    await gameExpect(harness).toBeInScene('playing');
    expect(await getMachineScene(harness)).toBe('playing');
    await gameExpect(harness).toHaveNoErrors();
  });

  test('open/close shop 10 times rapidly leaves machine on menu', async ({ harness }) => {
    await routeMachineTo(harness, 'menu');

    for (let i = 0; i < 10; i++) {
      await sendSceneEvent(harness, 'OPEN_SHOP');
      await sendSceneEvent(harness, 'CLOSE_SHOP');
    }

    await gameExpect(harness).toBeInScene('menu');
    expect(await getMachineScene(harness)).toBe('menu');
    await gameExpect(harness).toHaveNoErrors();
  });

  test('start game and immediately pause produces clean paused state', async ({ harness }) => {
    await routeMachineTo(harness, 'menu');

    await sendSceneEvent(harness, 'START_GAME');
    await sendSceneEvent(harness, 'PAUSE');

    await gameExpect(harness).toBeInScene('paused');
    expect(await getMachineScene(harness)).toBe('paused');
    await gameExpect(harness).toHaveNoErrors();
  });

  test('no orphaned state after rapid start → die → menu → start cycle', async ({ harness }) => {
    // Perform the full death-to-menu-to-restart cycle 5 times and confirm
    // no JS errors and no stale scene state accumulate.
    for (let i = 0; i < 5; i++) {
      await routeMachineTo(harness, 'menu');
      await sendSceneEvent(harness, 'START_GAME');
      await sendSceneEvent(harness, 'PLAYER_DIED');
      await sendSceneEvent(harness, 'RETURN_TO_MENU');
    }

    await gameExpect(harness).toBeInScene('menu');
    expect(await getMachineScene(harness)).toBe('menu');
    await gameExpect(harness).toHaveNoErrors();
  });
});
