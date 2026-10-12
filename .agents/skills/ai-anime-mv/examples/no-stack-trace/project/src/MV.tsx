import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Rain, Void} from './components/Backgrounds';
import {BgName, ImageBG} from './components/Images';
import {Bokeh, ColorGrade, Flash, Grain, LightLeak, Vignette} from './components/Effects';
import {Line, Subtitles} from './components/Subtitle';
import lyrics from './data/lyrics.json';
import {Easing, interpolate} from 'remotion';
import {lin} from './lib/anim';
import {FPS, pulse, sec} from './lib/timing';
import {ShotGo, ShotCloseTab, ShotHoldsContext, ShotIsYou, ShotPrompt, ShotThreads, ShotUnknown} from './scenes/Bridge';
import {ShotFinale, ShotFriday, ShotHeartbreakError, ShotHttp, ShotNoLine, ShotRevert, ShotSeen, ShotSorry, ShotTasks, ShotTimer, ShotTypeQuestion} from './scenes/Chorus';
import {ShotOutro, ShotPhoneFinale, ShotWalk} from './scenes/Final';
import {IntroTerminal, Shot3am, ShotGreen, ShotLogs, ShotMigration, ShotRace, ShotResume, ShotScreen, ShotTests} from './scenes/Verse1';
import {ShotAbsolutelyRight, ShotClaudeMd, ShotContext, ShotDrafts, ShotForget, ShotPaste, ShotSpace, ShotWrong} from './scenes/Verse2';
import {C, F} from './theme';

type Trans = 'cut' | 'dissolve' | 'zoom' | 'glitch' | 'blur' | 'leak' | 'flash' | 'slide';
type Shot = {from: number; to: number; C: React.FC; t?: Trans};

// overlap frames per transition type (incoming starts on the lyric, outgoing lingers)
const OV: Record<Trans, number> = {cut: 0, dissolve: 14, zoom: 10, glitch: 6, blur: 18, leak: 18, flash: 10, slide: 10};

// Song-time shot list (seconds). Chorus shots cut hard on line starts.
const SHOTS: Shot[] = [
  {from: 0, to: 4.0, C: IntroTerminal, t: 'cut'},
  // Verse 1
  {from: 4.0, to: 12.13, C: Shot3am, t: 'blur'},
  {from: 12.13, to: 15.64, C: ShotLogs, t: 'dissolve'},
  {from: 15.64, to: 19.15, C: ShotRace, t: 'zoom'},
  {from: 19.15, to: 22.74, C: ShotMigration, t: 'dissolve'},
  {from: 22.74, to: 26.25, C: ShotTests, t: 'slide'},
  {from: 26.25, to: 29.84, C: ShotResume, t: 'dissolve'},
  {from: 29.84, to: 33.43, C: ShotGreen, t: 'zoom'},
  {from: 33.43, to: 37.18, C: ShotScreen, t: 'leak'},
  // Pre-Chorus 1
  {from: 37.18, to: 47.07, C: ShotTypeQuestion, t: 'blur'},
  // Chorus 1
  {from: 47.07, to: 50.43, C: () => <ShotHeartbreakError v={1} />, t: 'flash'},
  {from: 50.43, to: 53.94, C: ShotNoLine, t: 'glitch'},
  {from: 53.94, to: 57.29, C: ShotTimer, t: 'zoom'},
  {from: 57.29, to: 61.2, C: ShotRevert, t: 'glitch'},
  {from: 61.2, to: 64.63, C: ShotHttp, t: 'zoom'},
  {from: 64.63, to: 68.38, C: ShotSeen, t: 'dissolve'},
  {from: 68.38, to: 71.65, C: ShotTasks, t: 'glitch'},
  {from: 71.65, to: 76.44, C: () => <ShotFinale v={1} />, t: 'flash'},
  // Verse 2
  {from: 76.44, to: 86.89, C: ShotDrafts, t: 'blur'},
  {from: 86.89, to: 90.2, C: ShotSpace, t: 'dissolve'},
  {from: 90.2, to: 93.59, C: ShotPaste, t: 'leak'},
  {from: 93.59, to: 100.69, C: ShotClaudeMd, t: 'dissolve'},
  {from: 100.69, to: 104.36, C: ShotForget, t: 'blur'},
  {from: 104.36, to: 108.4, C: ShotContext, t: 'dissolve'},
  // Pre-Chorus 2
  {from: 108.4, to: 110.35, C: ShotAbsolutelyRight, t: 'blur'},
  {from: 110.35, to: 114.34, C: ShotWrong, t: 'cut'},
  // Chorus 2
  {from: 114.34, to: 117.61, C: () => <ShotHeartbreakError v={2} />, t: 'flash'},
  {from: 117.61, to: 121.04, C: ShotNoLine, t: 'glitch'},
  {from: 121.04, to: 124.47, C: ShotFriday, t: 'zoom'},
  {from: 124.47, to: 128.46, C: ShotSorry, t: 'glitch'},
  {from: 128.46, to: 131.73, C: ShotHttp, t: 'zoom'},
  {from: 131.73, to: 135.48, C: ShotSeen, t: 'dissolve'},
  {from: 135.48, to: 138.75, C: ShotTasks, t: 'glitch'},
  {from: 138.75, to: 144.18, C: () => <ShotFinale v={2} />, t: 'flash'},
  // Bridge
  {from: 144.18, to: 149.6, C: ShotThreads, t: 'blur'},
  {from: 149.6, to: 155.98, C: ShotUnknown, t: 'blur'},
  {from: 155.98, to: 163.64, C: ShotPrompt, t: 'blur'},
  {from: 163.64, to: 167.87, C: ShotHoldsContext, t: 'leak'},
  {from: 167.87, to: 170.67, C: ShotIsYou, t: 'blur'},
  {from: 170.67, to: 171.78, C: ShotCloseTab, t: 'dissolve'},
  {from: 171.78, to: 172.5, C: ShotGo, t: 'cut'},
  // Final chorus
  {from: 172.5, to: 179.28, C: ShotWalk, t: 'flash'},
  {from: 179.28, to: 197.87, C: ShotPhoneFinale, t: 'leak'},
  // Outro
  {from: 197.87, to: 211.2, C: ShotOutro, t: 'blur'},
];

type Bg = {from: number; to: number; render: (t: number) => React.ReactNode};
const img = (name: BgName, blur: number, dim: number) => <ImageBG name={name} blur={blur} dim={dim} from={1.08} to={1.16} />;
const BGS: Bg[] = [
  {from: 4.0, to: 47.07, render: () => img('bg_city_night', 7, 0.42)},
  {from: 47.07, to: 76.44, render: () => img('bg_chorus_warm', 2, 0.32)},
  {from: 76.44, to: 108.4, render: () => (
    <>
      {img('bg_city_rain', 6, 0.42)}
      <Rain opacity={0.22} />
    </>
  )},
  {from: 108.4, to: 114.34, render: () => img('bg_chorus_red', 10, 0.72)},
  {from: 114.34, to: 144.18, render: () => img('bg_chorus_red', 2, 0.35)},
  {from: 144.18, to: 172.5, render: (t) => (
    <>
      {img('bg_bridge_sky', 3, lin(t, 160, 168, 0.35, 0.7))}
      <Void dust={0.6} transparent />
    </>
  )},
  {from: 172.5, to: 211.2, render: () => img('bg_dawn_wide', 4, 0.2)},
];

// Spoken/terminal lines that are not sung but still get bilingual subtitles
const EXTRA: Line[] = [
  {start: 0.4, end: 3.9, en: 'claude, you there? — Always. What are we fixing tonight?', zh: 'claude，你在吗？——一直在。今晚要修什么？'},
  {start: 198.2, end: 201.6, en: "claude, I didn't use your draft.", zh: 'claude，我没用你写的草稿。'},
  {start: 201.6, end: 204.6, en: "Good. Tell me how it goes — …well, you'll have to tell me twice.", zh: '很好。告诉我结果如何——……嗯，你大概得告诉我两遍。', singer: 'f'},
  {start: 204.6, end: 207.6, en: 'Some bugs you fix yourself.', zh: '有些 bug，得你自己修。'},
];
const LINES: Line[] = [...EXTRA, ...(lyrics.lines as Line[])].sort((a, b) => a.start - b.start);

const smooth = (x: number) => interpolate(x, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});

const enterStyle = (t: Trans, p: number, f: number): React.CSSProperties => {
  const e = smooth(p);
  switch (t) {
    case 'zoom':
      return {opacity: e, transform: `scale(${1.25 - 0.25 * e})`, filter: `blur(${(1 - e) * 14}px)`};
    case 'blur':
    case 'leak':
      return {opacity: e, filter: `blur(${(1 - e) * 18}px)`, transform: `scale(${1.04 - 0.04 * e})`};
    case 'slide':
      return {opacity: e, transform: `translateX(${(1 - e) * 260}px)`, filter: `blur(${(1 - e) * 10}px)`};
    case 'glitch': {
      const j = p < 1 ? Math.sin(f * 12.9) * 40 * (1 - p) : 0;
      return {opacity: p < 1 ? (f % 2 ? 0.4 : 1) : 1, transform: `translateX(${j}px)`, filter: p < 1 ? `hue-rotate(${(1 - p) * 90}deg) saturate(${1 + (1 - p) * 2})` : undefined};
    }
    case 'flash':
      return {opacity: e, transform: `scale(${1.08 - 0.08 * e})`};
    case 'dissolve':
      return {opacity: e, transform: `scale(${1.02 - 0.02 * e})`};
    default:
      return {};
  }
};

const exitStyle = (t: Trans, p: number): React.CSSProperties => {
  const e = smooth(p);
  switch (t) {
    case 'zoom':
      return {opacity: 1 - e, transform: `scale(${1 + 0.35 * e})`, filter: `blur(${e * 14}px)`};
    case 'blur':
    case 'leak':
      return {opacity: 1 - e, filter: `blur(${e * 18}px)`};
    case 'slide':
      return {opacity: 1 - e, transform: `translateX(${-e * 260}px)`, filter: `blur(${e * 10}px)`};
    case 'glitch':
      return {opacity: 1 - e};
    default:
      return {opacity: 1 - e};
  }
};

const ShotWrap: React.FC<{shot: Shot; next?: Shot}> = ({shot, next}) => {
  const f = useCurrentFrame();
  const {durationInFrames: d} = useVideoConfig();
  const tin = shot.t ?? 'dissolve';
  const tout = next?.t ?? 'cut';
  const ovIn = OV[tin];
  const ovOut = OV[tout];
  const pin = ovIn ? Math.min(1, f / ovIn) : 1;
  const pout = ovOut ? Math.max(0, (f - (d - ovOut)) / ovOut) : 0;
  const st = pout > 0 ? exitStyle(tout, pout) : pin < 1 ? enterStyle(tin, pin, f) : {};
  // gentle continuous camera drift so no frame is ever fully static
  const drift = 1 + 0.03 * (f / d);
  return (
    <AbsoluteFill style={st}>
      <AbsoluteFill style={{transform: `scale(${drift})`}}>
        <shot.C />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const BgWrap: React.FC<{bg: Bg; start: number}> = ({bg, start}) => {
  const f = useCurrentFrame();
  const {durationInFrames: d} = useVideoConfig();
  const op = smooth(Math.min(1, f / 24, (d - f) / 24));
  return <AbsoluteFill style={{opacity: op}}>{bg.render(start + f / FPS)}</AbsoluteFill>;
};

const inChorus = (t: number) => (t >= 47.07 && t < 76.44) || (t >= 114.34 && t < 144.18) || (t >= 172.5 && t < 197.87);

export const MV: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const beat = inChorus(t) ? pulse(t, {down: true, decay: 0.3}) : 0;
  // white bloom on 'flash' transitions (strongest at the key change)
  const flash = SHOTS.filter((s) => s.t === 'flash').reduce((m, s) => {
    const k = s.from === 172.5 ? 0.85 : 0.45;
    return Math.max(m, Math.max(0, 1 - Math.abs(t - s.from) / 0.3) * k);
  }, 0);
  const leak = SHOTS.filter((s) => s.t === 'leak' || s.t === 'flash').map((s) => (t - (s.from - 0.35)) / 1.1).find((p) => p > 0 && p < 1) ?? 0;
  const warm = lin(t, 172.5, 196, 0.35, 1);
  return (
    <AbsoluteFill style={{background: C.ink}}>
      <Audio src={staticFile('audio/song.wav')} />
      {BGS.map((b) => (
        <Sequence key={b.from} from={sec(b.from) - 6} durationInFrames={sec(b.to) - sec(b.from) + 12} layout="none">
          <BgWrap bg={b} start={b.from - 6 / FPS} />
        </Sequence>
      ))}
      <AbsoluteFill style={{transform: `scale(${1 + beat * 0.015})`}}>
        {SHOTS.map((s, i) => {
          const next = SHOTS[i + 1];
          const extra = next ? OV[next.t ?? 'dissolve'] : 0;
          return (
            <Sequence key={s.from} from={sec(s.from)} durationInFrames={sec(s.to) - sec(s.from) + extra}>
              <ShotWrap shot={s} next={next} />
            </Sequence>
          );
        })}
      </AbsoluteFill>
      <Bokeh opacity={t > 144.18 && t < 172.5 ? 0.35 : 0.55} tint={t > 114.34 && t < 144.18 ? '255,120,120' : '255,190,120'} />
      <ColorGrade warm={warm} />
      <LightLeak p={leak} />
      <Vignette />
      <Grain opacity={0.05} />
      <Flash amount={flash} />
      {t < 208 ? <Subtitles lines={LINES} /> : null}
    </AbsoluteFill>
  );
};
