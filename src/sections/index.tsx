import { Achievements } from './Achievements';
import { Certificates } from './Certificates';
import { Education } from './Education';
import { Experience } from './Experience';

export function CvSections() {
  return (
    <>
      <Experience />
      <Education />
      <Achievements />
      <Certificates />
    </>
  );
}
