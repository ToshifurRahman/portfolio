import { expect, test } from '@playwright/test';

const toggle = (page: import('@playwright/test').Page) =>
  page.getByRole('button', { name: /dark and light theme/i });

test.describe('theme', () => {
  test('defaults to dark when nothing is stored and the system is dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('follows a light system preference when nothing is stored', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('a stored choice beats the system preference', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('switches to light, persists it and survives a reload', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    const dark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await toggle(page).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    /* Assert the light token itself, not "anything but the previous design's
       background": `bg !== 'rgb(16, 15, 14)'` passed for any colour at all. */
    const light = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(dark).toBe('rgb(10, 11, 13)');
    /* The softened light page (owner, 2026-11-15: "Light mode is too bright"): it
       used to be near-white at 243,242,238 and is now a warm grey. */
    expect(light).toBe('rgb(232, 229, 221)');
    expect(light).not.toBe(dark);
    /* And it is genuinely darker than it was, not merely different: a page this
       bright reads as glare on a full screen. */
    const brightness = light.match(/\d+/g)!.slice(0, 3).map(Number).reduce((a, b) => a + b, 0) / 3;
    expect(brightness).toBeLessThan(240);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('applies the stored theme before the app paints', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('theme', 'light'));
    await page.goto('/');
    const early = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(early).toBe('light');
  });

  test('keeps the choice across pages', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await toggle(page).click();
    await page.getByRole('link', { name: /Ticket-Pipeline/ }).first().click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });
});
