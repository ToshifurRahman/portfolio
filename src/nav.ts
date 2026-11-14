/*
 * The home page's sections, their numbers in the chain, and the order the
 * navbar lists them in.
 *
 * R1: about, work, experience, education, achievements, certificates, skills,
 * contact. This is one sequence: every number on the page (the diagram, the
 * navbar and each heading) comes from `pageSections` here, so a section can
 * never be numbered twice. Education has no navbar entry and no box of its
 * own: it sits under Experience (03), so the boxes run 01, 02, 03, 05, 06, 07,
 * 08 and the headings keep the skipped 04.
 */
export const pageSections = [
  { id: 'about', label: 'About', num: '01', inNav: true },
  { id: 'work', label: 'Work', num: '02', inNav: true },
  { id: 'experience', label: 'Experience', num: '03', inNav: true },
  { id: 'education', label: 'Education', num: '04', inNav: false },
  { id: 'achievements', label: 'Achievements', num: '05', inNav: true },
  { id: 'certificates', label: 'Certificates', num: '06', inNav: true },
  { id: 'skills', label: 'Skills', num: '07', inNav: true },
  { id: 'contact', label: 'Contact', num: '08', inNav: true },
] as const;

export type SectionId = (typeof pageSections)[number]['id'];

/* The sections the navbar lists and the chain diagram draws. */
export const sections = pageSections.filter((section) => section.inNav);

/* The number a section's heading carries. */
export const sectionNumbers = Object.fromEntries(
  pageSections.map((section) => [section.id, section.num]),
) as Record<SectionId, string>;

/* Which section a reader is in: the last one whose top has passed the reading
   line, and the final section once the page bottom is reached. The contact
   section is often taller than the viewport, so "in view" alone never made it
   current; scroll position does. */
export function currentSectionAt(
  tops: { id: string; top: number }[],
  line: number,
  atBottom: boolean,
): string | null {
  if (!tops.length) return null;
  if (atBottom) return tops[tops.length - 1].id;
  let current = tops[0].id;
  for (const section of tops) if (section.top <= line) current = section.id;
  return current;
}
