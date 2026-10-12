"""Snap lyric line timings to Whisper word timestamps.

python tools/align_lyrics.py src/data/lyrics.json src/data/words.json
Each line is fuzzy-matched against the transcript (monotonic, in order); start = first matched word.
Lines that cannot be matched keep their previous timing.
"""
import difflib, json, re, sys

lp, wp = sys.argv[1], sys.argv[2]
L = json.load(open(lp))
W = json.load(open(wp))
norm = lambda s: re.sub(r"[^a-z0-9]", '', s.lower().replace('claude.md', 'claude').replace('200', 'twohundred'))
tw = [norm(w['w']) for w in W]
alias = {'cache': 'cash', '11': 'eleven', '40': 'forty', '41': 'fortyone'}

cursor = 0
for line in L['lines']:
    toks = [alias.get(norm(t), norm(t)) for t in re.split(r'\s+', line['en']) if norm(t)]
    best = None
    # search a window ahead of the cursor
    for i in range(cursor, min(len(tw), cursor + 60)):
        window = tw[i:i + len(toks) + 4]
        sm = difflib.SequenceMatcher(None, toks, window)
        score = sm.ratio()
        if toks and window and window[0] and (toks[0][:3] == window[0][:3]):
            score += 0.15  # prefer windows that start on the first word
        score -= 0.006 * (i - cursor)  # repeated chorus lines: prefer the nearest occurrence
        if best is None or score > best[0]:
            best = (score, i, sm)
    if best and best[0] > 0.4:
        _, i, sm = best
        blocks = [b for b in sm.get_matching_blocks() if b.size]
        first = i + blocks[0].b
        last = i + blocks[-1].b + blocks[-1].size - 1
        line['_aligned'] = (round(W[first]['s'], 2), round(W[last]['e'], 2), round(best[0], 2))
        cursor = last + 1
    else:
        line['_aligned'] = None

lines = L['lines']
for k, line in enumerate(lines):
    a = line.pop('_aligned')
    if a:
        line['start'] = round(max(0, a[0] - 0.12), 2)
        line['_end_word'] = a[1]
for k, line in enumerate(lines):
    nxt = lines[k + 1]['start'] if k + 1 < len(lines) else line.get('_end_word', line['end']) + 1.5
    end_word = line.pop('_end_word', None)
    # hold the subtitle until the next line (or 1.2s after the last word, whichever is first)
    line['end'] = round(min(nxt, (end_word or line['end']) + 1.2), 2) if end_word else round(min(nxt, line['end']), 2)
    if line['end'] <= line['start']:
        line['end'] = round(line['start'] + 0.8, 2)
json.dump(L, open(lp, 'w'), ensure_ascii=False, indent=1)
old = json.load(open(lp.replace('lyrics.json', 'lyrics_suno_timing.json')))['lines']
for o, n in zip(old, lines):
    flag = '  <<' if abs(o['start'] - n['start']) > 0.6 else ''
    print('%7.2f -> %7.2f-%7.2f  %s%s' % (o['start'], n['start'], n['end'], n['en'][:40], flag))
