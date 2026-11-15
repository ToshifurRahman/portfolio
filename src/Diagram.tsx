import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

/*
 * One animated flowchart, driven by a spec.
 *
 * The visual language is the signal box: boxes joined by directed edges, one
 * amber token travelling the edges, red only for a refusal or a failure, and a
 * status line that says in words what the token is doing. The same engine draws
 * both case studies' charts. A spec supplies nodes, edges and scripted runs; it
 * cannot invent behaviour.
 *
 * Geometry is computed from a grid position, not hand-placed. Every node names a
 * row and a column for the desktop layout and for the vertical one, and the engine
 * turns that into boxes and edges. A node cannot then overlap its neighbour or
 * spill its label past its own border, which is what happened when positions were
 * pixels: every position also had to agree with every label's width.
 *
 * Two layouts, both in the markup: the desktop graph and a vertical one, with a
 * container query on the panel's own width choosing between them. So the
 * pre-render and reduced motion get the right one at any width, with no
 * JavaScript — neither can measure anything.
 *
 * The animation writes attributes straight onto the SVG through refs, so React
 * never re-renders per frame and hydration never disagrees.
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

type Pos = { row: number; col: number };

/* A box on the chart: where it sits in each layout, and what it says. */
export type Node = {
  id: string;
  name: string;
  detail?: string;
  at: Pos;
  vat: Pos;
  /* A state box reads as a state, not a service: a dashed pill. */
  state?: boolean;
  /* How many columns the box spans. */
  span?: number;
};

/* A directed edge. `from`/`to` name the boxes, so a run is described in nodes
   rather than in geometry, and the path is derived from where they are. */
export type Edge = {
  id: string;
  from: string;
  to: string;
  label?: string;
  /* A branch is dashed: taken only when something fails or is refused. */
  branch?: boolean;
};

export type DiagramSpec = {
  id: string;
  title: string;
  href: string;
  note: string;
  rows: number;
  cols: number;
  nodes: Node[];
  edges: Edge[];
  runs: Step[][];
  still: { edges: string[]; nodes: Record<string, LampState> };
  caption: string;
};

const SPEED = 0.34;

/* Box metrics in viewBox units. A column is a box plus the gap its arrow and its
   label need, so nothing is drawn on top of anything else. */
const BOX = { w: 126, h: 46, gapX: 78, gapY: 68, pad: 22 };
const VBOX = { w: 250, h: 44, gapY: 30, pad: 16 };
const FONT = 12;
const DETAIL = 10;

const reduceMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

type Placed = Node & { x: number; y: number; w: number; h: number };

/* Grid to geometry. */
function layout(spec: DiagramSpec, vertical: boolean): { nodes: Placed[]; w: number; h: number } {
  if (vertical) {
    const rows = Math.max(...spec.nodes.map((n) => n.vat.row)) + 1;
    const nodes = spec.nodes.map((n) => ({
      ...n,
      x: VBOX.pad,
      y: VBOX.pad + n.vat.row * (VBOX.h + VBOX.gapY),
      w: VBOX.w,
      h: VBOX.h,
    }));
    return { nodes, w: VBOX.pad * 2 + VBOX.w, h: VBOX.pad * 2 + rows * VBOX.h + (rows - 1) * VBOX.gapY };
  }

  const spanOf = (n: Node) => n.span ?? 1;
  const colW = (n: Node) => BOX.w * spanOf(n) + BOX.gapX * (spanOf(n) - 1);
  /* A column is as wide as the widest box that starts in it, so a two-column box
     pushes the pitch out rather than overflowing its neighbour. */
  const colWidths: number[] = Array.from({ length: spec.cols }, (_, c) => {
    const widest = Math.max(0, ...spec.nodes.filter((n) => n.at.col === c).map(colW));
    return (widest || BOX.w) + BOX.gapX;
  });
  const colX = (c: number) => BOX.pad + colWidths.slice(0, c).reduce((a, b) => a + b, 0);

  const nodes = spec.nodes.map((n) => ({
    ...n,
    x: colX(n.at.col),
    y: BOX.pad + n.at.row * (BOX.h + BOX.gapY),
    w: colW(n),
    h: BOX.h,
  }));

  return {
    nodes,
    w: colX(spec.cols) + BOX.pad,
    h: BOX.pad * 2 + spec.rows * BOX.h + (spec.rows - 1) * BOX.gapY,
  };
}

const byId = (nodes: Placed[]) => new Map(nodes.map((n) => [n.id, n]));

/* An edge's path, chosen from where its two boxes actually are, so a graph that
   forks draws the fork instead of a line through a box. */
function edgePath(a: Placed, b: Placed, vertical: boolean): string {
  const ac = { x: a.x + a.w / 2, y: a.y + a.h / 2 };
  const bc = { x: b.x + b.w / 2, y: b.y + b.h / 2 };

  if (vertical) {
    if (Math.abs(ac.x - bc.x) < 1) return `M${ac.x} ${a.y + a.h} V${b.y - 7}`;
    const mid = (a.y + a.h + b.y) / 2;
    return `M${ac.x} ${a.y + a.h} V${mid} H${bc.x} V${b.y - 7}`;
  }

  if (a.at.row === b.at.row && b.at.col > a.at.col) return `M${a.x + a.w} ${ac.y} H${b.x - 7}`;
  if (Math.abs(ac.x - bc.x) < 1) return `M${ac.x} ${a.y + a.h} V${b.y - 7}`;
  /* Otherwise: out of the bottom, across under the flow, and up into the target's
     bottom edge, so a branch hangs beneath what it leaves from. */
  const drop = Math.max(a.y + a.h, b.y + b.h) + 18;
  return `M${ac.x} ${a.y + a.h} V${drop} H${bc.x} V${b.y + b.h}`;
}

/* Where a label goes, taken from the two boxes rather than from the path: the
   middle of the gap the edge crosses. A drop edge's label sits on its horizontal
   run below both boxes, which is the one stretch of it with room. */
function labelAt(a: Placed, b: Placed, vertical: boolean): { x: number; y: number } {
  if (vertical) {
    return { x: (a.x + a.w + b.x) / 2 + 4, y: (a.y + a.h + b.y) / 2 + 4 };
  }
  if (a.at.row === b.at.row) {
    return { x: (a.x + a.w + b.x) / 2, y: a.y + a.h / 2 - 7 };
  }
  if (Math.abs(a.x + a.w / 2 - (b.x + b.w / 2)) < 1) {
    return { x: a.x + a.w / 2 + 6, y: (a.y + a.h + b.y) / 2 };
  }
  const drop = Math.max(a.y + a.h, b.y + b.h) + 18;
  /* Two long edges can share that drop line — one going down to the failure band,
     one looping back up — so the label sits above the run when the edge goes down
     and below it when it comes back up. Without that the two labels collide. */
  const up = b.at.row < a.at.row;
  return { x: (a.x + a.w / 2 + (b.x + b.w / 2)) / 2, y: up ? drop + 12 : drop - 5 };
}

/* Break a label into lines that fit its box, on word boundaries. A label is never
   truncated and never shrinks: it wraps. */
const wrap = (text: string, max: number) => {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    if (line && (line + ' ' + word).length > max) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
};

export function Diagram({ spec }: { spec: DiagramSpec }) {
  const svg = useRef<SVGSVGElement>(null);
  const token = useRef<SVGGElement>(null);
  const status = useRef<HTMLSpanElement>(null);
  const statusText = useRef<HTMLSpanElement>(null);
  const [playing, setPlaying] = useState(true);
  const [animated, setAnimated] = useState(false);
  const playingRef = useRef(true);

  const desktop = layout(spec, false);
  const vertical = layout(spec, true);

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
      /* Both layouts are in the DOM, so an edge id appears twice; the first is the
         desktop one and the only one the clock drives. */
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
      /* Both layouts carry the same box, so the state goes to both: whichever is
         on screen is always right. */
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

    const duration = (s: Step) => (s.edge ? (len.get(s.edge) ?? 0) / SPEED : (s.dur ?? 0));

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
            squeezed into the desktop canvas. A container query shows one. The
            pre-render holds a complete picture either way, with no measuring and no
            JavaScript. The clock drives the desktop one; the phone layout shares its
            node and edge ids, and the state classes are written to both. */}
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
            <Graph spec={spec} placed={desktop.nodes} vertical={false} animated={animated} marker={`arrow-${spec.id}`} />
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
            <Graph spec={spec} placed={vertical.nodes} vertical animated={animated} marker={`arrow-${spec.id}-v`} />
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

/* One arrowhead per SVG, inherited by every edge in it, so direction is part of
   the drawing rather than a triangle copied onto every path. */
function Marker({ id }: { id: string }) {
  return (
    <defs>
      <marker id={id} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
        <path d="M0 0 L8 4 L0 8 z" className="flow-arrowhead" />
      </marker>
    </defs>
  );
}

function Graph({
  spec,
  placed,
  vertical,
  animated,
  marker,
}: {
  spec: DiagramSpec;
  placed: Placed[];
  vertical: boolean;
  animated: boolean;
  marker: string;
}) {
  const nodes = byId(placed);
  return (
    <>
      {spec.edges.map((e) => {
        const a = nodes.get(e.from);
        const b = nodes.get(e.to);
        if (!a || !b) return null;
        const d = edgePath(a, b, vertical);
        const lab = labelAt(a, b, vertical);
        return (
          <g key={e.id}>
            <path
              className={`flow-edge${e.branch ? ' is-branch' : ''}`}
              d={d}
              data-edge={e.id}
              /* The still picture is the whole chart: every edge is drawn, so a
                 branch box never looks unattached. Edges the first run lights are
                 marked as drawn already; the rest sit at the muted rail colour. */
              style={
                !animated && !spec.still.edges.includes(e.id) ? { opacity: 0.45 } : undefined
              }
              markerEnd={`url(#${marker})`}
            />
            {e.label && (
              <text className="flow-edge-label" x={lab.x} y={lab.y} textAnchor="middle">
                {e.label}
              </text>
            )}
          </g>
        );
      })}
      {placed.map((n) => {
        const name = wrap(n.name, vertical ? 26 : 17);
        const detail = n.detail ? wrap(n.detail, vertical ? 32 : 21) : [];
        /* Centre the whole label block in the box: the name, then the detail. */
        const block = name.length * (FONT + 2) + detail.length * (DETAIL + 2);
        const top = n.y + (n.h - block) / 2 + FONT;
        return (
          <g
            key={n.id}
            className={`flow-node${n.state ? ' is-state' : ''}`}
            data-node={n.id}
            data-vertical={vertical ? 'true' : undefined}
          >
            <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={n.state ? n.h / 2 : 5} />
            {name.map((line, i) => (
              <text key={i} className="flow-node-name" x={n.x + n.w / 2} y={top + i * (FONT + 2)} textAnchor="middle">
                {line}
              </text>
            ))}
            {detail.map((line, i) => (
              <text
                key={i}
                className="flow-node-detail"
                x={n.x + n.w / 2}
                y={top + name.length * (FONT + 2) + i * (DETAIL + 2)}
                textAnchor="middle"
              >
                {line}
              </text>
            ))}
          </g>
        );
      })}
    </>
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
