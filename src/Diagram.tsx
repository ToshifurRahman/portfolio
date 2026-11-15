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

export type Edge = {
  id: string;
  from: string;
  to: string;
  label?: string;
  /* A branch is dashed: taken only when something fails or is refused. */
  branch?: boolean;
  route: Route;
};

export type DiagramSpec = {
  id: string;
  title: string;
  href: string;
  note: string;
  nodes: Node[];
  edges: Edge[];
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
const DETAIL = 11;
const PAD = 13;
const LINE = 15;

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
  return nameLines * LINE + detailLines * (LINE - 2) + PAD * 2;
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
  const labels = spec.edges.filter((e) => e.label && e.route === 'right').map((e) => (e.label as string).length);
  const widestLabel = labels.length ? Math.max(...labels) : 0;
  const gap = Math.max(GAP_X, Math.ceil(widestLabel * adv(11)) + 14);
  const colX: number[] = [];
  let x = 16;
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
  /* Room under the last row for a loop edge and its label. */
  return { nodes, w: x - gap + 16, h: y - GAP_Y + 76 };
}

/* The vertical layout: the spine in track 0, branches on a track of their own
 * beside it, and the states on a rail at the end. The two tracks are narrower than
 * a single full-width box, because a branch has to be visibly beside the spine —
 * reading it as the next step is exactly the misreading the review found. */
function layoutVertical(spec: DiagramSpec) {
  const steps = spec.nodes.filter((n) => !n.state);
  const states = spec.nodes.filter((n) => n.state);
  /* The viewBox is the phone's own width: at 390 the panel is 390 and the graph is
     drawn at 1:1, so a viewBox unit is a pixel and the 12-unit labels stay 12px. */
  const W = 358;
  const spineW = 196;
  const branchW = 146;
  const trackX = [6, 6 + spineW + 6];

  const rows = [...new Set(steps.map((n) => n.vat.row))].sort((a, b) => a - b);
  const nodes: Placed[] = [];
  let y = 16;
  for (const row of rows) {
    const inRow = steps.filter((n) => n.vat.row === row);
    const h = Math.max(
      44,
      ...inRow.map((n) => heightOf(n, (n.vat.track ? branchW : spineW) - PAD * 2)),
    );
    for (const node of inRow) {
      const w = node.vat.track ? branchW : spineW;
      nodes.push({ ...node, x: trackX[Math.min(node.vat.track, 1)], y, w, h });
    }
    y += h + 30;
  }

  if (states.length) {
    y += 12;
    const pillW = 168;
    states.forEach((node, i) => {
      nodes.push({ ...node, x: 8 + (i % 2) * (pillW + 8), y: y + Math.floor(i / 2) * 32, w: pillW, h: 28 });
    });
    y += Math.ceil(states.length / 2) * 32;
  }

  return { nodes, w: W, h: y + 40 };
}

const byId = (nodes: Placed[]) => new Map(nodes.map((n) => [n.id, n]));

/* An edge's path. Every route goes through a gap: a loop leaves the box sideways,
   runs down the reserved bottom margin, and comes back up, so it crosses no box. */
function edgePath(a: Placed, b: Placed, route: Route, bounds: Bounds): string {
  const ac = { x: a.x + a.w / 2, y: a.y + a.h / 2 };
  const bc = { x: b.x + b.w / 2, y: b.y + b.h / 2 };

  switch (route) {
    case 'right':
      return `M${a.x + a.w} ${ac.y} H${b.x - 2}`;
    case 'down':
      return `M${ac.x} ${a.y + a.h} V${b.y - 2}`;
    case 'down-right': {
      /* Out of the right side, past the row's boxes, then down and in from the
         side. Used when the target is lower and off to the side. */
      const out = Math.max(a.x + a.w, b.x + b.w) + 16;
      return `M${a.x + a.w} ${ac.y} H${out} V${bc.y} H${b.x + b.w + 2}`;
    }
    case 'down-left': {
      const out = Math.min(a.x, b.x) - 16;
      return `M${a.x} ${ac.y} H${out} V${bc.y} H${b.x - 2}`;
    }
    case 'loop-bottom': {
      /* Down the reserved margin below every row and back up into the target's
         bottom, so the loop is outside the graph rather than through it. */
      const lane = bounds.h - 30;
      return `M${ac.x} ${a.y + a.h} V${lane} H${bc.x} V${b.y + b.h + 2}`;
    }
    case 'branch': {
      /* Beside the spine, not after it: out of the source's right edge and into the
         target's left edge at the target's own height. */
      return `M${a.x + a.w} ${ac.y} H${a.x + a.w + 8} V${bc.y} H${b.x - 2}`;
    }
    case 'loop-side': {
      /* Out of the right edge first, then down the outer margin and back in. Used
         when a box sits directly below the source, where a straight drop would
         pass through it. */
      const lane = bounds.w - 12;
      const below = bounds.h - 30;
      return `M${a.x + a.w} ${ac.y} H${lane} V${below} H${bc.x} V${b.y + b.h + 2}`;
    }
  }
}

/* A label's anchor: the middle of the gap its edge crosses. */
function labelPos(a: Placed, b: Placed, route: Route, bounds: Bounds): { x: number; y: number } {
  switch (route) {
    case 'right':
      return { x: (a.x + a.w + b.x) / 2, y: a.y + a.h / 2 - 5 };
    case 'down':
      return { x: a.x + a.w / 2 + 5, y: (a.y + a.h + b.y) / 2 };
    case 'down-right':
      return { x: Math.max(a.x + a.w, b.x + b.w) + 18, y: (a.y + a.h + b.y) / 2 };
    case 'down-left':
      return { x: Math.min(a.x, b.x) - 18, y: (a.y + a.h + b.y) / 2 };
    case 'loop-bottom':
      return { x: (a.x + a.w / 2 + (b.x + b.w / 2)) / 2, y: bounds.h - 22 };
    case 'branch':
      return { x: b.x + b.w / 2, y: b.y - 6 };
    case 'loop-side':
      return { x: bounds.w - 46, y: bounds.h - 16 };
  }
}

/* The pill behind an edge label, sized from the label's own advance, so a label
   reads over a line instead of being cut by it. */
const pillFor = (text: string, x: number, y: number) => {
  const w = text.length * adv(DETAIL) + 10;
  return { x: x - w / 2, y: y - DETAIL + 1, w, h: DETAIL + 6 };
};

export function Diagram({ spec }: { spec: DiagramSpec }) {
  const svg = useRef<SVGSVGElement>(null);
  const token = useRef<SVGGElement>(null);
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
    const tok = token.current;
    const canMeasure = typeof root?.querySelector<SVGPathElement>('[data-edge]')?.getTotalLength === 'function';
    if (!root || !tok || !canMeasure || reduceMotion()) return;
    setAnimated(true);

    const lit = new Map<string, SVGPathElement>();
    const len = new Map<string, number>();
    root.querySelectorAll<SVGPathElement>('[data-edge]').forEach((p) => {
      const id = p.dataset.edge as string;
      /* Both layouts are in the DOM, so an edge id appears twice; the desktop one
         is the only one the clock drives and the phone layout shares its ids. */
      if (!lit.has(id)) {
        lit.set(id, p);
        len.set(id, p.getTotalLength());
      }
    });
    const nodes = new Map<string, Element[]>();
    root.querySelectorAll('[data-node]').forEach((el) => {
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
      tok.dataset.tone = tone;
      if (status.current) status.current.dataset.tone = tone;
    };

    const reset = () => {
      lit.forEach((p, id) => {
        const l = len.get(id) ?? 0;
        p.style.strokeDasharray = `${l} ${l}`;
        p.style.strokeDashoffset = `${l}`;
        p.classList.remove('is-fail');
      });
      for (const n of spec.nodes) setNode(n.id, 'off');
      setTone('run');
    };

    const place = (edge: string, t: number) => {
      const p = lit.get(edge);
      const l = len.get(edge) ?? 0;
      if (!p) return;
      const at = p.getPointAtLength(l * t);
      const ahead = p.getPointAtLength(Math.min(l, l * t + 1));
      const behind = p.getPointAtLength(Math.max(0, l * t - 1));
      let angle = (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI;
      if (angle > 90) angle -= 180;
      if (angle < -90) angle += 180;
      tok.setAttribute('transform', `translate(${at.x} ${at.y}) rotate(${angle})`);
      p.style.strokeDashoffset = `${l * (1 - t)}`;
    };

    const enter = (s: Step) => {
      if (s.status && statusText.current) statusText.current.textContent = s.status;
      if (s.tone) setTone(s.tone);
      if (s.nodes) for (const [id, state] of Object.entries(s.nodes)) setNode(id, state);
      if (s.edge && s.failEdge) lit.get(s.edge)?.classList.add('is-fail');
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
    io?.observe(root.parentElement as HTMLElement);
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
            <g className="flow-token" ref={token} data-tone="done">
              <circle r="5.5" />
            </g>
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
            <Graph spec={spec} placed={vertical.nodes} bounds={vertical} animated={animated} marker={`arrow-${spec.id}-v`} vertical />
            <g className="flow-token" data-tone="done">
              <circle r="5.5" />
            </g>
          </svg>
        </div>
      </div>
      <figcaption className="visually-hidden">{spec.caption}</figcaption>
    </figure>
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
}: {
  spec: DiagramSpec;
  placed: Placed[];
  bounds: Bounds;
  animated: boolean;
  marker: string;
  vertical?: boolean;
}) {
  const nodes = byId(placed);
  return (
    <>
      {spec.edges.map((e) => {
        const a = nodes.get(e.from);
        const b = nodes.get(e.to);
        if (!a || !b) return null;
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
        const d = edgePath(a, b, route, bounds);
        const lab = labelPos(a, b, route, bounds);
        const pill = pillFor(e.label ?? '', lab.x, lab.y);
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
                <text className="flow-edge-label" x={lab.x} y={lab.y} textAnchor="middle">
                  {e.label}
                </text>
              </>
            )}
          </g>
        );
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
  const block = name.length * LINE + detail.length * (LINE - 2);
  const top = node.y + (node.h - block) / 2 + NAME;
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
          y={top + name.length * LINE + i * (LINE - 2)}
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
