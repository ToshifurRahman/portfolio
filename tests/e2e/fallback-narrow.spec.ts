import { expect, test, type Page } from '@playwright/test';

/*
 * The display type asks for Archivo at 62% width. The fallback has to match
 * that width on machines that have no narrow face at all: macOS and iOS ship
 * none, and Windows only with Office. The narrow face is the first choice, so
 * the only way to prove the second one works is to make the narrow sources
 * unresolvable - which is what this file does, by overriding the family with a
 * copy of the shipped faces whose narrow source is a name no machine has.
 *
 * The override is built from the real stylesheet's own @font-face blocks, so
 * it cannot drift from what ships: only the narrow `src` is replaced.
 */
const narrowless = async (page: Page) => {
  await page.route('**/*.woff2', (route) => route.abort());
  await page.addInitScript(() => {
    const add = () => {
      const sheet = [...document.styleSheets].find((s) => {
        try {
          return [...s.cssRules].some((r) => r instanceof CSSFontFaceRule && /Archivo Fallback/.test(r.style.fontFamily));
        } catch {
          return false;
        }
      });
      if (!sheet) return false;
      const faces = [...sheet.cssRules].filter(
        (r): r is CSSFontFaceRule => r instanceof CSSFontFaceRule && /Archivo Fallback/.test(r.style.fontFamily),
      );
      /* The narrow face is the one whose source names a narrow family. Both
         display faces ask for 62% width, so the source is what tells them
         apart - matching on the stretch would remove the wide fallback too. */
      const narrow = faces.filter((face) => /local\(['"]?[^)]*Narrow/i.test(face.cssText));
      if (!narrow.length) return false;
      /* Remove the real narrow face, then add a copy whose source no machine
         has: leaving both in place would let the browser pick the real one. */
      const replacement = narrow[0].cssText.replace(/src:[^;]+;/, "src: local('No Such Narrow Face On This Machine');");
      for (const face of narrow) sheet.deleteRule([...sheet.cssRules].indexOf(face));
      const style = document.createElement('style');
      style.textContent = replacement;
      document.head.append(style);
      return true;
    };
    /* The stylesheet is inlined in the document, so it is there at parse time;
       retry once the DOM is ready in case the order changes. */
    if (!add()) document.addEventListener('DOMContentLoaded', add, { once: true });
  });
};

const measure = (page: Page) =>
  page.evaluate(() => {
    const doc = document.documentElement;
    const name = document.querySelector('.name') as HTMLElement;
    const bar = document.querySelector('.navbar') as HTMLElement;
    const chain = document.querySelector('.chain-states') as HTMLElement;
    const last = document.querySelector('.chain-state:last-child') as HTMLElement;
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      nameClipped: name.scrollWidth - name.clientWidth,
      nameHeight: Math.round(name.getBoundingClientRect().height),
      barHeight: Math.round(bar.getBoundingClientRect().height),
      chainOverflow: chain.scrollWidth - chain.clientWidth,
      lastRight: Math.round(last.getBoundingClientRect().right),
      chainRight: Math.round(chain.getBoundingClientRect().right),
    };
  });

for (const theme of ['dark', 'light'] as const) {
  for (const width of [390, 1024, 1280]) {
    test(`no narrow face, ${width} px ${theme}: the display type still fits`, async ({ page }) => {
      await narrowless(page);
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.goto('/');
      await expect(page.locator('.name')).toBeVisible();

      const m = await measure(page);
      expect(m.scrollWidth, 'the page overflows horizontally').toBeLessThanOrEqual(m.clientWidth);
      expect(m.nameClipped, 'the name is clipped').toBeLessThanOrEqual(0);
      expect(m.barHeight, 'the navbar wrapped to a second row').toBeLessThan(70);
      if (width === 390) {
        /* One line: the name is 12.8vw, so two lines would be about twice as tall. */
        expect(m.nameHeight, 'the name wrapped to two lines').toBeLessThan(70);
      }
      if (width === 1280) {
        expect(m.chainOverflow, 'the chain overflows at 1280').toBeLessThanOrEqual(0);
        expect(m.lastRight).toBeLessThanOrEqual(m.chainRight + 1);
      }
    });
  }
}

test('no narrow face: the case study page does not overflow either', async ({ page }) => {
  await narrowless(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/work/ticket-pipeline');
  await expect(page.locator('.study-title')).toBeVisible();
  const m = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    titleClipped: (() => {
      const el = document.querySelector('.study-title') as HTMLElement;
      return el.scrollWidth - el.clientWidth;
    })(),
  }));
  expect(m.scrollWidth).toBeLessThanOrEqual(m.clientWidth);
  expect(m.titleClipped).toBeLessThanOrEqual(0);
});
