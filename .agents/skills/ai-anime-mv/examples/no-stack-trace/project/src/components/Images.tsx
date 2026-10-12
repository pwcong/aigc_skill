import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

const POSES = {
  m_desk_back: [1321, 1751],
  m_phone_down: [1445, 2201],
  m_walking_side: [1144, 2272],
  m_smile_phone: [1196, 2241],
  c_glass_smile: [1577, 2034],
  c_magnifier: [1518, 2340],
  c_clipboard: [1681, 2250],
  c_threads: [1521, 2385],
  c_turn_back: [1164, 2360],
} as const;
export type PoseName = keyof typeof POSES;

type PoseProps = {
  name: PoseName;
  height: number;
  x: number;
  bottom: number;
  glow?: string;
  flip?: boolean;
  float?: number;
  opacity?: number;
  style?: React.CSSProperties;
};

export const Pose: React.FC<PoseProps> = ({name, height, x, bottom, glow, flip, float = 0, opacity = 1, style}) => {
  const f = useCurrentFrame();
  const [w0, h0] = POSES[name];
  const w = (height * w0) / h0;
  const rim = glow ?? (name.startsWith('c_') ? 'rgba(255,140,60,0.7)' : 'rgba(110,160,255,0.75)');
  return (
    <Img
      src={staticFile(`images/cut/${name}.png`)}
      style={{
        position: 'absolute',
        left: x - w / 2,
        bottom: bottom + (float ? Math.sin(f / 22) * float : 0),
        width: w,
        height,
        opacity,
        filter: `drop-shadow(0 0 3px ${rim}) drop-shadow(0 0 22px ${rim})`,
        transform: `scale(${1 + Math.sin(f / 30) * 0.004}) scaleX(${flip ? -1 : 1})`,
        transformOrigin: '50% 100%',
        ...style,
      }}
    />
  );
};

export type BgName =
  | 'bg_night_desk'
  | 'bg_monitor_close'
  | 'bg_rain_window'
  | 'bg_dawn_street'
  | 'bg_dawn_wide'
  | 'm_face_screen'
  | 'bg_city_night'
  | 'bg_city_rain'
  | 'bg_chorus_warm'
  | 'bg_chorus_red'
  | 'bg_bridge_sky';

// Full-frame still with slow Ken Burns push / pan
export const ImageBG: React.FC<{name: BgName; from?: number; to?: number; panX?: number; panY?: number; dim?: number; blur?: number; origin?: string}> = ({
  name,
  from = 1.02,
  to = 1.1,
  panX = 0,
  panY = 0,
  dim = 0,
  blur = 0,
  origin = '50% 50%',
}) => {
  const f = useCurrentFrame();
  const {durationInFrames: d} = useVideoConfig();
  const p = interpolate(f, [0, d], [0, 1]);
  const s = from + (to - from) * p;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Img
        src={staticFile(`images/bg/${name}.jpg`)}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `translate(${panX * p}px, ${panY * p}px) scale(${s})`,
          transformOrigin: origin,
          filter: blur ? `blur(${blur}px)` : undefined,
        }}
      />
      {dim ? <AbsoluteFill style={{background: '#000', opacity: dim}} /> : null}
    </AbsoluteFill>
  );
};
