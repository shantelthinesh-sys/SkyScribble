# SkyScribble

SkyScribble is a real-time air drawing app built with OpenCV + MediaPipe Hands, with a lightweight Flask control dashboard.

It also includes a modular Kivy implementation with:
- index-finger air drawing
- idle-stop shape smoothing
- fish-like shape animation
- basic 3D extrusion and rotation viewer

## Features
- Webcam capture with OpenCV
- Hand and fingertip tracking with MediaPipe
- Real-time virtual drawing canvas
- Smooth lines by connecting consecutive fingertip points
- Overlay canvas on live camera feed
- Modular project structure for easier extension
- Flask web dashboard for health check and launch guidance
- Kivy canvas rendering pipeline for webcam, drawing path, and animation
- Gesture support:
  - Draw: index finger up, middle finger down
  - Erase: index and middle up
  - Hold: three fingers up (pause)
  - Clear canvas: fist
- Keyboard shortcuts:
  - `c` clear canvas
  - `q` quit

## Setup
1. Open a terminal in this folder.
2. Create and activate a virtual environment:

```bash
python -m venv venv
```

Windows PowerShell:

```bash
venv\Scripts\Activate.ps1
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Run drawing mode:

```bash
python app.py --mode draw
```

5. Run web dashboard mode:

```bash
python app.py --mode web
```

6. Run Kivy air-drawing mode:

```bash
python app.py --mode kivy
```

7. Kivy controls:
- Draw with index finger in camera view
- Wait ~1.2s without movement to finalize shape
- Fish-like shape starts animation automatically
- Press `space` to reset
- Press `m` to open basic 3D extrusion viewer (arrow keys rotate)

8. Open browser air drawing page:

```bash
http://127.0.0.1:5000/draw
```

## Project Structure
- `src/`
  - `main.py` launcher and CLI mode selection
  - `drawing_app.py` webcam drawing pipeline
  - `web_app.py` Flask app factory
  - `kivy_app/`
    - `main_kivy.py` Kivy app entry for air drawing and animation
    - `modules/`
      - `hand_tracking.py` webcam + MediaPipe index-tip tracking
      - `drawing_logic.py` finger-path storage and idle-stop detection
      - `shape_processing.py` path smoothing and fish-like classification
      - `animation.py` fish animation and boundary-aware motion
      - `mesh_3d.py` 2D path to basic extruded mesh
      - `renderer_3d.py` OpenGL mesh viewer with rotation controls
- `components/`
  - `hand_tracker.py` MediaPipe tracker component
- `utils/`
  - `gestures.py` gesture and mode helpers
- `assets/`
  - `index.html` dashboard UI
- `venv/`

## Notes
- If the webcam does not open, close other camera apps and retry.
- Fist detection is intentionally simple and may vary by camera angle.
- You can tune brush/eraser settings in `src/drawing_app.py`.
