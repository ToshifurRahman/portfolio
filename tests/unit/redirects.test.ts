import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/*
 * `public/_redirects` is the only host rule this repo ships, so it is the one
 * thing that decides what a host that reads it serves. It said
 * `/* /index.html 200`, which sends every unknown path to the pre-rendered home
 * page with a 200: dist/404.html was never served and the 404 was only real in
 * vite preview's own middleware.
 */
const root = process.cwd();
const rule = readFileSync(resolve(root, 'public/_redirects'), 'utf8');
const rules = rule
  .split('\n')
  .map((line) => line.replace(/#.*$/, '').trim())
  .filter(Boolean)
  .map((line) => {
    const [from, to, status] = line.split(/\s+/);
    return { from, to, status: Number(status ?? 200), line };
  });

/* The first matching rule wins, as on the hosts that read this file, and
   `:splat` is replaced by what the `*` matched. */
const resolvePath = (path: string) => {
  for (const { from, to, status } of rules) {
    if (from === path) return { to, status };
    if (from.endsWith('/*')) {
      const prefix = from.slice(0, -1);
      if (path.startsWith(prefix)) return { to: to.replace(':splat', path.slice(prefix.length)), status };
    }
    if (from === '/*') return { to, status };
  }
  return { to: path, status: 200 };
};

describe('host redirects', () => {
  it('never sends an unknown path to the home page with 200', () => {
    expect(rules.length).toBeGreaterThan(0);
    const unknown = resolvePath('/no-such-page');
    expect(unknown.status, `resolves to ${unknown.to} ${unknown.status}`).toBe(404);
    expect(unknown.to).toMatch(/\/404\.html$/);
  });

  it('serves each pre-rendered route its own document', () => {
    expect(resolvePath('/')).toEqual({ to: '/index.html', status: 200 });
    expect(resolvePath('/work/ticket-pipeline').to).toBe('/work/ticket-pipeline/index.html');
    expect(resolvePath('/work/rannaghor').to).toBe('/work/rannaghor/index.html');
  });

  it('leaves real files and assets alone', () => {
    for (const path of ['/favicon.svg', '/og.png', '/assets/index-abc.js', '/cv/Toshifur-Rahman-CV.pdf']) {
      const hit = resolvePath(path);
      expect(hit.to, `${path} was rewritten to ${hit.to}`).toBe(path);
      expect(hit.status).toBe(200);
    }
  });

  it('keeps an unknown path under a known prefix a 404', () => {
    expect(resolvePath('/work/no-such-study').status).toBe(404);
  });
});
