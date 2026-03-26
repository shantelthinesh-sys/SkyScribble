import argparse

from src.web_app import create_web_app


def main():
    parser = argparse.ArgumentParser(description="SkyScribble app launcher")
    parser.add_argument(
        "--mode",
        choices=["draw", "web", "kivy"],
        default="draw",
        help="Run desktop drawing mode, Flask web mode, or Kivy air-draw mode",
    )
    parser.add_argument("--host", default="127.0.0.1", help="Web server host")
    parser.add_argument("--port", type=int, default=5000, help="Web server port")
    args = parser.parse_args()

    if args.mode == "draw":
        from src.ui.workspace import CreativeWorkspace
        app = CreativeWorkspace()
        app.run()
        return

    if args.mode == "kivy":
        from src.kivy_app.main_kivy import AirDrawKivyApp

        AirDrawKivyApp().run()
        return

    web_app = create_web_app()
    web_app.run(host=args.host, port=args.port, debug=True)


if __name__ == "__main__":
    main()
