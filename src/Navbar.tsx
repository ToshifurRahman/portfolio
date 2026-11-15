import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { owner } from './content';
import { currentSectionAt, pageSections, sections } from './nav';
import { ThemeToggle } from './ThemeToggle';

/* Education has no link of its own: while it is in view, Experience (the
   section it follows) stays marked. */
const navFor = (id: string | null) => (id === 'education' ? 'experience' : id);

export function Navbar() {
  const { pathname, hash } = useLocation();
  const home = pathname === '/';
  /* A case study is part of Work, so the Work item stays lit while one is being
     read: the case-study sub-navbar already lights its own sections, and this
     says which part of the site those sections belong to (R4b's "glow Work"). */
  const onStudy = pathname.startsWith('/work/');
  const [current, setCurrent] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);

  /* Publish the bar's real height so a heading reached by a link clears it. */
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

  /* A route change or a new hash closes the phone menu. */
  useEffect(() => setOpen(false), [pathname, hash]);

  /* Mark the section being read. Read from scroll position: Contact is short
     and sits at the page bottom, so the bottom of the page is its signal. */
  useEffect(() => {
    if (!home) {
      setCurrent(null);
      return;
    }
    const elements = pageSections.flatMap((s) => {
      const element = document.getElementById(s.id);
      return element ? [{ id: s.id as string, element }] : [];
    });
    const update = () => {
      const line = Math.max(88, (header.current?.getBoundingClientRect().height ?? 0) + 24, innerHeight * 0.3);
      const scrollable = document.documentElement.scrollHeight - innerHeight;
      const atBottom = scrollable > 0 && innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
      setCurrent(
        navFor(
          currentSectionAt(
            elements.map((s) => ({ id: s.id, top: s.element.getBoundingClientRect().top })),
            line,
            atBottom,
          ),
        ),
      );
    };
    update();
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    return () => {
      removeEventListener('scroll', update);
      removeEventListener('resize', update);
    };
  }, [home, pathname]);

  /* A second click on the section already in the address bar asks for the same
     jump again, which the browser will not repeat on its own. */
  const onSectionClick = (id: string) => {
    setOpen(false);
    if (!home || hash !== `#${id}`) return;
    document.getElementById(id)?.scrollIntoView();
    setCurrent(id);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape' || !open) return;
    setOpen(false);
    menu.current?.focus();
  };

  return (
    <header className="site-header" ref={header}>
      <nav className="frame navbar" aria-label="Primary" onKeyDown={onKeyDown}>
        <Link className="brand" to="/">
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
          {sections.map((section) => {
            const active = (home && current === section.id) || (onStudy && section.id === 'work');
            return (
            <li key={section.id}>
              <Link
                to={`/#${section.id}`}
                aria-current={active ? 'true' : undefined}
                className={active ? 'is-current' : undefined}
                onClick={() => onSectionClick(section.id)}
              >
                <span className="lamp" aria-hidden="true" />
                {section.label}
              </Link>
            </li>
            );
          })}
          {/* On a phone the bar has no room for the CV button, and the menu is
              the only place every other action is reachable from, so the CV
              download rides in the menu. It is hidden from the bar's list on
              wider screens, where .cv-link already shows it. */}
          {owner.cv && (
            <li className="nav-cv">
              <a href={owner.cv} download>
                <span className="lamp" aria-hidden="true" />
                Download CV
              </a>
            </li>
          )}
        </ul>
        <div className="nav-tools">
          {owner.cv && (
            <a className="button cv-link" href={owner.cv} download>
              CV
            </a>
          )}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
