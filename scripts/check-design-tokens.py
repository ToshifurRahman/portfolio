#!/usr/bin/env python3
"""Check DESIGN.md's tokens against src/styles.css — colours, fonts, type, and component properties.

Four checks:

1. Every colour and font token in DESIGN.md's front matter exists with that value in
   `src/styles.css`. A colour key maps to `--<key>` on `:root`, and `light-<key>` to the same
   declaration inside `:root[data-theme='light']`.

2. Every type step in `typography:` matches what the CSS actually sets for it: `fontSize`
   against `--text-<step>`, and — for a step whose every application overrides it — the
   `fontWeight`, `letterSpacing` and `lineHeight` against those overrides. A step whose
   applications disagree with one another, or leave the value to inheritance, is reported as a
   note rather than a failure: the record's number is then a default, and a default cannot
   contradict a page that never states the value.

3. Every property declared under `components:` is resolved to the token reference the CSS should
   carry and compared with that component's declaration in `src/styles.css`. The comparison is
   made on *references*, not resolved numbers: `backgroundColor: "{colors.bg}"` must be painted
   with `var(--bg)`, which is what the CSS says, and resolving both sides to `#0a0b0d` would hide
   a component that hard-coded the hex instead of using the token.

4. That declaration must exist at all. This is the check that was missing when five component
   tokens in the record described a site that was not painted: the colour block was verified and
   the components were not, so `fill: var(--bg)` was written down as `bg-raised`, `stroke:
   var(--track)` as `muted`, and nothing complained.

The maps below are the contract: a component key maps to the selector that paints it, a property
maps to the CSS property it claims, and every property in the record must appear in `PROPERTIES`.
An unmapped key or property is a failure, not a skip, so a component cannot be added to the
record unchecked — that silence is how four wrong type weights and a skip list of four unchecked
property groups survived a pass that was meant to close exactly this class. Prose is still a
reading job; this checks what the record declares as a token.
"""
import re
import sys
from pathlib import Path

here = Path(__file__).resolve()
root = next(p for p in here.parents if (p / 'src' / 'styles.css').is_file() and (p / 'DESIGN.md').is_file())
css_path = root / 'src' / 'styles.css'
css_raw = css_path.read_text()
# Comments carry prose with colons and braces, and a comment before a selector ends up inside the
# selector text; strip them before any parsing.
css = re.sub(r'/\*.*?\*/', '', css_raw, flags=re.S)
# Rules inside a media query are overrides, not the base claim: a component's token describes
# what it is painted with by default, so the base rule is what gets compared. `@media` blocks in
# this file are one level deep, so matching a brace-balanced body is enough.
css_base = re.sub(r'@media[^{]*\{(?:[^{}]|\{[^{}]*\})*\}', '', css)

try:
    root_block = re.search(r'^:root \{(.*?)^\}', css_base, re.S | re.M).group(1)
    light_block = re.search(r"^:root\[data-theme='light'\] \{(.*?)^\}", css_base, re.S | re.M).group(1)
except AttributeError:
    sys.exit('could not find :root and [data-theme=light] blocks in src/styles.css')

tok = lambda b: {k: v.strip() for k, v in re.findall(r'(--[\w-]+)\s*:\s*([^;]+);', b)}
dark, light = tok(root_block), tok(light_block)

text = (root / 'DESIGN.md').read_text()
front = text.split('---')[1]


def block(name):
    m = re.search(rf'^{name}:\s*\n((?:[ ]+.*\n)+)', front, re.M)
    return m.group(1) if m else None


def entries(name):
    body = block(name)
    return dict(re.findall(r'^\s{2}([\w-]+):\s*"([^"]+)"', body, re.M)) if body else {}


def nested(name):
    body = block(name)
    if body is None:
        return {}
    out, cur = {}, None
    for line in body.splitlines():
        top = re.match(r'^  "?([\w-]+)"?:\s*$', line)
        # A record value is quoted when it is a string and bare when it is a number, so both
        # forms have to be read: `fontWeight: 600` is the claim, not a missing key.
        prop = re.match(r'^    "?([\w-]+)"?:\s*"([^"]+)"\s*$', line) or re.match(
            r'^    "?([\w-]+)"?:\s*([\w.+-]+)\s*$', line
        )
        if top:
            cur = top.group(1)
            out[cur] = {}
        elif prop and cur:
            out[cur][prop.group(1)] = prop.group(2)
    return out


def rules(selector):
    """Declarations of every rule whose selector list contains `selector` exactly."""
    decls = {}
    for m in re.finditer(r'([^{}]+)\{([^{}]*)\}', css_base):
        selectors = [s.strip() for s in m.group(1).split(',')]
        if selector in selectors:
            for k, v in re.findall(r'([\w-]+)\s*:\s*([^;]+);', m.group(2)):
                decls[k.strip()] = v.strip()
    return decls


# component key -> the selector in src/styles.css that paints it
SELECTORS = {
    'bar': '.site-header',
    'brand': '.brand',
    'lamp-off': '.lamp',
    'lamp-lit': '.lamp.is-lit',
    'nav-link': '.nav-links a',
    'nav-link-current': '.nav-links a.is-current',
    'button': '.button',
    'button-hover': '.button:hover',
    'ghost': '.ghost',
    'ghost-hover': '.ghost:hover',
    'case': '.case',
    'copy-button': '.copy-button',
    'flow-node': '.flow-node rect',
    'flow-edge': '.flow-edge',
    'flow-edge-branch': '.flow-edge.is-branch',
}
# DESIGN.md property -> the CSS property that carries the same claim
PROPERTIES = {
    'backgroundColor': 'background',
    'textColor': 'color',
    'borderColor': 'border-color',
    'border': 'border',
    'borderBottom': 'border-bottom',
    'borderTop': 'border-top',
    'rounded': 'border-radius',
    'stroke': 'stroke',
    'typography': None,
    # The four groups this script used to skip. Each has a real declaration to compare, so each
    # is mapped rather than allowed to pass: a size is `width`/`height`, a target height is the
    # rule's `min-height`, a ring is the colour half of its `box-shadow`, and a dash is
    # `stroke-dasharray`. See PROPERTY_OVERRIDES for the components whose declaration lives on a
    # child or uses a named token.
    'height': 'min-height',
    'size': 'width',
    'ring': 'box-shadow',
    'dash': 'stroke-dasharray',
}
SVG_SELECTORS = {'.flow-node rect', '.flow-edge', '.flow-edge.is-branch'}
# A component may take its colour from an ancestor rather than declaring one; the ancestor that
# supplies it is named here, and the claim is checked against that rule. This is stated rather
# than inferred: guessing at inheritance would hide a component that declares the wrong colour.
INHERITS = {'bar': ('textColor', 'body'), 'flow-edge-branch': ('stroke', '.flow-edge')}
# The selector whose font-size a component's type claim is checked against, when that is a child
# rather than the component's own rule (an SVG box's type is set on its text elements).
TEXT_SELECTORS = {
    'flow-node': '.flow-node text',
    'copy-button': '.copy-button',
    'brand': '.brand',
    'nav-link': '.nav-links a',
}
# Where a component's property is declared on a different rule than its paint selector. `.site-header`
# is the sticky bar; its height is the `.navbar` inside it, which is the element that is 4rem tall.
PROPERTY_OVERRIDES = {
    ('bar', 'height'): '.navbar',
}
# The `spacing:` map names layout tokens that do not all follow the `--space-<n>` pattern: the bar
# height is `--bar-h`, the sub-nav is `--contents-h`, the target is `--target`. Resolving a record
# value here keeps `{spacing.bar}` from silently becoming the non-existent `--space-bar`.
SPACING_TOKENS = {
    'bar': '--bar-h',
    'contents': '--contents-h',
    'target': '--target',
    'frame': '--frame',
    'frame-margin': '--frame-margin',
    'pad': '--pad',
    'col-gap': '--col-gap',
    'measure': '--measure',
    'section': '--space-section',
}


def media_sizes(selector):
    """Every font-size the selector is given inside a media query, as token references.

    A breakpoint may raise a step on purpose — the bar's links go to `--text-lg` when the bar
    collapses into a menu at 57rem — and that is not a contradiction of the base claim. It is
    reported, not silently accepted: the base rule is what the record describes.
    """
    out = set()
    for m in re.finditer(r'@media[^{]*\{(.*?)\n\}', css, re.S):
        for sel_rule in re.finditer(r'([^{}]+)\{([^{}]*)\}', m.group(1)):
            sels = [x.strip() for x in sel_rule.group(1).split(',')]
            if selector in sels:
                size = re.search(r'font-size\s*:\s*([^;]+);', sel_rule.group(2))
                if size:
                    out.add(size.group(1).strip())
    return out


def var_name(step):
    """The custom property a type step is applied through.

    Page steps are `--text-<step>`; the flowchart's two sizes are declared beside the layout
    tokens as `--flow-<step>` because they are viewBox units the engine lays boxes out with.
    """
    return f'--{FLOW_TYPE[step]}' if step in FLOW_TYPE else f'--text-{step}'


def applications(step, prop):
    """Every value the CSS gives `prop` in a rule that applies type step `step`, with its rules.

    A type step is a size token, not a rule: `--text-h2` carries the clamp, and each rule that
    uses it decides the weight and tracking. So the step's own weight is only a fact about the
    page when every rule that applies the step agrees on it.
    """
    token = var_name(step)
    out = {}
    for m in re.finditer(r'([^{}]+)\{([^{}]*)\}', css_base):
        body = m.group(2)
        if not re.search(r'font-size\s*:\s*var\(' + re.escape(token) + r'\)', body):
            continue
        decl = re.search(prop + r'\s*:\s*([^;]+);', body)
        if decl:
            selector = ', '.join(s.strip() for s in m.group(1).split(','))
            out.setdefault(decl.group(1).strip(), []).append(selector)
    return out


def appliers(step):
    """Every rule that applies type step `step` by setting its font-size."""
    token = var_name(step)
    return [
        ', '.join(s.strip() for s in m.group(1).split(','))
        for m in re.finditer(r'([^{}]+)\{([^{}]*)\}', css_base)
        if re.search(r'font-size\s*:\s*var\(' + re.escape(token) + r'\)', m.group(2))
    ]


def normalise(value):
    """`var(--weight-bold)` -> 680, `-0.03em` -> (-0.03, 'em'), `4px 4px` -> '4 4'.

    Comparing references to references is the rule for colours, because a hard-coded hex is the
    defect there. Type is the other way round: the record states the number the browser uses, so
    both sides are resolved through `:root` and compared as numbers, which also catches a literal
    that happens to equal the token.
    """
    if value is None:
        return None
    v = value.strip()
    m = re.fullmatch(r'var\((--[\w-]+)\)', v)
    if m:
        return normalise(dark.get(m.group(1), ''))
    if re.fullmatch(r'-?\d*\.?\d+', v):
        return float(v)
    m = re.fullmatch(r'(-?\d*\.?\d+)(px|em|rem)', v)
    if m:
        return float(m.group(1))
    m = re.fullmatch(r'(-?\d*\.?\d+)px\s+(-?\d*\.?\d+)px', v)
    if m:
        return f'{float(m.group(1)):g} {float(m.group(2)):g}'
    return v


def same(a, b):
    na, nb = normalise(a), normalise(b)
    if isinstance(na, float) and isinstance(nb, float):
        return abs(na - nb) < 1e-9
    return na == nb


typography = nested('typography')
# The flowchart's type is declared beside the layout tokens, not on the page scale: its sizes are
# viewBox units the engine lays boxes out with. A record entry naming one of these resolves here.
FLOW_TYPE = {'flow-label': 'flow-label', 'flow-detail': 'flow-detail'}


def reference(value):
    """`{colors.bg}` -> `var(--bg)`; `{lines.line} solid {colors.rule}` -> `var(--line) solid var(--rule)`."""
    def sub(m):
        group, _, key = m.group(1).partition('.')
        if group == 'colors':
            return f'var(--{key})'
        if group == 'lines':
            return f'var(--line{"" if key == "line" else "-" + key})'
        if group == 'rounded':
            return 'var(--radius-sm)' if key == 'sm' else 'var(--radius)'
        if group == 'motion':
            return 'var(--ease-out)' if key == 'ease-out' else f'var(--dur-{key})'
        if group == 'spacing':
            return f'var({SPACING_TOKENS.get(key, "--space-" + key)})'
        if group == 'typography':
            if key in FLOW_TYPE:
                return f'var(--{FLOW_TYPE[key]})'
            size = typography.get(key, {}).get('fontSize')
            return f'var(--text-{key})' if size else m.group(0)
        return m.group(0)

    return re.sub(r'\{([^{}]+)\}', sub, value)


problems = []
notes = []
checked = 0

# --- 1. colours and fonts
colors = entries('colors')
for key, value in colors.items():
    base = key[len('light-'):] if key.startswith('light-') else key
    live = light if key.startswith('light-') else dark
    actual = live.get('--' + base)
    if actual is None:
        if key.startswith('light-') and base == 'on-accent':
            checked += 1
            continue
        problems.append(f'colors.{key}: --{base} is not declared')
    elif actual != value:
        problems.append(f'colors.{key}: DESIGN.md {value} != --{base} {actual}')
    else:
        checked += 1

fonts = []
for decl in ('--font', '--mono'):
    live = dark.get(decl)
    if live is None:
        problems.append(f'{decl} is not declared on :root')
        continue
    first = [f.strip().strip("'\"") for f in live.split(',')][0]
    if first not in text:
        problems.append(f'{decl} family {first!r} is not named in DESIGN.md')
    else:
        fonts.append(f'{decl} = {first}')
        checked += 1

# --- 2. type steps: size always, weight and tracking where the page is uniform about them
TYPE_PROPS = {'fontWeight': 'font-weight', 'letterSpacing': 'letter-spacing', 'lineHeight': 'line-height'}
for step, decl in typography.items():
    size = decl.get('fontSize')
    if size is None:
        # `font` and `mono` carry a family, not a step; `weights` and `tracking` are maps.
        if decl.get('fontFamily') is None:
            notes.append(f'typography.{step}: no fontSize; not a type step')
        continue
    token = dark.get(f'--text-{step}') if step not in FLOW_TYPE else dark[f'--{FLOW_TYPE[step]}']
    if token is None:
        problems.append(f'typography.{step}: --text-{step} is not declared')
    elif not same(token, size):
        problems.append(f'typography.{step}.fontSize: DESIGN.md {size} != --text-{step} {token}')
    else:
        checked += 1

    for record_prop, css_prop in TYPE_PROPS.items():
        claimed = decl.get(record_prop)
        if claimed is None:
            # The record is not obliged to state every typographic property: `lineHeight` is
            # absent from every step on purpose, and demanding one would make this check fail
            # for a reason the record never claimed. What it does state must be true — that is
            # the rule, and `fontSize` is stated for every step so it is always checked.
            continue
        applied = applications(step, css_prop)
        total = len(appliers(step))
        if not applied:
            notes.append(
                f'typography.{step}.{record_prop}: {claimed} is a default — no rule applying '
                f'`{step}` sets `{css_prop}`'
            )
            continue
        distinct = sorted(applied)
        # A step is only a single value when *every* rule applying it states one and they agree.
        # Where some rules leave the property to inheritance, the record's number is the page's
        # default rather than a contradiction, and calling it one would train a reader to ignore
        # this check. It is reported as a note instead.
        if len(distinct) > 1:
            notes.append(
                f'typography.{step}.{record_prop}: the record says {claimed}; the rules that apply '
                f'this step disagree ({"; ".join(f"{v} on {s}" for v, s in applied.items())})'
            )
            continue
        stated = sum(len(v) for v in applied.values())
        if stated < total:
            if not same(distinct[0], claimed):
                notes.append(
                    f'typography.{step}.{record_prop}: the record says {claimed}; '
                    f'{", ".join(applied[distinct[0]])} sets {distinct[0]} and the other '
                    f'{total - stated} rule(s) applying this step inherit'
                )
            continue
        if not same(distinct[0], claimed):
            problems.append(
                f'typography.{step}.{record_prop}: DESIGN.md {claimed} != {css_prop} '
                f'{distinct[0]} ({", ".join(applied[distinct[0]])})'
            )
        else:
            checked += 1

# --- 3/4. component tokens
components = nested('components')
if not components:
    problems.append('DESIGN.md has no components: block')
for comp, props in components.items():
    selector = SELECTORS.get(comp)
    if selector is None:
        problems.append(f'components.{comp}: no selector mapped in this script')
        continue
    decls = rules(selector)
    if not decls:
        problems.append(f'components.{comp}: selector {selector} declares nothing in src/styles.css')
        continue
    svg = selector in SVG_SELECTORS
    for prop, value in props.items():
        if prop not in PROPERTIES:
            # Not a skip. A property with no mapping is exactly the hole that let four unchecked
            # groups and five wrong component tokens pass a review, so it fails loudly instead.
            problems.append(
                f'components.{comp}.{prop}: no CSS property mapped in this script '
                f'(DESIGN.md says {value}); add it to PROPERTIES'
            )
            continue
        css_prop = PROPERTIES[prop]
        target = PROPERTY_OVERRIDES.get((comp, prop), selector)
        if target == selector:
            target_decls = decls
        else:
            target_decls = rules(target)
            if not target_decls:
                problems.append(f'components.{comp}.{prop}: {target} declares nothing')
                continue

        if prop == 'typography':
            key = value[1:-1].split('.')[-1]
            if key in FLOW_TYPE:
                got = rules(TEXT_SELECTORS.get(comp, selector)).get('font-size')
                if got != f'var(--{FLOW_TYPE[key]})':
                    problems.append(
                        f'components.{comp}.typography: {value} != font-size {got}'
                    )
                else:
                    checked += 1
                continue
            if typography.get(key, {}).get('fontSize') is None:
                problems.append(f'components.{comp}.typography: {value} does not name a type step')
                continue
            # A component whose type is set on a child (an SVG text element) is checked
            # against that child's rule; the map says which.
            text_sel = TEXT_SELECTORS.get(comp, selector)
            got = rules(text_sel).get('font-size')
            # A media query may legitimately raise a step; compare against the base rule and
            # report the override rather than calling it a mismatch.
            if not same(got, reference(value)) and reference(value) not in media_sizes(text_sel):
                problems.append(
                    f'components.{comp}.typography: DESIGN.md {value} != font-size {got}'
                )
            else:
                checked += 1
            continue

        want = reference(value)
        if prop == 'backgroundColor':
            css_prop = 'fill' if svg else 'background'
        elif prop == 'textColor':
            css_prop = 'fill' if selector == '.flow-node rect' else 'color'
        elif prop == 'border' and svg:
            got = decls.get('stroke')
            want_color = want.split()[-1]
            if got is None:
                problems.append(f'components.{comp}.border: {selector} declares no stroke')
            elif got != want_color:
                problems.append(f'components.{comp}.border: DESIGN.md {value} != stroke {got}')
            else:
                checked += 1
            continue

        if (comp, prop) in {(k, v[0]) for k, v in INHERITS.items()}:
            from_sel = INHERITS[comp][1]
            inherited = rules(from_sel).get(css_prop)
            if inherited != want:
                problems.append(
                    f'components.{comp}.{prop}: inherits from {from_sel}: {inherited}, DESIGN.md says {value}'
                )
            else:
                checked += 1
            continue

        got = target_decls.get(css_prop)
        if prop == 'ring':
            # A ring is stated in the record as `<width> <colour>`; the CSS carries it as the
            # spread-and-colour half of a `box-shadow` (`0 0 0 <width> <colour>`). Compare the
            # colour, which is the claim a reader takes from the record, and require both refs.
            if got is None:
                problems.append(
                    f'components.{comp}.ring: {target} declares no box-shadow (DESIGN.md says {value})'
                )
                continue
            want_parts = [p for p in want.split() if p.startswith('var(')]
            missing = [p for p in want_parts if p not in got]
            if missing:
                problems.append(
                    f'components.{comp}.ring: DESIGN.md {value} names {", ".join(missing)} '
                    f'but box-shadow is {got}'
                )
            else:
                checked += 1
            continue
        if prop == 'dash':
            if got is None:
                problems.append(
                    f'components.{comp}.dash: {target} declares no {css_prop} (DESIGN.md says {value})'
                )
            elif not same(got, want):
                problems.append(f'components.{comp}.dash: DESIGN.md {value} != {css_prop} {got}')
            else:
                checked += 1
            continue

        if got is None:
            problems.append(
                f'components.{comp}.{prop}: {target} declares no {css_prop} (DESIGN.md says {value})'
            )
        elif not same(got, want):
            problems.append(f'components.{comp}.{prop}: DESIGN.md {value} != {css_prop} {got}')
        else:
            checked += 1

print(f'checked {checked} token(s) named in DESIGN.md against src/styles.css')
for f in fonts:
    print(f'  ok    {f} present in the design record')
print(f'  ok    {len(colors)} colour key(s), {len(typography)} type entr(y/ies), {len(components)} component(s)')
for n in notes:
    print(f'  note  {n}')
if problems:
    print(f'FAIL: {len(problems)} problem(s)')
    for p in problems:
        print('  !', p)
    sys.exit(1)
print('OK: every colour, font, type step and component token in DESIGN.md matches src/styles.css')
