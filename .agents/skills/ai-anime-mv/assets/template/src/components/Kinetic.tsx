import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {F} from '../theme';

// Big lyric typography that lands letter by letter
export const Kinetic: React.FC<{text: string; start: number; color?: string; glow?: string; top?: number; size?: number; font?: 'display' | 'heavy'; delay?: number}> = ({
  text,
  start,
  color = '#fff',
  glow = '#FF9A4D',
  top = 110,
  size = 120,
  font = 'heavy',
  delay = 2,
}) => {
  const f = useCurrentFrame();
  const {durationInFrames: d} = useVideoConfig();
  const out = interpolate(f, [d - 10, d], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          top,
          width: 1920,
          textAlign: 'center',
          fontFamily: font === 'display' ? F.display : F.heavy,
          fontWeight: font === 'display' ? 400 : 800,
          fontStyle: font === 'display' ? 'italic' : 'normal',
          fontSize: size,
          letterSpacing: font === 'display' ? 2 : 8,
          color,
          opacity: out,
                    textShadow: `0 0 36px ${glow}, 0 4px 30px rgba(0,0,0,0.5)`,
        }}
      >
        {text.split('').map((ch, i) => {
          const p = interpolate(f - delay - i * 1.5, [0, 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.6))});
          return (
            <span key={i} style={{display: 'inline-block', whiteSpace: 'pre', opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * 40}px) scale(${0.6 + 0.4 * p})`, filter: p < 1 ? `blur(${(1 - p) * 8}px)` : undefined}}>
              {ch}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
