import type { ReactNode } from 'react';
import { sectionNumbers, type SectionId } from '../nav';

/* A CV section is a state on the same chain as the rest of the home page, so
   it takes the page's own section layout and reads its number from src/nav.ts
   rather than carrying a copy of it. */
export function CvSection({
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
