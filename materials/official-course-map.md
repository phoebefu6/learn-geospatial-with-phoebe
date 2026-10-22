# Geospatial Data - official course map (source of truth)

learn-geospatial-with-phoebe · bucket deng · single-track, 6 sessions x 45 min · difficulty 2 · audience builder
· format interactive · icon 📍 · palette Singapore flag red and white (Phoebe's explicit pick, 2026-10-22):
primary #C8102E (text-safe red, 5.88:1 on white), deep #8E0C22, mid #B3122B, soft #F6C9CE, 50-tint #FDF0F1,
ink #1C1214, muted #5F4D50, faint #E4D2D4, hairline #F2E6E7, paper #FFFAFA; flag red #EF3340 (Pantone 032
approximation) as the contrast token for FILLS under dark ink and display accents only (white on it is 4.02:1,
below AA). Nearest sibling `--indigo` by CIELAB Delta E 2000, 169 siblings: primary #C8102E is 5.3 from
ship-ecommerce-enabler #BE3745, 5.4 from ai-evals #B91C1C, 6.4 from business-chinese-basic #A61B29, 7.1 from
anomaly-detection #DC2626; the flag accent #EF3340 is 6.6 from anomaly-detection; deep #8E0C22 is 5.4 from
business-chinese-basic. Below the usual >= 10 target, kept on instruction. Built 2026-10-22 by the foundations
lead. Engine `assets/geo-live.js`, data `assets/geo-sample.js` (135,120 bytes), prefix `geo`, PASSPORT_KEY
`lwp-passport:geospatial`, port 8881.

Evidence tiers: **read** = read at source (the official page, the registry, the specification, the data itself).
**reported** = stated by a named secondary source or a catalogue record, not read at source; say "reported" on
the page. **not verified** = do not teach as fact.

## Angle

A location is a claim with a reference system, a boundary choice and a distance formula behind it, and each
of the three can be wrong silently. Every session shows one of the three failing without an error message,
then the check that catches it.

## Running case (constructed, say so on every page that uses it)

**Rivermont** is a constructed town-council data desk. Mei runs the desk, Arif is the estates officer who
brings the questions, Priya is the general manager who signs off. Rivermont, its people and its questions are
invented for teaching; every dataset the desk practises on is REAL Singapore open data from data.gov.sg under
the Singapore Open Data Licence v1.0, and every page says both things. No number about Rivermont itself is a
measurement. Never use Phoebe's own employers, clients or career.

## Session arc and coverage

| # | File | Title (h1, accent word) | Covers |
|---|---|---|---|
| 1 | 01-where-is-this-row.html | Where **is** this row? | A row with two numbers is not a location until its CRS is named: latitude/longitude on WGS 84 (EPSG:4326) vs SVY21 / Singapore TM (EPSG:3414); what a degree is at 1 deg 22' N (111.32 km of longitude, 110.57 km of latitude per degree, read: both follow from the WGS 84 ellipsoid; the constant 111,320 is the rung-1 approximation); the SVY21 parameters and the origin control point; axis order traps (GeoJSON is [lon, lat], many human tables are lat, lon; EPSG:3414 axes are Northing, Easting); the swap that lands every MRT exit 9,531 km away. Build-along: read the raw GeoJSON, find the CRS, write the first six rows in both systems, run the swap test. |
| 2 | 02-points-polygons-subzone.html | Points, polygons and the **subzone** | 332 URA Master Plan 2019 subzones in 55 planning areas (read: counted in the data; the approved brief said 323, which is wrong); polygon, multipolygon, ring, hole; the even-odd rule by hand on a notched square, then in code; what simplification does (58,530 vertices to 5,326 at 0.0003 deg; 3 exits fall outside every simplified boundary and 2 fall in two); boundary choice changes the answer: the same exit, a different zoning layer, a different count. Seam: MAUP depth and sensor placement are Smart City's; link, do not reteach. |
| 3 | 03-distance-three-ways.html | Distance **three** ways | Raw degrees with one constant, haversine on a sphere, projected metres; the cos(latitude) mechanism drawn; why raw degrees almost work at 1 deg N (mean +3.79 m, worst 57 m) and blow up at 60 deg N (mean 276 m, worst 2,384 m, 124 nearest exits change); why haversine is not much better here (sphere vs ellipsoid: mean +2.57 m, worst 43 m): at the equator the ellipsoid, not the latitude, is the bigger error. Nearest MRT exit per subzone centroid. Vincenty (reported) as the ellipsoidal great-circle answer. |
| 4 | 04-spatial-joins-grid-index.html | Spatial joins and the **grid** index | Join 613 points to 332 polygons without the full loop: brute force 203,516 ray-casting tests; bounding box first (1,283 exact tests, 671 false box matches rejected by the exact test); a 500 m grid-cell index from scratch (2,396 exact tests, a hash lookup instead of 332 box tests per point); candidate-then-exact as the pattern; the nearest query by expanding rings (5,528 distance evaluations against 203,516, same 332 answers). Seam: SQL joins and pandas merges are taught next door; only the spatial predicate is here. |
| 5 | 05-disease-on-the-map.html | **Disease** on the map | NEA dengue clusters (snapshot of 2026-10-22, 8 clusters) joined to subzones and planning areas by centroid; what a cluster is (read: two or more cases with onset within 14 days within 150 m; alert levels red >= 10 cases, yellow < 10, green no new cases under 21 days of surveillance; case locations are residential and workplace addresses); cases per cluster vs cases per 100,000 residents with Census 2020 population as the denominator; the choropleth that lies: Kian Teck, 40 residents and 2 cases, is 5,000 per 100,000 while Taman Jurong next door, 96 cases and 39,920 residents, is 240; why COVID is not on the page. No health advice: a geometry-and-join exercise, said on the page. Seam: colour and chart craft are Dataviz's; privacy of aggregation is Smart City's. |
| 6 | 06-the-distance-and-join-bench.html | The **distance-and-join** bench | The full ladder computed live on the shipped geometry: raw -> haversine -> projected -> + bbox -> + grid; point-in-polygon three ways; the anti-lever (raw degrees at 60 deg N) and the break button (swap lat and long); the Python reference agreeing with the browser engine on 142 values; the licence notice on the widget. |

Difficulty per card: 1 green, 2 yellow, 3 yellow, 4 orange, 5 orange, 6 red (bench night).
Level chips: 🟢 Foundations (1), 🟡 Core (2, 3), 🟠 Deeper (4, 5), 🔴 Bench night (6).

## Verified facts (cite exactly as here)

### The data (read: data.gov.sg dataset pages, the v2 metadata API, and the files themselves, 2026-10-22)
- **Master Plan 2019 Subzone Boundary (No Sea) (GEOJSON)**, dataset `d_8594ae9ff96d0c708bc2af633048edfb`,
  Urban Redevelopment Authority. Created 2019-12-23, last updated 2025-12-03, "Data from Sep 2021". Description:
  "Indicative polygon of subzone boundary"; URA divides Singapore into regions, planning areas and subzones,
  each subzone "usually centred around a focal point such as neighbourhood centre or activity node"; the Master
  Plan looks 10 to 15 years ahead and "the planning boundaries may not coincide with existing developments".
  Attributes (no descriptions on the page): OBJECTID, SUBZONE_NO, SUBZONE_N, SUBZONE_C, CA_IND, PLN_AREA_N,
  PLN_AREA_C, REGION_N, REGION_C, INC_CRC, FMEL_UPD_D, SHAPE.AREA, SHAPE.LEN. Counted in the file: **332
  features (321 Polygon, 11 MultiPolygon), 374 rings of which 13 are holes, 58,530 vertices, 55 planning areas,
  5 regions; CA_IND = Y on 50 subzones (the Central Area)**. Coordinates are [longitude, latitude] on WGS 84
  (no `crs` member; GeoJSON's default), longitude 103.6057 to 104.0885, latitude 1.1587 to 1.4708.
- **LTA MRT Station Exit (GEOJSON)**, dataset `d_b39d3a0871985372d7e1637193335da5`, Land Transport Authority.
  Created 2019-07-08, last updated 2026-10-18, updated every 6 months, "Data from Aug 2025". "The layer contains
  the locations of MRT station exits." Attributes OBJECTID, STATION_NA, EXIT_CODE, INC_CRC, FMEL_UPD_D.
  Counted: **613 points**.
- **Dengue Clusters (GEOJSON)**, dataset `d_dbfabf16158d1b0e1c420627c0819168`, National Environment Agency.
  Created 2020-09-21, last updated 2026-10-22 10:06 SGT (the file changes daily; the shipped snapshot is the
  2026-10-22 download). Attributes OBJECTID, LOCALITY, CASE_SIZE, NAME, HYPERLINK, HOMES, PUBLIC_PLACES,
  CONSTRUCTION_SITES, INC_CRC, FMEL_UPD_D, SHAPE.AREA, SHAPE.LEN. The page types HOMES, PUBLIC_PLACES and
  CONSTRUCTION_SITES as Numeric; in the file they are text lists of breeding-site types or null. Teach the
  mismatch. Snapshot: **8 clusters, 141 cases in total**: 96, 16, 13, 5, 4, 3, 2, 2.
- **Resident Population by Planning Area/Subzone of Residence, Age Group and Sex (Census of Population 2020)**,
  dataset `d_d95ae740c0f8961a0b10435836660ce0`, Singapore Department of Statistics. Last updated 2021-06-18,
  updated every 10 years, adapted from SingStat TableBuilder CT/17560; footnote: planning areas are URA Master
  Plan 2019 areas. 388 rows: a national total 4,044,210, 55 "- Total" planning-area rows (one spelled
  "Changi- Total" without the space) and 332 subzone rows whose names match the GeoJSON SUBZONE_N exactly after
  upper-casing; 46 subzones carry "-" (shipped as null; teach "suppressed or zero is not zero").
- **Singapore Open Data Licence version 1.0** (read: https://data.gov.sg/open-data-licence). Permits use, copy,
  distribution, modification and adaptation, commercial or not, with a conspicuous attribution notice linking
  the licence; grants nothing over personal data; "as is"; Singapore law. The notice template, verbatim:
  "Contains information from {name of dataset} accessed on {date of access of dataset} from {source of data}
  which is made available under the terms of the Singapore Open Data Licence version 1.0 {URL link to licence}".
  Every widget that shows the data prints one notice per dataset (geo-live.js does; the shipped file carries them).

### Coordinate reference systems
- **EPSG:3414 SVY21 / Singapore TM** (read: epsg.io/3414, a mirror of the EPSG registry; epsg.org itself
  returned 403 on 2026-10-22). Method Transverse Mercator (EPSG:9807); latitude of natural origin
  1.36666666666667 (1 deg 22' N); longitude of natural origin 103.833333333333 (103 deg 50' E); scale factor 1;
  false easting 28001.642 m; false northing 38744.572 m; base geographic CRS EPSG:4757 SVY21 on the WGS 84
  ellipsoid (a = 6378137 m, 1/f = 298.257223563); area of use "Singapore - onshore and offshore", 1.13 to 1.47 N,
  103.59 to 104.07 E; axes Northing, Easting (N, E); remark: "For cadastral purposes, replaces Kertau 1968 /
  Singapore Grid (CRS code 24500) from August 2004."
- The engine's forward formula is the Snyder transverse Mercator series (Snyder 1987, USGS PP 1395, eq. 8-9 to
  8-15; **reported**: implemented from the standard series, not re-read today). Verified two ways: the natural
  origin maps to exactly (28001.642, 38744.572), and an independent Krueger n-series implementation agrees on
  all 945 shipped points to < 0.000001 m (`scratch kruger_check.py`, 2026-10-22). Pantone-style "Base 7 at
  Pierce Reservoir" origin lore and the SLA SVY21 note were **not read** (SLA page 404): do not teach them.
- WGS 84 / EPSG:4326 as GeoJSON's coordinate system with [longitude, latitude] order: **read** in the data (no
  `crs` member) and the GeoJSON convention; the RFC text itself was not fetched today (reported).
- Degree lengths at the equator: one degree of longitude is 111.32 km (2 pi a / 360 with a = 6378137), one
  degree of latitude is 110.57 km (the meridian arc near the equator); the rung-1 constant 111,320 m is the
  longitude figure applied to both axes. **Read**: both follow from the ellipsoid parameters above; the arc
  figure is also what the engine's meridian function gives (M(1 deg) - M(0) = 110,574 m).

### Distance
- **Haversine** as implemented: a = sin^2(dphi/2) + cos(phi1) cos(phi2) sin^2(dlambda/2), d = 2 R atan2(sqrt a,
  sqrt(1 - a)), R = 6,371,008.8 m (IUGG mean radius; reported). Usually credited to Sinnott, R. W. (1984),
  "Virtues of the Haversine", Sky and Telescope 68(2):159 (**reported**; the article was not read, ADS blocked
  the fetch).
- **Vincenty, T. (1975)**, "Direct and Inverse Solutions of Geodesics on the Ellipsoid with Application of
  Nested Equations", Survey Review 23(176):88-93, doi:10.1179/sre.1975.23.176.88. The title was read on the
  NOAA National Geodetic Survey scan (ngs.noaa.gov/PUBS_LIB/inverse.pdf, PDF metadata); volume, pages and the
  "0.5 mm" accuracy claim are **reported**. Teach as "the ellipsoidal answer, iterative, not implemented here".
- The ellipsoid vs the sphere at 1 deg N: haversine's mean error against projected metres is +2.57 m (worst
  42.95 m) and raw degrees' is +3.79 m (worst 57.03 m): **computed**. The lesson is that near the equator the
  sphere is the bigger error and cos(latitude) the smaller one; at 60 deg N the order flips.

### Point in polygon
- **Even-odd rule** (read: W3C SVG 2, painting, `fill-rule`): draw a ray from the point to infinity in any
  direction and count the path segments it crosses; odd means inside, even means outside. `nonzero` instead
  adds one for a left-to-right crossing and subtracts one for right-to-left; zero means outside. The engine
  uses even-odd over every ring, which excludes holes without special-casing them (self-test: a notched square
  and a square with a hole).
- Centroids are the area-weighted planar centroid of all outer rings minus holes, in degrees: fine at 1 deg N
  and said so; a concave or multi-part subzone can put its centroid outside itself (teach in session 2).

### Dengue clusters (read: NEA dengue clusters page, 2026-10-22)
- "Operationally, a dengue cluster indicates a locality with active transmission where intervention is
  targeted." A cluster forms when "two or more cases have onset within 14 days and are located within 150m of
  each other." Alert levels: red "High-risk area with 10 or more cases", yellow "High-risk area with less than
  10 cases", green "No new cases, under surveillance for the next 21 days". "Map data is updated at 1am." Case
  locations are based on "residential and workplace addresses".
- **No health advice on any page.** The pages teach joins and denominators. Prevention, treatment and risk
  statements are NEA's and MOH's and are linked, not restated.
- **Why COVID is not on the page** (reported: stated in the approved brief 2026-10-22; the session-5 author
  re-verifies at source before publishing): MOH's open COVID datasets carry no location field, the 2020
  "places visited" map was a visualisation rather than a dataset, and third-party scrapes are unlicensed
  case-level data. Dengue clusters are the open, licensed, location-bearing stand-in, and are polygons by
  design (a locality, not an address).

### Modifiable areal unit problem
- Openshaw, S. (1984). *The Modifiable Areal Unit Problem*. Concepts and Techniques in Modern Geography 38.
  Geo Books, Norwich (**reported**; one library record dates it [1983?]). One line and a link to Smart City for
  depth; never reteach.

### The flag (palette provenance)
- NHB national flag page (read through the official page's text as excerpted by search; the page body is
  script-rendered): "The National Flag must be produced in its true colours (Pantone 032 and Pantone White) and
  proportions, in the ratio of 2 (width): 3 (length)". The hex #EF3340 for Pantone 032 is a third-party
  approximation (**reported**); it is the course's contrast fill, never a text colour.

## Seams (one line and an absolute link, never reteach; pick the side out loud)

- Sensor placement, MAUP depth, publishing open data, privacy of trips: learn-smart-city
  (https://phoebefu6.github.io/learn-smart-city-with-phoebe/courses/p2-zones-joins-and-the-map.html,
  .../p7-aggregation-and-privacy.html, .../p8-publishing-open-data.html, .../a2-where-the-sensors-are-not.html).
- Chart and colour craft: learn-dataviz (https://phoebefu6.github.io/learn-dataviz-with-phoebe/courses/04-colour-that-works.html,
  .../02-choosing-the-form.html). Maps are drawn here only as the mechanism needs.
- Time series: learn-iot-data (https://phoebefu6.github.io/learn-iot-data-with-phoebe/courses/p2-clocks-sampling-and-resampling.html).
- The law: learn-gdpr (https://phoebefu6.github.io/learn-gdpr-with-phoebe/), learn-pdpa-dnc (https://phoebefu6.github.io/learn-pdpa-dnc-with-phoebe/).
- The languages: learn-sql (https://phoebefu6.github.io/learn-sql-with-phoebe/courses/b4-joining-tables.html),
  learn-python-data-analysis (https://phoebefu6.github.io/learn-python-data-analysis-with-phoebe/courses/03-pandas-core.html).
  Only the spatial predicate and the spatial parts of a query are shown here.

## Not covered (say so when a learner asks)

Raster data and satellite imagery; geocoding addresses; routing and network distance (the nearest exit here is
as the crow flies); map tiles and web-map libraries (no product names on any page: "a web-map library", "a
desktop GIS", "a spatial database extension" are the tool classes); datum transformations between Kertau 1968
and SVY21; Vincenty's iteration (described, not implemented); spatial statistics beyond counts and rates
(no autocorrelation, no kernel density); the health epidemiology of dengue (NEA's and MOH's, linked).

## Bench canon (python == node on 142 values, `python3 materials/geo_reference.py .` vs `node materials/geo-node.js .`, compared by `materials/compare-ladder.py` which also catches a planted 0.1% fault; `node materials/geo-node.js . --plant` makes `selfTest()` fail on a false easting off by 1 m)

Shipped: 332 subzones, 5,326 vertices after Douglas-Peucker at 0.0003 deg (about 33 m; 22 degenerate rings
dropped, all tiny islets or slivers), quantised to 0.00001 deg; 613 exits; 8 clusters; population per planning
area and subzone. Query set: 332 subzone centroids against 613 exits; catchment radius 500 m; grid cell 500 m.

| Rung | Median nearest exit | Mean error vs projected | Worst error | Nearest exit changed | Exits within 500 m (subzones differing) | Distance evaluations |
|---|---|---|---|---|---|---|
| 1 raw degrees x 111,320 | 611.23 m | +3.79 m | 57.03 m | 5 of 332 | 699 (2) | 203,516 |
| 2 haversine, R 6,371,008.8 m | 610.43 m | +2.57 m (mean abs 2.86) | 42.95 m | 5 of 332 | 699 (2) | 203,516 |
| 3 projected SVY21 metres (reference) | 610.38 m (mean 975.88 m) | 0 | 0 | 0 | 701 (0) | 203,516 |
| 4 + bbox prefilter (catchment) | 610.38 m | 0 | 0 | 0 | 701 (0) | 888 |
| 5 + 500 m grid index (nearest + catchment) | 610.38 m | 0 | 0 | 0 | 701 (0) | 5,528 |

Point in polygon, 613 exits against 332 subzones: brute force 203,516 ray-casting tests; 608 exits inside
exactly one subzone, 3 inside none (outside every simplified boundary), 2 inside two (simplification overlap).
Bounding boxes: 1,283 box hits, 671 of them false (box yes, polygon no); bbox-then-exact runs 1,283 exact tests
after 203,516 cheap box tests. 500 m grid over polygon boxes: 2,396 exact tests after one hash lookup per exit;
same answers as brute force.

Anti-lever (raw degrees against haversine, same points): at 1 deg 22' N mean abs error 1.22 m, worst 14.08 m,
0 nearest exits change; translated north by 58.6333 deg so the origin sits at 60 deg N: mean abs error 276.03 m,
worst 2,384.4 m, 124 of 332 nearest exits change. cos(1 deg 22') = 0.99972, cos(60 deg) = 0.5.

Break button (latitude and longitude swapped on the exits): largest "latitude" 103.989 deg (impossible, 90 is
the pole); 332 of 332 subzones contain zero exits; median nearest exit by haversine 9,531 km.

SVY21 origin check: (103 deg 50' E, 1 deg 22' N) -> (28001.642, 38744.572) exactly. Snyder vs Krueger series:
max difference 0.000000 m over 945 points.

Dengue snapshot 2026-10-22 joined by cluster centroid (Census 2020 denominators):

| Planning area | Cases | Residents | Per 100,000 | Clusters (subzone, cases, subzone residents, subzone per 100,000) |
|---|---|---|---|---|
| Jurong West | 98 | 262,730 | 37.3 | Taman Jurong 96 / 39,920 / 240.5; Kian Teck 2 / 40 / 5,000.0 |
| Outram | 5 | 18,340 | 27.3 | Chinatown 5 / 10,490 / 47.7 |
| Bishan | 16 | 87,320 | 18.3 | Bishan East 16 / 28,310 / 56.5 |
| Ang Mo Kio | 18 | 162,280 | 11.1 | Tagore: three clusters 13 + 2 + 3 / 7,950 / 226.4 |
| Serangoon | 4 | 116,900 | 3.4 | Upper Paya Lebar 4 / 16,920 / 23.6 |

The choropleth that lies: by cases, Taman Jurong (96) is the map's darkest cell; by rate, Kian Teck (2 cases,
40 residents) is 20 times darker than Taman Jurong, and Jurong West as a planning area is 37 per 100,000.
Three denominators, three maps, same eight clusters. Teach that, and that cluster polygons are localities
built from residential and workplace addresses, so "cases per resident of the subzone" is itself a boundary
choice.

## Citation appendix (use these forms)

1. Urban Redevelopment Authority. Master Plan 2019 Subzone Boundary (No Sea) (GEOJSON). data.gov.sg dataset d_8594ae9ff96d0c708bc2af633048edfb, last updated 2025-12-03, accessed 2026-10-22. Singapore Open Data Licence v1.0.
2. Land Transport Authority. LTA MRT Station Exit (GEOJSON). data.gov.sg dataset d_b39d3a0871985372d7e1637193335da5, last updated 2026-10-18, accessed 2026-10-22. Singapore Open Data Licence v1.0.
3. National Environment Agency. Dengue Clusters (GEOJSON). data.gov.sg dataset d_dbfabf16158d1b0e1c420627c0819168, snapshot accessed 2026-10-22. Singapore Open Data Licence v1.0.
4. Singapore Department of Statistics. Resident Population by Planning Area/Subzone of Residence, Age Group and Sex (Census of Population 2020). data.gov.sg dataset d_d95ae740c0f8961a0b10435836660ce0, last updated 2021-06-18, accessed 2026-10-22. Singapore Open Data Licence v1.0.
5. Singapore Open Data Licence version 1.0. https://data.gov.sg/open-data-licence (read 2026-10-22).
6. EPSG:3414 SVY21 / Singapore TM; EPSG:4757 SVY21. EPSG Geodetic Parameter Registry, read via epsg.io/3414 on 2026-10-22.
7. Snyder, J. P. (1987). Map Projections: A Working Manual. USGS Professional Paper 1395 (reported; transverse Mercator series).
8. Sinnott, R. W. (1984). Virtues of the Haversine. Sky and Telescope 68(2):159 (reported).
9. Vincenty, T. (1975). Direct and Inverse Solutions of Geodesics on the Ellipsoid with Application of Nested Equations. Survey Review 23(176):88-93 (title read on the NGS scan; volume and pages reported).
10. W3C. Scalable Vector Graphics (SVG) 2, Painting: Filling, Stroking and Marker Symbols, `fill-rule` (read 2026-10-22).
11. National Environment Agency. Dengue Clusters. https://www.nea.gov.sg/dengue-zika/dengue/dengue-clusters (read 2026-10-22).
12. Openshaw, S. (1984). The Modifiable Areal Unit Problem. CATMOG 38. Geo Books, Norwich (reported).
13. National Heritage Board. National Flag: Pantone 032 and Pantone White, ratio 2:3 (official page text, read via excerpt 2026-10-22).

## Corrections to the approved brief (2026-10-22)

- "323 URA subzones" is 332 in the data (and 55 planning areas). Every page says 332.
- The brief's SLA SVY21 note could not be read (404); the EPSG parameters were read via epsg.io because epsg.org returned 403.
- The brief said data types on the dengue page are inconsistent: confirmed (HOMES, PUBLIC_PLACES, CONSTRUCTION_SITES typed Numeric, delivered as text or null).
