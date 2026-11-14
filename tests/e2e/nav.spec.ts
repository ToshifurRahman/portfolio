import { expect, test } from '@playwright/test';

const sections = ['about', 'work', 'skills', 'contact'];

test.describe('navbar', () => {
  test('is sticky and present on every route', async ({ page }) => {
    for (const path of ['/', '/work/ticket-pipeline', '/no-such-page']) {
      await page.goto(path);
      const header = page.locator('header.site-header');
      await expect(header).toBeVisible();
      await expect(header.getByRole('navigation', { name: 'Primary' })).toBeVisible();
      await expect(header).toHaveCSS('position', 'sticky');
    }
  });

  test('links to every home section from a case study page', async ({ page }) => {
    await page.goto('/work/ticket-pipeline');
    const nav = page.getByRole('navigation', { name: 'Primary' });
    await nav.getByRole('link', { name: 'Skills' }).click();
    await expect(page).toHaveURL(/\/#skills$/);
    await expect(page.locator('#skills')).toBeInViewport();
  });

  test('marks the section in view as current', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Primary' });
    /* Scroll the section to just under the bar, the way a reader arrives at it. */
    await page.evaluate(() => {
      const header = document.querySelector('.site-header')!.getBoundingClientRect().height;
      scrollTo(0, document.getElementById('skills')!.offsetTop - header - 8);
    });
    await expect(nav.getByRole('link', { name: 'Skills' })).toHaveAttribute('aria-current', 'true');
  });

  test('marks Contact current at the bottom of the page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Primary' });
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await expect(nav.getByRole('link', { name: 'Contact' })).toHaveAttribute('aria-current', 'true');
  });

  test('marks Contact current when its link is followed', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Primary' });
    await nav.getByRole('link', { name: 'Contact' }).click();
    await expect(nav.getByRole('link', { name: 'Contact' })).toHaveAttribute('aria-current', 'true');
    await expect(nav.getByRole('link', { name: 'Skills' })).not.toHaveAttribute('aria-current', 'true');
  });

  test('a second click on the same section link scrolls back to it', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Primary' });
    await nav.getByRole('button', { name: /menu/i }).click();
    await nav.getByRole('link', { name: 'Contact' }).click();
    await expect(page).toHaveURL(/#contact$/);
    await page.evaluate(() => scrollTo(0, 0));
    await nav.getByRole('button', { name: /menu/i }).click();
    await nav.getByRole('link', { name: 'Contact' }).click();
    await expect
      .poll(() => page.evaluate(() => Math.round(scrollY)))
      .toBeGreaterThan(0);
  });

  test('a hash link never hides the heading under the bar', async ({ page }) => {
    await page.goto('/#contact');
    const heading = page.locator('#contact-title');
    await expect(heading).toBeInViewport();
    const header = await page.locator('header.site-header').boundingBox();
    const box = await heading.boundingBox();
    expect(box!.y).toBeGreaterThanOrEqual(header!.height - 1);
  });

  test('phone menu opens, closes on Escape and returns focus', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Primary' });
    const button = nav.getByRole('button', { name: /menu/i });
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(nav.getByRole('link', { name: 'Contact' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).toBeFocused();
  });

  test('every section is reachable by keyboard', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Primary' });
    await nav.getByRole('link', { name: 'About' }).focus();
    for (const name of ['Work', 'Experience', 'Achievements', 'Certificates', 'Skills', 'Contact']) {
      await page.keyboard.press('Tab');
      await expect(nav.getByRole('link', { name })).toBeFocused();
    }
  });
});

test.describe('home layout', () => {
  test('shows every section without a tab click', async ({ page }) => {
    await page.goto('/');
    for (const id of sections) {
      await expect(page.locator(`#${id}`)).toBeVisible();
    }
    await expect(page.getByRole('tab')).toHaveCount(0);
  });
});
