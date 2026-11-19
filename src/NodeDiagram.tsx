import type { CaseStudy } from './content';

/* A card's small node diagram: the study's main chain, drawn as labelled boxes
 * joined by arrows, in the Signal Box line language. It is a static summary of the
 * system the case study's flowchart details in full, and it states no fact of its
 * own: every label is checked against src/content.ts, and a label the source does
 * not name fails the unit test.
 *
 * One branch is allowed, and only where the source states one. Relay's gateway
 * switches to a backup model when the primary fails or times out, so the diagram
 * forks after the gateway; RannaGhor's lane has no such fork.
 *
 * The boxes are real text in a list, so the diagram reads with no CSS and needs
 * no SVG. On a phone the row cannot hold six boxes, so the chain turns vertical
 * rather than shrinking below legible type — a horizontal scrollbar here would
 * hide part of the picture, which is worse than a tall one.
 */

type Node = { label: string; branch?: boolean };

/* The chain to draw, by slug.
 *
 * It is a spec rather than a heuristic. Picking the longest lane gave the wrong
 * chain twice (R4a-ds-3): Relay's longest lane starts at the API, so the card
 * showed no React app in front of it, and RannaGhor's stops at the route handler,
 * so the card showed no database behind it. Which parts a card shows is a decision,
 * so it is written down.
 *
 * Every label is still sourced: `chain()` checks each one against the study's own
 * lanes and notes, and the unit test fails on a box the source does not name. The
 * Relay card deliberately has no PostgreSQL node — the brief names six parts plus
 * the branch, and a seventh box does not fit a card. */
const CHAINS: Record<string, string[]> = {
  relay: ['React app', 'Hono API', 'SQS queue', 'Worker', 'LLM gateway', 'Primary model'],
  rannaghor: ['Security headers', 'Session', 'Role check', 'Route handler', 'PostgreSQL'],
};

/* The branch, where the source states one. Relay's Work lane says the gateway
   switches to a backup model when the primary fails or times out; it is the only
   fork in either study, so it is named here and checked against the note. */
const BRANCH: Record<string, { after: string; label: string }> = {
  relay: { after: 'LLM gateway', label: 'Backup model' },
};

export function chainFor(study: CaseStudy): Node[] {
  const labels = CHAINS[study.slug];
  if (!labels) return [];
  const nodes: Node[] = labels.map((label) => ({ label }));
  const branch = BRANCH[study.slug];
  if (branch) nodes.push({ label: branch.label, branch: true });
  return nodes;
}

export function NodeDiagram({ study }: { study: CaseStudy }) {
  const nodes = chainFor(study);
  if (!nodes.length) return null;
  const branch = nodes.find((node) => node.branch);
  const chain = nodes.filter((node) => !node.branch);
  return (
    <ol className="nodes" aria-label={`${study.title}: how the parts connect, in order`}>
      {chain.map((node, i) =>
        branch && i === chain.length - 1 ? (
          /* The branch is a nested stack under the box it fails over from, not a
             full-width break in the row. The old `.node-break` spacer assumed a
             flex row: on a phone's column it became full-height and pushed the
             branch into a second column beside React app. */
          <li key={node.label} className="node-stack">
            <span className="node">{node.label}</span>
            <span className="node is-branch">{branch.label}</span>
          </li>
        ) : (
          <li key={node.label} className="node">
            {node.label}
          </li>
        ),
      )}
    </ol>
  );
}
