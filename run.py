import sys
import traceback

print("Python:", sys.version)
print("Starting SkyScribble...")

try:
    from src.web_app import create_web_app
    app = create_web_app()
    print("App created OK")
    print("Open browser: http://127.0.0.1:5000")
    app.run(host='127.0.0.1', port=5000, debug=False, use_reloader=False)
except Exception:
    print("FATAL ERROR:")
    traceback.print_exc()
    input("Press Enter to exit...")
