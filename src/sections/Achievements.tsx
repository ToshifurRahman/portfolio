import { achievements } from '../content';
import { CvSection } from './CvSection';

export function Achievements() {
  return (
    <CvSection id="achievements" title="Achievements">
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
    </CvSection>
  );
}
