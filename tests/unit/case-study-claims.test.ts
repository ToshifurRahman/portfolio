import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { caseStudies } from '../../src/content';

/* Three claims the Gate 1 review found the studies making that the repositories do
   not support, plus the guide's own rule about where the outcome sentence goes.
   Each is pinned here so the wording cannot drift back. */

const study = (slug: string) => caseStudies.find((s) => s.slug === slug)!;
const text = (slug: string) => JSON.stringify(study(slug));

describe('the outcome sentence closes Results', () => {
  /* docs/writing-a-case-study.md: "`outcome` is the sentence that closes Results,
     word for word." Relay's Results closed with the accessibility paragraph, so the
     card's sentence was the opening p and the closing one was a different fact. */
  for (const { slug } of caseStudies) {
    it(`${slug}: the last Results block is the outcome, word for word`, () => {
      const results = study(slug).sections.find((s) => s.id === 'results')!;
      const last = results.blocks.at(-1)!;
      expect(last.kind, slug).toBe('p');
      expect((last as { kind: 'p'; text: string }).text, slug).toBe(study(slug).outcome);
    });
  }
});

describe('the shared packages claim matches the repository', () => {
  /* apps/web has no @ecommerce-site/db dependency and no import of it, and its
     tsconfig.json has no `extends`; only apps/server, packages/auth, packages/db
     and packages/env extend @ecommerce-site/config. The note said both apps import
     the same schema and extend one config, which is false for the web app. */
  it('does not say both apps share the database schema', () => {
    const rannaghor = text('rannaghor');
    expect(rannaghor).not.toMatch(/Both apps import the same sign-in setup, database schema/);
    expect(rannaghor).not.toMatch(/The web app and the API use the same schema/);
  });

  it('names the server and auth as the ones that share the schema', () => {
    const rannaghor = text('rannaghor');
    expect(rannaghor).toMatch(/server and auth share the database schema/);
  });

  it('says only the workspaces that extend the base config do so', () => {
    const rannaghor = text('rannaghor');
    expect(rannaghor).toMatch(/workspaces that extend/);
  });
});

describe('plain American English', () => {
  /* The guide: "Write plain American English in short sentences." */
  const BRITISH = [
    'behaviour',
    'summarised',
    'authorisation',
    'catalogue',
    'organis',
    'recognis',
    'colour',
    'favour',
    'licence',
    'centre',
    'analys',
    'optimis',
    'prioritis',
    'normalis',
    'customis',
    'utilis',
    'minimis',
    'maximis',
    'realis',
    'initialis',
    'serialis',
    'apologis',
    'specialis',
    'standardis',
    'visualis',
    'categoris',
    'characteris',
    'criticis',
    'memoris',
    'mobilis',
    'stabilis',
    'synchronis',
    'modelling',
    'travelling',
    'cancelled',
    'labelled',
    'signalled',
    'fuelled',
    'judgement',
    'acknowledgement',
    'defence',
    'programme',
    'whilst',
    'amongst',
    'learnt',
    'spelt',
    'practise',
    'enrol',
    'fulfil',
    'skilful',
    'wilful',
  ];

  for (const { slug } of caseStudies) {
    it(`${slug}: uses no British spelling`, () => {
      const body = text(slug).toLowerCase();
      const found = BRITISH.filter((word) => body.includes(word));
      expect(found, `${slug} uses ${found.join(', ')}`).toEqual([]);
    });
  }
});

describe('no Ticket-Pipeline leftovers', () => {
  /* The study was renamed to Relay; its diagram constants and its design token
     kept the old project's initials. */
  const files = ['src/diagrams.ts', 'src/Diagram.tsx', 'src/styles.css', '.impeccable/design.json'];

  it('names the Relay diagram data for Relay', () => {
    for (const file of files) {
      const body = readFileSync(resolve(process.cwd(), file), 'utf8');
      expect(body, `${file} still uses a TP_ constant`).not.toMatch(/\bTP_[A-Z]+\b/);
      expect(body, `${file} still uses tpRuns`).not.toMatch(/\btpRuns\b/);
      expect(body, `${file} still uses the ticket token`).not.toMatch(/flow-ticket-vertical/);
    }
  });
});

describe('PRODUCT.md agrees with the studies', () => {
  /* The evidence line said 59 merged pull requests while content.ts and
     `gh pr list --state merged` both say 60. */
  it('states the merged pull request count the study states', () => {
    const product = readFileSync(resolve(process.cwd(), 'PRODUCT.md'), 'utf8');
    const rannaghor = text('rannaghor');
    expect(rannaghor).toContain('60 of them merged pull requests');
    expect(product).toContain('60 merged pull requests');
    expect(product).not.toContain('59 merged pull requests');
  });
});
