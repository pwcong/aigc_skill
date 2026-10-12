"""Word-level timestamps of the vocal stem:
    transcribe_words.py public/audio/vocals.wav src/data/words.json ["jargon, names, to bias recognition"]"""
import json, sys
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly
from faster_whisper import WhisperModel

model = WhisperModel('medium.en', device='cpu', compute_type='int8')
audio, sr = sf.read(sys.argv[1], dtype='float32')
if audio.ndim > 1:
    audio = audio.mean(1)
audio = resample_poly(audio, 16000, sr).astype(np.float32)  # whisper expects 16 kHz mono
segs, _ = model.transcribe(audio, word_timestamps=True, vad_filter=False, beam_size=5, condition_on_previous_text=False,
                           initial_prompt=sys.argv[3] if len(sys.argv) > 3 else None)
words = []
for s in segs:
    for w in s.words:
        words.append({'w': w.word.strip(), 's': round(w.start, 2), 'e': round(w.end, 2), 'p': round(w.probability, 2)})
json.dump(words, open(sys.argv[2], 'w'), indent=0)
print(len(words), 'words')
print(' '.join(f"{w['w']}@{w['s']}" for w in words[:40]))
