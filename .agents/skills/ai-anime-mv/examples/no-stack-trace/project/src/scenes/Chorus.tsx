import {useMemo} from 'react';
import {AbsoluteFill, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {Character} from '../components/Character';
import {ImageBG, Pose} from '../components/Images';
import {Bubble, Phone, Receipt} from '../components/Phone';
import {Window} from '../components/Window';
import {blink, ease, lin, typeScript, typed} from '../lib/anim';
import {C, F} from '../theme';

const shake = (f: number, amt: number) => ({x: Math.sin(f * 1.9) * amt, y: Math.cos(f * 2.3) * amt});

// ---------- Pre-Chorus 1: "So I typed the thing I never dared to say" ----------
export const ShotTypeQuestion: React.FC = () => {
  const f = useCurrentFrame();
  const text = typeScript(
    [
      {pause: 18},
      {type: 'hey, quick question', cpf: 0.55},
      {pause: 22},
      {del: 19, cpf: 1.6},
      {pause: 14},
      {type: 'She stopped replying Tuesday.', cpf: 0.5},
      {pause: 16},
      {type: ' Can you make it go away?', cpf: 0.5},
    ],
    f,
  );
  const sent = f > 262;
  const fly = ease(f, 262, 285);
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  return (
    <AbsoluteFill>
      <ImageBG name="bg_monitor_close" dim={0.55} from={1.05} to={1.12} />
      <div style={{position: 'absolute', right: 120, top: 110, display: 'flex', gap: 14, opacity: ease(f, 10, 30)}}>
        {days.map((d, i) => (
          <div key={d} style={{width: 92, textAlign: 'center', fontFamily: F.mono}}>
            <div style={{fontSize: 20, color: C.dim}}>{d}</div>
            <div
              style={{
                marginTop: 10,
                height: 80,
                borderRadius: 14,
                border: `2px solid ${i === 1 ? C.blue : C.line}`,
                boxShadow: i === 1 ? `0 0 26px ${C.blue}88` : undefined,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                color: i === 1 ? C.blueSoft : C.dim,
              }}
            >
              {i === 1 ? 'last msg' : i > 1 && i <= 5 ? '—' : ''}
            </div>
          </div>
        ))}
      </div>
      <Character who="user" view="back" height={1150} x={330} bottom={-560} opacity={0.95} />
      {sent ? (
        <div style={{position: 'absolute', right: 300, top: 560 - fly * 220, opacity: 1 - fly * 0.2}}>
          <Bubble me style={{maxWidth: 700, fontSize: 30, background: '#2A3346'}}>She stopped replying Tuesday. Can you make it go away?</Bubble>
        </div>
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: 560,
          top: 760,
          width: 1200,
          height: 104,
          borderRadius: 52,
          background: 'rgba(20,26,42,0.92)',
          border: `1px solid ${C.line}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 40px',
          fontFamily: F.sans,
          fontSize: 32,
          color: C.text,
          boxShadow: `0 0 60px ${C.orange}22`,
        }}
      >
        {sent ? <span style={{color: C.dim}}>Message Claude…</span> : text ? text : <span style={{color: C.dim}}>Message Claude…</span>}
        {!sent && blink(f) ? <span style={{color: C.orange}}>▍</span> : null}
        <div style={{marginLeft: 'auto', width: 56, height: 56, borderRadius: 28, background: f > 255 && f < 268 ? C.orangeSoft : C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 30}}>↑</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Chorus shots ----------
export const ShotHeartbreakError: React.FC<{v?: 1 | 2}> = ({v = 1}) => {
  const f = useCurrentFrame();
  const s = shake(f, f < 10 ? 10 - f : 0);
  return (
    <AbsoluteFill style={{transform: `translate(${s.x}px, ${s.y}px)`}}>
      <Window title="console" x={210} y={150} w={1500} accent={C.red} bodyStyle={{fontSize: 34}}>
        <div style={{color: C.red, fontWeight: 700}}>Uncaught HeartbreakError: {v === 1 ? 'she stopped replying' : 'still no reply'}</div>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{color: C.dim, paddingLeft: 60, opacity: f > 8 + i * 6 ? (i === 3 && blink(f, 16) ? 0.3 : 1) : 0}}>
            at ??? (unknown:?:?)
          </div>
        ))}
        <div style={{marginTop: 20, color: C.gold, opacity: ease(f, 40, 50)}}>⚠ stack trace unavailable</div>
      </Window>
    </AbsoluteFill>
  );
};

const LOVE_CODE = [
  'function us(you, me) {',
  "  const said = remember('that night');",
  '  const meant = feelings.get(me);',
  '  if (said !== meant) {',
  '    // TODO: figure this out',
  '  }',
  '  return await reply(you); // pending…',
  '}',
];
export const ShotNoLine: React.FC = () => {
  const f = useCurrentFrame();
  const scan = lin(f, 6, 80, 0, LOVE_CODE.length);
  return (
    <AbsoluteFill>
      <Window title="us.ts" x={260} y={130} w={1400} bodyStyle={{fontSize: 32, padding: '20px 0'}}>
        {LOVE_CODE.map((l, i) => (
          <div key={i} style={{display: 'flex', position: 'relative', height: 54, alignItems: 'center'}}>
            <div style={{width: 90, textAlign: 'right', paddingRight: 24, color: '#4A5670'}}>{i + 1}</div>
            <div style={{color: l.trim().startsWith('//') ? '#5E6B85' : C.text, whiteSpace: 'pre'}}>{l}</div>
            {Math.floor(scan) === i ? <div style={{position: 'absolute', inset: 0, background: 'rgba(91,155,255,0.12)', borderLeft: `4px solid ${C.blue}`}} /> : null}
          </div>
        ))}
      </Window>
      <div style={{position: 'absolute', left: 260, top: 690, fontFamily: F.mono, fontSize: 30, color: C.red, opacity: ease(f, 80, 88)}}>0 matches · no line where it fell apart</div>
    </AbsoluteFill>
  );
};

export const ShotTimer: React.FC = () => {
  const f = useCurrentFrame();
  const secs = Math.min(59, Math.floor(lin(f, 0, 62, 0, 59)));
  const diff = ['- if (user = null)', '+ if (user === null)', '- items.forEach(async…)', '+ await Promise.all(items.map(…))', '+ // fixed: race in cache'];
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 200, top: 180, fontFamily: F.mono, fontSize: 190, color: secs === 59 ? C.green : C.text, textShadow: secs === 59 ? `0 0 50px ${C.green}` : undefined}}>
        00:{String(secs).padStart(2, '0')}
      </div>
      <Window title="diff" x={1020} y={170} w={760} bodyStyle={{fontSize: 26}}>
        {diff.map((d, i) => (
          <div key={i} style={{color: d.startsWith('+') ? C.green : C.red, opacity: f > i * 10 ? 1 : 0}}>
            {d}
          </div>
        ))}
      </Window>
      <div style={{position: 'absolute', left: 210, top: 470, fontFamily: F.mono, fontSize: 40, color: C.green, opacity: ease(f, 64, 72)}}>✓ fixed in 59s</div>
    </AbsoluteFill>
  );
};

export const ShotFriday: React.FC = () => {
  const f = useCurrentFrame();
  const p = ease(f, 4, 60, 0, 100);
  const confetti = useMemo(() => new Array(60).fill(0).map((_, i) => ({x: random(`cf${i}`) * 1920, vx: (random(`cv${i}`) - 0.5) * 14, vy: -10 - random(`cy${i}`) * 14, c: [C.orange, C.gold, C.green, C.blue][i % 4]})), []);
  const t = f - 62;
  return (
    <AbsoluteFill>
      <Window title="deploy — production" x={310} y={210} w={1300} bodyStyle={{fontSize: 32}}>
        <div style={{color: C.dim}}>Fri 23:58 · deploying v4.2.0 to production</div>
        <div style={{marginTop: 26, height: 40, borderRadius: 20, background: 'rgba(255,255,255,0.08)', overflow: 'hidden'}}>
          <div style={{width: `${p}%`, height: '100%', background: `linear-gradient(90deg, ${C.orange}, ${C.gold})`}} />
        </div>
        <div style={{marginTop: 22, color: p >= 100 ? C.green : C.text}}>{p >= 100 ? '✓ shipped. zero downtime.' : `${Math.floor(p)}%`}</div>
      </Window>
      {t > 0 ? (
        <svg width={1920} height={1080} style={{position: 'absolute'}}>
          {confetti.map((c, i) => (
            <rect key={i} x={960 + c.vx * t * 3 + (c.x - 960) * 0.1} y={600 + c.vy * t + 0.5 * 0.9 * t * t} width={14} height={8} fill={c.c} transform={`rotate(${t * 9 + i * 20} ${960 + c.vx * t * 3} ${600 + c.vy * t})`} />
          ))}
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};

export const ShotRevert: React.FC = () => {
  const f = useCurrentFrame();
  const err = f > 34;
  const s = shake(f, err && f < 50 ? 8 : 0);
  return (
    <AbsoluteFill style={{transform: `translate(${s.x}px, ${s.y}px)`}}>
      <Window title="zsh" x={260} y={200} w={1400} accent={err ? C.red : undefined} bodyStyle={{fontSize: 40}}>
        <div>
          <span style={{color: C.green}}>$</span> {typed('git revert that-night', f, 4, 1.0)}
          {!err && blink(f) ? '▍' : ''}
        </div>
        {err ? (
          <>
            <div style={{color: C.red, marginTop: 14}}>fatal: bad revision &apos;that-night&apos;</div>
            <div style={{color: C.dim, opacity: ease(f, 48, 58)}}>hint: some things can&apos;t be undone</div>
          </>
        ) : null}
      </Window>
    </AbsoluteFill>
  );
};

export const ShotSorry: React.FC = () => {
  const f = useCurrentFrame();
  const squiggle = ease(f, 30, 44);
  return (
    <AbsoluteFill>
      <Window title="apology.ts" x={260} y={170} w={1400} bodyStyle={{fontSize: 40}}>
        <div>
          <span style={{color: '#C792EA'}}>const</span> msg: <span style={{color: C.gold}}>Forgiveness</span> ={' '}
          <span style={{position: 'relative', color: C.green}}>
            {typed('"I\'m sorry"', f, 6, 0.8)}
            <svg width={250} height={14} style={{position: 'absolute', left: 0, bottom: -10, opacity: squiggle}}>
              <path d={'M0 7 ' + new Array(25).fill(0).map((_, i) => `Q${i * 10 + 5} ${i % 2 ? 14 : 0} ${i * 10 + 10} 7`).join(' ')} stroke={C.red} strokeWidth={3} fill="none" />
            </svg>
          </span>
          ;
        </div>
      </Window>
      <Window x={330} y={460} w={1260} accent={C.red} style={{opacity: ease(f, 44, 54)}} bodyStyle={{fontSize: 28, color: C.red}}>
        error TS2322: Type &apos;&quot;I&apos;m sorry&quot;&apos; is not assignable to type &apos;Forgiveness&apos;.
        <div style={{color: C.dim, marginTop: 8}}>1 error. build failed.</div>
      </Window>
    </AbsoluteFill>
  );
};

export const ShotHttp: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Window title="GET /her/reply" x={360} y={150} w={1200} bodyStyle={{fontSize: 36}}>
        <div style={{color: C.green, opacity: ease(f, 6, 12)}}>HTTP/1.1 200 OK</div>
        <div style={{color: C.dim, opacity: ease(f, 14, 20)}}>content-type: text/feelings</div>
        <div style={{color: C.gold, opacity: ease(f, 20, 26)}}>content-length: 0</div>
        <div style={{marginTop: 26, height: 200, border: `2px dashed ${C.line}`, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4A5670', fontSize: 30}}>
          {f > 30 ? <>(empty body){blink(f) ? ' ▍' : ''}</> : null}
        </div>
      </Window>
    </AbsoluteFill>
  );
};

export const ShotSeen: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Phone x={300} y={90} time="11:40">
        <Bubble me opacity={ease(f, 0, 6)}>hey</Bubble>
        <Bubble me opacity={ease(f, 8, 14)}>about the other night…</Bubble>
        <Bubble me opacity={ease(f, 16, 22)}>I didn&apos;t mean it like that</Bubble>
        <Receipt text="Seen 11:40" color={C.blueSoft} glow={ease(f, 30, 40)} />
      </Phone>
      <Pose name="m_phone_down" height={900} x={1560} bottom={0} />
      <div style={{position: 'absolute', left: 700, top: 150, fontFamily: F.heavy, fontWeight: 800, fontSize: 104, color: C.blueSoft, opacity: ease(f, 34, 46), letterSpacing: 4, textShadow: `0 0 50px ${C.blue}`}}>
        Seen 11:40
      </div>
      <div style={{position: 'absolute', left: 710, top: 300, fontFamily: F.mono, fontSize: 30, color: C.dim, opacity: ease(f, 60, 70)}}>…and nothing after.</div>
    </AbsoluteFill>
  );
};

const TASKS = ['fix login bug', 'optimize query', 'refactor auth', 'update deps', 'migrate db', 'fix CSS', 'write tests', 'review PR', 'write docs', 'deploy', 'résumé', 'fix us'];
export const ShotTasks: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 440px)', gap: '22px 40px', marginTop: -120}}>
        {TASKS.map((t, i) => {
          const last = i === TASKS.length - 1;
          const done = !last && f > 4 + i * 6;
          return (
            <div key={t} style={{fontFamily: F.mono, fontSize: 34, color: last ? (blink(f, 20) ? C.red : C.dim) : done ? C.green : C.dim, display: 'flex', gap: 18, alignItems: 'center'}}>
              <span style={{fontSize: 40}}>{done ? '☑' : '☐'}</span>
              <span style={{textDecoration: done ? 'line-through' : undefined}}>{t}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const ShotFinale: React.FC<{v?: 1 | 2}> = ({v = 1}) => {
  const f = useCurrentFrame();
  const {durationInFrames: d} = useVideoConfig();
  const beam = ease(f, 0, 40);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 0, top: 380, width: 960 * beam, height: 6, background: `linear-gradient(90deg, rgba(91,155,255,0), ${C.blue})`, boxShadow: `0 0 30px ${C.blue}`}} />
      <div style={{position: 'absolute', right: 0, top: 380, width: 960 * beam, height: 6, background: `linear-gradient(270deg, rgba(232,130,63,0), ${C.orange})`, boxShadow: `0 0 30px ${C.orange}`}} />
      {beam > 0.98 ? <div style={{position: 'absolute', left: 960 - 60, top: 383 - 60, width: 120, height: 120, borderRadius: 60, background: 'radial-gradient(circle, #fff, rgba(255,255,255,0) 70%)', opacity: 0.6 + 0.4 * Math.sin(f / 4)}} /> : null}
      <Character who="user" view="side" height={760} x={380} bottom={170} flip />
      <Character who="claude" view="side" height={760} x={1540} bottom={170} float={5} />
      <div style={{position: 'absolute', top: 120, width: 1920, textAlign: 'center', fontFamily: F.heavy, fontWeight: 800, fontSize: 96, letterSpacing: 10, color: '#fff', opacity: ease(f, 10, 24) * lin(f, d - 10, d, 1, 0), textShadow: `0 0 40px ${v === 1 ? C.orange : C.red}`}}>
        NO STACK TRACE
      </div>
    </AbsoluteFill>
  );
};
