#!/usr/bin/env python3
"""Reads the story aloud with ElevenLabs, exactly as written, into public/audio/story-eleven/.

Same file layout and index.json shape as narrate.py (the Google-voice version), so nothing downstream changes
once the folder is approved and swapped in. The current public/audio/story/ is never touched.

    python scripts/audio/narrate_eleven.py --list-voices [--search TEXT] [--library]
    python scripts/audio/narrate_eleven.py --samples VOICE_ID [VOICE_ID ...]
    python scripts/audio/narrate_eleven.py --all --voice VOICE_ID [--lang ar|en|both] [--dry-run] [--force]

Key: the ELEVENLABS_API_KEY environment variable, or a line ELEVENLABS_API_KEY=... in ..\\keys.txt (next to the
repo folder). The key is never printed or written anywhere.

Output (per language): story-eleven/<lang>/sNN-pMM.mp3 (a paragraph), story-eleven/<lang>/sNN.mp3 (a scene, with
the paragraph start/end table in index.json), story-eleven/cue/<lang>/sNN.mp3 (the film's line), index.json.
Raw API audio is kept in qa/out/eleven-raw/ (outside public/) so a failed encode never costs a second payment.
Text is sent to the service exactly as it is in src/content/story.ts: never edited, vowelled or normalised here.
"""
import argparse, glob, importlib.util, json, os, re, subprocess, sys, tempfile, time

try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace'); sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except Exception:  # noqa
    pass

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(ROOT, 'public', 'audio', 'story-eleven')
RAW = os.path.join(ROOT, 'qa', 'out', 'eleven-raw')
SAMPLES = os.path.join(ROOT, 'qa', 'out', 'voice-samples')
KEYS_FILE = os.path.normpath(os.path.join(ROOT, '..', 'keys.txt'))
API = 'https://api.elevenlabs.io'
LANGS = ['ar', 'en']
# the calm pace the Google version used (narrate.py TEMPO), as the service's own speed setting
DEFAULT_SPEED = {'ar': 0.92, 'en': 0.94}


class Fail(Exception):
    """An expected problem with a message meant for the person running the script."""


# ---------------------------------------------------------------- the story (shared with narrate.py)
def _narrate():
    spec = importlib.util.spec_from_file_location('narrate_google', os.path.join(HERE, 'narrate.py'))
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    mod.OUT = OUT  # its scene-joining step then writes into our folder
    return mod


# ---------------------------------------------------------------- ffmpeg
def find_ffmpeg():
    """Puts ffmpeg/ffprobe on PATH (a shell opened before the winget install does not see them)."""
    import shutil
    if shutil.which('ffmpeg') and shutil.which('ffprobe'): return True
    base = os.environ.get('LOCALAPPDATA', '')
    hits = glob.glob(os.path.join(base, 'Microsoft', 'WinGet', 'Packages', 'Gyan.FFmpeg*', '**', 'bin', 'ffmpeg.exe'), recursive=True)
    hits += glob.glob(os.path.join(base, 'Microsoft', 'WinGet', 'Links', 'ffmpeg.exe'))
    for h in hits:
        os.environ['PATH'] = os.path.dirname(h) + os.pathsep + os.environ.get('PATH', '')
        if shutil.which('ffmpeg') and shutil.which('ffprobe'): return True
    return False


def duration(path):
    return round(float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path])), 2)


def encode(raw, out_path):
    """Level to the same calm reading loudness narrate.py uses; mono 44.1 kHz 80k mp3; a small fade in and tail."""
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    subprocess.run(['ffmpeg', '-hide_banner', '-v', 'error', '-y', '-i', raw, '-af',
                    'aresample=44100,highpass=f=70,apad=pad_dur=0.25,loudnorm=I=-18:TP=-2:LRA=7,afade=t=in:d=0.04',
                    '-ac', '1', '-ar', '44100', '-b:a', '80k', out_path], check=True)


# ---------------------------------------------------------------- key + http
def read_key():
    k = os.environ.get('ELEVENLABS_API_KEY', '').strip()
    if not k and os.path.exists(KEYS_FILE):
        for line in open(KEYS_FILE, encoding='utf-8-sig', errors='replace'):
            m = re.match(r'\s*(?:export\s+)?ELEVENLABS_API_KEY\s*=\s*(.*?)\s*$', line)
            if m: k = m.group(1).strip().strip('"\'')
    if not k:
        raise Fail(f'No ElevenLabs key. Set ELEVENLABS_API_KEY or add a line ELEVENLABS_API_KEY=... to {KEYS_FILE}')
    return k


def _detail(r):
    try:
        d = r.json().get('detail', r.json())
        if isinstance(d, dict): d = d.get('message') or d.get('status') or d
        return str(d)[:300]
    except Exception:  # noqa
        return (r.text or '')[:200]


def call(method, path, key, tries=6, **kw):
    """One API call with patient retries for rate limits, busy servers and network blips. Messages never hold the key."""
    import requests
    for attempt in range(tries):
        try:
            r = requests.request(method, API + path, headers={'xi-api-key': key, 'Accept': 'application/json, audio/mpeg'}, timeout=120, **kw)
        except requests.RequestException as e:
            wait = 3 * (attempt + 1); print(f'  network problem ({type(e).__name__}); retrying in {wait}s', flush=True); time.sleep(wait); continue
        s = r.status_code
        if s == 200: return r
        d = _detail(r)
        if s == 401: raise Fail(f'ElevenLabs rejected the key (401): {d}. Check ELEVENLABS_API_KEY / keys.txt, and that the key has Text to Speech and Voices permission.')
        if s == 402 or 'quota' in d.lower(): raise Fail(f'Out of characters or plan limit ({s}): {d}. Nothing more was spent; re-run later or top up - finished files are kept and skipped.')
        if s in (404,): raise Fail(f'Not found (404): {d}. Is the voice id right? Library voices must be added to "My Voices" first.')
        if s == 422 or s == 400: raise Fail(f'ElevenLabs refused the request ({s}): {d}')
        if s == 403: raise Fail(f'Not allowed (403): {d}. (Free plans cannot use library voices through the API.)')
        if s in (429, 500, 502, 503, 504):
            wait = float(r.headers.get('retry-after') or 0) or min(60, 5 * (attempt + 1))
            print(f'  service busy ({s}: {d[:80]}); retrying in {wait:.0f}s', flush=True); time.sleep(wait); continue
        raise Fail(f'Unexpected answer from ElevenLabs ({s}): {d}')
    raise Fail('ElevenLabs kept failing after several tries (rate limit or outage). Re-run later; finished files are kept.')


def speak_raw(text, voice, key, cfg, lang, raw_path):
    body = {'text': text, 'model_id': cfg.model,
            'voice_settings': {'stability': cfg.stability, 'similarity_boost': cfg.similarity, 'style': cfg.style,
                               'use_speaker_boost': not cfg.no_boost, 'speed': cfg.speed if cfg.speed is not None else DEFAULT_SPEED[lang]}}
    if cfg.seed is not None: body['seed'] = cfg.seed
    r = call('POST', f'/v1/text-to-speech/{voice}', key, params={'output_format': cfg.format}, json=body)
    if len(r.content) < 800: raise Fail('ElevenLabs returned an empty or tiny audio file; nothing saved.')
    os.makedirs(os.path.dirname(raw_path), exist_ok=True)
    with open(raw_path, 'wb') as f: f.write(r.content)


# ---------------------------------------------------------------- jobs
def jobs(scenes, langs):
    """Every file to make, in order: (lang, kind, index key or cue key, text, final path). Text is verbatim."""
    out = []
    for lang in langs:
        for i, sc in enumerate(scenes):
            for j, para in enumerate(sc[lang]):
                key = f's{i + 1:02d}-p{j + 1:02d}'
                out.append((lang, 'para', key, para, os.path.join(OUT, lang, key + '.mp3')))
            key = f's{i + 1:02d}'
            out.append((lang, 'cue', key, sc['cue'][lang], os.path.join(OUT, 'cue', lang, key + '.mp3')))
    return out


def save_index(index):
    os.makedirs(OUT, exist_ok=True)
    p = os.path.join(OUT, 'index.json'); tmp = p + '.tmp'
    json.dump(index, open(tmp, 'w', encoding='utf-8'), ensure_ascii=False, indent=1); os.replace(tmp, p)


def cmd_all(a, key):
    nar = _narrate(); scenes = nar.story()
    langs = LANGS if a.lang == 'both' else [a.lang]
    todo = jobs(scenes, langs)
    need = [j for j in todo if a.force or not os.path.exists(j[4])]
    print('Files to make:')
    for lang in langs:
        mine = [j for j in todo if j[0] == lang]; chars = sum(len(j[3]) for j in mine)
        n_need = [j for j in mine if j in need]
        print(f'  {lang}: {len(mine)} audio files ({sum(1 for j in mine if j[1] == "para")} paragraphs + {sum(1 for j in mine if j[1] == "cue")} cue lines)'
              f' + {len(scenes)} joined scene files; {chars} characters in total; {len(n_need)} to generate = {sum(len(j[3]) for j in n_need)} characters')
    total = sum(len(j[3]) for j in need)
    print(f'TOTAL characters to spend now: {total}  (model {a.model}; voice {a.voice})')
    if a.dry_run:
        for lang, kind, k, text, path in todo:
            print(f'  [{"make" if (lang, kind, k, text, path) in need else "have"}] {os.path.relpath(path, ROOT)}  {len(text)} chars')
        print('dry run: nothing was sent, nothing was written.'); return
    if not find_ffmpeg(): raise Fail('ffmpeg/ffprobe not found. Open a new terminal (winget just installed it) or add its bin folder to PATH.')
    if total and not a.no_quota_check:
        try:
            s = call('GET', '/v1/user/subscription', key, tries=2).json()
            left = int(s['character_limit']) - int(s['character_count'])
            print(f'Characters left on the plan: {left}')
            if left < total: raise Fail(f'Not enough characters: need {total}, have {left}. Top up, or run one language at a time (--lang ar / --lang en). Use --no-quota-check to try anyway.')
        except (KeyError, ValueError, TypeError, Fail) as e:
            if isinstance(e, Fail) and 'Not enough' in str(e): raise
            print('(could not read the plan balance; going on)')
    idx_path = os.path.join(OUT, 'index.json')
    index = json.load(open(idx_path, encoding='utf-8')) if os.path.exists(idx_path) else {}
    index.setdefault('cue', {})
    done = 0
    for lang, kind, k, text, path in todo:
        index.setdefault(lang, {}); index['cue'].setdefault(lang, {})
        raw = os.path.join(RAW, lang, ('cue-' if kind == 'cue' else '') + k + '.mp3')
        if a.force or not os.path.exists(path):
            if a.force or not os.path.exists(raw):
                speak_raw(text, a.voice, key, a, lang, raw)
            encode(raw, path)
            done += len(text)
        d = duration(path)
        (index['cue'][lang] if kind == 'cue' else index[lang])[k] = d
        if kind == 'cue':
            save_index(index); print(f'{lang} scene {k} done ({done} characters spent so far)', flush=True)
    nar.join_scenes(index, scenes)
    save_index(index)
    print('done:', os.path.relpath(OUT, ROOT), '| total', {l: round(sum(index.get(l, {}).values())) for l in langs}, 'seconds')


# ---------------------------------------------------------------- voices + samples
def cmd_list(a, key):
    import itertools
    if a.library:
        # Voice Library (shared voices): read-only listing; add one to "My Voices" in the website before using it.
        params = {'page_size': 100, 'language': 'ar', 'gender': 'female', 'use_cases': 'narrative_story'}
        if a.search: params['search'] = a.search
        voices = call('GET', '/v1/shared-voices', key, params=params).json().get('voices', [])
        for v in voices:
            print(f"{v.get('voice_id')}  {v.get('name')}  |  {v.get('language')} {v.get('accent') or ''} {v.get('gender') or ''} {v.get('age') or ''} {v.get('descriptive') or ''} {v.get('use_case') or ''}  |  owner {v.get('public_owner_id')}  |  {v.get('preview_url') or ''}")
        print(f'{len(voices)} library voices (Arabic, female, narrative). Add one to My Voices on elevenlabs.io before using its id.'); return
    params, voices = {'page_size': 100}, []
    if a.search: params['search'] = a.search
    for _ in range(20):
        j = call('GET', '/v2/voices', key, params=params).json()
        voices += j.get('voices', [])
        if not j.get('has_more') or not j.get('next_page_token'): break
        params['next_page_token'] = j['next_page_token']
    for v in voices:
        lab = v.get('labels') or {}
        langs = sorted({(x.get('language') or '') for x in (v.get('verified_languages') or []) if x.get('language')})
        print(f"{v['voice_id']}  {v.get('name')}  |  {v.get('category')}  |  "
              + ' '.join(f'{k}={val}' for k, val in lab.items()) + (f'  |  verified: {",".join(langs)}' if langs else '')
              + (f"  |  {v.get('description')}" if v.get('description') else '') + (f"  |  preview {v['preview_url']}" if v.get('preview_url') else ''))
    print(f'{len(voices)} voices. Tip: --search arabic  or  --library (Arabic female narrative voices from the public library).')


def cmd_samples(a, key):
    nar = _narrate(); sc = nar.story()[0]
    texts = {'ar': sc['ar'][0], 'en': sc['en'][0]}
    ff = find_ffmpeg()
    if not ff: print('warning: ffmpeg not found; samples are saved as the service returned them (not levelled).')
    spent = 0; os.makedirs(SAMPLES, exist_ok=True)
    for vid in a.samples:
        name = vid
        try:
            nm = call('GET', f'/v1/voices/{vid}', key, tries=2).json().get('name') or ''
            name = re.sub(r'[^A-Za-z0-9]+', '-', nm).strip('-') or vid
        except Fail: pass
        for lang in LANGS:
            base = os.path.join(SAMPLES, f'eleven_{name}_{vid[:6]}_{lang}')
            raw = os.path.join(RAW, 'samples', f'{vid}-{lang}.mp3')
            speak_raw(texts[lang], vid, key, a, lang, raw); spent += len(texts[lang])
            if ff: encode(raw, base + '.mp3'); path = base + '.mp3'
            else:
                import shutil; shutil.copyfile(raw, base + '.mp3'); path = base + '.mp3'
            print(f'{lang}  {name} ({vid})  {len(texts[lang])} chars  ->  {path}', flush=True)
    print(f'characters spent on samples: {spent}')


def main():
    p = argparse.ArgumentParser(description='ElevenLabs narration for the story (same files and index.json as narrate.py, into public/audio/story-eleven/).',
                                formatter_class=argparse.RawDescriptionHelpFormatter,
                                epilog='Order: --list-voices (free) -> --samples <ids> (a few hundred characters each) -> listen -> --all --voice <id> --dry-run -> --all --voice <id>.')
    g = p.add_argument_group('what to do (pick one)')
    g.add_argument('--list-voices', action='store_true', help='print the account voices: id, name, labels, verified languages, preview link (free)')
    g.add_argument('--samples', nargs='+', metavar='VOICE_ID', help='one Arabic and one English sample per voice into qa/out/voice-samples/')
    g.add_argument('--all', action='store_true', help='make the whole story into public/audio/story-eleven/ (needs --voice)')
    p.add_argument('--voice', metavar='VOICE_ID', help='the chosen voice for --all')
    p.add_argument('--lang', choices=['ar', 'en', 'both'], default='both', help='for --all (default both)')
    p.add_argument('--dry-run', action='store_true', help='with --all: print the file list and character counts, send nothing')
    p.add_argument('--force', action='store_true', help='with --all: regenerate files that exist (spends characters again)')
    p.add_argument('--search', help='with --list-voices: filter text, e.g. arabic, calm, warm')
    p.add_argument('--library', action='store_true', help='with --list-voices: browse the public Voice Library for Arabic female narrative voices instead')
    s = p.add_argument_group('voice settings (calm storytelling defaults)')
    s.add_argument('--model', default='eleven_multilingual_v2', help='default eleven_multilingual_v2 (most stable on long reads, Arabic supported); eleven_v4 is the newer, more expressive one')
    s.add_argument('--stability', type=float, default=0.55, help='0-1; higher = calmer and more even (default 0.55)')
    s.add_argument('--similarity', type=float, default=0.75, help='0-1 (default 0.75)')
    s.add_argument('--style', type=float, default=0.0, help='0-1 style exaggeration; keep 0 for a gentle read (default 0)')
    s.add_argument('--speed', type=float, default=None, help='0.7-1.2 (default 0.92 Arabic, 0.94 English, like the Google version)')
    s.add_argument('--no-boost', action='store_true', help='turn speaker boost off')
    s.add_argument('--seed', type=int, default=None, help='best-effort repeatable output')
    s.add_argument('--format', default='mp3_44100_128', help='service output format (default mp3_44100_128); the file is re-encoded to the site format anyway')
    p.add_argument('--no-quota-check', action='store_true', help='skip the balance check before --all')
    a = p.parse_args()
    modes = sum(bool(x) for x in (a.list_voices, a.samples, a.all))
    if modes != 1: p.error('choose exactly one of --list-voices, --samples, --all')
    if a.all and not a.voice: p.error('--all needs --voice VOICE_ID')
    try:
        if a.all and a.dry_run: cmd_all(a, None); return  # no key needed to count
        key = read_key()
        if a.list_voices: cmd_list(a, key)
        elif a.samples: cmd_samples(a, key)
        else: cmd_all(a, key)
    except Fail as e:
        print('ERROR:', e, file=sys.stderr); sys.exit(1)
    except KeyboardInterrupt:
        print('stopped; finished files are kept, run again to resume.', file=sys.stderr); sys.exit(130)


if __name__ == '__main__':
    main()
