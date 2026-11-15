export type Theme = 'dark' | 'light';

/*
 * One button that flips the theme. Nothing here depends on React state: the
 * inline script in index.html sets `data-theme` before the first paint (the
 * stored choice, else the system preference), and CSS shows the icon for the
 * theme the page is painted in. So the pre-rendered markup is the same for
 * every visitor and hydration never disagrees with the document.
 */
export function current(): Theme {
  return typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem('theme', theme);
  } catch {
    /* storage unavailable: the choice lasts for this page only */
  }
}

export function ThemeToggle() {
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label="Switch between dark and light theme"
      onClick={() => applyTheme(current() === 'dark' ? 'light' : 'dark')}
    >
      {/* Shown in the dark theme: the sun, for the light one it leads to. */}
      <svg className="icon icon-sun" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false">
        <circle cx="10" cy="10" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M10 1.75v2M10 16.25v2M1.75 10h2M16.25 10h2M4.17 4.17l1.41 1.41M14.42 14.42l1.41 1.41M4.17 15.83l1.41-1.41M14.42 5.58l1.41-1.41"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <svg className="icon icon-moon" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false">
        <path
          d="M16.5 12.3A7 7 0 0 1 7.7 3.5a7 7 0 1 0 8.8 8.8Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
