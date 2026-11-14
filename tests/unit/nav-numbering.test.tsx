import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Home } from '../../src/Home';

const renderHome = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Home />
    </MemoryRouter>,
  );

/* The diagram and the section headings below it are the same chain, so a state
   carries one number in both places. Education has no box of its own: it sits
   under Experience, which is why the diagram skips 04. */
describe('state numbering', () => {
  it('numbers each diagram state the way its section heading is numbered', () => {
    renderHome();
    const boxes = [...document.querySelectorAll('.chain-state')].map((box) => ({
      id: box.textContent?.trim().toLowerCase(),
      num: box.querySelector('.state-num')?.textContent,
    }));
    expect(boxes.map((box) => box.num)).toEqual(['01', '02', '03', '05', '06', '07', '08']);

    for (const id of ['about', 'work', 'skills', 'contact']) {
      const heading = document.querySelector(`#${id}-title .state-num`)?.textContent;
      const box = boxes.find((b) => b.id?.endsWith(id));
      expect(box?.num, `#${id}`).toBe(heading);
    }
  });

  it('keeps the section headings in R1 order, 01 to 08', () => {
    renderHome();
    const numbers = [...document.querySelectorAll('.state-section .section-heading .state-num')].map(
      (n) => n.textContent,
    );
    expect(numbers).toEqual(['01', '02', '07', '08']);
  });
});
