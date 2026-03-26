from flask import Flask, send_file, render_template, send_from_directory, request, jsonify
from pathlib import Path
import cv2
import base64
import numpy as np
import time
from src.modules.model_3d import process_3d_model

app = Flask(__name__, static_folder='assets', static_url_path='/assets', template_folder='templates')
outputs_dir = Path('outputs')

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
    return render_template('teacher_dashboard.html')

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
        return jsonify({'status': 'error'}), 400
    
    # Decode
    img_data = base64.b64decode(image_data.split(',')[1] if ',' in image_data else image_data)
    img = cv2.imdecode(np.frombuffer(img_data, np.uint8), cv2.IMREAD_COLOR)
    
    out_dir = outputs_dir / studio.replace('-', '_')
    out_dir.mkdir(parents=True, exist_ok=True)
    
    safe_name = f"{user_name}_{title}_{int(time.time())}".replace(' ', '_')
    
    if studio == '3d-model':
        results = process_3d_model(img, out_dir, safe_name)
    else:
        preview_path = out_dir / f"{safe_name}_preview.png"
        cv2.imwrite(str(preview_path), img)
        results = {'preview': str(preview_path)}
    
    preview_url = f'/outputs/{out_dir.name}/{safe_name}_preview.png'
    
    return jsonify({
        'status': 'ok',
        'saved': {
            'module_label': studio.title().replace('-', ' '),
            'session_id': safe_name,
            'primary_url': preview_url,
            'preview_kind': 'image'
        }
    })

@app.route('/outputs/<path:filename>')
def outputs(filename):
    return send_from_directory(outputs_dir, filename)

if __name__ == '__main__':
    app.run(debug=True, port=5000)

