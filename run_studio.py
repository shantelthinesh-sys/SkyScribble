from flask import Flask, send_file, render_template, send_from_directory, request, jsonify
from pathlib import Path
import base64
import time
import traceback

import cv2
import numpy as np

app = Flask(__name__, static_folder='assets', static_url_path='/assets', template_folder='templates')
ROOT = Path(__file__).parent


# ── Page routes ───────────────────────────────────────────────────────────────

@app.route('/')
def index():
    return send_file(str(ROOT / 'assets' / 'index.html'))

@app.route('/login')
def login():
    return send_file(str(ROOT / 'assets' / 'login.html'))

@app.route('/signup')
def signup():
    return send_file(str(ROOT / 'assets' / 'signup.html'))

@app.route('/draw')
def draw():
    return send_file(str(ROOT / 'assets' / 'draw.html'))

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/student')
def student():
    return render_template('student_dashboard.html')

@app.route('/classes')
def classes():
    return render_template('classes.html')

@app.route('/assignments')
def assignments():
    return render_template('assignments.html')

@app.route('/annotation')
def annotation():
    return render_template('annotation.html')

@app.route('/resources')
def resources():
    return render_template('resources.html')

@app.route('/favicon.ico')
def favicon():
    return '', 204


# ── API routes ────────────────────────────────────────────────────────────────

@app.route('/api/health')
def health():
    return jsonify({'status': 'ok', 'service': 'skyscribble'})

@app.route('/api/studios')
def studios():
    return jsonify({'studios': [
        {'slug': 'image-generator',  'label': 'Image Generator'},
        {'slug': 'video-animation',  'label': 'Video Animation'},
        {'slug': '2d-model',         'label': '2D Model'},
        {'slug': '3d-model',         'label': '3D Model'},
        {'slug': '3d-animation',     'label': '3D Animation'},
    ]})

@app.route('/api/save-drawing', methods=['POST'])
def save_drawing():
    data = request.get_json(silent=True) or {}
    image_data: str = data.get('image_data', '')
    studio: str     = data.get('studio', 'image-generator')
    title: str      = data.get('title', 'untitled')
    user_name: str  = data.get('user_name', 'guest')

    if not image_data:
        return jsonify({'status': 'error', 'message': 'No image data'}), 400

    # Decode base64 image
    try:
        raw = image_data.split(',')[1] if image_data.startswith('data:image') else image_data
        img_bytes = base64.b64decode(raw)
        arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            return jsonify({'status': 'error', 'message': 'Invalid image data'}), 400
    except Exception as exc:
        return jsonify({'status': 'error', 'message': f'Decode error: {exc}'}), 400

    # Output directory
    out_dir = ROOT / 'outputs' / studio.replace('-', '_')
    out_dir.mkdir(parents=True, exist_ok=True)

    safe_user  = "".join(c for c in user_name if c.isalnum() or c in ('_', '-'))
    safe_title = "".join(c for c in title     if c.isalnum() or c in ('_', '-'))
    name = f"{safe_user}_{safe_title}_{int(time.time())}"

    try:
        if studio == '3d-model':
            from src.modules.model_3d import process_3d_model  # noqa: PLC0415
            results = process_3d_model(img, out_dir, name)
            primary_path = Path(results.get('primary', str(out_dir / f'{name}.png')))
        elif studio == 'video-animation':
            frame_path = out_dir / f'{name}_frame.png'
            cv2.imwrite(str(frame_path), img)
            primary_path = frame_path
        else:
            img_path = out_dir / f'{name}.png'
            cv2.imwrite(str(img_path), img)
            primary_path = img_path

        # Build a relative URL
        try:
            primary_url = '/' + primary_path.relative_to(ROOT).as_posix()
        except ValueError:
            primary_url = '/' + primary_path.as_posix()

        return jsonify({
            'status': 'ok',
            'saved': {
                'module_label': studio.replace('-', ' ').title(),
                'session_id':   name,
                'primary_url':  primary_url,
                'preview_kind': 'image',
                'generated':    [{'url': primary_url, 'type': 'output'}],
                'meta':         primary_url,
            }
        })

    except Exception as exc:
        return jsonify({
            'status': 'error',
            'message': str(exc),
            'trace': traceback.format_exc()
        }), 500


@app.route('/api/ai-chat', methods=['POST'])
def ai_chat():
    return jsonify({
        'status': 'ok',
        'reply': 'Drawing processed. Check the output preview.',
        'saved': {'module_label': 'AI Assistant'},
    })


@app.route('/outputs/<path:filename>')
def outputs(filename: str):
    return send_from_directory(str(ROOT / 'outputs'), filename)


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == '__main__':
    app.run(debug=True, host='localhost', port=5000)
