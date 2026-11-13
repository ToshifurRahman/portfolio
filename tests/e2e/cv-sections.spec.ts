import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { certificates, owner } from '../../src/content';

const sectionIds = ['experience', 'education', 'achievements', 'certificates'] as const;

const gotoHome = async (page: import('@playwright/test').Page) => {
  await page.goto('/');
  await page.locator('#experience-title').waitFor();
};

test('the CV downloads as a PDF', async ({ page, request }) => {
  await gotoHome(page);

  const link = page.locator('#experience').getByRole('link', { name: /download cv/i });
  await expect(link).toHaveAttribute('href', owner.cv);
  /* An empty download attribute keeps the file's own name; "true" would not. */
  expect(await link.getAttribute('download')).toBe('');

  const response = await request.get(owner.cv);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/pdf');
});

test('the four CV sections carry the R1 ids and headings', async ({ page }) => {
  await gotoHome(page);

  for (const id of sectionIds) {
    const section = page.locator(`section#${id}`);
    await expect(section).toHaveCount(1);
    await expect(section).toHaveAttribute('aria-labelledby', `${id}-title`);
    await expect(page.locator(`#${id}-title`)).toBeVisible();
  }
});

test('a certificate dialog opens, traps focus, closes on Escape and returns focus', async ({ page }) => {
  await gotoHome(page);

  const first = certificates[0];
  const card = page.locator('#certificates').getByRole('button', { name: new RegExp(first.title) });
  await card.scrollIntoViewIfNeeded();
  await card.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-labelledby', 'cv-dialog-title');
  await expect(page.locator('#cv-dialog-title')).toHaveText(first.title);
  const original = dialog.getByRole('link', { name: /open original/i });
  await expect(original).toHaveAttribute('href', first.file);

  /* A modal dialog keeps focus inside: Tab cycles its controls, never the page
     behind it. Chrome parks focus on body between the last and first control. */
  await original.focus();
  for (let i = 0; i < 4; i += 1) {
    await page.keyboard.press('Tab');
    const where = await page.evaluate(() => {
      const open = document.querySelector('dialog[open]');
      const active = document.activeElement;
      return {
        inDialog: Boolean(open && active && open.contains(active)),
        isBody: active === document.body,
      };
    });
    expect(where.inDialog || where.isBody, 'focus does not reach the page').toBe(true);
  }

  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(card).toBeFocused();
});

test('the close button closes the dialog and returns focus to the card', async ({ page }) => {
  await gotoHome(page);

  const cert = certificates[2];
  const card = page.locator('#certificates').getByRole('button', { name: new RegExp(cert.title) });
  await card.scrollIntoViewIfNeeded();
  await card.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: /close/i }).click();
  await expect(dialog).not.toBeVisible();
  await expect(card).toBeFocused();
});

for (const theme of ['dark', 'light'] as const) {
  test(`no axe violations in the four CV sections (${theme})`, async ({ page }) => {
    await gotoHome(page);
    await page.evaluate((value) => {
      document.documentElement.dataset.theme = value;
      localStorage.setItem('theme', value);
    }, theme);

    for (const id of sectionIds) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    }

    const results = await new AxeBuilder({ page })
      .include('#experience')
      .include('#education')
      .include('#achievements')
      .include('#certificates')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
}

test('no axe violations with a certificate dialog open', async ({ page }) => {
  await gotoHome(page);
  const first = certificates[0];
  const card = page.locator('#certificates').getByRole('button', { name: new RegExp(first.title) });
  await card.scrollIntoViewIfNeeded();
  await card.click();
  await expect(page.getByRole('dialog')).toBeVisible();

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});
