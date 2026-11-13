/*
 * All site content lives here.
 *
 * Fields marked TODO are facts only the owner can supply. An empty string is
 * simply not shown on the built site. While running `bun run dev`, each missing
 * field shows a visible note so nothing is forgotten.
 *
 * Paragraphs marked DRAFT were written from the project repositories and need
 * the owner's confirmation before publishing.
 */

export const owner = {
  name: 'Toshifur Rahman',
  firstName: 'Toshifur',
  lastName: 'Rahman',
  role: 'Software Engineer',
  statement: 'I build backend and full-stack systems, and I design for the moment they fail.',
  focus: 'Async backends and full-stack web apps',
  location: '', // TODO: city and country
  availability: '', // TODO: e.g. "Open to full-time roles"
  email: '', // TODO: public contact address
  linkedin: '', // TODO: full LinkedIn URL
  cv: '', // TODO: put the PDF in /public and write "/cv.pdf" here
  github: 'https://github.com/ToshifurRahman',
};

export const builds = [
  {
    title: 'Async pipelines',
    text: 'Queues and workers with retries at each stage, replay from the stage that failed, and an alert to a person when retries run out.',
    proof: { label: 'Ticket-Pipeline', to: '/work/ticket-pipeline' },
  },
  {
    title: 'Full-stack web apps',
    text: 'One TypeScript codebase from the database schema to the screen, with typed API routes and role-based access.',
    proof: { label: 'RannaGhor', to: '/work/rannaghor' },
  },
  {
    title: 'Automation',
    text: 'Small tools that remove manual work, such as a script that turns a form submission into a ticked attendance record.',
    proof: null,
  },
];

export const skills = [
  { group: 'Languages', items: ['TypeScript', 'JavaScript', 'SQL', 'Python'] },
  {
    group: 'Backend',
    items: ['Bun', 'Node.js', 'Hono', 'PostgreSQL', 'Drizzle ORM', 'Redis', 'AWS SQS', 'Socket.io'],
  },
  {
    group: 'Frontend',
    items: ['React', 'TanStack Router', 'TanStack Query', 'Vite', 'Tailwind CSS'],
  },
  {
    group: 'Quality',
    items: ['Vitest', 'Playwright', 'axe accessibility checks', 'Lighthouse CI', 'GitHub Actions'],
  },
  { group: 'Platform', items: ['Docker', 'Cloudflare Workers', 'Render', 'Supabase', 'Neon'] },
];

export const moreProjects = [
  {
    title: 'Dars',
    text: 'Arabic vocabulary app with quizzes and flashcards, localised in Bengali and English. TanStack Start on Cloudflare Workers.',
  },
  {
    title: 'Attendance Automation',
    text: 'Google Apps Script that ticks a student’s attendance checkbox from a Google Form submission and touches no other cell.',
  },
  {
    title: 'HTTP Server',
    text: 'REST API with sign-in and refresh tokens. TypeScript and Drizzle ORM.',
  },
  {
    title: 'Hacker News Clone',
    text: 'Client-rendered reader with hash routing, written in plain TypeScript without a framework.',
  },
  { title: '7GUIs', text: 'The seven classic GUI programming tasks, built in React and TypeScript.' },
];

export type Lane = { label: string; nodes: string[]; note?: string; siblings?: boolean };

export type Block =
  | { kind: 'p'; text: string }
  | { kind: 'list'; items: { lead?: string; text: string }[] }
  | { kind: 'steps'; items: string[] }
  | { kind: 'facts'; items: { value: string; label: string }[] }
  | { kind: 'diagram'; caption: string; lanes: Lane[] };

export type Section = { id: string; title: string; blocks: Block[] };

export type CaseStudy = {
  slug: string;
  title: string;
  summary: string;
  meta: { label: string; value: string; href?: string }[];
  sections: Section[];
};

/* The nine sections every case study has, in this order. */
export const sectionOrder = [
  { id: 'overview', title: 'Overview' },
  { id: 'problem', title: 'Problem' },
  { id: 'motivation', title: 'Motivation' },
  { id: 'architecture', title: 'Architecture' },
  { id: 'tech-decisions', title: 'Tech decisions' },
  { id: 'challenges', title: 'Challenges' },
  { id: 'solutions', title: 'Solutions' },
  { id: 'results', title: 'Results' },
  { id: 'future', title: 'Future improvements' },
] as const;

const ticketPipeline: CaseStudy = {
  slug: 'ticket-pipeline',
  title: 'Ticket-Pipeline',
  summary:
    'A support-ticket pipeline. A customer submits a ticket, a background worker triages it with an LLM and drafts a reply, and the customer watches it happen live.',
  meta: [
    { label: 'Type', value: 'Backend system with a web app' },
    { label: 'Timeline', value: 'April to November 2026' },
    { label: 'Stack', value: 'Bun, Hono, PostgreSQL, Redis, AWS SQS, Socket.io, React' },
    { label: 'Source', value: 'GitHub', href: 'https://github.com/ToshifurRahman/ticket-pipe' },
  ],
  sections: [
    {
      id: 'overview',
      title: 'Overview',
      blocks: [
        {
          kind: 'p',
          text: 'Ticket-Pipeline takes a support request from submission to a drafted reply without a person in the loop. A worker reads the ticket, sorts it by category, priority and sentiment, then writes a customer reply, an internal note and next steps.',
        },
        {
          kind: 'p',
          text: 'The customer sees each step on their ticket page as it happens. Staff have an ops console with a live feed, alerts, and a replay button for tickets that failed.',
        },
      ],
    },
    {
      id: 'problem',
      title: 'Problem',
      blocks: [
        {
          kind: 'p',
          text: 'Most help desks answer a new ticket with “we’ll get back to you” and nothing else. The customer cannot see whether anyone has read it.',
        },
        {
          kind: 'p',
          text: 'An LLM can read and answer a ticket in seconds, but it is an unreliable part: providers time out, go down, and sometimes return output in the wrong shape. The problem was to put that part inside a workflow that still behaves correctly when it misbehaves.',
        },
      ],
    },
    {
      id: 'motivation',
      title: 'Motivation',
      blocks: [
        {
          // DRAFT: confirm this is why you built it.
          kind: 'p',
          text: 'I wanted a project that treats an LLM call as one dependency inside a properly built asynchronous system, not as a chat demo. It let me work through the parts I care about most: queues, retries, observability and privacy boundaries, each with tests.',
        },
      ],
    },
    {
      id: 'architecture',
      title: 'Architecture',
      blocks: [
        {
          kind: 'diagram',
          caption: 'How a ticket moves through the system, and the states it can be in.',
          lanes: [
            { label: 'Request', nodes: ['React app', 'Hono API', 'PostgreSQL'] },
            {
              label: 'Work',
              nodes: ['Hono API', 'SQS queue', 'Worker', 'LLM gateway', 'Primary model'],
              note: 'The gateway switches to a backup model when the primary fails or times out.',
            },
            { label: 'Ticket states', nodes: ['Queued', 'Triaging', 'Drafting', 'Completed'] },
            {
              label: 'On failure',
              nodes: ['Stage fails', 'Retry, up to 3', 'Needs attention', 'Replay by staff'],
              note: 'Replay puts the ticket back in the queue at the stage that failed.',
            },
          ],
        },
        {
          kind: 'steps',
          items: [
            'The API stores a new ticket as queued and sends a message to SQS.',
            'The worker picks it up and runs triage, then draft.',
            'Each step and outcome is written to an append-only event log and pushed live to the customer’s page and the ops feed.',
            'A stage that fails is retried up to three times. After that the ticket is marked as needing attention, ops is alerted, and staff can replay it.',
          ],
        },
      ],
    },
    {
      id: 'tech-decisions',
      title: 'Tech decisions',
      blocks: [
        {
          kind: 'list',
          items: [
            {
              lead: 'A queue and a worker, not work inside the request.',
              text: 'Submitting a ticket returns at once, and each stage can be retried on its own.',
            },
            {
              lead: 'One forced, schema-checked call per stage.',
              text: 'Each call must return a named function schema, validated with Zod. It is not an agent loop, so cost and behaviour stay predictable.',
            },
            {
              lead: 'A gateway with a primary and a backup provider.',
              text: 'Requests go through Portkey to Gemini, with Groq as the backup after a failure or a 30 second timeout.',
            },
            {
              lead: 'One function records every event.',
              text: 'It writes the event row and publishes to the live feed together, so the database and the screen cannot drift apart.',
            },
            {
              lead: 'Socket events only invalidate cached queries.',
              text: 'The browser always reads ticket data from the API, so there is one source of truth.',
            },
            {
              lead: 'A fake LLM mode at the provider boundary.',
              text: 'Validation, retries and events all still run, so the whole pipeline can be tested without a provider.',
            },
          ],
        },
      ],
    },
    {
      id: 'challenges',
      title: 'Challenges',
      blocks: [
        {
          kind: 'list',
          items: [
            {
              lead: 'Output that cannot be trusted.',
              text: 'A model can return malformed or incomplete output, and a provider can be slow or down.',
            },
            {
              lead: 'Customer content in shared channels.',
              text: 'Every ops user sees the ops feed, so ticket text and AI output must never reach it, even by accident in an error message.',
            },
            {
              lead: 'Bots spending the AI budget.',
              text: 'A public form that triggers paid LLM calls is an easy target.',
            },
            {
              lead: 'Two runtimes.',
              text: 'The app runs on Bun, but module mocking in the test runner does not work under Bun.',
            },
            {
              lead: 'Migrations on a pooled database.',
              text: 'The pooled connection lacks the session features that migration tools rely on.',
            },
          ],
        },
      ],
    },
    {
      id: 'solutions',
      title: 'Solutions',
      blocks: [
        {
          kind: 'list',
          items: [
            {
              lead: 'Treat bad output as a failure.',
              text: 'Output that fails validation is recorded as an invalid response and retried like any other failure. After three tries the ticket goes to a person, who can replay it from the stage that failed.',
            },
            {
              lead: 'Build public data field by field.',
              text: 'Public views, the ops feed and alerts list their fields explicitly. Alerts carry fixed reason codes, never error text. Guard tests fail if any other file publishes to the ops room.',
            },
            {
              lead: 'Four checks in a fixed order.',
              text: 'Body validation, a per-address hourly limit, Cloudflare Turnstile, then a daily cap. A refused request creates no row and costs no LLM call.',
            },
            {
              lead: 'Run tests on Node, the app on Bun.',
              text: 'Vitest runs on Node so mocking works. Playwright tests run against the built app.',
            },
            {
              lead: 'Two connection strings.',
              text: 'Migrations use the direct database URL. The running app uses the pooled one.',
            },
          ],
        },
      ],
    },
    {
      id: 'results',
      title: 'Results',
      blocks: [
        {
          kind: 'facts',
          items: [
            { value: '119', label: 'test files across the API, worker, web app and end-to-end suite' },
            { value: '266', label: 'commits since April 2026' },
            { value: '90+', label: 'Lighthouse score required in CI on every crawlable page, in all four categories' },
            { value: '10', label: 'Redis commands per ticket, and none while idle' },
          ],
        },
        {
          kind: 'p',
          text: 'Accessibility is checked automatically on every route. Every provider call is recorded with its outcome, latency and token count, and summarised in the ops console. The app ships as one Docker image and deploys only after CI passes.',
        },
      ],
    },
    {
      id: 'future',
      title: 'Future improvements',
      blocks: [
        {
          // DRAFT: replace with your own plans.
          kind: 'list',
          items: [
            {
              text: 'Run the API and the worker as separate services so they scale on their own. The image already supports it.',
            },
            { text: 'Let staff edit a drafted reply before it is sent.' },
            { text: 'Track reply quality over time, not only whether a call succeeded.' },
          ],
        },
      ],
    },
  ],
};

const rannaghor: CaseStudy = {
  slug: 'rannaghor',
  title: 'RannaGhor',
  summary:
    'A multi-vendor e-commerce platform with three roles: customers who shop, vendors who sell, and admins who approve and manage.',
  meta: [
    { label: 'Type', value: 'Full-stack web app' },
    { label: 'Timeline', value: 'January to March 2026' },
    { label: 'Stack', value: 'Bun, React 19, TanStack Router, Hono, Better Auth, Drizzle, PostgreSQL' },
    {
      label: 'Source',
      value: 'GitHub',
      href: 'https://github.com/ToshifurRahman/e-commerce-website',
    },
  ],
  sections: [
    {
      id: 'overview',
      title: 'Overview',
      blocks: [
        {
          kind: 'p',
          text: 'RannaGhor is an online marketplace. Customers browse a catalogue, search, save items to a wishlist, fill a cart and place orders. Vendors register, wait for approval, then manage their own products. Admins approve vendors and run the platform from an admin panel.',
        },
        {
          kind: 'p',
          text: 'It also covers product bundles, coupons, ratings, notifications and promotional banners.',
        },
      ],
    },
    {
      id: 'problem',
      title: 'Problem',
      blocks: [
        {
          kind: 'p',
          text: 'A marketplace has three kinds of user working on the same data with different rights. A vendor must be able to change their own products and nobody else’s. A customer must never reach a vendor or admin action. Stock and orders must stay correct while all of them act at once.',
        },
      ],
    },
    {
      id: 'motivation',
      title: 'Motivation',
      blocks: [
        {
          // DRAFT: confirm this is why you built it.
          kind: 'p',
          text: 'I wanted to build a complete product from end to end, not one feature: sign-in, catalogue, cart, orders, payments and an admin panel, all in one typed codebase.',
        },
      ],
    },
    {
      id: 'architecture',
      title: 'Architecture',
      blocks: [
        {
          kind: 'diagram',
          caption: 'One monorepo: two apps that share three packages.',
          lanes: [
            { label: 'Request', nodes: ['React web app', 'Hono API', 'Drizzle ORM', 'PostgreSQL'] },
            {
              label: 'Every API call',
              nodes: ['Security and CSRF', 'Rate limit', 'Session', 'Role check', 'Route handler'],
            },
            {
              label: 'Shared packages',
              nodes: ['auth', 'db', 'env'],
              siblings: true,
              note: 'Both apps import the same sign-in setup, database schema and validated environment.',
            },
          ],
        },
        {
          kind: 'p',
          text: 'The API is split into 21 route modules. Routes are defined with OpenAPI schemas, so requests and responses are validated and the API documentation is generated from the same definitions.',
        },
      ],
    },
    {
      id: 'tech-decisions',
      title: 'Tech decisions',
      blocks: [
        {
          kind: 'list',
          items: [
            {
              lead: 'A Bun monorepo with shared packages.',
              text: 'The web app and the API use the same schema, sign-in setup and environment checks, so they cannot disagree.',
            },
            {
              lead: 'Hono with typed OpenAPI routes.',
              text: 'One definition gives validation, types and documentation.',
            },
            {
              lead: 'Drizzle ORM on PostgreSQL.',
              text: 'The schema is written in TypeScript and split into modules for products, vendors, orders, coupons and the rest.',
            },
            {
              lead: 'Better Auth for sign-in.',
              text: 'Email and password with verification, phone one-time codes, Google sign-in, and sessions with a “remember me” option.',
            },
            {
              lead: 'Environment variables validated at start-up.',
              text: 'A missing or wrong value stops the app at once and names the variable.',
            },
            {
              lead: 'File-based routing with TanStack Router, server state with TanStack Query.',
              text: 'Routes are type-checked, and data fetching and caching follow one pattern.',
            },
          ],
        },
      ],
    },
    {
      id: 'challenges',
      title: 'Challenges',
      blocks: [
        {
          kind: 'list',
          items: [
            {
              lead: 'Privilege escalation.',
              text: 'With three roles, one missing check lets a customer act as a vendor or an admin.',
            },
            {
              lead: 'Sign-in abuse.',
              text: 'Limiting attempts by address alone does not stop an attacker who targets one account from many addresses.',
            },
            {
              lead: 'State leaking between users.',
              text: 'Cart and wishlist contents showed across accounts on a shared browser.',
            },
            {
              lead: 'Stock under concurrent orders.',
              text: 'Two orders for the last item must not both succeed.',
            },
          ],
        },
      ],
    },
    {
      id: 'solutions',
      title: 'Solutions',
      blocks: [
        {
          kind: 'list',
          items: [
            {
              lead: 'Role checks as middleware, proven by tests.',
              text: 'Separate middleware guards vendor and admin routes. Dedicated test suites cover authorisation, privilege escalation, session security and database row-level policies.',
            },
            {
              lead: 'Rate limits per account.',
              text: 'Sign-in and password reset are limited per account as well as per address.',
            },
            {
              lead: 'Cart and wishlist scoped to the signed-in user.',
              text: 'The wishlist is stored per user, a guest’s items move to their account at sign-in, and cart and coupon state are cleared at sign-out.',
            },
            {
              lead: 'Stock changes inside transactions.',
              text: 'An order locks the product rows, checks stock and reduces it in one database transaction, with tests for the concurrent case.',
            },
          ],
        },
      ],
    },
    {
      id: 'results',
      title: 'Results',
      blocks: [
        {
          kind: 'facts',
          items: [
            { value: '64', label: 'commits in under two months, 59 of them merged pull requests' },
            { value: '21', label: 'API route modules' },
            { value: '3', label: 'roles, each with its own area and tested access rules' },
            { value: '15', label: 'test files across the API and the web app' },
          ],
        },
        {
          kind: 'p',
          text: 'The platform covers the full path from sign-up to a managed order, with a vendor dashboard and an admin panel.',
        },
      ],
    },
    {
      id: 'future',
      title: 'Future improvements',
      blocks: [
        {
          // DRAFT: replace with your own plans.
          kind: 'list',
          items: [
            { text: 'Take the payment gateway from configured to live, with tests against its sandbox.' },
            { text: 'Add browser end-to-end tests for the checkout path.' },
            { text: 'Give vendors sales reports in their dashboard.' },
          ],
        },
      ],
    },
  ],
};

export const caseStudies: CaseStudy[] = [ticketPipeline, rannaghor];
