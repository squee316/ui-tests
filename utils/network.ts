import type { Page } from '@playwright/test';

/**
 * A pragmatic "quiet network" helper:
 * - Waits DOMContentLoaded (fast), then
 * - Tries networkidle (best-effort), then
 * - Small idle buffer to settle.
 */
export async function waitForNetworkQuiet(
  page: Page,
  opts: { idleMs?: number; timeout?: number } = {}
): Promise<void> {
  const { idleMs = 800, timeout = 10_000 } = opts;
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await page.waitForLoadState('networkidle', { timeout }).catch(() => {});
  await page.waitForTimeout(idleMs);
}
