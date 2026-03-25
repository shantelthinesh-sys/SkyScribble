import cv2
from mediapipe.solutions import hands as mp_hands
from mediapipe.solutions import drawing_utils as mp_drawing

from utils.gestures import fingers_up, get_mode


class HandTracker:
    def __init__(
        self,
        max_num_hands=1,
        min_detection_confidence=0.6,
        min_tracking_confidence=0.6,
        model_complexity=1,
    ):
        self._mp_hands = mp_hands
        self._mp_draw = mp_drawing
        self._hands = self._mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=max_num_hands,
            model_complexity=model_complexity,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
        )

    def process(self, frame):
        """
        Process a BGR frame and return analysis details.

        Returns a dict with keys:
        - found_hand: bool
        - mode: one of clear/draw/erase/move/idle
        - point: (x, y) index fingertip pixel location or None
        - frame: annotated frame (same array mutated)
        """
        h, w = frame.shape[:2]
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = self._hands.process(rgb)

        if not result.multi_hand_landmarks:
            return {
                "found_hand": False,
                "mode": "idle",
                "point": None,
                "frame": frame,
            }

        hand_landmarks = result.multi_hand_landmarks[0]
        self._mp_draw.draw_landmarks(
            frame,
            hand_landmarks,
            self._mp_hands.HAND_CONNECTIONS,
        )

        state = fingers_up(hand_landmarks, w, h)
        mode = get_mode(state)

        idx_tip = hand_landmarks.landmark[8]
        x, y = int(idx_tip.x * w), int(idx_tip.y * h)

        cv2.circle(frame, (x, y), 8, (0, 255, 0), -1)

        return {
            "found_hand": True,
            "mode": mode,
            "point": (x, y),
            "frame": frame,
        }

    def close(self):
        self._hands.close()
