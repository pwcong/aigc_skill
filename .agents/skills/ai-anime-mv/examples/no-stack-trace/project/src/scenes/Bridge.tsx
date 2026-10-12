import {useMemo} from 'react';
import {AbsoluteFill, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {Character} from '../components/Character';
import {ImageBG, Pose} from '../components/Images';
import {ease, lin, typed} from '../lib/anim';
import {C, F} from '../theme';

// 144.18 – 149.60: a thousand tangled threads, straightened
export const ShotThreads: React.FC = () => {
  const f = useCurrentFrame();
  const untangle = ease(f, 40, 150);
  const threads = useMemo(
    () =>
      new Array(46).fill(0).map((_, i) => ({
        y: 140 + i * 14,
        c1: [random(`a${i}`) * 1920, random(`b${i}`) * 1080],
        c2: [random(`c${i}`) * 1920, random(`d${i}`) * 1080],
        y0: random(`e${i}`) * 1080,
        y1: random(`g${i}`) * 1080,
      })),
    [],
  );
  const mix = (a: number, b: number) => a + (b - a) * untangle;
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        {threads.map((t, i) => (
          <path
            key={i}
            d={`M 0 ${mix(t.y0, t.y)} C ${mix(t.c1[0], 640)} ${mix(t.c1[1], t.y)}, ${mix(t.c2[0], 1280)} ${mix(t.c2[1], t.y)}, 1920 ${mix(t.y1, t.y)}`}
            stroke={i % 5 === 0 ? C.gold : C.orange}
            strokeOpacity={0.35 + 0.3 * untangle}
            strokeWidth={1.6}
            fill="none"
          />
        ))}
      </svg>
      <Pose name="c_threads" height={900} x={1300} bottom={100} float={5} style={{opacity: ease(f, 0, 14)}} />
    </AbsoluteFill>
  );
};

// 149.60 – 155.98: the way she laughs / what she meant by "yes" — unknown
export const ShotUnknown: React.FC = () => {
  const f = useCurrentFrame();
  const qs = useMemo(() => new Array(14).fill(0).map((_, i) => ({x: 760 + random(`qx${i}`) * 400, y: 200 + random(`qy${i}`) * 560, s: 30 + random(`qs${i}`) * 50, p: random(`qp${i}`) * 6})), []);
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        <defs>
          <filter id="static">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" seed={f % 8} />
            <feColorMatrix values="0 0 0 0 0.36  0 0 0 0 0.6  0 0 0 0 1  0 0 0 0.55 0" />
          </filter>
          <clipPath id="her">
            <circle cx={960} cy={330} r={120} />
            <path d="M 700 820 C 700 600, 800 500, 960 500 C 1120 500, 1220 600, 1220 820 Z" />
          </clipPath>
        </defs>
        <rect width={1920} height={1080} filter="url(#static)" clipPath="url(#her)" opacity={0.5} />
        <circle cx={960} cy={330} r={120} fill="none" stroke={C.blue} strokeWidth={4} strokeDasharray="14 12" opacity={0.9} />
        <path d="M 700 820 C 700 600, 800 500, 960 500 C 1120 500, 1220 600, 1220 820" fill="none" stroke={C.blue} strokeWidth={4} strokeDasharray="14 12" opacity={0.9} />
      </svg>
      {qs.map((q, i) => (
        <div key={i} style={{position: 'absolute', left: q.x, top: q.y - ((f * 0.6 + i * 20) % 80), fontFamily: F.serif, fontSize: q.s, color: C.blueSoft, opacity: 0.25 + 0.3 * Math.sin(f / 15 + q.p)}}>
          ?
        </div>
      ))}
      <div style={{position: 'absolute', left: 1320, top: 330, fontFamily: F.mono, fontSize: 30, color: C.dim, lineHeight: 1.8, opacity: ease(f, 20, 34)}}>
        <div>her.laugh → <span style={{color: C.red}}>undefined</span></div>
        <div style={{opacity: ease(f, 90, 104)}}>meaning(&quot;yes&quot;) → <span style={{color: C.red}}>???</span></div>
      </div>
    </AbsoluteFill>
  );
};

// 155.98 – 163.64: no prompt can make them true — the prompt dissolves
export const ShotPrompt: React.FC = () => {
  const f = useCurrentFrame();
  const text = 'make her feel the same way';
  const shown = typed(text, f, 8, 0.6);
  const breakAt = 90;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 360, top: 400, width: 1200, height: 110, borderRadius: 55, background: 'rgba(20,26,42,0.92)', border: `1px solid ${C.line}`, opacity: lin(f, 180, 220, 1, 0.25)}} />
      <div style={{position: 'absolute', left: 410, top: 432, display: 'flex', fontFamily: F.sans, fontSize: 40, color: C.text}}>
        {shown.split('').map((ch, i) => {
          const t = Math.max(0, f - breakAt - i * 2);
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                whiteSpace: 'pre',
                transform: `translate(${(random(`px${i}`) - 0.5) * t * 4}px, ${-t * (1.5 + random(`py${i}`) * 2)}px) rotate(${(random(`pr${i}`) - 0.5) * t * 6}deg)`,
                opacity: Math.max(0, 1 - t / 60),
                color: t > 0 ? C.orangeSoft : C.text,
                filter: t > 0 ? `blur(${t / 20}px)` : undefined,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: 410, top: 560, fontFamily: F.mono, fontSize: 28, color: C.orange, opacity: ease(f, 130, 145)}}>● I can&apos;t do this one for you.</div>
    </AbsoluteFill>
  );
};

// 163.64 – 167.87: the only one who holds the context — light flows from her to him
export const ShotHoldsContext: React.FC = () => {
  const f = useCurrentFrame();
  const motes = useMemo(() => new Array(40).fill(0).map((_, i) => ({o: random(`fo${i}`), a: random(`fa${i}`) * 80 - 40})), []);
  return (
    <AbsoluteFill>
      {motes.map((m, i) => {
        const p = ((f / 70 + m.o) % 1);
        const x = 1380 - p * 900;
        const y = 520 + Math.sin(p * Math.PI) * -120 + m.a;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: 8, height: 8, borderRadius: 4, background: C.gold, boxShadow: `0 0 12px ${C.orange}`, opacity: Math.sin(p * Math.PI) * ease(f, 10, 30)}} />;
      })}
      <Character who="user" view="side" height={780} x={420} bottom={150} flip />
      <Pose name="c_turn_back" height={820} x={1480} bottom={140} float={4} style={{opacity: lin(f, 90, 127, 1, 0.55)}} />
    </AbsoluteFill>
  );
};

// 167.87 – 170.67: "is you"
export const ShotIsYou: React.FC = () => <ImageBG name="m_face_screen" from={1.0} to={1.12} origin="45% 40%" />;

// 170.67 – 171.78: so I closed the tab
export const ShotCloseTab: React.FC = () => {
  const f = useCurrentFrame();
  const {durationInFrames: d} = useVideoConfig();
  const closed = f > 18;
  const cx = ease(f, 0, 16, 1100, 742);
  const cy = ease(f, 0, 16, 600, 262);
  return (
    <AbsoluteFill style={{opacity: lin(f, d - 8, d, 1, 0)}}>
      <div style={{position: 'absolute', left: 260, top: 220, width: 1400, height: 620, borderRadius: 16, background: closed ? '#0A0C12' : '#141A28', border: `1px solid ${C.line}`, overflow: 'hidden'}}>
        <div style={{height: 70, background: '#0E121C', display: 'flex', alignItems: 'flex-end', padding: '0 16px'}}>
          {!closed ? (
            <div style={{width: 300, height: 52, borderRadius: '12px 12px 0 0', background: '#141A28', display: 'flex', alignItems: 'center', padding: '0 18px', gap: 12, fontFamily: F.sans, fontSize: 22, color: C.text}}>
              <div style={{width: 18, height: 18, borderRadius: 9, background: C.orange}} />
              Claude
              <span style={{marginLeft: 'auto', color: C.dim}}>✕</span>
            </div>
          ) : null}
        </div>
      </div>
      <svg width={40} height={40} style={{position: 'absolute', left: cx, top: cy}}>
        <path d="M2 2 L2 30 L10 22 L16 36 L22 33 L16 20 L28 20 Z" fill="#fff" stroke="#000" strokeWidth={1.5} />
      </svg>
    </AbsoluteFill>
  );
};

// 171.78 – 172.50: (Go.)
export const ShotGo: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#000', justifyContent: 'center', alignItems: 'center'}}>
      <div style={{fontFamily: F.serif, fontSize: 160, color: C.orange, opacity: ease(f, 0, 6), textShadow: `0 0 60px ${C.orange}`, marginTop: -80}}>Go.</div>
    </AbsoluteFill>
  );
};
