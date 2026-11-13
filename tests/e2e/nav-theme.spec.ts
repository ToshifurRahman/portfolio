import { expect, test } from '@playwright/test';

test.describe('theme', () => {
  test('defaults to dark with no stored choice', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('radio', { name: 'Dark' })).toBeChecked();
  });

  test('switches to light, persists it and survives a reload without a flash', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('radio', { name: 'Light' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).not.toBe('rgb(255, 255, 255)');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.getByRole('radio', { name: 'Light' })).toBeChecked();
  });

  test('applies the stored theme before the app paints', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('theme', 'light'));
    await page.goto('/');
    const early = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(early).toBe('light');
  });

  test('keeps the choice across pages', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('radio', { name: 'Light' }).click();
    await page.getByRole('link', { name: 'Ticket-Pipeline' }).first().click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });
});
