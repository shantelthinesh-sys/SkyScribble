from __future__ import annotations

import math


def smooth_path(path: list[tuple[float, float]], iterations: int = 2) -> list[tuple[float, float]]:
    """Chaikin smoothing to convert raw finger path into a smooth 2D shape."""
    if len(path) < 3:
        return path[:]

    output = path[:]
    for _ in range(iterations):
        next_points: list[tuple[float, float]] = [output[0]]
        for i in range(len(output) - 1):
            p0 = output[i]
            p1 = output[i + 1]
            q = (0.75 * p0[0] + 0.25 * p1[0], 0.75 * p0[1] + 0.25 * p1[1])
            r = (0.25 * p0[0] + 0.75 * p1[0], 0.25 * p0[1] + 0.75 * p1[1])
            next_points.extend([q, r])
        next_points.append(output[-1])
        output = next_points
    return output


def _bbox(path: list[tuple[float, float]]) -> tuple[float, float, float, float]:
    xs = [p[0] for p in path]
    ys = [p[1] for p in path]
    return min(xs), min(ys), max(xs), max(ys)


def classify_shape(path: list[tuple[float, float]]) -> str:
    """Simple heuristic classifier. Returns fish_like or generic."""
    if len(path) < 12:
        return "generic"

    min_x, min_y, max_x, max_y = _bbox(path)
    w = max_x - min_x
    h = max_y - min_y
    if w < 30 or h < 10:
        return "generic"

    aspect = w / max(1e-6, h)
    if not (1.2 <= aspect <= 6.0):
        return "generic"

    # Fish-like heuristic: wider center, tapered ends.
    left_x = min_x + w * 0.15
    right_x = max_x - w * 0.15
    center_x0 = min_x + w * 0.35
    center_x1 = max_x - w * 0.35

    left_band = [p for p in path if p[0] <= left_x]
    right_band = [p for p in path if p[0] >= right_x]
    center_band = [p for p in path if center_x0 <= p[0] <= center_x1]

    if not left_band or not right_band or not center_band:
        return "generic"

    def spread_y(points: list[tuple[float, float]]) -> float:
        ys = [p[1] for p in points]
        return max(ys) - min(ys)

    end_spread = (spread_y(left_band) + spread_y(right_band)) * 0.5
    mid_spread = spread_y(center_band)

    curvature = 0.0
    for i in range(1, len(path) - 1):
        a = path[i - 1]
        b = path[i]
        c = path[i + 1]
        ab = (b[0] - a[0], b[1] - a[1])
        bc = (c[0] - b[0], c[1] - b[1])
        nab = math.hypot(ab[0], ab[1])
        nbc = math.hypot(bc[0], bc[1])
        if nab > 0 and nbc > 0:
            dot = (ab[0] * bc[0] + ab[1] * bc[1]) / (nab * nbc)
            curvature += 1.0 - max(-1.0, min(1.0, dot))

    if mid_spread > end_spread * 1.2 and curvature > 2.0:
        return "fish_like"
    return "generic"
