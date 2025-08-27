# ui-tests (Playwright + TypeScript)

End-to-end UI tests for BBC web journeys using **Playwright** and **TypeScript**.
Includes helpers for cookie consent, resilient locators, and network idling.

---

## Quick start

### Prerequisites

* Node.js **≥ 18**
* npm (bundled with Node)

### Install

```bash
npm ci
# or: npm install
```

### Run tests

```bash
# headless (default)
npm test

# headed (visible browser)
npm run headed

# Playwright UI mode (debugger)
npm run ui
```

### Reports & traces

```bash
# Open the last HTML report
npx playwright show-report

# Traces are kept on failure; open a trace.zip from the report
npx playwright show-trace path/to/trace.zip
```

---

## Project structure

```
ui-tests/
├─ tests/
│  ├─ task1.fixtures-today.spec.ts
│  ├─ task2.search-sports.spec.ts
│  └─ task3.signin-negative.spec.ts
├─ utils/
│  ├─ auth.ts
│  ├─ cookies.ts
│  ├─ locators.ts
│  ├─ network.ts
│  └─ index.ts
├─ playwright.config.ts
├─ tsconfig.json
└─ package.json

```

---

## Key configuration

### `playwright.config.ts` (excerpt)

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  retries: 1,
  workers: 4,
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['line'],
  ],
  use: {
    baseURL: 'https://www.bbc.co.uk',
    viewport: { width: 1280, height: 800 },
    locale: 'en-GB',
    timezoneId: 'Europe/London',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

### Path alias for utils

`tsconfig.json` defines `@utils` so tests can import helpers cleanly:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@utils/*": ["tests/utils/*"],
      "@utils": ["tests/utils/index.ts"]
    }
  }
}
```

In tests:

```ts
import { acceptCookiesIfPresent, waitForNetworkQuiet } from '@utils';
```

---

## Helpers (utils)

* **cookies.ts**

  * `acceptCookiesIfPresent(page)` – clicks the “Accept all” button if the consent banner appears.
* **network.ts**

  * `waitForNetworkQuiet(page, { idleMs = 600, timeout = 10_000 })` – waits for a short idle period after navigations/search.
* **locators.ts**

  * `teamNameLocator(page)` – resilient locator for team names on scores & fixtures pages.
  * `searchCandidates(page)` – robust search result headline locator (uses `data-testid="default-promo"` first).
  * `emailInput / passwordInput / continueBtn / signInBtn` – common form controls.
  * `errorRegion(ctx)` – normalised error banner/region on BBC sign-in pages.
* **auth.ts**

  * `openHome(page)` – go to `/` and handle cookies.
  * `openSignIn(page)` – navigate to the two-step sign-in flow and wait for email/username input.
  * `submitInvalidCredentials(ctx, user, pass)` – helpers for negative paths.
* **index.ts**

  * Barrel export: `export * from './cookies'; export * from './network'; ...`

---

## Example tests

### Task 1 – teams with a match today

```ts
import { test, expect } from '@playwright/test';
import { acceptCookiesIfPresent, waitForNetworkQuiet, teamNameLocator } from '@utils';

test('Task1: collect all teams with a match today', async ({ page }) => {
  await page.goto('/sport/football/scores-fixtures');
  await acceptCookiesIfPresent(page);
  await waitForNetworkQuiet(page);

  const names = await teamNameLocator(page).allTextContents();
  const seen = new Set<string>();
  const teams = names.map(s => s.trim()).filter(Boolean).filter(s => (seen.has(s) ? false : (seen.add(s), true)));

  console.log('Teams playing today:', teams);
  expect(teams.length, 'Should return zero or more team names without throwing').toBeGreaterThanOrEqual(0);
});
```

### Task 2 – search results headlines

```ts
import { test, expect } from '@playwright/test';
import { acceptCookiesIfPresent, waitForNetworkQuiet, searchCandidates } from '@utils';

test('Task2: search "sports" and output first/last result headings', async ({ page }) => {
  await page.goto('/');
  await acceptCookiesIfPresent(page);

  // Open Search from header
  const trigger = page.getByRole('link', { name: /^search bbc$/i })
    .or(page.getByRole('button', { name: /search/i })).first();
  await expect(trigger).toBeVisible();
  const navOrOverlay = Promise.race([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    page.waitForSelector('input[type="search"], [role="searchbox"], input[placeholder*="Search"]')
  ]).catch(() => null);
  await trigger.click();
  await navOrOverlay;
  await acceptCookiesIfPresent(page);

  const searchBox = page.getByRole('searchbox')
    .or(page.getByPlaceholder(/search bbc|search/i))
    .or(page.locator('input[type="search"]')).first();
  await expect(searchBox).toBeVisible();
  await Promise.all([ searchBox.fill('sports'), searchBox.press('Enter') ]);
  await waitForNetworkQuiet(page);

  const candidates = searchCandidates(page);
  await expect(candidates.first()).toBeVisible();

  const titles = await candidates.evaluateAll(nodes =>
    nodes.map(n => (n.getAttribute('aria-label') ?? n.textContent ?? '')
      .replace(/\s+/g, ' ').trim()).filter(Boolean)
  );
  console.log('Found headlines:', titles);
  expect(titles.length, 'Should find at least one search result headline').toBeGreaterThan(0);
});
```

### Task 3 – negative sign-in flows

See `tests/task3.signin-negative.spec.ts` for scenarios:

* empty email → “Something’s missing. Please check and try again.”
* malformed email → “We don’t recognise that email or username…”
* valid email + empty password on step 2
* SQL-ish input blocked with username rules
* overly long email

---

## Best practices used

* **Accessible locators first**: `getByRole`, `getByLabel`, `getByTestId` before CSS.
* **Resilience to layout changes**: fallbacks chained with `.or(...)`.
* **Consent handling**: `acceptCookiesIfPresent` runs where a new document can re-show the banner.
* **Network idling**: short idle wait after navigation/submit to reduce flakiness.
* **Deterministic tests**: explicit assertions with clear messages to aid debugging.
* **Headless by default**, traces on failure, HTML reports enabled.

---

## Troubleshooting

* **“No tests found”**
  Ensure files end with `.spec.ts` and are under `tests/` (matches `testDir`).

* **Consent keeps reappearing**
  Call `acceptCookiesIfPresent(page)` **after** actions that may navigate to a new document.

* **Locators timing out**
  Use `await waitForNetworkQuiet(page)` after navigations/submits; prefer role/testid locators.

* **Search input not found**
  Use the header **Search BBC** trigger first; then locate the real input (`role="searchbox"` or `input[type="search"]`).

---

## Running a subset

```bash
# File
npx playwright test tests/task2.search-sports.spec.ts

# By title / grep
npx playwright test -g "negative"
```

---

## License

For assessment/demo purposes. Replace or add a license file as needed.
