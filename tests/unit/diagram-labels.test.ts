import { describe, expect, it } from 'vitest';
import { caseStudies, securityCheckLabel } from '../../src/content';
import { diagrams } from '../../src/diagrams';

/* One page shows RannaGhor's first check twice: in the architecture lane, and as
   a station on the case study's flowchart. R2-3 allowed either wording, but two
   names for one thing on one screen reads as two different things, so both read
   the same constant. These tests keep them from drifting apart again. */

const laneNodes = (slug: string, lane: string) => {
  const study = caseStudies.find((c) => c.slug === slug);
  const block = study?.sections
    .flatMap((s) => s.blocks)
    .find((b) => b.kind === 'diagram' && b.lanes.some((l) => l.label === lane));
  return block?.kind === 'diagram' ? (block.lanes.find((l) => l.label === lane)?.nodes ?? []) : [];
};

describe('the security check has one name', () => {
  it('names it the same way in the lane and in the flowchart', () => {
    expect(laneNodes('rannaghor', 'Every API call')).toContain(securityCheckLabel);
    const node = diagrams['rannaghor'].nodes.find((s) => s.id === 'security');
    expect(node?.name).toBe(securityCheckLabel);
  });

  it('is stated once, and is the wording the lane already used', () => {
    /* The constant carries the lane's own words, so R2-3's other spelling is
       retired rather than kept as a second name on the same screen. */
    expect(securityCheckLabel).toBe('Security and CSRF');
    expect(securityCheckLabel).not.toBe('Security, CSRF');
  });

  it('shows the same wording in both places, whatever the constant holds', () => {
    /* Guards the guard: comparing two blanks would pass, so the values compared
       must be non-empty as well as equal. */
    const node = diagrams['rannaghor'].nodes.find((s) => s.id === 'security');
    expect(node?.name).toBeTruthy();
    expect(laneNodes('rannaghor', 'Every API call')[0]).toBe(node?.name);
  });
});
