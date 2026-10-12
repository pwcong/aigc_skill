"""Per-frame mouth openness from the isolated vocal track (Demucs output).

python tools/mouth_env.py public/audio/vocals.wav src/data/mouth.json
Levels: 0 closed, 1 half, 2 open. Hysteresis + min-hold avoid flicker.
"""
import json, sys
import numpy as np
import librosa

src, out = sys.argv[1], sys.argv[2]
FPS = 30
y, sr = librosa.load(src, sr=22050, mono=True)
hop = sr // FPS
# energy in the vocal formant band reacts to syllables better than raw RMS
S = np.abs(librosa.stft(y, n_fft=1024, hop_length=hop))
freqs = librosa.fft_frequencies(sr=sr, n_fft=1024)
band = S[(freqs > 200) & (freqs < 3000)].sum(0)
env = librosa.amplitude_to_db(band, ref=np.max)
env = np.convolve(env, np.ones(3) / 3, mode='same')
# blend a long window (phrase loudness) with a short one (syllable movement)
def norm(win):
    lo = np.array([np.percentile(env[max(0, i - win):i + win], 10) for i in range(len(env))])
    hi = np.array([np.percentile(env[max(0, i - win):i + win], 97) for i in range(len(env))])
    return np.clip((env - lo) / np.maximum(hi - lo, 6), 0, 1)

o = 0.45 * norm(FPS * 4) + 0.55 * norm(FPS // 2)
silent = env < -42
o[silent] = 0

lv = np.zeros(len(o), dtype=int)
cur, hold = 0, 0
for i, v in enumerate(o):
    target = 2 if v > 0.72 else 1 if v > 0.36 else 0
    if target != cur and hold <= 0:
        cur, hold = target, 2  # keep each mouth shape >= 3 frames
    hold -= 1
    lv[i] = cur
json.dump({'fps': FPS, 'levels': ''.join(map(str, lv.tolist())), 'open': [round(float(x), 2) for x in o]}, open(out, 'w'))
print(len(lv), 'frames', 'closed %.0f%% half %.0f%% open %.0f%%' % tuple(100 * np.mean(lv == k) for k in range(3)))
first = int(np.argmax(env > -30))
print('vocals start ~%.2fs' % (first / FPS))
for t in (5, 48, 90, 150):
    print(t, ''.join(map(str, lv[t * FPS:t * FPS + 60])))
