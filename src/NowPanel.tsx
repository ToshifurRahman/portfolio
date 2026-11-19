import type { CSSProperties } from 'react';
import { path, type PathStop } from './content';

/* The Now panel: one chronological spine, six real stops alternating above and
 * below it.
 *
 * Owner, 2026-11-19: the two-lane axis read as disconnected, so the panel is one
 * timeline in the reference's shape: a central horizontal spine with end caps,
 * odd stops above it and even stops below. An up stop has its label above the
 * spine and its year below; a down stop is the mirror. A node dot sits on the
 * spine, a stem runs to an outer dot, and the body sits beyond that dot.
 *
 * Nothing is invented. The stops are derived from `path` in src/content.ts: a
 * stop the source dates at both ends (the B.Sc.) becomes two stations, its start
 * and its `endLabel` / `endDate` completion. Undated children hang under their
 * dated parent. Same-year stops use the real date text for their display order:
 * an undated admission, then a dated month, then "In progress".
 *
 * It is static, and it is one ordered list of real text, so it reads with no CSS
 * and no script. Below 48rem the spine turns vertical on the left.
 */

type Station = {
  key: string;
  label: string;
  date: string;
  year: number;
  lane: PathStop['lane'];
  current?: boolean;
  children: string[];
};

const childrenOf = (label: string) => path.filter((stop) => stop.parent === label);

/* The display rank within one year. The source text decides it: no date is an
   admission point, a month is a dated role, "In progress" is the open end. */
const dateRank = (date: string) => (date === '' ? 0 : /in progress/i.test(date) ? 2 : 1);

const stations: Station[] = (() => {
  const sources = path
    .filter((stop) => !stop.parent && stop.year !== undefined)
    .flatMap((stop, index) => {
      const start = { stop, index, label: stop.label, date: stop.date, year: stop.year as number, end: false };
      if (stop.yearEnd === undefined) return [start];
      return [
        start,
        {
          stop,
          index,
          label: stop.endLabel ?? stop.label,
          date: stop.endDate ?? '',
          year: stop.yearEnd,
          end: true,
        },
      ];
    })
    .sort((a, b) => a.year - b.year || dateRank(a.date) - dateRank(b.date) || a.index - b.index);

  return sources.map(({ stop, label, date, year, end }) => ({
    key: `${label}-${year}`,
    label,
    date,
    year,
    lane: stop.lane,
    current: end ? undefined : stop.current,
    /* The completion is its own station, so the source's children stay with the
       start station only. */
    children: end ? [] : childrenOf(stop.label).map((child) => child.label),
  }));
})();

export function NowPanel() {
  const columns = { gridTemplateColumns: `repeat(${stations.length}, minmax(0, 1fr))` } as CSSProperties;

  return (
    <section className="frame ruled grid12 now" id="now" aria-labelledby="now-title">
      <h2 className="now-title" id="now-title">
        Now
      </h2>

      <div className="timeline" style={columns}>
        {/* One spine for the whole list. The stops below carry the same years in
            their own text, so the spine itself is decoration. */}
        <span className="tl-spine" aria-hidden="true" />

        <ol className="tl-stops">
          {stations.map((stop, index) => (
            <li
              key={stop.key}
              className={['stop', index % 2 === 0 ? 'is-up' : 'is-down', stop.current && 'is-current']
                .filter(Boolean)
                .join(' ')}
              data-year={stop.year}
              data-lane={stop.lane}
              style={{ gridColumn: `${index + 1}` }}
            >
              <span className="stop-year mono">{stop.year}</span>
              <span className="stop-body">
                <span className="stop-lane mono">{stop.lane === 'study' ? 'Study' : 'Work'}</span>
                <span className="stop-label">{stop.label}</span>
                {stop.date && <span className="stop-date mono">{stop.date}</span>}
                {stop.children.length > 0 && (
                  <span className="stop-children">
                    {stop.children.map((child) => (
                      <span key={child} className="stop-child">
                        {child}
                      </span>
                    ))}
                  </span>
                )}
              </span>
              <span className="stop-stem" aria-hidden="true" />
              <span className="stop-outer" aria-hidden="true" />
              <span className="stop-node" aria-hidden="true" />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
