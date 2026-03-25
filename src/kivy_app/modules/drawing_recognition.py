from __future__ import annotations

import math


def smooth_path(path: list[tuple[float, float]], iterations: int = 2) -> list[tuple[float, float]]:
    if len(path) < 3:
        return path[:]

    out = path[:]
    for _ in range(iterations):
        nxt: list[tuple[float, float]] = [out[0]]
        for i in range(len(out) - 1):
            a = out[i]
            b = out[i + 1]
            q = (0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1])
            r = (0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1])
            nxt.extend([q, r])
        nxt.append(out[-1])
        out = nxt
    return out


def _path_length(path: list[tuple[float, float]]) -> float:
    total = 0.0
    for i in range(1, len(path)):
        dx = path[i][0] - path[i - 1][0]
        dy = path[i][1] - path[i - 1][1]
        total += math.hypot(dx, dy)
    return total


def _bbox(path: list[tuple[float, float]]) -> tuple[float, float, float, float]:
    xs = [p[0] for p in path]
    ys = [p[1] for p in path]
    return min(xs), min(ys), max(xs), max(ys)


def _turn_angles(path: list[tuple[float, float]]) -> list[float]:
    vals: list[float] = []
    for i in range(1, len(path) - 1):
        a = path[i - 1]
        b = path[i]
        c = path[i + 1]
        ab = (b[0] - a[0], b[1] - a[1])
        bc = (c[0] - b[0], c[1] - b[1])
        nab = math.hypot(ab[0], ab[1])
        nbc = math.hypot(bc[0], bc[1])
        if nab < 1e-6 or nbc < 1e-6:
            continue
        dot = (ab[0] * bc[0] + ab[1] * bc[1]) / (nab * nbc)
        dot = max(-1.0, min(1.0, dot))
        vals.append(math.acos(dot))
    return vals


def classify_shape(path: list[tuple[float, float]]) -> tuple[str, list[tuple[float, float]]]:
    """Classify drawn path as fish, ball, or snake using geometric heuristics."""
    if len(path) < 8:
        return "fish", smooth_path(path, 1)

    smoothed = smooth_path(path, 2)
    min_x, min_y, max_x, max_y = _bbox(smoothed)
    w = max(1.0, max_x - min_x)
    h = max(1.0, max_y - min_y)
    aspect = w / h

    length = _path_length(smoothed)
    diag = math.hypot(w, h)
    coverage = length / max(1.0, diag)

    angles = _turn_angles(smoothed)
    avg_turn = sum(angles) / max(1, len(angles))
    sharp_count = sum(1 for a in angles if a > 1.2)
    zigzag_ratio = sharp_count / max(1, len(angles))

    cx = sum(p[0] for p in smoothed) / len(smoothed)
    cy = sum(p[1] for p in smoothed) / len(smoothed)
    radii = [math.hypot(p[0] - cx, p[1] - cy) for p in smoothed]
    mean_r = sum(radii) / max(1, len(radii))
    var_r = sum((r - mean_r) ** 2 for r in radii) / max(1, len(radii))
    radius_cv = math.sqrt(var_r) / max(1.0, mean_r)

    end_dist = math.hypot(smoothed[0][0] - smoothed[-1][0], smoothed[0][1] - smoothed[-1][1])
    closedness = end_dist / max(1.0, diag)

    ball_score = 0.0
    if 0.75 <= aspect <= 1.35:
        ball_score += 1.0
    if radius_cv < 0.25:
        ball_score += 1.0
    if closedness < 0.35:
        ball_score += 0.9

    snake_score = 0.0
    if zigzag_ratio > 0.22:
        snake_score += 1.1
    if sharp_count >= 6:
        snake_score += 0.8
    if coverage > 2.0:
        snake_score += 0.5

    fish_score = 0.0
    if coverage > 2.4:
        fish_score += 0.9
    if avg_turn < 0.95:
        fish_score += 0.7
    if aspect > 1.3:
        fish_score += 0.8

    label = "fish"
    best = fish_score
    if ball_score > best:
        label = "ball"
        best = ball_score
    if snake_score > best:
        label = "snake"

    return label, smoothed
