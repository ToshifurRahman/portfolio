import { education } from '../content';
import { CvSection } from './CvSection';

export function Education() {
  return (
    <CvSection id="education" title="Education">
      <ol className="cv-degrees">
        {education.map((entry) => (
          <li key={entry.degree} className="cv-degree">
            <h3 className="cv-degree-title display">{entry.degree}</h3>
            <p className="cv-org">
              <span className="cv-org-name">{entry.institution}</span>
              <span className="cv-period">{entry.period}</span>
            </p>
          </li>
        ))}
      </ol>
    </CvSection>
  );
}
