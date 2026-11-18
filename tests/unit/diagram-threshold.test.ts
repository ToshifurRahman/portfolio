import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { diagrams } from '../../src/diagrams';

/* The layout switch is each study's own viewBox width, rounded up: below that the
   desktop chart is scaled under 1:1 and every label goes under the 12px floor. The
   number is measured from the graph, not chosen, so it has to be re-measured
   whenever a node is added or removed. RannaGhor's stayed at 1155 after the rate
   node came out and the graph narrowed to 1111.48, which switched the vertical
   chart in about 44px early. */

const root = process.cwd();
const css = readFileSync(resolve(root, 'src/styles.css'), 'utf8');
const built = (slug: string) => resolve(root, 'dist', 'work', slug, 'index.html');

/* These read the built output, so they only mean something after a build. The
   whole file skips with a named reason rather than failing on ENOENT. */
const hasBuild = existsSync(built('relay'));
const whenBuilt = hasBuild ? describe : describe.skip;
const why = 'dist/work is missing: run `bun run build` before the unit suite';

/* The chart's own viewBox, not the icons': every icon on the page is 20 units or
   narrower, and the graph is over a thousand. */
const viewBoxWidth = (slug: string) => {
  const html = readFileSync(built(slug), 'utf8');
  const widths = [...html.matchAll(/viewBox="0 0 ([\d.]+) [\d.]+"/g)]
    .map((m) => Number(m[1]))
    .filter((w) => w > 100);
  expect(widths.length, `${slug} has no chart viewBox`).toBeGreaterThan(0);
  return Math.max(...widths);
};

const threshold = (slug: string) => {
  const rule = css.match(
    new RegExp(`@container \\(max-width: (\\d+)px\\) \\{\\s*\\.flow-panel\\[data-diagram='${slug}'\\]`),
  );
  expect(rule, `${slug} has no container threshold`).not.toBeNull();
  return Number(rule![1]);
};

whenBuilt(`the flowchart layout switch (${hasBuild ? 'built output' : why})`, () => {
  for (const slug of Object.keys(diagrams)) {
    it(`${slug}: switches at its own viewBox width, rounded up`, () => {
      expect(threshold(slug)).toBe(Math.ceil(viewBoxWidth(slug)));
    });
  }
});
