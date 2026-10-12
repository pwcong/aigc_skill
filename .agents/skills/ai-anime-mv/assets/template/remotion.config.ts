import {Config} from '@remotion/cli/config';

// Remotion's bundled chrome-headless-shell can crash on macOS (icudtl.dat not found); system Chrome is reliable
Config.setBrowserExecutable('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setConcurrency(8);
