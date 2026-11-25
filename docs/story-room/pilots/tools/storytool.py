#!/usr/bin/env python3
"""
Story Room pilot tool: builds the Arabic and Hebrew display layers from the voice layer, then checks every story
folder against content/SCHEMA.md and the age briefs.

  python3 docs/story-room/pilots/tools/storytool.py build     # src/<id>.ar.json, src/<id>.he.json -> content/stories/<id>/
  python3 docs/story-room/pilots/tools/storytool.py check     # all checks, prints a report, exit 1 on any error

Arabic source files hold only the full layer (style-ar F1-F12) with two writer's markers that never reach the
output:  "|" after a one-letter prefix (وَ| بِ| لِ| فَ| كَ|), so rule L8 can strip it;  "^" after a word whose
final vowel is a person or gender ending kept by rule L2 (ـتُ ـتَ ـتِ ـكَ ـكِ). The light layer is then made by
deleting marks under rules L1-L8, in order, never by adding: two writers who agree on the full layer get the same
light layer. Hebrew source files hold the speech layer (display + P1 stress U+05AB, P2 vocal shva U+05BD, P3
kamatz katan U+05C7); the display layer is the speech layer with those three removed (U+05C7 back to kamatz).
"""
import json, re, sys, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
SRC = ROOT / 'docs/story-room/pilots/src'
OUT = ROOT / 'content/stories'
# Every story folder named like a01, b02, c15 (the library's own stories; samples and the author's story excluded).
# A command may name stories after it: "check a01 a02", "build ar a01".
import re as _re
STORIES = sorted(d.name for d in (Path(__file__).resolve().parents[4] / 'content' / 'stories').iterdir()
                 if d.is_dir() and _re.fullmatch(r'[abc]\d\d', d.name))
LANGS = ['ar', 'he', 'en', 'da']

# ---------------------------------------------------------------- Arabic
FATHA, DAMMA, KASRA, SUKUN, SHADDA = 'َ', 'ُ', 'ِ', 'ْ', 'ّ'
TF, TD, TK = 'ً', 'ٌ', 'ٍ'
AR_MARKS = set([FATHA, DAMMA, KASRA, SUKUN, SHADDA, TF, TD, TK])
SHORT = set([FATHA, DAMMA, KASRA])
SUN = set('تثدذرزسشصضطظلن')
L8_WORDS = set('في على إلى عن مع هو هي هم هما أنا نحن أنت أنتم هذا هذه ذلك تلك هنا هناك كان كانت قال قالت يا لا ما '
               'لم لن أن إن ثم أو كل الذي التي قد حتى'.split())
AR_WORD = re.compile('[ء-يً-ْ|^]+')


def ar_clusters(word):
    out = []
    for ch in word:
        if ch in AR_MARKS:
            out[-1][1].append(ch)
        else:
            out.append([ch, []])
    return out


def ar_join(cl):
    return unicodedata.normalize('NFC', ''.join(c + ''.join(m) for c, m in cl))


def ar_clean(s):
    return unicodedata.normalize('NFC', s.replace('|', '').replace('^', ''))


def ar_light_word(word):
    keep_end = word.endswith('^')
    word = word.rstrip('^')
    parts = word.split('|')
    prefixes, stem = parts[:-1], parts[-1]
    pre = [[c, []] for p in prefixes for c, _ in ar_clusters(p)]  # L8: one-letter prefixes lose every mark
    cl = ar_clusters(stem)
    if not cl:  # a "|" right before a non-letter such as « (وَ|«...): the prefix stands alone, so only L8 applies
        return ar_join(pre)
    skel = ''.join(c for c, _ in cl)
    if skel in L8_WORDS:  # L8: function words keep only a shadda (and the gender ending of أنتَ أنتِ)
        for i, (c, m) in enumerate(cl):
            last = i == len(cl) - 1
            cl[i][1] = [x for x in m if x == SHADDA or (last and skel == 'أنت' and x in SHORT)]
        return ar_join(pre + cl)
    for c in cl:  # L1
        c[1] = [x for x in c[1] if x != SUKUN]
    last = cl[-1]  # L2 (a final shadda is kept: it is part of the consonant, e.g. عَدّ, ظَلّ, لكِنّ; REVIEW-ar.md D1)
    last[1] = [x for x in last[1] if x in (TF, SHADDA) or (keep_end and x in SHORT)]
    for i in range(len(cl) - 1):  # L3
        nxt_c, nxt_m = cl[i + 1]
        if FATHA in cl[i][1] and nxt_c in 'اى' and not nxt_m:
            cl[i][1].remove(FATHA)
        if DAMMA in cl[i][1] and nxt_c == 'و' and not nxt_m:
            cl[i][1].remove(DAMMA)
        if KASRA in cl[i][1] and nxt_c == 'ي' and not nxt_m:
            cl[i][1].remove(KASRA)
    for i in range(len(cl) - 1):  # L4
        if cl[i + 1][0] == 'ة' and FATHA in cl[i][1]:
            cl[i][1].remove(FATHA)
    art = None  # L5: the article, also after the prefix لِ (لِلْ...)
    if len(cl) > 2 and cl[0][0] == 'ا' and cl[1][0] == 'ل':
        art = 1
    elif prefixes and prefixes[-1].startswith('ل') and len(cl) > 1 and cl[0][0] == 'ل' and (
            SHADDA in cl[1][1] or not cl[0][1] or cl[0][1] == [SUKUN]):
        art = 0
    if art is not None:
        for j in range(art + 1):
            cl[j][1] = []
        if art + 1 < len(cl) and cl[art + 1][0] in SUN:
            cl[art + 1][1] = [x for x in cl[art + 1][1] if x != SHADDA]
    for c in cl:  # L6
        if SHADDA in c[1]:
            c[1] = [x for x in c[1] if x not in SHORT]
    for c in cl:  # L7
        if c[0] == 'إ':
            c[1] = [x for x in c[1] if x != KASRA]
    return ar_join(pre + cl)


def ar_light(s):
    return unicodedata.normalize('NFC', AR_WORD.sub(lambda m: ar_light_word(m.group(0)), s))


# ---------------------------------------------------------------- Hebrew
HE_STRESS, HE_VSHVA, HE_KKATAN, HE_KAMATZ = '֫', 'ֽ', 'ׇ', 'ָ'


def he_display(s):
    return unicodedata.normalize('NFC', s.replace(HE_STRESS, '').replace(HE_VSHVA, '').replace(HE_KKATAN, HE_KAMATZ))


def he_speech(s):
    """Source placeholders typed right after a letter and its points: @ stress (P1), % vocal shva (P2),
    $ kamatz katan (P3: the kamatz of that letter becomes U+05C7)."""
    out = []
    for ch in s:
        if ch == '@':
            out.append(HE_STRESS)
        elif ch == '%':
            out.append(HE_VSHVA)
        elif ch == '$':
            i = len(out) - 1
            while i >= 0 and out[i] != HE_KAMATZ and not ('א' <= out[i] <= 'ת'):
                i -= 1
            if i < 0 or out[i] != HE_KAMATZ:
                raise ValueError(f'$ without a kamatz in: {s}')
            out[i] = HE_KKATAN
        else:
            out.append(ch)
    return unicodedata.normalize('NFC', ''.join(out))


# ---------------------------------------------------------------- build
def build(langs=('ar', 'he')):
    for sid in STORIES:
        for lang in langs:
            src = SRC / f'{sid}.{lang}.json'
            if not src.exists():
                continue
            d = json.loads(src.read_text('utf-8'))
            if lang == 'ar':
                disp, clean = ar_light, ar_clean
                d['title'] = disp(d['title'])
                act = d['activity']
                for k in ('title', 'goal', 'safety', 'forAdult', 'inClass'):
                    act[k] = disp(act[k])
                act['materials'] = [disp(x) for x in act['materials']]
                for st in act['steps']:
                    st['caption'] = disp(st['caption'])
            else:
                clean = he_speech
                disp = lambda s: he_display(he_speech(s))
                d['title'] = disp(d['title'])
            # pages and film keep the key order n, text, speech (text is always derived, never typed)
            d['pages'] = [{'n': r['n'], 'text': disp(r['speech']), 'speech': clean(r['speech'])} for r in d['pages']]
            d['film'] = [{'id': r['id'], 'speaker': r['speaker'], 'text': disp(r['speech']), 'speech': clean(r['speech']),
                          'emotion': r['emotion']} for r in d['film']]
            out = OUT / sid / f'{lang}.json'
            order = ['title', 'names', 'pages', 'film', 'activity']
            out.write_text(json.dumps({k: d[k] for k in order}, ensure_ascii=False, indent=2) + '\n', 'utf-8')
            print('built', out.relative_to(ROOT))


# ---------------------------------------------------------------- checks
LIMITS = {  # from the age briefs; English and Danish are held to them, Arabic and Hebrew are reported
    '2-3': dict(total=(40, 150), spreads=(8, 12), per=(3, 15), maxsent=8, film=(120, 180), steps=None, minutes=(5, 10)),
    '4-5': dict(total=(200, 450), spreads=(12, 14), per=(15, 40), maxsent=14, film=(240, 300), steps=(2, 3), minutes=(10, 20)),
    '6-8': dict(total=(450, 900), spreads=(14, 16), per=(30, 70), maxsent=20, film=(360, 480), steps=(3, 5), minutes=(20, 30)),
}
WORD = re.compile(r"[\w֑-ׇً-ْ'’-]+", re.U)
LATIN = re.compile('[A-Za-z]')


def words(s):
    return [w for w in WORD.findall(s) if re.search(r'[^\W\d_]', w)]


def sentences(s):
    s = re.sub(r'[«»“”"„]', ' ', s)
    parts = re.split(r'(?:\.\.\.|…|[.!?؟])+', s)
    return [p for p in parts if words(p)]


def ar_fully_marked(s):
    """Every Arabic letter carries a mark except: ا ى (long or wasl), a lengthening و or ي, the lam of the article
    before a sun letter, a final long letter. Returns a list of problems."""
    errs = []
    for w in AR_WORD.findall(s):
        cl = ar_clusters(w.replace('|', '').replace('^', ''))
        for i, (c, m) in enumerate(cl):
            if m:
                continue
            prev = cl[i - 1] if i else None
            nxt = cl[i + 1] if i + 1 < len(cl) else None
            if c in 'اىآ':
                continue
            if c == 'و' and prev and DAMMA in prev[1]:
                continue
            if c == 'ي' and prev and KASRA in prev[1]:
                continue
            if c == 'و' and prev and prev[0] == 'ا' and i == len(cl) - 1:
                continue
            if c == 'و' and nxt and nxt[0] == 'ا' and i == len(cl) - 2 and prev and DAMMA in prev[1]:
                continue
            if c == 'ل' and prev and prev[0] == 'ا' and nxt and SHADDA in nxt[1]:
                continue
            if c == 'ل' and nxt and SHADDA in nxt[1] and (i == 0 or (i == 1 and prev[0] == 'ل')):
                continue
            # F13: a stretched sound word repeats one letter three or more times (وِييي، مَاااءْ); the repeats after
            # the first stay bare. Real words never hold three identical letters in a row.
            run = [x[0] for x in cl]
            if prev and prev[0] == c and (run[i - 2:i + 1] == [c] * 3 or run[i - 1:i + 2] == [c] * 3):
                continue
            errs.append(f'{w}: bare {c}')
    # pausal form before . ! ? ؟ : » … (style-ar F7)
    for m in re.finditer('([ء-يً-ْ]+)\\s*([.!؟?:»…])', s):
        last = ar_clusters(m.group(1))[-1]
        if any(x in last[1] for x in (FATHA, DAMMA, KASRA, TD, TK)):
            errs.append(f'not pausal before "{m.group(2)}": {m.group(1)}')
    # a sukun at the end of a word right before hamzat al-wasl (ال or a wasl verb) in connected speech
    for m in re.finditer('([ء-يً-ْ]+)ْ (ا)', s):
        errs.append(f'sukun before hamzat al-wasl: {m.group(0)}')
    if 'ـ' in s:
        errs.append('tatweel')
    if 'ٱ' in s:
        errs.append('alif wasla sign')
    return errs


HE_LETTER = re.compile('[א-ת]')
HE_VOWEL = set(chr(c) for c in range(0x05b0, 0x05bc)) | {'ׇ'}


def he_fully_marked(s):
    errs = []
    for w in re.findall('[א-ת֑-ׇ]+', s):
        cl = []
        for ch in w:
            if HE_LETTER.match(ch):
                cl.append([ch, set()])
            elif cl:
                cl[-1][1].add(ch)
        for i, (c, m) in enumerate(cl):
            if c == 'ש' and not ({'ׁ', 'ׂ'} & m):
                errs.append(f'{w}: shin without dot')
            if i == len(cl) - 1 or (m & HE_VOWEL):
                continue
            if c in 'אהוי':
                continue
            nxt = cl[i + 1]
            if nxt[0] == 'ו' and (nxt[1] & {'ֹ', 'ּ'}):
                continue
            errs.append(f'{w}: bare {c}')
    return errs


def check():
    errors, report = [], []
    for sid in STORIES:
        base = OUT / sid
        if not all((base / f).exists() for f in ['story.json', 'cast.json'] + [f'{l}.json' for l in LANGS]):
            report.append(f'\n## {sid}: not complete yet, skipped')
            continue
        story = json.loads((base / 'story.json').read_text('utf-8'))
        cast = json.loads((base / 'cast.json').read_text('utf-8'))
        lim = LIMITS[story['ageGroups'][0]]
        files = {l: json.loads((base / f'{l}.json').read_text('utf-8')) for l in LANGS}
        E = lambda msg: errors.append(f'{sid}: {msg}')
        # --- structure
        pn = [p['n'] for p in story['pages']]
        if pn != list(range(1, len(pn) + 1)):
            E('story page numbers not 1..N')
        if not lim['spreads'][0] <= len(pn) <= lim['spreads'][1]:
            E(f'{len(pn)} spreads, limit {lim["spreads"]}')
        for p in story['pages']:
            z = p['zone']
            if z['side'] not in ('start', 'end', 'full') or z['v'] not in ('top', 'middle', 'bottom') or z['size'] not in 's m l'.split():
                E(f'page {p["n"]} bad zone')
            if p.get('image', 'x') is not None:
                E(f'page {p["n"]} image must be null')
        ids = [c['id'] for c in cast]
        if sorted(ids) != sorted(story['cast']):
            E('cast.json ids differ from story.cast')
        for c in cast:
            for k in ('id', 'name', 'stage', 'build', 'skin', 'hair', 'eyes', 'top', 'bottom', 'shoes', 'manner'):
                if k not in c:
                    E(f'cast {c.get("id")} missing {k}')
            if set(c['name']) != set(LANGS):
                E(f'cast {c["id"]} names not in four languages')
            for col in [c['skin'], c['hair']['color'], c['eyes']['color'], c['top']['color'], c['bottom']['color'], c['shoes']['color']]:
                if not re.fullmatch('#[0-9a-f]{6}', col):
                    E(f'cast {c["id"]} colour {col}')
        film_ids = [l for s in story['film']['shots'] for l in s['lines']]
        secs = 0
        for s in story['film']['shots']:
            m = re.match(r'(\d+) s\.', s['action'])
            if not m:
                E(f'shot {s["n"]} has no duration')
            else:
                secs += int(m.group(1))
            if s['page'] is not None and s['page'] not in pn:
                E(f'shot {s["n"]} page {s["page"]} missing')
        if [s['n'] for s in story['film']['shots']] != list(range(1, len(story['film']['shots']) + 1)):
            E('shot numbers not 1..N')
        if len(set(film_ids)) != len(film_ids):
            E('a film line is used in two shots')
        if not lim['film'][0] <= secs <= lim['film'][1]:
            E(f'film {secs} s outside {lim["film"]}')
        if abs(secs - story['film']['targetSeconds']) > 10:
            E(f'film shots sum {secs} s, target {story["film"]["targetSeconds"]}')
        steps = [s['n'] for s in story['activity']['steps']]
        if lim['steps'] and not lim['steps'][0] <= len(steps) <= lim['steps'][1]:
            E(f'{len(steps)} activity steps, limit {lim["steps"]}')
        if not lim['minutes'][0] <= story['activity']['minutes'] <= lim['minutes'][1]:
            E('activity minutes outside the brief')
        report.append(f'\n## {sid} ({story["ageGroups"][0]}): {len(pn)} spreads, film {secs} s in {len(story["film"]["shots"])} shots, '
                      f'{len(film_ids)} film lines, {len(steps)} activity steps')
        for l, d in files.items():
            if [p['n'] for p in d['pages']] != pn:
                E(f'{l} page numbers differ')
            if [f['id'] for f in d['film']] != film_ids:
                E(f'{l} film ids differ from the shot list order')
            if [s['n'] for s in d['activity']['steps']] != steps:
                E(f'{l} activity steps differ')
            if set(d['names']) != set(story['cast']):
                E(f'{l} names keys differ from cast')
            for f in d['film']:
                if f['speaker'] != 'narrator' and f['speaker'] not in story['cast']:
                    E(f'{l} {f["id"]} unknown speaker {f["speaker"]}')
                if not f['emotion'].strip():
                    E(f'{l} {f["id"]} no emotion')
            texts = [d['title']] + [p['text'] for p in d['pages']] + [p['speech'] for p in d['pages']] + \
                [f['text'] for f in d['film']] + [f['speech'] for f in d['film']]
            act = d['activity']
            texts += [act[k] for k in ('title', 'goal', 'safety', 'forAdult', 'inClass')] + act['materials'] + [s['caption'] for s in act['steps']]
            if any(re.search(r'\d', t) for t in [d['title']] + [p['text'] for p in d['pages']] + [f['text'] for f in d['film']]):
                E(f'{l} digits in story or film text')
            if l in ('ar', 'he'):
                for t in texts:
                    if LATIN.search(t):
                        E(f'{l} Latin letters in: {t[:40]}')
            if l == 'ar':
                src = json.loads((SRC / f'{sid}.ar.json').read_text('utf-8'))
                for p, r in zip(d['pages'] + d['film'], src['pages'] + src['film']):
                    tag = p.get('n', p.get('id'))
                    for e in ar_fully_marked(p['speech']):
                        E(f'ar {tag} {e}')
                    if ar_light(r['speech']) != p['text'] or ar_clean(r['speech']) != p['speech']:
                        E(f'ar {tag} regenerating the light layer from the full layer does not give the same text')
                sa = src['activity']
                for t in [sa[k] for k in ('goal', 'safety', 'forAdult', 'inClass')] + sa['materials'] + [x['caption'] for x in sa['steps']]:
                    for e in ar_fully_marked(re.sub(r'\d+', '', t)):
                        E(f'ar activity source {e}')
            if l == 'he':
                for p in d['pages'] + d['film']:
                    tag = p.get('n', p.get('id'))
                    for e in he_fully_marked(p['speech']):
                        E(f'he {tag} {e}')
                    if he_display(p['speech']) != p['text'] or re.search('[@%$]', p['speech']):
                        E(f'he {tag} display is not speech minus the three voice marks')
                for t in [act[k] for k in ('title', 'goal', 'safety', 'forAdult', 'inClass')] + act['materials'] + [s['caption'] for s in act['steps']]:
                    if re.search('[֑-ׇ]', t):
                        E(f'he adult text is pointed: {t[:30]}')
            if l in ('en', 'da'):
                for p in d['pages'] + d['film']:
                    if p['text'] != p['speech']:
                        E(f'{l} text and speech differ')
            # counts
            per = [len(words(p['text'])) for p in d['pages']]
            longest = max((len(words(s)), p['n']) for p in d['pages'] for s in sentences(p['text']))
            tot = sum(per)
            film_longest = max(len(words(f['text'])) for f in d['film'])
            report.append(f'- {l}: {tot} words (limit {lim["total"][0]}-{lim["total"][1]} for English); per spread {min(per)}-{max(per)} '
                          f'(limit {lim["per"][0]}-{lim["per"][1]}); longest sentence {longest[0]} words on page {longest[1]} '
                          f'(limit {lim["maxsent"]}); film {sum(len(words(f["text"])) for f in d["film"])} words, longest caption '
                          f'{film_longest} words')
            if l in ('en', 'da'):
                if not lim['total'][0] <= tot <= lim['total'][1]:
                    E(f'{l} total {tot} words outside {lim["total"]}')
                for p, c in zip(d['pages'], per):
                    if not lim['per'][0] <= c <= lim['per'][1]:
                        E(f'{l} page {p["n"]} has {c} words, limit {lim["per"]}')
                if longest[0] > lim['maxsent']:
                    E(f'{l} sentence of {longest[0]} words on page {longest[1]}')
            else:
                if tot > lim['total'][1]:
                    E(f'{l} total {tot} words above the cap')
                if longest[0] > lim['maxsent']:
                    E(f'{l} sentence of {longest[0]} words on page {longest[1]}')
            if film_longest > {'2-3': 8, '4-5': 12, '6-8': 16}[story['ageGroups'][0]]:
                E(f'{l} film caption of {film_longest} words is too long to read on screen')
    print('# Check report')
    print('\n'.join(report))
    print('\n## Errors' if errors else '\n## Errors: none')
    for e in errors:
        print('-', e)
    return 1 if errors else 0


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'check'
    rest = sys.argv[2:]
    ids = [a for a in rest if _re.fullmatch(r'[abc]\d\d', a)]
    if ids:
        STORIES[:] = ids
    if cmd == 'build':  # "build" = Arabic and Hebrew; "build ar" or "build he" = one language only
        build(tuple(a for a in rest if a in ('ar', 'he')) or ('ar', 'he'))
    elif cmd == 'light':
        for line in sys.stdin:
            print(ar_light(line.rstrip('\n')))
    else:
        sys.exit(check())
