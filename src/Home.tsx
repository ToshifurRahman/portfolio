import { useEffect, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { builds, caseStudies, moreProjects, owner, skills } from './content';
import { Footer } from './Footer';
import { Arrow } from './NotFound';
import { sections } from './nav';
import { useTitle } from './useTitle';

const num = (i: number) => String(i + 1).padStart(2, '0');

/* Shown only while developing, so a missing fact is never forgotten. */
function Missing({ what }: { what: string }) {
  if (!import.meta.env.DEV) return null;
  return <p className="missing">Not set yet: {what}. Add it in src/content.ts.</p>;
}

/* One page, read top to bottom: each section is a state on the same chain
   the case-study pages draw, numbered 01 to 08. Nothing is hidden. */
function Section({
  id,
  index,
  title,
  children,
}: {
  id: string;
  index: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="state-section" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="display section-heading">
        <span className="state-num">{num(index)}</span>
        <span>{title}</span>
      </h2>
      <div className="state-body">{children}</div>
    </section>
  );
}

export function Home() {
  useTitle();
  const { hash } = useLocation();
  /* cv-content adds these two; they are optional until then, so the branch
     builds and the fields simply do not render while they are absent. */
  const identity = owner as typeof owner & { headline?: string; summary?: string };
  const headline = identity.headline?.trim();
  const summary = identity.summary?.trim();

  /* A hash link lands on its section without hiding the heading under the
     sticky navbar (scroll-margin-top does that part). */
  useEffect(() => {
    if (!hash) return;
    const target = document.getElementById(hash.slice(1));
    target?.scrollIntoView?.({ behavior: 'instant', block: 'start' });
  }, [hash]);

  return (
    <>
      <main id="main" className="page home">
        <div className="mast">
          <h1 className="name display">
            <span>{owner.firstName}</span> <span>{owner.lastName}</span>
          </h1>
          <p className="mast-role">{owner.role}</p>
          <p className="lede">{owner.statement}</p>
          {summary && <p className="mast-summary">{summary}</p>}
        </div>

        <figure className="chain-diagram">
          {/* Narrow widths scroll this strip, so it takes a tab stop of its own
              and a name: a scrollable region must be reachable by keyboard. */}
          <ol className="chain-states" tabIndex={0} aria-label="The seven sections, in page order">
            {sections.map((s, i) => (
              <li key={s.id} className="chain-state">
                <span className="state-num">{num(i)}</span>
                <span className="display">{s.label}</span>
              </li>
            ))}
          </ol>
          <figcaption>
            The page as one chain: seven states, top to bottom. Experience holds Education under it.
          </figcaption>
        </figure>

        <Section id="about" index={0} title="About">
          <h3 className="display panel-title">{owner.role}</h3>
          {headline && <p className="headline">{headline}</p>}
          {summary && <p className="summary">{summary}</p>}
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
        </Section>

        <Section id="work" index={1} title="Work">
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

          <h3 className="display panel-title subhead-title">Two case studies</h3>
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
        </Section>

        {/* CvSections slot */}

        <Section id="skills" index={6} title="Skills">
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
        </Section>

        <Section id="contact" index={7} title="Contact">
          <Contact />
        </Section>
      </main>
      <Footer />
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
