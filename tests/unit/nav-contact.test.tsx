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

/* Owner, 2026-11-15: "in contact, clicking on email will redirect to default
   email app". A mailto link opens the mail client; a target would open a tab
   and a download attribute would save a file. Every visible email link on the
   site has to stay a plain mailto. */
describe('email links open the mail client', () => {
  it('makes every mailto a plain link, with no target and no download', () => {
    identity.cv = '/cv/Toshifur-Rahman-CV.pdf';
    renderHome();
    const mailto = [...document.querySelectorAll('a[href^="mailto:"]')];
    expect(mailto.length).toBeGreaterThan(0);
    for (const link of mailto) {
      expect(link.getAttribute('href')).toBe(`mailto:${owner.email}`);
      expect(link).not.toHaveAttribute('target');
      expect(link).not.toHaveAttribute('download');
      expect(link).not.toHaveAttribute('rel');
    }
  });

  it('covers the large address and the readout button', () => {
    renderHome();
    const big = document.querySelector('.contact-email');
    expect(big?.getAttribute('href')).toBe(`mailto:${owner.email}`);
    const button = [...document.querySelectorAll('.intro-actions a')].find(
      (a) => a.getAttribute('href') === `mailto:${owner.email}`,
    );
    expect(button, 'the readout Email button is missing').toBeTruthy();
    expect(button).not.toHaveAttribute('target');
    expect(button).not.toHaveAttribute('download');
  });
});

/* The addresses are set large, so they may break at their own separators and
   nowhere else. BreakableLink inserts a <wbr> after each "/" and "@"; without
   it the browser would break mid-word at 1280, and a later overflow-wrap
   change would go unnoticed because nothing else asserts this. */
describe('contact links break only at their separators', () => {
  it('puts a <wbr> after every "/" and "@" and nowhere else', () => {
    renderHome();
    const links = [...document.querySelectorAll('.contact-email, .contact a')];
    expect(links.length).toBeGreaterThan(0);

    let checked = 0;
    for (const link of links) {
      const breaks = [...link.querySelectorAll('wbr')];
      /* A <wbr> must follow each separator, in order. */
      const separatorCount = (link.textContent ?? '').replace(/[^/@]/g, '').length;
      expect(breaks.length, `${link.getAttribute('href')} has ${breaks.length} <wbr> for ${separatorCount} separators`).toBe(separatorCount);

      /* Walk the text: every <wbr>'s previous text node has to end in one of
         the separators, so no break point is offered mid-word. */
      for (const wbr of breaks) {
        let node = wbr.previousSibling;
        while (node && node.nodeType === Node.COMMENT_NODE) node = node.previousSibling;
        expect(node?.textContent).toMatch(/[/@]$/);
        checked += 1;
      }
    }
    /* The addresses really do carry separators (a URL and an email), so this
       is not vacuous. */
    expect(checked).toBeGreaterThan(1);
  });

  it('offers no other break point inside an address', () => {
    renderHome();
    for (const link of document.querySelectorAll('.contact a.contact-link')) {
      /* Only the separators and the <wbr>s exist; BreakableLink must not wrap
         mid-word itself (e.g. by splitting into per-character spans). */
      const wrappers = [...link.children].filter((el) => el.tagName === 'SPAN');
      for (const wrapper of wrappers) {
        expect(wrapper.textContent).toMatch(/^[/@]​?$/);
      }
    }
  });
});
