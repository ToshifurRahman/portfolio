import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Home } from '../../src/Home';
import { owner } from '../../src/content';
import { sectionNumbers, sections } from '../../src/nav';

const renderHome = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Home />
    </MemoryRouter>,
  );

/* The page is one chain: the diagram, the navbar and every heading read their
   number from src/nav.ts. Education is 04 but has no box and no navbar entry. */
describe('one numbering sequence', () => {
  it('numbers every heading from nav.ts, Education included', () => {
    renderHome();
    const expected = {
      about: '01',
      work: '02',
      experience: '03',
      education: '04',
      achievements: '05',
      certificates: '06',
      skills: '07',
      contact: '08',
    };
    for (const [id, num] of Object.entries(expected)) {
      const heading = document.getElementById(`${id}-title`);
      expect(heading, id).not.toBeNull();
      expect(heading!.querySelector('.state-num')?.textContent, id).toBe(num);
    }
  });

  it('keeps the chain and the navbar on the same numbers', () => {
    renderHome();
    const boxes = [...document.querySelectorAll('.chain-state')].map(
      (box) => box.querySelector('.state-num')?.textContent,
    );
    expect(boxes).toEqual(sections.map((s) => s.num));
    expect(sections.map((s) => s.num)).toEqual(['01', '02', '03', '05', '06', '07', '08']);
    expect(sectionNumbers.education).toBe('04');
  });
});

/* The four CV sections are states like the rest of the page, not a separate
   layout: same section grid, same heading, same body column. */
describe('CV sections share the page layout', () => {
  it('uses the same section and heading classes as the rest of the page', () => {
    renderHome();
    for (const id of ['experience', 'education', 'achievements', 'certificates']) {
      const section = document.getElementById(id);
      expect(section, id).not.toBeNull();
      expect(section!.className, id).toContain('state-section');
      const heading = document.getElementById(`${id}-title`);
      expect(heading, id).not.toBeNull();
      expect(heading!.className, id).toContain('section-heading');
      expect(heading!.parentElement, id).toBe(section);
      expect(section!.querySelector('.state-body'), id).not.toBeNull();
    }
  });
});

describe('main stack', () => {
  it('reads the About fact from content.ts', () => {
    renderHome();
    expect(owner.mainStack).toBe('TypeScript, Bun, PostgreSQL, React');
    const term = [...document.querySelectorAll('.facts-row dt')].find(
      (dt) => dt.textContent === 'Main stack',
    );
    expect(term?.nextElementSibling?.textContent).toBe(owner.mainStack);
  });
});
