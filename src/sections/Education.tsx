import { education } from '../content';
import { Section } from '../Section';

export function Education() {
  return (
    <Section id="education" title="Education">
      <ol className="entries">
        {education.map((entry) => (
          <li key={entry.degree} className="entry">
            <span className={/present/i.test(entry.period) ? 'lamp is-lit' : 'lamp'} aria-hidden="true" />
            <div className="entry-head">
              <h3 className="entry-title">{entry.degree}</h3>
              <p className="entry-period">{entry.period}</p>
            </div>
            <p className="entry-org">{entry.institution}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
