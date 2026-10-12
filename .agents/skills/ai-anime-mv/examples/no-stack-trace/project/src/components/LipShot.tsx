import {AbsoluteFill, Img, Loop, OffthreadVideo, interpolate, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import mouth from '../data/mouth.json';
import rigs from '../data/rigs.json';
import {FPS} from '../lib/timing';

type Box = {x: number; y: number; w: number; h: number};
type Rig = {w: number; h: number; mouth: Box; eyes?: Box; char?: boolean};
const RIGS = rigs as Record<string, Rig>;
const LEVELS: string = mouth.levels;

const feather = 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 52%, rgba(0,0,0,0) 100%)';

const Patch: React.FC<{src: string; b: Box; s: number}> = ({src, b, s}) => (
  <Img
    src={src}
    style={{position: 'absolute', left: b.x * s, top: b.y * s, width: b.w * s, height: b.h * s, WebkitMaskImage: feather, maskImage: feather}}
  />
);

type Props = {
  rig: string;
  start: number; // song time (s) this shot starts at — drives the mouth sync
  push?: number; // total push-in over the shot
  focus?: [number, number]; // push-in origin, 0..1
  zoom?: number; // base framing zoom (crop in)
  sway?: number; // slow vertical drift amplitude px
  energetic?: boolean; // chorus shot (kept for timeline readability; no extra motion)
};

// 2.5D lip-flap shot: blurred plate behind, character cutout with mouth/eye patches in front
export const LipShot: React.FC<Props> = ({rig, start, push = 0.06, focus = [0.5, 0.4], zoom = 1.03, sway = 5, energetic}) => {
  const f = useCurrentFrame();
  const {durationInFrames: d} = useVideoConfig();
  const r = RIGS[rig];
  const s = 1920 / r.w;
  const ox = 0;
  const oy = 0;
  const t = start + f / FPS;
  const gf = Math.round(t * FPS);
  const lv = LEVELS[gf] ?? '0';
  const p = f / d;
  // only slow, smooth motion — no per-beat bobbing or zoom pulses
  const bob = Math.sin(f / 45) * sway * 0.6;
  const rot = Math.sin(f / 90) * 0.35;
  const px = Math.sin(f / 110) * 8;
  const py = Math.cos(f / 130) * 4;
  const scale = zoom + push * p;
  // natural blinks: ~every 2.6–4.2s, 4 frames, seeded per rig
  const period = 78 + Math.floor(random(rig) * 48);
  const blinking = r.eyes && (gf + Math.floor(random(`${rig}o`) * 60)) % period < 4;
  const base = staticFile(`rigs/${rig}/base.jpg`);
  const cx = (r.mouth.x + r.mouth.w / 2) * s;
  const cy = (r.mouth.y + r.mouth.h / 2) * s;
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
      <AbsoluteFill style={{transform: `scale(${scale * 1.03})`, transformOrigin: `${focus[0] * 100}% ${focus[1] * 100}%`}}>
        {/* background plate (moves against the character for depth) */}
        <AbsoluteFill style={{transform: `translate(${-px * 0.6}px, ${-py * 0.6}px) scale(1.02)`, filter: r.char ? 'blur(1.5px) brightness(0.92)' : undefined}}>
          <Img src={base} style={{position: 'absolute', left: ox, top: oy, width: r.w * s, height: r.h * s}} />
        </AbsoluteFill>
        {/* character layer */}
        <AbsoluteFill style={{transform: `translate(${px + ox}px, ${py + bob + oy}px) rotate(${rot}deg)`, transformOrigin: `${cx}px ${cy + 200}px`}}>
          {r.char ? <Img src={staticFile(`rigs/${rig}/char.png`)} style={{position: 'absolute', width: r.w * s, height: r.h * s}} /> : null}
          {lv === '1' ? <Patch src={staticFile(`rigs/${rig}/mouth_half.png`)} b={r.mouth} s={s} /> : null}
          {lv === '2' ? <Patch src={staticFile(`rigs/${rig}/mouth_open.png`)} b={r.mouth} s={s} /> : null}
          {blinking && r.eyes ? <Patch src={staticFile(`rigs/${rig}/eyes_blink.png`)} b={r.eyes} s={s} /> : null}
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// AI video clip; slowed down automatically when the shot is longer than the clip
export const VideoShot: React.FC<{clip: string; clipDur?: number; push?: number; flip?: boolean; startFrom?: number; minRate?: number; zoom?: number}> = ({
  clip,
  clipDur = 5,
  push = 0.04,
  flip,
  startFrom = 0,
  minRate = 0.55,
  zoom = 1.04,
}) => {
  const f = useCurrentFrame();
  const {durationInFrames: d} = useVideoConfig();
  const shotDur = d / FPS;
  const rate = Math.max(minRate, Math.min(1, (clipDur - startFrom / FPS) / shotDur));
  const sc = zoom + push * interpolate(f, [0, d], [0, 1]);
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
      <OffthreadVideo
        src={staticFile(`clips/${clip}.mp4`)}
        muted
        playbackRate={rate}
        startFrom={startFrom}
        style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${sc}) scaleX(${flip ? -1 : 1})`, transformOrigin: '50% 50%'}}
      />
    </AbsoluteFill>
  );
};

// Looping, slowed clip used as a section background behind code shots
export const VideoBG: React.FC<{clip: string; blur?: number; dim?: number; rate?: number}> = ({clip, blur = 4, dim = 0.35, rate = 0.5}) => (
  <AbsoluteFill style={{overflow: 'hidden'}}>
    <Loop durationInFrames={Math.floor((5 / rate) * FPS) - 2}>
      <OffthreadVideo src={staticFile(`clips/${clip}.mp4`)} muted playbackRate={rate} style={{width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.06)', filter: blur ? `blur(${blur}px)` : undefined}} />
    </Loop>
    {dim ? <AbsoluteFill style={{background: '#000', opacity: dim}} /> : null}
  </AbsoluteFill>
);
