import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {F} from '../theme';
import {FPS} from '../lib/timing';

export type Line = {start: number; end: number; en: string; zh: string; singer?: string; section?: string};

const IN = 0.45; // seconds
const OUT = 0.35;
const smooth = Easing.inOut(Easing.sin);

// Whole-line soft fade: opacity + slight blur, no word-by-word effects
export const Subtitles: React.FC<{lines: Line[]}> = ({lines}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const line = lines.find((l) => t >= l.start && t < l.end);
  if (!line) return null;
  const dur = line.end - line.start;
  const inT = Math.min(IN, dur * 0.35);
  const outT = Math.min(OUT, dur * 0.3);
  const local = t - line.start;
  const a = interpolate(local, [0, inT], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: smooth});
  const b = interpolate(line.end - t, [0, outT], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: smooth});
  const op = Math.min(a, b);
  const female = line.singer === 'f';
  const shadow = '0 1px 2px rgba(0,0,0,0.55), 0 0 24px rgba(0,0,0,0.45)';
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 0, bottom: 0, width: 1920, height: 220, background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.38) 100%)'}} />
      <div style={{position: 'absolute', bottom: 66, width: 1920, textAlign: 'center', opacity: op, filter: op < 1 ? `blur(${(1 - op) * 5}px)` : undefined}}>
        <div
          style={{
            fontFamily: F.subEn,
            fontSize: 44,
            fontWeight: 500,
            letterSpacing: 1.2,
            color: female ? '#FFD3B0' : '#F7F8FC',
            textShadow: shadow,
            padding: '0 160px',
          }}
        >
          {line.en}
        </div>
        <div style={{fontFamily: F.zh, fontSize: 28, fontWeight: 300, letterSpacing: 5, marginTop: 14, color: female ? 'rgba(255,214,184,0.88)' : 'rgba(225,232,248,0.85)', textShadow: shadow}}>{line.zh}</div>
      </div>
    </AbsoluteFill>
  );
};
