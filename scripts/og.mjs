/*
 * Draws `public/og.png`, the 1200x630 share card, from the site's own type and
 * tokens. Run it only when the card's words or the palette change:
 *
 *   bun run og
 *
 * It renders an HTML fragment in the installed Chrome, at exactly the card's
 * size, so the card uses the same Mona Sans and Martian Mono files the site
 * ships rather than system substitutes. Nothing is drawn from a photo, per PRODUCT.md.
 */
import { readFileSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { owner, proof } from '../src/content.ts';

const root = resolve(import.meta.dirname, '..');
const out = resolve(root, 'public/og.png');
const face = (pkg, file) =>
  readFileSync(resolve(root, `node_modules/@fontsource-variable/${pkg}/files/${file}`)).toString('base64');
const sans = face('mona-sans', 'mona-sans-latin-wght-normal.woff2');
const mono = face('martian-mono', 'martian-mono-latin-wght-normal.woff2');

const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/* The motto as on the home page: the closing clause in full ink, the rest
   muted. */
const at = owner.statement.indexOf(owner.statementEmphasis);
const statement =
  at < 0
    ? escape(owner.statement)
    : `${escape(owner.statement.slice(0, at))}<em>${escape(owner.statementEmphasis)}</em>${escape(
        owner.statement.slice(at + owner.statementEmphasis.length),
      )}`;

/* The proof row is the home page's own, read from content.ts. */
const figures = proof
  .map((p) => `<li><span class="value">${escape(p.value)}</span><span class="label">${escape(p.label)}</span></li>`)
  .join('');

/* Relay's main line, as the home page's track draws it, completed. */
const stations = ['Queued', 'Triaging', 'Drafting', 'Completed'];
const track = stations
  .map((name, i) => {
    const x = 160 + i * 300;
    return `<circle cx="${x}" cy="40" r="8" class="lamp"/><text x="${x}" y="76" text-anchor="middle">${name.toUpperCase()}</text>`;
  })
  .join('');

/* The tokens below are copied from `:root` in src/styles.css on purpose: this
   file is a picture of the site, not part of it, and it must not drift with a
   theme switch. Update both together. */
const card = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><style>
@font-face { font-family: 'Mona Sans Variable'; font-weight: 200 900; src: url(data:font/woff2;base64,${sans}) format('woff2-variations'); }
@font-face { font-family: 'Martian Mono Variable'; font-weight: 100 800; src: url(data:font/woff2;base64,${mono}) format('woff2-variations'); }
:root {
  --bg: #0a0b0d;
  --bg-raised: #0f1114;
  --ink: #f2f1ec;
  --muted: #8b9099;
  --grid: #15181c;
  --rule: #23272d;
  --rule-strong: #343941;
  --accent: #ffb340;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  position: relative;
  width: 1200px;
  height: 630px;
  background: var(--bg);
  color: var(--ink);
  font-family: 'Mona Sans Variable', sans-serif;
  -webkit-font-smoothing: antialiased;
}
.frame { position: absolute; inset: 0 40px; border-inline: 1px solid var(--rule); }
.top { position: absolute; left: 88px; right: 88px; top: 56px; display: grid; grid-template-columns: 1.15fr 1fr; gap: 48px; align-items: end; }
.name { font-size: 86px; font-weight: 680; line-height: 0.92; letter-spacing: -0.045em; }
.role { margin-top: 16px; font-size: 24px; white-space: nowrap; font-weight: 520; letter-spacing: -0.015em; }
.role span { color: var(--muted); font-weight: 430; }
.statement { font-size: 34px; font-weight: 520; line-height: 1.18; letter-spacing: -0.03em; color: var(--muted); }
.statement em { font-style: normal; color: var(--ink); }
ul { position: absolute; left: 88px; right: 88px; top: 342px; list-style: none; display: grid; grid-template-columns: repeat(${proof.length}, 1fr); border-top: 1px solid var(--rule); }
li { display: flex; flex-direction: column; gap: 8px; padding: 18px 0 0; }
li + li { padding-left: 20px; border-left: 1px solid var(--rule); }
.value { font-size: 40px; font-weight: 600; line-height: 1; letter-spacing: -0.03em; }
.label { font-size: 17px; color: var(--muted); }
.band { position: absolute; left: 0; right: 0; bottom: 0; height: 150px; background: var(--bg-raised); border-top: 1px solid var(--rule); }
svg { position: absolute; left: 0; top: 30px; width: 1200px; height: 100px; }
svg line { stroke: var(--ink); stroke-width: 2; }
svg .lamp { fill: var(--ink); }
svg .token { fill: var(--accent); }
svg text { font-family: 'Martian Mono Variable', monospace; font-size: 14px; letter-spacing: 0.04em; fill: var(--muted); }
</style></head>
<body>
  <div class="frame"></div>
  <div class="top">
    <div>
      <p class="name">${escape(owner.firstName)}<br>${escape(owner.lastName)}</p>
      <p class="role">${escape(owner.role)} <span>· ${escape(owner.location)}</span></p>
    </div>
    <p class="statement">${statement}</p>
  </div>
  <ul>${figures}</ul>
  <div class="band">
    <svg viewBox="0 0 1200 100" aria-hidden="true">
      <line x1="0" y1="40" x2="1200" y2="40"/>
      ${track}
      <rect class="token" x="990" y="34" width="40" height="12" rx="3"/>
    </svg>
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
