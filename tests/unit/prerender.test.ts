import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/*
 * The build pre-renders every route. That is not a nicety: the page's largest
 * text used to be drawn by the JS bundle, so Lantern sometimes counted the
 * 293 kB bundle as a dependency of the first paint and the desktop case-study
 * score fell to 94 (simulated LCP 1.21 s instead of 0.61 s) in about one run in
 * three. With the markup in the document the first layout comes from parsing
 * and the bundle is not on the critical path. These assertions keep it that
 * way; they read the built output, so `bun run build` must run first.
 */
const root = process.cwd();
const built = (path: string) => resolve(root, 'dist', path);
const read = (path: string) => readFileSync(built(path), 'utf8');

/* These read the built output, so they only mean something after a build.
   `bun run test` on its own must still pass, so the whole file skips with a
   named reason instead of failing on ENOENT - the same guard nav-meta uses. */
const hasBuild = existsSync(built('index.html'));
const whenBuilt = hasBuild ? describe : describe.skip;
/* Named so a skipped run says why, not just "skipped". */
const why = 'dist/index.html is missing: run `bun run build` before the unit suite';

const routes = [
  { file: 'index.html', route: '/', heading: 'class="name"' },
  { file: 'work/relay/index.html', route: '/work/relay', heading: 'class="study-title"' },
  { file: 'work/rannaghor/index.html', route: '/work/rannaghor', heading: 'class="study-title"' },
  { file: '404.html', route: '/404', heading: 'Page not found' },
];

whenBuilt(`pre-rendered routes (${hasBuild ? 'built output' : why})`, () => {
  it('writes a document for every route', () => {
    for (const route of routes) {
      expect(existsSync(built(route.file)), `${route.file} was not written`).toBe(true);
    }
  });

  it('puts the page markup inside #root, not an empty shell', () => {
    for (const route of routes) {
      const html = read(route.file);
      const start = html.indexOf(`<div id="root" data-route="${route.route}">`);
      expect(start, `${route.file} has no #root`).toBeGreaterThan(0);
      /* Everything from #root to the end of the body is the pre-rendered page. */
      const markup = html.slice(start, html.indexOf('</body>'));
      expect(markup.length, `${route.file} has an empty #root`).toBeGreaterThan(1000);
      expect(markup).toContain(route.heading);
    }
  });

  it('gives each route its own heading, not the home page', () => {
    const study = read('work/relay/index.html');
    expect(study).toContain('Relay');
    expect(study).not.toContain('class="name"');
    const home = read('index.html');
    expect(home).toContain('class="name"');
    expect(home).not.toContain('class="study-title"');
  });

  it('lays the markup out before the bundle runs', () => {
    /* Without this the browser may defer the first layout into the module's
       own task, which puts the bundle back on the LCP critical path. The
       module tag itself is hoisted into <head> by the build and is deferred
       by the browser, so what matters is that the layout script is classic
       (runs while parsing) and comes after the markup. */
    for (const route of routes) {
      const html = read(route.file);
      const layout = html.match(/<script>([^<]*getBoundingClientRect[^<]*)<\/script>/)?.[1];
      expect(layout, `${route.file} has no early layout script`).toBeTruthy();
      /* A classic inline script, not a module: modules are deferred. */
      expect(html.indexOf('getBoundingClientRect')).toBeGreaterThan(html.indexOf('<div id="root"'));
      const tag = html.slice(html.lastIndexOf('<script', html.indexOf('getBoundingClientRect')), html.indexOf('getBoundingClientRect'));
      expect(tag).not.toContain('type="module"');
    }
  });

  it('stamps #root with the route it was rendered for', () => {
    /* The client hydrates only on a match, so a document served for an address
       it was not rendered for is rendered over instead of hydrated. */
    for (const route of routes) {
      expect(read(route.file)).toContain(`data-route="${route.route}"`);
    }
  });

  it('gives every document its own title and description', () => {
    /* Every document starts from the same template, so without this all four
       ship the home page's title and description. The title matches what
       useTitle sets once the app is live, so the tab does not change text. */
    const titles = routes.map((route) => {
      const html = read(route.file);
      return html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
    });
    expect(new Set(titles).size, `titles are not distinct: ${titles.join(' | ')}`).toBe(routes.length);
    expect(titles[0]).toBe('Toshifur Rahman, Software Engineer');
    expect(titles[1]).toBe('Relay case study · Toshifur Rahman');
    expect(titles[2]).toBe('RannaGhor case study · Toshifur Rahman');
    expect(titles[3]).toBe('Page not found · Toshifur Rahman');

    /* The description follows the title, in all three places it is written. */
    const study = read('work/relay/index.html');
    const description = study.match(/<meta\s+name="description"\s+content="([^"]*)"/)?.[1] ?? '';
    expect(description).toMatch(/support-ticket pipeline/i);
    expect(study).toContain(`<meta property="og:description" content="${description}"`);
    expect(study).toContain(`<meta name="twitter:description" content="${description}"`);
    /* And the home page keeps its own. */
    expect(read('index.html')).toMatch(/<meta\s+name="description"\s+content="Toshifur Rahman, software engineer/);
  });

  it('gives every document its own share-card title too', () => {
    /* og:title and twitter:title stayed the home page's on both studies and
       the 404, so a shared link to a case study previewed as the home page. */
    const share = (file: string) => {
      const html = read(file);
      const og = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/)?.[1] ?? '';
      const twitter = html.match(/<meta\s+name="twitter:title"\s+content="([^"]*)"/)?.[1] ?? '';
      const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
      return { og, twitter, title };
    };
    for (const route of routes) {
      const { og, twitter, title } = share(route.file);
      expect(og, `${route.file} og:title`).toBe(title);
      expect(twitter, `${route.file} twitter:title`).toBe(title);
    }
    expect(share('work/relay/index.html').og).toMatch(/Relay/);
    expect(share('404.html').og).toMatch(/Page not found/);
  });

  it('leaves no server bundle behind', () => {
    /* dist-server is a build intermediate; shipping it would put a second copy
       of the app, react-dom/server included, next to the real one. */
    expect(existsSync(resolve(root, 'dist-server'))).toBe(false);
  });

  it('hydrates the pre-rendered markup instead of replacing it', () => {
    const main = readFileSync(resolve(root, 'src/main.tsx'), 'utf8');
    expect(main).toMatch(/hydrateRoot/);
    expect(main).toMatch(/firstElementChild/);
    expect(main).toMatch(/dataset\.route/);
  });
});
