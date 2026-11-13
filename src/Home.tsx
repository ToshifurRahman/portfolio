import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { builds, caseStudies, moreProjects, owner, skills } from './content';
import { Footer } from './Footer';
import { Arrow } from './NotFound';
import { useTitle } from './useTitle';

const states = [
  { id: 'who', label: 'Who' },
  { id: 'builds', label: 'Builds' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'contact', label: 'Contact' },
] as const;

type StateId = (typeof states)[number]['id'];

const num = (i: number) => String(i + 1).padStart(2, '0');
const indexOf = (hash: string) => {
  const i = states.findIndex((s) => `#${s.id}` === hash);
  return i < 0 ? 0 : i;
};

/* Shown only while developing, so a missing fact is never forgotten. */
function Missing({ what }: { what: string }) {
  if (!import.meta.env.DEV) return null;
  return <p className="missing">Not set yet: {what}. Add it in src/content.ts.</p>;
}

export function Home() {
  useTitle();
  const { hash } = useLocation();
  const [current, setCurrent] = useState(() => indexOf(hash));
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => setCurrent(indexOf(hash)), [hash]);

  const go = useCallback((i: number, reveal = false) => {
    setCurrent(i);
    history.replaceState(null, '', i === 0 ? location.pathname : `#${states[i].id}`);
    if (reveal) {
      requestAnimationFrame(() => {
        const b = buttons.current[i];
        if (!b) return;
        const r = b.getBoundingClientRect();
        if (r.top < 0 || r.bottom > innerHeight) {
          const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
          b.scrollIntoView({ block: 'start', behavior: calm ? 'auto' : 'smooth' });
        }
        b.focus({ preventScroll: true });
      });
    }
  }, []);

  const onKey = (e: KeyboardEvent, i: number) => {
    const step =
      e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    let to = i + step;
    if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = states.length - 1;
    else if (!step) return;
    if (to < 0 || to >= states.length) return;
    e.preventDefault();
    buttons.current[to]?.focus();
  };

  const panels: Record<StateId, ReactNode> = {
    who: <Who />,
    builds: <Builds />,
    skills: <Skills />,
    projects: <Projects />,
    contact: <Contact />,
  };

  return (
    <>
      <main id="main" className="page home">
        <h1 className="name display">
          <span>{owner.firstName}</span> <span>{owner.lastName}</span>
        </h1>

        <section className="chain" aria-label={`${owner.name} as five states`}>
          {states.map((s, i) => {
            const open = i === current;
            return (
              <div className="state" key={s.id} data-open={open} style={{ ['--col' as string]: i + 1 }}>
                <h2 className="state-head">
                  <button
                    ref={(el) => {
                      buttons.current[i] = el;
                    }}
                    type="button"
                    id={`state-${s.id}`}
                    className="state-button"
                    aria-expanded={open}
                    aria-controls={`panel-${s.id}`}
                    onClick={() => go(i)}
                    onKeyDown={(e) => onKey(e, i)}
                  >
                    <span className="state-num">{num(i)}</span>
                    <span className="state-label display">{s.label}</span>
                  </button>
                </h2>
                <div
                  className="panel"
                  id={`panel-${s.id}`}
                  role="region"
                  aria-labelledby={`state-${s.id}`}
                  hidden={!open}
                >
                  {panels[s.id]}
                  <div className="transitions">
                    {i > 0 && (
                      <button type="button" className="textbutton" onClick={() => go(i - 1, true)}>
                        <Arrow /> Back to {num(i - 1)} {states[i - 1].label}
                      </button>
                    )}
                    {i < states.length - 1 && (
                      <button type="button" className="action next" onClick={() => go(i + 1, true)}>
                        Next: {num(i + 1)} {states[i + 1].label} <Arrow />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </section>
        <p className="visually-hidden" aria-live="polite">
          Showing state {num(current)}: {states[current].label}
        </p>
      </main>
      <Footer />
    </>
  );
}

function Who() {
  return (
    <>
      <h3 className="display panel-title">{owner.role}</h3>
      <p className="lede">{owner.statement}</p>
      <dl className="facts-row">
        <div>
          <dt>Focus</dt>
          <dd>{owner.focus}</dd>
        </div>
        <div>
          <dt>Main stack</dt>
          <dd>TypeScript, Bun, PostgreSQL, React</dd>
        </div>
        <div>
          <dt>Proof</dt>
          <dd>
            {caseStudies.length} case studies, {moreProjects.length} more projects
          </dd>
        </div>
        {owner.location && (
          <div>
            <dt>Based in</dt>
            <dd>{owner.location}</dd>
          </div>
        )}
        {owner.availability && (
          <div>
            <dt>Status</dt>
            <dd>{owner.availability}</dd>
          </div>
        )}
      </dl>
      {!owner.location && <Missing what="location" />}
      {!owner.availability && <Missing what="availability" />}
    </>
  );
}

function Builds() {
  return (
    <>
      <h3 className="display panel-title">Systems that recover</h3>
      <ul className="rows">
        {builds.map((b) => (
          <li key={b.title}>
            <h4 className="display row-title">{b.title}</h4>
            <p>{b.text}</p>
            {b.proof ? (
              <Link className="action" to={b.proof.to}>
                {b.proof.label} <Arrow />
              </Link>
            ) : (
              <span />
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

function Skills() {
  return (
    <>
      <h3 className="display panel-title">TypeScript, end to end</h3>
      <dl className="skills">
        {skills.map((g) => (
          <div key={g.group}>
            <dt>{g.group}</dt>
            <dd>
              <ul>
                {g.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </dd>
          </div>
        ))}
      </dl>
    </>
  );
}

function Projects() {
  return (
    <>
      <h3 className="display panel-title">Two case studies</h3>
      <ul className="cases">
        {caseStudies.map((c) => (
          <li key={c.slug}>
            <Link to={`/work/${c.slug}`} className="case">
              <span className="display case-title">{c.title}</span>
              <span className="case-summary">{c.summary}</span>
              <span className="case-stack">{c.meta.find((m) => m.label === 'Stack')?.value}</span>
              <span className="action">
                Read the case study <Arrow />
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <h4 className="subhead">More projects</h4>
      <ul className="more">
        {moreProjects.map((p) => (
          <li key={p.title}>
            <strong>{p.title}</strong>
            <span>{p.text}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

function Contact() {
  const links = [
    owner.email && { label: 'Email', value: owner.email, href: `mailto:${owner.email}` },
    { label: 'GitHub', value: owner.github.replace('https://', ''), href: owner.github },
    owner.linkedin && { label: 'LinkedIn', value: owner.linkedin.replace('https://', ''), href: owner.linkedin },
    owner.cv && { label: 'CV', value: 'Download PDF', href: owner.cv },
  ].filter(Boolean) as { label: string; value: string; href: string }[];
  return (
    <>
      <h3 className="display panel-title">{owner.email ? 'Get in touch' : 'Read the code'}</h3>
      <p className="lede">Both case-study projects are public, with their tests and documentation.</p>
      <ul className="contact">
        {links.map((l) => (
          <li key={l.label}>
            <span className="contact-label">{l.label}</span>
            <a className="display contact-link" href={l.href}>
              {l.value}
            </a>
          </li>
        ))}
      </ul>
      {!owner.email && <Missing what="email address" />}
      {!owner.linkedin && <Missing what="LinkedIn URL" />}
      {!owner.cv && <Missing what="CV file" />}
    </>
  );
}
