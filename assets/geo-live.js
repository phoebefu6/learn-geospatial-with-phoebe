/* geo-live.js - the distance-and-join bench for learn-geospatial-with-phoebe
 *
 * Real Singapore open data (data.gov.sg, Singapore Open Data Licence v1.0): 332 URA Master Plan 2019
 * subzones (simplified, quantised), 613 LTA MRT station exits, the NEA dengue clusters of the download
 * date and SingStat Census 2020 resident population. geo-sample.js carries the geometry; everything
 * below is COMPUTED here, in the browser, from it. Nothing on this widget is modelled or simulated;
 * the anti-lever translates the same points to 60 deg N (a constructed position, said so on the widget)
 * and the break button swaps latitude and longitude on the exits.
 *
 * Ladder (nearest MRT exit per subzone centroid, and exits within 500 m):
 *   raw        flat Euclidean on raw degrees, one naive constant 111,320 m per degree on both axes
 *   haversine  great-circle on a sphere, R = 6,371,008.8 m
 *   projected  SVY21 / EPSG:3414 transverse Mercator forward (Snyder series), metres. THE REFERENCE
 *   bbox       projected + a bounding-box prefilter before the distance formula (catchment query)
 *   grid       projected + a 500 m grid-cell index (nearest and catchment queries)
 * Point in polygon: exits against subzones by the even-odd ray-casting rule; brute force, bbox shortcut,
 * grid index. The Python reference (materials/geo_reference.py) runs the same steps in the same order.
 */
(function (root) {
  "use strict";

  var QUANT = 100000, OLON = 103, OLAT = 1;
  var P = { A: 6378137.0, F: 1 / 298.257223563, K0: 1.0, LAT0: 1 + 22 / 60, LON0: 103 + 50 / 60,
            FE: 28001.642, FN: 38744.572, R: 6371008.8, DEG_M: 111320.0, RADIUS: 500.0, CELL: 500.0 };
  var SHIFT = 60 - P.LAT0;
  var RAD = Math.PI / 180;
  function rad(d) { return d * RAD; }
  function lonlat(x, y) { return [OLON + x / QUANT, OLAT + y / QUANT]; }

  /* ---------- three distances ---------- */
  function consts() {
    var e2 = 2 * P.F - P.F * P.F, e4 = e2 * e2, e6 = e4 * e2;
    return { e2: e2, e4: e4, e6: e6, ep2: e2 / (1 - e2) };
  }
  function merid(phi, k) {
    return P.A * ((1 - k.e2 / 4 - 3 * k.e4 / 64 - 5 * k.e6 / 256) * phi
      - (3 * k.e2 / 8 + 3 * k.e4 / 32 + 45 * k.e6 / 1024) * Math.sin(2 * phi)
      + (15 * k.e4 / 256 + 45 * k.e6 / 1024) * Math.sin(4 * phi)
      - (35 * k.e6 / 3072) * Math.sin(6 * phi));
  }
  function svy21(lon, lat) {
    var k = consts(), m0 = merid(rad(P.LAT0), k), lon0 = rad(P.LON0);
    var phi = rad(lat), lam = rad(lon);
    var s = Math.sin(phi), c = Math.cos(phi), t = Math.tan(phi);
    var n = P.A / Math.sqrt(1 - k.e2 * s * s);
    var tt = t * t, cc = k.ep2 * c * c;
    var a1 = (lam - lon0) * c, a2 = a1 * a1, a3 = a2 * a1, a4 = a3 * a1, a5 = a4 * a1, a6 = a5 * a1;
    var m = merid(phi, k);
    var x = P.K0 * n * (a1 + (1 - tt + cc) * a3 / 6 + (5 - 18 * tt + tt * tt + 72 * cc - 58 * k.ep2) * a5 / 120);
    var y = P.K0 * (m - m0 + n * t * (a2 / 2 + (5 - tt + 9 * cc + 4 * cc * cc) * a4 / 24
      + (61 - 58 * tt + tt * tt + 600 * cc - 330 * k.ep2) * a6 / 720));
    return [P.FE + x, P.FN + y];
  }
  function haversine(lon1, lat1, lon2, lat2) {
    var p1 = rad(lat1), p2 = rad(lat2);
    var sdp = Math.sin((p2 - p1) / 2), sdl = Math.sin(rad(lon2 - lon1) / 2);
    var a = sdp * sdp + Math.cos(p1) * Math.cos(p2) * sdl * sdl;
    return 2 * P.R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  function rawdeg(lon1, lat1, lon2, lat2) {
    var dx = lon2 - lon1, dy = lat2 - lat1;
    return P.DEG_M * Math.sqrt(dx * dx + dy * dy);
  }
  function euclid(e1, n1, e2, n2) {
    var dx = e2 - e1, dy = n2 - n1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /* ---------- polygons ---------- */
  function ringCentroid(r) {
    var n = r.length >> 1, x0 = r[0], y0 = r[1], a = 0, cx = 0, cy = 0, i, j, x1, y1, x2, y2, cr;
    for (i = 0; i < n; i++) {
      j = (i + 1) % n;
      x1 = r[2 * i] - x0; y1 = r[2 * i + 1] - y0; x2 = r[2 * j] - x0; y2 = r[2 * j + 1] - y0;
      cr = x1 * y2 - x2 * y1;
      a += cr; cx += (x1 + x2) * cr; cy += (y1 + y2) * cr;
    }
    if (a === 0) return null;
    return [Math.abs(a) / 2, x0 + cx / (3 * a), y0 + cy / (3 * a)];
  }
  function polyCentroid(polys) {
    var w = 0, xs = 0, ys = 0;
    polys.forEach(function (rings) {
      rings.forEach(function (r, k) {
        var rc = ringCentroid(r);
        if (!rc) return;
        var wt = k === 0 ? rc[0] : -rc[0];
        w += wt; xs += wt * rc[1]; ys += wt * rc[2];
      });
    });
    return [xs / w, ys / w];
  }
  function bbox(polys) {
    var b = [Infinity, Infinity, -Infinity, -Infinity];
    polys.forEach(function (rings) { rings.forEach(function (r) {
      for (var i = 0; i < r.length; i += 2) {
        if (r[i] < b[0]) b[0] = r[i]; if (r[i] > b[2]) b[2] = r[i];
        if (r[i + 1] < b[1]) b[1] = r[i + 1]; if (r[i + 1] > b[3]) b[3] = r[i + 1];
      }
    }); });
    return b;
  }
  /* even-odd rule (the SVG "evenodd" fill rule): a ray to +x, count crossings of every ring */
  function inside(px, py, polys) {
    var c = false;
    for (var p = 0; p < polys.length; p++) {
      var rings = polys[p];
      for (var q = 0; q < rings.length; q++) {
        var r = rings[q], n = r.length >> 1, j = n - 1;
        for (var i = 0; i < n; i++) {
          var xi = r[2 * i], yi = r[2 * i + 1], xj = r[2 * j], yj = r[2 * j + 1];
          if ((yi > py) !== (yj > py)) {
            var xint = xi + (py - yi) * (xj - xi) / (yj - yi);
            if (px < xint) c = !c;
          }
          j = i;
        }
      }
    }
    return c;
  }
  function median(xs) {
    var s = xs.slice().sort(function (a, b) { return a - b; }), n = s.length;
    return n % 2 ? s[n >> 1] : (s[(n >> 1) - 1] + s[n >> 1]) / 2;
  }

  /* ---------- the ladder ---------- */
  function nearestBrute(cents, exits, dist) {
    return cents.map(function (c) {
      var best = Infinity, bi = -1, cnt = 0;
      for (var k = 0; k < exits.length; k++) {
        var d = dist(c, exits[k]);
        if (d < best) { best = d; bi = k; }
        if (d <= P.RADIUS) cnt++;
      }
      return [bi, best, cnt, exits.length];
    });
  }
  function rungSummary(rows, ref) {
    var errs = rows.map(function (r, i) { return r[1] - ref[i][1]; }), n = rows.length;
    var sum = function (xs) { return xs.reduce(function (a, b) { return a + b; }, 0); };
    return {
      medianNearest: median(rows.map(function (r) { return r[1]; })),
      meanNearest: sum(rows.map(function (r) { return r[1]; })) / n,
      meanErr: sum(errs) / n,
      meanAbsErr: sum(errs.map(Math.abs)) / n,
      maxAbsErr: Math.max.apply(null, errs.map(Math.abs)),
      nearestChanged: rows.filter(function (r, i) { return r[0] !== ref[i][0]; }).length,
      catchTotal: sum(rows.map(function (r) { return r[2]; })),
      catchDiffers: rows.filter(function (r, i) { return r[2] !== ref[i][2]; }).length,
      distanceEvals: sum(rows.map(function (r) { return r[3]; }))
    };
  }
  function Grid(pts) {
    this.pts = pts; this.cells = {}; this.nx = 0; this.ny = 0;
    this.minx = Infinity; this.miny = Infinity;
    for (var i = 0; i < pts.length; i++) { if (pts[i][0] < this.minx) this.minx = pts[i][0]; if (pts[i][1] < this.miny) this.miny = pts[i][1]; }
    for (var k = 0; k < pts.length; k++) {
      var c = this.cell(pts[k][0], pts[k][1]), key = c[0] + "," + c[1];
      (this.cells[key] = this.cells[key] || []).push(k);
      if (c[0] + 1 > this.nx) this.nx = c[0] + 1;
      if (c[1] + 1 > this.ny) this.ny = c[1] + 1;
    }
  }
  Grid.prototype.cell = function (x, y) { return [Math.floor((x - this.minx) / P.CELL), Math.floor((y - this.miny) / P.CELL)]; };
  Grid.prototype.nearest = function (q) {
    var qc = this.cell(q[0], q[1]), qx = qc[0], qy = qc[1], best = Infinity, bi = -1, evals = 0;
    var kmax = Math.max(Math.abs(qx) + this.nx, Math.abs(qy) + this.ny) + 1;
    for (var k = 0; ; k++) {
      for (var ix = qx - k; ix <= qx + k; ix++) for (var iy = qy - k; iy <= qy + k; iy++) {
        if (Math.max(Math.abs(ix - qx), Math.abs(iy - qy)) !== k) continue;
        var cell = this.cells[ix + "," + iy]; if (!cell) continue;
        for (var m = 0; m < cell.length; m++) {
          var j = cell[m], d = euclid(q[0], q[1], this.pts[j][0], this.pts[j][1]); evals++;
          if (d < best) { best = d; bi = j; }
        }
      }
      if ((bi >= 0 && best <= k * P.CELL) || k > kmax) return [bi, best, evals];
    }
  };
  Grid.prototype.within = function (q) {
    var lo = this.cell(q[0] - P.RADIUS, q[1] - P.RADIUS), hi = this.cell(q[0] + P.RADIUS, q[1] + P.RADIUS), cnt = 0, evals = 0;
    for (var ix = lo[0]; ix <= hi[0]; ix++) for (var iy = lo[1]; iy <= hi[1]; iy++) {
      var cell = this.cells[ix + "," + iy]; if (!cell) continue;
      for (var m = 0; m < cell.length; m++) {
        var j = cell[m], d = euclid(q[0], q[1], this.pts[j][0], this.pts[j][1]); evals++;
        if (d <= P.RADIUS) cnt++;
      }
    }
    return [cnt, evals];
  };

  function prepare(sample) {
    var sz = sample.subzones, ex = sample.exits;
    var centsQ = sz.map(function (s) { return polyCentroid(s.polys); });
    var cents = centsQ.map(function (c) { return lonlat(c[0], c[1]); });
    var exits = ex.map(function (e) { return lonlat(e[0], e[1]); });
    return { sz: sz, ex: ex, centsQ: centsQ, cents: cents, exits: exits,
             centsM: cents.map(function (c) { return svy21(c[0], c[1]); }),
             exitsM: exits.map(function (e) { return svy21(e[0], e[1]); }),
             boxes: sz.map(function (s) { return bbox(s.polys); }) };
  }
  var DIST = {
    raw: function (c, e) { return rawdeg(c[0], c[1], e[0], e[1]); },
    haversine: function (c, e) { return haversine(c[0], c[1], e[0], e[1]); },
    projected: function (c, e) { return euclid(c[0], c[1], e[0], e[1]); }
  };
  function ladder(D) {
    var ref = nearestBrute(D.centsM, D.exitsM, DIST.projected);
    var raw = nearestBrute(D.cents, D.exits, DIST.raw);
    var hav = nearestBrute(D.cents, D.exits, DIST.haversine);
    var bb = D.centsM.map(function (c, i) {
      var cnt = 0, evals = 0;
      D.exitsM.forEach(function (e) {
        if (Math.abs(e[0] - c[0]) <= P.RADIUS && Math.abs(e[1] - c[1]) <= P.RADIUS) {
          evals++; if (euclid(c[0], c[1], e[0], e[1]) <= P.RADIUS) cnt++;
        }
      });
      return [ref[i][0], ref[i][1], cnt, evals];
    });
    var grid = new Grid(D.exitsM);
    var gr = D.centsM.map(function (c) {
      var nn = grid.nearest(c), w = grid.within(c);
      return [nn[0], nn[1], w[0], nn[2] + w[1]];
    });
    return { raw: raw, haversine: hav, projected: ref, bbox: bb, grid: gr };
  }
  function pip(D) {
    var sz = D.sz, ex = D.ex, bruteTests = 0, bboxHits = 0, inOne = 0, inNone = 0, inMany = 0, trueHits = 0, matches = [];
    ex.forEach(function (e) {
      var hits = [];
      sz.forEach(function (s, i) { if (inside(e[0], e[1], s.polys)) hits.push(i); });
      bruteTests += sz.length; matches.push(hits); trueHits += hits.length;
      D.boxes.forEach(function (b) { if (b[0] <= e[0] && e[0] <= b[2] && b[1] <= e[1] && e[1] <= b[3]) bboxHits++; });
      if (hits.length === 1) inOne++; else if (hits.length === 0) inNone++; else inMany++;
    });
    var boxesM = sz.map(function (s) {
      var b = [Infinity, Infinity, -Infinity, -Infinity];
      s.polys.forEach(function (rings) { rings.forEach(function (r) {
        for (var i = 0; i < r.length; i += 2) {
          var ll = lonlat(r[i], r[i + 1]), m = svy21(ll[0], ll[1]);
          if (m[0] < b[0]) b[0] = m[0]; if (m[0] > b[2]) b[2] = m[0]; if (m[1] < b[1]) b[1] = m[1]; if (m[1] > b[3]) b[3] = m[1];
        }
      }); });
      return b;
    });
    var minx = Math.min.apply(null, boxesM.map(function (b) { return b[0]; })), miny = Math.min.apply(null, boxesM.map(function (b) { return b[1]; }));
    var pcells = {};
    boxesM.forEach(function (b, i) {
      for (var ix = Math.floor((b[0] - minx) / P.CELL); ix <= Math.floor((b[2] - minx) / P.CELL); ix++)
        for (var iy = Math.floor((b[1] - miny) / P.CELL); iy <= Math.floor((b[3] - miny) / P.CELL); iy++)
          (pcells[ix + "," + iy] = pcells[ix + "," + iy] || []).push(i);
    });
    var gridTests = 0, gridSame = true;
    ex.forEach(function (e, k) {
      var em = D.exitsM[k], cand = pcells[Math.floor((em[0] - minx) / P.CELL) + "," + Math.floor((em[1] - miny) / P.CELL)] || [];
      gridTests += cand.length;
      var hits = cand.filter(function (i) { return inside(e[0], e[1], sz[i].polys); });
      if (hits.join() !== matches[k].join()) gridSame = false;
    });
    return { bruteTests: bruteTests, inOne: inOne, inNone: inNone, inMany: inMany, bboxHits: bboxHits,
             bboxFalseHits: bboxHits - trueHits, bboxThenExactTests: bboxHits, gridTests: gridTests, gridSameAnswers: gridSame,
             matches: matches };
  }
  function pairStats(rows, base) {
    var errs = rows.map(function (r, i) { return r[1] - base[i][1]; }), n = errs.length;
    var sum = function (xs) { return xs.reduce(function (a, b) { return a + b; }, 0); };
    return { meanAbsErr: sum(errs.map(Math.abs)) / n, maxAbsErr: Math.max.apply(null, errs.map(Math.abs)), meanErr: sum(errs) / n,
             nearestChanged: rows.filter(function (r, i) { return r[0] !== base[i][0]; }).length,
             medianRaw: median(rows.map(function (r) { return r[1]; })), medianHav: median(base.map(function (r) { return r[1]; })) };
  }
  function anti(D, L) {
    var sh = function (pts) { return pts.map(function (p) { return [p[0], p[1] + SHIFT]; }); };
    var c60 = sh(D.cents), e60 = sh(D.exits);
    var raw60 = nearestBrute(c60, e60, DIST.raw), hav60 = nearestBrute(c60, e60, DIST.haversine);
    return { lat1: pairStats(L.raw, L.haversine), lat60: pairStats(raw60, hav60),
             cosLat1: Math.cos(rad(P.LAT0)), cosLat60: Math.cos(rad(60)), shiftDeg: SHIFT, rows60: raw60, hav60: hav60 };
  }
  function breakSwap(D) {
    var swappedQ = D.ex.map(function (e) { return [e[1] - 102 * QUANT, e[0] + 102 * QUANT]; });
    var swapped = D.exits.map(function (e) { return [e[1], e[0]]; });
    var nearKm = D.cents.map(function (c) {
      var best = Infinity;
      swapped.forEach(function (s) { var d = haversine(c[0], c[1], s[0], s[1]); if (d < best) best = d; });
      return best / 1000;
    });
    var zero = D.sz.filter(function (s) { return !swappedQ.some(function (q) { return inside(q[0], q[1], s.polys); }); }).length;
    return { maxLat: Math.max.apply(null, swapped.map(function (s) { return s[1]; })), zeroMatchSubzones: zero, medianNearestKm: median(nearKm) };
  }
  function dengue(sample, D) {
    var deng = [], paCases = {};
    sample.clusters.forEach(function (cl) {
      var rc = ringCentroid(cl.ring), hit = null;
      for (var i = 0; i < D.sz.length && !hit; i++) if (inside(rc[1], rc[2], D.sz[i].polys)) hit = D.sz[i];
      deng.push({ loc: cl.loc, cases: cl.cases, subzone: hit ? hit.n : null, pa: hit ? hit.pa : null,
                  szPop: hit ? (sample.pop.sz[hit.n] === undefined ? null : sample.pop.sz[hit.n]) : null });
      if (hit) paCases[hit.pa] = (paCases[hit.pa] || 0) + (cl.cases || 0);
    });
    var rates = Object.keys(paCases).sort().map(function (pa) {
      var pop = sample.pop.pa[pa] === undefined ? null : sample.pop.pa[pa];
      return { pa: pa, cases: paCases[pa], pop: pop, per100k: pop ? paCases[pa] / pop * 100000 : null };
    });
    return { dengue: deng, paRates: rates };
  }

  /* the full canon, in the same shape the Python reference prints */
  function canon(sample) {
    var D = prepare(sample), L = ladder(D), PP = pip(D), AN = anti(D, L), DG = dengue(sample, D);
    var o = svy21(P.LON0, P.LAT0);
    var vertices = 0; D.sz.forEach(function (s) { s.polys.forEach(function (rings) { rings.forEach(function (r) { vertices += r.length >> 1; }); }); });
    return {
      meta: { subzones: D.sz.length, exits: D.ex.length, clusters: sample.clusters.length, vertices: vertices,
              pairs: D.sz.length * D.ex.length, radiusM: P.RADIUS, cellM: P.CELL, downloaded: sample.downloaded },
      svy21Origin: [o[0], o[1]],
      rungs: { raw: rungSummary(L.raw, L.projected), haversine: rungSummary(L.haversine, L.projected),
               projected: rungSummary(L.projected, L.projected), bbox: rungSummary(L.bbox, L.projected), grid: rungSummary(L.grid, L.projected) },
      pip: { bruteTests: PP.bruteTests, inOne: PP.inOne, inNone: PP.inNone, inMany: PP.inMany, bboxHits: PP.bboxHits,
             bboxFalseHits: PP.bboxFalseHits, bboxThenExactTests: PP.bboxThenExactTests, gridTests: PP.gridTests, gridSameAnswers: PP.gridSameAnswers },
      anti: { lat1: AN.lat1, lat60: AN.lat60, cosLat1: AN.cosLat1, cosLat60: AN.cosLat60, shiftDeg: AN.shiftDeg },
      "break": breakSwap(D),
      dengue: DG.dengue,
      paRates: DG.paRates
    };
  }

  /* self-test: properties that FAIL on a planted fault (a wrong false easting, a wrong radius, a broken ray cast) */
  function selfTest() {
    var fails = [];
    var o = svy21(P.LON0, P.LAT0);
    if (Math.abs(o[0] - 28001.642) > 1e-6 || Math.abs(o[1] - 38744.572) > 1e-6) fails.push("SVY21 origin is not (28001.642, 38744.572): " + o);
    var anti = haversine(0, 0, 180, 0);
    if (Math.abs(anti - Math.PI * 6371008.8) > 1e-3) fails.push("haversine antipode is not pi R: " + anti);
    if (Math.abs(rawdeg(0, 0, 1, 0) - 111320) > 1e-9) fails.push("raw degree constant is not 111,320 m");
    var notch = [[[0, 0, 10, 0, 10, 10, 6, 10, 6, 4, 4, 4, 4, 10, 0, 10]]];  /* a square with a notch cut from the top */
    if (!inside(2, 2, notch) || inside(5, 8, notch) || inside(12, 5, notch) || !inside(8, 8, notch)) fails.push("ray casting wrong on the notched square");
    var hole = [[[0, 0, 10, 0, 10, 10, 0, 10], [3, 3, 7, 3, 7, 7, 3, 7]]];
    if (inside(5, 5, hole) || !inside(1, 1, hole)) fails.push("even-odd rule does not exclude the hole");
    return fails;
  }

  /* ---------- widget ---------- */
  var RUNGS = [
    ["raw", "1 · Raw degrees", "flat Euclidean on raw degrees, both axes times 111,320 m per degree: one constant, no latitude anywhere"],
    ["haversine", "2 · Haversine", "great-circle distance on a sphere of radius 6,371,008.8 m: the latitude is in the formula, the ellipsoid is not"],
    ["projected", "3 · Projected metres", "SVY21 / EPSG:3414 transverse Mercator forward on the WGS 84 ellipsoid, then plain Euclidean metres: the reference the other rungs are scored against"],
    ["bbox", "4 · + bbox prefilter", "projected metres, but the catchment query only runs the distance formula when the exit is inside a 500 m square around the centroid"],
    ["grid", "5 · + grid index", "projected metres, exits bucketed into 500 m cells; the nearest query scans outward ring by ring and the catchment query reads at most the 3 by 3 cells around the centroid"]
  ];
  var state = { rung: "raw", sz: 0, anti: false, brk: false };
  var rootEl, D, L, C, els = {};

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
  function fm(x, d) { return Number(x).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function fi(x) { return Number(x).toLocaleString("en-US"); }

  function buildUI() {
    var top = el("div", "geo-top");
    var rungs = el("div", "geo-rungs");
    RUNGS.forEach(function (r) {
      var b = el("button", "geo-rung" + (r[0] === "projected" ? " is-ref" : ""), r[1]); b.type = "button"; b.setAttribute("data-rung", r[0]);
      b.addEventListener("click", function () { state.rung = r[0]; render(); });
      rungs.appendChild(b);
    });
    top.appendChild(rungs);
    rootEl.appendChild(top);
    els.rule = el("p", "geo-rule"); rootEl.appendChild(els.rule);
    els.verdict = el("p", "mb-verdict"); rootEl.appendChild(els.verdict);
    els.metrics = el("div", "mb-metrics"); rootEl.appendChild(els.metrics);

    var grid = el("div", "ab-grid");
    var c1 = el("div", "ab-card", '<h4>Nearest exit for one subzone <span class="mb-mkind is-measured">computed</span></h4>');
    var pick = el("div", "geo-pick"); pick.appendChild(el("span", "", "Subzone"));
    var sel = document.createElement("select"); sel.id = "geo-subzone";
    D.sz.forEach(function (s, i) { var o = document.createElement("option"); o.value = String(i); o.textContent = s.n + " (" + s.pa + ")"; if (i === state.sz) o.setAttribute("selected", ""); sel.appendChild(o); });
    sel.addEventListener("change", function () { state.sz = parseInt(sel.value, 10); render(); });
    pick.appendChild(sel); c1.appendChild(pick);
    els.one = el("div", "geo-out"); c1.appendChild(els.one);
    var c2 = el("div", "ab-card", '<h4>Exits joined to subzones (point in polygon) <span class="mb-mkind is-measured">computed</span></h4>');
    els.pip = el("div", "dt-tablewrap"); c2.appendChild(els.pip);
    grid.appendChild(c1); grid.appendChild(c2); rootEl.appendChild(grid);

    var c3 = el("div", "ab-card", '<h4>The map, in SVY21 metres <span class="mb-mkind is-measured">332 subzones, 613 exits</span></h4>');
    els.map = el("div", "geo-map"); c3.appendChild(els.map); rootEl.appendChild(c3);

    var c4 = el("div", "ab-card", "<h4>Two ways to break it</h4>");
    var row = el("div", "geo-top");
    els.antiBtn = el("button", "geo-btn is-anti", "Anti-lever: measure in raw degrees at 60 deg N"); els.antiBtn.type = "button";
    els.antiBtn.addEventListener("click", function () { state.anti = !state.anti; render(); });
    els.brkBtn = el("button", "geo-btn is-break", "Break button: swap latitude and longitude"); els.brkBtn.type = "button";
    els.brkBtn.addEventListener("click", function () { state.brk = !state.brk; render(); });
    row.appendChild(els.antiBtn); row.appendChild(els.brkBtn); c4.appendChild(row);
    els.anti = el("div", "geo-out is-anti"); els.brk = el("div", "geo-out is-break");
    c4.appendChild(els.anti); c4.appendChild(els.brk); rootEl.appendChild(c4);

    var st = selfTest();
    els.self = el("p", "geo-self" + (st.length ? " is-bad" : ""),
      st.length ? "Self-test FAILED: " + st.join("; ") : "Self-test passed on load: SVY21 origin lands on (28001.642, 38744.572); haversine antipode is pi R; ray casting is right on a notched square and a square with a hole.");
    rootEl.appendChild(els.self);
    var lic = el("p", "geo-licence");
    lic.innerHTML = C.sample.notices.map(function (n) { return n.replace(C.sample.licence, '<a href="' + C.sample.licence + '">' + C.sample.licence + "</a>"); }).join("<br>")
      + "<br>Geometry simplified at " + C.sample.tolDeg + " degrees (about " + Math.round(C.sample.tolDeg * 111320) + " m) and quantised to 0.00001 degrees for the page; every number above is computed in this browser from the shipped geometry. Dengue clusters are the snapshot of " + C.sample.downloaded + "; clusters change daily.";
    rootEl.appendChild(lic);
  }

  function metric(label, value, unit, kind) {
    var m = el("div", "mb-metric");
    m.appendChild(el("div", "mb-mlabel", label));
    m.appendChild(el("div", "mb-mvalue", value));
    m.appendChild(el("div", "mb-munit", unit + ' <span class="mb-mkind ' + (kind === "ref" ? "is-heuristic" : "is-measured") + '">' + (kind === "ref" ? "reference" : "computed") + "</span>"));
    return m;
  }

  function drawMap() {
    var W = 880, pad = 16, pts = [], i;
    D.sz.forEach(function (s) { s.polys.forEach(function (rings) { rings.forEach(function (r) {
      for (i = 0; i < r.length; i += 2) { var ll = lonlat(r[i], r[i + 1]); pts.push(svy21(ll[0], ll[1])); }
    }); }); });
    var minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
    pts.forEach(function (p) { if (p[0] < minx) minx = p[0]; if (p[0] > maxx) maxx = p[0]; if (p[1] < miny) miny = p[1]; if (p[1] > maxy) maxy = p[1]; });
    var sc = (W - 2 * pad) / (maxx - minx), H = Math.round((maxy - miny) * sc + 2 * pad + 22);
    var X = function (e) { return pad + (e - minx) * sc; }, Y = function (n) { return pad + (maxy - n) * sc; };
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Singapore drawn from 332 URA subzone polygons in SVY21 metres, 613 MRT exits as dots, the chosen subzone highlighted with its centroid and a dashed line to the nearest exit under the current rung.">';
    var sel = state.sz, selPath = "";
    D.sz.forEach(function (s, k) {
      var d = "";
      s.polys.forEach(function (rings) { rings.forEach(function (r) {
        for (i = 0; i < r.length; i += 2) { var ll = lonlat(r[i], r[i + 1]), m = svy21(ll[0], ll[1]); d += (i ? "L" : "M") + X(m[0]).toFixed(1) + " " + Y(m[1]).toFixed(1); }
        d += "Z";
      }); });
      if (k === sel) selPath = d; else svg += '<path class="geo-sz" fill-rule="evenodd" d="' + d + '"/>';
    });
    svg += '<path class="geo-sz is-sel" fill-rule="evenodd" d="' + selPath + '"/>';
    D.exitsM.forEach(function (e) { svg += '<circle class="geo-exit" cx="' + X(e[0]).toFixed(1) + '" cy="' + Y(e[1]).toFixed(1) + '" r="1.6"/>'; });
    var c = D.centsM[sel], row = currentRows()[sel], ne = D.exitsM[row[0]];
    svg += '<circle class="geo-ring" cx="' + X(c[0]).toFixed(1) + '" cy="' + Y(c[1]).toFixed(1) + '" r="' + (P.RADIUS * sc).toFixed(1) + '"/>';
    svg += '<path class="geo-near" d="M' + X(c[0]).toFixed(1) + " " + Y(c[1]).toFixed(1) + " L" + X(ne[0]).toFixed(1) + " " + Y(ne[1]).toFixed(1) + '"/>';
    svg += '<circle class="geo-cent" cx="' + X(c[0]).toFixed(1) + '" cy="' + Y(c[1]).toFixed(1) + '" r="4"/>';
    svg += '<text class="geo-maplab" x="' + pad + '" y="' + (H - 6) + '">Easting ' + fi(Math.round(minx)) + " to " + fi(Math.round(maxx)) + " m, northing " + fi(Math.round(miny)) + " to " + fi(Math.round(maxy)) + " m (EPSG:3414). Dashed circle: the 500 m catchment.</text>";
    svg += "</svg>";
    els.map.innerHTML = svg;
  }

  function currentRows() { return L[state.rung]; }

  function render() {
    var r = state.rung, rows = currentRows(), ref = L.projected, S = rungSummary(rows, ref);
    rootEl.querySelectorAll(".geo-rung").forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-rung") === r); });
    var def = RUNGS.filter(function (x) { return x[0] === r; })[0];
    els.rule.innerHTML = "<b>Rule on this rung:</b> " + def[2] + ".";
    var isRef = r === "projected" || r === "bbox" || r === "grid";
    els.verdict.className = "mb-verdict " + (isRef ? "is-good" : (S.maxAbsErr < 10 ? "is-ok" : "is-bad"));
    els.verdict.textContent = isRef
      ? (r === "projected" ? "Reference rung: every other rung is scored against these metres. Median nearest exit " + fm(S.medianNearest, 0) + " m across 332 centroids, " + fi(S.catchTotal) + " exits inside the 500 m catchments, " + fi(S.distanceEvals) + " distance evaluations (every pair)."
        : "Same answers as rung 3 (" + S.nearestChanged + " nearest changed, " + S.catchDiffers + " catchment counts changed), " + fi(S.distanceEvals) + " distance evaluations instead of " + fi(ref.length * D.ex.length) + ".")
      : "Against projected metres: mean error " + fm(S.meanErr, 2) + " m (" + (S.meanErr < 0 ? "short" : "long") + "), worst " + fm(S.maxAbsErr, 1) + " m, nearest exit differs for " + S.nearestChanged + " of 332 centroids, catchment count differs for " + S.catchDiffers + ".";
    els.metrics.innerHTML = "";
    els.metrics.appendChild(metric("Median nearest exit", fm(S.medianNearest, 0), "metres, 332 centroids", isRef ? "ref" : "run"));
    els.metrics.appendChild(metric("Mean error vs projected", (S.meanErr >= 0 ? "+" : "") + fm(S.meanErr, 2), "metres (sign shows bias)", "run"));
    els.metrics.appendChild(metric("Worst error vs projected", fm(S.maxAbsErr, 1), "metres", "run"));
    els.metrics.appendChild(metric("Nearest exit changed", S.nearestChanged + " / 332", "centroids", "run"));
    els.metrics.appendChild(metric("Exits within 500 m", fi(S.catchTotal), S.catchDiffers + " subzone counts differ", "run"));
    els.metrics.appendChild(metric("Distance evaluations", fi(S.distanceEvals), "of " + fi(D.sz.length * D.ex.length) + " pairs", "run"));

    var k = state.sz, row = rows[k], rr = ref[k], e = D.ex[row[0]], e2 = D.ex[rr[0]], c = D.cents[k];
    els.one.innerHTML = "<b>" + D.sz[k].n + "</b> (" + D.sz[k].pa + "). Centroid " + fm(c[1], 5) + " N, " + fm(c[0], 5) + " E; SVY21 " + fm(D.centsM[k][0], 1) + " E, " + fm(D.centsM[k][1], 1) + " N.<br>"
      + "This rung: nearest exit <b>" + e[2] + " " + e[3] + "</b> at <b>" + fm(row[1], 1) + " m</b>; " + row[2] + " exits within 500 m.<br>"
      + "Projected metres: nearest exit <b>" + e2[2] + " " + e2[3] + "</b> at <b>" + fm(rr[1], 1) + " m</b>; " + rr[2] + " within 500 m. "
      + (row[0] === rr[0] ? "Same exit." : "A different exit.") + " Resident population 2020: " + (C.sample.pop.sz[D.sz[k].n] === null ? "not published" : fi(C.sample.pop.sz[D.sz[k].n])) + ".";

    var PP = C.pip;
    els.pip.innerHTML = '<table class="clean"><tr><th>Method</th><th>Ray-casting tests</th><th>Result</th></tr>'
      + "<tr><td>Brute force: every exit against every subzone</td><td>" + fi(PP.bruteTests) + "</td><td>" + PP.inOne + " exits inside exactly one subzone, " + PP.inNone + " in none (outside every simplified boundary), " + PP.inMany + " in more than one</td></tr>"
      + "<tr><td>Bounding box only</td><td>0</td><td>" + fi(PP.bboxHits) + " box hits, of which " + fi(PP.bboxFalseHits) + " are false matches (the box contains the exit, the polygon does not)</td></tr>"
      + "<tr><td>Bounding box, then exact</td><td>" + fi(PP.bboxThenExactTests) + "</td><td>same answers as brute force</td></tr>"
      + "<tr><td>500 m grid index, then exact</td><td>" + fi(PP.gridTests) + "</td><td>" + (PP.gridSameAnswers ? "same answers as brute force" : "ANSWERS DIFFER") + "</td></tr></table>";

    els.antiBtn.classList.toggle("is-on", state.anti); els.brkBtn.classList.toggle("is-on", state.brk);
    var AN = C.anti;
    els.anti.style.display = state.anti ? "" : "none";
    els.anti.innerHTML = "<b>Same 332 centroids and 613 exits, translated north by " + fm(AN.shiftDeg, 4) + " degrees so the SVY21 origin sits at 60 deg N (a constructed position, nothing in Singapore moved).</b> Raw degrees against haversine: "
      + "at 1 deg 22' N the mean error is <b>" + fm(AN.lat1.meanAbsErr, 2) + " m</b> (worst " + fm(AN.lat1.maxAbsErr, 1) + " m, " + AN.lat1.nearestChanged + " nearest exits change); "
      + "at 60 deg N it is <b>" + fm(AN.lat60.meanAbsErr, 1) + " m</b> (worst " + fm(AN.lat60.maxAbsErr, 1) + " m, " + AN.lat60.nearestChanged + " nearest exits change). "
      + "The mechanism is one number: a degree of longitude is cos(latitude) times a degree of latitude, " + fm(AN.cosLat1, 4) + " here and " + fm(AN.cosLat60, 4) + " at 60 deg N, and raw degrees pretend it is 1.";
    var BK = C["break"];
    els.brk.style.display = state.brk ? "" : "none";
    els.brk.innerHTML = "<b>Latitude and longitude swapped on every exit.</b> The largest latitude is now " + fm(BK.maxLat, 3) + " degrees, which does not exist (90 is the pole): the swap is detectable before any distance is computed. "
      + "Joined anyway: <b>" + BK.zeroMatchSubzones + " of 332</b> subzones now contain zero exits, and the median nearest exit by haversine is <b>" + fi(Math.round(BK.medianNearestKm)) + " km</b> away.";
    drawMap();
  }

  function init() {
    rootEl = document.getElementById("geo-bench");
    if (!rootEl || !root.GEO_SAMPLE) return;
    var sample = root.GEO_SAMPLE;
    D = prepare(sample); L = ladder(D);
    C = { sample: sample, pip: pip(D), anti: anti(D, L), "break": breakSwap(D) };
    var def = rootEl.getAttribute("data-subzone");
    if (def !== null) D.sz.forEach(function (s, i) { if (s.n === def) state.sz = i; });
    var dr = rootEl.getAttribute("data-rung");
    if (dr !== null && L[dr]) state.rung = dr;
    buildUI();
    var sel = document.getElementById("geo-subzone"); if (sel) sel.value = String(state.sz);
    render();
    root.GEO_LIVE = { state: state, set: function (rung, sz) { if (rung) state.rung = rung; if (sz !== undefined) state.sz = sz; render(); }, canon: function () { return canon(sample); } };
  }

  var api = { P: P, svy21: svy21, haversine: haversine, rawdeg: rawdeg, euclid: euclid, inside: inside, polyCentroid: polyCentroid,
              ringCentroid: ringCentroid, bbox: bbox, Grid: Grid, prepare: prepare, ladder: ladder, pip: pip, canon: canon, selfTest: selfTest, median: median };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }
})(typeof window !== "undefined" ? window : this);
