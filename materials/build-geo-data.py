#!/usr/bin/env python3
"""Build assets/geo-sample.js for learn-geospatial-with-phoebe from four data.gov.sg downloads.

Run with the interpreter isolated from the download directory (the downloads are untrusted data):
  python3 -I materials/build-geo-data.py <download-dir> <repo> [--tol 0.0003]

<download-dir> must hold, as downloaded on 2026-10-22 from data.gov.sg (Singapore Open Data Licence v1.0):
  d_8594ae9ff96d0c708bc2af633048edfb.geojson   URA Master Plan 2019 Subzone Boundary (No Sea), 332 subzones
  d_b39d3a0871985372d7e1637193335da5.geojson   LTA MRT Station Exit, 613 points
  d_dbfabf16158d1b0e1c420627c0819168.geojson   NEA Dengue Clusters, the snapshot of the download date
  d_d95ae740c0f8961a0b10435836660ce0.csv       SingStat resident population by planning area / subzone, Census 2020

What is shipped (derived, modified):
  - every subzone's rings simplified with Douglas-Peucker at --tol degrees, then quantised to integers
    x = round((lon - 103) * 100000), y = round((lat - 1) * 100000)  (one unit is about 1.1 m)
  - every MRT exit as quantised integers plus station name and exit code
  - every dengue cluster ring, quantised but NOT simplified, with locality, case size and the three breeding-site fields
  - resident population totals per planning area and per subzone (a "-" in the source is shipped as null)
No row identifies a person. The licence notice is carried in the file and printed on every widget.
"""
from __future__ import annotations

import csv
import json
import re
import sys
from datetime import date
from pathlib import Path

QUANT = 100000
OLON, OLAT = 103.0, 1.0
FILES = {
    "subzones": "d_8594ae9ff96d0c708bc2af633048edfb.geojson",
    "exits": "d_b39d3a0871985372d7e1637193335da5.geojson",
    "dengue": "d_dbfabf16158d1b0e1c420627c0819168.geojson",
    "pop": "d_d95ae740c0f8961a0b10435836660ce0.csv",
}
LICENCE = "https://data.gov.sg/open-data-licence"


def notice(name: str, when: str) -> str:
    return (f"Contains information from {name} accessed on {when} from data.gov.sg which is made "
            f"available under the terms of the Singapore Open Data Licence version 1.0 {LICENCE}")


# ---------------------------------------------------------------- geometry helpers
def dp(points: list, tol: float) -> list:
    """Douglas-Peucker on a list of (lon, lat), keeping the endpoints."""
    if len(points) < 3:
        return points
    (x1, y1), (x2, y2) = points[0], points[-1]
    dx, dy = x2 - x1, y2 - y1
    norm = (dx * dx + dy * dy) ** 0.5
    best, bi = -1.0, 0
    for i in range(1, len(points) - 1):
        px, py = points[i]
        if norm == 0:
            d = ((px - x1) ** 2 + (py - y1) ** 2) ** 0.5
        else:
            d = abs(dy * px - dx * py + x2 * y1 - y2 * x1) / norm
        if d > best:
            best, bi = d, i
    if best > tol:
        return dp(points[: bi + 1], tol)[:-1] + dp(points[bi:], tol)
    return [points[0], points[-1]]


def quantise_ring(ring: list, tol: float) -> list | None:
    pts = ring[:-1] if ring[0] == ring[-1] else ring[:]
    if tol > 0:
        pts = dp(pts + [pts[0]], tol)[:-1]
    out: list[int] = []
    for lon, lat in pts:
        x, y = round((lon - OLON) * QUANT), round((lat - OLAT) * QUANT)
        if out and out[-2] == x and out[-1] == y:
            continue
        out += [x, y]
    if len(out) >= 4 and out[0] == out[-2] and out[1] == out[-1]:
        out = out[:-2]
    return out if len(out) >= 6 else None


def polygons(geom: dict) -> list:
    return [geom["coordinates"]] if geom["type"] == "Polygon" else list(geom["coordinates"])


# ---------------------------------------------------------------- build
def build(dl: Path, repo: Path, tol: float, when: str) -> None:
    sz = json.loads((dl / FILES["subzones"]).read_text(encoding="utf-8"))
    ex = json.loads((dl / FILES["exits"]).read_text(encoding="utf-8"))
    dg = json.loads((dl / FILES["dengue"]).read_text(encoding="utf-8"))
    rows = list(csv.reader((dl / FILES["pop"]).open(encoding="utf-8-sig")))

    raw_vertices = 0
    subzones = []
    dropped = 0
    for f in sorted(sz["features"], key=lambda f: f["properties"]["SUBZONE_C"]):
        p = f["properties"]
        polys = []
        for poly in polygons(f["geometry"]):
            rings = []
            for i, ring in enumerate(poly):
                raw_vertices += len(ring) - 1
                q = quantise_ring(ring, tol)
                if q is None:
                    dropped += 1
                    if i == 0:
                        rings = None
                        break
                    continue
                rings.append(q)
            if rings:
                polys.append(rings)
        subzones.append({"n": p["SUBZONE_N"], "c": p["SUBZONE_C"], "pa": p["PLN_AREA_N"],
                         "r": p["REGION_N"], "polys": polys})
    kept_vertices = sum(len(r) // 2 for s in subzones for poly in s["polys"] for r in poly)

    exits = []
    for f in sorted(ex["features"], key=lambda f: f["properties"]["OBJECTID"]):
        lon, lat = f["geometry"]["coordinates"][:2]
        p = f["properties"]
        exits.append([round((lon - OLON) * QUANT), round((lat - OLAT) * QUANT), p["STATION_NA"], p["EXIT_CODE"]])

    def num(v):
        if v is None or v == "":
            return None
        try:
            return int(float(v))
        except (TypeError, ValueError):
            return None

    def text(v):
        return None if v is None or str(v).strip() == "" else str(v).strip()

    clusters = []
    for f in sorted(dg["features"], key=lambda f: f["properties"]["OBJECTID"]):
        p = f["properties"]
        ring = quantise_ring(polygons(f["geometry"])[0][0], 0.0)
        clusters.append({"loc": text(p.get("LOCALITY")), "cases": num(p.get("CASE_SIZE")),
                         "homes": text(p.get("HOMES")), "public": text(p.get("PUBLIC_PLACES")),
                         "sites": text(p.get("CONSTRUCTION_SITES")), "upd": str(p.get("FMEL_UPD_D")),
                         "ring": ring})

    head = rows[0]
    ti = head.index("Total_Total")
    pop_pa, pop_sz = {}, {}
    for r in rows[1:]:
        name, total = r[0].strip(), r[ti].strip()
        val = None if total in ("-", "") else int(total)
        if name == "Total":
            continue
        m = re.match(r"^(.*?)\s*-\s*Total$", name)  # the source spells one row "Changi- Total"
        if m:
            pop_pa[m.group(1).strip().upper()] = val
        else:
            pop_sz[name.upper()] = val
    sz_names = {s["n"] for s in subzones}
    pa_names = {s["pa"] for s in subzones}
    missing_sz = sorted(sz_names - set(pop_sz))
    missing_pa = sorted(pa_names - set(pop_pa))

    sample = {
        "downloaded": when,
        "quant": QUANT, "origin": [OLON, OLAT], "tolDeg": tol,
        "notices": [
            notice("Master Plan 2019 Subzone Boundary (No Sea) (GEOJSON), Urban Redevelopment Authority", when),
            notice("LTA MRT Station Exit (GEOJSON), Land Transport Authority", when),
            notice("Dengue Clusters (GEOJSON), National Environment Agency", when),
            notice("Resident Population by Planning Area/Subzone of Residence, Age Group and Sex (Census of Population 2020), Singapore Department of Statistics", when),
        ],
        "licence": LICENCE,
        "subzones": subzones, "exits": exits, "clusters": clusters,
        "pop": {"pa": pop_pa, "sz": pop_sz, "year": 2020},
    }
    js = ("/* Derived from data.gov.sg open data (Singapore Open Data Licence v1.0, " + LICENCE + "). "
          "Modified: simplified and quantised geometry, selected attributes only. Generated by materials/build-geo-data.py */\n"
          "window.GEO_SAMPLE = " + json.dumps(sample, separators=(",", ":"), ensure_ascii=False) + ";\n")
    out = repo / "assets" / "geo-sample.js"
    out.write_text(js, encoding="utf-8")
    print(f"wrote {out} {out.stat().st_size:,} bytes")
    print(f"subzones {len(subzones)} (polygons {sum(len(s['polys']) for s in subzones)}, rings dropped {dropped}), "
          f"vertices {raw_vertices:,} -> {kept_vertices:,} at tol {tol} deg")
    print(f"exits {len(exits)}; clusters {len(clusters)}; population rows pa {len(pop_pa)} sz {len(pop_sz)}")
    print(f"subzones without a population row: {missing_sz or 'none'}; planning areas without: {missing_pa or 'none'}")
    nulls = [k for k, v in pop_sz.items() if v is None]
    print(f"subzone population null ('-' in source): {len(nulls)}: {nulls}")


if __name__ == "__main__":
    argv = sys.argv[1:]
    tol, when, args = 0.0003, date.today().isoformat(), []
    i = 0
    while i < len(argv):
        if argv[i] == "--tol":
            tol = float(argv[i + 1]); i += 2
        elif argv[i] == "--date":
            when = argv[i + 1]; i += 2
        else:
            args.append(argv[i]); i += 1
    if len(args) != 2:
        sys.exit(__doc__)
    build(Path(args[0]), Path(args[1]), tol, when)
