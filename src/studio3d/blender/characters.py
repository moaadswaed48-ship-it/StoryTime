"""Sami (toddler, about 3) and Grandpa (about 70) for story A04, built entirely in code.

Designs follow docs/film/CHARACTERS-A04.md and content/stories/a04/cast.json (colours, proportions, marks).
Heads are sculpted as signed-distance shapes and meshed by ray marching a dense icosphere, so the mouth
states (closed, "o", smile) are shape keys of the same mesh. Bodies are rounded parts on an FK joint tree.
"""
import math
import random

import bpy
import numpy as np
from mathutils import Vector

from lib import (capsule_profile, ellipsoid, empty, hair_curves, hair_material, lathe, lin, mesh_obj, node,
                 principled, sd_ellipsoid, sd_sphere, sdf_mesh, set_point_attr, smax, smin, torus, tube_path)


# ---------------------------------------------------------------------------------------------- materials


def skin_material(name, skin, blush, cheeks, lip, mouth_dark='#2a0e0c', mouth_mid='#6e2a26', sss_scale=0.012,
                  blush_amt=0.55, blush_r=0.032, teeth=None, tongue_z=None):
    """Skin with subsurface glow, painted blush, and a mouth whose colour comes from how deep the surface sits
    under the closed-face reference ('rest' attribute): the carved mouth darkens like a real cavity."""
    m = principled(name, skin, rough=0.48, sss=1.0, sss_radius=(1.0, 0.38, 0.22), sss_scale=sss_scale, spec=0.42,
                   sheen=0.15, sheen_rough=0.35)
    m.node_tree.nodes['Principled BSDF'].inputs['Subsurface Anisotropy'].default_value = 0.2
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    L = nt.links
    rest = nt.nodes.new('ShaderNodeAttribute'); rest.attribute_name = 'rest'; rest.location = (-1400, 200)
    rdir = nt.nodes.new('ShaderNodeAttribute'); rdir.attribute_name = 'rdir'; rdir.location = (-1400, 0)
    tc = nt.nodes.new('ShaderNodeTexCoord'); tc.location = (-1400, -200)
    sub = nt.nodes.new('ShaderNodeVectorMath'); sub.operation = 'SUBTRACT'; sub.location = (-1200, 100)
    L.new(rest.outputs['Vector'], sub.inputs[0]); L.new(tc.outputs['Object'], sub.inputs[1])
    dot = nt.nodes.new('ShaderNodeVectorMath'); dot.operation = 'DOT_PRODUCT'; dot.location = (-1000, 100)
    L.new(sub.outputs[0], dot.inputs[0]); L.new(rdir.outputs['Vector'], dot.inputs[1])
    inward = dot.outputs['Value']

    def mr(src, a, b_, loc):
        n = nt.nodes.new('ShaderNodeMapRange'); n.location = loc; n.clamp = True
        n.inputs['From Min'].default_value = a; n.inputs['From Max'].default_value = b_
        L.new(src, n.inputs['Value'])
        return n.outputs['Result']

    mz = nt.nodes.new('ShaderNodeAttribute'); mz.attribute_name = 'mzone'; mz.attribute_type = 'GEOMETRY'
    mz.location = (-1400, -600)
    m0 = mr(inward, 0.0010, 0.0030, (-800, 200))
    mm = nt.nodes.new('ShaderNodeMath'); mm.operation = 'MULTIPLY'; L.new(m0, mm.inputs[0]); L.new(mz.outputs['Fac'], mm.inputs[1])
    mouth = mm.outputs[0]
    l0 = mr(inward, 0.0002, 0.0010, (-800, 0))
    lmz = nt.nodes.new('ShaderNodeMath'); lmz.operation = 'MULTIPLY'; L.new(l0, lmz.inputs[0]); L.new(mz.outputs['Fac'], lmz.inputs[1])
    lipm = lmz.outputs[0]
    deep = mr(inward, 0.003, 0.011, (-800, -200))
    # blush: distance to the two cheek points
    bl = None
    for i, c in enumerate(cheeks):
        d = nt.nodes.new('ShaderNodeVectorMath'); d.operation = 'DISTANCE'; d.location = (-1000, -400 - 150 * i)
        d.inputs[1].default_value = c
        L.new(rest.outputs['Vector'], d.inputs[0])
        r = mr(d.outputs['Value'], blush_r, 0.0, (-800, -400 - 150 * i))
        if bl is None:
            bl = r
        else:
            mx = nt.nodes.new('ShaderNodeMath'); mx.operation = 'MAXIMUM'; mx.location = (-600, -450)
            L.new(bl, mx.inputs[0]); L.new(r, mx.inputs[1]); bl = mx.outputs[0]
    sm = nt.nodes.new('ShaderNodeMath'); sm.operation = 'MULTIPLY'; sm.inputs[1].default_value = blush_amt
    sm.location = (-500, -450); L.new(bl, sm.inputs[0])

    def mix(fac, a, b_, loc):
        n = nt.nodes.new('ShaderNodeMix'); n.data_type = 'RGBA'; n.location = loc
        L.new(fac, n.inputs['Factor'])
        if isinstance(a, tuple):
            n.inputs['A'].default_value = a
        else:
            L.new(a, n.inputs['A'])
        if isinstance(b_, tuple):
            n.inputs['B'].default_value = b_
        else:
            L.new(b_, n.inputs['B'])
        return n.outputs['Result']

    c1 = mix(sm.outputs[0], lin(skin), lin(blush), (-300, -300))
    lm = nt.nodes.new('ShaderNodeMath'); lm.operation = 'MULTIPLY'; lm.inputs[1].default_value = 0.55
    lm.location = (-500, 0); L.new(lipm, lm.inputs[0])
    c2 = mix(lm.outputs[0], c1, lin(lip), (-150, -100))
    mcol = mix(deep, lin(mouth_mid), lin(mouth_dark), (-300, 300))
    sxyz = nt.nodes.new('ShaderNodeSeparateXYZ'); L.new(tc.outputs['Object'], sxyz.inputs[0])
    if tongue_z is not None:  # pink tongue low in the mouth
        tg = mr(sxyz.outputs['Z'], tongue_z + 0.004, tongue_z - 0.002, (-500, 500))
        tgm = nt.nodes.new('ShaderNodeMath'); tgm.operation = 'MULTIPLY'; tgm.inputs[1].default_value = 0.85
        L.new(tg, tgm.inputs[0])
        mcol = mix(tgm.outputs[0], mcol, lin('#b5524c'), (-150, 400))
    if teeth is not None:  # a slip of upper teeth along the curved top edge of an open mouth
        curve, top = teeth
        xx = nt.nodes.new('ShaderNodeMath'); xx.operation = 'MULTIPLY'; L.new(sxyz.outputs['X'], xx.inputs[0]); L.new(sxyz.outputs['X'], xx.inputs[1])
        cx = nt.nodes.new('ShaderNodeMath'); cx.operation = 'MULTIPLY'; cx.inputs[1].default_value = curve; L.new(xx.outputs[0], cx.inputs[0])
        zc = nt.nodes.new('ShaderNodeMath'); zc.operation = 'SUBTRACT'; L.new(sxyz.outputs['Z'], zc.inputs[0]); L.new(cx.outputs[0], zc.inputs[1])
        tt = mr(zc.outputs[0], top - 0.0042, top - 0.0030, (-500, 650))
        dd = mr(inward, 0.0015, 0.0035, (-500, 800))
        tm = nt.nodes.new('ShaderNodeMath'); tm.operation = 'MULTIPLY'; L.new(tt, tm.inputs[0]); L.new(dd, tm.inputs[1])
        mcol = mix(tm.outputs[0], mcol, lin('#f1ebe2'), (-100, 600))
    c3 = mix(mouth, c2, mcol, (0, 100))
    L.new(c3, b.inputs['Base Color'])
    inv = nt.nodes.new('ShaderNodeMath'); inv.operation = 'SUBTRACT'; inv.inputs[0].default_value = 1.0
    inv.location = (0, -300); L.new(mouth, inv.inputs[1])
    L.new(inv.outputs[0], b.inputs['Subsurface Weight'])
    return m


def fabric_material(name, color, sheen=0.7, rough=0.85, knit=0.0, knit_scale=260.0, sheen_tint='#ffffff', fuzz_bump=0.15):
    m = principled(name, color, rough=rough, sheen=sheen, sheen_rough=0.45, sheen_tint=lin(sheen_tint), spec=0.25)
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    L = nt.links
    tc = nt.nodes.new('ShaderNodeTexCoord')
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 900.0
    nz.inputs['Detail'].default_value = 2.0
    L.new(tc.outputs['Object'], nz.inputs['Vector'])
    bump = nt.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = fuzz_bump
    bump.inputs['Distance'].default_value = 0.0005
    if knit > 0:
        # knitted rib: a wave across X/Y (vertical ribs) with small V-stitch rows
        wv = nt.nodes.new('ShaderNodeTexWave'); wv.wave_type = 'BANDS'; wv.bands_direction = 'X'
        wv.inputs['Scale'].default_value = knit_scale
        wv.inputs['Distortion'].default_value = 2.0
        wv.inputs['Detail'].default_value = 0.0
        L.new(tc.outputs['Object'], wv.inputs['Vector'])
        add = nt.nodes.new('ShaderNodeMath'); add.operation = 'ADD'
        mul = nt.nodes.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; mul.inputs[1].default_value = 0.35
        L.new(nz.outputs['Fac'], mul.inputs[0])
        L.new(wv.outputs['Fac'], add.inputs[0]); L.new(mul.outputs[0], add.inputs[1])
        L.new(add.outputs[0], bump.inputs['Height'])
        bump.inputs['Strength'].default_value = knit
        bump.inputs['Distance'].default_value = 0.002
        # colour varies a touch with the knit
        mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'
        mx.inputs['A'].default_value = lin(color)
        c = lin(color)
        mx.inputs['B'].default_value = (c[0] * 0.72, c[1] * 0.7, c[2] * 0.7, 1)
        L.new(wv.outputs['Fac'], mx.inputs['Factor'])
        L.new(mx.outputs['Result'], b.inputs['Base Color'])
    else:
        L.new(nz.outputs['Fac'], bump.inputs['Height'])
    L.new(bump.outputs['Normal'], b.inputs['Normal'])
    return m


def eye_material(name, iris, iris_light, sclera='#f3ede6', iris_ang=0.62, pupil_ang=0.29):
    """Eyeball whose local +Z is the gaze. Iris and pupil are painted by the angle from the gaze axis;
    a clear coat gives the wet catchlights."""
    m = principled(name, sclera, rough=0.35, coat=1.0, coat_rough=0.02, spec=0.5, sss=0.25, sss_scale=0.003)
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    L = nt.links
    tc = nt.nodes.new('ShaderNodeTexCoord')
    nrm = nt.nodes.new('ShaderNodeVectorMath'); nrm.operation = 'NORMALIZE'
    L.new(tc.outputs['Object'], nrm.inputs[0])
    sep = nt.nodes.new('ShaderNodeSeparateXYZ'); L.new(nrm.outputs[0], sep.inputs[0])
    acos = nt.nodes.new('ShaderNodeMath'); acos.operation = 'ARCCOSINE'; L.new(sep.outputs['Z'], acos.inputs[0])
    ang = acos.outputs[0]

    def ramp(stops):
        r = nt.nodes.new('ShaderNodeValToRGB')
        cr = r.color_ramp
        cr.interpolation = 'LINEAR'
        while len(cr.elements) > 2:
            cr.elements.remove(cr.elements[-1])
        cr.elements[0].position, cr.elements[0].color = stops[0]
        cr.elements[1].position, cr.elements[1].color = stops[1]
        for p, c in stops[2:]:
            e = cr.elements.new(p); e.color = c
        return r

    # angle 0..1.6 rad mapped to 0..1
    sc = nt.nodes.new('ShaderNodeMath'); sc.operation = 'DIVIDE'; sc.inputs[1].default_value = 1.6
    L.new(ang, sc.inputs[0])
    k = 1 / 1.6
    pupil = (0.02, 0.012, 0.01, 1)
    r = ramp([
        (0.0, pupil), (pupil_ang * k, pupil), (pupil_ang * k + 0.012, lin(iris_light)),
        ((pupil_ang + iris_ang) * 0.5 * k, lin(iris)), (iris_ang * k - 0.015, lin(iris, 1)),
        (iris_ang * k, (0.03, 0.02, 0.015, 1)), (iris_ang * k + 0.02, lin(sclera)), (1.0, lin('#e9ddd3')),
    ])
    L.new(sc.outputs[0], r.inputs['Fac'])
    # fine radial iris fibres
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 120.0
    L.new(tc.outputs['Object'], nz.inputs['Vector'])
    mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'
    mx.inputs['Factor'].default_value = 0.25
    L.new(r.outputs['Color'], mx.inputs['A']); L.new(nz.outputs['Color'], mx.inputs['B'])
    L.new(mx.outputs['Result'], b.inputs['Base Color'])
    return m


# ---------------------------------------------------------------------------------------------- rig


class Character:
    def __init__(self, name):
        self.name = name
        self.root = empty(name + '.root', (0, 0, 0), None, 0.2)
        self.j = {'root': self.root}
        self.face = {}

    def joint(self, name, parent, off):
        e = empty(f'{self.name}.{name}', off, self.j[parent], 0.03)
        self.j[name] = e
        return e


def build_eye(ch, side, center, radius, mat_eye, mat_skin, mat_lash, parent, lash_r=0.0011, upper_rest=-0.3,
              lower_rest=0.95, lid_scale=1.07):
    """Eyeball (tracks a target), upper and lower lid shells (rotate on X to blink and squint) and a lash line."""
    s = 'L' if side > 0 else 'R'
    piv = empty(f'{ch.name}.eyepiv.{s}', center, parent, 0.01, rot=(math.pi / 2, 0, 0))
    eye = ellipsoid(f'{ch.name}.eye.{s}', radius, radius, radius, mat_eye, None, segs=48)
    eye.parent = parent
    eye.location = center
    eye.rotation_euler = (math.pi / 2, 0, 0)  # local +Z looks along -Y (forward)
    ch.face['eye' + s] = eye
    R = radius * lid_scale

    def lid(name, up, rest):
        # hemisphere shell: up=True covers local +Y (upward), edge in the plane Y=0 across the front
        verts, faces = [], []
        nu, nv = 40, 14
        for i in range(nv + 1):
            ph = (math.pi / 2) * i / nv  # 0 at the edge plane, pi/2 at the pole
            for j in range(nu + 1):
                th = math.pi * j / nu  # sweep across the eye from x=+R to x=-R, through the front (+Z)
                x = R * math.cos(ph) * math.cos(th)
                zf = R * math.cos(ph) * math.sin(th)
                y = R * math.sin(ph) * (1 if up else -1)
                verts.append((x, y, zf))
        # back half too, so the shell closes behind (hidden inside the head)
        for i in range(nv):
            for j in range(nu):
                a = i * (nu + 1) + j
                f = (a, a + 1, a + nu + 2, a + nu + 1)
                faces.append(f if up else f[::-1])
        o = mesh_obj(name, verts, faces, mat_skin, None, True, 0)
        sol = o.modifiers.new('thick', 'SOLIDIFY'); sol.thickness = radius * 0.12; sol.offset = 1.0
        sub = o.modifiers.new('subd', 'SUBSURF'); sub.levels = 1; sub.render_levels = 2
        p = empty(f'{name}.piv', (0, 0, 0), piv, 0.01, rot=(rest, 0, 0))
        o.parent = p
        # lash line along the edge (front half circle)
        if up or lash_r > 0:
            pts = []
            rr = []
            for j in range(0, 41):
                th = math.pi * (0.04 + 0.92 * j / 40)
                pts.append((R * 1.035 * math.cos(th), 0.0 if up else 0.0, R * 1.035 * math.sin(th)))
                outer = (math.cos(th) * side) if True else 0
                w = lash_r * (0.6 + 0.8 * math.sin(th) ** 0.5) * (1.0 if up else 0.45)
                if up:
                    w *= 1.0 + 0.5 * max(0.0, outer)  # a touch thicker at the outer corner
                rr.append(w)
            t = tube_path(name + '.lash', pts, rr, mat_lash, p, 8, True, 1)
        return p

    ch.face['lidU' + s] = lid(f'{ch.name}.lidU.{s}', True, upper_rest)
    ch.face['lidD' + s] = lid(f'{ch.name}.lidD.{s}', False, lower_rest)
    return eye


def surface_point(sdf, center, direction):
    from lib import march
    d = np.asarray(direction, dtype=np.float64)
    d = d / np.linalg.norm(d)
    return march(sdf, center, d[None, :], 0.4)[0]


def brow(ch, side, sdf, hc, xs, zs, radius, mat, parent, lift=0.004):
    """A soft brow tube lying on the forehead, on its own pivot so it can rise and tilt."""
    s = 'L' if side > 0 else 'R'
    pts = []
    for x, z in zip(xs, zs):
        p = surface_point(sdf, hc, (side * x - hc[0], -0.12, z - hc[2]))
        n = (p - np.asarray(hc)); n /= np.linalg.norm(n)
        pts.append(Vector(p + n * lift))
    mid = pts[len(pts) // 2]
    piv = empty(f'{ch.name}.brow.{s}', tuple(mid), parent, 0.01)
    rad = [radius * (0.55 + 0.45 * math.sin(math.pi * (0.15 + 0.85 * i / (len(pts) - 1)))) for i in range(len(pts))]
    t = tube_path(f'{ch.name}.browmesh.{s}', [p - mid for p in pts], rad, mat, piv, 10, True, 2)
    ch.face['brow' + s] = piv
    return piv


def finger_path(base, direction, length, curl, side_axis, n=4):
    """Points along a finger that curls by `curl` radians in total about side_axis."""
    pts = [Vector(base)]
    d = Vector(direction).normalized()
    seg = length / n
    from mathutils import Matrix
    rot = Matrix.Rotation(curl / n, 3, Vector(side_axis))
    p = Vector(base)
    for i in range(n):
        p = p + d * seg
        pts.append(p.copy())
        d = rot @ d
    return pts


def build_hand(ch, side, wrist, scale, mat, curl=0.5, thumb_curl=0.3, spread=1.0, name='hand', grip=False):
    """Chubby hand hanging along -Z from the wrist, palm facing the body (toward -X for the left side)."""
    s = 'L' if side > 0 else 'R'
    k = scale
    palm = ellipsoid(f'{ch.name}.{name}.{s}', 0.012 * k, 0.021 * k, 0.026 * k, mat, wrist, (0, 0, -0.024 * k), 24, 1)
    inward = Vector((-side, 0, 0))
    axis = Vector((0, side, 0))  # curl toward the palm side
    axis = Vector((0, 1, 0)) * (1 if side > 0 else -1)
    for i, (y, ln, r) in enumerate([(-0.0135, 0.022, 0.0058), (-0.0045, 0.025, 0.006), (0.0045, 0.024, 0.0058),
                                    (0.013, 0.019, 0.0052)]):
        base = Vector((-side * 0.001 * k, y * k * spread, -0.042 * k))
        d = Vector((0, y * 0.25 * spread, -1))
        pts = finger_path(base, d, ln * k, curl * (1.6 if grip else 1.0), (0, 1 if side < 0 else -1, 0))
        # curl direction: rotate toward inward (palm) side
        pts = finger_path(base, d, ln * k, curl * (1.7 if grip else 1.0), (0, -1 if side > 0 else 1, 0))
        tube_path(f'{ch.name}.{name}.f{i}.{s}', pts, [r * k, r * k * 0.98, r * k * 0.93, r * k * 0.88, r * k * 0.8], mat,
                  wrist, 10, True, 1)
    base = Vector((-side * 0.004 * k, -0.017 * k, -0.018 * k))
    d = Vector((-side * 0.45, -0.7, -0.6))
    pts = finger_path(base, d, 0.02 * k, thumb_curl, (0, 0, 1 if side > 0 else -1), 3)
    tube_path(f'{ch.name}.{name}.th.{s}', pts, [0.0068 * k, 0.0066 * k, 0.006 * k, 0.0055 * k], mat, wrist, 10, True, 1)
    return palm


# ---------------------------------------------------------------------------------------------- Sami


def build_sami():
    ch = Character('Sami')
    skin_hex = '#c98b5f'
    hc = np.array([0.0, -0.004, 0.0])  # head centre in the head-mesh frame

    # ---- head SDF (toddler: big cranium, round full cheeks, small chin, button nose)
    def base_sdf(p, cheek_up=0.0, cheek_out=0.0, eyes=True):
        d = sd_ellipsoid(p, (0, 0.006, 0.022), (0.124, 0.12, 0.126))
        for sx in (-1, 1):
            d = smin(d, sd_sphere(p, (sx * (0.054 + cheek_out), -0.071, -0.042 + cheek_up), 0.05), 0.03)
        d = smin(d, sd_ellipsoid(p, (0, -0.058, -0.068), (0.062, 0.058, 0.05)), 0.028)
        d = smin(d, sd_ellipsoid(p, (0, -0.1, -0.084), (0.03, 0.022, 0.02)), 0.014)  # chin
        d = smin(d, sd_ellipsoid(p, (0, -0.122, -0.026), (0.015, 0.0125, 0.0115)), 0.011)  # nose
        for sx in (-1, 1):  # nostril wings
            d = smin(d, sd_sphere(p, (sx * 0.0105, -0.115, -0.032), 0.0065), 0.006)
        if eyes:
            for sx in (-1, 1):
                d = smax(d, -sd_sphere(p, (sx * 0.048, -0.087, -0.002), 0.0338), 0.008)
        return d

    def mouth_carve(p, w, h, d, cz, curve, flat_top=None, cy=-0.112):
        q = p.copy()
        q[..., 2] = q[..., 2] - curve * q[..., 0] ** 2
        m = sd_ellipsoid(q, (0, cy, cz), (w, d, h))
        if flat_top is not None:
            m = np.maximum(m, q[..., 2] - flat_top)
        return m

    def sdf_rest(p):
        return base_sdf(p)

    def sdf_closed(p):  # soft closed smile line
        return smax(base_sdf(p), -mouth_carve(p, 0.02, 0.0022, 0.012, -0.062, 16.0), 0.002)

    def sdf_o(p):  # small round "o" of wonder
        return smax(base_sdf(p), -mouth_carve(p, 0.0095, 0.0105, 0.02, -0.064, 0.0), 0.003)

    def sdf_smile(p):  # big open D smile, cheeks pushed up
        return smax(base_sdf(p, cheek_up=0.006, cheek_out=0.002),
                    -mouth_carve(p, 0.031, 0.016, 0.024, -0.071, 20.0, flat_top=-0.0575), 0.004)

    cheeks = [(0.056, -0.108, -0.035), (-0.056, -0.108, -0.035)]
    m_skin = skin_material('Sami.skin', skin_hex, '#d9876a', cheeks, '#b8645a', blush_amt=0.45, teeth=(20.0, -0.0575),
                           tongue_z=-0.078)
    m_body = principled('Sami.skinbody', skin_hex, rough=0.5, sss=1.0, sss_radius=(1.0, 0.38, 0.22), sss_scale=0.012,
                        spec=0.42, sheen=0.15)
    m_lash = principled('Sami.lash', '#1c100b', rough=0.6)
    m_eye = eye_material('Sami.eye', '#3b2618', '#7a4f33', iris_ang=0.66, pupil_ang=0.30)
    m_brow = fabric_material('Sami.brow', '#2b1a14', sheen=0.6, rough=0.8)
    m_scalp = fabric_material('Sami.scalp', '#2b1a14', sheen=0.8, rough=0.85)
    m_hair = hair_material('Sami.hair', '#2a1912', rough=0.32)
    m_shirt = fabric_material('Sami.tee', '#5aa7d6', sheen=0.55, rough=0.88, sheen_tint='#dff1ff')
    m_trim = fabric_material('Sami.trim', '#f4f1ea', sheen=0.5, rough=0.85)
    m_shorts = fabric_material('Sami.shorts', '#e8b84a', sheen=0.45, rough=0.86, sheen_tint='#fff3cf')
    m_sandal = principled('Sami.sandal', '#8a5a3a', rough=0.45, coat=0.25, coat_rough=0.3)
    m_sole = principled('Sami.sole', '#4d3020', rough=0.7)

    # ---- joints (rest pose, metres)
    j = ch.joint
    j('hips', 'root', (0, 0, 0.36))
    j('chest', 'hips', (0, 0, 0.06))
    j('neck', 'chest', (0, 0, 0.172))
    j('head', 'neck', (0, 0, 0.026))
    for s, sx in (('L', 1), ('R', -1)):
        j('shoulder.' + s, 'chest', (sx * 0.098, 0, 0.158))
        j('elbow.' + s, 'shoulder.' + s, (0, 0, -0.112))
        j('wrist.' + s, 'elbow.' + s, (0, 0, -0.098))
        j('hip.' + s, 'hips', (sx * 0.052, 0, -0.015))
        j('knee.' + s, 'hip.' + s, (0, 0, -0.152))
        j('ankle.' + s, 'knee.' + s, (0, 0, -0.138))
    J = ch.j

    # ---- head
    hm = empty('Sami.headmesh', (0, 0.0, 0.112), J['head'], 0.02)
    ch.j['headmesh'] = hm
    head, dirs, pts_rest = sdf_mesh('Sami.head', sdf_closed, hc, level=7, mat=m_skin, parent=hm,
                                    shapes={'o': sdf_o, 'smile': sdf_smile})
    # reference (no mouth) surface for the mouth shading
    from lib import march
    rest_pts = march(sdf_rest, hc, dirs, 0.35)
    set_point_attr(head, 'rest', rest_pts)
    set_point_attr(head, 'rdir', dirs)
    rp = rest_pts - hc
    mzone = np.clip(1.6 - np.sqrt((rp[:, 0] / 0.05) ** 2 + ((rp[:, 2] + 0.064) / 0.03) ** 2), 0, 1) * (rp[:, 1] < -0.07)
    set_point_attr(head, 'mzone', mzone, 'FLOAT')
    ch.face['head'] = head

    for sx in (1, -1):
        build_eye(ch, sx, (sx * 0.048, -0.087, -0.002), 0.0318, m_eye, m_skin_lid(skin_hex), m_lash, hm,
                  lash_r=0.0012, upper_rest=-0.62, lower_rest=1.05)
        brow(ch, sx, sdf_rest, hc, [0.026, 0.042, 0.058, 0.072], [0.043, 0.049, 0.049, 0.041], 0.0032, m_brow, hm)
        # ears: soft C shapes with a hollow
        e = ellipsoid(f'Sami.ear.{sx}', 0.012, 0.02, 0.028, m_body, hm, (sx * 0.121, 0.012, -0.018), 24, 2)
        e.rotation_euler = (0.15, sx * 0.25, 0)
        e2 = ellipsoid(f'Sami.earin.{sx}', 0.006, 0.012, 0.018, principled('Sami.earin', '#9e5f3e', rough=0.6, sss=1.0,
                                                                           sss_scale=0.008), hm,
                       (sx * 0.1295, 0.008, -0.019), 16, 1)
        e2.rotation_euler = (0.15, sx * 0.25, 0)

    # ---- hair: dark scalp cap + springy curl clumps (real strands) + the forehead curl
    def hair_mask(p):
        x, y, z = p[..., 0], p[..., 1], p[..., 2]
        th = np.arctan2(x, -y)  # 0 front, +-pi back
        a = (1 - np.cos(th)) / 2
        zl = 0.063 - 0.13 * a ** 0.85
        # keep clear of the ears
        ear = np.exp(-(((np.abs(x) - 0.12) / 0.03) ** 2 + ((y - 0.01) / 0.035) ** 2 + ((z + 0.015) / 0.04) ** 2))
        return np.clip((z - zl) / 0.008, 0, 1) * (1 - ear)

    hp = pts_rest
    mask = hair_mask(hp - hc)
    cap_pts = hp + dirs * (0.0045 * mask - 0.002 * (1 - mask))[:, None]
    from lib import icosphere_dirs
    _, faces = icosphere_dirs(7)
    keep = [f for f in faces if max(mask[f[0]], mask[f[1]], mask[f[2]]) > 0.02]
    used = sorted(set(i for f in keep for i in f))
    remap = {o: n for n, o in enumerate(used)}
    cap = mesh_obj('Sami.scalp', cap_pts[used], [[remap[i] for i in f] for f in keep], m_scalp, hm, True, 0)

    rng = random.Random(7)
    nprng = np.random.default_rng(7)
    cand = np.where(mask > 0.35)[0]
    nprng.shuffle(cand)
    roots = []
    minsep = 0.0068
    for i in cand:
        p = hp[i]
        if all(np.sum((p - q) ** 2) > minsep ** 2 for q in roots[-500:]):
            roots.append(p)
        if len(roots) > 1300:
            break

    def ringlet(p, axis, length, rc, pitch, nstr, jit, handed, ph0, taper_start=0.15):
        """A springy coil: every strand follows the same helix with a little jitter (a clump, not a tube)."""
        axis = axis / np.linalg.norm(axis)
        tmp = np.cross(axis, [0.31, 0.17, 0.93]); u = tmp / np.linalg.norm(tmp); v = np.cross(axis, u)
        turns = max(1.2, length / pitch)
        K = int(turns * 12) + 3
        t = np.linspace(0, 1, K)
        ang = ph0 + handed * t * turns * 2 * math.pi
        rr = rc * np.minimum(1, t / taper_start) * (1 - 0.25 * t)
        out = []
        for k in range(nstr):
            o = nprng.normal(0, jit, (3,))
            o2 = nprng.normal(0, jit * 0.6, (3,))
            c = p[None, :] + (t * length)[:, None] * axis[None, :]
            s_ = c + (np.cos(ang) * rr)[:, None] * u + (np.sin(ang) * rr)[:, None] * v
            s_ = s_ + o[None, :] * t[:, None] + o2[None, :] * np.sin(t * 7)[:, None]
            out.append(s_)
        return out

    strands = []
    for p in roots:
        rel = p - hc
        n = rel / np.linalg.norm(rel)
        top = np.clip((rel[2] + 0.01) / 0.12, 0, 1)
        # comb: away from the face, down at the sides and back, a soft mop on top
        horiz = np.array([rel[0], rel[1] + 0.03, 0.0]); horiz /= (np.linalg.norm(horiz) + 1e-9)
        comb = 0.5 * horiz + np.array([0, 0.25, -0.7]) * (1 - top)
        axis = n * (0.55 + 0.25 * top) + comb * 0.6
        length = 0.010 + 0.015 * top + rng.uniform(-0.002, 0.004)
        rc = 0.0032 + rng.uniform(0, 0.0013)
        strands += ringlet(p - n * 0.0015, axis, length, rc, 0.0044 + rng.uniform(0, 0.0012), 5, 0.00045,
                           rng.choice((-1, 1)), rng.uniform(0, 2 * math.pi))
    # the forehead curl (Sami's mark): one bigger ringlet hanging from the hairline onto the forehead
    fc_root = surface_point(sdf_rest, hc, (0.008, -0.105, 0.072))
    strands += ringlet(fc_root + np.array([0, -0.004, 0.0]), np.array([0.12, -0.45, -1.0]), 0.024, 0.0052, 0.0105, 12,
                       0.0005, 1, 0.3, taper_start=0.2)
    hair = hair_curves('Sami.hair', strands, 0.0006, 0.0004, m_hair, hm)
    ch.face['hair'] = hair

    # ---- body
    lathe('Sami.neck', capsule_profile(0.06, 0.036, 0.038), m_body, J['neck'], 24, loc=(0, 0.004, -0.02))
    tee = [(-0.075, 0.0), (-0.074, 0.06), (-0.068, 0.1), (-0.04, 0.115), (0.0, 0.123, -0.01), (0.04, 0.127, -0.014),
           (0.08, 0.124, -0.01), (0.12, 0.117, -0.004), (0.15, 0.106), (0.17, 0.088), (0.185, 0.062), (0.192, 0.04),
           (0.195, 0.0)]
    lathe('Sami.tee', tee, m_shirt, J['chest'], 40, sx=1.0, sy=0.8)
    t = torus('Sami.collar', 0.039, 0.0055, m_trim, J['chest'], (0, 0.002, 0.188), 40, 10)
    t.scale = (1, 0.92, 1)
    hem = torus('Sami.teehem', 0.11, 0.0055, m_shirt, J['chest'], (0, -0.002, -0.07), 48, 10)
    hem.scale = (1.0, 0.8, 1)
    shorts = [(-0.085, 0.0), (-0.08, 0.085), (-0.04, 0.108), (0.0, 0.112), (0.04, 0.11), (0.075, 0.104), (0.082, 0.0)]
    lathe('Sami.shorts', shorts, m_shorts, J['hips'], 40, sx=1.0, sy=0.85)
    for s, sx in (('L', 1), ('R', -1)):
        lathe(f'Sami.shortleg.{s}', [(0.0, 0.0), (0.0, 0.05), (0.04, 0.056), (0.095, 0.058), (0.1, 0.0)], m_shorts,
              J['hip.' + s], 32, down=True, loc=(sx * 0.006, 0, 0.012))
        torus(f'Sami.shorthem.{s}', 0.056, 0.004, m_shorts, J['hip.' + s], (sx * 0.006, 0, -0.085), 32, 8)
        lathe(f'Sami.sleeve.{s}', [(-0.05, 0.0), (-0.046, 0.026), (-0.03, 0.041), (0.0, 0.048), (0.04, 0.047),
                                   (0.07, 0.045), (0.071, 0.0)], m_shirt, J['shoulder.' + s], 32, down=True)
        torus(f'Sami.sleevehem.{s}', 0.042, 0.005, m_trim, J['shoulder.' + s], (0, 0, -0.068), 32, 8)
        lathe(f'Sami.uarm.{s}', capsule_profile(0.112, 0.031, 0.027, bulge=0.004), m_body, J['shoulder.' + s], 24,
              down=True)
        lathe(f'Sami.farm.{s}', capsule_profile(0.098, 0.028, 0.022, bulge=0.004), m_body, J['elbow.' + s], 24,
              down=True)
        build_hand(ch, sx, J['wrist.' + s], 1.0, m_body, curl=0.55)
        lathe(f'Sami.thigh.{s}', capsule_profile(0.152, 0.046, 0.037, bulge=0.004), m_body, J['hip.' + s], 24,
              down=True)
        lathe(f'Sami.shin.{s}', capsule_profile(0.13, 0.035, 0.027, bulge=0.006), m_body, J['knee.' + s], 24,
              down=True)
        foot = ellipsoid(f'Sami.foot.{s}', 0.031, 0.054, 0.024, m_body, J['ankle.' + s], (0, -0.022, -0.03), 24, 1)
        sole = ellipsoid(f'Sami.sole.{s}', 0.036, 0.063, 0.009, m_sole, J['ankle.' + s], (0, -0.022, -0.05), 24, 1)
        for k, yy in enumerate((-0.052, -0.005)):
            st = torus(f'Sami.strap{k}.{s}', 0.031, 0.0045, m_sandal, J['ankle.' + s], (0, -0.022 + yy + 0.015, -0.042),
                       32, 8, arc=math.pi)
            st.rotation_euler = (0, math.pi / 2, math.pi / 2)
            st.rotation_euler = (math.pi / 2, 0, 0)
            st.scale = (1.05, 1, 0.9)
        # toes
        for k in range(5):
            ellipsoid(f'Sami.toe{k}.{s}', 0.0062 - k * 0.0006, 0.0075, 0.0062 - k * 0.0005, m_body, J['ankle.' + s],
                      (sx * (-0.018 + k * 0.009) * (1 if sx > 0 else 1), -0.072 + abs(k - 1) * 0.0025, -0.042), 12, 1)

    # face controls
    ch.face['lookT'] = empty('Sami.lookT', (0, -1.0, 0.0), hm, 0.02)
    for s in 'LR':
        c = ch.face['eye' + s].constraints.new('DAMPED_TRACK')
        c.target = ch.face['lookT']
        c.track_axis = 'TRACK_Z'
    return ch


_lidmats = {}


def m_skin_lid(skin_hex):
    if skin_hex not in _lidmats:
        _lidmats[skin_hex] = principled('lid' + skin_hex, skin_hex, rough=0.45, sss=1.0, sss_radius=(1.0, 0.38, 0.22),
                                        sss_scale=0.006, spec=0.45)
    return _lidmats[skin_hex]


# ---------------------------------------------------------------------------------------------- Grandpa


def build_grandpa():
    ch = Character('Grandpa')
    skin_hex = '#b47a52'
    hc = np.array([0.0, -0.004, 0.0])

    def base_sdf(p, cheek_up=0.0, eyes=True):
        d = sd_ellipsoid(p, (0, 0.008, 0.02), (0.093, 0.104, 0.112))
        for sx in (-1, 1):
            d = smin(d, sd_sphere(p, (sx * 0.045, -0.062, -0.03 + cheek_up), 0.038), 0.025)
            d = smin(d, sd_ellipsoid(p, (sx * 0.06, -0.035, -0.06), (0.028, 0.045, 0.035)), 0.02)  # jaw
        d = smin(d, sd_ellipsoid(p, (0, -0.062, -0.085), (0.04, 0.045, 0.035)), 0.025)
        d = smin(d, sd_ellipsoid(p, (0, -0.103, -0.012), (0.019, 0.02, 0.03)), 0.012)  # nose bridge
        d = smin(d, sd_sphere(p, (0, -0.113, -0.03), 0.0175), 0.01)  # round nose tip
        for sx in (-1, 1):
            d = smin(d, sd_sphere(p, (sx * 0.014, -0.103, -0.036), 0.011), 0.008)
        d = smin(d, sd_ellipsoid(p, (0, -0.08, 0.04), (0.07, 0.03, 0.02)), 0.02)  # brow ridge
        if eyes:
            for sx in (-1, 1):
                d = smax(d, -sd_sphere(p, (sx * 0.037, -0.079, 0.01), 0.019), 0.006)
        return d

    def carve(p, w, h, dd, cz, curve, flat_top=None):
        q = p.copy(); q[..., 2] = q[..., 2] - curve * q[..., 0] ** 2
        m = sd_ellipsoid(q, (0, -0.1, cz), (w, dd, h))
        if flat_top is not None:
            m = np.maximum(m, q[..., 2] - flat_top)
        return m

    def sdf_rest(p):
        return base_sdf(p)

    def sdf_closed(p):
        return smax(base_sdf(p), -carve(p, 0.02, 0.0025, 0.012, -0.061, 10.0), 0.002)

    def sdf_smile(p):
        return smax(base_sdf(p, cheek_up=0.004), -carve(p, 0.024, 0.011, 0.02, -0.064, 12.0, flat_top=-0.058), 0.003)

    cheeks = [(0.048, -0.09, -0.028), (-0.048, -0.09, -0.028)]
    m_skin = skin_material('Grandpa.skin', skin_hex, '#c47a5c', cheeks, '#9c5a4a', blush_amt=0.35, sss_scale=0.01)
    m_body = principled('Grandpa.skinbody', skin_hex, rough=0.5, sss=1.0, sss_radius=(1.0, 0.38, 0.22),
                        sss_scale=0.01, spec=0.42)
    m_lash = principled('Grandpa.lash', '#2a1c14', rough=0.6)
    m_eye = eye_material('Grandpa.eye', '#4a3526', '#7c5a40', iris_ang=0.7, pupil_ang=0.3)
    m_white = fabric_material('Grandpa.whitehair', '#eeeae4', sheen=1.0, rough=0.8, sheen_tint='#ffffff', fuzz_bump=0.35)
    m_hair = hair_material('Grandpa.hair', '#efebe6', rough=0.35)
    m_brow = fabric_material('Grandpa.brow', '#e2ddd6', sheen=1.0, rough=0.8, fuzz_bump=0.4)
    m_jumper = fabric_material('Grandpa.jumper', '#b8643c', sheen=0.85, rough=0.9, knit=0.6, knit_scale=210,
                               sheen_tint='#ffd2b0')
    m_cream = fabric_material('Grandpa.cream', '#f2e6cf', sheen=0.6, rough=0.85, knit=0.4, knit_scale=400)
    m_trouser = fabric_material('Grandpa.trousers', '#d9cdb4', sheen=0.4, rough=0.85)
    m_shoe = principled('Grandpa.shoe', '#5a3a2a', rough=0.38, coat=0.35, coat_rough=0.25)
    m_sole = principled('Grandpa.sole', '#2e2019', rough=0.7)
    m_wood = principled('Grandpa.stick', '#7a5236', rough=0.42, coat=0.3, coat_rough=0.2)
    m_rubber = principled('Grandpa.rubber', '#1e1a18', rough=0.6)
    m_frame = principled('Grandpa.glassframe', '#3a2a20', rough=0.3, coat=0.5, coat_rough=0.1)
    m_glass = principled('Grandpa.glass', '#ffffff', rough=0.0, transmission=1.0, ior=1.12, spec=0.5)

    j = ch.joint
    j('hips', 'root', (0, 0, 0.93))
    j('chest', 'hips', (0, 0, 0.1))
    j('neck', 'chest', (0, 0.0, 0.405))
    j('head', 'neck', (0, 0, 0.06))
    for s, sx in (('L', 1), ('R', -1)):
        j('shoulder.' + s, 'chest', (sx * 0.185, 0.02, 0.335))
        j('elbow.' + s, 'shoulder.' + s, (0, 0, -0.285))
        j('wrist.' + s, 'elbow.' + s, (0, 0, -0.255))
        j('hip.' + s, 'hips', (sx * 0.088, 0, -0.03))
        j('knee.' + s, 'hip.' + s, (0, 0, -0.43))
        j('ankle.' + s, 'knee.' + s, (0, 0, -0.405))
    J = ch.j

    hm = empty('Grandpa.headmesh', (0, 0.0, 0.13), J['head'], 0.02)
    hm.scale = (1.13, 1.13, 1.13)
    ch.j['headmesh'] = hm
    head, dirs, pts_rest = sdf_mesh('Grandpa.head', sdf_closed, hc, level=7, mat=m_skin, parent=hm,
                                    shapes={'smile': sdf_smile})
    from lib import march, icosphere_dirs
    rest_pts = march(sdf_rest, hc, dirs, 0.35)
    set_point_attr(head, 'rest', rest_pts)
    set_point_attr(head, 'rdir', dirs)
    rp = rest_pts - hc
    mzone = np.clip(1.6 - np.sqrt((rp[:, 0] / 0.04) ** 2 + ((rp[:, 2] + 0.062) / 0.025) ** 2), 0, 1) * (rp[:, 1] < -0.06)
    set_point_attr(head, 'mzone', mzone, 'FLOAT')
    ch.face['head'] = head
    _, faces = icosphere_dirs(7)

    def shell(name, mask, thick, mat, inset=0.002):
        pts = pts_rest + dirs * (thick * mask - inset * (1 - mask))[:, None]
        keep = [f for f in faces if max(mask[f[0]], mask[f[1]], mask[f[2]]) > 0.02]
        used = sorted(set(i for f in keep for i in f))
        remap = {o: n for n, o in enumerate(used)}
        return mesh_obj(name, pts[used], [[remap[i] for i in f] for f in keep], mat, hm, True, 0), pts

    P = pts_rest - hc
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    th = np.arctan2(x, -y)
    a = (1 - np.cos(th)) / 2
    # hair: a short white fringe around the sides and back, thin on top
    side_band = np.clip((z - (-0.045 + 0.02 * (1 - a))) / 0.01, 0, 1) * np.clip((0.085 - z + 0.04 * a) / 0.015, 0, 1)
    side_band *= np.clip((a - 0.16) / 0.08, 0, 1)
    ear = np.exp(-(((np.abs(x) - 0.092) / 0.025) ** 2 + ((y - 0.0) / 0.03) ** 2 + ((z + 0.01) / 0.035) ** 2))
    hair_m = side_band * (1 - ear * 0.95)
    hair_shell, hair_pts = shell('Grandpa.hairshell', hair_m, 0.0055, m_white)
    # beard: full, short and rounded; mouth left clear; a moustache above it
    zb = -0.042 + 0.5 * np.abs(x)
    beard = np.clip((zb - z) / 0.008, 0, 1) * np.clip((0.035 - y) / 0.02, 0, 1)
    mouth_hole = ((x / 0.027) ** 2 + ((z + 0.064) / 0.011) ** 2) < 1
    beard = np.where(mouth_hole & (y < -0.06), 0.0, beard)
    stache = np.clip(1 - ((x / 0.04) ** 2 + ((z + 0.05) / 0.0085) ** 2), 0, 1) ** 0.5 * (y < -0.06)
    beard_m = np.maximum(beard, stache)
    thick = 0.0085 + 0.004 * np.clip((-0.09 - z) / 0.04, 0, 1)
    pts = pts_rest + dirs * ((thick * beard_m) - 0.002 * (1 - beard_m))[:, None]
    keep = [f for f in faces if max(beard_m[f[0]], beard_m[f[1]], beard_m[f[2]]) > 0.02]
    used = sorted(set(i for f in keep for i in f))
    remap = {o: n for n, o in enumerate(used)}
    beard_obj = mesh_obj('Grandpa.beard', pts[used], [[remap[i] for i in f] for f in keep], m_white, hm, True, 0)

    # fine strands on hair and beard for a soft, backlit edge
    rng = np.random.default_rng(3)
    strands = []
    for msk, base_pts, n_str, ln, droop in ((hair_m, hair_pts, 2600, 0.009, 0.6), (beard_m, pts, 3200, 0.0075, 0.8)):
        idx = np.where(msk > 0.6)[0]
        pick = rng.choice(idx, size=min(n_str, len(idx)), replace=len(idx) < n_str)
        for i in pick:
            p = base_pts[i] - dirs[i] * 0.001
            n = dirs[i]
            down = np.array([0, 0.25, -1.0]); down /= np.linalg.norm(down)
            d = n * (1 - droop) + down * droop
            d /= np.linalg.norm(d)
            L_ = ln * rng.uniform(0.6, 1.3)
            t = np.linspace(0, 1, 5)[:, None]
            s = p[None, :] + d[None, :] * L_ * t + n[None, :] * 0.002 * np.sin(t * math.pi)
            strands.append(s + rng.normal(0, 0.0004, s.shape) * t)
    hair_curves('Grandpa.fuzz', strands, 0.00035, 0.0002, m_hair, hm)

    for sx in (1, -1):
        build_eye(ch, sx, (sx * 0.037, -0.079, 0.01), 0.0175, m_eye, m_skin_lid(skin_hex), m_lash, hm,
                  lash_r=0.0008, upper_rest=-0.12, lower_rest=0.62)
        brow(ch, sx, sdf_rest, hc, [0.018, 0.032, 0.047, 0.06], [0.04, 0.046, 0.046, 0.04], 0.0058, m_brow, hm,
             lift=0.005)
        e = ellipsoid(f'Grandpa.ear.{sx}', 0.012, 0.022, 0.034, m_body, hm, (sx * 0.093, 0.006, -0.005), 24, 2)
        e.rotation_euler = (0.1, sx * 0.25, 0)
        # glasses: round rims, lens, temple arm
        rim = torus(f'Grandpa.rim.{sx}', 0.025, 0.0018, m_frame, hm, (sx * 0.038, -0.112, 0.008), 48, 8)
        rim.rotation_euler = (math.pi / 2, 0, sx * 0.12)
        lens = ellipsoid(f'Grandpa.lens.{sx}', 0.025, 0.025, 0.0012, m_glass, hm, (sx * 0.038, -0.112, 0.008), 32, 1)
        lens.rotation_euler = (math.pi / 2, 0, sx * 0.12)
        tube_path(f'Grandpa.temple.{sx}', [(sx * 0.062, -0.108, 0.01), (sx * 0.093, -0.06, 0.012),
                                           (sx * 0.097, 0.01, 0.006), (sx * 0.092, 0.025, -0.012)],
                  0.0015, m_frame, hm, 8, True, 1)
    tube_path('Grandpa.bridge', [(-0.014, -0.114, 0.012), (0, -0.117, 0.016), (0.014, -0.114, 0.012)], 0.0016,
              m_frame, hm, 8, True, 1)

    # ---- body: long, thin, broad rounded shoulders, a slight stoop
    lathe('Grandpa.neck', capsule_profile(0.1, 0.045, 0.047), m_body, J['neck'], 24, loc=(0, 0.01, -0.03))
    torso = [(-0.25, 0.0), (-0.248, 0.13), (-0.23, 0.162), (-0.15, 0.158), (-0.05, 0.15, -0.004), (0.06, 0.15, -0.002),
             (0.16, 0.162, 0.006), (0.25, 0.18, 0.016), (0.31, 0.19, 0.022), (0.355, 0.178, 0.022), (0.385, 0.14, 0.018),
             (0.405, 0.08, 0.01), (0.415, 0.0, 0.006)]
    lathe('Grandpa.jumper', torso, m_jumper, J['chest'], 48, sx=1.0, sy=0.72)
    torus('Grandpa.collar', 0.05, 0.009, m_cream, J['chest'], (0, 0.006, 0.405), 40, 10)
    torus('Grandpa.waistrib', 0.152, 0.014, m_jumper, J['chest'], (0, 0, -0.238), 48, 10).scale = (1, 0.74, 1)
    pelvis = [(-0.11, 0.0), (-0.105, 0.1), (-0.06, 0.122), (0.0, 0.126), (0.06, 0.122), (0.1, 0.11), (0.105, 0.0)]
    lathe('Grandpa.pelvis', pelvis, m_trouser, J['hips'], 40, sx=1.0, sy=0.68)
    for s, sx in (('L', 1), ('R', -1)):
        lathe(f'Grandpa.uarm.{s}', capsule_profile(0.285, 0.064, 0.05, bulge=0.006), m_jumper, J['shoulder.' + s], 32, down=True)
        lathe(f'Grandpa.farm.{s}', capsule_profile(0.235, 0.052, 0.045, bulge=0.004), m_jumper, J['elbow.' + s], 32, down=True)
        torus(f'Grandpa.cuff.{s}', 0.036, 0.009, m_cream, J['elbow.' + s], (0, 0, -0.232), 32, 10)
        lathe(f'Grandpa.wristskin.{s}', capsule_profile(0.04, 0.026, 0.024), m_body, J['wrist.' + s], 16, down=True,
              loc=(0, 0, 0.02))
        lathe(f'Grandpa.thigh.{s}', capsule_profile(0.43, 0.074, 0.058, bulge=0.004), m_trouser, J['hip.' + s], 32, down=True)
        lathe(f'Grandpa.shin.{s}', capsule_profile(0.4, 0.058, 0.056), m_trouser, J['knee.' + s], 32, down=True)
        ellipsoid(f'Grandpa.shoe.{s}', 0.048, 0.13, 0.045, m_shoe, J['ankle.' + s], (0, -0.04, -0.035), 32, 1)
        ellipsoid(f'Grandpa.shoesole.{s}', 0.05, 0.133, 0.012, m_sole, J['ankle.' + s], (0, -0.04, -0.07), 32, 1)
    build_hand(ch, 1, J['wrist.L'], 1.55, m_body, curl=1.25, thumb_curl=0.8, grip=True)
    build_hand(ch, -1, J['wrist.R'], 1.55, m_body, curl=0.25, thumb_curl=0.1, spread=1.25)
    # walking stick in the LEFT hand: shaft along -Z from the grip, crook over the top
    stick = empty('Grandpa.stickpiv', (0.0, -0.005, -0.06), J['wrist.L'], 0.02)
    ch.j['stick'] = stick
    lathe('Grandpa.shaft', [(0, 0), (0.0, 0.0125), (0.86, 0.0115), (0.861, 0.0)], m_wood, stick, 20, down=True,
          loc=(0, 0, 0.03), subsurf=1)
    lathe('Grandpa.tip', capsule_profile(0.035, 0.0135, 0.0135), m_rubber, stick, 16, down=True, loc=(0, 0, -0.8))
    crook = torus('Grandpa.crook', 0.045, 0.0125, m_wood, stick, (0, 0.045, 0.03), 32, 12, arc=math.pi * 1.05)
    crook.rotation_euler = (0, math.pi / 2, 0)
    crook.rotation_euler = (0, -math.pi / 2, math.pi / 2)

    ch.face['lookT'] = empty('Grandpa.lookT', (0, -1.0, 0.0), hm, 0.02)
    for s in 'LR':
        c = ch.face['eye' + s].constraints.new('DAMPED_TRACK')
        c.target = ch.face['lookT']
        c.track_axis = 'TRACK_Z'
    return ch
