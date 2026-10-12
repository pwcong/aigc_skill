import {C, F} from '../theme';

export const Phone: React.FC<{x: number; y: number; time: string; children?: React.ReactNode; footer?: React.ReactNode}> = ({x, y, time, children, footer}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: 430,
      height: 860,
      borderRadius: 60,
      background: '#0A0E17',
      border: '10px solid #1D2433',
      boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 60px rgba(91,155,255,0.18)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <div style={{display: 'flex', justifyContent: 'space-between', padding: '18px 34px 0', fontFamily: F.sans, fontSize: 20, fontWeight: 600, color: C.text}}>
      <span>{time}</span>
      <span style={{letterSpacing: 2}}>▮▮▮ ◔</span>
    </div>
    <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '22px 26px 16px', borderBottom: `1px solid ${C.line}`}}>
      <div style={{width: 46, height: 46, borderRadius: 23, background: `radial-gradient(circle at 35% 35%, ${C.blueSoft}, ${C.blue})`}} />
      <div style={{fontFamily: F.sans, fontSize: 24, fontWeight: 600, color: C.text}}>her</div>
    </div>
    <div style={{flex: 1, padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 12}}>{children}</div>
    {footer}
  </div>
);

export const Bubble: React.FC<{me?: boolean; children: React.ReactNode; opacity?: number; style?: React.CSSProperties}> = ({me, children, opacity = 1, style}) => (
  <div
    style={{
      alignSelf: me ? 'flex-end' : 'flex-start',
      maxWidth: 300,
      padding: '14px 20px',
      borderRadius: 24,
      borderBottomRightRadius: me ? 6 : 24,
      borderBottomLeftRadius: me ? 24 : 6,
      background: me ? C.blue : '#232A3A',
      color: '#fff',
      fontFamily: F.sans,
      fontSize: 23,
      lineHeight: 1.35,
      opacity,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Receipt: React.FC<{text: string; color?: string; glow?: number}> = ({text, color = C.dim, glow = 0}) => (
  <div style={{alignSelf: 'flex-end', fontFamily: F.sans, fontSize: 18, color, textShadow: glow ? `0 0 ${18 * glow}px ${color}` : undefined}}>{text}</div>
);
