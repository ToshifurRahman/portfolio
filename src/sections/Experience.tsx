import { experience } from '../content';
import { Section } from '../Section';

export function Experience() {
  return (
    <Section id="experience" title="Experience">
      <ol className="entries">
        {experience.map((role) => (
          <li key={`${role.title}-${role.organization}`} className="entry">
            <span className={/present/i.test(role.period) ? 'lamp is-lit' : 'lamp'} aria-hidden="true" />
            <div className="entry-head">
              <h3 className="entry-title">{role.title}</h3>
              <p className="entry-period">{role.period}</p>
            </div>
            <p className="entry-org">{role.organization}</p>
            <ul className="points">
              {role.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </Section>
  );
}
