from __future__ import annotations

import math
from dataclasses import dataclass


@dataclass
class RenderShape:
    kind: str
    points: list[tuple[float, float]]
    radius: float = 0.0


class AnimatedObject:
    def __init__(self, width: float, height: float):
        self.width = width
        self.height = height

    def update(self, dt: float) -> list[RenderShape]:
        raise NotImplementedError


class FishObject(AnimatedObject):
    def __init__(self, width: float, height: float):
        super().__init__(width, height)
        self.x = width * 0.25
        self.y = height * 0.5
        self.vx = max(120.0, width * 0.18)
        self.t = 0.0

    def update(self, dt: float) -> list[RenderShape]:
        self.t += dt
        self.x += self.vx * dt

        body_len = max(80.0, self.width * 0.12)
        body_h = body_len * 0.4
        if self.x + body_len * 0.5 >= self.width:
            self.x = self.width - body_len * 0.5
            self.vx = -abs(self.vx)
        if self.x - body_len * 0.5 <= 0:
            self.x = body_len * 0.5
            self.vx = abs(self.vx)

        bob = math.sin(self.t * 2.4) * 8.0
        cy = min(self.height - body_h, max(body_h, self.y + bob))

        # Body ellipse polyline.
        body: list[tuple[float, float]] = []
        for i in range(36):
            a = (i / 36.0) * math.pi * 2.0
            body.append((self.x + math.cos(a) * body_len * 0.5, cy + math.sin(a) * body_h * 0.5))

        tail_phase = math.sin(self.t * 10.0) * body_h * 0.3
        direction = 1.0 if self.vx >= 0 else -1.0
        tail_x = self.x - direction * body_len * 0.55
        tail = [
            (tail_x, cy),
            (tail_x - direction * body_len * 0.28, cy + body_h * 0.35 + tail_phase),
            (tail_x - direction * body_len * 0.28, cy - body_h * 0.35 - tail_phase),
            (tail_x, cy),
        ]

        return [RenderShape(kind="polyline", points=body), RenderShape(kind="polyline", points=tail)]


class BallObject(AnimatedObject):
    def __init__(self, width: float, height: float):
        super().__init__(width, height)
        self.r = max(24.0, min(width, height) * 0.045)
        self.x = width * 0.5
        self.y = height * 0.7
        self.vx = max(110.0, width * 0.14)
        self.vy = -max(180.0, height * 0.25)
        self.g = max(420.0, height * 0.65)

    def update(self, dt: float) -> list[RenderShape]:
        self.vy += self.g * dt
        self.x += self.vx * dt
        self.y += self.vy * dt

        if self.x - self.r <= 0:
            self.x = self.r
            self.vx = abs(self.vx)
        if self.x + self.r >= self.width:
            self.x = self.width - self.r
            self.vx = -abs(self.vx)

        if self.y - self.r <= 0:
            self.y = self.r
            self.vy = abs(self.vy) * 0.85
        if self.y + self.r >= self.height:
            self.y = self.height - self.r
            self.vy = -abs(self.vy) * 0.86

        return [RenderShape(kind="circle", points=[(self.x, self.y)], radius=self.r)]


class SnakeObject(AnimatedObject):
    def __init__(self, width: float, height: float):
        super().__init__(width, height)
        self.x = width * 0.15
        self.y = height * 0.55
        self.vx = max(90.0, width * 0.12)
        self.t = 0.0

    def update(self, dt: float) -> list[RenderShape]:
        self.t += dt
        self.x += self.vx * dt

        length = max(180.0, self.width * 0.34)
        amp = max(18.0, self.height * 0.045)

        if self.x + length * 0.5 >= self.width or self.x - length * 0.5 <= 0:
            self.vx = -self.vx

        pts: list[tuple[float, float]] = []
        segments = 48
        moving_right = self.vx >= 0
        for i in range(segments):
            s = i / (segments - 1)
            x_local = -length * 0.5 + s * length
            wave = math.sin((s * 7.0) + (self.t * 8.0))
            y_local = wave * amp * (0.35 + 0.65 * (1.0 - s))

            if moving_right:
                px = self.x + x_local
            else:
                px = self.x - x_local
            py = self.y + y_local
            py = min(self.height - 6.0, max(6.0, py))
            pts.append((px, py))

        # Head points near leading end.
        head = pts[-1] if moving_right else pts[0]
        eye_r = 2.5
        eye = RenderShape(kind="circle", points=[(head[0], head[1] - 5.0)], radius=eye_r)

        return [RenderShape(kind="polyline", points=pts), eye]


def build_prebuilt_object(label: str, width: float, height: float) -> AnimatedObject:
    if label == "ball":
        return BallObject(width, height)
    if label == "snake":
        return SnakeObject(width, height)
    return FishObject(width, height)
