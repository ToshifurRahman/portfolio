import { useState } from 'react';

export type Theme = 'dark' | 'light';

/* Pre-rendering runs this without a document; there the choice is unknown and
   the server markup says dark, which is also what the pre-paint script leaves
   the page on when nothing is stored. */
const read = (): Theme =>
  typeof document === 'undefined' || document.documentElement.dataset.theme !== 'light' ? 'dark' : 'light';

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem('theme', theme);
  } catch {
    /* storage unavailable: the choice lasts for this page only */
  }
}

const options: { value: Theme; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
];

export function ThemePicker() {
  const [theme, setTheme] = useState<Theme>(read);

  const choose = (next: Theme) => {
    apply(next);
    setTheme(next);
  };

  return (
    <fieldset className="theme-picker">
      <legend className="visually-hidden">Theme</legend>
      {options.map((option) => (
        <label key={option.value} className="theme-option" data-selected={theme === option.value}>
          <input
            type="radio"
            name="theme"
            value={option.value}
            checked={theme === option.value}
            onChange={() => choose(option.value)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </fieldset>
  );
}
