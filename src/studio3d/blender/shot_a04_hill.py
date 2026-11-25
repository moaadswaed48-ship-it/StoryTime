"""A04 test shot "Where is Grandpa?" (11 s, 24 fps): Sami runs up the spring hill, stops, looks back;
Grandpa waves from below; Sami beams and waves back. Low camera, slow push, rack focus from a ladybird.

blender -b --factory-startup --python src/studio3d/blender/shot_a04_hill.py -- [options]
  --out DIR            frame folder (PNG per frame)
  --frames 1-264       range, or a list "1,60,120"
  --res 1280x720       resolution
  --samples 48         Cycles samples (adaptive, OpenImageDenoise after)
  --blur 1             motion blur on/off
  --save path.blend    also save the scene
"""
import math
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import bpy  # noqa: E402
import numpy as np  # noqa: E402
from mathutils import Vector  # noqa: E402

import hill  # noqa: E402
from characters import build_grandpa, build_sami  # noqa: E402
from lib import empty, lin, principled  # noqa: E402

FPS = 24
DUR = 11.0
NFR = int(DUR * FPS)

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []


def arg(name, default):
    return argv[argv.index('--' + name) + 1] if '--' + name in argv else default


# ---------------------------------------------------------------------------------------------- easing


def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def smooth(t):
    t = clamp(t)
    return t * t * (3 - 2 * t)


def ease(t):  # cubic in-out
    t = clamp(t)
    return 4 * t ** 3 if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2


def ease_out(t):
    t = clamp(t)
    return 1 - (1 - t) ** 3


def back_out(t, s=1.6):  # overshoot, then settle
    t = clamp(t)
    return 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2


def keys(t, ks, fn=ease):
    """Piecewise eased curve through (time, value) keys."""
    if t <= ks[0][0]:
        return ks[0][1]
    for (t0, v0), (t1, v1) in zip(ks, ks[1:]):
        if t <= t1:
            u = (t - t0) / (t1 - t0) if t1 > t0 else 1
            return v0 + (v1 - v0) * fn(u)
    return ks[-1][1]


def pulse(t, t0, t1):
    """0 -> 1 -> 0 bump between t0 and t1."""
    if t <= t0 or t >= t1:
        return 0.0
    u = (t - t0) / (t1 - t0)
    return math.sin(math.pi * u) ** 2


def blink(t, times, dur=0.16):
    v = 0.0
    for b in times:
        if b <= t <= b + dur:
            u = (t - b) / dur
            v = max(v, math.sin(math.pi * u) ** 0.7)
    return v


def spring_track(signal, k=120.0, c=9.0):
    """Damped spring following a signal sampled per frame (for overlapping action)."""
    out = []
    x, v = signal[0], 0.0
    dt = 1.0 / FPS / 4
    for s in signal:
        for _ in range(4):
            a = k * (s - x) - c * v
            v += a * dt
            x += v * dt
        out.append(x)
    return out


# ---------------------------------------------------------------------------------------------- legs


def leg_ik(hip, ankle, L1, L2):
    """Two-bone leg in the character's root space (character faces -Y). Returns hip (x, y), knee x."""
    d = Vector(ankle) - Vector(hip)
    dist = min(d.length, L1 + L2 - 1e-4)
    dist = max(dist, abs(L1 - L2) + 1e-3)
    phi = math.atan2(d.y, -d.z)  # + when the ankle is behind the hip
    a = math.acos(clamp((L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist), -1, 1))
    k = math.pi - math.acos(clamp((L1 * L1 + L2 * L2 - dist * dist) / (2 * L1 * L2), -1, 1))
    roll = math.atan2(d.x, -d.z)
    return phi - a, roll, k


# ---------------------------------------------------------------------------------------------- staging

SAMI_STOP = (0.55, 3.05)
SAMI_START = (-0.9, 3.6)
GP_POS = (-2.05, 5.9)


def look_vec(yaw, pitch, dist=1.0):
    return (math.sin(yaw) * math.cos(pitch) * dist, -math.cos(yaw) * math.cos(pitch) * dist, math.sin(pitch) * dist)


class Pose:
    def __init__(self):
        self.rot = {}
        self.loc = {}
        self.val = {}


def sami_pose(t, sp):
    """sp: precomputed spring signals for this frame."""
    P = Pose()
    D = math.radians
    # ---- travel: run in, decelerate, stop
    T_RUN = 1.75
    u = clamp(t / T_RUN)
    prog = 1 - (1 - u) ** 2.2
    x = SAMI_START[0] + (SAMI_STOP[0] - SAMI_START[0]) * prog
    y = SAMI_START[1] + (SAMI_STOP[1] - SAMI_START[1]) * prog
    dist = math.hypot(SAMI_STOP[0] - SAMI_START[0], SAMI_STOP[1] - SAMI_START[1]) * prog
    speed = (1 - smooth((t - 1.2) / 0.55))  # running amount 1 -> 0
    # heading: run to the right, anticipation, turn back toward Grandpa (cheated to camera), settle
    head_k = [(0, 69), (1.75, 72), (2.75, 80), (3.0, 86), (3.55, -66), (3.8, -58), (4.0, -62), (5.6, -60),
              (6.3, -48), (9.6, -44), (11, -46)]
    heading = D(keys(t, head_k))
    P.loc['root'] = (x, y, float(hill.height(x, y)))
    P.rot['root'] = (0, 0, heading)

    # ---- run cycle (phase tied to distance travelled so feet do not slide)
    stride = 0.42
    ph = 2 * math.pi * dist / stride
    amp = speed
    hipz = 0.36
    bob = -0.016 * abs(math.sin(ph)) * amp
    # stop: knees dip and recover (settle), small bounces of joy later
    dip = -0.022 * pulse(t, 1.6, 2.25) - 0.014 * pulse(t, 2.85, 3.2)  # anticipation of the turn
    hop = 0.0
    for b0 in (6.05, 6.45, 9.75):
        hop += 0.026 * pulse(t, b0, b0 + 0.38)
    heel = hop * 1.0  # rise on toes
    P.loc['hips'] = (0, 0, hipz + bob + dip + hop)
    feet = {}
    for s, sx, off in (('L', 1, 0.0), ('R', -1, math.pi)):
        p = ph + off
        A = stride / 4 * amp
        cyc = (p % (2 * math.pi))
        if cyc < math.pi:  # stance: foot moves back linearly
            fy = -A + 2 * A * (cyc / math.pi)
            lift = 0.0
        else:  # swing: forward with lift
            v = (cyc - math.pi) / math.pi
            fy = A - 2 * A * (0.5 - 0.5 * math.cos(math.pi * v))
            lift = 0.05 * amp * math.sin(math.pi * v)
        # small shuffle steps during the turn
        lift += 0.025 * pulse(t, 3.0 + (0.0 if s == 'L' else 0.2), 3.35 + (0.0 if s == 'L' else 0.2))
        width = 0.052 + 0.01 * amp
        feet[s] = (sx * width, fy, 0.055 + lift + heel)
    hip_world_z = hipz + bob + dip + hop
    for s, sx in (('L', 1), ('R', -1)):
        hx, hy, hk = leg_ik((sx * 0.052, 0, hip_world_z - 0.015), feet[s], 0.152, 0.138)
        P.rot['hip.' + s] = (hx, hy * 0.6, 0)
        P.rot['knee.' + s] = (hk, 0, 0)
        P.rot['ankle.' + s] = (-(hx + hk) * 0.85 - 0.5 * heel / 0.026 * 0.4, 0, 0)

    # ---- torso: lean while running, overshoot on the stop (spring), little sway when waving
    lean_target = D(14) * amp
    lean = lean_target + sp['lean'] * 1.0
    wave_on = smooth((t - 6.3) / 0.35) * (1 - smooth((t - 9.4) / 0.4))
    sway = D(4) * math.sin(2 * math.pi * 2.0 * (t - 6.3)) * wave_on
    take = -D(7) * pulse(t, 5.15, 5.75)  # pulls back in surprise
    P.rot['chest'] = (lean + take + D(2) * math.sin(ph) * amp + D(-3) * hop / 0.026,
                      sway * 0.5, D(5) * math.sin(ph) * amp + sway)
    # ---- head: looks up the hill, then back down to Grandpa
    hy = keys(t, [(0, -6), (1.9, -4), (2.2, 14), (2.6, 18), (2.75, -10), (3.1, -30), (3.5, -14), (4.4, -12),
                  (6.0, -6), (9.0, -4), (11, -4)])
    hp = keys(t, [(0, -6), (1.7, -4), (2.1, -14), (2.6, -12), (2.95, 2), (3.4, 12), (4.6, 10), (5.2, 8),
                  (5.5, -6), (6.0, 2), (9.5, 0), (11, -2)])
    tilt = keys(t, [(0, 0), (3.4, 0), (3.9, -8), (5.0, -6), (5.6, 6), (7.0, 8), (9.6, 4), (10.4, 9), (11, 8)])
    P.rot['neck'] = (D(hp) * 0.4 - lean * 0.6 - sp['headlag'] * 0.6, 0, D(hy) * 0.3)
    P.rot['head'] = (D(hp) * 0.6 - lean * 0.3 - sp['headlag'], D(tilt), D(hy) * 0.7)
    # ---- arms: out like a little plane while running; follow-through on the stop; the wave
    plane = amp
    for s, sx in (('L', 1), ('R', -1)):
        rock = D(12) * math.sin(ph + (0 if s == 'L' else math.pi)) * plane
        ab = D(68) * plane + D(9)
        swing_fwd = -sp['armfwd'] * 1.0
        sh = (swing_fwd + D(-10) * plane + rock * 0.3, -sx * ab + sx * rock, 0)
        el = (D(-22) - D(10) * plane, 0, 0)
        if s == 'L':
            # the wave (left arm: the near side, so the hand stays clear of his face against the sky)
            rise = smooth((t - 6.15) / 0.45) * (1 - smooth((t - 9.4) / 0.5))
            wv = math.sin(2 * math.pi * 2.0 * (t - 6.5)) * smooth((t - 6.5) / 0.3) * (1 - smooth((t - 9.2) / 0.3))
            sh = (sh[0] * (1 - rise) + D(-14) * rise, sh[1] * (1 - rise) - D(150) * rise, D(18) * rise)
            el = (el[0] * (1 - rise) + D(-26) * rise, -D(34) * wv * rise, 0)
        if s == 'R':
            # small happy fist with the hops of joy
            joy = smooth((t - 5.9) / 0.3) * (1 - smooth((t - 6.9) / 0.4))
            sh = (sh[0] + D(-30) * joy, sh[1] + D(-10) * joy, 0)
            el = (el[0] + D(-70) * joy, 0, 0)
        P.rot['shoulder.' + s] = sh
        P.rot['elbow.' + s] = el
        P.rot['wrist.' + s] = (D(-8), 0, 0)
    # ---- face
    eye_yaw = keys(t, [(0, -4), (1.9, -4), (2.1, 18), (2.55, 20), (2.65, -25), (3.3, -22), (4.0, -10), (6.0, -6),
                       (11, -6)])
    eye_pitch = keys(t, [(0, 0), (2.1, 10), (2.6, 8), (2.8, -6), (3.6, -10), (5.2, -8), (5.6, -2), (11, -4)])
    P.loc['lookT'] = look_vec(D(eye_yaw), D(eye_pitch))
    smile = keys(t, [(0, 0.35), (1.6, 0.5), (2.2, 0.15), (2.8, 0.0), (5.45, 0.0), (5.95, 1.0), (10.6, 1.0),
                     (11, 0.95)])
    o = keys(t, [(0, 0), (3.55, 0), (3.9, 0.55), (4.8, 0.55), (5.3, 0.85), (5.6, 0.0)])
    P.val['smile'] = smile
    P.val['o'] = o * (1 - smile)
    bl = blink(t, [2.62, 4.25, 7.6, 10.3])
    wide = pulse(t, 5.1, 6.0)
    squint = smile * 0.7
    for s in 'LR':
        P.rot['lidU' + s] = (-0.62 - 0.12 * wide + (1.85 + 0.12 * wide) * bl + 0.12 * squint * (1 - bl), 0, 0)
        P.rot['lidD' + s] = (1.05 - 0.28 * squint - 0.2 * bl, 0, 0)
    br = 0.0035 * wide + 0.002 * keys(t, [(0, 0), (2.0, 1), (2.6, 0.5), (3.5, 1.2), (5.0, 1.0), (6, 0.4), (11, 0.4)])
    worry = keys(t, [(0, 0), (3.5, 0), (3.9, 1), (5.1, 1), (5.6, 0)])
    for s, sx in (('L', 1), ('R', -1)):
        P.loc['brow' + s] = br
        P.rot['brow' + s] = (0, sx * 0.25 * worry, 0)
    return P


def sami_springs():
    """Overlapping action computed once for the whole shot."""
    D = math.radians
    n = NFR + 1
    ts = [i / FPS for i in range(n)]
    # deceleration drives a forward overshoot of the chest and a lag of the head and arms
    decel = [pulse(t, 1.45, 1.95) for t in ts]
    lean = spring_track([D(10) * d for d in decel], 160, 10)
    headlag = spring_track([D(-8) * d for d in decel], 90, 6)
    armfwd = spring_track([D(55) * d for d in decel], 110, 7)
    turn = [pulse(t, 3.2, 3.6) for t in ts]
    headlag2 = spring_track([D(6) * d for d in turn], 120, 8)
    return {'lean': lean, 'headlag': [a + b for a, b in zip(headlag, headlag2)], 'armfwd': armfwd}


def grandpa_pose(t):
    P = Pose()
    D = math.radians
    # one slow step at the start, one at the end: stick first, then the foot ("step... tap")
    step1 = ease((t - 0.9) / 0.9)
    step2 = ease((t - 9.75) / 0.9)
    fwd = 0.22 * step1 + 0.22 * step2
    heading = D(38)
    fx, fy = math.sin(heading), -math.cos(heading)
    x = GP_POS[0] - 0.22 * fx + fwd * fx
    y = GP_POS[1] - 0.22 * fy + fwd * fy
    P.loc['root'] = (x, y, float(hill.height(x, y)))
    P.rot['root'] = (0, 0, heading)
    # feet in root space: right foot swings during step 1 and 2, left catches up
    def foot(s, sx):
        base = 0.0
        lift = 0.0
        if s == 'R':
            for st, t0 in ((step1, 0.9), (step2, 9.75)):
                pass
            # right foot leads each step
            y_off = 0.11 - 0.22 * clamp((t - 0.9) / 0.9) if t < 1.8 else -0.11
            y_off = -0.11 + 0.22 * (1 - ease((t - 0.9) / 0.9)) if t < 9.0 else -0.11 + 0.0
            if t >= 9.75:
                y_off = 0.11 - 0.22 * ease((t - 9.75) / 0.9)
            lift = 0.05 * pulse(t, 0.95, 1.8) + 0.05 * pulse(t, 9.8, 10.65)
            # stance foot stays put in the world: express relative to the moving root
            return (sx * 0.1, y_off, 0.065 + lift)
        else:
            # left foot: planted, catches up between steps
            y_off = 0.11 - 0.22 * step1 * 0.0
            plant = 0.0
            catch1 = ease((t - 2.0) / 0.7)
            catch2 = ease((t - 10.4) / 0.6)
            yl = 0.22 * (step1 + step2) - 0.22 * (catch1 + catch2)
            lift = 0.035 * pulse(t, 2.0, 2.7) + 0.035 * pulse(t, 10.4, 11.0)
            return (sx * 0.1, yl, 0.065 + lift)

    sway = D(1.5) * math.sin(2 * math.pi * 0.25 * t)
    breathe = 0.004 * math.sin(2 * math.pi * 0.3 * t)
    hipz = 0.93 - 0.012 * (pulse(t, 0.9, 1.8) + pulse(t, 9.75, 10.65)) + 0.0
    P.loc['hips'] = (0, 0, hipz)
    for s, sx in (('L', 1), ('R', -1)):
        f = foot(s, sx)
        hx, hy, hk = leg_ik((sx * 0.088, 0, hipz - 0.03), f, 0.43, 0.405)
        P.rot['hip.' + s] = (hx, hy * 0.5, 0)
        P.rot['knee.' + s] = (hk, 0, 0)
        P.rot['ankle.' + s] = (-(hx + hk), 0, 0)
    # stooped, unhurried; looks down at the path, then up at Sami; nods while waving
    look_up = smooth((t - 3.3) / 0.9) * (1 - smooth((t - 9.4) / 0.8))
    nod = D(5) * math.sin(2 * math.pi * 0.9 * (t - 5)) * smooth((t - 5.0) / 0.4) * (1 - smooth((t - 8.0) / 0.4))
    wave_on = smooth((t - 4.55) / 0.55) * (1 - smooth((t - 7.9) / 0.6))
    P.rot['chest'] = (D(10) - D(4) * wave_on + breathe, sway, D(-6) * wave_on)
    P.rot['neck'] = (D(4) - D(9) * look_up, 0, D(6) * look_up)
    P.rot['head'] = (D(14) * (1 - look_up) - D(10) * look_up + nod, D(-4) * look_up, D(12) * look_up)
    # left hand holds the stick (forearm forward), right arm hangs, then waves
    stick_fwd = 0.06 * (pulse(t, 0.4, 1.0) + pulse(t, 9.2, 9.8))
    P.rot['shoulder.L'] = (D(-16) - stick_fwd * 3, D(-6), 0)
    P.rot['elbow.L'] = (D(-36), 0, 0)
    P.rot['wrist.L'] = (D(10), 0, D(-10))
    wv = math.sin(2 * math.pi * 1.25 * (t - 5.0)) * smooth((t - 5.0) / 0.35) * (1 - smooth((t - 7.6) / 0.4))
    antic = -D(10) * pulse(t, 4.4, 4.9)
    P.rot['shoulder.R'] = (D(-4) + (D(-18)) * wave_on, D(8) + antic + D(142) * wave_on, D(-14) * wave_on)
    P.rot['elbow.R'] = (D(-14) - D(30) * wave_on, D(28) * wv * wave_on, 0)
    P.rot['wrist.R'] = (D(-6) * wave_on, D(10) * wv * wave_on, 0)
    # stick tip target (ground, ahead-left of his left foot); it moves forward when he steps
    tip_fwd = 0.25 * (ease((t - 0.45) / 0.5) + ease((t - 9.25) / 0.5))
    P.loc['stickT'] = (0.17, -0.18 - tip_fwd + 0.22 * step1 + 0.22 * step2, 0.0)
    # face: kind smile in the eyes; the smile grows as he sees Sami
    sm = keys(t, [(0, 0.25), (3.6, 0.3), (4.4, 0.95), (9.5, 0.9), (11, 0.7)])
    P.val['smile'] = sm
    bl = blink(t, [2.9, 6.6, 9.5], 0.2)
    for s in 'LR':
        P.rot['lidU' + s] = (-0.12 + 0.12 * sm + 1.5 * bl, 0, 0)
        P.rot['lidD' + s] = (0.62 - 0.22 * sm - 0.15 * bl, 0, 0)
    eyp = keys(t, [(0, -14), (3.3, -14), (4.0, 6), (11, 4)])
    eyy = keys(t, [(0, 0), (3.3, 0), (4.0, 6), (11, 6)])
    P.loc['lookT'] = look_vec(D(eyy), D(eyp))
    for s, sx in (('L', 1), ('R', -1)):
        P.loc['brow' + s] = 0.003 * look_up
        P.rot['brow' + s] = (0, -sx * 0.12 * sm, 0)
    return P


# ---------------------------------------------------------------------------------------------- apply


def apply_pose(ch, P, frame):
    for name, r in P.rot.items():
        o = ch.j.get(name) or ch.face.get(name)
        if o is None:
            continue
        o.rotation_euler = r
        o.keyframe_insert('rotation_euler', frame=frame)
    for name, l in P.loc.items():
        if name.startswith('brow'):
            o = ch.face[name]
            base = o.get('rest_z')
            if base is None:
                o['rest_z'] = o.location.z
                base = o.location.z
            o.location.z = base + l
            o.keyframe_insert('location', frame=frame)
            continue
        if name == 'stickT':
            o = ch.face['stickT']
        else:
            o = ch.j.get(name) or ch.face.get(name)
        o.location = l
        o.keyframe_insert('location', frame=frame)
    kb = ch.face['head'].data.shape_keys.key_blocks
    for k, v in P.val.items():
        kb[k].value = clamp(v)
        kb[k].keyframe_insert('value', frame=frame)


def camera_state(t):
    u = ease(t / DUR)
    x = 0.1 + 0.22 * u
    y = -0.25 + 0.5 * u
    z = float(hill.height(x, y)) + 0.34 + 0.03 * u
    tx = -0.42 + 0.1 * u
    ty = 4.0
    tz = 0.8 - 0.02 * u
    return (x, y, z), (tx, ty, tz)


def build(scene_only=False):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.fps = FPS
    sc.frame_start, sc.frame_end = 1, NFR

    ground = hill.build_terrain()
    hill.build_far_hills()
    gcoll, fcoll, fmats = hill.build_plants(ground)
    sun, sky, sdir = hill.build_sky_and_sun(sun_elev_deg=8.0, sun_azim_deg=-100.0, sun_strength=6.0)

    # hero anemones close to the action and the lens (hand-placed for composition)
    hero = [(0.95, 3.35, 0.22, 1.1), (1.15, 2.85, 0.18, 1.0), (0.2, 3.5, 0.2, 1.0), (-0.35, 1.3, 0.16, 1.2),
            (0.42, 1.05, 0.14, 1.3), (-0.6, 2.0, 0.2, 1.0), (1.4, 2.2, 0.17, 1.1), (-1.6, 5.2, 0.22, 1.0),
            (-2.0, 7.1, 0.2, 1.0), (-3.0, 7.9, 0.22, 1.0), (0.75, 0.6, 0.12, 1.2), (-0.15, 0.62, 0.1, 1.1)]
    for i, (x, y, h, s) in enumerate(hero):
        hill.place_anemone(fcoll, fmats, f'hero_anem{i}', x, y, 0.8 + 0.2 * (i % 2), h, 100 + i, s, i * 0.7)

    # ladybird on a broad leaf in the foreground
    leafmat = principled('Leaf', '#5f8c25', rough=0.5, thin=True, transmission=0.35, sheen=0.3)
    hill.add_haze(leafmat, 0.006)
    leaf = hill.build_leaf('ForeLeaf', 0.12, 0.04, leafmat)
    (cx0, cy0, cz0), (tx0, ty0, tz0) = camera_state(0.0)
    fwd = (Vector((tx0, ty0, tz0)) - Vector((cx0, cy0, cz0))).normalized()
    right = fwd.cross(Vector((0, 0, 1))).normalized()
    up = right.cross(fwd)
    tanh_ = 18 / 40.0
    tanv = tanh_ * 720 / 1280
    sxn, syn = 0.24, 0.30  # where the ladybird sits in the first frame (0..1 from left / bottom)
    ray = (fwd + right * (2 * sxn - 1) * tanh_ + up * (2 * syn - 1) * tanv).normalized()
    lp = Vector((cx0, cy0, cz0)) + ray * 0.8 - Vector((0, 0.06, 0.0))
    lx, ly = lp.x, lp.y
    leaf.location = lp
    leaf.rotation_euler = (math.radians(-14), math.radians(10), math.radians(-24))
    from lib import tube_path
    g0 = float(hill.height(lx, ly))
    tube_path('ForeLeaf.stem', [(lx + 0.012, ly - 0.01, g0 - 0.02), (lx + 0.008, ly - 0.006, (g0 + lp.z) / 2),
                                (lx, ly, lp.z)], [0.0026, 0.0022, 0.0018], hill.flower_materials()[2], None, 6, False, 1)
    for k in range(3):  # a few lower leaves on the weed stalk
        a = 1.3 + 2.1 * k
        zz = g0 + (lp.z - g0) * (0.25 + 0.2 * k)
        tube_path(f'ForeLeaf.l{k}', [(lx + 0.008, ly - 0.005, zz), (lx + 0.008 + 0.03 * math.cos(a), ly + 0.03 * math.sin(a), zz + 0.02),
                                     (lx + 0.008 + 0.055 * math.cos(a), ly + 0.055 * math.sin(a), zz + 0.01)],
                  [0.002, 0.007, 0.001], leafmat, None, 8, False, 1)
    bug = hill.build_ladybird(leaf)
    bug.scale = (1.15, 1.15, 1.15)

    sami = build_sami()
    gp = build_grandpa()
    # stick tip target lives in Grandpa's root space
    st = empty('Grandpa.stickT', (0.17, -0.2, 0), gp.root, 0.03)
    gp.face['stickT'] = st
    c = gp.j['stick'].constraints.new('DAMPED_TRACK'); c.target = st; c.track_axis = 'TRACK_NEGATIVE_Z'

    # eye catchlight card: seen only in reflections, a soft second highlight in every eye

    # camera
    cam = bpy.data.cameras.new('Cam')
    cam.lens = 40
    cam.sensor_width = 36
    cam.dof.use_dof = True
    cam.dof.aperture_fstop = 2.0
    cam.dof.aperture_blades = 7
    cam.dof.aperture_ratio = 1.0
    co = bpy.data.objects.new('Cam', cam)
    sc.collection.objects.link(co)
    sc.camera = co
    tgt = empty('CamTarget', (0, 3, 1), None, 0.05)
    tr = co.constraints.new('TRACK_TO'); tr.target = tgt; tr.track_axis = 'TRACK_NEGATIVE_Z'; tr.up_axis = 'UP_Y'
    # eye catchlight card: a soft disc beside the lens, seen only in glossy reflections (second highlight)
    em = bpy.data.materials.new('CatchCard'); em.use_nodes = True
    ent = em.node_tree
    for n_ in list(ent.nodes):
        if n_.type != 'OUTPUT_MATERIAL':
            ent.nodes.remove(n_)
    e_ = ent.nodes.new('ShaderNodeEmission'); e_.inputs['Color'].default_value = lin('#fff3e4')
    e_.inputs['Strength'].default_value = 3.0
    ent.links.new(e_.outputs[0], ent.nodes['Material Output'].inputs['Surface'])
    from lib import ellipsoid
    card = ellipsoid('CatchCard', 0.22, 0.22, 0.01, em, co, (0.35, 0.25, 0.1), 16, 0)
    card.rotation_euler = (0, 0, 0)
    for vis in ('visible_camera', 'visible_diffuse', 'visible_shadow', 'visible_transmission', 'visible_volume_scatter'):
        setattr(card, vis, False)

    # ---- animation
    springs = sami_springs()
    bug0 = Vector((0.0, 0.03, 0.0))
    for f in range(1, NFR + 1):
        t = (f - 1) / FPS
        sp = {k: v[f - 1] for k, v in springs.items()}
        apply_pose(sami, sami_pose(t, sp), f)
        apply_pose(gp, grandpa_pose(t), f)
        (cx, cy, cz), (tx, ty, tz) = camera_state(t)
        co.location = (cx, cy, cz); co.keyframe_insert('location', frame=f)
        tgt.location = (tx, ty, tz); tgt.keyframe_insert('location', frame=f)
        # ladybird walks slowly along the leaf (local +Y), with a tiny side-to-side gait
        lyb = 0.025 + 0.05 * (t / DUR)
        z_leaf = 0.25 * 0.12 * (lyb / 0.12) ** 2
        bug.location = (0.0015 * math.sin(t * 9), lyb, z_leaf + 0.0016)
        bug.rotation_euler = (-math.atan(0.5 * lyb / 0.12) * 1.0, 0, math.pi + 0.08 * math.sin(t * 4.5))
        bug.keyframe_insert('location', frame=f); bug.keyframe_insert('rotation_euler', frame=f)
        # focus: ladybird first, then pull to Sami as he stops, ease a little toward Grandpa while he waves
        cam_p = Vector((cx, cy, cz))
        bug_w = leaf.matrix_world @ Vector((0, lyb, z_leaf))
        d_bug = (bug_w - cam_p).length
        sx, sy = SAMI_STOP
        d_sami = (Vector((sx, sy, float(hill.height(sx, sy)) + 0.78)) - cam_p).length
        fd = keys(t, [(0, d_bug), (1.25, d_bug), (2.35, d_sami), (11, d_sami)])
        cam.dof.focus_distance = fd
        cam.dof.keyframe_insert('focus_distance', frame=f)
    return sc, sami, gp, co


def render_settings(sc, res, samples, blur):
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = samples
    sc.cycles.use_adaptive_sampling = True
    sc.cycles.adaptive_threshold = 0.02
    sc.cycles.use_denoising = True
    sc.cycles.denoiser = 'OPENIMAGEDENOISE'
    sc.cycles.max_bounces = 6
    sc.cycles.diffuse_bounces = 3
    sc.cycles.glossy_bounces = 2
    sc.cycles.transmission_bounces = 4
    sc.cycles.transparent_max_bounces = 8
    sc.cycles.caustics_reflective = False
    sc.cycles.caustics_refractive = False
    sc.cycles.sample_clamp_indirect = 6.0
    sc.cycles_curves.shape = 'THICK'
    sc.render.use_persistent_data = True
    rx, ry = res.split('x')
    sc.render.resolution_x, sc.render.resolution_y = int(rx), int(ry)
    sc.render.resolution_percentage = 100
    sc.render.use_motion_blur = blur
    sc.render.motion_blur_shutter = 0.5
    sc.view_settings.view_transform = 'AgX'
    sc.view_settings.look = 'AgX - Medium High Contrast'
    sc.view_settings.exposure = 0.0
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_depth = '8'
    sc.render.film_transparent = False


def frame_list(spec):
    if '-' in spec and ',' not in spec:
        a, b = spec.split('-')
        return list(range(int(a), int(b) + 1))
    return [int(x) for x in spec.split(',')]


if __name__ == '__main__':
    t0 = time.time()
    sc, sami, gp, cam = build()
    render_settings(sc, arg('res', '1280x720'), int(arg('samples', '48')), arg('blur', '1') == '1')
    if arg('save', None):
        bpy.ops.wm.save_as_mainfile(filepath=arg('save', None))
    out = arg('out', '/tmp/a04')
    os.makedirs(out, exist_ok=True)
    print(f'BUILD {time.time() - t0:.1f}s', flush=True)
    for f in frame_list(arg('frames', '1')):
        p = os.path.join(out, f'f{f:04d}.png')
        if os.path.exists(p) and arg('skip', '1') == '1' and '--force' not in argv:
            continue
        t1 = time.time()
        sc.frame_set(f)
        sc.render.filepath = p
        bpy.ops.render.render(write_still=True)
        print(f'FRAME {f} {time.time() - t1:.1f}s', flush=True)
