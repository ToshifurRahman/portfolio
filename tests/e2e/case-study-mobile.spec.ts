import { expect, test } from '@playwright/test';

/* Owner, 2026-11-15: "Optimize for mobile view", applied to the case studies.
   The same four promises the home page keeps, checked on both studies, plus the
   sub-navbar, which is the one thing these pages have and `/` does not. */

const WIDTHS = [360, 390, 430];
const STUDIES = ['/work/relay', '/work/rannaghor'];

for (const path of STUDIES) {
  for (const width of WIDTHS) {
    test(`${path} at ${width} px: readable, tappable, and no sideways scroll`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(path);

      const overflow = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      expect(overflow.scroll, 'the page scrolls sideways').toBeLessThanOrEqual(overflow.client);

      /* Body text at least 16px. Mono metadata lines are labels, not prose. */
      const small = await page.locator('.prose p, .pair-text, .decision-text, .study-lede').evaluateAll((nodes) =>
        nodes
          .filter((n) => {
            const cs = getComputedStyle(n);
            if (cs.fontFamily.toLowerCase().includes('mono')) return false;
            return parseFloat(cs.fontSize) < 16 && (n.textContent ?? '').trim().length > 40;
          })
          .map((n) => `${(n.textContent ?? '').slice(0, 30)}: ${getComputedStyle(n).fontSize}`),
      );
      expect(small, `body text under 16px: ${small.join(', ')}`).toEqual([]);

      /* Tap targets at least 44px, excluding inline links in prose and links
         whose ::after stretches over a card. */
      const small_targets = await page
        .locator('a[href], button, [role="button"]')
        .evaluateAll((nodes) =>
          nodes
            .filter((n) => {
              const cs = getComputedStyle(n as HTMLElement);
              if (cs.display === 'none' || cs.visibility === 'hidden') return false;
              if (n.tagName === 'A' && cs.display.includes('inline') && (n as HTMLElement).closest('p')) return false;
              const after = getComputedStyle(n, '::after');
              if (after.content !== 'none' && after.position === 'absolute') return false;
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

    test(`${path} at ${width} px: the sub-navbar scrolls without clipping an end`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(path);
      const list = page.locator('.contents ol');
      await expect(list).toBeVisible();

      /* It may scroll sideways, but no item's own box may be cut by the list's
         edge at rest — the first item starts at the left edge and the last item
         can be reached, which is what "not clipped" means for a scroller. */
      const geometry = await list.evaluate((ol) => {
        const box = ol.getBoundingClientRect();
        const items = [...ol.querySelectorAll('li')].map((li) => li.getBoundingClientRect());
        return {
          scrollable: ol.scrollWidth > ol.clientWidth + 1,
          firstAtLeft: Math.round(items[0].left - box.left),
          lastReachable: ol.scrollWidth - ol.clientWidth,
          count: items.length,
        };
      });
      expect(geometry.count).toBeGreaterThan(4);
      /* The first item is not pushed off the left edge. */
      expect(geometry.firstAtLeft).toBeGreaterThanOrEqual(0);
      if (geometry.scrollable) {
        /* Scroll to the end: the last item must be fully inside. */
        await list.evaluate((ol) => ol.scrollTo({ left: ol.scrollWidth }));
        await page.waitForTimeout(100);
        const lastInView = await list.evaluate((ol) => {
          const box = ol.getBoundingClientRect();
          const items = [...ol.querySelectorAll('li')];
          const last = items[items.length - 1].getBoundingClientRect();
          return last.right <= box.right + 1;
        });
        expect(lastInView, 'the last sub-nav item cannot be reached').toBe(true);
      }
    });
  }
}
