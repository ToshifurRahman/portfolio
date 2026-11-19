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

/* The guide: "Write plain American English in short sentences."
   Each entry is a whole-word pattern with the British inflections spelled out, so
   the American forms that share a stem still pass: "analysis" is not "analyse",
   "enroll" is not "enrol", "practice" is not "practise", "fulfill" is not "fulfil".
   "analyses" is left out on purpose: it is the American plural of "analysis" as
   well as a British verb, so flagging it would be a false positive. */
const BRITISH: { label: string; pattern: RegExp }[] = [
  { label: 'behaviour', pattern: /\bbehaviours?\b/ },
  { label: 'summarise', pattern: /\bsummaris(e|ed|es|ing)\b/ },
  { label: 'authorise', pattern: /\bauthoris(e|ed|es|ing|ation|ations)\b/ },
  { label: 'catalogue', pattern: /\bcatalogues?\b/ },
  { label: 'organise', pattern: /\borganis(e|ed|es|ing|ation|ations|er|ers)\b/ },
  { label: 'recognise', pattern: /\brecognis(e|ed|es|ing|able)\b/ },
  { label: 'colour', pattern: /\bcolours?\b/ },
  { label: 'favour', pattern: /\bfavours?\b/ },
  { label: 'licence', pattern: /\blicence\b/ },
  { label: 'centre', pattern: /\bcentres?\b/ },
  { label: 'analyse', pattern: /\banalys(e|ed|ing)\b/ },
  { label: 'optimise', pattern: /\boptimis(e|ed|es|ing|ation)\b/ },
  { label: 'prioritise', pattern: /\bprioritis(e|ed|es|ing|ation)\b/ },
  { label: 'normalise', pattern: /\bnormalis(e|ed|es|ing|ation)\b/ },
  { label: 'customise', pattern: /\bcustomis(e|ed|es|ing|ation)\b/ },
  { label: 'utilise', pattern: /\butilis(e|ed|es|ing|ation)\b/ },
  { label: 'minimise', pattern: /\bminimis(e|ed|es|ing)\b/ },
  { label: 'maximise', pattern: /\bmaximis(e|ed|es|ing)\b/ },
  { label: 'realise', pattern: /\brealis(e|ed|es|ing|ation)\b/ },
  { label: 'initialise', pattern: /\binitialis(e|ed|es|ing|ation)\b/ },
  { label: 'serialise', pattern: /\bserialis(e|ed|es|ing|ation)\b/ },
  { label: 'apologise', pattern: /\bapologis(e|ed|es|ing)\b/ },
  { label: 'specialise', pattern: /\bspecialis(e|ed|es|ing|ation)\b/ },
  { label: 'standardise', pattern: /\bstandardis(e|ed|es|ing|ation)\b/ },
  { label: 'visualise', pattern: /\bvisualis(e|ed|es|ing|ation)\b/ },
  { label: 'categorise', pattern: /\bcategoris(e|ed|es|ing|ation)\b/ },
  { label: 'characterise', pattern: /\bcharacteris(e|ed|es|ing|ation)\b/ },
  { label: 'criticise', pattern: /\bcriticis(e|ed|es|ing)\b/ },
  { label: 'memorise', pattern: /\bmemoris(e|ed|es|ing)\b/ },
  { label: 'mobilise', pattern: /\bmobilis(e|ed|es|ing|ation)\b/ },
  { label: 'stabilise', pattern: /\bstabilis(e|ed|es|ing|ation)\b/ },
  { label: 'synchronise', pattern: /\bsynchronis(e|ed|es|ing|ation)\b/ },
  { label: 'modelling', pattern: /\bmodell(ed|ing)\b/ },
  { label: 'travelling', pattern: /\btravell(ed|ing|er|ers)\b/ },
  { label: 'cancelled', pattern: /\bcancell(ed|ing)\b/ },
  { label: 'labelled', pattern: /\blabell(ed|ing)\b/ },
  { label: 'signalled', pattern: /\bsignall(ed|ing)\b/ },
  { label: 'fuelled', pattern: /\bfuell(ed|ing)\b/ },
  { label: 'judgement', pattern: /\bjudgements?\b/ },
  { label: 'acknowledgement', pattern: /\backnowledgements?\b/ },
  { label: 'defence', pattern: /\bdefences?\b/ },
  { label: 'programme', pattern: /\bprogrammes?\b/ },
  { label: 'whilst', pattern: /\bwhilst\b/ },
  { label: 'amongst', pattern: /\bamongst\b/ },
  { label: 'learnt', pattern: /\blearnt\b/ },
  { label: 'spelt', pattern: /\bspelt\b/ },
  { label: 'practise', pattern: /\bpractis(e|ed|es|ing)\b/ },
  { label: 'enrol', pattern: /\benrol(s|ed|ing|ment|ments)?\b/ },
  { label: 'fulfil', pattern: /\bfulfil(s|ed|ing|ment|ments)?\b/ },
  { label: 'skilful', pattern: /\bskilful(ly)?\b/ },
  { label: 'wilful', pattern: /\bwilful(ly)?\b/ },
];

const britishSpellings = (body: string) =>
  BRITISH.filter(({ pattern }) => pattern.test(body.toLowerCase())).map(({ label }) => label);

describe('plain American English', () => {
  for (const { slug } of caseStudies) {
    it(`${slug}: uses no British spelling`, () => {
      const found = britishSpellings(text(slug));
      expect(found, `${slug} uses ${found.join(', ')}`).toEqual([]);
    });
  }

  it('passes the American forms that share a British stem', () => {
    expect(britishSpellings('an analysis of the enroll flow, then practice and fulfill')).toEqual([]);
  });

  it('fails the British forms of the same words', () => {
    expect(britishSpellings('we analyse the enrol flow, then practise and fulfil')).toEqual([
      'analyse',
      'practise',
      'enrol',
      'fulfil',
    ]);
  });
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
