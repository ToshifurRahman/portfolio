import { expect, test } from '@playwright/test';
import { certificates } from '../../src/content';

const navSections = [
  { label: 'Experience', id: 'experience' },
  { label: 'Achievements', id: 'achievements' },
  { label: 'Skills', id: 'skills' },
] as const;

const nav = (page: import('@playwright/test').Page) =>
  page.getByRole('navigation', { name: 'Primary' });

test.describe('CV sections as navbar states', () => {
  for (const { label, id } of navSections) {
    test(`${label} scrolls to its section and is marked current`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto('/');

      const link = nav(page).getByRole('link', { name: label });
      await link.click();
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
      await expect(page.locator(`#${id}-title`)).toBeInViewport();

      /* The heading clears the sticky bar rather than landing under it. */
      const header = await page.locator('header.site-header').boundingBox();
      const heading = await page.locator(`#${id}-title`).boundingBox();
      expect(heading!.y).toBeGreaterThanOrEqual(header!.height - 1);

      await expect(link).toHaveAttribute('aria-current', 'true');
      for (const other of navSections) {
        if (other.id !== id) {
          await expect(nav(page).getByRole('link', { name: other.label })).not.toHaveAttribute(
            'aria-current',
            'true',
          );
        }
      }
    });
  }

  test('marks each CV section current while a reader is inside it', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    for (const { label, id } of navSections) {
      await page.evaluate((sectionId) => {
        const header = document.querySelector('.site-header')!.getBoundingClientRect().height;
        scrollTo(0, document.getElementById(sectionId)!.offsetTop - header - 8);
      }, id);
      await expect(nav(page).getByRole('link', { name: label })).toHaveAttribute(
        'aria-current',
        'true',
      );
    }
  });

  test('390 px: each CV section link reaches its section from the phone menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    for (const { label, id } of navSections) {
      await page.evaluate(() => scrollTo(0, 0));
      const bar = nav(page).getByRole('button', { name: /menu/i });
      if ((await bar.getAttribute('aria-expanded')) === 'false') await bar.click();
      await nav(page).getByRole('link', { name: label }).click();
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
      await expect(page.locator(`#${id}-title`)).toBeInViewport();
    }
  });
});

test.describe('certificate dialog over the sticky bar', () => {
  test('paints above the navbar and leaves the page behind it inert', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    const cert = certificates[0];
    const card = page.locator('#certificates').getByRole('button', { name: new RegExp(cert.title) });
    await card.scrollIntoViewIfNeeded();
    await card.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    /* Whatever sits at the top of the dialog is the dialog, never the bar: a
       modal dialog is in the top layer, above the sticky header's z-index. */
    const top = await page.evaluate(() => {
      const open = document.querySelector('dialog[open]')!;
      const box = open.getBoundingClientRect();
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + 2);
      return { inDialog: Boolean(hit && open.contains(hit)), headerZ: getComputedStyle(document.querySelector('.site-header')!).zIndex };
    });
    expect(top.inDialog).toBe(true);
    expect(Number(top.headerZ)).toBeGreaterThan(0);

    /* The bar is still on screen above the dialog, but it is inert. */
    await expect(page.locator('header.site-header')).toBeVisible();
    const focusable = await page.evaluate(() => {
      const link = document.querySelector('.site-header nav a') as HTMLElement;
      link.focus();
      return document.activeElement === link;
    });
    expect(focusable).toBe(false);

    const clickable = await page.evaluate(() => {
      const link = document.querySelector('.site-header nav a') as HTMLElement;
      const box = link.getBoundingClientRect();
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      return Boolean(hit && link.contains(hit));
    });
    expect(clickable).toBe(false);

    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });
});
