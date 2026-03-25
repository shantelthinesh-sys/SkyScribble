# pyright: reportMissingImports=false

from __future__ import annotations

from kivy.app import App
from kivy.animation import Animation
from kivy.graphics import Color, Rectangle
from kivy.metrics import dp
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.screenmanager import FadeTransition, ScreenManager, SlideTransition

from src.kivy_app.ui.components import Card, HoverButton, THEME
from src.kivy_app.ui.screens import CreateScreen, DashboardScreen, GalleryScreen, SettingsScreen


class HeaderBar(BoxLayout):
    """Top application header with title and profile/settings actions."""

    def __init__(self, **kwargs):
        kwargs.setdefault("orientation", "horizontal")
        kwargs.setdefault("size_hint_y", None)
        kwargs.setdefault("height", dp(64))
        kwargs.setdefault("padding", (dp(16), dp(12), dp(16), dp(12)))
        kwargs.setdefault("spacing", dp(8))
        super().__init__(**kwargs)

        with self.canvas.before:
            Color(*THEME["card"])
            self._bg = Rectangle()
        self.bind(pos=self._sync_bg, size=self._sync_bg)

        title = Label(
            text="[b]SkyScribble Studio[/b]",
            markup=True,
            color=THEME["text"],
            font_size="22sp",
            halign="left",
            valign="middle",
        )
        title.bind(size=lambda *_: setattr(title, "text_size", title.size))

        subtitle = Label(
            text="Creative Dashboard",
            color=THEME["muted"],
            font_size="14sp",
            halign="left",
            valign="middle",
            size_hint_x=None,
            width=dp(220),
        )
        subtitle.bind(size=lambda *_: setattr(subtitle, "text_size", subtitle.size))

        right = BoxLayout(orientation="horizontal", size_hint_x=None, width=dp(136), spacing=dp(8))
        right.add_widget(HoverButton(text="⚙", size_hint_x=None, width=dp(58)))
        right.add_widget(HoverButton(text="👤", size_hint_x=None, width=dp(58)))

        self.add_widget(title)
        self.add_widget(subtitle)
        self.add_widget(right)

    def _sync_bg(self, *_args):
        self._bg.pos = self.pos
        self._bg.size = self.size


class SidebarNav(Card):
    """Left navigation rail with icon-based entries."""

    def __init__(self, on_select, **kwargs):
        kwargs.setdefault("size_hint_x", None)
        kwargs.setdefault("width", dp(230))
        kwargs.setdefault("padding", dp(12))
        kwargs.setdefault("spacing", dp(8))
        super().__init__(**kwargs)

        self.on_select = on_select
        self.buttons: dict[str, HoverButton] = {}

        nav_items = [
            ("dashboard", "⌂  Dashboard"),
            ("create", "✎  Create"),
            ("gallery", "▦  Gallery"),
            ("settings", "⚙  Settings"),
        ]

        for screen_name, label in nav_items:
            btn = HoverButton(text=label)
            btn.bind(on_release=lambda _btn, n=screen_name: self._select(n))
            self.add_widget(btn)
            self.buttons[screen_name] = btn

        self._select("dashboard")

    def _select(self, screen_name: str):
        for name, btn in self.buttons.items():
            btn.kind = "primary" if name == screen_name else "secondary"
            if name == screen_name:
                btn.background_color = (58 / 255, 108 / 255, 185 / 255, 1)
            else:
                btn.background_color = THEME["card"]

        self.on_select(screen_name)


class MainRoot(BoxLayout):
    """Structured app shell: header + sidebar + central screen manager."""

    def __init__(self, **kwargs):
        kwargs.setdefault("orientation", "vertical")
        kwargs.setdefault("spacing", dp(8))
        kwargs.setdefault("padding", dp(8))
        super().__init__(**kwargs)

        with self.canvas.before:
            Color(*THEME["bg"])
            self._bg = Rectangle()
        self.bind(pos=self._sync_bg, size=self._sync_bg)

        self.header = HeaderBar()
        self.add_widget(self.header)

        body = BoxLayout(orientation="horizontal", spacing=dp(8))

        self.screen_manager = ScreenManager(transition=SlideTransition(duration=0.18))
        self.status_bar = Label(
            text="Welcome to SkyScribble",
            color=THEME["muted"],
            size_hint_y=None,
            height=dp(24),
            halign="left",
            valign="middle",
        )
        self.status_bar.bind(size=lambda *_: setattr(self.status_bar, "text_size", self.status_bar.size))

        content_wrap = BoxLayout(orientation="vertical", spacing=dp(8))
        content_wrap.add_widget(self.screen_manager)
        content_wrap.add_widget(self.status_bar)

        self.sidebar = SidebarNav(on_select=self.switch_screen)

        body.add_widget(self.sidebar)
        body.add_widget(content_wrap)

        self.add_widget(body)

        self._build_screens()

    def _build_screens(self) -> None:
        dashboard = DashboardScreen(name="dashboard", go_create=lambda: self.switch_screen("create"))
        create = CreateScreen(name="create", on_status=self._set_status)
        gallery = GalleryScreen(name="gallery")
        settings = SettingsScreen(name="settings")

        self.screen_manager.add_widget(dashboard)
        self.screen_manager.add_widget(create)
        self.screen_manager.add_widget(gallery)
        self.screen_manager.add_widget(settings)

    def switch_screen(self, name: str) -> None:
        if name not in {"dashboard", "create", "gallery", "settings"}:
            return

        current = self.screen_manager.current or "dashboard"
        order = ["dashboard", "create", "gallery", "settings"]
        direction = "left" if order.index(name) >= order.index(current) else "right"

        if current == name:
            return

        self.screen_manager.transition = SlideTransition(direction=direction, duration=0.2)

        # Subtle content fade to polish screen switches.
        anim_out = Animation(opacity=0.96, duration=0.08)
        anim_in = Animation(opacity=1.0, duration=0.12)
        anim_out.bind(on_complete=lambda *_: setattr(self.screen_manager, "current", name))
        anim_out.start(self.screen_manager)
        anim_in.start(self.screen_manager)

        self._set_status(f"Opened {name.title()}")

    def _set_status(self, text: str) -> None:
        self.status_bar.text = text

    def _sync_bg(self, *_args):
        self._bg.pos = self.pos
        self._bg.size = self.size

    def close_resources(self) -> None:
        create = self.screen_manager.get_screen("create")
        if hasattr(create, "workspace"):
            create.workspace.close()


class AirDrawKivyApp(App):
    def build(self):
        self.title = "SkyScribble Studio"
        return MainRoot()

    def on_stop(self):
        root = self.root
        if root and hasattr(root, "close_resources"):
            root.close_resources()


if __name__ == "__main__":
    AirDrawKivyApp().run()
