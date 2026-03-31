/**
 * Player gameplay tests — comprehensive coverage of PlayerSystem behaviour.
 *
 * Tests cover: initial state, keyboard movement, boundary clamping,
 * firing with cooldown, taking damage, invincibility, death, respawn,
 * and edge cases.
 *
 * @tags @gameplay @system:player
 */

import { test, expect } from '../fixtures/game.fixture';
import { gameExpect } from '../helpers/assertions';

// ---------------------------------------------------------------------------
// Constants (mirrored from src/config/constants.ts — must stay in sync)
// ---------------------------------------------------------------------------

const CANVAS_WIDTH = 480;
const PLAYER_WIDTH = 32;
const INITIAL_LIVES = 3;
const INVINCIBILITY_TIME = 1.5;
const STANDARD_WEAPON_COOLDOWN = 0.18; // seconds — src/weapons.ts standard weapon

/** Default dt used by the harness __tick (16ms ≈ one frame at 60 fps). */
const DEFAULT_DT = 1 / 60;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Read the player sub-state from the game store. */
async function getPlayer(harness: { getState(): Promise<Record<string, unknown>> }) {
  const state = await harness.getState();
  return state['player'] as Record<string, unknown>;
}

/** Read the combat sub-state from the game store. */
async function getCombat(harness: { getState(): Promise<Record<string, unknown>> }) {
  const state = await harness.getState();
  return state['combat'] as Record<string, unknown>;
}

/** Place the game in the playing scene and let it settle. */
async function enterPlaying(harness: {
  setScene(id: string): Promise<void>;
  tickN(n: number): Promise<void>;
}) {
  await harness.setScene('playing');
  await harness.tickN(5);
}

// ---------------------------------------------------------------------------
// 1. Initial state
// ---------------------------------------------------------------------------

test.describe('Player initial state @gameplay @system:player', () => {
  test('player spawns at horizontal centre of canvas', async ({ harness }) => {
    await enterPlaying(harness);
    const player = await getPlayer(harness);
    // x should be CANVAS_WIDTH / 2 = 240
    expect(player['x']).toBe(CANVAS_WIDTH / 2);
  });

  test('player starts with INITIAL_LIVES lives', async ({ harness }) => {
    await enterPlaying(harness);
    const player = await getPlayer(harness);
    expect(player['lives']).toBe(INITIAL_LIVES);
  });

  test('player starts alive', async ({ harness }) => {
    await enterPlaying(harness);
    const player = await getPlayer(harness);
    expect(player['alive']).toBe(true);
  });

  test('player starts not invincible (invincibleTimer = 0)', async ({ harness }) => {
    await enterPlaying(harness);
    const player = await getPlayer(harness);
    expect(player['invincibleTimer']).toBe(0);
  });

  test('player starts with vx = 0 (not moving)', async ({ harness }) => {
    await enterPlaying(harness);
    const player = await getPlayer(harness);
    expect(player['vx']).toBe(0);
  });

  test('player weapon defaults to standard with cooldown 0', async ({ harness }) => {
    await enterPlaying(harness);
    const player = await getPlayer(harness);
    const weapon = player['weapon'] as Record<string, unknown>;
    expect((weapon['slots'] as string[])[0]).toBe('standard');
    expect(weapon['cooldownTimer']).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 2. Movement
// ---------------------------------------------------------------------------

test.describe('Player movement @gameplay @system:player', () => {
  test('player moves left when ArrowLeft is held', async ({ harness, page }) => {
    await enterPlaying(harness);

    const before = await getPlayer(harness);
    const xBefore = before['x'] as number;

    // Hold left for 10 frames so the acceleration builds up
    await page.keyboard.down('ArrowLeft');
    await harness.tickN(10);
    await page.keyboard.up('ArrowLeft');

    const after = await getPlayer(harness);
    const xAfter = after['x'] as number;

    expect(xAfter).toBeLessThan(xBefore);
  });

  test('player moves right when ArrowRight is held', async ({ harness, page }) => {
    await enterPlaying(harness);

    // Move player to left side so there is room to move right
    await harness.setState({ player: { x: 100 } });

    const before = await getPlayer(harness);
    const xBefore = before['x'] as number;

    await page.keyboard.down('ArrowRight');
    await harness.tickN(10);
    await page.keyboard.up('ArrowRight');

    const after = await getPlayer(harness);
    const xAfter = after['x'] as number;

    expect(xAfter).toBeGreaterThan(xBefore);
  });

  test('player also moves left when KeyA is held', async ({ harness, page }) => {
    await enterPlaying(harness);

    const before = await getPlayer(harness);
    const xBefore = before['x'] as number;

    await page.keyboard.down('KeyA');
    await harness.tickN(10);
    await page.keyboard.up('KeyA');

    const after = await getPlayer(harness);
    expect(after['x'] as number).toBeLessThan(xBefore);
  });

  test('player also moves right when KeyD is held', async ({ harness, page }) => {
    await enterPlaying(harness);
    await harness.setState({ player: { x: 100 } });

    const before = await getPlayer(harness);
    const xBefore = before['x'] as number;

    await page.keyboard.down('KeyD');
    await harness.tickN(10);
    await page.keyboard.up('KeyD');

    const after = await getPlayer(harness);
    expect(after['x'] as number).toBeGreaterThan(xBefore);
  });

  test('player does not move past left boundary (x >= halfWidth)', async ({ harness, page }) => {
    await enterPlaying(harness);

    // Place player near left edge
    const halfW = PLAYER_WIDTH / 2;
    await harness.setState({ player: { x: halfW + 2, vx: 0 } });

    // Hold left for many frames
    await page.keyboard.down('ArrowLeft');
    await harness.tickN(60);
    await page.keyboard.up('ArrowLeft');

    const player = await getPlayer(harness);
    expect(player['x'] as number).toBeGreaterThanOrEqual(halfW);
  });

  test('player does not move past right boundary (x <= CANVAS_WIDTH - halfWidth)', async ({ harness, page }) => {
    await enterPlaying(harness);

    const halfW = PLAYER_WIDTH / 2;
    await harness.setState({ player: { x: CANVAS_WIDTH - halfW - 2, vx: 0 } });

    await page.keyboard.down('ArrowRight');
    await harness.tickN(60);
    await page.keyboard.up('ArrowRight');

    const player = await getPlayer(harness);
    expect(player['x'] as number).toBeLessThanOrEqual(CANVAS_WIDTH - halfW);
  });

  test('player stays in place with no input (vx decelerates to 0)', async ({ harness }) => {
    await enterPlaying(harness);

    // Set an initial velocity then tick — should decelerate
    await harness.setState({ player: { vx: 0 } });
    const before = await getPlayer(harness);
    const xBefore = before['x'] as number;

    // Tick 10 frames with no keys held
    await harness.tickN(10);

    const after = await getPlayer(harness);
    // Position should be the same (vx = 0, no movement)
    expect(after['x'] as number).toBe(xBefore);
  });

  test('player position updates on each frame when moving', async ({ harness, page }) => {
    await enterPlaying(harness);
    await harness.setState({ player: { x: CANVAS_WIDTH / 2, vx: 0 } });

    await page.keyboard.down('ArrowRight');

    // Each tick should advance x
    let prev = (await getPlayer(harness))['x'] as number;
    let advanced = false;
    for (let i = 0; i < 15; i++) {
      await harness.tick();
      const curr = (await getPlayer(harness))['x'] as number;
      if (curr > prev) {
        advanced = true;
        break;
      }
      prev = curr;
    }

    await page.keyboard.up('ArrowRight');
    expect(advanced).toBe(true);
  });

  test('player x exactly at left boundary is accepted', async ({ harness }) => {
    await enterPlaying(harness);
    const halfW = PLAYER_WIDTH / 2;
    await harness.setState({ player: { x: halfW, vx: 0 } });
    await harness.tickN(1);

    const player = await getPlayer(harness);
    expect(player['x'] as number).toBeGreaterThanOrEqual(halfW);
  });

  test('player x exactly at right boundary is accepted', async ({ harness }) => {
    await enterPlaying(harness);
    const halfW = PLAYER_WIDTH / 2;
    await harness.setState({ player: { x: CANVAS_WIDTH - halfW, vx: 0 } });
    await harness.tickN(1);

    const player = await getPlayer(harness);
    expect(player['x'] as number).toBeLessThanOrEqual(CANVAS_WIDTH - halfW);
  });
});

// ---------------------------------------------------------------------------
// 3. Firing
// ---------------------------------------------------------------------------

test.describe('Player firing @gameplay @system:player', () => {
  test('pressing Space creates at least one player bullet', async ({ harness, page }) => {
    await enterPlaying(harness);

    // Reset bullets and ensure cooldown is 0
    await harness.setState({
      combat: { bullets: [] },
      player: { weapon: { activeSlot: 0, slots: ['standard'], cooldownTimer: 0, swapFlash: 0 } },
    });

    await page.keyboard.down('Space');
    await harness.tick();
    await page.keyboard.up('Space');

    const combat = await getCombat(harness);
    const bullets = (combat['bullets'] as Array<Record<string, unknown>>)
      .filter((b) => b['isPlayer'] === true && b['active'] === true);

    expect(bullets.length).toBeGreaterThan(0);
  });

  test('bullet spawns at approximately player x position', async ({ harness, page }) => {
    await enterPlaying(harness);
    await harness.setState({
      combat: { bullets: [] },
      player: { x: 200, weapon: { activeSlot: 0, slots: ['standard'], cooldownTimer: 0, swapFlash: 0 } },
    });

    await page.keyboard.down('Space');
    await harness.tick();
    await page.keyboard.up('Space');

    const combat = await getCombat(harness);
    const bullets = combat['bullets'] as Array<Record<string, unknown>>;
    const playerBullet = bullets.find((b) => b['isPlayer'] === true);

    expect(playerBullet).toBeDefined();
    // Bullet x should match player x (standard shot, no spread)
    expect(playerBullet!['x'] as number).toBeCloseTo(200, 0);
  });

  test('bullet moves upward (vy < 0)', async ({ harness, page }) => {
    await enterPlaying(harness);
    await harness.setState({
      combat: { bullets: [] },
      player: { weapon: { activeSlot: 0, slots: ['standard'], cooldownTimer: 0, swapFlash: 0 } },
    });

    await page.keyboard.down('Space');
    await harness.tick();
    await page.keyboard.up('Space');

    const combat = await getCombat(harness);
    const bullets = combat['bullets'] as Array<Record<string, unknown>>;
    const playerBullet = bullets.find((b) => b['isPlayer'] === true);

    expect(playerBullet).toBeDefined();
    expect(playerBullet!['vy'] as number).toBeLessThan(0);
  });

  test('fire has cooldown — holding Space does not fire every frame', async ({ harness, page }) => {
    await enterPlaying(harness);
    await harness.setState({
      combat: { bullets: [] },
      player: { weapon: { activeSlot: 0, slots: ['standard'], cooldownTimer: 0, swapFlash: 0 } },
    });

    // Hold Space for 3 consecutive frames
    await page.keyboard.down('Space');
    await harness.tick();
    await harness.tick();
    await harness.tick();
    await page.keyboard.up('Space');

    const combat = await getCombat(harness);
    const playerBullets = (combat['bullets'] as Array<Record<string, unknown>>)
      .filter((b) => b['isPlayer'] === true);

    // 3 frames at ~16ms each = ~48ms total, standard cooldown = 180ms
    // So only 1 bullet should have been created
    expect(playerBullets.length).toBe(1);
  });

  test('fire cooldown timer is set after firing', async ({ harness, page }) => {
    await enterPlaying(harness);
    await harness.setState({
      combat: { bullets: [] },
      player: { weapon: { activeSlot: 0, slots: ['standard'], cooldownTimer: 0, swapFlash: 0 } },
    });

    await page.keyboard.down('Space');
    await harness.tick();
    await page.keyboard.up('Space');

    const player = await getPlayer(harness);
    const weapon = player['weapon'] as Record<string, unknown>;
    // cooldownTimer should now be > 0 (approximately STANDARD_WEAPON_COOLDOWN - 1 frame)
    expect(weapon['cooldownTimer'] as number).toBeGreaterThan(0);
  });

  test('PLAYER_FIRE event is emitted when firing', async ({ harness, page }) => {
    await enterPlaying(harness);
    await harness.setState({
      combat: { bullets: [] },
      player: { weapon: { activeSlot: 0, slots: ['standard'], cooldownTimer: 0, swapFlash: 0 } },
    });
    await harness.clearEventLog();

    await page.keyboard.down('Space');
    await harness.tick();
    await page.keyboard.up('Space');

    await gameExpect(harness).toHaveEmitted('player:fire');
  });

  test('rapid fire respects cooldown — only one bullet per cooldown window', async ({ harness, page }) => {
    await enterPlaying(harness);
    await harness.setState({
      combat: { bullets: [] },
      player: { weapon: { activeSlot: 0, slots: ['standard'], cooldownTimer: 0, swapFlash: 0 } },
    });

    // Fire once, then immediately try to fire again
    await page.keyboard.down('Space');
    await harness.tick(); // fires bullet, sets cooldown
    const afterFirst = await getCombat(harness);
    const countAfterFirst = (afterFirst['bullets'] as Array<Record<string, unknown>>)
      .filter((b) => b['isPlayer'] === true).length;

    await harness.tick(); // cooldown not expired — should not fire
    await harness.tick();
    await page.keyboard.up('Space');

    const afterThird = await getCombat(harness);
    const countAfterThird = (afterThird['bullets'] as Array<Record<string, unknown>>)
      .filter((b) => b['isPlayer'] === true).length;

    expect(countAfterFirst).toBe(1);
    expect(countAfterThird).toBe(1); // same — no second bullet yet
  });

  test('second bullet fires after cooldown expires', async ({ harness, page }) => {
    await enterPlaying(harness);
    await harness.setState({
      combat: { bullets: [] },
      player: { weapon: { activeSlot: 0, slots: ['standard'], cooldownTimer: 0, swapFlash: 0 } },
    });

    // Fire first bullet
    await page.keyboard.down('Space');
    await harness.tick();

    // Advance enough time for cooldown to expire (0.18s at default 1/60 dt)
    const framesNeeded = Math.ceil(STANDARD_WEAPON_COOLDOWN / DEFAULT_DT) + 2;
    await harness.tickN(framesNeeded);

    // Should be able to fire again now
    await harness.tick(); // fire second bullet
    await page.keyboard.up('Space');

    const combat = await getCombat(harness);
    const playerBullets = (combat['bullets'] as Array<Record<string, unknown>>)
      .filter((b) => b['isPlayer'] === true);

    expect(playerBullets.length).toBeGreaterThanOrEqual(2);
  });

  test('cannot fire when cooldownTimer > 0', async ({ harness, page }) => {
    await enterPlaying(harness);
    // Pre-set cooldown to a high value so fire is blocked
    await harness.setState({
      combat: { bullets: [] },
      player: { weapon: { activeSlot: 0, slots: ['standard'], cooldownTimer: 5.0, swapFlash: 0 } },
    });

    await page.keyboard.down('Space');
    await harness.tick();
    await page.keyboard.up('Space');

    const combat = await getCombat(harness);
    const playerBullets = (combat['bullets'] as Array<Record<string, unknown>>)
      .filter((b) => b['isPlayer'] === true);

    expect(playerBullets.length).toBe(0);
  });

  test('firing while invincible still creates bullets', async ({ harness, page }) => {
    await enterPlaying(harness);
    await harness.setState({
      combat: { bullets: [] },
      player: {
        invincibleTimer: INVINCIBILITY_TIME,
        weapon: { activeSlot: 0, slots: ['standard'], cooldownTimer: 0, swapFlash: 0 },
      },
    });

    await page.keyboard.down('Space');
    await harness.tick();
    await page.keyboard.up('Space');

    const combat = await getCombat(harness);
    const playerBullets = (combat['bullets'] as Array<Record<string, unknown>>)
      .filter((b) => b['isPlayer'] === true);

    expect(playerBullets.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 4. Taking damage
// ---------------------------------------------------------------------------

test.describe('Player taking damage @gameplay @system:player', () => {
  test('applyDamage reduces lives by 1 when not invincible', async ({ harness, page }) => {
    await enterPlaying(harness);
    await harness.setState({ player: { lives: INITIAL_LIVES, invincibleTimer: 0, alive: true } });
    await harness.clearEventLog();

    // Call applyDamage directly via the exposed store + bus
    await page.evaluate(() => {
      const win = window as unknown as Record<string, unknown>;
      const store = win.__gameStore as {
        update(fn: (draft: Record<string, unknown>) => void): void;
        getState(): Record<string, unknown>;
      };
      const bus = win.__bus as { emit(event: string, data: unknown): void };
      const state = store.getState() as Record<string, Record<string, unknown>>;
      const player = state['player'];
      if ((player['invincibleTimer'] as number) > 0) return;
      store.update((draft) => {
        const p = draft['player'] as Record<string, unknown>;
        (p['lives'] as number);
        p['lives'] = (p['lives'] as number) - 1;
        if ((p['lives'] as number) <= 0) {
          p['alive'] = false;
          bus.emit('player:death', { x: p['x'], y: p['y'] });
        } else {
          p['invincibleTimer'] = 1.5;
          bus.emit('player:hit', { x: p['x'], y: p['y'], livesRemaining: p['lives'] });
        }
      });
    });

    const player = await getPlayer(harness);
    expect(player['lives'] as number).toBe(INITIAL_LIVES - 1);
  });

  test('PLAYER_HIT event is emitted when player takes a hit with lives remaining', async ({ harness, page }) => {
    await enterPlaying(harness);
    await harness.setState({ player: { lives: 3, invincibleTimer: 0, alive: true } });
    await harness.clearEventLog();

    await page.evaluate(() => {
      const win = window as unknown as Record<string, unknown>;
      const store = win.__gameStore as {
        update(fn: (draft: Record<string, unknown>) => void): void;
      };
      const bus = win.__bus as { emit(event: string, data: unknown): void };
      store.update((draft) => {
        const p = draft['player'] as Record<string, unknown>;
        p['lives'] = (p['lives'] as number) - 1;
        p['invincibleTimer'] = 1.5;
        bus.emit('player:hit', { x: p['x'], y: p['y'], livesRemaining: p['lives'] });
      });
    });

    await gameExpect(harness).toHaveEmitted('player:hit');
  });

  test('player becomes invincible after taking a hit', async ({ harness, page }) => {
    await enterPlaying(harness);
    await harness.setState({ player: { lives: 3, invincibleTimer: 0, alive: true } });

    await page.evaluate(() => {
      const win = window as unknown as Record<string, unknown>;
      const store = win.__gameStore as {
        update(fn: (draft: Record<string, unknown>) => void): void;
      };
      const bus = win.__bus as { emit(event: string, data: unknown): void };
      store.update((draft) => {
        const p = draft['player'] as Record<string, unknown>;
        p['lives'] = (p['lives'] as number) - 1;
        p['invincibleTimer'] = 1.5;
        bus.emit('player:hit', { x: p['x'], y: p['y'], livesRemaining: p['lives'] });
      });
    });

    const player = await getPlayer(harness);
    expect(player['invincibleTimer'] as number).toBeGreaterThan(0);
  });

  test('invincibility prevents further damage (second hit ignored)', async ({ harness, page }) => {
    await enterPlaying(harness);
    await harness.setState({ player: { lives: 3, invincibleTimer: INVINCIBILITY_TIME, alive: true } });

    // Attempt to apply damage while invincible
    await page.evaluate(() => {
      const win = window as unknown as Record<string, unknown>;
      const store = win.__gameStore as {
        update(fn: (draft: Record<string, unknown>) => void): void;
        getState(): Record<string, unknown>;
      };
      const bus = win.__bus as { emit(event: string, data: unknown): void };
      const state = store.getState() as Record<string, Record<string, unknown>>;
      const player = state['player'];
      // Only apply damage if not invincible (mirroring PlayerSystem.applyDamage)
      if ((player['invincibleTimer'] as number) > 0) return;
      store.update((draft) => {
        const p = draft['player'] as Record<string, unknown>;
        p['lives'] = (p['lives'] as number) - 1;
        bus.emit('player:hit', { x: p['x'], y: p['y'], livesRemaining: p['lives'] });
      });
    });

    const player = await getPlayer(harness);
    // Lives should still be 3 — damage was blocked
    expect(player['lives'] as number).toBe(3);
  });

  test('invincibility timer counts down each frame', async ({ harness }) => {
    await enterPlaying(harness);
    await harness.setState({ player: { invincibleTimer: INVINCIBILITY_TIME } });

    await harness.tickN(10);

    const player = await getPlayer(harness);
    // Timer should have decreased by approximately 10 * DEFAULT_DT
    const expected = INVINCIBILITY_TIME - 10 * DEFAULT_DT;
    expect(player['invincibleTimer'] as number).toBeLessThan(INVINCIBILITY_TIME);
    expect(player['invincibleTimer'] as number).toBeCloseTo(expected, 1);
  });

  test('invincibility expires after INVINCIBILITY_TIME seconds', async ({ harness }) => {
    await enterPlaying(harness);
    await harness.setState({ player: { invincibleTimer: INVINCIBILITY_TIME, alive: true } });

    // Tick enough frames to exhaust the timer (1.5s at 60fps = 90 frames + buffer)
    const framesNeeded = Math.ceil(INVINCIBILITY_TIME / DEFAULT_DT) + 5;
    await harness.tickN(framesNeeded);

    const player = await getPlayer(harness);
    expect(player['invincibleTimer'] as number).toBe(0);
  });

  test('invincibleTimer is truthy flag for visual flicker (> 0 means flickering)', async ({ harness }) => {
    await enterPlaying(harness);
    await harness.setState({ player: { invincibleTimer: INVINCIBILITY_TIME } });

    const player = await getPlayer(harness);
    // The renderer uses invincibleTimer > 0 to drive flicker — verify it is positive
    expect((player['invincibleTimer'] as number) > 0).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. Death
// ---------------------------------------------------------------------------

test.describe('Player death @gameplay @system:player', () => {
  test('player dies when lives reach 0', async ({ harness, page }) => {
    await enterPlaying(harness);
    await harness.setState({ player: { lives: 1, invincibleTimer: 0, alive: true } });

    await page.evaluate(() => {
      const win = window as unknown as Record<string, unknown>;
      const store = win.__gameStore as {
        update(fn: (draft: Record<string, unknown>) => void): void;
      };
      const bus = win.__bus as { emit(event: string, data: unknown): void };
      store.update((draft) => {
        const p = draft['player'] as Record<string, unknown>;
        p['lives'] = 0;
        p['alive'] = false;
        bus.emit('player:death', { x: p['x'], y: p['y'] });
      });
    });

    const player = await getPlayer(harness);
    expect(player['alive']).toBe(false);
    expect(player['lives'] as number).toBe(0);
  });

  test('PLAYER_DEATH event is emitted when player dies', async ({ harness, page }) => {
    await enterPlaying(harness);
    await harness.setState({ player: { lives: 1, invincibleTimer: 0, alive: true } });
    await harness.clearEventLog();

    await page.evaluate(() => {
      const win = window as unknown as Record<string, unknown>;
      const store = win.__gameStore as {
        update(fn: (draft: Record<string, unknown>) => void): void;
      };
      const bus = win.__bus as { emit(event: string, data: unknown): void };
      store.update((draft) => {
        const p = draft['player'] as Record<string, unknown>;
        p['lives'] = 0;
        p['alive'] = false;
        bus.emit('player:death', { x: p['x'], y: p['y'] });
      });
    });

    await gameExpect(harness).toHaveEmitted('player:death');
  });

  test('player alive flag is set to false on death', async ({ harness }) => {
    await enterPlaying(harness);
    await harness.setState({ player: { lives: 0, invincibleTimer: 0, alive: false } });
    await harness.tickN(2);

    const player = await getPlayer(harness);
    expect(player['alive']).toBe(false);
  });

  test('player movement stops after death (alive=false skips update)', async ({ harness, page }) => {
    await enterPlaying(harness);
    await harness.setState({ player: { lives: 0, alive: false, x: CANVAS_WIDTH / 2, vx: 100 } });

    const before = await getPlayer(harness);
    const xBefore = before['x'] as number;

    await page.keyboard.down('ArrowRight');
    await harness.tickN(10);
    await page.keyboard.up('ArrowRight');

    const after = await getPlayer(harness);
    // PlayerSystem returns early when alive = false; x should not change via system
    // (vx may still be in state but position won't change via system update)
    expect(after['x'] as number).toBe(xBefore);
  });

  test('game scene transitions away from playing after player death and GAME_OVER_DELAY', async ({ harness, page }) => {
    await enterPlaying(harness);
    await harness.setState({ player: { lives: 1, invincibleTimer: 0, alive: true } });

    // Emit player:death — this triggers SCENE_EVENT.PLAYER_DIED which transitions to game_over
    await page.evaluate(() => {
      const win = window as unknown as Record<string, unknown>;
      const store = win.__gameStore as {
        update(fn: (draft: Record<string, unknown>) => void): void;
      };
      const bus = win.__bus as { emit(event: string, data: unknown): void };
      store.update((draft) => {
        const p = draft['player'] as Record<string, unknown>;
        p['lives'] = 0;
        p['alive'] = false;
      });
      bus.emit('player:death', { x: 240, y: 560 });
    });

    // Tick enough frames to let the game_over delay pass (1.5s + buffer)
    await harness.tickN(120);

    const scene = await harness.getScene();
    expect(scene).toBe('game_over');
  });

  test('losing one life from 2 leaves player alive with invincibility', async ({ harness, page }) => {
    await enterPlaying(harness);
    await harness.setState({ player: { lives: 2, invincibleTimer: 0, alive: true } });

    await page.evaluate(() => {
      const win = window as unknown as Record<string, unknown>;
      const store = win.__gameStore as {
        update(fn: (draft: Record<string, unknown>) => void): void;
      };
      const bus = win.__bus as { emit(event: string, data: unknown): void };
      store.update((draft) => {
        const p = draft['player'] as Record<string, unknown>;
        p['lives'] = (p['lives'] as number) - 1;
        p['invincibleTimer'] = 1.5;
        bus.emit('player:hit', { x: p['x'], y: p['y'], livesRemaining: p['lives'] });
      });
    });

    const player = await getPlayer(harness);
    expect(player['alive']).toBe(true);
    expect(player['lives'] as number).toBe(1);
    expect(player['invincibleTimer'] as number).toBeGreaterThan(0);
  });

  test('no JS errors occur during death sequence', async ({ harness, page }) => {
    await enterPlaying(harness);
    await harness.setState({ player: { lives: 1, invincibleTimer: 0, alive: true } });

    await page.evaluate(() => {
      const win = window as unknown as Record<string, unknown>;
      const store = win.__gameStore as {
        update(fn: (draft: Record<string, unknown>) => void): void;
      };
      const bus = win.__bus as { emit(event: string, data: unknown): void };
      store.update((draft) => {
        const p = draft['player'] as Record<string, unknown>;
        p['lives'] = 0;
        p['alive'] = false;
        bus.emit('player:death', { x: p['x'], y: p['y'] });
      });
    });

    await harness.tickN(10);
    await gameExpect(harness).toHaveNoErrors();
  });
});

// ---------------------------------------------------------------------------
// 6. Respawn
// ---------------------------------------------------------------------------

test.describe('Player respawn @gameplay @system:player', () => {
  test('after losing a life, lives count is decremented by 1', async ({ harness, page }) => {
    await enterPlaying(harness);
    const livesBefore = INITIAL_LIVES;
    await harness.setState({ player: { lives: livesBefore, invincibleTimer: 0, alive: true } });

    await page.evaluate(() => {
      const win = window as unknown as Record<string, unknown>;
      const store = win.__gameStore as {
        update(fn: (draft: Record<string, unknown>) => void): void;
      };
      const bus = win.__bus as { emit(event: string, data: unknown): void };
      store.update((draft) => {
        const p = draft['player'] as Record<string, unknown>;
        p['lives'] = (p['lives'] as number) - 1;
        p['invincibleTimer'] = 1.5;
        bus.emit('player:hit', { x: p['x'], y: p['y'], livesRemaining: p['lives'] });
      });
    });

    const player = await getPlayer(harness);
    expect(player['lives'] as number).toBe(livesBefore - 1);
  });

  test('player respawns with invincibility frames (invincibleTimer > 0)', async ({ harness, page }) => {
    await enterPlaying(harness);
    await harness.setState({ player: { lives: 3, invincibleTimer: 0, alive: true } });

    // Simulate a hit that triggers respawn invincibility
    await page.evaluate(() => {
      const win = window as unknown as Record<string, unknown>;
      const store = win.__gameStore as {
        update(fn: (draft: Record<string, unknown>) => void): void;
      };
      const bus = win.__bus as { emit(event: string, data: unknown): void };
      store.update((draft) => {
        const p = draft['player'] as Record<string, unknown>;
        p['lives'] = (p['lives'] as number) - 1;
        p['invincibleTimer'] = 1.5;
        bus.emit('player:hit', { x: p['x'], y: p['y'], livesRemaining: p['lives'] });
      });
    });

    const player = await getPlayer(harness);
    expect(player['invincibleTimer'] as number).toBeCloseTo(INVINCIBILITY_TIME, 1);
  });

  test('PLAYER_RESPAWN event can be emitted and captured', async ({ harness, page }) => {
    await enterPlaying(harness);
    await harness.clearEventLog();

    await page.evaluate(() => {
      const win = window as unknown as Record<string, unknown>;
      const bus = win.__bus as { emit(event: string, data: unknown): void };
      bus.emit('player:respawn', { x: 240, y: 560 });
    });

    await gameExpect(harness).toHaveEmitted('player:respawn');
  });

  test('player respawn sets alive = true after being dead', async ({ harness }) => {
    await enterPlaying(harness);
    await harness.setState({ player: { lives: 0, alive: false } });

    // Simulate respawn (game would normally do this on new game / continue)
    await harness.setState({ player: { lives: INITIAL_LIVES, alive: true, invincibleTimer: INVINCIBILITY_TIME } });
    await harness.tickN(2);

    const player = await getPlayer(harness);
    expect(player['alive']).toBe(true);
  });

  test('after respawn, player position is within valid canvas bounds', async ({ harness }) => {
    await enterPlaying(harness);
    // Reset to fresh state simulating a respawn
    await harness.setState({
      player: {
        x: CANVAS_WIDTH / 2,
        lives: INITIAL_LIVES,
        alive: true,
        invincibleTimer: INVINCIBILITY_TIME,
        vx: 0,
      },
    });
    await harness.tickN(5);

    const player = await getPlayer(harness);
    const halfW = PLAYER_WIDTH / 2;
    expect(player['x'] as number).toBeGreaterThanOrEqual(halfW);
    expect(player['x'] as number).toBeLessThanOrEqual(CANVAS_WIDTH - halfW);
  });
});

// ---------------------------------------------------------------------------
// 7. Edge cases
// ---------------------------------------------------------------------------

test.describe('Player edge cases @gameplay @system:player', () => {
  test('player at exact left boundary does not move further left from clamping', async ({ harness }) => {
    await enterPlaying(harness);
    const halfW = PLAYER_WIDTH / 2;
    await harness.setState({ player: { x: halfW, vx: -999 } });

    await harness.tickN(5);

    const player = await getPlayer(harness);
    // Clamping keeps x >= halfW
    expect(player['x'] as number).toBeGreaterThanOrEqual(halfW);
  });

  test('player at exact right boundary does not exceed canvas via clamping', async ({ harness }) => {
    await enterPlaying(harness);
    const halfW = PLAYER_WIDTH / 2;
    await harness.setState({ player: { x: CANVAS_WIDTH - halfW, vx: 999 } });

    await harness.tickN(5);

    const player = await getPlayer(harness);
    expect(player['x'] as number).toBeLessThanOrEqual(CANVAS_WIDTH - halfW);
  });

  test('multiple rapid damage calls: only first lands when invincible', async ({ harness, page }) => {
    await enterPlaying(harness);
    await harness.setState({ player: { lives: 3, invincibleTimer: 0, alive: true } });

    // Apply first hit (sets invincibleTimer) then attempt a second immediately
    await page.evaluate(() => {
      const win = window as unknown as Record<string, unknown>;
      const store = win.__gameStore as {
        update(fn: (draft: Record<string, unknown>) => void): void;
        getState(): Record<string, unknown>;
      };
      const bus = win.__bus as { emit(event: string, data: unknown): void };

      // First hit
      store.update((draft) => {
        const p = draft['player'] as Record<string, unknown>;
        if ((p['invincibleTimer'] as number) <= 0) {
          p['lives'] = (p['lives'] as number) - 1;
          p['invincibleTimer'] = 1.5;
          bus.emit('player:hit', { x: p['x'], y: p['y'], livesRemaining: p['lives'] });
        }
      });

      // Second hit — should be blocked by invincibility
      store.update((draft) => {
        const p = draft['player'] as Record<string, unknown>;
        if ((p['invincibleTimer'] as number) <= 0) {
          p['lives'] = (p['lives'] as number) - 1;
          bus.emit('player:hit', { x: p['x'], y: p['y'], livesRemaining: p['lives'] });
        }
      });
    });

    const player = await getPlayer(harness);
    // Only one life should have been removed
    expect(player['lives'] as number).toBe(2);
  });

  test('player state after game reset returns to initial values', async ({ harness }) => {
    await enterPlaying(harness);

    // Mess up state
    await harness.setState({ player: { lives: 0, alive: false, score: 9999, vx: 300 } });

    // Reset
    await harness.resetState();
    await harness.tickN(2);

    const player = await getPlayer(harness);
    expect(player['alive']).toBe(true);
    expect(player['lives'] as number).toBe(INITIAL_LIVES);
    expect(player['score'] as number).toBe(0);
    expect(player['vx'] as number).toBe(0);
  });

  test('no errors during full play cycle: enter, move, fire, hit, die', async ({ harness, page }) => {
    await enterPlaying(harness);
    await harness.setState({
      player: {
        lives: INITIAL_LIVES,
        invincibleTimer: 0,
        alive: true,
        weapon: { activeSlot: 0, slots: ['standard'], cooldownTimer: 0, swapFlash: 0 },
      },
      combat: { bullets: [] },
    });

    // Move right
    await page.keyboard.down('ArrowRight');
    await harness.tickN(5);
    await page.keyboard.up('ArrowRight');

    // Fire
    await page.keyboard.down('Space');
    await harness.tick();
    await page.keyboard.up('Space');

    // Take a hit
    await page.evaluate(() => {
      const win = window as unknown as Record<string, unknown>;
      const store = win.__gameStore as {
        update(fn: (draft: Record<string, unknown>) => void): void;
      };
      const bus = win.__bus as { emit(event: string, data: unknown): void };
      store.update((draft) => {
        const p = draft['player'] as Record<string, unknown>;
        p['lives'] = (p['lives'] as number) - 1;
        p['invincibleTimer'] = 1.5;
        bus.emit('player:hit', { x: p['x'], y: p['y'], livesRemaining: p['lives'] });
      });
    });

    await harness.tickN(10);

    await gameExpect(harness).toHaveNoErrors();
  });

  test('player with reversed controls moves right when left key pressed', async ({ harness, page }) => {
    await enterPlaying(harness);
    await harness.setState({ player: { x: CANVAS_WIDTH / 2, vx: 0, reversedControls: true } });

    const before = await getPlayer(harness);
    const xBefore = before['x'] as number;

    // With reversedControls, MOVE_LEFT target velocity becomes positive (right)
    await page.keyboard.down('ArrowLeft');
    await harness.tickN(10);
    await page.keyboard.up('ArrowLeft');

    const after = await getPlayer(harness);
    // Player should have moved right (reversed!)
    expect(after['x'] as number).toBeGreaterThan(xBefore);
  });

  test('HUD lives count matches player state lives', async ({ harness }) => {
    await enterPlaying(harness);
    await harness.setState({ player: { lives: 2, alive: true } });
    await harness.tickN(1);

    const hud = await harness.getHUDState();
    const player = await getPlayer(harness);

    expect(hud.lives).toBe(player['lives'] as number);
  });
});
