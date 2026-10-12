import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Bubble} from '../components/Phone';
import {Stamp} from '../components/Stamp';
import {blink, ease, typeScript} from '../lib/anim';
import {C, F} from '../theme';

export const RollbackStamp: React.FC = () => <Stamp text="ROLLBACK ✓" color={C.green} at={58} x={1460} y={820} />;

export const CheckStamp: React.FC = () => <Stamp text="✓" color={C.green} at={14} x={420} y={420} size={96} rotate={-10} />;

// chat input over the typing hands
export const TypingBar: React.FC = () => {
  const f = useCurrentFrame();
  const text = typeScript([{pause: 10}, {type: 'hey, quick q', cpf: 0.6}, {pause: 14}, {del: 12, cpf: 1.8}, {pause: 8}, {type: 'She stopped replying Tuesday.', cpf: 0.55}], f);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 460, top: 800, width: 1000, height: 92, borderRadius: 46, background: 'rgba(14,18,32,0.78)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', padding: '0 36px', fontFamily: F.sans, fontSize: 30, color: C.text, opacity: ease(f, 0, 12)}}>
        {text || <span style={{color: C.dim}}>Message Claude…</span>}
        {blink(f) ? <span style={{color: C.orange}}>▍</span> : null}
      </div>
    </AbsoluteFill>
  );
};

// her side starts typing — over the final smile shot
export const DotsBubble: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 150, top: 640, opacity: ease(f, 10, 24), transform: `translateY(${ease(f, 10, 24, 20, 0)}px)`}}>
        <div style={{fontFamily: F.sans, fontSize: 22, color: 'rgba(255,255,255,0.8)', marginBottom: 10, textShadow: '0 2px 10px rgba(0,0,0,0.6)'}}>her</div>
        <Bubble style={{background: 'rgba(35,42,58,0.9)', fontSize: 44, letterSpacing: 8, padding: '6px 26px'}}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{opacity: 0.3 + 0.7 * Math.max(0, Math.sin(f / 5 - i * 0.9))}}>•</span>
          ))}
        </Bubble>
      </div>
    </AbsoluteFill>
  );
};
