import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';


/** Clicks the header “Search BBC” control and waits for either navigation or the search overlay/input. */
export async function openSearch(page: Page): Promise<void> {
  const trigger = page
    .getByRole('link',   { name: /^search bbc$/i })
    .or(page.getByRole('button', { name: /search/i }))
    .first();

  await expect(trigger, 'Search trigger should be visible').toBeVisible();

  const navOrOverlay = Promise.race([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    page.waitForSelector('input[type="search"], [role="searchbox"], input[placeholder*="Search" i]'),
  ]).catch(() => null);

  await trigger.click();
  await navOrOverlay;
}

/** Robust locator for the search input (overlay or search page). */
export function getSearchBox(page: Page): Locator {
  return page
    .getByRole('searchbox')
    .or(page.getByPlaceholder(/search bbc|search/i))
    .or(page.locator('input[type="search"]'))
    .first();
}
