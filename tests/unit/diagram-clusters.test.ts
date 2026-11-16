import { describe, expect, it } from 'vitest';
import { diagrams } from '../../src/diagrams';

/* A group heading names where a group starts; it is not a second copy of the
   first box beneath it. The vertical layout draws the heading in the place an
   entry edge would be, so a heading that repeats its own box's label or sublabel
   says the same thing twice on consecutive lines. Owner, at route close
   (2026-11-16): "Refused at the role check" over a box sublabelled "At the role
   check" reads as one sentence printed twice.

   A run of three or more words in common is the threshold: two words is a
   phrase's natural overlap ("the role"), three is a repeat. */

const words = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

const runs = (s: string, len: number) => {
  const w = words(s);
  return new Set(w.slice(0, Math.max(0, w.length - len + 1)).map((_, i) => w.slice(i, i + len).join(' ')));
};

const sharedRun = (a: string, b: string) => {
  const rb = runs(b, 3);
  for (const r of runs(a, 3)) if (rb.has(r)) return r;
  return null;
};

describe('no group heading repeats a box beneath it', () => {
  for (const [slug, spec] of Object.entries(diagrams)) {
    for (const cluster of spec.clusters) {
      it(`${slug}: "${cluster.heading}" adds a fact`, () => {
        const boxes = cluster.nodes
          .map((id) => spec.nodes.find((n) => n.id === id))
          .filter((n): n is NonNullable<typeof n> => Boolean(n));
        /* Guards the guard: the cluster must actually own boxes, or this test
           would pass by comparing a heading against nothing. */
        expect(boxes.length, `${cluster.id} has no inline nodes`).toBeGreaterThan(0);

        for (const box of boxes) {
          const labelRepeat = sharedRun(cluster.heading, box.name);
          expect(labelRepeat, `heading "${cluster.heading}" repeats ${box.id}'s label "${box.name}"`).toBeNull();
          if (box.detail) {
            const detailRepeat = sharedRun(cluster.heading, box.detail);
            expect(
              detailRepeat,
              `heading "${cluster.heading}" repeats ${box.id}'s sublabel "${box.detail}"`,
            ).toBeNull();
          }
        }
      });
    }
  }
});
