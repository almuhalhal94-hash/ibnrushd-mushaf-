#!/usr/bin/env python3
"""تحديث audio/audio.json من ملفات التسجيل الموجودة.

الاستخدام:
    python3 add_audio.py                      # يفحص كل المجلدات ويحدّث قائمة الآيات
    python3 add_audio.py 7 t1 "اسم الطالب"     # يحدّد اسم القارئ لدرس معيّن ثم يفحص

مسار كل تسجيل: audio/<الصف>/<الدرس>/<السورة>_<الآية>.mp3
مثل: audio/7/t1/56_1.mp3  (الأول الإعدادي، درس التلاوة 1، سورة الواقعة، الآية 1)
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
AJ = os.path.join(ROOT, 'audio', 'audio.json')
CUR = json.load(open(os.path.join(ROOT, 'data', 'curriculum.json'), encoding='utf-8'))
data = json.load(open(AJ, encoding='utf-8')) if os.path.exists(AJ) else {}

if len(sys.argv) == 4:
    g, lid, reader = sys.argv[1:]
    data.setdefault(g, {}).setdefault(lid, {})['reader'] = reader

problems = []
for g in sorted(CUR):
    for L in CUR[g]['lessons']:
        d = os.path.join(ROOT, 'audio', g, L['id'])
        if not os.path.isdir(d):
            continue
        ayat = []
        for f in sorted(os.listdir(d)):
            m = re.fullmatch(r'(\d+)_(\d+)\.mp3', f)
            if not m:
                problems.append(f'{g}/{L["id"]}/{f}: اسم غير صحيح (المطلوب السورة_الآية.mp3)')
                continue
            s, a = int(m.group(1)), int(m.group(2))
            if s != L['sura'] or not L['from'] <= a <= L['to']:
                problems.append(f'{g}/{L["id"]}/{f}: الآية خارج الدرس ({L["sura"]}:{L["from"]}-{L["to"]})')
                continue
            ayat.append(a)
        if ayat:
            e = data.setdefault(g, {}).setdefault(L['id'], {})
            e['ayat'] = sorted(ayat)
            e.setdefault('reader', '')
            missing = sorted(set(range(L['from'], L['to'] + 1)) - set(ayat))
            print(f'{g}/{L["id"]} {L["title"]}: {len(ayat)} آية' + (f' · ناقص: {missing}' if missing else ' · مكتمل ✓')
                  + (f' · القارئ: {e["reader"]}' if e['reader'] else ' · ⚠️ اسم القارئ فاضي'))

data['_readme'] = 'لكل صف ودرس: reader = اسم الطالب القارئ، ayat = أرقام الآيات المسجّلة. حدّث الملف بـ add_audio.py'
json.dump(data, open(AJ, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
for p in problems:
    print('⚠️', p)
print('✅ حُدّث audio/audio.json')
