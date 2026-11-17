import { expect, test, type Page } from '@playwright/test';

/* The real content has no Live entry, so these checks add one to the rendered
   meta row and measure the grid. A study with four entries must lay out as four
   columns on desktop and as a clean 2x2 on a tablet, never wrapping Source under
   an empty quadrant. */

const readCells = (page: Page) =>
  page.locator('.meta > div').evaluateAll((nodes) =>
    nodes.map((n) => {
      const box = n.getBoundingClientRect();
      const style = getComputedStyle(n);
      return {
        top: box.top,
        left: box.left,
        right: box.right,
        width: box.width,
        borderTop: parseFloat(style.borderTopWidth),
        borderLeft: parseFloat(style.borderLeftWidth),
      };
    }),
  );

const withLiveEntry = (page: Page) =>
  page.evaluate(() => {
    const meta = document.querySelector('.meta') as HTMLElement;
    const source = meta.lastElementChild as HTMLElement;
    const live = source.cloneNode(true) as HTMLElement;
    live.querySelector('dt')!.textContent = 'Live';
    const link = live.querySelector('a') as HTMLAnchorElement;
    link.textContent = 'ticket.example.com';
    link.href = 'https://ticket.example.com';
    meta.insertBefore(live, source);
  });

test('four entries share one row at 1440 px', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/work/ticket-pipeline');
  await withLiveEntry(page);

  const cells = await readCells(page);
  expect(cells).toHaveLength(4);
  for (const [i, cell] of cells.entries()) {
    expect(Math.abs(cell.top - cells[0].top), `cell ${i + 1} wrapped onto its own row`).toBeLessThan(1);
  }
  /* Live then Source, beside each other and to the right of Stack. */
  expect(cells[2].left).toBeGreaterThan(cells[1].left);
  expect(cells[3].left).toBeGreaterThan(cells[2].left);
});

test('four entries form a 2x2 at 1024 px', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto('/work/ticket-pipeline');
  await withLiveEntry(page);

  const cells = await readCells(page);
  expect(cells).toHaveLength(4);
  expect(Math.abs(cells[0].top - cells[1].top)).toBeLessThan(1);
  expect(Math.abs(cells[2].top - cells[3].top)).toBeLessThan(1);
  expect(cells[2].top).toBeGreaterThan(cells[0].top + 1);
});

test('the last of three entries spans the row at 1024 px', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto('/work/ticket-pipeline');

  const cells = await readCells(page);
  expect(cells).toHaveLength(3);
  const meta = await page.locator('.meta').evaluate((el) => {
    const box = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return { left: box.left + parseFloat(style.paddingLeft), right: box.right - parseFloat(style.paddingRight) };
  });

  /* The third cell owns the second row outright: no empty quadrant, and its
     hairline runs the full width. */
  expect(Math.abs(cells[2].left - meta.left)).toBeLessThan(1);
  expect(Math.abs(cells[2].right - meta.right)).toBeLessThan(1);
  expect(cells[2].width).toBeGreaterThan(cells[0].width * 1.8);
  expect(cells[2].borderTop).toBe(1);
  expect(cells[2].borderLeft).toBe(0);
});
