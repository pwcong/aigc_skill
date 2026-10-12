import {AbsoluteFill, Img, Loop, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {FPS} from '../lib/timing';

// AI video clip. Slowed down automatically when the shot is longer than the clip,
// except lip-sync clips (minRate=1) which must play at 1x so the mouth stays on the vocal.
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
        style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${sc}) scaleX(${flip ? -1 : 1})`}}
      />
    </AbsoluteFill>
  );
};

// Looping, slowed, blurred clip used as a section background behind motion-graphics shots
export const VideoBG: React.FC<{clip: string; blur?: number; dim?: number; rate?: number; clipDur?: number}> = ({clip, blur = 4, dim = 0.35, rate = 0.5, clipDur = 5}) => (
  <AbsoluteFill style={{overflow: 'hidden'}}>
    <Loop durationInFrames={Math.floor((clipDur / rate) * FPS) - 2}>
      <OffthreadVideo src={staticFile(`clips/${clip}.mp4`)} muted playbackRate={rate} style={{width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.06)', filter: blur ? `blur(${blur}px)` : undefined}} />
    </Loop>
    {dim ? <AbsoluteFill style={{background: '#000', opacity: dim}} /> : null}
  </AbsoluteFill>
);

// Full-frame still with slow Ken Burns push / pan (src relative to public/)
export const ImageBG: React.FC<{src: string; from?: number; to?: number; panX?: number; dim?: number; blur?: number}> = ({src, from = 1.02, to = 1.1, panX = 0, dim = 0, blur = 0}) => {
  const f = useCurrentFrame();
  const {durationInFrames: d} = useVideoConfig();
  const p = interpolate(f, [0, d], [0, 1]);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Img src={staticFile(src)} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', transform: `translateX(${panX * p}px) scale(${from + (to - from) * p})`, filter: blur ? `blur(${blur}px)` : undefined}} />
      {dim ? <AbsoluteFill style={{background: '#000', opacity: dim}} /> : null}
    </AbsoluteFill>
  );
};
