import { useState } from 'react';

export type Theme = 'dark' | 'light';

const read = (): Theme => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');

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
