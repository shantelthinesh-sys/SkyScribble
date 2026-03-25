from __future__ import annotations

from dataclasses import dataclass


@dataclass
class TransitionState:
    source_path: list[tuple[float, float]]
    duration: float = 0.55
    elapsed: float = 0.0

    def step(self, dt: float) -> float:
        self.elapsed += dt
        t = self.elapsed / max(0.01, self.duration)
        return max(0.0, min(1.0, t))

    @property
    def done(self) -> bool:
        return self.elapsed >= self.duration
