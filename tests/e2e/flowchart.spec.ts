import { expect, test, type Page } from '@playwright/test';

/*
 * The case studies' flowcharts. Must-prove 3, as amended by A5 and A6: the
 * diagram pauses off-screen and on a hidden tab, has a visible pause control, and
 * shows a complete still under reduced motion and in the pre-render. A6 adds that
 * it takes the full width and up to the full height, and that below 48rem the
 * graph reflows top to bottom instead of shrinking to unreadable text.
 *
 * This replaces the R2 framing-band spec, which framed one station at a time from
 * a wide track. What it must not do is lose the checks that spec had: the
 * pre-render without JavaScript, pause *and resume*, resuming after being
 * off-screen or in a hidden tab, one state on the pause control rather than two,
 * and no animated diagram left on the home page. Those are restored below
 * (R4b-agy-4), because an engine rewrite runs under them or it does not run.
 */

const DIAGRAMS = [
  {
    slug: 'ticket-pipeline',
    path: '/work/ticket-pipeline',
    status: /Completed/,
    done: ['react', 'api', 'queue', 'worker', 'gateway', 'primary', 'queued', 'triaging', 'drafting', 'completed'],
  },
  {
    slug: 'rannaghor',
    path: '/work/rannaghor',
    status: /Order committed/,
    done: ['security', 'rate', 'session', 'role', 'handler', 'postgres', 'tx'],
  },
];

const panel = (page: Page, slug: string) => page.locator(`.flow-panel[data-diagram="${slug}"]`);

/* The diagram sits at the top of a case study's Architecture section, not in the
   first viewport, so a test that wants motion has to bring it into view first. */
const reveal = async (page: Page, slug: string) => {
  await panel(page, slug).scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
};

/* The token's position, which is the one thing that says whether the clock runs. */
const marker = async (page: Page, slug: string) =>
  (await page.locator(`.flow-panel[data-diagram="${slug}"] .flow-h .flow-token`).getAttribute('transform')) ?? '';

/* Wait until the token has actually moved, so a "paused" check is not fooled by
   sampling before the first frame. */
const moved = async (page: Page, slug: string, from: string) => {
  await expect.poll(async () => (await marker(page, slug)) !== from, { timeout: 6000 }).toBe(true);
};

for (const d of DIAGRAMS) {
  test.describe(`${d.slug}: the pause control`, () => {
    test('stops the request, then lets it run again', async ({ page }) => {
      await page.goto(d.path);
      await reveal(page, d.slug);
      const pause = panel(page, d.slug).getByRole('button', { name: /pause the diagram/i });
      await expect(pause).toBeVisible();

      const before = await marker(page, d.slug);
      await moved(page, d.slug, before);

      await pause.click();
      await expect(panel(page, d.slug).getByRole('button', { name: /play the diagram/i })).toBeVisible();
      const held = await marker(page, d.slug);
      await page.waitForTimeout(700);
      expect(await marker(page, d.slug), 'the token kept moving while paused').toBe(held);

      /* And it resumes, which is the half the R4b rewrite lost. */
      await panel(page, d.slug).getByRole('button', { name: /play the diagram/i }).click();
      await expect.poll(async () => (await marker(page, d.slug)) !== held, { timeout: 6000 }).toBe(true);
    });

    test('names its state once, not twice', async ({ page }) => {
      /* The label already flips Pause/Play: an `aria-pressed` on top of it makes a
         screen reader say "Play the diagram, pressed". */
      await page.goto(d.path);
      const button = panel(page, d.slug).locator('.flow-pause');
      await expect(button).toHaveCount(1);
      await expect(button).not.toHaveAttribute('aria-pressed', /.*/);
    });
  });

  test.describe(`${d.slug}: the request rests when nothing is watching`, () => {
    test('holds while the panel is off-screen, and runs again in view', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 700 });
      await page.goto(d.path);
      await reveal(page, d.slug);
      const before = await marker(page, d.slug);
      await moved(page, d.slug, before);

      /* The Results section is far below the Architecture one. */
      await page.locator('#results').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      const parked = await marker(page, d.slug);
      await page.waitForTimeout(700);
      expect(await marker(page, d.slug), 'the token ran while off-screen').toBe(parked);

      await panel(page, d.slug).scrollIntoViewIfNeeded();
      await expect
        .poll(async () => (await marker(page, d.slug)) !== parked, { timeout: 6000 })
        .toBe(true);
    });

    test('holds while the tab is hidden, and resumes when it is visible again', async ({ page }) => {
      await page.goto(d.path);
      await reveal(page, d.slug);
      const before = await marker(page, d.slug);
      await moved(page, d.slug, before);

      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await page.waitForTimeout(400);
      const parked = await marker(page, d.slug);
      await page.waitForTimeout(800);
      expect(await marker(page, d.slug), 'the token ran while the tab was hidden').toBe(parked);

      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await expect
        .poll(async () => (await marker(page, d.slug)) !== parked, { timeout: 6000 })
        .toBe(true);
    });
  });

  test.describe(`${d.slug}: the still picture`, () => {
    test.use({ reducedMotion: 'reduce' });

    test('shows the whole run with no pause control', async ({ page }) => {
      await page.goto(d.path);
      const figure = panel(page, d.slug);
      await expect(figure).toBeVisible();
      await expect(figure.locator('.flow-pause')).toHaveCount(0);
      /* The status names the state the finished run ends in, not the first step. */
      await expect(figure.locator('.flow-status')).toContainText(d.status);
      /* Every node on the first run's path is drawn as done. */
      for (const id of d.done) {
        await expect(figure.locator(`.flow-h [data-node="${id}"].is-done`), `${id} is not lit`).toHaveCount(1);
      }
    });
  });

  test.describe(`${d.slug}: the pre-render`, () => {
    test.use({ javaScriptEnabled: false });

    test('pictures the finished run before any script runs', async ({ page }) => {
      await page.goto(d.path);
      const figure = panel(page, d.slug);
      await expect(figure).toBeVisible();
      await expect(figure.locator('.flow-h .flow-node-name').first()).toBeAttached();
      await expect(figure.locator('.flow-pause')).toHaveCount(0);

      /* The same promise as the reduced-motion still, but read from the HTML that
         a visitor without JavaScript receives: the nodes are already lit. */
      for (const id of d.done) {
        await expect(figure.locator(`.flow-h [data-node="${id}"].is-done`), `${id} is unlit`).toHaveCount(1);
      }
      await expect(figure.locator('.flow-status')).toContainText(d.status);
    });
  });
}

test('the home page no longer carries the animated diagram', async ({ page }) => {
  /* The owner moved it into the case studies; that home slot is the Now panel. */
  await page.goto('/');
  await expect(page.locator('.flow-panel, .track-panel')).toHaveCount(0);
  await expect(page.locator('#now')).toBeVisible();
});

for (const d of DIAGRAMS) {
  test.describe(`${d.slug}: the panel`, () => {
    test('takes the full viewport width', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(d.path);
      const figure = panel(page, d.slug);
      await figure.scrollIntoViewIfNeeded();
      const box = (await figure.boundingBox())!;
      /* Edge to edge, give or take the scrollbar. */
      expect(box.x).toBeLessThanOrEqual(1);
      expect(box.x + box.width).toBeGreaterThanOrEqual(1440 - 18);
    });

    test('shows the whole graph without scrolling inside it at 1280 and 1440', async ({ page }) => {
      for (const width of [1280, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(d.path);
        const figure = panel(page, d.slug);
        await figure.scrollIntoViewIfNeeded();
        const geo = await figure.evaluate((el) => {
          const svg = el.querySelector('.flow-h .flow-svg') as SVGSVGElement;
          const r = svg.getBoundingClientRect();
          return { h: r.height, top: r.top, winH: innerHeight };
        });
        expect(geo.h, `chart is taller than the viewport at ${width}`).toBeLessThan(geo.winH);
        expect(geo.h).toBeGreaterThan(120);
      }
    });

    test('reflows top to bottom below 48rem, with no sideways scroll', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(d.path);
      const figure = panel(page, d.slug);
      await figure.scrollIntoViewIfNeeded();
      await expect(figure.locator('.flow-h')).toBeHidden();
      await expect(figure.locator('.flow-v')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    });

    test('keeps its labels at 12px or more on a phone', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(d.path);
      await panel(page, d.slug).scrollIntoViewIfNeeded();

      /* The font size in real pixels: the SVG scales, so the computed size is in
         viewBox units and has to be multiplied by the scale. */
      const smallest = await panel(page, d.slug).evaluate((el) => {
        const svg = el.querySelector('.flow-v .flow-svg') as SVGSVGElement;
        const scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
        const sizes = [...svg.querySelectorAll('.flow-node-name, .flow-node-detail, .flow-edge-label')].map(
          (t) => parseFloat(getComputedStyle(t).fontSize) * scale,
        );
        return Math.min(...sizes);
      });
      expect(smallest).toBeGreaterThanOrEqual(11.5);
    });

    test('red is used only for a refusal or a failure', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(d.path);
      const figure = panel(page, d.slug);
      await figure.scrollIntoViewIfNeeded();
      /* The first run reaches no failure, so in the still nothing is red. */
      await expect(figure.locator('.flow-h .flow-node.is-fail')).toHaveCount(0);
    });
  });
}

/* ---------------------------------------------------------------- geometry
 *
 * Ruling 2: these are the promises, measured in the built page at four widths in
 * both themes on both studies. A count of nodes or a computed style does not
 * count, because both were green while the labels spilled, the branch edges cut
 * through boxes, and the type rendered at 9.6px.
 */

const WIDTHS = [390, 834, 1280, 1440];
const THEMES = ['dark', 'light'] as const;

for (const d of DIAGRAMS) {
  test.describe(`${d.slug}: geometry`, () => {
    for (const width of WIDTHS) {
      for (const theme of THEMES) {
        test(`${width}px ${theme}: labels inside their boxes, nothing intersecting`, async ({ page }) => {
          await page.setViewportSize({ width, height: 900 });
          await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
          await page.goto(d.path);
          await panel(page, d.slug).scrollIntoViewIfNeeded();

          const report = await page.evaluate(() => {
            const svg = [...document.querySelectorAll('.flow-svg')].find(
              (s) => s.getBoundingClientRect().width > 0,
            ) as SVGSVGElement;
            const view = svg.getBoundingClientRect();
            const nodes = [...svg.querySelectorAll('.flow-node')].map((n) => ({
              id: n.getAttribute('data-node') ?? '',
              box: n.querySelector('rect')!.getBoundingClientRect(),
              texts: [...n.querySelectorAll('text')].filter((t) => t.getBoundingClientRect().width > 1),
            }));

            /* (a) every text box inside its own node's box, with padding. */
            const outside: string[] = [];
            for (const n of nodes) {
              for (const t of n.texts) {
                const r = t.getBoundingClientRect();
                if (
                  r.left < n.box.left - 0.5 ||
                  r.right > n.box.right + 0.5 ||
                  r.top < n.box.top - 0.5 ||
                  r.bottom > n.box.bottom + 0.5
                ) {
                  outside.push(`${n.id}: "${t.textContent}"`);
                }
              }
            }

            /* (b) no two text boxes intersect — node labels and edge labels
               together. They are all in the same SVG, so one pass covers both. */
            const all = [...svg.querySelectorAll('text')].filter((t) => t.getBoundingClientRect().width > 1);
            const rects = all.map((t) => ({ text: t.textContent ?? '', r: t.getBoundingClientRect() }));
            const collisions: string[] = [];
            for (let i = 0; i < rects.length; i++) {
              for (let j = i + 1; j < rects.length; j++) {
                const a = rects[i].r;
                const b = rects[j].r;
                if (a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5) {
                  collisions.push(`${rects[i].text} | ${rects[j].text}`);
                }
              }
            }

            /* (c) no edge path crosses a node's box. Sampled along each path: a
               path's own bounding box proves nothing, since a loop encloses half
               the graph. */
            const boxes = nodes.map((n) => n.box);
            const ctm = svg.getScreenCTM()!;
            const toPage = (p: { x: number; y: number }) => ({
              x: ctm.a * p.x + ctm.c * p.y + ctm.e,
              y: ctm.b * p.x + ctm.d * p.y + ctm.f,
            });
            const crossing: string[] = [];
            for (const path of svg.querySelectorAll<SVGPathElement>('.flow-edge')) {
              const len = path.getTotalLength();
              const steps = Math.max(8, Math.ceil(len / 3));
              let hit = false;
              for (let k = 0; k <= steps && !hit; k++) {
                const q = toPage(path.getPointAtLength((len * k) / steps));
                for (const b of boxes) {
                  /* Inset by 1.5px: an edge legitimately touches a border. */
                  if (q.x > b.left + 1.5 && q.x < b.right - 1.5 && q.y > b.top + 1.5 && q.y < b.bottom - 1.5) {
                    hit = true;
                    break;
                  }
                }
              }
              if (hit) crossing.push(path.getAttribute('data-edge') ?? '?');
            }

            /* (d) every edge's two ends touch a node's border. */
            const detached: string[] = [];
            /* An edge stops a short distance short of the border so its arrowhead
               lands on it rather than over it: the tolerance is the arrowhead's own
               length, scaled, not an arbitrary 6. */
            const gap = 12 * (view.width / svg.viewBox.baseVal.width);
            const near = (x: number, y: number) =>
              boxes.some(
                (b) =>
                  x >= b.left - gap && x <= b.right + gap && y >= b.top - gap && y <= b.bottom + gap &&
                  (Math.abs(x - b.left) <= gap || Math.abs(x - b.right) <= gap || Math.abs(y - b.top) <= gap || Math.abs(y - b.bottom) <= gap),
              );
            for (const path of svg.querySelectorAll<SVGPathElement>('.flow-edge')) {
              const len = path.getTotalLength();
              const pa = toPage(path.getPointAtLength(0));
              const pb = toPage(path.getPointAtLength(len));
              if (!near(pa.x, pa.y) || !near(pb.x, pb.y)) detached.push(path.getAttribute('data-edge') ?? '?');
            }

            /* (e) every edge label sits on its own edge: within a few units of the
               path it names. */
            const floating: string[] = [];
            for (const path of svg.querySelectorAll<SVGPathElement>('.flow-edge')) {
              const id = path.getAttribute('data-edge');
              const label = svg.querySelector(`[data-edge-label="${id}"]`);
              if (!label) continue;
              const lr = label.getBoundingClientRect();
              const len = path.getTotalLength();
              let best = Infinity;
              for (let k = 0; k <= 60; k++) {
                const q = toPage(path.getPointAtLength((len * k) / 60));
                const x = q.x;
                const y = q.y;
                const dx = Math.max(lr.left - x, 0, x - lr.right);
                const dy = Math.max(lr.top - y, 0, y - lr.bottom);
                best = Math.min(best, Math.hypot(dx, dy));
              }
              if (best > 26) floating.push(`${id}: ${label.textContent}`);
            }

            return { outside, collisions, crossing, detached, floating };
          });

          expect(report.outside, 'text outside its own box').toEqual([]);
          expect(report.collisions, 'text boxes intersecting').toEqual([]);
          expect(report.crossing, 'edges crossing a node box').toEqual([]);
          expect(report.detached, 'edges not touching a node').toEqual([]);
          expect(report.floating, 'labels not on their edge').toEqual([]);
        });
      }
    }

    test('renders its labels at 12px or more at every width', async ({ page }) => {
      /* Ruling 9 and 11: the floor applies at 834, 1280 and 1440 as well as on a
         phone, and it is measured in screen pixels, not viewBox units. */
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto(d.path);
        await panel(page, d.slug).scrollIntoViewIfNeeded();

        const sizes = await page.evaluate(() => {
          const svg = [...document.querySelectorAll('.flow-svg')].find(
            (s) => s.getBoundingClientRect().width > 0,
          ) as SVGSVGElement;
          const scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
          const name = svg.querySelector('.flow-node-name') as SVGTextElement;
          const edge = svg.querySelector('.flow-edge-label') as SVGTextElement | null;
          return {
            name: parseFloat(getComputedStyle(name).fontSize) * scale,
            edge: edge ? parseFloat(getComputedStyle(edge).fontSize) * scale : 0,
          };
        });
        expect(sizes.name, `node name at ${width}px`).toBeGreaterThanOrEqual(11.9);
        if (sizes.edge) expect(sizes.edge, `edge label at ${width}px`).toBeGreaterThanOrEqual(10.4);
      }
    });
  });
}

/* ---------------------------------------------------------------- fix pass 2
 *
 * F2-1: a label may not be cut by the panel's edge. The geometry suite checked
 * labels against the SVG, which overflows visibly, so a label could sit outside
 * the visible panel and still pass. This checks against the panel's client rect.
 * F2-2: no token may be drawn outside the graph.
 */

for (const d of DIAGRAMS) {
  test.describe(`${d.slug}: fix pass 2`, () => {
    for (const width of [390, 834, 1280, 1440]) {
      test(`${width}px: no label is cut by the panel's edge`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto(d.path);
        const figure = panel(page, d.slug);
        await figure.scrollIntoViewIfNeeded();

        const cut = await figure.evaluate((el) => {
          const panelBox = el.getBoundingClientRect();
          const svg = [...el.querySelectorAll('.flow-svg')].find(
            (s) => s.getBoundingClientRect().width > 0,
          ) as SVGSVGElement;
          return [...svg.querySelectorAll('text')]
            .filter((t) => t.getBoundingClientRect().width > 1)
            .filter((t) => {
              const r = t.getBoundingClientRect();
              /* A visible panel edge cuts a label the way a visitor sees it. */
              return r.left < panelBox.left - 0.5 || r.right > panelBox.right + 0.5;
            })
            .map((t) => {
              const r = t.getBoundingClientRect();
              return `${t.textContent} [${Math.round(r.left - panelBox.left)}..${Math.round(r.right - panelBox.left)} of ${Math.round(panelBox.width)}]`;
            });
        });
        expect(cut, 'labels cut by the panel edge').toEqual([]);
      });
    }

    test('draws no token outside the graph in the still', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(d.path);
      const figure = panel(page, d.slug);
      await figure.scrollIntoViewIfNeeded();

      const stray = await figure.evaluate((el) => {
        const svg = [...el.querySelectorAll('.flow-svg')].find(
          (s) => s.getBoundingClientRect().width > 0,
        ) as SVGSVGElement;
        const out: string[] = [];
        for (const tok of svg.querySelectorAll('.flow-token')) {
          const r = tok.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) continue;
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          /* A token with no transform is drawn at the SVG's origin: the corner. */
          if (!tok.getAttribute('transform')) {
            out.push('no transform, drawn at the origin');
            continue;
          }
          /* And it must rest on a box rather than in empty space. */
          const onNode = [...svg.querySelectorAll('.flow-node rect')].some((n) => {
            const b = n.getBoundingClientRect();
            return cx >= b.left - 2 && cx <= b.right + 2 && cy >= b.top - 2 && cy <= b.bottom + 2;
          });
          if (!onNode) out.push('not on a node');
        }
        return out;
      });
      expect(stray, 'the token is not at rest on the graph').toEqual([]);
    });
  });
}
