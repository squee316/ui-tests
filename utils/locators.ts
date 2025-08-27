// tests/utils/locators.ts
import type { Page, Locator } from '@playwright/test';

/**
 * Team name elements on BBC fixtures pages.
 * NOTE: no regex inside CSS selectors; we filter by text afterwards.
 */
export function teamNameLocator(page: Page): Locator {
  const base = page.locator(
    [
 '[class*="TeamNameWrapper"] span:not([aria-hidden="true"])',
 '[class*="MatchProgressContainer"] span:not([aria-hidden="true"])'
    ].join(',')
  );

  // Keep only items that actually contain letters (avoid scores, badges, etc.)
  return base.filter({ hasText: /[A-Za-z]/ });
}

/** Error region on BBC sign-in forms and similar pages. */
export function errorRegion(ctx: Page | Locator): Locator {
  const scope = ctx as any;

  // Prefer the ARIA alert; fall back to known IDs/classes used by the form.
  const byRole = scope.getByRole('alert').first();
  const byIdsOrClasses = scope
    .locator('#form-message-username, #form-message-password, #form-message-general, .form-message__text, .error-text')
    .first();

  return byRole.or(byIdsOrClasses);
}


/** Email/username input (BBC: #user-identifier-input) with safe fallbacks. */
export function emailInput(ctx: Page | Locator): Locator {
  return (ctx as any).locator(
    [
      '#user-identifier-input',
      'input[name="username"]',
      'input[type="email"]',
      'input[autocomplete="username"]',
      'input[aria-label*="email" i]'
    ].join(',')
  );
}

/** Password input (BBC: #password-input) with safe fallbacks. */
export function passwordInput(ctx: Page | Locator): Locator {
  return (ctx as any).locator(
    [
      '#password-input',
      'input[name="password"]',
      'input[type="password"]',
      'input[autocomplete="current-password"]'
    ].join(',')
  );
}

/**
 * Search result headline candidates for BBC search pages.
 * Targets the promo card + headline paragraph, with sensible fallbacks.
 */
export function searchCandidates(page: Page): Locator {
  return page
    .getByTestId('default-promo')
    .locator('[class*="PromoHeadline"], a[aria-label], h1, h2, h3');
}

// Both Page and Locator expose these methods, so we can use a structural type.
type Queryable = Pick<Page,
  'locator' | 'getByRole' | 'getByText' | 'getByLabel' | 'getByPlaceholder'
>;

/** Heuristic "Continue/Next/Sign in" primary CTA finder, scoped to a Page or Locator. */
export function continueBtn(ctx: Queryable): Locator {
  // 1) Prefer accessible roles & names (most stable)
  const byRole = ctx
    .getByRole('button', { name: /^(continue|next|sign in|log in)$/i })
    .or(ctx.getByRole('link',   { name: /^(continue|next)$/i }));

  // 2) Common testid/aria/title patterns
  const byAttrs = ctx.locator([
    '[data-testid*="continue" i]',
    '[data-test*="continue" i]',
    '[aria-label*="continue" i]',
    '[title*="continue" i]',
  ].join(','));

  // 3) Typical submit controls (last resort)
  const byCss = ctx.locator([
    'button[type="submit"]',
    'input[type="submit"]',
    '#submit',
    '#submit-button',
    'input[name="continue"]',
    'input[type="continue"]',
  ].join(','));

  // Return the first match among robust -> permissive fallbacks.
  return byRole.or(byAttrs).or(byCss).first();
}