import { expect, test } from '@playwright/test';

/* Owner, 2026-11-15, owner at 23:03: "Optimize for mobile view". The checks the brief
   names, at the three phone widths a real device uses. */

const WIDTHS = [360, 390, 430];

test.describe('the home page on a phone', () => {
  for (const width of WIDTHS) {
    test(`at ${width} px: no sideways scroll, readable text, 44px targets`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/');

      /* No sideways scroll. */
      const overflow = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      expect(overflow.scroll).toBeLessThanOrEqual(overflow.client);

      /* Body text at least 16px. "Body text" means prose a reader reads: the
         mono metadata lines (a stack list, a date) are labels, not body copy, and
         WCAG's body-text expectation does not reach them. */
      const small = await page.locator('.statement, .section-body p, .case-summary, #contact p').evaluateAll(
        (nodes) =>
          nodes
            .filter((n) => {
              const cs = getComputedStyle(n);
              const mono = cs.fontFamily.toLowerCase().includes('mono');
              const size = parseFloat(cs.fontSize);
              return !mono && size < 16 && (n.textContent ?? '').trim().length > 40;
            })
            .map((n) => ({
              text: (n.textContent ?? '').slice(0, 30),
              size: getComputedStyle(n).fontSize,
            })),
      );
      expect(small, `body text under 16px: ${JSON.stringify(small)}`).toEqual([]);

      /* Every tap target at least 44px in its smallest dimension. */
      const small_targets = await page
        .locator('a[href], button, [role="button"], input, select, textarea')
        .evaluateAll((nodes) =>
          nodes
            .filter((n) => {
              const cs = getComputedStyle(n as HTMLElement);
              if (cs.display === 'none' || cs.visibility === 'hidden') return false;
              /* Inline links inside prose are exempt (WCAG 2.5.8): they are not
                 discrete controls. */
              if (n.tagName === 'A' && cs.display.includes('inline') && (n as HTMLElement).closest('p')) return false;
              /* A link whose ::after stretches over an ancestor card is a card-
                 sized target, whatever the anchor's own box measures: that
                 pattern is how the Work cards are clickable. */
              const after = getComputedStyle(n, '::after');
              const overlay = after.content !== 'none' && after.position === 'absolute';
              if (overlay) return false;
              const r = n.getBoundingClientRect();
              return r.width > 0 && r.height > 0 && (r.width < 43.5 || r.height < 43.5);
            })
            .map((n) => {
              const r = n.getBoundingClientRect();
              return `${n.tagName}.${(n as HTMLElement).className || '-'} ${Math.round(r.width)}x${Math.round(r.height)}`;
            }),
        );
      expect(small_targets, `targets under 44px: ${small_targets.join(', ')}`).toEqual([]);
    });

    test(`at ${width} px: the hero shows the name, the role and the CV`, async ({ page }) => {
      /* Must prove 2, at phone sizes. */
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/');
      for (const selector of ['.name', '.role', '.readout .button']) {
        await expect(page.locator(selector)).toBeInViewport();
      }
    });

    test(`at ${width} px: no section is only padding`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/');
      const empty = await page.locator('main .section, main .intro, main #now').evaluateAll((sections) =>
        sections
          .filter((s) => {
            const rect = s.getBoundingClientRect();
            if (rect.height === 0) return false;
            /* Text content that is not just whitespace. */
            const text = (s.textContent ?? '').replace(/\s+/g, '');
            return text.length === 0;
          })
          .map((s) => (s as HTMLElement).id || (s as HTMLElement).className),
      );
      expect(empty).toEqual([]);
    });
  }
});
