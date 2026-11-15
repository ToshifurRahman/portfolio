import { expect, test, type Page } from '@playwright/test';

/*
 * The signature interaction: a demo ticket runs Ticket-Pipeline's real track.
 * Must-prove 3 says it pauses off-screen and on a hidden tab, has a visible
 * pause control, and shows a still picture under reduced motion and in the
 * pre-render. Nothing guarded any of that in R0, so it is pinned here.
 */

const marker = async (page: Page) => (await page.locator('.track-svg .token').getAttribute('transform')) ?? '';

/* Wait until the token has actually moved, so a paused check is not fooled by
   sampling before the first frame. */
const moved = async (page: Page, from: string) => {
  await expect.poll(async () => (await marker(page)) !== from, { timeout: 4000 }).toBe(true);
};

test.describe('signal panel: the pause control', () => {
  test('stops the ticket, then lets it run again', async ({ page }) => {
    await page.goto('/');
    const pause = page.getByRole('button', { name: /pause the demo/i });
    await expect(pause).toBeVisible();

    const before = await marker(page);
    await moved(page, before);

    await pause.click();
    await expect(page.getByRole('button', { name: /play the demo/i })).toBeVisible();
    const held = await marker(page);
    await page.waitForTimeout(700);
    expect(await marker(page)).toBe(held);

    await page.getByRole('button', { name: /play the demo/i }).click();
    await expect.poll(async () => (await marker(page)) !== held, { timeout: 4000 }).toBe(true);
  });

  test('names its state once, not twice', async ({ page }) => {
    /* The label already flips Pause/Play: an aria-pressed on top of it made a
       screen reader say "Play the demo, pressed". */
    await page.goto('/');
    const button = page.locator('.track-pause');
    await expect(button).toHaveCount(1);
    await expect(button).not.toHaveAttribute('aria-pressed', /.*/);
  });
});

test.describe('signal panel: the ticket rests when nothing is watching', () => {
  test('holds while the panel is off-screen and runs again in view', async ({ page }) => {
    await page.goto('/');
    const before = await marker(page);
    await moved(page, before);

    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const parked = await marker(page);
    await page.waitForTimeout(700);
    expect(await marker(page)).toBe(parked);

    await page.evaluate(() => scrollTo(0, 0));
    await expect.poll(async () => (await marker(page)) !== parked, { timeout: 4000 }).toBe(true);
  });

  test('holds while the tab is hidden', async ({ page }) => {
    await page.goto('/');
    const before = await marker(page);
    await moved(page, before);

    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(400);
    const parked = await marker(page);
    await page.waitForTimeout(800);
    expect(await marker(page)).toBe(parked);
  });
});

test.describe('signal panel: the still picture', () => {
  test.use({ reducedMotion: 'reduce' });

  test('shows the completed run with no pause control', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.track-panel')).toBeVisible();
    await expect(page.locator('.track-pause')).toHaveCount(0);
    await expect(page.locator('.track-status')).toContainText('Completed');
    await expect(page.locator('.track-svg .token')).toHaveAttribute('transform', /1240/);
  });

  for (const width of [390, 768, 1024, 1280]) {
    test(`frames every station label inside the panel at ${width} px`, async ({ page }) => {
      /* The still picture is the one view that has to stand alone as a picture
         (reduced motion, no JavaScript, the pre-render), so no station label or
         sublabel may be cropped by the panel's own edge. A label the framing
         leaves off-screen entirely is absent, not cut: what is checked here is
         that every label the picture does show is whole, and that the station
         the status line names is always in the frame. */
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      const framing = await page.evaluate(() => {
        const panel = document.querySelector('.track-window') as HTMLElement;
        const box = panel.getBoundingClientRect();
        const text = [...document.querySelectorAll('.track-svg .station-label, .track-svg .station-sublabel')].map((el) => {
          const b = el.getBoundingClientRect();
          const shown = b.right > box.left && b.left < box.right;
          return {
            text: (el.textContent ?? '').trim(),
            shown,
            whole: b.left >= box.left - 1 && b.right <= box.right + 1,
          };
        });
        return { panelWidth: Math.round(box.width), text };
      });
      const cut = framing.text.filter((t) => t.shown && !t.whole);
      expect(cut, `cut labels: ${cut.map((c) => c.text).join(', ')}`).toEqual([]);
      /* The station the status line reports is on screen, with its sublabel. */
      for (const name of [/^COMPLETED$/, /^LIVE ON THE TICKET PAGE$/]) {
        const label = framing.text.find((t) => name.test(t.text));
        expect(label, `${name} is missing`).toBeTruthy();
        expect(label!.shown, `${name} is off-screen at ${width}px`).toBe(true);
        expect(label!.whole, `${name} is cut at ${width}px on a ${framing.panelWidth}px panel`).toBe(true);
      }
    });
  }
});

test.describe('signal panel: the pre-render', () => {
  test.use({ javaScriptEnabled: false });

  test('pictures the completed run before any script runs', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.track-panel')).toBeVisible();
    await expect(page.locator('.track-svg .station-label').first()).toBeVisible();
    await expect(page.locator('.track-pause')).toHaveCount(0);
    /* Nothing is cropped: the same rule as the reduced-motion still. A label
       the framing leaves off-screen is absent, not cut, so only labels that
       overlap the panel are measured. */
    const framing = await page.evaluate(() => {
      const box = document.querySelector('.track-window')!.getBoundingClientRect();
      const cut = [...document.querySelectorAll('.track-svg .station-label')].filter((el) => {
        const b = el.getBoundingClientRect();
        const shown = b.right > box.left && b.left < box.right;
        return shown && (b.left < box.left - 1 || b.right > box.right + 1);
      });
      const completed = [...document.querySelectorAll('.track-svg .station-label')]
        .map((el) => el.textContent?.trim())
        .filter((t) => t === 'COMPLETED');
      return { cropped: cut.map((el) => el.textContent?.trim()), completed: completed.length };
    });
    expect(framing.cropped).toEqual([]);
    /* The station the status line names is in the picture before script runs. */
    expect(framing.completed).toBeGreaterThan(0);
  });
});

test.describe('mini-track labels', () => {
  /* The Work rows draw each study's own lane. RannaGhor's first node,
     "Security and CSRF", wrapped to two lines while its four siblings held
     one, so the lamps stopped being level; the whole lane wrapped at 1024.
     Every label now holds one line, at every width, on both pages. */
  for (const width of [390, 768, 1024, 1100, 1280, 1440]) {
    for (const path of ['/', '/work/ticket-pipeline', '/work/rannaghor']) {
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
