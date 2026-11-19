import { expect, test } from '@playwright/test';

/* The Now panel is one chronological timeline: a central horizontal spine with
 * six real stops alternating above and below it. Odd indexes sit above the
 * spine (body, stem, outer ring) and their year below it; even indexes mirror
 * that below. The two current 2026 stops are lit amber.
 *
 * It replaces the two-lane layout of 2026-11-17, whose tests pinned a shared
 * year ruler, a B.Sc. span bar and two lane headings. */

const WIDTHS = [360, 390, 430, 768, 834, 1024, 1280, 1440, 1600];

const LABELS = [
  'B.Sc. in CSE, IIUC',
  'Trainer & Mentor, IIUCCPS',
  'B.Sc. completed',
  'Admitted to M.Engg., CUET',
  'Web Developer, Taibah Academy',
  'M.Engg. in CSE, CUET',
];

test.describe('the Now timeline', () => {
  for (const width of WIDTHS) {
    test(`has no overlapping label at ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await page.locator('#now').scrollIntoViewIfNeeded();

      const result = await page.evaluate(() => {
        const labels = [
          ...document.querySelectorAll(
            '#now .stop-label, #now .stop-date, #now .stop-child, #now .stop-year, #now .stop-lane',
          ),
        ]
          .map((el) => ({ text: (el.textContent ?? '').trim(), rect: el.getBoundingClientRect() }))
          .filter((o) => o.rect.width > 1);
        const overlaps: string[] = [];
        for (let i = 0; i < labels.length; i++) {
          for (let j = i + 1; j < labels.length; j++) {
            const a = labels[i].rect;
            const b = labels[j].rect;
            if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) {
              overlaps.push(`${labels[i].text} | ${labels[j].text}`);
            }
          }
        }
        const panel = document.querySelector('#now')!.getBoundingClientRect();
        const spill = labels
          .filter((o) => o.rect.right > panel.right + 1 || o.rect.left < panel.left - 1)
          .map((o) => o.text);
        const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
        return { overlaps, spill, overflow };
      });

      expect(result.overlaps, `labels overlapping at ${width}px`).toEqual([]);
      expect(result.spill, `labels past the panel at ${width}px`).toEqual([]);
      expect(result.overflow).toBeLessThanOrEqual(0);
    });
  }

  test('draws one continuous spine with end caps across the timeline', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const report = await page.evaluate(() => {
      const spine = document.querySelector('#now .tl-spine') as HTMLElement;
      const timeline = document.querySelector('#now .timeline') as HTMLElement;
      const s = spine.getBoundingClientRect();
      const t = timeline.getBoundingClientRect();
      const before = getComputedStyle(spine, '::before');
      const after = getComputedStyle(spine, '::after');
      return {
        spine: { left: s.left, right: s.right, height: s.height, width: s.width },
        timeline: { left: t.left, right: t.right },
        before: { content: before.content, width: parseFloat(before.width), height: parseFloat(before.height) },
        after: { content: after.content, width: parseFloat(after.width), height: parseFloat(after.height) },
      };
    });

    expect(report.spine.width, 'the spine is not horizontal').toBeGreaterThan(500);
    expect(report.spine.height, 'the spine is thicker than a hairline').toBeLessThanOrEqual(2);
    expect(Math.abs(report.spine.left - report.timeline.left), 'the spine misses the left edge').toBeLessThanOrEqual(1);
    expect(Math.abs(report.spine.right - report.timeline.right), 'the spine misses the right edge').toBeLessThanOrEqual(1);
    for (const cap of [report.before, report.after]) {
      expect(cap.content, 'an end cap is not drawn').not.toBe('none');
      expect(cap.width, 'an end cap has no width').toBeGreaterThan(0);
      expect(cap.height, 'an end cap has no height').toBeGreaterThan(0);
    }
  });

  /* The caps belong inside the spine, not half over its ends, and stop 1 must
     read as a station after the start cap rather than a double blob on it. The
     reference keeps a run of spine between the cap and the first node. */
  for (const width of [834, 1024, 1280, 1440]) {
    test(`${width}px: both caps stay inside the spine and clear of Stop 1`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');

      const report = await page.evaluate(() => {
        const spine = document.querySelector('#now .tl-spine') as HTMLElement;
        const timeline = document.querySelector('#now .timeline') as HTMLElement;
        const s = spine.getBoundingClientRect();
        const t = timeline.getBoundingClientRect();
        /* The caps carry a vertical centring transform; read its translateX so
           a negative offset cannot hide an overhang. */
        const translateX = (value: string) => {
          const matrix = value.match(/matrix\(([^)]+)\)/);
          return matrix ? parseFloat(matrix[1].split(',')[4]) : 0;
        };
        const cap = (side: '::before' | '::after') => {
          const cs = getComputedStyle(spine, side);
          const left = s.left + parseFloat(cs.left) + translateX(cs.transform);
          return { left, right: left + parseFloat(cs.width), width: parseFloat(cs.width) };
        };
        const first = document.querySelector('#now .stop:first-child .stop-node')!.getBoundingClientRect();
        const last = document.querySelector('#now .stop:last-child .stop-node')!.getBoundingClientRect();
        const root = getComputedStyle(document.documentElement);
        return {
          timeline: { left: t.left, right: t.right },
          spine: { left: s.left, right: s.right },
          before: cap('::before'),
          after: cap('::after'),
          gap: parseFloat(root.getPropertyValue('--space-2')) * parseFloat(root.fontSize),
          firstNodeLeft: first.left,
          lastNodeRight: last.right,
        };
      });

      for (const cap of [report.before, report.after]) {
        expect.soft(cap.left, 'a cap starts outside the spine').toBeGreaterThanOrEqual(report.spine.left - 0.5);
        expect.soft(cap.right, 'a cap ends outside the spine').toBeLessThanOrEqual(report.spine.right + 0.5);
        expect.soft(cap.left, 'a cap starts outside the timeline').toBeGreaterThanOrEqual(report.timeline.left - 0.5);
        expect.soft(cap.right, 'a cap ends outside the timeline').toBeLessThanOrEqual(report.timeline.right + 0.5);
      }
      expect.soft(
        report.firstNodeLeft - report.before.right,
        'stop 1 node is not clear of the start cap',
      ).toBeGreaterThanOrEqual(report.gap - 0.5);
      expect.soft(
        report.after.left - report.lastNodeRight,
        'stop 6 node is not clear of the end cap',
      ).toBeGreaterThanOrEqual(report.gap - 0.5);
    });
  }

  test('lists six real stops in chronological order, alternating above and below', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const stops = await page.locator('#now .stop').evaluateAll((items) =>
      items.map((li) => ({
        label: (li.querySelector('.stop-label')?.textContent ?? '').trim(),
        year: li.getAttribute('data-year'),
        lane: li.getAttribute('data-lane'),
        track: li.classList.contains('is-up') ? 'up' : li.classList.contains('is-down') ? 'down' : '',
      })),
    );

    expect(stops.map((s) => s.label)).toEqual(LABELS);
    expect(stops.map((s) => s.year)).toEqual(['2021', '2023', '2025', '2026', '2026', '2026']);
    expect(stops.map((s) => s.lane)).toEqual(['study', 'work', 'study', 'study', 'work', 'study']);
    expect(stops.map((s) => s.track)).toEqual(['up', 'down', 'up', 'down', 'up', 'down']);
    await expect(page.locator('#now ol.tl-stops')).toHaveCount(1);
    await expect(page.locator('#now .years, #now .tl-lane-title')).toHaveCount(0);
  });

  test('puts each year on the opposite side of the spine from its stem', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const report = await page.evaluate(() => {
      const spine = document.querySelector('#now .tl-spine')!.getBoundingClientRect();
      const stops = [...document.querySelectorAll<HTMLElement>('#now .stop')].map((li) => {
        const stop = li.getBoundingClientRect();
        const year = li.querySelector('.stop-year')!.getBoundingClientRect();
        return {
          track: li.classList.contains('is-up') ? 'up' : 'down',
          shown: (li.querySelector('.stop-year')?.textContent ?? '').trim(),
          dataYear: li.getAttribute('data-year'),
          stopLeft: stop.left,
          stopRight: stop.right,
          yearLeft: year.left,
          yearRight: year.right,
          yearTop: year.top,
          yearBottom: year.bottom,
        };
      });
      return { spineTop: spine.top, spineBottom: spine.bottom, stops };
    });

    for (const stop of report.stops) {
      expect(stop.shown, 'the year does not match the stop').toBe(stop.dataYear);
      if (stop.track === 'up') {
        expect(stop.yearTop, `${stop.shown} is not below the spine`).toBeGreaterThanOrEqual(
          report.spineBottom - 0.5,
        );
      } else {
        expect(stop.yearBottom, `${stop.shown} is not above the spine`).toBeLessThanOrEqual(
          report.spineTop + 0.5,
        );
      }
      expect(stop.yearLeft, `${stop.shown} is outside its column`).toBeGreaterThanOrEqual(stop.stopLeft - 1);
      expect(stop.yearRight, `${stop.shown} is outside its column`).toBeLessThanOrEqual(stop.stopRight + 1);
    }
  });

  test('puts every node on the spine and connects it to its outer ring and body', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const report = await page.evaluate(() => {
      const spine = document.querySelector('#now .tl-spine')!.getBoundingClientRect();
      const stops = [...document.querySelectorAll<HTMLElement>('#now .stop')].map((li) => {
        const box = (el: Element) => {
          const r = el.getBoundingClientRect();
          return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
        };
        return {
          track: li.classList.contains('is-up') ? 'up' : 'down',
          label: (li.querySelector('.stop-label')?.textContent ?? '').trim(),
          column: box(li),
          node: box(li.querySelector('.stop-node')!),
          outer: box(li.querySelector('.stop-outer')!),
          stem: box(li.querySelector('.stop-stem')!),
          body: box(li.querySelector('.stop-body')!),
        };
      });
      return { centre: spine.top + spine.height / 2, stops };
    });

    for (const stop of report.stops) {
      const nodeX = stop.node.left + stop.node.width / 2;
      const nodeY = stop.node.top + stop.node.height / 2;
      expect(Math.abs(nodeY - report.centre), `${stop.label} node is off the spine`).toBeLessThanOrEqual(1.5);
      expect(nodeX, `${stop.label} node is outside its column`).toBeGreaterThanOrEqual(stop.column.left - 1);
      expect(nodeX, `${stop.label} node is outside its column`).toBeLessThanOrEqual(stop.column.right + 1);
      expect(stop.stem.width, `${stop.label} stem is not a hairline`).toBeLessThanOrEqual(2);
      expect(stop.stem.height, `${stop.label} stem is too short`).toBeGreaterThanOrEqual(30);

      if (stop.track === 'up') {
        expect(stop.outer.bottom, `${stop.label} outer ring is below its node`).toBeLessThanOrEqual(stop.node.top + 0.5);
        expect(stop.stem.top, `${stop.label} stem does not reach its ring`).toBeLessThanOrEqual(stop.outer.top + 0.5);
        expect(stop.stem.bottom, `${stop.label} stem does not reach the spine`).toBeGreaterThanOrEqual(
          stop.node.top - 0.5,
        );
        expect(stop.body.bottom, `${stop.label} body is not beyond its ring`).toBeLessThanOrEqual(
          stop.outer.top + 0.5,
        );
      } else {
        expect(stop.outer.top, `${stop.label} outer ring is above its node`).toBeGreaterThanOrEqual(
          stop.node.bottom - 0.5,
        );
        expect(stop.stem.top, `${stop.label} stem does not reach the spine`).toBeLessThanOrEqual(
          stop.node.bottom + 0.5,
        );
        expect(stop.stem.bottom, `${stop.label} stem does not reach its ring`).toBeGreaterThanOrEqual(
          stop.outer.bottom - 0.5,
        );
        expect(stop.body.top, `${stop.label} body is not beyond its ring`).toBeGreaterThanOrEqual(
          stop.outer.bottom - 0.5,
        );
      }
    }
  });

  test('lights the two current 2026 stops and leaves the past stops in ink', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const tokens = await page.evaluate(() => {
      const probe = document.createElement('span');
      document.body.append(probe);
      probe.style.color = 'var(--accent-text)';
      const accentText = getComputedStyle(probe).color;
      probe.style.color = 'var(--accent)';
      const accent = getComputedStyle(probe).color;
      probe.style.color = 'var(--ink)';
      const ink = getComputedStyle(probe).color;
      probe.style.border = '1px solid var(--rule-strong)';
      const ruleStrong = getComputedStyle(probe).borderTopColor;
      probe.remove();
      return { accentText, accent, ink, ruleStrong };
    });

    const stops = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('#now .stop')].map((li) => {
        const read = (selector: string, property: 'color' | 'background-color' | 'border-top-color') =>
          getComputedStyle(li.querySelector(selector)!).getPropertyValue(property);
        return {
          label: (li.querySelector('.stop-label')?.textContent ?? '').trim(),
          current: li.classList.contains('is-current'),
          labelColor: read('.stop-label', 'color'),
          yearColor: read('.stop-year', 'color'),
          nodeBackground: read('.stop-node', 'background-color'),
          nodeBorder: read('.stop-node', 'border-top-color'),
          outerBackground: read('.stop-outer', 'background-color'),
          outerBorder: read('.stop-outer', 'border-top-color'),
          stemBackground: read('.stop-stem', 'background-color'),
        };
      }),
    );

    const current = stops.filter((s) => s.current);
    expect(current.map((s) => s.label)).toEqual(['Web Developer, Taibah Academy', 'M.Engg. in CSE, CUET']);
    for (const stop of current) {
      expect(stop.labelColor, `${stop.label} label is not amber text`).toBe(tokens.accentText);
      expect(stop.yearColor, `${stop.label} year is not amber text`).toBe(tokens.accentText);
      expect(stop.nodeBackground, `${stop.label} node is not lit`).toBe(tokens.accent);
      expect(stop.nodeBorder, `${stop.label} node edge is not amber`).toBe(tokens.accent);
      expect(stop.outerBackground, `${stop.label} outer dot is not lit`).toBe(tokens.accent);
      expect(stop.outerBorder, `${stop.label} outer edge is not amber`).toBe(tokens.accent);
      expect(stop.stemBackground, `${stop.label} stem is not lit`).toBe(tokens.accent);
    }

    const past = stops.find((s) => !s.current)!;
    expect(past.labelColor, 'a past stop is not ink').toBe(tokens.ink);
    expect(past.nodeBorder, 'a past node is not a hairline rule').toBe(tokens.ruleStrong);
  });

  test('lists the IIUCCPS sub-roles under their dated parent', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const trainer = page.locator('#now .stop').filter({ has: page.locator('.stop-label', { hasText: 'Trainer & Mentor' }) });
    await expect(trainer).toHaveCount(1);
    const children = trainer.locator('.stop-child');
    await expect(children).toHaveCount(2);
    await expect(children.nth(0)).toHaveText('Bootcamp Coordinator, IIUCCPS');
    await expect(children.nth(1)).toHaveText('Finance Secretary, IIUCCPS');
  });

  test('stacks into one vertical left-spine timeline on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.locator('#now').scrollIntoViewIfNeeded();

    const report = await page.evaluate(() => {
      const timeline = document.querySelector('#now .timeline') as HTMLElement;
      const style = getComputedStyle(timeline);
      const spine = document.querySelector('#now .tl-spine')!.getBoundingClientRect();
      const firstYear = document.querySelector('#now .stop-year')!.getBoundingClientRect();
      const stops = [...document.querySelectorAll<HTMLElement>('#now .stop')].map((li) => {
        const box = li.getBoundingClientRect();
        const year = li.querySelector('.stop-year') as HTMLElement;
        return {
          top: box.top,
          bottom: box.bottom,
          year: (year.textContent ?? '').trim(),
          yearVisible: getComputedStyle(year).display !== 'none' && year.getBoundingClientRect().height > 0,
        };
      });
      const hidden = (selector: string) =>
        [...document.querySelectorAll<HTMLElement>(`#now ${selector}`)].every(
          (el) => getComputedStyle(el).display === 'none' || el.getBoundingClientRect().width === 0,
        );
      return {
        display: style.display,
        direction: style.flexDirection,
        spine: { width: spine.width, height: spine.height, left: spine.left },
        firstYearLeft: firstYear.left,
        stemsHidden: hidden('.stop-stem'),
        outersHidden: hidden('.stop-outer'),
        stops,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });

    expect(report.display, 'the timeline is not a stack').toBe('flex');
    expect(report.direction).toBe('column');
    expect(report.spine.width, 'the mobile spine is not vertical').toBeLessThanOrEqual(2);
    expect(report.spine.height, 'the mobile spine is too short').toBeGreaterThan(100);
    expect(report.spine.left, 'the mobile spine is not left of the text').toBeLessThan(report.firstYearLeft);
    expect(report.stemsHidden, 'a desktop stem survived the mobile stack').toBe(true);
    expect(report.outersHidden, 'a desktop outer ring survived the mobile stack').toBe(true);
    expect(report.overflow).toBeLessThanOrEqual(0);

    for (let i = 0; i < report.stops.length; i++) {
      const stop = report.stops[i];
      expect(stop.yearVisible, `the year is hidden on stop ${i + 1}`).toBe(true);
      if (i > 0) {
        expect(stop.top, `stop ${i + 1} is not on its own row`).toBeGreaterThanOrEqual(
          report.stops[i - 1].bottom - 1,
        );
        expect(Number(stop.year), 'the years go backwards').toBeGreaterThanOrEqual(
          Number(report.stops[i - 1].year),
        );
      }
    }
    expect(report.stops.map((s) => s.year)).toEqual(['2021', '2023', '2025', '2026', '2026', '2026']);
  });
});
