from flask import Flask, send_file, render_template, send_from_directory
from pathlib import Path

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
    return {'status': 'ok'}, 200

@app.route('/api/studios')
def studios():
    return {'studios': [{'slug': 'image-generator', 'label': 'Image Generator'}, {'slug': '3d-model', 'label': '3D Model'}]}, 200

@app.route('/api/save-drawing', methods=['POST'])
def save_drawing():
    return {'status': 'ok', 'saved': {'module_label': 'Drawing Studio', 'session_id': 'demo'}}, 200

@app.route('/api/ai-chat', methods=['POST'])
def ai_chat():
    return {'status': 'ok', 'reply': 'AI response generated!'}, 200

@app.route('/api/health')
def health():
    return {'status': 'ok'}, 200

@app.route('/api/studios')
def studios():
    return {'studios': [{'slug': 'image-generator', 'label': 'Image Generator'}, {'slug': '3d-model', 'label': '3D Model'}]}, 200

@app.route('/api/save-drawing', methods=['POST'])
def save_drawing():
    return {'status': 'ok', 'saved': {'module_label': 'Drawing Studio', 'session_id': 'demo', 'primary_url': '/outputs/demo.png'}}, 200

@app.route('/api/ai-chat', methods=['POST'])
def ai_chat():
    return {'status': 'ok', 'reply': 'Demo AI response: Converted to 3D model!', 'saved': {'module_label': 'AI Studio', 'primary_url': '/outputs/ai-demo.png'}}, 200


@app.route('/favicon.ico')
def favicon():
    return '', 204

@app.route('/outputs/<path:filename>')
def outputs(filename):
    return send_from_directory('outputs', filename)

if __name__ == '__main__':
    app.run(debug=True, port=5000)

