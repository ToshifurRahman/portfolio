import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from '../../src/App';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.dataset.theme = 'dark';
});

const renderApp = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>,
  );

describe('theme toggle', () => {
  it('is one labelled button in the header', () => {
    renderApp();
    expect(screen.getByRole('button', { name: /dark and light theme/i })).toBeInTheDocument();
  });

  it('flips the theme and stores the choice, both ways', async () => {
    const user = userEvent.setup();
    renderApp();
    const toggle = screen.getByRole('button', { name: /dark and light theme/i });
    await user.click(toggle);
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
    await user.click(toggle);
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('starts from the theme the inline script already applied', async () => {
    const user = userEvent.setup();
    document.documentElement.dataset.theme = 'light';
    renderApp();
    await user.click(screen.getByRole('button', { name: /dark and light theme/i }));
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});

describe('footer', () => {
  it('holds no theme control of its own', () => {
    renderApp();
    const footer = screen.getByRole('contentinfo');
    expect(footer.textContent).not.toMatch(/theme/i);
  });
});
