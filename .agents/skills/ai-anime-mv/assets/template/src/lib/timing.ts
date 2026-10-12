import analysis from '../data/audio_analysis.json';

export const FPS = 30;
export const DURATION: number = analysis.duration;
export const sec = (s: number) => Math.round(s * FPS);

const beats: number[] = analysis.beats;
const downbeats: number[] = analysis.downbeats;

const lastBefore = (list: number[], t: number) => {
  let lo = 0;
  let hi = list.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const m = (lo + hi) >> 1;
    if (list[m] <= t) {
      ans = m;
      lo = m + 1;
    } else {
      hi = m - 1;
    }
  }
  return ans;
};

// 1 right on a beat, decaying to 0 after `decay` seconds
export const pulse = (t: number, opts: {down?: boolean; decay?: number} = {}) => {
  const list = opts.down ? downbeats : beats;
  const i = lastBefore(list, t);
  if (i < 0) return 0;
  const d = t - list[i];
  const decay = opts.decay ?? 0.25;
  return d < decay ? Math.pow(1 - d / decay, 2) : 0;
};
