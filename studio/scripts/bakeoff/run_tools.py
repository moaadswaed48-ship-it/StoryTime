#!/usr/bin/env python3
"""Tools a film workspace uses: every Blender call, the speed check, picture sheets, the budget status.

  blender.sh LABEL [--sub NAME --sub-cap SECONDS] [--max-seconds N] -- <blender arguments>
  gate.sh
  sheet.sh OUT.jpg [--cols N] [--width W] [--no-labels] IMAGE...
  status.sh

Use the .sh wrappers beside this file. Mechanics only: no art lives here.
"""
import argparse
import ctypes
import fcntl
import json
import os
import re
import resource
import signal
import subprocess
import sys
import threading
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import env  # noqa: E402

RUN_DIR = os.path.dirname(env.REPO)
RUN_NAME = os.path.basename(RUN_DIR)
MIRROR = os.path.join(env.BAKE_ROOT, '.ledgers', RUN_NAME + '.jsonl')
LOCK = os.path.join(env.BAKE_ROOT, '.lock', 'foreground.lock')
NOISE = re.compile(r'^(Fra:|Saved:|\s*Time:|Blender \d|Blender quit|Read prefs|Read blend|Writing:|\s*$'
                   r'|\d\d:\d\d[.:]\d+\s+\w+\s+\|\s+(Saved:|WARNING CUEW))')


def die(msg, code=2):
    print('HARNESS ' + msg, flush=True)
    sys.exit(code)


def check_workspace():
    if not RUN_NAME.startswith('run-') or os.path.basename(env.REPO) != 'repo':
        die('this copy of the project is not a film workspace; use the copy inside your workspace folder')
    if not os.path.isfile(env.BLENDER):
        die('Blender is missing at ' + env.BLENDER)


def ledger_rows():
    rows = []
    if os.path.isfile(MIRROR):
        with open(MIRROR) as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        rows.append(json.loads(line))
                    except ValueError:
                        pass
    return rows


def append_ledger(row):
    line = json.dumps(row) + '\n'
    for path in (MIRROR, os.path.join(RUN_DIR, 'ledger.jsonl')):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'a') as f:
            f.write(line)
            f.flush()
            os.fsync(f.fileno())


def blender_alive(pid):
    try:
        with open(f'/proc/{pid}/cmdline', 'rb') as f:
            return b'blender' in f.read()
    except OSError:
        return False


def open_calls(rows):
    ended = {r['id'] for r in rows if r.get('event') == 'end'}
    return [r for r in rows if r.get('event') == 'start' and r['id'] not in ended]


def charge_for(start):
    """Seconds to charge for a call that has a start row but no end row."""
    if blender_alive(start.get('pid', -1)):
        return max(0.0, time.time() - start['t0'])
    log = os.path.join(RUN_DIR, 'logs', start.get('log', ''))
    end = os.path.getmtime(log) if os.path.isfile(log) else start['t0']
    return max(0.0, min(end - start['t0'], start.get('limit', 0) + 20))


def spent(kind, sub=None):
    rows = ledger_rows()
    total = sum(r.get('wall_s', 0) for r in rows
                if r.get('event') == 'end' and r.get('kind') == kind and (sub is None or r.get('sub') == sub))
    for s in open_calls(rows):
        if s.get('kind') == kind and (sub is None or s.get('sub') == sub):
            total += charge_for(s)
    return total


def attempts(kind):
    return len([r for r in ledger_rows() if r.get('event') == 'start' and r.get('kind') == kind])


def reconcile():
    """Called while holding the machine: closes calls that were stopped from outside, and ends any Blender they left."""
    for s in open_calls(ledger_rows()):
        pid = s.get('pid', -1)
        if blender_alive(pid):
            try:
                os.kill(pid, signal.SIGKILL)
            except OSError:
                pass
            wall = max(0.0, time.time() - s['t0'])
        else:
            wall = charge_for(s)
        append_ledger({'event': 'end', 'id': s['id'], 'kind': s.get('kind'), 'label': s.get('label'), 'sub': s.get('sub'),
                       'wall_s': round(wall, 1), 'cpu_s': None, 'exit': 'stopped from outside', 'log': s.get('log')})
        print(f"HARNESS an earlier call ({s.get('label')}) was stopped from outside; {wall:.0f}s charged", flush=True)


class Machine:
    """One Blender call at a time on this machine. Waiting is not charged."""

    def __enter__(self):
        os.makedirs(os.path.dirname(LOCK), exist_ok=True)
        self.f = open(LOCK, 'w')
        t = time.time()
        try:
            fcntl.flock(self.f, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError:
            print('HARNESS waiting for the machine: another Blender call is running (waiting is not charged)', flush=True)
            fcntl.flock(self.f, fcntl.LOCK_EX)
        self.waited = time.time() - t
        if self.waited > 2:
            print(f'HARNESS waited {self.waited:.0f}s', flush=True)
        reconcile()
        return self

    def __exit__(self, *a):
        self.f.close()


def _die_with_parent():
    ctypes.CDLL('libc.so.6', use_errno=True).prctl(1, signal.SIGKILL)      # PR_SET_PDEATHSIG


def run_blender(kind, label, blender_args, max_s, sub=None, waited=0.0):
    """Runs one Blender process (call inside `with Machine()`); returns (exit code, log path, wall seconds)."""
    logs = os.path.join(RUN_DIR, 'logs')
    os.makedirs(logs, exist_ok=True)
    call_id = len([r for r in ledger_rows() if r.get('event') == 'start']) + 1
    safe = re.sub(r'[^A-Za-z0-9_.-]+', '-', label)[:40] or 'call'
    log_name = f'{call_id:03d}-{safe}.log'
    log_path = os.path.join(logs, log_name)
    cmd = [env.BLENDER, '-b', '--factory-startup', '--python-exit-code', '1'] + list(blender_args)
    r0 = resource.getrusage(resource.RUSAGE_CHILDREN)
    t0 = time.time()
    log = open(log_path, 'w')
    p = subprocess.Popen(cmd, cwd=env.REPO, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, errors='replace',
                         preexec_fn=_die_with_parent)
    append_ledger({'event': 'start', 'id': call_id, 'kind': kind, 'label': label, 'sub': sub, 't0': round(t0, 1),
                   't': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'pid': p.pid, 'limit': round(max_s),
                   'log': log_name})
    stop = {'why': None}

    def on_signal(signum, frame):
        stop['why'] = f'signal {signum}'
        try:
            p.kill()
        except OSError:
            pass

    for s in (signal.SIGTERM, signal.SIGINT, signal.SIGHUP):
        signal.signal(s, on_signal)

    def pump():
        shown = 0
        for line in p.stdout:
            log.write(line)
            log.flush()
            if NOISE.match(line):
                continue
            if shown < 400:
                try:
                    sys.stdout.write(line)
                    sys.stdout.flush()
                except OSError:
                    pass
                shown += 1
            elif shown == 400:
                print('HARNESS (more output in the log file)', flush=True)
                shown += 1

    th = threading.Thread(target=pump, daemon=True)
    th.start()
    code = None
    while code is None:
        try:
            code = p.wait(timeout=1.0)
        except subprocess.TimeoutExpired:
            if time.time() - t0 > max_s and stop['why'] is None:
                stop['why'] = 'time limit'
                p.kill()
    th.join(timeout=5)
    log.close()
    wall = time.time() - t0
    r1 = resource.getrusage(resource.RUSAGE_CHILDREN)
    cpu = (r1.ru_utime + r1.ru_stime) - (r0.ru_utime + r0.ru_stime)
    if stop['why'] == 'time limit':
        code = 124
    append_ledger({'event': 'end', 'id': call_id, 'kind': kind, 'label': label, 'sub': sub, 'wall_s': round(wall, 1),
                   'cpu_s': round(cpu, 1), 'max_rss_mb': round(r1.ru_maxrss / 1024), 'exit': code,
                   'lock_wait_s': round(waited, 1), 'log': log_name, 'stopped': stop['why']})
    if stop['why'] == 'time limit':
        print(f'HARNESS stopped: this call reached its time limit of {int(max_s)}s', flush=True)
    elif stop['why']:
        print(f'HARNESS stopped from outside ({stop["why"]}); {wall:.0f}s charged', flush=True)
        sys.exit(130)
    return code, log_path, wall


def cmd_blender(argv):
    if '--' not in argv:
        die('usage: blender.sh LABEL [--sub NAME --sub-cap SECONDS] [--max-seconds N] -- <blender arguments>')
    cut = argv.index('--')
    ap = argparse.ArgumentParser(prog='blender.sh')
    ap.add_argument('label')
    ap.add_argument('--sub')
    ap.add_argument('--sub-cap', type=float)
    ap.add_argument('--max-seconds', type=float, default=env.DEFAULT_MAX_SECONDS)
    a = ap.parse_args(argv[:cut])
    blender_args = argv[cut + 1:]
    check_workspace()
    with Machine() as m:
        left = env.TEST_BUDGET_S - spent('test')
        if left <= 0:
            die(f'the test budget of {env.TEST_BUDGET_S}s is spent; no more test pictures', 3)
        limit = min(a.max_seconds, left)
        if a.sub and a.sub_cap:
            sub_left = a.sub_cap - spent('test', a.sub)
            if sub_left <= 0:
                die(f'the share of the test budget for "{a.sub}" ({a.sub_cap:.0f}s) is spent', 3)
            limit = min(limit, sub_left)
        code, log_path, wall = run_blender('test', a.label, blender_args, limit, a.sub, m.waited)
    left = env.TEST_BUDGET_S - spent('test')
    print(f'HARNESS wall={wall:.1f}s exit={code} test_budget_left={max(0, left):.0f}s log={log_path}', flush=True)
    sys.exit(0 if code == 0 else 1)


def load_shots():
    with open(env.SHOTS_FILE) as f:
        return json.load(f)['shots']


def gate_frames(sh):
    return [sh['first'], (sh['first'] + sh['last']) // 2, sh['last']]


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


def make_sheet(out, images, cols=3, width=640, labels=True):
    from PIL import Image, ImageDraw
    tiles = []
    for p in images:
        im = Image.open(p).convert('RGB')
        h = max(1, round(im.height * width / im.width))
        im = im.resize((width, h), Image.LANCZOS)
        if labels:
            d = ImageDraw.Draw(im)
            text = os.path.join(os.path.basename(os.path.dirname(p)), os.path.basename(p))
            d.rectangle([0, 0, 8 + 7 * len(text), 16], fill=(0, 0, 0))
            d.text((4, 2), text, fill=(255, 255, 255))
        tiles.append(im)
    if not tiles:
        die('no pictures given')
    cols = max(1, min(cols, len(tiles)))
    th = max(t.height for t in tiles)
    rows = (len(tiles) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * width, rows * th), (20, 20, 20))
    for i, t in enumerate(tiles):
        sheet.paste(t, ((i % cols) * width, (i // cols) * th))
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    sheet.save(out, quality=88)
    return out


def predict(log_path, out, shots):
    """The whole film's drawing time from the 21 speed-check pictures. Returns (per shot, total, complete, pictures)."""
    builds, frames, steps = {}, {}, {}
    with open(log_path) as f:
        for line in f:
            m = re.match(r'^BUILD (\S+) ([\d.]+)', line)
            if m:
                builds[m.group(1)] = float(m.group(2))
            m = re.match(r'^FRAME (\S+) (\d+) ([\d.]+)', line)
            if m:
                frames.setdefault(m.group(1), []).append((int(m.group(2)), float(m.group(3))))
            m = re.match(r'^STEP (\S+) (\d+) ([\d.]+)', line)
            if m:
                c, s = steps.get(m.group(1), (0, 0.0))
                steps[m.group(1)] = (c + int(m.group(2)), s + float(m.group(3)))
    per_shot, total, complete, pictures = {}, 0.0, True, []
    for sh in shots:
        sid = sh['id']
        want = gate_frames(sh)
        got = dict(frames.get(sid, []))
        paths = [os.path.join(out, sid, f'f{n:04d}.png') for n in want]
        ok = all(n in got for n in want) and all(valid_png(p) for p in paths)
        complete = complete and ok
        if not ok:
            per_shot[sid] = {'complete': False}
            continue
        pictures += paths
        times = [got[n] for n in want]
        steady = sum(times[1:]) / 2.0                 # the middle and last pictures: the steady cost of one picture
        prep = max(0.0, times[0] - steady)            # extra time of the first picture: paid once per shot
        count = sh.get('render_last', sh['last']) - sh.get('render_first', sh['first']) + 1
        sc, ss = steps.get(sid, (0, 0.0))
        step_each = ss / sc if sc else 0.0            # only when the entry steps frames in order (sequential=True)
        shot_total = builds.get(sid, 0.0) + prep + (steady + step_each) * count
        total += shot_total
        per_shot[sid] = {'complete': True, 'build_s': round(builds.get(sid, 0.0), 1), 'first_picture_extra_s': round(prep, 1),
                         'seconds_per_picture': round(steady, 1), 'step_seconds_per_frame': round(step_each, 2),
                         'pictures': count, 'predicted_s': round(shot_total)}
    return per_shot, total, complete, pictures


def cmd_gate(argv):
    check_workspace()
    shots = load_shots()
    film = os.path.join(env.ENTRY, 'film.py')
    if not os.path.isfile(film):
        die('src/studio3d/bakeoff/entry/film.py does not exist yet')
    with Machine() as m:
        attempt = attempts('gate') + 1
        left = env.GATE_BUDGET_S - spent('gate')
        if attempt > env.GATE_MAX_ATTEMPTS:
            die(f'all {env.GATE_MAX_ATTEMPTS} speed-check attempts are used', 3)
        if left <= 30:
            die('the speed-check budget is spent', 3)
        out = os.path.join(RUN_DIR, 'gate', f'attempt-{attempt}')
        args = ['--python', film, '--', '--out', out, '--frames', 'gate', '--res', env.RES, '--quality', 'final', '--force']
        code, log_path, wall = run_blender('gate', f'gate-{attempt}', args, left, None, m.waited)
    per_shot, total, complete, pictures = predict(log_path, out, shots)
    passed = bool(complete and code == 0 and total <= env.GATE_PASS_S)
    bench = {'attempt': attempt, 'exit': code, 'complete': complete, 'predicted_s': round(total), 'limit_s': env.GATE_PASS_S,
             'pass': passed, 'wall_s': round(wall, 1), 'shots': per_shot}
    os.makedirs(os.path.join(RUN_DIR, 'gate'), exist_ok=True)
    for name in (f'bench-{attempt}.json', 'bench.json'):
        with open(os.path.join(RUN_DIR, 'gate', name), 'w') as f:
            json.dump(bench, f, indent=1)
    if pictures:
        sheet = make_sheet(os.path.join(RUN_DIR, 'gate', f'sheet-{attempt}.jpg'), pictures, cols=3, width=640)
        print('HARNESS sheet of the speed-check pictures: ' + sheet, flush=True)
    for sid, v in per_shot.items():
        print('HARNESS ' + sid + ' ' + json.dumps(v), flush=True)
    left_now = env.GATE_BUDGET_S - spent('gate')
    verdict = 'PASS' if passed else 'FAIL'
    print(f'HARNESS speed check {verdict}: predicted {total:.0f}s for the whole film, limit {env.GATE_PASS_S}s; '
          f'attempt {attempt} of {env.GATE_MAX_ATTEMPTS}; speed-check budget left {max(0, left_now):.0f}s', flush=True)
    if not complete:
        print('HARNESS the check is incomplete: some of the 21 pictures are missing or film.py failed (see ' + log_path + ')',
              flush=True)
    sys.exit(0 if passed else 1)


def cmd_sheet(argv):
    ap = argparse.ArgumentParser(prog='sheet.sh')
    ap.add_argument('out')
    ap.add_argument('images', nargs='+')
    ap.add_argument('--cols', type=int, default=4)
    ap.add_argument('--width', type=int, default=480)
    ap.add_argument('--no-labels', action='store_true')
    a = ap.parse_args(argv)
    print(make_sheet(a.out, a.images, a.cols, a.width, not a.no_labels))


def cmd_status(argv):
    check_workspace()
    t = spent('test')
    g = spent('gate')
    print(f'test budget: {t:.0f}s used of {env.TEST_BUDGET_S}s, {max(0, env.TEST_BUDGET_S - t):.0f}s left')
    print(f'speed check: {attempts("gate")} of {env.GATE_MAX_ATTEMPTS} attempts used, {g:.0f}s used of {env.GATE_BUDGET_S}s')
    bench = os.path.join(RUN_DIR, 'gate', 'bench.json')
    if os.path.isfile(bench):
        with open(bench) as f:
            b = json.load(f)
        print(f"last speed check: {'PASS' if b.get('pass') else 'FAIL'}, predicted {b.get('predicted_s')}s, "
              f"limit {b.get('limit_s')}s, sheet {os.path.join(RUN_DIR, 'gate', 'sheet-%d.jpg' % b.get('attempt', 0))}")
    subs = {}
    for r in ledger_rows():
        if r.get('event') == 'end' and r.get('kind') == 'test' and r.get('sub'):
            subs[r['sub']] = subs.get(r['sub'], 0) + r.get('wall_s', 0)
    for k, v in subs.items():
        print(f'  share "{k}": {v:.0f}s used')
    running = [s for s in open_calls(ledger_rows()) if blender_alive(s.get('pid', -1))]
    for s in running:
        print(f"  a call is running now: {s.get('label')} ({time.time() - s['t0']:.0f}s so far)")


if __name__ == '__main__':
    cmds = {'blender': cmd_blender, 'gate': cmd_gate, 'sheet': cmd_sheet, 'status': cmd_status}
    if len(sys.argv) < 2 or sys.argv[1] not in cmds:
        die('usage: run_tools.py blender|gate|sheet|status ...')
    cmds[sys.argv[1]](sys.argv[2:])
