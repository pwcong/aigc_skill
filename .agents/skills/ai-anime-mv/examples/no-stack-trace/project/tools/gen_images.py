"""Batch-generate MV stills with the Dreamina CLI.

Usage: python3 tools/gen_images.py submit   -> submits jobs, writes tools/jobs.json
       python3 tools/gen_images.py fetch    -> polls & downloads into public/images/raw/
"""
import json, os, subprocess, sys, time, glob, shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJ = os.path.dirname(ROOT)
RAW = os.path.join(ROOT, 'public/images/raw')
JOBS = os.path.join(ROOT, 'tools/jobs.json')
CLAUDE = os.path.join(PROJ, 'claude.png')
MALE = os.path.join(PROJ, 'user_anime.png')

STYLE = ('anime illustration, cel-shaded, cinematic lighting, highly detailed background art, soft glow, '
         'cinematic anime color palette with deep blues and warm oranges')
CHAR = 'clean anime illustration matching the reference art style exactly, plain pure white background, no text, no watermark'
MALE_ID = 'the young man from the reference (short black hair with soft bangs, grey-blue plaid long-sleeve shirt, dark navy cropped trousers, white sneakers)'
GIRL_ID = ('the orange-haired girl from the reference (very long orange hair, orange sunflower hair ornament with black ribbon, '
           'white caped long dress with black corset and gold sunflower embroidery, dark brown boots)')

JOBS_DEF = [
    # backgrounds (16:9, no people)
    ('bg_night_desk', 't2i', '16:9', None,
     "A programmer's small apartment room at 3 a.m., wooden desk with a glowing monitor, mechanical keyboard, cold coffee mug, tangled cables, "
     "sticky notes, large window showing a blue night city skyline, no people, deep navy and teal tones with warm monitor glow, " + STYLE),
    ('bg_monitor_close', 't2i', '16:9', None,
     'Over-the-shoulder view of an empty desk chair facing a large glowing monitor in a dark room, screen glow spilling on the desk, '
     'keyboard in the foreground, no people, ' + STYLE),
    ('bg_rain_window', 't2i', '16:9', None,
     'Rain streaks on a window at night, blurred bokeh city lights in blue, a single warm desk lamp reflection, melancholic, no people, ' + STYLE),
    ('bg_dawn_street', 't2i', '16:9', None,
     'A quiet city street at dawn, apartment building entrance, golden sunrise light flooding between buildings, long shadows, '
     'wet pavement reflecting warm orange sky, hopeful, no people, ' + STYLE),
    ('bg_dawn_wide', 't2i', '21:9', None,
     'Wide panoramic city at sunrise seen from a pedestrian bridge, sky shifting from deep blue to gold, soft clouds, no people, '
     'extra wide composition for horizontal panning, ' + STYLE),
    # v2 atmosphere backgrounds (used blurred behind UI shots)
    ('bg_city_night', 't2i', '16:9', None,
     'Night city skyline seen from a high-rise apartment, deep blue hour, countless warm lit windows, soft haze, distant bridge lights, '
     'calm and lonely, no people, ' + STYLE),
    ('bg_city_rain', 't2i', '16:9', None,
     'Anime city street at night in heavy rain seen from above, blurred neon and street lights reflecting on wet asphalt, '
     'blue and teal tones with small warm accents, melancholic, no people, ' + STYLE),
    ('bg_chorus_warm', 't2i', '16:9', None,
     'Abstract dark cosmic space with flowing ribbons of warm orange and amber light, soft glowing bokeh orbs, subtle light rays, '
     'dreamy and emotional, no people, no text, ' + STYLE),
    ('bg_chorus_red', 't2i', '16:9', None,
     'Abstract dark space with flowing ribbons of deep crimson and cold blue light colliding, glowing bokeh, dramatic light rays, '
     'intense and emotional, no people, no text, ' + STYLE),
    ('bg_bridge_sky', 't2i', '16:9', None,
     'Endless starry night sky above a calm sea of clouds, faint glowing orange particles drifting upward like fireflies, '
     'quiet melancholic atmosphere, vast and soft, no people, ' + STYLE),
    # male lead (refs: anime turnaround)
    ('m_desk_back', 'i2i', '3:4', [MALE],
     f'{MALE_ID}, seen from behind, sitting hunched on an office chair, head in his hands, elbows on knees, upper body and chair visible, {CHAR}'),
    ('m_face_screen', 'i2i', '16:9', [MALE],
     f'Close-up portrait of {MALE_ID}, face lit by cold blue screen light from below, tired eyes, quiet sadness, dark night room background, ' + STYLE),
    ('m_phone_down', 'i2i', '3:4', [MALE],
     f'{MALE_ID}, half body, looking down at a smartphone held in both hands, lonely expression, soft blue phone light on his face, {CHAR}'),
    ('m_walking_side', 'i2i', '2:3', [MALE],
     f'{MALE_ID}, full body side view facing right, walking forward with determined steps, mid-stride, slight forward lean, {CHAR}'),
    ('m_smile_phone', 'i2i', '3:4', [MALE],
     f'{MALE_ID}, half body, looking at his smartphone with a small surprised hopeful smile, warm golden rim light, {CHAR}'),
    # Claude (refs: character sheet)
    ('c_glass_smile', 'i2i', '3:4', [CLAUDE],
     f'Bust shot of {GIRL_ID}, facing the viewer, gentle warm smile, one palm pressed flat against an invisible glass surface in front of her, soft orange rim light, {CHAR}'),
    ('c_magnifier', 'i2i', '2:3', [CLAUDE],
     f'{GIRL_ID}, full body, leaning forward curiously holding a large glowing magnifying glass, playful expression, {CHAR}'),
    ('c_clipboard', 'i2i', '3:4', [CLAUDE],
     f'{GIRL_ID}, half body, holding a clipboard with mostly blank pages, apologetic gentle expression, head slightly tilted, {CHAR}'),
    ('c_threads', 'i2i', '2:3', [CLAUDE],
     f'{GIRL_ID}, full body, one hand raised gracefully, calm focused expression, glowing orange threads flowing from her fingertips, {CHAR}'),
    ('c_turn_back', 'i2i', '2:3', [CLAUDE],
     f'{GIRL_ID}, full body side view, turning back over her shoulder, soft bittersweet smile, one hand gently gesturing forward as if saying go, long hair flowing, {CHAR}'),
]


def run(args):
    p = subprocess.run(['dreamina'] + args, capture_output=True, text=True)
    out = p.stdout.strip() or p.stderr.strip()
    try:
        return json.loads(out[out.index('{'):])
    except Exception:
        return {'error': out}


def submit():
    jobs = json.load(open(JOBS)) if os.path.exists(JOBS) else {}
    for name, kind, ratio, refs, prompt in JOBS_DEF:
        if name in jobs and jobs[name].get('submit_id'):
            continue
        if kind == 't2i':
            args = ['text2image', f'--prompt={prompt}', f'--ratio={ratio}', '--resolution_type=2k', '--model_version=5.0', '--poll=0']
        else:
            args = ['image2image', f'--prompt={prompt}', f'--ratio={ratio}', '--resolution_type=2k', '--model_version=5.0', '--poll=0']
            for r in refs:
                args += ['--images', r]
        res = run(args)
        jobs[name] = {'submit_id': res.get('submit_id'), 'status': res.get('gen_status'), 'error': res.get('error') or res.get('fail_reason')}
        print(name, jobs[name])
        json.dump(jobs, open(JOBS, 'w'), indent=1)


def fetch(timeout=900):
    jobs = json.load(open(JOBS))
    t0 = time.time()
    while time.time() - t0 < timeout:
        pending = 0
        for name, j in jobs.items():
            if j.get('status') == 'done' or not j.get('submit_id'):
                continue
            tmp = os.path.join(RAW, '_dl_' + name)
            os.makedirs(tmp, exist_ok=True)
            res = run(['query_result', f"--submit_id={j['submit_id']}", f'--download_dir={tmp}'])
            st = res.get('gen_status')
            files = glob.glob(os.path.join(tmp, '*'))
            if st == 'success' and files:
                ext = os.path.splitext(files[0])[1] or '.png'
                shutil.move(files[0], os.path.join(RAW, name + ext))
                shutil.rmtree(tmp, ignore_errors=True)
                j['status'] = 'done'
                print('done', name)
            elif st in ('fail', 'failed'):
                j['status'] = 'fail'
                j['error'] = res.get('fail_reason') or res
                print('FAIL', name, j['error'])
            else:
                pending += 1
        json.dump(jobs, open(JOBS, 'w'), indent=1)
        if not pending:
            break
        time.sleep(10)
    print({k: v['status'] for k, v in jobs.items()})


if __name__ == '__main__':
    {'submit': submit, 'fetch': fetch}[sys.argv[1]]()
