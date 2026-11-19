import { expect, test } from '@playwright/test';

/* The Now panel's two-lane timeline on one shared year axis.
 *
 * Owner, 2026-11-17: "Now section graph is disconnected & misguided". The axis
 * now shows every year from the first to the last year in the data (2021 to
 * 2026) at equal spacing, each lane is one continuous line, and every stop sits
 * at its own year on it. The B.Sc. is one bar from 2021 to 2025 with both ends
 * labelled; both M.Engg. stops sit at 2026, the current one lit.
 *
 * It replaces the 2026-11-15 layout, whose tests pinned an axis that only held
 * the years a stop happened to name and a row per stop. */

const WIDTHS = [360, 390, 430, 768, 834, 1024, 1280, 1440, 1600];

type Column = { text: string; left: number; right: number; width: number };

const columns = (page: import('@playwright/test').Page) =>
  page.locator('#now .years li').evaluateAll((items): Column[] =>
    items.map((li) => {
      const rect = li.getBoundingClientRect();
      return {
        text: (li.textContent ?? '').trim(),
        left: rect.left,
        right: rect.right,
        width: rect.width,
      };
    }),
  );

test.describe('the Now timeline', () => {
  for (const width of WIDTHS) {
    test(`has no overlapping label at ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await page.locator('#now').scrollIntoViewIfNeeded();

      const result = await page.evaluate(() => {
        const labels = [...document.querySelectorAll('#now .stop-label, #now .stop-date, #now .stop-child')]
          .map((el) => ({ text: (el.textContent ?? '').trim(), rect: el.getBoundingClientRect() }))
          .filter((o) => o.rect.width > 1);
        const overlaps: string[] = [];
        for (let i = 0; i < labels.length; i++) {
          for (let j = i + 1; j < labels.length; j++) {
            const a = labels[i].rect;
            const b = labels[j].rect;
            /* Both axes: comparing one axis reports false collisions wherever a
               layout deliberately shares it. */
            if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) {
              overlaps.push(`${labels[i].text} | ${labels[j].text}`);
            }
          }
        }
        const panel = document.querySelector('#now')!.getBoundingClientRect();
        const spill = labels.filter((o) => o.rect.right > panel.right + 1).map((o) => o.text);
        const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
        return { overlaps, spill, overflow };
      });

      expect(result.overlaps, `labels overlapping at ${width}px`).toEqual([]);
      expect(result.spill, `labels past the panel at ${width}px`).toEqual([]);
      expect(result.overflow).toBeLessThanOrEqual(0);
    });
  }

  test('fills the frame and marks every year on the lane line', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const frame = await page.evaluate(() => {
      const panel = document.querySelector('#now') as HTMLElement;
      const cs = getComputedStyle(panel);
      const timeline = document.querySelector('#now .timeline')!.getBoundingClientRect();
      const heading = document.querySelector('#now .now-title')!.getBoundingClientRect();
      const ticks = getComputedStyle(document.querySelector('#now .tl-stops')!, '::after');
      return {
        innerLeft: timeline.left,
        innerRight: timeline.right,
        panelLeft: panel.getBoundingClientRect().left + parseFloat(cs.paddingLeft),
        panelRight: panel.getBoundingClientRect().right - parseFloat(cs.paddingRight),
        timelineTop: timeline.top,
        headingBottom: heading.bottom,
        tickContent: ticks.content,
        tickWidth: ticks.width,
      };
    });

    /* The ruler owns the full 12-column inner width: the title is its own row. */
    expect(Math.abs(frame.innerLeft - frame.panelLeft)).toBeLessThanOrEqual(1);
    expect(Math.abs(frame.innerRight - frame.panelRight)).toBeLessThanOrEqual(1);
    expect(frame.timelineTop).toBeGreaterThanOrEqual(frame.headingBottom - 1);
    /* Ticks on every year, including the empty ones. */
    expect(frame.tickContent).not.toBe('none');
    expect(parseFloat(frame.tickWidth)).toBeGreaterThan(0);
  });

  for (const width of [1440, 1280]) {
    test(`${width}px: every stop label sits below the lane line and its lamp`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');

      const rows = await page.evaluate(() =>
        ['study', 'work'].map((lane) => {
          const list = document.querySelector(`#now .tl-lane-${lane} .tl-stops`) as HTMLElement;
          const cs = getComputedStyle(list, '::before');
          const box = list.getBoundingClientRect();
          const lineTop = box.top + (parseFloat(cs.top) || 0);
          const lineBottom = lineTop + (parseFloat(cs.height) || 1);
          const lamp = list.querySelector('.stop .lamp')!.getBoundingClientRect();
          const body = list.querySelector('.stop .stop-body')!.getBoundingClientRect();
          return { lane, lineBottom, lampBottom: lamp.top + lamp.height, bodyTop: body.top };
        }),
      );

      for (const row of rows) {
        expect(row.bodyTop, `${row.lane} label overlaps the lane line`).toBeGreaterThanOrEqual(
          row.lineBottom - 0.5,
        );
        expect(row.bodyTop, `${row.lane} label overlaps its lamp`).toBeGreaterThanOrEqual(
          row.lampBottom - 0.5,
        );
      }
    });
  }

  test('gives the two 2026 labels their own rows with a gap', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const bodies = await page.locator('#now .tl-lane-study .stop[data-year="2026"] .stop-body').evaluateAll((items) =>
      items.map((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom };
      }),
    );
    expect(bodies).toHaveLength(2);
    expect(bodies[1].top - bodies[0].bottom, 'the stacked 2026 labels overlap or touch').toBeGreaterThanOrEqual(8);
  });

  test('caps the B.Sc. bar at both ends', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const ends = await page.locator('#now .stop.is-span').evaluate((li) => {
      const bar = li.querySelector('.stop-span')!.getBoundingClientRect();
      const cap = li.querySelector('.stop-end-cap')!.getBoundingClientRect();
      return {
        barRight: bar.right,
        capCentre: cap.left + cap.width / 2,
        capTop: cap.top,
        capHeight: cap.height,
      };
    });
    expect(ends.capHeight).toBeGreaterThan(0);
    expect(Math.abs(ends.capCentre - ends.barRight)).toBeLessThanOrEqual(2);
  });

  test('shows two lanes and no cells', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    await expect(page.locator('#now .tl-lane-title')).toHaveText(['Study', 'Work']);
    await expect(page.locator('#now .now-cell')).toHaveCount(0);
  });

  test('lists every year from the first to the last, once, in equal columns', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const axis = await columns(page);
    expect(axis.map((c) => c.text)).toEqual(['2021', '2022', '2023', '2024', '2025', '2026']);
    expect(new Set(axis.map((c) => c.text)).size).toBe(axis.length);

    const widths = axis.map((c) => c.width);
    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(1);
  });

  test('aligns every year tick with its column and its stops', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const axis = await page.locator('#now .years li').evaluateAll((items) =>
      items.map((li) => {
        const range = document.createRange();
        range.selectNodeContents(li);
        const text = range.getBoundingClientRect();
        const column = li.getBoundingClientRect();
        return {
          text: (li.textContent ?? '').trim(),
          columnLeft: column.left,
          columnRight: column.right,
          textLeft: text.left,
        };
      }),
    );

    /* Each tick label starts at its column's start, like the stops do. A
       right-aligned last tick put 2026's label at the column's end while both
       2026 lamps sat at its start, so the stops read as sitting on 2025. */
    for (const tick of axis) {
      expect(tick.textLeft - tick.columnLeft, `${tick.text} tick is not at its column start`).toBeGreaterThanOrEqual(-1);
      expect(tick.textLeft - tick.columnLeft, `${tick.text} tick is not at its column start`).toBeLessThanOrEqual(1);
    }

    /* The 2026 tick and the 2026 stops share that start line. */
    const lamps = await page.locator('#now .stop[data-year="2026"] .lamp').evaluateAll((items) =>
      items.map((lamp) => lamp.getBoundingClientRect().left),
    );
    const last = axis[axis.length - 1];
    expect(last.text).toBe('2026');
    expect(lamps.length).toBeGreaterThan(0);
    expect(Math.min(...lamps) - last.textLeft, 'the 2026 tick is not above its stops').toBeLessThanOrEqual(1.5);
    expect(Math.min(...lamps)).toBeGreaterThanOrEqual(last.columnLeft - 1);
    expect(Math.max(...lamps)).toBeLessThanOrEqual(last.columnRight + 1);
  });

  test('draws each lane as one continuous line through every stop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    for (const lane of ['study', 'work'] as const) {
      const line = await page.locator(`#now .tl-lane-${lane} .tl-stops`).evaluate((list) => {
        const cs = getComputedStyle(list, '::before');
        const box = list.getBoundingClientRect();
        const lineTop = box.top + (parseFloat(cs.top) || 0);
        const lineHeight = parseFloat(cs.height) || 0;
        const lamps = [...list.querySelectorAll<HTMLElement>(':scope > li .lamp')].map((lamp) => {
          const rect = lamp.getBoundingClientRect();
          return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        });
        return {
          content: cs.content,
          left: cs.left,
          right: cs.right,
          lineCenter: lineTop + lineHeight / 2,
          lamps,
        };
      });

      expect(line.content, `${lane} has no lane line`).not.toBe('none');
      expect(line.left).toBe('0px');
      expect(line.right).toBe('0px');
      expect(line.lamps.length).toBeGreaterThan(0);
      /* Every lamp sits on the one line: the lane is connected, not a set of
         rows with their own stubs. */
      for (const lamp of line.lamps) {
        expect(Math.abs(lamp.y - line.lineCenter), `${lane} lamp is off the line`).toBeLessThanOrEqual(1.5);
      }
    }
  });

  test('puts every dated stop in its own year column', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const axis = await columns(page);
    const byYear = new Map(axis.map((c) => [c.text, c]));

    const stops = await page.locator('#now .stop').evaluateAll((items) =>
      items.map((li) => {
        const rect = li.getBoundingClientRect();
        return {
          year: li.getAttribute('data-year'),
          span: li.classList.contains('is-span'),
          left: rect.left,
          right: rect.right,
          centre: rect.left + rect.width / 2,
        };
      }),
    );

    for (const stop of stops.filter((s) => s.year && !s.span)) {
      const column = byYear.get(stop.year!)!;
      expect(column, `no axis column for ${stop.year}`).toBeTruthy();
      expect(stop.centre, `stop ${stop.year} is not in its column`).toBeGreaterThanOrEqual(column.left - 1);
      expect(stop.centre, `stop ${stop.year} is not in its column`).toBeLessThanOrEqual(column.right + 1);
    }
  });

  test('draws the B.Sc. as one bar from 2021 to 2025 with both ends labelled', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const axis = await columns(page);
    const first = axis[0];
    const last = axis[4];
    expect(first.text).toBe('2021');
    expect(last.text).toBe('2025');

    const bar = await page.locator('#now .stop.is-span').evaluate((li) => {
      const span = li.querySelector<HTMLElement>('.stop-span')!;
      const rect = span.getBoundingClientRect();
      const text = (li.textContent ?? '').replace(/\s+/g, ' ').trim();
      return { left: rect.left, right: rect.right, text };
    });

    expect(bar.left, 'the bar does not start at 2021').toBeLessThanOrEqual(first.left + first.width);
    expect(bar.right, 'the bar does not reach 2025').toBeGreaterThanOrEqual(last.right - 1);
    expect(bar.text).toContain('B.Sc. in CSE, IIUC');
    expect(bar.text).toContain('Aug 2021');
    expect(bar.text).toContain('B.Sc. completed');
    expect(bar.text).toContain('Dec 2025');
  });

  test('puts both M.Engg. stops at 2026 and lights the current one', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const axis = await columns(page);
    const last = axis[5];
    expect(last.text).toBe('2026');

    const stops = await page.locator('#now .tl-lane-study .stop[data-year="2026"]').evaluateAll((items) =>
      items.map((li) => {
        const rect = li.getBoundingClientRect();
        return {
          text: (li.textContent ?? '').replace(/\s+/g, ' ').trim(),
          current: li.classList.contains('is-current'),
          lit: !!li.querySelector('.lamp.is-lit'),
          centre: rect.left + rect.width / 2,
        };
      }),
    );

    expect(stops).toHaveLength(2);
    expect(stops[0].text).toContain('Admitted to M.Engg., CUET');
    expect(stops[1].text).toContain('M.Engg. in CSE, CUET');
    for (const stop of stops) {
      expect(stop.centre).toBeGreaterThanOrEqual(last.left - 1);
      expect(stop.centre).toBeLessThanOrEqual(last.right + 1);
    }

    expect(stops.filter((s) => s.current)).toHaveLength(1);
    expect(stops[1].lit).toBe(true);
    expect(stops[0].lit).toBe(false);
  });

  test('lists the IIUCCPS sub-roles under their parent', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const children = page.locator('#now .stop-child');
    await expect(children).toHaveCount(2);
    await expect(children.first()).toContainText('Bootcamp Coordinator');
    await expect(children.nth(1)).toContainText('Finance Secretary');
  });

  test('stacks into one readable timeline on a phone, in year order', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.locator('#now').scrollIntoViewIfNeeded();

    /* The year ticks have no room to be an axis here, so they give way and each
       stop takes its own row. */
    await expect(page.locator('#now .years')).toBeHidden();
    const directions = await page.locator('#now .tl-stops').evaluateAll((lists) =>
      lists.map((l) => getComputedStyle(l).flexDirection),
    );
    expect(directions.every((d) => d === 'column')).toBe(true);

    /* Every stop is still listed, and the years never go backwards. */
    for (const lane of ['study', 'work'] as const) {
      const years = await page
        .locator(`#now .tl-lane-${lane} .stop`)
        .evaluateAll((items) => items.map((li) => Number(li.getAttribute('data-year'))));
      expect(years.length).toBeGreaterThan(0);
      for (let i = 1; i < years.length; i++) {
        expect(years[i], `${lane} is out of year order`).toBeGreaterThanOrEqual(years[i - 1]);
      }
    }

    /* Both ends of the B.Sc. survive the stacked layout. */
    const bsc = page.locator('#now .stop.is-span');
    await expect(bsc).toContainText('Aug 2021');
    await expect(bsc).toContainText('B.Sc. completed');
    await expect(bsc).toContainText('Dec 2025');

    /* The axis is hidden, so the year has to survive in the stop's own text. */
    const years = page.locator('#now .stop-year');
    await expect(years.first()).toBeVisible();
    const first = await page.locator('#now .stop').first().evaluate((li) => ({
      year: li.getAttribute('data-year'),
      shown: (li.querySelector('.stop-year')?.textContent ?? '').trim(),
    }));
    expect(first.shown).toContain(first.year!);
  });
});
