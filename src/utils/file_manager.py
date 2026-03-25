from __future__ import annotations

import re
from datetime import datetime
from pathlib import Path

from src.modules.animation_3d import process_3d_animation
from src.modules.image_generator import process_image
from src.modules.model_2d import process_2d_model
from src.modules.model_3d import process_3d_model
from src.modules.video_animation import process_video_animation


def process_video(canvas_bgr, output_dir: Path, base_name: str):
    return process_video_animation(canvas_bgr, output_dir, base_name)


def process_svg(canvas_bgr, output_dir: Path, base_name: str):
    return process_2d_model(canvas_bgr, output_dir, base_name)


class CentralizedSaveManager:
    """Single save entry point that routes output by active module."""

    OUTPUT_FOLDERS = {
        "image_generator": "images",
        "video_animation": "videos",
        "model_2d": "2d_models",
        "model_3d": "3d_models",
        "animation_3d": "animations",
    }

    PROCESSORS = {
        "image_generator": process_image,
        "video_animation": process_video,
        "model_2d": process_svg,
        "model_3d": process_3d_model,
        "animation_3d": process_3d_animation,
    }

    def __init__(self, project_root: Path) -> None:
        self.project_root = project_root
        self.outputs_root = self.project_root / "outputs"
        self.outputs_root.mkdir(parents=True, exist_ok=True)

    def save_output(self, drawing_data, current_module):
        module = current_module
        folder = self.OUTPUT_FOLDERS.get(module)
        processor = self.PROCESSORS.get(module)

        if folder is None or processor is None:
            raise ValueError(f"Unsupported module: {module}")

        target_dir = self.outputs_root / folder
        target_dir.mkdir(parents=True, exist_ok=True)

        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        counter = getattr(drawing_data, "save_counter", 0)
        safe_module = re.sub(r"[^a-z0-9_]", "", module)
        base_name = f"{safe_module}_{ts}_{counter:03d}"

        result = processor(canvas_bgr=drawing_data, output_dir=target_dir, base_name=base_name)

        return {
            "module": module,
            "folder": str(target_dir),
            "result": result,
            "message": f"Saved {module} output: {Path(result['primary']).name}",
        }

    def save(self, app_state, canvas_bgr):
        """Backward-compatible wrapper used by desktop workspace."""
        saved = self.save_output(canvas_bgr, app_state.current_module)
        app_state.save_counter += 1
        app_state.last_save_message = saved["message"]
        return saved
