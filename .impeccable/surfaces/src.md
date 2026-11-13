---
version: 1
slug: "src"
primary_target: "src"
related_targets: []
---

# Surface brief: portfolio site (home + case study pages)

Scope: `src/` of the portfolio; home page `/` and `/work/:slug`. Visitor mode: Experience.

Audience and job: recruiters scanning for thirty seconds, then hiring engineers reading a case study. Action: open a case study or contact the owner. Content: the owner's facts, two nine-section case studies (Ticket-Pipeline, RannaGhor), short entries for other projects. Constraints: dark first, minimal, no profile picture, WCAG 2.2 AA, no invented biography.

Confirmed by the owner: no themed costume; the state diagram is the main thing on screen and describes the owner as a system (Who, Builds, Skills, Projects, Contact); overall feel closest to aathifzahir.vercel.app (bold numbered sections, big uppercase headings).

Memorable moment: selecting a state fills it vermilion and the panel under the diagram swaps to that part of the owner.

Unresolved: location, bio details, email, LinkedIn, CV, availability (placeholders).

## Direction contract

THESIS: The owner is drawn as one state machine. Five large states in a row are the home page; the selected state's details open directly beneath. Refuses the centred-name-two-buttons-card-row portfolio.

OWN-WORLD: Near-black ground #0E0F11, ink #F2F0EA, muted #8D9198, rule #2A2D31, muted built as #9A9EA5 for contrast. One vermilion #FF5B36 with three roles only: the solid fill of the current state, its panel outline and connector, and transition links (the links that move the visitor to another state or page). Archivo throughout: display in extra-condensed 900 uppercase, two-digit state numbers. Square 2px-outlined state boxes, straight arrows, filled start dot, ringed end dot. No cards, no radius, no shadows, no gradients.

STORY: The visitor reads the name, sees five states, understands the owner in one row, picks a state to read more, and leaves through Projects to a case study or through Contact.

FIRST VIEWPORT: Name in huge condensed uppercase across the top (about a quarter of the height). Under it the diagram spans the full width: start dot, WHO, BUILDS, SKILLS, PROJECTS, CONTACT with arrows. WHO is selected. A connector drops from it into an outlined panel, inset to the outer box edges, holding "SOFTWARE ENGINEER" large and one sentence. No label above the heading. Below 62rem the five states stack as a compact list with the panel under them, so all five stay in the first viewport. Primary actions live in the panel of each state.

Signature interaction: states are disclosure buttons (so the same markup works as the narrow-screen list); arrow keys move focus, Enter or a click moves the machine, the change is an instant swap, the URL hash names the state. Case-study pages reuse the same chain as nine states, one per section.

Motion grammar: instant state swaps; the only motion is the connector and panel outline redrawing in 160ms; none under reduced motion.

FORM: The Chain, a grounded direction chosen by the owner on the fourth hand (safer register). seed:701d89dff64dba60

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
