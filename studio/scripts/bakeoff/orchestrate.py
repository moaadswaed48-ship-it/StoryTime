#!/usr/bin/env python3
"""Organiser's side of the film test (never used by a film workspace).

  orchestrate.py new-run [--tag TAG] [--note TEXT]   make a workspace under a random name; prints its path
  orchestrate.py check NAME                           contract checks on a live workspace
  orchestrate.py finish NAME                          freeze the workspace, move it to the store, set the samples scale
  orchestrate.py final-start NAME                     start the finished film's drawing in the background (lowest priority)
  orchestrate.py final NAME                           (internal) the drawing worker
  orchestrate.py resume                               restart interrupted drawings; print the state of every run
  orchestrate.py encode NAME                          pictures + sound -> film.mp4, contact sheet, facts
  orchestrate.py seal NAME                            pack the run into bakeoff/sealed/NAME.tar.gz in the main project
  orchestrate.py audit NAME TRANSCRIPT...             look for contact with other runs, downloads, direct Blender calls
  orchestrate.py determinism NAME                     redraw two speed-check pictures and compare
  orchestrate.py owner-sheet NAME OUT.jpg             the 21 speed-check pictures as one sheet for a phone
  orchestrate.py status
"""
import base64
import fcntl
import hashlib
import json
import os
import re
import resource
import secrets
import shutil
import subprocess
import sys
import tarfile
import threading
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import env  # noqa: E402
import run_tools  # noqa: E402

MAIN_REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
PRIVATE = '/root/.bakeoff'
VAULT = os.path.join(PRIVATE, 'vault')
REGISTRY = os.path.join(PRIVATE, 'registry.json')
FINAL_LOCK = os.path.join(PRIVATE, 'final.lock')
SEALED = os.path.join(MAIN_REPO, 'bakeoff', 'sealed')
ENTRY_REL = os.path.join('src', 'studio3d', 'bakeoff', 'entry')
ALLOWED_EXT = {'.py', '.mjs', '.json', '.md'}
NOISE = re.compile(r'^(Fra:|Saved:|\s*Time:|Blender \d|Blender quit|Read prefs|Read blend|Writing:|\s*$'
                   r'|\d\d:\d\d[.:]\d+\s+\w+\s+\|\s+(Saved:|WARNING CUEW))')


def now():
    return time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())


def load_json(path, default=None):
    try:
        with open(path) as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


def save_json(path, data):
    tmp = path + '.tmp'
    with open(tmp, 'w') as f:
        json.dump(data, f, indent=1)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, path)


def registry():
    return load_json(REGISTRY, {})


def save_registry(reg):
    os.makedirs(PRIVATE, exist_ok=True)
    save_json(REGISTRY, reg)
    os.makedirs(SEALED, exist_ok=True)
    with open(os.path.join(SEALED, 'registry.b64'), 'w') as f:
        f.write(base64.b64encode(json.dumps(reg).encode()).decode() + '\n')


def live(name):
    return os.path.join(env.BAKE_ROOT, name)


def stored(name):
    return os.path.join(VAULT, name)


def where(name):
    for p in (stored(name), live(name)):
        if os.path.isdir(p):
            return p
    sys.exit(f'no such run: {name}')


def shots():
    with open(os.path.join(MAIN_REPO, 'docs', 'film', 'bakeoff', 'shots.json')) as f:
        return json.load(f)


def sh(cmd, **kw):
    return subprocess.run(cmd, text=True, capture_output=True, **kw)


# ---------------------------------------------------------------- new-run
def cmd_new_run(argv):
    tag, note = 'bakeoff-base', ''
    if '--tag' in argv:
        tag = argv[argv.index('--tag') + 1]
    if '--note' in argv:
        note = argv[argv.index('--note') + 1]
    reg = registry()
    alphabet = 'bcdfghjkmnpqrstvwxz'
    while True:
        name = 'run-' + ''.join(secrets.choice(alphabet) for _ in range(4))
        if name not in reg:
            break
    if sh(['git', '-C', MAIN_REPO, 'rev-parse', '--verify', '--quiet', 'refs/tags/' + tag]).returncode != 0:
        sys.exit('no such tag: ' + tag)
    root = live(name)
    os.makedirs(root)
    r = sh(['git', 'clone', '--quiet', '--depth', '1', '--branch', tag, 'file://' + MAIN_REPO, os.path.join(root, 'repo')])
    if r.returncode != 0:
        shutil.rmtree(root, ignore_errors=True)
        sys.exit('clone failed: ' + r.stderr)
    repo = os.path.join(root, 'repo')
    sh(['git', '-C', repo, 'remote', 'remove', 'origin'])
    commit = sh(['git', '-C', repo, 'rev-parse', 'HEAD']).stdout.strip()
    for d in ('out', 'logs', 'gate'):
        os.makedirs(os.path.join(root, d), exist_ok=True)
    canary = 'marker-' + secrets.token_hex(8)
    with open(os.path.join(repo, ENTRY_REL, 'MARKER.md'), 'w') as f:
        f.write(f'Workspace marker: {canary}. Leave this file in place.\n')
    brief = os.path.join(repo, 'docs', 'film', 'bakeoff', 'BRIEF.md')
    brief_sha = hashlib.sha256(open(brief, 'rb').read()).hexdigest() if os.path.isfile(brief) else None
    reg[name] = {'created': now(), 'tag': tag, 'commit': commit, 'canary': canary, 'note': note, 'brief_sha256': brief_sha,
                 'agents': []}
    save_registry(reg)
    print(root)


# ---------------------------------------------------------------- check
def wav_facts(path):
    r = sh(['ffprobe', '-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=sample_rate,channels,duration_ts',
            '-of', 'json', path])
    try:
        s = json.loads(r.stdout)['streams'][0]
        return int(s['sample_rate']), int(s['channels']), int(s['duration_ts'])
    except Exception:  # noqa: BLE001
        return None


def cmd_check(argv):
    name = argv[0]
    root = where(name)
    repo = os.path.join(root, 'repo')
    entry = os.path.join(repo, ENTRY_REL)
    out = {'name': name, 'problems': []}
    for f in ('film.py', 'sound.mjs', 'README.md', 'PROGRESS.md', 'MARKER.md'):
        if not os.path.isfile(os.path.join(entry, f)):
            out['problems'].append(f'missing {f}')
    odd = []
    for base, dirs, files in os.walk(entry):
        dirs[:] = [d for d in dirs if d != '__pycache__']
        for f in files:
            if os.path.splitext(f)[1] not in ALLOWED_EXT:
                odd.append(os.path.relpath(os.path.join(base, f), entry))
    if odd:
        out['problems'].append('files of other kinds in the entry folder: ' + ', '.join(odd[:20]))
    st = sh(['git', '-C', repo, 'status', '--porcelain']).stdout.splitlines()
    outside = [ln for ln in st if ENTRY_REL not in ln and '__pycache__' not in ln]
    if outside:
        out['problems'].append('changes outside the entry folder: ' + '; '.join(outside[:20]))
    bench = os.path.join(root, 'gate', 'bench.json')
    if os.path.isfile(bench):
        out['bench'] = json.load(open(bench))
        if not out['bench'].get('pass'):
            out['problems'].append('the speed check did not pass')
    else:
        out['problems'].append('no speed check was run')
    if os.path.isfile(os.path.join(entry, 'sound.mjs')):
        wav = os.path.join(root, 'out', '_check-sound.wav')
        try:
            r = sh(['node', os.path.join(entry, 'sound.mjs'), '--out', wav], cwd=repo, timeout=900)
            facts = wav_facts(wav) if r.returncode == 0 else None
            out['sound'] = facts
            if r.returncode != 0:
                out['problems'].append('sound.mjs failed: ' + (r.stderr or r.stdout)[-400:])
            elif facts != (48000, 2, 1440000):
                out['problems'].append(f'sound is {facts}, expected (48000, 2, 1440000)')
        except subprocess.TimeoutExpired:
            out['problems'].append('sound.mjs did not finish in 15 minutes')
    out.update(ledger_facts(name, root))
    print(json.dumps(out, indent=1))


def ledger_file(name, root):
    for p in (os.path.join(root, 'ledger-organiser.jsonl'), os.path.join(env.BAKE_ROOT, '.ledgers', name + '.jsonl')):
        if os.path.isfile(p):
            return p
    return None


def ledger_facts(name, root):
    p = ledger_file(name, root)
    rows = []
    if p:
        for line in open(p):
            try:
                rows.append(json.loads(line))
            except ValueError:
                pass
    ends = [r for r in rows if r.get('event') == 'end']
    return {'test_s': round(sum(r.get('wall_s') or 0 for r in ends if r.get('kind') == 'test')),
            'gate_s': round(sum(r.get('wall_s') or 0 for r in ends if r.get('kind') == 'gate')),
            'gate_attempts': len([r for r in rows if r.get('event') == 'start' and r.get('kind') == 'gate']),
            'calls': len([r for r in rows if r.get('event') == 'start']),
            'stopped_from_outside': len([r for r in ends if r.get('exit') == 'stopped from outside' or r.get('stopped')])}


# ---------------------------------------------------------------- finish
def cmd_finish(argv):
    name = argv[0]
    src = live(name)
    if not os.path.isdir(src):
        sys.exit('not a live workspace: ' + name)
    scale, why = 1.0, 'speed check passed'
    bench_path = os.path.join(src, 'gate', 'bench.json')
    bench = json.load(open(bench_path)) if os.path.isfile(bench_path) else None
    if not bench or not bench.get('complete'):
        sys.exit('no complete speed check: this run needs a repair ticket before it can be finished')
    if not bench.get('pass'):
        scale = min(1.0, max(0.4, round(env.GATE_PASS_S / max(1.0, bench['predicted_s']), 3)))
        why = f"speed check not passed (predicted {bench['predicted_s']}s, exit {bench.get('exit')}); fixed rule sets samples to {scale}"
    os.makedirs(VAULT, exist_ok=True)
    dst = stored(name)
    os.makedirs(os.path.join(env.BAKE_ROOT, '.lock'), exist_ok=True)
    with open(os.path.join(env.BAKE_ROOT, '.lock', 'foreground.lock'), 'w') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)          # no wrapper call may be running while the workspace moves
        shutil.move(src, dst)
        mirror = os.path.join(env.BAKE_ROOT, '.ledgers', name + '.jsonl')
        if os.path.isfile(mirror):
            shutil.move(mirror, os.path.join(dst, 'ledger-organiser.jsonl'))
    entry = os.path.join(dst, 'repo', ENTRY_REL)
    sums = {}
    for base, dirs, files in os.walk(entry):
        dirs[:] = [d for d in dirs if d != '__pycache__']
        for f in sorted(files):
            p = os.path.join(base, f)
            sums[os.path.relpath(p, entry)] = hashlib.sha256(open(p, 'rb').read()).hexdigest()
    os.makedirs(os.path.join(dst, 'final'), exist_ok=True)
    with open(os.path.join(dst, 'final', 'frozen.json'), 'w') as f:
        json.dump({'frozen_at': now(), 'samples_scale': scale, 'why': why, 'files': sums}, f, indent=1)
    reg = registry()
    reg.setdefault(name, {})['finished'] = now()
    reg[name]['samples_scale'] = scale
    save_registry(reg)
    print(json.dumps({'stored': dst, 'samples_scale': scale, 'why': why}))


# ---------------------------------------------------------------- final
def shot_missing(frames_dir, shot):
    lo, hi = shot.get('render_first', shot['first']), shot.get('render_last', shot['last'])
    return [n for n in range(lo, hi + 1) if not run_tools.valid_png(os.path.join(frames_dir, shot['id'], f'f{n:04d}.png'))]


def write_progress(root, data):
    save_json(os.path.join(root, 'final', 'progress.json'), data)


SILENCE_S = 4 * 3600                      # no output for this long (wall time): the Blender process is taken as hung
TICKS = os.sysconf('SC_CLK_TCK')


def proc_cpu(pid):
    """Processor seconds used so far by a live process (all its threads)."""
    try:
        with open(f'/proc/{pid}/stat') as f:
            rest = f.read().rsplit(')', 1)[1].split()
        return (int(rest[11]) + int(rest[12])) / TICKS
    except (OSError, IndexError, ValueError):
        return None


def draw_shot(root, repo, frames_dir, sid, scale, prog, idle):
    """One Blender process for one shot. Returns 'ended', 'silent', 'cap1' or 'cap2'."""
    fdir = os.path.join(root, 'final')
    cmd = idle + ['nice', '-n', '19', env.BLENDER, '-b', '--factory-startup', '--python-exit-code', '1',
                  '--python', os.path.join(repo, ENTRY_REL, 'film.py'), '--', '--out', frames_dir,
                  '--frames', 'all', '--shots', sid, '--res', env.RES, '--quality', 'final', '--samples-scale', str(scale)]
    cpu_before = prog['cpu_s']
    log = open(os.path.join(fdir, 'render.log'), 'a')
    log.write(f'=== {now()} {sid} scale {scale}\n')
    log.flush()
    p = subprocess.Popen(cmd, cwd=repo, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, errors='replace')
    last = {'t': time.time()}

    def pump():
        for line in p.stdout:
            last['t'] = time.time()
            if not NOISE.match(line):
                log.write(line)
                log.flush()

    th = threading.Thread(target=pump, daemon=True)
    th.start()
    result, saved = 'ended', time.time()
    while True:
        try:
            p.wait(timeout=15)
            break
        except subprocess.TimeoutExpired:
            pass
        used = proc_cpu(p.pid)
        if used is not None:
            prog['cpu_s'] = round(cpu_before + used, 1)
        machine = prog['cpu_s'] / 4.0
        if time.time() - last['t'] > SILENCE_S:
            result = 'silent'
        elif machine > 2.0 * env.FINAL_CAP_S:
            result = 'cap2'
        elif machine > 1.25 * env.FINAL_CAP_S and prog.get('over_cap_stage', 0) == 0:
            result = 'cap1'
        if result != 'ended':
            p.kill()
            p.wait()
            break
        if time.time() - saved > 60:
            write_progress(root, prog)
            saved = time.time()
    th.join(timeout=5)
    log.write(f'=== {now()} {sid} {result} exit {p.returncode}\n')
    log.close()
    write_progress(root, prog)
    return result


def cmd_final(argv):
    name = argv[0]
    root = stored(name)
    repo = os.path.join(root, 'repo')
    fdir = os.path.join(root, 'final')
    frames_dir = os.path.join(fdir, 'frames')
    os.makedirs(frames_dir, exist_ok=True)
    mine = open(os.path.join(fdir, 'worker.lock'), 'w')
    try:
        fcntl.flock(mine, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except OSError:
        print('another worker already has this run')
        return
    frozen = load_json(os.path.join(fdir, 'frozen.json'), {})
    prog = load_json(os.path.join(fdir, 'progress.json')) or {'cpu_s': 0.0, 'restarts': -1, 'shots': {}, 'over_cap_stage': 0,
                                                              'scale_now': frozen.get('samples_scale', 1.0)}
    prog['restarts'] = prog.get('restarts', -1) + 1
    prog['state'] = 'waiting for the machine'
    prog.setdefault('started', now())
    write_progress(root, prog)
    os.makedirs(PRIVATE, exist_ok=True)
    idle = ['chrt', '-i', '0'] if sh(['chrt', '-i', '0', 'true']).returncode == 0 else []
    failed = None
    with open(FINAL_LOCK, 'w') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)              # one finished film is drawn at a time, in the order they queued
        for shot in shots()['shots']:
            sid = shot['id']
            attempt = 0
            while not failed:
                missing = shot_missing(frames_dir, shot)
                if not missing:
                    break
                attempt += 1
                if attempt > 3:
                    break
                prog['state'] = f'drawing {sid} ({len(missing)} pictures left, attempt {attempt})'
                write_progress(root, prog)
                result = draw_shot(root, repo, frames_dir, sid, prog['scale_now'], prog, idle)
                if result == 'cap1':                  # far over the limit: the rest is drawn with half the samples
                    prog['over_cap_stage'] = 1
                    prog['scale_now'] = round(prog['scale_now'] * 0.5, 3)
                    prog.setdefault('notes', []).append(f'{now()} passed 1.25 x the limit during {sid}; samples halved')
                    attempt -= 1
                elif result == 'cap2':
                    failed = f'stopped at twice the limit during {sid}'
                elif result == 'silent':
                    prog.setdefault('notes', []).append(f'{now()} {sid} gave no output for {SILENCE_S}s; process ended')
            prog['shots'][sid] = {'missing': len(shot_missing(frames_dir, shot))}
            write_progress(root, prog)
            if failed:
                break
    total_missing = sum(len(shot_missing(frames_dir, s)) for s in shots()['shots'])
    prog['machine_s'] = round(prog['cpu_s'] / 4.0)     # processor time over 4 cores: the fair measure
    prog['over_cap'] = prog['machine_s'] > env.FINAL_CAP_S
    prog['finished'] = now()
    prog['state'] = 'done' if total_missing == 0 else (failed or f'failed: {total_missing} pictures missing')
    write_progress(root, prog)
    open(os.path.join(fdir, 'DONE' if total_missing == 0 else 'FAILED'), 'w').write(now() + '\n')


def alive(root):
    """True while a worker holds this run's own lock (waiting in the queue counts)."""
    path = os.path.join(root, 'final', 'worker.lock')
    if not os.path.isfile(path):
        return False
    with open(path, 'a') as f:
        try:
            fcntl.flock(f, fcntl.LOCK_EX | fcntl.LOCK_NB)
            return False
        except OSError:
            return True


def cmd_final_start(argv):
    name = argv[0]
    root = stored(name)
    os.makedirs(os.path.join(root, 'final'), exist_ok=True)
    if alive(root):
        print('already running')
        return
    p = os.path.join(root, 'final', 'FAILED')
    if os.path.isfile(p):
        os.remove(p)
    log = open(os.path.join(root, 'final', 'worker.log'), 'a')
    subprocess.Popen([sys.executable, os.path.abspath(__file__), 'final', name], stdout=log, stderr=subprocess.STDOUT,
                     stdin=subprocess.DEVNULL, start_new_session=True, cwd='/')
    open(os.path.join(root, 'final', 'STARTED'), 'a').write(now() + ' start\n')
    for _ in range(50):
        if alive(root):
            break
        time.sleep(0.1)
    print('started' if alive(root) else 'start requested (worker not confirmed yet)')


def run_state(name):
    root = where(name)
    fdir = os.path.join(root, 'final')
    st = {'name': name, 'where': 'store' if root.startswith(VAULT) else 'live'}
    if os.path.isdir(os.path.join(fdir, 'frames')):
        done = 0
        for shot in shots()['shots']:
            lo, hi = shot.get('render_first', shot['first']), shot.get('render_last', shot['last'])
            done += (hi - lo + 1) - len(shot_missing(os.path.join(fdir, 'frames'), shot))
        st['pictures'] = f'{done}/732'
    p = load_json(os.path.join(fdir, 'progress.json'))
    if p:
        st.update({'state': p.get('state'), 'cpu_s': p.get('cpu_s'), 'machine_h': round((p.get('cpu_s') or 0) / 4 / 3600, 2),
                   'scale_now': p.get('scale_now'), 'restarts': p.get('restarts')})
    st['started'] = os.path.isfile(os.path.join(fdir, 'STARTED'))
    st['done'] = os.path.isfile(os.path.join(fdir, 'DONE'))
    st['failed'] = os.path.isfile(os.path.join(fdir, 'FAILED'))
    st['alive'] = alive(root)
    st['film'] = os.path.isfile(os.path.join(fdir, 'film.mp4'))
    return st


def all_runs():
    names = set()
    for d in (VAULT, env.BAKE_ROOT):
        if os.path.isdir(d):
            names |= {n for n in os.listdir(d) if n.startswith('run-')}
    return sorted(names)


def cmd_resume(argv):
    for name in all_runs():
        st = run_state(name)
        if st['where'] == 'store' and st['started'] and not st['done'] and not st['failed'] and not st['alive']:
            cmd_final_start([name])
            st = run_state(name)
            st['restarted_now'] = True
        print(json.dumps(st))


def cmd_status(argv):
    for name in all_runs():
        print(json.dumps(run_state(name)))


# ---------------------------------------------------------------- encode
def cmd_encode(argv):
    from PIL import Image
    name = argv[0]
    root = stored(name)
    repo = os.path.join(root, 'repo')
    fdir = os.path.join(root, 'final')
    frames_dir = os.path.join(fdir, 'frames')
    table = shots()
    for shot in table['shots']:
        miss = shot_missing(frames_dir, shot)
        if miss:
            sys.exit(f'{shot["id"]}: {len(miss)} pictures missing; cannot encode')
    flat = os.path.join(fdir, 'flat')
    shutil.rmtree(flat, ignore_errors=True)
    os.makedirs(flat)
    tr = table['transitions']
    d0, d1 = tr['dissolve_S6_to_S7']
    fi0, fi1 = tr['fade_in_from_black']
    fo0, fo1 = tr['fade_out_to_black']
    by_frame = {}
    for shot in table['shots']:
        for n in range(shot['first'], shot['last'] + 1):
            by_frame[n] = shot['id']
    size = None
    for n in range(1, table['frames'] + 1):
        dst = os.path.join(flat, f'f{n:04d}.png')
        if d0 <= n <= d1:
            a = Image.open(os.path.join(frames_dir, 'S6', f'f{n:04d}.png')).convert('RGB')
            b = Image.open(os.path.join(frames_dir, 'S7', f'f{n:04d}.png')).convert('RGB')
            im = Image.blend(a, b, (n - d0 + 1) / (d1 - d0 + 2))
        else:
            im = Image.open(os.path.join(frames_dir, by_frame[n], f'f{n:04d}.png')).convert('RGB')
        if size is None:
            size = im.size
        if '%dx%d' % im.size != env.RES:
            sys.exit(f'picture {n} is {im.size}, expected {env.RES}')
        if fi0 <= n <= fi1:
            im = Image.blend(Image.new('RGB', im.size), im, (n - fi0) / (fi1 - fi0 + 1))      # frame 1 is black
        if fo0 <= n <= fo1:
            im = Image.blend(Image.new('RGB', im.size), im, (fo1 - n) / (fo1 - fo0 + 1))      # frame 720 is black
        im.save(dst, compress_level=1)
    raw = os.path.join(fdir, 'sound-raw.wav')
    try:
        r = sh(['node', os.path.join(repo, ENTRY_REL, 'sound.mjs'), '--out', raw], cwd=repo, timeout=1800)
    except subprocess.TimeoutExpired:
        sys.exit('sound.mjs did not finish in 30 minutes')
    if r.returncode != 0:
        sys.exit('sound.mjs failed: ' + (r.stderr or r.stdout)[-600:])
    facts = wav_facts(raw)
    if facts != (48000, 2, 1440000):
        sys.exit(f'sound is {facts}, expected (48000, 2, 1440000)')
    m = sh(['ffmpeg', '-hide_banner', '-nostats', '-i', raw, '-af', 'ebur128=peak=true', '-f', 'null', '-']).stderr
    tail = m[m.rfind('Summary:'):] if 'Summary:' in m else m
    lufs = re.search(r'I:\s*(-?[\d.]+|-inf)\s*LUFS', tail)
    peak = re.search(r'Peak:\s*(-?[\d.]+|-inf)\s*dBFS', tail)
    lufs_v = float(lufs.group(1)) if lufs and lufs.group(1) != '-inf' else None
    peak_v = float(peak.group(1)) if peak and peak.group(1) != '-inf' else None
    gain = 0.0
    if lufs_v is not None and lufs_v > -60:
        gain = -16.0 - lufs_v
        if peak_v is not None and peak_v + gain > -1.5:
            gain = -1.5 - peak_v
    film = os.path.join(fdir, 'film.mp4')
    info = None
    for crf in ('18', '21', '24'):
        r = sh(['ffmpeg', '-y', '-v', 'error', '-framerate', str(table['fps']), '-start_number', '1', '-i',
                os.path.join(flat, 'f%04d.png'), '-i', raw,
                '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p', '-af', f'volume={gain:.2f}dB',
                '-c:v', 'libx264', '-preset', 'slow', '-crf', crf, '-profile:v', 'high', '-level', '4.0',
                '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
                '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', film])
        if r.returncode != 0:
            sys.exit('encode failed: ' + r.stderr[-600:])
        mb = os.path.getsize(film) / 1e6
        info = {'crf': int(crf), 'size_mb': round(mb, 2)}
        if mb <= 15:
            break
    dur = sh(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', film]).stdout.strip()
    streams = sh(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_name,width,height,nb_frames', '-of', 'json', film]).stdout
    tiles = [os.path.join(flat, f'f{n:04d}.png') for n in range(6, table['frames'] + 1, 12)]
    run_tools.make_sheet(os.path.join(fdir, 'contact.jpg'), tiles, cols=6, width=320, labels=True)
    prog = load_json(os.path.join(fdir, 'progress.json'), {})
    frozen = load_json(os.path.join(fdir, 'frozen.json'), {})
    out = {'name': name, 'duration_s': float(dur), 'sound_lufs_before': lufs_v, 'sound_peak_before_db': peak_v,
           'gain_db': round(gain, 2), 'samples_scale': frozen.get('samples_scale'), 'scale_at_end': prog.get('scale_now'),
           'draw_cpu_s': prog.get('cpu_s'), 'draw_machine_s': prog.get('machine_s'), 'over_cap': prog.get('over_cap'),
           'started': prog.get('started'), 'finished': prog.get('finished'), 'restarts': prog.get('restarts'),
           'notes': prog.get('notes'),
           'streams': json.loads(streams).get('streams'), **info}
    with open(os.path.join(fdir, 'film.json'), 'w') as f:
        json.dump(out, f, indent=1)
    shutil.rmtree(flat, ignore_errors=True)
    print(json.dumps(out, indent=1))


# ---------------------------------------------------------------- seal
def cmd_seal(argv):
    name = argv[0]
    root = where(name)
    os.makedirs(SEALED, exist_ok=True)
    out = os.path.join(SEALED, name + '.tar.gz')
    keep = [os.path.join('repo', ENTRY_REL), 'ledger.jsonl', 'ledger-organiser.jsonl', 'gate', 'final/film.mp4', 'final/film.json', 'final/contact.jpg',
            'final/progress.json', 'final/frozen.json', 'audit.json', 'determinism.json']

    def filt(ti):
        base = os.path.basename(ti.name)
        if '__pycache__' in ti.name or base.endswith('.pyc'):
            return None
        if '/gate/attempt-' in '/' + ti.name and ti.isfile():
            return None                                   # the single pictures stay out; the sheets go in
        return ti

    with tarfile.open(out, 'w:gz') as tar:
        for rel in keep:
            p = os.path.join(root, rel)
            if os.path.exists(p):
                tar.add(p, arcname=os.path.join(name, rel), filter=filt)
    print(out, round(os.path.getsize(out) / 1e6, 2), 'MB')


# ---------------------------------------------------------------- audit
def cmd_audit(argv):
    """Looks through helper transcripts (JSONL) for contact with other runs, downloads, direct Blender calls, helpers."""
    name, files = argv[0], argv[1:]
    reg = registry()
    others = [n for n in reg if n != name]
    other_marks = [reg[n]['canary'] for n in others if reg[n].get('canary')]
    name_pat = [re.compile(r'(?<![A-Za-z0-9])' + re.escape(n) + r'(?![A-Za-z0-9])') for n in others]
    flags = {'other_run_names': [], 'other_markers': [], 'private_store': [], 'main_project_paths': [], 'direct_blender': [],
             'network': [], 'helpers_started': [], 'web_tools': []}
    tools = {}

    def note(key, text):
        if len(flags[key]) < 40:
            flags[key].append(text[:300])

    for path in files:
        with open(path, errors='replace') as f:
            for line in f:
                for mk in other_marks:
                    if mk in line:
                        note('other_markers', f'{os.path.basename(path)}: {mk}')
                for pat in name_pat:                      # anywhere: commands, file paths and tool output
                    m = pat.search(line)
                    if m:
                        i = m.start()
                        note('other_run_names', line[max(0, i - 120):i + 120])
                if '/root/.bakeoff' in line or 'bakeoff/sealed' in line or 'registry.b64' in line:
                    i = max(line.find('/root/.bakeoff'), line.find('bakeoff/sealed'), line.find('registry.b64'))
                    note('private_store', line[max(0, i - 120):i + 120])
                try:
                    o = json.loads(line)
                except ValueError:
                    continue
                msg = o.get('message') or {}
                content = msg.get('content')
                if not isinstance(content, list):
                    continue
                for c in content:
                    if not isinstance(c, dict) or c.get('type') != 'tool_use':
                        continue
                    tool = c.get('name', '?')
                    tools[tool] = tools.get(tool, 0) + 1
                    text = json.dumps(c.get('input', {}))
                    if '/home/user/StoryTime' in text:
                        note('main_project_paths', f'{tool}: {text}')
                    if tool == 'Bash':
                        cmd = (c.get('input') or {}).get('command', '')
                        if re.search(r'tools/blender|(^|[\s;&|])blender\s', cmd) and 'bakeoff/blender.sh' not in cmd \
                                and 'bakeoff/gate.sh' not in cmd:
                            note('direct_blender', cmd)
                        if re.search(r'\b(curl|wget|pip3? install|npm (i|install)|git clone|git fetch|git pull)\b|https?://', cmd):
                            note('network', cmd)
                    if tool in ('Agent', 'Task', 'Workflow'):
                        note('helpers_started', text)
                    if tool in ('WebFetch', 'WebSearch') or tool.startswith('mcp__'):
                        note('web_tools', f'{tool}: {text}')
    out = {'name': name, 'transcripts': [os.path.basename(p) for p in files], 'tool_calls': tools,
           'flags': {k: v for k, v in flags.items() if v},
           'clean': not any(flags[k] for k in ('other_run_names', 'other_markers', 'private_store'))}
    root = where(name)
    save_json(os.path.join(root, 'audit.json'), out)
    print(json.dumps(out, indent=1))


# ---------------------------------------------------------------- determinism
def cmd_determinism(argv):
    """Draws two pictures twice from the frozen code and compares the two drawings."""
    from PIL import Image, ImageChops, ImageStat
    name = argv[0]
    root = stored(name)
    repo = os.path.join(root, 'repo')
    out_dir = os.path.join(root, 'determinism')
    picks = [('S2', 156), ('S5', 474)]
    results = {}
    os.makedirs(os.path.join(env.BAKE_ROOT, '.lock'), exist_ok=True)
    with open(os.path.join(env.BAKE_ROOT, '.lock', 'foreground.lock'), 'w') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        for sid, n in picks:
            paths = []
            for take in ('a', 'b'):
                d = os.path.join(out_dir, take)
                try:
                    r = sh([env.BLENDER, '-b', '--factory-startup', '--python-exit-code', '1', '--python',
                            os.path.join(repo, ENTRY_REL, 'film.py'), '--', '--out', d, '--frames', str(n), '--shots', sid,
                            '--res', env.RES, '--quality', 'final', '--force'], cwd=repo, timeout=1500)
                    ok = r.returncode == 0
                except subprocess.TimeoutExpired:
                    ok = False
                p = os.path.join(d, sid, f'f{n:04d}.png')
                if ok and os.path.isfile(p):
                    paths.append(p)
            if len(paths) != 2:
                results[f'{sid}/{n}'] = 'could not compare'
                continue
            diff = ImageChops.difference(Image.open(paths[0]).convert('RGB'), Image.open(paths[1]).convert('RGB'))
            results[f'{sid}/{n}'] = {'mean_abs_diff_0_255': round(sum(ImageStat.Stat(diff).mean) / 3, 3)}
    save_json(os.path.join(root, 'determinism.json'), results)
    print(json.dumps(results, indent=1))


# ---------------------------------------------------------------- owner sheet
def cmd_owner_sheet(argv):
    name, out = argv[0], argv[1]
    root = where(name)
    bench = json.load(open(os.path.join(root, 'gate', 'bench.json')))
    d = os.path.join(root, 'gate', f"attempt-{bench['attempt']}")
    pics = []
    for shot in shots()['shots']:
        for n in (shot['first'], (shot['first'] + shot['last']) // 2, shot['last']):
            p = os.path.join(d, shot['id'], f'f{n:04d}.png')
            if os.path.isfile(p):
                pics.append(p)
    print(run_tools.make_sheet(out, pics, cols=3, width=640, labels=False))


if __name__ == '__main__':
    cmds = {'new-run': cmd_new_run, 'check': cmd_check, 'finish': cmd_finish, 'final': cmd_final,
            'final-start': cmd_final_start, 'resume': cmd_resume, 'status': cmd_status, 'encode': cmd_encode,
            'seal': cmd_seal, 'audit': cmd_audit, 'determinism': cmd_determinism, 'owner-sheet': cmd_owner_sheet}
    if len(sys.argv) < 2 or sys.argv[1] not in cmds:
        sys.exit(__doc__)
    cmds[sys.argv[1]](sys.argv[2:])
