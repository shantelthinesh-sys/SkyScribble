from __future__ import annotations

import base64
import json
import math
import re
from datetime import datetime
from pathlib import Path
from typing import Any

import cv2
import numpy as np

from src.ai import build_ai_directives
from src.ai.studio_ai import generate_image_variants

STUDIO_LABELS = {
    "image-generator": "Image Generator",
    "video-animation": "Video Animation",
    "2d-model": "2D Model",
    "3d-model": "3D Model",
    "3d-animation": "3D Animation",
}

STUDIO_ALIASES = {
    "drawing-studio": "image-generator",
    "2d-animation": "video-animation",
}


def _safe_slug(value: str) -> str:
    cleaned = re.sub(r"[^a-z0-9\-]+", "-", value.lower()).strip("-")
    return cleaned or "image-generator"


def _safe_name(value: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9 _\-]+", "", value).strip()
    return cleaned[:80] if cleaned else "untitled"


def _canonical_module(value: str) -> str:
    slug = _safe_slug(value)
    return STUDIO_ALIASES.get(slug, slug)


def _decode_data_url(data_url: str) -> np.ndarray:
    if not data_url or "," not in data_url:
        raise ValueError("Invalid image payload")

    encoded = data_url.split(",", 1)[1].strip().replace(" ", "+")
    pad = (-len(encoded)) % 4
    if pad:
        encoded += "=" * pad

    try:
        raw = base64.b64decode(encoded)
    except Exception:
        raw = base64.urlsafe_b64decode(encoded)

    arr = np.frombuffer(raw, dtype=np.uint8)
    image = cv2.imdecode(arr, cv2.IMREAD_UNCHANGED)
    if image is None:
        raise ValueError("Failed to decode image")

    if image.ndim == 2:
        image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGRA)
    elif image.shape[2] == 3:
        alpha = np.full((image.shape[0], image.shape[1], 1), 255, dtype=np.uint8)
        image = np.concatenate([image, alpha], axis=2)

    return image


def _bgra_to_bgr(image_bgra: np.ndarray, bg=(10, 18, 34)) -> np.ndarray:
    bgr = image_bgra[:, :, :3].astype(np.float32)
    alpha = image_bgra[:, :, 3:4].astype(np.float32) / 255.0
    fill = np.full_like(bgr, bg, dtype=np.float32)
    return (alpha * bgr + (1 - alpha) * fill).clip(0, 255).astype(np.uint8)


def _apply_prompt_style(image_bgr: np.ndarray, profile: dict[str, Any]) -> np.ndarray:
    hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[:, :, 1] = np.clip(hsv[:, :, 1] * float(profile.get("saturation", 1.0)), 0, 255)
    styled = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)

    tint = profile.get("style_tint", profile.get("tint", (0, 0, 0)))
    if tint != (0, 0, 0):
        tint_layer = np.full_like(styled, tint, dtype=np.uint8)
        styled = cv2.addWeighted(styled, 0.84, tint_layer, 0.16, 0)

    return styled


def _write_gif(path: Path, frames: list[np.ndarray], fps: int = 14) -> None:
    if not frames:
        raise ValueError("No frames for gif")
    from PIL import Image

    rgb_frames = [cv2.cvtColor(frame, cv2.COLOR_BGR2RGB) for frame in frames]
    pil_frames = [Image.fromarray(frame) for frame in rgb_frames]
    pil_frames[0].save(
        str(path),
        save_all=True,
        append_images=pil_frames[1:],
        duration=max(20, int(1000 / max(1, fps))),
        loop=0,
    )


def _write_video(path: Path, frames: list[np.ndarray], fps: int = 24) -> None:
    if not frames:
        raise ValueError("No frames for video")
    h, w = frames[0].shape[:2]
    writer = cv2.VideoWriter(str(path), cv2.VideoWriter_fourcc(*"mp4v"), fps, (w, h))
    if not writer.isOpened():
        raise RuntimeError("Video writer could not be opened")
    for frame in frames:
        writer.write(frame)
    writer.release()


def process_image(
    image_bgra: np.ndarray,
    out_dir: Path,
    base_name: str,
    ai_profile: dict[str, Any],
) -> dict[str, Any]:
    """Image Generator: synthesize image variants from drawing + AI directives."""
    variants = generate_image_variants(image_bgra=image_bgra, ai_profile=ai_profile, count=3)
    primary_file = out_dir / f"{base_name}.png"
    cv2.imwrite(str(primary_file), variants[0])

    extra_files: list[str] = []
    for idx, variant in enumerate(variants[1:], start=2):
        alt = out_dir / f"{base_name}_v{idx}.png"
        cv2.imwrite(str(alt), variant)
        extra_files.append(alt.name)

    return {
        "type": "image",
        "file": primary_file.name,
        "preview_kind": "image",
        "extra": extra_files,
    }


def process_video(
    image_bgra: np.ndarray,
    out_dir: Path,
    base_name: str,
    ai_profile: dict[str, Any],
) -> dict[str, Any]:
    """Video Animation: convert strokes to simple animation and save as GIF."""
    canvas = _apply_prompt_style(_bgra_to_bgr(image_bgra), ai_profile)
    h, w = canvas.shape[:2]
    motion = float(ai_profile.get("motion_strength", ai_profile.get("motion", 1.0)))
    object_hint = ai_profile.get("object_hint", "default")
    motion_pattern = ai_profile.get("motion_pattern", "drift")

    frames = []
    for i in range(84):
        t = i / 84.0
        if motion_pattern == "orbit":
            x_shift = int(math.cos(t * math.pi * 2.0) * (w * 0.06 * motion))
            y_shift = int(math.sin(t * math.pi * 2.0) * (h * 0.06 * motion))
        elif motion_pattern == "bounce" or object_hint == "ball":
            x_shift = 0
            y_shift = int(abs(math.sin(t * math.pi * 2.0)) * (h * 0.08 * motion)) - int(h * 0.04 * motion)
        elif object_hint == "fish":
            x_shift = int(math.sin(t * math.pi * 2.0) * (w * 0.09 * motion))
            y_shift = int(math.sin(t * math.pi * 6.0) * (h * 0.015 * motion))
        elif object_hint == "snake":
            x_shift = int(math.sin(t * math.pi * 4.0) * (w * 0.06 * motion))
            y_shift = int(math.sin(t * math.pi * 2.0) * (h * 0.05 * motion))
        else:
            x_shift = int(math.sin(t * math.pi * 2.0) * (w * 0.06 * motion))
            y_shift = int(math.sin(t * math.pi * 4.0) * (h * 0.02 * motion))
        mat = np.float32([[1, 0, x_shift], [0, 1, y_shift]])
        moved = cv2.warpAffine(canvas, mat, (w, h), borderMode=cv2.BORDER_REFLECT)
        frames.append(moved)

    out = out_dir / f"{base_name}.gif"
    _write_gif(out, frames, fps=14)
    return {"type": "animation", "file": out.name, "preview_kind": "animation"}


def process_svg(
    image_bgra: np.ndarray,
    out_dir: Path,
    base_name: str,
    ai_profile: dict[str, Any],
) -> dict[str, Any]:
    """2D Model: convert strokes to SVG and return vector preview."""
    alpha = image_bgra[:, :, 3]
    mask = (alpha > 20).astype(np.uint8) * 255
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    h, w = mask.shape[:2]
    stroke = ai_profile.get("stroke_color", ai_profile.get("stroke", "#6FA8FF"))
    svg = [
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
        svg.append(f'<polygon points="{points}" fill="none" stroke="{stroke}" stroke-width="2"/>')
        has_path = True

    if not has_path:
        svg.append(f'<rect x="8" y="8" width="40" height="28" fill="none" stroke="{stroke}" stroke-width="2"/>')

    svg.append("</svg>")

    out = out_dir / f"{base_name}.svg"
    out.write_text("\n".join(svg), encoding="utf-8")
    return {"type": "vector", "file": out.name, "preview_kind": "svg"}


def process_3d_model(
    image_bgra: np.ndarray,
    out_dir: Path,
    base_name: str,
    ai_profile: dict[str, Any],
) -> dict[str, Any]:
    """3D Model: placeholder extrusion saved as OBJ (+MTL + texture)."""
    texture = _apply_prompt_style(_bgra_to_bgr(image_bgra), ai_profile)
    texture_file = out_dir / f"{base_name}_texture.png"
    cv2.imwrite(str(texture_file), texture)

    mtl_file = out_dir / f"{base_name}.mtl"
    obj_file = out_dir / f"{base_name}.obj"

    mtl_file.write_text(
        "\n".join(
            [
                "newmtl drawmat",
                "Ka 0.2 0.2 0.2",
                "Kd 1.0 1.0 1.0",
                "Ks 0.0 0.0 0.0",
                f"map_Kd {texture_file.name}",
            ]
        ),
        encoding="utf-8",
    )

    obj_file.write_text(
        "\n".join(
            [
                f"mtllib {mtl_file.name}",
                "o drawing_plane",
                "v -1.0 -1.0 0.0",
                "v  1.0 -1.0 0.0",
                "v  1.0  1.0 0.0",
                "v -1.0  1.0 0.0",
                "v -1.0 -1.0 0.3",
                "v  1.0 -1.0 0.3",
                "v  1.0  1.0 0.3",
                "v -1.0  1.0 0.3",
                "vt 0.0 1.0",
                "vt 1.0 1.0",
                "vt 1.0 0.0",
                "vt 0.0 0.0",
                "usemtl drawmat",
                "f 1/1 2/2 3/3 4/4",
                "f 5/1 6/2 7/3 8/4",
                "f 1/1 2/2 6/3 5/4",
                "f 2/1 3/2 7/3 6/4",
                "f 3/1 4/2 8/3 7/4",
                "f 4/1 1/2 5/3 8/4",
            ]
        ),
        encoding="utf-8",
    )

    return {
        "type": "mesh",
        "file": obj_file.name,
        "preview_kind": "3d",
        "extra": [texture_file.name, mtl_file.name],
    }


def process_3d_animation(
    image_bgra: np.ndarray,
    out_dir: Path,
    base_name: str,
    ai_profile: dict[str, Any],
) -> dict[str, Any]:
    """3D Animation: pseudo-3D moving render saved as GIF."""
    texture = _apply_prompt_style(_bgra_to_bgr(image_bgra), ai_profile)
    th, tw = texture.shape[:2]
    frame_h = max(540, th)
    frame_w = max(960, tw)
    motion = float(ai_profile.get("motion_strength", ai_profile.get("motion", 1.0)))
    depth = float(ai_profile.get("depth_strength", 1.0))
    bg_tint = ai_profile.get("style_tint", ai_profile.get("tint", (0, 0, 0)))
    bg_color = (
        min(255, 10 + int(bg_tint[0])),
        min(255, 18 + int(bg_tint[1])),
        min(255, 34 + int(bg_tint[2])),
    )

    texture = cv2.resize(texture, (int(frame_w * 0.45), int(frame_h * 0.45)), interpolation=cv2.INTER_AREA)
    h, w = texture.shape[:2]

    frames: list[np.ndarray] = []
    for i in range(92):
        t = i / 92.0
        angle = math.sin(t * math.pi * 2.0)
        dx = int(math.sin(t * math.pi * 2.0) * w * (0.25 * motion))
        squeeze = int(abs(angle) * w * (0.18 * motion * depth))

        src = np.float32([[0, 0], [w - 1, 0], [w - 1, h - 1], [0, h - 1]])
        dst = np.float32(
            [
                [frame_w * 0.5 - w * 0.5 + dx + squeeze, frame_h * 0.5 - h * 0.5],
                [frame_w * 0.5 + w * 0.5 + dx - squeeze, frame_h * 0.5 - h * 0.5],
                [frame_w * 0.5 + w * 0.5 + dx - squeeze, frame_h * 0.5 + h * 0.5],
                [frame_w * 0.5 - w * 0.5 + dx + squeeze, frame_h * 0.5 + h * 0.5],
            ]
        )

        mat = cv2.getPerspectiveTransform(src, dst)
        frame = np.full((frame_h, frame_w, 3), bg_color, dtype=np.uint8)
        warped = cv2.warpPerspective(texture, mat, (frame_w, frame_h))
        mask = cv2.warpPerspective(np.ones((h, w), dtype=np.uint8) * 255, mat, (frame_w, frame_h))
        mask3 = cv2.cvtColor(mask, cv2.COLOR_GRAY2BGR)
        frame = np.where(mask3 > 0, warped, frame)
        frames.append(frame)

    out = out_dir / f"{base_name}.gif"
    _write_gif(out, frames, fps=14)
    return {"type": "animation", "file": out.name, "preview_kind": "animation"}


def save_output(
    drawing_data: str,
    current_module: str,
    *,
    user_name: str = "guest",
    title: str = "untitled",
    prompt: str = "",
    animation_prompt: str = "",
) -> dict[str, Any]:
    """Dispatcher save function: save_output(drawing_data, current_module)."""
    project_root = Path(__file__).resolve().parents[1]
    outputs_root = project_root / "outputs"

    module = _canonical_module(current_module)
    if module not in STUDIO_LABELS:
        raise ValueError(f"Unsupported module: {current_module}")

    safe_user = _safe_name(user_name) or "guest"
    safe_title = _safe_name(title)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    session_id = f"{timestamp}_{_safe_slug(safe_title)[:20]}"

    session_dir = outputs_root / module / safe_user / session_id
    session_dir.mkdir(parents=True, exist_ok=True)

    image_bgra = _decode_data_url(drawing_data)
    ai_profile = build_ai_directives(
        image_bgra=image_bgra,
        studio=module,
        prompt=prompt,
        animation_prompt=animation_prompt,
    )

    dispatch = {
        "image-generator": process_image,
        "video-animation": process_video,
        "2d-model": process_svg,
        "3d-model": process_3d_model,
        "3d-animation": process_3d_animation,
    }
    processor = dispatch[module]
    primary = processor(image_bgra, session_dir, f"{session_id}_{module}", ai_profile)

    generated = [{"type": primary["type"], "file": primary["file"]}]
    for extra_file in primary.get("extra", []):
        generated.append({"type": "support", "file": extra_file})

    meta = {
        "module": module,
        "module_label": STUDIO_LABELS[module],
        "title": safe_title,
        "prompt": prompt,
        "animation_prompt": animation_prompt,
        "ai_profile": ai_profile,
        "user": safe_user,
        "session_id": session_id,
        "created_at": datetime.now().isoformat(),
        "preview_kind": primary.get("preview_kind", "none"),
        "generated": generated,
    }
    meta_path = session_dir / f"{session_id}_meta.json"
    meta_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")

    base = f"/outputs/{module}/{safe_user}/{session_id}"
    generated_urls = [
        {
            "type": item["type"],
            "url": f"{base}/{item['file']}",
        }
        for item in generated
    ]

    return {
        "module": module,
        "module_label": STUDIO_LABELS[module],
        "session_id": session_id,
        "preview_kind": primary.get("preview_kind", "none"),
        "primary_url": f"{base}/{primary['file']}",
        "generated": generated_urls,
        "meta": f"{base}/{meta_path.name}",
    }
