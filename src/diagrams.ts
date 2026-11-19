import { securityCheckLabel } from './content';
import type { Cluster, DiagramSpec, Edge, Node, Step } from './Diagram';

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
type Vat = { row: number; track: number };

const n = (id: string, name: string, detail: string | undefined, at: Pos, vat: Vat, extra: Partial<Node> = {}): Node => ({
  id,
  name,
  detail,
  at,
  vat,
  ...extra,
});

/* ---------------------------------------------------------------- Relay
 *
 * Desktop is five bands, each on its own row so no edge crosses a box:
 *
 *   0  the spine: what a ticket passes through
 *   1  the backup model, on a branch under the gateway
 *   2  the live feed: the log, the customer's page and the ops feed
 *   3  the failure path, fed from the worker
 *   4  the ticket's own states, on their own rail
 *
 * Vertical is the same graph down the page: the spine in track 0, the branches
 * (backup, live feed, failure) indented in track 1 so they do not chain into the
 * stage after them, and the states as a rail at the end.
 */

const RELAY_NODES: Node[] = [
  /* Band 0: the spine. */
  /* The spine wraps after three, so the graph stays inside the panel's width and
     the labels stay at full size. `down-right` carries the flow to the next row. */
  n('react', 'React app', 'The ticket page', { row: 0, col: 0 }, { row: 0, track: 0 }),
  n('api', 'Hono API', 'Stores the ticket', { row: 0, col: 1 }, { row: 1, track: 0 }),
  n('queue', 'SQS queue', 'Messages', { row: 0, col: 2 }, { row: 2, track: 0 }),
  n('worker', 'Worker', 'Runs the stages', { row: 1, col: 0 }, { row: 3, track: 0 }),
  n('gateway', 'LLM gateway', 'Portkey', { row: 1, col: 1 }, { row: 4, track: 0 }),
  n('primary', 'Primary model', 'Gemini', { row: 1, col: 2 }, { row: 5, track: 0 }),

  /* Band 1: the branch the gateway takes when the primary fails. */
  n('backup', 'Backup model', 'Groq', { row: 2, col: 1 }, { row: 6, track: 1 }),

  /* Band 2: the live feed. Each step is written to the log and pushed out. */
  n('eventLog', 'Event log', 'Append only', { row: 3, col: 0 }, { row: 7, track: 1 }),
  n('customerPage', 'Customer’s page', 'Live', { row: 3, col: 1 }, { row: 8, track: 1 }),
  n('opsFeed', 'Ops feed', 'Staff console', { row: 3, col: 2 }, { row: 9, track: 1 }),

  /* Band 4: the failure path. */
  n('stageFails', 'Stage fails', 'Invalid response', { row: 4, col: 0 }, { row: 10, track: 1 }),
  n('retry', 'Retry, up to 3', 'On its own', { row: 4, col: 1 }, { row: 11, track: 1 }),
  n('attention', 'Needs attention', 'Ops alerted', { row: 4, col: 2 }, { row: 12, track: 1 }),
  n('replay', 'Replay by staff', 'From the failed stage', { row: 5, col: 0 }, { row: 13, track: 1 }),

  /* Band 5: the ticket's states, on their own rail. */
  n('queued', 'Queued', undefined, { row: 6, col: 0 }, { row: 15, track: 0 }, { state: true }),
  n('triaging', 'Triaging', undefined, { row: 6, col: 1 }, { row: 15, track: 1 }, { state: true }),
  n('drafting', 'Drafting', undefined, { row: 6, col: 2 }, { row: 16, track: 0 }, { state: true }),
  n('completed', 'Completed', undefined, { row: 7, col: 0 }, { row: 16, track: 1 }, { state: true }),
];

const RELAY_EDGES: Edge[] = [
  /* The spine. */
  { id: 'submit', from: 'react', to: 'api', label: 'submit', route: 'right' },
  { id: 'enqueue', from: 'api', to: 'queue', label: 'enqueue', route: 'right' },
  { id: 'consume', from: 'queue', to: 'worker', label: 'pick up', route: 'down-direct' },
  { id: 'call', from: 'worker', to: 'gateway', label: 'one call', route: 'right' },
  { id: 'toPrimary', from: 'gateway', to: 'primary', route: 'right' },

  /* The gateway's branch: straight down to the model it fails over to. */
  { id: 'toBackup', from: 'gateway', to: 'backup', label: 'on fail', branch: true, route: 'down' },

  /* The live feed. */
  { id: 'log', from: 'worker', to: 'eventLog', label: 'each step', route: 'down-left' },
  { id: 'toPage', from: 'eventLog', to: 'customerPage', label: 'push', route: 'right' },
  { id: 'toOps', from: 'customerPage', to: 'opsFeed', route: 'right' },

  /* The failure path and the replay are named short arrows on desktop. Their only
     other routes were a 226-unit loop down the left margin and an 849-unit return
     around the whole graph, which the owner read as unnecessary U-loops. On the
     vertical layout the failure edge stays the entry arrow under its heading and
     the replay keeps its stub sentence. */
  {
    id: 'fails',
    from: 'worker',
    to: 'stageFails',
    label: 'stage fails',
    branch: true,
    route: 'loop-side-left',
    desktopStub: true,
    desktopStubText: true,
  },
  { id: 'retry', from: 'stageFails', to: 'retry', label: 'up to 3', route: 'right' },
  { id: 'again', from: 'retry', to: 'attention', route: 'right' },
  { id: 'escalate', from: 'attention', to: 'replay', label: 'staff', route: 'down-direct' },
  {
    id: 'replayToQueue',
    from: 'replay',
    to: 'queue',
    label: 'to the failed stage',
    branch: true,
    route: 'loop-side',
    stub: 'back to the SQS queue, at the stage that failed',
    desktopStub: true,
    desktopStubText: true,
  },

  /* The state rail. */
  { id: 'q2t', from: 'queued', to: 'triaging', route: 'right' },
  { id: 't2d', from: 'triaging', to: 'drafting', route: 'down-left' },
  { id: 'd2c', from: 'drafting', to: 'completed', route: 'down-direct' },
];

const relayRuns: Step[][] = [
  /* One: a ticket all the way to Completed. */
  [
    { edge: 'submit', status: 'New ticket submitted', nodes: { react: 'lit' } },
    { edge: 'enqueue', status: 'Stored as queued, a message on SQS', nodes: { react: 'done', api: 'done', queue: 'lit', queued: 'lit' } },
    { edge: 'consume', status: 'The worker picks it up', nodes: { queue: 'done' } },
    { edge: 'log', status: 'Each step written to the event log', nodes: { worker: 'lit', eventLog: 'lit', triaging: 'lit' } },
    { edge: 'toPage', status: 'Pushed live to the customer’s page', nodes: { eventLog: 'done', customerPage: 'done' } },
    { edge: 'toOps', status: 'And to the ops feed', nodes: { opsFeed: 'done' } },
    { edge: 'call', status: 'One schema-checked call per stage', nodes: { worker: 'done' } },
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
    { edge: 'fails', status: 'The retries are used up', tone: 'fail', nodes: { stageFails: 'fail', drafting: 'off' } },
    { edge: 'retry', status: 'Retried up to 3 times', tone: 'fail', nodes: { retry: 'fail' } },
    { edge: 'again', status: 'Needs attention: ops alerted', tone: 'fail', nodes: { attention: 'fail' } },
    { edge: 'escalate', status: 'Staff replay the ticket', tone: 'run', nodes: { replay: 'lit' } },
    { edge: 'replayToQueue', status: 'Back to the queue at the stage that failed', nodes: { attention: 'off', queue: 'lit' } },
    { dur: 1300, status: 'Drafting: replayed from the failed stage', tone: 'done', nodes: { queue: 'done', drafting: 'done', completed: 'done' } },
  ],
];

/* The vertical layout's branch groups. Each is headed by where it starts, so the
   entry edge from the spine is the heading rather than a line: a line from a spine box
   to a group three rows below can only run through the boxes between them. */
const RELAY_CLUSTERS: Cluster[] = [
  { id: 'backup', heading: 'From the LLM gateway', from: 'gateway', nodes: ['backup'], branch: true },
  { id: 'feed', heading: 'Every step', from: 'worker', nodes: ['eventLog', 'customerPage', 'opsFeed'] },
  {
    id: 'failure',
    heading: 'When a stage fails',
    from: 'worker',
    nodes: ['stageFails', 'retry', 'attention', 'replay'],
    branch: true,
  },
];

const relay: DiagramSpec = {
  id: 'relay',
  title: 'Relay',
  href: '/work/relay',
  note: 'A demo ticket through the system’s real states',
  nodes: RELAY_NODES,
  edges: RELAY_EDGES,
  clusters: RELAY_CLUSTERS,
  runs: relayRuns,
  still: {
    edges: ['submit', 'enqueue', 'consume', 'call', 'toPrimary', 'log', 'toPage', 'toOps', 'q2t', 't2d', 'd2c'],
    nodes: {
      react: 'done', api: 'done', queue: 'done', worker: 'done', gateway: 'done', primary: 'done',
      eventLog: 'done', customerPage: 'done', opsFeed: 'done',
      queued: 'done', triaging: 'done', drafting: 'done', completed: 'done',
    },
  },
  caption:
    'Flowchart of Relay. A React app submits a ticket to the Hono API, which stores it as queued and puts a message on SQS. A worker picks it up and makes one schema-checked call per stage through the LLM gateway: triage, then draft. The gateway uses Gemini and switches to Groq, the backup model, when the primary fails or times out. A stage that fails is retried up to three times; after that the ticket needs attention, ops is alerted, and staff can replay it from the stage that failed. The ticket moves queued, triaging, drafting, completed, and each step is pushed live to the customer’s page and the ops feed.',
};

/* ---------------------------------------------------------------- RannaGhor
 *
 * One row of checks, the transaction at the end, and the two refusals below the
 * point they are refused at: the stock refusal straight under the transaction,
 * the role refusal one column to the right of the check that refuses it.
 */

const RG_NODES: Node[] = [
  n('security', securityCheckLabel, 'Every response', { row: 0, col: 0 }, { row: 0, track: 0 }),
  n('session', 'Session', 'Better Auth', { row: 0, col: 1 }, { row: 1, track: 0 }),
  n('role', 'Role check', 'Vendor, admin, customer', { row: 0, col: 2 }, { row: 2, track: 0 }),
  n('handler', 'Route handler', '21 route modules', { row: 1, col: 0 }, { row: 3, track: 0 }),
  n('postgres', 'PostgreSQL', 'Drizzle', { row: 1, col: 1 }, { row: 4, track: 0 }),
  n('tx', 'One transaction', 'Lock, check, reduce', { row: 1, col: 2 }, { row: 5, track: 0 }),
  /* The refusals are branches, so they sit in the indented track, after the spine:
     they are what happens instead of the next step, not a step after it. */
  /* The sublabel carries the fact the heading cannot: who is refused, and on what.
     Both are the study's own words — `src/content.ts` says "A customer must never
     reach a vendor or admin action", and the caption says "A customer calling a
     vendor route is refused at the role check by middleware that guards vendor and
     admin routes separately". The heading says where the group starts; repeating
     "at the role check" under it was the same sentence twice. */
  /* The refusals sit below the point they are refused at, each in its own column, so
     neither edge has to run back across the graph. They used to sit at columns 0 and 1
     while their sources were at 3 and 2, which forced two long leftward runs from one
     box: `refuse` and `authorise` both leave Role check, and `refuse`'s run cut
     `authorise`'s final approach at (104,114). A refusal is "what happens instead of
     the next step", and the step it replaces is the one below its own check, so this is
     also the truer reading order. */
  n('refuseRole', '403: refused', 'Customer, vendor route', { row: 2, col: 3 }, { row: 6, track: 1 }),
  n('refuseStock', 'Stock refused', 'The second order', { row: 2, col: 2 }, { row: 7, track: 1 }),
];

const RG_EDGES: Edge[] = [
  { id: 'sec', from: 'security', to: 'session', label: 'pass', route: 'right' },
  { id: 'sess', from: 'session', to: 'role', route: 'right' },
  { id: 'authorise', from: 'role', to: 'handler', label: 'allowed', route: 'down-direct' },
  { id: 'query', from: 'handler', to: 'postgres', route: 'right' },
  { id: 'commit', from: 'postgres', to: 'tx', label: 'an order', route: 'right' },
  /* `stockOut` is one straight drop: its target sits under the box that refuses it.
     `refuse` is not: Role check is in column 2 and its target in column 3, so the
     edge drops and turns right into the refusal's own column. Both used to run
     across the graph from columns 0 and 1, which put `refuse`'s run across
     `authorise`'s final approach at (104,114). With each target in its own column
     there is no corridor left to share. */
  { id: 'refuse', from: 'role', to: 'refuseRole', label: 'vendor route', branch: true, route: 'down-direct' },
  { id: 'stockOut', from: 'tx', to: 'refuseStock', label: 'stock gone', branch: true, route: 'down' },
];

const rgEnter: Step[] = [
  { edge: 'sec', status: 'A request arrives', nodes: { security: 'lit' } },
  { edge: 'sess', status: 'Security headers set, session read', nodes: { security: 'done', session: 'lit' } },
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

const RG_CLUSTERS: Cluster[] = [
  { id: 'roleRefused', heading: 'Refused at the role check', from: 'role', nodes: ['refuseRole'], branch: true },
  { id: 'stock', heading: 'The order', from: 'tx', nodes: ['refuseStock'], branch: true },
];

const rannaghor: DiagramSpec = {
  id: 'rannaghor',
  title: 'RannaGhor',
  href: '/work/rannaghor',
  note: 'A customer’s request through the checks it meets',
  nodes: RG_NODES,
  edges: RG_EDGES,
  clusters: RG_CLUSTERS,
  runs: rgRuns,
  still: {
    edges: ['sec', 'sess', 'authorise', 'query', 'commit'],
    nodes: {
      security: 'done', session: 'done', role: 'done', handler: 'done', postgres: 'done', tx: 'done',
    },
  },
  caption:
    'Flowchart of how a RannaGhor request moves. Security headers are set on every response, and a signed-in request passes the session and a role check before it reaches a route handler and PostgreSQL. A customer calling a vendor route is refused at the role check by middleware that guards vendor and admin routes separately. An order locks the product rows, checks stock and reduces it in one database transaction; when two orders reach the last item, the first commits and the second is refused at the stock check.',
};

export const diagrams: Record<string, DiagramSpec> = { relay, rannaghor };
