import { achievements } from '../content';
import { Section } from '../Section';
import { Certificates } from './Certificates';

export function Achievements() {
  return (
    <Section id="achievements" title="Achievements">
      <ul className="achievements">
        {achievements.map((entry) => (
          <li key={entry.text}>
            <p>{entry.text}</p>
            {entry.links && (
              <p className="achievement-links">
                {entry.links.map((link) => (
                  <a key={link.href} className="inline-link" href={link.href} rel="noopener noreferrer">
                    {link.label}
                  </a>
                ))}
              </p>
            )}
          </li>
        ))}
      </ul>
      <Certificates />
    </Section>
  );
}
