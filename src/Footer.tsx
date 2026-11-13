import { useState } from 'react';
import { owner } from './content';

export function Footer() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme ?? 'dark');
  const next = theme === 'dark' ? 'light' : 'dark';
  const toggle = () => {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* storage unavailable: the choice lasts for this page only */
    }
    setTheme(next);
  };
  return (
    <footer className="footer">
      <p>
        © {new Date().getFullYear()} {owner.name}
      </p>
      <button type="button" className="textbutton" onClick={toggle}>
        Switch to {next} theme
      </button>
    </footer>
  );
}
