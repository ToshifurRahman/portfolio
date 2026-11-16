import { achievements } from '../content';
import { Section } from '../Section';
import { Certificates } from './Certificates';

/* The problem-solving record leads the section as a highlighted readout: online
   judge ratings, problems solved and contests entered. Every figure is split
   from the first achievement's own sentence in src/content.ts, so no fact
   changes. Under it sits one line, like every other achievement: the handles,
   which are what the figures cannot say. The sentence itself is not printed —
   the owner asked for "the readout plus one line each" (2026-11-16) — but it
   stays in content.ts as the source both views are derived from. */
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
          {lead.links && (
            <p className="readout-sources">
              {lead.links.map((link) => (
                <a
                  key={link.href}
                  className="inline-link mono"
                  href={link.href}
                  rel="noopener noreferrer"
                  aria-label={`${link.label}: ${link.handle ?? link.label}`}
                >
                  {link.handle ?? link.label}
                </a>
              ))}
            </p>
          )}
        </div>
      )}
      {/* One line per achievement: title, place if the title does not say it,
          and the year. The paragraphs were the owner's complaint (23:03, "feels
          like too many texts to read"); every word here is split from the
          sentence that used to be shown, so nothing is reworded. */}
      <ul className="achievements">
        {rest.map((entry) => (
          <li key={entry.text}>
            <p className="achievement-line">
              <span className="achievement-title">{entry.title ?? entry.text}</span>
              {entry.place && <span className="achievement-place">{entry.place}</span>}
              {entry.year && <span className="achievement-year mono">{entry.year}</span>}
            </p>
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
