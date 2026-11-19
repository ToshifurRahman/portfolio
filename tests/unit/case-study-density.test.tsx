import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { App } from '../../src/App';
import { caseStudies } from '../../src/content';

/* Owner, 2026-11-15: "Tech decisions, challenges & solutions feels to conjusted
   with texts". Three changes: Challenges and Solutions become one section of
   paired rows, Tech decisions become cards, and everything gets more air. No
   words change. */

const renderAt = (route: string) => {
  const { container } = render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>,
  );
  return container;
};

describe('Challenges and Solutions', () => {
  for (const slug of ['relay', 'rannaghor']) {
    const study = caseStudies.find((s) => s.slug === slug)!;
    const challenges = study.sections.find((s) => s.id === 'challenges')!;
    const solutions = study.sections.find((s) => s.id === 'solutions');

    it(`${slug}: pairs each challenge with its solution, one to one`, () => {
      /* Pairing is only honest if the lists are the same length and each pair
         answers the same question. These studies' lists do, in order. */
      expect(solutions, `${slug} still has a separate Solutions section`).toBeUndefined();
      const block = challenges.blocks.find((b) => b.kind === 'pairs');
      expect(block, `${slug} has no pairs block`).toBeDefined();
      if (block?.kind !== 'pairs') return;
      /* Five pairs for Relay, four for RannaGhor: one per challenge
         each study already had. */
      expect(block.items.length).toBe(slug === 'rannaghor' ? 4 : 5);
      for (const pair of block.items) {
        expect(pair.challenge.lead.length).toBeGreaterThan(0);
        expect(pair.challenge.text.length).toBeGreaterThan(0);
        expect(pair.solution.lead.length).toBeGreaterThan(0);
        expect(pair.solution.text.length).toBeGreaterThan(0);
      }
    });

    it(`${slug}: renders one paired row per challenge`, () => {
      const container = renderAt(`/work/${slug}`);
      const rows = container.querySelectorAll('.pairs > li');
      const block = challenges.blocks.find((b) => b.kind === 'pairs');
      const expected = block?.kind === 'pairs' ? block.items.length : 0;
      expect(rows.length).toBe(expected);
      /* Each row has both halves, labelled for a screen reader and for the phone
         layout, where the columns stack. */
      for (const row of rows) {
        expect(row.querySelector('.pair-challenge')).not.toBeNull();
        expect(row.querySelector('.pair-solution')).not.toBeNull();
      }
    });

    it(`${slug}: keeps both ids reachable for the sub-navbar and old links`, () => {
      const container = renderAt(`/work/${slug}`);
      expect(container.querySelector('#challenges')).not.toBeNull();
      expect(container.querySelector('#solutions')).not.toBeNull();
    });
  }

  it('names the merged section for both', () => {
    const container = renderAt('/work/relay');
    const heading = container.querySelector('#challenges .section-heading');
    expect(heading?.textContent).toBe('Challenges and solutions');
  });
});

describe('Tech decisions', () => {
  for (const slug of ['relay', 'rannaghor']) {
    it(`${slug}: renders each decision as a card with its lead as the title`, () => {
      const container = renderAt(`/work/${slug}`);
      const section = container.querySelector('#tech-decisions')!;
      const cards = section.querySelectorAll('.decision');
      expect(cards.length).toBe(6);
      for (const card of cards) {
        expect(card.querySelector('.decision-lead')).not.toBeNull();
        expect(card.querySelector('.decision-text')).not.toBeNull();
      }
    });
  }
});

describe('text density', () => {
  it('keeps a measure on the prose', () => {
    /* Line length at most about 70 characters: 70ch, set in the stylesheet. A
       computed-style read is the only honest check, since the unit is what
       matters and jsdom does not lay text out. */
    const css = require('node:fs').readFileSync(
      require('node:path').resolve(process.cwd(), 'src/styles.css'),
      'utf8',
    ) as string;
    expect(css).toMatch(/\.prose[^{]*\{[^}]*max-width:\s*\d+ch/);
  });
});
