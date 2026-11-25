"""The spring hillside for A04: terrain, instanced grass, red anemones, a ladybird, distant hills, sky and sun.
All geometry is generated here; grass and flowers are instanced with Geometry Nodes."""
import math
import random

import bpy
import numpy as np

from lib import (capsule_profile, ellipsoid, empty, lathe, lin, link, mesh_obj, principled, torus, tube_path)


def height(x, y):
    """Ground height (works on floats and numpy arrays). The hill rises toward frame right (+X)."""
    x = np.asarray(x, dtype=np.float64)
    y = np.asarray(y, dtype=np.float64)
    h = 2.2 * np.exp(-((x - 9.0) / 9.5) ** 2 - ((y - 15.0) / 10.0) ** 2)
    h = h - 2.8 * (1 - np.exp(-np.maximum(y - 15.0, 0) / 18.0)) - 1.9 * (1 - np.exp(-np.maximum(-x - 0.3, 0) / 5.5))
    h = h + 0.06 * np.sin(0.9 * x + 0.4 * y) * np.cos(0.7 * y - 0.3 * x)
    return h


def ground_point(x, y):
    return (x, y, float(height(x, y)))


# ---------------------------------------------------------------------------------------------- haze

HAZE = '#c9d6dc'


def add_haze(m, k=0.010, color=HAZE, strength=1.0):
    """Aerial perspective: mix the surface toward a lit haze colour by camera distance (cheap, no volumes)."""
    nt = m.node_tree
    out = nt.nodes['Material Output']
    src = out.inputs['Surface'].links[0].from_socket
    cd = nt.nodes.new('ShaderNodeCameraData')
    mth = nt.nodes.new('ShaderNodeMath'); mth.operation = 'MULTIPLY'; mth.inputs[1].default_value = -k
    nt.links.new(cd.outputs['View Distance'], mth.inputs[0])
    ex = nt.nodes.new('ShaderNodeMath'); ex.operation = 'EXPONENT'; nt.links.new(mth.outputs[0], ex.inputs[0])
    inv = nt.nodes.new('ShaderNodeMath'); inv.operation = 'SUBTRACT'; inv.inputs[0].default_value = 1.0
    nt.links.new(ex.outputs[0], inv.inputs[1])
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = lin(color)
    em.inputs['Strength'].default_value = strength
    mx = nt.nodes.new('ShaderNodeMixShader')
    nt.links.new(inv.outputs[0], mx.inputs['Fac'])
    nt.links.new(src, mx.inputs[1]); nt.links.new(em.outputs[0], mx.inputs[2])
    nt.links.new(mx.outputs[0], out.inputs['Surface'])


# ---------------------------------------------------------------------------------------------- terrain


def build_terrain():
    # near ground: fine grid, finer close to the camera (y spacing grows with distance)
    xs = np.linspace(-26, 30, 225)
    ys = np.concatenate([np.linspace(-4, 4, 60, endpoint=False), np.linspace(4, 18, 70, endpoint=False),
                         np.geomspace(18, 260, 60)])
    X, Y = np.meshgrid(xs, ys)
    Z = height(X, Y)
    nx, ny = len(xs), len(ys)
    verts = np.stack([X.ravel(), Y.ravel(), Z.ravel()], 1)
    faces = []
    for j in range(ny - 1):
        for i in range(nx - 1):
            a = j * nx + i
            faces.append((a, a + 1, a + nx + 1, a + nx))
    m = ground_material()
    g = mesh_obj('Hill.ground', verts, faces, m, None, True, 0)
    # attributes for instancing: grass density and anemone clusters (both fall off away from the camera)
    cam = np.array([0.15, -0.2])
    d = np.hypot(X - cam[0], Y - cam[1]).ravel()
    infront = (Y.ravel() > -0.4)
    lateral = np.abs(X.ravel() - 0.15) < (0.75 * np.maximum(Y.ravel(), 0) + 1.4)
    dens = np.where(infront & lateral, np.clip(1.0 - (d - 6.0) / 14.0, 0.0, 1.0), 0.0)
    dens = dens * np.clip((d - 0.25) / 0.3, 0, 1)
    rng = np.random.default_rng(11)
    # cluster noise for flowers
    cx = rng.uniform(-6, 9, 40); cy = rng.uniform(0, 22, 40); cr = rng.uniform(0.6, 2.2, 40)
    fl = np.zeros_like(d)
    for a, b, r in zip(cx, cy, cr):
        fl = np.maximum(fl, np.exp(-((X.ravel() - a) ** 2 + (Y.ravel() - b) ** 2) / (r * r)))
    fl = fl * np.where(infront & lateral, np.clip(1.0 - (d - 10.0) / 16.0, 0.0, 1.0), 0.0)
    # keep the path where Sami runs and the spot where Grandpa stands clear of tall flowers
    from lib import set_point_attr
    set_point_attr(g, 'grass', dens, 'FLOAT')
    set_point_attr(g, 'flowers', fl, 'FLOAT')
    return g


def ground_material():
    m = principled('Hill.ground', '#5f7a2e', rough=0.9, spec=0.2)
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    L = nt.links
    tc = nt.nodes.new('ShaderNodeTexCoord')
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 0.35
    nz.inputs['Detail'].default_value = 6.0
    L.new(tc.outputs['Object'], nz.inputs['Vector'])
    cr = nt.nodes.new('ShaderNodeValToRGB')
    e = cr.color_ramp.elements
    e[0].position, e[0].color = 0.35, lin('#4e6b22')
    e[1].position, e[1].color = 0.7, lin('#8a9a3a')
    L.new(nz.outputs['Fac'], cr.inputs['Fac'])
    nz2 = nt.nodes.new('ShaderNodeTexNoise'); nz2.inputs['Scale'].default_value = 40.0
    L.new(tc.outputs['Object'], nz2.inputs['Vector'])
    mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'
    mx.inputs['Factor'].default_value = 0.35
    L.new(cr.outputs['Color'], mx.inputs['A']); L.new(nz2.outputs['Color'], mx.inputs['B'])
    L.new(mx.outputs['Result'], b.inputs['Base Color'])
    bump = nt.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.4
    L.new(nz2.outputs['Fac'], bump.inputs['Height']); L.new(bump.outputs['Normal'], b.inputs['Normal'])
    add_haze(m, 0.006)
    return m


def build_far_hills():
    m = principled('Hill.far', '#6f8a4a', rough=0.95, spec=0.1)
    nt = m.node_tree
    tc = nt.nodes.new('ShaderNodeTexCoord')
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 0.05; nz.inputs['Detail'].default_value = 5
    nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
    cr = nt.nodes.new('ShaderNodeValToRGB')
    e = cr.color_ramp.elements
    e[0].position, e[0].color = 0.3, lin('#55703a')
    e[1].position, e[1].color = 0.75, lin('#9aa35a')
    nt.links.new(nz.outputs['Fac'], cr.inputs['Fac'])
    nt.links.new(cr.outputs['Color'], nt.nodes['Principled BSDF'].inputs['Base Color'])
    add_haze(m, 0.0065)
    rng = random.Random(5)
    for i, (x, y, w, h) in enumerate([(-140, 170, 120, 26), (-40, 210, 140, 34), (80, 190, 110, 30),
                                      (-90, 110, 70, 14), (10, 130, 80, 12), (150, 140, 90, 22),
                                      (-200, 250, 160, 40), (220, 260, 160, 46)]):
        o = ellipsoid(f'Hill.far{i}', w, w * 0.45, h, m, None, (x, y, -6), 48, 1)
    # a few soft trees on the middle distance (round canopies of overlapping blobs)
    leaf = principled('Hill.tree', '#4d6a2a', rough=0.8, sss=0.3, sss_scale=0.4, sheen=0.4)
    add_haze(leaf, 0.0065)
    bark = principled('Hill.bark', '#4a3a2c', rough=0.8)
    add_haze(bark, 0.0065)
    for i, (x, y, s) in enumerate([(-18, 38, 1.0), (-24, 44, 0.8), (-9, 52, 1.2), (14, 60, 1.1), (-34, 64, 1.3),
                                   (-4, 74, 0.9), (26, 46, 1.0)]):
        z = float(height(x, y))
        lathe(f'Hill.trunk{i}', capsule_profile(1.8 * s, 0.14 * s, 0.1 * s), bark, None, 12, loc=(x, y, z - 0.2))
        for k in range(7):
            a = rng.uniform(0, 2 * math.pi); r = rng.uniform(0.3, 1.1) * s
            ellipsoid(f'Hill.canopy{i}.{k}', 1.3 * s, 1.3 * s, 1.0 * s, leaf, None,
                      (x + r * math.cos(a), y + r * math.sin(a), z + 2.1 * s + rng.uniform(-0.3, 0.6) * s), 16, 1)


# ---------------------------------------------------------------------------------------------- plants


def blade_mesh(name, h, w, bend, twist, mat, coll):
    """One grass blade: a tapered, curved ribbon (6 segments)."""
    verts, faces = [], []
    n = 6
    for i in range(n + 1):
        t = i / n
        z = h * t
        y = bend * h * t * t
        ww = w * (1 - t) ** 0.8 + 0.0002
        a = twist * t
        dx, dy = math.cos(a) * ww / 2, math.sin(a) * ww / 2
        verts.append((-dx, y - dy, z))
        verts.append((dx, y + dy, z))
    for i in range(n):
        a = 2 * i
        faces.append((a, a + 1, a + 3, a + 2))
    o = mesh_obj(name, verts, faces, mat, None, True, 0)
    bpy.context.scene.collection.objects.unlink(o)
    coll.objects.link(o)
    return o


def grass_material():
    m = principled('Hill.grass', '#6f9a2c', rough=0.55, spec=0.35, sss=0.0, thin=True, transmission=0.35)
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    L = nt.links
    # colour varies per blade (instance random) and darkens toward the root
    ir = nt.nodes.new('ShaderNodeObjectInfo')
    cr = nt.nodes.new('ShaderNodeValToRGB')
    e = cr.color_ramp.elements
    e[0].position, e[0].color = 0.0, lin('#4f7a1e')
    e[1].position, e[1].color = 1.0, lin('#a3b544')
    mid = cr.color_ramp.elements.new(0.55); mid.color = lin('#6f9a2c')
    L.new(ir.outputs['Random'], cr.inputs['Fac'])
    tc = nt.nodes.new('ShaderNodeTexCoord')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ'); L.new(tc.outputs['Generated'], sep.inputs[0])
    mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'
    mx.inputs['A'].default_value = lin('#2c4512')
    L.new(sep.outputs['Z'], mx.inputs['Factor']); L.new(cr.outputs['Color'], mx.inputs['B'])
    L.new(mx.outputs['Result'], b.inputs['Base Color'])
    add_haze(m, 0.006)
    return m


def anemone(name, coll, mats, open_=1.0, stem_h=0.2, seed=0):
    """Red anemone (Anemone coronaria): six cupped petals with a pale base ring, a dark centre and stamens,
    on a thin stem with a frilled leaf collar. Built at the origin (stem base) in its own collection."""
    rng = random.Random(seed)
    red, centre, green, stamen = mats
    parts = []
    top = (0.012 * rng.uniform(-1, 1), 0.01 * rng.uniform(-1, 1), stem_h)
    stem = tube_path(name + '.stem', [(0, 0, 0), (0.003, 0.0, stem_h * 0.5), top], [0.0018, 0.0015, 0.0013], green,
                     None, 6, False, 0)
    parts.append(stem)
    # petals: cupped ovals radiating from the centre
    for k in range(6):
        a = 2 * math.pi * k / 6 + rng.uniform(-0.1, 0.1)
        L = 0.021 * rng.uniform(0.9, 1.1)
        W = 0.014
        cup = 0.85 - 0.5 * open_  # tilt upward
        verts, faces = [], []
        nu, nv = 6, 8
        for i in range(nv + 1):
            t = i / nv
            for jj in range(nu + 1):
                s = (jj / nu - 0.5) * 2
                w = W * math.sin(math.pi * min(1.0, t * 0.92 + 0.08)) ** 0.7 * (0.35 + 0.65 * t)
                r = L * t
                z = r * math.sin(cup) * t + 0.004 * (s ** 2) * t - 0.0
                x = r * math.cos(cup * t)
                verts.append((x, s * w, z))
        for i in range(nv):
            for jj in range(nu):
                q = i * (nu + 1) + jj
                faces.append((q, q + 1, q + nu + 2, q + nu + 1))
        p = mesh_obj(f'{name}.petal{k}', verts, faces, red, None, True, 1)
        p.location = top
        p.rotation_euler = (0, 0, a)
        parts.append(p)
    c = ellipsoid(name + '.centre', 0.0055, 0.0055, 0.004, centre, None, (top[0], top[1], top[2] + 0.002), 16, 1)
    parts.append(c)
    for k in range(18):
        a = 2 * math.pi * k / 18
        r = 0.0068
        s = ellipsoid(f'{name}.st{k}', 0.0011, 0.0011, 0.0011, stamen, None,
                      (top[0] + r * math.cos(a), top[1] + r * math.sin(a), top[2] + 0.0045), 6, 0)
        parts.append(s)
    # leaf collar half-way up the stem
    for k in range(3):
        a = 2 * math.pi * k / 3 + 0.4
        pts = [(0.003, 0, stem_h * 0.62), (0.003 + 0.018 * math.cos(a), 0.018 * math.sin(a), stem_h * 0.62 + 0.008),
               (0.003 + 0.03 * math.cos(a), 0.03 * math.sin(a), stem_h * 0.6 + 0.004)]
        parts.append(tube_path(f'{name}.leaf{k}', pts, [0.0012, 0.0022, 0.0006], green, None, 6, False, 0))
    # join into one object (nothing else may be selected, or it would be swallowed too)
    ctx = bpy.context
    for o in ctx.view_layer.objects:
        o.select_set(False)
    for o in parts:
        o.select_set(True)
    ctx.view_layer.objects.active = parts[0]
    for o in parts:
        for md in list(o.modifiers):
            ctx.view_layer.objects.active = o
            bpy.ops.object.modifier_apply(modifier=md.name)
    ctx.view_layer.objects.active = parts[0]
    for o in parts:
        o.select_set(True)
    bpy.ops.object.join()
    ob = ctx.view_layer.objects.active
    ob.name = name
    for o in list(ob.users_collection):
        o.objects.unlink(ob)
    coll.objects.link(ob)
    ob.select_set(False)
    return ob


def flower_materials():
    red = principled('Hill.petal', '#d6141c', rough=0.45, sheen=0.5, sheen_rough=0.3, sheen_tint=lin('#ff8a7a'),
                     thin=True, transmission=0.45, spec=0.35)
    nt = red.node_tree
    b = nt.nodes['Principled BSDF']
    tc = nt.nodes.new('ShaderNodeTexCoord')
    # pale ring at the petal base (anemone coronaria), deeper red at the tip
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    nt.links.new(tc.outputs['UV'], sep.inputs[0])
    gr = nt.nodes.new('ShaderNodeVectorMath'); gr.operation = 'LENGTH'
    nt.links.new(tc.outputs['Object'], gr.inputs[0])
    mr = nt.nodes.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = 0.004
    mr.inputs['From Max'].default_value = 0.008
    nt.links.new(gr.outputs['Value'], mr.inputs['Value'])
    mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'
    mx.inputs['A'].default_value = lin('#f3e6e0'); mx.inputs['B'].default_value = lin('#d6141c')
    nt.links.new(mr.outputs['Result'], mx.inputs['Factor'])
    nt.links.new(mx.outputs['Result'], b.inputs['Base Color'])
    add_haze(red, 0.006)
    centre = principled('Hill.anecentre', '#1a1630', rough=0.5, sheen=0.6)
    green = principled('Hill.stem', '#5c7f26', rough=0.6, thin=True, transmission=0.2)
    stamen = principled('Hill.stamen', '#151225', rough=0.4)
    return red, centre, green, stamen


def instancer(target, coll, attr, density, seed, scale_min, scale_max, name, align=True, tilt=0.25):
    """Geometry Nodes: scatter the collection's objects over the target mesh, weighted by a point attribute."""
    ng = bpy.data.node_groups.new(name, 'GeometryNodeTree')
    ng.interface.new_socket('Geometry', in_out='INPUT', socket_type='NodeSocketGeometry')
    ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    N = ng.nodes
    Lk = ng.links
    gi = N.new('NodeGroupInput'); go = N.new('NodeGroupOutput')
    na = N.new('GeometryNodeInputNamedAttribute'); na.data_type = 'FLOAT'; na.inputs['Name'].default_value = attr
    mul = N.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; mul.inputs[1].default_value = density
    Lk.new(na.outputs['Attribute'], mul.inputs[0])
    dist = N.new('GeometryNodeDistributePointsOnFaces'); dist.distribute_method = 'RANDOM'
    dist.inputs['Seed'].default_value = seed
    Lk.new(gi.outputs[0], dist.inputs['Mesh']); Lk.new(mul.outputs[0], dist.inputs['Density'])
    ci = N.new('GeometryNodeCollectionInfo'); ci.inputs['Collection'].default_value = coll
    ci.inputs['Separate Children'].default_value = True; ci.inputs['Reset Children'].default_value = True
    iop = N.new('GeometryNodeInstanceOnPoints')
    iop.inputs['Pick Instance'].default_value = True
    Lk.new(dist.outputs['Points'], iop.inputs['Points']); Lk.new(ci.outputs[0], iop.inputs['Instance'])
    rv = N.new('FunctionNodeRandomValue'); rv.data_type = 'INT'
    rv.inputs['Min'].default_value = 0; rv.inputs['Max'].default_value = 1000
    rv.inputs['Seed'].default_value = seed + 1
    Lk.new(rv.outputs['Value'], iop.inputs['Instance Index'])
    rr = N.new('FunctionNodeRandomValue'); rr.data_type = 'FLOAT_VECTOR'
    rr.inputs['Min'].default_value = (-tilt, -tilt, 0); rr.inputs['Max'].default_value = (tilt, tilt, 6.283)
    rr.inputs['Seed'].default_value = seed + 2
    Lk.new(rr.outputs['Value'], iop.inputs['Rotation'])
    rs = N.new('FunctionNodeRandomValue'); rs.data_type = 'FLOAT'
    rs.inputs['Min'].default_value = scale_min; rs.inputs['Max'].default_value = scale_max
    rs.inputs['Seed'].default_value = seed + 3
    Lk.new(rs.outputs['Value'], iop.inputs['Scale'])
    jg = N.new('GeometryNodeJoinGeometry')
    Lk.new(iop.outputs[0], jg.inputs[0])
    Lk.new(jg.outputs[0], go.inputs[0])
    o = bpy.data.objects.new(name, target.data)
    link(o)
    md = o.modifiers.new(name, 'NODES'); md.node_group = ng
    return o


def build_plants(ground):
    gcoll = bpy.data.collections.new('GrassBlades')
    gm = grass_material()
    rng = random.Random(2)
    for i in range(10):
        blade_mesh(f'blade{i}', rng.uniform(0.07, 0.15), rng.uniform(0.004, 0.0065), rng.uniform(0.1, 0.45),
                   rng.uniform(-0.6, 0.6), gm, gcoll)
    # little clover-ish leaf tufts mixed in the grass
    fcoll = bpy.data.collections.new('Anemones')
    mats = flower_materials()
    for i in range(5):
        anemone(f'anem{i}', fcoll, mats, open_=rng.uniform(0.6, 1.0), stem_h=rng.uniform(0.14, 0.26), seed=i)
    g = instancer(ground, gcoll, 'grass', 2600.0, 3, 0.65, 1.35, 'Hill.grass', tilt=0.35)
    f = instancer(ground, fcoll, 'flowers', 26.0, 9, 0.85, 1.25, 'Hill.anemones', tilt=0.15)
    return gcoll, fcoll, mats


def place_anemone(coll, mats, name, x, y, open_=1.0, stem_h=0.2, seed=0, scale=1.0, rot=0.0):
    o = anemone(name, coll, mats, open_, stem_h, seed)
    coll.objects.unlink(o)
    link(o)
    o.location = ground_point(x, y)
    o.scale = (scale, scale, scale)
    o.rotation_euler = (0.08, -0.05, rot)
    return o


# ---------------------------------------------------------------------------------------------- ladybird


def build_ladybird(parent=None):
    red = principled('Ladybird.shell', '#d01a14', rough=0.18, coat=1.0, coat_rough=0.03, spec=0.6)
    nt = red.node_tree
    b = nt.nodes['Principled BSDF']
    tc = nt.nodes.new('ShaderNodeTexCoord')
    vor = nt.nodes.new('ShaderNodeTexVoronoi'); vor.inputs['Scale'].default_value = 115.0
    vor.inputs['Randomness'].default_value = 0.55
    nt.links.new(tc.outputs['Object'], vor.inputs['Vector'])
    mr = nt.nodes.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = 0.17
    mr.inputs['From Max'].default_value = 0.2
    nt.links.new(vor.outputs['Distance'], mr.inputs['Value'])
    mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'
    mx.inputs['A'].default_value = lin('#0c0a0a'); mx.inputs['B'].default_value = lin('#d01a14')
    nt.links.new(mr.outputs['Result'], mx.inputs['Factor'])
    nt.links.new(mx.outputs['Result'], b.inputs['Base Color'])
    black = principled('Ladybird.black', '#0d0b0b', rough=0.3, coat=0.6, coat_rough=0.1)
    white = principled('Ladybird.white', '#f2efe8', rough=0.4)
    root = empty('Ladybird', (0, 0, 0), parent, 0.01)
    # body along -Y (head forward)
    shell = ellipsoid('Ladybird.body', 0.0034, 0.0042, 0.0026, red, root, (0, 0.0006, 0.0012), 32, 2)
    ellipsoid('Ladybird.under', 0.0031, 0.0039, 0.0011, black, root, (0, 0.0006, 0.0009), 24, 1)
    ellipsoid('Ladybird.head', 0.0021, 0.0015, 0.0014, black, root, (0, -0.0036, 0.001), 24, 1)
    for sx in (-1, 1):
        ellipsoid(f'Ladybird.cheek{sx}', 0.0006, 0.0005, 0.0004, white, root, (sx * 0.0011, -0.0045, 0.0014), 12, 1)
        for k, yy in enumerate((-0.0022, 0.0002, 0.0026)):
            tube_path(f'Ladybird.leg{sx}{k}', [(sx * 0.0025, yy, 0.0006), (sx * 0.0042, yy - 0.0004, 0.0005),
                                               (sx * 0.0048, yy - 0.0002, -0.0004)], 0.00022, black, root, 6, True, 0)
        tube_path(f'Ladybird.ant{sx}', [(sx * 0.0008, -0.0046, 0.0015), (sx * 0.0018, -0.0058, 0.0024),
                                        (sx * 0.0022, -0.0063, 0.0026)], 0.00012, black, root, 6, True, 0)
    # seam between the wing cases
    tube_path('Ladybird.seam', [(0, -0.0034, 0.0034), (0, 0.0006, 0.0039), (0, 0.0044, 0.0024)], 0.00012, black, root,
              6, True, 1)
    return root


def build_leaf(name, length=0.11, width=0.035, mat=None):
    """A broad soft leaf (a spring weed) that the ladybird walks along: a curved lens shape, tip along +Y."""
    verts, faces = [], []
    nu, nv = 8, 16
    for i in range(nv + 1):
        t = i / nv
        for j in range(nu + 1):
            s = (j / nu - 0.5) * 2
            w = width * math.sin(math.pi * t) ** 0.75 * 0.5
            x = s * w
            y = length * t
            z = 0.25 * length * t * t - 0.004 * (1 - s * s) * math.sin(math.pi * t) * -1 + 0.006 * s * s
            verts.append((x, y, z))
    for i in range(nv):
        for j in range(nu):
            q = i * (nu + 1) + j
            faces.append((q, q + 1, q + nu + 2, q + nu + 1))
    return mesh_obj(name, verts, faces, mat, None, True, 1)


# ---------------------------------------------------------------------------------------------- sky and sun


def build_sky_and_sun(sun_elev_deg=13.0, sun_azim_deg=-128.0, sun_strength=4.2):
    """Physical sky (multiple scattering) + a warm sun lamp. Azimuth measured from +Y, negative toward -X."""
    sc = bpy.context.scene
    w = bpy.data.worlds.new('Sky')
    w.use_nodes = True
    nt = w.node_tree
    bg = nt.nodes['Background']
    sky = nt.nodes.new('ShaderNodeTexSky')
    sky.sky_type = 'MULTIPLE_SCATTERING'
    sky.sun_disc = False
    sky.sun_elevation = math.radians(sun_elev_deg)
    az = math.radians(sun_azim_deg)
    sky.sun_rotation = az % (2 * math.pi)  # measured: rotation 0 puts the sun at +Y, 90 deg at +X
    sky.air_density = 1.0
    sky.aerosol_density = 1.2
    sky.altitude = 200
    nt.links.new(sky.outputs['Color'], bg.inputs['Color'])
    bg.inputs['Strength'].default_value = 0.17
    sc.world = w
    ld = bpy.data.lights.new('Sun', 'SUN')
    ld.energy = sun_strength
    ld.angle = math.radians(2.2)
    ld.color = lin('#ffbd78')[:3]
    o = bpy.data.objects.new('Sun', ld)
    link(o)
    # direction the light travels: from the sun toward the scene
    el = math.radians(sun_elev_deg)
    sdir = np.array([math.sin(az) * math.cos(el), math.cos(az) * math.cos(el), math.sin(el)])  # toward the sun
    from mathutils import Vector
    o.rotation_euler = Vector(tuple(-sdir)).to_track_quat('-Z', 'Y').to_euler()
    return o, sky, sdir
