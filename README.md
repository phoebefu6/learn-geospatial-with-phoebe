<!-- learn-with-phoebe hub banner -->
> ### 📚 Part of [**Learn with Phoebe**](https://phoebefu6.github.io/learn-with-phoebe/)
> The shelf of 172 free, hands-on courses on AI, data, and the craft around them. **[Browse every course ↗](https://phoebefu6.github.io/learn-with-phoebe/)**
<!-- /learn-with-phoebe hub banner -->

# Learn Geospatial Data with Phoebe

Six 45-minute sessions on reading a location as a claim: the reference system behind the two numbers, the
boundary that turns a point into a zone, and the distance formula that can be wrong by three metres or by
two kilometres. Everything is practised on real Singapore open data from data.gov.sg (URA Master Plan 2019
subzones, LTA MRT station exits, NEA dengue clusters, SingStat Census 2020 population) under the Singapore
Open Data Licence v1.0, through a constructed town-council data desk called Rivermont.

**Live site:** https://phoebefu6.github.io/learn-geospatial-with-phoebe/

| # | Session | Signature thing |
|---|---|---|
| 1 | Where is this row? | WGS 84 against SVY21 (EPSG:3414); a coordinate without its CRS; the axis-order swap test |
| 2 | Points, polygons and the subzone | 332 subzones; the even-odd rule by hand; simplification and boundary choice |
| 3 | Distance three ways | Raw degrees, haversine, projected metres; cos(latitude) drawn; 1 deg N against 60 deg N |
| 4 | Spatial joins and the grid index | 203,516 pairs to 2,396 exact tests: bounding box, then a 500 m grid from scratch |
| 5 | Disease on the map | NEA dengue clusters joined to subzones; three denominators, three maps; why COVID is not here |
| 6 | The distance-and-join bench | The whole ladder computed live in the browser, with an anti-lever and a break button |

The bench (`assets/geo-live.js`, data in `assets/geo-sample.js`, 135 KB) ships simplified, quantised
geometry for 332 subzones (5,326 vertices), 613 MRT exits, the 8 dengue clusters of 2026-10-22 and
Census 2020 population. Nearest MRT exit per subzone centroid and exits within 500 m are computed five
ways: raw degrees (mean error +3.79 m, worst 57 m against projected metres), haversine (+2.57 m, worst
43 m), SVY21 projected metres (the reference), projected with a bounding-box prefilter (888 distance
evaluations for the catchment query instead of 203,516) and projected with a 500 m grid index (5,528
evaluations for nearest and catchment together, same 332 answers). Point in polygon runs brute force
(203,516 ray-casting tests), bounding box then exact (1,283) and grid then exact (2,396). The anti-lever
translates the same points to 60 deg N, where raw degrees are out by 276 m on average and 2,384 m at
worst; the break button swaps latitude and longitude and every subzone loses its exits. The Python
reference (`materials/geo_reference.py`) and the browser engine run under node (`materials/geo-node.js`)
agree on all 142 canon values (`materials/compare-ladder.py`).

Data: data.gov.sg datasets d_8594ae9ff96d0c708bc2af633048edfb (URA), d_b39d3a0871985372d7e1637193335da5
(LTA), d_dbfabf16158d1b0e1c420627c0819168 (NEA), d_d95ae740c0f8961a0b10435836660ce0 (SingStat), accessed
2026-10-22, made available under the Singapore Open Data Licence version 1.0,
https://data.gov.sg/open-data-licence. Modified: simplified and quantised geometry, selected attributes.
Rebuild with `python3 -I materials/build-geo-data.py <download-dir> .`.

By Phoebe Fu.
