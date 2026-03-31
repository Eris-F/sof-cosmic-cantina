/**
 * Diagnostic capture utilities.
 * The main fixture auto-captures on failure, but these can be used
 * for mid-test snapshots or custom debugging.
 */
import type { Page, TestInfo } from '@playwright/test';

/** Capture full diagnostic snapshot and attach to test report. */
export async function captureDiagnostics(page: Page, testInfo: TestInfo, label = 'snapshot'): Promise<void> {
  try {
    const state = await page.evaluate(() =>
      JSON.stringify((window as any).__getState(), null, 2)
    );
    await testInfo.attach(`${label}-state`, { body: state, contentType: 'application/json' });
  } catch { /* page may be closed */ }

  try {
    const events = await page.evaluate(() =>
      JSON.stringify((window as any).__eventLog?.slice(-50))
    );
    await testInfo.attach(`${label}-events`, { body: events || '[]', contentType: 'application/json' });
  } catch { /* page may be closed */ }

  try {
    const screenshot = await page.screenshot();
    await testInfo.attach(`${label}-screenshot`, { body: screenshot, contentType: 'image/png' });
  } catch { /* page may be closed */ }
}

/** Log current state to console (for debugging during test development). */
export async function logState(page: Page): Promise<void> {
  const state = await page.evaluate(() => (window as any).__getState());
  console.log('Game State:', JSON.stringify(state, null, 2));
}

/** Log recent events to console. */
export async function logEvents(page: Page, count = 20): Promise<void> {
  const events = await page.evaluate((n) => (window as any).__eventLog?.slice(-n), count);
  console.log('Recent Events:', JSON.stringify(events, null, 2));
}
