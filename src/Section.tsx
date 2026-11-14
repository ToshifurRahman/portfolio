import type { ReactNode } from 'react';
import { sectionNumbers, type SectionId } from './nav';

/* One section of the home page: a state on the same chain the case-study pages
   draw, numbered from src/nav.ts so the diagram, the bar and the heading can
   never disagree. Every section on `/`, the CV's four included, renders
   through this, so there is one definition of the layout. */
export function Section({
  id,
  title,
  children,
}: {
  id: SectionId;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="state-section" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="display section-heading">
        <span className="state-num">{sectionNumbers[id]}</span>
        <span>{title}</span>
      </h2>
      <div className="state-body">{children}</div>
    </section>
  );
}
