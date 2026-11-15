/*
 * The absolute-URL head tags, in one place.
 *
 * The owner has not decided the deploy host, so `siteOrigin` ships empty and
 * none of these are emitted: a share card with a guessed host is worse than one
 * with a relative image, and a canonical pointing at the wrong address is worse
 * than no canonical. When the origin is set, each document gets a canonical
 * link, an og:url and an absolute share image, per route, with no other change.
 *
 * Kept as a plain function so the pre-render and the unit tests run the same
 * code: the test feeds an origin in without touching src/content.ts.
 */

const escapeAttr = (value) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/* The page's own canonical path: "/" for the home page, "/work/x" for a study.
   The 404 document is the one page that is not a place, so it claims none. */
const canonicalPath = (route) => (route === '/404' ? null : route);

export function applyOrigin(html, origin) {
  const base = (origin || '').replace(/\/+$/, '');
  if (!base) return html;

  const path = html.match(/<div id="root" data-route="([^"]*)">/)?.[1] ?? '/';
  const own = canonicalPath(path);
  if (!own) return html;

  const url = `${base}${own}`;
  const image = `${base}/og.png`;
  const tags = [
    `<link rel="canonical" href="${escapeAttr(url)}" />`,
    `<meta property="og:url" content="${escapeAttr(url)}" />`,
    `<meta property="og:image" content="${escapeAttr(image)}" />`,
    `<meta name="twitter:image" content="${escapeAttr(image)}" />`,
  ].join('\n    ');

  return html
    .replace(/<meta\s+property="og:image"[^>]*>/, `<meta property="og:image" content="${escapeAttr(image)}" />`)
    .replace(/<meta\s+name="twitter:image"[^>]*>/, `<meta name="twitter:image" content="${escapeAttr(image)}" />`)
    .replace('</head>', `    ${tags}\n  </head>`);
}
