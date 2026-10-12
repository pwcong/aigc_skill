"""Slice a segment out of the song WAV: python3 tools/slice_audio.py <in.wav> <start_s> <end_s> <out.wav>"""
import sys, wave

src, a, b, out = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
with wave.open(src, 'rb') as w:
    sr, ch, sw = w.getframerate(), w.getnchannels(), w.getsampwidth()
    w.setpos(int(a * sr))
    data = w.readframes(int((b - a) * sr))
with wave.open(out, 'wb') as o:
    o.setnchannels(ch)
    o.setsampwidth(sw)
    o.setframerate(sr)
    o.writeframes(data)
print(out, round(b - a, 2), 's')
