import type { Page } from '@playwright/test';
import { acceptCookiesIfPresent } from './cookies.js';
import { emailInput, passwordInput } from './locators.js';

/** Go to site root and handle cookies. */
export async function openHome(page: Page): Promise<void> {
  await page.goto('/'); // uses baseURL from playwright.config.ts
  await acceptCookiesIfPresent(page);
}

/**
 * Open the BBC sign-in flow.
 * Clicks a "Sign in" trigger and waits until the first-step form is ready.
 * No popup handling (faster).
 */
export async function openSignIn(page: Page): Promise<Page> {
  await openHome(page);

  const trigger = page
    .getByRole('link', { name: /sign in/i }).first()
    .or(page.getByRole('button', { name: /sign in/i }).first());

  // Click and wait for either a navigation or the form showing up on the same page
  const formReady = Promise.race([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    page.waitForSelector('#user-identifier-input, input[name="username"], input[type="email"], [aria-label*="email" i]')
  ]).catch(() => null);

  await trigger.click();
  await formReady;

  // If we navigated, consent may reappear
  await acceptCookiesIfPresent(page);

  // Ensure the identifier field is present
  await page.waitForSelector(
    '#user-identifier-input, input[name="username"], input[type="email"], [aria-label*="email" i]',
    { timeout: 5000 }
  );

  return page;
}

/**
 * Fill invalid credentials.
 * - Always fills the first-step email/username and submits.
 * - If `password` is provided, fill second step and submit too.
 */
export async function submitInvalidCredentials(
  ctx: Page,
  username: string,
  password?: string
): Promise<void> {
  await emailInput(ctx).first().fill(username);

  // First step submit
  const firstSubmit =
    ctx.getByRole('button', { name: /continue|next|sign in/i }).first()
      .or(ctx.locator('button[type="submit"]').first());
  await firstSubmit.click();

  if (password !== undefined) {
    await passwordInput(ctx).first().fill(password);
    const secondSubmit =
      ctx.getByRole('button', { name: /sign in|continue|submit/i }).first()
        .or(ctx.locator('button[type="submit"]').first());
    await secondSubmit.click();
  }
}
