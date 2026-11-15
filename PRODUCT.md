# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + Vite + TypeScript (the owner's answer). Static output, no backend.

## Users

Recruiters first. They scan for about thirty seconds and pass the candidate on, so the role, the stack and the results must land at a glance. Hiring engineers come second: they open a case study and read the architecture and trade-offs closely.

## Product Purpose

The personal portfolio of Toshifur Rahman, Software Engineer. A visitor should understand quickly who the owner is, what kind of systems they build, and how they think, then be able to read a full case study or get in touch. Success: a recruiter can describe the owner in one sentence after one screen, and an engineer finds real depth one click later.

## Positioning

The owner builds asynchronous, stateful systems and cares about what happens when they fail: queues, retries, replay, observability, guard tests. The portfolio can show that way of thinking in its own structure, which a generic template portfolio cannot copy.

## Operating Context

- Single site: a home page and one page per case study.
- Each case study follows seven fixed sections, in this order: Overview, Problem, Architecture, Tech decisions, Challenges, Solutions, Results. (The owner confirmed seven on 2026-11-15; the earlier list also named Motivation and Future improvements, which no case study has.)
- Visitors arrive from a CV link or a LinkedIn / GitHub profile, on desktop or phone.

## Capabilities and Constraints

- Dark first. A light theme may exist but dark is the default and the designed-for state.
- Minimal, simple design. No profile picture anywhere.
- Full case studies: Ticket-Pipeline and the e-commerce project (RannaGhor). Other projects may appear as short entries.
- Undecided: location, biography, contact email, LinkedIn URL, availability, CV file. Until the owner supplies them they are left empty in `src/content.ts`: hidden on the built site, shown as notes only while developing.

## Brand Commitments

- Name shown as "Toshifur Rahman", title "Software Engineer".
- The owner asked for a state-diagram design language, and for the design to show the owner's taste and be unique.
- Reference portfolios the owner asked to be analysed for design sense (not to be copied): marcobaldini.pages.dev, aathifzahir.vercel.app, moritzhauer.github.io, alexandrefernandes.dev.

## Evidence on Hand

- Ticket-Pipeline: `/home/tfr/Projects/ticket-pipe` (README, docs/, screenshots in `docs/screenshots/`). GitHub: ToshifurRahman/ticket-pipe. LLM support-ticket pipeline on Bun, Hono, PostgreSQL, Redis, AWS SQS, Socket.io, React. 266 commits, April to November 2026.
- RannaGhor e-commerce: `/home/tfr/Projects/e-commerce-website` (README, CLAUDE.md). GitHub: ToshifurRahman/e-commerce-website. Bun monorepo, React 19, TanStack Router and Query, Hono, Better Auth, Drizzle, Supabase Postgres. 64 commits (59 merged pull requests), January to March 2026.
- Other projects available for short entries: Dars (Arabic vocabulary app), Attendance Automation (Google Apps Script), HTTP Server, HN clone, 7GUIs.
- Not on hand, must not be invented: employment history, education, testimonials, user or traffic numbers, performance benchmarks beyond what the repositories document.

## Product Principles

1. Thirty seconds first: identity, focus and proof are readable without scrolling far or clicking.
2. Depth is one click away, never forced on the scanner.
3. Show the thinking, not adjectives: real architecture, real decisions, real failure handling.
4. Nothing invented. A missing fact is left out, never filled in.
5. Restraint is the taste: few elements, each one deliberate.

## Accessibility & Inclusion

WCAG 2.2 AA. Includes visible focus, 24px minimum target size, reduced-motion support, keyboard operation of every interactive element, and text alternatives for every diagram.
