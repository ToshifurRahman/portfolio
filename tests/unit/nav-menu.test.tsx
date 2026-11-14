import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../src/App';
import { sections } from '../../src/nav';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.dataset.theme = 'dark';
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('phone menu', () => {
  it('opens the list, closes it on Escape and returns focus to the button', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    const button = within(nav).getByRole('button', { name: /menu/i });
    const list = document.getElementById('primary-menu')!;
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(list).toHaveAttribute('data-open', 'false');
    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    /* jsdom applies no stylesheet, so the open state is the attribute the CSS
       keys off, not visibility. */
    expect(list).toHaveAttribute('data-open', 'true');
    await user.keyboard('{Escape}');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(list).toHaveAttribute('data-open', 'false');
    expect(button).toHaveFocus();
  });

  it('closes the list when a link is chosen', async () => {
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
  /* The bar reads scroll position, so the test moves sections by giving each
     one a top offset and letting the scroll listener run. Sections not named
     sit below the fold; the CV sections do not exist on this branch yet. */
  function scrollTo(tops: { id: string; top: number }[]) {
    for (const { id } of sections) {
      const element = document.getElementById(id);
      if (!element) continue;
      const top = tops.find((t) => t.id === id)?.top ?? 2000;
      element.getBoundingClientRect = () => ({ top }) as DOMRect;
    }
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
  }

  it('marks the section in view with aria-current', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    scrollTo([{ id: 'skills', top: 10 }]);
    expect(within(nav).getByRole('link', { name: 'Skills' })).toHaveAttribute('aria-current', 'true');
    expect(within(nav).getByRole('link', { name: 'Skills' })).toHaveClass('is-current');
  });

  it('marks Contact current at the bottom of the page', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    const scrolled = document.documentElement.scrollHeight;
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true });
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(within(nav).getByRole('link', { name: 'Contact' })).toHaveAttribute('aria-current', 'true');
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: scrolled, configurable: true });
  });

  it('keeps no home link current on another page', () => {
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
