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
 *
 * Each #root records the route it was rendered for. The client compares that
 * with the address and only hydrates on a match; a document served for an
 * address it was not rendered for (a 404, say) is rendered over instead, so
 * React never hydrates markup it did not produce.
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { build } from 'vite';
/* The 404 document is written for no particular address; its `data-route` is
   the sentinel the client and the preview server both know. */
const NOT_FOUND = '/404';

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
/* The route metadata comes from the same source the page renders from. */
const { caseStudies, owner } = await import('../dist-server/entry-server.js');

/* Every document keeps the template's head unless it is given its own, which
   would ship the home page's title and description on both case studies. The
   title matches what useTitle sets once the page is live, so the tab does not
   change text when the app hydrates. */
const head = (title, description) => ({
  title: title ? `${title} · ${owner.name}` : `${owner.name}, ${owner.role}`,
  description,
});

const ROUTES = [
  { path: '/', file: 'dist/index.html', head: null },
  ...caseStudies.map((study) => ({
    path: `/work/${study.slug}`,
    file: `dist/work/${study.slug}/index.html`,
    head: head(`${study.title} case study`, study.summary),
  })),
  { path: NOT_FOUND, file: 'dist/404.html', head: head('Page not found', 'This address does not match any page on the site.') },
];

/* Replace the template's title and description; everything else in the head
   (the preload, the theme script) stays as it is. Both title tags are
   replaced: og:title and twitter:title stayed the home page's, so a shared
   link to a case study previewed as the home page. */
const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
function applyHead(html, own) {
  if (!own) return html;
  const title = escape(own.title);
  const description = escape(own.description);
  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
    .replace(
      /<meta\s+name="description"[\s\S]*?\/>/,
      `<meta name="description" content="${description}" />`,
    )
    .replace(/<meta\s+property="og:title"[\s\S]*?\/>/, `<meta property="og:title" content="${title}" />`)
    .replace(
      /<meta\s+property="og:description"[\s\S]*?\/>/,
      `<meta property="og:description" content="${description}" />`,
    )
    .replace(/<meta\s+name="twitter:title"[\s\S]*?\/>/, `<meta name="twitter:title" content="${title}" />`)
    .replace(
      /<meta\s+name="twitter:description"[\s\S]*?\/>/,
      `<meta name="twitter:description" content="${description}" />`,
    );
}

const template = await readFile('dist/index.html', 'utf8');

if (!template.includes('<div id="root"></div>')) {
  throw new Error('dist/index.html has no empty #root to fill; did the build change?');
}

for (const route of ROUTES) {
  const markup = render(route.path);
  if (!markup) throw new Error(`route ${route.path} rendered nothing`);
  const html = applyHead(
    template.replace('<div id="root"></div>', `<div id="root" data-route="${route.path}">${markup}</div>`),
    route.head,
  );
  await mkdir(route.file.slice(0, route.file.lastIndexOf('/')), { recursive: true });
  await writeFile(route.file, html);
  console.log(`prerendered ${route.path} -> ${route.file} (${markup.length} bytes of markup)`);
}

/* dist-server is a build intermediate, not an artifact to ship. */
await rm('dist-server', { recursive: true, force: true });
