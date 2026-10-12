import {Composition} from 'remotion';
import {MV} from './MV';
import {DURATION, FPS} from './lib/timing';

// 16:9 = 1920x1080 (YouTube/B站), 9:16 = 1080x1920 (抖音/小红书竖屏)
export const ASPECT: '16:9' | '9:16' = '16:9';
const [W, H] = ASPECT === '16:9' ? [1920, 1080] : [1080, 1920];

export const Root: React.FC = () => <Composition id="MV" component={MV} durationInFrames={Math.round(DURATION * FPS)} fps={FPS} width={W} height={H} />;
