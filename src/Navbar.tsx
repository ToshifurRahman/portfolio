import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { owner } from './content';
import { sections } from './nav';
import { ThemePicker } from './ThemePicker';

export function Navbar() {
  const { pathname } = useLocation();
  const home = pathname === '/';
  const [current, setCurrent] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);

  /* Publish the bar's real height so section headings clear it when a link
     jumps to them, at any width. */
  useEffect(() => {
    const element = header.current;
    if (!element) return;
    const publish = () => {
      const height = element.getBoundingClientRect().height;
      document.documentElement.style.setProperty('--header-h', `${Math.round(height)}px`);
    };
    publish();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(publish);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  /* A route change closes the phone menu. */
  useEffect(() => setOpen(false), [pathname]);

  /* Mark the home section in view; other pages keep no section current. */
  useEffect(() => {
    if (!home || typeof IntersectionObserver === 'undefined') {
      setCurrent(null);
      return;
    }
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).id;
          if (entry.isIntersecting) visible.add(id);
          else visible.delete(id);
        }
        setCurrent(sections.find((s) => visible.has(s.id))?.id ?? null);
      },
      { rootMargin: '-20% 0px -70% 0px' },
    );
    for (const section of sections) {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [home, pathname]);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape' || !open) return;
    setOpen(false);
    menu.current?.focus();
  };

  return (
    <header className="site-header" ref={header}>
      <nav className="navbar" aria-label="Primary" onKeyDown={onKeyDown}>
        <Link className="brand display" to="/">
          {owner.name}
        </Link>
        <button
          ref={menu}
          type="button"
          className="menu-button"
          aria-expanded={open}
          aria-controls="primary-menu"
          onClick={() => setOpen(!open)}
        >
          Menu
        </button>
        <ul id="primary-menu" className="nav-links" data-open={open}>
          {sections.map((section) => (
            <li key={section.id}>
              <Link
                to={`/#${section.id}`}
                aria-current={home && current === section.id ? 'true' : undefined}
                className={home && current === section.id ? 'is-current' : undefined}
                onClick={() => setOpen(false)}
              >
                {section.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="nav-tools">
          {owner.cv && (
            <a className="cv-link" href={owner.cv} download>
              CV
            </a>
          )}
          <ThemePicker />
        </div>
      </nav>
    </header>
  );
}
