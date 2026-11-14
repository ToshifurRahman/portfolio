/*
 * Draws `public/og.png`, the 1200x630 share card, from the site's own type and
 * tokens. Run it only when the card's words or the palette change:
 *
 *   bun run og
 *
 * It renders an HTML fragment in the installed Chrome, at exactly the card's
 * size, so the card uses the same Archivo Variable file the site ships rather
 * than a system substitute. Nothing is drawn from a photo, per PRODUCT.md.
 */
import { readFileSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const root = resolve(import.meta.dirname, '..');
const out = resolve(root, 'public/og.png');
const font = readFileSync(
  resolve(root, 'node_modules/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2'),
).toString('base64');

/* The tokens below are copied from `:root` in src/styles.css on purpose: this
   file is a picture of the site, not part of it, and it must not drift with a
   theme switch. Update both together. */
const card = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><style>
@font-face {
  font-family: 'Archivo Variable';
  font-weight: 100 900;
  font-stretch: 62% 125%;
  src: url(data:font/woff2;base64,${font}) format('woff2-variations');
}
:root {
  --bg: #0e0f11;
  --ink: #f2f0ea;
  --muted: #9a9ea5;
  --accent: #ff5b36;
  --line: 2px;
}
* { box-sizing: border-box; margin: 0; }
body {
  width: 1200px;
  height: 630px;
  padding: 44px 72px 40px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: var(--bg);
  color: var(--ink);
  font-family: 'Archivo Variable', sans-serif;
  -webkit-font-smoothing: antialiased;
}
.rule { height: var(--line); background: var(--ink); flex: none; }
.label {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
}
.display {
  font-stretch: 62%;
  font-weight: 900;
  text-transform: uppercase;
  line-height: 0.88;
  letter-spacing: -0.005em;
}
.name { font-size: 132px; white-space: nowrap; }
.role { font-size: 82px; color: var(--muted); margin-top: 10px; }
.statement { font-size: 30px; line-height: 1.25; }
.chain { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 0 14px; }
.state {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 6px;
  min-height: 62px;
  padding: 7px 6px;
  border: var(--line) solid var(--ink);
  font-stretch: 62%;
  font-weight: 900;
  text-transform: uppercase;
  font-size: 16px;
  line-height: 0.95;
  letter-spacing: -0.01em;
  white-space: nowrap;
}
.state span {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--muted);
}
.state.now { border-color: var(--accent); }
.state.now span { color: var(--accent); }
</style></head>
<body>
  <div class="top" style="display:flex;justify-content:space-between;align-items:baseline">
    <p class="label">Portfolio</p>
    <p class="label">Software Engineering</p>
  </div>
  <div>
    <p class="display name">Toshifur Rahman</p>
    <p class="display role">Software Engineer</p>
  </div>
  <div class="rule"></div>
  <p class="statement">Backend and full-stack systems, designed for the moment they fail.</p>
  <div class="chain">
    <span class="state now"><span>01</span>About</span><span class="state"><span>02</span>Work</span><span class="state"><span>03</span>Experience</span><span class="state"><span>04</span>Achievements</span><span class="state"><span>05</span>Certificates</span><span class="state"><span>06</span>Skills</span><span class="state"><span>07</span>Contact</span>
  </div>
</body></html>`;

const dir = await mkdtemp(join(tmpdir(), 'og-'));
const page = join(dir, 'card.html');
await writeFile(page, card, 'utf8');

const browser = await chromium.launch({ channel: 'chrome' });
try {
  const tab = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await tab.goto(`file://${page}`);
  await tab.evaluate(() => document.fonts.ready);
  await tab.screenshot({ path: out, type: 'png' });
} finally {
  await browser.close();
  await rm(dir, { recursive: true, force: true });
}

console.log(`wrote ${out}`);
