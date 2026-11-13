import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../src/App';

const matchMedia = (matches: boolean) =>
  vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    onchange: null,
    dispatchEvent: vi.fn(),
  }));

beforeEach(() => {
  localStorage.clear();
  document.documentElement.dataset.theme = 'dark';
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('phone menu', () => {
  it('opens the list, closes it on Escape and returns focus to the button', async () => {
    vi.stubGlobal('matchMedia', matchMedia(true));
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    const button = within(nav).getByRole('button', { name: /menu/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Skills' })).toBeVisible();
    await user.keyboard('{Escape}');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveFocus();
  });

  it('closes the list when a link is chosen', async () => {
    vi.stubGlobal('matchMedia', matchMedia(true));
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    const button = within(nav).getByRole('button', { name: /menu/i });
    await user.click(button);
    await user.click(within(nav).getByRole('link', { name: 'Contact' }));
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('current section', () => {
  function stubIntersection() {
    const callbacks: IntersectionObserverCallback[] = [];
    class FakeObserver {
      constructor(cb: IntersectionObserverCallback) {
        callbacks.push(cb);
      }
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
      takeRecords = () => [];
      root = null;
      rootMargin = '';
      thresholds = [];
    }
    vi.stubGlobal('IntersectionObserver', FakeObserver);
    return (entries: { id: string; top: number }[]) =>
      act(() =>
        callbacks.forEach((cb) =>
          cb(
            entries.map((entry) => ({
              isIntersecting: true,
              target: Object.assign(document.getElementById(entry.id)!, {
                getBoundingClientRect: () => ({ top: entry.top }),
              }),
            })) as unknown as IntersectionObserverEntry[],
            {} as IntersectionObserver,
          ),
        ),
      );
  }

  it('marks the section in view with aria-current', () => {
    const fire = stubIntersection();
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    fire([{ id: 'skills', top: 40 }]);
    expect(within(nav).getByRole('link', { name: 'Skills' })).toHaveAttribute('aria-current', 'true');
    expect(within(nav).getByRole('link', { name: 'Skills' })).toHaveClass('is-current');
  });

  it('keeps no home link current on another page', () => {
    stubIntersection();
    render(
      <MemoryRouter initialEntries={['/work/ticket-pipeline']}>
        <App />
      </MemoryRouter>,
    );
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    for (const link of within(nav).getAllByRole('link')) {
      expect(link).not.toHaveAttribute('aria-current', 'true');
    }
  });
});
