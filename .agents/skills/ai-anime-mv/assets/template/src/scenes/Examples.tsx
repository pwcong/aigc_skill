// Example motion-graphics shots. Copy/adapt per project — these show the component vocabulary.
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Bubble, Phone, Receipt} from '../components/Phone';
import {Stamp} from '../components/Stamp';
import {Window} from '../components/Window';
import {blink, ease, typed} from '../lib/anim';
import {C, F} from '../theme';

// Terminal typing on black — good cold open
export const TerminalIntro: React.FC<{prompt: string; reply: string}> = ({prompt, reply}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', background: C.ink}}>
      <div style={{fontFamily: F.mono, fontSize: 46, color: C.text, width: 1100}}>
        <div>
          {typed(prompt, f, 8, 0.9)}
          {f < 52 && blink(f) ? '▍' : ''}
        </div>
        <div style={{color: C.orange, marginTop: 26, minHeight: 64}}>{f >= 52 ? <>● {typed(reply, f, 52, 1.5)}{blink(f) ? '▍' : ''}</> : null}</div>
      </div>
    </AbsoluteFill>
  );
};

// Glass window with a code/log body and a stamp landing at the end
export const CodeWindowShot: React.FC<{title: string; lines: string[]; stamp?: string}> = ({title, lines, stamp}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Window title={title} x={260} y={160} w={1400} bodyStyle={{fontSize: 34}}>
        {lines.map((l, i) => (
          <div key={i} style={{opacity: ease(f, 6 + i * 6, 14 + i * 6), color: l.startsWith('+') ? C.green : l.startsWith('-') || l.startsWith('fatal') ? C.red : C.text}}>
            {l}
          </div>
        ))}
      </Window>
      {stamp ? <Stamp text={stamp} color={C.green} at={60} x={1460} y={760} /> : null}
    </AbsoluteFill>
  );
};

// Phone chat with a read receipt
export const ChatShot: React.FC<{messages: string[]; receipt: string}> = ({messages, receipt}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Phone x={300} y={90} time="23:40">
        {messages.map((m, i) => (
          <Bubble key={i} me opacity={ease(f, i * 8, i * 8 + 6)}>
            {m}
          </Bubble>
        ))}
        <Receipt text={receipt} color={C.blueSoft} glow={ease(f, 30, 40)} />
      </Phone>
    </AbsoluteFill>
  );
};
