import { describe, expect, it } from 'vitest';
import { caseStudies, sectionOrder } from '../../src/content';

/* The owner asked for the unconfirmed first-person blocks to come off the site:
   both case studies' Motivation and Future improvements sections are gone, and
   the section list every case study follows no longer names them. */
describe('case-study sections', () => {
  it('lists the seven confirmed sections in order', () => {
    expect(sectionOrder.map((s) => s.id)).toEqual([
      'overview',
      'problem',
      'architecture',
      'tech-decisions',
      'challenges',
      'solutions',
      'results',
    ]);
  });

  it('gives every case study exactly those sections, in that order', () => {
    for (const study of caseStudies) {
      expect(study.sections.map((s) => s.id), study.slug).toEqual(sectionOrder.map((s) => s.id));
      expect(study.sections.map((s) => s.title), study.slug).toEqual(sectionOrder.map((s) => s.title));
    }
  });

  it('ships no unconfirmed draft text', () => {
    const text = JSON.stringify(caseStudies);
    expect(text).not.toMatch(/DRAFT/);
    expect(text).not.toMatch(/I wanted to (build|a project)/);
  });
});

/* The RannaGhor sign-in claim has to match the product: the phone provider is
   commented out in packages/auth/src/index.ts, so the site must not claim it. */
describe('RannaGhor sign-in claim', () => {
  it('names only the sign-in methods the product enables', () => {
    const rannaghor = caseStudies.find((s) => s.slug === 'rannaghor')!;
    const text = JSON.stringify(rannaghor);
    expect(text).not.toMatch(/phone/i);
    expect(text).toMatch(/Email and password with verification/);
    expect(text).toMatch(/Google sign-in/);
    expect(text).toMatch(/remember me/);
  });
});
