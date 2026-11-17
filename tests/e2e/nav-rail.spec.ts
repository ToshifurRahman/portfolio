import { expect, test } from '@playwright/test';

/* Owner, 2026-11-17: "in nav, remove lines connected with dots". The top bar
   keeps a lamp on every item and its current/lit state, but no line joins one
   item to the next, on the wide bar or in the open phone menu. The case-study
   contents sub-nav is a different component and keeps its rail. */

type Line = { content: string; width: number; height: number; border: number };

test.describe('the top nav has no line between its lamps', () => {
  for (const width of [1440, 1280]) {
    test(`at ${width} px: no item draws a connector`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');

      const result = await page.evaluate(() => {
        const items = [...document.querySelectorAll<HTMLElement>('.site-header .nav-links li')].filter(
          (li) => li.getClientRects().length > 0,
        );
        const line = (el: Element, pseudo: '::before' | '::after'): Line => {
          const cs = getComputedStyle(el, pseudo);
          const width = parseFloat(cs.width) || 0;
          const height = parseFloat(cs.height) || 0;
          const border = ['Top', 'Right', 'Bottom', 'Left']
            .map((side) => parseFloat(cs[`border${side}Width` as 'borderTopWidth']) || 0)
            .reduce((sum, n) => sum + n, 0);
          return { content: cs.content, width, height, border };
        };
        const itemLines = items.flatMap((li) => [line(li, '::before'), line(li, '::after')]);
        const ownBorders = items.map((li) =>
          ['Top', 'Right', 'Bottom', 'Left']
            .map((side) => parseFloat(getComputedStyle(li)[`border${side}Width` as 'borderTopWidth']) || 0)
            .reduce((sum, n) => sum + n, 0),
        );
        const anchorBorders = items.map((li) => {
          const a = li.querySelector('a')!;
          const cs = getComputedStyle(a);
          return (
            (parseFloat(cs.borderTopWidth) || 0) +
            (parseFloat(cs.borderBottomWidth) || 0)
          );
        });
        const lamps = [...document.querySelectorAll<HTMLElement>('.site-header .nav-links a .lamp')].filter(
          (lamp) => lamp.getClientRects().length > 0,
        );
        return {
          count: items.length,
          draws: itemLines.filter(
            (l) => l.content !== 'none' && (l.width > 0 || l.height > 0 || l.border > 0),
          ),
          ownBorders: ownBorders.filter((n) => n > 0),
          anchorBorders: anchorBorders.filter((n) => n > 0),
          lamps: lamps.length,
        };
      });

      expect(result.count).toBeGreaterThan(2);
      expect(result.draws, 'an item still draws a connecting line').toEqual([]);
      expect(result.ownBorders, 'an item still has a border').toEqual([]);
      expect(result.anchorBorders, 'a border still separates two items').toEqual([]);
      expect(result.lamps, 'every item keeps its lamp').toBe(result.count);
    });
  }

  test('at 390 px: the open phone menu has no connector either', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: /menu/i }).click();

    const result = await page.evaluate(() => {
      const items = [...document.querySelectorAll<HTMLElement>('.site-header .nav-links li')].filter(
        (li) => li.getClientRects().length > 0,
      );
      const line = (el: Element, pseudo: '::before' | '::after') => {
        const cs = getComputedStyle(el, pseudo);
        const width = parseFloat(cs.width) || 0;
        const height = parseFloat(cs.height) || 0;
        return cs.content !== 'none' && (width > 0 || height > 0);
      };
      const anchorBorders = items.map((li) => {
        const cs = getComputedStyle(li.querySelector('a')!);
        return (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0);
      });
      return {
        count: items.length,
        draws: items.filter((li) => line(li, '::before') || line(li, '::after')).length,
        anchorBorders: anchorBorders.filter((n) => n > 0).length,
        lamps: items.filter((li) => li.querySelector('.lamp')?.getClientRects().length).length,
      };
    });

    expect(result.count).toBeGreaterThan(2);
    expect(result.draws).toBe(0);
    expect(result.anchorBorders, 'a border still separates two menu rows').toBe(0);
    expect(result.lamps).toBe(result.count);
  });

  test('keeps every lamp and lights the current item', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/work/ticket-pipeline');

    const state = await page.evaluate(() => {
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      const probe = document.createElement('span');
      probe.style.color = accent;
      document.body.append(probe);
      const accentRgb = getComputedStyle(probe).color;
      probe.remove();

      const current = document.querySelector<HTMLElement>('.site-header .nav-links a[aria-current="true"]');
      const lamp = current?.querySelector<HTMLElement>('.lamp');
      const off = document.querySelector<HTMLElement>('.site-header .nav-links a:not([aria-current]) .lamp');
      return {
        currentText: current?.textContent?.trim(),
        lampColor: lamp ? getComputedStyle(lamp).backgroundColor : null,
        offColor: off ? getComputedStyle(off).backgroundColor : null,
        accentRgb,
        everyItemHasLamp: [...document.querySelectorAll<HTMLElement>('.site-header .nav-links li')]
          .filter((li) => li.getClientRects().length > 0)
          .every((li) => !!li.querySelector('.lamp')),
      };
    });

    expect(state.currentText).toContain('Work');
    expect(state.lampColor).toBe(state.accentRgb);
    expect(state.offColor).not.toBe(state.accentRgb);
    expect(state.everyItemHasLamp).toBe(true);
  });

  test('the case-study contents sub-nav keeps its rail', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/work/ticket-pipeline');

    const rail = await page.evaluate(() => {
      const li = document.querySelector<HTMLElement>('.contents li:not(:last-child)');
      if (!li) return null;
      const cs = getComputedStyle(li, '::before');
      return {
        content: cs.content,
        width: parseFloat(cs.width) || 0,
        height: parseFloat(cs.height) || 0,
        left: cs.left,
        background: cs.backgroundColor,
      };
    });

    expect(rail, 'the contents rail is missing').not.toBeNull();
    expect(rail!.content).not.toBe('none');
    expect(rail!.width + rail!.height).toBeGreaterThan(0);
    expect(rail!.background).not.toBe('rgba(0, 0, 0, 0)');
  });
});
