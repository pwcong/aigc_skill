import {AbsoluteFill, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Character} from '../components/Character';
import {ImageBG, Pose} from '../components/Images';
import {VideoShot} from '../components/LipShot';
import {Bubble} from '../components/Phone';
import {Stamp} from '../components/Stamp';
import {Window} from '../components/Window';
import {blink, ease, lin, typed} from '../lib/anim';
import {C, F} from '../theme';

const DRAFTS = [
  "Hey, I've been thinking about what you said…",
  'I know things got weird. I hate that.',
  'No pressure at all, but…',
  'I miss talking to you. Like, a lot.',
  'Can we start over? Coffee on me.',
  'I was wrong about the other night.',
  'Oat milk, no sugar — still your order?',
];

// 76.44 – 86.89: seven drafts fan out, then stack
export const ShotDrafts: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const stack = ease(f, 255, 295);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 360, top: 90, width: 1200, padding: '22px 34px', borderRadius: 40, background: 'rgba(20,26,42,0.92)', border: `1px solid ${C.line}`, fontFamily: F.sans, fontSize: 30, color: C.text}}>
        {typed('write her a message. something smooth, something kind.', f, 6, 1.1)}
        {f < 60 && blink(f) ? <span style={{color: C.orange}}>▍</span> : null}
      </div>
      {DRAFTS.map((d, i) => {
        const at = 60 + i * 16;
        const s = spring({frame: f - at, fps, config: {damping: 14}});
        const angle = (i - 3) * 9;
        const fx = 960 + (i - 3) * 190;
        const fy = 300 + Math.abs(i - 3) * 26;
        const x = fx + (960 - fx) * stack;
        const y = fy + (300 - fy) * stack - i * 4 * stack;
        const hl = f > 205 + i * 7 && f < 205 + i * 7 + 12;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x - 150,
              top: y + (1 - s) * 400,
              width: 300,
              height: 380,
              borderRadius: 18,
              background: '#151B2B',
              border: `2px solid ${hl ? C.orange : C.line}`,
              boxShadow: hl ? `0 0 40px ${C.orange}88` : '0 20px 50px rgba(0,0,0,0.5)',
              transform: `rotate(${angle * (1 - stack)}deg)`,
              opacity: s,
              padding: 24,
              fontFamily: F.sans,
            }}
          >
            <div style={{fontFamily: F.mono, fontSize: 20, color: C.orange}}>Draft {i + 1}</div>
            <div style={{fontSize: 26, color: C.text, marginTop: 16, lineHeight: 1.4}}>{d}</div>
          </div>
        );
      })}
      <Stamp text="7 DRAFTS" color={C.orange} at={296} x={960} y={760} rotate={-5} size={52} />
    </AbsoluteFill>
  );
};

// 86.89 – 90.20: "I just need some space" — the space around it grows
export const ShotSpace: React.FC = () => {
  const f = useCurrentFrame();
  const z = lin(f, 0, 99, 1.6, 0.55);
  return (
    <AbsoluteFill style={{background: '#04050A', justifyContent: 'center', alignItems: 'center'}}>
      <div style={{transform: `scale(${z})`, marginTop: -80}}>
        <Bubble style={{fontSize: 38, padding: '20px 34px', background: C.blue, maxWidth: 700}}>I just need some space</Bubble>
      </div>
    </AbsoluteFill>
  );
};

// 90.20 – 93.59: (I can't read her heart — only what you paste)
export const ShotPaste: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Pose name="c_clipboard" height={880} x={560} bottom={130} float={5} style={{opacity: ease(f, 0, 10)}} />
      <Window title="pasted context" x={1000} y={170} w={760} h={560} accent={C.orange} bodyStyle={{fontSize: 28}}>
        <div style={{background: 'rgba(91,155,255,0.18)', borderLeft: `4px solid ${C.blue}`, padding: '10px 16px', color: C.blueSoft}}>&quot;I just need some space&quot;</div>
        <div style={{marginTop: 24, height: 300, border: `2px dashed ${C.line}`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4A5670'}}>
          {f > 30 ? '(nothing else)' : ''}
        </div>
      </Window>
    </AbsoluteFill>
  );
};

// 93.59 – 100.69: CLAUDE.md with her details
export const ShotClaudeMd: React.FC = () => {
  const f = useCurrentFrame();
  const lines: [string, number, string][] = [
    ['# CLAUDE.md', 0, C.dim],
    ['## Her', 18, C.orange],
    ['- oat milk, no sugar', 105, C.text],
    ['- hates the rain', 141, C.text],
    ['- favorite color: blue', 177, C.blueSoft],
  ];
  const blueT = ease(f, 177, 200);
  return (
    <AbsoluteFill>
      <VideoShot clip="v_rain_window" zoom={1.14} />
      <AbsoluteFill style={{background: '#000', opacity: 0.4}} />
      <AbsoluteFill style={{background: C.blue, opacity: 0.12 * blueT, mixBlendMode: 'screen'}} />
      <Window title="~/.claude/CLAUDE.md" x={260} y={120} w={900} h={620} bodyStyle={{fontSize: 36, lineHeight: 1.7}}>
        {lines.map(([t, at, c], i) => (
          <div key={i} style={{color: c}}>
            {typed(t, f, at, 0.9)}
            {f >= at && f < at + t.length / 0.9 + 10 && blink(f) ? '▍' : ''}
          </div>
        ))}
      </Window>
      {/* item icons */}
      <div style={{position: 'absolute', left: 1300, top: 170, fontSize: 120, opacity: ease(f, 108, 120), transform: `translateY(${ease(f, 108, 125, 30, 0)}px)`}}>☕</div>
      <div style={{position: 'absolute', left: 1500, top: 330, fontSize: 120, opacity: ease(f, 144, 156), transform: `translateY(${ease(f, 144, 160, 30, 0)}px)`}}>☔</div>
      <div style={{position: 'absolute', left: 1330, top: 500, width: 150, height: 150, borderRadius: 30, background: C.blue, boxShadow: `0 0 60px ${C.blue}`, opacity: ease(f, 180, 192)}} />
    </AbsoluteFill>
  );
};

// 100.69 – 104.36: every session you forget — Claude resets, he stays
export const ShotForget: React.FC = () => {
  const f = useCurrentFrame();
  const wipe = ease(f, 22, 46);
  const gone = f > 34 && f < 58;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 960, top: 0, width: 2, height: 1080, background: C.line}} />
      <Character who="user" view="front" height={760} x={480} bottom={160} />
      <Character who="claude" view="front" height={760} x={1440} bottom={160} float={4} opacity={gone ? 0.08 : f >= 58 ? ease(f, 58, 70) : 1} blur={gone ? 6 : 0} />
      <div style={{position: 'absolute', left: 960, top: 0, width: 960 * wipe, height: 1080, background: 'linear-gradient(90deg, rgba(232,130,63,0) 0%, rgba(232,130,63,0.25) 90%, rgba(255,255,255,0.8) 100%)', opacity: wipe < 1 ? 1 : 0}} />
      <div style={{position: 'absolute', left: 1040, top: 110, fontFamily: F.mono, fontSize: 30, color: C.orange, opacity: ease(f, 20, 28) * (f < 60 ? 1 : 0.4)}}>● new session · context: 0 tokens</div>
      <div style={{position: 'absolute', left: 1200, top: 200, opacity: ease(f, 70, 80)}}>
        <Bubble style={{background: '#2A2230', border: `1px solid ${C.orange}`, fontSize: 28}}>Hi! How can I help you today?</Bubble>
      </div>
      <div style={{position: 'absolute', left: 150, top: 110, fontFamily: F.mono, fontSize: 30, color: C.blueSoft}}>● context: everything</div>
    </AbsoluteFill>
  );
};

const MEMORIES = ['oat milk, no sugar', "Tue 9:12pm  'haha ok'", 'her playlist: rainy day', 'favorite color: blue', 'Seen 11:40', 'first coffee · Mar 3', 'she laughed at the cat video', 'hates the rain'];
// 104.36 – 108.40: the context of ordinary days piles up around him
export const ShotContext: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Pose name="m_phone_down" height={860} x={960} bottom={0} />
      {MEMORIES.map((m, i) => {
        const ang = (i / MEMORIES.length) * Math.PI * 2 + f / 120;
        const r = lin(f, i * 6, i * 6 + 50, 1100, 380 + (i % 3) * 50);
        const x = 960 + Math.cos(ang) * r * 1.3;
        const y = 420 + Math.sin(ang) * r * 0.55;
        return (
          <div
            key={m}
            style={{
              position: 'absolute',
              left: x - 150,
              top: y - 30,
              padding: '10px 18px',
              borderRadius: 10,
              background: i % 2 ? 'rgba(255,196,107,0.92)' : 'rgba(20,26,42,0.92)',
              color: i % 2 ? '#2A2010' : C.blueSoft,
              fontFamily: i % 2 ? F.sans : F.mono,
              fontSize: 24,
              transform: `rotate(${(random(`mr${i}`) - 0.5) * 12}deg)`,
              border: i % 2 ? undefined : `1px solid ${C.line}`,
              whiteSpace: 'nowrap',
            }}
          >
            {m}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// 108.40 – 110.35: (You're absolutely right)
export const ShotAbsolutelyRight: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f, fps, config: {damping: 12}});
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div style={{transform: `scale(${s})`, marginTop: -100, padding: '34px 60px', borderRadius: 40, background: '#2A2230', border: `2px solid ${C.orange}`, fontFamily: F.serif, fontSize: 76, color: C.orangeSoft, boxShadow: `0 0 60px ${C.orange}55`}}>
        You&apos;re absolutely right!
      </div>
      <Stamp text="✓" color={C.green} at={20} x={1500} y={330} size={90} rotate={10} />
    </AbsoluteFill>
  );
};

// 110.35 – 114.34: …but I was wrong — the bubble cracks
export const ShotWrong: React.FC = () => {
  const f = useCurrentFrame();
  const split = ease(f, 0, 24, 0, 1);
  const glitch = f < 20 ? Math.sin(f * 7) * 12 : 0;
  const half = (side: -1 | 1) => (
    <div
      style={{
        position: 'absolute',
        left: 960 - 520,
        top: 340,
        width: 1040,
        padding: '34px 60px',
        borderRadius: 40,
        background: '#2A2230',
        border: `2px solid ${C.orange}`,
        fontFamily: F.serif,
        fontSize: 76,
        color: C.orangeSoft,
        textAlign: 'center',
        clipPath: side < 0 ? 'polygon(0 0, 52% 0, 46% 100%, 0 100%)' : 'polygon(52% 0, 100% 0, 100% 100%, 46% 100%)',
        transform: `translate(${side * split * 140 + glitch}px, ${split * split * 500}px) rotate(${side * split * 14}deg)`,
        opacity: 1 - split * 0.7,
      }}
    >
      You&apos;re absolutely right!
    </div>
  );
  return (
    <AbsoluteFill>
      {half(-1)}
      {half(1)}
      <div style={{position: 'absolute', width: 1920, top: 430, textAlign: 'center', fontFamily: F.heavy, fontWeight: 800, fontSize: 130, letterSpacing: 6, color: C.red, opacity: ease(f, 10, 22), textShadow: `${glitch}px 0 0 ${C.blue}, ${-glitch}px 0 0 ${C.orange}`}}>
        BUT I WAS WRONG
      </div>
    </AbsoluteFill>
  );
};
