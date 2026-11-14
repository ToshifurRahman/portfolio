import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { Home } from '../../src/Home';
import { owner } from '../../src/content';

type Identity = { headline: string; summary: string };
const identity = owner as typeof owner & Identity;

/* headline and summary are typed fields of owner; an empty string is the
   absent state the site paints nothing for. The test sets both on the imported
   object, so the present and absent renders are both proven. */
const set = (fields: Identity) => {
  Object.assign(identity, fields);
};

const original = { headline: owner.headline, summary: owner.summary };

const renderHome = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Home />
    </MemoryRouter>,
  );

afterEach(() => set({ headline: original.headline, summary: original.summary }));

describe('about section identity', () => {
  it('renders the headline and the plain summary once they exist', () => {
    set({ headline: 'Web Developer at Taibah Academy', summary: 'I build web apps in Chattogram.' });
    renderHome();
    const about = document.getElementById('about')!;
    expect(about.querySelector('.headline')?.textContent).toBe('Web Developer at Taibah Academy');
    /* The summary belongs to the mast, above the fold, and is not repeated in
       the About panel right below it. */
    expect(document.querySelector('.mast-summary')?.textContent).toBe('I build web apps in Chattogram.');
    expect(document.querySelectorAll('.mast-summary, .summary')).toHaveLength(1);
  });

  it('renders neither when both are missing, and never a placeholder', () => {
    set({ headline: '', summary: '' });
    renderHome();
    const about = document.getElementById('about')!;
    expect(about.querySelector('.headline')).toBeNull();
    expect(document.querySelector('.mast-summary')).toBeNull();
    expect(about.textContent).not.toMatch(/undefined|Not set yet: headline|Not set yet: summary/);
  });

  it('ignores a blank string the way an empty field is ignored', () => {
    set({ headline: '   ', summary: '' });
    renderHome();
    expect(document.getElementById('about')!.querySelector('.headline')).toBeNull();
    expect(document.querySelector('.mast-summary')).toBeNull();
  });
});
