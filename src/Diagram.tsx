import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

/*
 * One animated flowchart, driven by a spec.
 *
 * The visual language is the signal box: boxes joined by directed edges, one
 * amber token travelling the edges, red only for a refusal or a failure, and a
 * status line that says in words what the token is doing. The same engine draws
 * both case studies' charts.
 *
 * Geometry is derived from the *font*, because that is what went wrong first.
 * Martian Mono advances a fixed 0.895 em per character at every size (measured at
 * 10, 12, 14 and 16px), so a label's width is its character count times that, and
 * a box is sized from its own text. The boxes that shipped were 101 units wide
 * holding labels that needed 182: the spill was visible at every desktop width.
 *
 * Type is never scaled down to fit. The desktop viewBox is kept within the width a
 * 834px panel can show at 1:1, so `preserveAspectRatio` can only enlarge it, and
 * labels stay at 12px or more at 834, 1280 and 1440 as well as on a phone. A wider
 * panel centres the graph and keeps the spare room spare: shrinking the text to
 * fill it was the alternative, and it is the wrong one.
 *
 * Two layouts: the desktop graph, and a vertical one below 48rem with the spine in
 * track 0 and branches indented in track 1, so a branch never chains into the stage
 * after it. Loop edges run down the reserved margin outside the column.
 */

export type LampState = 'off' | 'lit' | 'done' | 'fail';
export type Tone = 'run' | 'fail' | 'done';

/* One step of a scripted run: travel an edge, or dwell with a status. */
export type Step = {
  edge?: string;
  dur?: number;
  status?: string;
  tone?: Tone;
  nodes?: Record<string, LampState>;
  failEdge?: boolean;
};

/* How an edge gets from one box to another. Every route goes through a gap
   between boxes, never across one (review ruling 10). */
export type Route =
  | 'right'
  | 'loop-side-left'
  | 'down'
  | 'down-right'
  | 'down-left'
  | 'loop-bottom'
  | 'loop-side'
  | 'branch';

export type Node = {
  id: string;
  name: string;
  detail?: string;
  at: { row: number; col: number };
  /* Vertical position: `row` orders it down the page, `track` indents a branch. */
  vat: { row: number; track: number };
  /* A state pill: a dashed capsule, kept off the step chain. */
  state?: boolean;
};

export type Cluster = {
  id: string;
  /* "From the LLM gateway", "Every step": the heading names where the group starts,
     which is why no line has to be drawn from the spine into it. */
  heading: string;
  /* The box the group hangs off. The edge from it to `nodes[0]` is replaced by the
     heading on the vertical layout. */
  from: string;
  /* The group's boxes, in the order they chain down the page. */
  nodes: string[];
  /* Taken only when something fails or is refused. */
  branch?: boolean;
};

export type Edge = {
  id: string;
  from: string;
  to: string;
  label?: string;
  /* A branch is dashed: taken only when something fails or is refused. */
  branch?: boolean;
  route: Route;
  /* On the vertical layout this edge is not drawn across the graph: a short arrow
     leaves the box and this text names the destination. Kept short to fit the panel. */
  stub?: string;
};

export type DiagramSpec = {
  id: string;
  title: string;
  href: string;
  note: string;
  nodes: Node[];
  edges: Edge[];
  /* The vertical layout's branch groups, in the order they stack below the spine. */
  clusters?: Cluster[];
  runs: Step[][];
  still: { edges: string[]; nodes: Record<string, LampState> };
  caption: string;
};

/* Martian Mono's advance: 0.895 em per character, constant across sizes. This is
   what makes a character count a valid width, and it is measured, not assumed. */
const CHAR = 0.895;

/* Label sizes in viewBox units. The viewBox is never scaled down, so 12 units are
   12px on screen or more, which is ruling 9's floor at every width. */
const NAME = 12;
const DETAIL = 12;

/* The arrowhead is a `marker` inherited by every edge (`Marker` below): markerWidth 6 in
   `strokeWidth` units (the default markerUnits), on a 2px track, with the path's point at
   refX 7 of an 8-unit viewBox. Its ink therefore runs `MARKER_TIP` units past the path's
   own endpoint.

   Owner, 2026-11-17: "fix lines connected with boxes". Every edge used to stop
   `2 + 2 * MARKER_TIP` short of its target "so the *ink* clears by a visible margin", which
   put the arrowhead's tip 3.5 units (4px at 1440) off the border: a measurable break on
   every edge in both studies. A path now stops exactly `MARKER_TIP` short, so the ink's tip
   meets the border and the line reads as joined to its box. The number still comes from the
   marker rather than from eye. */
const TRACK = 2;
const MARKER_TIP = (6 * TRACK * (8 - 7)) / 8;
const EDGE_STOP = MARKER_TIP;
/* The state rail keeps its own stop. P2b-9 ruled that a rail connector ends *clear* of
   the pill it joins rather than touching it: two dashed capsules are a set, not a chain
   of steps, and ink on the border reads as a collision at 3x. So the tip stops
   `RAIL_CLEAR` units clear there, while every ordinary join meets its box. */
const RAIL_CLEAR = 4;
const RAIL_STOP = MARKER_TIP + RAIL_CLEAR;
/* The marker's full length: the straight run an arrowhead needs behind it. */
const MARKER_LEN = 6 * TRACK;
const PAD = 13;
const LINE = 17;

const reduceMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

type Placed = Node & { x: number; y: number; w: number; h: number };
type Bounds = { w: number; h: number; laneL?: number; laneR?: number };

const adv = (size: number) => CHAR * size;

/* Break a label into lines that fit `max` viewBox units, on word boundaries, using
   the font's own advance. A single word longer than the box is left whole: the box
   is then widened to it, because a chopped label says less than the flow says. */
function wrapToWidth(text: string, size: number, max: number): string[] {
  const limit = Math.floor(max / adv(size));
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    if (line && (line + ' ' + word).length > limit) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

const longestLine = (text: string) => Math.max(...text.split(' ').map((w) => w.length));

/* The width a node needs for its own text, given the inner width it may use. */
function naturalWidth(node: Node, inner: number): number {
  const nameW = Math.max(
    ...wrapToWidth(node.name, NAME, inner).map((l) => l.length * adv(NAME)),
    longestLine(node.name) * adv(NAME),
  );
  const detailW = node.detail
    ? Math.max(
        ...wrapToWidth(node.detail, DETAIL, inner).map((l) => l.length * adv(DETAIL)),
        longestLine(node.detail) * adv(DETAIL),
      )
    : 0;
  return Math.max(nameW, detailW) + PAD * 2;
}

const heightOf = (node: Node, inner: number) => {
  const nameLines = wrapToWidth(node.name, NAME, inner).length;
  const detailLines = node.detail ? wrapToWidth(node.detail, DETAIL, inner).length : 0;
  /* Every line gets its own LINE of height, plus the padding. Two name lines and a
     detail is four lines: a 44-unit box held only two. */
  return Math.ceil((nameLines + detailLines) * LINE + PAD * 1.6);
};

const GAP_X = 46;
const GAP_Y = 30;

/* The desktop layout. Boxes are sized from their text; a column is as wide as its
   widest box; a row is as tall as its tallest. The loop margin is reserved on both
   sides so a loop edge has somewhere to run that is not a box. */
function layoutDesktop(spec: DiagramSpec) {
  const rows = Math.max(...spec.nodes.map((n) => n.at.row)) + 1;
  const cols = Math.max(...spec.nodes.map((n) => n.at.col)) + 1;

  const colW: number[] = Array.from({ length: cols }, (_, c) => {
    const inCol = spec.nodes.filter((n) => n.at.col === c);
    return Math.max(96, ...inCol.map((n) => naturalWidth(n, 170)));
  });

  /* The gap must hold the labels its edges carry, or a label spills into the boxes
     either side and they paint over it. It is measured from the labels themselves,
     in the same font advance the boxes use. */
  const labels = spec.edges.filter((e) => e.label).map((e) => (e.label as string).length);
  const widestLabel = labels.length ? Math.max(...labels) : 0;
  const gap = Math.max(GAP_X, Math.ceil(widestLabel * adv(11)) + 20);
  /* The graph reserves a gutter for the labels it draws outside a box — a loop's label
     runs in the reserved margin — so the widest of them decides the margin on each
     side. A label is then never clamped and never cut: it has room that was planned
     for it. */
  /* A loop runs its line down a narrow reserved lane, and its label sits beside that
     lane *inside* the drawing. The margin therefore only has to hold the lane, not the
     label: sizing it for the label added ~190 units a side, and because the graph is
     scaled to fit, that shrank every name to 10.6px at 1280. */
  /* A loop draws its label centred on the lane it runs down — a label offset by its own
     half-width from the line sits 50-97px from it, which reads as a heading of whatever
     box is under it. So the margin is sized to hold half of the widest loop label on
     that side, and the lane runs down the middle of the margin. Only the sides that
     actually carry a loop pay for it: RannaGhor has none and keeps 16 units. */
  const pillOf = (text: string) => Math.ceil(text.length * adv(DETAIL)) + 10;
  const loopPill = { left: 0, right: 0 };
  for (const e of spec.edges) {
    if (!e.label) continue;
    if (e.route === 'loop-side') loopPill.right = Math.max(loopPill.right, pillOf(e.label));
    if (e.route === 'loop-side-left') loopPill.left = Math.max(loopPill.left, pillOf(e.label));
  }
  const mLeft = loopPill.left ? Math.ceil(loopPill.left / 2) + 10 : 16;
  const mRight = loopPill.right ? Math.ceil(loopPill.right / 2) + 10 : 16;
  const colX: number[] = [];
  let x = mLeft;
  for (let c = 0; c < cols; c++) {
    colX[c] = x;
    x += colW[c] + gap;
  }

  const rowH: number[] = Array.from({ length: rows }, (_, r) => {
    const inRow = spec.nodes.filter((n) => n.at.row === r);
    return Math.max(44, ...inRow.map((n) => heightOf(n, colW[n.at.col] - PAD * 2)));
  });
  const rowY: number[] = [];
  let y = 22;
  for (let r = 0; r < rows; r++) {
    rowY[r] = y;
    y += rowH[r] + GAP_Y;
  }

  const nodes: Placed[] = spec.nodes.map((node) => ({
    ...node,
    x: colX[node.at.col],
    y: rowY[node.at.row],
    w: colW[node.at.col],
    h: rowH[node.at.row],
  }));

  /* The bottom margin is where a loop edge runs: below every row, so it crosses no
     box (ruling 10). */
  /* Room under the last row for a loop edge and its label, the margin on each side, and
     the two lanes: one down the middle of each margin. */
  const w = x - gap + mRight;
  return { nodes, w, h: y - GAP_Y + 76, laneL: mLeft / 2, laneR: w - mRight / 2 };
}

/* The vertical layout, designed rather than patched.
 *
 * Four passes of moving one label at a time failed here, because a two-track graph
 * cannot be read at 390: a branch beside the spine looks like the next step, and a
 * line from the spine to a group far below can only cross the boxes in between. So the
 * page is not a graph with branches: it is a *spine*, then each branch group as its own
 * stacked cluster with a heading naming where it starts, a visible gap between groups,
 * and no line joining one group to the next. Inside a group the boxes chain, because
 * those orders are real (Event log → Customer's page → Ops feed).
 *
 * By construction no edge spans more than one gap, so nothing can cross a box, and
 * every label sits beside its own segment inside the panel. That is F3-2's requirement:
 * the class of defect is gone, not its instances.
 */
const HEADING = 11;
/* Room under a cluster's heading for the edge that enters the group. The heading
   names the group; the edge says which route or failure reaches it, and that label
   is the reason the edge exists. The arrow needs a straight run at least one marker
   long, or its head sits on the elbow and reads as a kink (P2b-8). */
const ENTRY = 30;

function layoutVertical(spec: DiagramSpec) {
  const states = spec.nodes.filter((n) => n.state);
  const inCluster = new Set((spec.clusters ?? []).flatMap((c) => c.nodes));
  const spine = spec.nodes.filter((n) => !n.state && !inCluster.has(n.id));

  /* The graph's own width, chosen so the narrowest phone we support still draws it at
     1:1 or larger: the panel's content box at a 360px viewport is ~338px, so the
     viewBox may not be wider than that or the whole chart scales down and takes every
     label under the floor with it (F5-2's 11.09px at 360). */
  const W = 330;
  const MARGIN = 8;
  const boxW = W - MARGIN * 2;
  const labels: Placed[] = [];
  const nodes: Placed[] = [];
  /* Where each cluster's heading goes: the heading is the entry point, drawn in the gap
     above its group, so no edge has to come down from the spine. */
  const headings: { x: number; y: number; text: string; cluster: string }[] = [];
  /* The spine's own chain order: it is `vat.row`, which the data already states. */
  let y = 14;

  const place = (node: Node, top: number) => {
    const h = Math.max(44, heightOf(node, boxW - PAD * 2));
    const box = { ...node, x: MARGIN, y: top, w: boxW, h };
    nodes.push(box);
    return box;
  };

  for (const node of [...spine].sort((a, b) => a.vat.row - b.vat.row)) {
    const box = place(node, y);
    y += box.h + 34;
  }

  /* The clusters, stacked in the order the data gives. A gap and a heading separate
     one from the next; no line crosses either. Under the heading, the edge that
     enters the group is drawn as a short arrow into its first box, so the route or
     failure that reaches the group keeps its label (F3-1). The heading names the
     group; the arrow says how you get in. */
  for (const cluster of spec.clusters ?? []) {
    y += 16;
    headings.push({ x: MARGIN, y: y + HEADING, text: cluster.heading, cluster: cluster.id });
    y += HEADING + ENTRY;
    for (const id of cluster.nodes) {
      const node = spec.nodes.find((n) => n.id === id);
      if (!node) continue;
      const box = place(node, y);
      y += box.h + 26;
    }
    y += 6;
  }

  /* The ticket's states, on their own rail at the end: this already read correctly. */
  if (states.length) {
    y += 18;
    /* The four states are a set, not a sequence, and the gap between them is the only
       thing that says so. At 8 units across and 12 down the dashed borders read as shared
       at 3x. The gaps are in viewBox units and the vertical layout draws at 1.358, so
       these are ~14 and ~27 screen pixels. */
    /* The gap has to hold an edge's final straight run, or the arrowhead sits on the elbow
       and reads as a kink (P2b-8: 5 and 9 units of run against a 12-unit marker at gaps of
       14 and 20). A rail join turns at the midpoint, so the final leg is half the vertical
       gap — hence the gap is twice `EDGE_STOP + MARKER_LEN`. Horizontally the last leg is the
       whole gap, so it needs that sum once, plus a little air. */
    const pillGapX = EDGE_STOP + MARKER_LEN + 6;
    const pillGapY = 2 * (EDGE_STOP + MARKER_LEN);
    const pillH = 30;
    const pillW = (W - MARGIN * 2 - pillGapX) / 2;
    states.forEach((node, i) => {
      nodes.push({
        ...node,
        x: MARGIN + (i % 2) * (pillW + pillGapX),
        y: y + Math.floor(i / 2) * (pillH + pillGapY),
        w: pillW,
        h: pillH,
      });
    });
    y += Math.ceil(states.length / 2) * (pillH + pillGapY);
  }

  return { nodes, w: W, h: y + 26, headings, labels };
}

const byId = (nodes: Placed[]) => new Map(nodes.map((n) => [n.id, n]));

/* An edge's path. Every route goes through a gap: a loop leaves the box sideways,
   runs down the reserved bottom margin, and comes back up, so it crosses no box. */
function edgePath(
  a: Placed,
  b: Placed,
  route: Route,
  bounds: Bounds,
  vertical = false,
  /* How many earlier edges left the same box toward the same side. Two edges that depart
     from one box onto an identical run give their labels nowhere to belong: every pill near
     either is equally near both, so attribution can never say which line it names. The
     departure leg is staggered by this index and the lane pushed out by it, so each edge
     owns a stretch of its own. */
  sibling = 0,
): string {
  if (vertical) {
    const acx = a.x + a.w / 2;
    const bcx = b.x + b.w / 2;
    /* Every vertical-layout box is one column wide, so an edge is a straight drop into
       the next box down, or a link along the state rail. Nothing here can cross a box:
       an edge only ever spans the single gap between two neighbours. */
    /* The state pills keep their clearance (P2b-9) on their chain joins too: they are a
       set of dashed capsules, and ink on the border reads as a collision. */
    const stop = b.state ? RAIL_STOP : EDGE_STOP;
    if (b.y >= a.y + a.h) {
      if (Math.abs(acx - bcx) < 1) return `M${acx} ${a.y + a.h} V${b.y - stop}`;
      const mid = Math.min((a.y + a.h + b.y) / 2, b.y - stop - MARKER_LEN);
      return `M${acx} ${a.y + a.h} V${mid} H${bcx} V${b.y - stop}`;
    }
    /* Along the rail: side to side, or down one row. Same stop rule as every other join:
       the target's own kind decides (`P2b-9`). */
    if (Math.abs(a.y - b.y) < 1) return `M${a.x + a.w} ${a.y + a.h / 2} H${b.x - stop}`;
    const mid = (a.y + a.h + b.y) / 2;
    return `M${acx} ${a.y + a.h} V${mid} H${bcx} V${b.y - stop}`;
  }
  const acx = a.x + a.w / 2;
  const bcx = b.x + b.w / 2;
  const acy = a.y + a.h / 2;
  const bcy = b.y + b.h / 2;
  /* The stop belongs to the join, not the layout. A state pill is one of a set of dashed
     capsules, and ink landing on its border reads as a collision (P2b-9), so it takes
     `RAIL_STOP` here exactly as it does on the vertical rail. This branch lives in the
     desktop half of `edgePath`, and it used to read `RAIL_STOP` only under `if (vertical)`,
     which left the three desktop state joins on Ticket-Pipeline touching their capsules:
     gap 0 units at 1440, where 40a1256 had 3.5. The target decides, because the target is
     the border the arrowhead's ink reaches. */
  const stop = b.state ? RAIL_STOP : EDGE_STOP;
  /* Out to the outer margin, up to the target's own height, and in from the side:
     the margin is reserved and no box reaches into it. */
  if (route === 'loop-side') {
    const lane = bounds.laneR ?? bounds.w - 10;
    if (bcy < acy) return `M${a.x + a.w} ${acy} H${lane} V${bcy} H${b.x + b.w + stop}`;
    return `M${a.x + a.w} ${acy} H${lane} V${bcy} H${b.x + b.w + stop}`;
  }
  if (route === 'loop-side-left') {
    /* The left margin, for a branch that leaves a box whose neighbours are below it.
       The run into the target turns a whole marker above it, so the arrowhead lands on a
       straight leg rather than on the elbow (P2b-8: this leg was 7 units, a 12-unit marker
       long). */
    const lane = bounds.laneL ?? 8;
    const approach = b.y - stop;
    return `M${a.x} ${acy} H${lane} V${approach - MARKER_LEN} H${b.x - stop} V${approach}`;
  }
  if (route === 'loop-bottom') {
    const lane = Math.min(bounds.h - 10, Math.max(a.y + a.h, b.y + b.h) + 30);
    return `M${acx} ${a.y + a.h} V${lane} H${bcx} V${b.y + b.h + stop}`;
  }

  /* Below the source: down through the gap under it, then across to the target. */
  if (b.y >= a.y + a.h) {
    /* A later departure from the same box stands off the centre line, so it does not run
       down the earlier one's leg. The offset stays inside the box's own bottom edge, and
       the target shares the column, so the leg still lands on its border. */
    const stagger = acx + Math.min(a.w / 2 - 6, sibling * 14);
    if (Math.abs(acx - bcx) < 1) return `M${stagger} ${a.y + a.h} V${b.y - stop}`;
    /* To a box that is not directly below, the gap under the source is crossed at
       the outer edge of the two, so the horizontal run misses anything between. */
    const right = b.x > a.x;
    const lane0 = right ? Math.max(a.x + a.w, b.x + b.w) + 10 : Math.min(a.x, b.x) - 10;
    const lane = right ? lane0 + sibling * 12 : lane0 - sibling * 12;
    /* Two edges that leave one box for the same side cannot both use one leg at one
       height. The two that leave Role check did, and `authorise`'s leftward run cut
       through `refuse`'s final approach at (104,114). The separation is geometric
       rather than a bigger number: a later sibling departs *further out* toward the side
       it travels and turns *higher* (closer to the box) than the one before it. Its leg
       is then on the far side of the earlier edge's leg, its turn is above the earlier
       edge's turn, and its run leaves outward — so the two never share a point, and no
       third edge is displaced to make room. `sibling` is the departure index within one
       box and side, so this is the whole ordering. */
    const out = (a.w / 2 - 6) * Math.min(sibling, 2);
    const sx = Math.min(a.x + a.w - 6, Math.max(a.x + 6, acx + (right ? 1 : -1) * out));
    const drop = Math.max(a.y + a.h + 2, a.y + a.h + 10 - sibling * 6);
    /* The second-to-last turn sits a whole marker above the target, so the final run is a
       straight leg the arrowhead can sit on (P2b-8: this leg measured 7 units). */
    return `M${sx} ${a.y + a.h} V${drop} H${lane} V${b.y - stop - MARKER_LEN} H${b.x + b.w / 2} V${b.y - stop}`;
  }
  /* Above the source: up the gap and in from the top. */
  if (b.y + b.h <= a.y) {
    const above = b.y + b.h + (a.y - (b.y + b.h)) / 2;
    if (Math.abs(acx - bcx) < 1) return `M${acx} ${a.y} V${b.y + b.h + stop}`;
    return `M${acx} ${a.y} V${above} H${bcx} V${b.y + b.h + stop}`;
  }
  /* Same band: side to side through the gap between them. */
  if (b.x >= a.x + a.w) return `M${a.x + a.w} ${acy} H${b.x - stop}`;
  if (a.x >= b.x + b.w) return `M${a.x} ${acy} H${b.x + b.w + stop}`;
  /* Overlapping bands: go round the outside rather than through the box. */
  const lane = b.x >= a.x ? b.x + b.w + 12 : b.x - 12;
  return `M${a.x + a.w} ${acy} H${lane} V${bcy} H${b.x + b.w + stop}`;
}

/* A label's anchor: the middle of the gap its edge crosses. */
function labelPos(a: Placed, b: Placed, route: Route, bounds: Bounds, labelW: number): { x: number; y: number } {
  if (route === 'loop-side') {
    /* Centred *on* the lane its own line runs down, so the label touches its edge and
       cannot be read as a heading of the box beside it. The margin was sized for this
       pill, so it fits inside the drawing. */
    const mid = (a.y + a.h / 2 + b.y + b.h / 2) / 2;
    return { x: bounds.laneR ?? bounds.w - 10, y: mid };
  }
  if (route === 'loop-side-left') {
    const mid = (a.y + a.h / 2 + b.y + b.h / 2) / 2;
    return { x: bounds.laneL ?? 10, y: mid };
  }
  if (route === 'loop-bottom') {
    return { x: (a.x + a.w / 2 + b.x + b.w / 2) / 2, y: Math.max(a.y + a.h, b.y + b.h) + 24 };
  }
  /* Below the source: on its own vertical run, just under the box. */
  if (b.y >= a.y + a.h) {
    /* Centred *on* the run, as a loop's label is: a vertical line's label belongs on the
       line, and its pill hides the stroke behind the words. Sitting it beside the line put
       it 13-15px off the very edge it names (owner, 2026-11-17: labels must be "on their
       own lines"). */
    return { x: (a.x + a.w / 2 + b.x + b.w / 2) / 2, y: (a.y + a.h + b.y) / 2 };
  }
  if (b.y + b.h <= a.y) {
    return { x: (a.x + a.w / 2 + b.x + b.w / 2) / 2, y: b.y + b.h + (a.y - (b.y + b.h)) / 2 - 4 };
  }
  /* Same band: centred in the gap, above the line. */
  const gapStart = a.x + a.w;
  const gapEnd = b.x;
  const mid = (gapStart + gapEnd) / 2;
  return { x: labelW > gapEnd - gapStart ? gapStart + labelW / 2 : mid, y: a.y + a.h / 2 - 9 };
}


/* The midpoint of the longest segment of a path this engine builds. Paths here are only
   `M`, `H` and `V`, so this is exact and cannot disagree with what is painted. A label
   anchored here is on its own line and as far from the boxes as the line allows. */
function bestAnchor(
  d: string,
  labelW: number,
  boxes: { x: number; y: number; w: number; h: number }[],
  bounds: Bounds,
): { x: number; y: number; horiz: boolean } | null {
  /* A direct search for a position on the path where the label's own pill clears every
     box and stays inside the drawing. Reasoning about which segment is best kept
     producing anchors that were optimal by some score and still clipped or parked in a
     gap too narrow for the pill — VENDOR ROUTE lost its "VE" that way. This asks the
     only question that matters and samples the answer. */
  const pillAt = (cx: number, cy: number, horiz: boolean) => {
    const p = pillFor('x'.repeat(Math.round(labelW / adv(DETAIL))), cx, horiz ? cy - 8 : cy);
    return { x1: cx - p.w / 2, y1: p.y - 1, x2: cx + p.w / 2, y2: p.y - 1 + p.h };
  };
  const clears = (cx: number, cy: number, horiz: boolean) => {
    const r = pillAt(cx, cy, horiz);
    if (r.x1 < 1 || r.x2 > bounds.w - 1 || r.y1 < 1) return false;
    for (const b of boxes) {
      const dx = Math.max(b.x - r.x2, 0, r.x1 - (b.x + b.w));
      const dy = Math.max(b.y - r.y2, 0, r.y1 - (b.y + b.h));
      /* Overlap or within 4 units on either axis: a box clipping a label's first letters
         at a corner is hidden ink, and the pill reads as part of that box. */
      if (Math.hypot(dx, dy) < 5) return false;
      /* The reading test: inside a box's horizontal span one row gap away is a heading.
         It applies to a label lifted *above* a horizontal run, where the words could be
         mistaken for the heading of the box over them. A label centred *on* a vertical
         run is not that: the stroke passes through its pill, so it can only read as the
         line's own label, and the rule would push it off the line it belongs to. */
      if (!horiz) continue;
      const insideX = r.x1 >= b.x - 2 && r.x2 <= b.x + b.w + 2;
      if (insideX && ((b.y - r.y2 >= -4 && b.y - r.y2 < 46) || (r.y1 - (b.y + b.h) >= -4 && r.y1 - (b.y + b.h) < 46))) {
        return false;
      }
    }
    return true;
  };
  /* Sample the drawn path. `getTotalLength` is not available at build time, but the path
     is `M`/`H`/`V` only, so walk it and interpolate along each segment. */
  const tokens = d.match(/[MHV][^MHV]*/g) ?? [];
  let x = 0;
  let y = 0;
  const segs: { x1: number; y1: number; x2: number; y2: number; len: number }[] = [];
  for (const t of tokens) {
    const cmd = t[0];
    const nums = (t.slice(1).match(/-?[\d.]+/g) ?? []).map(Number);
    if (cmd === 'M' && nums.length >= 2) {
      x = nums[0];
      y = nums[1];
      continue;
    }
    let px = x;
    let py = y;
    const nx = cmd === 'H' ? (nums[0] ?? x) : x;
    const ny = cmd === 'V' ? (nums[0] ?? y) : y;
    segs.push({ x1: px, y1: py, x2: nx, y2: ny, len: Math.hypot(nx - px, ny - py) });
    x = nx;
    y = ny;
  }
  /* Prefer a horizontal run — the label reads best above a line — then a vertical one. */
  for (const horiz of [true, false]) {
    let fallback: { x: number; y: number; horiz: boolean; score: number } | null = null;
    for (const g of segs) {
      const isH = Math.abs(g.y2 - g.y1) < 0.5;
      if (isH !== horiz) continue;
      /* A run has to be long enough that the label relates to it. */
      if (horiz ? g.len < labelW * 0.5 : g.len < 18) continue;
      const steps = Math.max(2, Math.round(g.len / 6));
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const bx = g.x1 + (g.x2 - g.x1) * t;
        const by = g.y1 + (g.y2 - g.y1) * t;
        /* A label on a horizontal run sits above it; one on a vertical run sits beside
           it, which is the only room a narrow gap offers. Both are positions on or beside
           the line, which is what a label is. */
        const offsets = horiz ? [0] : [0, -labelW / 2 - 8, labelW / 2 + 8];
        for (const off of offsets) {
          const cx = bx + off;
          const cy = by;
          if (clears(cx, cy, horiz)) return { x: cx, y: cy, horiz };
        }
        const cx = bx;
        const cy = by;
        /* Remember the roomiest invalid spot, so a path with no good seat still gets its
           least-bad one rather than a far-away default. */
        const r = pillAt(cx, cy, horiz);
        let nearest = Infinity;
        for (const b of boxes) {
          const dx = Math.max(b.x - r.x2, 0, r.x1 - (b.x + b.w));
          const dy = Math.max(b.y - r.y2, 0, r.y1 - (b.y + b.h));
          nearest = Math.min(nearest, Math.hypot(dx, dy));
        }
        if (!fallback || nearest > fallback.score) fallback = { x: cx, y: cy, horiz, score: nearest };
      }
    }
    if (fallback) return { x: fallback.x, y: fallback.y, horiz: fallback.horiz };
  }
  return null;
}

/* Does a label's box overlap a node's box? */
function touchesBox(lab: { x: number; y: number }, pill: { w: number; h: number }, nodes: Placed[]): boolean {
  const l = { x1: lab.x - pill.w / 2, y1: lab.y - pill.h, x2: lab.x + pill.w / 2, y2: lab.y };
  return nodes.some((n) => {
    /* Real overlap: both axes must lose a whole pixel. A label in a gap sits a pixel from
       the boxes either side and hides no ink; the corner-clipping case that this was
       widened for is rejected inside bestAnchor, where the desktop search lives. */
    const ox = Math.min(l.x2, n.x + n.w) - Math.max(l.x1, n.x);
    const oy = Math.min(l.y2, n.y + n.h) - Math.max(l.y1, n.y);
    return ox >= 1 && oy >= 1;
  });
}

/* The pill behind an edge label, sized from the label's own advance, so a label
   reads over a line instead of being cut by it. */
/* Martian Mono's line box at DETAIL, measured rather than guessed: a 12-unit text rect is
   14.6 units tall with the baseline 12.0 from its top, so the words reach 12 units above
   the baseline and 2.6 below. The pill is sized from those numbers, which is the only way
   it can be guaranteed to hold the words it belongs to — the old box gave 11 above and 7
   below, so every label's top edge sat a pixel proud of its own pill. */
const LABEL_ASCENT = DETAIL;
const LABEL_DESCENT = Math.ceil(DETAIL * 0.22);
const PILL_PAD = 1;

const pillFor = (text: string, x: number, y: number) => {
  const w = text.length * adv(DETAIL) + 10;
  return {
    x: x - w / 2,
    y: y - LABEL_ASCENT - PILL_PAD,
    w,
    h: LABEL_ASCENT + LABEL_DESCENT + PILL_PAD * 2,
  };
};

export function Diagram({ spec }: { spec: DiagramSpec }) {
  const svg = useRef<SVGSVGElement>(null);
  const status = useRef<HTMLSpanElement>(null);
  const statusText = useRef<HTMLSpanElement>(null);
  const [playing, setPlaying] = useState(true);
  const [animated, setAnimated] = useState(false);
  const playingRef = useRef(true);
  const [speed, setSpeed] = useState(1);
  const speedRef = useRef(1);
  /* Reset lives inside the animation effect, which owns the clock and the trail. The
     control outside it asks for a reset through this ref. */
  const resetRef = useRef<() => void>(() => {});

  const desktop = layoutDesktop(spec);
  const vertical = layoutVertical(spec);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    const root = svg.current;
    /* The figure holds both layouts. Scoping the clock to either SVG means the other
       layout is never collected — which is exactly how the phone token stayed frozen. */
    const figure = root?.closest('.flow-panel') as HTMLElement | null;
    const canMeasure =
      typeof root?.querySelector<SVGPathElement>('[data-edge]')?.getTotalLength === 'function';
    if (!root || !figure || !canMeasure || reduceMotion()) return;
    setAnimated(true);

    /* Both layouts are in the DOM; a container query shows one. Each edge id exists
       twice, with its own length in its own viewBox, so every copy is kept and every
       copy is driven. Step timing comes from the first copy found (the desktop one),
       which is the feel the desktop layout already had. */
    /* Every edge is two paths: a base track that is always drawn, and a lit overlay
       whose visible length is the stretch the token has covered. The overlay is what
       the clock drives; the track never changes. */
    const lit = new Map<string, SVGPathElement[]>();
    const len = new Map<string, number>();
    const pathLen = new Map<SVGPathElement, number>();
    for (const el of figure.querySelectorAll<SVGPathElement>('[data-edge-lit]')) {
      const id = el.dataset.edgeLit as string;
      const l = el.getTotalLength();
      pathLen.set(el, l);
      lit.set(id, [...(lit.get(id) ?? []), el]);
      if (!len.has(id)) len.set(id, l);
    }
    /* Every token in the figure: one per layout. */
    const tokens = [...figure.querySelectorAll<SVGGElement>('.flow-token')];
    /* The token that belongs to a given path is the one in the same SVG. Two layouts
       hold two viewBoxes, so a coordinate from one is meaningless in the other. */
    const tokenFor = (p: SVGPathElement) =>
      (p.ownerSVGElement?.querySelector('.flow-token') as SVGGElement | null) ?? null;
    const nodes = new Map<string, Element[]>();
    figure.querySelectorAll('[data-node]').forEach((el) => {
      const id = el.getAttribute('data-node') as string;
      nodes.set(id, [...(nodes.get(id) ?? []), el]);
    });

    let run = 0;
    let step = 0;
    let elapsed = 0;
    let last = 0;
    let frame = 0;
    let visible = true;

    const setNode = (id: string, state: LampState) => {
      for (const el of nodes.get(id) ?? []) {
        el.classList.toggle('is-lit', state === 'lit');
        el.classList.toggle('is-done', state === 'done');
        el.classList.toggle('is-fail', state === 'fail');
      }
    };

    const setTone = (tone: Tone) => {
      for (const t of tokens) t.dataset.tone = tone;
      if (status.current) status.current.dataset.tone = tone;
    };

    /* The edges this run has finished crossing, oldest first. They stay lit; the newest
       keeps the glow and the rest step down so the direction the token came from is
       readable. A restart empties the trail, and `reset()` also clears the inline opacity
       that painted it. */
    let trail: string[] = [];

    /* Opacity the older trail edges step down through. Recorded here rather than in CSS
       because the count is per run, not per edge class. */
    const TRAIL_OPACITY = [1, 0.55, 0.38, 0.26, 0.18];

    const paintTrail = () => {
      for (const paths of lit.values()) {
        for (const p of paths) {
          p.classList.remove('is-trail', 'is-newest');
          p.style.opacity = '';
        }
      }
      trail.forEach((id, i) => {
        const rank = trail.length - 1 - i;
        for (const p of lit.get(id) ?? []) {
          p.classList.add('is-trail');
          if (rank === 0) p.classList.add('is-newest');
          p.style.opacity = `${TRAIL_OPACITY[Math.min(rank, TRAIL_OPACITY.length - 1)]}`;
        }
      });
    };

    const crossed = (edge: string) => {
      if (trail[trail.length - 1] === edge) return;
      const seen = trail.indexOf(edge);
      if (seen >= 0) trail.splice(seen, 1);
      trail.push(edge);
      paintTrail();
    };

    const reset = () => {
      trail = [];
      lit.forEach((paths) => {
        for (const p of paths) {
          const l = pathLen.get(p) ?? 0;
          p.style.strokeDasharray = `${l} ${l}`;
          p.style.strokeDashoffset = `${l}`;
          p.style.opacity = '';
          p.classList.remove('is-fail', 'is-trail', 'is-newest');
        }
      });
      for (const n of spec.nodes) setNode(n.id, 'off');
      setTone('run');
    };

    const place = (edge: string, t: number) => {
      const paths = lit.get(edge);
      if (!paths) return;
      for (const p of paths) {
        const l = pathLen.get(p) ?? 0;
        const at = p.getPointAtLength(l * t);
        const ahead = p.getPointAtLength(Math.min(l, l * t + 1));
        const behind = p.getPointAtLength(Math.max(0, l * t - 1));
        let angle = (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI;
        if (angle > 90) angle -= 180;
        if (angle < -90) angle += 180;
        tokenFor(p)?.setAttribute('transform', `translate(${at.x} ${at.y}) rotate(${angle})`);
        p.style.strokeDashoffset = `${l * (1 - t)}`;
      }
    };

    const enter = (s: Step) => {
      if (s.status && statusText.current) statusText.current.textContent = s.status;
      if (s.tone) setTone(s.tone);
      if (s.nodes) for (const [id, state] of Object.entries(s.nodes)) setNode(id, state);
      if (s.edge && s.failEdge) for (const p of lit.get(s.edge) ?? []) p.classList.add('is-fail');
    };

    const duration = (s: Step) => (s.edge ? (len.get(s.edge) ?? 0) / 0.34 : (s.dur ?? 0));

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = last ? Math.min(now - last, 64) : 0;
      last = now;
      if (!playingRef.current || !visible || document.hidden) return;
      const steps = spec.runs[run];
      elapsed += dt * speedRef.current;
      let s = steps[step];
      while (elapsed >= duration(s)) {
        if (s.edge) {
          place(s.edge, 1);
          /* Finished crossing: it joins the trail and stays lit for the rest of the run. */
          crossed(s.edge);
        }
        elapsed -= duration(s);
        step += 1;
        if (step >= steps.length) {
          run = (run + 1) % spec.runs.length;
          step = 0;
          reset();
        }
        s = spec.runs[run][step];
        enter(s);
      }
      if (s.edge) place(s.edge, elapsed / duration(s));
    };

    reset();
    enter(spec.runs[0][0]);
    const first = spec.runs[0][0];
    if (first.edge) place(first.edge, 0);

    /* Back to the first step of the first run, with an empty trail. The caller resumes
       playback; the clock only owns the position. */
    resetRef.current = () => {
      run = 0;
      step = 0;
      elapsed = 0;
      reset();
      enter(spec.runs[0][0]);
      if (spec.runs[0][0].edge) place(spec.runs[0][0].edge, 0);
    };

    const io =
      typeof IntersectionObserver === 'function'
        ? new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
          })
        : null;
    io?.observe(figure);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      io?.disconnect();
      resetRef.current = () => {};
    };
  }, [spec]);

  return (
    <figure
      className="flow-panel"
      data-diagram={spec.id}
      data-still={!animated ? 'true' : undefined}
      aria-labelledby={`${spec.id}-title`}
    >
      <div className="flow-head">
        <p className="flow-title" id={`${spec.id}-title`}>
          <Link className="inline-link" to={spec.href}>
            {spec.title}
          </Link>
          <span className="flow-note">{spec.note}</span>
        </p>
        <span className="flow-status mono" ref={status} data-tone="done" aria-hidden="true">
          <span className="flow-lamp is-lit" />
          <span ref={statusText}>{[...spec.runs[0]].reverse().find((s) => s.status)?.status ?? ''}</span>
        </span>
        {animated && (
          <>
            <button type="button" className="flow-pause" onClick={() => setPlaying(!playing)}>
              <PlayPauseIcon playing={playing} />
              {playing ? 'Pause' : 'Play'}
              <span className="visually-hidden"> the diagram</span>
            </button>
            {!playing && (
              <button
                type="button"
                className="flow-reset"
                onClick={() => {
                  resetRef.current();
                  setPlaying(true);
                }}
              >
                <ResetIcon />
                Reset
                <span className="visually-hidden"> the diagram</span>
              </button>
            )}
            <div className="flow-speed" role="group" aria-label="Diagram speed">
              {[0.75, 1, 1.5].map((v) => (
                <button
                  key={v}
                  type="button"
                  className="flow-speed-option"
                  aria-pressed={speed === v}
                  onClick={() => setSpeed(v)}
                >
                  {v}x
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="flow-window">
        {/* Two SVGs, not one with two groups: each layout has its own viewBox, so
            the vertical graph is drawn at its own proportions rather than being
            squeezed into the desktop canvas. A container query shows one. */}
        <div className="flow-h">
          <svg
            ref={svg}
            className="flow-svg"
            viewBox={`0 0 ${desktop.w} ${desktop.h}`}
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
            focusable="false"
          >
            <Marker id={`arrow-${spec.id}`} />
            <Graph spec={spec} placed={desktop.nodes} bounds={desktop} animated={animated} marker={`arrow-${spec.id}`} />
            <Token at={startOf(spec, desktop.nodes)} />
          </svg>
        </div>
        <div className="flow-v">
          <svg
            className="flow-svg"
            viewBox={`0 0 ${vertical.w} ${vertical.h}`}
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
            focusable="false"
          >
            <Marker id={`arrow-${spec.id}-v`} />
            <Graph
              spec={spec}
              placed={vertical.nodes}
              bounds={vertical}
              animated={animated}
              marker={`arrow-${spec.id}-v`}
              vertical
              headings={vertical.headings}
            />
            <Token at={startOf(spec, vertical.nodes)} />
          </svg>
        </div>
      </div>
      <figcaption className="visually-hidden">{spec.caption}</figcaption>
    </figure>
  );
}

/* Where the token rests before a run: on the box the first run starts from, so the
   still picture has no dot floating in a corner. */
function startOf(spec: DiagramSpec, nodes: Placed[]) {
  const first = spec.runs[0].find((s) => s.edge);
  const edge = spec.edges.find((e) => e.id === first?.edge);
  const from = nodes.find((n) => n.id === edge?.from) ?? nodes[0];
  /* On the box's leading edge, not its centre: the centre is where the box's own name
     and detail are, and a dot there covers a letter. */
  return from ? { x: from.x + 11, y: from.y + from.h / 2 } : { x: 0, y: 0 };
}

function Token({ at, ref }: { at: { x: number; y: number }; ref?: React.Ref<SVGGElement> }) {
  return (
    <g className="flow-token" ref={ref} data-tone="done" transform={`translate(${at.x} ${at.y})`}>
      <circle r="5.5" />
    </g>
  );
}

/* One arrowhead per SVG, inherited by every edge in it. */
function Marker({ id }: { id: string }) {
  return (
    <defs>
      <marker id={id} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
        <path d="M0 0 L8 4 L0 8 z" className="flow-arrowhead" />
      </marker>
    </defs>
  );
}

function Graph({
  spec,
  placed,
  bounds,
  animated,
  marker,
  vertical = false,
  headings = [],
}: {
  spec: DiagramSpec;
  placed: Placed[];
  bounds: Bounds;
  animated: boolean;
  marker: string;
  vertical?: boolean;
  headings?: { x: number; y: number; text: string; cluster: string }[];
}) {
  const nodes = byId(placed);
  /* On the vertical layout a cluster's heading stands in for the edge that entered it,
     and a `stub` edge is text, not a line. Both are drawn rather than crossed. */
  const headingFor = new Map((spec.clusters ?? []).map((c) => [c.nodes[0], c.id]));
  const clusterOf = new Map<string, string>();
  for (const c of spec.clusters ?? []) for (const id of c.nodes) clusterOf.set(id, c.id);
  return (
    <>
      {(() => {
        /* Labels are placed once, in edge order, and remembered so a second label
           on the same band can be pushed clear of the first. */
        const placedLabels: { x: number; y: number; w: number; h: number }[] = [];
        /* Every edge's path, worked out before any label is placed. A path depends only on
           its endpoints, its route and the bounds — not on where labels go — so this is
           the same string the render below will use, and the resolver can ask what a
           candidate position would paint over. A pill lying across another edge's stroke
           reads as that edge's label: that is how STAGE FAILS ended up touching the solid
           `log` run while belonging to the dashed `fails` one. */
        const pathOf = new Map<string, string>();
        /* The edge that enters a cluster is not drawn from its source box: that box may
           sit far up the spine, and a line from it would cross every group in between.
           It is drawn as a short arrow in the gap under the heading instead, so the
           group keeps its heading *and* the route that reaches it keeps its label
           (F3-1). The synthetic source is a point on the target's own centre line. */
        const entrySource = (b: Placed): Placed => ({ ...b, x: b.x + b.w / 2, y: b.y - ENTRY + 8, w: 0, h: 0 });
        const sourceOf = (e: (typeof spec.edges)[number], a: Placed, b: Placed) =>
          vertical && headingFor.has(e.to) ? entrySource(b) : a;
        /* How many edges have already left each box toward each side. Two edges out of one
           box in the same direction used to be drawn on the same run, which leaves their
           labels nowhere to belong (see `edgePath`'s `sibling`). */
        const departure = new Map<string, number>();
        for (const e of spec.edges) {
          const a0 = nodes.get(e.from);
          const b0 = nodes.get(e.to);
          if (!a0 || !b0) continue;
          if (vertical && e.stub) continue;
          const from0 = sourceOf(e, a0, b0);
          const r0: Route = vertical
            ? from0.state || b0.state
              ? 'right'
              : from0.vat.track === b0.vat.track
                ? e.route === 'loop-side'
                  ? 'loop-side'
                  : 'down'
                : 'branch'
            : e.route;
          /* Stagger only the departures that actually share a run: the same source box,
             leaving toward the same side. The route is deliberately not part of the key —
             a straight drop and a drop-and-turn toward one side share their departure leg
             for as long as both are vertical, which is what put `authorise` and `refuse`
             on the same 10-unit leg out of Role check. */
          const key = `${from0 === a0 ? e.from : `entry:${e.to}`}:${b0.x > from0.x ? 'r' : 'l'}`;
          const sibling = departure.get(key) ?? 0;
          departure.set(key, sibling + 1);
          pathOf.set(e.id, edgePath(from0, b0, r0, bounds, vertical, sibling));
        }
        /* The painted centre lines, as run segments. Paths here are only M/H/V, so this is
           exact and cheap to test a rectangle against. */
        const strokes = [...pathOf.entries()].flatMap(([id, d]) => {
          const segs: { id: string; x1: number; y1: number; x2: number; y2: number }[] = [];
          const nums = d.match(/-?[\d.]+/g)?.map(Number) ?? [];
          const cmds = d.match(/[MHV]/g) ?? [];
          let cx = 0;
          let cy = 0;
          let i = 0;
          for (const c of cmds) {
            if (c === 'M') {
              cx = nums[i++];
              cy = nums[i++];
            } else if (c === 'H') {
              const nx = nums[i++];
              segs.push({ id, x1: cx, y1: cy, x2: nx, y2: cy });
              cx = nx;
            } else {
              const ny = nums[i++];
              segs.push({ id, x1: cx, y1: cy, x2: cx, y2: ny });
              cy = ny;
            }
          }
          return segs;
        });
        /* Distance from a pill to one edge's nearest run, in viewBox units. Every segment
           here is axis-aligned, so this is exact rather than sampled. */
        const distToEdge = (id: string, r: { x: number; y: number; w: number; h: number }) => {
          let best = Infinity;
          for (const g of strokes) {
            if (g.id !== id) continue;
            const horizontal = Math.abs(g.y2 - g.y1) < 0.01;
            const dx = horizontal
              ? Math.max(Math.min(g.x1, g.x2) - (r.x + r.w), r.x - Math.max(g.x1, g.x2), 0)
              : Math.max(g.x1 - (r.x + r.w), r.x - g.x1, 0);
            const dy = horizontal
              ? Math.max(g.y1 - (r.y + r.h), r.y - g.y1, 0)
              : Math.max(Math.min(g.y1, g.y2) - (r.y + r.h), r.y - Math.max(g.y1, g.y2), 0);
            const dist = Math.hypot(dx, dy);
            if (dist < best) best = dist;
          }
          return best;
        };
        /* Which edge does this pill belong to? A label reads as the line it is nearest, so a
           candidate seat is only legal if this edge owns the pill outright: nearer by
           `ATTRIBUTION` than any other edge's ink. This is what stops a label sitting in the
           corridor between two parallel runs and belonging to neither — RannaGhor's `authorise`
           and `refuse` share a long run out of Role check, and VENDOR ROUTE had parked at
           1.4px from both, so the refused branch lost its label and the allowed line carried
           two. Where two edges share a run, the distance to each is equal there, so a shared
           stretch can never satisfy this: the label is pushed onto a part of its own edge that
           no other edge covers. That is the rule, and it applies to every label equally — no
           label gets a seat of its own. */
        const ATTRIBUTION = 6;
        const isOwned = (own: string, r: { x: number; y: number; w: number; h: number }) => {
          const mine = distToEdge(own, r);
          if (!Number.isFinite(mine)) return true;
          let other = Infinity;
          for (const id of pathOf.keys()) {
            if (id === own) continue;
            const d = distToEdge(id, r);
            if (d < other) other = d;
          }
          return mine + ATTRIBUTION <= other;
        };
        /* Does this pill lie across some other edge's line? Axis-aligned segments, so a
           rectangle-versus-segment test is just a range overlap with a pixel of grace. */
        const coversOtherStroke = (own: string, r: { x: number; y: number; w: number; h: number }) => {
          const pad = 1;
          for (const g of strokes) {
            if (g.id === own) continue;
            const minX = Math.min(g.x1, g.x2);
            const maxX = Math.max(g.x1, g.x2);
            const minY = Math.min(g.y1, g.y2);
            const maxY = Math.max(g.y1, g.y2);
            if (maxX < r.x + pad || minX > r.x + r.w - pad) continue;
            if (maxY < r.y + pad || minY > r.y + r.h - pad) continue;
            return g.id;
          }
          return null;
        };
        return spec.edges.map((e) => {
        const a = nodes.get(e.from);
        const b = nodes.get(e.to);
        if (!a || !b) return null;
        /* The heading above a cluster names the group, but it does not stand in for the
           edge that enters it: that edge carries the route or the failure that reaches
           the group, and its label is the thing the diagram is saying (F3-1). So the
           edge is drawn, as a short arrow under the heading into the group's first box.
           A stub is still text rather than a line. */
        if (vertical && e.stub) return null;
        /* The vertical layout goes down the spine or across to an indented branch;
           a horizontal route would cut through the column. */
        const route: Route = vertical
          ? a.state || b.state
            ? 'right'
            : a.vat.track === b.vat.track
              ? e.route === 'loop-side'
                ? 'loop-side'
                : 'down'
              : 'branch'
          : e.route;
        const d = pathOf.get(e.id) ?? edgePath(sourceOf(e, a, b), b, route, bounds, vertical);
        /* One value decides where the label is, and both the words and the pill are
           rendered from it. The previous version measured a pill, moved the text with two
           nudges and then drew the pill from the stale rectangle: Ticket-Pipeline's STAGE
           FAILS ended up 18px below its own words, painting over EACH STEP instead. Three
           passes in a row moved this defect to another label because each one added a
           nudge; there is now nowhere for the two to disagree. */
        const label = e.label;
        /* An edge with no label draws nothing but its line: the pill and the text are
           both derived from `pos`, so there is no second position to keep in step. */
        if (!label) {
          return (
            <g key={e.id}>
              <path
                className={`flow-edge${e.branch ? ' is-branch' : ''}`}
                d={d}
                data-edge={e.id}
                style={!animated && !spec.still.edges.includes(e.id) ? { opacity: 0.45 } : undefined}
                markerEnd={`url(#${marker})`}
              />
              <path className="flow-edge-lit" d={d} data-edge-lit={e.id} />
            </g>
          );
        }
        const labelW = label.length * adv(DETAIL);
        /* The vertical layout's seating is closed and its gaps are ~24 units wide;
           this search is for the desktop graph, where the regression was. */
        const anchor = vertical ? null : bestAnchor(d, labelW, placed, bounds);
        const pos = anchor
          ? /* On the run itself: the words sit on their own line and the pill hides the
               stroke behind them. They used to be lifted 8 units clear, which left every
               horizontal label 5.4 units off its edge — near enough to look attached and
               far enough to miss it, which is the "labels not on their own lines" the
               owner reported. */
            { x: anchor.x, y: anchor.y }
          : labelPos(sourceOf(e, a, b), b, route, bounds, labelW);
        /* One resolver decides where the label ends up, and the pill and the words are
           both rendered from what it returns. The two used to be separate: a pill was
           measured, two nudges moved the text, and the pill was drawn from the stale
           rectangle — STAGE FAILS sat 18 units below its own words, painting over EACH
           STEP. Adding a third nudge (which is what the last two passes did) only moves
           that defect to another label, so there are no nudges left to add: candidates
           are tried in order of increasing displacement and the first one that satisfies
           every constraint is taken.

           Constraints, all measured on the pill this position would actually draw:
           inside the drawing, clear of every node box, clear of every label already
           placed on its band. */
        const holds = (x: number, y: number) => {
          const r = pillFor(label, x, y);
          if (r.x < 1 || r.x + r.w > bounds.w - 1 || r.y < 1 || r.y + r.h > bounds.h - 1) return false;
          if (touchesBox({ x, y }, r, placed)) return false;
          /* A pill over another edge's line reads as that line's label, so a position
             that covers one is not a legal position for this label. */
          if (coversOtherStroke(e.id, r)) return false;
          /* And it has to be read as this edge's label, not merely avoiding the others. */
          if (!isOwned(e.id, r)) return false;
          /* Four units of horizontal air, and a full label height vertically: two pills a
             hairline apart read as one block of text, which is what P2b-3 was about. */
          return !placedLabels.some(
            (o) => r.x < o.x + o.w + 4 && o.x < r.x + r.w + 4 && r.y < o.y + o.h + 8 && o.y < r.y + r.h + 8,
          );
        };
        if (!holds(pos.x, pos.y)) {
          /* Search outwards in both axes: a label that has to move should move as
             little as possible, and preferring the shortest displacement keeps it near
             its own line — which is what makes it read as that line's label. */
          const radii = [4, 8, 12, 16, 20, 26, 32, 40, 48, 58, 70, 84, 100, 120, 145, 175];
          let found = false;
          for (const r of radii) {
            for (const [dx, dy] of [
              [0, -r], [0, r], [-r, 0], [r, 0],
              [-r, -r], [r, -r], [-r, r], [r, r],
              [0, -r * 1.8], [0, r * 1.8],
            ]) {
              if (holds(pos.x + dx, pos.y + dy)) {
                pos.x += dx;
                pos.y += dy;
                found = true;
                break;
              }
            }
            if (found) break;
          }
          if (!found) {
            /* Nothing near the preferred seat is legal, so the label walks its own edge.
               A label belongs to a line; if the only legal seats are along that line, the
               right answer is the nearest one on it, not a displacement ring far from
               everything. RannaGhor's VENDOR ROUTE is the case: `authorise` and `refuse`
               leave Role check together and share a long run, so the corridor between them
               can never satisfy the attribution rule — its own unshared stretch is down the
               left margin, 850 units away, which no ring radius reaches. Candidates are
               sampled along each of this edge's own runs and tried nearest-first. */
            const own = strokes.filter((g) => g.id === e.id);
            const cands: { x: number; y: number; dist: number }[] = [];
            for (const g of own) {
              const horizontal = Math.abs(g.y2 - g.y1) < 0.01;
              const len = Math.hypot(g.x2 - g.x1, g.y2 - g.y1);
              const steps = Math.max(2, Math.ceil(len / 6));
              for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const px = g.x1 + (g.x2 - g.x1) * t;
                const py = g.y1 + (g.y2 - g.y1) * t;
                /* Above a horizontal run, beside a vertical one: the line stays visible. */
                const cx = horizontal ? px : px;
                const cy = horizontal ? py - 8 : py;
                cands.push({ x: cx, y: cy, dist: Math.hypot(cx - pos.x, cy - pos.y) });
              }
            }
            cands.sort((p1, p2) => p1.dist - p2.dist);
            for (const c of cands) {
              if (holds(c.x, c.y)) {
                pos.x = c.x;
                pos.y = c.y;
                found = true;
                break;
              }
            }
          }
        }
        placedLabels.push(pillFor(label, pos.x, pos.y));
        return (
          <g key={e.id}>
            <path
              className={`flow-edge${e.branch ? ' is-branch' : ''}`}
              d={d}
              data-edge={e.id}
              /* The still picture is the whole chart: every edge is drawn, so a
                 branch box never looks unattached. Edges the first run lights are
                 at full strength; the rest sit muted. */
              style={!animated && !spec.still.edges.includes(e.id) ? { opacity: 0.45 } : undefined}
              markerEnd={`url(#${marker})`}
            />
            <path className="flow-edge-lit" d={d} data-edge-lit={e.id} />
            {(() => {
              /* The pill and the words are rendered from the same `pos`. This is the
                 whole fix: they cannot disagree, because neither is stored. */
              const pill = pillFor(label, pos.x, pos.y);
              return (
                <>
                  <rect
                    className="flow-edge-pill"
                    x={pill.x}
                    y={pill.y}
                    width={pill.w}
                    height={pill.h}
                    rx="3"
                  />
                  <text
                    className="flow-edge-label"
                    data-edge-label={e.id}
                    data-edge-from={e.from}
                    data-edge-to={e.to}
                    data-edge-loop={e.route.startsWith('loop') ? 'true' : undefined}
                    x={pos.x}
                    y={pos.y}
                    textAnchor="middle"
                  >
                    {label}
                  </text>
                </>
              );
            })()}
          </g>
        );
        });
      })()}
      {vertical && headings.map((h) => (
        <text
          key={h.cluster}
          className="flow-cluster-heading"
          data-cluster={h.cluster}
          x={h.x}
          y={h.y}
          textAnchor="start"
        >
          {h.text}
        </text>
      ))}
      {vertical && spec.edges.filter((e) => e.stub).map((e) => {
        const a = nodes.get(e.from);
        return a ? (
          <text
            key={`stub-${e.id}`}
            className="flow-stub"
            data-stub={e.id}
            x={a.x + a.w / 2}
            y={a.y + a.h + 17}
            textAnchor="middle"
          >
            {wrapToWidth(e.stub ?? '', DETAIL, a.w - 16).map((line, i) => (
              <tspan key={i} x={a.x + a.w / 2} dy={i === 0 ? 0 : 14}>
                {line}
              </tspan>
            ))}
          </text>
        ) : null;
      })}
      {placed.map((n) => (
        <NodeBox
          key={n.id}
          node={n}
          still={!animated ? spec.still.nodes[n.id] : undefined}
          vertical={vertical}
        />
      ))}
    </>
  );
}

function NodeBox({ node, still, vertical }: { node: Placed; still?: LampState; vertical: boolean }) {
  const inner = node.w - PAD * 2;
  const name = wrapToWidth(node.name, NAME, inner);
  const detail = node.detail ? wrapToWidth(node.detail, DETAIL, inner) : [];
  const block = name.length * LINE + detail.length * LINE;
  /* The first baseline sits one LINE below the block's top edge, so the ascender
     is inside the box and the detail lines stack under it without touching. */
  const top = node.y + (node.h - block) / 2 + LINE - 3;
  return (
    <g
      /* The still picture's state comes from the spec, at render time, so the
         pre-render and reduced motion show a finished run rather than an unlit
         graph. Once the animation runs it takes these over. */
      className={`flow-node${node.state ? ' is-state' : ''}${still === 'done' ? ' is-done' : ''}${
        still === 'fail' ? ' is-fail' : ''
      }`}
      data-node={node.id}
      data-vertical={vertical ? 'true' : undefined}
    >
      <rect x={node.x} y={node.y} width={node.w} height={node.h} rx={node.state ? node.h / 2 : 5} />
      {name.map((line, i) => (
        <text key={i} className="flow-node-name" x={node.x + node.w / 2} y={top + i * LINE} textAnchor="middle">
          {line}
        </text>
      ))}
      {detail.map((line, i) => (
        <text
          key={i}
          className="flow-node-detail"
          x={node.x + node.w / 2}
          y={top + name.length * LINE + i * LINE}
          textAnchor="middle"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function PlayPauseIcon({ playing }: { playing: boolean }) {
  return (
    <svg className="icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      {playing ? (
        <path d="M5.5 3.5v9M10.5 3.5v9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      ) : (
        <path d="M5 3.2v9.6L12.5 8z" fill="currentColor" />
      )}
    </svg>
  );
}

/* Reset: an arrow turning back on itself, in the same one-stroke style as the
   play/pause icon. */
function ResetIcon() {
  return (
    <svg className="icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d="M3.2 8a4.8 4.8 0 1 0 1.5-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M2.6 3.2v3.2h3.2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
