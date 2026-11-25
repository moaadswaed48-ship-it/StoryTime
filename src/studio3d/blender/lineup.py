"""Character line-up: Sami and Grandpa side by side under soft studio light (design check, not the film).

blender -b --factory-startup --python src/studio3d/blender/lineup.py -- --out path.png [--samples 32] [--res 960x540]
          [--view front|three|face] [--smile 0..1]
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402

from characters import build_grandpa, build_sami  # noqa: E402
from lib import lin  # noqa: E402

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []


def arg(name, default):
    if '--' + name in argv:
        return argv[argv.index('--' + name) + 1]
    return default


bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sami = build_sami()
gp = build_grandpa()
sami.root.location = (0.35, 0, 0)
gp.root.location = (-0.35, 0.1, 0)
smile = float(arg('smile', '0'))
sami.face['head'].data.shape_keys.key_blocks['smile'].value = smile
gp.face['head'].data.shape_keys.key_blocks['smile'].value = smile
for ch in (sami, gp):
    for s, sx in (('L', 1), ('R', -1)):
        ch.j['shoulder.' + s].rotation_euler = (0, -sx * 0.12, 0)
        ch.j['elbow.' + s].rotation_euler = (-0.25, 0, 0)
gp.j['chest'].rotation_euler = (0.12, 0, 0)
gp.j['neck'].rotation_euler = (-0.12, 0, 0)
gp.j['elbow.L'].rotation_euler = (-0.9, 0, 0)

# floor and studio light
bpy.ops.mesh.primitive_plane_add(size=20)
fl = bpy.context.object
m = bpy.data.materials.new('floor'); m.use_nodes = True
m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = lin('#d9d4cc')
m.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.8
fl.data.materials.append(m)
w = bpy.data.worlds.new('w'); w.use_nodes = True
w.node_tree.nodes['Background'].inputs['Color'].default_value = lin('#cfd8e2')
w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.6
sc.world = w
for name, loc, rot, en, col, size in (('key', (2.2, -2.5, 2.6), (0.9, 0, 0.7), 260, '#ffe2bf', 1.5),
                                      ('rim', (-1.5, 2.5, 2.2), (-1.0, 0, -2.6), 220, '#e8f2ff', 1.0)):
    ld = bpy.data.lights.new(name, 'AREA'); ld.energy = en; ld.size = size; ld.color = lin(col)[:3]
    o = bpy.data.objects.new(name, ld); sc.collection.objects.link(o); o.location = loc; o.rotation_euler = rot
    tr = o.constraints.new('TRACK_TO'); tr.target = sami.root if name == 'key' else gp.root

view = arg('view', 'three')
cam = bpy.data.cameras.new('cam')
co = bpy.data.objects.new('cam', cam); sc.collection.objects.link(co); sc.camera = co
if view == 'face':
    cam.lens = 85
    tgt = sami.j['headmesh']
    co.location = (0.35 + 0.25, -1.4, 0.8)
else:
    cam.lens = 50
    tgt = None
    co.location = (0.9 if view == 'three' else 0.0, -4.2, 0.95)
t = bpy.data.objects.new('tgt', None); sc.collection.objects.link(t)
t.location = (0.35, 0, 0.78) if view == 'face' else (0.0, 0, 0.8)
tr = co.constraints.new('TRACK_TO'); tr.target = t

sc.render.engine = 'CYCLES'
sc.cycles.device = 'CPU'
sc.cycles.samples = int(arg('samples', '32'))
sc.cycles.use_denoising = True
sc.cycles_curves.shape = 'THICK'
rx, ry = arg('res', '960x540').split('x')
sc.render.resolution_x, sc.render.resolution_y = int(rx), int(ry)
sc.view_settings.view_transform = 'AgX'
sc.view_settings.look = 'AgX - Medium High Contrast'
sc.render.filepath = arg('out', '/tmp/lineup.png')
bpy.ops.render.render(write_still=True)
