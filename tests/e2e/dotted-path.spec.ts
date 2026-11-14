import { expect, test } from '@playwright/test';

/*
 * A path with an extension used to skip the pre-render rewrite, so /nope.html
 * and /missing.png answered 200 with the home document: with JavaScript off the
 * visitor got the whole home page at a URL that does not exist. A dotted path
 * that is not a file in dist is a missing page like any other.
 */
for (const path of ['/nope.html', '/missing.png', '/work/nope.html']) {
  test(`${path} is a 404, not the home page`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(page.locator('main.notfound')).toBeVisible();
    await expect(page.locator('.name')).toHaveCount(0);
  });
}

/* A route is a directory in dist, and treating a directory as a file sent the
   case study to the SPA fallback: the home page's document at the study's URL,
   which cost the study its pre-render (LCP 1.88 s, perf 91). */
for (const path of ['/work/ticket-pipeline', '/work/rannaghor']) {
  test(`${path} still serves its own pre-rendered document`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('.study-title')).toBeVisible();
    await expect(page.locator('.name')).toHaveCount(0);
  });
}

test('a real file still serves as itself', async ({ page }) => {
  const response = await page.goto('/favicon.svg');
  expect(response?.status()).toBe(200);
  expect(response?.headers()['content-type']).toContain('svg');
});

test('a dotted path is a 404 without JavaScript too', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const response = await page.goto('/nope.html');
  expect(response?.status()).toBe(404);
  await expect(page.locator('main.notfound h1')).toHaveText('No such state');
  await context.close();
});
