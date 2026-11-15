import { securityCheckLabel } from './content';
import type { DiagramSpec, Edge, Node, Step } from './Diagram';

/*
 * The two case studies' flowcharts, as data.
 *
 * The engine (src/Diagram.tsx) draws them; nothing here states a new fact. The
 * parts, the states a ticket can be in, the retry-up-to-3, the replay by staff,
 * the gateway's switch to a backup model and RannaGhor's request lane with its
 * stack transaction are all from src/content.ts.
 *
 * Layout is data too, but as a *grid position* rather than a pixel: a node says
 * which row and column it sits in, for the desktop layout and for the vertical
 * one, and the engine turns that into geometry. Hand-placed coordinates were the
 * first attempt and they collided — a box's label spilled past its own border and
 * edges ran through boxes — because every position also had to agree with every
 * label's width. A grid cannot disagree with itself.
 */

type Pos = { row: number; col: number };

const n = (id: string, name: string, detail: string | undefined, at: Pos, vat: Pos, extra: Partial<Node> = {}): Node => ({
  id,
  name,
  detail,
  at,
  vat,
  ...extra,
});

/* ---------------------------------------------------------------- Ticket-Pipeline
 *
 * Desktop reads left to right in three bands: the request and work flow on row 0,
 * the ticket's own states on the right of it at the same height (a state is a
 * different kind of thing, so it gets its own rail below), and the failure path on
 * row 1.
 *
 * The vertical layout is the same graph read top to bottom, in one column, which
 * is what a phone can hold.
 */

const TP_NODES: Node[] = [
  n('react', 'React app', 'The ticket page', { row: 0, col: 0 }, { row: 0, col: 0 }),
  n('api', 'Hono API', 'Stores the ticket', { row: 0, col: 1 }, { row: 1, col: 0 }),
  n('queue', 'SQS queue', undefined, { row: 0, col: 2 }, { row: 2, col: 0 }),
  n('worker', 'Worker', 'Triage, then draft', { row: 0, col: 3 }, { row: 3, col: 0 }),
  n('gateway', 'LLM gateway', 'Portkey', { row: 0, col: 4 }, { row: 4, col: 0 }),
  n('primary', 'Primary model', 'Gemini', { row: 0, col: 5 }, { row: 5, col: 0 }),
  /* The branch: it hangs under the gateway it leaves from. */
  n('backup', 'Backup model', 'Groq, after a timeout', { row: 1, col: 5 }, { row: 6, col: 0, }, { span: 2 }),

  /* The ticket's states, on their own rail under the work flow. */
  n('queued', 'Queued', undefined, { row: 2, col: 0 }, { row: 7, col: 0 }, { state: true }),
  n('triaging', 'Triaging', undefined, { row: 2, col: 1 }, { row: 8, col: 0 }, { state: true }),
  n('drafting', 'Drafting', undefined, { row: 2, col: 2 }, { row: 9, col: 0 }, { state: true }),
  n('completed', 'Completed', undefined, { row: 2, col: 3 }, { row: 10, col: 0 }, { state: true }),

  /* The failure path, on its own band so it never crosses the happy path. */
  n('attention', 'Needs attention', 'Ops alerted', { row: 3, col: 3 }, { row: 11, col: 0 }, { span: 2 }),
  n('replay', 'Replay by staff', 'From the failed stage', { row: 3, col: 5 }, { row: 12, col: 0 }, { span: 2 }),
];

const TP_EDGES: Edge[] = [
  { id: 'submit', from: 'react', to: 'api', label: 'submit' },
  { id: 'enqueue', from: 'api', to: 'queue', label: 'enqueue' },
  { id: 'consume', from: 'queue', to: 'worker', label: 'pick up' },
  { id: 'call', from: 'worker', to: 'gateway', label: 'one call per stage' },
  { id: 'toPrimary', from: 'gateway', to: 'primary' },
  { id: 'toBackup', from: 'gateway', to: 'backup', branch: true, label: 'fails or times out' },
  { id: 'retry', from: 'primary', to: 'attention', branch: true, label: 'fails 3 times' },
  { id: 'escalate', from: 'attention', to: 'replay', label: 'staff' },
  { id: 'replayToQueue', from: 'replay', to: 'queue', branch: true, label: 'to the failed stage' },
  { id: 'q2t', from: 'queued', to: 'triaging' },
  { id: 't2d', from: 'triaging', to: 'drafting' },
  { id: 'd2c', from: 'drafting', to: 'completed' },
];

const tpRuns: Step[][] = [
  /* One: a ticket all the way to Completed. */
  [
    { edge: 'submit', status: 'New ticket submitted', nodes: { react: 'lit' } },
    { edge: 'enqueue', status: 'Stored as queued, a message on SQS', nodes: { react: 'done', api: 'done', queue: 'lit', queued: 'lit' } },
    { edge: 'consume', status: 'The worker picks it up', nodes: { queue: 'done' } },
    { edge: 'call', status: 'Triaging: category, priority, sentiment', nodes: { worker: 'done', triaging: 'lit' } },
    { edge: 'toPrimary', status: 'Drafting the reply', nodes: { gateway: 'done', primary: 'done', triaging: 'done', drafting: 'lit' } },
    { dur: 1500, status: 'Completed: the customer sees it live', tone: 'done', nodes: { drafting: 'done', completed: 'done' } },
  ],
  /* Two: the primary fails or times out and the gateway switches. */
  [
    { edge: 'submit', status: 'New ticket submitted', nodes: { react: 'lit' } },
    { edge: 'enqueue', status: 'Stored as queued, a message on SQS', nodes: { react: 'done', api: 'done', queue: 'done', queued: 'done', triaging: 'lit' } },
    { edge: 'consume', status: 'The worker picks it up', nodes: { queue: 'done' } },
    { edge: 'call', status: 'Triaging with the primary model', nodes: { worker: 'done' } },
    { edge: 'toPrimary', status: 'The primary model times out', tone: 'fail', failEdge: true, nodes: { primary: 'fail' } },
    { edge: 'toBackup', status: 'The gateway switches to the backup model', nodes: { primary: 'off', backup: 'lit', drafting: 'lit' } },
    { dur: 1500, status: 'Completed on the backup model', tone: 'done', nodes: { backup: 'done', drafting: 'done', completed: 'done' } },
  ],
  /* Three: a stage fails three times, the ticket needs attention, staff replay it
     from the stage that failed. */
  [
    { edge: 'submit', status: 'New ticket submitted', nodes: { react: 'lit' } },
    { edge: 'enqueue', status: 'Stored as queued', nodes: { react: 'done', api: 'done', queue: 'done', queued: 'done', triaging: 'lit' } },
    { edge: 'consume', status: 'The worker picks it up', nodes: { queue: 'done' } },
    { edge: 'call', status: 'Drafting the reply', nodes: { worker: 'done', triaging: 'done', drafting: 'lit' } },
    { edge: 'toPrimary', status: 'Retry 1 of 3', tone: 'fail', failEdge: true, nodes: { primary: 'fail' } },
    { dur: 700, status: 'Retry 2 of 3', tone: 'fail', nodes: { primary: 'fail' } },
    { dur: 700, status: 'Retry 3 of 3', tone: 'fail', nodes: { primary: 'fail' } },
    { edge: 'retry', status: 'The retries are used up', tone: 'fail', nodes: { attention: 'fail', drafting: 'off' } },
    { dur: 1300, status: 'Needs attention: ops alerted', tone: 'fail' },
    { edge: 'escalate', status: 'Staff replay the ticket', tone: 'run', nodes: { attention: 'lit' } },
    { edge: 'replayToQueue', status: 'Back to the queue at the stage that failed', nodes: { attention: 'off', queue: 'lit' } },
    { dur: 1300, status: 'Drafting: replayed from the failed stage', tone: 'done', nodes: { queue: 'done', drafting: 'done', completed: 'done' } },
  ],
];

const ticketPipeline: DiagramSpec = {
  id: 'ticket-pipeline',
  title: 'Ticket-Pipeline',
  href: '/work/ticket-pipeline',
  note: 'A demo ticket through the system’s real states',
  /* Columns are counted from the nodes themselves, so the viewBox is derived. */
  rows: 4,
  cols: 6,
  nodes: TP_NODES,
  edges: TP_EDGES,
  runs: tpRuns,
  still: {
    edges: ['submit', 'enqueue', 'consume', 'call', 'toPrimary', 'q2t', 't2d', 'd2c'],
    nodes: {
      react: 'done', api: 'done', queue: 'done', worker: 'done', gateway: 'done', primary: 'done',
      queued: 'done', triaging: 'done', drafting: 'done', completed: 'done',
    },
  },
  caption:
    'Flowchart of Ticket-Pipeline. A React app submits a ticket to the Hono API, which stores it as queued and puts a message on SQS. A worker picks it up and makes one schema-checked call per stage through the LLM gateway: triage, then draft. The gateway uses Gemini and switches to Groq, the backup model, when the primary fails or times out. A stage that fails is retried up to three times; after that the ticket needs attention, ops is alerted, and staff can replay it from the stage that failed. The ticket moves queued, triaging, drafting, completed, and each step is pushed live to the customer’s page and the ops feed.',
};

/* ---------------------------------------------------------------- RannaGhor
 *
 * One row of checks, the transaction at the end, and the two refusals hanging
 * below the point they are refused at.
 */

const RG_NODES: Node[] = [
  n('security', securityCheckLabel, 'Every API call', { row: 0, col: 0 }, { row: 0, col: 0 }),
  n('rate', 'Rate limit', 'Per account', { row: 0, col: 1 }, { row: 1, col: 0 }),
  n('session', 'Session', 'Better Auth', { row: 0, col: 2 }, { row: 2, col: 0 }),
  n('role', 'Role check', 'Vendor, admin, customer', { row: 0, col: 3 }, { row: 3, col: 0 }),
  n('handler', 'Route handler', '21 route modules', { row: 0, col: 4 }, { row: 4, col: 0 }),
  n('postgres', 'PostgreSQL', 'Drizzle', { row: 0, col: 5 }, { row: 5, col: 0 }),
  n('tx', 'One transaction', 'Lock, check, reduce', { row: 0, col: 6 }, { row: 6, col: 0 }),
  n('refuseRole', '403: refused', 'At the role check', { row: 1, col: 3 }, { row: 7, col: 0 }, { span: 2 }),
  n('refuseStock', 'Stock refused', 'The second order', { row: 1, col: 5 }, { row: 8, col: 0 }, { span: 2 }),
];

const RG_EDGES: Edge[] = [
  { id: 'sec', from: 'security', to: 'rate', label: 'pass' },
  { id: 'lim', from: 'rate', to: 'session' },
  { id: 'sess', from: 'session', to: 'role' },
  { id: 'authorise', from: 'role', to: 'handler', label: 'allowed' },
  { id: 'query', from: 'handler', to: 'postgres' },
  { id: 'commit', from: 'postgres', to: 'tx', label: 'an order' },
  { id: 'refuse', from: 'role', to: 'refuseRole', branch: true, label: 'vendor route' },
  { id: 'stockOut', from: 'tx', to: 'refuseStock', branch: true, label: 'stock gone' },
];

const rgEnter: Step[] = [
  { edge: 'sec', status: 'A request arrives', nodes: { security: 'lit' } },
  { edge: 'lim', status: 'Security and CSRF checks pass', nodes: { security: 'done', rate: 'lit' } },
  { edge: 'sess', status: 'Within the rate limit, session read', nodes: { rate: 'done', session: 'lit' } },
];

const rgRuns: Step[][] = [
  [
    ...rgEnter,
    { edge: 'authorise', status: 'Role check: customer', nodes: { session: 'done', role: 'lit' } },
    { edge: 'query', status: 'An order is placed', nodes: { role: 'done', handler: 'lit' } },
    { edge: 'commit', status: 'Stock locked, checked and reduced in one transaction', nodes: { handler: 'done', postgres: 'lit', tx: 'lit' } },
    { dur: 1700, status: 'Order committed', tone: 'done', nodes: { postgres: 'done', tx: 'done' } },
  ],
  [
    ...rgEnter,
    { edge: 'authorise', status: 'Role check: a customer calls a vendor route', nodes: { session: 'done', role: 'done' } },
    { dur: 400, status: 'Role check fails', tone: 'fail', nodes: { role: 'fail' } },
    { edge: 'refuse', status: 'Refused by the vendor route’s own middleware', tone: 'fail', failEdge: true, nodes: { refuseRole: 'fail' } },
    { dur: 1700, status: '403: request refused at the role check', tone: 'fail' },
  ],
  [
    ...rgEnter,
    { edge: 'authorise', status: 'Role check: customer', nodes: { session: 'done', role: 'lit' } },
    { edge: 'query', status: 'An order is placed', nodes: { role: 'done', handler: 'lit' } },
    { edge: 'commit', status: 'The next order locks the product rows', nodes: { handler: 'done', postgres: 'lit', tx: 'lit' } },
    { dur: 700, status: 'Stock is gone: the transaction is refused', tone: 'fail', nodes: { tx: 'fail' } },
    { edge: 'stockOut', status: 'The second order is refused at the stock check', tone: 'fail', failEdge: true, nodes: { postgres: 'fail', refuseStock: 'fail' } },
    { dur: 1700, status: 'Only one order for the last item succeeds', tone: 'fail' },
  ],
];

const rannaghor: DiagramSpec = {
  id: 'rannaghor',
  title: 'RannaGhor',
  href: '/work/rannaghor',
  note: 'A customer’s request through every check it meets',
  rows: 2,
  cols: 7,
  nodes: RG_NODES,
  edges: RG_EDGES,
  runs: rgRuns,
  still: {
    edges: ['sec', 'lim', 'sess', 'authorise', 'query', 'commit'],
    nodes: {
      security: 'done', rate: 'done', session: 'done', role: 'done', handler: 'done', postgres: 'done', tx: 'done',
    },
  },
  caption:
    'Flowchart of how a RannaGhor request moves. Every API call passes a security and CSRF check, a rate limit, the session and a role check before it reaches a route handler and PostgreSQL. A customer calling a vendor route is refused at the role check by middleware that guards vendor and admin routes separately. An order locks the product rows, checks stock and reduces it in one database transaction; when two orders reach the last item, the first commits and the second is refused at the stock check.',
};

export const diagrams: Record<string, DiagramSpec> = { 'ticket-pipeline': ticketPipeline, rannaghor };
