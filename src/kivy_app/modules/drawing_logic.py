from __future__ import annotations

from dataclasses import dataclass, field
from time import monotonic


@dataclass
class AirDrawingState:
    """Tracks finger path and detects stop events from inactivity."""

    min_move_px: float = 2.5
    idle_timeout_sec: float = 1.2
    path: list[tuple[float, float]] = field(default_factory=list)
    last_point: tuple[float, float] | None = None
    last_motion_ts: float = field(default_factory=monotonic)

    def update(self, point: tuple[float, float] | None) -> bool:
        """Returns True when drawing is considered finished (idle timeout reached)."""
        now = monotonic()

        if point is None:
            if self.path and now - self.last_motion_ts >= self.idle_timeout_sec:
                return True
            return False

        if self.last_point is None:
            self.path.append(point)
            self.last_point = point
            self.last_motion_ts = now
            return False

        dx = point[0] - self.last_point[0]
        dy = point[1] - self.last_point[1]
        dist2 = dx * dx + dy * dy
        if dist2 >= self.min_move_px * self.min_move_px:
            self.path.append(point)
            self.last_point = point
            self.last_motion_ts = now

        return False

    def reset(self) -> None:
        self.path.clear()
        self.last_point = None
        self.last_motion_ts = monotonic()
