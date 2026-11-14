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

const routes = [
  { file: 'index.html', route: '/', heading: 'name display' },
  { file: 'work/ticket-pipeline/index.html', route: '/work/ticket-pipeline', heading: 'display study-title' },
  { file: 'work/rannaghor/index.html', route: '/work/rannaghor', heading: 'display study-title' },
  { file: '404.html', route: '/404', heading: 'No such state' },
];

describe('pre-rendered routes', () => {
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
    const study = read('work/ticket-pipeline/index.html');
    expect(study).toContain('Ticket-Pipeline');
    expect(study).not.toContain('class="name display"');
    const home = read('index.html');
    expect(home).toContain('class="name display"');
    expect(home).not.toContain('class="display study-title"');
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

  it('hydrates the pre-rendered markup instead of replacing it', () => {
    const main = readFileSync(resolve(root, 'src/main.tsx'), 'utf8');
    expect(main).toMatch(/hydrateRoot/);
    expect(main).toMatch(/firstElementChild/);
    expect(main).toMatch(/dataset\.route/);
  });
});
