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
    await toggle(page).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).not.toBe('rgb(16, 15, 14)');
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
