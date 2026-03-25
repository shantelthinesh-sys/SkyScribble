from __future__ import annotations

from dataclasses import dataclass, field
from time import time
from typing import Optional


MODULE_REGISTRY = {
    "image_generator": "Image Generator",
    "video_animation": "Video Animation",
    "model_2d": "2D Model",
    "model_3d": "3D Model",
    "animation_3d": "3D Animation",
}


@dataclass
class Point:
    x: int
    y: int
    t: float = field(default_factory=time)


@dataclass
class Stroke:
    points: list[Point] = field(default_factory=list)
    mode: str = "draw"
    color: tuple[int, int, int] = (0, 255, 255)
    thickness: int = 6


@dataclass
class DrawingData:
    """Stores the reusable stroke data captured from hand drawing."""

    strokes: list[Stroke] = field(default_factory=list)
    active_stroke: Optional[Stroke] = None

    def begin_stroke(self, mode: str, color: tuple[int, int, int], thickness: int) -> None:
        self.active_stroke = Stroke(mode=mode, color=color, thickness=thickness)

    def add_point(self, x: int, y: int) -> None:
        if self.active_stroke is None:
            return
        self.active_stroke.points.append(Point(x=x, y=y))

    def end_stroke(self) -> None:
        if self.active_stroke is None:
            return
        if self.active_stroke.points:
            self.strokes.append(self.active_stroke)
        self.active_stroke = None

    def clear(self) -> None:
        self.strokes.clear()
        self.active_stroke = None


@dataclass
class GlobalAppState:
    """Single shared state passed to processing and save layers."""

    current_module: str = "image_generator"
    drawing: DrawingData = field(default_factory=DrawingData)
    save_counter: int = 0
    last_save_message: str = ""

    @property
    def current_module_label(self) -> str:
        return MODULE_REGISTRY.get(self.current_module, "Unknown")
