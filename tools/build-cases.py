#!/usr/bin/env python3
"""Generate the per-project case-study pages.

Content comes from projects/case-studies.json. The SVG mockups are pulled
straight out of index.html (matched on data-mock) so there is exactly one
source of truth for them. Output is plain static HTML — nothing is built at
request time.

    python3 tools/build-cases.py
"""
import html
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
VERSION = "1.1.1"

# Applies the stored theme before first paint. Kept out of the template
# because its JS braces would be parsed as str.format fields.
HEAD_SCRIPT = (
    "<script>(function(){var d=document.documentElement;d.classList.add('js');"
    "try{var t=localStorage.getItem('theme');"
    "if(t==='light'||t==='dark')d.setAttribute('data-theme',t);}catch(e){}})()</script>"
)


def read(p):
    return (ROOT / p).read_text()


def mockups():
    """Extract each data-mock SVG block from index.html."""
    src = read("index.html")
    found = {}
    for m in re.finditer(r'<div class="frame__screen" data-mock="([a-z-]+)">\s*(<svg.*?</svg>)\s*</div>', src, re.S):
        found[m.group(1)] = m.group(2)
    return found


def icons():
    """Reuse the sprite from index.html so icon sets never diverge."""
    src = read("index.html")
    m = re.search(r'(<svg width="0" height="0".*?</svg>)\s*\n', src, re.S)
    if not m:
        sys.exit("could not find the icon sprite in index.html")
    return m.group(1)


def chips(items):
    return "".join('<li class="chip">%s</li>' % html.escape(i) for i in items)


def paras(items):
    return "\n".join("          <p>%s</p>" % html.escape(t) for t in items)


def bullets(items):
    return "\n".join("            <li>%s</li>" % html.escape(t) for t in items)


BLOCK = """        <section class="cs-block">
          <div class="cs-block__label"><span class="n">{n}</span> {label}</div>
          <div class="cs-block__body">
{body}
          </div>
        </section>"""


def block(n, label, items, as_list):
    body = ("            <ul>\n%s\n            </ul>" % bullets(items)) if as_list else paras(items)
    return BLOCK.format(n=n, label=label, body=body)


TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#16161a" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#f7f6f3" media="(prefers-color-scheme: light)">
<title>{title} — Case study | Rohit Dogra</title>
<meta name="description" content="{meta_desc}">
<meta property="og:type" content="article">
<meta property="og:title" content="{title} — Case study | Rohit Dogra">
<meta property="og:description" content="{meta_desc}">
{headscript}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap">
<link rel="stylesheet" href="/assets/css/style.css?v={version}">
<link id="favicon" rel="icon" href="/assets/images/favhand.png" type="image/png">
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>

{sprite}

<div class="progress" id="progress" aria-hidden="true"></div>
<div class="ambient" aria-hidden="true"><div class="ambient__grid"></div><div class="ambient__glow ambient__glow--a"></div><div class="ambient__noise"></div></div>

<header class="nav is-stuck" id="nav">
  <div class="nav__inner">
    <a href="/" class="brand" aria-label="Rohit Dogra — home"><span class="brand__mark" aria-hidden="true">RD</span><span>Rohit Dogra<span class="brand__sub"> / Case study</span></span></a>
    <nav aria-label="Primary">
      <ul class="nav__links">
        <li><a href="/#work">Work</a></li><li><a href="/#about">About</a></li>
        <li><a href="/#skills">Expertise</a></li><li><a href="/#experience">Experience</a></li>
        <li><a href="/#education">Education</a></li><li><a href="/#contact">Contact</a></li>
      </ul>
    </nav>
    <div class="nav__cta">
      <button class="nav__theme" id="themeToggle" type="button" aria-label="Switch to light theme">
        <svg class="i-sun" aria-hidden="true"><use href="#i-sun"/></svg>
        <svg class="i-moon" aria-hidden="true"><use href="#i-moon"/></svg>
      </button>
      <a href="/#contact" class="btn btn--primary btn--sm">Let's talk <svg aria-hidden="true"><use href="#i-arrow-r"/></svg></a>
      <button class="nav__burger" id="burger" type="button" aria-expanded="false" aria-controls="navSheet" aria-label="Open menu"><span></span><span></span><span></span></button>
    </div>
  </div>
</header>

<div class="nav__sheet" id="navSheet" inert>
  <ul class="nav__sheet-links">
    <li><a href="/#work"><span class="num">01</span> Work</a></li>
    <li><a href="/#about"><span class="num">02</span> About</a></li>
    <li><a href="/#skills"><span class="num">03</span> Expertise</a></li>
    <li><a href="/#experience"><span class="num">04</span> Experience</a></li>
    <li><a href="/#education"><span class="num">05</span> Education</a></li>
    <li><a href="/#contact"><span class="num">06</span> Contact</a></li>
  </ul>
  <div class="nav__sheet-foot"><a href="mailto:dogra.rohit2002@gmail.com" class="link-arrow link-arrow--accent">dogra.rohit2002@gmail.com</a></div>
</div>

<main id="main">

<section class="cs-head">
  <div class="shell">
    <a href="/#work" class="backlink"><svg aria-hidden="true"><use href="#i-arrow-l"/></svg> All selected work</a>

    <p class="sec-eyebrow"><span class="idx">{index}</span> Case study &mdash; {category}</p>

    <h1 class="cs-title">{title}</h1>
    <p class="cs-tagline">{tagline}</p>

    <div class="cs-actions">
      <a href="{url}" class="btn btn--primary" target="_blank" rel="noopener">Visit live site <svg aria-hidden="true"><use href="#i-arrow-ur"/></svg></a>
      <a href="#overview" class="btn btn--ghost">Read the breakdown <svg aria-hidden="true"><use href="#i-arrow-r"/></svg></a>
    </div>
  </div>
</section>

<section class="shell">
  <div class="frame cs-frame" data-reveal="scale">
    <div class="frame__bar"><span class="frame__dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="frame__url">{host}</span></div>
    <div class="frame__screen">
      {mockup}
    </div>
  </div>
</section>

<section class="section" id="overview">
  <div class="shell">
    <dl class="cs-facts" data-reveal>
      <div><dt>Role</dt><dd>{role}</dd></div>
      <div><dt>Scope</dt><dd>{scope}</dd></div>
      <div><dt>Period</dt><dd>{period}</dd></div>
      <div><dt>Live at</dt><dd><a href="{url}" target="_blank" rel="noopener">{host} <svg aria-hidden="true" style="width:12px;height:12px;vertical-align:-1px"><use href="#i-arrow-ur"/></svg></a></dd></div>
    </dl>

    <p class="cs-contribution" data-reveal>{contribution}</p>

    <div class="cs-body">
{blocks}
    </div>

    <div class="cs-stack" data-reveal>
      <span class="mono">Tech stack</span>
      <ul class="chip-row">{stack}</ul>
    </div>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="shell">
    <nav class="cs-pager" aria-label="Other case studies">
      {prev}
      {next}
    </nav>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="shell">
    <div class="cs-cta" data-reveal>
      <h2>Building something like this?</h2>
      <p>Tell me what you're working on and where it's stuck.</p>
      <div class="cs-cta__row">
        <a href="/#contact" class="btn btn--accent">Start a conversation <svg aria-hidden="true"><use href="#i-arrow-r"/></svg></a>
        <a href="/projects" class="btn btn--ghost">Browse the archive <svg aria-hidden="true"><use href="#i-arrow-r"/></svg></a>
      </div>
    </div>
  </div>
</section>

</main>

<footer class="footer">
  <div class="shell">
    <div class="footer__bar">
      <p>&copy; <span id="year">2026</span> Rohit Dogra &mdash; All rights reserved</p>
      <a href="/" class="link-arrow">Back to portfolio <svg aria-hidden="true"><use href="#i-arrow-r"/></svg></a>
    </div>
  </div>
</footer>

<a href="#main" class="totop" id="toTop" aria-label="Back to top"><svg aria-hidden="true"><use href="#i-arrow-up"/></svg></a>
<script src="/assets/js/script.js?v={version}" defer></script>
</body>
</html>
"""

PAGER = """<a class="cs-pager__link cs-pager__link--{dir}" href="/projects/{slug}/">
        <span class="mono">{label}</span>
        <span class="cs-pager__title">{title}</span>
        <span class="cs-pager__cat">{category}</span>
      </a>"""


def main():
    data = json.loads(read("projects/case-studies.json"))
    mocks = mockups()
    sprite = icons()

    missing = [c["slug"] for c in data if c["slug"] not in mocks]
    if missing:
        sys.exit("no mockup found in index.html for: %s" % ", ".join(missing))

    for i, c in enumerate(data):
        prev_c = data[i - 1] if i > 0 else data[-1]
        next_c = data[(i + 1) % len(data)]

        blocks = "\n".join([
            block("01", "Problem", c["problem"], as_list=False),
            block("02", "Approach", c["approach"], as_list=True),
            block("03", "Solution", c["solution"], as_list=False),
            block("04", "Impact", c["impact"], as_list=True),
        ])

        page = TEMPLATE.format(
            version=VERSION,
            headscript=HEAD_SCRIPT,
            sprite=sprite,
            index=c["index"],
            title=html.escape(c["title"]),
            category=html.escape(c["category"]),
            tagline=html.escape(c["tagline"]),
            meta_desc=html.escape(c["tagline"], quote=True),
            url=c["url"],
            host=c["host"],
            mockup=mocks[c["slug"]],
            role=html.escape(c["role"]),
            scope=html.escape(c["scope"]),
            period=html.escape(c["period"]),
            contribution=html.escape(c["contribution"]),
            blocks=blocks,
            stack=chips(c["stack"]),
            prev=PAGER.format(dir="prev", slug=prev_c["slug"], label="Previous",
                              title=html.escape(prev_c["title"]), category=html.escape(prev_c["category"])),
            next=PAGER.format(dir="next", slug=next_c["slug"], label="Next",
                              title=html.escape(next_c["title"]), category=html.escape(next_c["category"])),
        )

        out = ROOT / "projects" / c["slug"] / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(page)
        print("wrote projects/%s/index.html  (%d KB)" % (c["slug"], len(page) // 1024))


if __name__ == "__main__":
    main()
