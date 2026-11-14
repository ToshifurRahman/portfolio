import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const pages = ['/', '/work/ticket-pipeline'];
const themes = ['dark', 'light'] as const;
const widths = [390, 1280];

for (const path of pages) {
  for (const theme of themes) {
    for (const width of widths) {
      test(`axe: ${path} ${theme} ${width}px`, async ({ page }) => {
        await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();
        expect(results.violations).toEqual([]);
      });
    }
  }
}
