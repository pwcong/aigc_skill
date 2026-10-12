import {Easing, interpolate} from 'remotion';

export type Trans = 'cut' | 'dissolve' | 'zoom' | 'glitch' | 'blur' | 'leak' | 'flash' | 'slide';

// overlap frames: incoming shot starts on its beat, the outgoing one lingers this long
export const OV: Record<Trans, number> = {cut: 0, dissolve: 10, zoom: 8, glitch: 5, blur: 14, leak: 14, flash: 8, slide: 8};

export const smooth = (x: number) => interpolate(x, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});

export const enterStyle = (t: Trans, p: number, f: number): React.CSSProperties => {
  const e = smooth(p);
  switch (t) {
    case 'zoom':
      return {opacity: e, transform: `scale(${1.25 - 0.25 * e})`, filter: `blur(${(1 - e) * 14}px)`};
    case 'blur':
    case 'leak':
      return {opacity: e, filter: `blur(${(1 - e) * 18}px)`, transform: `scale(${1.04 - 0.04 * e})`};
    case 'slide':
      return {opacity: e, transform: `translateX(${(1 - e) * 260}px)`, filter: `blur(${(1 - e) * 10}px)`};
    case 'glitch': {
      const j = p < 1 ? Math.sin(f * 12.9) * 40 * (1 - p) : 0;
      return {opacity: p < 1 ? (f % 2 ? 0.4 : 1) : 1, transform: `translateX(${j}px)`, filter: p < 1 ? `hue-rotate(${(1 - p) * 90}deg) saturate(${1 + (1 - p) * 2})` : undefined};
    }
    case 'flash':
      return {opacity: e, transform: `scale(${1.08 - 0.08 * e})`};
    case 'dissolve':
      return {opacity: e, transform: `scale(${1.02 - 0.02 * e})`};
    default:
      return {};
  }
};

export const exitStyle = (t: Trans, p: number): React.CSSProperties => {
  const e = smooth(p);
  switch (t) {
    case 'zoom':
      return {opacity: 1 - e, transform: `scale(${1 + 0.35 * e})`, filter: `blur(${e * 14}px)`};
    case 'blur':
    case 'leak':
      return {opacity: 1 - e, filter: `blur(${e * 18}px)`};
    case 'slide':
      return {opacity: 1 - e, transform: `translateX(${-e * 260}px)`, filter: `blur(${e * 10}px)`};
    default:
      return {opacity: 1 - e};
  }
};
