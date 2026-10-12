#!/usr/bin/env python3
"""Build src/data/lyrics.json from a bilingual lyric sheet, with rough timings.

    make_lyrics_json.py <lyrics_bilingual.txt> <out.json> [--suno timing.tsv] [--duration SEC]

Sheet format (one sung line per row; section headers in brackets; singer m/f optional):
    [verse1]
    m | Three a.m., the server's down | 凌晨三点，服务器宕机
    f | (I can't read her heart) | （我读不懂她的心）
Rough timings come from the Suno tx3g track (extract_lyrics_track.swift output) when given,
otherwise lines are spread evenly. Always refine afterwards with align_lyrics.py.
"""
import json, re, sys

src, out = sys.argv[1], sys.argv[2]
opt = dict(zip(sys.argv[3::2], sys.argv[4::2]))
lines, section = [], 'intro'
for raw in open(src, encoding='utf-8'):
    raw = raw.strip()
    if not raw:
        continue
    m = re.match(r'^\[(.+)\]$', raw)
    if m:
        section = m.group(1).strip().lower().replace(' ', '')
        continue
    parts = [p.strip() for p in raw.split('|')]
    if len(parts) == 2:
        parts = ['m'] + parts
    singer, en, zh = parts[:3]
    lines.append({'start': 0, 'end': 0, 'section': section, 'singer': singer, 'en': en, 'zh': zh})

timed = []
if '--suno' in opt:
    for row in open(opt['--suno'], encoding='utf-8'):
        a, b, txt = row.rstrip('\n').split('\t')
        if txt.startswith('[') or float(b) - float(a) < 0.05:
            continue
        timed.append((float(a), float(b)))
if len(timed) >= len(lines):
    for l, (a, b) in zip(lines, timed):
        l['start'], l['end'] = round(a, 2), round(b, 2)
else:
    dur = float(opt.get('--duration', 180))
    step = (dur - 10) / max(1, len(lines))
    for i, l in enumerate(lines):
        l['start'], l['end'] = round(5 + i * step, 2), round(5 + (i + 1) * step, 2)
json.dump({'fps': 30, 'lines': lines}, open(out, 'w'), ensure_ascii=False, indent=1)
print(len(lines), 'lines ->', out, '(rough timing; run align_lyrics.py next)')
