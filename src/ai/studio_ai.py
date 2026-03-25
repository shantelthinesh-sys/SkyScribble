from __future__ import annotations

import html
import math
import re
from dataclasses import asdict, dataclass
from typing import Any

import cv2
import numpy as np


@dataclass
class AIDirectives:
    style_tint: tuple[int, int, int]
    saturation: float
    motion_strength: float
    motion_pattern: str
    depth_strength: float
    stroke_color: str
    object_hint: str
    mood: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _words(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9]+", (text or "").lower()))


def _drawing_features(image_bgra: np.ndarray) -> dict[str, float]:
    alpha = image_bgra[:, :, 3]
    mask = (alpha > 18).astype(np.uint8) * 255
    h, w = mask.shape[:2]

    filled = float(np.count_nonzero(mask)) / float(max(1, h * w))
    if np.count_nonzero(mask) == 0:
        return {
            "filled_ratio": 0.0,
            "center_x": 0.5,
            "center_y": 0.5,
            "tilt": 0.0,
            "complexity": 0.0,
        }

    ys, xs = np.where(mask > 0)
    center_x = float(xs.mean()) / float(max(1, w - 1))
    center_y = float(ys.mean()) / float(max(1, h - 1))

    points = np.column_stack((xs.astype(np.float32), ys.astype(np.float32)))
    cov = np.cov(points.T) if points.shape[0] > 2 else np.array([[1.0, 0.0], [0.0, 1.0]])
    eig_vals, eig_vecs = np.linalg.eig(cov)
    idx = int(np.argmax(eig_vals))
    principal = eig_vecs[:, idx]
    tilt = float(math.atan2(principal[1], principal[0]))

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    perimeter = sum(cv2.arcLength(c, True) for c in contours)
    area = float(np.count_nonzero(mask))
    complexity = float(perimeter / max(1.0, math.sqrt(area)))

    return {
        "filled_ratio": filled,
        "center_x": center_x,
        "center_y": center_y,
        "tilt": tilt,
        "complexity": complexity,
    }


def build_ai_directives(
    *,
    image_bgra: np.ndarray,
    studio: str,
    prompt: str,
    animation_prompt: str,
) -> dict[str, Any]:
    text_words = _words(prompt) | _words(animation_prompt)
    draw = _drawing_features(image_bgra)

    motion_strength = 1.0 + min(0.8, draw["complexity"] / 20.0)
    if text_words & {"slow", "calm", "gentle", "subtle"}:
        motion_strength *= 0.65
    if text_words & {"fast", "speed", "rush", "energetic", "intense"}:
        motion_strength *= 1.4
    motion_strength = float(max(0.45, min(2.4, motion_strength)))

    object_hint = "default"
    if text_words & {"fish", "swim", "ocean"}:
        object_hint = "fish"
    elif text_words & {"snake", "slither", "serpent"}:
        object_hint = "snake"
    elif text_words & {"ball", "bounce", "orb", "planet"}:
        object_hint = "ball"

    if text_words & {"bounce", "bouncing", "jump"}:
        motion_pattern = "bounce"
    elif text_words & {"wave", "swim", "flow", "slither"}:
        motion_pattern = "wave"
    elif text_words & {"rotate", "spin", "orbit"}:
        motion_pattern = "orbit"
    else:
        motion_pattern = "drift"

    style_tint = (0, 0, 0)
    mood = "neutral"
    if text_words & {"ocean", "water", "ice", "night", "blue"}:
        style_tint = (30, 10, 0)
        mood = "cool"
    elif text_words & {"fire", "sunset", "warm", "red", "orange", "lava"}:
        style_tint = (0, 20, 35)
        mood = "warm"
    elif text_words & {"forest", "leaf", "nature", "green"}:
        style_tint = (0, 24, 0)
        mood = "earth"

    saturation = 1.0
    if text_words & {"neon", "vivid", "cyber", "glow"}:
        saturation = 1.35
    elif text_words & {"pastel", "soft", "mist", "fog"}:
        saturation = 0.78

    depth_strength = 0.3 + draw["filled_ratio"] * 0.9
    if studio in {"3d-model", "3d-animation"}:
        depth_strength *= 1.25
    depth_strength = float(max(0.25, min(1.8, depth_strength)))

    stroke_color = "#6FA8FF"
    if mood == "warm":
        stroke_color = "#FFB16F"
    elif mood == "earth":
        stroke_color = "#7EE47E"

    directives = AIDirectives(
        style_tint=style_tint,
        saturation=saturation,
        motion_strength=motion_strength,
        motion_pattern=motion_pattern,
        depth_strength=depth_strength,
        stroke_color=stroke_color,
        object_hint=object_hint,
        mood=mood,
    )
    return directives.to_dict()


def choose_target_studio(default_studio: str, message: str) -> str:
    words = _words(message)
    if words & {"3d", "mesh", "obj", "model"}:
        if words & {"animate", "animation", "loop", "moving", "motion"}:
            return "3d-animation"
        return "3d-model"

    if words & {"vector", "svg", "2d", "outline"}:
        return "2d-model"

    if words & {"animate", "animation", "gif", "video", "motion", "loop"}:
        return "video-animation"

    return default_studio


def build_assistant_message(*, requested_studio: str, used_studio: str, saved: dict[str, Any]) -> str:
    safe_requested = html.escape(requested_studio)
    safe_used = html.escape(used_studio)
    safe_label = html.escape(str(saved.get('module_label', used_studio)))
    if requested_studio != used_studio:
        return (
            f"I switched generation from {safe_requested} to {safe_used} based on your request and generated "
            f"{safe_label} output."
        )
    return f"Generated {safe_label} output from your latest drawing."


def _image_mask(image_bgra: np.ndarray) -> np.ndarray:
    alpha = image_bgra[:, :, 3]
    mask = (alpha > 20).astype(np.uint8) * 255
    if np.count_nonzero(mask) == 0:
        h, w = mask.shape[:2]
        mask[max(0, h // 2 - 2):min(h, h // 2 + 2), max(0, w // 2 - 2):min(w, w // 2 + 2)] = 255
    return cv2.GaussianBlur(mask, (5, 5), 0)


def _gradient_background(shape: tuple[int, int], tint: tuple[int, int, int], mood: str) -> np.ndarray:
    h, w = shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    xnorm = xx / max(1.0, float(w - 1))
    ynorm = yy / max(1.0, float(h - 1))

    base_a = np.array([10, 18, 34], dtype=np.float32)
    base_b = np.array([20, 40, 70], dtype=np.float32)
    if mood == "warm":
        base_a = np.array([24, 16, 12], dtype=np.float32)
        base_b = np.array([56, 38, 20], dtype=np.float32)
    elif mood == "earth":
        base_a = np.array([14, 22, 12], dtype=np.float32)
        base_b = np.array([36, 54, 28], dtype=np.float32)

    mix = (0.6 * xnorm + 0.4 * (1.0 - ynorm))[..., None]
    bg = base_a * (1.0 - mix) + base_b * mix

    tint_arr = np.array(tint, dtype=np.float32)
    bg = bg * 0.84 + tint_arr * 0.16
    return bg.clip(0, 255).astype(np.uint8)


def _apply_palette(image_bgr: np.ndarray, saturation: float) -> np.ndarray:
    hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[:, :, 1] = np.clip(hsv[:, :, 1] * saturation, 0, 255)
    hsv[:, :, 2] = np.clip(hsv[:, :, 2] * 1.06, 0, 255)
    return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)


def generate_image_variants(
    *,
    image_bgra: np.ndarray,
    ai_profile: dict[str, Any],
    count: int = 3,
) -> list[np.ndarray]:
    base = image_bgra[:, :, :3].copy()
    mask = _image_mask(image_bgra)
    h, w = mask.shape[:2]
    tint = tuple(int(v) for v in ai_profile.get("style_tint", (0, 0, 0)))
    mood = str(ai_profile.get("mood", "neutral"))
    saturation = float(ai_profile.get("saturation", 1.0))

    bg = _gradient_background((h, w), tint, mood)
    composed = bg.copy()
    mask3 = cv2.cvtColor(mask, cv2.COLOR_GRAY2BGR).astype(np.float32) / 255.0
    composed = (base.astype(np.float32) * mask3 + bg.astype(np.float32) * (1.0 - mask3)).astype(np.uint8)

    edge = cv2.Canny(mask, 50, 140)
    edge_col = np.zeros_like(composed)
    stroke_hex = ai_profile.get("stroke_color", "#6FA8FF")
    if isinstance(stroke_hex, str) and stroke_hex.startswith("#") and len(stroke_hex) == 7:
        r = int(stroke_hex[1:3], 16)
        g = int(stroke_hex[3:5], 16)
        b = int(stroke_hex[5:7], 16)
        edge_col[edge > 0] = (b, g, r)
    composed = cv2.addWeighted(composed, 1.0, edge_col, 0.45, 0)
    composed = _apply_palette(composed, saturation)

    variants: list[np.ndarray] = [composed]
    if count <= 1:
        return variants

    glow = cv2.GaussianBlur(composed, (0, 0), sigmaX=2.2, sigmaY=2.2)
    glow = cv2.addWeighted(composed, 0.72, glow, 0.38, 0)
    glow = _apply_palette(glow, min(1.6, saturation * 1.1))
    variants.append(glow)

    toon = cv2.bilateralFilter(composed, 7, 60, 60)
    quant = (toon // 32) * 32
    toon = cv2.addWeighted(quant, 0.9, edge_col, 0.6, 0)
    variants.append(toon)

    return variants[:count]
