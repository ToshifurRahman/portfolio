/*
 * The home page's sections, their numbers in the chain, and the order the
 * navbar lists them in.
 *
 * R1: about, work, experience, education, achievements, certificates,
 * skills, contact. Education has no navbar entry and no box of its own: it
 * sits under Experience (03), so the boxes run 01, 02, 03, 05, 06, 07, 08 and
 * the headings keep the skipped 04. A state carries the same number in the
 * diagram and in its heading.
 */
export const sections = [
  { id: 'about', label: 'About', num: '01' },
  { id: 'work', label: 'Work', num: '02' },
  { id: 'experience', label: 'Experience', num: '03' },
  { id: 'achievements', label: 'Achievements', num: '05' },
  { id: 'certificates', label: 'Certificates', num: '06' },
  { id: 'skills', label: 'Skills', num: '07' },
  { id: 'contact', label: 'Contact', num: '08' },
] as const;

export type SectionId = (typeof sections)[number]['id'];

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
