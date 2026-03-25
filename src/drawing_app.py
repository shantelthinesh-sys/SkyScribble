import cv2
import numpy as np

from components.hand_tracker import HandTracker


class SkyScribbleApp:
    def __init__(self, camera_index=0):
        self.camera_index = camera_index
        self.draw_color = (0, 255, 255)
        self.brush_thickness = 6
        self.eraser_thickness = 28
        self.prev_x = None
        self.prev_y = None

    def _overlay_canvas(self, frame, canvas):
        gray_canvas = cv2.cvtColor(canvas, cv2.COLOR_BGR2GRAY)
        _, mask = cv2.threshold(gray_canvas, 10, 255, cv2.THRESH_BINARY)
        mask_inv = cv2.bitwise_not(mask)

        frame_bg = cv2.bitwise_and(frame, frame, mask=mask_inv)
        canvas_fg = cv2.bitwise_and(canvas, canvas, mask=mask)
        return cv2.add(frame_bg, canvas_fg)

    def _draw_hud(self, output, mode_text):
        cv2.putText(
            output,
            f"Mode: {mode_text}",
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.9,
            (255, 255, 255),
            2,
            cv2.LINE_AA,
        )
        cv2.putText(
            output,
            "Keys: c=clear, q=quit",
            (10, 62),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.65,
            (230, 230, 230),
            2,
            cv2.LINE_AA,
        )

    def run(self):
        cap = cv2.VideoCapture(self.camera_index)
        if not cap.isOpened():
            raise RuntimeError("Could not open webcam.")

        ok, frame = cap.read()
        if not ok:
            cap.release()
            raise RuntimeError("Could not read initial frame from webcam.")

        h, w = frame.shape[:2]
        canvas = np.zeros((h, w, 3), dtype=np.uint8)

        tracker = HandTracker()

        try:
            while True:
                ok, frame = cap.read()
                if not ok:
                    break

                frame = cv2.flip(frame, 1)
                analysis = tracker.process(frame)
                mode = analysis["mode"]
                point = analysis["point"]

                if mode == "clear":
                    canvas[:] = 0
                    self.prev_x, self.prev_y = None, None
                    mode_text = "Clear (Fist)"
                elif mode == "draw" and point is not None:
                    mode_text = "Draw"
                    x, y = point
                    if self.prev_x is None or self.prev_y is None:
                        self.prev_x, self.prev_y = x, y
                    cv2.line(
                        canvas,
                        (self.prev_x, self.prev_y),
                        (x, y),
                        self.draw_color,
                        self.brush_thickness,
                    )
                    self.prev_x, self.prev_y = x, y
                elif mode == "erase" and point is not None:
                    mode_text = "Erase"
                    x, y = point
                    if self.prev_x is None or self.prev_y is None:
                        self.prev_x, self.prev_y = x, y
                    cv2.line(
                        canvas,
                        (self.prev_x, self.prev_y),
                        (x, y),
                        (0, 0, 0),
                        self.eraser_thickness,
                    )
                    self.prev_x, self.prev_y = x, y
                elif mode == "move":
                    self.prev_x, self.prev_y = None, None
                    mode_text = "Move"
                else:
                    self.prev_x, self.prev_y = None, None
                    mode_text = "Idle"

                output = self._overlay_canvas(analysis["frame"], canvas)
                self._draw_hud(output, mode_text)
                cv2.imshow("SkyScribble", output)

                key = cv2.waitKey(1) & 0xFF
                if key == ord("q"):
                    break
                if key == ord("c"):
                    canvas[:] = 0
        finally:
            tracker.close()
            cap.release()
            cv2.destroyAllWindows()
