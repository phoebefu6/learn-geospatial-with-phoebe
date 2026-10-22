# Agent brief - shared by every fan-out page of learn-geospatial-with-phoebe

You are writing ONE static HTML session page. No servers, no npm. **If your target file already
exists on disk, do not write it; report that and stop.** Write the file, return its path and one
line of coverage. No HTML in your reply.

## Read first, in this order

1. The template page. Copy its structure, classes, SVG grammar and quiz markup EXACTLY, including
   how many options each question has (FOUR, labelled "A · ", "B · ", "C · ", "D · "):
   - `/Users/phoebe.fu/Documents/claude_work/github_repo/learn-geospatial-with-phoebe/courses/01-where-is-this-row.html`
   - For rhythm only (the bench page; do not copy its widget or quote its numbers beyond the map):
     `/Users/phoebe.fu/Documents/claude_work/github_repo/learn-geospatial-with-phoebe/courses/06-the-distance-and-join-bench.html`
2. The source map: every verified number, its evidence tier, per-session coverage, the seams. Use
   ONLY its numbers; never invent a statistic; if a fact is missing, teach the uncertainty.
   `/Users/phoebe.fu/Documents/claude_work/github_repo/learn-geospatial-with-phoebe/materials/official-course-map.md`
3. The stylesheet `:root` block for the palette tokens (first 30 lines):
   `/Users/phoebe.fu/Documents/claude_work/github_repo/learn-geospatial-with-phoebe/assets/style.css`

## Page skeleton (keep every component)

toolbar (crumb EXACTLY "Session N of 6", linked repo name as in the template, #toggle-all,
#zoom-toggle) · masthead (eyebrow "Learn Geospatial Data with Phoebe · Session N of 6", h1 with one
`<span class="accent">`, .sub, .chip-row with the level chip (🟡 Core for sessions 2 and 3, 🟠 Deeper
for 4 and 5) plus two .chip.audience and the .chip.time "45 min", .agenda a1-a4) · main.wrap ·
section#intro (Part 0: kicker, .lede, .legend pills as in the template, .callout.win "★ What you walk
out with tonight") · 3 Parts, each `section.section#part-N` with section-kicker (klabel "Part N ·
covers ...", h2, `.tag.concept "N min live"`), a `.lede`, ONE figure, `details.card` accordions
(summary: `.mode.live` or `.mode.self`, title, `.mini`, `.caret ▶`), at least one `.callout.example`
with `span.ex-pill` "Real world" on the page · section#demo-1 Build-along (kicker `.tag.demo "★ 22 min ·
everyone builds"`, .lede, ONE figure, `.steps > .step`, each with a `.prompt-box.good` carrying a
`span.label`; the build-along is Mei's work at the constructed Rivermont desk on the REAL data.gov.sg
files, written as plain Python (standard library + math only, no third-party package names) the learner
can run on the downloaded files; print only outputs the map records, or "your numbers will differ" for
anything not in the map) · section#exercise Homework (ol, 4 items) · section#quiz (3 x `.quiz-q
data-answer="0-based"`, `p.qtext`, four `button.qopt` "A · ..." as in the template, `p.qwhy`; one
`p.quiz-score` after the last; vary the correct letter) · section#official, h2 EXACTLY "What this
session teaches, and where it came from", `.covered > .covered-row` (pill solid ✓ / light ◐ + name +
note), then the `.mono` line EXACTLY "Every fact on this page, and its verification tier, is recorded in
the course's source map." · section.cheat#cheatsheet (h3 "Session N cheat sheet <span>· pin this</span>",
.grid-2 of six .cheat-item) · `.callout.next` with `.nx-pill` "Next session" · footer.pagefoot ·
`<script src="../assets/app.js?v=1"></script>`.

Head: the template's social meta block with this page's own title/description/url;
`<title>Session N · <Title> - learn geospatial data with phoebe</title>`;
`<link rel="stylesheet" href="../assets/style.css?v=1">`. Nothing else external.

First `details.card` in the FIRST Part is `open`; no other. Sentence case headings. Warm
practitioner voice, concrete, never dry. Inside prompt-boxes escape `&` `<` `>`. 450 to 650 lines
is guidance about depth, never a target: never collapse whitespace, dissolve a list into a
paragraph, or drop a component to fit.

## Hard rules (a violation is rework)

- NEVER an em dash or en dash, anywhere (prose, code, aria-labels, comments). Hyphen only.
- No meta text: never "this course", "in this course", "the course teaches", "banned here". State
  the professional norm directly with its reason. The two exact estate phrases above are the only
  self-references; "session 5" cross-references are fine.
- Attribution "by Phoebe Fu". Never "built with" a tool.
- Every number comes from the map or is labelled constructed. Rivermont, Mei, Arif and Priya are
  constructed and the page says so on first use in every Part. Every data number is REAL and the page
  says "real Singapore open data" with the licence line (see Voice and honesty).
- Contested or missing evidence: teach the disagreement; never resolve what the literature has not.
- Citations in the exact form of the map's appendix; anything marked reported is "reported".
- NEVER "lottery" or "lotteries"; say the mechanism. No Chinese terms.
- Never a cross mark glyph (✗, ×, ❌) anywhere, including figures: label a wrong way in words and use
  the universal reds only for that panel.
- **No vendor, product or GIS brand names as recommendations**: say "a desktop GIS", "a web-map
  library", "a spatial database extension", "a geocoding service". Open standards and codes are fine:
  GeoJSON, WKT, EPSG:4326, EPSG:3414, SVY21, WGS 84.
- **No health advice and no named incidents.** Dengue is a geometry-and-join exercise and the page says
  so; NEA's definitions are quoted as in the map; prevention or risk statements are linked, not written.
- 332 subzones, 55 planning areas, 613 exits, 8 clusters, 141 cases: never 323.
- The licence notice (map, "The data") appears on every widget or figure that shows the data, as a
  figcaption line or a `.mono` line: "Contains information from <dataset> accessed on 2026-10-22 from
  data.gov.sg which is made available under the terms of the Singapore Open Data Licence version 1.0
  https://data.gov.sg/open-data-licence".
- Titles, widget ids and class names must not collide with siblings: do not use ids or classes starting
  `geo-` other than inside figure prefixes (the engine owns `geo-bench`, `geo-subzone`, `.geo-*`);
  do not reuse "Distance & density", "Zones, joins and the map", "Where the sensors are not", "Aggregation
  and privacy" (Smart City's titles); do not use figure prefixes `f1a`..`f1e`, `f6a`..`f6e` (pages 1 and 6).
- Seams: one line and a link, never teach the neighbour's content (see Cross-links).

## Figure grammar (hand-drawn, every figure)

Palette, ONLY these hexes (no invented greys): #C8102E (accent / primary) #8E0C22 (accent-deep) #B3122B
(mid) #F6C9CE (soft) #FDF0F1 (accent-50) #1C1214 (ink) #5F4D50 (muted) #E4D2D4 (faint) #F2E6E7 (hairline)
#EF3340 (flag red, FILL under dark ink only, never a text colour) #FDECEE (flag-50) #FFFAFA (paper) ·
`#FFFFFF` · universal reds `#991B1B` `#FEF2F2` `#FCA5A5` only for a wrong-way panel.

- `<figure class="zoomable">` > `<svg viewBox="0 0 880 H" xmlns="http://www.w3.org/2000/svg" role="img"
  aria-label="the data, not the shape">` > `<defs>` + `<style>` + content, then
  `<figcaption>🔍 Click to zoom - takeaway</figcaption>`. Grow H, never W.
- Prefix unique per figure, used for every class and id: `f<session><letter>`, e.g. f2a, f2b, f2c,
  f2d for session 2 (f3a.. for session 3, f4a.., f5a..).
- `<defs>` holds with prefix P: a wobble filter `id="PSk"` (`feTurbulence type="fractalNoise"
  baseFrequency="0.02" numOctaves="2" seed="<int>"` + `feDisplacementMap scale="2.4"
  xChannelSelector="R" yChannelSelector="G"`, `x="-3%" y="-3%" width="106%" height="106%"`), a
  hachure pattern `id="PHc"` (7x7 userSpaceOnUse, rotate(-38), one #C8102E line, opacity .5) if used, an
  open arrowhead `id="PAr"` (path `M1 1 L9 5 L1 9`, fill none, #1C1214 stroke 1.6) if used. ALL shapes
  sit inside ONE `<g filter="url(#PSk)" fill="none" stroke="#1C1214" stroke-width="2"
  stroke-linecap="round" stroke-linejoin="round">`; rects carry a tiny rotation (-4 to 4 degrees for
  hand-placed items, under 1 for panels). Fills: white, #FDF0F1, the hachure for "the data" or "the
  pile", and flag red #EF3340 ONLY for the one thing the figure is about (with ink text on it). One doodle
  anchor per figure, simple strokes, never a mascot. Text classes (copy the template's `<style>` block,
  renamed): `.PH` 800 12px ink heading · `.PL` 600 12px ink label · `.PS` 400 11px muted · `.PB` 800 11px
  #8E0C22 · `.PV` 800 12-20px #8E0C22 value · `.PW` 800 11-12px white on a #C8102E or #8E0C22 fill only ·
  `.PA` 700 11px #C8102E caption · `.PN` 400 12px muted note. Hand-stacked items must not overlap as
  painted rects.
- ALL `<text>` OUTSIDE the filtered group, sans stack, never below 10.5px.
- Fit: max chars ≈ (box width - 20) / 7 at 12px, 6.4px/char at 11px; full-width note under 110 chars;
  40px between neighbouring point labels; bottom note 22px below the last row, H clears it by 8px.
  When in doubt, shorten. NO line, arrow or curve may pass through or touch a text label (the gate
  flags line-through-text): route arrows in the gaps and put edge labels clear of the path.
- Floor: one figure per Part plus one in the build-along (4 figures). Draw the MECHANISM (e.g. a ring
  with a ray crossing it an odd number of times; a polygon and its bounding box with a false-match point
  in the corner; a grid of cells with the three by three neighbourhood shaded; two meridians converging
  toward the pole with the parallel shrinking by cos(latitude); the same eight clusters under three
  denominators as three small maps), never a metaphor literally, never decoration.

## Voice and honesty

Every Part gets a story: Rivermont (constructed, labelled on first use per Part) working on the REAL
data, or a familiar data-desk pattern with no invented numbers. The `.callout.example` "Real world" pill
holds a familiar pattern described without statistics, or a Rivermont moment labelled constructed. The
data line, on every page, near the first data number: "The data is real Singapore open data from
data.gov.sg (URA subzones, LTA MRT exits, NEA dengue clusters, SingStat Census 2020), accessed 2026-10-22
under the Singapore Open Data Licence v1.0; Rivermont is constructed." People: Mei (runs the desk), Arif
(estates officer, asks the questions), Priya (general manager, signs off).

## Cross-links (absolute URLs)

- Zones, joins and MAUP depth, sensor placement, open-data publishing, privacy of aggregation:
  https://phoebefu6.github.io/learn-smart-city-with-phoebe/courses/p2-zones-joins-and-the-map.html ·
  https://phoebefu6.github.io/learn-smart-city-with-phoebe/courses/p7-aggregation-and-privacy.html ·
  https://phoebefu6.github.io/learn-smart-city-with-phoebe/courses/p8-publishing-open-data.html ·
  https://phoebefu6.github.io/learn-smart-city-with-phoebe/courses/a2-where-the-sensors-are-not.html
- Colour and chart form: https://phoebefu6.github.io/learn-dataviz-with-phoebe/courses/04-colour-that-works.html ·
  https://phoebefu6.github.io/learn-dataviz-with-phoebe/courses/02-choosing-the-form.html
- Time series: https://phoebefu6.github.io/learn-iot-data-with-phoebe/courses/p2-clocks-sampling-and-resampling.html
- The law: https://phoebefu6.github.io/learn-gdpr-with-phoebe/ · https://phoebefu6.github.io/learn-pdpa-dnc-with-phoebe/
- Joins in SQL and pandas: https://phoebefu6.github.io/learn-sql-with-phoebe/courses/b4-joining-tables.html ·
  https://phoebefu6.github.io/learn-python-data-analysis-with-phoebe/courses/03-pandas-core.html
- Hub: https://phoebefu6.github.io/learn-with-phoebe/

## Footer chain and session titles

Footer left: "Session N of 6 · learn-geospatial-with-phoebe · by Phoebe Fu &nbsp;·&nbsp; 📚 <a href="https://phoebefu6.github.io/learn-with-phoebe/">Learn with Phoebe ↗</a>"
Footer right: "<a href="PREV">← Prev: <title></a> &nbsp;·&nbsp; <a href="NEXT">Next: <title> →</a>" (last page: "← Prev" and "<a href="../index.html">Course home →</a>").

Session titles and files (exact, sentence case, one accent span in h1, accent word in brackets):
1. 01-where-is-this-row.html · Where (is) this row?
2. 02-points-polygons-subzone.html · Points, polygons and the (subzone)
3. 03-distance-three-ways.html · Distance (three) ways
4. 04-spatial-joins-grid-index.html · Spatial joins and the (grid) index
5. 05-disease-on-the-map.html · (Disease) on the map
6. 06-the-distance-and-join-bench.html · The (distance-and-join) bench

## One-line outlines for the fan-out pages

- **02** Part 1 polygon, multipolygon, ring, hole, and the 332 subzones in 55 planning areas (counted in the
  data, not 323); Part 2 the even-odd rule by hand on a notched square then on a real subzone, and why a
  centroid can fall outside its own shape; Part 3 simplification (58,530 to 5,326 vertices at 0.0003 deg;
  3 exits fall outside every simplified boundary, 2 fall in two) and boundary choice changing a count, with
  the Smart City link for MAUP depth. Build-along: Mei counts exits per subzone three ways on the raw file.
- **03** Part 1 one degree is not one length: 111.32 km of longitude at the equator times cos(latitude),
  110.57 km of latitude, drawn as converging meridians; Part 2 the three formulas and what each assumes
  (constant, sphere, ellipsoid), with the canon errors at 1 deg N (raw +3.79 m mean, worst 57 m; haversine
  +2.57 m, worst 43 m) and the lesson that the ellipsoid is the bigger error near the equator; Part 3 the
  same points at 60 deg N (mean 276 m, worst 2,384 m, 124 nearest exits change) and Vincenty (reported) as
  the ellipsoidal answer. Build-along: Mei writes the three functions and the nearest-exit loop.
- **04** Part 1 the full loop: 203,516 pairs and why it is fine for 613 x 332 and not for a million rows;
  Part 2 bounding box first: 1,283 box hits, 671 false, exact test on the candidates only; Part 3 the 500 m
  grid-cell index from scratch (hash of cell keys, 2,396 exact tests, expanding rings for nearest, 5,528
  distance evaluations), candidate-then-exact as the pattern behind every spatial index. Build-along: Mei
  builds the grid in 30 lines and checks it against brute force (same 332 answers).
- **05** Part 1 what an NEA cluster is (quoted as the map), 8 clusters and 141 cases on 2026-10-22, joined
  to subzones and planning areas by centroid; Part 2 three denominators, three maps: cases, per 100,000 of the
  subzone (Kian Teck 5,000 from 2 cases and 40 residents), per 100,000 of the planning area (Jurong West
  37.3); Part 3 why COVID is not on the page (reported in the map; re-verify at source), with the Dataviz and
  Smart City links for colour and privacy. No health advice anywhere. Build-along: Mei joins the snapshot and
  writes the three tables.
