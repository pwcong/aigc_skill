import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {F} from '../theme';

type Props = {text: string; color: string; at: number; x: number; y: number; rotate?: number; size?: number};

export const Stamp: React.FC<Props> = ({text, color, at, x, y, rotate = -8, size = 64}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (f < at) return null;
  const s = spring({frame: f - at, fps, config: {damping: 11, stiffness: 180}});
  const scale = 2.4 - 1.4 * s;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${scale})`,
        opacity: Math.min(1, s * 1.5),
        border: `6px solid ${color}`,
        borderRadius: 14,
        padding: '10px 30px',
        color,
        fontFamily: F.heavy,
        fontWeight: 800,
        fontSize: size,
        letterSpacing: 4,
        textShadow: `0 0 24px ${color}88`,
        boxShadow: `0 0 30px ${color}55, inset 0 0 20px ${color}33`,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );
};
