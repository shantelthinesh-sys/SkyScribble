from __future__ import annotations

from dataclasses import dataclass

import cv2
from mediapipe.solutions import hands as mp_hands
from mediapipe.solutions import drawing_utils as mp_drawing


@dataclass
class HandFrameResult:
    frame_bgr: any
    found_hand: bool
    index_tip: tuple[int, int] | None


class HandTracker:
    """OpenCV + MediaPipe hand tracking focused on index fingertip."""

    def __init__(
        self,
        camera_index: int = 0,
        max_num_hands: int = 1,
        min_detection_confidence: float = 0.6,
        min_tracking_confidence: float = 0.6,
    ) -> None:
        self.cap = cv2.VideoCapture(camera_index)
        if not self.cap.isOpened():
            raise RuntimeError("Could not open webcam")

        self._mp_hands = mp_hands
        self._mp_draw = mp_drawing
        self._hands = self._mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=max_num_hands,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
            model_complexity=0,
        )

    def read(self) -> HandFrameResult:
        ok, frame = self.cap.read()
        if not ok:
            return HandFrameResult(frame_bgr=None, found_hand=False, index_tip=None)

        frame = cv2.flip(frame, 1)
        h, w = frame.shape[:2]
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = self._hands.process(rgb)

        if not result.multi_hand_landmarks:
            return HandFrameResult(frame_bgr=frame, found_hand=False, index_tip=None)

        hand = result.multi_hand_landmarks[0]
        self._mp_draw.draw_landmarks(frame, hand, self._mp_hands.HAND_CONNECTIONS)

        tip = hand.landmark[8]
        x, y = int(tip.x * w), int(tip.y * h)
        cv2.circle(frame, (x, y), 7, (0, 255, 255), -1)

        return HandFrameResult(frame_bgr=frame, found_hand=True, index_tip=(x, y))

    def close(self) -> None:
        self._hands.close()
        self.cap.release()
