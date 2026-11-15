import { Achievements } from './Achievements';
import { Education } from './Education';
import { Experience } from './Experience';

/* The CV's sections, in page order. Certificates are part of Achievements. */
export function CvSections() {
  return (
    <>
      <Experience />
      <Education />
      <Achievements />
    </>
  );
}
