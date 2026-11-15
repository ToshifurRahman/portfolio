import { Link } from 'react-router-dom';
import { nowCells, path } from './content';

/* The Now panel: the home-page slot the track animation used to hold, before
   the owner moved the animated diagram onto the case studies.
 *
 * It is static on purpose. Row one draws the career path as a track of stations
 * (the same track language as the diagrams, vertical on phones) and row two
 * gives the two things a visitor should know now. Every label and date comes
 * from src/content.ts, and the whole panel is an ordered list of real text, so
 * it reads with no CSS and no script.
 */
export function NowPanel() {
  return (
    <section className="frame ruled grid12 now" id="now" aria-labelledby="now-title">
      <h2 className="now-title" id="now-title">
        Now
      </h2>

      {/* The career path. <ol> because the order is the point. */}
      <ol className="path" aria-label="Career path, in order">
        {path.map((stop) => (
          <li key={stop.label} className={stop.current ? 'is-current' : undefined}>
            <span className={stop.current ? 'lamp is-lit' : 'lamp'} aria-hidden="true" />
            <span className="path-body">
              <span className="path-label">{stop.label}</span>
              {stop.date && <span className="path-date mono">{stop.date}</span>}
            </span>
          </li>
        ))}
      </ol>

      <div className="now-cells">
        <div className="now-cell">
          <h3 className="now-cell-title">{nowCells.system.title}</h3>
          <p className="now-cell-main">
            <Link className="inline-link" to={nowCells.system.to}>
              {nowCells.system.name}
            </Link>
          </p>
          <p className="now-cell-detail mono">{nowCells.system.detail}</p>
        </div>
        <div className="now-cell">
          <h3 className="now-cell-title">{nowCells.solving.title}</h3>
          <ul className="now-cell-facts">
            {nowCells.solving.facts.map((fact) => (
              <li key={fact} className="now-cell-main">
                {fact}
              </li>
            ))}
          </ul>
          <p className="now-cell-detail">
            <Link className="inline-link" to={nowCells.solving.to}>
              See the record
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
