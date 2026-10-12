import {Config} from '@remotion/cli/config';

// Bundled chrome-headless-shell crashes on this machine (icudtl.dat not found); use system Chrome
Config.setBrowserExecutable('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setConcurrency(8);
