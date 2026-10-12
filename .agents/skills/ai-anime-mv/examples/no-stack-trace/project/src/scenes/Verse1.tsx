import {useMemo} from 'react';
import {AbsoluteFill, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Character} from '../components/Character';
import {ImageBG, Pose} from '../components/Images';
import {Stamp} from '../components/Stamp';
import {Window} from '../components/Window';
import {blink, ease, lin, typed} from '../lib/anim';
import {C, F} from '../theme';

export const IntroTerminal: React.FC = () => {
  const f = useCurrentFrame();
  const t1 = typed('> claude, you there?', f, 8, 0.9);
  const t2 = typed('Always. What are we fixing tonight?', f, 52, 1.5);
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', background: C.ink}}>
      <div style={{fontFamily: F.mono, fontSize: 46, color: C.text, width: 1100}}>
        <div>
          {t1}
          {f < 52 && blink(f) ? '▍' : ''}
        </div>
        <div style={{color: C.orange, marginTop: 26, minHeight: 64}}>
          {f >= 52 ? (
            <>
              {'● '}
              {t2}
              {blink(f) ? '▍' : ''}
            </>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Shot3am: React.FC = () => {
  const f = useCurrentFrame();
  const pts = useMemo(
    () =>
      new Array(64).fill(0).map((_, i) => {
        const base = 210 - random(`lat${i}`) * 40;
        return i < 40 ? base : Math.max(18, base - (i - 40) * 9 - random(`sp${i}`) * 60);
      }),
    [],
  );
  const shown = Math.floor(lin(f, 10, 150, 2, 64));
  const poly = pts
    .slice(0, shown)
    .map((y, i) => `${i * 13},${y}`)
    .join(' ');
  const redPulse = 0.5 + 0.5 * Math.sin(f / 5);
  const ss = String(Math.floor(f / 30)).padStart(2, '0');
  return (
    <AbsoluteFill>
      <ImageBG name="bg_night_desk" dim={0.35} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 70% 40%, rgba(255,60,80,${0.22 * redPulse}), rgba(0,0,0,0) 60%)`}} />
      <Window title="alerts — prod" x={820} y={110} w={900} accent={C.red} style={{transform: `translateY(${ease(f, 0, 20, 40, 0)}px)`, opacity: ease(f, 0, 14)}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div style={{color: C.red, fontSize: 40, fontWeight: 700, opacity: 0.6 + 0.4 * redPulse}}>● SERVICE DOWN</div>
          <div style={{fontSize: 54, color: C.text}}>03:00:{ss}</div>
        </div>
        <div style={{color: C.dim, fontSize: 22, marginTop: 6}}>prod-api · 5xx rate 94% · p99 12,480ms</div>
        <svg width={840} height={240} style={{marginTop: 18}}>
          <rect width={840} height={240} fill="rgba(255,255,255,0.02)" />
          {[60, 120, 180].map((y) => (
            <line key={y} x1={0} x2={840} y1={y} y2={y} stroke={C.line} />
          ))}
          <polyline points={poly} fill="none" stroke={C.red} strokeWidth={4} />
        </svg>
        <div style={{display: 'flex', gap: 14, marginTop: 14}}>
          {['PAGE', 'PAGE', 'PAGE'].map((p, i) => (
            <div key={i} style={{opacity: f > 40 + i * 30 ? 1 : 0, color: '#fff', background: C.red, borderRadius: 8, padding: '4px 14px', fontSize: 20}}>
              {p} #{i + 1}
            </div>
          ))}
        </div>
      </Window>
      <Pose name="m_desk_back" height={760} x={400} bottom={40} />
    </AbsoluteFill>
  );
};

const LOG_PATHS = ['/api/cart', '/api/auth', '/api/orders', '/api/search', '/api/user'];
export const ShotLogs: React.FC = () => {
  const f = useCurrentFrame();
  const lines = useMemo(
    () =>
      new Array(90).fill(0).map((_, i) => {
        const r = random(`log${i}`);
        const lvl = r < 0.18 ? 'ERR' : r < 0.35 ? 'WRN' : 'INF';
        const ms = String(Math.floor(random(`ms${i}`) * 999)).padStart(3, '0');
        const p = LOG_PATHS[Math.floor(random(`p${i}`) * LOG_PATHS.length)];
        const text = i === 70 ? 'ERR race: cache.get() read stale value' : `${lvl} GET ${p} ${lvl === 'ERR' ? 503 : 200} ${Math.floor(random(`t${i}`) * 900)}ms`;
        return {ts: `03:0${Math.floor(i / 20)}:${String((i * 7) % 60).padStart(2, '0')}.${ms}`, text, lvl: i === 70 ? 'HIT' : lvl};
      }),
    [],
  );
  const lineH = 36;
  const scroll = ease(f, 0, 62, 0, 70 * lineH - 6 * lineH);
  const found = f > 62;
  const lensX = ease(f, 40, 66, 900, 400);
  return (
    <AbsoluteFill>
      <Window title="tail -f prod.log  (10,482 lines)" x={110} y={100} w={1060} h={640} bodyStyle={{fontSize: 22, padding: '10px 24px'}}>
        <div style={{height: 560, overflow: 'hidden', position: 'relative'}}>
          <div style={{transform: `translateY(${-scroll}px)`}}>
            {lines.map((l, i) => (
              <div
                key={i}
                style={{
                  height: lineH,
                  whiteSpace: 'nowrap',
                  color: l.lvl === 'HIT' ? (found ? '#fff' : C.red) : l.lvl === 'ERR' ? C.red : l.lvl === 'WRN' ? C.gold : C.dim,
                  background: l.lvl === 'HIT' && found ? 'rgba(232,130,63,0.35)' : undefined,
                }}
              >
                <span style={{opacity: 0.55}}>{l.ts}</span> {l.text}
              </div>
            ))}
          </div>
        </div>
      </Window>
      <div
        style={{
          position: 'absolute',
          left: lensX,
          top: 100 + 44 + 10 + 6 * lineH - 110,
          width: 240,
          height: 240,
          borderRadius: 120,
          border: `7px solid ${C.orange}`,
          boxShadow: `0 0 40px ${C.orange}88, inset 0 0 40px ${C.orange}44`,
          opacity: ease(f, 30, 45),
        }}
      />
      <Pose name="c_magnifier" height={860} x={1510} bottom={120} float={6} style={{transform: `translateX(${ease(f, 0, 22, 500, 0)}px)`}} />
    </AbsoluteFill>
  );
};

export const ShotRace: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const collide = 42;
  const cx = 1000;
  const cy = 430;
  const packet = (lane: number, k: number) => {
    if (f < collide) {
      const p = ease(f, k * 6, collide, 0, 1);
      return {x: 180 + (cx - 180) * p, y: (lane === 0 ? 300 : 560) + (cy - (lane === 0 ? 300 : 560)) * Math.pow(p, 3)};
    }
    // after mutex: orderly alternating flow
    const t = (f - collide - 10 + k * 14 + lane * 7) % 56;
    const p = t / 56;
    return {x: 180 + p * 1500, y: lane === 0 ? 300 : 560};
  };
  const lock = spring({frame: f - collide - 8, fps, config: {damping: 12}});
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        <line x1={140} y1={300} x2={1780} y2={300} stroke={C.orange} strokeOpacity={0.3} strokeWidth={3} strokeDasharray="8 10" />
        <line x1={140} y1={560} x2={1780} y2={560} stroke={C.blue} strokeOpacity={0.3} strokeWidth={3} strokeDasharray="8 10" />
        {[0, 1, 2].map((k) => {
          const a = packet(0, k);
          const b = packet(1, k);
          return (
            <g key={k}>
              <circle cx={a.x} cy={a.y} r={14} fill={C.orange} />
              <circle cx={b.x} cy={b.y} r={14} fill={C.blue} />
            </g>
          );
        })}
        {f >= collide && f < collide + 14 ? <circle cx={cx} cy={cy} r={30 + (f - collide) * 10} fill="none" stroke={C.red} strokeWidth={6} opacity={1 - (f - collide) / 14} /> : null}
      </svg>
      <div style={{position: 'absolute', left: 140, top: 250, fontFamily: F.mono, fontSize: 24, color: C.orange}}>thread A</div>
      <div style={{position: 'absolute', left: 140, top: 590, fontFamily: F.mono, fontSize: 24, color: C.blue}}>thread B</div>
      <div
        style={{
          position: 'absolute',
          left: cx - 130,
          top: cy - 60,
          width: 260,
          height: 120,
          borderRadius: 18,
          background: C.panel,
          border: `2px solid ${f >= collide && f < collide + 20 ? C.red : C.line}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: F.mono,
          fontSize: 34,
          color: C.text,
        }}
      >
        cache {lock > 0.05 ? <span style={{marginLeft: 12, transform: `scale(${lock})`, display: 'inline-block'}}>🔒</span> : null}
      </div>
      {f >= collide && f < collide + 26 ? <div style={{position: 'absolute', left: cx - 90, top: cy - 150, fontFamily: F.heavy, fontWeight: 800, fontSize: 56, color: C.red}}>RACE!</div> : null}
      <div style={{position: 'absolute', left: cx - 160, top: cy + 90, fontFamily: F.mono, fontSize: 26, color: C.green, opacity: lock}}>✓ mutex acquired</div>
      <Character who="claude" view="side" height={560} x={1680} bottom={180} float={5} flip opacity={ease(f, 0, 12)} />
    </AbsoluteFill>
  );
};

export const ShotMigration: React.FC = () => {
  const f = useCurrentFrame();
  const prog = ease(f, 14, 72, 100, 0);
  return (
    <AbsoluteFill>
      <Window title="db/migrations" x={180} y={130} w={980} bodyStyle={{fontSize: 28}}>
        <div style={{color: C.green}}>✓ 0040_add_orders_index</div>
        <div style={{color: C.green}}>✓ 0041_add_user_email</div>
        <div style={{color: f > 72 ? C.dim : C.red, textDecoration: f > 72 ? 'line-through' : undefined}}>✗ 0042_drop_users_table</div>
        <div style={{marginTop: 26, color: C.gold}}>{f > 72 ? 'rolled back 0042 ✓' : 'rolling back 0042…'}</div>
        <div style={{marginTop: 14, height: 22, borderRadius: 11, background: 'rgba(255,255,255,0.08)', overflow: 'hidden'}}>
          <div style={{width: `${prog}%`, height: '100%', background: `linear-gradient(90deg, ${C.gold}, ${C.orange})`}} />
        </div>
      </Window>
      <svg width={360} height={420} style={{position: 'absolute', left: 1320, top: 180}}>
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(0, ${i * 110})`}>
            <path d="M30 60 L30 150 A150 40 0 0 0 330 150 L330 60" fill="#121A2E" stroke={f > 72 ? C.green : C.red} strokeWidth={4} />
            <ellipse cx={180} cy={60} rx={150} ry={40} fill="#1A2440" stroke={f > 72 ? C.green : C.red} strokeWidth={4} />
          </g>
        ))}
      </svg>
      <Stamp text="ROLLBACK ✓" color={C.green} at={74} x={1500} y={760} />
    </AbsoluteFill>
  );
};

const TESTS = ['auth › login works', 'cart › adds item', 'cart › totals tax', 'api › handles 503', 'ui › renders header', 'ui › dark mode', 'db › migrates clean'];
export const ShotTests: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const snap = spring({frame: f - 50, fps, config: {damping: 13}});
  return (
    <AbsoluteFill>
      <Window title="npm test" x={120} y={140} w={800} bodyStyle={{fontSize: 26}}>
        {TESTS.map((t, i) => {
          const pass = f > 8 + i * 9;
          return (
            <div key={t} style={{color: pass ? C.green : C.dim}}>
              {pass ? '✓' : '○'} {t}
            </div>
          );
        })}
        <div style={{marginTop: 18, color: f > 75 ? C.green : C.dim}}>{f > 75 ? '7 passing (412ms)' : 'running…'}</div>
      </Window>
      <Window title="styles.css" x={1000} y={140} w={800} h={560}>
        <div style={{position: 'relative', height: 360}}>
          {new Array(6).fill(0).map((_, i) => {
            const gx = (i % 3) * 230 + 20;
            const gy = Math.floor(i / 3) * 170 + 20;
            const ox = (random(`cx${i}`) - 0.5) * 220;
            const oy = (random(`cy${i}`) - 0.5) * 160;
            const rot = (random(`cr${i}`) - 0.5) * 50;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: gx + ox * (1 - snap),
                  top: gy + oy * (1 - snap),
                  width: 200,
                  height: 140,
                  borderRadius: 14,
                  transform: `rotate(${rot * (1 - snap)}deg)`,
                  background: i % 2 ? 'rgba(91,155,255,0.35)' : 'rgba(232,130,63,0.35)',
                  border: `2px solid ${i % 2 ? C.blue : C.orange}`,
                }}
              />
            );
          })}
        </div>
        <div style={{color: C.blueSoft, fontSize: 24}}>{typed('display: grid; place-items: center;', f, 30, 1.2)}</div>
      </Window>
    </AbsoluteFill>
  );
};

export const ShotResume: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const inS = spring({frame: f, fps, config: {damping: 14}});
  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: 1000,
          top: 80,
          width: 620,
          height: 780,
          background: '#F4F1EA',
          borderRadius: 10,
          boxShadow: '0 40px 90px rgba(0,0,0,0.6)',
          transform: `translateY(${(1 - inS) * 500}px) rotate(${3 - inS * 6}deg)`,
          padding: 50,
          fontFamily: F.serif,
          color: '#222',
        }}
      >
        <div style={{fontSize: 46, fontWeight: 700}}>Résumé</div>
        <div style={{fontSize: 24, color: '#666', marginTop: 4}}>Software Engineer</div>
        {new Array(4).fill(0).map((_, sec) => (
          <div key={sec} style={{marginTop: 34}}>
            <div style={{width: 160, height: 14, background: '#333', borderRadius: 4}} />
            {new Array(3).fill(0).map((__, j) => {
              const idx = sec * 3 + j;
              const hl = lin(f, 20 + idx * 3, 30 + idx * 3);
              return (
                <div key={j} style={{position: 'relative', marginTop: 14, height: 12, width: `${70 + random(`rw${idx}`) * 28}%`, background: '#BBB', borderRadius: 4}}>
                  <div style={{position: 'absolute', left: 0, top: -6, height: 24, width: `${hl * 100}%`, background: 'rgba(255,196,107,0.6)', borderRadius: 4}} />
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <Stamp text="SENIOR ✓" color={C.orange} at={62} x={1340} y={660} rotate={-12} />
      <Character who="claude" view="front" height={760} x={560} bottom={170} float={6} style={{transform: `translateX(${ease(f, 0, 20, -400, 0)}px)`}} />
    </AbsoluteFill>
  );
};

const STAGES = ['lint', 'build', 'test', 'e2e', 'deploy'];
export const ShotGreen: React.FC = () => {
  const f = useCurrentFrame();
  const all = f > 82;
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div style={{display: 'flex', gap: 34, marginTop: -120, perspective: 800}}>
        {STAGES.map((s, i) => {
          const flipAt = 10 + i * 15;
          const p = ease(f, flipAt, flipAt + 8);
          const green = p > 0.5;
          return (
            <div
              key={s}
              style={{
                width: 260,
                height: 150,
                borderRadius: 20,
                transform: `rotateX(${p * 180}deg)`,
                background: green ? 'rgba(91,228,155,0.18)' : 'rgba(255,77,94,0.18)',
                border: `3px solid ${green ? C.green : C.red}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: green ? `0 0 40px ${C.green}55` : undefined,
              }}
            >
              <div style={{transform: `rotateX(${green ? 180 : 0}deg)`, textAlign: 'center'}}>
                <div style={{fontSize: 54, color: green ? C.green : C.red}}>{green ? '✓' : '✗'}</div>
                <div style={{fontFamily: F.mono, fontSize: 26, color: C.text}}>{s}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', top: 650, fontFamily: F.heavy, fontWeight: 800, fontSize: 72, letterSpacing: 6, color: C.green, opacity: ease(f, 82, 92), textShadow: `0 0 40px ${C.green}`}}>
        ALL CHECKS PASSED
      </div>
      {all ? null : null}
    </AbsoluteFill>
  );
};

export const ShotScreen: React.FC = () => {
  const f = useCurrentFrame();
  const zoom = lin(f, 0, 113, 1, 1.08);
  return (
    <AbsoluteFill style={{transform: `scale(${zoom})`}}>
      <div style={{position: 'absolute', left: 520, top: 90, width: 1080, height: 640, borderRadius: 22, background: '#111621', border: '14px solid #1C2230', boxShadow: '0 0 120px rgba(232,130,63,0.35)', overflow: 'hidden'}}>
        <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 70%, rgba(232,130,63,0.35), rgba(10,12,20,1) 70%)'}} />
        <div style={{position: 'absolute', left: 30, top: 24, fontFamily: F.mono, fontSize: 18, color: C.dim, opacity: 0.5, lineHeight: 1.6}}>
          {['$ claude', '● reading 214 files…', '● fixed 3 bugs, 0 regressions', '● all tests passing'].map((l) => (
            <div key={l}>{l}</div>
          ))}
        </div>
        <Pose name="c_glass_smile" height={600} x={540} bottom={-60} float={4} />
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(115deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 35%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.05) 100%)'}} />
      </div>
      <div style={{position: 'absolute', left: 1010, top: 744, width: 100, height: 70, background: '#1C2230'}} />
      <Character who="user" view="back" height={1000} x={460} bottom={-460} />
    </AbsoluteFill>
  );
};
