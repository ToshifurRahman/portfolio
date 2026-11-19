import { expect, test, type Page } from '@playwright/test';

/* Relay has four meta entries (Type, Stack, Source Code, Live) and RannaGhor has
   three. Four entries must lay out as four columns on desktop and as a clean 2x2
   on a tablet, never wrapping Source under an empty quadrant; three must let the
   last one own the second row. */

/* Owner, 2026-11-17: "remove bg of github & create same design as Skills sections
   button, write Source Code instead of source." So the cell's label is "Source
   Code", its link reads "GitHub", and the link wears the Skills chip: mono type,
   a hairline border, no fill. The chip's values are read off a real
   `.skill-list li` on the home page rather than restated here, because "same
   design" is a comparison, not a list of literals. */

const STUDIES = [
  { slug: 'relay', repo: 'https://github.com/ToshifurRahman/relay' },
  { slug: 'rannaghor', repo: 'https://github.com/ToshifurRahman/e-commerce-website' },
];

/* The chip's own computed style, read from the Skills section. */
const chipStyle = (page: Page) =>
  page.goto('/').then(() =>
    page.locator('.skill-list li').first().evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        fontFamily: s.fontFamily,
        fontSize: s.fontSize,
        lineHeight: s.lineHeight,
        borderTopWidth: s.borderTopWidth,
        borderTopStyle: s.borderTopStyle,
        borderTopColor: s.borderTopColor,
        borderRadius: s.borderRadius,
        backgroundColor: s.backgroundColor,
        paddingTop: s.paddingTop,
        paddingRight: s.paddingRight,
        paddingBottom: s.paddingBottom,
        paddingLeft: s.paddingLeft,
        color: s.color,
      };
    }),
  );

for (const { slug, repo } of STUDIES) {
  test(`${slug}: the Source cell reads Source Code and links GitHub as a Skills chip`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const chip = await chipStyle(page);

    await page.goto(`/work/${slug}`);
    /* Relay also has a Live chip, so the Source cell is found by its label. */
    const cell = page.locator('.meta > div').filter({ has: page.locator('dt', { hasText: 'Source Code' }) });
    await expect(cell).toHaveCount(1);
    const link = cell.locator('a.meta-link');
    await expect(link).toHaveText('GitHub');
    await expect(link).toHaveAttribute('href', repo);
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');

    const own = await link.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        fontFamily: s.fontFamily,
        fontSize: s.fontSize,
        lineHeight: s.lineHeight,
        borderTopWidth: s.borderTopWidth,
        borderTopStyle: s.borderTopStyle,
        borderTopColor: s.borderTopColor,
        borderRadius: s.borderRadius,
        backgroundColor: s.backgroundColor,
        paddingTop: s.paddingTop,
        paddingRight: s.paddingRight,
        paddingBottom: s.paddingBottom,
        paddingLeft: s.paddingLeft,
        color: s.color,
        textTransform: s.textTransform,
        height: el.getBoundingClientRect().height,
      };
    });

    /* No fill of its own: the page's ground shows through, as on a chip. */
    expect(['rgba(0, 0, 0, 0)', 'transparent']).toContain(own.backgroundColor);
    /* The same type, border and radius as the Skills chip. */
    expect(own.fontFamily, 'the link is not in the chip face').toBe(chip.fontFamily);
    expect(own.fontSize, 'the link is not at the chip size').toBe(chip.fontSize);
    expect(own.borderTopWidth).toBe(chip.borderTopWidth);
    expect(own.borderTopStyle).toBe(chip.borderTopStyle);
    expect(own.borderTopColor, 'the link border is not the chip rule').toBe(chip.borderTopColor);
    expect(own.borderRadius).toBe(chip.borderRadius);
    expect(own.color, 'the link ink is not the chip ink').toBe(chip.color);
  });

  test(`${slug}: the chip keeps its target height and a visible focus ring`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/work/${slug}`);
    const link = page
      .locator('.meta > div')
      .filter({ has: page.locator('dt', { hasText: 'Source Code' }) })
      .locator('a.meta-link');
    const target = await page.evaluate(() =>
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--target')) * 16,
    );
    const height = await link.evaluate((el) => el.getBoundingClientRect().height);
    expect(height, 'the chip is under the target height').toBeGreaterThanOrEqual(target - 0.5);

    await link.focus();
    const ring = await link.evaluate((el) => {
      const s = getComputedStyle(el);
      /* Focus is drawn on `:focus-visible`; the stylesheet's ring is an outline in the
         accent's text tone. A focused link is what a keyboard user gets. */
      return { outlineWidth: parseFloat(s.outlineWidth), outlineStyle: s.outlineStyle };
    });
    expect(ring.outlineStyle, 'no focus ring on the chip').not.toBe('none');
    expect(ring.outlineWidth, 'the focus ring has no width').toBeGreaterThan(0);
  });
}

test('relay: the Live chip reads Live Link, not the host', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/work/relay');

  const cell = page.locator('.meta > div').filter({ has: page.locator('dt', { hasText: 'Live' }) });
  await expect(cell).toHaveCount(1);
  const link = cell.locator('a.meta-link');
  await expect(link).toHaveText('Live Link');
  await expect(link).toHaveAttribute('href', 'https://ticket-pipeline.onrender.com');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  /* The cell's label stays Live; the placeholder is the chip's words. */
  await expect(cell.locator('dt')).toHaveText('Live');
});

test('rannaghor: no Live chip', async ({ page }) => {
  await page.goto('/work/rannaghor');
  await expect(page.locator('.meta dt', { hasText: 'Live' })).toHaveCount(0);
});

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

test('four entries share one row at 1440 px', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/work/relay');

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
  await page.goto('/work/relay');

  const cells = await readCells(page);
  expect(cells).toHaveLength(4);
  expect(Math.abs(cells[0].top - cells[1].top)).toBeLessThan(1);
  expect(Math.abs(cells[2].top - cells[3].top)).toBeLessThan(1);
  expect(cells[2].top).toBeGreaterThan(cells[0].top + 1);
});

test('the last of three entries spans the row at 1024 px', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto('/work/rannaghor');

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
