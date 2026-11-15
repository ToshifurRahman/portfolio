/*
 * The home page's sections and which of them the header lists. Certificates
 * are part of Achievements. Education has no header entry: it follows
 * Experience directly, and the header has room for five links.
 */
export const pageSections = [
  { id: 'work', label: 'Work', inNav: true },
  { id: 'experience', label: 'Experience', inNav: true },
  { id: 'education', label: 'Education', inNav: false },
  { id: 'achievements', label: 'Achievements', inNav: true },
  { id: 'skills', label: 'Skills', inNav: true },
  { id: 'contact', label: 'Contact', inNav: true },
] as const;

export type SectionId = (typeof pageSections)[number]['id'];

/* The sections the header lists. */
export const sections = pageSections.filter((section) => section.inNav);

/* Which section a reader is in: the last one whose top has passed the reading
   line, and the final section once the page bottom is reached. Above the first
   section (the introduction) nothing is current. */
export function currentSectionAt(
  tops: { id: string; top: number }[],
  line: number,
  atBottom: boolean,
): string | null {
  if (!tops.length) return null;
  if (atBottom) return tops[tops.length - 1].id;
  let current: string | null = null;
  for (const section of tops) if (section.top <= line) current = section.id;
  return current;
}
