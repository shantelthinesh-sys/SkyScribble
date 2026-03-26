from pathlib import Path

from flask import Flask, jsonify, request, send_file, send_from_directory, render_template

from src.ai.studio_ai import build_assistant_message, choose_target_studio
from src.studio_pipeline import STUDIO_LABELS, save_output
from src.models import db, User, Assignment, Submission
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, date


def create_web_app():
    project_root = Path(__file__).resolve().parents[1]
    assets_dir = project_root / "assets"
    templates_dir = project_root / "templates"

    app = Flask(__name__, static_folder=str(assets_dir), static_url_path="/assets", template_folder=str(templates_dir))
    app.config['SECRET_KEY'] = 'skyscribble_dev_key'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///skyscribble.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)

    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'login_page'

    with app.app_context():
        db.create_all()

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    assets_dir = project_root / "assets"
    templates_dir = project_root / "templates"

    app = Flask(__name__, static_folder=str(assets_dir), static_url_path="/assets", template_folder=str(templates_dir))
    app.config['SECRET_KEY'] = 'skyscribble_dev_key'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///skyscribble.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)

    login_manager = LoginManager()
    login_manager.init_app(app)
login_manager.login_view = 'login_page'

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    outputs_dir = project_root / "outputs"



    @app.errorhandler(404)
    def page_not_found(e):
        return render_template("404.html"), 404

    @app.errorhandler(500)
    def internal_error(e):
        import traceback
        tb = traceback.format_exc()
        print("500 ERROR:", tb, flush=True)
        return jsonify({"error": "Internal server error", "detail": tb}), 500

    @app.get("/favicon.ico")
    def favicon():
        return "", 204

    @app.get("/")
    def index():
        return send_file(assets_dir / "index.html")

    @app.get("/login")
    def login_page():
        return send_file(assets_dir / "login.html")

    @app.get("/signup")
    def signup_page():
        return send_file(assets_dir / "signup.html")


    @app.get("/dashboard")
    def dashboard_page():
        return render_template("dashboard.html")

    @app.get("/student")
    def student_dashboard_page():
        return render_template("student_dashboard.html")

    @app.get("/student/assignments")
    def student_assignments_page():
        return render_template("student_assignments_stub.html")

    @app.get("/student/notes")
    def student_notes_page():
        return render_template("student_notes_stub.html")

    @app.get("/student/gallery")
    def student_gallery_page():
        return render_template("student_gallery_stub.html")

    @app.get("/student/progress")
    def student_progress_page():
        return render_template("student_progress_stub.html")

    @app.get("/classes")
    def classes_page():
        return render_template("classes.html")

    @app.get("/assignments")
    def assignments_page():
        return render_template("assignments.html")

    @app.get("/annotation")
    def annotation_page():
        return render_template("annotation.html")

    @app.get("/resources")
    def resources_page():
        return render_template("resources.html")

    @app.get("/draw")
    def draw_page():
        return send_file(assets_dir / "draw.html")

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "skyscribble"})

    @app.get("/api/studios")
    def studios():
        return jsonify(
            {
                "studios": [
                    {"slug": slug, "label": label}
                    for slug, label in STUDIO_LABELS.items()
                ]
            }
        )

    @app.post("/api/save-drawing")
    def save_drawing():
        payload = request.get_json(silent=True) or {}
        image_data = payload.get("image_data")
        studio = payload.get("studio", "image-generator")
        title = payload.get("title", "untitled")
        prompt = payload.get("prompt", "")
        animation_prompt = payload.get("animation_prompt", "")
        user_name = payload.get("user_name", "guest")

        if not image_data:
            return jsonify({"error": "image_data is required"}), 400

        try:
            saved = save_output(
                drawing_data=image_data,
                current_module=studio,
                user_name=user_name,
                title=title,
                prompt=prompt,
                animation_prompt=animation_prompt,
            )
            return jsonify({"status": "ok", "saved": saved})
        except Exception as exc:
            return jsonify({"error": str(exc)}), 500

    @app.post("/api/ai-chat")
    def ai_chat():
        payload = request.get_json(silent=True) or {}
        image_data = payload.get("image_data")
        studio = payload.get("studio", "image-generator")
        message = payload.get("message", "")
        prompt = payload.get("prompt", "")
        user_name = payload.get("user_name", "guest")

        if not image_data:
            return jsonify({"error": "image_data is required"}), 400

        requested_studio = studio
        target_studio = choose_target_studio(studio, message)
        title = (prompt or message or "ai-generated").strip()[:80] or "ai-generated"

        try:
            saved = save_output(
                drawing_data=image_data,
                current_module=target_studio,
                user_name=user_name,
                title=title,
                prompt=prompt,
                animation_prompt=message,
            )
            reply = build_assistant_message(
                requested_studio=requested_studio,
                used_studio=target_studio,
                saved=saved,
            )
            return jsonify(
                {
                    "status": "ok",
                    "reply": reply,
                    "used_studio": target_studio,
                    "saved": saved,
                }
            )
        except Exception as exc:
            return jsonify({"error": str(exc)}), 500

    @app.get("/outputs/<path:filename>")
    def get_output(filename: str):
        return send_from_directory(str(outputs_dir), filename, as_attachment=False)

    return app
