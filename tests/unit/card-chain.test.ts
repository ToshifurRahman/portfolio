import { describe, expect, it } from 'vitest';
import { caseStudies } from '../../src/content';
import { chainFor } from '../../src/NodeDiagram';

/* R4a-ds-3, from the review of R4a: the Work card's node diagram stopped short of
   the chain the brief names. It picked the longest lane and drew only that, so
   Ticket-Pipeline began at "Hono API" with no React app in front of it, and
   RannaGhor began at the security check with no database behind it.

   The chains below are the ones R4a-3 wrote. Every label is still read from the
   study's own lanes in src/content.ts — the spec names which ones and in what
   order, it does not state a new fact. */

const study = (slug: string) => caseStudies.find((c) => c.slug === slug)!;
const labels = (slug: string) => chainFor(study(slug)).map((n) => n.label);

describe('Ticket-Pipeline’s card chain', () => {
  it('runs from the React app to the primary model, through the queue and worker', () => {
    expect(labels('ticket-pipeline')).toEqual([
      'React app',
      'Hono API',
      'SQS queue',
      'Worker',
      'LLM gateway',
      'Primary model',
      'Backup model',
    ]);
  });

  it('starts with the React app and ends with the primary model', () => {
    const chain = labels('ticket-pipeline');
    expect(chain[0]).toBe('React app');
    expect(chain[1]).toBe('Hono API');
    /* The backup model is the branch, so it is last and marked as one. */
    expect(chain[chain.length - 1]).toBe('Backup model');
    expect(chain[chain.length - 2]).toBe('Primary model');
  });

  it('has no PostgreSQL node on the card', () => {
    /* The brief is explicit: the card shows the app, the queue, the worker and
       the models, not the database, which would add a seventh box to a card. */
    expect(labels('ticket-pipeline')).not.toContain('PostgreSQL');
  });

  it('marks the backup model as the one branch', () => {
    const branches = chainFor(study('ticket-pipeline')).filter((n) => n.branch);
    expect(branches).toHaveLength(1);
    expect(branches[0].label).toBe('Backup model');
  });
});

describe('RannaGhor’s card chain', () => {
  it('runs from the security check to PostgreSQL, through every check', () => {
    expect(labels('rannaghor')).toEqual([
      'Security and CSRF',
      'Rate limit',
      'Session',
      'Role check',
      'Route handler',
      'PostgreSQL',
    ]);
  });

  it('starts at the security check and ends at the database', () => {
    const chain = labels('rannaghor');
    expect(chain[0]).toBe('Security and CSRF');
    expect(chain[chain.length - 1]).toBe('PostgreSQL');
  });

  it('has no fork', () => {
    expect(chainFor(study('rannaghor')).filter((n) => n.branch)).toEqual([]);
  });
});

describe('every label is sourced from the study’s own content', () => {
  /* The guard that matters: a chain may not invent a box. Each label has to
     appear in one of the study's own architecture lanes. */
  for (const slug of ['ticket-pipeline', 'rannaghor']) {
    it(`${slug}: every node label appears in a lane, or is the stated branch`, () => {
      const lanes = study(slug).sections.flatMap((s) =>
        s.blocks.flatMap((b) => (b.kind === 'diagram' ? b.lanes : [])),
      );
      const sourced = new Set(lanes.flatMap((l) => l.nodes));
      const notes = lanes.map((l) => l.note ?? '').join(' ');

      for (const node of chainFor(study(slug))) {
        if (node.branch) {
          /* The branch is named by the lane's own note. */
          expect(notes.toLowerCase(), `${node.label} is not in any note`).toContain(node.label.toLowerCase());
        } else {
          expect(sourced.has(node.label), `${node.label} is not in any lane`).toBe(true);
        }
      }
    });
  }
});
