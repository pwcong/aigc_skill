"""Build a lip-flap rig from keyframe variants.

python tools/build_rig.py <name> <closed.png> <half.png> <open.png> [blink.png]
Writes public/rigs/<name>/{base.jpg, mouth_half.png, mouth_open.png, eyes_blink.png} and rig.json
Mouth / eye boxes are found automatically from pixel differences between variants.
"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args = [a for a in sys.argv[1:] if not a.startswith('--region=')]
region = next((list(map(int, a.split('=')[1].split(','))) for a in sys.argv[1:] if a.startswith('--region=')), None)  # x0,y0,x1,y1 mouth search area
name, closed, half, opn = args[:4]
blink = args[4] if len(args) > 4 else None
out = os.path.join(ROOT, 'public/rigs', name)
os.makedirs(out, exist_ok=True)

base = Image.open(closed).convert('RGB')
W, H = base.size


def load(p):
    return Image.open(p).convert('RGB').resize((W, H), Image.LANCZOS)


def lum(img, s):
    a = np.asarray(img.resize((W // s, H // s))).astype(float)
    return 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]


def pad_box(x0, y0, x1, y1, fx=0.6, fy=0.7, extra=24):
    pw, ph = (x1 - x0) * fx + extra, (y1 - y0) * fy + extra
    return [int(max(0, x0 - pw)), int(max(0, y0 - ph)), int(min(W, x1 + pw)), int(min(H, y1 + ph))]


def mouth_box(closed_img, open_img, s=4):
    """Open mouth = compact region much darker than the closed version."""
    c, o = lum(closed_img, s), lum(open_img, s)
    dark = ndimage.gaussian_filter(np.clip(c - o, 0, None), 1.2)
    if region:
        keep = np.zeros_like(dark, dtype=bool)
        keep[region[1] // s:region[3] // s, region[0] // s:region[2] // s] = True
        dark[~keep] = 0
    m = dark > 28
    lab, n = ndimage.label(m)
    area_img = m.size
    best = None
    for k in range(1, n + 1):
        ys, xs = np.nonzero(lab == k)
        area = len(xs)
        if not (area_img * 0.00015 < area < area_img * 0.015):
            continue
        bw, bh = np.ptp(xs) + 1, np.ptp(ys) + 1
        compact = area / (bw * bh)
        aspect = bw / bh
        if not (0.6 < aspect < 4.0):
            continue
        score = dark[ys, xs].sum() * compact
        if best is None or score > best[0]:
            best = (score, xs.min(), ys.min(), xs.max(), ys.max())
    if best is None:
        raise SystemExit('mouth not found')
    _, x0, y0, x1, y1 = best
    return pad_box(x0 * s, y0 * s, x1 * s, y1 * s)


def eyes_box(closed_img, blink_img, mb, s=4):
    """Blink changes inside a window above the mouth; union of the two strongest blobs."""
    c, b = lum(closed_img, s), lum(blink_img, s)
    d = ndimage.gaussian_filter(np.abs(c - b), 1.2)
    mx, my = (mb[0] + mb[2]) / 2 / s, mb[1] / s
    hw, hh = d.shape[1], d.shape[0]
    win = np.zeros_like(d, dtype=bool)
    win[int(max(0, my - 0.34 * hh)):int(max(1, my - 0.02 * hh)), int(max(0, mx - 0.2 * hw)):int(min(hw, mx + 0.2 * hw))] = True
    m = (d > 22) & win
    lab, n = ndimage.label(m)
    if n == 0:
        return None
    scores = ndimage.sum(d, lab, range(1, n + 1))
    keep = np.argsort(scores)[::-1][:2] + 1
    ys, xs = np.nonzero(np.isin(lab, keep))
    return pad_box(xs.min() * s, ys.min() * s, xs.max() * s, ys.max() * s, fx=0.25, fy=0.45, extra=16)


rig = {'w': W, 'h': H}
op = load(opn)
mb = mouth_box(base, op)
rig['mouth'] = {'x': mb[0], 'y': mb[1], 'w': mb[2] - mb[0], 'h': mb[3] - mb[1]}
base.save(os.path.join(out, 'base.jpg'), quality=92)
for key, p in (('half', half), ('open', opn)):
    load(p).crop(tuple(mb)).save(os.path.join(out, f'mouth_{key}.png'))
if blink:
    bl = load(blink)
    eb = eyes_box(base, bl, mb)
    if eb:
        rig['eyes'] = {'x': eb[0], 'y': eb[1], 'w': eb[2] - eb[0], 'h': eb[3] - eb[1]}
        bl.crop(tuple(eb)).save(os.path.join(out, 'eyes_blink.png'))
json.dump(rig, open(os.path.join(out, 'rig.json'), 'w'), indent=1)
# full-frame character cutout for 2.5D parallax
import subprocess
subprocess.run([os.path.join(ROOT, 'tools/.cutout_full'), os.path.join(out, 'base.jpg'), os.path.join(out, 'char.png')], check=False)
# aggregate all rigs for the renderer
reg = {}
for d in sorted(os.listdir(os.path.join(ROOT, 'public/rigs'))):
    f = os.path.join(ROOT, 'public/rigs', d, 'rig.json')
    if os.path.exists(f):
        reg[d] = json.load(open(f))
        reg[d]['char'] = os.path.exists(os.path.join(ROOT, 'public/rigs', d, 'char.png'))
json.dump(reg, open(os.path.join(ROOT, 'src/data/rigs.json'), 'w'), indent=1)
print(name, rig)
