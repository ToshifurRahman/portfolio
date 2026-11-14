import { expect, test } from '@playwright/test';

test('home page loads with the owner name', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Toshifur Rahman');
  await expect(page).toHaveTitle(/Toshifur Rahman/);
});
