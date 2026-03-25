from __future__ import annotations

import cv2
import numpy as np

from src.modules.drawing import DrawingData, Stroke


def create_canvas(height: int, width: int) -> np.ndarray:
    return np.zeros((height, width, 3), dtype=np.uint8)


def _draw_stroke(target: np.ndarray, stroke: Stroke) -> None:
    points = stroke.points
    if len(points) < 2:
        if len(points) == 1:
            cv2.circle(target, (points[0].x, points[0].y), max(1, stroke.thickness // 2), stroke.color, -1)
        return

    if stroke.mode == "erase":
        color = (0, 0, 0)
        thickness = max(12, stroke.thickness)
    else:
        color = stroke.color
        thickness = stroke.thickness

    for idx in range(1, len(points)):
        p0 = points[idx - 1]
        p1 = points[idx]
        cv2.line(target, (p0.x, p0.y), (p1.x, p1.y), color, thickness)


def render_drawing(drawing: DrawingData, height: int, width: int) -> np.ndarray:
    canvas = create_canvas(height, width)
    for stroke in drawing.strokes:
        _draw_stroke(canvas, stroke)
    if drawing.active_stroke is not None:
        _draw_stroke(canvas, drawing.active_stroke)
    return canvas


def overlay_canvas(frame: np.ndarray, canvas: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(canvas, cv2.COLOR_BGR2GRAY)
    _, mask = cv2.threshold(gray, 10, 255, cv2.THRESH_BINARY)
    inv_mask = cv2.bitwise_not(mask)

    frame_bg = cv2.bitwise_and(frame, frame, mask=inv_mask)
    canvas_fg = cv2.bitwise_and(canvas, canvas, mask=mask)
    return cv2.add(frame_bg, canvas_fg)
