"""A working example of the film contract: a grey box on a floor, one light, one camera. Mechanics only.

It shows the shape of an entry and a few Blender 5.2 calls that work on this machine. It is not a design to follow.
Try it (WS is your workspace folder, REPO is WS/repo; use absolute paths):

    bash REPO/studio/scripts/bakeoff/blender.sh example -- --python REPO/src/studio3d/bakeoff/common/example_film.py -- \
        --out WS/out/example --frames 109,168 --shots S2 --quality preview --res 640x360

`Material.use_nodes = True` and `World.use_nodes = True` print a deprecation warning in 5.2; that is harmless.
To reuse the project's older Blender code (`import lib`, `import hill`), call `harness.add_paths()` right after the
import of harness below.
"""
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import harness  # noqa: E402

import bpy  # noqa: E402


def build_shot(ctx):
    sc = bpy.context.scene

    # a floor and a box
    bpy.ops.mesh.primitive_plane_add(size=20)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0.5))
    box = bpy.context.object
    mat = bpy.data.materials.new('Grey')
    mat.use_nodes = True
    mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.5, 0.5, 0.5, 1)
    box.data.materials.append(mat)

    # animation is keyed with frame numbers of the whole film, over everything this shot must draw
    # (render_first .. render_last: for S6 and S7 that includes the dissolve frames)
    for n in (ctx.render_first, ctx.render_last):
        box.rotation_euler = (0, 0, math.radians(90) * (n - ctx.first) / max(1, ctx.last - ctx.first))
        box.keyframe_insert('rotation_euler', frame=n)

    # a light and a camera with depth of field
    sun = bpy.data.lights.new('Sun', 'SUN')
    sun.energy = 3.0
    so = bpy.data.objects.new('Sun', sun)
    so.rotation_euler = (math.radians(55), 0, math.radians(30))
    sc.collection.objects.link(so)
    cam = bpy.data.cameras.new('Cam')
    cam.lens = 50
    cam.dof.use_dof = True
    cam.dof.aperture_fstop = 2.8
    cam.dof.focus_distance = 5.0
    co = bpy.data.objects.new('Cam', cam)
    co.location = (0, -5, 1.2)
    co.rotation_euler = (math.radians(84), 0, 0)
    sc.collection.objects.link(co)
    sc.camera = co

    # a plain grey world
    world = bpy.data.worlds.new('World')
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.3, 0.35, 0.45, 1)
    sc.world = world

    # render settings: the entry owns these (the harness then sets size, PNG output and the device)
    sc.render.engine = 'CYCLES'
    sc.cycles.samples = 16 if ctx.quality == 'final' else 4
    sc.cycles.use_denoising = True
    sc.cycles.denoiser = 'OPENIMAGEDENOISE'
    sc.render.use_persistent_data = True


if __name__ == '__main__':
    harness.main(build_shot)
