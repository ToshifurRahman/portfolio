/*
 * Pre-render every route into the built HTML.
 *
 * The page's largest text is drawn by React, so before this the first layout
 * could only come from the JS bundle: Lantern then either counted the bundle as
 * a dependency of the first paint (two simulated round trips, 1.21 s) or did
 * not, depending on whether the browser had painted an empty frame first. That
 * coin flip was the perf 94. With the markup in the document the first layout
 * comes from parsing, so the bundle is not on the critical path at all.
 *
 * Runs after `vite build`: builds the server entry with vite's own pipeline,
 * renders each route, and writes the markup into the document's #root. The
 * client then hydrates that markup instead of replacing it.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { build } from 'vite';

const ROUTES = ['/', '/work/ticket-pipeline', '/work/rannaghor'];

await build({
  logLevel: 'error',
  build: {
    ssr: 'src/entry-server.tsx',
    outDir: 'dist-server',
    emptyOutDir: true,
    write: true,
  },
});

const { render } = await import('../dist-server/entry-server.js');
const template = await readFile('dist/index.html', 'utf8');

if (!template.includes('<div id="root"></div>')) {
  throw new Error('dist/index.html has no empty #root to fill; did the build change?');
}

for (const route of ROUTES) {
  const markup = render(route);
  if (!markup) throw new Error(`route ${route} rendered nothing`);
  const html = template.replace('<div id="root"></div>', `<div id="root">${markup}</div>`);
  const file = route === '/' ? 'dist/index.html' : `dist${route}/index.html`;
  await mkdir(file.slice(0, file.lastIndexOf('/')), { recursive: true });
  await writeFile(file, html);
  console.log(`prerendered ${route} -> ${file} (${markup.length} bytes of markup)`);
}
