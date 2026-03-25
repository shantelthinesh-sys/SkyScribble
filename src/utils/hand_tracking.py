from __future__ import annotations

from dataclasses import dataclass

import cv2
from mediapipe.solutions import hands as mp_hands
from mediapipe.solutions import drawing_utils as mp_drawing


@dataclass
class HandResult:
    found_hand: bool
    mode: str
    point: tuple[int, int] | None
    frame: any


class HandTrackingEngine:
    """MediaPipe wrapper that classifies draw/erase/clear/hold/move gestures."""

    def __init__(self) -> None:
        self._mp_hands = mp_hands
        self._mp_draw = mp_drawing
        self._hands = self._mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            model_complexity=1,
            min_detection_confidence=0.6,
            min_tracking_confidence=0.6,
        )

    def _finger_state(self, landmarks, width: int, height: int) -> dict[str, bool]:
        pts = [(int(p.x * width), int(p.y * height)) for p in landmarks.landmark]
        return {
            "thumb": pts[4][0] < pts[3][0],
            "index": pts[8][1] < pts[6][1],
            "middle": pts[12][1] < pts[10][1],
            "ring": pts[16][1] < pts[14][1],
            "pinky": pts[20][1] < pts[18][1],
        }

    def _mode_from_state(self, state: dict[str, bool]) -> str:
        extended_count = sum([state["index"], state["middle"], state["ring"], state["pinky"]])

        if not state["index"] and not state["middle"] and not state["ring"] and not state["pinky"]:
            return "clear"

        # Three raised fingers pauses pen input without clearing existing drawing.
        if extended_count == 3:
            return "hold"

        if state["index"] and state["middle"]:
            return "erase"
        if state["index"] and not state["middle"]:
            return "draw"
        return "move"

    def process(self, frame):
        h, w = frame.shape[:2]
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = self._hands.process(rgb)

        if not result.multi_hand_landmarks:
            return HandResult(False, "idle", None, frame)

        hand = result.multi_hand_landmarks[0]
        self._mp_draw.draw_landmarks(frame, hand, self._mp_hands.HAND_CONNECTIONS)

        state = self._finger_state(hand, w, h)
        mode = self._mode_from_state(state)

        idx_tip = hand.landmark[8]
        point = (int(idx_tip.x * w), int(idx_tip.y * h))
        cv2.circle(frame, point, 6, (0, 255, 0), -1)
        return HandResult(True, mode, point, frame)

    def close(self) -> None:
        self._hands.close()
