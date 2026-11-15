import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { caseStudies, contactLede, sectionOrder, workLede } from '../../src/content';

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

/* Owner-voice copy lives in src/content.ts, never in a component: two ledes
   were written straight into Home.tsx, which made a hiring claim the owner had
   not confirmed. The owner confirmed both on 2026-11-15 and they moved here. */
describe('section ledes', () => {
  it('keeps the Work lede in content, with its lead sentence split out', () => {
    expect(workLede.lead).toBe('Two systems, built end to end.');
    expect(workLede.lead + workLede.rest).toBe(
      'Two systems, built end to end. Each case study covers the problem, the architecture, the decisions and the results.',
    );
  });

  it('keeps the Contact lede in content, with its lead sentence split out', () => {
    expect(contactLede.lead).toBe('Hiring for a backend or full-stack role?');
    expect(contactLede.lead + contactLede.rest).toBe(
      'Hiring for a backend or full-stack role? Email is the fastest way to reach me.',
    );
  });

  it('renders them from content rather than hard-coding them in the page', () => {
    const home = readFileSync(resolve(process.cwd(), 'src/Home.tsx'), 'utf8');
    expect(home).toMatch(/\{workLede\.lead\}/);
    expect(home).toMatch(/\{contactLede\.lead\}/);
    expect(home).not.toContain('Two systems, built end to end.');
    expect(home).not.toContain('Hiring for a backend or full-stack role?');
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
