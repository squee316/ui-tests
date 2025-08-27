import { test, expect } from '@playwright/test';
import {
  openSignIn,
  emailInput,
  passwordInput,
  //signInBtn,
  continueBtn,
  errorRegion,
} from '@utils';

const rx = {
  // "Something's missing. Please check and try again."
  missing:
    /Something(?:'|’|ʼ)s missing\s*\.\s*Please check and try again\./i,

  // "We don't recognise that email or username. You can try again or register for an account."
  notRecognised:
    /We don(?:'|’|ʼ)t recognise that email or username\.\s*You can try again or\s*register for an account\.?/i,

  // "Please enter your password" (be tolerant to wording)
  enterPassword: /enter.*password/i,

  // Username policy text split across multiple spans/lines.
  userOnlyIncludes: /Usernames can only include/i,
  userAllowedChars: /Letters, numbers and these characters:/i,

  // "Sorry, that email's too long. It can't be more than 101 characters."
  emailTooLong:
    /Sorry, that email(?:'|’|ʼ)s too long/i,
  maxLen101:
    /It can(?:'|’|ʼ)t be more than\s*101\s*characters\./i,
};

test.describe('Task3: negative login scenarios (two-step)', () => {
  test('empty email → error on first step', async ({ page }) => {
    const ctx = await openSignIn(page);

    await expect(emailInput(ctx), 'Email field should be visible').toBeVisible();
    await emailInput(ctx).fill('');
    await continueBtn(ctx).click();

    await expect(errorRegion(ctx), 'Error region should be shown').toBeVisible();
    await expect(errorRegion(ctx)).toHaveText(/Something's missing\s*\.\s*Please check and try again\./i);

    // Danger icon (svg) commonly rendered with data-testid
    await expect(ctx.getByTestId('message-danger-icon'))
      .toBeVisible();
  });

  test('malformed email → error on first step', async ({ page }) => {
    const ctx = await openSignIn(page);

    await emailInput(ctx).fill('not-an-email');
    await continueBtn(ctx).click();

    await expect(errorRegion(ctx)).toBeVisible();
    await expect(errorRegion(ctx), 'Unrecognised email/username copy should appear')
      .toHaveText(rx.notRecognised);
  });

  test('valid email + empty password → error on second step', async ({ page }) => {
    const ctx = await openSignIn(page);

    await emailInput(ctx).fill('someone@example.com');
    await continueBtn(ctx).click();

    await expect(passwordInput(ctx), 'Password field should be visible after step 1')
      .toBeVisible();
    await passwordInput(ctx).fill('');
    await continueBtn(ctx).click();

    await expect(errorRegion(ctx)).toBeVisible();
    await expect(errorRegion(ctx), 'Prompt to enter password should appear')
      .toContainText(rx.enterPassword);
  });

  test('SQL-ish email → blocked on first step', async ({ page }) => {
    const ctx = await openSignIn(page);

    await emailInput(ctx).fill(`' OR 1=1 --`);
    await continueBtn(ctx).click();

    await expect(errorRegion(ctx)).toBeVisible();
    await expect(errorRegion(ctx)).toContainText(rx.userOnlyIncludes);
    await expect(errorRegion(ctx)).toContainText(rx.userAllowedChars);

    // literal allowed characters snippet (note the escaped backtick)
    const allowedCharsLiteral = `?/|}{+=_-^~\`%$#`;
    await expect(errorRegion(ctx)).toContainText(allowedCharsLiteral);
  });

  test('very long email → error on first step', async ({ page }) => {
    const ctx = await openSignIn(page);

    await emailInput(ctx).fill('a'.repeat(255) + '@example.com');
    await continueBtn(ctx).click();

    await expect(errorRegion(ctx)).toBeVisible();
    await expect(errorRegion(ctx)).toContainText(rx.emailTooLong);
    await expect(errorRegion(ctx)).toContainText(rx.maxLen101);
    await expect(ctx.getByTestId('message-danger-icon')).toBeVisible();
  });
});
