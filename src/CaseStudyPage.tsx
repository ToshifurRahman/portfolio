import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { caseStudies, solutionsAnchor, type Block, type CaseStudy, type MetaEntry } from './content';
import { diagrams } from './diagrams';
import { Diagram } from './Diagram';
import { Footer } from './Footer';
import { Arrow, NotFound } from './NotFound';
import { useTitle } from './useTitle';

export function CaseStudyPage() {
  const { slug } = useParams();
  const index = caseStudies.findIndex((c) => c.slug === slug);
  const study = caseStudies[index];
  /* No study means <NotFound /> renders below, and it sets its own title. The
     parent's effect runs after the child's, so passing undefined here would
     reset the tab to the home title while the page says it was not found. */
  useTitle(study ? `${study.title} case study` : null);
  const { hash, pathname } = useLocation();
  const [current, setCurrent] = useState(0);
  const nav = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else scrollTo(0, 0);
  }, [pathname, hash]);

  useEffect(() => {
    if (!study) return;
    const els = study.sections.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const onScroll = () => {
      const line = innerHeight * 0.35;
      let i = 0;
      els.forEach((el, k) => {
        if (el.getBoundingClientRect().top <= line) i = k;
      });
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) i = els.length - 1;
      setCurrent(i);
    };
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    return () => {
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
    };
  }, [study]);

  /* On a narrow screen the contents row scrolls sideways; keep the current
     section's link in view. */
  useEffect(() => {
    const list = nav.current;
    const item = list?.children[current] as HTMLElement | undefined;
    if (!list || !item || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({ left: current === 0 ? 0 : item.offsetLeft - 16 });
  }, [current]);

  if (!study) return <NotFound />;
  const next = caseStudies[(index + 1) % caseStudies.length];

  return (
    <>
      <main id="main" className="page study">
        <StudyHeader study={study} />

        <nav className="contents" aria-label="Case study sections">
          <ol ref={nav} className="frame">
            {study.sections.map((s, i) => (
              <li key={s.id} className={i < current ? 'is-passed' : undefined}>
                <a href={`#${s.id}`} aria-current={i === current ? 'location' : undefined}>
                  <span className="lamp" aria-hidden="true" />
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {study.sections.map((s, i) => (
          <section
            className={i === 0 ? 'frame grid12 section' : 'frame ruled grid12 section'}
            id={s.id}
            key={s.id}
            aria-labelledby={`${s.id}-h`}
          >
            {/* The merged section carries both ids: #challenges is the section,
                and #solutions lands here too, so the sub-navbar and any old link
                to the former Solutions section still reach the pairs. */}
            {s.id === 'challenges' && <span id={solutionsAnchor} className="anchor" aria-hidden="true" />}
            <h2 className="section-heading" id={`${s.id}-h`}>
              {s.title}
            </h2>
            {/* The animated architecture diagram, at the top of the study's
                Architecture section. It is one shared engine driven by this
                study's spec, and the still picture is what pre-renders. */}
            {s.id === 'architecture' && diagrams[study.slug] && (
              <div className="section-diagram">
                <Diagram spec={diagrams[study.slug]} />
              </div>
            )}
            <div className="section-body prose">
              {s.blocks.map((b, k) => (
                <BlockView block={b} key={k} />
              ))}
            </div>
          </section>
        ))}

        <div className="frame ruled grid12 next-study">
          <Link to={`/work/${next.slug}`} className="next">
            <span className="next-lead">Next case study</span>
            <span className="next-title">
              {next.title} <Arrow />
            </span>
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}

/* The study's title and meta row. The two exits — Source Code and Live — are the
   entries with a destination, so they are the only ones drawn as links, each in
   its own meta cell: Live first, then Source Code. The title links to Live when
   the study has one, else to its repo, and stays plain text when it has neither.
   The exits carry `meta-link`, which is styled as a Skills chip (src/styles.css). */
export function StudyHeader({ study }: { study: CaseStudy }) {
  const isExit = (m: MetaEntry) => (m.label === 'Source Code' || m.label === 'Live') && Boolean(m.href);
  const facts = study.meta.filter((m) => !isExit(m));
  const live = study.meta.find((m) => m.label === 'Live' && m.href);
  const source = study.meta.find((m) => m.label === 'Source Code' && m.href);
  const exits = [live, source].filter((m): m is MetaEntry => Boolean(m));
  const titleHref = live?.href ?? source?.href;

  return (
    <>
      <header className="frame grid12 study-head">
        <p className="back">
          <Link className="text-button" to="/#work">
            <Arrow /> All work
          </Link>
        </p>
        <h1 className="study-title">
          {titleHref ? (
            <a href={titleHref} rel="noopener noreferrer">
              {study.title}
            </a>
          ) : (
            study.title
          )}
        </h1>
        <p className="study-lede">
          <Lede text={study.summary} />
        </p>
      </header>
      <dl className="frame ruled meta">
        {facts.map((m) => (
          <div key={m.label}>
            <dt>{m.label}</dt>
            <dd>{m.value}</dd>
          </div>
        ))}
        {exits.map((m) => (
          <div key={m.label}>
            <dt>{m.label}</dt>
            <dd>
              <a className="meta-link" href={m.href} rel="noopener noreferrer">
                {m.value}
              </a>
            </dd>
          </div>
        ))}
      </dl>
    </>
  );
}

/* The summary's first sentence in full ink, the rest in the muted tone. */
function Lede({ text }: { text: string }) {
  const at = text.indexOf('. ');
  if (at < 0) return <strong>{text}</strong>;
  return (
    <>
      <strong>{text.slice(0, at + 1)}</strong>
      {text.slice(at + 1)}
    </>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case 'p':
      return <p>{block.text}</p>;
    case 'list':
      return (
        <ul className="points">
          {block.items.map((it, i) => (
            <li key={i}>
              {it.lead && <strong>{it.lead} </strong>}
              {it.text}
            </li>
          ))}
        </ul>
      );
    case 'decisions':
      /* Each decision as a card: its lead is the title, its text the body. The
         grid and the padding are the CSS's business; the words are unchanged. */
      return (
        <div className="decisions">
          {block.items.map((it, i) => (
            <div className="decision" key={i}>
              <p className="decision-lead">{it.lead}</p>
              <p className="decision-text">{it.text}</p>
            </div>
          ))}
        </div>
      );
    case 'pairs':
      /* A challenge and the solution that answers it, as one row. On desktop the
         two halves sit side by side, challenge left, solution right; on a phone
         they stack with a visible "Solution" label. The row is a single list item
         so a screen reader reads the pair together rather than meeting five
         challenges and then five solutions. */
      return (
        <ol className="pairs">
          {block.items.map((pair, i) => (
            <li key={i}>
              <div className="pair-challenge">
                <p className="pair-label">Challenge</p>
                <p className="pair-lead">{pair.challenge.lead}</p>
                <p className="pair-text">{pair.challenge.text}</p>
              </div>
              <div className="pair-solution">
                <p className="pair-label">Solution</p>
                <p className="pair-lead">{pair.solution.lead}</p>
                <p className="pair-text">{pair.solution.text}</p>
              </div>
            </li>
          ))}
        </ol>
      );
    case 'steps':
      return (
        <ol className="steps">
          {block.items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ol>
      );
    case 'facts':
      return (
        <dl className="results">
          {block.items.map((it) => (
            <div key={it.label}>
              <dt>{it.label}</dt>
              <dd>{it.value}</dd>
            </div>
          ))}
        </dl>
      );
    case 'diagram':
      /* Nothing rendered. The lane lists this block used to draw are now the
         flowchart's own content — the owner asked for them to go on 2026-11-15,
         because the diagram above says the same thing and better. The data stays
         in src/content.ts: it is where the flowchart's facts come from, and the
         unit tests read it to keep the two from disagreeing. */
      return null;
  }
}
