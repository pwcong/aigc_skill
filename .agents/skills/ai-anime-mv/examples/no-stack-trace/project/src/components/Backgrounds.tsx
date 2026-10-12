import {useMemo} from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {C} from '../theme';

const Stars: React.FC<{count?: number; seed?: string; opacity?: number}> = ({count = 140, seed = 'stars', opacity = 1}) => {
  const f = useCurrentFrame();
  const stars = useMemo(
    () => new Array(count).fill(0).map((_, i) => ({x: random(`${seed}x${i}`) * 1920, y: random(`${seed}y${i}`) * 620, r: 0.6 + random(`${seed}r${i}`) * 1.6, p: random(`${seed}p${i}`) * 6.28})),
    [count, seed],
  );
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', opacity}}>
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={0.35 + 0.35 * Math.sin(f / 18 + s.p)} />
      ))}
    </svg>
  );
};

// Procedural skyline; `drift` px/frame horizontal parallax
export const Skyline: React.FC<{seed: string; base: number; maxH: number; color: string; windowColor?: string; windows?: number; drift?: number; opacity?: number}> = ({
  seed,
  base,
  maxH,
  color,
  windowColor = '#FFD08A',
  windows = 0.18,
  drift = 0.15,
  opacity = 1,
}) => {
  const f = useCurrentFrame();
  const W = 3840;
  const blds = useMemo(() => {
    const out: {x: number; w: number; h: number; win: {x: number; y: number; on: boolean}[]}[] = [];
    let x = 0;
    let i = 0;
    while (x < W) {
      const w = 60 + random(`${seed}w${i}`) * 130;
      const h = maxH * (0.3 + random(`${seed}h${i}`) * 0.7);
      const win: {x: number; y: number; on: boolean}[] = [];
      for (let wx = 10; wx < w - 14; wx += 18) {
        for (let wy = 14; wy < h - 10; wy += 24) {
          win.push({x: wx, y: wy, on: random(`${seed}${i}-${wx}-${wy}`) < windows});
        }
      }
      out.push({x, w, h, win});
      x += w + 4 + random(`${seed}g${i}`) * 10;
      i++;
    }
    return out;
  }, [seed, maxH, windows]);
  const off = -((f * drift) % 1920);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', opacity}}>
      <g transform={`translate(${off},0)`}>
        {blds.map((b, i) => (
          <g key={i} transform={`translate(${b.x},${base - b.h})`}>
            <rect width={b.w} height={b.h + 400} fill={color} />
            {b.win.map((w, j) => (w.on ? <rect key={j} x={w.x} y={w.y} width={8} height={11} fill={windowColor} opacity={0.75} /> : null))}
          </g>
        ))}
      </g>
    </svg>
  );
};

export const Rain: React.FC<{count?: number; opacity?: number}> = ({count = 160, opacity = 0.35}) => {
  const f = useCurrentFrame();
  const drops = useMemo(() => new Array(count).fill(0).map((_, i) => ({x: random(`rx${i}`) * 2100, s: 28 + random(`rs${i}`) * 20, o: random(`ro${i}`) * 1080, l: 30 + random(`rl${i}`) * 40})), [count]);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', opacity}}>
      {drops.map((d, i) => {
        const y = ((d.o + f * d.s) % 1300) - 120;
        const x = d.x - y * 0.12;
        return <line key={i} x1={x} y1={y} x2={x - d.l * 0.12} y2={y + d.l} stroke={C.blueSoft} strokeWidth={1.4} strokeLinecap="round" />;
      })}
    </svg>
  );
};

export const NightCity: React.FC<{dim?: number; rain?: number}> = ({dim = 0, rain = 0}) => (
  <AbsoluteFill style={{background: 'linear-gradient(180deg, #050814 0%, #0B1430 55%, #1A1838 100%)'}}>
    <Stars />
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 700, background: 'radial-gradient(ellipse at 75% 10%, rgba(169,200,255,0.12), rgba(0,0,0,0) 55%)'}} />
    <Skyline seed="far" base={930} maxH={420} color="#0E1734" windowColor="#8FB4FF" windows={0.08} drift={0.08} opacity={0.9} />
    <Skyline seed="near" base={1000} maxH={560} color="#070B1C" windows={0.16} drift={0.18} />
    {rain ? <Rain opacity={0.35 * rain} /> : null}
    <AbsoluteFill style={{background: '#000', opacity: dim}} />
  </AbsoluteFill>
);

export const GridVoid: React.FC<{tint: string; intensity?: number}> = ({tint, intensity = 1}) => {
  const f = useCurrentFrame();
  const shift = (f * 2) % 80;
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 40%, ${tint}55 0%, #07060D 65%)`}}>
      <svg width={1920} height={1080} style={{position: 'absolute', opacity: 0.35 * intensity}}>
        {new Array(24).fill(0).map((_, i) => {
          const x = -1500 + i * 210;
          return <line key={`v${i}`} x1={960} y1={560} x2={x} y2={1080} stroke={tint} strokeWidth={1.2} />;
        })}
        {new Array(10).fill(0).map((_, i) => {
          const t = (i * 80 + shift) / 800;
          const y = 560 + Math.pow(t, 2) * 520;
          return <line key={`h${i}`} x1={0} y1={y} x2={1920} y2={y} stroke={tint} strokeWidth={1} opacity={t} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

export const Void: React.FC<{dust?: number; tint?: string; transparent?: boolean}> = ({dust = 1, tint = C.orange, transparent}) => {
  const f = useCurrentFrame();
  const motes = useMemo(() => new Array(70).fill(0).map((_, i) => ({x: random(`mx${i}`) * 1920, y: random(`my${i}`) * 1080, s: 0.2 + random(`ms${i}`) * 0.6, r: 1 + random(`mr${i}`) * 2.5})), []);
  return (
    <AbsoluteFill style={{background: transparent ? undefined : 'radial-gradient(ellipse at 50% 55%, #1A1220 0%, #040408 70%)'}}>
      <svg width={1920} height={1080} style={{position: 'absolute', opacity: dust}}>
        {motes.map((m, i) => (
          <circle key={i} cx={(m.x + Math.sin(f / 50 + i) * 30) % 1920} cy={(m.y - f * m.s + 2160) % 1080} r={m.r} fill={tint} opacity={0.25 + 0.25 * Math.sin(f / 20 + i)} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

// progress 0..1: night blue -> sunrise gold
export const Dawn: React.FC<{progress: number}> = ({progress: p}) => {
  const top = interpolateColor(p, ['#0B1430', '#2B3A6B', '#6E8FC9']);
  const mid = interpolateColor(p, ['#2A2350', '#C66A5A', '#F2A15E']);
  const low = interpolateColor(p, ['#4A2E4E', '#F2A15E', '#FFD99A']);
  const sunY = interpolate(p, [0, 1], [1050, 700]);
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${top} 0%, ${mid} 62%, ${low} 100%)`}}>
      <Stars opacity={1 - p * 1.4} seed="dawnstars" />
      <div style={{position: 'absolute', left: 960 - 170, top: sunY - 170, width: 340, height: 340, borderRadius: 170, background: 'radial-gradient(circle, #FFF6DD 0%, #FFD48A 40%, rgba(255,190,110,0) 70%)'}} />
      <div style={{position: 'absolute', left: 0, top: sunY - 500, width: 1920, height: 1000, background: 'radial-gradient(ellipse at 50% 50%, rgba(255,200,120,0.35), rgba(255,200,120,0) 60%)'}} />
      <Skyline seed="dawnfar" base={940} maxH={380} color={interpolateColor(p, ['#1B1F3D', '#5A3E5E', '#8A5A60'])} windows={0.05} drift={0.25} opacity={0.85} />
      <Skyline seed="dawnnear" base={1010} maxH={520} color={interpolateColor(p, ['#0A0C1C', '#24182A', '#3A2430'])} windows={0.1 * (1 - p)} drift={0.6} />
    </AbsoluteFill>
  );
};

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const interpolateColor = (p: number, stops: string[]) => {
  const n = stops.length - 1;
  const t = Math.min(0.9999, Math.max(0, p)) * n;
  const i = Math.floor(t);
  const k = t - i;
  const a = hex(stops[i]);
  const b = hex(stops[i + 1]);
  return `rgb(${a.map((v, j) => Math.round(v + (b[j] - v) * k)).join(',')})`;
};
