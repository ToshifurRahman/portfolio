import { readFileSync } from 'node:fs';
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
