import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Home } from '../../src/Home';
import { caseStudies, owner, path, proof } from '../../src/content';
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

  it('keeps two proof figures, with no test-file count', () => {
    /* Owner, 2026-11-15: "drop 120 test files from hero" (a test-file count is a
       fact about one repository, not a proof about the person), and 23:03:
       "drop open-source case studies". Two figures remain, and the readout
       divides its width between them. */
    expect(proof).toHaveLength(2);
    expect(proof.map((p) => p.value)).toEqual(['1,600+', '100+']);
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

/* The hero's boxes in the gaps between the strips are gone (owner, 2026-11-17:
   "in hero, remove animations & colors on strip gaps"). The orange ray down the
   strips stays, and so do the column hairlines it runs beside. */
describe('hero', () => {
  it('renders no gap cells and keeps the strip rail', () => {
    renderHome();
    expect(document.querySelectorAll('.hero-cells')).toHaveLength(0);
    expect(document.querySelectorAll('.hero-cell')).toHaveLength(0);
    expect(document.querySelectorAll('.gridlines > span')).toHaveLength(12);
    expect(document.querySelectorAll('.site-rail span')).toHaveLength(12);
  });
});

/* The Now panel took the home slot where the track animation was (the owner
   moved that into the case studies). It is one chronological timeline: six real
   stops on a central spine, alternating above and below it. It is still a real
   ordered list of text, not a picture: readable with no CSS and no script. */
describe('now panel', () => {
  const LABELS = [
    'B.Sc. in CSE, IIUC',
    'Trainer & Mentor, IIUCCPS',
    'B.Sc. completed',
    'Admitted to M.Engg., CUET',
    'Web Developer, Taibah Academy',
    'M.Engg. in CSE, CUET',
  ];
  const LANES = ['Study', 'Work', 'Study', 'Study', 'Work', 'Study'];

  it('is one ordered list of real text, not a picture', () => {
    renderHome();
    const panel = document.getElementById('now');
    expect(panel, 'the Now panel is missing').not.toBeNull();
    expect(panel!.querySelectorAll('ol.tl-stops')).toHaveLength(1);
    expect(panel!.querySelectorAll('.stop')).toHaveLength(LABELS.length);
    expect([...panel!.querySelectorAll('.stop-label')].map((el) => el.textContent)).toEqual(LABELS);
    expect(panel!.querySelector('.tl-spine'), 'the spine is missing').not.toBeNull();
    expect(
      panel!.querySelectorAll('.years, .tl-lane-title, .stop-span, .stop-end, .stop-end-cap'),
      'the old axis, lanes and span bar are still rendered',
    ).toHaveLength(0);
  });

  it('shows a date only where the source states one', () => {
    renderHome();
    /* A completion is its own station, so its date is the source's `endDate`. */
    const dateFor = (label: string) => {
      const start = path.find((entry) => entry.label === label);
      if (start) return start.date;
      const end = path.find((entry) => entry.endLabel === label);
      return end?.endDate ?? '';
    };
    for (const li of [...document.querySelectorAll<HTMLElement>('#now .stop')]) {
      const label = li.querySelector('.stop-label')?.textContent ?? '';
      const date = li.querySelector('.stop-date');
      const expected = dateFor(label);
      if (expected) expect(date?.textContent, label).toBe(expected);
      else expect(date, `${label} should show no date`).toBeNull();
    }
  });

  it('alternates six stops above and below one spine and keeps the lanes as captions', () => {
    renderHome();
    const stops = [...document.querySelectorAll<HTMLElement>('#now .stop')];
    expect(stops).toHaveLength(6);
    expect(
      stops.map((li) =>
        li.classList.contains('is-up') ? 'up' : li.classList.contains('is-down') ? 'down' : '',
      ),
      'the tracks do not alternate up, down from the first stop',
    ).toEqual(['up', 'down', 'up', 'down', 'up', 'down']);
    expect(stops.map((li) => li.querySelector('.stop-lane')?.textContent)).toEqual(LANES);
    expect(stops.map((li) => li.getAttribute('data-lane'))).toEqual([
      'study',
      'work',
      'study',
      'study',
      'work',
      'study',
    ]);
  });

  it('puts every station in chronological order with its real year', () => {
    renderHome();
    const stops = [...document.querySelectorAll<HTMLElement>('#now .stop')];
    const years = ['2021', '2023', '2025', '2026', '2026', '2026'];
    expect(stops.map((li) => li.getAttribute('data-year'))).toEqual(years);
    expect(stops.map((li) => li.querySelector('.stop-year')?.textContent)).toEqual(years);
    const numbers = years.map(Number);
    for (let i = 1; i < numbers.length; i++) expect(numbers[i]).toBeGreaterThanOrEqual(numbers[i - 1]);
  });

  it('lists the undated IIUCCPS roles under the dated role, not as stops', () => {
    renderHome();
    const stops = [...document.querySelectorAll<HTMLElement>('#now .stop')];
    const trainer = stops.find(
      (li) => li.querySelector('.stop-label')?.textContent === 'Trainer & Mentor, IIUCCPS',
    );
    expect(trainer, 'the dated Trainer stop is missing').toBeTruthy();
    const children = [...trainer!.querySelectorAll('.stop-child')].map((el) => el.textContent);
    expect(children).toEqual(['Bootcamp Coordinator, IIUCCPS', 'Finance Secretary, IIUCCPS']);
    for (const child of children) {
      const asStop = stops.find((li) => li.querySelector('.stop-label')?.textContent === child);
      expect(asStop, `${child} must not claim a year of its own`).toBeUndefined();
    }
  });

  it('lights the two current stops', () => {
    renderHome();
    const lit = [...document.querySelectorAll('#now .stop.is-current .stop-label')].map((el) => el.textContent);
    expect(lit).toEqual(['Web Developer, Taibah Academy', 'M.Engg. in CSE, CUET']);
    expect(document.querySelectorAll('#now .stop.is-current')).toHaveLength(2);
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
