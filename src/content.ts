/*
 * All site content lives here.
 *
 * Fields marked TODO are facts only the owner can supply. An empty string is
 * simply not shown on the built site. While running `bun run dev`, each missing
 * field shows a visible note so nothing is forgotten.
 */

/* The site's deployed origin, with no trailing slash (for example
   "https://toshifur.dev"). Empty until the owner names the host: while it is
   empty the build emits no canonical link, no og:url and a path-only share
   image, and when it is set those three become absolute with no other change.
   One constant, read only by the pre-render, so a host is never guessed. */
export const siteOrigin = '';

export const owner = {
  name: 'Toshifur Rahman',
  firstName: 'Toshifur',
  lastName: 'Rahman',
  role: 'Software Engineer',
  headline: 'Web Developer at Taibah Academy · M.Engg. CSE, CUET',
  summary:
    'Toshifur Rahman is a software engineer in Chattogram, Bangladesh, who builds backend and full-stack web systems and is completing a master’s in computer science at CUET.',
  statement: 'I build backend and full-stack systems, and I design for the moment they fail.',
  /* The closing clause of the statement, set in full ink on the home page while
     the rest of the motto stays in the muted tone. */
  statementEmphasis: 'and I design for the moment they fail.',
  now: 'Web Developer at Taibah Academy',
  mainStack: 'TypeScript, Bun, PostgreSQL, React',
  location: 'Chattogram, Bangladesh',
  availability: '', // TODO: e.g. "Open to full-time roles"
  email: 'tfrtasin11@gmail.com',
  linkedin: 'https://www.linkedin.com/in/toshifur-rahman',
  cv: '/cv/Toshifur-Rahman-CV.pdf',
  github: 'https://github.com/ToshifurRahman',
};

/*
 * The proof row under the statement. Every figure is from the CV or a case
 * study's own Results; commit counts are deliberately left out here.
 */
export const proof = [
  { value: '1,600+', label: 'algorithm problems solved' },
  { value: '100+', label: 'programming contests' },
];

export type SkillGroup = { group: string; items: string[] };

/*
 * The CV's Technical Skills, group for group and item for item. The last group
 * holds only tools the project repositories document.
 */
export const skills: SkillGroup[] = [
  {
    group: 'AI / LLM',
    items: [
      'LLM APIs',
      'Portkey',
      'Function / Tool Calling',
      'Structured Outputs (Zod)',
      'Provider Failover',
      'LLM Observability',
    ],
  },
  { group: 'Languages', items: ['TypeScript', 'JavaScript (ES6+)', 'C', 'C++', 'Python (basic)'] },
  {
    group: 'Frontend',
    items: ['React.js', 'TanStack Query', 'TanStack Router', 'Tailwind CSS', 'shadcn/ui', 'Vite', 'Jotai'],
  },
  {
    group: 'Backend',
    items: ['Node.js', 'Bun', 'Hono', 'Express.js', 'REST APIs', 'WebSockets (Socket.io)'],
  },
  {
    group: 'Databases & Infrastructure',
    items: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Drizzle ORM', 'Supabase', 'AWS SQS', 'Docker'],
  },
  { group: 'Auth & Security', items: ['Better Auth', 'JWT', 'Zod', 'Helmet'] },
  {
    group: 'Testing & Tools',
    items: ['Vitest', 'Playwright', 'Selenium', 'JMeter', 'Git', 'GitHub', 'Postman', 'ESLint', 'Prettier', 'Husky'],
  },
  {
    group: 'Also in this work',
    items: ['SQL', 'Lighthouse CI', 'GitHub Actions', 'Cloudflare Workers', 'Render', 'Neon'],
  },
];

/* Experience, education and achievements are word for word from the owner's CV. */

export type ExperienceRole = {
  title: string;
  organization: string;
  period: string;
  bullets: string[];
};

export const experience: ExperienceRole[] = [
  {
    title: 'Web Developer',
    organization: 'Taibah Academy',
    period: 'Aug 2026 – Present',
    bullets: [
      'Performed Software Quality Assurance (SQA) testing on the live production website, identifying and reporting functional bugs and UI issues before they affected users.',
      'Conducted security testing and hardening of the website, helping to protect student and payment data from common web vulnerabilities.',
      'Coordinated with the third-party development vendor to track, prioritize, and verify fixes for reported issues.',
    ],
  },
  {
    title: 'Undergraduate Teaching Assistant',
    organization: 'Department of CSE, IIUC',
    period: 'Aug 2024 – Aug 2025',
    bullets: [
      'Assisted students in the Competitive Programming I Lab with problem solving, debugging, and core algorithms and data structures, providing targeted guidance to students who were falling behind.',
    ],
  },
  {
    title: 'Trainer & Mentor',
    organization: 'IIUC Competitive Programming Society (IIUCCPS)',
    period: 'Aug 2023 – Dec 2025',
    bullets: [
      'Taught algorithms, data structures, and problem-solving techniques in competitive programming bootcamps, tracking participants’ daily progress, and giving personalized feedback.',
      'Also served as Bootcamp Coordinator and Finance Secretary of IIUCCPS.',
    ],
  },
];

export type EducationEntry = { degree: string; institution: string; period: string };

export const education: EducationEntry[] = [
  {
    degree: 'M.Engg. in Computer Science and Engineering',
    institution: 'Chittagong University of Engineering and Technology (CUET)',
    period: 'Aug 2026 – Present',
  },
  {
    degree: 'B.Sc. in Computer Science and Engineering',
    institution: 'International Islamic University Chittagong (IIUC)',
    period: 'Aug 2021 – Dec 2025',
  },
];

/* One highlighted figure in the achievements readout. Every value and label is
   a fact already stated in that achievement's own text below; the readout is a
   second view of the same sentence, never a new claim. */
export type RecordFigure = { value: string; label: string };

/* A short title and year for the one-line list, split from `text` word for
   word: the owner asked for one line per item (owner, 2026-11-15, "feels like
   too many texts to read") without new wording, so every title is a phrase the
   sentence already contains. `text` stays as the source of record. */
export type Achievement = {
  text: string;
  title?: string;
  year?: string;
  place?: string;
  /* `handle` is the name the owner goes by on that site — the one fact the
     one-line row adds that the sentence's readout figures cannot show. */
  links?: { label: string; handle?: string; href: string }[];
  record?: RecordFigure[];
};

export const achievements: Achievement[] = [
  {
    /* The owner's CV sentence, verbatim, and the source of truth for this entry:
       the readout's figures and the lead line below are both split from it and
       restate nothing. It is deliberately not printed as a paragraph — the owner
       asked for "the readout plus one line each" (2026-11-16). */
    text: 'Codeforces: ToshifurRahman (Pupil, max rating 1290); CodeChef: tasin_021 (max rating 1461). Solved 1,600+ problems and participated in 100+ online and onsite contests.',
    /* Split from the sentence above, fact for fact, for the section's readout. */
    record: [
      { value: '1290', label: 'Codeforces max rating, Pupil' },
      { value: '1461', label: 'CodeChef max rating' },
      { value: '1,600+', label: 'problems solved' },
      { value: '100+', label: 'contests entered' },
    ],
    /* The one line beside the figures, carrying only what they cannot: which
       handle each rating belongs to. Both names are the sentence's own, and
       "Pupil" is already in the readout's first label, so it is not repeated. */
    links: [
      {
        label: 'Codeforces',
        handle: 'ToshifurRahman',
        href: 'https://codeforces.com/profile/ToshifurRahman',
      },
      { label: 'CodeChef', handle: 'tasin_021', href: 'https://www.codechef.com/users/tasin_021' },
    ],
  },
  {
    text: '1st Runner-up, IIUC Intra-University Programming Contest (Spring 2023).',
    title: 'IIUC Intra-University Programming Contest',
    place: '1st Runner-up',
    year: 'Spring 2023',
  },
  {
    text: 'Best Mentor Award, IIUCCPS Competitive Programming Bootcamps (Autumn 2023 and Spring 2024).',
    title: 'Best Mentor Award, IIUCCPS Competitive Programming Bootcamps',
    year: 'Autumn 2023 and Spring 2024',
  },
];

/* The Contact lede, shown only when there is an address to write to. The
   owner's own words, 2026-11-15: "Want to talk? email is the fastest way to
   reach me". The first sentence is set in full ink. */
export const contactLede = {
  lead: 'Want to talk?',
  rest: ' Email is the fastest way to reach me.',
};

/* The career path, drawn as the Now panel's static track on the home page.
 * Owner's own sequence (2026-11-15): "University -> Trainer & Mentor ->
 * Bootcamp Coordinator -> Finance Secretary -> Passed -> admitted to masters ->
 * Taibah Academy -> M.engg."
 *
 * Every label and date is taken from a fact already in this file, never typed
 * fresh here: stops 1 and 5 come from `education` (B.Sc. at IIUC, Aug 2021 to
 * Dec 2025), stops 2-4 from `experience` (Trainer & Mentor, Aug 2023, and its
 * own bullet "Also served as Bootcamp Coordinator and Finance Secretary"),
 * stops 7 and 8 from `experience` (Taibah Academy) and `education` (M.Engg.,
 * CUET). Stop 6 is the admission those dates imply; the owner's words name it.
 * A fact with no date in the source shows none here.
 */
export type PathStop = {
  label: string;
  /* Shown under the label. Empty where the source states no date. */
  date: string;
  /* The two current stations: their lamps are lit. */
  current?: boolean;
  /* Which of the Now panel's two lanes this stop belongs to. An undated role
     belongs to `parent`, the dated stop it was held alongside. */
  lane: 'study' | 'work';
  parent?: string;
  /* The year the stop sits at on the shared axis. Absent for a role with no
     date in the source: it takes no position of its own and is listed under its
     parent. */
  year?: number;
  /* A span the source dates at both ends (B.Sc. Aug 2021 to Dec 2025) may be
     drawn as a bar from `year` to `yearEnd`. */
  yearEnd?: number;
};

/*
 * The Now panel's two lanes, on one shared year axis. Owner, 2026-11-15:
 * "In Now, timeline chart not looking good, research to make it look good. drop
 * latest system & problem solving", and the answer: "the Now timeline becomes
 * two lanes, Study and Work".
 *
 * Years are read off the dates the stops already carry; no new fact is stated.
 * B.Sc. runs Aug 2021 to Dec 2025, so it is drawn as a bar; the completion is
 * its end, not a section of its own. The admission to the master's has no date
 * in the source, so it sits with the M.Engg. that follows it rather than
 * claiming a year.
 */
export const path: PathStop[] = [
  { label: 'B.Sc. in CSE, IIUC', date: 'Aug 2021', lane: 'study', year: 2021, yearEnd: 2025 },
  { label: 'B.Sc. completed', date: 'Dec 2025', lane: 'study', year: 2025 },
  { label: 'Admitted to M.Engg., CUET', date: '', lane: 'study' },
  { label: 'M.Engg. in CSE, CUET', date: 'In progress', lane: 'study', current: true },
  { label: 'Trainer & Mentor, IIUCCPS', date: 'Aug 2023', lane: 'work', year: 2023 },
  { label: 'Bootcamp Coordinator, IIUCCPS', date: '', lane: 'work', parent: 'Trainer & Mentor, IIUCCPS' },
  { label: 'Finance Secretary, IIUCCPS', date: '', lane: 'work', parent: 'Trainer & Mentor, IIUCCPS' },
  { label: 'Web Developer, Taibah Academy', date: 'Aug 2026', lane: 'work', year: 2026, current: true },
];

/* The year the axis ends at: the latest year any stop names. */
export const pathYears = Array.from(
  new Set(path.flatMap((stop) => [stop.year, stop.yearEnd]).filter((y): y is number => typeof y === 'number')),
).sort((a, b) => a - b);

export type Certificate = {
  slug: string;
  title: string;
  issuer: string;
  date?: string;
  /* Which band the certificate sits in. Coding and problem solving lead the
     list, the rest follows; within a band the newer certificate comes first.
     Stated as data so the order is not a side effect of the slug. */
  group: 'coding' | 'other';
  file: string;
  preview: string;
  width: number;
  height: number;
  alt: string;
};

export const certificates: Certificate[] = [
  {
    slug: 'beginners-typescript',
    title: 'Beginner’s TypeScript Workshop',
    issuer: 'Total TypeScript',
    date: '30 December 2025',
    group: 'coding',
    file: '/certificates/files/beginners-typescript.png',
    preview: '/certificates/previews/beginners-typescript.webp',
    width: 800,
    height: 566,
    alt: 'Certificate of Completion for the Beginner’s TypeScript workshop, Total TypeScript, 30 December 2025.',
  },
  {
    slug: 'frontend-masters-algorithms',
    title: 'The Last Algorithms Course You’ll Need',
    issuer: 'Frontend Masters',
    date: '21 December 2025',
    group: 'coding',
    file: '/certificates/files/frontend-masters-algorithms.pdf',
    preview: '/certificates/previews/frontend-masters-algorithms.webp',
    width: 800,
    height: 566,
    alt: 'Certificate of completion for The Last Algorithms Course You’ll Need, Frontend Masters, completed 21 December 2025.',
  },
  {
    slug: 'iiuccps-best-mentor',
    title: 'Certificate of Appreciation, Competitive Programming Bootcamp Trainer',
    issuer: 'IIUC Competitive Programming Society (IIUCCPS)',
    date: '2025',
    group: 'coding',
    file: '/certificates/files/iiuccps-best-mentor.pdf',
    preview: '/certificates/previews/iiuccps-best-mentor.webp',
    width: 800,
    height: 606,
    alt: 'Certificate of appreciation for contributing as a trainer in the IIUCCPS Competitive Programming Bootcamp, Spring 2025 and Autumn 2025.',
  },
  {
    slug: 'pu-contest',
    title: 'PU-CSE IT Fest 2024, Programming Contest',
    issuer: 'Department of Computer Science and Engineering, Premier University',
    date: '27 January 2024',
    group: 'coding',
    file: '/certificates/files/pu-contest.pdf',
    preview: '/certificates/previews/pu-contest.webp',
    width: 800,
    height: 674,
    alt: 'Certificate of participation in the programming contest at PU-CSE IT Fest 2024, Premier University, 27 January 2024.',
  },
  {
    slug: 'cu-contest',
    title: 'IT Fiesta 2024, Certificate of Appreciation',
    issuer: 'Chittagong University Scientific Society',
    date: '2024',
    group: 'coding',
    file: '/certificates/files/cu-contest.pdf',
    preview: '/certificates/previews/cu-contest.webp',
    width: 800,
    height: 636,
    alt: 'Certificate of appreciation from IT Fiesta 2024, Chittagong University Scientific Society.',
  },
  {
    slug: 'hult-prize',
    title: 'Hult Prize at International Islamic University Chittagong',
    issuer: 'Hult Prize',
    date: '12 February 2023',
    group: 'other',
    file: '/certificates/files/hult-prize.png',
    preview: '/certificates/previews/hult-prize.webp',
    width: 800,
    height: 570,
    alt: 'Certificate recognising participation as a competitor in the Hult Prize at International Islamic University Chittagong, 12 February 2023.',
  },
  {
    slug: 'chemistry-olympiad',
    title: '9th Bangladesh Chemistry Olympiad-2018',
    issuer: 'Bangladesh Chemical Society',
    date: '25 January 2019',
    group: 'other',
    file: '/certificates/files/chemistry-olympiad.pdf',
    preview: '/certificates/previews/chemistry-olympiad.webp',
    width: 800,
    height: 646,
    alt: 'Certificate of participation in the preliminary round of the 9th Bangladesh Chemistry Olympiad 2018, CU Chattogram region.',
  },
  {
    slug: 'botany-olympiad',
    title: 'Bangladesh Botany Olympiad 2018',
    issuer: 'Bangladesh Botanical Society',
    date: '2018',
    group: 'other',
    file: '/certificates/files/botany-olympiad.pdf',
    preview: '/certificates/previews/botany-olympiad.webp',
    width: 800,
    height: 656,
    alt: 'Certificate of participation in the Bangladesh Botany Olympiad 2018, Divisional Round, Bangladesh Botanical Society.',
  },
];

export type Lane = { label: string; nodes: string[]; note?: string; siblings?: boolean };

/* The name of RannaGhor's first check, stated once. The architecture lane and
   the case study's flowchart both show this check on the same page, so both read
   it from here rather than each spelling it out: two names for one thing on one
   screen is a defect the page can grow by itself. */
export const securityCheckLabel = 'Security and CSRF';

export type Block =
  | { kind: 'p'; text: string }
  | { kind: 'list'; items: { lead?: string; text: string }[] }
  | { kind: 'steps'; items: string[] }
  | { kind: 'facts'; items: { value: string; label: string }[] }
  | { kind: 'diagram'; caption: string; lanes: Lane[] }
  /* A challenge and the solution that answers it, side by side. The owner asked
     for the two sections to read as pairs (2026-11-15) because as separate lists
     the reader had to match five items across two screens. */
  | { kind: 'pairs'; items: Pair[] }
  /* A decision as a card: the lead is the card's title and the text sits under
     it at body size. Same words as a `list`, different shape (owner, 2026-11-15:
     the section "feels to conjusted with texts"). */
  | { kind: 'decisions'; items: { lead: string; text: string }[] };

export type Pair = { challenge: { lead: string; text: string }; solution: { lead: string; text: string } };

export type Section = { id: string; title: string; blocks: Block[] };

/* A header meta entry. The page understands four labels: `Type` and `Stack`
   are plain facts, `Source` is the repo, and `Live` is the deployed site,
   shaped `{ label: 'Live', value: <host shown>, href: <url> }`. An href makes
   Source or Live a highlighted link-button (Live first when both are present);
   without one, either renders as plain text, as every other label always does.
   There is no Timeline label: the owner removed it on 2026-11-17. */
export type MetaEntry = { label: string; value: string; href?: string };

export type CaseStudy = {
  slug: string;
  title: string;
  summary: string;
  /* The study's own closing result, in one sentence, shown on its card in the
     Work section. It is the same sentence that closes the study's Results, and
     the test pins the two together, so the card cannot claim something the
     page does not. */
  outcome: string;
  meta: MetaEntry[];
  sections: Section[];
};

/* The six sections every case study has, in this order. Challenges and Solutions
   are one section since 2026-11-15: they read as pairs, not as two lists. */
export const sectionOrder = [
  { id: 'overview', title: 'Overview' },
  { id: 'problem', title: 'Problem' },
  { id: 'architecture', title: 'Architecture' },
  { id: 'tech-decisions', title: 'Tech decisions' },
  { id: 'challenges', title: 'Challenges and solutions' },
  { id: 'results', title: 'Results' },
] as const;

/* The merged section carries both ids, so the sub-navbar and any old link to
   #solutions still land where they used to. */
export const solutionsAnchor = 'solutions';

const ticketPipeline: CaseStudy = {
  slug: 'ticket-pipeline',
  title: 'Ticket-Pipeline',
  summary:
    'A support-ticket pipeline. A customer submits a ticket, a background worker triages it with an LLM and drafts a reply, and the customer watches it happen live.',
  outcome:
    'A ticket goes from submission to a drafted reply without a staff member touching it, and the customer watches each step happen live.',
  meta: [
    { label: 'Type', value: 'Backend system with a web app' },
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
          kind: 'decisions',
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
      title: 'Challenges and solutions',
      blocks: [
        {
          kind: 'pairs',
          items: [
            {
              challenge: {
                lead: 'Output that cannot be trusted.',
                text: 'A model can return malformed or incomplete output, and a provider can be slow or down.',
              },
              solution: {
                lead: 'Treat bad output as a failure.',
                text: 'Output that fails validation is recorded as an invalid response and retried like any other failure. After three tries the ticket goes to a person, who can replay it from the stage that failed.',
              },
            },
            {
              challenge: {
                lead: 'Customer content in shared channels.',
                text: 'Every ops user sees the ops feed, so ticket text and AI output must never reach it, even by accident in an error message.',
              },
              solution: {
                lead: 'Build public data field by field.',
                text: 'Public views, the ops feed and alerts list their fields explicitly. Alerts carry fixed reason codes, never error text. Guard tests fail if any other file publishes to the ops room.',
              },
            },
            {
              challenge: {
                lead: 'Bots spending the AI budget.',
                text: 'A public form that triggers paid LLM calls is an easy target.',
              },
              solution: {
                lead: 'Four checks in a fixed order.',
                text: 'Body validation, a per-address hourly limit, Cloudflare Turnstile, then a daily cap. A refused request creates no row and costs no LLM call.',
              },
            },
            {
              challenge: {
                lead: 'Two runtimes.',
                text: 'The app runs on Bun, but module mocking in the test runner does not work under Bun.',
              },
              solution: {
                lead: 'Run tests on Node, the app on Bun.',
                text: 'Vitest runs on Node so mocking works. Playwright tests run against the built app.',
              },
            },
            {
              challenge: {
                lead: 'Migrations on a pooled database.',
                text: 'The pooled connection lacks the session features that migration tools rely on.',
              },
              solution: {
                lead: 'Two connection strings.',
                text: 'Migrations use the direct database URL. The running app uses the pooled one.',
              },
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
          kind: 'p',
          text: 'A ticket goes from submission to a drafted reply without a staff member touching it, and the customer watches each step happen live.',
        },
        {
          kind: 'facts',
          items: [
            { value: '120', label: 'test files across the API, worker, web app and end-to-end suite' },
            { value: '266', label: 'commits since April 2026' },
            {
              value: '90+',
              label: 'minimum Lighthouse score in all four categories, on six pages',
            },
            { value: '10', label: 'Redis commands per ticket, and none while idle' },
          ],
        },
        {
          kind: 'p',
          text: 'Accessibility is checked automatically on every route. Every provider call is recorded with its outcome, latency and token count, and summarised in the ops console. The app ships as one Docker image and deploys only after CI passes.',
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
  outcome:
    'The platform covers the full path from sign-up to a managed order, with a vendor dashboard and an admin panel.',
  meta: [
    { label: 'Type', value: 'Full-stack web app' },
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
              nodes: [securityCheckLabel, 'Rate limit', 'Session', 'Role check', 'Route handler'],
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
          kind: 'decisions',
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
              text: 'Email and password with verification, Google sign-in, and sessions with a “remember me” option.',
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
      title: 'Challenges and solutions',
      blocks: [
        {
          kind: 'pairs',
          items: [
            {
              challenge: {
                lead: 'Privilege escalation.',
                text: 'With three roles, one missing check lets a customer act as a vendor or an admin.',
              },
              solution: {
                lead: 'Role checks as middleware, proven by tests.',
                text: 'Separate middleware guards vendor and admin routes. Dedicated test suites cover authorisation, privilege escalation, session security and database row-level policies.',
              },
            },
            {
              challenge: {
                lead: 'Sign-in abuse.',
                text: 'Limiting attempts by address alone does not stop an attacker who targets one account from many addresses.',
              },
              solution: {
                lead: 'Rate limits per account.',
                text: 'Sign-in and password reset are limited per account as well as per address.',
              },
            },
            {
              challenge: {
                lead: 'State leaking between users.',
                text: 'Cart and wishlist contents showed across accounts on a shared browser.',
              },
              solution: {
                lead: 'Cart and wishlist scoped to the signed-in user.',
                text: 'The wishlist is stored per user, a guest’s items move to their account at sign-in, and cart and coupon state are cleared at sign-out.',
              },
            },
            {
              challenge: {
                lead: 'Stock under concurrent orders.',
                text: 'Two orders for the last item must not both succeed.',
              },
              solution: {
                lead: 'Stock changes inside transactions.',
                text: 'An order locks the product rows, checks stock and reduces it in one database transaction, with tests for the concurrent case.',
              },
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
          kind: 'p',
          text: 'Customers shop, vendors manage their own products after an admin approves them, and admins run the platform, each in one area of a single typed codebase.',
        },
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
  ],
};

export const caseStudies: CaseStudy[] = [ticketPipeline, rannaghor];
