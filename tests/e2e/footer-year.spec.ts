import { expect, test, type Page } from '@playwright/test';

/*
 * The build bakes the footer's year into every pre-rendered document. If the
 * client computes it from the clock instead, a build served after 1 January
 * hydrates a different year and React throws #418 on every page - the whole
 * pre-render is thrown away and replaced. The clock is moved to next year here
 * so the mismatch would show up today rather than in January.
 */
const nextYear = new Date().getFullYear() + 1;

/* The browser logs the document's own 404 status on a missing address; that
   is the honest status, not a page fault, so it is the one line filtered. */
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

for (const path of ['/', '/work/ticket-pipeline', '/work/rannaghor', '/unknown-404-page']) {
  test(`the footer year survives a clock past New Year on ${path}`, async ({ page }) => {
    const problems = collect(page);
    await page.clock.install({ time: new Date(`${nextYear}-02-01T12:00:00Z`) });
    await page.goto(path);
    await expect(page.locator('footer.footer')).toBeVisible();
    await page.waitForTimeout(400);

    /* The year shown is the build's, not the clock's: the document and the
       client agree, so nothing is replaced and nothing is logged. */
    const year = await page.locator('footer.footer p').textContent();
    expect(year).not.toContain(String(nextYear));
    expect(year).toMatch(/© \d{4} Toshifur Rahman/);
    expect(problems).toEqual([]);
  });
}

test('the footer year is the same before and after hydration', async ({ page }) => {
  await page.clock.install({ time: new Date(`${nextYear}-02-01T12:00:00Z`) });
  /* Read the pre-rendered text before the bundle runs, then after. */
  await page.goto('/', { waitUntil: 'commit' });
  const before = await page.locator('footer.footer p').textContent();
  await page.waitForTimeout(500);
  const after = await page.locator('footer.footer p').textContent();
  expect(after).toBe(before);
});
