from __future__ import annotations

from pathlib import Path

import cv2


def process_2d_model(canvas_bgr, output_dir: Path, base_name: str) -> dict[str, str]:
    """2D model module: export SVG contours from the drawing."""
    output_dir.mkdir(parents=True, exist_ok=True)

    gray = cv2.cvtColor(canvas_bgr, cv2.COLOR_BGR2GRAY)
    _, mask = cv2.threshold(gray, 10, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    h, w = gray.shape
    svg_parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}">',
        '<rect width="100%" height="100%" fill="#081225"/>',
    ]

    has_path = False
    for contour in contours:
        if len(contour) < 3:
            continue
        approx = cv2.approxPolyDP(contour, epsilon=2.0, closed=True)
        if len(approx) < 3:
            continue
        points = " ".join(f"{int(p[0][0])},{int(p[0][1])}" for p in approx)
        svg_parts.append(f'<polygon points="{points}" fill="none" stroke="#6FA8FF" stroke-width="2"/>')
        has_path = True

    if not has_path:
        svg_parts.append('<rect x="8" y="8" width="40" height="28" fill="none" stroke="#6FA8FF" stroke-width="2"/>')

    svg_parts.append("</svg>")

    out_path = output_dir / f"{base_name}.svg"
    out_path.write_text("\n".join(svg_parts), encoding="utf-8")
    return {"primary": str(out_path), "type": "vector"}
