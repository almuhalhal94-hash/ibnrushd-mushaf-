#!/usr/bin/env python3
"""تركيب تعليق أ. طلال على فيديو مصحف ابن رشد.

python3 tools/promo/mix_vo.py VO.mp3 VIDEO.mp4 OUT_DIR [AYAH.flac]
- البداية: صوت الآية كاملة (ayah_full.flac، تنتهي 11.25).
- بعدها: يشيل الصوت القديم، ويحط كل جملة بعد ظهور مشهدها بـ LEAD ثانية.
- مؤثرات مركّبة (وووش/لمعة/طلوع/نزول) تنخفض تحت الصوت، والمكساج -14 LUFS.
يكتب OUT_DIR/vo_track.wav و sfx_track.wav و plan.json.
"""
import json, subprocess, sys
import numpy as np

SR = 48000
LEAD = 0.25                      # بداية الكلام بعد ظهور المشهد
KEEP = 10.0                      # صوت الآية الأصلي
SCENES = [12.0, 16.0, 22.0, 30.5, 35.0, 39.5, 43.0, 49.0, 52.5, 56.0, 60.0]
MAXPAUSE = 0.22                  # أقصى سكتة داخل الجملة (للجمل اللي تضيق على مشهدها)
rng = np.random.default_rng(7)


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR),
                          "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()


def save(path, x):
    x = np.atleast_2d(x)
    if x.shape[0] != 2:
        x = np.vstack([x, x])
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2",
                    "-i", "-", path], input=x.T.astype(np.float32).tobytes(), check=True)


def silences(x, thr_db=-30, min_len=0.2, hop=0.01):
    """فترات السكوت [(بداية، نهاية)] بالثواني."""
    h = int(hop * SR)
    n = len(x) // h
    rms = np.sqrt(np.mean(x[:n * h].reshape(n, h) ** 2, 1) + 1e-12)
    q = 20 * np.log10(rms) < thr_db
    out, i = [], 0
    while i < n:
        if q[i]:
            j = i
            while j < n and q[j]:
                j += 1
            if (j - i) * hop >= min_len:
                out.append((i * hop, j * hop))
            i = j
        else:
            i += 1
    return out


def fade(x, a=0.015, b=0.04):
    na, nb = int(a * SR), int(b * SR)
    x = x.copy()
    x[:na] *= np.linspace(0, 1, na)
    x[-nb:] *= np.linspace(1, 0, nb)
    return x


def squeeze(seg, limit):
    """يقصّر السكتات الداخلية الأطول من limit (يحافظ على وسطها)."""
    parts, last = [], 0.0
    for s, e in silences(seg, min_len=limit + 0.02):
        if s < 0.05 or e > len(seg) / SR - 0.05:
            continue
        cut = (e - s) - limit
        m = (s + e) / 2
        a, b = int((m - cut / 2) * SR), int((m + cut / 2) * SR)
        x = seg[int(last * SR):a]
        parts.append(x)
        last = b / SR
    parts.append(seg[int(last * SR):])
    # تلاحم ناعم بين القطع
    out = parts[0]
    k = int(0.01 * SR)
    for p in parts[1:]:
        out = np.concatenate([out[:-k], out[-k:] * np.linspace(1, 0, k) + p[:k] * np.linspace(0, 1, k), p[k:]])
    return out


# ---------- المؤثرات ----------
def env(n, peak=0.6, p=2.0):
    t = np.linspace(0, 1, n)
    return np.where(t < peak, (t / peak) ** p, ((1 - t) / (1 - peak)) ** p)


def sweep_noise(dur, f0, f1, f2, peak=0.6, q=1.2):
    """ضوضاء يمرّ تردد مركزها f0→f1→f2 (فلترة بالترددات، إطار بإطار)."""
    n = int(dur * SR)
    N, H = 2048, 512
    win = np.hanning(N)
    noise = rng.standard_normal(n + 2 * N)
    out = np.zeros(n + 2 * N)
    norm = np.zeros(n + 2 * N)
    freqs = np.fft.rfftfreq(N, 1 / SR)
    for a in range(0, n + N, H):
        t = min(1.0, max(0.0, (a - N / 2) / n))
        f = f0 * (f1 / f0) ** (t / peak) if t < peak else f1 * (f2 / f1) ** ((t - peak) / (1 - peak))
        bw = f / q
        g = np.exp(-0.5 * ((freqs - f) / bw) ** 2)
        fr = np.fft.irfft(np.fft.rfft(noise[a:a + N] * win) * g) * win
        out[a:a + N] += fr
        norm[a:a + N] += win ** 2
    out = (out / np.maximum(norm, 1e-3))[N // 2:N // 2 + n]
    return out * env(n, peak) / (np.abs(out).max() + 1e-9)


def pan(x, l0, l1):
    g = np.linspace(l0, l1, len(x))
    return np.vstack([x * np.cos((g + 1) * np.pi / 4), x * np.sin((g + 1) * np.pi / 4)])


def whoosh(dur=0.55, d=1):
    return pan(sweep_noise(dur, 350, 2600, 700, 0.62), -0.7 * d, 0.7 * d)


def shimmer(dur=1.6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for i, f in enumerate([2093, 2637, 3136, 3951, 4186, 5274]):
        o = i * 0.045
        tt = np.clip(t - o, 0, None)
        x += (t >= o) * np.sin(2 * np.pi * f * tt) * np.exp(-tt * 4.5) * (0.9 ** i)
    x += sweep_noise(dur, 6000, 9000, 7000, 0.15, 2) * 0.15
    # صدى خفيف
    y = x.copy()
    for k, g in [(0.083, 0.35), (0.131, 0.25), (0.197, 0.15)]:
        s = int(k * SR)
        y[s:] += x[:-s] * g
    y /= np.abs(y).max()
    L = y
    R = np.concatenate([np.zeros(int(0.012 * SR)), y])[:n]
    return np.vstack([L, R])


def riser(dur=0.9):
    n = int(dur * SR)
    t = np.arange(n) / SR
    ph = 2 * np.pi * np.cumsum(220 * (1200 / 220) ** (t / dur)) / SR
    tone = np.sin(ph) * 0.35
    x = (sweep_noise(dur, 300, 4000, 5000, 0.97) + tone) * (t / dur) ** 2.2
    x[-int(0.02 * SR):] *= np.linspace(1, 0, int(0.02 * SR))
    return pan(x / np.abs(x).max(), -0.3, 0.3)


def drop(dur=0.7):
    n = int(dur * SR)
    t = np.arange(n) / SR
    ph = 2 * np.pi * np.cumsum(900 * (110 / 900) ** (t / dur)) / SR
    tone = np.sin(ph) * np.exp(-t * 3)
    thump = np.sin(2 * np.pi * 60 * t) * np.exp(-t * 12) * 0.8
    x = tone * 0.6 + sweep_noise(dur, 2500, 900, 200, 0.2) * 0.5 + thump
    return pan(x / np.abs(x).max(), 0.4, -0.4)


def main(vo_path, video, outdir, ayah=None):
    vo = load(vo_path)
    gaps = silences(vo)                      # السكتات بين الجمل وداخلها
    # حدود الجمل: أطول السكتات تفصل بين الجمل (9 فواصل لـ 10 جمل)
    words = None
    import os
    wj = os.path.splitext(vo_path)[0] + "_words.json"   # تفريغ whisper بتوقيت الكلمات
    if os.path.exists(wj):
        words = json.load(open(wj))
    # أول كلمة في كل جملة (حسب السكريبت) لتحديد الفواصل من التفريغ
    starts_kw = ["مصحف", "لكل", "والجديد", "وأرسل", "اضغط", "والأحكام", "احفظ", "ويشتغل", "وكل", "امسح"]
    bounds, wi = [], 0
    for kw in starts_kw:
        while wi < len(words) and words[wi][2].replace("أ", "ا") != kw.replace("أ", "ا"):
            wi += 1
        bounds.append(words[wi][0])
        wi += 1
    end_t = words[-1][1]
    segs = []
    for i, b in enumerate(bounds):
        # الفاصل الحقيقي = السكتة الأقرب لبداية الجملة حسب التفريغ
        if i == 0:
            on = 0.0
            for s, e in silences(vo, min_len=0.0):
                if s <= 0.01:
                    on = e
            a = max(0, on - 0.05)
        else:
            s, e = min(gaps, key=lambda g: abs((g[0] + g[1]) / 2 - b))
            on, a = e, max(s, e - 0.06)
        if i + 1 < len(bounds):
            s2, e2 = min(gaps, key=lambda g: abs((g[0] + g[1]) / 2 - bounds[i + 1]))
            z = min(s2 + 0.12, e2)
        else:
            z = min(len(vo) / SR, end_t + 0.35)
        segs.append((a, on, z))

    track = np.zeros(int(60 * SR))
    plan = []
    for i, (a, on, z) in enumerate(segs):
        seg = vo[int(a * SR):int(z * SR)]
        scene, nxt = SCENES[i], SCENES[i + 1]
        room = nxt - (scene + LEAD) - 0.08           # يخلص قبل المشهد اللي بعده بـ 80ms
        lead_in = on - a
        squeezed = False
        if len(seg) / SR - lead_in > room:
            seg = squeeze(seg, MAXPAUSE)
            squeezed = True
        seg = fade(seg)
        st = scene + LEAD - lead_in
        p = int(st * SR)
        track[p:p + len(seg)] += seg[:len(track) - p]
        plan.append(dict(scene=i + 1, scene_t=scene, vo_on=round(scene + LEAD, 3),
                         vo_end=round(st + len(seg) / SR, 3), next=nxt, squeezed=squeezed))

    # رفع الصوت لمستوى الآية (-14 LUFS تقريبًا) يتم في ffmpeg
    save(os.path.join(outdir, "vo_track.wav"), track)

    sfx = np.zeros((2, int(60 * SR)))

    def put(x, t_hit, at_frac, g_db):
        p = int((t_hit - at_frac * x.shape[1] / SR) * SR)
        x = x * 10 ** (g_db / 20)
        e = min(sfx.shape[1], p + x.shape[1])
        sfx[:, p:e] += x[:, :e - p]

    # الانتقالات (وقت منتصف الانتقال = بداية المشهد - 0.12)
    put(riser(0.75), 12.0, 1.0, -9)       # طلوع للشعار (يبدأ بعد نهاية الآية)
    put(shimmer(1.8), 12.02, 0.0, -11)    # لمعة الشعار الذهبي
    put(whoosh(0.55, 1), 15.9, 0.62, -10)
    put(whoosh(0.6, -1), 21.85, 0.62, -10)
    put(shimmer(1.2), 22.05, 0.0, -16)    # الجديد
    put(whoosh(0.5, 1), 30.35, 0.62, -10)
    put(drop(0.6), 34.85, 0.25, -13)      # نزول للمعنى
    put(whoosh(0.5, -1), 34.85, 0.62, -13)
    put(shimmer(1.4), 39.45, 0.0, -14)    # ألوان التجويد
    put(whoosh(0.5, 1), 39.35, 0.62, -12)
    put(riser(0.7), 42.85, 1.0, -13)      # طلوع لاحفظ
    put(whoosh(0.5, -1), 42.85, 0.62, -12)
    put(drop(0.6), 48.85, 0.25, -12)      # نزول: يِنزِل على جوالك
    put(whoosh(0.5, 1), 48.85, 0.62, -13)
    put(whoosh(0.55, -1), 52.4, 0.62, -10)
    put(riser(0.9), 55.95, 1.0, -10)      # طلوع للباركود
    put(shimmer(2.0), 56.05, 0.0, -11)
    save(os.path.join(outdir, "sfx_track.wav"), sfx)
    json.dump(plan, open(os.path.join(outdir, "plan.json"), "w"), ensure_ascii=False, indent=1)
    for r in plan:
        print(r)
    if ayah:
        mix(video, ayah, outdir)


def mix(video, ayah, outdir):
    """صوت الآية + التعليق + المؤثرات (تنخفض تحت التعليق) ← -14 LUFS."""
    import os
    j = lambda f: os.path.join(outdir, f)
    fc = ("[0:a]aresample=48000,apad=whole_dur=60[orig];"
          "[1:a]highpass=f=70,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=1,volume=8dB[vo];"
          "[vo]asplit=2[vo1][key];"
          "[2:a][key]sidechaincompress=threshold=0.02:ratio=8:attack=15:release=350:makeup=1[sfxd];"
          "[orig][vo1][sfxd]amix=inputs=3:normalize=0:duration=first,atrim=0:60,"
          "alimiter=limit=0.79:attack=3:release=60:level=0[m]")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", ayah, "-i", j("vo_track.wav"), "-i", j("sfx_track.wav"),
                    "-filter_complex", fc, "-map", "[m]", "-c:a", "pcm_f32le", j("premix.wav")], check=True)
    log = subprocess.run(["ffmpeg", "-i", j("premix.wav"), "-af", "ebur128", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    import re
    i_lufs = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", log)[-1])
    gain = -14.0 - i_lufs
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", video, "-i", j("premix.wav"), "-map", "0:v", "-map", "1:a",
                    "-c:v", "copy", "-af", f"volume={gain:.2f}dB", "-c:a", "aac", "-b:a", "256k", "-ar", "48000",
                    "-movflags", "+faststart", "-shortest", j("final.mp4")], check=True)
    print("premix", i_lufs, "LUFS, gain", round(gain, 2))


if __name__ == "__main__":
    main(*sys.argv[1:5])
