from __future__ import annotations

import math
from pathlib import Path

import cv2


def process_video_animation(canvas_bgr, output_dir: Path, base_name: str) -> dict[str, str]:
    """Video module: convert strokes into a simple animated MP4 sequence."""
    output_dir.mkdir(parents=True, exist_ok=True)
    h, w = canvas_bgr.shape[:2]

    frames = []
    for i in range(72):
        t = i / 72.0
        x_shift = int(math.sin(t * math.pi * 2.0) * (w * 0.04))
        y_shift = int(math.sin(t * math.pi * 3.0) * (h * 0.02))
        mat = cv2.getRotationMatrix2D((w // 2, h // 2), math.sin(t * 2 * math.pi) * 2.5, 1.0)
        mat[:, 2] += [x_shift, y_shift]
        frame = cv2.warpAffine(canvas_bgr, mat, (w, h), borderMode=cv2.BORDER_REFLECT)
        frames.append(frame)

    out_path = output_dir / f"{base_name}.mp4"
    writer = cv2.VideoWriter(str(out_path), cv2.VideoWriter_fourcc(*"mp4v"), 24, (w, h))
    if not writer.isOpened():
        raise RuntimeError("Could not open video writer")
    for frame in frames:
        writer.write(frame)
    writer.release()

    return {"primary": str(out_path), "type": "video"}
