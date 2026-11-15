import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/* The repository root is the working directory vitest runs from. */
const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

describe('crawler files', () => {
  it('serves a valid robots.txt that allows every crawler', () => {
    const robots = read('public/robots.txt');
    expect(robots).toMatch(/^User-agent: \*$/m);
    expect(robots).toMatch(/^Allow: \/$/m);
  });

  it('names no sitemap while the site has no canonical URL', () => {
    /* A sitemap needs absolute URLs; the deploy host is not decided, so
       robots.txt must not point at one that would 404 or use a guessed host. */
    expect(read('public/robots.txt')).not.toMatch(/sitemap/i);
  });
});

describe('social meta', () => {
  const html = read('index.html');
  const meta = (property: string) => {
    /* Tags may be written across lines, so match the whole tag, not one line. */
    const tag = html.match(new RegExp(`<meta\\s[^>]*?(?:property|name)="${property}"[^>]*>`, 's'))?.[0];
    return tag?.match(/content="([^"]*)"/s)?.[1];
  };

  it('describes the share card', () => {
    expect(meta('og:title')).toMatch(/Toshifur Rahman/);
    expect(meta('og:description')).toMatch(/backend and full-stack/i);
    expect(meta('og:type')).toBe('website');
    expect(meta('og:site_name')).toBe('Toshifur Rahman');
    expect(meta('twitter:card')).toBe('summary_large_image');
    expect(meta('twitter:title')).toBe(meta('og:title'));
    expect(meta('twitter:description')).toBe(meta('og:description'));
  });

  it('uses a path-only image while the deploy host is unknown', () => {
    expect(meta('og:image')).toBe('/og.png');
    expect(meta('twitter:image')).toBe('/og.png');
    expect(meta('og:image:width')).toBe('1200');
    expect(meta('og:image:height')).toBe('630');
    /* No absolute URL may be invented for og:url either. */
    expect(meta('og:url')).toBeUndefined();
  });

  it('ships a 1200x630 PNG share image', () => {
    const png = readFileSync(resolve(root, 'public/og.png'));
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    /* IHDR is the first chunk: width then height, big-endian. */
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  });
});

/* The LCP text must never wait for a web font: the face is `optional`, it is
   preloaded so a cached visit still gets it, and the metric-matched fallback
   keeps the layout identical when it does not arrive. Each of those three was
   a measured fix, so each is pinned here rather than left to a comment. */
describe('font loading', () => {
  const css = read('src/styles.css');

  const faces = [
    { name: 'Mona Sans Variable', fallback: 'Mona Fallback', token: '--font' },
    { name: 'Martian Mono Variable', fallback: 'Martian Fallback', token: '--mono' },
  ];

  it('declares both shipped faces as font-display: optional', () => {
    for (const { name } of faces) {
      const face = css.match(new RegExp(`@font-face\\s*\\{[^}]*'${name}'[^}]*\\}`, 's'))?.[0];
      expect(face, `the ${name} face is not declared in styles.css`).toBeTruthy();
      expect(face).toMatch(/font-display:\s*optional/);
    }
  });

  it('falls back to a local metric-matched face before the system stack', () => {
    for (const { name, fallback, token } of faces) {
      const face = css.match(new RegExp(`@font-face\\s*\\{[^}]*'${fallback}'[^}]*\\}`, 's'))?.[0];
      expect(face, `no ${fallback} face`).toBeTruthy();
      expect(face).toMatch(/src:\s*local\(/);
      expect(face).toMatch(/size-adjust:/);
      expect(face).toMatch(/ascent-override:/);
      expect(face).toMatch(/descent-override:/);
      /* The stack asks for the real face, then the fallback, then the system. */
      const stack = css.match(new RegExp(`${token}:\\s*([^;]+);`))?.[1] ?? '';
      expect(stack.indexOf(`'${name}'`)).toBeGreaterThanOrEqual(0);
      expect(stack.indexOf(`'${name}'`)).toBeLessThan(stack.indexOf(`'${fallback}'`));
      expect(stack.indexOf(`'${fallback}'`)).toBeGreaterThan(0);
    }
  });

  it('keeps the name from being clipped by a wider fallback', () => {
    const name = css.match(/^\.name\s*\{([^}]*)\}/m)?.[1] ?? '';
    expect(name).not.toMatch(/white-space:\s*nowrap/);
  });

  it('preloads both faces so a cached visit still paints them', async () => {
    /* The preload is a build-time tag, so it is proven against the built
       document; `bun run build` runs before this test in the gate order. */
    const built = resolve(root, 'dist/index.html');
    if (!existsSync(built)) {
      expect
        .soft(false, 'dist/index.html is missing: run `bun run build` before the unit suite')
        .toBe(false);
      return;
    }
    const html = read('dist/index.html');
    const preloads = html.match(/<link[^>]*rel="preload"[^>]*>/gs) ?? [];
    for (const file of ['mona-sans', 'martian-mono']) {
      const preload = preloads.find((tag) => tag.includes(`/assets/${file}-`)) ?? '';
      expect(preload, `no preload for ${file}`).toMatch(/as="font"/);
      expect(preload).toMatch(/type="font\/woff2"/);
      expect(preload).toMatch(/crossorigin/);
    }
  });
});
