#!/usr/bin/env python3
"""Python reference for the distance-and-join bench of learn-geospatial-with-phoebe.

Runs the SAME ladder as assets/geo-live.js, step for step, on the shipped data, and prints the canon
as JSON. Pure python + math; nothing else. Compare with the browser engine run under node:

  python3 materials/geo_reference.py <repo> > py.json
  node    materials/geo-node.js      <repo> > node.json
  python3 materials/compare-ladder.py py.json node.json      # by value, with a planted-fault self-test

The ladder (every number is COMPUTED on the shipped geometry, nothing is modelled):
  raw        flat Euclidean on raw degrees, both axes scaled by one naive constant 111,320 m per degree
  haversine  great-circle on a sphere of radius 6,371,008.8 m (Sinnott 1984 formula)
  projected  SVY21 / EPSG:3414 transverse Mercator forward (Snyder series), Euclidean metres. THE REFERENCE
  bbox       projected metres + a bounding-box prefilter before the distance formula (catchment query)
  grid       projected metres + a 500 m grid-cell index (catchment and nearest-exit queries)
Query set: the 332 subzone centroids against the 613 MRT exits. Nearest exit per centroid; catchment =
exits within 500 m. Point-in-polygon: the 613 exits against the 332 subzones, even-odd ray casting,
brute force vs bounding-box shortcut vs grid index. Anti-lever: the same points translated to 60 deg N,
raw degrees against haversine. Break button: latitude and longitude swapped on the exits.
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

QUANT = 100000.0
OLON, OLAT = 103.0, 1.0
A = 6378137.0                      # WGS 84 semi-major axis (EPSG:4757 SVY21 uses the WGS 84 ellipsoid)
F = 1.0 / 298.257223563            # inverse flattening 298.257223563
K0 = 1.0                           # EPSG:3414 scale factor at natural origin
LAT0_DEG = 1.0 + 22.0 / 60.0       # 1 deg 22' N  = 1.36666666666667
LON0_DEG = 103.0 + 50.0 / 60.0     # 103 deg 50' E = 103.833333333333
FE = 28001.642                     # false easting, metres
FN = 38744.572                     # false northing, metres
R_SPHERE = 6371008.8               # IUGG mean Earth radius, metres
DEG_M = 111320.0                   # the naive "metres per degree" constant of rung 1
RADIUS = 500.0                     # catchment radius, metres
CELL = 500.0                       # grid cell, metres
SHIFT = 60.0 - LAT0_DEG            # translate the natural origin to 60 deg N for the anti-lever
E2 = 2 * F - F * F
EP2 = E2 / (1 - E2)
E4 = E2 * E2
E6 = E4 * E2
RAD = math.pi / 180.0


def rad(d: float) -> float:
    return d * RAD


def lonlat(x: float, y: float):
    return (OLON + x / QUANT, OLAT + y / QUANT)


# ---------------------------------------------------------------- three distances
def merid(phi: float) -> float:
    return A * ((1 - E2 / 4 - 3 * E4 / 64 - 5 * E6 / 256) * phi
                - (3 * E2 / 8 + 3 * E4 / 32 + 45 * E6 / 1024) * math.sin(2 * phi)
                + (15 * E4 / 256 + 45 * E6 / 1024) * math.sin(4 * phi)
                - (35 * E6 / 3072) * math.sin(6 * phi))


M0 = merid(rad(LAT0_DEG))
LON0 = rad(LON0_DEG)


def svy21(lon: float, lat: float):
    """EPSG:3414 forward, Snyder (1987) transverse Mercator series for the ellipsoid."""
    phi = rad(lat)
    lam = rad(lon)
    s = math.sin(phi)
    c = math.cos(phi)
    t = math.tan(phi)
    n = A / math.sqrt(1 - E2 * s * s)
    tt = t * t
    cc = EP2 * c * c
    a1 = (lam - LON0) * c
    a2 = a1 * a1
    a3 = a2 * a1
    a4 = a3 * a1
    a5 = a4 * a1
    a6 = a5 * a1
    m = merid(phi)
    x = K0 * n * (a1 + (1 - tt + cc) * a3 / 6 + (5 - 18 * tt + tt * tt + 72 * cc - 58 * EP2) * a5 / 120)
    y = K0 * (m - M0 + n * t * (a2 / 2 + (5 - tt + 9 * cc + 4 * cc * cc) * a4 / 24
                                + (61 - 58 * tt + tt * tt + 600 * cc - 330 * EP2) * a6 / 720))
    return (FE + x, FN + y)


def haversine(lon1, lat1, lon2, lat2) -> float:
    p1 = rad(lat1)
    p2 = rad(lat2)
    sdp = math.sin((p2 - p1) / 2)
    sdl = math.sin(rad(lon2 - lon1) / 2)
    a = sdp * sdp + math.cos(p1) * math.cos(p2) * sdl * sdl
    return 2 * R_SPHERE * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def rawdeg(lon1, lat1, lon2, lat2) -> float:
    dx = lon2 - lon1
    dy = lat2 - lat1
    return DEG_M * math.sqrt(dx * dx + dy * dy)


def euclid(e1, n1, e2, n2) -> float:
    dx = e2 - e1
    dy = n2 - n1
    return math.sqrt(dx * dx + dy * dy)


# ---------------------------------------------------------------- polygons
def ring_centroid(r):
    """(weight = |area| in quantised units squared, cx, cy) via the shoelace, relative to the first vertex."""
    n = len(r) // 2
    x0, y0 = r[0], r[1]
    a = 0
    cx = 0
    cy = 0
    for i in range(n):
        j = (i + 1) % n
        x1 = r[2 * i] - x0
        y1 = r[2 * i + 1] - y0
        x2 = r[2 * j] - x0
        y2 = r[2 * j + 1] - y0
        cr = x1 * y2 - x2 * y1
        a += cr
        cx += (x1 + x2) * cr
        cy += (y1 + y2) * cr
    if a == 0:
        return None
    return (abs(a) / 2, x0 + cx / (3 * a), y0 + cy / (3 * a))


def poly_centroid(polys):
    """Area-weighted centroid of all outer rings minus holes (planar, in quantised degree units)."""
    wsum = 0.0
    xs = 0.0
    ys = 0.0
    for rings in polys:
        for k, r in enumerate(rings):
            rc = ring_centroid(r)
            if rc is None:
                continue
            w = rc[0] if k == 0 else -rc[0]
            wsum += w
            xs += w * rc[1]
            ys += w * rc[2]
    return (xs / wsum, ys / wsum)


def bbox(polys):
    xs = [r[i] for rings in polys for r in rings for i in range(0, len(r), 2)]
    ys = [r[i] for rings in polys for r in rings for i in range(1, len(r), 2)]
    return (min(xs), min(ys), max(xs), max(ys))


def inside(px, py, polys) -> bool:
    """Even-odd rule (the SVG 'evenodd' fill rule): cast a ray to +x, count crossings of every ring."""
    c = False
    for rings in polys:
        for r in rings:
            n = len(r) // 2
            j = n - 1
            for i in range(n):
                xi, yi = r[2 * i], r[2 * i + 1]
                xj, yj = r[2 * j], r[2 * j + 1]
                if (yi > py) != (yj > py):
                    xint = xi + (py - yi) * (xj - xi) / (yj - yi)
                    if px < xint:
                        c = not c
                j = i
    return c


def median(xs):
    s = sorted(xs)
    n = len(s)
    return s[n // 2] if n % 2 else (s[n // 2 - 1] + s[n // 2]) / 2


# ---------------------------------------------------------------- the ladder
def nearest_brute(cents, exits, dist):
    """Per centroid: (nearest index, distance, catchment count, evaluations) with a brute-force scan."""
    out = []
    for c in cents:
        best, bi, cnt = math.inf, -1, 0
        for k, e in enumerate(exits):
            d = dist(c, e)
            if d < best:
                best, bi = d, k
            if d <= RADIUS:
                cnt += 1
        out.append((bi, best, cnt, len(exits)))
    return out


def rung_summary(rows, ref):
    """Compare a rung's per-centroid results with the projected reference."""
    errs = [r[1] - f[1] for r, f in zip(rows, ref)]
    return {
        "medianNearest": median([r[1] for r in rows]),
        "meanNearest": sum(r[1] for r in rows) / len(rows),
        "meanErr": sum(errs) / len(errs),
        "meanAbsErr": sum(abs(e) for e in errs) / len(errs),
        "maxAbsErr": max(abs(e) for e in errs),
        "nearestChanged": sum(1 for r, f in zip(rows, ref) if r[0] != f[0]),
        "catchTotal": sum(r[2] for r in rows),
        "catchDiffers": sum(1 for r, f in zip(rows, ref) if r[2] != f[2]),
        "distanceEvals": sum(r[3] for r in rows),
    }


class Grid:
    """Points bucketed into CELL x CELL squares of projected metres."""

    def __init__(self, pts):
        self.minx = min(p[0] for p in pts)
        self.miny = min(p[1] for p in pts)
        self.cells = {}
        self.nx = 0
        self.ny = 0
        for k, p in enumerate(pts):
            ix, iy = self.cell(p[0], p[1])
            self.cells.setdefault((ix, iy), []).append(k)
            self.nx = max(self.nx, ix + 1)
            self.ny = max(self.ny, iy + 1)
        self.pts = pts

    def cell(self, x, y):
        return (math.floor((x - self.minx) / CELL), math.floor((y - self.miny) / CELL))

    def nearest(self, q):
        qx, qy = self.cell(q[0], q[1])
        best, bi, evals = math.inf, -1, 0
        kmax = max(abs(qx) + self.nx, abs(qy) + self.ny) + 1
        k = 0
        while True:
            for ix in range(qx - k, qx + k + 1):
                for iy in range(qy - k, qy + k + 1):
                    if max(abs(ix - qx), abs(iy - qy)) != k:
                        continue
                    for j in self.cells.get((ix, iy), ()):
                        d = euclid(q[0], q[1], self.pts[j][0], self.pts[j][1])
                        evals += 1
                        if d < best:
                            best, bi = d, j
            if (bi >= 0 and best <= k * CELL) or k > kmax:
                return (bi, best, evals)
            k += 1

    def within(self, q):
        lo = self.cell(q[0] - RADIUS, q[1] - RADIUS)
        hi = self.cell(q[0] + RADIUS, q[1] + RADIUS)
        cnt, evals = 0, 0
        for ix in range(lo[0], hi[0] + 1):
            for iy in range(lo[1], hi[1] + 1):
                for j in self.cells.get((ix, iy), ()):
                    d = euclid(q[0], q[1], self.pts[j][0], self.pts[j][1])
                    evals += 1
                    if d <= RADIUS:
                        cnt += 1
        return (cnt, evals)


def canon(sample):
    sz = sample["subzones"]
    ex = sample["exits"]
    cents_q = [poly_centroid(s["polys"]) for s in sz]
    cents = [lonlat(*c) for c in cents_q]
    exits = [lonlat(e[0], e[1]) for e in ex]
    cents_m = [svy21(*c) for c in cents]
    exits_m = [svy21(*e) for e in exits]

    ref = nearest_brute(cents_m, exits_m, lambda c, e: euclid(c[0], c[1], e[0], e[1]))
    raw = nearest_brute(cents, exits, lambda c, e: rawdeg(c[0], c[1], e[0], e[1]))
    hav = nearest_brute(cents, exits, lambda c, e: haversine(c[0], c[1], e[0], e[1]))

    # bbox prefilter on the catchment query (nearest unchanged, counted once per pair)
    bb = []
    for i, c in enumerate(cents_m):
        cnt, evals = 0, 0
        for e in exits_m:
            if abs(e[0] - c[0]) <= RADIUS and abs(e[1] - c[1]) <= RADIUS:
                evals += 1
                if euclid(c[0], c[1], e[0], e[1]) <= RADIUS:
                    cnt += 1
        bb.append((ref[i][0], ref[i][1], cnt, evals))

    grid = Grid(exits_m)
    gr = []
    for c in cents_m:
        bi, best, ev1 = grid.nearest(c)
        cnt, ev2 = grid.within(c)
        gr.append((bi, best, cnt, ev1 + ev2))

    # point in polygon: exits against subzones
    boxes = [bbox(s["polys"]) for s in sz]
    brute_tests = 0
    bbox_hits = 0
    in_one = in_none = in_many = 0
    true_hits = 0
    brute_matches = []
    for e in ex:
        hits = [i for i, s in enumerate(sz) if inside(e[0], e[1], s["polys"])]
        brute_tests += len(sz)
        brute_matches.append(hits)
        true_hits += len(hits)
        bbox_hits += sum(1 for b in boxes if b[0] <= e[0] <= b[2] and b[1] <= e[1] <= b[3])
        if len(hits) == 1:
            in_one += 1
        elif len(hits) == 0:
            in_none += 1
        else:
            in_many += 1
    # grid index over polygon bboxes in projected metres; exits looked up by their own cell
    pgrid_min = None
    boxes_m = []
    for s in sz:
        pts = [svy21(*lonlat(r[i], r[i + 1])) for rings in s["polys"] for r in rings for i in range(0, len(r), 2)]
        boxes_m.append((min(p[0] for p in pts), min(p[1] for p in pts), max(p[0] for p in pts), max(p[1] for p in pts)))
    minx = min(b[0] for b in boxes_m)
    miny = min(b[1] for b in boxes_m)
    pcells = {}
    for i, b in enumerate(boxes_m):
        for ix in range(math.floor((b[0] - minx) / CELL), math.floor((b[2] - minx) / CELL) + 1):
            for iy in range(math.floor((b[1] - miny) / CELL), math.floor((b[3] - miny) / CELL) + 1):
                pcells.setdefault((ix, iy), []).append(i)
    grid_tests = 0
    grid_same = True
    for k, e in enumerate(ex):
        em = exits_m[k]
        cand = pcells.get((math.floor((em[0] - minx) / CELL), math.floor((em[1] - miny) / CELL)), [])
        grid_tests += len(cand)
        hits = [i for i in cand if inside(e[0], e[1], sz[i]["polys"])]
        if hits != brute_matches[k]:
            grid_same = False

    # anti-lever: the same points translated to 60 deg N, raw degrees against haversine
    def shifted(pts):
        return [(p[0], p[1] + SHIFT) for p in pts]
    c60, e60 = shifted(cents), shifted(exits)
    raw60 = nearest_brute(c60, e60, lambda c, e: rawdeg(c[0], c[1], e[0], e[1]))
    hav60 = nearest_brute(c60, e60, lambda c, e: haversine(c[0], c[1], e[0], e[1]))

    def pair(rows, base):
        errs = [r[1] - f[1] for r, f in zip(rows, base)]
        return {"meanAbsErr": sum(abs(x) for x in errs) / len(errs), "maxAbsErr": max(abs(x) for x in errs),
                "meanErr": sum(errs) / len(errs), "nearestChanged": sum(1 for r, f in zip(rows, base) if r[0] != f[0]),
                "medianRaw": median([r[1] for r in rows]), "medianHav": median([f[1] for f in base])}
    anti = {"lat1": pair(raw, hav), "lat60": pair(raw60, hav60),
            "cosLat1": math.cos(rad(LAT0_DEG)), "cosLat60": math.cos(rad(60.0)), "shiftDeg": SHIFT}

    # break button: swap latitude and longitude on the exits
    swapped_q = [(e[1] - 102 * int(QUANT), e[0] + 102 * int(QUANT)) for e in ex]   # exact integer swap
    swapped = [(e[1], e[0]) for e in exits]
    near_km = [min(haversine(c[0], c[1], s[0], s[1]) for s in swapped) / 1000 for c in cents]
    zero = sum(1 for s in sz if not any(inside(q[0], q[1], s["polys"]) for q in swapped_q))
    brk = {"maxLat": max(s[1] for s in swapped), "zeroMatchSubzones": zero, "medianNearestKm": median(near_km)}

    # dengue clusters joined to subzones and planning areas, cases per 100,000 residents (Census 2020)
    deng = []
    pa_cases = {}
    for cl in sample["clusters"]:
        rc = ring_centroid(cl["ring"])
        hit = next((s for s in sz if inside(rc[1], rc[2], s["polys"])), None)
        deng.append({"loc": cl["loc"], "cases": cl["cases"], "subzone": hit["n"] if hit else None,
                     "pa": hit["pa"] if hit else None,
                     "szPop": sample["pop"]["sz"].get(hit["n"]) if hit else None})
        if hit:
            pa_cases[hit["pa"]] = pa_cases.get(hit["pa"], 0) + (cl["cases"] or 0)
    rates = []
    for pa in sorted(pa_cases):
        pop = sample["pop"]["pa"].get(pa)
        rates.append({"pa": pa, "cases": pa_cases[pa], "pop": pop,
                      "per100k": (pa_cases[pa] / pop * 100000) if pop else None})

    o = svy21(LON0_DEG, LAT0_DEG)
    return {
        "meta": {"subzones": len(sz), "exits": len(ex), "clusters": len(sample["clusters"]),
                 "vertices": sum(len(r) // 2 for s in sz for rings in s["polys"] for r in rings),
                 "pairs": len(sz) * len(ex), "radiusM": RADIUS, "cellM": CELL, "downloaded": sample["downloaded"]},
        "svy21Origin": [o[0], o[1]],
        "rungs": {"raw": rung_summary(raw, ref), "haversine": rung_summary(hav, ref),
                  "projected": rung_summary(ref, ref), "bbox": rung_summary(bb, ref), "grid": rung_summary(gr, ref)},
        "pip": {"bruteTests": brute_tests, "inOne": in_one, "inNone": in_none, "inMany": in_many,
                "bboxHits": bbox_hits, "bboxFalseHits": bbox_hits - true_hits, "bboxThenExactTests": bbox_hits,
                "gridTests": grid_tests, "gridSameAnswers": grid_same},
        "anti": anti,
        "break": brk,
        "dengue": deng,
        "paRates": rates,
    }


def load(repo: Path):
    js = (repo / "assets" / "geo-sample.js").read_text(encoding="utf-8")
    return json.loads(js[js.index("{"): js.rindex("}") + 1])


if __name__ == "__main__":
    repo = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    print(json.dumps(canon(load(repo)), indent=1))
