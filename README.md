# Rohit Dogra — Portfolio

Personal portfolio for **Rohit Dogra** — frontend engineer and UI/UX designer.
Static site, no build step, no framework.

**Home sections:** Selected Work · About · Expertise · Experience · Education · Contact
**Sub-pages:** 5 full case studies · work archive · experience detail

---

## Stack

Deliberately dependency-light — plain HTML, one stylesheet, one script.

| Layer | Choice |
|---|---|
| Markup | Static HTML (`index.html`, `projects/`, `projects/<slug>/`, `experience/`, `404.html`) |
| Styles | One stylesheet, `assets/css/style.css`, driven by CSS custom properties |
| Behaviour | Vanilla ES5-compatible JS, `assets/js/script.js` (+ `archive.js` on the archive page) |
| Type | Space Grotesk (display) · Inter (body) · JetBrains Mono (meta) via Google Fonts |
| Icons | Inline SVG sprite per page — no icon font |
| Contact form | EmailJS (`emailjs-com@3`) |

There is **no** jQuery, particles.js, typed.js, vanilla-tilt, ScrollReveal, Isotope,
Font Awesome or chat widget. A cold homepage load is **5 requests**.

## Design system

All tokens live in `:root` at the top of `assets/css/style.css`.

- **Direction** — editorial / Swiss grid on a near-black ink canvas; the work is the loudest thing on the page.
- **Colour** — monochrome warm-white on ink, plus a single amber accent (`--accent: #efb749`) used only as a signal (status, active state, indices, links). Every text pair clears WCAG AA on `--ink`.
- **Type scale** — fluid `clamp()` ramp from `--t-label` to `--t-display`.
- **Spacing** — 4pt rhythm (`--s-1` … `--s-10`) with a fluid `--section-y` and `--gutter`.
- **Motion** — shared easing/duration tokens. Everything is `transform`/`opacity` only.

## Content

| What | Where |
|---|---|
| Featured work cards | Static markup in `index.html` (each has a bespoke inline-SVG mockup) |
| Case-study copy | `projects/case-studies.json` |
| Case-study pages | Generated into `projects/<slug>/index.html` |
| Work archive | `projects/projects.json`, rendered by `assets/js/archive.js` |
| Experience, education, expertise | Static markup in `index.html` (+ `experience/index.html`) |

Project mockups are hand-authored SVG rather than screenshots: they scale
crisply at any card size, cost almost nothing to load, and can never 404.

### Case-study pages

Each featured project has a full page at `/projects/<slug>/` with the problem,
approach, solution, impact, stack, and prev/next navigation.

Edit the copy in `projects/case-studies.json`, then regenerate:

```bash
python3 tools/build-cases.py
```

The generator pulls each project's SVG mockup straight out of `index.html`
(matched on `data-mock`), so a mockup only ever exists in one place. Output is
plain static HTML — nothing is built at request time.

## Accessibility & resilience

- Skip link, single `h1`, sequential headings, visible focus rings.
- Case-study drawers are real `aria-expanded` buttons controlling labelled regions; expertise filters are a keyboard-navigable `tablist`.
- The mobile sheet marks the rest of the page `inert`, locks scroll, closes on `Esc`, and keeps its close button above the overlay.
- Form has visible labels, validation on blur, an `aria-live` status region and focus moved to the first invalid field.
- `prefers-reduced-motion` disables every animation and renders final states.
- **No-JS safe:** entrance states are scoped behind a `.js` class set by a tiny inline head script, so with JS off the page renders fully visible.

## Local development

```bash
python3 -m http.server 4173
```

Then open <http://localhost:4173>. Paths are root-absolute, so serve from the
repository root (matching production).

## Deploying

Static hosting, no build. After changing CSS or JS, bump the `?v=` query on the
asset links in the four HTML files so returning visitors don't get a stale cache.

## Theming

Two themes, both first-class designs rather than inversions.

- **Dark (default)** — canvas `#16161a`, a warm graphite. Deliberately not `#000`: pure black over a large surface reads harsh and makes the amber accent look neon.
- **Light** — canvas `#f7f6f3`, warm paper. The accent darkens to a bronze `#96620a`, because amber `#efb749` is only 1.7:1 on white and would fail everywhere it carries text.

How it resolves, in order:

1. A stored choice (`localStorage.theme`) wins, applied by an inline `<head>` script **before first paint** so the theme never flashes.
2. Otherwise the OS preference, via `@media (prefers-color-scheme: light)` scoped to `:root:not([data-theme="dark"])`.
3. Otherwise dark.

The toggle in the nav flips and persists the choice. With JS disabled you still get the OS-appropriate theme — no `data-theme` attribute is needed for that path.

Tokens live in three blocks at the top of `assets/css/style.css`:

| Block | Contains |
|---|---|
| `:root` | Structural only — type scale, spacing, radius, motion, z-index. Theme-independent. |
| `:root, :root[data-theme="dark"]` | Dark palette |
| `:root[data-theme="light"]` + the `prefers-color-scheme` block | Light palette (declared twice; plain CSS has no way to share it) |

**Adding a colour:** put it in all three palette blocks, never inline. `--on-accent`,
`--scrim`, `--input-bg`, `--surface-tint`, `--grid-line` and the shadow scale all
flip with the theme, which is why no rule in the stylesheet hardcodes a theme colour.

Two deliberate exceptions, both sitting on top of imagery rather than on a theme
surface, so they stay dark in both themes: the scrim gradients over photos, and
the badges that sit on them (`.educard__badge`, `.pcard__flag`).

## Colour & contrast

Every foreground token carries real text, so every one clears WCAG AA (4.5:1)
against its own canvas:

| Token | Dark | Light |
|---|---|---|
| `--fg` | 16.7:1 | 16.7:1 |
| `--fg-muted` | 8.3:1 | 6.9:1 |
| `--fg-subtle` | 5.8:1 | 5.1:1 |
| `--fg-faint` | 4.8:1 | 4.7:1 |
| `--accent` | 9.9:1 | 4.8:1 |
| `--on-accent` on `--accent` | 9.9:1 | 5.2:1 |

`--hairline` is the one decorative-only value (outlined display type, monogram
strokes). Never use it for text.

Both themes were audited by walking every text node, compositing the real
effective background through translucent ancestors, and comparing against the
AA threshold for that node's size and weight: **0 failures in either theme.**

## Notes

- `skills.json` is no longer read by anything — expertise now lives in `index.html` with category grouping. Safe to delete.
- `*.legacy.*.bak` files are snapshots of the pre-redesign build; the originals are also in git history.
- Full-size originals (`Profile.jpg`, `educat/hpu.jpg`, …) are kept alongside the optimised variants that are actually served.
