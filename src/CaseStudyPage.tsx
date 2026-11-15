import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { caseStudies, type Block } from './content';
import { Footer } from './Footer';
import { Line } from './Line';
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
        <header className="frame grid12 study-head">
          <p className="back">
            <Link className="text-button" to="/#work">
              <Arrow /> All work
            </Link>
          </p>
          <h1 className="study-title">{study.title}</h1>
          <p className="study-lede">
            <Lede text={study.summary} />
          </p>
        </header>
        <dl className="frame ruled meta">
          {study.meta.map((m) => (
            <div key={m.label}>
              <dt>{m.label}</dt>
              <dd>
                {m.href ? (
                  <a className="inline-link" href={m.href} rel="noopener noreferrer">
                    {m.value}
                  </a>
                ) : (
                  m.value
                )}
              </dd>
            </div>
          ))}
        </dl>

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
            <h2 className="section-heading" id={`${s.id}-h`}>
              {s.title}
            </h2>
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
      return (
        <figure className="diagram">
          {block.lanes.map((lane) => (
            <div className="lane" key={lane.label}>
              <h3 className="lane-label">{lane.label}</h3>
              <Line label={lane.label} nodes={lane.nodes} siblings={lane.siblings} />
              {lane.note && <p className="lane-note">{lane.note}</p>}
            </div>
          ))}
          <figcaption>{block.caption}</figcaption>
        </figure>
      );
  }
}
