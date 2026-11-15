import { securityCheckLabel } from './content';
import type { DiagramSpec, Step } from './Diagram';

/*
 * The two case studies' architecture diagrams, as data.
 *
 * The engine (src/Diagram.tsx) draws them; nothing here states a new fact. The
 * station names, the retry and replay behaviour and the refusal paths are all
 * from src/content.ts: Ticket-Pipeline's four ticket states, its retry-up-to-3
 * and its replay-by-staff siding, and RannaGhor's request lane with its separate
 * vendor and admin role checks and its stock transaction.
 */

const Y = 120;
const X = { queued: 180, triaging: 450, drafting: 740, completed: 1240, attention: 1116 } as const;

const TP_SEGMENTS = {
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

const failAgain = (n: number): Step[] => [
  ...attempt(n),
  { dur: 500, status: `Drafting: retry ${n} of 3`, tone: 'run', lamps: { drafting: 'lit' } },
  { dur: 600, status: `Retry ${n} failed`, tone: 'fail', lamps: { drafting: 'fail' } },
];

/* Run one fails once and recovers on the first retry; run two uses every retry,
 * waits on the siding and is replayed by staff from the stage that failed. */
const ticketPipeline: DiagramSpec = {
  id: 'ticket-pipeline',
  title: 'Ticket-Pipeline',
  href: '/work/ticket-pipeline',
  note: 'A demo ticket through the system’s real states',
  viewBox: { w: 1600, h: 240 },
  centre: 680,
  showAll: 1380,
  /* The still picture's framing, per panel width, in track units: each band puts
   * that coordinate at the panel's left edge. Computed from the measured label
   * extents so no label is ever cut at either edge and the station the picture
   * is about stays whole (COMPLETED with its sublabel). The panel width, not the
   * viewport, is what matters: the diagram is nine columns wide inside a case
   * study. */
  framing: [
    { upTo: 479, left: 1130 },
    { upTo: 719, left: 870 },
    { upTo: 1039, left: 630 },
    { upTo: 1219, left: 310 },
    { upTo: 1329, left: 130 },
    { upTo: Infinity, left: 20 },
  ],
  y: Y,
  segments: TP_SEGMENTS,
  rails: [`M-1400 ${Y} H3000`, TP_SEGMENTS.loop, TP_SEGMENTS.siding],
  buffers: ['M1130 180 V204'],
  runs: [
    [...startRun, ...attempt(1), { dur: 900, status: 'Drafting: retry 1 of 3', tone: 'run', lamps: { drafting: 'lit' } }, ...finish],
    [
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
    ],
  ],
  still: {
    lit: ['enter', 'qt', 'td', 'dl', 'dj', 'jc'],
    lamps: { queued: 'done', triaging: 'done', drafting: 'done', completed: 'done', attention: 'off' },
  },
  stations: [
    { id: 'queued', name: 'Queued', detail: 'SQS queue', x: X.queued },
    { id: 'triaging', name: 'Triaging', detail: 'Category, priority, sentiment', x: X.triaging },
    { id: 'drafting', name: 'Drafting', detail: 'Reply, note, next steps', x: X.drafting },
    { id: 'completed', name: 'Completed', detail: 'Live on the ticket page', x: X.completed },
  ],
  extraLamps: [{ id: 'attention', x: X.attention, y: 192 }],
  asides: [
    { x: 30, y: 158, text: 'API' },
    { x: 740, y: 30, text: 'RETRY, UP TO 3', anchor: 'middle' },
    { x: 972, y: 180, text: 'REPLAY BY STAFF' },
    { x: 1130, y: 224, text: 'NEEDS ATTENTION, OPS ALERTED', anchor: 'end' },
  ],
  token: { x: X.completed, y: Y },
  caption:
    'Diagram of Ticket-Pipeline’s states. A new ticket is queued in SQS, then a worker triages it by category, priority and sentiment, then drafts a reply, an internal note and next steps, and the ticket is completed and shown live on its page. A stage that fails is retried up to three times. After that the ticket waits on the needs-attention siding, ops is alerted, and staff can replay it from the stage that failed.',
};

/* RannaGhor. The request lane is the one src/content.ts draws: security and
 * CSRF, a rate limit, the session, a role check, then the route handler. Three
 * scripted runs use only what the case study states — an order committing its
 * stock transaction, a customer refused at the vendor role check, and two
 * orders for the last item where the second is refused at that same check.
 *
 * The two refusal points sit on a branch below the main line: the vendor
 * refusal rejoins the lane at the role-check station, and the stock refusal
 * comes off the transaction. Both are red only while the token is on them.
 */

const RY = 120;
const RX = {
  security: 180,
  rate: 420,
  session: 660,
  role: 900,
  handler: 1140,
  postgres: 1400,
} as const;
const REFUSE_Y = 200;

const RG_SEGMENTS = {
  enter: `M-80 ${RY} H180`,
  sec: `M180 ${RY} H420`,
  rate: `M420 ${RY} H660`,
  sess: `M660 ${RY} H900`,
  role: `M900 ${RY} H1140`,
  handler: `M1140 ${RY} H1400`,
  commit: `M1400 ${RY} H1560`,
  /* A customer calling a vendor route: stopped at the role check, refused, and
     the refusal marked below the lane. */
  refuse: `M900,${RY} C940,${RY} 956,${REFUSE_Y - 20} 960,${REFUSE_Y} H1080`,
  /* Two orders for the last item: the second is refused at the stock check,
     which is the transaction at the end of the lane. */
  stock: `M1400,${RY} C1440,${RY} 1456,${REFUSE_Y - 20} 1460,${REFUSE_Y} H1560`,
} as const;

const rgEnter: Step[] = [
  { seg: 'enter', status: 'A request arrives', tone: 'run' },
  { seg: 'sec', status: 'Security and CSRF checks pass', tone: 'run', lamps: { security: 'lit' } },
  { seg: 'rate', status: 'Within the rate limit', lamps: { security: 'done', rate: 'lit' } },
  { seg: 'sess', status: 'Session read', lamps: { rate: 'done', session: 'lit' } },
];

const RG_RUNS: Step[][] = [
  [
    ...rgEnter,
    { seg: 'role', status: 'Role check: customer', lamps: { session: 'done', role: 'lit' } },
    { seg: 'handler', status: 'An order is placed', lamps: { role: 'done', handler: 'lit' } },
    { seg: 'commit', status: 'Stock checked and reduced in one transaction', lamps: { handler: 'done', postgres: 'done' } },
    { dur: 2200, status: 'Order committed', tone: 'done', lamps: { postgres: 'done' } },
  ],
  [
    ...rgEnter,
    { seg: 'role', status: 'Role check: a customer calls a vendor route', lamps: { session: 'done', role: 'lit' } },
    { dur: 700, status: 'Role check fails', tone: 'fail', lamps: { role: 'fail' } },
    { seg: 'refuse', status: 'Refused by the vendor route’s own middleware', tone: 'fail' },
    { dur: 2000, status: '403: request refused at the role check', tone: 'fail', lamps: { role: 'fail' } },
  ],
  [
    ...rgEnter,
    { seg: 'role', status: 'Role check: customer', lamps: { session: 'done', role: 'lit' } },
    { seg: 'handler', status: 'An order is placed', lamps: { role: 'done', handler: 'lit' } },
    { dur: 600, status: 'One order commits', tone: 'run', lamps: { handler: 'done' } },
    { seg: 'commit', status: 'The next order locks the product rows', lamps: { postgres: 'lit' } },
    { dur: 700, status: 'Stock is gone: the transaction is refused', tone: 'fail', lamps: { postgres: 'fail' } },
    { seg: 'stock', status: 'The second order is refused at the stock check', tone: 'fail' },
    { dur: 2000, status: 'Only one order for the last item succeeds', tone: 'fail' },
  ],
];

const rannaghor: DiagramSpec = {
  id: 'rannaghor',
  title: 'RannaGhor',
  href: '/work/rannaghor',
  note: 'A customer’s request through every check it meets',
  viewBox: { w: 1600, h: 240 },
  centre: 640,
  showAll: 1500,
  /* The still picture's framing, per panel width, in track units. Computed from
   * the measured extents like Ticket-Pipeline's; ROLE CHECK and POSTGRESQL stay
   * whole, and the refusal labels on the branch are dropped from the narrowest
   * pictures (they are said in words by the status line and the caption). */
  framing: [
    { upTo: 499, left: 1287 },
    { upTo: 729, left: 1015 },
    { upTo: 909, left: 785 },
    { upTo: 1209, left: 771 },
    { upTo: 1409, left: 305 },
    { upTo: Infinity, left: 105 },
  ],
  y: RY,
  segments: RG_SEGMENTS,
  rails: [`M-1400 ${RY} H3000`],
  runs: RG_RUNS,
  still: {
    lit: ['enter', 'sec', 'rate', 'sess', 'role', 'handler', 'commit'],
    lamps: { security: 'done', rate: 'done', session: 'done', role: 'done', handler: 'done', postgres: 'done' },
  },
  stations: [
    { id: 'security', name: securityCheckLabel, detail: 'Every API call', x: RX.security },
    { id: 'rate', name: 'Rate limit', detail: 'Per account and address', x: RX.rate },
    { id: 'session', name: 'Session', detail: 'Better Auth', x: RX.session },
    { id: 'role', name: 'Role check', detail: 'Vendor, admin, customer', x: RX.role },
    { id: 'handler', name: 'Route handler', detail: '21 route modules', x: RX.handler },
    { id: 'postgres', name: 'PostgreSQL', detail: 'Drizzle, one transaction', x: RX.postgres },
  ],
  asides: [
    { x: 1080, y: 224, text: 'REFUSED', anchor: 'end', branch: true },
    { x: 1560, y: 224, text: 'STOCK REFUSED', anchor: 'end', branch: true },
  ],
  token: { x: RX.postgres, y: RY },
  caption:
    'Diagram of how a RannaGhor request moves. Every API call passes a security and CSRF check, a rate limit, the session and a role check before it reaches a route handler and the database. A customer calling a vendor route is refused at the role check by middleware that guards vendor and admin routes separately. When two orders reach the last item, the first commits its stock transaction and the second is refused at the stock check.',
};

export const diagrams: Record<string, DiagramSpec> = { 'ticket-pipeline': ticketPipeline, rannaghor };
