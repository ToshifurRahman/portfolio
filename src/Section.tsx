import type { ReactNode } from 'react';
import type { SectionId } from './nav';

/* One section of the home page: a ruled band across the frame, the heading in
   the first three columns and the content in the other nine. */
export function Section({ id, title, children }: { id: SectionId; title: string; children: ReactNode }) {
  return (
    <section id={id} className="frame ruled grid12 section" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="section-heading">
        {title}
      </h2>
      <div className="section-body">{children}</div>
    </section>
  );
}
