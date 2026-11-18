# Writing a case study

This guide adds a third case study to the site, end to end. It names the files,
types, fields and tests you will touch, and every name in it exists in this repo.
Follow the steps in order.

## 1. Collect the facts first

A case study states only what the project itself shows. Read the project's own
README, its `docs/` folder and its code before you write a word. The facts you
need are: what the system does, how a request moves through it, the decisions
that shaped it, the problems it ran into, and the results it can prove.

**Nothing invented.** Do not add a fact, a number, a date or a sentence in the
owner's voice that the source does not state. If a fact is missing, leave it out.
Text written in the owner's voice needs the owner's confirmation first. Short UI
labels are fine.

Write plain American English in short sentences. No em dashes. Where the project
has its own vocabulary, use its words.

## 2. Add the study to `src/content.ts`

A study is one object of type `CaseStudy`. The type is declared in
`src/content.ts`, above the two studies that ship today.

| field | what it holds |
| --- | --- |
| `slug` | The address segment. The page is `/work/<slug>`. Lowercase words joined by hyphens. It is also the key in `diagrams` and in `CHAINS`, so keep all three equal. |
| `title` | The name in the page title, the `h1` and the Work card. |
| `summary` | One or two sentences that say what the system is. The page sets the first sentence in full ink and gives the rest the muted tone. The pre-render also uses it as the page's description. |
| `outcome` | One sentence, the study's own result. It is shown on the Work card. It must equal the sentence that closes Results (step 4). |
| `meta` | The label row under the title (step 3). |
| `sections` | The six sections, in `sectionOrder` order (step 4). |

Declare the object, then add it to `caseStudies`:

```ts
export const caseStudies: CaseStudy[] = [ticketPipeline, rannaghor, myStudy];
```

`caseStudies` order is the Work card order, the "Next case study" link order and
the order `scripts/prerender.mjs` writes the pages. Adding the study to this array
is the only registration step. Nothing else lists the studies by hand except the
test lists in step 8.

## 3. The meta row

`meta` is an array of `{ label: string; value: string; href?: string }`. The
agreed shape is `Type`, `Stack`, `Source Code`, and `Live` when the study has one:

```ts
meta: [
  { label: 'Type', value: 'A short phrase for the kind of system' },
  { label: 'Stack', value: 'The stack, in the project’s own names' },
  { label: 'Source Code', value: 'GitHub', href: 'https://github.com/ToshifurRahman/<repo>' },
  // Optional Live entry, added only when the owner confirms the address,
  // in this exact shape: { label: 'Live', value, href }
],
```

- `Type` is required. The Work card reads it.
- `Stack` is required. The Work card reads it.
- `Source Code` is required, in this exact shape: `{ label: 'Source Code', value: 'GitHub', href: <the repository URL> }`.
- `Live` is optional, in this exact shape: `{ label: 'Live', value, href }`. `value` is the host shown, `href` is the full address. Add it only when the owner confirms the address. Do not guess a Live URL.
- There is no `Timeline` entry. The meta row carries labels, not a date range. Put any date the source states into the prose instead, or leave it out.

The case-study page renders every entry in the array, in order. The `Source Code`
entry renders as a Skills-style chip — mono type, a hairline border, no fill, the
same treatment as a `.skill-list` item — and a `Live` entry sits next to it in the
same style. The page title is a link to the `Live` address when the study has
one, and to the `Source Code` address otherwise, with `rel="noopener noreferrer"` on
both.

The Work card reads only `Type` and `Stack`, through `meta(c, 'Type')` and
`meta(c, 'Stack')` in `src/Home.tsx`. A misspelled label shows nothing there.

## 4. The six sections

`sectionOrder` in `src/content.ts` is the single list of sections every study has,
in order:

| `id` | `title` |
| --- | --- |
| `overview` | Overview |
| `problem` | Problem |
| `architecture` | Architecture |
| `tech-decisions` | Tech decisions |
| `challenges` | Challenges and solutions |
| `results` | Results |

Every study's `sections` must use the same ids and titles, in the same order.
`tests/unit/int-content.test.ts` fails otherwise.

A `Section` is `{ id, title, blocks }`. A `Block` has one of seven kinds:

- `p`: one paragraph, `{ kind: 'p', text }`.
- `list`: a bullet list, `{ kind: 'list', items: [{ lead?, text }] }`. `lead` is set in bold.
- `steps`: numbered steps, `{ kind: 'steps', items: string[] }`.
- `facts`: the readout under Results, `{ kind: 'facts', items: [{ value, label }] }`.
- `decisions`: one card per decision, `{ kind: 'decisions', items: [{ lead, text }] }`. `lead` is the card's title.
- `pairs`: challenge and solution rows, `{ kind: 'pairs', items: Pair[] }`.
- `diagram`: the Architecture section's lane data, `{ kind: 'diagram', caption, lanes }`. It renders nothing on the page. The flowchart is the picture. The lanes are where the flowchart's facts come from, and `tests/unit/card-chain.test.ts` reads them.

### Challenges and solutions

The `challenges` section holds one `pairs` block. A `Pair` is
`{ challenge: { lead, text }, solution: { lead, text } }`. Pair each challenge
with the solution that answers it, one to one.

Do not add a separate `solutions` section. The page puts `solutionsAnchor` (the
string `'solutions'`) on the `challenges` section, so an old `#solutions` link
still lands on the pairs.

### The outcome sentence

`outcome` is the sentence that closes Results, word for word. Write it once in
`outcome` and again as the closing block of the `results` section, as a `p`.
`tests/unit/int-integration.test.tsx` checks that the string appears in the
study's own sections, so the card and the page cannot drift.
`tests/unit/cv-content.test.ts` also checks that Results opens with a plain
sentence.

## 5. The flowchart

`src/diagrams.ts` holds one `DiagramSpec` per study, in the exported `diagrams`
record keyed by slug. `CaseStudyPage` renders the chart at the top of the
Architecture section when `diagrams[study.slug]` exists.

### The spec

`DiagramSpec` is declared in `src/Diagram.tsx`, with the rest of the engine's
types.

- `id`: must equal the slug. The panel writes it as `data-diagram`, and `src/styles.css` selects the layout switch on it.
- `title`: the study's title, shown above the chart.
- `href`: the study's own route, `/work/<slug>`.
- `note`: the short line above the chart that says what the run shows.
- `nodes`: `Node[]`, described below.
- `edges`: `Edge[]`, described below.
- `clusters`: `Cluster[]`, described below. Always include it, even as `[]`, because `tests/unit/diagram-clusters.test.ts` reads it.
- `runs`: `Step[][]`, one array per scripted run.
- `still`: `{ edges: string[]; nodes: Record<string, LampState> }`, the still picture shown under reduced motion and in the pre-render. `LampState` is `'off'`, `'lit'`, `'done'` or `'fail'`.
- `caption`: the chart's text alternative. It must say in words what the picture says, because that is all a screen reader gets.

### Nodes

`Node` is `{ id, name, detail?, at, vat, state? }`.

- `id`: short and unique. Edges refer to it.
- `name`: the box's label, two or three words.
- `detail`: the sublabel under the name, optional.
- `at: { row, col }`: the desktop grid position. `row` is a band, `col` is left to right. Give each band its own row so no edge has to cross a box.
- `vat: { row, track }`: the vertical layout's position. `row` orders the boxes down the page. `track` is `0` for the spine and `1` for a branch, so a branch never chains into the stage after it.
- `state: true`: draws a dashed state capsule instead of a process box. Use it for the states a thing can be in.

### Edges

`Edge` is `{ id, from, to, label?, branch?, route, stub? }`.

- `id`, `from`, `to`: the edge's own id, then the ids of the two nodes it joins.
- `label`: the word on the line. Keep it to one or two words.
- `branch: true`: a dashed edge, taken only when something fails or is refused.
- `route`: how the line gets there, one of `'right'`, `'down'`, `'down-right'`, `'down-left'`, `'loop-side-left'`, `'loop-bottom'`, `'loop-side'` or `'branch'`. Every route goes through a gap between boxes, never across one.
- `stub`: for an edge that would cross the graph on the vertical layout. A short arrow leaves the box and this text names the destination.

### Clusters

`Cluster` is `{ id, heading, from, nodes, branch? }`. A cluster is a branch group
on the vertical layout. `heading` names where the group starts, `from` is the box
it hangs off, and `nodes` are the group's boxes in order. The heading replaces the
line into the group. Do not repeat a box's own label or sublabel in the heading:
`tests/unit/diagram-clusters.test.ts` fails on a run of three shared words.

### Runs and steps

`runs` is an array of runs, each an array of steps. A `Step` is
`{ edge?, dur?, status?, tone?, nodes?, failEdge? }`.

- `edge`: travel this edge, then light it.
- `dur`: dwell this long, in milliseconds, with `status`.
- `status`: the sentence in the chart's status line.
- `tone`: `'run'`, `'fail'` or `'done'`, the run's color.
- `nodes`: the lamp states to set, as a record from node id to `LampState`.
- `failEdge`: mark the edge just traveled as a failure.

### The 12px floor

No text in a flowchart may render below 12px. This is the Diagram Floor Rule in
`DESIGN.md`. The floor is measured from the rendered transform
(`getScreenCTM().a`), not from the viewBox, because the chart is scaled to fit.

The engine never shrinks type to fit. A chart that would fall below the floor
switches to the vertical layout instead. Each study's switch point is its own
viewBox width, rounded up. It is written in `src/styles.css` as a `@container`
rule keyed on `[data-diagram='<slug>']`. Add one threshold pair for the new study,
one rule for the horizontal chart and one for the vertical one.

### Checks

`tests/e2e/flowchart.spec.ts` drives each study from its `DIAGRAMS` list. Add the
new study there, then every flowchart check runs on it: the 12px floor from 360
to 1920, the label seats, the still picture, the pause control and the reduced
motion picture.

`tests/unit/diagram-labels.test.ts` keeps a name that appears in both a lane and
the chart to one spelling. If the study repeats a name in two places, export one
constant from `src/content.ts`, as `securityCheckLabel` does, and read it in both.

## 6. The Work card

`src/Home.tsx` draws one card per study from `caseStudies`: the title, `Type`,
`summary`, the small node diagram, `Stack` and `outcome`.

The small node diagram is `NodeDiagram` in `src/NodeDiagram.tsx`. Two records
decide what it draws, both keyed by slug:

- `CHAINS`: the ordered labels for the card, a `Record<string, string[]>`.
- `BRANCH`: at most one fork, a `Record<string, { after, label }>`.

`chainFor(study)` reads them. Add an entry to `CHAINS` for the new slug, and a
`BRANCH` entry only if the source states a fork.

Every label in `CHAINS` must appear in one of the study's own architecture lanes.
A branch label must appear in a lane's `note`. `tests/unit/card-chain.test.ts` and
`tests/unit/node-diagram.test.ts` check both. Six boxes is what fits a card.

If you add no entry, the card renders no diagram. That is valid, but it leaves the
card short and a scanner with less to see.

## 7. Pre-rendering, redirects and the 404

`scripts/prerender.mjs` builds its `ROUTES` from `caseStudies`: one document per
study at `/work/<slug>`, plus the home page and the 404. A new study needs no
change there. `head()` and `applyHead()` give each document its own title and
description from the study's `title` and `summary`.

A new route needs no host-rule edit. The build writes the study's own document
to `dist/work/<slug>/index.html`, and `wrangler.jsonc` tells the host to serve
the `dist` folder with `html_handling` set to `drop-trailing-slash`. That rule
serves each pre-rendered folder at its address, so `/work/<slug>` gets the new
document and `/work/<slug>/` redirects to it. The rule covers every study, so a
third one is served with no change to the host config. `not_found_handling` is
set to `404-page`, which keeps an unknown path on the 404 document with a 404
status.

`vite.config.ts` needs no change either: the `prerenderedRoutes` plugin serves
any pre-rendered document and sends the rest to the 404, which is what the host
does in production.

## 8. Extend the tests that name the studies

These files list the studies or the routes by hand. Add the new slug or route, and
update any count that is pinned per study.

- `tests/unit/prerender.test.ts`: add `work/<slug>/index.html` to the `routes` array.
- `tests/unit/case-study-density.test.tsx`: it pins six decision cards and five or four pairs per study. Extend both expectations for the new slug.
- `tests/unit/card-chain.test.ts` and `tests/unit/node-diagram.test.ts`: add the chain, if you added one.
- `tests/e2e/flowchart.spec.ts`: the study is named in three places. Add it to `DIAGRAMS`, to `LABEL_SPEC`, and to the label-draw loop under `LABEL_SPEC` that draws every label the spec defines. The `labelSpec` helper narrows its argument to a union of the study slugs, so widen that too.
- `tests/e2e/case-study-mobile.spec.ts`: add the route to `STUDIES`.
- `tests/e2e/prerender.spec.ts`: add the pre-rendered study document.
- `tests/e2e/a11y.spec.ts`: add the route to `pages` if you want axe on the new study.
- `tests/e2e/footer-year.spec.ts`: add the route to its path list, so the footer year is checked on the new page.
- `tests/e2e/dotted-path.spec.ts`: add the route to its study list, so the route serves its own pre-rendered document.

`tests/unit/int-content.test.ts` loops `caseStudies`, so it covers the new study
with no edit.

## 9. Before you commit

Run each check on its own, never two at once:

```sh
bun install --frozen-lockfile
bun run build
env -u NODE_ENV bun run test
env LH_PORT=4193 bun run e2e
```

- `bun run build` runs `tsc --noEmit`, then `vite build`, then `node scripts/prerender.mjs`.
- The unit suite must run with `env -u NODE_ENV`. A shell that exports `NODE_ENV=production` breaks React's `act()` in the unit tests. That is a shell problem, not a page defect.
- Build before unit: `tests/unit/prerender.test.ts` reads `dist/`, and it skips when the build is missing.
- `LH_PORT` keeps your preview away from a port another run is using.
- Look at the page too: `bun run dev` and open `/work/<slug>`, or `bun run preview` after a build. Check the still picture under reduced motion, the pause control, and the phone layout at 390px.

## Short checklist

- [ ] Facts read from the project, with the owner's confirmation for any owner-voice text.
- [ ] `CaseStudy` object added to `caseStudies`.
- [ ] Meta row: `Type`, `Stack`, `Source Code`, plus `Live` only if confirmed. No `Timeline`.
- [ ] Six sections, in `sectionOrder` order, with a `challenges` section of `pairs`.
- [ ] `outcome` equals the sentence that closes Results.
- [ ] `DiagramSpec` added to `diagrams`, with `clusters`, `runs` and `still`.
- [ ] Container threshold added to `src/styles.css`.
- [ ] `CHAINS` entry for the Work card.
- [ ] Study and route lists in the tests extended.
- [ ] Build, unit and e2e pass, and the new study is in the flowchart spec's list.
