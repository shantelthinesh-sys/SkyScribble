from __future__ import annotations

import cv2

from src.modules.drawing import MODULE_REGISTRY


SAVE_BUTTON = (930, 16, 126, 38)


def module_from_key(key: int) -> str | None:
    mapping = {
        ord("1"): "image_generator",
        ord("2"): "video_animation",
        ord("3"): "model_2d",
        ord("4"): "model_3d",
        ord("5"): "animation_3d",
    }
    return mapping.get(key)


def draw_dashboard(output_frame, app_state, gesture_mode: str) -> None:
    """Render a simple extendable control HUD on top of OpenCV output."""
    lines = [
        f"Current Module: {app_state.current_module_label}",
        f"Gesture Mode: {gesture_mode.upper()}",
        "Switch: 1=Image 2=Video 3=2D Model 4=3D Model 5=3D Anim",
        "Gestures: index=draw, two fingers=erase, three fingers=hold, fist=clear",
        "Actions: click SAVE button or press S, C=clear, Q=quit",
    ]

    y = 28
    for line in lines:
        cv2.putText(output_frame, line, (12, y), cv2.FONT_HERSHEY_SIMPLEX, 0.58, (240, 240, 240), 2, cv2.LINE_AA)
        y += 24

    if app_state.last_save_message:
        cv2.putText(
            output_frame,
            app_state.last_save_message,
            (12, y + 4),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.56,
            (155, 221, 255),
            2,
            cv2.LINE_AA,
        )

    x, y, w, h = SAVE_BUTTON
    cv2.rectangle(output_frame, (x, y), (x + w, y + h), (65, 120, 235), thickness=-1)
    cv2.rectangle(output_frame, (x, y), (x + w, y + h), (170, 205, 255), thickness=2)
    cv2.putText(output_frame, "SAVE", (x + 32, y + 26), cv2.FONT_HERSHEY_SIMPLEX, 0.72, (245, 250, 255), 2, cv2.LINE_AA)


def in_save_button(x: int, y: int) -> bool:
    bx, by, bw, bh = SAVE_BUTTON
    return bx <= x <= bx + bw and by <= y <= by + bh
