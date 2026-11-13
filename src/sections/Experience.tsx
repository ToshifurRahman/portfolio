import { experience, owner } from '../content';

export function Experience() {
  return (
    <section id="experience" className="cv-section" aria-labelledby="experience-title">
      <div className="cv-section-head">
        <h2 id="experience-title" className="cv-title display">
          <span className="section-num">03</span> Experience
        </h2>
        {owner.cv && (
          <a className="action cv-download" href={owner.cv} download>
            Download CV (PDF)
          </a>
        )}
      </div>
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
    </section>
  );
}
