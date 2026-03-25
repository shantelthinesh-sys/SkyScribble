from __future__ import annotations

import math
from dataclasses import dataclass


@dataclass
class FishAnimationState:
    shape: list[tuple[float, float]]
    vx: float = 120.0
    vy: float = 0.0
    tail_amp: float = 8.0
    tail_freq: float = 8.0
    tx: float = 0.0
    ty: float = 0.0
    t: float = 0.0


class FishAnimator:
    """Moves fish-like shape with tail oscillation and boundary bounce."""

    def __init__(self) -> None:
        self.state: FishAnimationState | None = None

    def start(self, shape: list[tuple[float, float]]) -> None:
        self.state = FishAnimationState(shape=shape)

    def stop(self) -> None:
        self.state = None

    def is_active(self) -> bool:
        return self.state is not None

    def update(self, dt: float, width: float, height: float) -> list[tuple[float, float]] | None:
        if self.state is None:
            return None

        s = self.state
        s.t += dt
        s.tx += s.vx * dt
        s.ty += s.vy * dt

        xs = [p[0] + s.tx for p in s.shape]
        ys = [p[1] + s.ty for p in s.shape]
        min_x, max_x = min(xs), max(xs)
        min_y, max_y = min(ys), max(ys)

        if min_x < 0:
            s.tx += -min_x
            s.vx = abs(s.vx)
        elif max_x > width:
            s.tx -= (max_x - width)
            s.vx = -abs(s.vx)

        if min_y < 0:
            s.ty += -min_y
            s.vy = abs(s.vy)
        elif max_y > height:
            s.ty -= (max_y - height)
            s.vy = -abs(s.vy)

        # Tail oscillation affects points near one end of the fish.
        transformed: list[tuple[float, float]] = []
        shape_min_x = min(p[0] for p in s.shape)
        shape_max_x = max(p[0] for p in s.shape)
        span = max(1e-6, shape_max_x - shape_min_x)

        moving_right = s.vx >= 0
        for x, y in s.shape:
            nx = (x - shape_min_x) / span
            if moving_right:
                tail_factor = 1.0 - nx
            else:
                tail_factor = nx

            wiggle = math.sin(s.t * s.tail_freq) * s.tail_amp * (tail_factor ** 2)
            transformed.append((x + s.tx, y + s.ty + wiggle))

        return transformed
