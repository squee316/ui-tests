import type { Locator, Page } from '@playwright/test';

export async function acceptCookiesIfPresent(page: Page) {
const accept = page.locator(
    [
      'button:has-text("Accept additional cookies")',
      'button:has-text("Accept Additional Cookies")',
      'button:has-text("Accept additional")',
      '[aria-label*="Accept"][role="button"]'
    ].join(',')
  ).first();

  await accept.waitFor({ state: 'visible', timeout: 2000 }).catch(() => {});
  if (await accept.isVisible().catch(() => false)) {
    await accept.click().catch(() => {});
  }
}