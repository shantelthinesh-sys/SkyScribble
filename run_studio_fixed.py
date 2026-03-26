from flask import Flask, send_file, render_template, send_from_directory, request, jsonify
from pathlib import Path
import cv2
import base64
import numpy as np
import time

app = Flask(__name__, static_folder='assets', static_url_path='/assets', template_folder='templates')
root = Path('.')

@app.route('/')
def index():
    return send_file('assets/index.html')

@app.route('/login')
def login():
    return send_file('assets/login.html')

@app.route('/signup')
def signup():
    return send_file('assets/signup.html')

@app.route('/draw')
def draw():
    return send_file('assets/draw.html')

@app.route('/student')
def student():
    return render_template('student_dashboard.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/student/<path:path>')
def student_page(path):
    return render_template(f'student_{path}_stub.html')

@app.route('/assets/3d-viewer.html')
def viewer():
    return send_file('assets/3d-viewer.html')

@app.route('/api/health')
def health():
    return jsonify({'status': 'ok'})

@app.route('/api/studios')
def studios():
    return jsonify({'studios': [
        {'slug': 'image-generator', 'label': 'Image Generator'},
        {'slug': 'video-animation', 'label': 'Video Animation'},
        {'slug': '3d-model', 'label': '3D Model'}
    ]})

@app.route('/api/save-drawing', methods=['POST'])
def save_drawing():
    data = request.get_json() or {}
    image_data = data.get('image_data')
    studio = data.get('studio', 'image-generator')
    title = data.get('title', 'untitled')
    user_name = data.get('user_name', 'guest')
    
    if not image_data:
        return jsonify({'status': 'error', 'message': 'No image data provided'}), 400
    
    try:
        # Decode base64 image
        if image_data.startswith('data:image'):
            img_data = base64.b64decode(image_data.split(',')[1])
        else:
            img_data = base64.b64decode(image_data)
        
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return jsonify({'status': 'error', 'message': 'Invalid image data'}), 400
        
        # Studio-specific output directory
        out_dir = Path('outputs') / studio.replace('-', '_')
        out_dir.mkdir(parents=True, exist_ok=True)
        
        # Sanitize filename
        safe_name = "".join(c for c in f"{user_name}_{title}_{int(time.time())}" if c.isalnum() or c in (' ', '-', '_')).rstrip()
        safe_name = safe_name.replace(' ', '_')
        
        if studio == '3d-model':
            from src.modules.model_3d import process_3d_model
            results = process_3d_model(img, out_dir, safe_name)
            preview_url = results.get('preview', f'/outputs/3d-model/{safe_name}_preview.png')
        elif studio == 'video-animation':
            preview_path = out_dir / f"{safe_name}_preview.gif"
            # Simple placeholder animation
            frames = [img] * 8
            height, width = img.shape[:2]
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(str(preview_path.with_suffix('.mp4')), fourcc, 10, (width, height))
            for frame in frames:
                out.write(frame)
            out.release()
            preview_url = f'/outputs/video_animation/{safe_name}_preview.mp4'
        else:  # image-generator or fallback
            preview_path = out_dir / f"{safe_name}_preview.png"
            cv2.imwrite(str(preview_path), img)
            preview_url = f'/outputs/image_generator/{safe_name}_preview.png'
        
        return jsonify({
            'status': 'ok',
            'saved': {
                'module_label': studio.replace('-', ' ').title().replace(' Generator', ''),
                'session_id': safe_name,
                'primary_url': preview_url,
                'preview_kind': 'image',
                'generated': [{'url': preview_url, 'type': 'preview'}]
            }
        })
    except Exception as e:
        import traceback
        return jsonify({'status': 'error', 'message': str(e), 'trace': traceback.format_exc()}), 500

@app.route('/api/ai-chat', methods=['POST'])
def ai_chat():
    return jsonify({
        'status': 'ok',
        'reply': 'Output generated! Check preview and outputs folder.',
        'saved': {'module_label': 'AI Assistant'}
    })

@app.route('/favicon.ico')
def favicon():
    return '', 204

@app.route('/outputs/<path:filename>')
def outputs(filename):
    return send_from_directory('outputs', filename)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
