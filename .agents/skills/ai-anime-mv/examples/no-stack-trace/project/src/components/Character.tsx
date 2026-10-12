import {Img, staticFile, useCurrentFrame} from 'remotion';
import {MALE_STYLE} from '../theme';

type Props = {
  who: 'claude' | 'user';
  view: 'front' | 'side' | 'back';
  height: number;
  x: number; // horizontal center in px
  bottom: number;
  flip?: boolean;
  glow?: string; // rim light color
  opacity?: number;
  float?: number; // float amplitude in px
  scale?: number;
  blur?: number;
  style?: React.CSSProperties;
};

const ASPECT: Record<string, number> = {
  claude_front: 408 / 956,
  claude_side: 342 / 952,
  claude_back: 375 / 954,
  user_front: 469 / 1499,
  user_side: 289 / 1499,
  user_back: 464 / 1499,
};

export const Character: React.FC<Props> = ({who, view, height, x, bottom, flip, glow, opacity = 1, float = 0, scale = 1, blur = 0, style}) => {
  const f = useCurrentFrame();
  const key = `${who}_${view}`;
  const w = height * ASPECT[key];
  const dy = float ? Math.sin(f / 22) * float : 0;
  const breathe = 1 + Math.sin(f / 30) * 0.004;
  const silhouette = who === 'user' && MALE_STYLE === 'silhouette';
  const rim = glow ?? (who === 'claude' ? 'rgba(255,140,60,0.75)' : 'rgba(110,160,255,0.9)');
  const filter = silhouette
    ? `brightness(0.07) saturate(0) drop-shadow(0 0 2px ${rim}) drop-shadow(0 0 16px ${rim})${blur ? ` blur(${blur}px)` : ''}`
    : `drop-shadow(0 0 3px ${rim}) drop-shadow(0 0 22px ${rim})${blur ? ` blur(${blur}px)` : ''}`;
  return (
    <Img
      src={staticFile(`characters/${key}.png`)}
      style={{
        position: 'absolute',
        left: x - w / 2,
        bottom: bottom + dy,
        height,
        width: w,
        opacity,
        filter,
        transform: `scale(${scale * breathe}) scaleX(${flip ? -1 : 1})`,
        transformOrigin: '50% 100%',
        ...style,
      }}
    />
  );
};
