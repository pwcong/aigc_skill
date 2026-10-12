import {Easing, interpolate} from 'remotion';

const CL = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const ease = (f: number, a: number, b: number, from = 0, to = 1, easing = Easing.out(Easing.cubic)) =>
  interpolate(f, [a, b], [from, to], {...CL, easing});

export const lin = (f: number, a: number, b: number, from = 0, to = 1) => interpolate(f, [a, b], [from, to], CL);

export const fadeInOut = (f: number, dur: number, inF = 8, outF = 8) => {
  const a = inF > 0 ? Math.min(1, f / inF) : 1;
  const b = outF > 0 ? Math.min(1, (dur - f) / outF) : 1;
  return Math.max(0, Math.min(a, b));
};

// characters per frame typing
export const typed = (text: string, f: number, start: number, cpf = 0.8) =>
  text.slice(0, Math.max(0, Math.floor((f - start) * cpf)));

export const blink = (f: number, period = 30) => Math.floor(f / (period / 2)) % 2 === 0;

// Scripted typing with deletes and pauses
export type TypeStep = {type: string; cpf?: number} | {del: number; cpf?: number} | {pause: number};
export const typeScript = (steps: TypeStep[], f: number) => {
  let text = '';
  let t = 0;
  for (const s of steps) {
    if ('pause' in s) {
      t += s.pause;
      if (f < t) return text;
    } else if ('type' in s) {
      const cpf = s.cpf ?? 0.6;
      const need = s.type.length / cpf;
      if (f < t + need) return text + s.type.slice(0, Math.floor((f - t) * cpf));
      text += s.type;
      t += need;
    } else {
      const cpf = s.cpf ?? 1.5;
      const need = s.del / cpf;
      if (f < t + need) return text.slice(0, text.length - Math.floor((f - t) * cpf));
      text = text.slice(0, text.length - s.del);
      t += need;
    }
  }
  return text;
};
