import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/* docs/writing-a-case-study.md names files and tests by path. A rename leaves
   the guide pointing at nothing, so every backticked path under src, tests,
   scripts or public must exist. */

const root = process.cwd();
const guide = readFileSync(resolve(root, 'docs/writing-a-case-study.md'), 'utf8');
const named = [...guide.matchAll(/`((?:src|tests|scripts|public)\/[^`]+)`/g)].map((match) => match[1]);

describe('docs/writing-a-case-study.md', () => {
  it('names paths under src, tests, scripts or public', () => {
    expect(named.length).toBeGreaterThan(10);
  });

  it('names only paths that exist', () => {
    const missing = named.filter((path) => !existsSync(resolve(root, path)));
    expect(missing).toEqual([]);
  });
});
