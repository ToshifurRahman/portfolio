import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

/*
 * Ticket-Pipeline drawn as a signal-box track: the real states a ticket moves
 * through (queued, triaging, drafting, completed), the retry loop, the
 * needs-attention siding and the replay back to the stage that failed. One
 * demo ticket runs it: the first run fails once and recovers on a retry, the
 * second uses up its retries, waits for a person and is replayed.
 *
 * The markup is static and complete (it is what pre-rendering and reduced
 * motion show). The animation writes attributes straight onto the SVG through
 * refs, so React never re-renders per frame and hydration never disagrees.
 */

type Seg = 'enter' | 'qt' | 'td' | 'dl' | 'loop' | 'dj' | 'jc' | 'siding' | 'sidingBack' | 'jdBack';
type Station = 'queued' | 'triaging' | 'drafting' | 'completed' | 'attention';
type LampState = 'off' | 'lit' | 'done' | 'fail';
type Tone = 'run' | 'fail' | 'done';

const Y = 120;
const X = { queued: 180, triaging: 450, drafting: 740, completed: 1240, attention: 1116 } as const;

const PATHS: Record<Seg, string> = {
  enter: `M-80 ${Y} H180`,
  qt: `M180 ${Y} H450`,
  td: `M450 ${Y} H740`,
  dl: `M740 ${Y} H800`,
  loop: `M800,${Y} C832,${Y} 840,104 840,88 V72 C840,54 828,44 810,44 H670 C652,44 640,54 640,72 V88 C640,104 648,${Y} 680,${Y} H740`,
  dj: `M800 ${Y} H880`,
  jc: `M880 ${Y} H1240`,
  siding: `M880,${Y} C912,${Y} 922,140 930,160 C938,180 952,192 980,192 H1130`,
  sidingBack: `M1130,192 H980 C952,192 938,180 930,160 C922,140 912,${Y} 880,${Y}`,
  jdBack: `M880 ${Y} H740`,
};

/* Where the camera centres the track when the window is wide enough to show
   every station; narrower windows follow the ticket instead. */
const CENTRE = 680;
const SHOW_ALL = 1380;
const SPEED = 0.3; // px per ms

type Step = {
  seg?: Seg;
  dur?: number;
  status?: string;
  tone?: Tone;
  lamps?: Partial<Record<Station, LampState>>;
  failSeg?: boolean;
};

const attempt = (n: number): Step[] => [
  { seg: 'dl' },
  { seg: 'loop', status: `Retry ${n} of 3`, tone: 'run', lamps: { drafting: 'off' } },
];

const startRun: Step[] = [
  { seg: 'enter', status: 'New ticket submitted', tone: 'run' },
  { dur: 700, status: 'Queued in SQS', lamps: { queued: 'lit' } },
  { seg: 'qt', lamps: { queued: 'done' } },
  { dur: 900, status: 'Triaging: category, priority, sentiment', lamps: { triaging: 'lit' } },
  { seg: 'td', lamps: { triaging: 'done' } },
  { dur: 800, status: 'Drafting the reply', lamps: { drafting: 'lit' } },
  { dur: 900, status: 'Draft failed: invalid response', tone: 'fail', lamps: { drafting: 'fail' } },
];

const finish: Step[] = [
  { seg: 'dl', lamps: { drafting: 'done' } },
  { seg: 'dj' },
  { seg: 'jc' },
  { dur: 2400, status: 'Completed: the customer sees it live', tone: 'done', lamps: { completed: 'done' } },
];

/* Run one: fails once, recovers on the first retry. */
const runRecover: Step[] = [
  ...startRun,
  ...attempt(1),
  { dur: 900, status: 'Drafting: retry 1 of 3', tone: 'run', lamps: { drafting: 'lit' } },
  ...finish,
];

/* Run two: every retry fails, a person replays it from the failed stage. */
const failAgain = (n: number): Step[] => [
  ...attempt(n),
  { dur: 500, status: `Drafting: retry ${n} of 3`, tone: 'run', lamps: { drafting: 'lit' } },
  { dur: 600, status: `Retry ${n} failed`, tone: 'fail', lamps: { drafting: 'fail' } },
];

const runReplay: Step[] = [
  ...startRun,
  ...failAgain(1),
  ...failAgain(2),
  ...failAgain(3),
  { seg: 'dl', status: 'Retries used up', tone: 'fail' },
  { seg: 'dj' },
  { seg: 'siding', failSeg: true },
  { dur: 2000, status: 'Needs attention: ops alerted', tone: 'fail', lamps: { attention: 'fail', drafting: 'off' } },
  { dur: 900, status: 'Replay by staff', tone: 'run', lamps: { attention: 'lit' } },
  { seg: 'sidingBack', lamps: { attention: 'off' } },
  { seg: 'jdBack' },
  { dur: 900, status: 'Drafting: replayed from the failed stage', tone: 'run', lamps: { drafting: 'lit' } },
  ...finish,
];

const RUNS = [runRecover, runReplay];

/* The still picture: the first run, completed. */
const STILL_LIT: Seg[] = ['enter', 'qt', 'td', 'dl', 'dj', 'jc'];
const STILL_LAMPS: Record<Station, LampState> = {
  queued: 'done',
  triaging: 'done',
  drafting: 'done',
  completed: 'done',
  attention: 'off',
};

const stations: { id: Station; name: string; detail: string; x: number }[] = [
  { id: 'queued', name: 'Queued', detail: 'SQS queue', x: X.queued },
  { id: 'triaging', name: 'Triaging', detail: 'Category, priority, sentiment', x: X.triaging },
  { id: 'drafting', name: 'Drafting', detail: 'Reply, note, next steps', x: X.drafting },
  { id: 'completed', name: 'Completed', detail: 'Live on the ticket page', x: X.completed },
];

const reduceMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function SignalPanel() {
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

    const lit = new Map<Seg, SVGPathElement>();
    const len = new Map<Seg, number>();
    root.querySelectorAll<SVGPathElement>('[data-seg]').forEach((p) => {
      const seg = p.dataset.seg as Seg;
      lit.set(seg, p);
      len.set(seg, p.getTotalLength());
    });
    const lamps = new Map<Station, Element>();
    root.querySelectorAll('[data-lamp]').forEach((el) => lamps.set(el.getAttribute('data-lamp') as Station, el));
    const view = root.parentElement as HTMLElement;

    let run = 0;
    let step = 0;
    let elapsed = 0;
    let last = 0;
    let frame = 0;
    let visible = true;
    let camera = CENTRE;
    let tokenX = -80;

    const setLamp = (id: Station, state: LampState) => {
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
      (Object.keys(X) as Station[]).forEach((id) => setLamp(id, 'off'));
      setTone('run');
    };

    const place = (seg: Seg, t: number) => {
      const p = lit.get(seg);
      const l = len.get(seg) ?? 0;
      if (!p) return;
      const at = p.getPointAtLength(l * t);
      const ahead = p.getPointAtLength(Math.min(l, l * t + 1));
      const behind = p.getPointAtLength(Math.max(0, l * t - 1));
      let angle = (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI;
      /* A ticket reversing out of the siding keeps facing forward. */
      if (angle > 90) angle -= 180;
      if (angle < -90) angle += 180;
      tok.setAttribute('transform', `translate(${at.x} ${at.y}) rotate(${angle})`);
      p.style.strokeDashoffset = `${l * (1 - t)}`;
      tokenX = at.x;
    };

    const enter = (s: Step) => {
      if (s.status) setStatus(s.status);
      if (s.tone) setTone(s.tone);
      if (s.lamps) (Object.entries(s.lamps) as [Station, LampState][]).forEach(([id, v]) => setLamp(id, v));
      if (s.seg && s.failSeg) lit.get(s.seg)?.classList.add('is-fail');
    };

    const duration = (s: Step) => (s.seg ? (len.get(s.seg) ?? 0) / SPEED : (s.dur ?? 0));

    const steer = () => {
      const width = view.clientWidth;
      const target =
        width >= SHOW_ALL
          ? CENTRE
          : Math.min(Math.max(tokenX, width / 2 - 20), SHOW_ALL - width / 2);
      camera += (target - camera) * 0.08;
      root.style.transform = `translateX(${(-camera).toFixed(1)}px)`;
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = last ? Math.min(now - last, 64) : 0;
      last = now;
      if (!playingRef.current || !visible || document.hidden) return;
      const steps = RUNS[run];
      elapsed += dt;
      let s = steps[step];
      while (elapsed >= duration(s)) {
        if (s.seg) place(s.seg, 1);
        elapsed -= duration(s);
        step += 1;
        if (step >= steps.length) {
          run = (run + 1) % RUNS.length;
          step = 0;
          reset();
        }
        s = RUNS[run][step];
        enter(s);
      }
      if (s.seg) place(s.seg, elapsed / duration(s));
      steer();
    };

    reset();
    enter(RUNS[0][0]);
    place('enter', 0);

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
  }, []);

  return (
    <figure className="track-panel" aria-labelledby="track-title">
      <div className="frame track-caption">
        <p className="track-title" id="track-title">
          <Link className="inline-link" to="/work/ticket-pipeline">
            Ticket-Pipeline
          </Link>
          <span className="track-note">A demo ticket through the system’s real states</span>
        </p>
        <span className="track-status mono" ref={status} data-tone="done" aria-hidden="true">
          <span className="lamp is-lit" />
          <span ref={statusText}>Completed: the customer sees it live</span>
        </span>
        {animated && (
          <button type="button" className="track-pause" aria-pressed={!playing} onClick={() => setPlaying(!playing)}>
            <PlayPauseIcon playing={playing} />
            {playing ? 'Pause' : 'Play'}
            <span className="visually-hidden"> the demo</span>
          </button>
        )}
      </div>
      <div className="track-window">
        <svg
          ref={svg}
          className="track-svg"
          viewBox="0 0 1600 240"
          style={{ transform: `translateX(-${CENTRE}px)` }}
          aria-hidden="true"
          focusable="false"
        >
          {/* Rails at rest. The main line runs past both edges of any screen. */}
          <path className="rail" d={`M-1400 ${Y} H3000`} />
          <path className="rail" d={PATHS.loop} />
          <path className="rail" d={PATHS.siding} />
          <path className="buffer" d="M1130 180 V204" />

          {/* Lit route: drawn in as the ticket passes. */}
          {(Object.keys(PATHS) as Seg[]).map((seg) => (
            <path
              key={seg}
              className="rail-lit"
              d={PATHS[seg]}
              data-seg={seg}
              /* The still picture hides what the first run never lights; once
                 animating, every segment is driven by its dash offset. */
              style={!animated && !STILL_LIT.includes(seg) ? { opacity: 0 } : undefined}
            />
          ))}

          <text x="30" y="158">
            API
          </text>
          <text x="740" y="30" textAnchor="middle">
            RETRY, UP TO 3
          </text>
          <text x="972" y="180">
            REPLAY BY STAFF
          </text>
          <text x="1130" y="224" textAnchor="end" className="station-name">
            NEEDS ATTENTION, OPS ALERTED
          </text>
          {stations.map((s) => (
            <g key={s.id}>
              <text x={s.x} y="158" textAnchor="middle" className="station-name">
                {s.name.toUpperCase()}
              </text>
              <text x={s.x} y="176" textAnchor="middle">
                {s.detail.toUpperCase()}
              </text>
              <circle
                className={`station-lamp is-${STILL_LAMPS[s.id]}`}
                data-lamp={s.id}
                cx={s.x}
                cy={Y}
                r="7"
              />
            </g>
          ))}
          <circle className="station-lamp" data-lamp="attention" cx={X.attention} cy="192" r="7" />

          <g className="token" ref={token} data-tone="done" transform={`translate(${X.completed} ${Y})`}>
            <rect className="token-body" x="-20" y="-6" width="40" height="12" rx="3" />
          </g>
        </svg>
      </div>
      <figcaption className="visually-hidden">
        Diagram of Ticket-Pipeline’s states. A new ticket is queued in SQS, then a worker triages it by category,
        priority and sentiment, then drafts a reply, an internal note and next steps, and the ticket is completed
        and shown live on its page. A stage that fails is retried up to three times. After that the ticket waits
        on the needs-attention siding, ops is alerted, and staff can replay it from the stage that failed.
      </figcaption>
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
