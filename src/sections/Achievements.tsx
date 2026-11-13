import { achievements } from '../content';

export function Achievements() {
  return (
    <section id="achievements" className="cv-section" aria-labelledby="achievements-title">
      <div className="cv-section-head">
        <h2 id="achievements-title" className="cv-title display">
          Achievements
        </h2>
      </div>
      <ul className="cv-achievements">
        {achievements.map((entry) => (
          <li key={entry.text}>
            <p>{entry.text}</p>
            {entry.links && (
              <p className="cv-achievement-links">
                {entry.links.map((link) => (
                  <a key={link.href} className="action" href={link.href} rel="noopener noreferrer">
                    {link.label}
                  </a>
                ))}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
