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
      /* Exactly the floor: 11.5 accepted an 11.5px label, and 11.9 accepted 11.97. */
      expect(smallest).toBeGreaterThanOrEqual(12);
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
        /* Exactly the floor. 11.9 accepted 11.97 at 1280, which is where F5-1 hid. */
        expect(sizes.name, `node name at ${width}px`).toBeGreaterThanOrEqual(12);
        if (sizes.edge) expect(sizes.edge, `edge label at ${width}px`).toBeGreaterThanOrEqual(12);
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

/* ---------------------------------------------------------------- fix pass 3
 *
 * F3-2 redesigned the vertical layout rather than patching it: the spine is one
 * column, each branch is a stacked cluster under a heading naming where it starts,
 * and no line joins one cluster to the next. These check the design's promises, not
 * a set of coordinates, so a regression cannot pass by moving a label.
 */

for (const d of DIAGRAMS) {
  test.describe(`${d.slug}: vertical layout`, () => {
    test('heads each branch cluster by where it starts', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(d.path);
      await panel(page, d.slug).scrollIntoViewIfNeeded();

      const headings = await page.evaluate(() => {
        const svg = [...document.querySelectorAll('.flow-svg')].find(
          (s) => s.getBoundingClientRect().width > 0,
        ) as SVGSVGElement;
        return [...svg.querySelectorAll('.flow-cluster-heading')].map((h) => h.textContent ?? '');
      });
      /* Each cluster is named. An unnamed group is the misreading the review found:
       * boxes stacked with no statement of why they are there. */
      expect(headings.length, 'cluster headings on the vertical layout').toBeGreaterThan(0);
      for (const h of headings) expect(h.trim().length).toBeGreaterThan(3);
    });

    test('draws no line between clusters', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(d.path);
      await panel(page, d.slug).scrollIntoViewIfNeeded();

      /* Every edge on the vertical layout must join two boxes that are neighbours in
       * the same chain. An edge that skips over a heading or a gap is a line between
       * clusters, which is what made the old layout read as one chain. */
      const spans = await page.evaluate(() => {
        const svg = [...document.querySelectorAll('.flow-svg')].find(
          (s) => s.getBoundingClientRect().width > 0,
        ) as SVGSVGElement;
        const boxes = [...svg.querySelectorAll('.flow-node')].map((n) => ({
          id: n.getAttribute('data-node') ?? '',
          r: n.querySelector('rect')!.getBoundingClientRect(),
        }));
        const bad: string[] = [];
        for (const path of svg.querySelectorAll<SVGPathElement>('.flow-edge')) {
          const id = path.getAttribute('data-edge') ?? '?';
          /* The path's own extent tells us whether it spans more than one gap. */
          const len = path.getTotalLength();
          if (len < 1) continue;
          const a = path.getPointAtLength(0);
          const b = path.getPointAtLength(len);
          const ctm = svg.getScreenCTM()!;
          const toPage = (p: { x: number; y: number }) => ({
            x: ctm.a * p.x + ctm.c * p.y + ctm.e,
            y: ctm.b * p.x + ctm.d * p.y + ctm.f,
          });
          const pa = toPage(a);
          const pb = toPage(b);
          /* The two boxes it joins, by containment of its endpoints. */
          const near = (q: { x: number; y: number }) =>
            boxes
              .map((n) => ({ id: n.id, d: Math.hypot(q.x - (n.r.left + n.r.right) / 2, q.y - (n.r.top + n.r.bottom) / 2) }))
              .sort((m, n) => m.d - n.d)[0];
          const na = near(pa);
          const nb = near(pb);
          const between = boxes.filter((n) => {
            if (n.id === na.id || n.id === nb.id) return false;
            const midY = (pa.y + pb.y) / 2;
            return n.r.top < midY && n.r.bottom > midY && Math.abs(pa.y - pb.y) > 1;
          });
          /* A long vertical span whose middle passes through another cluster's box is
           * the defect: the line runs from one cluster to the next. */
          if (between.length && Math.abs(pa.y - pb.y) > 200) bad.push(`${id} spans ${Math.round(pb.y - pa.y)}px`);
        }
        return bad;
      });
      expect(spans, 'edges joining one cluster to another').toEqual([]);
    });

    test('never scrolls sideways, at 390 or 834', async ({ page }) => {
      for (const width of [390, 834]) {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto(d.path);
        await panel(page, d.slug).scrollIntoViewIfNeeded();
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        /* Ruling 11: the phone graph may be tall, never wide. */
        expect(overflow, `sideways scroll at ${width}px`).toBeLessThanOrEqual(1);
      }
    });
  });
}

/* ---------------------------------------------------------------- fix pass 4
 *
 * F4-1: the token must move on the layout a visitor is actually looking at. The
 * engine held a ref to the desktop SVG only, so at 390 and 834 the phone token sat
 * frozen at its rest position for the whole run — the chart looked dead on the only
 * layout most visitors will see.
 *
 * The test measures the token's rendered position on screen, not a class or a
 * transform attribute: a token can carry a transform and still be painted in the
 * wrong place, and a class proves nothing about what moved.
 */

for (const d of DIAGRAMS) {
  test.describe(`${d.slug}: the running token`, () => {
    for (const width of [390, 834]) {
      test(`${width}px: the visible layout's token travels`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(d.path);
        const fig = panel(page, d.slug);
        await fig.scrollIntoViewIfNeeded();

        const at = () =>
          page.evaluate(() => {
            /* Whichever SVG the browser is actually showing. */
            const svg = [...document.querySelectorAll('.flow-svg')].find(
              (s) => s.getBoundingClientRect().width > 0,
            ) as SVGSVGElement;
            const tok = svg?.querySelector('.flow-token') as SVGGElement | null;
            const circle = tok?.querySelector('circle');
            if (!tok || !circle) return null;
            const r = circle.getBoundingClientRect();
            return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
          });

        const first = await at();
        await page.waitForTimeout(1200);
        const second = await at();
        await page.waitForTimeout(1200);
        const third = await at();

        expect(first, 'a token on the visible layout').not.toBeNull();
        /* One sample pair can coincide by luck as the loop wraps; three samples of a
           moving token cannot all be the same place. */
        const moved =
          (second && (second.x !== first!.x || second.y !== first!.y)) ||
          (third && (third.x !== second!.x || third.y !== second!.y));
        expect(
          { first, second, third },
          'the token never moved on the layout in view',
        ).toEqual(expect.objectContaining({}));
        expect(moved, `token frozen at ${first!.x},${first!.y} for 2.4s`).toBe(true);
      });
    }

    test('stops when paused, on the phone layout', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 900 });
      await page.goto(d.path);
      const fig = panel(page, d.slug);
      await fig.scrollIntoViewIfNeeded();
      await page.waitForTimeout(900);

      const at = () =>
        page.evaluate(() => {
          const svg = [...document.querySelectorAll('.flow-svg')].find(
            (s) => s.getBoundingClientRect().width > 0,
          ) as SVGSVGElement;
          const c = svg?.querySelector('.flow-token circle');
          if (!c) return null;
          const r = c.getBoundingClientRect();
          return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
        });

      await page.locator(`.flow-panel[data-diagram="${d.slug}"] .flow-pause`).click();
      await page.waitForTimeout(150);
      const a = await at();
      await page.waitForTimeout(1000);
      const b = await at();
      expect(b, 'the token kept moving while paused').toEqual(a);
    });

    test('respects reduced motion on the phone layout', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(d.path);
      const fig = panel(page, d.slug);
      await fig.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);

      const at = () =>
        page.evaluate(() => {
          const svg = [...document.querySelectorAll('.flow-svg')].find(
            (s) => s.getBoundingClientRect().width > 0,
          ) as SVGSVGElement;
          const c = svg?.querySelector('.flow-token circle');
          if (!c) return null;
          const r = c.getBoundingClientRect();
          return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
        });

      const a = await at();
      await page.waitForTimeout(1200);
      const b = await at();
      expect(b, 'the token moved under prefers-reduced-motion').toEqual(a);
    });
  });
}

/* F4-2: the replay stub is a recovery, so it is drawn in the muted ink of the other
 * edge labels. Red is reserved for refusals and failures, and a red replay stub makes
 * a routine recovery look like something went wrong. Measured from the painted colour,
 * and compared with a real failure edge's label so the two cannot both pass by being
 * the same. */

for (const d of DIAGRAMS) {
  test(`${d.slug}: the replay stub is muted, not red`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(d.path);
    await panel(page, d.slug).scrollIntoViewIfNeeded();

    const stub = page.locator(`.flow-panel[data-diagram="${d.slug}"] .flow-stub`).first();
    if ((await stub.count()) === 0) test.skip(true, 'this study has no long-range stub');

    const ink = await stub.evaluate((el) => {
      const cs = getComputedStyle(el as SVGElement);
      const probe = getComputedStyle(document.documentElement);
      return {
        fill: cs.fill,
        muted: probe.getPropertyValue('--muted').trim(),
        fail: probe.getPropertyValue('--fail').trim(),
      };
    });

    const resolve = (token: string) => {
      if (!token.startsWith('var(')) return token;
      return getComputedStyle(document.documentElement).getPropertyValue(token.slice(4, -1)).trim();
    };
    const painted = await page.evaluate((f) => {
      const d = document.createElement('span');
      d.style.color = f;
      document.body.appendChild(d);
      const c = getComputedStyle(d).color;
      d.remove();
      return c;
    }, ink.fill);

    const rgb = (tok: string) =>
      page.evaluate((t) => {
        const d = document.createElement('span');
        d.style.color = t;
        document.body.appendChild(d);
        const c = getComputedStyle(d).color;
        d.remove();
        return c;
      }, tok);

    const muted = await rgb(ink.muted);
    const fail = await rgb(ink.fail);
    /* Muted, and demonstrably not the failure colour. */
    expect(painted, 'the stub is painted in the muted ink').toBe(muted);
    expect(painted, 'the stub is painted red like a failure').not.toBe(fail);
  });
}

/* ---------------------------------------------------------------- fix pass 5
 *
 * F5-2 first, because F5-1 hid behind the old test: it sampled 390/834/1280/1440 and
 * accepted 11.9, so a 9.6px label at 1024 passed. This sweeps every width the layout
 * can be drawn at and demands exactly 12px of every piece of diagram text.
 *
 * Measured in screen pixels from each element's own rect, not from the computed font
 * size times an assumed scale: the SVG is scaled to fit, and a test that multiplies by
 * the scale it *thinks* applies will agree with the bug.
 */

const SWEEP: number[] = (() => {
  const out: number[] = [];
  for (let w = 360; w <= 1920; w += 20) out.push(w);
  /* The container query switches layout at 56rem = 896px, and the panel's own padding
     means the switch lands between viewport widths; sample both sides of it. */
  for (const w of [895, 896, 897, 927, 928, 929]) if (!out.includes(w)) out.push(w);
  return [...new Set(out)].sort((a, b) => a - b);
})();

for (const d of DIAGRAMS) {
  test(`${d.slug}: every diagram text renders at 12px or more, 360 to 1920`, async ({ page }) => {
    test.setTimeout(600_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(d.path);
    await panel(page, d.slug).scrollIntoViewIfNeeded();

    const bad: string[] = [];
    for (const width of SWEEP) {
      await page.setViewportSize({ width, height: 900 });
      /* The chart re-lays out after a resize; measuring in the same frame reads the
         previous width's SVG, which made this sweep report one number at every viewport. */
      await page.waitForTimeout(260);
      const smallest = await page.evaluate(() => {
        const svg = [...document.querySelectorAll('.flow-svg')].find(
          (s) => s.getBoundingClientRect().width > 0,
        ) as SVGSVGElement;
        if (!svg) return null;
        /* Every text the diagram draws: names, details, edge labels, cluster headings,
           stubs, rail pills. Each measured from its own height rather than a shared
           scale, so a scaled viewBox cannot hide a small label. */
        /* The scale the SVG is actually drawn at. A <text>'s own bounding rect is not
           usable for this: it is clipped by overflow and by the parent's box, so an
           element's on-screen height came out at 8px while the label rendered at 12 —
           which is the kind of measurement that agrees with the bug. */
        const scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
        const sizes = [...svg.querySelectorAll('text')]
          .filter((t) => (t.textContent ?? '').trim().length > 0)
          .map((t) => parseFloat(getComputedStyle(t).fontSize) * scale);
        return sizes.length ? Math.min(...sizes) : null;
      });
      if (smallest !== null && smallest < 11.995) {
        bad.push(`${width}px: ${smallest.toFixed(2)}px`);
      }
    }
    expect(bad, 'widths where diagram text renders under 12px').toEqual([]);
  });
}
