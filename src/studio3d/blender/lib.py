"""StoryTime Studio 3D: shared building blocks for code-built characters and sets (Blender 5.2, Cycles).

Everything here is geometry and shading written in code: no downloaded models, textures or AI art.
Units are metres. Z is up. A character faces -Y at rest (toward a camera that looks along +Y).
"""
import math

import bmesh
import bpy
import numpy as np
from mathutils import Vector

# ---------------------------------------------------------------------------------------------- colour


def lin(hex_or_rgb, a=1.0):
    """sRGB hex ('#c98b5f') -> linear RGBA tuple for shader inputs."""
    if isinstance(hex_or_rgb, str):
        h = hex_or_rgb.lstrip('#')
        c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    else:
        c = list(hex_or_rgb)
    out = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return (out[0], out[1], out[2], a)


# ---------------------------------------------------------------------------------------------- objects


def scene():
    return bpy.context.scene


def link(obj):
    scene().collection.objects.link(obj)
    return obj


def empty(name, loc=(0, 0, 0), parent=None, size=0.03, rot=(0, 0, 0)):
    o = bpy.data.objects.new(name, None)
    o.empty_display_size = size
    link(o)
    o.parent = parent
    o.location = loc
    o.rotation_euler = rot
    return o


def mesh_obj(name, verts, faces, mat=None, parent=None, smooth=True, subsurf=0, loc=(0, 0, 0)):
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], [], [tuple(f) for f in faces])
    me.validate()
    me.update()
    if smooth:
        me.shade_smooth()
    o = bpy.data.objects.new(name, me)
    link(o)
    o.parent = parent
    o.location = loc
    if mat is not None:
        me.materials.append(mat)
    if subsurf:
        m = o.modifiers.new('subd', 'SUBSURF')
        m.levels = 1
        m.render_levels = subsurf
    return o


def rings_mesh(rings, segs=32):
    """rings: list of (z, rx, ry, cx, cy). First and last ring with r=0 become poles.
    Returns verts, faces of a closed tube along +Z."""
    verts, faces = [], []
    idx = []
    for (z, rx, ry, cx, cy) in rings:
        if rx <= 1e-6 and ry <= 1e-6:
            idx.append([len(verts)])
            verts.append((cx, cy, z))
        else:
            row = []
            for i in range(segs):
                a = 2 * math.pi * i / segs
                row.append(len(verts))
                verts.append((cx + rx * math.cos(a), cy + ry * math.sin(a), z))
            idx.append(row)
    for k in range(len(idx) - 1):
        A, B = idx[k], idx[k + 1]
        if len(A) == 1 and len(B) > 1:
            for i in range(segs):
                faces.append((A[0], B[(i + 1) % segs], B[i]))
        elif len(A) > 1 and len(B) == 1:
            for i in range(segs):
                faces.append((A[i], A[(i + 1) % segs], B[0]))
        elif len(A) > 1 and len(B) > 1:
            for i in range(segs):
                faces.append((A[i], A[(i + 1) % segs], B[(i + 1) % segs], B[i]))
    return verts, faces


def lathe(name, profile, mat=None, parent=None, segs=32, sx=1.0, sy=1.0, subsurf=2, loc=(0, 0, 0), down=False):
    """profile: list of (z, r) or (z, r, dy) from the start pole to the end pole. Smooth rounded solid.
    down=True builds it along -Z (limbs that hang from their joint)."""
    rings = []
    for p in profile:
        z, r = p[0], p[1]
        dy = p[2] if len(p) > 2 else 0.0
        rings.append((-z if down else z, r * sx, r * sy, 0.0, dy))
    if down:
        rings = rings[::-1]
    v, f = rings_mesh(rings, segs)
    return mesh_obj(name, v, f, mat, parent, True, subsurf, loc)


def capsule_profile(length, r0, r1=None, n=10, bulge=0.0):
    """Rounded limb from z=0 to z=length with radius r0 at the start and r1 at the end (hemispherical caps).
    bulge adds a soft swelling in the middle (chubby toddler limbs)."""
    r1 = r0 if r1 is None else r1
    prof = []
    for i in range(n + 1):  # start cap
        a = -math.pi / 2 + (math.pi / 2) * i / n
        prof.append((r0 * (math.sin(a) + 1) - r0 + 0.0, r0 * math.cos(a)))
    prof = [(z, r) for z, r in prof]
    mid = 8
    for i in range(1, mid):
        t = i / mid
        r = r0 + (r1 - r0) * t + bulge * math.sin(math.pi * t)
        prof.append((length * t, r))
    for i in range(n + 1):  # end cap
        a = (math.pi / 2) * i / n
        prof.append((length + r1 * math.sin(a), r1 * math.cos(a)))
    prof[0] = (prof[0][0], 0.0)
    prof[-1] = (prof[-1][0], 0.0)
    return prof


def ellipsoid(name, rx, ry, rz, mat=None, parent=None, loc=(0, 0, 0), segs=32, subsurf=1):
    prof = []
    n = 16
    for i in range(n + 1):
        a = -math.pi / 2 + math.pi * i / n
        prof.append((rz * math.sin(a), max(0.0, math.cos(a))))
    rings = [(z, rx * r, ry * r, 0, 0) for z, r in prof]
    v, f = rings_mesh(rings, segs)
    return mesh_obj(name, v, f, mat, parent, True, subsurf, loc)


def torus(name, R, r, mat=None, parent=None, loc=(0, 0, 0), seg=48, rseg=12, arc=2 * math.pi, sx=1.0, sy=1.0):
    verts, faces = [], []
    closed = arc >= 2 * math.pi - 1e-6
    nseg = seg if closed else seg + 1
    for i in range(nseg):
        a = arc * i / seg
        for j in range(rseg):
            b = 2 * math.pi * j / rseg
            x = (R + r * math.cos(b)) * math.cos(a) * sx
            y = (R + r * math.cos(b)) * math.sin(a) * sy
            z = r * math.sin(b)
            verts.append((x, y, z))
    for i in range(seg if closed else seg):
        i2 = (i + 1) % nseg
        for j in range(rseg):
            j2 = (j + 1) % rseg
            faces.append((i * rseg + j, i2 * rseg + j, i2 * rseg + j2, i * rseg + j2))
    if not closed:  # cap the ends
        faces.append(tuple(range(rseg))[::-1])
        faces.append(tuple((seg) * rseg + j for j in range(rseg)))
    return mesh_obj(name, verts, faces, mat, parent, True, 1, loc)


def tube_path(name, pts, radii, mat=None, parent=None, segs=12, caps=True, subsurf=1):
    """A tube along a polyline pts (list of Vector) with per-point radii. Rounded by subdivision."""
    pts = [Vector(p) for p in pts]
    verts, faces = [], []
    n = len(pts)
    prev_side = None
    for i, p in enumerate(pts):
        t = (pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]).normalized()
        if prev_side is None:
            up = Vector((0, 0, 1)) if abs(t.z) < 0.9 else Vector((1, 0, 0))
            side = t.cross(up).normalized()
        else:
            side = (prev_side - t * prev_side.dot(t)).normalized()
        prev_side = side
        up2 = side.cross(t).normalized()
        r = radii[i] if hasattr(radii, '__len__') else radii
        for j in range(segs):
            a = 2 * math.pi * j / segs
            verts.append(tuple(p + (side * math.cos(a) + up2 * math.sin(a)) * r))
    for i in range(n - 1):
        for j in range(segs):
            j2 = (j + 1) % segs
            faces.append((i * segs + j, i * segs + j2, (i + 1) * segs + j2, (i + 1) * segs + j))
    if caps:
        c0 = len(verts)
        verts.append(tuple(pts[0] - (pts[1] - pts[0]).normalized() * (radii[0] if hasattr(radii, '__len__') else radii) * 0.6))
        c1 = len(verts)
        verts.append(tuple(pts[-1] + (pts[-1] - pts[-2]).normalized() * (radii[-1] if hasattr(radii, '__len__') else radii) * 0.6))
        for j in range(segs):
            j2 = (j + 1) % segs
            faces.append((c0, j2, j))
            faces.append((c1, (n - 1) * segs + j, (n - 1) * segs + j2))
    return mesh_obj(name, verts, faces, mat, parent, True, subsurf)


# ---------------------------------------------------------------------------------------------- SDF heads
# Signed distance functions (numpy, vectorised). A star-shaped head is found by marching rays from its centre
# outward over a dense icosphere: every vertex keeps its direction, so different SDF states (mouth closed,
# smile, "o") give matching vertices and become shape keys.


def sd_ellipsoid(p, c, r):
    q = (p - np.asarray(c)) / np.asarray(r)
    k0 = np.linalg.norm(q, axis=-1)
    k1 = np.linalg.norm((p - np.asarray(c)) / (np.asarray(r) ** 2), axis=-1)
    return k0 * (k0 - 1.0) / np.maximum(k1, 1e-9)


def sd_sphere(p, c, r):
    return np.linalg.norm(p - np.asarray(c), axis=-1) - r


def smin(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0.0, 1.0)
    return b * (1 - h) + a * h - k * h * (1 - h)


def smax(a, b, k):
    return -smin(-a, -b, k)


def icosphere_dirs(level=6):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=level, radius=1.0)
    verts = np.array([v.co[:] for v in bm.verts], dtype=np.float64)
    faces = [[v.index for v in f.verts] for f in bm.faces]
    bm.free()
    verts /= np.linalg.norm(verts, axis=1, keepdims=True)
    return verts, faces


def march(sdf, center, dirs, rmax=0.35, steps=220, iters=24):
    """Outermost surface crossing along each ray from center. Returns points (N,3)."""
    center = np.asarray(center, dtype=np.float64)
    rs = np.linspace(rmax, 0.0, steps)
    N = len(dirs)
    hit_hi = np.full(N, rmax)
    hit_lo = np.zeros(N)
    found = np.zeros(N, dtype=bool)
    prev = np.full(N, rmax)
    for r in rs[1:]:
        p = center + dirs * r
        inside = sdf(p) < 0
        newly = inside & ~found
        hit_lo[newly] = r
        hit_hi[newly] = prev[newly]
        found |= newly
        prev[:] = r
        if found.all():
            break
    lo, hi = hit_lo, hit_hi  # lo inside, hi outside
    for _ in range(iters):
        mid = 0.5 * (lo + hi)
        inside = sdf(center + dirs * mid[:, None]) < 0
        lo = np.where(inside, mid, lo)
        hi = np.where(inside, hi, mid)
    return center + dirs * (0.5 * (lo + hi))[:, None]


def sdf_mesh(name, sdf, center, level=6, mat=None, parent=None, rmax=0.35, shapes=None):
    """Build a smooth mesh from a star-shaped SDF. shapes: {key_name: sdf_variant} become shape keys."""
    dirs, faces = icosphere_dirs(level)
    pts = march(sdf, center, dirs, rmax)
    o = mesh_obj(name, pts, faces, mat, parent, True, 0)
    if shapes:
        o.shape_key_add(name='Basis')
        for k, f in shapes.items():
            sk = o.shape_key_add(name=k)
            p2 = march(f, center, dirs, rmax)
            sk.data.foreach_set('co', p2.ravel())
            sk.value = 0.0
    return o, dirs, pts


def set_point_attr(obj, name, values, kind='FLOAT_VECTOR'):
    me = obj.data
    a = me.attributes.get(name) or me.attributes.new(name, kind, 'POINT')
    key = 'vector' if kind == 'FLOAT_VECTOR' else ('color' if kind == 'FLOAT_COLOR' else 'value')
    a.data.foreach_set(key, np.asarray(values, dtype=np.float32).ravel())
    return a


# ---------------------------------------------------------------------------------------------- hair curves


def hair_curves(name, strands, radius_root, radius_tip, mat, parent=None):
    """strands: list of (K,3) arrays (same K not required). Real Cycles curves (fine strands)."""
    hc = bpy.data.hair_curves.new(name)
    sizes = [len(s) for s in strands]
    hc.add_curves(sizes)
    pos = np.concatenate([np.asarray(s, dtype=np.float32) for s in strands])
    hc.position_data.foreach_set('vector', pos.ravel())
    rad = []
    for s in strands:
        k = len(s)
        t = np.linspace(0, 1, k)
        rad.append(radius_root + (radius_tip - radius_root) * t)
    rad = np.concatenate(rad).astype(np.float32)
    a = hc.attributes.get('radius') or hc.attributes.new('radius', 'FLOAT', 'POINT')
    a.data.foreach_set('value', rad)
    hc.materials.append(mat)
    o = bpy.data.objects.new(name, hc)
    link(o)
    o.parent = parent
    return o


# ---------------------------------------------------------------------------------------------- materials


def _mat(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes['Principled BSDF']
    return m, nt, bsdf


def principled(name, color, rough=0.5, sss=0.0, sss_radius=(1.0, 0.4, 0.25), sss_scale=0.01, sheen=0.0,
               sheen_rough=0.4, sheen_tint=(1, 1, 1, 1), coat=0.0, coat_rough=0.05, spec=0.5, metallic=0.0,
               transmission=0.0, ior=1.45, thin=False, alpha=1.0):
    m, nt, b = _mat(name)
    b.inputs['Base Color'].default_value = lin(color) if isinstance(color, str) else color
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metallic
    b.inputs['Subsurface Weight'].default_value = sss
    b.inputs['Subsurface Radius'].default_value = sss_radius
    b.inputs['Subsurface Scale'].default_value = sss_scale
    b.inputs['Sheen Weight'].default_value = sheen
    b.inputs['Sheen Roughness'].default_value = sheen_rough
    b.inputs['Sheen Tint'].default_value = sheen_tint
    b.inputs['Coat Weight'].default_value = coat
    b.inputs['Coat Roughness'].default_value = coat_rough
    b.inputs['Specular IOR Level'].default_value = spec
    b.inputs['Transmission Weight'].default_value = transmission
    b.inputs['IOR'].default_value = ior
    b.inputs['Thin Wall'].default_value = thin
    b.inputs['Alpha'].default_value = alpha
    return m


def node(nt, kind, loc=(0, 0), **inputs):
    n = nt.nodes.new(kind)
    n.location = loc
    for k, v in inputs.items():
        n.inputs[k].default_value = v
    return n


def hair_material(name, color, melanin=None, rough=0.3, coat=0.0, random_rough=0.2):
    """Principled Hair BSDF (Chiang) driven by a direct colour."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL':
            nt.nodes.remove(n)
    out = nt.nodes['Material Output']
    h = nt.nodes.new('ShaderNodeBsdfHairPrincipled')
    try:
        h.parametrization = 'COLOR'
    except Exception:
        pass
    if 'Color' in h.inputs:
        h.inputs['Color'].default_value = lin(color)
    h.inputs['Roughness'].default_value = rough
    if 'Radial Roughness' in h.inputs:
        h.inputs['Radial Roughness'].default_value = 0.4
    if 'Coat' in h.inputs:
        h.inputs['Coat'].default_value = coat
    if 'Random Roughness' in h.inputs:
        h.inputs['Random Roughness'].default_value = random_rough
    nt.links.new(h.outputs[0], out.inputs['Surface'])
    return m
