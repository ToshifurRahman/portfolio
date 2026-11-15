import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { certificates, owner } from '../../src/content';

const sectionIds = ['experience', 'education', 'achievements'] as const;

const gotoHome = async (page: import('@playwright/test').Page) => {
  await page.goto('/');
  await page.locator('#experience-title').waitFor();
};

test('every email link on the built page is a plain mailto', async ({ page }) => {
  /* Owner, 2026-11-15: clicking the email should open the default mail app.
     Checked on the built page, because that is where a stray target="_blank"
     or download would actually change the click. */
  await gotoHome(page);
  const links = page.locator('a[href^="mailto:"]');
  const count = await links.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i += 1) {
    const link = links.nth(i);
    await expect(link).toHaveAttribute('href', `mailto:${owner.email}`);
    expect(await link.getAttribute('target'), `link ${i} has a target`).toBeNull();
    expect(await link.getAttribute('download'), `link ${i} downloads`).toBeNull();
  }
  /* The large address and the readout button are both there. */
  await expect(page.locator('.contact-email')).toHaveAttribute('href', `mailto:${owner.email}`);
  await expect(page.locator('.intro-actions').locator('a[href^="mailto:"]')).toHaveCount(1);
});

test('the contact lede is the owner’s own sentence', async ({ page }) => {
  await gotoHome(page);
  const lede = page.locator('#contact .section-lede');
  await expect(lede).toContainText('Want to talk?');
  await expect(lede).toContainText('Email is the fastest way to reach me.');
  await expect(lede).not.toContainText('Hiring for');
});

test('the CV downloads as a PDF', async ({ page, request }) => {
  await gotoHome(page);

  const link = page.locator('.readout').getByRole('link', { name: /download cv/i });
  await expect(link).toHaveAttribute('href', owner.cv);
  /* An empty download attribute keeps the file's own name; "true" would not. */
  expect(await link.getAttribute('download')).toBe('');

  const response = await request.get(owner.cv);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/pdf');
});

test('the CV sections carry their ids and headings, certificates inside Achievements', async ({ page }) => {
  await gotoHome(page);

  for (const id of sectionIds) {
    const section = page.locator(`section#${id}`);
    await expect(section).toHaveCount(1);
    await expect(section).toHaveAttribute('aria-labelledby', `${id}-title`);
    await expect(page.locator(`#${id}-title`)).toBeVisible();
  }
  await expect(page.locator('section#achievements #certificates')).toHaveCount(1);
});

test('a certificate dialog opens, traps focus, closes on Escape and returns focus', async ({ page }) => {
  await gotoHome(page);

  const first = certificates[0];
  const card = page.locator('#certificates').getByRole('button', { name: new RegExp(first.title) });
  await card.scrollIntoViewIfNeeded();
  await card.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-labelledby', 'dialog-title');
  await expect(page.locator('#dialog-title')).toHaveText(first.title);
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
  test(`no axe violations in the CV sections (${theme})`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
    await gotoHome(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);

    for (const id of sectionIds) await page.locator(`#${id}`).scrollIntoViewIfNeeded();

    const results = await new AxeBuilder({ page })
      .include('#experience')
      .include('#education')
      .include('#achievements')
      .include('#certificates')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
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

test.describe('the Work section after the owner cut it back', () => {
  /* Owner, 2026-11-15 23:03: "in work, remove subtitle, project chart not
     looking good, drop what i build, drop other projects". The two case studies
     are the whole section now. */
  test('has no lede, no "What I build" and no "Other projects"', async ({ page }) => {
    await page.goto('/');
    const work = page.locator('#work');
    await expect(work.locator('.section-lede')).toHaveCount(0);
    await expect(work.locator('.subhead')).toHaveCount(0);
    await expect(work.getByText('What I build')).toHaveCount(0);
    await expect(work.getByText('Other projects')).toHaveCount(0);
    /* The five other projects are no longer listed anywhere on the site. */
    for (const name of ['Hacker News Clone', '7GUIs']) {
      await expect(page.getByText(name, { exact: false })).toHaveCount(0);
    }
    /* And the two case studies are still there, with their cards. */
    await expect(work.locator('.case')).toHaveCount(2);
  });
});
