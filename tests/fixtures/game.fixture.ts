/**
 * Shared Playwright fixture — provides a GameHarness to every test.
 *
 * Usage in test files:
 *   import { test, expect } from '../fixtures/game.fixture';
 */
import { test as base, expect as baseExpect } from '@playwright/test';
import type { Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Zone {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface HUDState {
  score: number;
  health: number;
  lives: number;
  wave: number;
  coins: number;
}

export interface EventEntry {
  event: string;
  data: unknown;
  time: number;
  frame: number;
}

export interface InputEntry {
  type: string;
  code?: string;
  x?: number;
  y?: number;
}

export interface Viewport {
  originX: number;
  originY: number;
  logicalWidth: number;
  logicalHeight: number;
  cssWidth: number;
  cssHeight: number;
}

// ---------------------------------------------------------------------------
// GameHarness — typed wrapper around window.__ harness APIs
// ---------------------------------------------------------------------------

/** Typed wrapper around window.__ harness APIs. */
export class GameHarness {
  constructor(readonly page: Page) {}

  // -- State --

  async getState(): Promise<Record<string, unknown>> {
    return this.page.evaluate(
      () => ((window as unknown as Record<string, unknown>).__getState as () => Record<string, unknown>)(),
    );
  }

  async setState(partial: Record<string, unknown>): Promise<void> {
    await this.page.evaluate(
      (p) => ((window as unknown as Record<string, unknown>).__setState as (p: Record<string, unknown>) => void)(p),
      partial,
    );
  }

  async resetState(): Promise<void> {
    await this.page.evaluate(
      () => ((window as unknown as Record<string, unknown>).__resetState as () => void)(),
    );
  }

  // -- Scene --

  async getScene(): Promise<string> {
    const state = await this.getState();
    return state['scene'] as string;
  }

  async setScene(sceneId: string): Promise<void> {
    await this.page.evaluate(
      (id) => ((window as unknown as Record<string, unknown>).__setScene as (id: string) => void)(id),
      sceneId,
    );
  }

  // -- Time control --

  async tick(dt?: number): Promise<void> {
    await this.page.evaluate(
      (d) => ((window as unknown as Record<string, unknown>).__tick as (d?: number) => void)(d),
      dt,
    );
  }

  async tickN(n: number, dt?: number): Promise<void> {
    await this.page.evaluate(
      ({ n, dt }) => ((window as unknown as Record<string, unknown>).__tickN as (n: number, dt?: number) => void)(n, dt),
      { n, dt },
    );
  }

  async tickSeconds(seconds: number): Promise<void> {
    await this.page.evaluate(
      (s) => ((window as unknown as Record<string, unknown>).__tickSeconds as (s: number) => void)(s),
      seconds,
    );
  }

  /**
   * Tick until a condition expressed as a JS expression string returns truthy.
   * The expression runs inside the browser and receives no arguments.
   *
   * @param predicate - JS expression, e.g. `"() => window.__getState().scene === 'game'"`
   * @param maxFrames - safety ceiling (default: harness default)
   * @returns number of frames ticked
   */
  async tickUntil(predicate: string, maxFrames?: number): Promise<number> {
    return this.page.evaluate(
      ({ pred, max }) =>
        (
          (window as unknown as Record<string, unknown>).__tickUntil as (
            fn: () => boolean,
            max?: number,
          ) => number
        )(new Function(`return ${pred}`) as () => boolean, max),
      { pred: predicate, max: maxFrames },
    );
  }

  async pause(): Promise<void> {
    await this.page.evaluate(
      () => ((window as unknown as Record<string, unknown>).__pause as () => void)(),
    );
  }

  async resume(): Promise<void> {
    await this.page.evaluate(
      () => ((window as unknown as Record<string, unknown>).__resume as () => void)(),
    );
  }

  // -- RNG --

  async seed(n: number): Promise<void> {
    await this.page.evaluate(
      (s) => ((window as unknown as Record<string, unknown>).__seed as (s: number) => void)(s),
      n,
    );
  }

  async unseed(): Promise<void> {
    await this.page.evaluate(
      () => ((window as unknown as Record<string, unknown>).__unseed as () => void)(),
    );
  }

  // -- Zones --

  async getZones(): Promise<Zone[]> {
    return this.page.evaluate(
      () => ((window as unknown as Record<string, unknown>).__getZones as () => Zone[])(),
    );
  }

  async getZone(name: string): Promise<Zone | null> {
    return this.page.evaluate(
      (n) => ((window as unknown as Record<string, unknown>).__getZone as (n: string) => Zone | null)(n),
      name,
    );
  }

  /**
   * Tap the centre of a named zone, translating logical game coords to page
   * coords via the viewport metadata exposed by the harness.
   */
  async tapZone(zoneName: string): Promise<void> {
    const zone = await this.getZone(zoneName);
    if (zone === null) throw new Error(`Zone "${zoneName}" not found`);

    const cx = zone.x + zone.w / 2;
    const cy = zone.y + zone.h / 2;

    const viewport = await this.page.evaluate(
      () => ((window as unknown as Record<string, unknown>).__getViewport as () => Viewport)(),
    );

    const pageX = viewport.originX + (cx / viewport.logicalWidth) * viewport.cssWidth;
    const pageY = viewport.originY + (cy / viewport.logicalHeight) * viewport.cssHeight;

    await this.page.touchscreen.tap(pageX, pageY);
  }

  // -- Events --

  async getEvents(type?: string): Promise<EventEntry[]> {
    return this.page.evaluate(
      (t) =>
        (
          (window as unknown as Record<string, unknown>).__getEvents as (
            t?: string,
          ) => EventEntry[]
        )(t),
      type,
    );
  }

  async clearEventLog(): Promise<void> {
    await this.page.evaluate(
      () => ((window as unknown as Record<string, unknown>).__clearEventLog as () => void)(),
    );
  }

  async waitForEvent(type: string, timeoutMs = 5_000): Promise<unknown> {
    return this.page.evaluate(
      ({ t, ms }) =>
        (
          (window as unknown as Record<string, unknown>).__waitForEvent as (
            t: string,
            ms: number,
          ) => Promise<unknown>
        )(t, ms),
      { t: type, ms: timeoutMs },
    );
  }

  async waitForScene(sceneId: string, timeoutMs = 5_000): Promise<void> {
    await this.page.evaluate(
      ({ id, ms }) =>
        (
          (window as unknown as Record<string, unknown>).__waitForScene as (
            id: string,
            ms: number,
          ) => Promise<void>
        )(id, ms),
      { id: sceneId, ms: timeoutMs },
    );
  }

  // -- Entities --

  async getEntityCount(type?: string): Promise<number> {
    return this.page.evaluate(
      (t) =>
        (
          (window as unknown as Record<string, unknown>).__getEntityCount as (
            t?: string,
          ) => number
        )(t),
      type,
    );
  }

  // -- HUD --

  async getHUDState(): Promise<HUDState> {
    return this.page.evaluate(
      () => ((window as unknown as Record<string, unknown>).__getHUDState as () => HUDState)(),
    );
  }

  async getParticleCount(): Promise<number> {
    return this.page.evaluate(
      () => ((window as unknown as Record<string, unknown>).__getParticleCount as () => number)(),
    );
  }

  // -- Economy shortcuts --

  async getCoins(): Promise<number> {
    const hud = await this.getHUDState();
    return hud.coins;
  }

  async setCoins(amount: number): Promise<void> {
    await this.page.evaluate((a) => {
      const win = window as unknown as Record<string, unknown>;
      const getState = win.__getState as () => Record<string, Record<string, unknown>>;
      const setState = win.__setState as (p: Record<string, unknown>) => void;
      const state = getState();
      setState({
        economy: {
          ...state['economy'],
          wallet: {
            ...(state['economy']?.['wallet'] as Record<string, unknown> | undefined),
            coins: a,
          },
        },
      });
    }, amount);
  }

  // -- Health / Lives shortcuts --

  async getHealth(): Promise<number> {
    const hud = await this.getHUDState();
    return hud.health;
  }

  async getLives(): Promise<number> {
    const hud = await this.getHUDState();
    return hud.lives;
  }

  // -- Score shortcut --

  async getScore(): Promise<number> {
    const hud = await this.getHUDState();
    return hud.score;
  }

  // -- Frame counter --

  async getFrame(): Promise<number> {
    return this.page.evaluate(
      () => (window as unknown as Record<string, unknown>).__frame as number,
    );
  }

  // -- Error collector --

  async getErrors(): Promise<string[]> {
    return this.page.evaluate(
      () => (window as unknown as Record<string, unknown>).__errors as string[],
    );
  }

  // -- Input log --

  async getInputLog(): Promise<InputEntry[]> {
    return this.page.evaluate(
      () => (window as unknown as Record<string, unknown>).__inputLog as InputEntry[],
    );
  }

  async clearInputLog(): Promise<void> {
    await this.page.evaluate(
      () => ((window as unknown as Record<string, unknown>).__clearInputLog as () => void)(),
    );
  }

  // -- Listener audit --

  async getListenerCount(event?: string): Promise<number> {
    return this.page.evaluate(
      (e) =>
        (
          (window as unknown as Record<string, unknown>).__getListenerCount as (
            e?: string,
          ) => number
        )(e),
      event,
    );
  }

  // -- Viewport --

  async getViewport(): Promise<Viewport> {
    return this.page.evaluate(
      () => ((window as unknown as Record<string, unknown>).__getViewport as () => Viewport)(),
    );
  }
}

// ---------------------------------------------------------------------------
// Fixture definition
// ---------------------------------------------------------------------------

/**
 * Extended test fixture that provides `harness` to every test.
 *
 * - Auto-navigates to `/` and waits for the game harness to be installed.
 * - Pauses the game loop for deterministic frame-by-frame control.
 * - Seeds the RNG to 12345 for reproducibility.
 * - Clears event and input logs so each test starts clean.
 * - On failure, attaches game-state, last-50-events, last-20-inputs, and a
 *   canvas screenshot to the Playwright report.
 */
export const test = base.extend<{ harness: GameHarness }>({
  harness: async ({ page }, use, testInfo) => {
    await page.goto('/');

    // Wait for the test harness to be installed by the game boot sequence.
    await page.waitForFunction(
      () => typeof (window as unknown as Record<string, unknown>).__gameStore !== 'undefined',
      null,
      { timeout: 10_000 },
    );

    const harness = new GameHarness(page);

    // Deterministic baseline before each test.
    await harness.pause();
    await harness.seed(12345);
    await harness.clearEventLog();
    await harness.clearInputLog();

    await use(harness);

    // -- Diagnostic auto-capture on failure --
    if (testInfo.status !== testInfo.expectedStatus) {
      await _attachJson(page, testInfo, 'game-state', () => {
        const win = window as unknown as Record<string, unknown>;
        const fn = win['__getState'] as (() => unknown) | undefined;
        return JSON.stringify(fn ? fn() : {}, null, 2);
      });

      await _attachJson(page, testInfo, 'last-50-events', () =>
        JSON.stringify(
          ((window as unknown as Record<string, unknown>).__eventLog as unknown[] | undefined)?.slice(-50) ?? [],
        ),
      );

      await _attachJson(page, testInfo, 'last-20-inputs', () =>
        JSON.stringify(
          ((window as unknown as Record<string, unknown>).__inputLog as unknown[] | undefined)?.slice(-20) ?? [],
        ),
      );

      try {
        const screenshot = await page.screenshot();
        await testInfo.attach('canvas-screenshot', {
          body: screenshot,
          contentType: 'image/png',
        });
      } catch {
        // Page may be closed — swallow silently.
      }
    }
  },
});

/** Helper: evaluate a serialising expression in the page and attach the result. */
async function _attachJson(
  page: Page,
  testInfo: { attach(name: string, opts: { body: string; contentType: string }): Promise<void> },
  name: string,
  expr: () => string,
): Promise<void> {
  try {
    const body = await page.evaluate(expr);
    await testInfo.attach(name, { body: body ?? '{}', contentType: 'application/json' });
  } catch {
    // Page may be closed — swallow silently.
  }
}

export { baseExpect as expect };
