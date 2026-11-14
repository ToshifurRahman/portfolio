import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { caseStudies, type Block } from './content';
import { Footer } from './Footer';
import { Arrow, NotFound } from './NotFound';
import { useTitle } from './useTitle';

const num = (i: number) => String(i + 1).padStart(2, '0');

export function CaseStudyPage() {
  const { slug } = useParams();
  const index = caseStudies.findIndex((c) => c.slug === slug);
  const study = caseStudies[index];
  useTitle(study ? `${study.title} case study` : undefined);
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
        <p className="back">
          <Link className="textbutton" to="/#work">
            <Arrow /> All projects
          </Link>
        </p>
        <h1 className="display study-title">{study.title}</h1>
        <p className="lede">{study.summary}</p>
        <dl className="meta">
          {study.meta.map((m) => (
            <div key={m.label}>
              <dt>{m.label}</dt>
              <dd>{m.href ? <a href={m.href}>{m.value}</a> : m.value}</dd>
            </div>
          ))}
        </dl>

        <nav className="progress" aria-label="Case study sections">
          <ol ref={nav}>
            {study.sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} aria-current={i === current ? 'location' : undefined}>
                  <span className="state-num">{num(i)}</span> {s.title === 'Future improvements' ? 'Future' : s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {study.sections.map((s, i) => (
          <section className="section" id={s.id} key={s.id} aria-labelledby={`${s.id}-h`}>
            <h2 className="display section-title" id={`${s.id}-h`}>
              <span className="section-num">{num(i)}</span> {s.title}
            </h2>
            <div className="section-body">
              {s.blocks.map((b, k) => (
                <BlockView block={b} key={k} />
              ))}
            </div>
          </section>
        ))}

        <p className="next-study">
          <Link to={`/work/${next.slug}`} className="case">
            <span className="display case-title">{next.title}</span>
            <span className="action">
              Read the next case study <Arrow />
            </span>
          </Link>
        </p>
      </main>
      <Footer />
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
              <dd className="display">{it.value}</dd>
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
              <ol className={lane.siblings ? 'lane-nodes siblings' : 'lane-nodes'} aria-label={lane.siblings ? lane.label : `${lane.label}, in order`}>
                {lane.nodes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ol>
              {lane.note && <p className="lane-note">{lane.note}</p>}
            </div>
          ))}
          <figcaption>{block.caption}</figcaption>
        </figure>
      );
  }
}
