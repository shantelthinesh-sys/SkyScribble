from __future__ import annotations

import math
from pathlib import Path

import cv2
import numpy as np


def process_3d_animation(canvas_bgr, output_dir: Path, base_name: str) -> dict[str, str]:
    """3D animation module: pseudo-3D motion path rendered to MP4."""
    output_dir.mkdir(parents=True, exist_ok=True)

    h, w = canvas_bgr.shape[:2]
    frame_h = max(480, h)
    frame_w = max(854, w)

    texture = cv2.resize(canvas_bgr, (int(frame_w * 0.45), int(frame_h * 0.45)), interpolation=cv2.INTER_AREA)
    th, tw = texture.shape[:2]

    out_path = output_dir / f"{base_name}.mp4"
    writer = cv2.VideoWriter(str(out_path), cv2.VideoWriter_fourcc(*"mp4v"), 24, (frame_w, frame_h))
    if not writer.isOpened():
        raise RuntimeError("Could not open video writer")

    for i in range(96):
        t = i / 96.0
        angle = math.sin(t * math.pi * 2.0)
        dx = int(math.sin(t * math.pi * 2.0) * tw * 0.25)
        squeeze = int(abs(angle) * tw * 0.2)

        src = np.float32([[0, 0], [tw - 1, 0], [tw - 1, th - 1], [0, th - 1]])
        dst = np.float32(
            [
                [frame_w * 0.5 - tw * 0.5 + dx + squeeze, frame_h * 0.5 - th * 0.5],
                [frame_w * 0.5 + tw * 0.5 + dx - squeeze, frame_h * 0.5 - th * 0.5],
                [frame_w * 0.5 + tw * 0.5 + dx - squeeze, frame_h * 0.5 + th * 0.5],
                [frame_w * 0.5 - tw * 0.5 + dx + squeeze, frame_h * 0.5 + th * 0.5],
            ]
        )

        frame = np.full((frame_h, frame_w, 3), (10, 18, 34), dtype=np.uint8)
        mat = cv2.getPerspectiveTransform(src, dst)
        warped = cv2.warpPerspective(texture, mat, (frame_w, frame_h))
        mask = cv2.warpPerspective(np.full((th, tw), 255, dtype=np.uint8), mat, (frame_w, frame_h))
        mask3 = cv2.cvtColor(mask, cv2.COLOR_GRAY2BGR)
        frame = np.where(mask3 > 0, warped, frame)
        writer.write(frame)

    writer.release()
    return {"primary": str(out_path), "type": "animation"}
