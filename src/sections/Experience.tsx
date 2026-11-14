import { experience, owner } from '../content';
import { CvSection } from './CvSection';

export function Experience() {
  return (
    <CvSection id="experience" title="Experience">
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
              <span className="cv-org-name">{role.organization}</span>
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
    </CvSection>
  );
}
