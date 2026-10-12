#!/usr/bin/env python3
"""Spec-driven batch runner for the Dreamina (即梦) CLI.

    python3 dreamina_jobs.py <spec.json> submit [--only NAME[,NAME]] [--type TYPE]
    python3 dreamina_jobs.py <spec.json> fetch [--timeout SEC]
    python3 dreamina_jobs.py <spec.json> status
    python3 dreamina_jobs.py <spec.json> redownload     # e.g. after turning the platform watermark off
    python3 dreamina_jobs.py <spec.json> reset NAME[,NAME]   # forget jobs so they can be resubmitted

All paths in the spec are relative to the spec file's directory (the project root).
State is kept next to the spec as <spec>.state.json and is re-read on every poll, so you can
submit more jobs while a fetch loop is running without clobbering records.

Spec format:
{
  "defaults": {"image_model": "5.0", "image_res": "2k", "video_model": "seedance2.0_vip", "video_res": "1080p"},
  "jobs": [
    {"name": "kf_hero", "type": "image2image", "refs": ["refs/hero.png"], "prompt": "...", "ratio": "16:9", "out": "public/images/keyframes"},
    {"name": "bg_city", "type": "text2image", "prompt": "...", "ratio": "16:9", "out": "public/images/bg"},
    {"name": "v_intro", "type": "image2video", "image": "public/images/bg/bg_city.png", "prompt": "...", "duration": 5, "out": "public/clips"},
    {"name": "ls_01", "type": "lipsync", "image": "public/images/keyframes/kf_hero.png",
     "audio": {"src": "public/audio/vocals.wav", "start": 46.4, "end": 50.1}, "prompt": "...", "out": "public/clips"}
  ]
}
Jobs whose input image does not exist yet are skipped with "waiting"; run submit again after fetch.
lipsync = multimodal2video with an isolated vocal slice; duration = max(4, ceil(end-start)).
"""
import glob, json, math, os, shutil, subprocess, sys, time, wave

SPEC = os.path.abspath(sys.argv[1])
ROOT = os.path.dirname(SPEC)
STATE = SPEC.replace('.json', '') + '.state.json'
P = lambda p: p if os.path.isabs(p) else os.path.join(ROOT, p)


def run(args):
    p = subprocess.run(['dreamina'] + args, capture_output=True, text=True)
    out = (p.stdout or '').strip() or (p.stderr or '').strip()
    try:
        return json.loads(out[out.index('{'):])
    except Exception:
        return {'error': out[-500:]}


def load_state():
    return json.load(open(STATE)) if os.path.exists(STATE) else {}


def save_state(s):
    tmp = STATE + '.tmp'
    json.dump(s, open(tmp, 'w'), indent=1)
    os.replace(tmp, STATE)


def update_state(name, rec):
    s = load_state()
    s[name] = rec
    save_state(s)


def slice_wav(src, a, b, out):
    with wave.open(src, 'rb') as w:
        sr, ch, sw = w.getframerate(), w.getnchannels(), w.getsampwidth()
        w.setpos(int(a * sr))
        data = w.readframes(int((b - a) * sr))
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with wave.open(out, 'wb') as o:
        o.setnchannels(ch)
        o.setsampwidth(sw)
        o.setframerate(sr)
        o.writeframes(data)


def build_args(job, d):
    t = job['type']
    if t in ('text2image', 'image2image'):
        args = [t, f"--prompt={job['prompt']}", f"--ratio={job.get('ratio', '16:9')}", f"--resolution_type={job.get('res', d['image_res'])}",
                f"--model_version={job.get('model', d['image_model'])}", '--poll=0']
        for r in job.get('refs', []):
            args += ['--images', P(r)]
        return args
    if t == 'image2video':
        return ['image2video', f"--image={P(job['image'])}", f"--prompt={job['prompt']}", f"--duration={job.get('duration', 5)}",
                f"--video_resolution={job.get('res', d['video_res'])}", f"--model_version={job.get('model', d['video_model'])}", '--poll=0']
    if t == 'lipsync':
        a, b = job['audio']['start'], job['audio']['end']
        dur = max(4, math.ceil(b - a))
        wav = P(f"public/audio/vocal_slices/{job['name']}.wav")
        slice_wav(P(job['audio']['src']), a, a + dur, wav)
        return ['multimodal2video', '--image', P(job['image']), '--audio', wav, f"--prompt={job['prompt']}", f'--duration={dur}',
                f"--ratio={job.get('ratio', '16:9')}", f"--video_resolution={job.get('res', d['video_res'])}",
                f"--model_version={job.get('model', d['video_model'])}", '--poll=0']
    raise SystemExit(f'unknown job type {t}')


def inputs_ready(job):
    need = [job['image']] if 'image' in job else []
    need += job.get('refs', [])
    return all(os.path.exists(P(x)) for x in need)


def submit(spec, only=None, typ=None):
    d = {'image_model': '5.0', 'image_res': '2k', 'video_model': 'seedance2.0_vip', 'video_res': '1080p', **spec.get('defaults', {})}
    for job in spec['jobs']:
        n = job['name']
        if only and n not in only:
            continue
        if typ and job['type'] != typ:
            continue
        if load_state().get(n, {}).get('submit_id'):
            continue
        if not inputs_ready(job):
            print('waiting', n, '(input not generated yet)')
            continue
        res = run(build_args(job, d))
        ext = '.mp4' if job['type'] in ('image2video', 'lipsync') else '.png'
        rec = {'submit_id': res.get('submit_id'), 'status': res.get('gen_status') or 'error', 'out': job['out'], 'ext': ext, 'error': res.get('error') or res.get('fail_reason')}
        update_state(n, rec)
        print('submitted' if rec['submit_id'] else 'ERROR', n, rec['submit_id'] or rec['error'], flush=True)


def download(name, rec):
    out = P(rec['out'])
    tmp = os.path.join(out, '_dl_' + name)
    os.makedirs(tmp, exist_ok=True)
    res = run(['query_result', f"--submit_id={rec['submit_id']}", f'--download_dir={tmp}'])
    st = res.get('gen_status')
    files = sorted(glob.glob(os.path.join(tmp, '*')))
    if st == 'success' and files:
        shutil.move(files[0], os.path.join(out, name + os.path.splitext(files[0])[1]))
        shutil.rmtree(tmp, ignore_errors=True)
        return 'done', None
    shutil.rmtree(tmp, ignore_errors=True)
    if st in ('fail', 'failed'):
        return 'fail', res.get('fail_reason') or str(res)[-300:]
    return 'querying', None


def fetch(timeout=3600):
    t0 = time.time()
    while time.time() - t0 < timeout:
        pending = 0
        for name, rec in load_state().items():
            if rec.get('status') in ('done', 'fail') or not rec.get('submit_id'):
                continue
            st, err = download(name, rec)
            if st == 'querying':
                pending += 1
                continue
            rec['status'], rec['error'] = st, err
            update_state(name, rec)
            print(st, name, err or '', flush=True)
        if not pending:
            break
        time.sleep(15)
    status()


def status():
    s = load_state()
    by = {}
    for n, r in s.items():
        by.setdefault(r.get('status'), []).append(n)
    for k, v in by.items():
        print(f'{k}: {len(v)}', '' if k == 'done' else v)


def redownload():
    for name, rec in load_state().items():
        if rec.get('status') == 'done':
            st, _ = download(name, rec)
            print('re' if st == 'done' else 'skip', name, flush=True)


def reset(names):
    s = load_state()
    for n in names:
        s.pop(n, None)
    save_state(s)
    print('reset', names)


if __name__ == '__main__':
    spec = json.load(open(SPEC))
    cmd = sys.argv[2]
    opt = dict(zip(sys.argv[3::2], sys.argv[4::2]))
    if cmd == 'submit':
        submit(spec, set(opt['--only'].split(',')) if '--only' in opt else None, opt.get('--type'))
    elif cmd == 'fetch':
        fetch(int(opt.get('--timeout', 3600)))
    elif cmd == 'status':
        status()
    elif cmd == 'redownload':
        redownload()
    elif cmd == 'reset':
        reset(sys.argv[3].split(','))
