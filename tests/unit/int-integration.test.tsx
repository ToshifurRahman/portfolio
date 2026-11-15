import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Home } from '../../src/Home';
import { owner, proof } from '../../src/content';
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
    const items = [...document.querySelectorAll('.proof li')];
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
