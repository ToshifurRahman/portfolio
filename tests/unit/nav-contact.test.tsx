import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { Home } from '../../src/Home';
import { owner } from '../../src/content';

type WithCv = { cv?: string };
const identity = owner as typeof owner & WithCv;
const original = owner.cv;

const renderHome = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Home />
    </MemoryRouter>,
  );

afterEach(() => {
  identity.cv = original;
});

/* cv-content fills owner.cv in; the contact panel has to download the file
   rather than navigate to it, the way the navbar's CV link already does. */
describe('contact CV link', () => {
  it('downloads the CV instead of opening it', () => {
    identity.cv = '/cv/Toshifur-Rahman-CV.pdf';
    renderHome();
    const link = document.querySelector('.contact a[href="/cv/Toshifur-Rahman-CV.pdf"]');
    expect(link).not.toBeNull();
    expect(link).toHaveAttribute('download');
    expect(link?.textContent).toBe('Download PDF');
  });

  it('leaves the other contact links as ordinary links', () => {
    identity.cv = '/cv/Toshifur-Rahman-CV.pdf';
    renderHome();
    const github = document.querySelector(`.contact a[href="${owner.github}"]`);
    expect(github).not.toBeNull();
    expect(github).not.toHaveAttribute('download');
  });

  it('shows no CV entry while the owner has no file', () => {
    identity.cv = '';
    renderHome();
    expect(document.querySelector('.contact a[download]')).toBeNull();
  });
});
