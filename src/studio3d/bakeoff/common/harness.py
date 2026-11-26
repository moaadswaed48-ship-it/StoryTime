"""Mechanics shared by every film entry: arguments, the shot table, the picture loop, safe file writes.

No art lives here. A film entry (src/studio3d/bakeoff/entry/film.py) looks like this:

    import os, sys
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
    from common import harness

    def build_shot(ctx):
        ...build everything this shot needs in the empty Blender file, key the animation for
        ctx.first .. ctx.last (frame numbers of the whole film), set the camera and the render settings...

    if __name__ == '__main__':
        harness.main(build_shot)

and is run through the wrapper, never by calling Blender directly:

    bash studio/scripts/bakeoff/blender.sh LABEL -- --python src/studio3d/bakeoff/entry/film.py -- \
        --out DIR --frames SPEC [--shots S2,S5] [--res 1280x720] [--quality final|preview] [--force]

--frames  all | gate | 168 | 109-204 | 168,492,600      (numbers are film frame numbers, 1 to 720)
          "gate" is the first, middle and last picture of each shot.
--shots   limit to these shots. Frames 619-630 belong to both S6 and S7 (the dissolve), so both shots draw them.
Pictures are written to DIR/<shot id>/f0001.png. A picture that already exists and is a valid PNG is skipped
unless --force is given. Each picture is written to a temporary name first and renamed when complete.
"""
import argparse
import json
import os
import sys
import time

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..'))
SHOTS_FILE = os.path.join(REPO, 'docs', 'film', 'bakeoff', 'shots.json')
FPS = 24


def add_paths():
    """Makes `import lib`, `import hill` (src/studio3d/blender) and `from common import ...` work."""
    for p in (os.path.join(REPO, 'src', 'studio3d', 'blender'), os.path.join(REPO, 'src', 'studio3d', 'bakeoff')):
        if p not in sys.path:
            sys.path.insert(0, p)


def load_shots():
    with open(SHOTS_FILE) as f:
        return json.load(f)['shots']


class Ctx:
    """What a shot build is told. Frame numbers are those of the whole film (1 to 720)."""

    def __init__(self, shot, quality, res, samples_scale, device):
        self.shot = shot                      # the shot's row from shots.json
        self.id = shot['id']                  # 'S1' .. 'S7'
        self.first = shot['first']            # first frame of the shot in the film
        self.last = shot['last']              # last frame of the shot in the film
        self.render_first = shot.get('render_first', shot['first'])   # S7 starts drawing at 619 for the dissolve
        self.render_last = shot.get('render_last', shot['last'])      # S6 keeps drawing until 630 for the dissolve
        self.sync = shot.get('sync', {})      # named frames the story must hit
        self.quality = quality                # 'final' or 'preview' (what preview means is the entry's choice)
        self.res = res                        # (width, height)
        self.samples_scale = samples_scale    # the harness multiplies the Cycles sample count by this after the build
        self.device = device                  # 'CPU' or 'GPU'
        self.fps = FPS

    def seconds(self, frame):
        """Seconds since the shot's first frame."""
        return (frame - self.first) / FPS


def valid_png(path):
    try:
        if os.path.getsize(path) < 200:
            return False
        with open(path, 'rb') as f:
            head = f.read(8)
            f.seek(-12, 2)
            tail = f.read(12)
        return head == b'\x89PNG\r\n\x1a\n' and tail[4:8] == b'IEND'
    except OSError:
        return False


def _args():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    ap = argparse.ArgumentParser(prog='film.py')
    ap.add_argument('--out', required=True)
    ap.add_argument('--frames', default='gate')
    ap.add_argument('--shots', default='')
    ap.add_argument('--res', default='1280x720')
    ap.add_argument('--quality', default='final', choices=['final', 'preview'])
    ap.add_argument('--samples-scale', type=float, default=1.0)
    ap.add_argument('--device', default='CPU', choices=['CPU', 'GPU'])
    ap.add_argument('--force', action='store_true')
    return ap.parse_args(argv)


def _select(spec, only, shots):
    """Returns {shot id: sorted frames to draw}."""
    want = {}
    for sh in shots:
        if only and sh['id'] not in only:
            continue
        lo, hi = sh.get('render_first', sh['first']), sh.get('render_last', sh['last'])
        if spec == 'all':
            fr = list(range(lo, hi + 1))
        elif spec == 'gate':
            fr = [sh['first'], (sh['first'] + sh['last']) // 2, sh['last']]
        else:
            fr = []
            for part in spec.split(','):
                part = part.strip()
                if not part:
                    continue
                if '-' in part:
                    a, b = part.split('-')
                    fr += list(range(int(a), int(b) + 1))
                else:
                    fr.append(int(part))
            fr = [n for n in fr if lo <= n <= hi]
        if fr:
            want[sh['id']] = sorted(set(fr))
    return want


def _use_gpu(scene):
    """Best effort for a machine with a graphics card; falls back to the processor."""
    try:
        prefs = bpy.context.preferences.addons['cycles'].preferences
        for kind in ('METAL', 'OPTIX', 'CUDA', 'HIP', 'ONEAPI'):
            try:
                prefs.compute_device_type = kind
            except TypeError:
                continue
            prefs.get_devices()
            devs = [d for d in prefs.devices if d.type == kind]
            if devs:
                for d in prefs.devices:
                    d.use = d.type == kind
                scene.cycles.device = 'GPU'
                print(f'HARNESS drawing on the graphics card ({kind})', flush=True)
                return
    except Exception as e:  # noqa: BLE001
        print(f'HARNESS graphics card not usable: {e}', flush=True)
    scene.cycles.device = 'CPU'
    print('HARNESS no graphics card found; drawing on the processor', flush=True)


def _enforce(scene, a, res):
    r = scene.render
    r.resolution_x, r.resolution_y = res
    r.resolution_percentage = 100
    r.image_settings.file_format = 'PNG'
    r.image_settings.color_mode = 'RGB'
    r.image_settings.color_depth = '8'
    r.image_settings.compression = 15
    r.use_file_extension = True
    r.fps = FPS
    r.compositor_device = 'CPU'      # the factory default ('GPU') ends Blender on a machine without a graphics card
    if r.engine == 'CYCLES':
        c = scene.cycles
        if a.device == 'GPU':
            _use_gpu(scene)
        else:
            c.device = 'CPU'
        c.time_limit = 0
        if a.samples_scale != 1.0:
            c.samples = max(1, int(round(c.samples * a.samples_scale)))
            print(f'HARNESS samples scaled by {a.samples_scale:.3f} to {c.samples}', flush=True)


def main(build_shot, reset_between_shots=True, sequential=False):
    """Draws the requested pictures. `build_shot(ctx)` is called once per shot, in an empty Blender file.

    reset_between_shots=False keeps the Blender file between shots in one process (the finished film is drawn one shot
    per process, so a shot must still build correctly on its own).
    sequential=True steps through every frame from the shot's first drawn frame up to each requested picture, in order.
    Needed only if a picture depends on earlier frames (simulation zones, cloth): without it a restarted or partial
    drawing would differ from a full one.
    """
    a = _args()
    w, h = (int(v) for v in a.res.lower().split('x'))
    shots = load_shots()
    only = [s.strip() for s in a.shots.split(',') if s.strip()]
    want = _select(a.frames, only, shots)
    built_any = False
    for sh in shots:
        frames = want.get(sh['id'])
        if not frames:
            continue
        outdir = os.path.join(a.out, sh['id'])
        os.makedirs(outdir, exist_ok=True)
        todo = [n for n in frames if a.force or not valid_png(os.path.join(outdir, f'f{n:04d}.png'))]
        if not todo:
            print(f'SHOT {sh["id"]} nothing to draw', flush=True)
            continue
        if reset_between_shots or not built_any:
            bpy.ops.wm.read_factory_settings(use_empty=True)
        built_any = True
        scene = bpy.context.scene
        scene.render.fps = FPS
        scene.frame_start = sh.get('render_first', sh['first'])
        scene.frame_end = sh.get('render_last', sh['last'])
        ctx = Ctx(sh, a.quality, (w, h), a.samples_scale, a.device)
        t0 = time.time()
        build_shot(ctx)
        print(f'BUILD {sh["id"]} {time.time() - t0:.1f}', flush=True)
        scene = bpy.context.scene
        _enforce(scene, a, (w, h))
        stepped = scene.frame_start - 1
        for n in todo:
            t1 = time.time()
            if sequential:
                for k in range(stepped + 1, n):
                    scene.frame_set(k)
                stepped = n
            scene.frame_set(n)
            tmp = os.path.join(outdir, f'.tmp-f{n:04d}.png')
            scene.render.filepath = tmp
            bpy.ops.render.render(write_still=True)
            if not valid_png(tmp):
                raise RuntimeError(f'picture {n} of {sh["id"]} was not written correctly')
            os.replace(tmp, os.path.join(outdir, f'f{n:04d}.png'))
            print(f'FRAME {sh["id"]} {n} {time.time() - t1:.1f}', flush=True)
    print('HARNESS film.py finished', flush=True)
