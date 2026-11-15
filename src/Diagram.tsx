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
const PAD = 13;
const LINE = 17;

const reduceMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

type Placed = Node & { x: number; y: number; w: number; h: number };
type Bounds = { w: number; h: number };

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
const GAP_Y = 38;

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
  const sideMargin = 16;
  const colX: number[] = [];
  let x = sideMargin;
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
  /* Room under the last row for a loop edge and its label, and the same gutter on the
     right as on the left. */
  return { nodes, w: x - gap + sideMargin, h: y - GAP_Y + 76 };
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
     one from the next; no line crosses either. */
  for (const cluster of spec.clusters ?? []) {
    y += 16;
    headings.push({ x: MARGIN, y: y + HEADING, text: cluster.heading, cluster: cluster.id });
    y += HEADING + 16;
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
    const pillW = (W - MARGIN * 2 - 8) / 2;
    states.forEach((node, i) => {
      nodes.push({
        ...node,
        x: MARGIN + (i % 2) * (pillW + 8),
        y: y + Math.floor(i / 2) * 42,
        w: pillW,
        h: 30,
      });
    });
    y += Math.ceil(states.length / 2) * 42;
  }

  return { nodes, w: W, h: y + 26, headings, labels };
}

const byId = (nodes: Placed[]) => new Map(nodes.map((n) => [n.id, n]));

/* An edge's path. Every route goes through a gap: a loop leaves the box sideways,
   runs down the reserved bottom margin, and comes back up, so it crosses no box. */
function edgePath(a: Placed, b: Placed, route: Route, bounds: Bounds, vertical = false): string {
  if (vertical) {
    const acx = a.x + a.w / 2;
    const bcx = b.x + b.w / 2;
    /* Every vertical-layout box is one column wide, so an edge is a straight drop into
       the next box down, or a link along the state rail. Nothing here can cross a box:
       an edge only ever spans the single gap between two neighbours. */
    if (b.y >= a.y + a.h) {
      if (Math.abs(acx - bcx) < 1) return `M${acx} ${a.y + a.h} V${b.y - 2}`;
      const mid = (a.y + a.h + b.y) / 2;
      return `M${acx} ${a.y + a.h} V${mid} H${bcx} V${b.y - 2}`;
    }
    /* Along the rail: side to side, or down one row. */
    if (Math.abs(a.y - b.y) < 1) return `M${a.x + a.w} ${a.y + a.h / 2} H${b.x - 2}`;
    const mid = (a.y + a.h + b.y) / 2;
    return `M${acx} ${a.y + a.h} V${mid} H${bcx} V${b.y - 2}`;
  }
  const acx = a.x + a.w / 2;
  const bcx = b.x + b.w / 2;
  const acy = a.y + a.h / 2;
  const bcy = b.y + b.h / 2;
  /* Out to the outer margin, up to the target's own height, and in from the side:
     the margin is reserved and no box reaches into it. */
  if (route === 'loop-side') {
    const lane = bounds.w - 10;
    if (bcy < acy) return `M${a.x + a.w} ${acy} H${lane} V${bcy} H${b.x + b.w + 2}`;
    return `M${a.x + a.w} ${acy} H${lane} V${bcy} H${b.x + b.w + 2}`;
  }
  if (route === 'loop-side-left') {
    /* The left margin, for a branch that leaves a box whose neighbours are below it. */
    const lane = 8;
    return `M${a.x} ${acy} H${lane} V${bcy} H${b.x - 2}`;
  }
  if (route === 'loop-bottom') {
    const lane = Math.min(bounds.h - 10, Math.max(a.y + a.h, b.y + b.h) + 30);
    return `M${acx} ${a.y + a.h} V${lane} H${bcx} V${b.y + b.h + 2}`;
  }

  /* Below the source: down through the gap under it, then across to the target. */
  if (b.y >= a.y + a.h) {
    if (Math.abs(acx - bcx) < 1) return `M${acx} ${a.y + a.h} V${b.y - 2}`;
    /* To a box that is not directly below, the gap under the source is crossed at
       the outer edge of the two, so the horizontal run misses anything between. */
    const right = b.x > a.x;
    const lane = right ? Math.max(a.x + a.w, b.x + b.w) + 10 : Math.min(a.x, b.x) - 10;
    return `M${acx} ${a.y + a.h} V${a.y + a.h + 12} H${lane} V${b.y - 12} H${b.x + b.w / 2} V${b.y - 2}`;
  }
  /* Above the source: up the gap and in from the top. */
  if (b.y + b.h <= a.y) {
    const above = b.y + b.h + (a.y - (b.y + b.h)) / 2;
    if (Math.abs(acx - bcx) < 1) return `M${acx} ${a.y} V${b.y + b.h + 2}`;
    return `M${acx} ${a.y} V${above} H${bcx} V${b.y + b.h + 2}`;
  }
  /* Same band: side to side through the gap between them. */
  if (b.x >= a.x + a.w) return `M${a.x + a.w} ${acy} H${b.x - 2}`;
  if (a.x >= b.x + b.w) return `M${a.x} ${acy} H${b.x + b.w + 2}`;
  /* Overlapping bands: go round the outside rather than through the box. */
  const lane = b.x >= a.x ? b.x + b.w + 12 : b.x - 12;
  return `M${a.x + a.w} ${acy} H${lane} V${bcy} H${b.x + b.w + 2}`;
}

/* A label's anchor: the middle of the gap its edge crosses. */
function labelPos(a: Placed, b: Placed, route: Route, bounds: Bounds, labelW: number): { x: number; y: number } {
  if (route === 'loop-side') {
    const mid = (a.y + a.h / 2 + b.y + b.h / 2) / 2;
    return { x: bounds.w - 10 - labelW / 2, y: mid };
  }
  if (route === 'loop-side-left') {
    const mid = (a.y + a.h / 2 + b.y + b.h / 2) / 2;
    return { x: 10 + labelW / 2, y: mid };
  }
  if (route === 'loop-bottom') {
    return { x: (a.x + a.w / 2 + b.x + b.w / 2) / 2, y: Math.max(a.y + a.h, b.y + b.h) + 24 };
  }
  /* Below the source: on its own vertical run, just under the box. */
  if (b.y >= a.y + a.h) {
    if (Math.abs(a.x + a.w / 2 - (b.x + b.w / 2)) < 1) {
      return { x: a.x + a.w / 2 + 6 + labelW / 2, y: (a.y + a.h + b.y) / 2 };
    }
    return { x: b.x + b.w / 2 + 5 + labelW / 2, y: b.y - 7 };
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

/* Does a label's box overlap a node's box? */
function touchesBox(lab: { x: number; y: number }, pill: { w: number; h: number }, nodes: Placed[]): boolean {
  return nodes.some(
    (n) =>
      lab.x - pill.w / 2 < n.x + n.w - 2 &&
      lab.x + pill.w / 2 > n.x + 2 &&
      lab.y - pill.h < n.y + n.h - 2 &&
      lab.y > n.y + 2,
  );
}

/* The pill behind an edge label, sized from the label's own advance, so a label
   reads over a line instead of being cut by it. */
const pillFor = (text: string, x: number, y: number) => {
  const w = text.length * adv(DETAIL) + 10;
  return { x: x - w / 2, y: y - DETAIL + 1, w, h: DETAIL + 6 };
};

export function Diagram({ spec }: { spec: DiagramSpec }) {
  const svg = useRef<SVGSVGElement>(null);
  const status = useRef<HTMLSpanElement>(null);
  const statusText = useRef<HTMLSpanElement>(null);
  const [playing, setPlaying] = useState(true);
  const [animated, setAnimated] = useState(false);
  const playingRef = useRef(true);

  const desktop = layoutDesktop(spec);
  const vertical = layoutVertical(spec);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

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
    const lit = new Map<string, SVGPathElement[]>();
    const len = new Map<string, number>();
    const pathLen = new Map<SVGPathElement, number>();
    for (const el of figure.querySelectorAll<SVGPathElement>('[data-edge]')) {
      const id = el.dataset.edge as string;
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

    const reset = () => {
      lit.forEach((paths) => {
        for (const p of paths) {
          const l = pathLen.get(p) ?? 0;
          p.style.strokeDasharray = `${l} ${l}`;
          p.style.strokeDashoffset = `${l}`;
          p.classList.remove('is-fail');
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
      elapsed += dt;
      let s = steps[step];
      while (elapsed >= duration(s)) {
        if (s.edge) place(s.edge, 1);
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
          <button type="button" className="flow-pause" onClick={() => setPlaying(!playing)}>
            <PlayPauseIcon playing={playing} />
            {playing ? 'Pause' : 'Play'}
            <span className="visually-hidden"> the diagram</span>
          </button>
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
        return spec.edges.map((e) => {
        const a = nodes.get(e.from);
        const b = nodes.get(e.to);
        if (!a || !b) return null;
        /* The heading above a cluster stands in for the edge that entered it, and a
           stub edge is drawn as text on its source. Drawing either as a line would put
           one across a gap the design deliberately leaves empty. */
        if (vertical && headingFor.has(e.to)) return null;
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
        const d = edgePath(a, b, route, bounds, vertical);
        const lab = labelPos(a, b, route, bounds, (e.label?.length ?? 0) * adv(11));
        const pill = pillFor(e.label ?? '', lab.x, lab.y);
        /* A label placed by geometry can still land on a box, so the final position is
           checked: text over text is the one thing a label may never do. */
        if (e.label && touchesBox(lab, pill, placed)) {
          for (let step = 10; step <= 120; step += 10) {
            if (!touchesBox({ x: lab.x, y: lab.y - step }, pill, placed)) {
              lab.y -= step;
              break;
            }
            if (!touchesBox({ x: lab.x, y: lab.y + step }, pill, placed)) {
              lab.y += step;
              break;
            }
          }
        }
        /* Nudge this label clear of any already placed on the same band. */
        const clash = placedLabels.find(
          (o) =>
            lab.x - pill.w / 2 < o.x + o.w / 2 + 4 &&
            o.x - o.w / 2 < lab.x + pill.w / 2 + 4 &&
            lab.y - 12 < o.y + o.h &&
            o.y - 12 < lab.y + 12,
        );
        if (clash) lab.y = clash.y + 20;
        if (e.label) placedLabels.push({ x: lab.x, y: lab.y, w: pill.w, h: pill.h });
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
            {e.label && (
              <>
                <rect className="flow-edge-pill" x={pill.x} y={pill.y} width={pill.w} height={pill.h} rx="3" />
                <text className="flow-edge-label" data-edge-label={e.id} x={lab.x} y={lab.y} textAnchor="middle">
                  {e.label}
                </text>
              </>
            )}
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
