import { useEffect, type CSSProperties } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { caseStudies, contactLede, owner, proof, skills, type CaseStudy } from './content';
import { Footer } from './Footer';
import { CopyEmail } from './CopyEmail';
import { useSignatureMotion } from './useSignatureMotion';
import { NodeDiagram } from './NodeDiagram';
import { Arrow } from './NotFound';
import { NowPanel } from './NowPanel';
import { Section } from './Section';
import { CvSections } from './sections';
import { useTitle } from './useTitle';

/* Shown only while developing, so a missing fact is never forgotten. */
function Missing({ what }: { what: string }) {
  if (!import.meta.env.DEV) return null;
  return <p className="missing">Not set yet: {what}. Add it in src/content.ts.</p>;
}

/* The motto, its closing clause in full ink and the rest in the muted tone. If
   the clause is not found word for word, the motto is shown plain. */
function Statement() {
  const { statement, statementEmphasis } = owner;
  const at = statementEmphasis ? statement.indexOf(statementEmphasis) : -1;
  if (at < 0) return <>{statement}</>;
  return (
    <>
      {statement.slice(0, at)}
      <em className="emphasis">{statementEmphasis}</em>
      {statement.slice(at + statementEmphasis.length)}
    </>
  );
}

/* The column lines behind the introduction, one per grid column, with a cell in
   each gap between them. The cells are what the owner's slow wave lights ("boxes
   between strips glow up to down"); they are decorative and inert, so they are
   hidden from assistive tech and never take a pointer. */
function Gridlines() {
  return (
    <div className="gridlines grid12" aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => (
        <span key={i} />
      ))}
      <div className="hero-cells grid12">
        {Array.from({ length: 11 }, (_, i) => (
          /* `--cell-index` is what the wave's stagger reads. Without it every cell
             reported `animation-delay: 0s` and the whole row lit at once, so the
             light never travelled down the page (R4a-ds-2). */
          <span key={i} className="hero-cell" style={{ gridColumn: i + 2, '--cell-index': i } as CSSProperties} />
        ))}
      </div>
    </div>
  );
}

const meta = (c: CaseStudy, label: string) => c.meta.find((m) => m.label === label)?.value;

export function Home() {
  useTitle();
  const hero = useSignatureMotion();
  const { hash } = useLocation();

  /* A hash link lands on its section without hiding the heading under the
     sticky header (scroll-padding-top does that part). */
  useEffect(() => {
    if (!hash) return;
    const target = document.getElementById(hash.slice(1));
    target?.scrollIntoView?.({ behavior: 'instant', block: 'start' });
  }, [hash]);

  const facts = [
    owner.now && { label: 'Now', value: owner.now },
    owner.mainStack && { label: 'Stack', value: owner.mainStack },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <>
      {/* The strips the signature pulse runs down: the same twelve columns as
          the page, drawn as fixed positions so the ray is always in a column
          line and never behind body text. Decorative and inert. */}
      <div className="site-rail grid12" aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => (
          <span key={i} style={{ gridColumn: i + 1, '--strip-index': i } as CSSProperties}>
            <i />
          </span>
        ))}
      </div>
      <main id="main" className="page home">
        <header className="frame grid12 intro" ref={hero}>
          <Gridlines />
          <div className="intro-id">
            <h1 className="name">
              <span className="name-line">{owner.firstName}</span>{' '}
              <span className="name-line">{owner.lastName}</span>
            </h1>
            <p className="role">
              {owner.role}
              {owner.location && <span className="role-place">{owner.location}</span>}
            </p>
            <dl className="facts">
              {facts.map((f) => (
                <div key={f.label}>
                  <dt>{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <p className="statement">
            <Statement />
          </p>
          {!owner.availability && <Missing what="availability" />}
        </header>

        <div className="frame ruled grid12 readout">
          <ul className="proof" aria-label="In numbers">
            {proof.map((p) => (
              <li key={p.label}>
                <span className="proof-value">{p.value}</span>
                <span className="proof-label">{p.label}</span>
              </li>
            ))}
          </ul>
          <div className="intro-actions">
            {owner.cv && (
              <a className="button" href={owner.cv} download>
                Download CV
                <DownloadIcon />
              </a>
            )}
            {owner.email && (
              <a className="ghost" href={`mailto:${owner.email}`}>
                Email
              </a>
            )}
            <a className="ghost" href={owner.github} rel="noopener noreferrer">
              GitHub
            </a>
            {owner.linkedin && (
              <a className="ghost" href={owner.linkedin} rel="noopener noreferrer">
                LinkedIn
              </a>
            )}
          </div>
        </div>

        <NowPanel />

        <Section id="work" title="Work">
          <ul className="cases">
            {caseStudies.map((c) => (
              <li key={c.slug}>
                  <article className="case">
                    <div className="case-main">
                      <div className="case-head">
                        <h3 className="case-title">
                          <Link to={`/work/${c.slug}`}>{c.title}</Link>
                        </h3>
                        <span className="case-type">{meta(c, 'Type')}</span>
                      </div>
                      <p className="case-summary">{c.summary}</p>
                      <NodeDiagram study={c} />
                      <p className="case-stack">{meta(c, 'Stack')}</p>
                      <p className="case-outcome">{c.outcome}</p>
                      <span className="more-link" aria-hidden="true">
                        Read the case study <Arrow />
                      </span>
                    </div>
                  </article>
                </li>
            ))}
          </ul>

        </Section>

        <CvSections />

        <Section id="skills" title="Skills">
          <dl className="rows skills">
            {skills.map((g) => (
              <div key={g.group}>
                <dt>{g.group}</dt>
                <dd>
                  <ul className="skill-list">
                    {g.items.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section id="contact" title="Contact">
          <Contact />
        </Section>
      </main>
      <Footer />
    </>
  );
}

function DownloadIcon() {
  return (
    <svg className="icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d="M8 2v8.5M4.5 7 8 10.5 11.5 7M3 13.5h10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* An address may only break at its own separators, never mid-word. */
function BreakableLink({ value }: { value: string }) {
  const parts = value.split(/([/@])/);
  return (
    <>
      {parts.map((part, i) =>
        /^[/@]$/.test(part) ? (
          <span key={i}>
            {part}
            <wbr />
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

function Contact() {
  const links = [
    { label: 'GitHub', value: owner.github.replace('https://', ''), href: owner.github },
    owner.linkedin && { label: 'LinkedIn', value: owner.linkedin.replace('https://', ''), href: owner.linkedin },
    /* The CV is a file, not a page: it downloads instead of opening in the tab. */
    owner.cv && { label: 'CV', value: 'Download PDF', href: owner.cv, download: true },
  ].filter(Boolean) as { label: string; value: string; href: string; download?: boolean }[];
  return (
    <>
      <p className="section-lede">
        {owner.email ? (
          <>
            <strong>{contactLede.lead}</strong>
            {contactLede.rest}
          </>
        ) : (
          'Both case-study projects are public, with their tests and documentation.'
        )}
      </p>
      {owner.email && (
        <div className="contact-address">
          <a className="contact-email" id="contact-email-value" href={`mailto:${owner.email}`}>
            <BreakableLink value={owner.email} />
          </a>
          <CopyEmail email={owner.email} targetId="contact-email-value" />
        </div>
      )}
      <dl className="rows contact">
        {links.map((l) => (
          <div key={l.label}>
            <dt>{l.label}</dt>
            <dd>
              <a className="inline-link" href={l.href} download={l.download || undefined}>
                <BreakableLink value={l.value} />
              </a>
            </dd>
          </div>
        ))}
      </dl>
      {!owner.email && <Missing what="email address" />}
      {!owner.linkedin && <Missing what="LinkedIn URL" />}
      {!owner.cv && <Missing what="CV file" />}
    </>
  );
}
