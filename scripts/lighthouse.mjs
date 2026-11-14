import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const PORT = Number(process.env.LH_PORT ?? 4173);
const ORIGIN = `http://localhost:${PORT}`;
const PAGES = [
  { name: 'home', path: '/' },
  { name: 'case-study', path: '/work/ticket-pipeline' },
];
const PRESETS = ['mobile', 'desktop'];
const THRESHOLDS = { performance: 95, accessibility: 95, 'best-practices': 95, seo: 95 };
const METRICS = { lcp: 2500, cls: 0.1, tbt: 200 };

const run = (cmd, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });

async function waitForServer(url, timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await sleep(250);
  }
  throw new Error(`preview server did not answer on ${url}`);
}

async function main() {
  await run('bun', ['run', 'build']);
  const preview = spawn('bunx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
    stdio: 'ignore',
  });
  const chrome = await chromeLauncher.launch({
    chromePath: '/usr/bin/google-chrome-stable',
    chromeFlags: ['--headless=new', '--no-sandbox'],
  });
  let failed = false;
  try {
    await waitForServer(ORIGIN);
    await mkdir('.lighthouse', { recursive: true });
    for (const preset of PRESETS) {
      for (const page of PAGES) {
        const result = await lighthouse(`${ORIGIN}${page.path}`, {
          port: chrome.port,
          output: 'json',
          logLevel: 'error',
          onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
          formFactor: preset,
          screenEmulation:
            preset === 'desktop'
              ? { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false }
              : undefined,
          throttlingMethod: 'simulate',
        });
        if (!result) throw new Error('lighthouse returned no result');
        const { lhr } = result;
        const file = `.lighthouse/${page.name}-${preset}.json`;
        await writeFile(file, JSON.stringify(lhr));
        const scores = Object.fromEntries(
          Object.entries(THRESHOLDS).map(([key]) => [key, Math.round((lhr.categories[key]?.score ?? 0) * 100)]),
        );
        const lcp = lhr.audits['largest-contentful-paint'].numericValue;
        /* The simulated LCP is what the score uses; the observed one is what
           the page actually did. Both print, so a run that swings is visible
           as the simulation reacting rather than the page getting slower. */
        const observedLcp = lhr.audits.metrics?.details?.items?.[0]?.observedLargestContentfulPaint ?? 0;
        const cls = lhr.audits['cumulative-layout-shift'].numericValue;
        const tbt = lhr.audits['total-blocking-time'].numericValue;
        const line = [
          `${page.path} ${preset}`,
          `perf ${scores.performance}`,
          `a11y ${scores.accessibility}`,
          `bp ${scores['best-practices']}`,
          `seo ${scores.seo}`,
          `LCP ${(lcp / 1000).toFixed(2)}s (observed ${Math.round(observedLcp)}ms)`,
          `CLS ${cls.toFixed(3)}`,
          `TBT ${Math.round(tbt)}ms`,
        ].join(' | ');
        console.log(line);
        const low = Object.entries(scores).filter(([key, value]) => value < THRESHOLDS[key]);
        if (low.length) {
          failed = true;
          console.error(`  below threshold: ${low.map(([key, value]) => `${key} ${value}`).join(', ')}`);
        }
        if (lcp > METRICS.lcp || cls > METRICS.cls || tbt > METRICS.tbt) {
          failed = true;
          console.error('  lab metric over budget');
        }
      }
    }
  } finally {
    await chrome.kill();
    preview.kill('SIGTERM');
  }
  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
