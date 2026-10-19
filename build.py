#!/usr/bin/env python3
"""بناء بيانات «مصحف ابن رشد».

الاستخدام:
    python3 build.py [مسار مستودع ibnrushd-islamic] [مسار meanings.json.gz]

- يقرأ خطة التلاوة (PLAN) وخطة الدروس (DARS) من index.html في موقع القسم،
  ويكتب data/curriculum.json. إذا ما وجد الموقع، يستخدم curriculum.json الموجود.
- يجلب النص العثماني الملوّن بالتجويد من quran.com (text_uthmani_tajweed)
  ويطابق كل آية حرفًا حرفًا مع نص Tanzil العثماني (عبر alquran.cloud).
  أي اختلاف أو فشل جلب يوقف البناء.
- يجلب التفسير الميسر (alquran.cloud ar.muyassar)، ومعاني الكلمات من
  «السراج في بيان غريب القرآن» (بيانات Quranpedia: meanings.json.gz).
- الناتج: data/mushaf.json
"""
import gzip, html, json, os, re, sys, time, urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, '..', 'ibnrushd-islamic')
MEAN = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, '.cache', 'meanings.json.gz')
CACHE = os.path.join(ROOT, '.cache')
os.makedirs(CACHE, exist_ok=True)

GRADE_NAMES = {6: 'السادس الابتدائي', 7: 'الأول الإعدادي', 8: 'الثاني الإعدادي', 9: 'الثالث الإعدادي'}


def die(msg):
    print('⛔ توقف البناء:', msg)
    sys.exit(1)


def get(url, name):
    p = os.path.join(CACHE, name)
    if os.path.exists(p):
        with open(p, 'rb') as f:
            return f.read()
    for i in range(4):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'ibnrushd-mushaf-build'})
            data = urllib.request.urlopen(req, timeout=60).read()
            with open(p, 'wb') as f:
                f.write(data)
            return data
        except Exception as e:
            err = e
            time.sleep(2 ** i)
    die(f'تعذّر الجلب: {url} ({err})')


def getj(url, name):
    return json.loads(get(url, name))


# ---------- 1) المنهج ----------
def js_array(src, var):
    m = re.search(r'var\s+' + var + r'\s*=\s*\{', src)
    if not m:
        die(f'ما لقيت {var} في موقع القسم')
    i = m.end() - 1
    d = 0
    for j in range(i, len(src)):
        if src[j] == '{':
            d += 1
        elif src[j] == '}':
            d -= 1
            if d == 0:
                break
    txt = src[i:j + 1]
    import subprocess
    return json.loads(subprocess.run(['node', '-e', 'process.stdout.write(JSON.stringify(' + txt + '))'],
                                     capture_output=True, text=True, check=True).stdout)


def curriculum(sura_by_name):
    out = os.path.join(ROOT, 'data', 'curriculum.json')
    idx = os.path.join(SITE, 'index.html')
    if not os.path.exists(idx):
        if os.path.exists(out):
            print('ℹ️ موقع القسم غير موجود؛ أستخدم curriculum.json الحالي')
            return json.load(open(out, encoding='utf-8'))
        die('ما لقيت موقع القسم ولا curriculum.json')
    src = open(idx, encoding='utf-8').read()
    plan, dars = js_array(src, 'PLAN'), js_array(src, 'DARS')
    cur = {}
    for g in ('6', '7', '8', '9'):
        lessons, n = [], 0
        sura_of_grade = None
        for row in plan[g]:
            title, rng, week = row[0], row[1], row[2]
            if not rng:  # درس أحكام بدون آيات: خارج النطاق
                continue
            name = re.match(r'سورة\s+(\S+)', title).group(1)
            s = sura_by_name(name)
            a, b = map(int, rng.split('-'))
            n += 1
            hifz = '(حفظ)' in title
            lessons.append({'id': f't{n}', 'kind': 't', 'title': re.sub(r'\s*\(حفظ\)', '', title),
                            'sura': s, 'from': a, 'to': b, 'week': week, 'hifz': hifz})
            sura_of_grade = s
        h = 0
        for row in dars[g]:
            m = re.match(r'سورة\s+(\S+)\s+"(\d+)-(\d+)"\s+\(([^)]*)\)', row[1])
            if not m or 'حفظ' not in m.group(4):
                continue
            h += 1
            lessons.append({'id': f'h{h}', 'kind': 'h', 'title': f'سورة {m.group(1)} ({m.group(2)}-{m.group(3)})',
                            'unit': row[0], 'sura': sura_by_name(m.group(1)), 'from': int(m.group(2)),
                            'to': int(m.group(3)), 'week': row[2], 'hifz': True})
        # السادس: آيات الحفظ هي دروس التلاوة المعلّمة «حفظ»
        for L in [x for x in lessons if x['kind'] == 't' and x['hifz']]:
            h += 1
            lessons.append(dict(L, id=f'h{h}', kind='h', ref=L['id'],
                                title=f"{L['title'].split(' ')[0]} {L['title'].split(' ')[1]} ({L['from']}-{L['to']})"))
        cur[g] = {'name': GRADE_NAMES[int(g)], 'lessons': lessons}
    json.dump(cur, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    return cur


# ---------- 2) النص ----------
MARK = re.compile(r'[ؐ-ًؚ-ٰٟۖ-ۭـ]')


def eq(s):
    """صيغة مقارنة: تُبقي الحروف والهمزات فقط، وتوحّد طرق ترميز الحرف نفسه
    (همزة على كرسي، همزة + مدّة، ياء منقوطة أو غير منقوطة...). لا تُسقط أي حرف."""
    s = re.sub('ـ[ً-ْ]*[ٕٔ]', 'ء', s)  # همزة على كشيدة
    s = s.replace('ـ', '')
    s = re.sub('[يىوای][ً-ْ]*[ٕٔ]', 'ء', s)  # همزة على كرسي
    s = re.sub('[أء]َ?ٓ', 'ءا', s)  # همزة + مدّة = همزة + ألف
    s = re.sub('[أإؤئءٕٔ]', 'ء', s)
    s = s.replace('ٱ', 'ا').replace('آ', 'ءا')
    for c in 'ٮیي':
        s = s.replace(c, 'ى')
    return ''.join(c for c in s if 'ء' <= c <= 'ي')


def clusters(s):
    """يقسم النص إلى عناقيد: حرف أساسي + علاماته."""
    out = []
    for ch in s:
        if out and (MARK.match(ch[0]) or ch in 'ٕٔ'):
            out[-1][1].append(ch)
        else:
            out.append([ch, []])
    return out


def base_key(c):
    c = c.replace('ٱ', 'ا')
    for a, b in (('أإآءؤئ', 'ء'), ('ىيٮی', 'ى')):
        if c in a:
            return b
    return c


def tajweed_chars(h):
    h = re.sub(r'<span class=end>.*?</span>', '', h).strip()
    out = []
    for m in re.finditer(r'<tajweed class=([a-z_]+)>(.*?)</tajweed>|([^<]+)', h):
        cls, txt = (m.group(1), m.group(2)) if m.group(1) else ('', m.group(3))
        out += [(ch, cls) for ch in html.unescape(txt)]
    return out


def colorize(qpc, tj):
    """ينقل أصناف التجويد من نص quran.com إلى نص المجمع بمحاذاة الحروف."""
    import difflib
    # عناقيد التجويد مع أصنافها
    tc = []
    for ch, cls in tj:
        if ch == ' ':
            continue
        if tc and (MARK.match(ch) or ch in 'ٕٔ'):
            tc[-1]['m'].append((ch, cls))
        else:
            tc.append({'b': ch, 'c': cls, 'm': []})
    qc = [c for c in clusters(qpc) if c[0] != ' ']
    A = [base_key(c[0]) for c in qc]
    B = [base_key(c['b']) for c in tc]
    sm = difflib.SequenceMatcher(None, A, B, autojunk=False)
    cls_of = [None] * len(qc)
    hit = 0
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == 'equal' or (op == 'replace' and i2 - i1 == j2 - j1):
            for k in range(i2 - i1):
                cls_of[i1 + k] = tc[j1 + k]
                hit += op == 'equal'
    # بناء الكلمات: كل كلمة قائمة [نص، صنف]
    words, cur, qi = [], [], 0
    for c in clusters(qpc):
        if c[0] == ' ':
            if cur:
                words.append(cur)
            cur = []
            continue
        t = cls_of[qi]
        qi += 1
        parts = []
        if t and t['c']:
            parts.append([c[0] + ''.join(c[1]), t['c']])
        else:
            parts.append([c[0], ''])
            tm = [m for m in (t['m'] if t else []) if m[1]]
            for mk in c[1]:
                k = next((m[1] for m in tm if m[0] == mk), None)
                if k is None and tm and mk in 'ٰٓۥۦ':
                    k = tm[0][1]
                parts.append([mk, k or ''])
        for p in parts:
            if cur and cur[-1][1] == p[1]:
                cur[-1][0] += p[0]
            else:
                cur.append(p)
    if cur:
        words.append(cur)
    return words, hit, len(qc)


# ---------- 3) معاني الكلمات ----------
def norm(s):
    s = re.sub(r'[ً-ٰٟۖ-ۭـ]', '', s)
    s = s.replace('ٱ', 'ا')
    s = re.sub('[أإآ]', 'ا', s).replace('ى', 'ي').replace('ة', 'ه')
    return ''.join(ch for ch in s if 'ء' <= ch <= 'ي' or ch == ' ')


def skel(w):
    return re.sub('[اويءئؤ]', '', w)


def match_phrase(phrase, words):
    pw = [skel(w) for w in norm(phrase).split() if w]
    aw = [skel(norm(''.join(p[0] for p in w))) for w in words]
    if not pw:
        return None
    for i in range(len(aw) - len(pw) + 1):
        if all(aw[i + k] == pw[k] or (len(pw[k]) > 1 and aw[i + k].endswith(pw[k]))
               for k in range(len(pw))):
            return [i, i + len(pw) - 1]
    return None


def main():
    meta = getj('https://api.alquran.cloud/v1/meta', 'meta.json')['data']['surahs']['references']
    names = {}
    for s in meta:
        names[norm(s['name']).replace('سوره ', '').replace(' ', '')] = s['number']

    def sura_by_name(n):
        k = norm(n).replace(' ', '')
        if k not in names:
            die(f'اسم سورة غير معروف: {n}')
        return names[k]

    cur = curriculum(sura_by_name)
    need = {}
    for g in cur.values():
        for L in g['lessons']:
            need.setdefault(L['sura'], set()).update(range(L['from'], L['to'] + 1))

    if not os.path.exists(MEAN):
        get('https://quranpedia.net/dumps/meanings.json.gz', 'meanings.json.gz')
    mdata = json.load(gzip.open(MEAN if os.path.exists(MEAN) else os.path.join(CACHE, 'meanings.json.gz')))
    siraj = {}
    for row in mdata['data']:
        for b in row['meanings']:
            if b['book_info']['id'] == 491:
                siraj[(row['surah'], row['ayah'])] = b['words']

    ayat, suras = {}, {}
    rules = set()
    bad = []
    stats = {'words': 0, 'meanings': 0, 'matched': 0, 'al': 0, 'cl': 0}
    for s in sorted(list(need) + [1]):
        qc = getj(f'https://api.quran.com/api/v4/quran/verses/uthmani_tajweed?chapter_number={s}', f'qc_{s}.json')['verses']
        qp = getj(f'https://api.quran.com/api/v4/quran/verses/qpc_hafs?chapter_number={s}', f'qpc_{s}.json')['verses']
        tz = getj(f'https://api.alquran.cloud/v1/surah/{s}/quran-uthmani', f'tz_{s}.json')['data']
        my = getj(f'https://api.alquran.cloud/v1/surah/{s}/ar.muyassar', f'my_{s}.json')['data']
        suras[s] = {'name': tz['name'], 'count': tz['numberOfAyahs']}
        qcmap = {int(v['verse_key'].split(':')[1]): v['text_uthmani_tajweed'] for v in qc}
        qpmap = {int(v['verse_key'].split(':')[1]): v['text_qpc_hafs'] for v in qp}
        for a in sorted(need.get(s, {1})):
            if a not in qcmap or a not in qpmap:
                die(f'الآية {s}:{a} غير موجودة في quran.com')
            text = re.sub(r'\s*[\u0660-\u0669]+\s*$', '', qpmap[a]).strip()
            x, y = eq(text), eq(tz['ayahs'][a - 1]['text'])
            if a == 1 and s not in (1, 9) and x != y and y.startswith(eq(BISM_TZ)):
                y = y[len(eq(BISM_TZ)):]  # Tanzil يدمج البسملة في أول آية
            if x != y:
                bad.append((s, a, x, y))
                continue
            words, hit, tot = colorize(text, tajweed_chars(qcmap[a]))
            stats['al'] += hit
            stats['cl'] += tot
            for w in words:
                for p in w:
                    if p[1]:
                        rules.add(p[1])
            mm, um = [], []
            for e in siraj.get((s, a), []):
                stats['meanings'] += 1
                r = match_phrase(e['text'], words)
                if r:
                    stats['matched'] += 1
                    mm.append([r[0], r[1], e['text'], e['meaning'].strip()])
                else:
                    um.append([e['text'], e['meaning'].strip()])
            stats['words'] += len(words)
            ayat[f'{s}:{a}'] = {'w': words, 'm': mm, 'u': um, 'y': my['ayahs'][a - 1]['text']}
        if s == 1:
            ayat_bism_words = ayat.pop('1:1')['w']
    if bad:
        for b in bad:
            print('اختلاف:', b)
        die(f'{len(bad)} آية مختلفة بين المصدرين')
    out = {
        'built': time.strftime('%Y-%m-%d'),
        'sources': {
            'text': 'نص مصحف المدينة (مجمع الملك فهد، رواية حفص) عبر quran.com API v4 (text_qpc_hafs)، مطابَق حرفًا حرفًا مع نص Tanzil العثماني، وألوان التجويد من quran.com (text_uthmani_tajweed)',
            'meanings': 'معاني الكلمات: «السراج في بيان غريب القرآن» – د. محمد بن عبد العزيز الخضيري (بيانات Quranpedia.net)',
            'tafsir': 'التفسير الميسر – مجمع الملك فهد لطباعة المصحف الشريف (عبر Tanzil/alquran.cloud)',
        },
        'bismillah': ayat_bism_words,
        'grades': cur, 'suras': suras, 'ayat': ayat, 'rules': sorted(rules),
    }
    p = os.path.join(ROOT, 'data', 'mushaf.json')
    json.dump(out, open(p, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(f'✅ {len(ayat)} آية (نص المجمع) مطابقة لـ Tanzil · محاذاة ألوان التجويد {stats["al"]}/{stats["cl"]} حرف · معاني السراج: {stats["matched"]}/{stats["meanings"]} مربوطة بالكلمة')
    print('   أحكام التجويد:', ', '.join(sorted(rules)))
    print('   الحجم:', os.path.getsize(p) // 1024, 'KB')


BISM_TZ = getj('https://api.alquran.cloud/v1/ayah/1:1/quran-uthmani', 'tz_bism.json')['data']['text']

if __name__ == '__main__':
    main()
