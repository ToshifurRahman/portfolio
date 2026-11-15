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

/* The Now panel took the home slot where the track animation was (the owner
   moved that into the case studies). Since 23:03 it draws two lanes, Study and
   Work, on one shared year axis. It is still a real ordered list of text, not a
   picture: readable with no CSS and no script. */
describe('now panel', () => {
  it('is an ordered list of real text, not a picture', () => {
    renderHome();
    const panel = document.getElementById('now');
    expect(panel, 'the Now panel is missing').not.toBeNull();
    expect(panel!.querySelectorAll('ol.tl-stops')).toHaveLength(2);
    /* Eight stops in total, each the stop's own label as text. */
    const labels = [...panel!.querySelectorAll('.stop-label')].map((el) => el.textContent);
    expect(labels).toHaveLength(path.filter((p) => !p.parent).length);
    for (const label of labels) expect(path.some((p) => p.label === label)).toBe(true);
  });

  it('shows a date only where the source states one', () => {
    renderHome();
    const stops = [...document.querySelectorAll('#now .stop')];
    for (const li of stops) {
      const label = li.querySelector('.stop-label')?.textContent;
      const p = path.find((entry) => entry.label === label)!;
      const date = li.querySelector('.stop-date');
      if (p.date) expect(date?.textContent, p.label).toBe(p.date);
      else expect(date, `${p.label} should show no date`).toBeNull();
    }
  });

  it('draws two lanes on one shared year axis, and no cells', () => {
    /* Owner, 23:03: "In Now, timeline chart not looking good ... drop latest
       system & problem solving", answered by two lanes, Study and Work. */
    renderHome();
    expect(document.querySelectorAll('#now .now-cell')).toHaveLength(0);

    const lanes = [...document.querySelectorAll('#now .tl-lane-title')].map((h) => h.textContent);
    expect(lanes).toEqual(['Study', 'Work']);

    /* Every stop is present as real text, in its own lane. */
    for (const lane of ['study', 'work'] as const) {
      const text = document.querySelector(`#now .tl-lane-${lane}`)?.textContent ?? '';
      for (const stop of path.filter((p) => p.lane === lane)) {
        expect(text, `${stop.label} is missing from the ${lane} lane`).toContain(stop.label);
      }
    }
  });

  it('places a dated stop in its year column and leaves an undated one out of the axis', () => {
    renderHome();
    const years = [...document.querySelectorAll('#now .years li')].map((li) => li.textContent);
    expect(years).toEqual(['2021', '2023', '2025', '2026']);

    /* A dated stop claims a column; an undated role claims none and is listed
       under its parent instead. */
    const bsc = [...document.querySelectorAll('#now .stop')].find((li) =>
      li.textContent?.includes('B.Sc. in CSE'),
    ) as HTMLElement | undefined;
    expect(bsc?.style.gridColumn).toBe('1 / 4');

    const coordinator = [...document.querySelectorAll('#now .stop-child')].find((el) =>
      el.textContent?.includes('Bootcamp Coordinator'),
    );
    expect(coordinator, 'the undated role is not listed under its parent').toBeTruthy();
    const asStop = [...document.querySelectorAll('#now .stop')].find(
      (li) => li.querySelector('.stop-label')?.textContent === 'Bootcamp Coordinator, IIUCCPS',
    );
    expect(asStop, 'an undated role must not claim a year of its own').toBeUndefined();
  });

  it('lights the two current stops', () => {
    renderHome();
    const lit = [...document.querySelectorAll('#now .stop.is-current .stop-label')].map((el) => el.textContent);
    expect(lit).toEqual(['M.Engg. in CSE, CUET', 'Web Developer, Taibah Academy']);
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
