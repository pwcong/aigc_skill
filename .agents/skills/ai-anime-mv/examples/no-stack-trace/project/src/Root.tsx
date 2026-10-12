import {Composition} from 'remotion';
import {MV} from './MV';
import {MV3} from './MV3';
import {DURATION, FPS} from './lib/timing';

export const Root: React.FC = () => (
  <>
    <Composition id="MV3" component={MV3} durationInFrames={Math.round(DURATION * FPS)} fps={FPS} width={1920} height={1080} />
    <Composition id="MV" component={MV} durationInFrames={Math.round(DURATION * FPS)} fps={FPS} width={1920} height={1080} />
  </>
);
