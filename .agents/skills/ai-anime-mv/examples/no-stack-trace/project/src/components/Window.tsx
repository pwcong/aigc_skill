import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {C, F} from '../theme';

type Props = {
  title?: string;
  x: number;
  y: number;
  w: number;
  h?: number;
  accent?: string;
  delay?: number;
  style?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
  children?: React.ReactNode;
};

export const Window: React.FC<Props> = ({title, x, y, w, h, accent, delay = 0, style, bodyStyle, children}) => {
  const f = useCurrentFrame();
  const p = interpolate(f - delay, [0, 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: w,
      height: h,
      background: 'linear-gradient(160deg, rgba(26,32,52,0.72) 0%, rgba(10,13,24,0.78) 100%)',
      backdropFilter: 'blur(18px) saturate(1.25)',
      border: `1px solid ${accent ? `${accent}99` : 'rgba(255,255,255,0.12)'}`,
      borderRadius: 22,
      boxShadow: `0 30px 90px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)${accent ? `, 0 0 50px ${accent}2E` : ''}`,
      overflow: 'hidden',
      opacity: p,
      transform: `translateY(${(1 - p) * 28}px) scale(${0.98 + 0.02 * p})`,
      filter: p < 1 ? `blur(${(1 - p) * 8}px)` : undefined,
      ...style,
    }}
  >
    <div style={{height: 44, display: 'flex', alignItems: 'center', gap: 9, padding: '0 18px', borderBottom: `1px solid ${C.line}`}}>
      {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
        <div key={c} style={{width: 13, height: 13, borderRadius: 7, background: c, opacity: 0.85}} />
      ))}
      {title ? <div style={{marginLeft: 14, fontFamily: F.mono, fontSize: 19, color: C.dim}}>{title}</div> : null}
    </div>
    <div style={{padding: '22px 28px', fontFamily: F.mono, fontSize: 26, color: C.text, lineHeight: 1.55, ...bodyStyle}}>{children}</div>
  </div>
  );
};
