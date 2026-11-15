import { achievements } from '../content';
import { Section } from '../Section';
import { Certificates } from './Certificates';

/* The problem-solving record leads the section as a highlighted readout: online
   judge ratings, problems solved and contests entered, with the two profiles.
   Every figure is split from the first achievement's own sentence in
   src/content.ts, so no fact changes; that entry is shown here instead of
   again in the list, and the remaining achievements follow it. */
export function Achievements() {
  const lead = achievements.find((a) => a.record);
  const rest = achievements.filter((a) => !a.record);
  return (
    <Section id="achievements" title="Achievements">
      {lead?.record && (
        <div className="readout-figures">
          <ul className="proof" aria-label="Problem-solving record">
            {lead.record.map((r) => (
              <li key={r.label}>
                <span className="proof-value">{r.value}</span>
                <span className="proof-label">{r.label}</span>
              </li>
            ))}
          </ul>
          <p className="readout-record">
            <span>{lead.text}</span>
            {lead.links && (
              <span className="achievement-links">
                {lead.links.map((link) => (
                  <a key={link.href} className="inline-link" href={link.href} rel="noopener noreferrer">
                    {link.label}
                  </a>
                ))}
              </span>
            )}
          </p>
        </div>
      )}
      <ul className="achievements">
        {rest.map((entry) => (
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
