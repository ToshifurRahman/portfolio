import { Fragment } from 'react';
import type { CaseStudy } from './content';

/* A card's small node diagram: the study's main chain, drawn as labelled boxes
 * joined by arrows, in the Signal Box line language. It is a static picture of
 * the same lane the case study's architecture section lists, so it states no
 * fact of its own: every label is read from src/content.ts.
 *
 * One branch is allowed, and only where the source states one. Ticket-Pipeline's
 * gateway switches to a backup model when the primary fails or times out, so the
 * diagram forks after the gateway; RannaGhor's lane has no such fork.
 *
 * The boxes are real text in a list, so the diagram reads with no CSS and needs
 * no SVG. On a phone the row cannot hold six boxes, so the chain turns vertical
 * rather than shrinking below legible type — a horizontal scrollbar here would
 * hide part of the picture, which is worse than a tall one.
 */

type Node = { label: string; branch?: boolean };

/* The chain to draw, read from the study's own lanes. The Work lane is the
 * longest non-sibling lane and is the one that shows the system in order; for
 * RannaGhor that is the request lane, which ends at PostgreSQL in its diagram
 * even though the lane block stops at the route handler. */
export function chainFor(study: CaseStudy): Node[] {
  const lanes = study.sections.flatMap((s) => s.blocks.flatMap((b) => (b.kind === 'diagram' ? b.lanes : [])));
  const lane = lanes.filter((l) => !l.siblings).sort((a, b) => b.nodes.length - a.nodes.length)[0];
  if (!lane) return [];

  const nodes: Node[] = lane.nodes.map((label) => ({ label }));

  /* The backup-model branch, where the lane note states it. The note is the
     source, not a new fact: "The gateway switches to a backup model when the
     primary fails or times out." */
  const gateway = nodes.findIndex((n) => /gateway/i.test(n.label));
  if (gateway >= 0 && /backup model/i.test(lane.note ?? '')) {
    nodes.push({ label: 'Backup model', branch: true });
  }
  return nodes;
}

export function NodeDiagram({ study }: { study: CaseStudy }) {
  const nodes = chainFor(study);
  if (!nodes.length) return null;
  return (
    <ol className="nodes" aria-label={`${study.title}: how the parts connect, in order`}>
      {nodes.map((node) =>
        node.branch ? (
          <Fragment key={node.label}>
            {/* The branch starts its own row, so it hangs under the chain
                instead of trailing off the end of it. */}
            <li className="node-break" aria-hidden="true" />
            <li className="node is-branch">{node.label}</li>
          </Fragment>
        ) : (
          <li key={node.label} className="node">
            {node.label}
          </li>
        ),
      )}
    </ol>
  );
}
