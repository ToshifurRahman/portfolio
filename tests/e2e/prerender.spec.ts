import { expect, test, type Page } from '@playwright/test';

/*
 * The build pre-renders documents and the client hydrates them. That is only
 * safe while the document a visitor receives is the one the client would
 * render: hydrate the home page's markup while React renders <NotFound /> and
 * React throws (error #418), and a visitor without JavaScript never sees the
 * 404 at all. These tests cover both halves, and then watch the console on
 * every route so a future mismatch cannot come back unnoticed.
 */

/* The browser logs a "404 (Not Found)" line for the document itself on a
   genuinely missing address. That is the honest status, not a page fault, so
   it is the one line filtered out; everything else counts. */
const expected404 = /Failed to load resource: the server responded with a status of 404/;

const collect = (page: Page) => {
  const problems: string[] = [];
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    const type = message.type();
    if (type !== 'error' && type !== 'warning') return;
    if (expected404.test(message.text())) return;
    problems.push(`${type}: ${message.text()}`);
  });
  return problems;
};

const notFound = (page: Page) => page.locator('main.notfound');

test.describe('unknown path', () => {
  test('shows the not-found page, with no React error', async ({ page }) => {
    const problems = collect(page);
    const response = await page.goto('/unknown-404-page');
    await expect(notFound(page)).toBeVisible();
    await expect(page.locator('main.notfound h1')).toHaveText('Page not found');
    /* The response says 404, not 200 with the home page. */
    expect(response?.status()).toBe(404);
    await page.waitForTimeout(300);
    expect(problems).toEqual([]);
  });

  test('serves a nested unknown path too', async ({ page }) => {
    const problems = collect(page);
    const response = await page.goto('/work/no-such-study');
    await expect(notFound(page)).toBeVisible();
    expect(response?.status()).toBe(404);
    await page.waitForTimeout(300);
    expect(problems).toEqual([]);
  });
});

test.describe('unknown case study', () => {
  test('keeps the not-found title in the tab', async ({ page }) => {
    /* CaseStudyPage called useTitle(undefined) before returning <NotFound />,
       and the parent effect ran after the child's, so the tab reset to the
       home title while the page said "No such state". */
    const problems = collect(page);
    await page.goto('/work/unknown-slug');
    await expect(notFound(page)).toBeVisible();
    await expect(page).toHaveTitle('Page not found · Toshifur Rahman');
    await page.waitForTimeout(400);
    await expect(page).toHaveTitle('Page not found · Toshifur Rahman');
    expect(problems).toEqual([]);
  });

  test('keeps it after hydration too', async ({ page }) => {
    await page.goto('/work/unknown-slug');
    await page.waitForFunction(() => document.readyState === 'complete');
    await page.waitForTimeout(500);
    await expect(page).toHaveTitle('Page not found · Toshifur Rahman');
  });
});

test.describe('unknown path without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('still shows the not-found page', async ({ page }) => {
    await page.goto('/unknown-404-page');
    await expect(notFound(page)).toBeVisible();
    await expect(page.locator('main.notfound h1')).toHaveText('Page not found');
    /* And not the home page's name. */
    await expect(page.locator('.name')).toHaveCount(0);
  });
});

/* A document served at its own file path must show its own page. The build
   writes real files, so `vite preview` serves /work/relay/index.html
   as itself; the route stamp says /work/relay, the address said
   .../index.html, the client saw no match and rendered <NotFound /> over the
   home document. A crawler linking the file path got a soft 404 (200 with the
   not-found page) for a page that exists. */
test.describe('a document at its own file path', () => {
  const pages = [
    { file: '/index.html', heading: '.name', name: 'home' },
    { file: '/work/relay/index.html', heading: '.study-title', name: 'relay' },
    { file: '/work/rannaghor/index.html', heading: '.study-title', name: 'rannaghor' },
  ];

  for (const { file, heading, name } of pages) {
    test(`${file} renders the ${name} page, not "Page not found"`, async ({ page }) => {
      const problems = collect(page);
      const response = await page.goto(file);
      expect(response?.status()).toBe(200);
      await expect(page.locator(heading)).toBeVisible();
      await expect(page.locator('main.notfound')).toHaveCount(0);
      await page.waitForTimeout(400);
      expect(problems).toEqual([]);
    });
  }
});

/* The pre-paint script sets data-theme from storage before the app runs, and
   the toggle's icon is chosen by CSS from that same attribute, so a stored
   light theme shows the moon (the way back to dark) with no hydration error. */
test.describe('theme toggle after reload', () => {
  for (const path of ['/', '/work/relay']) {
    test(`shows the light theme's icon on ${path} when light is stored`, async ({ page }) => {
      const problems = collect(page);
      await page.addInitScript(() => localStorage.setItem('theme', 'light'));
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
      await expect(page.locator('.theme-toggle .icon-moon')).toBeVisible();
      await expect(page.locator('.theme-toggle .icon-sun')).toBeHidden();
      await page.waitForTimeout(300);
      expect(problems).toEqual([]);
    });
  }
});

test.describe('no console error on any route', () => {
  for (const theme of ['dark', 'light'] as const) {
    for (const path of ['/', '/work/relay', '/work/rannaghor', '/unknown-404-page']) {
      test(`${path} ${theme}`, async ({ page }) => {
        const problems = collect(page);
        await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
        await page.goto(path);
        await expect(page.locator('main#main')).toBeVisible();
        await page.waitForTimeout(400);
        expect(problems).toEqual([]);
      });
    }
  }
});
