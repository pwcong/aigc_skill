import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Rain} from './components/Backgrounds';
import {Bokeh, ColorGrade, Flash, Grain, LightLeak, Vignette} from './components/Effects';
import {ImageBG} from './components/Images';
import {Kinetic} from './components/Kinetic';
import {LipShot, VideoBG, VideoShot} from './components/LipShot';
import {Line, Subtitles} from './components/Subtitle';
import lyrics from './data/lyrics.json';
import {lin} from './lib/anim';
import {FPS, sec} from './lib/timing';
import {OV, Trans, enterStyle, exitStyle, smooth} from './lib/transitions';
import {ShotCloseTab, ShotGo, ShotPrompt, ShotUnknown} from './scenes/Bridge';
import {ShotFriday, ShotHttp, ShotNoLine, ShotRevert, ShotSorry, ShotTasks, ShotTimer} from './scenes/Chorus';
import {ShotOutro, ShotPhoneFinale} from './scenes/Final';
import {CheckStamp, DotsBubble, RollbackStamp, TypingBar} from './scenes/Overlays';
import {IntroTerminal, ShotGreen, ShotRace, ShotResume, ShotTests} from './scenes/Verse1';
import {ShotClaudeMd, ShotDrafts, ShotWrong} from './scenes/Verse2';
import {C, F} from './theme';

type Kin = {text: string; color?: string; glow?: string; size?: number; font?: 'display' | 'heavy'; top?: number};
type Shot = {
  from: number;
  to: number;
  t: Trans;
  kind: 'lip' | 'vid' | 'code';
  rig?: string;
  ls?: string; // Dreamina lip-sync clip for this shot (played at 1x from the shot start)
  clip?: string;
  C?: React.FC;
  skip?: number; // frames to skip into a code shot's own timeline
  kin?: Kin;
  overlay?: React.FC;
  energetic?: boolean;
  push?: number;
  zoom?: number;
  focus?: [number, number];
  flip?: boolean;
};

// true: singing shots use the Dreamina lip-sync videos; false: local mouth-swap rigs
const USE_LS_VIDEO = true;

const RED = '#FF4D5E';
const BLUE = '#5B9BFF';

// Every cut sits on an aligned lyric start (= a downbeat); chorus lines cut every two bars.
const SHOTS: Shot[] = [
  {from: 0, to: 4.2, t: 'cut', kind: 'code', C: IntroTerminal},
  {from: 4.2, to: 8.62, t: 'blur', kind: 'vid', clip: 'v_intro_desk'},
  // Verse 1 — Claude fixes everything
  {from: 8.62, to: 11.94, t: 'flash', kind: 'lip', ls: 'ls_01_desk_red', rig: 'm_desk_red'},
  {from: 11.94, to: 15.4, t: 'dissolve', kind: 'vid', clip: 'v_c_holo_logs'},
  {from: 15.4, to: 19.2, t: 'zoom', kind: 'code', C: ShotRace},
  {from: 19.2, to: 22.34, t: 'dissolve', kind: 'vid', clip: 'v_c_rewind', overlay: RollbackStamp},
  {from: 22.34, to: 25.56, t: 'slide', kind: 'code', C: ShotTests},
  {from: 25.56, to: 29.54, t: 'dissolve', kind: 'code', C: ShotResume},
  {from: 29.54, to: 32.92, t: 'zoom', kind: 'code', C: ShotGreen},
  {from: 32.92, to: 36.54, t: 'leak', kind: 'vid', clip: 'v_screen_glass'},
  // Pre-chorus 1
  {from: 36.54, to: 40.14, t: 'blur', kind: 'vid', clip: 'v_m_typing', overlay: TypingBar},
  {from: 40.14, to: 46.4, t: 'dissolve', kind: 'lip', ls: 'ls_02_screen_blue', rig: 'm_screen_blue', push: 0.1},
  // Chorus 1
  {from: 46.4, to: 50.1, t: 'flash', kind: 'lip', ls: 'ls_03_rooftop', rig: 'test_m', energetic: true, kin: {text: 'NO STACK TRACE'}},
  {from: 50.1, to: 53.46, t: 'glitch', kind: 'code', C: ShotNoLine},
  {from: 53.46, to: 56.92, t: 'zoom', kind: 'code', C: ShotTimer},
  {from: 56.92, to: 60.9, t: 'glitch', kind: 'code', C: ShotRevert},
  {from: 60.9, to: 64.26, t: 'zoom', kind: 'lip', ls: 'ls_04_rooftop', rig: 'test_m', energetic: true, zoom: 1.15, focus: [0.47, 0.2], kin: {text: '200 OK', size: 150}},
  {from: 64.26, to: 67.98, t: 'dissolve', kind: 'vid', clip: 'v_m_phone_seen', kin: {text: 'Seen 11:40', font: 'display', glow: BLUE, size: 120}},
  {from: 67.98, to: 71.36, t: 'glitch', kind: 'code', C: ShotTasks},
  {from: 71.36, to: 75.6, t: 'flash', kind: 'lip', ls: 'ls_05_rooftop', rig: 'test_m', energetic: true, push: 0.12, kin: {text: 'FOR A HEART', size: 130}},
  {from: 75.6, to: 79.16, t: 'blur', kind: 'vid', clip: 'v_city_night'},
  // Verse 2
  {from: 79.16, to: 83.04, t: 'blur', kind: 'vid', clip: 'v_c_drafts'},
  {from: 83.04, to: 86.76, t: 'dissolve', kind: 'code', C: ShotDrafts, skip: 190},
  {from: 86.76, to: 90.04, t: 'dissolve', kind: 'lip', ls: 'ls_06_rain', rig: 'm_rain_window'},
  {from: 90.04, to: 93.24, t: 'leak', kind: 'lip', ls: 'ls_07_c_clipboard', rig: 'c_clipboard'},
  {from: 93.24, to: 100.4, t: 'dissolve', kind: 'code', C: ShotClaudeMd},
  {from: 100.4, to: 104.08, t: 'blur', kind: 'vid', clip: 'v_c_dissolve'},
  {from: 104.08, to: 107.74, t: 'dissolve', kind: 'lip', ls: 'ls_08_rain', rig: 'm_rain_window', zoom: 1.15, focus: [0.58, 0.2]},
  // Pre-chorus 2
  {from: 107.74, to: 109.96, t: 'blur', kind: 'lip', ls: 'ls_09_c_smile', rig: 'c_smile', overlay: CheckStamp},
  {from: 109.96, to: 114.12, t: 'cut', kind: 'code', C: ShotWrong},
  // Chorus 2
  {from: 114.12, to: 117.14, t: 'flash', kind: 'lip', ls: 'ls_10_storm', rig: 'm_rooftop_storm', energetic: true, kin: {text: 'NO STACK TRACE', glow: RED}},
  {from: 117.14, to: 120.64, t: 'glitch', kind: 'vid', clip: 'v_backtoback'},
  {from: 120.64, to: 124.16, t: 'zoom', kind: 'code', C: ShotFriday},
  {from: 124.16, to: 127.0, t: 'glitch', kind: 'code', C: ShotSorry},
  {from: 127.0, to: 129.52, t: 'zoom', kind: 'lip', ls: 'ls_11_storm', rig: 'm_rooftop_storm', energetic: true, zoom: 1.15, focus: [0.46, 0.2]},
  {from: 129.52, to: 131.4, t: 'glitch', kind: 'code', C: ShotHttp},
  {from: 131.4, to: 135.08, t: 'dissolve', kind: 'vid', clip: 'v_m_phone_seen', flip: true, kin: {text: 'Seen 11:40', font: 'display', glow: BLUE, size: 120}},
  {from: 135.08, to: 138.42, t: 'glitch', kind: 'code', C: ShotTasks},
  {from: 138.42, to: 143.88, t: 'flash', kind: 'lip', ls: 'ls_12_storm', rig: 'm_rooftop_storm', energetic: true, push: 0.14, kin: {text: 'FOR A HEART', glow: RED}},
  // Bridge — Claude
  {from: 143.88, to: 149.06, t: 'blur', kind: 'lip', ls: 'ls_13_c_clouds', rig: 'c_clouds'},
  {from: 149.06, to: 152.8, t: 'blur', kind: 'code', C: ShotUnknown},
  {from: 152.8, to: 156.5, t: 'dissolve', kind: 'lip', ls: 'ls_14_c_clouds', rig: 'c_clouds', zoom: 1.15, focus: [0.5, 0.25]},
  {from: 156.5, to: 160.6, t: 'blur', kind: 'lip', ls: 'ls_15_c_tear', rig: 'c_close_tear', push: 0.08},
  {from: 160.6, to: 163.0, t: 'blur', kind: 'code', C: ShotPrompt, skip: 60},
  {from: 163.0, to: 167.2, t: 'leak', kind: 'vid', clip: 'v_c_turn'},
  {from: 167.2, to: 170.1, t: 'blur', kind: 'vid', clip: 'v_m_tear'},
  {from: 170.1, to: 171.54, t: 'dissolve', kind: 'code', C: ShotCloseTab},
  {from: 171.54, to: 171.92, t: 'cut', kind: 'code', C: ShotGo},
  // Final chorus — dawn
  {from: 171.92, to: 175.3, t: 'flash', kind: 'vid', clip: 'v_m_run_dawn'},
  {from: 175.3, to: 178.94, t: 'dissolve', kind: 'lip', ls: 'ls_16_dawn', rig: 'm_dawn', energetic: true},
  {from: 178.94, to: 182.2, t: 'leak', kind: 'code', C: ShotPhoneFinale},
  {from: 182.2, to: 186.14, t: 'dissolve', kind: 'lip', ls: 'ls_17_dawn', rig: 'm_dawn', energetic: true, zoom: 1.15, focus: [0.36, 0.22]},
  {from: 186.14, to: 192.7, t: 'dissolve', kind: 'code', C: ShotPhoneFinale, skip: 218},
  {from: 192.7, to: 199.74, t: 'leak', kind: 'vid', clip: 'v_m_smile_phone', overlay: DotsBubble},
  // Outro
  {from: 199.74, to: 211.2, t: 'blur', kind: 'code', C: ShotOutro},
];

type Bg = {from: number; to: number; render: () => React.ReactNode};
const BGS: Bg[] = [
  {from: 4.0, to: 46.4, render: () => <VideoBG clip="v_city_night" blur={6} dim={0.45} />},
  {from: 46.4, to: 79.16, render: () => <VideoBG clip="v_chorus_warm" blur={2} dim={0.3} />},
  {from: 79.16, to: 107.74, render: () => (
    <>
      <ImageBG name="bg_city_rain" blur={6} dim={0.42} from={1.08} to={1.16} />
      <Rain opacity={0.22} />
    </>
  )},
  {from: 107.74, to: 114.12, render: () => <VideoBG clip="v_chorus_red" blur={8} dim={0.7} />},
  {from: 114.12, to: 143.88, render: () => <VideoBG clip="v_chorus_red" blur={2} dim={0.35} />},
  {from: 143.88, to: 171.92, render: () => <VideoBG clip="v_bridge_sky" blur={3} dim={0.4} />},
  {from: 171.92, to: 211.2, render: () => <VideoBG clip="v_dawn_city" blur={4} dim={0.2} />},
];

const EXTRA: Line[] = [
  {start: 0.4, end: 4.0, en: 'claude, you there? — Always. What are we fixing tonight?', zh: 'claude，你在吗？——一直在。今晚要修什么？'},
  {start: 200.1, end: 203.4, en: "claude, I didn't use your draft.", zh: 'claude，我没用你写的草稿。'},
  {start: 203.4, end: 206.4, en: "Good. Tell me how it goes — …well, you'll have to tell me twice.", zh: '很好。告诉我结果如何——……嗯，你大概得告诉我两遍。', singer: 'f'},
  {start: 206.4, end: 207.8, en: 'Some bugs you fix yourself.', zh: '有些 bug，得你自己修。'},
];
const LINES: Line[] = [...EXTRA, ...(lyrics.lines as Line[])].sort((a, b) => a.start - b.start);

const ShotBody: React.FC<{s: Shot}> = ({s}) => {
  if (s.kind === 'lip' && USE_LS_VIDEO && s.ls) return <VideoShot clip={s.ls} clipDur={Math.max(4, Math.ceil(s.to - s.from))} minRate={1} zoom={s.zoom ?? 1.03} push={s.push ?? 0.04} />;
  if (s.kind === 'lip' && s.rig) return <LipShot rig={s.rig} start={s.from} energetic={s.energetic} push={s.push} zoom={s.zoom} focus={s.focus} />;
  if (s.kind === 'vid' && s.clip) return <VideoShot clip={s.clip} flip={s.flip} />;
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


export const MV3: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const flash = SHOTS.filter((s) => s.t === 'flash').reduce((m, s) => Math.max(m, Math.max(0, 1 - Math.abs(t - s.from) / 0.3) * (s.from === 171.92 ? 0.85 : 0.45)), 0);
  const leak = SHOTS.filter((s) => s.t === 'leak' || s.t === 'flash').map((s) => (t - (s.from - 0.3)) / 1.0).find((p) => p > 0 && p < 1) ?? 0;
  const warm = lin(t, 171.92, 196, 0.35, 1);
  return (
    <AbsoluteFill style={{background: C.ink}}>
      <Audio src={staticFile('audio/song.wav')} />
      {BGS.map((b) => (
        <Sequence key={b.from} from={sec(b.from) - 12} durationInFrames={sec(b.to) - sec(b.from) + 24} layout="none">
          <BgWrap bg={b} />
        </Sequence>
      ))}
      <AbsoluteFill>
        {SHOTS.map((s, i) => {
          const next = SHOTS[i + 1];
          return (
            <Sequence key={`${s.from}`} from={sec(s.from)} durationInFrames={sec(s.to) - sec(s.from) + (next ? OV[next.t] : 0)}>
              <ShotWrap s={s} next={next} />
            </Sequence>
          );
        })}
      </AbsoluteFill>
      <Bokeh opacity={t > 143.88 && t < 171.92 ? 0.3 : 0.45} tint={t > 114.12 && t < 143.88 ? '255,120,120' : '255,190,120'} />
      <ColorGrade warm={warm} />
      <LightLeak p={leak} />
      <Vignette />
      <Grain opacity={0.045} />
      <Flash amount={flash} />
      {t < 207.8 ? <Subtitles lines={LINES} /> : null}
    </AbsoluteFill>
  );
};
