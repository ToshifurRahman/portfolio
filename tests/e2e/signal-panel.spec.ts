import { expect, test, type Page } from '@playwright/test';

/*
 * The signature interaction: each case study's Architecture section opens with
 * a demo of that system's own track. Must-prove 3 (as amended by A5) says the
 * diagram pauses off-screen and on a hidden tab, has a visible pause control,
 * and shows a complete still — no cut label — under reduced motion and in the
 * pre-render. Nothing guarded any of that in R0, so it is pinned here.
 *
 * Both diagrams are one engine fed two specs, so every behaviour below runs
 * against both.
 */

const DIAGRAMS = [
  {
    slug: 'ticket-pipeline',
    path: '/work/ticket-pipeline',
    /* The stations the still picture must always show whole. */
    asserted: [/^COMPLETED$/, /^LIVE ON THE TICKET PAGE$/],
    status: /Completed/,
  },
  {
    slug: 'rannaghor',
    path: '/work/rannaghor',
    /* ROLE CHECK is 798-1002 and POSTGRESQL 1293-1507, so both are whole only
       from a 712px-wide panel. Below that the still picture is framed from the
       role check onwards and those two are together; above it, from the rate
       limit, and the role check is in view too. The station the picture ends at
       is always asserted. */
    asserted: [/^POSTGRESQL$/],
    alsoWhenWide: { width: 713, labels: [/^ROLE CHECK$/] },
    status: /Order committed|checks pass|request arrives/i,
  },
];

const panel = (page: Page, slug: string) => page.locator(`.track-panel[data-diagram="${slug}"]`);

/* The diagram sits at the top of a case study's Architecture section, not in the
   first viewport, and it correctly does not run off-screen — so a test that
   wants motion has to scroll it into view first. */
const reveal = async (page: Page, slug: string) => {
  await panel(page, slug).scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
};
const marker = async (page: Page, slug: string) =>
  (await page.locator(`[data-diagram="${slug}"] .track-svg .token`).getAttribute('transform')) ?? '';

/* Wait until the token has actually moved, so a paused check is not fooled by
   sampling before the first frame. */
const moved = async (page: Page, slug: string, from: string) => {
  await expect.poll(async () => (await marker(page, slug)) !== from, { timeout: 5000 }).toBe(true);
};

for (const d of DIAGRAMS) {
  test.describe(`diagram (${d.slug}): the pause control`, () => {
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
      expect(await marker(page, d.slug)).toBe(held);

      await panel(page, d.slug).getByRole('button', { name: /play the diagram/i }).click();
      await expect.poll(async () => (await marker(page, d.slug)) !== held, { timeout: 5000 }).toBe(true);
    });

    test('names its state once, not twice', async ({ page }) => {
      /* The label already flips Pause/Play: an aria-pressed on top of it made a
         screen reader say "Play the diagram, pressed". */
      await page.goto(d.path);
      const button = panel(page, d.slug).locator('.track-pause');
      await expect(button).toHaveCount(1);
      await expect(button).not.toHaveAttribute('aria-pressed', /.*/);
    });
  });

  test.describe(`diagram (${d.slug}): the request rests when nothing is watching`, () => {
    test('holds while the panel is off-screen and runs again in view', async ({ page }) => {
      await page.goto(d.path);
      await reveal(page, d.slug);
      const before = await marker(page, d.slug);
      await moved(page, d.slug, before);

      /* The Results section is far below the Architecture one. */
      await page.locator('#results').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      const parked = await marker(page, d.slug);
      await page.waitForTimeout(700);
      expect(await marker(page, d.slug)).toBe(parked);

      await page.locator(`[data-diagram="${d.slug}"]`).scrollIntoViewIfNeeded();
      await expect.poll(async () => (await marker(page, d.slug)) !== parked, { timeout: 5000 }).toBe(true);
    });

    test('holds while the tab is hidden', async ({ page }) => {
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
      expect(await marker(page, d.slug)).toBe(parked);
    });
  });

  test.describe(`diagram (${d.slug}): the still picture`, () => {
    test.use({ reducedMotion: 'reduce' });

    test('shows the whole run with no pause control', async ({ page }) => {
      await page.goto(d.path);
      await expect(panel(page, d.slug)).toBeVisible();
      await expect(panel(page, d.slug).locator('.track-pause')).toHaveCount(0);
      await expect(panel(page, d.slug).locator('.track-status')).toContainText(d.status);
      /* The picture is a finished run, so at least one station shows as done. */
      expect(await panel(page, d.slug).locator('.station-lamp.is-done').count()).toBeGreaterThan(0);
    });

    for (const width of [390, 768, 1024, 1280]) {
      test(`frames its station labels whole at ${width} px`, async ({ page }) => {
        /* The still picture is the one view that has to stand alone as a picture
           (reduced motion, no JavaScript, the pre-render), so no station label
           or sublabel may be cropped by the panel's edge. A label the framing
           leaves off-screen entirely is absent, not cut: what is checked is that
           every label the picture shows is whole, and that the stations this
           diagram is about are in the frame. */
        await page.setViewportSize({ width, height: 900 });
        await page.goto(d.path);
        const framing = await page.evaluate((slug) => {
          const root = document.querySelector(`[data-diagram="${slug}"]`);
          const box = root!.querySelector('.track-window')!.getBoundingClientRect();
          const text = [...root!.querySelectorAll('.track-svg .station-label, .track-svg .station-sublabel')].map((el) => {
            const b = el.getBoundingClientRect();
            const shown = b.right > box.left && b.left < box.right;
            return {
              text: (el.textContent ?? '').trim(),
              shown,
              whole: b.left >= box.left - 1 && b.right <= box.right + 1,
            };
          });
          return { panelWidth: Math.round(box.width), text };
        }, d.slug);
        const cut = framing.text.filter((t) => t.shown && !t.whole);
        expect(cut, `cut labels: ${cut.map((c) => c.text).join(', ')}`).toEqual([]);
        const asserted = [...d.asserted];
        if (d.alsoWhenWide && framing.panelWidth >= d.alsoWhenWide.width) asserted.push(...d.alsoWhenWide.labels);
        for (const name of asserted) {
          const label = framing.text.find((t) => name.test(t.text));
          expect(label, `${name} is missing`).toBeTruthy();
          expect(label!.whole, `${name} is cut at ${width}px on a ${framing.panelWidth}px panel`).toBe(true);
        }
      });
    }
  });

  /* The diagram belongs to the Architecture section, so it has to line up with
     that section's own heading and prose. It was pinned to `grid-column: 4 /
     span 9` and never reset on a narrow screen, so at 390 it started 88px right
     of its heading (234px at 1024), reading as a floating inset rather than the
     section's first statement (R3-agy-1 / R3-ds-1). */
  test.describe(`diagram (${d.slug}): aligned with its section`, () => {
    for (const width of [390, 768, 1024]) {
      test(`starts where the Architecture heading starts at ${width} px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(d.path);
        const edges = await page.evaluate((slug) => {
          const diagram = document.querySelector(`[data-diagram="${slug}"]`)!.getBoundingClientRect();
          const heading = document.querySelector('#architecture .section-heading')!.getBoundingClientRect();
          return { diagram: Math.round(diagram.left), heading: Math.round(heading.left) };
        }, d.slug);
        expect(edges.heading).toBeGreaterThan(0);
        expect(Math.abs(edges.diagram - edges.heading)).toBeLessThanOrEqual(1);
      });
    }
  });

  test.describe(`diagram (${d.slug}): the pre-render`, () => {
    test.use({ javaScriptEnabled: false });

    test('pictures the run before any script runs', async ({ page }) => {
      await page.goto(d.path);
      await expect(panel(page, d.slug)).toBeVisible();
      await expect(panel(page, d.slug).locator('.track-svg .station-label').first()).toBeVisible();
      await expect(panel(page, d.slug).locator('.track-pause')).toHaveCount(0);
      const cropped = await page.evaluate((slug) => {
        const root = document.querySelector(`[data-diagram="${slug}"]`)!;
        const box = root.querySelector('.track-window')!.getBoundingClientRect();
        return [...root.querySelectorAll('.track-svg .station-label')]
          .filter((el) => {
            const b = el.getBoundingClientRect();
            const shown = b.right > box.left && b.left < box.right;
            return shown && (b.left < box.left - 1 || b.right > box.right + 1);
          })
          .map((el) => el.textContent?.trim());
      }, d.slug);
      expect(cropped).toEqual([]);
    });
  });
}

test('the home page no longer carries the animated diagram', async ({ page }) => {
  /* The owner moved it into the case studies; that home slot is the Now panel. */
  await page.goto('/');
  await expect(page.locator('.track-panel')).toHaveCount(0);
  await expect(page.locator('#now')).toBeVisible();
});

test.describe('mini-track labels', () => {
  /* The case-study architecture lanes still draw `.line`. RannaGhor's first
     node, "Security and CSRF", wrapped to two lines while its four siblings held
     one, so the lamps stopped being level; the whole lane wrapped at 1024. Every
     label holds one line, at every width.

     `/` is no longer in this list: the owner replaced the Work cards' station
     rail with a node diagram (2026-11-15), so the home page has no `.line`. The
     node diagram has its own spec, which checks the same thing — no wrapped,
     clipped or spilling label — where that diagram actually is. */
  for (const width of [390, 768, 1024, 1100, 1280, 1440]) {
    for (const path of ['/work/ticket-pipeline', '/work/rannaghor']) {
      test(`${path} at ${width} px: every node label is one line`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path);
        const rows = await page.evaluate(() => {
          return [...document.querySelectorAll('.line')].map((line) => {
            const lineBox = line.getBoundingClientRect();
            return {
              label: line.getAttribute('aria-label') ?? '',
              nodes: [...line.querySelectorAll('li')].map((li) => {
                const range = document.createRange();
                range.selectNodeContents(li);
                const rects = [...range.getClientRects()].filter((r) => r.width > 1);
                return {
                  text: (li.textContent ?? '').trim(),
                  lines: new Set(rects.map((r) => Math.round(r.top))).size,
                  clipped: li.scrollWidth > li.clientWidth + 1,
                  spills: rects.some((r) => r.right > lineBox.right + 1),
                };
              }),
            };
          });
        });
        expect(rows.length).toBeGreaterThan(0);
        for (const row of rows) {
          for (const node of row.nodes) {
            expect(node.lines, `${row.label} -> "${node.text}" wrapped`).toBe(1);
            expect(node.clipped, `${row.label} -> "${node.text}" was clipped`).toBe(false);
            expect(node.spills, `${row.label} -> "${node.text}" left the track`).toBe(false);
          }
        }
      });
    }
  }
});

test.describe('the Work card node diagram', () => {
  /* Owner, 2026-11-15: the Work card chart becomes a small node diagram. Every
     box's label is whole at every width: the chain wraps, and turns vertical on
     a phone, rather than shrinking text below legibility. */
  for (const width of [360, 390, 430, 768, 1024, 1280, 1440]) {
    test(`/ at ${width} px: every node box keeps its whole label`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await page.locator('.cases').scrollIntoViewIfNeeded();

      const lists = await page.evaluate(() =>
        [...document.querySelectorAll('.nodes')].map((list) => {
          const box = list.getBoundingClientRect();
          return {
            count: list.querySelectorAll('.node').length,
            bad: [...list.querySelectorAll('.node')]
              .filter((n) => {
                const rect = n.getBoundingClientRect();
                return rect.right > box.right + 1 || n.scrollWidth > n.clientWidth + 1;
              })
              .map((n) => (n.textContent ?? '').trim()),
          };
        }),
      );
      expect(lists.length).toBe(2);
      for (const list of lists) {
        expect(list.count).toBeGreaterThan(3);
        expect(list.bad, `cut labels at ${width}px`).toEqual([]);
      }
      /* And nothing on the page scrolls sideways. */
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test('Ticket-Pipeline forks to the backup model; RannaGhor does not fork', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    await page.locator('.cases').scrollIntoViewIfNeeded();
    await expect(page.locator('.nodes').first().locator('.is-branch')).toHaveCount(1);
    await expect(page.locator('.nodes').first().locator('.is-branch')).toHaveText(/Backup model/i);
    await expect(page.locator('.nodes').nth(1).locator('.is-branch')).toHaveCount(0);
  });
});
