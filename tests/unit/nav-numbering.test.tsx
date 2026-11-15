import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Home } from '../../src/Home';
import { pageSections } from '../../src/nav';

const renderHome = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Home />
    </MemoryRouter>,
  );

/* The headings follow nav.ts in page order. Section numbers were dropped in
   the signal-box redesign: the order carries no information a reader needs,
   so no heading carries a number. Certificates sit inside Achievements. */
describe('section headings', () => {
  it('lists the headings in page order, unnumbered', () => {
    renderHome();
    const headings = [...document.querySelectorAll('.section .section-heading')];
    expect(headings.map((h) => h.closest('section')?.id)).toEqual(pageSections.map((s) => s.id));
    expect(headings.map((h) => h.textContent)).toEqual(pageSections.map((s) => s.label));
    expect(document.querySelector('.section-num')).toBeNull();
  });

  it('keeps certificates inside Achievements', () => {
    renderHome();
    expect(document.querySelector('#achievements #certificates')).not.toBeNull();
  });
});
