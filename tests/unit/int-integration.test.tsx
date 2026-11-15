import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Home } from '../../src/Home';
import { caseStudies, nowCells, owner, path, proof } from '../../src/content';
import { pageSections, sections } from '../../src/nav';

const renderHome = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Home />
    </MemoryRouter>,
  );

/* The header and every heading read their number from src/nav.ts. Education is
   03 but has no header entry: it follows Experience directly. */
describe('one section sequence', () => {
  it('gives every section a heading from nav.ts, Education included', () => {
    renderHome();
    for (const { id, label } of pageSections) {
      const heading = document.getElementById(`${id}-title`);
      expect(heading, id).not.toBeNull();
      expect(heading!.textContent, id).toBe(label);
    }
  });

  it('keeps Education out of the header', () => {
    expect(sections.map((s) => s.id)).toEqual(['work', 'experience', 'achievements', 'skills', 'contact']);
    expect(pageSections.map((s) => s.id)).toContain('education');
  });
});

/* The CV sections are sections like the rest of the page, not a separate
   layout: same section element, same heading. */
describe('CV sections share the page layout', () => {
  it('uses the same section and heading classes as the rest of the page', () => {
    renderHome();
    for (const id of ['experience', 'education', 'achievements']) {
      const section = document.getElementById(id);
      expect(section, id).not.toBeNull();
      expect(section!.className, id).toContain('section');
      const heading = document.getElementById(`${id}-title`);
      expect(heading!.className, id).toContain('section-heading');
      expect(heading!.parentElement, id).toBe(section);
    }
  });
});

describe('introduction', () => {
  it('reads the Now and Stack facts from content.ts', () => {
    renderHome();
    expect(owner.mainStack).toBe('TypeScript, Bun, PostgreSQL, React');
    const value = (label: string) =>
      [...document.querySelectorAll('.facts dt')].find((dt) => dt.textContent === label)?.nextElementSibling
        ?.textContent;
    expect(value('Now')).toBe(owner.now);
    expect(value('Stack')).toBe(owner.mainStack);
  });

  it('shows no Focus or Studying fact and no commit count', () => {
    renderHome();
    const terms = [...document.querySelectorAll('.facts dt')].map((dt) => dt.textContent);
    expect(terms).not.toContain('Focus');
    expect(terms).not.toContain('Studying');
    expect(document.querySelector('.intro')?.textContent).not.toMatch(/commit/i);
  });

  it('shows every proof figure with its label', () => {
    renderHome();
    /* Scoped to the hero: Achievements now leads with its own figures, which
       reuse the readout's classes. */
    const items = [...document.querySelectorAll('.readout .proof li')];
    expect(items).toHaveLength(proof.length);
    proof.forEach((p, i) => {
      expect(items[i].querySelector('.proof-value')?.textContent).toBe(p.value);
      expect(items[i].querySelector('.proof-label')?.textContent).toBe(p.label);
    });
  });

  it('keeps three proof figures, with no test-file count', () => {
    /* Owner, 2026-11-15: "drop 120 test files from hero". A test-file count is
       a fact about one repository, not a proof about the person, and four
       figures had to share a row that reads better with three. */
    expect(proof).toHaveLength(3);
    expect(proof.map((p) => p.value)).toEqual(['1,600+', '100+', '2']);
    const text = JSON.stringify(proof);
    expect(text).not.toMatch(/test files/i);
    expect(text).not.toMatch(/"120"/);
  });

  it('sets the closing clause of the statement in the accent', () => {
    renderHome();
    expect(document.querySelector('.statement')?.textContent).toBe(owner.statement);
    expect(document.querySelector('.statement .emphasis')?.textContent).toBe(owner.statementEmphasis);
  });
});

/* The Now panel took the home slot where the track animation was (the owner
   moved that into the case studies). It is a real ordered list of text, not a
   picture: readable with no CSS and no script. */
describe('now panel', () => {
  it('draws the career path as an ordered list, in the owner’s order', () => {
    renderHome();
    const panel = document.getElementById('now');
    expect(panel, 'the Now panel is missing').not.toBeNull();
    const stops = [...panel!.querySelectorAll('.path li')];
    expect(stops.map((li) => li.querySelector('.path-label')?.textContent)).toEqual(path.map((p) => p.label));
    expect(stops).toHaveLength(8);
    /* First and last, to pin the direction: university at the start, the
       master's in progress at the end. */
    expect(stops[0].textContent).toContain('B.Sc. in CSE, IIUC');
    expect(stops[7].textContent).toContain('M.Engg. in CSE, CUET');
    /* The list is inside the panel, which is an ordered list, not a div soup. */
    expect(panel!.querySelector('ol.path')).not.toBeNull();
  });

  it('marks the two current stations with a lit lamp and the others not', () => {
    renderHome();
    const stops = [...document.querySelectorAll('#now .path li')];
    const lit = stops.filter((li) => li.querySelector('.lamp.is-lit') !== null);
    expect(lit).toHaveLength(path.filter((p) => p.current).length);
    expect(lit.map((li) => li.querySelector('.path-label')?.textContent)).toEqual([
      'Web Developer, Taibah Academy',
      'M.Engg. in CSE, CUET',
    ]);
  });

  it('shows a date only where the source states one', () => {
    renderHome();
    const stops = [...document.querySelectorAll('#now .path li')];
    path.forEach((p, i) => {
      const date = stops[i].querySelector('.path-date');
      if (p.date) expect(date?.textContent, p.label).toBe(p.date);
      else expect(date, `${p.label} should show no date`).toBeNull();
    });
  });

  it('adds the latest system and the problem-solving record, both linked', () => {
    renderHome();
    const cells = [...document.querySelectorAll('#now .now-cell')];
    expect(cells).toHaveLength(2);
    expect(cells[0].textContent).toContain('Latest system');
    expect(cells[0].textContent).toContain('Ticket-Pipeline');
    expect(cells[0].querySelector('a')?.getAttribute('href')).toBe('/work/ticket-pipeline');
    expect(cells[1].textContent).toContain('Problem solving');
    for (const fact of nowCells.solving.facts) expect(cells[1].textContent).toContain(fact);
    expect(cells[1].querySelector('a')?.getAttribute('href')).toBe('/#achievements');
  });
});

/* The Work cards carried a figures block (test files, Lighthouse, API modules,
   roles) lifted from each study's Results. The owner asked for one outcome
   line per card instead, and for the state shown there to be accurate rather
   than "picked randomly": the study's own closing sentence, word for word. */
describe('work cards', () => {
  it('ends each card with the study outcome, not a figures block', () => {
    renderHome();
    expect(document.querySelectorAll('.case-figures')).toHaveLength(0);
    const cards = [...document.querySelectorAll('.case')];
    expect(cards).toHaveLength(caseStudies.length);
    cards.forEach((card, i) => {
      const study = caseStudies[i];
      const outcome = card.querySelector('.case-outcome');
      expect(outcome, study.slug).not.toBeNull();
      expect(outcome!.textContent, study.slug).toBe(study.outcome);
    });
  });

  it('takes the outcome from the study itself, so the two cannot drift', () => {
    for (const study of caseStudies) {
      expect(study.outcome, study.slug).toBeTruthy();
      /* It is a sentence already on the case-study page. */
      const page = JSON.stringify(study.sections);
      expect(page, study.slug).toContain(JSON.stringify(study.outcome).slice(1, -1));
    }
  });
});
