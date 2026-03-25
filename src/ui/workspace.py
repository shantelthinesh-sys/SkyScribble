from __future__ import annotations

from pathlib import Path

import cv2

from src.modules.drawing import GlobalAppState
from src.ui.dashboard import draw_dashboard, in_save_button, module_from_key
from src.utils.canvas import overlay_canvas, render_drawing
from src.utils.file_manager import CentralizedSaveManager
from src.utils.hand_tracking import HandTrackingEngine


class CreativeWorkspace:
    """Unified workspace that reuses one drawing input across all modules."""

    def __init__(self, camera_index: int = 0) -> None:
        self.camera_index = camera_index
        self.window_name = "SkyScribble Unified Workspace"
        self.state = GlobalAppState()
        self.save_manager = CentralizedSaveManager(Path(__file__).resolve().parents[2])

        self.draw_color = (0, 255, 255)
        self.brush_size = 6
        self.eraser_size = 20
        self._pending_save_click = False

    def _on_mouse(self, event, x, y, _flags, _param):
        if event == cv2.EVENT_LBUTTONDOWN and in_save_button(x, y):
            self._pending_save_click = True

    def _maybe_start_stroke(self, mode: str) -> None:
        if self.state.drawing.active_stroke is not None:
            return

        if mode == "draw":
            self.state.drawing.begin_stroke(mode="draw", color=self.draw_color, thickness=self.brush_size)
        elif mode == "erase":
            self.state.drawing.begin_stroke(mode="erase", color=(0, 0, 0), thickness=self.eraser_size)

    def _save_current(self, canvas) -> None:
        saved = self.save_manager.save(self.state, canvas)
        self.state.last_save_message = saved["message"]

    def run(self) -> None:
        cap = cv2.VideoCapture(self.camera_index)
        if not cap.isOpened():
            raise RuntimeError("Could not open webcam.")

        tracker = HandTrackingEngine()

        cv2.namedWindow(self.window_name)
        cv2.setMouseCallback(self.window_name, self._on_mouse)

        try:
            while True:
                ok, frame = cap.read()
                if not ok:
                    break

                frame = cv2.flip(frame, 1)
                hand = tracker.process(frame)

                mode = hand.mode
                point = hand.point

                if mode == "clear":
                    self.state.drawing.clear()
                elif mode in {"draw", "erase"} and point is not None:
                    self._maybe_start_stroke(mode)
                    self.state.drawing.add_point(point[0], point[1])
                elif mode == "hold":
                    self.state.drawing.end_stroke()
                else:
                    self.state.drawing.end_stroke()

                h, w = frame.shape[:2]
                canvas = render_drawing(self.state.drawing, h, w)

                if self._pending_save_click:
                    self._save_current(canvas)
                    self._pending_save_click = False

                output = overlay_canvas(hand.frame, canvas)
                draw_dashboard(output, self.state, mode)
                cv2.imshow(self.window_name, output)

                key = cv2.waitKey(1) & 0xFF
                if key == ord("q"):
                    break
                if key == ord("c"):
                    self.state.drawing.clear()
                if key == ord("s"):
                    self._save_current(canvas)

                selected_module = module_from_key(key)
                if selected_module is not None:
                    self.state.current_module = selected_module
                    self.state.last_save_message = f"Module switched to: {self.state.current_module_label}"
        finally:
            tracker.close()
            cap.release()
            cv2.destroyAllWindows()
