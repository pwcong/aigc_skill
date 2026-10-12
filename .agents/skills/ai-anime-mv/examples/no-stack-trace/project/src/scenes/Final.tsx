import {AbsoluteFill, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {ImageBG, Pose} from '../components/Images';
import {Bubble, Phone, Receipt} from '../components/Phone';
import {Window} from '../components/Window';
import {blink, ease, lin, typed} from '../lib/anim';
import {C, F} from '../theme';

// 172.50 – 179.28: dawn, he walks out
export const ShotWalk: React.FC = () => {
  const f = useCurrentFrame();
  const {durationInFrames: d} = useVideoConfig();
  const x = lin(f, 0, d, 380, 1120);
  const bob = Math.abs(Math.sin(f / 7)) * -14;
  return (
    <AbsoluteFill>
      <ImageBG name="bg_dawn_street" from={1.06} to={1.16} panX={-60} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 55% 45%, rgba(255,200,120,0.28), rgba(0,0,0,0) 60%)'}} />
      <Pose name="m_walking_side" height={760} x={x} bottom={110 + bob} glow="rgba(255,190,110,0.8)" />
    </AbsoluteFill>
  );
};

// 179.28 – 197.87: phone — no autocomplete, a real "hi", typos and all, sent 11:41, dots
const T = {kb: 0, hi: 105, typo: 218, sent: 314, dots: 421};
const MSG = 'hi. im sory abt that nigth. can we tlak?';
const TYPOS = ['sory', 'abt', 'nigth', 'tlak'];

export const ShotPhoneFinale: React.FC = () => {
  const f = useCurrentFrame();
  const chips = ['Sounds good!', "I'm sorry 🙏", "Let's talk?"];
  const strike = ease(f, 20, 70);
  const typing = f < T.sent;
  let input = '';
  if (f >= T.hi && f < T.typo) input = 'hi';
  if (f >= T.typo) input = typed(MSG, f, T.typo, 0.55);
  if (!typing) input = '';
  const shakeAmt = f >= T.hi && f < T.typo ? 2.2 : 0;
  const renderInput = () => {
    if (!input) return <span style={{color: C.dim}}>iMessage</span>;
    // underline typos
    const words = input.split(' ');
    return words.map((w, i) => {
      const bad = TYPOS.some((t) => w.replace(/[.?]/g, '') === t);
      return (
        <span key={i} style={{display: 'inline-block', marginRight: 7, textDecoration: bad ? `underline wavy ${C.red}` : undefined, transform: shakeAmt ? `translate(${Math.sin(f * 3 + i) * shakeAmt}px, ${Math.cos(f * 2.5 + i) * shakeAmt}px)` : undefined}}>
          {w}
        </span>
      );
    });
  };
  const sentGlow = ease(f, T.sent, T.sent + 20) * (0.6 + 0.4 * Math.sin(f / 8));
  const warm = ease(f, T.dots, T.dots + 90);
  const footer = (
    <div>
      <div style={{display: 'flex', gap: 8, padding: '10px 14px', borderTop: `1px solid ${C.line}`, opacity: 1 - ease(f, 70, 90)}}>
        {chips.map((c) => (
          <div key={c} style={{flex: 1, textAlign: 'center', padding: '8px 4px', borderRadius: 12, background: '#1B2232', color: C.dim, fontFamily: F.sans, fontSize: 17, position: 'relative'}}>
            {c}
            <div style={{position: 'absolute', left: 6, right: 6, top: '50%', height: 2, background: C.red, transform: `scaleX(${strike})`, transformOrigin: 'left'}} />
          </div>
        ))}
      </div>
      <div style={{margin: '10px 16px 22px', minHeight: 54, borderRadius: 27, border: `1px solid ${C.line}`, padding: '12px 20px', fontFamily: F.sans, fontSize: 22, color: C.text, lineHeight: 1.4}}>
        {renderInput()}
        {typing && input && blink(f) ? <span style={{color: C.blue}}>▍</span> : null}
      </div>
    </div>
  );
  return (
    <AbsoluteFill>
      <ImageBG name="bg_dawn_wide" from={1.05} to={1.12} panX={-120} blur={6} dim={0.25 - warm * 0.15} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 40% 50%, rgba(255,196,107,0.35), rgba(0,0,0,0) 60%)', opacity: warm}} />
      <Phone x={300} y={90} time={f < T.sent ? '11:40' : '11:41'} footer={footer}>
        <Bubble me opacity={0.5}>I didn&apos;t mean it like that</Bubble>
        <Receipt text="Seen 11:40" />
        {f >= T.sent ? <Bubble me opacity={ease(f, T.sent, T.sent + 8)}>{MSG}</Bubble> : null}
        {f >= T.sent ? <Receipt text="Sent 11:41" color={C.gold} glow={sentGlow} /> : null}
        {f >= T.dots ? (
          <Bubble style={{background: '#232A3A', fontSize: 34, letterSpacing: 6, padding: '6px 22px'}}>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{opacity: 0.3 + 0.7 * Math.max(0, Math.sin(f / 5 - i * 0.9))}}>•</span>
            ))}
          </Bubble>
        ) : null}
      </Phone>
      <div style={{position: 'absolute', left: 860, top: 200, fontFamily: F.mono, fontSize: 30, color: C.gold, opacity: f < T.hi ? ease(f, 30, 45) : 1 - ease(f, T.hi, T.hi + 10)}}>autocomplete: off</div>
      <div style={{position: 'absolute', left: 860, top: 250, fontFamily: F.heavy, fontWeight: 800, fontSize: 110, color: '#fff', opacity: f >= T.sent && f < T.dots ? ease(f, T.sent + 6, T.sent + 18) : 0, textShadow: `0 0 50px ${C.gold}`}}>
        Sent 11:41
      </div>
      {f >= T.hi && f < T.typo ? (
        <div style={{position: 'absolute', left: 1050, top: 230, fontFamily: F.sans, fontWeight: 600, fontSize: 260, color: '#fff', opacity: ease(f, T.hi, T.hi + 8) * (1 - ease(f, T.typo - 8, T.typo)), textShadow: `0 0 60px ${C.gold}`, transform: `translate(${Math.sin(f * 2.7) * 5}px, ${Math.cos(f * 3.1) * 5}px)`}}>
          hi
        </div>
      ) : null}
      {f >= T.typo && f < T.sent ? (
        <div style={{position: 'absolute', left: 860, top: 260, width: 900, fontFamily: F.sans, fontSize: 64, lineHeight: 1.35, color: '#fff', textShadow: '0 4px 30px rgba(0,0,0,0.6)', opacity: 1 - ease(f, T.sent - 8, T.sent)}}>
          {typed(MSG, f, T.typo, 0.55)
            .split(' ')
            .map((w, i) => (
              <span key={i} style={{display: 'inline-block', marginRight: 18, textDecoration: TYPOS.includes(w.replace(/[.?]/g, '')) ? `underline wavy ${C.red}` : undefined, textUnderlineOffset: 10}}>
                {w}
              </span>
            ))}
        </div>
      ) : null}
      {f >= T.dots - 10 ? <Pose name="m_smile_phone" height={940} x={1480} bottom={0} glow="rgba(255,190,110,0.85)" style={{opacity: ease(f, T.dots - 10, T.dots + 10)}} /> : null}
    </AbsoluteFill>
  );
};

// 197.87 – 211.2: outro terminal + CLAUDE.md diff + title card
export const ShotOutro: React.FC = () => {
  const f = useCurrentFrame();
  const {durationInFrames: d} = useVideoConfig();
  // timed from the end so the title card always gets ~3s regardless of shot length
  const term = 1 - ease(f, d - 110, d - 90);
  const title = ease(f, d - 100, d - 70) * lin(f, d - 20, d, 1, 0);
  return (
    <AbsoluteFill>
      <ImageBG name="bg_dawn_wide" from={1.12} to={1.18} blur={10} dim={0.55 + ease(f, d - 110, d - 70) * 0.25} />
      <div style={{opacity: term}}>
        <Window title="claude" x={360} y={150} w={1200} bodyStyle={{fontSize: 32}}>
          <div>{typed("> claude, I didn't use your draft.", f, 10, 0.9)}</div>
          <div style={{color: C.orange, marginTop: 18, minHeight: 100}}>
            {f > 60 ? '● ' : ''}
            {typed('Good. Tell me how it goes —', f, 60, 0.8)}
            <br />
            {typed("…well, you'll have to tell me twice.", f, 110, 0.8)}
          </div>
        </Window>
        <Window title="CLAUDE.md — diff" x={360} y={520} w={1200} style={{opacity: ease(f, 180, 195)}} bodyStyle={{fontSize: 32}}>
          <div style={{color: C.dim}}>  - oat milk, no sugar</div>
          <div style={{color: C.dim}}>  - favorite color: blue</div>
          <div style={{color: C.green, background: 'rgba(91,228,155,0.1)'}}>{typed('+ - Some bugs you fix yourself.', f, 200, 0.8)}</div>
        </Window>
      </div>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: title}}>
        <div style={{fontFamily: F.serif, fontSize: 92, color: '#fff', textShadow: `0 0 40px ${C.orange}88`, marginTop: -60}}>No Stack Trace for a Heart</div>
        <div style={{fontFamily: F.zh, fontSize: 46, color: C.orangeSoft, marginTop: 20, letterSpacing: 10}}>心没有报错栈</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
