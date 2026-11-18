import { describe, expect, it } from 'vitest';
import { caseStudies } from '../../src/content';
import { chainFor } from '../../src/NodeDiagram';

/* The Work card's node diagram draws the study's own lane and states no fact of
   its own (owner, 2026-11-15: "Work card chart becomes a small node diagram"). */

const study = (slug: string) => caseStudies.find((c) => c.slug === slug)!;

describe('the card node diagram', () => {
  it('draws Relay from the React app to the primary model', () => {
    /* R4a-ds-3: the chain used to start at the API, because it was derived from
       the longest lane and that lane leaves the app out. The card starts at the
       app the customer uses. */
    expect(chainFor(study('relay')).filter((n) => !n.branch).map((n) => n.label)).toEqual([
      'React app',
      'Hono API',
      'SQS queue',
      'Worker',
      'LLM gateway',
      'Primary model',
    ]);
  });

  it('branches to the backup model, because the lane note says the gateway switches', () => {
    const chain = chainFor(study('relay'));
    const branch = chain.filter((n) => n.branch);
    expect(branch.map((n) => n.label)).toEqual(['Backup model']);
    /* The fork comes after the gateway it leaves from, not before it. */
    const gateway = chain.findIndex((n) => /gateway/i.test(n.label));
    const fork = chain.findIndex((n) => n.branch);
    expect(fork).toBeGreaterThan(gateway);
  });

  it('draws RannaGhor from the first check to the database, with no branch', () => {
    /* R4a-ds-3: the chain used to stop at the route handler, because the lane
       stops there. The card ends at the database the handler reaches. */
    const chain = chainFor(study('rannaghor'));
    expect(chain.every((n) => !n.branch)).toBe(true);
    expect(chain.map((n) => n.label)).toEqual([
      'Security headers',
      'Session',
      'Role check',
      'Route handler',
      'PostgreSQL',
    ]);
  });

  it('invents no label, and reads every one from a lane in content', () => {
    for (const study_ of caseStudies) {
      const lanes = study_.sections.flatMap((s) => s.blocks.flatMap((b) => (b.kind === 'diagram' ? b.lanes : [])));
      const fromContent = new Set(lanes.flatMap((l) => l.nodes));
      for (const node of chainFor(study_)) {
        if (node.branch) continue; /* stated by the lane's note, checked above */
        expect(fromContent.has(node.label), `${node.label} is not in any lane`).toBe(true);
      }
    }
  });
});
