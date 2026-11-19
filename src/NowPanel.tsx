import type { CSSProperties } from 'react';
import { path, pathYears, type PathStop } from './content';

/* The Now panel: two lanes, Study and Work, on one shared year axis.
 *
 * Owner, 2026-11-15: "In Now, timeline chart not looking good, research to make
 * it look good. drop latest system & problem solving", answered by two lanes.
 * Owner, 2026-11-17: the graph was "disconnected & misguided", so:
 *
 *   - the axis is every year from the first to the last year in the data
 *     (derived in src/content.ts), so distance on it is truthful;
 *   - a lane is one continuous line: every stop's lamp sits on that line, and a
 *     stop that shares a year with a neighbour stacks its label below rather than
 *     dropping to a row of its own;
 *   - the B.Sc. is one bar from 2021 to 2025, its ends labelled and capped;
 *   - both M.Engg. stops sit at 2026, the current one lit;
 *   - same-year labels have their own rows, and the ruler marks every year,
 *     including the empty ones.
 *
 * Nothing is invented: every label, date and year comes from the `path` list in
 * src/content.ts. It is static, and it is an ordered list of real text, so it
 * reads with no CSS and no script. Below 48rem the year axis gives way to one
 * stacked timeline.
 */

const laneStops = (lane: PathStop['lane']) => path.filter((stop) => stop.lane === lane && !stop.parent);
const childrenOf = (label: string) => path.filter((stop) => stop.parent === label);

/* The grid column a year occupies, 1-based, with the year ticks in row 1. */
const columnOf = (year: number) => pathYears.indexOf(year) + 1;

const isSpan = (stop: PathStop) => stop.year !== undefined && stop.yearEnd !== undefined;

/* A stop's offset within its year's column. The first stop on a year sits on the
   line; a second one keeps its lamp on the line and stacks its label below. */
function placements(lane: PathStop['lane']) {
  const seen = new Map<number, number>();
  return laneStops(lane).map((stop) => {
    if (stop.year === undefined || isSpan(stop)) return { stop, stack: 0 };
    const stack = seen.get(stop.year) ?? 0;
    seen.set(stop.year, stack + 1);
    return { stop, stack };
  });
}

function Stop({ stop, stack }: { stop: PathStop; stack: number }) {
  const children = childrenOf(stop.label);
  const span = isSpan(stop);
  const start = stop.year !== undefined ? columnOf(stop.year) : undefined;
  const end = stop.yearEnd !== undefined ? columnOf(stop.yearEnd) : start;
  const gridColumn =
    start === undefined ? '1 / -1' : end === undefined ? `${start} / ${start + 1}` : `${start} / ${end! + 1}`;

  return (
    <li
      className={['stop', span && 'is-span', stop.current && 'is-current'].filter(Boolean).join(' ')}
      data-year={stop.year ?? ''}
      data-year-end={stop.yearEnd ?? ''}
      style={{ gridColumn, gridRow: '1 / span 3', '--stack': stack } as CSSProperties}
    >
      {span && <span className="stop-span" aria-hidden="true" />}
      <span className={stop.current ? 'lamp is-lit' : 'lamp'} aria-hidden="true" />
      {span && <span className="stop-end-cap" aria-hidden="true" />}
      <span className="stop-body" style={{ gridRow: 2 + stack }}>
        {/* The axis is hidden below 48rem, so the year has to survive here. */}
        {stop.year !== undefined && (
          <span className="stop-year mono">
            {span && stop.yearEnd !== undefined ? `${stop.year} to ${stop.yearEnd}` : stop.year}
          </span>
        )}
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
      {span && stop.endLabel && (
        <span className="stop-body stop-end">
          <span className="stop-label">{stop.endLabel}</span>
          {stop.endDate && <span className="stop-date mono">{stop.endDate}</span>}
        </span>
      )}
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
            which carry the same dates in their own text. */}
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
              {placements(lane).map(({ stop, stack }) => (
                <Stop key={stop.label} stop={stop} stack={stack} />
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}
