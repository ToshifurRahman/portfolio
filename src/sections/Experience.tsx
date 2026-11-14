import { experience, owner } from '../content';
import { Section } from '../Section';

export function Experience() {
  return (
    <Section id="experience" title="Experience">
      {owner.cv && (
        <a className="action cv-download" href={owner.cv} download="">
          Download CV (PDF)
        </a>
      )}
      <ol className="cv-roles">
        {experience.map((role) => (
          <li key={`${role.title}-${role.organization}`} className="cv-role">
            <h3 className="cv-role-title display">{role.title}</h3>
            <p className="cv-org">
              <span>{role.organization}</span>
              <span className="cv-period">{role.period}</span>
            </p>
            <ul className="cv-points">
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
