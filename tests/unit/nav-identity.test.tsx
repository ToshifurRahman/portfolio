import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { Home } from '../../src/Home';
import { owner } from '../../src/content';

type OptionalIdentity = { headline?: string; summary?: string };
const identity = owner as typeof owner & OptionalIdentity;

/* cv-content owns content.ts; these fields arrive on its branch. The test sets
   them on the imported object so this branch proves both states: present (rendered
   in the mast and in About) and absent (nothing rendered, no placeholder). */
const set = (fields: OptionalIdentity) => {
  delete identity.headline;
  delete identity.summary;
  Object.assign(identity, fields);
};

const renderHome = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Home />
    </MemoryRouter>,
  );

afterEach(() => set({ headline: undefined, summary: undefined }));

describe('about section identity', () => {
  it('renders the headline and the plain summary once they exist', () => {
    set({ headline: 'Web Developer at Taibah Academy', summary: 'I build web apps in Chattogram.' });
    renderHome();
    const about = document.getElementById('about')!;
    expect(about.querySelector('.headline')?.textContent).toBe('Web Developer at Taibah Academy');
    expect(about.querySelector('.summary')?.textContent).toBe('I build web apps in Chattogram.');
    /* The mast carries the summary too, above the fold on a phone. */
    expect(document.querySelector('.mast-summary')?.textContent).toBe('I build web apps in Chattogram.');
  });

  it('renders neither when both are missing, and never a placeholder', () => {
    set({ headline: undefined, summary: undefined });
    renderHome();
    const about = document.getElementById('about')!;
    expect(about.querySelector('.headline')).toBeNull();
    expect(about.querySelector('.summary')).toBeNull();
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
