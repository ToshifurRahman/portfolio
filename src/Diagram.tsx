import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';

/*
 * One animated architecture diagram, driven by a spec.
 *
 * The visual language is the signal box: a track with stations and lamps, one
 * amber token that is the request being traced, red only for a refusal, and a
 * status line that says in words what the token is doing. The same engine draws
 * both case studies' diagrams; a spec cannot invent behaviour, only geometry,
 * stations and scripted runs.
 *
 * The markup is static and complete — it is what the pre-render and reduced
 * motion show — and the animation writes attributes straight onto the SVG
 * through refs, so React never re-renders per frame and hydration never
 * disagrees. Nothing here pauses on scroll or on a hidden tab by accident: an
 * IntersectionObserver and a `document.hidden` check stop the clock, and the
 * pause button stops it on request.
 */

export type LampState = 'off' | 'lit' | 'done' | 'fail';
export type Tone = 'run' | 'fail' | 'done';

/* One step of a scripted run: a segment to travel, or a dwell with a status. */
export type Step = {
  seg?: string;
  dur?: number;
  status?: string;
  tone?: Tone;
  lamps?: Record<string, LampState>;
  failSeg?: boolean;
};

export type Station = { id: string; name: string; detail: string; x: number };

/* A lamp drawn off the main line, such as the refusal siding. */
export type ExtraLamp = { id: string; x: number; y: number };

/* A `branch` aside names a refusal point. It is the one label that can be
   dropped from a very narrow still picture: it sits beside the last stations
   and would otherwise force a station off-screen. The refusal is still said in
   words by the status line and the caption. */
export type Aside = {
  x: number;
  y: number;
  text: string;
  anchor?: 'start' | 'middle' | 'end';
  branch?: boolean;
};

export type DiagramSpec = {
  /* Used for the still picture's framing: styles.css keys its per-width bands
     on this, because each diagram's labels sit at different coordinates. */
  id: string;
  title: string;
  href: string;
  note: string;
  /* The viewed area; the drawing is in these units, so 1 unit is 1px only when
     the panel is the same height as the viewBox (see the still-height rule). */
  viewBox: { w: number; h: number };
  /* Where the camera centres when the panel is wide enough for every station. */
  centre: number;
  showAll: number;
  /* The still picture's framing: `left` is the track coordinate put at the
     panel's left edge while the panel is at most `upTo` px wide. Data rather
     than CSS, because it is diagram geometry (track units) computed from the
     labels' measured extents, and a test can check every band. */
  framing: { upTo: number; left: number }[];
  y: number;
  /* Every segment of track, by name. The run steps travel these. */
  segments: Record<string, string>;
  /* Rails that are always drawn, under the lit route. */
  rails: string[];
  buffers?: string[];
  runs: Step[][];
  still: { lit: string[]; lamps: Record<string, LampState> };
  stations: Station[];
  extraLamps?: ExtraLamp[];
  asides?: Aside[];
  token: { x: number; y: number };
  caption: string;
};

const SPEED = 0.3; // px per ms

const reduceMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* The still picture's framing, handed to CSS as custom properties. The values
   are diagram geometry in track units and live in the spec; styles.css picks a
   band with a container query on the panel's own width, so the picture is framed
   correctly in the pre-render and with no JavaScript at all — neither of which
   can measure a panel. */
function framingVars(spec: DiagramSpec): CSSProperties {
  const vars: Record<string, string> = {};
  spec.framing.forEach((band, i) => {
    vars[`--frame-${i}`] = `${band.left}px`;
  });
  return vars as CSSProperties;
}

export function Diagram({ spec }: { spec: DiagramSpec }) {
  const svg = useRef<SVGSVGElement>(null);
  const token = useRef<SVGGElement>(null);
  const status = useRef<HTMLSpanElement>(null);
  const statusText = useRef<HTMLSpanElement>(null);
  const [playing, setPlaying] = useState(true);
  const [animated, setAnimated] = useState(false);
  const playingRef = useRef(true);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    const root = svg.current;
    const tok = token.current;
    /* Without SVG geometry (an old engine, a test DOM) the still picture stays. */
    const canMeasure = typeof root?.querySelector<SVGPathElement>('[data-seg]')?.getTotalLength === 'function';
    if (!root || !tok || !canMeasure || reduceMotion()) return;
    setAnimated(true);

    const lit = new Map<string, SVGPathElement>();
    const len = new Map<string, number>();
    root.querySelectorAll<SVGPathElement>('[data-seg]').forEach((p) => {
      const seg = p.dataset.seg as string;
      lit.set(seg, p);
      len.set(seg, p.getTotalLength());
    });
    const lamps = new Map<string, Element>();
    root.querySelectorAll('[data-lamp]').forEach((el) => lamps.set(el.getAttribute('data-lamp') as string, el));
    const view = root.parentElement as HTMLElement;

    let run = 0;
    let step = 0;
    let elapsed = 0;
    let last = 0;
    let frame = 0;
    let visible = true;
    let camera = spec.centre;
    let tokenX = -80;

    const setLamp = (id: string, state: LampState) => {
      const el = lamps.get(id);
      if (!el) return;
      el.classList.toggle('is-lit', state === 'lit');
      el.classList.toggle('is-done', state === 'done');
      el.classList.toggle('is-fail', state === 'fail');
    };

    const setTone = (tone: Tone) => {
      tok.dataset.tone = tone;
      if (status.current) status.current.dataset.tone = tone;
    };

    const setStatus = (text: string) => {
      if (statusText.current) statusText.current.textContent = text;
    };

    const reset = () => {
      lit.forEach((p, seg) => {
        const l = len.get(seg) ?? 0;
        p.style.strokeDasharray = `${l} ${l}`;
        p.style.strokeDashoffset = `${l}`;
        p.classList.remove('is-fail');
      });
      for (const id of Object.keys(spec.still.lamps)) setLamp(id, 'off');
      for (const l of spec.extraLamps ?? []) setLamp(l.id, 'off');
      for (const s of spec.stations) setLamp(s.id, 'off');
      setTone('run');
    };

    const place = (seg: string, t: number) => {
      const p = lit.get(seg);
      const l = len.get(seg) ?? 0;
      if (!p) return;
      const at = p.getPointAtLength(l * t);
      const ahead = p.getPointAtLength(Math.min(l, l * t + 1));
      const behind = p.getPointAtLength(Math.max(0, l * t - 1));
      let angle = (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI;
      /* A request reversing out of a siding keeps facing forward. */
      if (angle > 90) angle -= 180;
      if (angle < -90) angle += 180;
      tok.setAttribute('transform', `translate(${at.x} ${at.y}) rotate(${angle})`);
      p.style.strokeDashoffset = `${l * (1 - t)}`;
      tokenX = at.x;
    };

    const enter = (s: Step) => {
      if (s.status) setStatus(s.status);
      if (s.tone) setTone(s.tone);
      if (s.lamps) for (const [id, v] of Object.entries(s.lamps)) setLamp(id, v);
      if (s.seg && s.failSeg) lit.get(s.seg)?.classList.add('is-fail');
    };

    const duration = (s: Step) => (s.seg ? (len.get(s.seg) ?? 0) / SPEED : (s.dur ?? 0));

    const steer = () => {
      const width = view.clientWidth;
      const target =
        width >= spec.showAll
          ? spec.centre
          : Math.min(Math.max(tokenX, width / 2 - 20), spec.showAll - width / 2);
      camera += (target - camera) * 0.08;
      root.style.transform = `translateX(${(-camera).toFixed(1)}px)`;
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = last ? Math.min(now - last, 64) : 0;
      last = now;
      if (!playingRef.current || !visible || document.hidden) return;
      const steps = spec.runs[run];
      elapsed += dt;
      let s = steps[step];
      while (elapsed >= duration(s)) {
        if (s.seg) place(s.seg, 1);
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
      if (s.seg) place(s.seg, elapsed / duration(s));
      steer();
    };

    reset();
    enter(spec.runs[0][0]);
    const first = spec.runs[0][0];
    if (first.seg) place(first.seg, 0);

    const io =
      typeof IntersectionObserver === 'function'
        ? new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
          })
        : null;
    io?.observe(view);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      io?.disconnect();
    };
  }, [spec]);

  return (
    <figure
      className="track-panel"
      data-diagram={spec.id}
      data-still={!animated ? 'true' : undefined}
      style={framingVars(spec)}
      aria-labelledby={`${spec.id}-title`}
    >
      <div className="frame track-caption">
        <p className="track-title" id={`${spec.id}-title`}>
          <Link className="inline-link" to={spec.href}>
            {spec.title}
          </Link>
          <span className="track-note">{spec.note}</span>
        </p>
        <span className="track-status mono" ref={status} data-tone="done" aria-hidden="true">
          <span className="lamp is-lit" />
          {/* The still picture is a finished run, so the status names the state
              the picture shows (the last one the first run reaches), not the
              first step of that run. */}
          <span ref={statusText}>
            {[...spec.runs[0]].reverse().find((s) => s.status)?.status ?? ''}
          </span>
        </span>
        {animated && (
          <button type="button" className="track-pause" onClick={() => setPlaying(!playing)}>
            <PlayPauseIcon playing={playing} />
            {playing ? 'Pause' : 'Play'}
            <span className="visually-hidden"> the diagram</span>
          </button>
        )}
      </div>
      <div className="track-window">
        <svg
          ref={svg}
          className="track-svg"
          viewBox={`0 0 ${spec.viewBox.w} ${spec.viewBox.h}`}
          /* The still picture is framed from the spec for the panel's width, so
             no station label is cut at the panel's edge; the animated run is
             steered by script, which overwrites this every frame. */
          style={animated ? { transform: `translateX(-${spec.centre}px)` } : undefined}
          aria-hidden="true"
          focusable="false"
        >
          {spec.rails.map((d, i) => (
            <path className="rail" d={d} key={`rail-${i}`} />
          ))}
          {spec.buffers?.map((d, i) => (
            <path className="buffer" d={d} key={`buf-${i}`} />
          ))}

          {Object.entries(spec.segments).map(([seg, d]) => (
            <path
              key={seg}
              className="rail-lit"
              d={d}
              data-seg={seg}
              /* The still picture hides what the first run never lights; once
                 animating, every segment is driven by its dash offset. */
              style={!animated && !spec.still.lit.includes(seg) ? { opacity: 0 } : undefined}
            />
          ))}

          {(spec.asides ?? []).map((a) => (
            <text
              key={a.text}
              x={a.x}
              y={a.y}
              data-aside={a.branch ? 'branch' : undefined}
              textAnchor={a.anchor ?? 'start'}
              className={/^[A-Z0-9 ,']+$/.test(a.text) && a.text.length < 12 ? 'station-aside' : 'station-name station-aside'}
            >
              {a.text}
            </text>
          ))}

          {spec.stations.map((s) => (
            <g key={s.id} data-station={s.id}>
              <text x={s.x} y="158" textAnchor="middle" className="station-name station-label">
                {s.name.toUpperCase()}
              </text>
              <text x={s.x} y="176" textAnchor="middle" className="station-sublabel">
                {s.detail.toUpperCase()}
              </text>
              <circle
                className={`station-lamp is-${spec.still.lamps[s.id] ?? 'off'}`}
                data-lamp={s.id}
                cx={s.x}
                cy={spec.y}
                r="7"
              />
            </g>
          ))}

          {(spec.extraLamps ?? []).map((l) => (
            <circle
              key={l.id}
              className={`station-lamp is-${spec.still.lamps[l.id] ?? 'off'}`}
              data-lamp={l.id}
              cx={l.x}
              cy={l.y}
              r="7"
            />
          ))}

          <g className="token" ref={token} data-tone="done" transform={`translate(${spec.token.x} ${spec.token.y})`}>
            <rect className="token-body" x="-20" y="-6" width="40" height="12" rx="3" />
          </g>
        </svg>
      </div>
      <figcaption className="visually-hidden">{spec.caption}</figcaption>
    </figure>
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
