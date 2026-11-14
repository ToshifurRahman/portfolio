import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

  it('shows the CV link with the owner file', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    /* Scoped to the bar: the CV section below it carries a download link of
       its own. The empty case is the mocked-content test under it. */
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    const link = within(nav).getByRole('link', { name: /CV/i });
    expect(link).toHaveAttribute('href', owner.cv);
    expect(link).toHaveAttribute('download');
  });
});

/* The test above proves the populated case from the real content. This one
   mocks the content module with no CV, so the empty case stays proven too. */
describe('navbar without a CV file', () => {
  it('renders no CV link', async () => {
    vi.resetModules();
    vi.doMock('../../src/content', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../../src/content')>();
      return { ...actual, owner: { ...actual.owner, cv: '' } };
    });
    const { App: AppWithoutCv } = await import('../../src/App');
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppWithoutCv />
      </MemoryRouter>,
    );
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(within(nav).queryByRole('link', { name: 'CV' })).not.toBeInTheDocument();
    vi.doUnmock('../../src/content');
    vi.resetModules();
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
