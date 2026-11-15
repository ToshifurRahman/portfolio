---
version: 1
slug: "src"
primary_target: "src"
related_targets: []
---

# Surface brief: portfolio site (home + case study pages)

Scope: `src/` of the portfolio; home page `/` and `/work/:slug`. Visitor mode: Experience.

Audience and job: recruiters scanning for thirty seconds, then hiring engineers reading a case study. Action: download the CV, email, or open a case study. Content: the owner's facts, two seven-section case studies (Ticket-Pipeline, RannaGhor), short entries for other projects, CV sections. Constraints: dark first with a light theme and toggle, no profile picture, WCAG 2.2 AA, nothing invented.

Confirmed by the owner (2026-11-15, second redesign): redesign from scratch, inspired by neon.com, commandcode.ai and linear.app. First screen shows a system at work, supporting the core facts and never hiding them. Keep a light theme. Must not look like a SaaS landing page, must not look sparse. Content decisions from the previous round stand: Certificates under Achievements, no commit counts on the home page, no Focus or Studying lines. Section numbers were not kept.

Memorable moment: a lit ticket runs Ticket-Pipeline's real track across the full width of the first screen, fails, takes the retry loop, and completes; on another run it exhausts retries, waits on the Needs-attention siding and is replayed.

## Direction contract

THESIS: The site is a signal-box control panel. One lit track diagram of a real system runs across the first screen; the same lamps mark where you are everywhere else. Refuses the SaaS hero with pill buttons and logo strips, and the sparse single column.

OWN-WORLD: Near-black panel #0a0b0d, raised band #0f1114, ink #f2f1ec, muted #8b9099, grid hairline #1b1e23, track/rule #2a2e35. One amber lamp #ffb340 for what is active and what you can press; red #ff5b4a only for failure. Mona Sans for text and display (tight, heavy), Martian Mono only for diagram labels, dates and data. Visible frame rules with corner marks, 12-column grid. No cards, no shadows, no gradients, no eyebrows. Light theme: the same panel by day, token swap only.

STORY: The recruiter reads name, role, motto, Now, Stack, four figures and the CV button without scrolling; watches one ticket survive a failure; scrolls the Work rows with their mini tracks; an engineer opens a case study whose contents bar is itself a track.

FIRST VIEWPORT: Sticky 64px header in the frame (name, lamp-marked links, amber CV, theme toggle). Name at display size over cols 1-7, role, Now and Stack beneath; motto in two tones over cols 8-12. A readout row: four figures, then Download CV (amber), Email, GitHub, LinkedIn. Then a full-bleed track panel, about 300px tall, with its caption, pause control and case-study link.

Signature interaction: the ticket run, with a pause control, paused off-screen and under reduced motion (static final route instead). Motion grammar: lamps switch in 120ms; the token moves at constant speed on the track; nothing else enters or reveals.

FORM: Signal Box, assigned direction, fourth on the grounded list; raises from the declined hand: one accent as signal and control, light as the only state language, one measured grid, the diagram runs past both screen edges, case-study margin notes tied to diagram lanes. seed:7598c066c15baac6

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
