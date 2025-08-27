import { test, expect } from '@playwright/test';
import {
  acceptCookiesIfPresent,
  waitForNetworkQuiet,
  searchCandidates,   // from locators.ts
  openSearch,         // from search.ts
  getSearchBox,       // from search.ts
} from '@utils';

test('Task2: search "sports" and output first/last result headings', async ({ page }) => {
  // 1) Go to homepage & handle consent
  await page.goto('/');
  await acceptCookiesIfPresent(page);

  // 2) Open Search (link/button named "Search BBC"), wait for overlay or navigation
  await openSearch(page);

  // If a new document loaded, consent may reappear
  await acceptCookiesIfPresent(page);

  // 3) Locate the real search input (after trigger)
  const searchBox = getSearchBox(page);
  await expect(searchBox, 'Search input should be visible').toBeVisible();

  // 4) Perform search
  await searchBox.fill('sports');
  await Promise.all([
    searchBox.press('Enter'),
    page.waitForNavigation({ waitUntil: 'domcontentloaded' })
      .catch(() => page.waitForLoadState('domcontentloaded')),
  ]);
  await waitForNetworkQuiet(page);

  // 5) Collect headings using centralized selector logic
  const candidates = searchCandidates(page);
  await expect(candidates.first(), 'At least one result card should be visible')
    .toBeVisible({ timeout: 10_000 });

  const titles = await candidates.evaluateAll(nodes =>
    nodes
      .map(n => (n.getAttribute('aria-label') ?? n.textContent ?? '')
        .replace(/\s+/g, ' ')
        .trim())
      .filter(Boolean)
  );

  // De-dupe while preserving order
  const seen = new Set<string>();
  const uniqueTitles = titles.filter(t => (seen.has(t) ? false : (seen.add(t), true)));

  console.log('Found headlines:', uniqueTitles);
  expect(uniqueTitles.length, 'Should find at least one search result headline').toBeGreaterThan(0);

  // Optional: also log first/last plainly
  const texts = (await candidates.allTextContents()).map(t => t.trim()).filter(Boolean);
  if (texts.length >= 1) {
    console.log('First heading:', texts[0]);
    console.log('Last heading:', texts[texts.length - 1]);
  } else {
    console.log('No search results found.');
  }

  expect(texts.length, 'Text contents list should not be empty').toBeGreaterThan(0);
});
