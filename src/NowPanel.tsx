import { path, pathYears, type PathStop } from './content';

/* The Now panel: two lanes, Study and Work, on one shared year axis. The owner
 * asked for this on 2026-11-15 ("In Now, timeline chart not looking good,
 * research to make it look good. drop latest system & problem solving"), and for
 * two lanes, Study and Work.
 *
 * The axis is a grid whose columns are the years, so a stop sits in its year's
 * column and nothing can overlap: a label that needs more room wraps inside its
 * column rather than running into its neighbour. A role with no date in the
 * source takes no column of its own — it is listed under the dated role it was
 * held alongside. A span the source dates at both ends (the B.Sc., Aug 2021 to
 * Dec 2025) is drawn as a bar across its columns.
 *
 * Nothing is invented: every label, date and year comes from the `path` list in
 * src/content.ts. It is static, and it is an ordered list of real text, so it
 * reads with no CSS and no script. Below 48rem the two lanes stack into one
 * vertical timeline with year markers.
 */

const laneStops = (lane: PathStop['lane']) => path.filter((stop) => stop.lane === lane);
const childrenOf = (label: string) => path.filter((stop) => stop.parent === label);

/* The grid column a year occupies, 1-based, with the year ticks in row 1. */
const columnOf = (year: number) => pathYears.indexOf(year) + 1;

function Stop({ stop }: { stop: PathStop }) {
  const children = childrenOf(stop.label);
  const span = stop.year !== undefined && stop.yearEnd !== undefined;
  const start = stop.year !== undefined ? columnOf(stop.year) : undefined;
  const end = stop.yearEnd !== undefined ? columnOf(stop.yearEnd) : start;

  return (
    <li
      className={stop.current ? 'stop is-current' : 'stop'}
      data-year={stop.year ?? ''}
      style={
        start === undefined
          ? { gridColumn: '1 / -1' }
          : span
            ? { gridColumn: `${start} / ${end! + 1}` }
            : { gridColumn: `${start}` }
      }
    >
      {span && <span className="stop-span" aria-hidden="true" />}
      <span className={stop.current ? 'lamp is-lit' : 'lamp'} aria-hidden="true" />
      <span className="stop-body">
        <span className="stop-label">{stop.label}</span>
        {stop.date && <span className="stop-date mono">{stop.date}</span>}
        {children.length > 0 && (
          <span className="stop-children">
            {children.map((child) => (
              <span key={child.label} className="stop-child">
                {child.label}
              </span>
            ))}
          </span>
        )}
      </span>
    </li>
  );
}

export function NowPanel() {
  const columns = { gridTemplateColumns: `repeat(${pathYears.length}, minmax(0, 1fr))` };

  return (
    <section className="frame ruled grid12 now" id="now" aria-labelledby="now-title">
      <h2 className="now-title" id="now-title">
        Now
      </h2>

      <div className="timeline">
        {/* Year ticks, shared by both lanes. Decoration over the lists below,
            which carry the same years in their own text. */}
        <ol className="years" style={columns} aria-hidden="true">
          {pathYears.map((year) => (
            <li key={year} className="year mono">
              {year}
            </li>
          ))}
        </ol>

        {(['study', 'work'] as const).map((lane) => (
          <div key={lane} className={`tl-lane tl-lane-${lane}`}>
            <h3 className="tl-lane-title">{lane === 'study' ? 'Study' : 'Work'}</h3>
            <ol
              className="tl-stops"
              style={columns}
              aria-label={lane === 'study' ? 'Study, in order' : 'Work, in order'}
            >
              {laneStops(lane)
                .filter((stop) => !stop.parent)
                .map((stop) => (
                  <Stop key={stop.label} stop={stop} />
                ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}
