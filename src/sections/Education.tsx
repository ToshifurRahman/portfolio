import { education } from '../content';

export function Education() {
  return (
    <section id="education" className="cv-section" aria-labelledby="education-title">
      <div className="cv-section-head">
        <h2 id="education-title" className="cv-title display">
          Education
        </h2>
      </div>
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
    </section>
  );
}
