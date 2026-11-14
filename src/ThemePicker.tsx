import { useEffect, useRef, useState } from 'react';

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
  const group = useRef<HTMLFieldSetElement>(null);

  /* The picker's look comes from `:root[data-theme]`, which the inline script
     sets before the first paint, so a stored choice is already highlighted in
     the pre-rendered document. The inputs are left unchecked in the markup for
     the same reason - the server does not know the choice - so their state is
     mirrored here once the page is live. Nothing is rendered per theme, which
     is what keeps hydration from disagreeing with the document. */
  useEffect(() => {
    for (const input of group.current?.querySelectorAll('input') ?? []) {
      input.checked = input.value === theme;
    }
  }, [theme]);

  const choose = (next: Theme) => {
    apply(next);
    setTheme(next);
  };

  return (
    <fieldset className="theme-picker" ref={group}>
      <legend className="visually-hidden">Theme</legend>
      {options.map((option) => (
        <label key={option.value} className="theme-option">
          <input type="radio" name="theme" value={option.value} onChange={() => choose(option.value)} />
          <span>{option.label}</span>
        </label>
      ))}
    </fieldset>
  );
}
