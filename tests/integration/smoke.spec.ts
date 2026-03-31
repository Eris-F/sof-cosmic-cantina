/**
 * Smoke test — verifies the Playwright test infrastructure works end-to-end.
 * This test boots the game, accesses the harness, and performs basic assertions.
 *
 * @tags @smoke
 */
import { test, expect } from '../fixtures/game.fixture';
import { gameExpect } from '../helpers/assertions';

test.describe('Smoke test @smoke', () => {
  test('game boots and harness is available', async ({ harness }) => {
    // The fixture already navigated and waited for __gameStore
    const state = await harness.getState();
    expect(state).toBeTruthy();
    expect(state).toHaveProperty('scene');
    expect(state).toHaveProperty('player');
    expect(state).toHaveProperty('combat');
    expect(state).toHaveProperty('economy');
  });

  test('game starts on menu scene', async ({ harness }) => {
    await gameExpect(harness).toBeInScene('menu');
  });

  test('can read HUD state', async ({ harness }) => {
    const hud = await harness.getHUDState();
    expect(hud).toHaveProperty('score');
    expect(hud).toHaveProperty('health');
    expect(hud).toHaveProperty('lives');
    expect(hud).toHaveProperty('wave');
    expect(hud).toHaveProperty('coins');
  });

  test('can set and read state', async ({ harness }) => {
    await harness.setCoins(999);
    const coins = await harness.getCoins();
    expect(coins).toBe(999);
  });

  test('can tick frames deterministically', async ({ harness }) => {
    const frameBefore = await harness.getFrame();
    await harness.tickN(10);
    const frameAfter = await harness.getFrame();
    expect(frameAfter).toBe(frameBefore + 10);
  });

  test('can change scene', async ({ harness }) => {
    await harness.setScene('tutorial');
    await harness.tickN(5);
    await gameExpect(harness).toBeInScene('tutorial');
  });

  test('can query zones', async ({ harness }) => {
    const zones = await harness.getZones();
    expect(zones.length).toBeGreaterThan(0);
    // Menu should have zones
    const startZone = zones.find(z => z.name === 'START');
    expect(startZone).toBeTruthy();
  });

  test('event log captures events', async ({ harness }) => {
    await harness.clearEventLog();
    await harness.tickN(5);
    const events = await harness.getEvents();
    // There should be some events from ticking (starfield updates, etc.)
    expect(events).toBeInstanceOf(Array);
  });

  test('no errors on boot', async ({ harness }) => {
    await gameExpect(harness).toHaveNoErrors();
  });
});
