from flask import Flask, send_file, render_template, send_from_directory, request, jsonify
from pathlib import Path
import cv2
import base64
import numpy as np
import time
from src.modules.model_3d import process_3d_model

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
    return render_template('teacher_dashboard.html')

@app.route('/student/<path:path>')
def student_page(path):
    return render_template(f'student_{path}_stub.html')

@app.route('/api/health')
def health():
    return jsonify({'status': 'ok'})

@app.route('/api/studios')
def studios():
    return jsonify({'studios': [{'slug': 'image-generator', 'label': 'Image Generator'}, {'slug': '3d-model', 'label': '3D Model'}]})

@app.route('/api/save-drawing', methods=['POST'])
def save_drawing():
    data = request.get_json()
    image_data = data.get('image_data')
    studio = data.get('studio', 'image-generator')
    title = data.get('title', 'untitled')
    user_name = data.get('user_name', 'guest')
    
    if not image_data:
        return jsonify({'status': 'error', 'message': 'No image data'}), 400
    
    # Decode base64
    if image_data.startswith('data:image'):
        img_data = base64.b64decode(image_data.split(',')[1])
    else:
        img_data = base64.b64decode(image_data)
    
    nparr = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Studio-specific processing
    out_dir = Path('outputs') / studio.replace('-', '_')
    out_dir.mkdir(parents=True, exist_ok=True)
    name = f"{user_name.replace(' ', '_')}_{title.replace(' ', '_')}_{int(time.time())}"
    
    try:
        if studio == '3d-model':
            from src.modules.model_3d import process_3d_model
            results = process_3d_model(img, out_dir, name)
        elif studio == 'video-animation':
            # Simple animation placeholder - copy image as frame
frame_path = out_dir / f"{name}_frame.png"
            cv2.imwrite(str(frame_path), img)
            results = {"primary": str(frame_path), "type": "frame"}
        elif studio == 'image-generator':
            img_path = out_dir / f"{name}.png"
            cv2.imwrite(str(img_path), img)
            results = {"primary": str(img_path), "type": "image"}
        else:
            img_path = out_dir / f"{name}.png"
            cv2.imwrite(str(img_path), img)
            results = {"primary": str(img_path), "type": "image"}
        
        # Fix filename for URL
        primary_path = Path(results['primary'])
        primary_url = '/' + str(primary_path).replace(str(root), '').lstrip('/')
        
        return jsonify({
            'status': 'ok',
            'saved': {
                'module_label': studio.replace('-', ' ').title(),
                'session_id': name,
                'primary_url': primary_url,
                'preview_kind': 'image',
                'generated': [{'url': primary_url, 'type': 'output'}]
            }
        })
    except Exception as e:
        import traceback
        return jsonify({'status': 'error', 'message': str(e), 'trace': traceback.format_exc()}), 500

@app.route('/api/ai-chat', methods=['POST'])
def ai_chat():
    return jsonify({
        'status': 'ok', 
        'reply': 'Your drawing was automatically processed as 3D model. Check outputs/3d-model/ folder and result preview.',
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

