"""Rebuilds the ZAN mark as clean vector geometry, measured from logo/zan_logo_square.png (512 x 512 px).

The source logo is a raster with a painted texture, so it blurs above 512 px. This script redraws it as geometry:

- four regions (top, right, bottom, left) bounded by the square and the X-shaped gap, each a rounded polygon;
- minus five cracks of one width (crack 2 curls up to the top edge; crack 5 turns round a tip and runs back up);
- the light-blue highlights and the orange tip as intersections with those regions.

Every number below is a measurement of the raster in its own pixels: lines fitted to each straight edge (sub-pixel),
corner radii fitted to each rounded corner. The rebuilt mark covers 98.9% of the original's area (intersection over
union), and every shard's area is within 2% of the original's.

It writes logo/tools/zan-mark.json in "mark units": the square maps to 0..100 on both axes. Three cuts:
- mark:  the full mark, for 56 px and up;
- glyph: cracks 2.3 times wider and no highlights, for about 30 to 56 px, and the notification icon;
- tiny:  no cracks, only the X-shaped gap, for under 30 px.

Run: python logo/tools/rebuild_mark.py   (needs numpy and shapely). Then node logo/tools/build-icons.mjs.
"""
import json
import math
import os
import sys

import numpy as np
from shapely.geometry import LineString, MultiPolygon, Point, Polygon
from shapely.ops import unary_union

TOL = 0.02  # max error when a curve is flattened into points, in source px
X0, Y0, X1, Y1 = 9.0, 15.0, 498.3, 499.8  # the mark's square in the raster
CRACK_W = 6.4
GLYPH_CRACK_W = 15.0


class Line:
    def __init__(self, p, ang):
        self.p = np.array(p, float)
        a = math.radians(ang)
        self.d = np.array([math.cos(a), math.sin(a)])
        self.ang = ang

    def offset(self, dist):
        """Positive = towards (-dy, dx): the right-hand side on a y-down screen."""
        n = np.array([-self.d[1], self.d[0]])
        return Line(self.p + dist * n, self.ang)

    def point(self, t):
        return self.p + t * self.d


def meet(l1, l2):
    A = np.array([l1.d, -l2.d]).T
    t, _ = np.linalg.solve(A, l2.p - l1.p)
    return l1.p + t * l1.d


def arc_points(center, r, a1, a2, tol=TOL):
    """Points from angle a1 to a2 (radians, signed sweep a2 - a1) on a circle."""
    da = a2 - a1
    step = 2 * math.acos(max(-1.0, 1 - tol / r)) if r > tol else math.pi
    n = max(2, int(math.ceil(abs(da) / step)))
    return [center + r * np.array([math.cos(a1 + da * k / n), math.sin(a1 + da * k / n)]) for k in range(n + 1)]


def rounded_polygon(verts, radii, name=""):
    """A polygon whose corner i is rounded with radius radii[i] (0 = sharp)."""
    V = [np.array(v, float) for v in verts]
    n = len(V)
    tl = []
    for i in range(n):
        prev, cur, nxt = V[i - 1], V[i], V[(i + 1) % n]
        a, b = prev - cur, nxt - cur
        a, b = a / np.linalg.norm(a), b / np.linalg.norm(b)
        ang = math.acos(float(np.clip(np.dot(a, b), -1, 1)))
        tl.append((a, b, ang, radii[i] / math.tan(ang / 2) if radii[i] > 0 else 0.0))
    for i in range(n):
        edge = np.linalg.norm(V[(i + 1) % n] - V[i])
        if tl[i][3] + tl[(i + 1) % n][3] > edge + 1e-6:
            print(f"WARN {name}: corners {i} and {(i + 1) % n} overlap on an edge of {edge:.1f}", file=sys.stderr)
    pts = []
    for i in range(n):
        a, b, ang, t = tl[i]
        cur, r = V[i], radii[i]
        if r <= 0:
            pts.append(cur)
            continue
        t1, t2 = cur + a * t, cur + b * t
        bis = (a + b) / np.linalg.norm(a + b)
        c = cur + bis * (r / math.sin(ang / 2))
        a1 = math.atan2(*(t1 - c)[::-1])
        a2 = math.atan2(*(t2 - c)[::-1])
        da = (a2 - a1 + math.pi) % (2 * math.pi) - math.pi
        pts.extend(arc_points(c, r, a1, a1 + da))
    return Polygon(pts)


def band(points, width):
    """A crack: the polyline widened to `width`, square ends."""
    return LineString(points).buffer(width / 2, cap_style="flat", join_style="round", quad_segs=64)


def opened(geom, r):
    """Rounds every convex corner by r: shrink, then grow back."""
    return geom.buffer(-r, quad_segs=32).buffer(r, quad_segs=32) if r > 0 else geom


def fillet(geom, corner, d1, d2, r):
    """Rounds one convex corner at `corner`; d1 and d2 point away from it along its two edges."""
    d1, d2 = d1 / np.linalg.norm(d1), d2 / np.linalg.norm(d2)
    ang = math.acos(float(np.clip(np.dot(d1, d2), -1, 1)))
    t = r / math.tan(ang / 2)
    bis = (d1 + d2) / np.linalg.norm(d1 + d2)
    c = corner + bis * (r / math.sin(ang / 2))
    wedge = Polygon([corner, corner + d1 * t, corner + d2 * t]).difference(Point(c).buffer(r, quad_segs=64))
    return geom.difference(wedge)


def pieces(geom):
    if geom.is_empty:
        return []
    return list(geom.geoms) if isinstance(geom, MultiPolygon) else [geom]


def build(crack_w=CRACK_W, with_cracks=True, with_highlights=True):
    # 1. Lines fitted to the raster's straight edges: a point and an angle (degrees, y down).
    L_left, L_top = Line((X0, 0), 90), Line((0, Y0), 0)
    L_right, L_bottom = Line((X1, 0), 90), Line((0, Y1), 0)
    edge0 = Line((66.52, 127.31), 42.80)
    edge2 = Line((150.66, 198.97), 42.62)
    A_UL_bot = Line((87.88, 191.62), 24.98)
    A_UR_left = Line((360.74, 116.18), 136.44)
    A_UR_right = Line((377.86, 144.61), 142.13)
    # The lower-right gap: on its right, shards 5 and 7 sit on two parallel edges (the step hides in crack 4); on its
    # left, shard 6's edge, then the hook of shard 8, bent twice as in the raster.
    edge5 = Line((311.64, 330.0), 41.95)
    edge7 = Line((407.44, 414.21), 42.09)
    edge6up = Line((295.3, 345.48), 42.52)
    hook_tip, hook_bend, hook_foot = np.array([394.8, 432.2]), np.array([442.0, 470.0]), np.array([474.2, 499.8])
    hook1 = Line(hook_tip, math.degrees(math.atan2(*(hook_bend - hook_tip)[::-1])))
    hook2 = Line(hook_bend, math.degrees(math.atan2(*(hook_foot - hook_bend)[::-1])))
    A_LL_top = Line((77.85, 328.17), 145.47)
    A_LL_bot = Line((121.17, 328.15), 141.39)
    L_8left = Line((65.12, 426.75), 97.21)
    chamfer6 = Line((182.25, 295.05), 162.64)
    chamfer5 = Line((277.46, 248.12), 103.42)
    c1 = Line((129.58, 15.0), 91.83)
    c4 = Line((369.69, 328.21), 139.1)

    # 2. The four regions. Shards 0 and 2 sit on two parallel edges; the step between them hides inside crack 1.
    top = rounded_polygon(
        [(X0, Y0), meet(L_top, A_UR_left), meet(A_UR_left, edge2), meet(edge2, c1), meet(c1, edge0),
         meet(edge0, L_left)],
        [1.5, 1.2, 60.0, 0, 0, 1.5], "top")
    right = rounded_polygon(
        [meet(A_UR_right, L_right), meet(L_right, edge7), meet(edge7, c4), meet(c4, edge5), meet(edge5, chamfer5),
         meet(chamfer5, A_UR_right)],
        [25.0, 1.5, 0, 0, 56.0, 15.0], "right")
    bottom = rounded_polygon(
        [meet(A_LL_bot, chamfer6), meet(chamfer6, edge6up), meet(edge6up, hook1), hook_bend, meet(hook2, L_bottom),
         meet(L_bottom, L_8left), meet(L_8left, A_LL_bot)],
        [10.0, 46.0, 0, 0, 1.5, 21.0, 10.0], "bottom")
    left = rounded_polygon(
        [meet(L_left, A_UL_bot), meet(A_UL_bot, A_LL_top), meet(A_LL_top, L_left)],
        [16.0, 32.0, 1.5], "left")

    # 3. Cracks, one width.
    h = crack_w / 2
    crack1 = band([c1.point(-12), c1.point(180)], crack_w)

    # Crack 2 runs up-right, then curls up (radius 23) to leave through the top edge at x = 430.
    c2 = Line((268.69, 102.14), -21.56)
    curl_r, curl_x = 23.0, 430.0
    n_left = np.array([c2.d[1], -c2.d[0]])
    cx = curl_x - curl_r
    cy = c2.p[1] + (curl_r - (cx - c2.p[0]) * n_left[0]) / n_left[1]
    curl_c = np.array([cx, cy])
    t1 = curl_c - curl_r * n_left
    start = c2.p + ((126.0 - c2.p[0]) / c2.d[0]) * c2.d
    a1 = math.atan2(*(t1 - curl_c)[::-1])
    crack2 = band([start, *arc_points(curl_c, curl_r, a1, 0.0), (curl_x, -10.0)], crack_w)

    c3 = Line((408.04, 308.47), 53.5)
    crack3 = band([c3.point(-160), c3.point(160)], crack_w)
    crack4 = band([c4.point(-43), c4.point(50)], crack_w)

    # Crack 5 runs at 19.6 degrees, then 20.2 from x = 300 (it sags 2 px before its U-turn), turns round the tip of
    # shard 6 and runs back up beside the hook of shard 8 until it opens into the gap.
    c5a = Line((191.49, 398.98), 19.6)
    c5_bend = c5a.point((300.0 - c5a.p[0]) / c5a.d[0])
    c5 = Line(c5_bend, 20.2)
    c5_upper = c5.offset(-h)
    hook_inner = Line((406.75, 447.37), 46.30)
    edge6 = hook_inner.offset(crack_w)
    tip6 = meet(c5_upper, edge6)
    tip_r = 4.5
    u = -c5_upper.d - edge6.d
    u /= np.linalg.norm(u)
    half = math.radians(46.30 - 20.2) / 2
    tip_c = tip6 + u * (tip_r / math.sin(half))
    R = tip_r + h
    p_in = tip_c + R * np.array([-c5.d[1], c5.d[0]])
    p_out = tip_c + R * np.array([edge6.d[1], -edge6.d[0]])
    a_in = math.atan2(*(p_in - tip_c)[::-1])
    a_out = math.atan2(*(p_out - tip_c)[::-1])
    sweep = (a_out - a_in) % (2 * math.pi) - 2 * math.pi
    t_start = (60.0 - c5a.p[0]) / c5a.d[0]
    crack5 = band([c5a.point(t_start), c5_bend, *arc_points(tip_c, R, a_in, a_in + sweep), p_out - 140 * edge6.d],
                  crack_w)

    cracks = unary_union([crack1, crack2, crack3, crack4, crack5]) if with_cracks else Polygon()

    # 4. Shards: regions minus cracks. Two corners get the raster's fillets, then every convex corner is softened by
    #    1 px. The fillets go first, or the softening leaves a zero-width spike where they meet.
    navy = [p for region in (top, right, bottom) for p in pieces(region.difference(cracks)) if p.area > 50]

    def refine(corner, d1, d2, r):
        probe = Point(*(corner + (d1 + d2) / np.linalg.norm(d1 + d2) * 3))
        i = next(i for i, p in enumerate(navy) if p.contains(probe))
        navy[i] = fillet(navy[i], corner, d1, d2, r)

    if with_cracks:
        refine(meet(c1.offset(-h), edge2), -c1.d, edge2.d, 12.0)  # shard 2 at crack 1
        refine(meet(A_LL_bot, c5a.offset(h)), A_LL_bot.d, c5a.d, 8.0)  # shard 8 where crack 5 meets the gap
    navy = [q for p in navy for q in pieces(opened(p, 1.0)) if q.area > 1]

    # 5. The orange tip: the red triangle inside a circle. The highlights: three shards' tips inside a rounded rhombus.
    orange = left.intersection(Point(184.2, 247.8).buffer(49.8, quad_segs=256))

    def rhombus(apex, ang_a, ang_b, size, r_apex):
        A = np.array(apex, float)
        da = np.array([math.cos(math.radians(ang_a)), math.sin(math.radians(ang_a))])
        db = np.array([math.cos(math.radians(ang_b)), math.sin(math.radians(ang_b))])
        return rounded_polygon([A, A + size * da, A + size * (da + db), A + size * db], [r_apex, 0, 0, 0], "rhombus")

    def shard_at(x, y):
        return next(p for p in navy if p.contains(Point(x, y)))

    highlights = [] if not with_highlights else [
        opened(shard_at(222, 215).intersection(rhombus((222, 189), 138.3, 30.3, 70, 8)), 2.5),
        opened(shard_at(212, 305).intersection(rhombus((212.5, 329.5), 218.9, 327.3, 70, 8)), 2.5),
        opened(shard_at(292, 270).intersection(rhombus((314, 276), 231.7, 135.0, 65, 8)), 2.5),
    ]
    shapes = {"navy": navy, "patch": [q for p in highlights for q in pieces(p)], "red": [left], "orange": pieces(orange)}
    # Drop the points that sit on a straight run; curves are already within TOL.
    return {k: [p.simplify(0.015, preserve_topology=True) for p in v] for k, v in shapes.items()}


def to_units(poly):
    """The polygon's outline in mark units, 3 decimals. No shape has a hole."""
    return [[round((x - X0) / (X1 - X0) * 100, 3), round((y - Y0) / (Y1 - Y0) * 100, 3)]
            for x, y in poly.exterior.coords[:-1]]


if __name__ == "__main__":
    cuts = {
        "mark": build(),
        "glyph": build(crack_w=GLYPH_CRACK_W, with_highlights=False),
        "tiny": build(with_cracks=False, with_highlights=False),
    }
    out = {name: {layer: [to_units(p) for p in polys] for layer, polys in shapes.items()} for name, shapes in cuts.items()}
    target = os.path.join(os.path.dirname(os.path.abspath(__file__)), "zan-mark.json")
    with open(target, "w") as f:
        json.dump(out, f, separators=(",", ":"))
    for name, shapes in cuts.items():
        print(name, {layer: len(polys) for layer, polys in shapes.items()},
              "points", sum(len(p.exterior.coords) for polys in shapes.values() for p in polys))
    print("wrote", target)
