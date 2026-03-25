# pyright: reportMissingImports=false

from __future__ import annotations

from kivy.core.window import Window
from kivy.graphics import Color, RoundedRectangle
from kivy.metrics import dp
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.uix.label import Label


# Dark production design system.
THEME = {
    "bg": (5 / 255, 7 / 255, 13 / 255, 1),
    "card": (10 / 255, 18 / 255, 34 / 255, 1),
    "accent": (111 / 255, 168 / 255, 1, 1),
    "text": (233 / 255, 242 / 255, 1, 1),
    "muted": (145 / 255, 168 / 255, 205 / 255, 1),
    "line": (44 / 255, 70 / 255, 108 / 255, 1),
}


class Card(BoxLayout):
    """Rounded card container used across dashboard sections."""

    def __init__(self, **kwargs):
        kwargs.setdefault("padding", dp(16))
        kwargs.setdefault("spacing", dp(10))
        kwargs.setdefault("orientation", "vertical")
        super().__init__(**kwargs)

        with self.canvas.before:
            Color(*THEME["card"])
            self._bg = RoundedRectangle(radius=[dp(16)])
            Color(*THEME["line"])
            self._border = RoundedRectangle(radius=[dp(16)])

        self.bind(pos=self._refresh_canvas, size=self._refresh_canvas)

    def _refresh_canvas(self, *_args):
        self._bg.pos = self.pos
        self._bg.size = self.size
        # Border as slight inset to avoid clipping.
        self._border.pos = (self.x + 1, self.y + 1)
        self._border.size = (max(0, self.width - 2), max(0, self.height - 2))


class HoverButton(Button):
    """Rounded button with subtle hover and press state transitions."""

    def __init__(self, kind: str = "secondary", **kwargs):
        kwargs.setdefault("background_normal", "")
        kwargs.setdefault("background_down", "")
        kwargs.setdefault("border", (0, 0, 0, 0))
        kwargs.setdefault("color", THEME["text"])
        kwargs.setdefault("font_size", "14sp")
        kwargs.setdefault("size_hint_y", None)
        kwargs.setdefault("height", dp(40))
        super().__init__(**kwargs)

        self.kind = kind
        self._hovered = False

        self._normal = THEME["card"]
        self._hover = (17 / 255, 29 / 255, 52 / 255, 1)
        self._down = (21 / 255, 37 / 255, 67 / 255, 1)
        if kind == "primary":
            self._normal = (58 / 255, 108 / 255, 185 / 255, 1)
            self._hover = (72 / 255, 123 / 255, 205 / 255, 1)
            self._down = (52 / 255, 97 / 255, 165 / 255, 1)

        self.background_color = self._normal
        with self.canvas.before:
            Color(*THEME["line"])
            self._border = RoundedRectangle(radius=[dp(12)])
        self.bind(pos=self._update_border, size=self._update_border)

        Window.bind(mouse_pos=self._on_mouse_pos)
        self.bind(state=self._on_state)

    def _update_border(self, *_args):
        self._border.pos = self.pos
        self._border.size = self.size

    def _on_state(self, *_args):
        if self.state == "down":
            self.background_color = self._down
        elif self._hovered:
            self.background_color = self._hover
        else:
            self.background_color = self._normal

    def _on_mouse_pos(self, _window, pos):
        if not self.get_root_window():
            return
        inside = self.collide_point(*self.to_widget(*pos))
        if inside == self._hovered:
            return
        self._hovered = inside
        if self.state == "normal":
            self.background_color = self._hover if inside else self._normal


def make_title(text: str) -> Label:
    return Label(
        text=text,
        size_hint_y=None,
        height=dp(30),
        halign="left",
        valign="middle",
        color=THEME["text"],
        font_size="22sp",
        bold=True,
        text_size=(None, None),
    )


def make_subtitle(text: str) -> Label:
    return Label(
        text=text,
        size_hint_y=None,
        height=dp(22),
        halign="left",
        valign="middle",
        color=THEME["muted"],
        font_size="14sp",
        text_size=(None, None),
    )
