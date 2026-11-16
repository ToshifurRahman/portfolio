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
    fontWeight: 600
    letterSpacing: "-0.03em"
  case:
    fontSize: "clamp(1.75rem, 1.35rem + 1.5vw, 2.5rem)"
    fontWeight: 600
    letterSpacing: "-0.03em"
  figure:
    fontSize: "clamp(2rem, 1.55rem + 1.5vw, 2.75rem)"
    fontWeight: 600
    letterSpacing: "-0.03em"
  motto:
    fontSize: "clamp(1.5rem, 1.12rem + 1.35vw, 2.25rem)"
    fontWeight: 520
    letterSpacing: "-0.015em"
  email:
    fontSize: "clamp(1.75rem, 1rem + 3.4vw, 3.5rem)"
    fontWeight: 680
    letterSpacing: "-0.045em"
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
    fontWeight: 520
  "2xs":
    fontSize: "0.6875rem"
    fontWeight: 600
    letterSpacing: "0.04em"
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
    typography: "{typography.md}"
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
    textColor: "{colors.ink-2}"
    border: "{lines.line} solid {colors.rule-strong}"
    rounded: "{rounded.default}"
    height: "2.75rem"
  ghost-hover:
    borderColor: "{colors.accent}"
    textColor: "{colors.accent-text}"
  case:
    backgroundColor: "{colors.bg-raised}"
    border: "{lines.line} solid {colors.rule}"
    rounded: "{rounded.default}"
  copy-button:
    textColor: "{colors.ink-2}"
    border: "{lines.line} solid {colors.rule-strong}"
    typography: "{typography.2xs}"
  flow-node:
    backgroundColor: "{colors.bg-raised}"
    border: "{lines.line} solid {colors.rule-strong}"
    typography: "{typography.2xs}"
  flow-edge:
    stroke: "{colors.muted}"
  flow-edge-branch:
    stroke: "{colors.muted}"
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
- Flat and hairline: 1px rules, 6px radii, no shadows, no filled cards behind body copy.
- The chart engine is part of the design language, so its rules are design rules (below).

## Colors

Every value below is the token as it is named in `src/styles.css`. The dark values are on
`:root`; the light values are the same token names re-declared under `:root[data-theme='light']`,
which is why no component ever branches on theme.

### The night panel (`:root`)
- **Ground** (`bg` `#0a0b0d`): the page. **Raised** (`bg-raised` `#0f1114`): the one step up —
  the bar's band, cards, diagram boxes. There is no third elevation.
- **Ink** (`ink` `#f2f1ec`) is body text and headings. **`ink-2`** (`#c4c7cd`) is the second
  voice: ghost buttons, copy controls, quieter labels. **`muted`** (`#8b9099`) is tertiary —
  captions, diagram labels, meta. Three text weights, no more.
- **Rules** come in two strengths, and the distinction is load-bearing: `rule` `#23272d`
  separates rows and closes the bar; `rule-strong` `#343941` outlines a control that can be
  pressed. `grid` `#15181c` draws the column lines behind the introduction, deliberately
  below `rule` so the frame never competes with content.
- **Track** (`track` `#2c3138`) is the unfilled part of any track or rail, and `lamp-off` is
  the same value: an unlit lamp and an empty track are the same darkness.

### The signal
- **Amber** (`accent` `#ffb340`) is the only saturated colour on the site: a lit lamp, the
  live token on the track, the current nav item, the glow in a hero cell, the border of a
  focused control. **`accent-hover`** (`#ffc56b`) is its hover. **`on-accent`** (`#1a1204`) is
  text on an amber fill — a brown-black, not the ground, so amber stays legible as a button.
- **`accent-text`** (`#ffb340`) exists separately from `accent` because the two jobs differ:
  a fill needs a colour that reads as light, text needs one that passes contrast on the
  ground. In the light theme they diverge — `#e09a12` for fills, `#7a4600` for text — because
  amber text on paper fails AA at the fill colour.
- **`lamp-edge`** is the hairline ring around a lit lamp; `#ffb340` at night, `#7a4600` on
  paper so the lamp keeps an edge there.
- **`fail`** (`#ff5b4a` night, `#c2321f` paper) is reserved for failure states in the
  flowcharts' semantics. It is not a UI colour and never marks a section.

### The paper theme
`bg` `#e8e5dd` and `ink` `#121417`, with `muted` `#5a5f68`, `rule` `#cdc7bb`, `rule-strong`
`#b3ad9f`, `grid` `#dcd7cc`, `track` and `lamp-off` `#a8a294`/`#bab4a6`. The accent darkens
rather than brightens (`#e09a12` fill, `#7a4600` text) so amber reads as a signal on paper
instead of as a highlighter. `backdrop` is the only translucent value (`rgb(18 20 23 / 0.55)`
on paper, `rgb(4 5 6 / 0.82)` at night) and it is used solely behind an overlay.

### Named rules
**The One Signal Rule.** Amber means live or go. It marks the current item, the lit lamp, the
charge, the primary action, and the focused control. It is never a heading colour, a section
background, or decoration.

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
0.875rem, `md` 0.9375rem, `body` 1.0625rem, `lg` 1.1875rem, `xl` 1.375rem, then five fluid
`clamp()` sizes — `figure`, `motto`, `h2`, `case`, `email`, `title`, `name`.

- **Name** (`name`, weight 680, tracking -0.045em): the home hero, clamped to 6rem.
- **Title** (`title`): the case-study title. **Email** (`email`): the contact address.
- **H2** (`h2`): section headings. **Case** (`case`): a work card's title. **Figure**:
  a proof number. **Motto** (`motto`, weight 520): the hero statement.
- **Body** 1.0625rem at weight 430 for prose; `md` and `sm` for secondary lines; `2xs` with
  mono for labels and diagram text.
- Weights are named tokens (`regular` 430, `medium` 520, `semibold` 600, `bold` 680) rather
  than the usual 400/500/600/700, so headings sit a shade heavier than system defaults.

### Named rules
**The Mono Means Data Rule.** If it is a number, a station, a stack, a label or a system name,
it is Martian Mono. If it is a sentence, it is Mona Sans. A line never mixes the two.

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

**Case studies.** A `study-head` (back link, title, lede), then the sticky sub-nav, then the
seven sections. The sub-nav is the bar's own `navbar` treatment applied to the case study's
section list, and it lights **Work** while a case study is open — the owner asked for the two to
be one design, not two.

**Breakpoints.** `57rem` collapses the bar into a menu button; `48rem` stacks the Now lanes and
the Work node structure. The flowcharts switch layout on *container* width, not viewport:
`@container (max-width: 1171px)` for Ticket-Pipeline and `1155px` for RannaGhor, each one the
study's measured viewBox width minus one. Those numbers are not arbitrary — they are where the
desktop chart would drop below 1:1 and take every label under the 12px floor.

## The bar and the signal strip

The bar is sticky, `bg` with a `rule` underline, and holds the wordmark (the one amber text in
the chrome, `accent-text`), the five nav links with a lamp each, and a CV action. Nav links are
`muted` at rest and `ink` when current, with the lamp filling amber and taking a `lamp-edge`
ring: **the lamp is the indicator, the text weight does not change.** The current item carries
`aria-current`.

The **signal strip** is a fixed, decorative layer of twelve strips on the frame's own column
lines, `z-index: -1`, `pointer-events: none`. A ray — a 1px-wide soft gradient of `accent` —
translates from above the fold to below it inside each strip, staggered by `--strip-step`
120ms so the charge crosses the page as well as running down it. Cycle `--dur-pulse` 26s. It
runs from the wordmark, which is where the charge is drawn from.

Hero cells: eleven cells between the column lines, each a vertical gradient of `accent` from
transparent through the middle, inset 1px per side so the glow sits *between* the lines rather
than on them. The wave (`--dur-wave` 9s) peaks at 0.03 opacity, staggered by the cell's grid
index. Under a fine pointer the wave pauses and exactly three cells — the one under the pointer
and its two nearest neighbours — light at 0.07 over `--dur-fade` 220ms.

## The Now panel

Two lanes, **Study** and **Work**, sharing one year axis: a `tl-lane-title` heading per lane,
year ticks drawn as decoration over the lists, and each stop a real list item, so the panel
reads with no CSS and no script. Below 48rem the two lanes stack into one column and keep the
same order. It is a timeline, not a card grid — the earlier two-cell version is gone.

## The Work node diagram

Each Work card carries a small node diagram instead of prose about architecture: the study's
modules as marked nodes with the breaks (`node-break`) that matter, at card scale, in mono at
`2xs`. It is the case study's flowchart reduced to its skeleton, so a scanner sees the shape of
the system before reading the summary. The card itself is `bg-raised` with a `rule` border and
6px radius, and its only hover affordance is the title and the arrow.

## Achievements, Certificates, Contact

**Achievements** keeps the readout (the figures) plus one line per item — a record sentence and
the item, nothing more. **Certificates** live inside Achievements rather than as their own
section: a grid of certificate cards that open a `CertificateDialog` with the preview image and
its details; the dialog is a real modal with a backdrop token, focus trapped and Escape to close.
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
- **Pausing is required, not optional.** The signature motion pauses when the hero is out of
  view, when the tab is hidden, and while the page is being scrolled, and there is a visible
  pause control. The `data-motion` attribute on the root carries `on` / `paused` / `scrolling`.
- **Reduced motion removes it entirely:** under `@media (prefers-reduced-motion: reduce)` the
  wave and the ray are `animation: none` and `opacity: 0`, and the flowchart shows its still
  picture (the `still` edge and node set in `src/diagrams.ts`), not a paused mid-frame.

## The flowchart engine

The two case studies draw a real graph (React/Vite/Postgres for Ticket-Pipeline; the RannaGhor
request path), not a picture of one, and its rules are design rules because a wrong label
changes what the diagram *says*.

**Two layouts.** A desktop graph, and a vertical one used below the container thresholds above.
The vertical layout is a complete picture of the same graph — spine, then each branch group as
its own stacked cluster with a heading naming where it starts — not a crop. It switches on
container width so each study keeps its own threshold.

**What a label may and may not do.** These are enforced in `holds()` and by the tests, not by
the eye:
- A label's pill must enclose its own text (`F8-2`).
- A pill may cover no other label's ink and must sit at least 4px from any node box (`F7-2`).
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
  `GAP_Y` 30), and at 1440 the type renders above the floor; below that height it scrolls.

**Deliberately not done.** The vertical layout still places its labels with `labelPos`, not the
`holds()` resolver, so it passes the attribution test as measured rather than as enforced
(`P2b-6`, declined as structural). The shared 12-unit departure leg where two edges leave one
box remains by construction before the sibling stagger separates them.

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
- **Don't** put a filled card behind body copy; `bg-raised` is for controls and readouts.
- **Don't** add shadows, blur or a third elevation step.
- **Don't** introduce a third rule strength or a third text weight.
- **Don't** let the chart shrink to fit: the floor wins and the panel scrolls.
- **Don't** special-case a single label, and don't seat a label by eye where a rule decides.
- **Don't** bring back the height clamp, or re-describe the pre-Signal-Box chain design.
- **Don't** restate owner-voice copy (the address, the statement, the record sentence) in this
  document; it lives in `src/content.ts`.
