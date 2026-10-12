import {useMemo} from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.6}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 52%, rgba(0,0,0,${strength}) 100%)`, pointerEvents: 'none'}} />
);

export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.06}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
      <svg width={1920} height={1080}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={f % 12} />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

export const Flash: React.FC<{amount: number; color?: string}> = ({amount, color = '#fff'}) =>
  amount > 0.001 ? <AbsoluteFill style={{background: color, opacity: amount, pointerEvents: 'none'}} /> : null;

// Teal shadows / warm highlights grade
export const ColorGrade: React.FC<{warm?: number}> = ({warm = 0.5}) => (
  <>
    <AbsoluteFill style={{background: `linear-gradient(135deg, rgba(40,90,140,${0.22 * (1 - warm)}) 0%, rgba(0,0,0,0) 50%, rgba(255,150,70,${0.18 + 0.12 * warm}) 100%)`, mixBlendMode: 'soft-light', pointerEvents: 'none'}} />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, rgba(255,240,220,0.06), rgba(0,0,0,0) 60%)', mixBlendMode: 'screen', pointerEvents: 'none'}} />
  </>
);

// Soft out-of-focus orbs drifting in the foreground
export const Bokeh: React.FC<{tint?: string; opacity?: number; count?: number}> = ({tint = '255,190,120', opacity = 0.5, count = 14}) => {
  const f = useCurrentFrame();
  const orbs = useMemo(
    () => new Array(count).fill(0).map((_, i) => ({x: random(`bx${i}`) * 1920, y: random(`by${i}`) * 1080, r: 30 + random(`br${i}`) * 90, s: 0.15 + random(`bs${i}`) * 0.35, p: random(`bp${i}`) * 6.28})),
    [count],
  );
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity, mixBlendMode: 'screen'}}>
      {orbs.map((o, i) => {
        const x = (o.x + f * o.s * 1.4 + 2200) % 2200 - 140;
        const y = o.y + Math.sin(f / 90 + o.p) * 40;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x - o.r,
              top: y - o.r,
              width: o.r * 2,
              height: o.r * 2,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(${tint},0.28) 0%, rgba(${tint},0.12) 45%, rgba(${tint},0) 70%)`,
              opacity: 0.5 + 0.5 * Math.sin(f / 60 + o.p),
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// Warm light leak sweeping across; p 0..1
export const LightLeak: React.FC<{p: number; tint?: string}> = ({p, tint = '255,170,90'}) => {
  if (p <= 0 || p >= 1) return null;
  const a = Math.sin(p * Math.PI);
  const x = -30 + p * 160;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen', opacity: a}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 60% 90% at ${x}% 40%, rgba(${tint},0.75) 0%, rgba(${tint},0.25) 35%, rgba(${tint},0) 70%)`}} />
      <AbsoluteFill style={{background: `linear-gradient(100deg, rgba(255,255,255,0) ${x - 25}%, rgba(255,230,200,0.35) ${x}%, rgba(255,255,255,0) ${x + 25}%)`}} />
    </AbsoluteFill>
  );
};
