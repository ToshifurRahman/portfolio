import { expect, test } from '@playwright/test';

/* Owner, 2026-11-15: "navbar design will be same as works page sub navbar".
   Owner, 2026-11-17: "in nav, remove lines connected with dots" — the top bar
   keeps the sub-navbar's lamps, type and active treatment, but no rail joins its
   items. The sub-navbar's own rail is guarded in nav-rail.spec.ts. */

test.describe('the navbar in the sub-navbar language', () => {
  test('puts a lamp on every item and no line between them', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    const links = page.locator('.nav-links a');
    const count = await links.count();
    expect(count).toBeGreaterThan(2);

    /* Every visible item has a lamp, and none draws a connector. */
    await expect(page.locator('.nav-links a .lamp')).toHaveCount(count);
    const boxes = await page.locator('.nav-links li').evaluateAll((items) =>
      items
        .filter((li) => getComputedStyle(li).display !== 'none')
        .map((li) => li.getBoundingClientRect().x),
    );
    for (let i = 1; i < boxes.length; i++) {
      expect(boxes[i] - boxes[i - 1]).toBeGreaterThan(0);
    }
    /* A lamp is a painted dot on every item that is showing; `--lamp` is 8px.
       The phone-only CV row is display:none at this width, so its lamp has no
       box and is filtered out by measurement rather than by a selector that
       would silently pass if the whole bar hid. */
    const lampSizes = await page.locator('.nav-links a .lamp').evaluateAll((lamps) =>
      lamps.map((lamp) => Math.round(lamp.getBoundingClientRect().width)).filter((w) => w > 0),
    );
    expect(lampSizes.length).toBe(5);
    expect(lampSizes.every((w) => w === 8)).toBe(true);

    /* The same type size as the sub-navbar's items. The home page has no
       sub-navbar, so the comparison is made on a case study, where both bars are
       on screen at once. */
    const size = await links.first().evaluate((el) => getComputedStyle(el).fontSize);
    expect(size).toBe('14px');

    await page.goto('/work/relay');
    const subnavSize = await page
      .locator('.contents a')
      .first()
      .evaluate((el) => getComputedStyle(el).fontSize);
    const topSize = await page.locator('.nav-links a').first().evaluate((el) => getComputedStyle(el).fontSize);
    expect(topSize).toBe(subnavSize);
  });

  test('lights the section being read on the home page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    await page.locator('#contact').scrollIntoViewIfNeeded();
    const contact = page.locator('.nav-links a[aria-current="true"]');
    await expect(contact).toHaveCount(1);
    await expect(contact).toHaveText(/Contact/);
  });

  test('lights Work while a case study is being read', async ({ page }) => {
    await page.goto('/work/rannaghor');
    const current = page.locator('.nav-links a[aria-current="true"]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveText(/Work/);
  });

  test('keeps the Menu collapse, the CV action and the theme toggle', async ({ page }) => {
    /* Narrow: the menu is the only route to the sections. */
    await page.setViewportSize({ width: 800, height: 900 });
    await page.goto('/');
    await expect(page.locator('.nav-links')).toBeHidden();
    await page.locator('.menu-button').click();
    await expect(page.locator('.nav-links a').first()).toBeVisible();
    /* The CV action is in the menu when the bar has collapsed. */
    await expect(page.locator('.nav-cv a')).toBeVisible();

    /* Wide: the bar shows the CV button and the toggle. */
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    await expect(page.locator('.cv-link')).toBeVisible();
    await expect(page.locator('.theme-toggle')).toBeVisible();
  });

  test('keeps a 44px target and a visible focus ring on every item', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    /* Only the visible items: the phone-only CV row is display:none here and has
       no box to measure. */
    for (const link of await page.locator('.nav-links a:visible').all()) {
      const box = await link.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(43.5);
    }
    await page.locator('.nav-links a').first().focus();
    const outline = await page.locator('.nav-links a').first().evaluate((el) => {
      const cs = getComputedStyle(el);
      return cs.outlineStyle !== 'none' || cs.boxShadow !== 'none';
    });
    expect(outline).toBe(true);
  });
});
