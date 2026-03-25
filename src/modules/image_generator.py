from __future__ import annotations

from pathlib import Path

import cv2


def process_image(canvas_bgr, output_dir: Path, base_name: str) -> dict[str, str]:
    """Image module: save a stylized PNG from the drawing canvas."""
    output_dir.mkdir(parents=True, exist_ok=True)

    smooth = cv2.bilateralFilter(canvas_bgr, d=9, sigmaColor=50, sigmaSpace=50)
    edges = cv2.Canny(smooth, 50, 120)
    edges_bgr = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)
    stylized = cv2.addWeighted(smooth, 0.92, edges_bgr, 0.08, 0)

    out_path = output_dir / f"{base_name}.png"
    cv2.imwrite(str(out_path), stylized)
    return {"primary": str(out_path), "type": "image"}
