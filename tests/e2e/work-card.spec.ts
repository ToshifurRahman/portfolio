import { expect, test } from '@playwright/test';

/* Owner, 2026-11-19: on Relay's Work card the gateway's backup model has to sit
   under the primary model it fails over from, not under the React app at the far
   left. The old `.node-break` spacer assumed a row, so on desktop it reset the
   row and on a phone, where the chain is a column, it became a full-height
   spacer and pushed the branch into a second column. */

const WIDTHS = [1440, 1280, 390];

const cards = async (page: import('@playwright/test').Page) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const work = page.locator('#work');
  await work.scrollIntoViewIfNeeded();
  return work;
};

for (const width of WIDTHS) {
  test(`${width}px: Backup model sits below Primary model`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.locator('#work').scrollIntoViewIfNeeded();

    const boxes = await page.locator('#work .case').first().evaluate((card) => {
      const find = (label: string) => {
        const el = [...card.querySelectorAll<HTMLElement>('.node')].find(
          (n) => (n.textContent ?? '').trim() === label,
        );
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
      };
      return { primary: find('Primary model'), backup: find('Backup model'), app: find('React app') };
    });

    expect(boxes.primary, 'no Primary model box').not.toBeNull();
    expect(boxes.backup, 'no Backup model box').not.toBeNull();
    expect(boxes.app, 'no React app box').not.toBeNull();

    /* The branch hangs under its parent at every width. */
    expect(boxes.backup!.top, 'Backup model is not below Primary model').toBeGreaterThanOrEqual(
      boxes.primary!.bottom - 0.5,
    );
    /* It is not the old far-left row under React app. */
    expect(boxes.backup!.left).toBeGreaterThanOrEqual(boxes.primary!.left - 1);
    expect(boxes.backup!.left - boxes.primary!.left, 'the branch indent is too deep').toBeLessThanOrEqual(20);
    expect(boxes.app!.bottom, 'Backup model shares React app’s row').toBeLessThan(boxes.backup!.top);
  });
}

test('the card never scrolls sideways at 390', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await cards(page);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
