# pyright: reportMissingImports=false

from __future__ import annotations

from typing import Callable

from kivy.clock import Clock
from kivy.graphics import Color, Ellipse, Line
from kivy.graphics.texture import Texture
from kivy.metrics import dp
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.gridlayout import GridLayout
from kivy.uix.image import Image
from kivy.uix.label import Label
from kivy.uix.screenmanager import Screen

from src.kivy_app.modules.animated_objects import build_prebuilt_object
from src.kivy_app.modules.drawing_recognition import classify_shape
from src.kivy_app.modules.hand_tracking import HandTracker
from src.kivy_app.modules.input_path import InputPathStore
from src.kivy_app.modules.mesh_3d import extrude_2d_path
from src.kivy_app.modules.renderer_3d import run_basic_opengl_viewer
from src.kivy_app.modules.transitioning import TransitionState
from src.kivy_app.ui.components import Card, HoverButton, THEME


class AirDrawWorkspace(BoxLayout):
    """Core drawing+animation functionality, now embedded in a structured UI screen."""

    def __init__(self, on_status: Callable[[str], None] | None = None, **kwargs):
        kwargs.setdefault("orientation", "vertical")
        kwargs.setdefault("spacing", dp(8))
        super().__init__(**kwargs)

        self.on_status = on_status

        self.webcam_view = Image(allow_stretch=True, keep_ratio=False)
        self.add_widget(self.webcam_view)

        self.hud = Label(
            text="Draw with finger or mouse | idle=classify | Space reset | M 3D",
            size_hint_y=None,
            height=dp(30),
            color=THEME["muted"],
            halign="left",
            valign="middle",
        )
        self.hud.bind(size=lambda *_: setattr(self.hud, "text_size", self.hud.size))
        self.add_widget(self.hud)

        self.tracker = HandTracker(camera_index=0)
        self.path_store = InputPathStore(idle_timeout_sec=1.2)

        self.live_path: list[tuple[float, float]] = []
        self.last_smoothed_shape: list[tuple[float, float]] = []
        self.current_label: str = "fish"
        self.animated_object = None
        self.transition: TransitionState | None = None
        self._mouse_drawing = False

        self._keyboard = None
        self._bind_keyboard()

        Clock.schedule_interval(self.update, 1.0 / 30.0)

    def _bind_keyboard(self) -> None:
        if not self.get_parent_window():
            Clock.schedule_once(lambda _dt: self._bind_keyboard(), 0.1)
            return

        self._keyboard = self.get_parent_window().request_keyboard(None, self)
        if self._keyboard:
            self._keyboard.bind(on_key_down=self._on_key_down)

    def _on_key_down(self, _keyboard, keycode, _text, _modifiers):
        key = keycode[1]
        if key == "spacebar":
            self.reset_workspace()
            return True

        if key == "m" and self.last_smoothed_shape:
            mesh = extrude_2d_path(self.last_smoothed_shape, depth=24.0)
            run_basic_opengl_viewer(mesh)
            return True

        return False

    def reset_workspace(self) -> None:
        self.path_store.begin("tracked")
        self.live_path = []
        self.last_smoothed_shape = []
        self.current_label = "fish"
        self.animated_object = None
        self.transition = None
        self._set_status("Reset complete")

    def open_3d_preview(self) -> None:
        if self.last_smoothed_shape:
            mesh = extrude_2d_path(self.last_smoothed_shape, depth=24.0)
            run_basic_opengl_viewer(mesh)
            self._set_status("Opened 3D preview")
        else:
            self._set_status("Draw a shape first to open 3D preview")

    def _set_status(self, message: str) -> None:
        self.hud.text = message
        if self.on_status:
            self.on_status(message)

    def _to_kivy_coords(self, pt: tuple[int, int], frame_h: int) -> tuple[float, float]:
        return float(pt[0]), float(frame_h - pt[1])

    def _finalize_path(self, path: list[tuple[float, float]]) -> None:
        if len(path) < 6:
            return

        label, smoothed = classify_shape(path)
        self.last_smoothed_shape = smoothed
        self.current_label = label

        width = max(1.0, self.webcam_view.width)
        height = max(1.0, self.webcam_view.height)
        self.animated_object = build_prebuilt_object(label, width, height)
        self.transition = TransitionState(source_path=smoothed, duration=0.55)

        motion_text = {
            "fish": "swimming",
            "ball": "bouncing",
            "snake": "slithering",
        }.get(label, "moving")
        self._set_status(f"Classified as {label}. Starting {motion_text} animation")

    def _render_overlays(self, animated_shapes) -> None:
        self.canvas.after.clear()
        with self.canvas.after:
            if self.live_path:
                Color(1.0, 0.85, 0.25, 1.0)
                flat = [v for p in self.live_path for v in p]
                if len(flat) >= 4:
                    Line(points=flat, width=2.2)

            if self.last_smoothed_shape:
                Color(0.45, 0.75, 1.0, 0.95)
                flat = [v for p in self.last_smoothed_shape for v in p]
                if len(flat) >= 4:
                    Line(points=flat, width=2.5)

            transition_mix = None
            if self.transition is not None:
                transition_mix = min(1.0, max(0.0, self.transition.elapsed / self.transition.duration))

            if transition_mix is not None and self.transition and self.transition.source_path:
                Color(0.45, 0.75, 1.0, 1.0 - transition_mix)
                flat = [v for p in self.transition.source_path for v in p]
                if len(flat) >= 4:
                    Line(points=flat, width=2.8)

            if animated_shapes:
                alpha = transition_mix if transition_mix is not None else 1.0
                for shp in animated_shapes:
                    if shp.kind == "circle":
                        Color(0.58, 0.8, 1.0, alpha)
                        cx, cy = shp.points[0]
                        Ellipse(pos=(cx - shp.radius, cy - shp.radius), size=(shp.radius * 2, shp.radius * 2))
                    else:
                        color = (0.3, 1.0, 0.75, alpha)
                        if self.current_label == "snake":
                            color = (0.46, 0.92, 0.62, alpha)
                        if self.current_label == "ball":
                            color = (0.88, 0.83, 0.45, alpha)
                        Color(*color)
                        flat = [v for p in shp.points for v in p]
                        if len(flat) >= 4:
                            Line(points=flat, width=3.2 if self.current_label != "snake" else 4.0)

    def _blit_frame(self, frame_bgr) -> None:
        frame_rgb = frame_bgr[:, :, ::-1]
        h, w = frame_rgb.shape[:2]
        texture = Texture.create(size=(w, h), colorfmt="rgb")
        texture.blit_buffer(frame_rgb.tobytes(), colorfmt="rgb", bufferfmt="ubyte")
        texture.flip_vertical()
        self.webcam_view.texture = texture

    def on_touch_down(self, touch):
        if not self.webcam_view.collide_point(*touch.pos):
            return super().on_touch_down(touch)

        self._mouse_drawing = True
        self.path_store.begin("mouse")
        local = self.webcam_view.to_widget(*touch.pos)
        self.path_store.add((local[0], local[1]))
        self.live_path = self.path_store.path[:]
        return True

    def on_touch_move(self, touch):
        if not self._mouse_drawing:
            return super().on_touch_move(touch)
        local = self.webcam_view.to_widget(*touch.pos)
        self.path_store.add((local[0], local[1]))
        self.live_path = self.path_store.path[:]
        return True

    def on_touch_up(self, touch):
        if not self._mouse_drawing:
            return super().on_touch_up(touch)
        self._mouse_drawing = False
        final_path = self.path_store.take()
        self.live_path = []
        self._finalize_path(final_path)
        return True

    def update(self, dt: float) -> None:
        result = self.tracker.read()
        if result.frame_bgr is None:
            return

        frame_h, frame_w = result.frame_bgr.shape[:2]
        # Tracked-point drawing only when mouse drawing is not active.
        if not self._mouse_drawing:
            if self.path_store.source != "tracked":
                self.path_store.begin("tracked")

            if result.index_tip is not None:
                tip_kivy = self._to_kivy_coords(result.index_tip, frame_h)
                self.path_store.add(tip_kivy)
                self.live_path = self.path_store.path[:]
            elif self.path_store.should_finalize_from_idle():
                final_path = self.path_store.take()
                self.live_path = []
                self._finalize_path(final_path)

        animated = None
        if self.animated_object is not None:
            self.animated_object.width = frame_w
            self.animated_object.height = frame_h
            animated = self.animated_object.update(dt)

        if self.transition is not None:
            self.transition.step(dt)
            if self.transition.done:
                self.transition = None

        self._blit_frame(result.frame_bgr)
        self._render_overlays(animated)

    def close(self) -> None:
        self.tracker.close()


class DashboardScreen(Screen):
    def __init__(self, go_create: Callable[[], None], **kwargs):
        super().__init__(**kwargs)
        root = BoxLayout(orientation="vertical", padding=dp(16), spacing=dp(12))

        top = GridLayout(cols=2, spacing=dp(12), size_hint_y=None, height=dp(180))

        quick = Card()
        quick.add_widget(Label(text="[b]Quick Actions[/b]", markup=True, color=THEME["text"], halign="left", valign="middle"))
        quick_btns = BoxLayout(orientation="horizontal", spacing=dp(8), size_hint_y=None, height=dp(42))
        quick_btns.add_widget(HoverButton(text="Create Drawing", kind="primary", on_release=lambda *_: go_create()))
        quick_btns.add_widget(HoverButton(text="Start Air Draw", on_release=lambda *_: go_create()))
        quick.add_widget(quick_btns)

        activity = Card()
        activity.add_widget(Label(text="[b]Recent Activity[/b]", markup=True, color=THEME["text"], halign="left", valign="middle"))
        activity.add_widget(Label(text="- Workspace opened\n- Gesture tracking active\n- Export pipeline ready", color=THEME["muted"], halign="left", valign="top"))

        top.add_widget(quick)
        top.add_widget(activity)

        preview = Card(size_hint_y=1)
        preview.add_widget(Label(text="[b]Preview Panel[/b]", markup=True, color=THEME["text"], halign="left", valign="middle"))
        preview.add_widget(Label(text="Recent drawing previews and generated outputs appear here.", color=THEME["muted"], halign="left", valign="top"))

        root.add_widget(top)
        root.add_widget(preview)
        self.add_widget(root)


class CreateScreen(Screen):
    def __init__(self, on_status: Callable[[str], None], **kwargs):
        super().__init__(**kwargs)

        root = BoxLayout(orientation="vertical", padding=dp(16), spacing=dp(8))
        toolbar = BoxLayout(orientation="horizontal", spacing=dp(8), size_hint_y=None, height=dp(42))

        self.workspace = AirDrawWorkspace(on_status=on_status)

        toolbar.add_widget(HoverButton(text="Reset", on_release=lambda *_: self.workspace.reset_workspace()))
        toolbar.add_widget(HoverButton(text="3D Preview", on_release=lambda *_: self.workspace.open_3d_preview()))

        root.add_widget(toolbar)
        root.add_widget(self.workspace)
        self.add_widget(root)


class GalleryScreen(Screen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        root = BoxLayout(orientation="vertical", padding=dp(16), spacing=dp(12))
        card = Card()
        card.add_widget(Label(text="[b]Gallery[/b]", markup=True, color=THEME["text"], halign="left", valign="middle"))
        card.add_widget(Label(text="Saved outputs (.png, .gif, .svg, .obj) are available in the outputs folders.", color=THEME["muted"], halign="left", valign="top"))
        root.add_widget(card)
        self.add_widget(root)


class SettingsScreen(Screen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        root = BoxLayout(orientation="vertical", padding=dp(16), spacing=dp(12))
        card = Card()
        card.add_widget(Label(text="[b]Settings[/b]", markup=True, color=THEME["text"], halign="left", valign="middle"))
        card.add_widget(Label(text="Theme and model tuning controls can be placed here.", color=THEME["muted"], halign="left", valign="top"))
        root.add_widget(card)
        self.add_widget(root)
