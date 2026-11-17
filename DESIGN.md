---
name: Toshifur Rahman Portfolio
description: A software engineer drawn as a signal box: a dark control panel, a 12-column frame, and one amber signal that says where you are.
colors:
  bg: "#0a0b0d"
  bg-raised: "#0f1114"
  ink: "#f2f1ec"
  ink-2: "#c4c7cd"
  muted: "#8b9099"
  grid: "#15181c"
  rule: "#23272d"
  rule-strong: "#343941"
  track: "#2c3138"
  lamp-off: "#2c3138"
  accent: "#ffb340"
  accent-hover: "#ffc56b"
  accent-text: "#ffb340"
  on-accent: "#1a1204"
  lamp-edge: "#ffb340"
  fail: "#ff5b4a"
  light-bg: "#e8e5dd"
  light-bg-raised: "#ded9cf"
  light-ink: "#121417"
  light-ink-2: "#33373d"
  light-muted: "#5a5f68"
  light-grid: "#dcd7cc"
  light-rule: "#cdc7bb"
  light-rule-strong: "#b3ad9f"
  light-track: "#a8a294"
  light-lamp-off: "#bab4a6"
  light-accent: "#e09a12"
  light-accent-hover: "#e8a72c"
  light-accent-text: "#7a4600"
  light-lamp-edge: "#7a4600"
  light-fail: "#c2321f"
typography:
  font:
    fontFamily: "'Mona Sans Variable', 'Mona Fallback', system-ui, sans-serif"
  mono:
    fontFamily: "'Martian Mono Variable', 'Martian Fallback', ui-monospace, monospace"
  name:
    fontSize: "clamp(3.25rem, 1.55rem + 6.6vw, 6rem)"
    fontWeight: 680
    letterSpacing: "-0.045em"
  title:
    fontSize: "clamp(3rem, 1.7rem + 5.2vw, 5.75rem)"
    fontWeight: 680
    letterSpacing: "-0.045em"
  h2:
    fontSize: "clamp(2rem, 1.55rem + 1.5vw, 2.625rem)"
    fontWeight: 680
    letterSpacing: "-0.03em"
  case:
    fontSize: "clamp(1.75rem, 1.35rem + 1.5vw, 2.5rem)"
    fontWeight: 680
    letterSpacing: "-0.03em"
  figure:
    fontSize: "clamp(2rem, 1.55rem + 1.5vw, 2.75rem)"
    fontWeight: 600
    letterSpacing: "-0.03em"
  motto:
    fontSize: "clamp(1.5rem, 1.12rem + 1.35vw, 2.25rem)"
    fontWeight: 520
    letterSpacing: "-0.03em"
  email:
    fontSize: "clamp(1.75rem, 1rem + 3.4vw, 3.5rem)"
    fontWeight: 680
    letterSpacing: "-0.03em"
  lg:
    fontSize: "1.1875rem"
    fontWeight: 430
  xl:
    fontSize: "1.375rem"
    fontWeight: 520
  body:
    fontSize: "1.0625rem"
    fontWeight: 430
  md:
    fontSize: "0.9375rem"
    fontWeight: 430
  sm:
    fontSize: "0.875rem"
    fontWeight: 430
  xs:
    fontSize: "0.75rem"
    fontWeight: 430
  "2xs":
    fontSize: "0.6875rem"
    fontWeight: 430
    letterSpacing: "0.04em"
  flow-label:
    fontSize: "12px"
    fontWeight: 430
    letterSpacing: "0.03em"
  weights:
    regular: 430
    medium: 520
    semibold: 600
    bold: 680
  tracking:
    display: "-0.045em"
    tight: "-0.03em"
    snug: "-0.015em"
    mono: "0.04em"
spacing:
  "1": "0.25rem"
  "2": "0.5rem"
  "3": "0.75rem"
  "4": "1rem"
  "5": "1.25rem"
  "6": "1.5rem"
  "8": "2rem"
  "10": "2.5rem"
  "12": "3rem"
  "16": "4rem"
  section: "clamp(4rem, 2.6rem + 5vw, 7rem)"
  frame: "84rem"
  frame-margin: "clamp(0.625rem, 0.2rem + 2vw, 2rem)"
  pad: "clamp(1rem, 0.4rem + 2.4vw, 3rem)"
  col-gap: "clamp(1rem, 0.5rem + 1.5vw, 2rem)"
  measure: "40rem"
  bar: "4rem"
  contents: "3.5rem"
  target: "2.75rem"
rounded:
  sm: "4px"
  default: "6px"
  lamp: "50%"
lines:
  line: "1px"
  track: "2px"
  heavy: "3px"
  focus-offset: "3px"
motion:
  ease-out: "cubic-bezier(0.16, 1, 0.3, 1)"
  lamp: "120ms"
  fast: "160ms"
  none: "0.01ms"
  wave: "9s"
  pulse: "26s"
  fade: "220ms"
  strip-step: "120ms"
components:
  bar:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    borderBottom: "{lines.line} solid {colors.rule}"
    height: "{spacing.bar}"
  brand:
    textColor: "{colors.accent-text}"
    typography: "{typography.md}"
  lamp-off:
    backgroundColor: "{colors.lamp-off}"
    size: "8px"
  lamp-lit:
    backgroundColor: "{colors.accent}"
    ring: "{lines.line} {colors.lamp-edge}"
  nav-link:
    textColor: "{colors.muted}"
    typography: "{typography.sm}"
    height: "{spacing.target}"
  nav-link-current:
    textColor: "{colors.ink}"
  button:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.default}"
    height: "2.75rem"
  button-hover:
    backgroundColor: "{colors.accent-hover}"
  ghost:
    textColor: "{colors.ink}"
    border: "{lines.line} solid {colors.rule-strong}"
    rounded: "{rounded.default}"
    height: "2.75rem"
  ghost-hover:
    borderColor: "{colors.accent-text}"
    textColor: "{colors.accent-text}"
  case:
    borderTop: "{lines.line} solid {colors.rule}"
  copy-button:
    textColor: "{colors.ink-2}"
    border: "{lines.line} solid {colors.rule-strong}"
    typography: "{typography.2xs}"
  flow-node:
    backgroundColor: "{colors.bg}"
    border: "{lines.line} solid {colors.rule-strong}"
    typography: "{typography.flow-label}"
  flow-edge:
    stroke: "{colors.track}"
  flow-edge-branch:
    stroke: "{colors.track}"
    dash: "4px 4px"
---

# Design System: Toshifur Rahman Portfolio

## Overview

**Creative North Star: the signal box.**

The site is a control panel for a working engineer. Everything sits inside one 12-column
frame drawn by two hairlines down the page, and colour is spent on one thing: an amber signal
that says where you are. The ground is read as an instrument panel at night — near-black,
hairline rules, mono type for anything that is data — and every section is a readout rather
than a card.

The owner's own image names the motion: charge runs from the wordmark down the page's strips
to the footer, and cells between the strips glow as it passes. It is slow (a 26s cycle for the
ray, a 9s wave for the hero cells), it is decoration, and it stops dead under
`prefers-reduced-motion`.

The redesign replaced an earlier language that is no longer here: Archivo, a vermilion accent,
and a five-state chain as the home navigation. Nothing in this document describes that site.
Two fonts now do the work — Mona Sans for words, Martian Mono for data — the accent is amber,
and the navigation is a sticky bar with a case-study sub-nav.

**Key characteristics:**
- One frame, twelve columns, two hairlines, on every page.
- Dark first: `:root` is the night panel and the light theme is a token swap, not an inversion.
- One accent, amber, used for the live signal, the wordmark and the way forward.
- Mono type wherever a number, label or system name appears; Sans for prose.
- Flat and hairline: 1px rules, 6px radii, no drop shadows — the only `box-shadow`s are zero-blur
  lamp rings — and one filled card, a Tech decision.
- The chart engine is part of the design language, so its rules are design rules (below).

## Colors

Every value below is the token as it is named in `src/styles.css`. The dark values are on
`:root`; the light values are the same token names re-declared under `:root[data-theme='light']`,
which is why no component branches on theme for colour. (The theme toggle's two icons are the
one component that branches at all, and they switch `display`, not paint.)

### The night panel (`:root`)
- **Ground** (`bg` `#0a0b0d`): the page, and the sticky bar — the bar is the page ground with a
  `rule` underline, not a raised band. **Raised** (`bg-raised` `#0f1114`): the one step up, used
  for things that sit *over* the page — the certificate dialog and its thumbnail, and the Work
  node diagram's nodes — and for the Tech decision card, the one place a raised ground sits
  behind body copy. There is no third elevation: a Work card is not raised, it is ruled (see
  below), a flowchart's node box is the page ground itself, and the flowchart panel sits on the
  page ground with ground-filled label pills.
- **Ink** (`ink` `#f2f1ec`) is body text, headings, and the label on a ruled control such as a
  ghost button. **`ink-2`** (`#c4c7cd`) is the quieter second voice: copy controls, secondary
  labels. **`muted`** (`#8b9099`) is tertiary — captions, bar links, diagram labels, meta. Three
  neutral text colours, no more; the two amber ones are text on a fill (`on-accent`) and accent
  text (`accent-text`), both described below.
- **Rules** come in two strengths, and the distinction is load-bearing: `rule` `#23272d`
  separates rows and closes the bar; `rule-strong` `#343941` outlines a control that can be
  pressed. `grid` `#15181c` draws the column lines behind the introduction, deliberately
  below `rule` so the frame never competes with content.
- **Track** (`track` `#2c3138`) is the unfilled part of any track or rail, and `lamp-off` is
  the same value: an unlit lamp and an empty track are the same darkness.

### The signal
- **Amber** (`accent` `#ffb340`) is the only saturated colour outside the failure semantics: a
  lit lamp, the live token on the track, the current nav item, the glow in a hero cell.
  **`accent-hover`** (`#ffc56b`) is its hover. **`on-accent`** (`#1a1204`) is text on an amber
  fill — a brown-black, not the ground, so amber stays legible as a button. A focused control is
  ringed in `accent-text`, not `accent`: `:focus-visible` is `outline: var(--line-track) solid
  var(--accent-text)`, the same amber at night and `#7a4600` on paper.
- **`accent-text`** (`#ffb340`) exists separately from `accent` because the two jobs differ:
  a fill needs a colour that reads as light, text needs one that passes contrast on the
  ground. In the light theme they diverge — `#e09a12` for fills, `#7a4600` for text — because
  amber text on paper fails AA at the fill colour.
- **`lamp-edge`** is the hairline ring around a lit lamp; `#ffb340` at night, `#7a4600` on
  paper so the lamp keeps an edge there.
- **`fail`** (`#ff5b4a` night, `#c2321f` paper) is reserved for failure states in the
  flowcharts' semantics, plus the dev-only `.missing` notice that a required fact is unset. It is
  not a UI colour and never marks a section.

### The paper theme
`bg` `#e8e5dd` and `ink` `#121417`, with `muted` `#5a5f68`, `rule` `#cdc7bb`, `rule-strong`
`#b3ad9f`, `grid` `#dcd7cc`, `track` and `lamp-off` `#a8a294`/`#bab4a6`. The accent darkens
rather than brightens (`#e09a12` fill, `#7a4600` text) so amber reads as a signal on paper
instead of as a highlighter. `backdrop` is the only translucent value (`rgb(18 20 23 / 0.55)`
on paper, `rgb(4 5 6 / 0.82)` at night) and it is used solely behind an overlay.

### Named rules
**The One Signal Rule.** Amber means live or go. It marks the current item, the lit lamp, the
charge, the primary action, and a focused control — that last one through `accent-text`, which is
what a focus ring is drawn in, not `accent`. It is never a heading colour and never a section
background. It *is* decoration in one narrow sense the CSS states plainly: `--accent` is the
colour of the charge — the ray, the hero-cell glow, the lamp — and those carry no information, so
the token is not held to the text contrast ratio.

**The Two Rule Strengths Rule.** `rule` separates, `rule-strong` outlines something pressable.
Do not reach for a third grey.

## Typography

**Sans:** Mona Sans Variable (`--font`), with `Mona Fallback` and the system stack behind it.
**Mono:** Martian Mono Variable (`--mono`), with `Martian Fallback` and `ui-monospace`.

Both faces are self-hosted and marked `font-display: optional`, and each has a metric-matched
fallback face (`Mona Fallback` 103.7% size-adjust, `Martian Fallback` 116.6%) so a cold visit
that misses the download lays out at the same size instead of reflowing. The diagram engine
does not read font metrics at all — it advances by a constant per character
(`CHAR * size` in `src/Diagram.tsx`) — so the chart's geometry cannot shift when a face
arrives.

**Character:** Mona Sans is a humanist sans used at fairly tight tracking and heavy weights for
names and headings; Martian Mono appears only where something is a number, a station name, a
label or a stack, and it is the visual signature that says this is an instrument panel.

### Scale
The scale is tokenised, not invented per section: `2xs` 0.6875rem, `xs` 0.75rem, `sm`
0.875rem, `md` 0.9375rem, `body` 1.0625rem, `lg` 1.1875rem, `xl` 1.375rem, then seven fluid
`clamp()` sizes — `figure`, `motto`, `h2`, `case`, `email`, `title`, `name` — and the flowchart's
own `flow-label` 12px, which is a viewBox unit rather than a page step (see the flowchart section).

- **Name** (`name`, weight 680, tracking -0.045em): the home hero, clamped to 6rem.
- **Title** (`title`): the case-study title. **Email** (`email`): the contact address.
- **H2** (`h2`): section headings. **Case** (`case`): a work card's title. **Figure**:
  a proof number. **Motto** (`motto`, weight 520): the hero statement.
- **Body** 1.0625rem at weight 430 for prose; `md` and `sm` for secondary lines; `2xs` with
  mono for labels and diagram text.
- Weights are named tokens (`regular` 430, `medium` 520, `semibold` 600, `bold` 680) rather
  than the usual 400/500/600/700, so headings sit a shade heavier than system defaults.
- **A step is a size, not a weight.** The front matter's `fontWeight` is the step's default,
  and a step that a rule sets a weight on is the exception, named here so the number is not read
  as universal: `2xs` defaults to 430 with `.tl-lane-title` the one 520; `sm` to 430 with
  `.nav-links a` and `.contents a` at 520; `md` to 430 with `.button`, `.more-link`, `.brand` and
  `.certificate-title` at 600 and `.ghost`, `.text-button`, `.next-lead` at 520; `xl` to 520 with
  `.subhead` and `.entry-title` at 600; `lg` to 430 with `.nav-links a` at 520 inside the phone
  menu, where that rule takes `--text-lg` (`@media (max-width: 57rem)`). `flow-label` is the one
  step no rule gives a weight, so what it renders is `body`'s 430.

### Named rules
**The Mono Means Data Rule.** If it is a number, a station, a stack, a label or a system name,
it is Martian Mono. If it is a sentence, it is Mona Sans. A line never mixes the two. One
exception is written into the CSS rather than the rule: the Now panel's `tl-lane-title` ("Study",
"Work") is uppercase `2xs` in **Mona Sans**, because it is a heading for a lane rather than a
data label, and `.tl-lane-title` sets no `font-family`.

**The Diagram Floor Rule.** No text in a flowchart may render below **12px**. The floor is
measured from the rendered transform (`getScreenCTM().a`), not from the viewBox, because the
chart is scaled to fit and the viewBox ratio lies about the type size. This is why the height
clamp was removed rather than kept (see the flowchart section).

## Layout

**The frame.** `--frame` 84rem, centred, with `--frame-margin` outside it, two 1px hairlines on
its edges, and a 12-column grid inside with `--col-gap`. `--pad` is the inner gutter. Prose is
capped at `--measure` 40rem. The bar is `--bar-h` 4rem and sticky at `top: 0` with an
opaque ground and a `rule` line beneath it; `--header-h` is overwritten at run time with the
bar's measured height so anchors land below it.

**Home.** A hero (`intro`) holding the name, role, the two hero facts and the statement, laid
over the twelve column lines with eleven glow cells between them. Under it a ruled readout of
two proof figures and the actions (Download CV as the primary, Email/GitHub/LinkedIn as
ghosts). Then the Now panel, Work, the CV sections (Experience, Education, Achievements), Skills
and Contact, each a `Section` with its `id`, and the footer.

**Sections.** `pageSections` in `src/nav.ts` is the single list: Work, Experience, Education,
Achievements, Skills, Contact. Certificates are part of Achievements, and Education has no bar
entry because the bar holds five links. Whatever the bar lists, the sections keep this order.

**Case studies.** A `study-head` (back link, a title that links to the study's Live site or else
its repo, lede), then the meta row (`Type` and `Stack` as plain facts, with Source and any Live
site as highlighted link-buttons), then the sticky sub-nav, then the
six sections (`sectionOrder` in `src/content.ts`: Overview, Problem, Architecture, Tech
decisions, Challenges and solutions, Results — Challenges and Solutions are one section). The sub-nav is the bar's own `navbar` treatment applied to the case study's
section list, and it lights **Work** while a case study is open — the owner asked for the two to
be one design, not two.

**Breakpoints.** `57rem` collapses the bar into a menu button; `48rem` hides the Now panel's year
axis and turns the stops from a grid into a column (the two lanes are stacked at every width),
and restacks the Work node structure.

The flowcharts switch layout on *container* width, not viewport: `@container (max-width: 1171px)`
for Ticket-Pipeline and `1155px` for RannaGhor — each study's own viewBox width (1170.30 and
1154.44 units) rounded up, so the switch happens just before the desktop graph would scale below
1:1. Those numbers are not arbitrary — they are where the desktop chart would drop below 1:1 and
take every label under the 12px floor.

## The bar and the signal strip

The bar is sticky, `bg` with a `rule` underline, and holds the wordmark (the one amber text in
the bar at rest, `accent-text`), the five nav links with a lamp each, and a CV action. Two chrome
elements turn amber on demand: the open menu button (`.menu-button[aria-expanded='true']`) and
the theme toggle's hover. Nav links are `muted` at rest and `ink` when current. A lit lamp fills
`accent`; the current item's lamp takes an `accent` ring rather than the `lamp-edge` one, because
`.nav-links a.is-current .lamp` is the more specific rule and `lamp-edge` is only the ring on a
lamp lit outside the nav — the two are the same amber at night and differ on paper, where the
ring stays `accent` `#e09a12`. **The lamp is the indicator, the text weight does not change.**
The current item carries `aria-current`.

The **signal strip** is a fixed, decorative layer of twelve strips on the frame's own column
lines, `z-index: -1`, `pointer-events: none`. A ray — a 1px-wide soft gradient of `accent` —
translates from above the fold to below it inside each strip, staggered by `--strip-step`
120ms so the charge crosses the page as well as running down it. Cycle `--dur-pulse` 26s. It
runs from the wordmark, which is where the charge is drawn from.

Hero cells: eleven cells between the column lines, each a vertical gradient of `accent` from
transparent through the middle, inset 1px per side so the glow sits *between* the lines rather
than on them. The wave (`--dur-wave` 9s) peaks at 0.03 opacity, staggered by the cell's grid
index. Under a fine pointer the wave pauses and the cell under the pointer lights at 0.07 over
`--dur-fade` 220ms together with its two nearest neighbours — three cells, except at the two ends
of the row, where the neighbour that does not exist is simply not lit and the count is two.

## The Now panel

Two lanes, **Study** and **Work**, sharing one year axis: a `tl-lane-title` heading per lane,
year ticks drawn as decoration over the lists, and each stop a real list item, so the panel
reads with no CSS and no script. The lanes are already a single column at every width — the
`.timeline` is `flex-direction: column` at 1440 as much as at 390, and the two lanes sit one
above the other. What 48rem changes is the year axis, which is hidden, and the stops, which go
from a grid to a column; the lane order is the same either way. It is a timeline, not a card
grid — the earlier two-cell version is gone.

## The Work node diagram

Each Work card carries a small node diagram instead of prose about architecture: the study's
modules as marked nodes with the breaks (`node-break`) that matter, at card scale, in mono at
`2xs`. It is the case study's flowchart reduced to its skeleton, so a scanner sees the shape of
the system before reading the summary. The card is not a card in the boxed sense: a ruled row,
with a `rule` line on top, no background of its own and square corners, and its only hover
affordance is the title and the arrow.

## Achievements, Certificates, Contact

**Achievements** keeps the readout (the figures) plus one line per item. The lead item's line is
the two handles and nothing else — the figures already carry the platform names and the ratings,
so the line adds only the names the owner goes by there. Every item's CV sentence stays in
`src/content.ts` as the source both views are split from; none is printed as a paragraph.
**Certificates** live inside Achievements rather than as their own section: a grid of
certificate cards that open a `CertificateDialog` with the preview image and its details; the
dialog is a real modal with a backdrop token, focus trapped and Escape to close.
**Contact** sets the address in the `email` clamp and puts a **Copy email** button beside it —
a `copy-button` in mono `2xs`, `ink-2` on a `rule-strong` border, turning amber on hover, that
copies to the clipboard and confirms in place. The address itself is owner-voice copy from
`src/content.ts`; the design does not restate it.

## Motion

Motion is one idea: charge moving through a panel. It is slow, it is decoration, and it never
carries information.

- **The wave** (`--dur-wave` 9s, hero cells) and **the pulse** (`--dur-pulse` 26s, the strip
  ray) are the signature. Both animate only `opacity` and `transform`, so they stay on the
  compositor and cannot shift layout.
- **The pointer's three cells** fade in over `--dur-fade` 220ms.
- **Small transitions** use `--dur-fast` 160ms and `--ease-out`; the lamp uses `--dur-lamp`
  120ms linear.
- **Pausing is required, not optional.** Both signature animations pause when the tab is hidden
  and while the page is being scrolled — the root's `data-motion` carries `on` / `paused` /
  `scrolling`. The hero cells additionally stop when the hero scrolls out of view
  (`[data-inview='false']`); the rail does not, because it is fixed to the viewport. The motion
  has no pause *control* of its own: the only pause button on the site is the flowchart's, on a
  case study.
- **Reduced motion removes it entirely:** under `@media (prefers-reduced-motion: reduce)` the
  wave and the ray are `animation: none` and `opacity: 0`, and the flowchart shows its still
  picture (the `still` edge and node set in `src/diagrams.ts`), not a paused mid-frame.

## The flowchart engine

The two case studies draw a real graph, not a picture of one, and its rules are design rules
because a wrong label changes what the diagram *says*. Ticket-Pipeline draws its own pipeline:
a React app, a Hono API, an SQS queue, a Worker, an LLM gateway with a Primary and a Backup
model, an Event log onto the customer's page and the Ops feed, then the failure path (stage
fails, retry, needs attention, replay by staff) and the ticket's four states. RannaGhor draws
its request path. Every box is a node in `src/diagrams.ts`; the study's Stack string in
`src/content.ts` names the wider stack, and the two are not the same list.

**Two layouts.** A desktop graph, and a vertical one used below the container thresholds above.
The vertical layout is a complete picture of the same graph — spine, then each branch group as
its own stacked cluster with a heading naming where it starts — not a crop. It switches on
container width so each study keeps its own threshold.

**Surface and motion.** The panel has no ground of its own: the page's background shows
through, the panel keeps only its top and bottom rules, and the edge-label pills are cut from
`--bg` so they still hide the line under a label. Every edge is drawn as two paths — a base
track in `--track`, always visible end to end, and a lit overlay in `--accent` whose visible
length is the stretch the token has covered. Edges the run has finished crossing stay lit:
the newest keeps a soft accent glow at full strength and older ones step down (0.55, 0.38,
0.26, 0.18), so the trail shows where the glow came from. A run's restart clears every
overlay. Failure and refusal edges stay `--fail`. The still picture (prerender, reduced
motion) is the finished-run drawing: the overlays are invisible there.

**Controls.** Pause/Play is joined by a speed control (0.75x, 1x, 1.5x; default 1x, three
`aria-pressed` buttons sharing the Pause control's shape) that multiplies the clock, so the
change takes effect on the next frame without a jump. While paused, a Reset button restarts
the first step of the first run, clears the trail and resumes playback. Under reduced motion
none of the three controls is rendered.

**A heading names a group; the edge into it keeps its label.** On the vertical layout the edge
that enters a cluster is drawn as a short arrow in a 30-unit band between the heading and the
group's first box, so the route or the failure that reaches the group still says which it is. The
arrow cannot come from the edge's real source — that box may sit far up the spine, and a line from
it would cross every group in between — so its path starts on the target's own centre line. The
heading stays a heading; no edge loses its label to it. Without this the refused branch, the thing
RannaGhor is about, was drawn with no label at all below the desktop threshold. One consequence
worth knowing: the edge's source end touches the heading's row rather than a box.

**What a label may and may not do.** These are enforced in `holds()` and by the tests, not by
the eye:
- A label's pill must enclose its own text (`F8-2`).
- A pill may cover no other label's ink. What is enforced about node boxes is *no hidden ink*:
  `touchesBox` rejects a seat only when the pill and a box overlap by a whole pixel on both axes
  (`F7-2`, `flowchart.spec.ts`), because a label in a row gap sits a pixel or two from the boxes
  either side and paints nothing over them. The 4 units of air are a *preference of the desktop
  search*, not a rule: `clears()` rejects a seat within `Math.hypot(dx, dy) < 5` units, and the
  vertical layout has no such search, so nothing there holds 4px.
- **Attribution (`ATTRIBUTION = 6`)** — a seat is legal only if the pill is at least 6 units
  nearer its own painted edge than any other edge's stroke. A shared run can never satisfy
  this, so a label is pushed onto a stretch of its own line that no other edge covers. That is
  why `authorise` and `refuse` out of Role check no longer share a run: `edgePath` takes a
  `sibling` index and staggers the departure so each edge owns a stretch. No label is
  special-cased.
- An edge's final approach runs at least one marker length straight, so the arrowhead lands on
  a leg rather than on an elbow (`P2b-8`).
- No height clamp exists and none may return. `Ruling 12`: the 12px floor outranks fitting in
  one window, so the chart scrolls on short viewports rather than shrinking its labels. The
  desktop Ticket-Pipeline chart *does* fit a 1440x900 window (`P2b-4`, row spacing tightened to
  `GAP_Y` 30), and at 1440 the type renders above the floor; below that height it scrolls. The
  drawing is 892px against the 900px window, but the 65px sticky bar means the chart is never
  wholly on screen at once — it fits the window, not the viewport under the bar.

**Both layouts are held to it.** `holds()` (`src/Diagram.tsx`) has no layout guard: every seat on
either layout goes through the same test, the same outward search and the same own-edge walk. What
differs is only the *seed* the search starts from — `bestAnchor` on the desktop graph, `labelPos`
on the vertical one — and the seed is a preference, not a permission: a label whose seed is illegal
is moved like any other. So the attribution rule is enforced on the vertical layout too, not merely
measured there.

The shared departure leg where two edges leave one box is staggered at the box edge itself:
`edgePath`'s `sibling` index moves both the departure point and the lane, so two edges out of
one box never share a segment, not even the first 12 units. A shared endpoint on the box
border is the only thing two edges have in common.

## Do's and don'ts

### Do
- **Do** put every page inside the frame, with the 12 columns and both hairlines.
- **Do** spend amber on the live signal only: current item, lit lamp, charge, primary action,
  focus.
- **Do** set numbers, labels, stacks and system names in Martian Mono, and prose in Mona Sans.
- **Do** separate with a 1px `rule`; outline a pressable control with `rule-strong`.
- **Do** keep targets at `--target` 2.75rem and keep the visible focus ring
  (`--line-track`, offset `--focus-offset`).
- **Do** stop all signature motion under reduced motion and give the flowchart its still picture.
- **Do** hold every flowchart label to the invariants above — including the 12px floor read
  from the rendered transform.

### Don't
- **Don't** add a second accent, or use `fail` as a UI colour.
- **Don't** put a filled card behind body copy — the Tech decision card is the one exception, and
  it earns it by being a short paired readout rather than prose. `bg-raised` is otherwise the
  surface of things that sit over the page (the certificate dialog and its thumbnail, the node
  diagram), never the bar; the flowchart panel sits on the page ground with ground-filled pills,
  and a Work card is a ruled row rather than a raised box.
- **Don't** add a drop shadow, a blur, or a third elevation step; the only `box-shadow`s are the
  zero-blur lamp rings.
- **Don't** introduce a third rule strength or a fourth text weight.
- **Don't** let the chart shrink to fit: the floor wins and the panel scrolls.
- **Don't** special-case a single label, and don't seat a label by eye where a rule decides.
- **Don't** bring back the height clamp, or re-describe the pre-Signal-Box chain design.
- **Don't** restate owner-voice copy (the address, the statement, the record sentence) in this
  document; it lives in `src/content.ts`.
