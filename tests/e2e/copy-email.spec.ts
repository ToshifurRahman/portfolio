import { expect, test } from '@playwright/test';

/* Owner, 2026-11-15, owner at 23:03: "in contact, put option to copy email". The button is
   a real <button> beside the address, the mailto link stays, and the
   confirmation goes through a polite live region rather than colour alone. */

test.describe('copy the email address', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  test('writes the address to the clipboard and announces it', async ({ page }) => {
    await page.goto('/');
    await page.locator('#contact').scrollIntoViewIfNeeded();

    const address = await page.locator('.contact-email').textContent();
    expect(address?.trim()).toMatch(/@/);

    const button = page.getByRole('button', { name: 'Copy email' });
    await expect(button).toBeVisible();
    await button.click();

    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toBe(address?.trim());

    /* The label changes and the live region says what happened. */
    await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible();
    await expect(page.locator('#contact [role="status"]')).toHaveText(/copied to the clipboard/i);
  });

  test('goes back to "Copy email" after about two seconds', async ({ page }) => {
    await page.goto('/');
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'Copy email' }).click();
    await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible();
    /* Not instant, and not permanent. */
    await page.waitForTimeout(2400);
    await expect(page.getByRole('button', { name: 'Copy email' })).toBeVisible();
  });

  test('keeps the mailto link beside the button', async ({ page }) => {
    await page.goto('/');
    await page.locator('#contact').scrollIntoViewIfNeeded();
    const href = await page.locator('.contact-email').getAttribute('href');
    expect(href).toMatch(/^mailto:/);
    await expect(page.locator('.contact-address button')).toHaveCount(1);
  });

  test('selects the address when the clipboard is refused', async ({ page }) => {
    /* The fallback the brief asks for: with the clipboard unavailable the button
       selects the text so the visitor can copy it, and says so. */
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: () => Promise.reject(new Error('refused')) },
      });
    });
    await page.goto('/');
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'Copy email' }).click();

    const selected = await page.evaluate(() => window.getSelection()?.toString().trim() ?? '');
    expect(selected).toMatch(/@/);
    await expect(page.locator('#contact [role="status"]')).toHaveText(/selected/i);
  });
});
