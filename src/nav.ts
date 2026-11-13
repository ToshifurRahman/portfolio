/*
 * The home page's sections and the order the navbar lists them in.
 *
 * R1: about, work, experience, education, achievements, certificates,
 * skills, contact. Education has no navbar entry: it sits under Experience.
 */
export const sections = [
  { id: 'about', label: 'About' },
  { id: 'work', label: 'Work' },
  { id: 'experience', label: 'Experience' },
  { id: 'achievements', label: 'Achievements' },
  { id: 'certificates', label: 'Certificates' },
  { id: 'skills', label: 'Skills' },
  { id: 'contact', label: 'Contact' },
] as const;

export type SectionId = (typeof sections)[number]['id'];

export const sectionHref = (id: SectionId) => `/#${id}`;
