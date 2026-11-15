import { expect, test } from '@playwright/test';

/*
 * The Now panel's career path: eight stations on one rail.
 *
 * At 64rem and up the rail runs horizontally, so the stations divide the width
 * between them. That works while each station is wide enough for its longest
 * label, and stops working just above the phone breakpoint: between 769 and
 * ~819px each station was 49-53px, so "Bootcamp Coordinator, IIUCCPS" ran into
 * "Finance Secretary, IIUCCPS" (a -5px gap at 769, -2px at 800) and the last
 * label spilled 12px past the rail. A reader at 800px saw "CoordinatorSecretary"
 * (R3-ds-2).
 *
 * The ruling is that the path turns vertical below 64rem — the same layout
 * phones already use — rather than a wrapping two-row rail.
 */

const realOverlap = async (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const path = document.querySelector('.now .path')!;
    const rail = path.getBoundingClientRect();
    const stations = [...path.querySelectorAll('li')].map((li) => {
      const label = li.querySelector('.path-label')!.getBoundingClientRect();
      return {
        text: (li.querySelector('.path-label')!.textContent ?? '').trim(),
        box: { l: label.left, r: label.right, t: label.top, b: label.bottom },
      };
    });

    /* Two labels collide only if they overlap on both axes; comparing the x
       bands alone reports a false collision on the vertical layout, where every
       station shares the same left edge. */
    const collide: string[] = [];
    for (let i = 0; i < stations.length; i++) {
      for (let j = i + 1; j < stations.length; j++) {
        const a = stations[i].box;
        const b = stations[j].box;
        if (a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b) {
          collide.push(`${stations[i].text} / ${stations[j].text}`);
        }
      }
    }

    return {
      direction: getComputedStyle(path).flexDirection,
      collide,
      pastRail: stations.filter((s) => s.box.r > rail.right + 1).map((s) => s.text),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

test.describe('the Now panel career path', () => {
  for (const width of [769, 800, 810, 820, 1024]) {
    test(`no station label collides or spills at ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      const path = await realOverlap(page);
      expect(path.collide, `collisions at ${width}px`).toEqual([]);
      expect(path.pastRail, `labels past the rail at ${width}px`).toEqual([]);
      expect(path.overflow).toBeLessThanOrEqual(0);
    });
  }

  test('turns vertical below 64rem, and stays horizontal at 1280', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 900 });
    await page.goto('/');
    expect((await realOverlap(page)).direction).toBe('column');

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    expect((await realOverlap(page)).direction).toBe('row');
  });
});
