#!/usr/bin/env python3
"""Tempo, beats, downbeats and per-second energy: analyze_audio.py <song.wav> <out.json>"""
import json, sys
import numpy as np
import librosa

wav, out = sys.argv[1], sys.argv[2]
y, sr = librosa.load(wav, sr=22050, mono=True)
dur = len(y) / sr
tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units='time')
tempo = float(np.atleast_1d(tempo)[0])
env = librosa.onset.onset_strength(y=y, sr=sr)
bf = np.clip(librosa.time_to_frames(beats, sr=sr), 0, len(env) - 1)
phase = int(np.argmax([env[bf][p::4].mean() for p in range(4)]))
rms = librosa.feature.rms(y=y, hop_length=512)[0]
t = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=512)
per = [float(rms[(t >= s) & (t < s + 1)].mean()) for s in range(int(dur) + 1)]
mx = max(per) or 1
json.dump({'duration': round(dur, 3), 'tempo': round(tempo, 2), 'beats': [round(float(b), 3) for b in beats],
           'downbeats': [round(float(b), 3) for b in beats[phase::4]], 'energy_per_sec': [round(v / mx, 3) for v in per]}, open(out, 'w'))
print(f'duration {dur:.1f}s  tempo {tempo:.1f}  beats {len(beats)}')
print('energy per 4s:', ' '.join(f'{s}:{np.mean(per[s:s+4])/mx:.2f}' for s in range(0, int(dur), 4)))
