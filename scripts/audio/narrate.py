#!/usr/bin/env python3
"""Reads the story aloud, exactly as written, one audio file per paragraph.

    python3 scripts/audio/narrate.py [--only=ar|en] [--sample]

Voice: Google's free text-to-speech endpoint (a stand-in until a human narrator records the story).
Each paragraph is split at sentence ends (the service takes short pieces), fetched, joined with a short
breath between sentences, slowed a little and levelled. Output: public/audio/story/<lang>/sNN-pMM.mp3,
public/audio/story/cue/<lang>/sNN.mp3 (the film's lines) and public/audio/story/index.json (seconds).
Nothing in the text is changed.
"""
import json, os, re, subprocess, sys, tempfile, time, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'public/audio/story')
TEMPO = {'ar': 0.92, 'en': 0.94}  # a calmer pace than the service's default


def story():
    """Paragraphs and cue lines straight from src/content/story.ts (evaluated by node, not parsed by hand)."""
    js = r"""
    const fs=require('fs');let s=fs.readFileSync(process.argv[1],'utf8');
    const a=s.indexOf('scenes:');const i=s.indexOf('[',a);let d=0,j=i;
    for(;j<s.length;j++){const c=s[j];if(c==='['||c==='{')d++;else if(c===']'||c==='}'){d--;if(d===0)break}
      else if(c==='"'||c==="'"||c==='`'){const q=c;j++;while(s[j]!==q){if(s[j]==='\\')j++;j++}}}
    const scenes=eval('('+s.slice(i,j+1)+')');
    console.log(JSON.stringify(scenes.map(x=>({ar:x.ar,en:x.en,cue:x.cue}))));
    """
    out = subprocess.check_output(['node', '-e', js, os.path.join(ROOT, 'src/content/story.ts')])
    return json.loads(out)


def pieces(text, limit=180):
    """Sentences first; a long sentence is cut at a comma or a space. Order and words are untouched."""
    parts, out = re.findall(r'[^.!?؟…]+[.!?؟…"»”]*\s*', text) or [text], []
    for p in parts:
        p = p.strip()
        while len(p) > limit:
            cut = max(p.rfind('،', 0, limit), p.rfind(',', 0, limit), p.rfind(' ', 0, limit))
            cut = cut if cut > 40 else limit
            out.append(p[:cut + 1].strip()); p = p[cut + 1:].strip()
        if p: out.append(p)
    return out


def fetch(text, lang, path):
    url = 'https://translate.google.com/translate_tts?' + urllib.parse.urlencode({'ie': 'UTF-8', 'q': text, 'tl': lang, 'client': 'tw-ob', 'ttsspeed': '1'})
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            data = urllib.request.urlopen(req, timeout=30).read()
            if len(data) > 800:
                open(path, 'wb').write(data); return
        except Exception as e:  # noqa
            err = e
        time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f'voice service failed for: {text[:40]}… ({err})')


def speak(text, lang, out_path):
    with tempfile.TemporaryDirectory() as tmp:
        files = []
        for k, piece in enumerate(pieces(text)):
            f = os.path.join(tmp, f'{k:02d}.mp3'); fetch(piece, lang, f); files.append(f)
        # join with a 0.28 s breath, slow slightly, level to a calm reading loudness, small fades
        inputs, graph = [], ''
        for k, f in enumerate(files):
            inputs += ['-i', f]; graph += f'[{k}:a]aresample=44100,apad=pad_dur=0.28[a{k}];'
        graph += ''.join(f'[a{k}]' for k in range(len(files))) + f'concat=n={len(files)}:v=0:a=1,atempo={TEMPO[lang]},highpass=f=70,loudnorm=I=-18:TP=-2:LRA=7,afade=t=in:d=0.04[o]'
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        subprocess.run(['ffmpeg', '-hide_banner', '-v', 'error', '-y', *inputs, '-filter_complex', graph, '-map', '[o]', '-ac', '1', '-ar', '44100', '-b:a', '80k', out_path], check=True)
    d = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out_path]))
    return round(d, 2)


GAP = 0.45  # the breath between two paragraphs


def join_scenes(index, scenes):
    """One file per scene (fewer source changes while reading aloud) with each paragraph's start and end."""
    index['scenes'] = {}
    for lang in ['ar', 'en']:
        if lang not in index: continue
        table = []
        for i, sc in enumerate(scenes):
            files = [os.path.join(OUT, lang, f's{i + 1:02d}-p{j + 1:02d}.mp3') for j in range(len(sc[lang]))]
            if not all(os.path.exists(f) for f in files): break
            inputs, graph, paras, t = [], '', [], 0.0
            for k, f in enumerate(files):
                d = index[lang][f's{i + 1:02d}-p{k + 1:02d}']
                paras.append({'start': round(t, 2), 'end': round(t + d, 2)}); t += d + GAP
                inputs += ['-i', f]; graph += f'[{k}:a]apad=pad_dur={GAP if k < len(files) - 1 else 0.1}[a{k}];'
            graph += ''.join(f'[a{k}]' for k in range(len(files))) + f'concat=n={len(files)}:v=0:a=1[o]'
            out = os.path.join(OUT, lang, f's{i + 1:02d}.mp3')
            subprocess.run(['ffmpeg', '-hide_banner', '-v', 'error', '-y', *inputs, '-filter_complex', graph, '-map', '[o]', '-ac', '1', '-ar', '44100', '-b:a', '80k', out], check=True)
            dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out]))
            table.append({'file': f'{lang}/s{i + 1:02d}.mp3', 'dur': round(dur, 2), 'paras': paras})
        index['scenes'][lang] = table


def main():
    only = next((a.split('=')[1] for a in sys.argv if a.startswith('--only=')), None)
    scenes = story()
    if '--join' in sys.argv:
        idx_path = os.path.join(OUT, 'index.json'); index = json.load(open(idx_path)); join_scenes(index, scenes)
        json.dump(index, open(idx_path, 'w'), ensure_ascii=False, indent=1); print('joined'); return
    if '--sample' in sys.argv:
        d = speak(scenes[0]['ar'][0], 'ar', os.path.join(ROOT, 'qa/out/voice/sample-google-ar.mp3')); print('sample', d, 's'); return
    idx_path = os.path.join(OUT, 'index.json')
    index = json.load(open(idx_path)) if os.path.exists(idx_path) else {}
    for lang in ['ar', 'en']:
        if only and lang != only: continue
        index.setdefault(lang, {}); index.setdefault('cue', {}).setdefault(lang, {})
        for i, sc in enumerate(scenes):
            for j, para in enumerate(sc[lang]):
                key = f's{i + 1:02d}-p{j + 1:02d}'
                index[lang][key] = speak(para, lang, os.path.join(OUT, lang, key + '.mp3'))
            index['cue'][lang][f's{i + 1:02d}'] = speak(sc['cue'][lang], lang, os.path.join(OUT, 'cue', lang, f's{i + 1:02d}.mp3'))
            print(lang, 'scene', i + 1, 'done', flush=True)
            json.dump(index, open(idx_path, 'w'), ensure_ascii=False, indent=1)
    join_scenes(index, scenes)
    json.dump(index, open(idx_path, 'w'), ensure_ascii=False, indent=1)
    print('total ar', round(sum(index.get('ar', {}).values())), 's · en', round(sum(index.get('en', {}).values())), 's')


if __name__ == '__main__':
    main()
