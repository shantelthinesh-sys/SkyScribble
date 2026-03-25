# pyright: reportMissingImports=false

from __future__ import annotations

import math

from src.kivy_app.modules.mesh_3d import MeshData


def run_basic_opengl_viewer(mesh: MeshData) -> None:
    """Minimal PyOpenGL viewer with rotation controls (arrow keys)."""
    if not mesh.vertices or not mesh.faces:
        return

    pygame = __import__("pygame")
    pygame_locals = __import__("pygame.locals", fromlist=["DOUBLEBUF", "OPENGL"])
    ogl_gl = __import__("OpenGL.GL", fromlist=["*"])
    ogl_glu = __import__("OpenGL.GLU", fromlist=["gluPerspective"])

    DOUBLEBUF = pygame_locals.DOUBLEBUF
    OPENGL = pygame_locals.OPENGL

    GL_COLOR_BUFFER_BIT = ogl_gl.GL_COLOR_BUFFER_BIT
    GL_DEPTH_BUFFER_BIT = ogl_gl.GL_DEPTH_BUFFER_BIT
    GL_DEPTH_TEST = ogl_gl.GL_DEPTH_TEST
    GL_TRIANGLES = ogl_gl.GL_TRIANGLES

    glBegin = ogl_gl.glBegin
    glClear = ogl_gl.glClear
    glClearColor = ogl_gl.glClearColor
    glColor3f = ogl_gl.glColor3f
    glEnable = ogl_gl.glEnable
    glEnd = ogl_gl.glEnd
    glLoadIdentity = ogl_gl.glLoadIdentity
    glRotatef = ogl_gl.glRotatef
    glTranslatef = ogl_gl.glTranslatef
    glVertex3f = ogl_gl.glVertex3f
    gluPerspective = ogl_glu.gluPerspective

    pygame.init()
    pygame.display.set_mode((920, 680), DOUBLEBUF | OPENGL)

    gluPerspective(45, 920 / 680, 0.1, 5000.0)
    glTranslatef(0.0, 0.0, -700.0)
    glEnable(GL_DEPTH_TEST)
    glClearColor(0.03, 0.05, 0.1, 1.0)

    # Center mesh near origin.
    xs = [v[0] for v in mesh.vertices]
    ys = [v[1] for v in mesh.vertices]
    zs = [v[2] for v in mesh.vertices]
    cx = (min(xs) + max(xs)) * 0.5
    cy = (min(ys) + max(ys)) * 0.5
    cz = (min(zs) + max(zs)) * 0.5

    verts = [(x - cx, -(y - cy), z - cz) for x, y, z in mesh.vertices]

    rot_x = 20.0
    rot_y = 0.0

    clock = pygame.time.Clock()
    running = True
    while running:
        dt = clock.tick(60) / 1000.0
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

        keys = pygame.key.get_pressed()
        if keys[pygame.K_LEFT]:
            rot_y -= 90.0 * dt
        if keys[pygame.K_RIGHT]:
            rot_y += 90.0 * dt
        if keys[pygame.K_UP]:
            rot_x -= 90.0 * dt
        if keys[pygame.K_DOWN]:
            rot_x += 90.0 * dt

        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT)
        glLoadIdentity()
        glTranslatef(0.0, 0.0, -700.0)
        glRotatef(rot_x, 1.0, 0.0, 0.0)
        glRotatef(rot_y, 0.0, 1.0, 0.0)

        glColor3f(0.5, 0.75, 1.0)
        glBegin(GL_TRIANGLES)
        for i0, i1, i2 in mesh.faces:
            for idx in (i0, i1, i2):
                x, y, z = verts[idx]
                glVertex3f(x, y, z)
        glEnd()

        pygame.display.flip()

    pygame.quit()
