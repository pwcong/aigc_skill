"""v3 asset generation with the Dreamina CLI (keyframes -> mouth/blink edits -> image2video).

python3 tools/gen_v3.py submit keyframes|edits|videos
python3 tools/gen_v3.py fetch
State lives in tools/jobs_v3.json; re-running submit skips jobs that already have a submit_id.
"""
import glob, json, os, shutil, subprocess, sys, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJ = os.path.dirname(ROOT)
KF = os.path.join(ROOT, 'public/images/keyframes')
BG = os.path.join(ROOT, 'public/images/raw')
CLIPS = os.path.join(ROOT, 'public/clips')
JOBS = os.path.join(ROOT, 'tools/jobs_v3.json')
CLAUDE = os.path.join(PROJ, 'claude.png')
MALE = os.path.join(PROJ, 'user_anime.png')

STYLE = ('anime illustration, cel-shaded, cinematic lighting, highly detailed background art, soft glow, '
         'cinematic anime color palette with deep blues and warm oranges, 16:9, no text, no watermark')
M = 'the young man from the reference (short black hair with soft bangs, grey-blue plaid long-sleeve shirt, dark navy trousers)'
G = ('the orange-haired girl from the reference (very long orange hair, orange sunflower hair ornament with black ribbon, '
     'white caped dress with black corset and gold sunflower embroidery)')
SING = 'singing emotionally with his mouth open, face clearly visible in three-quarter view, medium close-up'
SING_F = 'singing softly with her mouth open, face clearly visible in three-quarter view, medium close-up'
INTEG = 'the character is lit by the scene lighting and naturally integrated into the environment'

# ---- lip-sync keyframes (full scenes, face large enough for mouth swaps) ----
LIP = {
    'kf_m_desk_red': ([MALE], f'{M} sitting at his desk at 3 a.m., {SING}, red alert light from the monitor flashing on his face, dark room, city window behind, {INTEG}, {STYLE}'),
    'kf_m_screen_blue': ([MALE], f'{M} in a dark room, {SING}, face lit by cold blue monitor light, lonely, eyes looking slightly down, {INTEG}, {STYLE}'),
    'kf_m_rain_window': ([MALE], f'{M} standing by a rainy window at night, {SING}, raindrops on glass, blurred blue city bokeh, soft warm lamp light on one side, {INTEG}, {STYLE}'),
    'kf_m_rooftop_storm': ([MALE], f'{M} on a rooftop at night in strong wind, {SING}, passionate expression, hair and shirt blowing, dramatic crimson and electric blue light streaks in the sky behind, {INTEG}, {STYLE}'),
    'kf_m_dawn': ([MALE], f'{M} walking in a city street at sunrise, {SING}, hopeful expression, golden sunlight on his face, lens flare, {INTEG}, {STYLE}'),
    'kf_c_clipboard': ([CLAUDE], f'{G} holding a clipboard to her chest, {SING_F}, gentle apologetic expression, soft orange glow, dreamy digital space with floating faint text particles behind, {INTEG}, {STYLE}'),
    'kf_c_smile': ([CLAUDE], f'{G}, {SING_F}, bright cheerful smile, eyes open, warm orange light, soft bokeh background, {INTEG}, {STYLE}'),
    'kf_c_clouds': ([CLAUDE], f'{G} standing above an endless sea of clouds under a starry night sky, {SING_F}, melancholic, glowing orange particles drifting around her, hair flowing, {INTEG}, {STYLE}'),
    'kf_c_close_tear': ([CLAUDE], f'Close-up of {G}, {SING_F}, a single tear on her cheek, bittersweet smile, starry night background, soft orange rim light, {INTEG}, {STYLE}'),
}
# ---- motion keyframes (image2video sources) ----
MOTION = {
    'kf_v_m_headinhands': ([MALE], f'{M} sitting at a desk at 3 a.m. with his head in his hands, red alert glowing on the monitor, dark room, coffee mug, city window, wide shot, {INTEG}, {STYLE}'),
    'kf_v_c_holo_logs': ([CLAUDE], f'{G} standing among floating holographic panels of scrolling log text, holding a glowing magnifying glass, curious smile, dark blue digital space, {INTEG}, {STYLE}'),
    'kf_v_c_rewind': ([CLAUDE], f'{G} raising one hand, fragments of glowing orange code swirling around her and reassembling, confident expression, dark digital space, full body, {INTEG}, {STYLE}'),
    'kf_v_screen_glass': ([MALE, CLAUDE], f'Over-the-shoulder shot: {M} seen from behind sitting in front of a large glowing monitor at night; inside the screen {G} smiles and presses her palm against the glass, warm orange light from the screen on his silhouette, {INTEG}, {STYLE}'),
    'kf_v_m_typing': ([MALE], f'Close-up of {M}\'s hands typing slowly on a mechanical keyboard at night, monitor glow, hesitant, shallow depth of field, {STYLE}'),
    'kf_v_m_phone_seen': ([MALE], f'{M} standing alone on a rooftop at night looking down at his glowing phone, wind in his hair, city lights below, lonely, {INTEG}, {STYLE}'),
    'kf_v_c_drafts': ([CLAUDE], f'{G} surrounded by floating glowing paper letters and message drafts in the air, writing gesture with one hand, soft orange light, rainy blue city outside a window, {INTEG}, {STYLE}'),
    'kf_v_c_dissolve': ([CLAUDE], f'{G} beginning to dissolve into glowing orange light particles from the edges, calm sad smile, dark background, {INTEG}, {STYLE}'),
    'kf_v_backtoback': ([MALE, CLAUDE], f'{M} and {G} standing back to back in a dark space, ribbons of crimson and blue light swirling around them, dramatic, full body, {INTEG}, {STYLE}'),
    'kf_v_c_turn': ([MALE, CLAUDE], f'{G} on the right turning back toward {M} on the left, she gently gestures him forward, stars and orange particles between them, above a sea of clouds, {INTEG}, {STYLE}'),
    'kf_v_m_run_dawn': ([MALE], f'{M} running out of an apartment entrance into a city street at sunrise, golden light, long shadows, determined, full body side view, {INTEG}, {STYLE}'),
    'kf_v_m_smile_phone': ([MALE], f'{M} on a rooftop at sunrise looking at his phone with a small surprised smile, golden rim light, city skyline behind, {INTEG}, {STYLE}'),
}
# ---- image2video prompts: (source image path, prompt, duration) ----
VIDEOS = {
    'v_intro_desk': (f'{BG}/bg_night_desk.png', 'slow cinematic push-in toward the glowing monitor, steam rising from the coffee mug, city lights twinkling outside the window', 5),
    'v_m_headinhands': (f'{KF}/kf_v_m_headinhands.png', 'he grips his hair in frustration, red alert light pulses on the walls, slight handheld camera', 5),
    'v_c_holo_logs': (f'{KF}/kf_v_c_holo_logs.png', 'holographic log panels scroll upward, she moves the magnifying glass and leans in, hair sways, slow orbit camera', 5),
    'v_c_rewind': (f'{KF}/kf_v_c_rewind.png', 'code fragments swirl around her and snap back into place, her hair and dress flow, camera slowly pushes in', 5),
    'v_screen_glass': (f'{KF}/kf_v_screen_glass.png', 'she smiles and taps the glass gently, light ripples across the screen, he leans slightly closer, slow push-in', 5),
    'v_m_typing': (f'{KF}/kf_v_m_typing.png', 'fingers type a few letters, pause, hesitate, then continue, screen light flickers softly', 5),
    'v_m_phone_seen': (f'{KF}/kf_v_m_phone_seen.png', 'wind blows his hair and shirt, the phone screen glows, he lowers the phone slowly, camera slowly pulls back', 5),
    'v_c_drafts': (f'{KF}/kf_v_c_drafts.png', 'glowing paper drafts float and rotate around her, she gestures and they rearrange, rain streaks outside', 5),
    'v_c_dissolve': (f'{KF}/kf_v_c_dissolve.png', 'she slowly dissolves into glowing orange particles that drift upward, she keeps a calm smile until she fades', 5),
    'v_backtoback': (f'{KF}/kf_v_backtoback.png', 'light ribbons swirl faster around them, their hair and clothes blow, slow orbiting camera', 5),
    'v_c_turn': (f'{KF}/kf_v_c_turn.png', 'she turns toward him and gently gestures forward, orange particles flow from her to him, slow push-in', 5),
    'v_m_tear': (f'{BG}/m_face_screen.png', 'a single tear rolls down his cheek, he slowly raises his eyes, blue screen light flickers', 5),
    'v_m_run_dawn': (f'{KF}/kf_v_m_run_dawn.png', 'he runs forward into the sunrise, camera tracks alongside him, sunlight flares between buildings', 5),
    'v_m_smile_phone': (f'{KF}/kf_v_m_smile_phone.png', 'he looks at the phone and a warm smile spreads across his face, wind moves his hair, sun rises behind him', 5),
    'v_dawn_city': (f'{BG}/bg_dawn_wide.png', 'clouds drift across the sunrise sky, light slowly brightens over the city, gentle pan right', 5),
    'v_rain_window': (f'{BG}/bg_rain_window.png', 'raindrops trickle down the glass, city bokeh lights shimmer and blink', 5),
    'v_chorus_warm': (f'{BG}/bg_chorus_warm.png', 'ribbons of orange light flow and twist, glowing orbs drift, slow camera push forward', 5),
    'v_chorus_red': (f'{BG}/bg_chorus_red.png', 'crimson and blue light ribbons swirl and collide, sparks burst, camera slowly rotates', 5),
    'v_bridge_sky': (f'{BG}/bg_bridge_sky.png', 'clouds roll slowly below, orange particles drift upward, stars twinkle', 5),
    'v_city_night': (f'{BG}/bg_city_night.png', 'city lights twinkle, cars move on the distant bridge, slight camera drift', 5),
}


# ---- lip-sync clips: (name, rig keyframe, song start, song end) — audio = isolated vocal slice ----
LIPSYNC = [
    ('ls_01_desk_red', 'kf_m_desk_red', 8.62, 11.94),
    ('ls_02_screen_blue', 'kf_m_screen_blue', 40.14, 46.4),
    ('ls_03_rooftop', 'kf_test_sing_m', 46.4, 50.1),
    ('ls_04_rooftop', 'kf_test_sing_m', 60.9, 64.26),
    ('ls_05_rooftop', 'kf_test_sing_m', 71.36, 75.6),
    ('ls_06_rain', 'kf_m_rain_window', 86.76, 90.04),
    ('ls_07_c_clipboard', 'kf_c_clipboard', 90.04, 93.24),
    ('ls_08_rain', 'kf_m_rain_window', 104.08, 107.74),
    ('ls_09_c_smile', 'kf_c_smile', 107.74, 109.96),
    ('ls_10_storm', 'kf_m_rooftop_storm', 114.12, 117.14),
    ('ls_11_storm', 'kf_m_rooftop_storm', 127.0, 129.52),
    ('ls_12_storm', 'kf_m_rooftop_storm', 138.42, 143.88),
    ('ls_13_c_clouds', 'kf_c_clouds', 143.88, 149.06),
    ('ls_14_c_clouds', 'kf_c_clouds', 152.8, 156.5),
    ('ls_15_c_tear', 'kf_c_close_tear', 156.5, 160.6),
    ('ls_16_dawn', 'kf_m_dawn', 175.3, 178.94),
    ('ls_17_dawn', 'kf_m_dawn', 182.2, 186.14),
]
LS_PROMPT = ('The character in the image sings the vocals in the audio with accurate, expressive lip sync. Natural facial expression, '
             'occasional blinking, subtle head and shoulder movement, hair moving gently, slow cinematic camera push-in. '
             'Keep the character design, outfit, lighting and background exactly consistent with the image. No text.')
VOCALS = os.path.join(ROOT, 'public/audio/vocals.wav')
SLICES = os.path.join(ROOT, 'public/audio/vocal_slices')


def lipsync_dur(a, b):
    import math
    return max(4, math.ceil(b - a))


def run(args):
    p = subprocess.run(['dreamina'] + args, capture_output=True, text=True)
    out = p.stdout.strip() or p.stderr.strip()
    try:
        return json.loads(out[out.index('{'):])
    except Exception:
        return {'error': out[-400:]}


def load():
    return json.load(open(JOBS)) if os.path.exists(JOBS) else {}


def save(j):
    json.dump(j, open(JOBS, 'w'), indent=1)


def submit(stage):
    jobs = load()
    todo = []
    if stage == 'keyframes':
        for name, (refs, prompt) in {**LIP, **MOTION}.items():
            args = ['image2image', f'--prompt={prompt}', '--ratio=16:9', '--resolution_type=2k', '--model_version=5.0', '--poll=0']
            for r in refs:
                args += ['--images', r]
            todo.append((name, args, KF, '.png'))
    elif stage == 'edits':
        for name in list(LIP) + ['kf_test_sing_m']:
            src = f'{KF}/{name}.png'
            if not os.path.exists(src):
                continue
            keep = 'Keep everything else in the image exactly identical: same pose, same hair, same lighting, same background, same framing and composition, pixel-aligned.'
            edits = {
                f'{name}_closed': f'Edit only the mouth: mouth gently closed, lips together. {keep}',
                f'{name}_half': f'Edit only the mouth: mouth slightly open as if softly singing a vowel. {keep}',
            }
            if name != 'kf_test_sing_m':
                edits[f'{name}_blink'] = f'Edit only the eyes: eyes gently closed as in a natural blink, mouth gently closed, lips together. {keep}'
            for en, prompt in edits.items():
                todo.append((en, ['image2image', '--images', src, f'--prompt={prompt}', '--ratio=16:9', '--resolution_type=2k', '--model_version=5.0', '--poll=0'], KF, '.png'))
    elif stage == 'videos':
        for name, (img, prompt, dur) in VIDEOS.items():
            if not os.path.exists(img):
                print('missing source', img)
                continue
            todo.append((name, ['image2video', f'--image={img}', f'--prompt={prompt}', f'--duration={dur}', '--video_resolution=1080p', '--model_version=seedance2.0_vip', '--poll=0'], CLIPS, '.mp4'))
    elif stage == 'lipsync' or stage.startswith('lipsync:'):
        only = stage.split(':', 1)[1] if ':' in stage else None
        os.makedirs(SLICES, exist_ok=True)
        for name, kf, a, b in LIPSYNC:
            if only and name != only:
                continue
            dur = lipsync_dur(a, b)
            wav = os.path.join(SLICES, name + '.wav')
            subprocess.run([sys.executable, os.path.join(ROOT, 'tools/slice_audio.py'), VOCALS, str(a), str(a + dur), wav], capture_output=True)
            img = os.path.join(KF, f'{kf}_closed.png')
            todo.append((name, ['multimodal2video', '--image', img, '--audio', wav, f'--prompt={LS_PROMPT}', f'--duration={dur}',
                                '--ratio=16:9', '--video_resolution=1080p', '--model_version=seedance2.0_vip', '--poll=0'], CLIPS, '.mp4'))
    for name, args, outdir, ext in todo:
        if jobs.get(name, {}).get('submit_id'):
            continue
        res = run(args)
        jobs[name] = {'submit_id': res.get('submit_id'), 'status': res.get('gen_status'), 'out': outdir, 'ext': ext, 'error': res.get('error') or res.get('fail_reason')}
        print(name, jobs[name]['submit_id'], jobs[name]['error'] or '')
        save(jobs)


def fetch(timeout=1800):
    t0 = time.time()
    while time.time() - t0 < timeout:
        pending = 0
        jobs = load()  # re-read every round so concurrent submits are never overwritten
        for name, j in jobs.items():
            if j.get('status') in ('done', 'fail') or not j.get('submit_id'):
                continue
            tmp = os.path.join(j['out'], '_dl_' + name)
            os.makedirs(tmp, exist_ok=True)
            res = run(['query_result', f"--submit_id={j['submit_id']}", f'--download_dir={tmp}'])
            st = res.get('gen_status')
            files = sorted(glob.glob(os.path.join(tmp, '*')))
            if st == 'success' and files:
                shutil.move(files[0], os.path.join(j['out'], name + os.path.splitext(files[0])[1]))
                shutil.rmtree(tmp, ignore_errors=True)
                j['status'] = 'done'
                print('done', name, flush=True)
            elif st in ('fail', 'failed'):
                j['status'] = 'fail'
                j['error'] = res.get('fail_reason') or str(res)[-300:]
                shutil.rmtree(tmp, ignore_errors=True)
                print('FAIL', name, j['error'], flush=True)
            else:
                pending += 1
            latest = load()
            latest[name] = j
            save(latest)
        if not pending:
            break
        time.sleep(15)
    print({k: v['status'] for k, v in load().items()})


def redownload():
    """Re-fetch every finished job (e.g. after turning the platform watermark off) and overwrite local files."""
    jobs = load()
    for name, j in jobs.items():
        if j.get('status') != 'done':
            continue
        tmp = os.path.join(j['out'], '_re_' + name)
        os.makedirs(tmp, exist_ok=True)
        res = run(['query_result', f"--submit_id={j['submit_id']}", f'--download_dir={tmp}'])
        files = sorted(glob.glob(os.path.join(tmp, '*')))
        if res.get('gen_status') != 'success' or not files:
            print('skip', name, res.get('gen_status'))
            shutil.rmtree(tmp, ignore_errors=True)
            continue
        dst = os.path.join(j['out'], name + os.path.splitext(files[0])[1])
        is_kf = name.startswith('kf_') and not name.endswith(('_closed', '_half', '_blink'))
        if is_kf:
            # edits were generated from the centre-cropped keyframe, so keep that framing
            os.makedirs(os.path.join(KF, 'orig'), exist_ok=True)
            orig = os.path.join(KF, 'orig', name + '.png')
            shutil.move(files[0], orig)
            w, h = [int(x) for x in subprocess.run(['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', orig], capture_output=True, text=True).stdout.split()[-3::2]]
            subprocess.run(['sips', '--cropToHeightWidth', str(h * 82 // 100), str(w * 82 // 100), orig, '--out', dst], capture_output=True)
        else:
            shutil.move(files[0], dst)
        shutil.rmtree(tmp, ignore_errors=True)
        print('re', name, flush=True)


if __name__ == '__main__':
    {'submit': lambda: submit(sys.argv[2]), 'fetch': fetch, 'redownload': redownload}[sys.argv[1]]()
