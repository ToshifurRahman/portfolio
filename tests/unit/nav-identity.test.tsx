import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { Home } from '../../src/Home';
import { owner } from '../../src/content';

type Identity = { now: string; location: string };
const identity = owner as typeof owner & Identity;

/* `now` and `location` are optional facts: an empty string is the absent state
   the site paints nothing for. The test sets both on the imported object, so
   the present and absent renders are both proven. */
const set = (fields: Identity) => Object.assign(identity, fields);
const original = { now: owner.now, location: owner.location };

const renderHome = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Home />
    </MemoryRouter>,
  );

afterEach(() => set(original));

const terms = () => [...document.querySelectorAll('.facts dt')].map((dt) => dt.textContent);

describe('introduction identity', () => {
  it('renders the current role and the place once they exist', () => {
    set({ now: 'Web Developer at Taibah Academy', location: 'Chattogram, Bangladesh' });
    renderHome();
    expect(terms()).toContain('Now');
    expect(document.querySelector('.role-place')?.textContent).toBe('Chattogram, Bangladesh');
  });

  it('renders neither when both are missing, and never a placeholder', () => {
    set({ now: '', location: '' });
    renderHome();
    expect(terms()).not.toContain('Now');
    expect(document.querySelector('.role-place')).toBeNull();
    expect(document.querySelector('.intro')?.textContent).not.toMatch(/undefined/);
  });
});
