import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/*
 * The site is hosted on Cloudflare Workers static assets, configured by
 * `wrangler.jsonc`. It used to ship a Netlify-style `public/_redirects`;
 * Cloudflare rejects that file (a `/ /index.html 200` rule is an infinite loop
 * under its own .html handling, and a redirect cannot carry a 404 status), and
 * its built-in handling does the same job, so the file is gone.
 */
const root = process.cwd();
const stripComments = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const config = JSON.parse(stripComments(readFileSync(resolve(root, 'wrangler.jsonc'), 'utf8')));

describe('host config', () => {
  it('serves the built folder as static assets with no Worker script', () => {
    expect(config.assets.directory).toBe('./dist');
    expect(config.main).toBeUndefined();
  });

  it('never sends an unknown path to the home page with 200', () => {
    expect(config.assets.not_found_handling).toBe('404-page');
  });

  it('serves each pre-rendered route at its address without a trailing slash', () => {
    expect(config.assets.html_handling).toBe('drop-trailing-slash');
  });

  it('ships no _redirects file for the host to reject', () => {
    expect(existsSync(resolve(root, 'public/_redirects'))).toBe(false);
  });
});
