---
name: Toshifur Rahman Portfolio
description: A software engineer drawn as one state machine, in near-black, warm ink and a single vermilion.
colors:
  bg: "#0e0f11"
  ink: "#f2f0ea"
  muted: "#9a9ea5"
  rule: "#2a2d31"
  accent: "#ff5b36"
  on-accent: "#0e0f11"
  light-bg: "#f2f0ea"
  light-ink: "#0e0f11"
  light-muted: "#565a61"
  light-rule: "#d3d0c7"
  light-accent: "#c23410"
  light-on-accent: "#f2f0ea"
typography:
  display:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "clamp(4rem, 13.2vw, 13.2rem)"
    fontWeight: 900
    lineHeight: 0.88
    letterSpacing: "-0.005em"
    fontVariation: "'wdth' 62"
  headline:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 6.6vw, 6rem)"
    fontWeight: 900
    lineHeight: 0.88
    letterSpacing: "-0.005em"
    fontVariation: "'wdth' 62"
  title:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 4.8vw, 4.75rem)"
    fontWeight: 900
    lineHeight: 0.88
    letterSpacing: "-0.005em"
    fontVariation: "'wdth' 62"
  subtitle:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 2.6vw, 2.375rem)"
    fontWeight: 900
    lineHeight: 0.88
    letterSpacing: "-0.005em"
    fontVariation: "'wdth' 62"
  state-label:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "clamp(1.375rem, 2.6vw, 2.875rem)"
    fontWeight: 900
    lineHeight: 0.88
    letterSpacing: "-0.005em"
    fontVariation: "'wdth' 62"
  lede:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "clamp(1.25rem, 2vw, 1.875rem)"
    fontWeight: 400
    lineHeight: 1.3
  body:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.55
  body-long:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.6
  fact:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
  small:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.1em"
  action:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 700
    letterSpacing: "0.06em"
  state-num:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.04em"
rounded:
  none: "0"
  terminal: "50%"
spacing:
  line: "2px"
  line-thick: "3px"
  nudge: "4px"
  pad: "clamp(1rem, 4.4vw, 4rem)"
  gap: "clamp(1.5rem, 3.9vw, 3.5rem)"
  column: "2.5rem"
  connector: "3rem"
  box: "7.5rem"
  box-compact: "3.25rem"
components:
  state-box:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    typography: "{typography.state-label}"
    rounded: "{rounded.none}"
    padding: "0.75rem 1rem 0.875rem"
    height: "{spacing.box}"
  state-box-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bg}"
  state-box-current:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
  panel:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "clamp(1.75rem, 3.2vw, 3rem) clamp(1.25rem, 3.2vw, 3rem) clamp(1rem, 2vw, 1.5rem)"
  action-link:
    textColor: "{colors.accent}"
    typography: "{typography.action}"
    height: "2.75rem"
  action-link-hover:
    textColor: "{colors.ink}"
  text-button:
    textColor: "{colors.muted}"
    typography: "{typography.action}"
    height: "2.75rem"
  text-button-hover:
    textColor: "{colors.ink}"
  progress-step:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0.4375rem 0.375rem"
  progress-step-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bg}"
  progress-step-current:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
  diagram-node:
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0.5625rem 0.75rem"
  skip-link:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bg}"
    padding: "0.75rem 1rem"
---

# Design System: Toshifur Rahman Portfolio

## Overview

**Creative North Star: "The Chain"**

The site is one state diagram. On the home page five square states in a row (Who, Builds, Skills, Projects, Contact) describe the owner as a system, with a filled start dot on the left and a ringed end dot on the right. The selected state fills with vermilion and a connector drops from it into an outlined panel holding that part of the owner. Case-study pages reuse the same chain as a compact, sticky row of nine states, one per section, and architecture diagrams inside a case study are drawn from the same boxes and arrows.

Everything else is typography and rules. One family, Archivo, does all the work: extra-condensed heavy uppercase for names and headings, regular width for reading. Content is separated by 2px lines on top of each row, never by filled surfaces. The ground is near-black, the ink is a warm off-white, and a single vermilion marks where the machine is and where it can go next. Dark is the designed-for state; a light theme swaps ground and ink and deepens the vermilion.

The mood is blunt, legible and engineered: large, heavy, few elements, each one drawn with a straight line. Motion is nearly absent. A state change is an instant swap; the panel redraws from its top edge in 0.24s and the arrow on a transition link nudges 4px on hover, and both are removed under reduced motion.

**Key Characteristics:**
- A state diagram is the navigation: boxes, straight arrows, start dot, end ring.
- One typeface, two widths: condensed 900 uppercase for display, regular width for text.
- One accent, used only for the current state and the way out of it.
- Flat and square: no shadows, no corner radius on any box, no filled content surfaces.
- 2px lines carry all structure: box outlines, arrows, row rules, link underlines, focus ring.
- Two-digit numbers (01 to 09) name every state and section.

## Colors

A two-tone ground and ink with one hot accent; neutrals are slightly cool on the dark side and slightly warm on the paper side.

### Primary
- **Signal Vermilion** (`accent`): the solid fill of the current state (home state box, current step in the case-study progress chain), the outline of the open panel and the connector into it, and transition links, meaning the links that move the visitor to another state or page. Large contact links turn vermilion on hover, and the text selection highlight uses it. In the light theme it deepens to **Fired Vermilion** (`light-accent`) so text and fills keep AA contrast on paper.
- **On-accent** (`on-accent`): text set on a vermilion fill. Same value as the ground in each theme.

### Neutral
- **Carbon Ground** (`bg`): the page and the inside of every unselected box. Also the text colour of a hovered (inverted) state.
- **Warm Ink** (`ink`): text, state box outlines, arrows, the start dot and end ring, the strong rule above a case-study entry or meta item, and the focus ring.
- **Slate Muted** (`muted`): labels, section numbers, secondary descriptions, captions, footer text and the back/secondary text button at rest.
- **Graphite Rule** (`rule`): the quiet 2px line above each row inside a panel or section, the line under each case-study section, and the footer line.
- **Light theme**: ground and ink swap (`light-bg`, `light-ink`), with `light-muted` and `light-rule` taking the same roles. The theme is set by `data-theme` on the root element and the tokens keep their names, so components never branch on theme.

### Named Rules
**The Current State Rule.** Vermilion says "you are here" or "go there". It fills the one current state, outlines its panel, and colours transition links. It is never a heading colour, a background wash, or decoration.

**The Two Rules Rule.** A line in ink is part of the diagram or opens a major entry; a line in rule colour separates rows of content. Do not introduce a third line colour.

## Typography

**Display Font:** Archivo Variable at width 62% (with Archivo, system-ui, sans-serif)
**Body Font:** Archivo Variable at normal width (same stack)

**Character:** One family pushed to two extremes. The condensed 900 uppercase is loud and mechanical, like stencilled labelling on equipment; the regular width is plain and quiet so long case-study text reads without effort.

### Hierarchy
- **Display** (900, width 62%, uppercase, line-height 0.88, tracking -0.005em): the page title. Case-study and not-found titles use the `display` clamp; the owner's name on the home page is sized to the viewport so it fills one line (12.8vw, capped at 12.8rem from 100rem wide, and 24.5vw on two lines below 62rem).
- **Headline** (same style, `headline` size): the heading inside a state panel. The next-case-study link at the foot of a case study steps up to clamp(3rem, 9vw, 9rem).
- **Title** (same style, `title` size): case-study section headings, with the two-digit section number in muted in front, and case-study entry titles in the Projects panel.
- **Subtitle** (same style, `subtitle` size): row titles inside a panel. Result figures in a case study use the same style at 2.5rem.
- **State label** (same style, `state-label` size): the word inside a state box; 1.875rem in the narrow stacked list.
- **Lede** (400, `lede` size, line-height 1.3, max 34em): one sentence under a title.
- **Body** (400, 1.0625rem, line-height 1.55): default text. Row descriptions are capped at 36 to 44em.
- **Body long** (400, 1.125rem, line-height 1.6, max 42rem): case-study prose.
- **Fact** (600, 1.25rem, line-height 1.3): values in fact rows and skill lists.
- **Small** (400, 0.9375rem): footer, diagram captions and notes. Diagram node text is this size at 700.
- **Label** (600, 0.8125rem, tracking 0.1em, uppercase, muted): the term of a term/value pair, diagram lane names, the stack line under a case-study entry, and the "More projects" list heading.
- **Action** (700, 0.9375rem, tracking 0.06em, uppercase, underlined): transition links and text buttons.
- **State number** (700, 1.125rem, tracking 0.04em): the two-digit number in a state box. In the compact progress chain the whole step is 0.8125rem, 700, tracking 0.03em.

### Named Rules
**The One Family Rule.** Archivo only. Hierarchy comes from width, weight and size, never from a second typeface.

**The Condensed Means Heading Rule.** Width 62% is always 900 and uppercase, and only for names, headings, state labels, step counters and figures. Running text is never condensed and never uppercase.

**The Two Digits Rule.** States and sections are numbered 01, 02 and so on, shown inside the box or directly in front of the heading in the same line. A number is never a separate tag floating above a heading.

## Layout

The page is a single column up to 100rem wide, centred, with fluid side padding (`pad`). There is no header bar: the name or the case-study title is the top of the page.

**Home.** The name spans the full width. Under it the chain is a five-column grid with a fluid gutter (`gap`); each gutter holds the arrow into the next state. The chain is inset 3rem on each side to seat the start dot and end ring, and all terminals and arrows sit on the vertical centre of the boxes (`box`, 7.5rem tall). The open panel spans all five columns, 3rem below the chain (`connector`), with a vertical connector dropping from the centre of the selected box. Each panel ends with a rule and the transitions out of that state: back on the left in muted, next on the right in vermilion.

**Inside a panel.** Content is rows, each with a 2px line on top and 0.75 to 1.125rem of vertical padding. Rows are grids with a fixed first column (12rem for labels, 16rem for project names) and a 2.5rem column gap (`column`). Fact rows sit side by side with a 13rem minimum; case-study entries sit two across.

**Case study.** Back link, title, lede, a row of meta facts ruled in ink, then the sticky progress chain, full bleed with a rule beneath. Each section is a 5fr/7fr grid: the heading sticks at 5rem from the top in the left column while the text scrolls on the right, capped at 42rem. Sections are separated by a rule and clamp(2.5rem, 6vw, 5rem) of vertical padding.

**Responsive.** Below 62rem the chain turns vertical: the five states become full-width bars 3.25rem tall (`box-compact`) with number and label on one line, joined by short vertical arrows, and the panel opens under the whole list so all five states stay in view. The connector is dropped, row grids collapse to one column, and case-study headings stop sticking. The progress chain scrolls sideways and keeps the current step in view. Below 40rem architecture lanes turn vertical with downward arrows.

## Elevation & Depth

The system is flat. There are no shadows, no blur and no layered surfaces; nothing is lifted. The only stacking is the sticky progress chain and it is separated from the page by a 2px rule on an opaque ground, not by a shadow.

State is shown by inversion and fill instead of depth: a hovered box inverts to ink on ground, the current box fills with vermilion. The one gradient in the build is a hard-edged radial used as geometry to draw the centre dot of the end ring; gradients are not a surface treatment here.

### Named Rules
**The Flat Rule.** No shadows and no translucent layers, at rest or on interaction. Hover and selection change fill and colour only.

## Shapes

Square and outlined. Every box (state, progress step, diagram node, panel) has a 2px outline and no corner radius. The only round forms are the two terminals of a chain: a filled start dot and an end ring with a centre dot. Arrows are a 2px straight line ending in an open chevron head that touches the box it leads into; the same chevron rotates to point down when a chain turns vertical. The arrow inside a transition link is the same drawing as an inline 24 by 12 SVG with a 2px stroke.

Line weights are two: 2px (`line`) for everything, 3px (`line-thick`) for the underline of large contact links and the focus ring offset.

### Named Rules
**The Box Means State Rule.** An outlined box is a state or a node in a diagram, and the only container is the panel of the current state. Content inside is never boxed again; it is separated by rules.

**The Round Means Terminal Rule.** A circle marks the start or end of a chain and nothing else.

## Components

### State box
The primary control: a square, outlined disclosure button that names one part of the owner.
- **Shape:** square corners, 2px ink outline, 7.5rem tall, number top-left and label bottom-left. Below 62rem a 3.25rem bar with number and label side by side.
- **Default:** ground fill, ink text.
- **Hover:** inverts to ink fill with ground text. No transition.
- **Current:** vermilion fill and outline, on-accent text; `aria-expanded="true"`.
- **Behaviour:** click or Enter selects; arrow keys, Home and End move focus along the chain; the URL hash names the state.

### Chain
Start dot (1.125rem, filled ink), states joined by arrows drawn in each gutter, end ring (1.5rem, 2px outline with a centre dot). The first arrow runs from the dot and the last state runs a short line out to the ring.

### Panel
The open state's content: a 2px vermilion outline with fluid padding, joined to its state by a 2px vermilion connector 3rem tall. It opens with a top-to-bottom clip reveal (0.24s, cubic-bezier(0.16, 1, 0.3, 1)). The heading comes first, with nothing above it. The last row is the transitions bar.

### Transition link
- **Style:** uppercase 700, 0.9375rem, tracking 0.06em, underlined 2px with a 0.35em offset, followed by the arrow drawing; at least 2.75rem tall.
- **Colour:** vermilion.
- **Hover:** text turns ink and the arrow moves 4px right in 0.2s. Also triggered when the link sits inside a larger linked entry that is hovered.

### Text button
Same type as the transition link, in muted, turning ink on hover. Used for going back (the arrow is mirrored and comes first) and for the theme switch in the footer.

### Progress chain
The home chain at small scale for case-study pages: sticky at the top, full bleed, opaque ground, rule beneath. Start dot 0.75rem, end ring 1rem, steps as small outlined boxes (number and section name, 0.8125rem 700 uppercase) joined by arrows that stretch to fill the row. Hover inverts; the step for the section in view is filled vermilion and marked `aria-current`.

### Ruled rows
The list pattern everywhere: a 2px rule-colour line on top, 0.75 to 1.125rem padding, a label or name in the first column and the value or description in the second. Variants: fact rows (label above a 600-weight value), numbered steps (condensed 900 counter at 1.75rem in a 3.25rem left column), results (condensed figure at 2.5rem beside a plain description), and lead-in points (bold first phrase). A row group that opens a major entry (case-study entries, case-study meta) uses an ink line instead.

### Case-study entry
A whole-block link with an ink line on top: condensed title, summary, stack line in label style, and a transition link. Hovering the block underlines the title (0.07em thick) and activates the transition link.

### Contact link
A condensed display link (clamp(1.75rem, 4.4vw, 3.5rem)) with a 3px underline beside a label. Turns vermilion on hover.

### Architecture diagram
Lanes of outlined nodes (0.9375rem, 700) with a label-style lane name above and an optional muted note below. Nodes in sequence are joined by the same arrow as the chain; a lane of siblings has no arrows and a tighter gap. A caption in muted sits under a rule. Every diagram is real list markup with an accessible name.

### Focus and skip link
Focus is a 2px ink outline offset by 3px on every interactive element. The skip link is an ink block with ground text that slides in from the top on focus.

## Do's and Don'ts

### Do:
- **Do** draw every structural line at 2px: outlines, arrows, rules, underlines and the focus ring.
- **Do** keep vermilion to the current state, its panel and connector, and transition links.
- **Do** set every heading in Archivo at width 62%, weight 900, uppercase, line-height 0.88.
- **Do** number states and sections with two digits, inside the box or inline before the heading.
- **Do** separate content with a 2px line on top of each row and a 2.5rem column gap.
- **Do** show hover by inversion (ink fill, ground text) and selection by vermilion fill.
- **Do** use the theme tokens by name so the light theme follows without extra rules.
- **Do** keep targets at least 2.75rem tall for links and buttons, and keep the visible 2px focus outline.
- **Do** remove the panel reveal and arrow nudge under reduced motion.

### Don't:
- **Don't** add shadows, blur or translucent layers.
- **Don't** round the corners of a box. Only the start dot and end ring of a chain are round.
- **Don't** put a filled or outlined card around content. The panel of the current state is the only container.
- **Don't** use a gradient as a surface or text fill.
- **Don't** introduce a second typeface or a second accent colour.
- **Don't** set running text in the condensed width or in uppercase.
- **Don't** place a small label or tag above a heading. The heading comes first.
- **Don't** animate a state change beyond the 0.24s panel reveal; the fill swap is instant.
- **Don't** add a profile picture or decorative imagery.
