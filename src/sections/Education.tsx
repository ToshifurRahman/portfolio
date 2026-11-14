import { education } from '../content';
import { Section } from '../Section';

export function Education() {
  return (
    <Section id="education" title="Education">
      <ol className="cv-degrees">
        {education.map((entry) => (
          <li key={entry.degree} className="cv-degree">
            <h3 className="cv-degree-title display">{entry.degree}</h3>
            <p className="cv-org">
              <span>{entry.institution}</span>
              <span className="cv-period">{entry.period}</span>
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
