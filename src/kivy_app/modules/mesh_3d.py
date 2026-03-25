from __future__ import annotations

from dataclasses import dataclass


@dataclass
class MeshData:
    vertices: list[tuple[float, float, float]]
    faces: list[tuple[int, int, int]]


def extrude_2d_path(path: list[tuple[float, float]], depth: float = 20.0) -> MeshData:
    """Basic 3D extrusion from 2D polyline by creating front/back strips."""
    if len(path) < 3:
        return MeshData(vertices=[], faces=[])

    # Downsample for stability/performance.
    sampled = path[::max(1, len(path) // 120)]

    front = [(x, y, 0.0) for x, y in sampled]
    back = [(x, y, depth) for x, y in sampled]
    vertices = front + back

    n = len(sampled)
    faces: list[tuple[int, int, int]] = []

    # Side faces for strip.
    for i in range(n - 1):
        a = i
        b = i + 1
        c = n + i
        d = n + i + 1
        faces.append((a, b, c))
        faces.append((b, d, c))

    # Front cap fan.
    for i in range(1, n - 1):
        faces.append((0, i, i + 1))

    # Back cap fan (reverse winding).
    for i in range(1, n - 1):
        faces.append((n, n + i + 1, n + i))

    return MeshData(vertices=vertices, faces=faces)
