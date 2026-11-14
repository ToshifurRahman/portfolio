import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from '../../src/App';
import { owner } from '../../src/content';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.dataset.theme = 'dark';
});

describe('navbar', () => {
  it('is rendered on the home page with the section links', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    for (const label of ['About', 'Work', 'Experience', 'Achievements', 'Certificates', 'Skills', 'Contact']) {
      expect(within(nav).getByRole('link', { name: label })).toHaveAttribute('href', `/#${label.toLowerCase()}`);
    }
  });

  it('is rendered on a case study page and links back to the home sections', () => {
    render(
      <MemoryRouter initialEntries={['/work/ticket-pipeline']}>
        <App />
      </MemoryRouter>,
    );
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(within(nav).getByRole('link', { name: 'About' })).toHaveAttribute('href', '/#about');
  });

  it('is rendered on the not-found page', () => {
    render(
      <MemoryRouter initialEntries={['/no-such-page']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('No such state');
  });

  it('shows the CV link exactly when the owner has a CV file', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    /* cv-content fills owner.cv in; the expectation follows the content rather
       than assuming the field is still empty. */
    const link = screen.queryByRole('link', { name: /CV/i });
    if (owner.cv) {
      expect(link).toHaveAttribute('href', owner.cv);
      expect(link).toHaveAttribute('download');
    } else {
      expect(link).not.toBeInTheDocument();
    }
  });
});

describe('home sections', () => {
  it('shows every section at once instead of hiding it behind a tab', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    for (const [id, title] of [
      ['about', 'About'],
      ['work', 'Work'],
      ['skills', 'Skills'],
      ['contact', 'Contact'],
    ] as const) {
      const section = document.getElementById(id);
      expect(section, `section #${id}`).not.toBeNull();
      expect(section).not.toHaveAttribute('hidden');
      expect(section?.getAttribute('aria-labelledby')).toBe(`${id}-title`);
      expect(document.getElementById(`${id}-title`)?.textContent).toContain(title);
    }
  });

  it('keeps the case-study links in the work section', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getAllByRole('link', { name: /Ticket-Pipeline/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /RannaGhor/i })[0]).toHaveAttribute('href', '/work/rannaghor');
  });
});
