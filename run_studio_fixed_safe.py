from flask import Flask, send_file, render_template_string, send_from_directory, request, jsonify
from pathlib import Path
import cv2
import base64
import numpy as np
import time

app = Flask(__name__, static_folder='assets', static_url_path='/assets')

# Safe student dashboard template
STUDENT_DASHBOARD = '''
<!DOCTYPE html>
<html>
<head>
  <title>Student Dashboard</title>
  <link rel="stylesheet" href="/assets/student_dashboard.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
</head>
<body>
<div class="main-panel">
  <h1>Student Dashboard</h1>
  <div class="studio-row">
    <a class="studio-btn" href="/draw?studio=image-generator">Image Generator</a>
    <a class="studio-btn" href="/draw?studio=video-animation">Video Animation</a>
    <a class="studio-btn" href="/draw?studio=3d-model">3D Model</a>
  </div>
  <p>Professional dashboard with studio access.</p>
</div>
</body>
</html>
'''

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
    return render_template_string(STUDENT_DASHBOARD)

@app.route('/dashboard')
def dashboard():
    return '''
<!DOCTYPE html>
<html>
<head>
  <title>Teacher Dashboard</title>
</head>
<body>
<h1>Teacher Dashboard</h1>
<a href="/draw?studio=image-generator">Image Generator</a>
</body>
</html>
'''

@app.route('/api/health')
def health():
    return jsonify({'status': 'ok'})

@app.route('/api/save-drawing', methods=['POST'])
def save_drawing():
    data = request.get_json() or {}
    image_data = data.get('image_data')
    studio = data.get('studio', 'image-generator')
    
    if not image_data:
        return jsonify({'status': 'error'}), 400
    
    # Placeholder processing
    out_dir = Path('outputs') / studio.replace('-', '_')
    out_dir.mkdir(exist_ok=True)
    preview = out_dir / 'preview.png'
    
    return jsonify({
        'status': 'ok',
        'saved': {'preview_url': f'/outputs/{studio}/{preview.name}'}
    })

@app.route('/outputs/<path:filename>')
def outputs(filename):
    return send_from_directory('outputs', filename)

if __name__ == '__main__':
    app.run(debug=True, port=5000)

