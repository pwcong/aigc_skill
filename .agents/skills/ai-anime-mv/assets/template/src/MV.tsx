import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Bokeh, ColorGrade, Flash, Grain, LightLeak, Vignette} from './components/Effects';
import {Kinetic} from './components/Kinetic';
import {Line, Subtitles} from './components/Subtitle';
import {VideoBG, VideoShot} from './components/Video';
import lyrics from './data/lyrics.json';
import {FPS, sec} from './lib/timing';
import {OV, Trans, enterStyle, exitStyle, smooth} from './lib/transitions';
import {TerminalIntro} from './scenes/Examples';
import {C} from './theme';

type Kin = {text: string; color?: string; glow?: string; size?: number; font?: 'display' | 'heavy'; top?: number};
type Shot = {
  from: number; // song seconds — put cuts on aligned lyric starts
  to: number;
  t: Trans; // transition INTO this shot
  kind: 'vid' | 'lip' | 'code';
  clip?: string; // public/clips/<clip>.mp4
  C?: React.FC; // motion-graphics shot
  skip?: number; // frames to skip into a code shot's own timeline
  kin?: Kin; // big lyric typography
  overlay?: React.FC;
  push?: number;
  zoom?: number;
  flip?: boolean;
};

// ---------------- fill per project ----------------
const SHOTS: Shot[] = [
  {from: 0, to: 4, t: 'cut', kind: 'code', C: () => <TerminalIntro prompt="> hello?" reply="Hi. What are we making tonight?" />},
  // {from: 4, to: 8.6, t: 'blur', kind: 'vid', clip: 'v_intro'},
  // {from: 8.6, to: 12, t: 'flash', kind: 'lip', clip: 'ls_01_xxx', kin: {text: 'HOOK WORDS'}},
];

type Bg = {from: number; to: number; render: () => React.ReactNode};
const BGS: Bg[] = [
  // {from: 4, to: 46, render: () => <VideoBG clip="v_city_night" blur={6} dim={0.45} />},
];

// spoken / terminal lines that are not sung but should still get bilingual subtitles
const EXTRA: Line[] = [];
// shots that end with a warm light-leak / white flash
const WARM_FROM = 1e9; // song time where the grade turns warm (e.g. final chorus)
// ---------------------------------------------------

const LINES: Line[] = [...EXTRA, ...(lyrics.lines as Line[])].sort((a, b) => a.start - b.start);
void VideoBG;

const ShotBody: React.FC<{s: Shot}> = ({s}) => {
  // lip-sync clips must play at 1x from the shot start to stay on the vocal
  if (s.kind === 'lip' && s.clip) return <VideoShot clip={s.clip} clipDur={Math.max(4, Math.ceil(s.to - s.from))} minRate={1} zoom={s.zoom ?? 1.03} push={s.push ?? 0.04} />;
  if (s.kind === 'vid' && s.clip) return <VideoShot clip={s.clip} flip={s.flip} zoom={s.zoom} push={s.push} />;
  if (s.C) {
    return s.skip ? (
      <Sequence from={-s.skip} layout="none">
        <s.C />
      </Sequence>
    ) : (
      <s.C />
    );
  }
  return null;
};

const ShotWrap: React.FC<{s: Shot; next?: Shot}> = ({s, next}) => {
  const f = useCurrentFrame();
  const {durationInFrames: d} = useVideoConfig();
  const ovIn = OV[s.t];
  const ovOut = next ? OV[next.t] : 0;
  const pin = ovIn ? Math.min(1, f / ovIn) : 1;
  const pout = ovOut ? Math.max(0, (f - (d - ovOut)) / ovOut) : 0;
  const st = pout > 0 ? exitStyle(next!.t, pout) : pin < 1 ? enterStyle(s.t, pin, f) : {};
  // slow drift only — never pulse scale on the beat (reads as jitter)
  const drift = s.kind === 'code' ? 1 + 0.03 * (f / d) : 1;
  return (
    <AbsoluteFill style={st}>
      <AbsoluteFill style={{transform: `scale(${drift})`}}>
        <ShotBody s={s} />
        {s.overlay ? <s.overlay /> : null}
      </AbsoluteFill>
      {s.kin ? <Kinetic start={s.from} top={660} {...s.kin} /> : null}
    </AbsoluteFill>
  );
};

const BgWrap: React.FC<{bg: Bg}> = ({bg}) => {
  const f = useCurrentFrame();
  const {durationInFrames: d} = useVideoConfig();
  return <AbsoluteFill style={{opacity: smooth(Math.min(1, f / 24, (d - f) / 24))}}>{bg.render()}</AbsoluteFill>;
};

export const MV: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const flash = SHOTS.filter((s) => s.t === 'flash').reduce((m, s) => Math.max(m, Math.max(0, 1 - Math.abs(t - s.from) / 0.3) * 0.45), 0);
  const leak = SHOTS.filter((s) => s.t === 'leak' || s.t === 'flash').map((s) => (t - (s.from - 0.3)) / 1.0).find((p) => p > 0 && p < 1) ?? 0;
  const warm = t > WARM_FROM ? Math.min(1, 0.35 + (t - WARM_FROM) / 25) : 0.35;
  return (
    <AbsoluteFill style={{background: C.ink}}>
      <Audio src={staticFile('audio/song.wav')} />
      {BGS.map((b) => (
        <Sequence key={b.from} from={sec(b.from) - 12} durationInFrames={sec(b.to) - sec(b.from) + 24} layout="none">
          <BgWrap bg={b} />
        </Sequence>
      ))}
      {SHOTS.map((s, i) => {
        const next = SHOTS[i + 1];
        return (
          <Sequence key={`${s.from}`} from={sec(s.from)} durationInFrames={sec(s.to) - sec(s.from) + (next ? OV[next.t] : 0)}>
            <ShotWrap s={s} next={next} />
          </Sequence>
        );
      })}
      <Bokeh opacity={0.45} />
      <ColorGrade warm={warm} />
      <LightLeak p={leak} />
      <Vignette />
      <Grain opacity={0.045} />
      <Flash amount={flash} />
      <Subtitles lines={LINES} />
    </AbsoluteFill>
  );
};
