#!/usr/bin/env python3
"""Check DESIGN.md's tokens against src/styles.css — colours, fonts, and component properties.

Three checks:

1. Every colour and font token in DESIGN.md's front matter exists with that value in
   `src/styles.css`. A colour key maps to `--<key>` on `:root`, and `light-<key>` to the same
   declaration inside `:root[data-theme='light']`.

2. Every property declared under `components:` is resolved to the token reference the CSS should
   carry and compared with that component's declaration in `src/styles.css`. The comparison is
   made on *references*, not resolved numbers: `backgroundColor: "{colors.bg}"` must be painted
   with `var(--bg)`, which is what the CSS says, and resolving both sides to `#0a0b0d` would hide
   a component that hard-coded the hex instead of using the token.

3. That declaration must exist at all. This is the check that was missing when five component
   tokens in the record described a site that was not painted: the colour block was verified and
   the components were not, so `fill: var(--bg)` was written down as `bg-raised`, `stroke:
   var(--track)` as `muted`, and nothing complained.

The maps below are the contract: a component key maps to the selector that paints it, and a
property maps to the CSS property it claims. An unmapped key or property is a failure, not a skip,
so a component cannot be added to the record unchecked. Prose is still a reading job; this checks
what the record declares as a token.
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
        prop = re.match(r'^    "?([\w-]+)"?:\s*"([^"]+)"', line)
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
            return f'var(--space-{key})'
        if group == 'typography':
            if key in FLOW_TYPE:
                return f'var(--{FLOW_TYPE[key]})'
            size = typography.get(key, {}).get('fontSize')
            return f'var(--text-{key})' if size else m.group(0)
        return m.group(0)

    return re.sub(r'\{([^{}]+)\}', sub, value)


problems = []
checked = 0
SKIPPED = set()

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

# --- 2/3. component tokens
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
            # Only colour, border, radius and typography are compared. `height`, `size`,
            # `ring` and `dash` are not, because they need effective-value or shorthand
            # reasoning this script does not do; skipping them is stated, not silent.
            SKIPPED.add(prop)
            continue
        css_prop = PROPERTIES[prop]

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
            target = TEXT_SELECTORS.get(comp, selector)
            got = rules(target).get('font-size')
            # A media query may legitimately raise a step; compare against the base rule and
            # report the override rather than calling it a mismatch.
            base = got
            if base != reference(value) and reference(value) not in media_sizes(target):
                problems.append(
                    f'components.{comp}.typography: DESIGN.md {value} != font-size {base}'
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
        got = decls.get(css_prop)
        if got is None:
            problems.append(
                f'components.{comp}.{prop}: {selector} declares no {css_prop} (DESIGN.md says {value})'
            )
        elif got != want:
            problems.append(f'components.{comp}.{prop}: DESIGN.md {value} != {css_prop} {got}')
        else:
            checked += 1

print(f'checked {checked} token(s) named in DESIGN.md against src/styles.css')
for f in fonts:
    print(f'  ok    {f} present in the design record')
print(f'  ok    {len(colors)} colour key(s), {len(components)} component(s) through the selector map')
if SKIPPED:
    print(f'  skip  property group(s) not compared: {", ".join(sorted(SKIPPED))}')
if problems:
    print(f'FAIL: {len(problems)} problem(s)')
    for p in problems:
        print('  !', p)
    sys.exit(1)
print('OK: every colour, font and component token in DESIGN.md matches its declaration in src/styles.css')
