import { expect, test, type Page } from '@playwright/test';

/*
 * The owner's flowchart brief (2026-11-17): no panel background, every edge visible
 * with a lit trail of the edges already crossed, a speed control and a Reset button.
 * Geometry is asserted here too: the one overlap left on 40c2b5c was the shared
 * departure run out of RannaGhor's Role check.
 */

const DIAGRAMS = [
  { slug: 'relay', path: '/work/relay', firstStatus: 'New ticket submitted', secondStatus: 'Completed on the backup model' },
  { slug: 'rannaghor', path: '/work/rannaghor', firstStatus: 'A request arrives', secondStatus: '403: request refused at the role check' },
];

const panel = (page: Page, slug: string) => page.locator(`.flow-panel[data-diagram="${slug}"]`);

const reveal = async (page: Page, slug: string) => {
  await panel(page, slug).scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
};

/* The page's own background, resolved to the rgb() the browser paints. */
const bg = (page: Page) =>
  page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.color = 'var(--bg)';
    document.body.appendChild(probe);
    const c = getComputedStyle(probe).color;
    probe.remove();
    return c;
  });

const token = (page: Page, slug: string) =>
  panel(page, slug).locator('.flow-h .flow-token').getAttribute('transform');

const trails = (page: Page, slug: string) =>
  panel(page, slug).locator('.flow-edge-lit.is-trail');

for (const d of DIAGRAMS) {
  test.describe(`${d.slug}: diagram surface`, () => {
    test('the panel has no background, and its pills match the page', async ({ page }) => {
      for (const theme of ['dark', 'light'] as const) {
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
        await page.goto(d.path);
        await reveal(page, d.slug);
        const figure = panel(page, d.slug);
        const pageBg = await bg(page);

        const panelBg = await figure.evaluate((el) => getComputedStyle(el).backgroundColor);
        /* Either no fill at all, or exactly the page's ground: nothing of its own. */
        expect([pageBg, 'rgba(0, 0, 0, 0)', 'transparent']).toContain(panelBg);

        const pills = await figure.locator('.flow-edge-pill').evaluateAll((els) =>
          els.map((el) => getComputedStyle(el).fill),
        );
        expect(pills.length).toBeGreaterThan(0);
        for (const fill of pills) expect(fill, `${theme} pill fill`).toBe(pageBg);
      }
    });

    test('every edge is drawn in the track colour, full length, before the token reaches it', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(d.path);
      await reveal(page, d.slug);

      const edges = await panel(page, d.slug).evaluate((el) => {
        const svg = [...el.querySelectorAll('.flow-svg')].find(
          (s) => s.getBoundingClientRect().width > 0,
        ) as SVGSVGElement;
        const probe = document.createElement('div');
        probe.style.color = 'var(--track)';
        document.body.appendChild(probe);
        const track = getComputedStyle(probe).color;
        probe.remove();
        return [...svg.querySelectorAll<SVGPathElement>('path.flow-edge')].map((p) => ({
          id: p.getAttribute('data-edge') ?? '?',
          stroke: getComputedStyle(p).stroke,
          offset: getComputedStyle(p).strokeDashoffset,
          len: p.getTotalLength(),
          track,
        }));
      });

      expect(edges.length).toBeGreaterThan(0);
      for (const e of edges) {
        expect(e.len, `${e.id} has no length`).toBeGreaterThan(10);
        expect(e.stroke, `${e.id} is not in the track colour`).toBe(e.track);
        /* No offset: the base track shows end to end at all times. (Branch edges stay
           dashed, as they are by definition; a dash pattern draws rather than hides.) */
        expect(e.offset, `${e.id} is dashed out`).toMatch(/^(0|0px)$/);
      }
    });

    test('a crossed edge stays lit, the newest brightest, and a restart clears it', async ({
      page,
    }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(d.path);
      await reveal(page, d.slug);

      /* RannaGhor's first run crosses six edges before its closing dwell; three is
         enough to compare a newest with older ones. */
      await expect.poll(async () => trails(page, d.slug).count(), { timeout: 30_000 }).toBeGreaterThanOrEqual(3);

      const lit = await panel(page, d.slug).evaluate((el) => {
        const svg = [...el.querySelectorAll('.flow-svg')].find(
          (s) => s.getBoundingClientRect().width > 0,
        ) as SVGSVGElement;
        const probe = document.createElement('div');
        probe.style.color = 'var(--accent)';
        document.body.appendChild(probe);
        const accent = getComputedStyle(probe).color;
        probe.remove();
        return [...svg.querySelectorAll<SVGPathElement>('.flow-edge-lit.is-trail')].map((p) => ({
          id: p.getAttribute('data-edge-lit') ?? '?',
          accent,
          stroke: getComputedStyle(p).stroke,
          opacity: Number(getComputedStyle(p).opacity),
          newest: p.classList.contains('is-newest'),
        }));
      });

      const newest = lit.filter((l) => l.newest);
      expect(newest.length, 'one newest edge in the trail').toBe(1);
      for (const l of lit) {
        /* Lit means amber, and every older edge is still visible. */
        expect(l.stroke, `${l.id} is not lit`).toBe(l.accent);
        expect(l.opacity, `${l.id} is invisible`).toBeGreaterThan(0);
        if (!l.newest) {
          expect(l.opacity, `${l.id} is not dimmer than the newest`).toBeLessThan(newest[0].opacity);
        }
      }

      /* The natural wrap moves to the second run; 1.5x keeps the wait short. */
      await panel(page, d.slug).locator('.flow-speed-option', { hasText: '1.5x' }).click();
      await expect(panel(page, d.slug).locator('.flow-status')).toHaveText(d.secondStatus, {
        timeout: 60_000,
      });

      /* The trail is of this run only: a restart clears it. The natural wrap is
         timing-fragile in headless Chrome because rAF can be throttled and the
         clock caps each frame at 64ms, stretching a run toward the poll timeout.
         Pause then Reset exercises the same reset path deterministically. */
      await panel(page, d.slug).locator('.flow-pause').click();
      const reset = panel(page, d.slug).locator('.flow-reset');
      await expect(reset).toBeVisible();
      await reset.click();
      await expect.poll(async () => trails(page, d.slug).count(), { timeout: 5_000 }).toBe(0);
    });
  });

  test.describe(`${d.slug}: speed`, () => {
    test('offers 0.75x, 1x and 1.5x, defaults to 1x, and changes the pace', async ({ page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(d.path);
      await reveal(page, d.slug);
      const figure = panel(page, d.slug);

      const options = figure.locator('.flow-speed [role="button"], .flow-speed button');
      await expect(options).toHaveCount(3);
      await expect(options).toHaveText(['0.75x', '1x', '1.5x']);
      await expect(figure.getByRole('button', { name: '1x' })).toHaveAttribute('aria-pressed', 'true');
      await expect(figure.getByRole('button', { name: '0.75x' })).toHaveAttribute('aria-pressed', 'false');

      /* Reset restarts the first run; the lit overlay's own dash offset is the distance
         the token has covered along the first edge, so it measures the clock directly. */
      const progress = async (speed: '1x' | '1.5x', ms: number) => {
        const pause = figure.getByRole('button', { name: /pause the diagram/i });
        if (await pause.isVisible()) await pause.click();
        await figure.getByRole('button', { name: speed, exact: true }).click();
        /* Let the speed click commit before the clock restarts, so the measurement is
           of the chosen speed and not of the old one for a frame. */
        await page.waitForTimeout(80);
        await figure.getByRole('button', { name: /reset the diagram/i }).click();
        const travelled = await figure.evaluate(async (el, windowMs) => {
          const svg = [...el.querySelectorAll('.flow-svg')].find(
            (s) => s.getBoundingClientRect().width > 0,
          ) as SVGSVGElement;
          const first = svg.querySelector<SVGPathElement>('.flow-edge-lit')!;
          const before = parseFloat(first.style.strokeDashoffset);
          await new Promise((r) => setTimeout(r, windowMs));
          const after = parseFloat(first.style.strokeDashoffset);
          return before - after;
        }, ms);
        await figure.getByRole('button', { name: /pause the diagram/i }).click();
        return travelled;
      };

      const slow = await progress('1x', 200);
      const fast = await progress('1.5x', 200);
      const ratio = fast / slow;
      expect(slow, 'the token did not move').toBeGreaterThan(20);
      expect(ratio, `1x covered ${slow.toFixed(1)} units, 1.5x ${fast.toFixed(1)}`).toBeGreaterThan(1.2);
      expect(ratio, `1x covered ${slow.toFixed(1)} units, 1.5x ${fast.toFixed(1)}`).toBeLessThan(1.8);
    });

    test('is operable and announced by keyboard', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(d.path);
      await reveal(page, d.slug);
      const figure = panel(page, d.slug);
      await expect(figure.locator('.flow-speed')).toBeVisible();

      /* Start on the Pause control: Reset is absent while playing, so the next Tab
         lands on the first speed option. */
      await figure.getByRole('button', { name: /pause the diagram/i }).focus();
      await page.keyboard.press('Tab');
      const onSpeed = await page.evaluate(
        () => document.activeElement?.classList.contains('flow-speed-option') ?? false,
      );
      expect(onSpeed, 'the speed control is not reachable by Tab').toBe(true);
      await page.keyboard.press('Enter');
      const pressed = await page.evaluate(() => document.activeElement?.getAttribute('aria-pressed'));
      expect(pressed).toBe('true');
    });
  });

  test.describe(`${d.slug}: reset`, () => {
    test('shows only while paused, and restarts the first run with an empty trail', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(d.path);
      await reveal(page, d.slug);
      const figure = panel(page, d.slug);

      /* Playing: no Reset. */
      await expect(figure.locator('.flow-reset')).toHaveCount(0);
      await expect.poll(async () => trails(page, d.slug).count(), { timeout: 20_000 }).toBeGreaterThanOrEqual(1);

      await figure.getByRole('button', { name: /pause the diagram/i }).click();
      const reset = figure.getByRole('button', { name: /reset the diagram/i });
      await expect(reset).toBeVisible();
      await reset.click();

      /* The trail is gone, the first step is on screen, and it is playing again. */
      await expect(figure.getByRole('button', { name: /pause the diagram/i })).toBeVisible();
      await expect(figure.locator('.flow-reset')).toHaveCount(0);
      await expect(figure.locator('.flow-edge-lit.is-trail')).toHaveCount(0);
      await expect(figure.locator('.flow-status')).toContainText(d.firstStatus);
      await expect.poll(async () => token(page, d.slug), { timeout: 6_000 }).toBeTruthy();
      const from = await token(page, d.slug);
      await expect.poll(async () => (await token(page, d.slug)) !== from, { timeout: 6_000 }).toBe(true);
    });
  });

  test.describe(`${d.slug}: reduced motion`, () => {
    test.use({ reducedMotion: 'reduce' });

    test('offers no animation controls at all', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(d.path);
      await reveal(page, d.slug);
      const figure = panel(page, d.slug);
      await expect(figure).toBeVisible();
      await expect(figure.locator('.flow-pause')).toHaveCount(0);
      await expect(figure.locator('.flow-speed')).toHaveCount(0);
      await expect(figure.locator('.flow-reset')).toHaveCount(0);
      /* The lit layer exists for the live chart only; in the still it is invisible, so
         the picture is the finished-run drawing rather than a frozen trail. */
      const lit = await figure.locator('.flow-edge-lit').evaluateAll((els) =>
        els.map((el) => getComputedStyle(el).opacity),
      );
      expect(lit.length).toBeGreaterThan(0);
      for (const opacity of lit) expect(opacity).toBe('0');
    });
  });
}

/* ---------------------------------------------------------------- geometry */

const WIDTHS = [1440, 1280, 1024, 834, 390];

for (const d of DIAGRAMS) {
  test.describe(`${d.slug}: no two edges run together`, () => {
    for (const width of WIDTHS) {
      test(`${width}px: no edge shares a segment with another, or crosses one`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto(d.path);
        await panel(page, d.slug).scrollIntoViewIfNeeded();

        const shared = await panel(page, d.slug).evaluate((el) => {
          const svg = [...el.querySelectorAll('.flow-svg')].find(
            (s) => s.getBoundingClientRect().width > 0,
          ) as SVGSVGElement;
          const ctm = svg.getScreenCTM()!;
          const toPage = (p: { x: number; y: number }) => ({
            x: ctm.a * p.x + ctm.c * p.y + ctm.e,
            y: ctm.b * p.x + ctm.d * p.y + ctm.f,
          });
          const edges = [...svg.querySelectorAll<SVGPathElement>('path.flow-edge')].map((path) => {
            const len = path.getTotalLength();
            const pts: { x: number; y: number }[] = [];
            for (let t = 0; t <= len; t += 3) pts.push(toPage(path.getPointAtLength(t)));
            pts.push(toPage(path.getPointAtLength(len)));
            return { id: path.getAttribute('data-edge') ?? '?', pts };
          });

          const out: string[] = [];
          for (let i = 0; i < edges.length; i++) {
            for (let j = i + 1; j < edges.length; j++) {
              const A = edges[i];
              const B = edges[j];
              let run = 0;
              let best = Infinity;
              for (const p of A.pts) {
                let near = Infinity;
                for (const q of B.pts) near = Math.min(near, Math.hypot(p.x - q.x, p.y - q.y));
                if (near <= 2) {
                  run += 3;
                  best = Math.min(best, near);
                } else {
                  run = 0;
                }
                if (run > 8) break;
              }
              /* Shared endpoints at a box are allowed; a parallel run over 8px is not. */
              if (run > 8) out.push(`${A.id} ~ ${B.id}, ${best.toFixed(1)}px apart for >8px`);
            }
          }

          /* A perpendicular crossing is the other way two edges collide: one
             horizontal run passes through another's vertical leg. Paths here are only
             `M`, `H` and `V`, so axis-aligned segments are exact. A crossing at a
             shared endpoint (a box border two edges both leave or enter) is not a
             collision, so the point has to be clear of both segments' ends. */
          const segs: { id: string; x1: number; y1: number; x2: number; y2: number }[] = [];
          for (const path of svg.querySelectorAll<SVGPathElement>('path.flow-edge')) {
            const id = path.getAttribute('data-edge') ?? '?';
            const d = path.getAttribute('d') ?? '';
            const cmds = d.match(/[MHV]/g) ?? [];
            const nums = (d.match(/-?[\d.]+/g) ?? []).map(Number);
            let cx = 0;
            let cy = 0;
            let i = 0;
            for (const c of cmds) {
              if (c === 'M') {
                cx = nums[i++];
                cy = nums[i++];
              } else if (c === 'H') {
                const nx = nums[i++];
                segs.push({ id, x1: cx, y1: cy, x2: nx, y2: cy });
                cx = nx;
              } else {
                const ny = nums[i++];
                segs.push({ id, x1: cx, y1: cy, x2: cx, y2: ny });
                cy = ny;
              }
            }
          }
          const nearEnd = (n: number, lo: number, hi: number) =>
            Math.abs(n - lo) < 3 || Math.abs(n - hi) < 3;
          for (let i = 0; i < segs.length; i++) {
            for (let j = i + 1; j < segs.length; j++) {
              const A = segs[i];
              const B = segs[j];
              if (A.id === B.id) continue;
              const aH = Math.abs(A.y2 - A.y1) < 0.01;
              const bH = Math.abs(B.y2 - B.y1) < 0.01;
              if (aH === bH) continue;
              const H = aH ? A : B;
              const V = aH ? B : A;
              const hLo = Math.min(H.x1, H.x2);
              const hHi = Math.max(H.x1, H.x2);
              const vLo = Math.min(V.y1, V.y2);
              const vHi = Math.max(V.y1, V.y2);
              const y = H.y1;
              const x = V.x1;
              if (x <= hLo || x >= hHi || y <= vLo || y >= vHi) continue;
              if (nearEnd(x, hLo, hHi) && nearEnd(y, vLo, vHi)) continue;
              out.push(`${H.id} crosses ${V.id} at (${x.toFixed(0)},${y.toFixed(0)})`);
            }
          }
          return out;
        });

        expect(shared, 'edges sharing a segment or crossing').toEqual([]);
      });
    }

    for (const width of [1440, 1280]) {
      test(`${width}px: the gaps between boxes are even`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto(d.path);
        await panel(page, d.slug).scrollIntoViewIfNeeded();

        const uneven = await panel(page, d.slug).evaluate((el) => {
          const svg = [...el.querySelectorAll('.flow-svg')].find(
            (s) => s.getBoundingClientRect().width > 0,
          ) as SVGSVGElement;
          const rows = new Map<number, DOMRect[]>();
          for (const n of svg.querySelectorAll('.flow-node')) {
            const r = n.querySelector('rect')!.getBoundingClientRect();
            const key = Math.round(r.top);
            rows.set(key, [...(rows.get(key) ?? []), r]);
          }
          const out: string[] = [];
          for (const [top, boxes] of rows) {
            if (boxes.length < 3) continue;
            const sorted = [...boxes].sort((a, b) => a.left - b.left);
            const gaps = sorted.slice(1).map((b, i) => b.left - sorted[i].right);
            const spread = Math.max(...gaps) - Math.min(...gaps);
            if (spread > 1.5) out.push(`row at ${top}: gaps ${gaps.map((g) => g.toFixed(1)).join(', ')}`);
          }
          return out;
        });

        expect(uneven, 'rows with uneven gaps').toEqual([]);
      });
    }
  });

  /* Owner, 2026-11-19: keep the title and status on the left and put Pause,
     Reset and the speed group on the right, flush with the toolbar's inner
     frame. The controls group takes one `--space-3` rhythm inside it and inside
     the speed group; the status is separated from the group by the auto margin,
     so that large space is intentional and is not counted as a control gap. */
  test.describe(`${d.slug}: the toolbar splits left and right`, () => {
    for (const width of [1440, 1280, 1024, 834, 390]) {
      test(`${width}px: title and status left, one controls gap, no overflow`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(d.path);
        await panel(page, d.slug).scrollIntoViewIfNeeded();
        await page.waitForTimeout(250);

        const report = await panel(page, d.slug).evaluate((el) => {
          const head = el.querySelector('.flow-head') as HTMLElement;
          const cs = getComputedStyle(head);
          const hr = head.getBoundingClientRect();
          const inner = {
            left: hr.left + parseFloat(cs.paddingLeft),
            right: hr.right - parseFloat(cs.paddingRight),
          };
          const gap = parseFloat(cs.columnGap) || 0;
          const box = (node: Element) => {
            const r = node.getBoundingClientRect();
            return {
              cls: (node as HTMLElement).className?.toString?.() ?? '',
              left: r.left,
              right: r.right,
              top: r.top,
              bottom: r.bottom,
              width: r.width,
              height: r.height,
            };
          };
          const title = head.querySelector('.flow-title') as HTMLElement;
          const status = head.querySelector('.flow-status') as HTMLElement;
          const controls = head.querySelector('.flow-controls') as HTMLElement;
          const speed = head.querySelector('.flow-speed') as HTMLElement;
          const items = [...head.children].map(box);
          const group = controls ? [...controls.children].map(box) : [];
          const options = speed ? [...speed.children].map(box) : [];
          const gaps = (list: { left: number; right: number }[]) =>
            list.slice(1).map((item, i) => item.left - list[i].right);
          const buttons = [
            ...el.querySelectorAll<HTMLElement>('.flow-pause, .flow-reset, .flow-speed-option'),
          ].map((button) => box(button));
          const overlaps = (a: ReturnType<typeof box>, b: ReturnType<typeof box>) =>
            Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
          const oneRow =
            !!title && !!status && !!controls && overlaps(box(title), box(status)) && overlaps(box(status), box(controls));
          return {
            gap,
            inner,
            items,
            group,
            options,
            groupGaps: gaps(group),
            optionGaps: gaps(options),
            buttons: buttons.map((button) => ({ width: button.width, height: button.height })),
            outside: items.filter((item) => item.left < inner.left - 0.5 || item.right > inner.right + 0.5).map((item) => item.cls),
            oneRow,
            title: box(title),
            status: box(status),
            controls: box(controls),
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          };
        });

        expect(report.items, 'the toolbar is not title, status, controls').toHaveLength(3);
        expect(report.controls, 'the controls group is missing').toBeTruthy();
        /* Pause plus three speed options; Reset only while paused. */
        expect(report.buttons).toHaveLength(4);
        for (const button of report.buttons) {
          expect(button.width, 'a control is under 44px wide').toBeGreaterThanOrEqual(43.5);
          expect(button.height, 'a control is under 44px tall').toBeGreaterThanOrEqual(43.5);
        }
        expect(report.outside, 'toolbar items past the frame').toEqual([]);
        expect(report.overflow).toBeLessThanOrEqual(0);

        /* One rhythm inside the controls group and inside the speed group: the
           toolbar's own gap, not a literal. */
        for (const value of [...report.groupGaps, ...report.optionGaps]) {
          expect(Math.abs(value - report.gap), 'a controls gap is not the toolbar gap').toBeLessThanOrEqual(0.5);
        }
        if (report.groupGaps.length > 0) {
          expect(report.groupGaps.every((value) => value > 0), 'the controls touch').toBe(true);
        }

        if (report.oneRow) {
          expect(
            Math.abs(report.status.left - report.title.right - report.gap),
            'title and status are not one left cluster',
          ).toBeLessThanOrEqual(0.5);
          expect(report.controls.right, 'the controls are not flush with the right inner edge').toBeLessThanOrEqual(
            report.inner.right + 0.5,
          );
          expect(report.controls.right, 'the controls are not flush with the right inner edge').toBeGreaterThanOrEqual(
            report.inner.right - 0.5,
          );
          expect(report.controls.left - report.status.right, 'the auto gap is gone').toBeGreaterThan(report.gap + 1);
        } else {
          expect(report.controls.top, 'the controls did not wrap below the status').toBeGreaterThan(report.status.top);
          expect(report.title.left, 'the title is not on the left edge').toBeLessThanOrEqual(report.inner.left + 0.5);
          expect(report.controls.right, 'the wrapped controls sit past the frame').toBeLessThanOrEqual(
            report.inner.right + 0.5,
          );
        }

        if (width <= 768) {
          expect(report.controls.left, 'the mobile controls are not on the inner left edge').toBeLessThanOrEqual(
            report.inner.left + 0.5,
          );
        }
      });
    }
  });
}
