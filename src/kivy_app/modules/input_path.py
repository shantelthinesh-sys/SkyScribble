from __future__ import annotations

from dataclasses import dataclass, field
from time import monotonic


@dataclass
class InputPathStore:
    """Stores path points from either tracked finger or mouse/touch input."""

    idle_timeout_sec: float = 1.2
    min_move_px: float = 2.0
    path: list[tuple[float, float]] = field(default_factory=list)
    last_point: tuple[float, float] | None = None
    last_motion_ts: float = field(default_factory=monotonic)
    source: str = "tracked"

    def begin(self, source: str) -> None:
        self.path.clear()
        self.last_point = None
        self.last_motion_ts = monotonic()
        self.source = source

    def add(self, point: tuple[float, float] | None) -> None:
        if point is None:
            return

        now = monotonic()
        if self.last_point is None:
            self.path.append(point)
            self.last_point = point
            self.last_motion_ts = now
            return

        dx = point[0] - self.last_point[0]
        dy = point[1] - self.last_point[1]
        if dx * dx + dy * dy >= self.min_move_px * self.min_move_px:
            self.path.append(point)
            self.last_point = point
            self.last_motion_ts = now

    def should_finalize_from_idle(self) -> bool:
        if not self.path:
            return False
        return monotonic() - self.last_motion_ts >= self.idle_timeout_sec

    def take(self) -> list[tuple[float, float]]:
        out = self.path[:]
        self.path.clear()
        self.last_point = None
        self.last_motion_ts = monotonic()
        return out
