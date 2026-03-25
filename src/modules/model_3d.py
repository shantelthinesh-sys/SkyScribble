from __future__ import annotations

from pathlib import Path

import cv2


def process_3d_model(canvas_bgr, output_dir: Path, base_name: str) -> dict[str, str]:
    """3D model module: placeholder extrusion as OBJ + MTL + texture."""
    output_dir.mkdir(parents=True, exist_ok=True)

    texture_path = output_dir / f"{base_name}_texture.png"
    cv2.imwrite(str(texture_path), canvas_bgr)

    mtl_path = output_dir / f"{base_name}.mtl"
    mtl_path.write_text(
        "\n".join(
            [
                "newmtl drawmat",
                "Ka 0.15 0.15 0.2",
                "Kd 1.0 1.0 1.0",
                "Ks 0.0 0.0 0.0",
                f"map_Kd {texture_path.name}",
            ]
        ),
        encoding="utf-8",
    )

    # Placeholder extrusion mesh (a thin box) that uses the drawing as texture.
    obj_path = output_dir / f"{base_name}.obj"
    obj_path.write_text(
        "\n".join(
            [
                f"mtllib {mtl_path.name}",
                "o sketch_extrusion",
                "v -1 -1 0",
                "v 1 -1 0",
                "v 1 1 0",
                "v -1 1 0",
                "v -1 -1 0.2",
                "v 1 -1 0.2",
                "v 1 1 0.2",
                "v -1 1 0.2",
                "vt 0 1",
                "vt 1 1",
                "vt 1 0",
                "vt 0 0",
                "usemtl drawmat",
                "f 1/1 2/2 3/3 4/4",
                "f 5/1 6/2 7/3 8/4",
                "f 1/1 2/2 6/3 5/4",
                "f 2/1 3/2 7/3 6/4",
                "f 3/1 4/2 8/3 7/4",
                "f 4/1 1/2 5/3 8/4",
            ]
        ),
        encoding="utf-8",
    )

    return {"primary": str(obj_path), "type": "mesh", "extra": str(texture_path)}
