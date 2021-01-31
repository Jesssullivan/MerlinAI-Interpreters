/*
 * `index.ts`:
 * Declares named exports.
 * exports verbose logger.
 */
const verbose = true;

import * as audio_loader from './audio_loading_utils';
import * as audio_utils from './audio_utils';
import * as spectrogram_utils from './spectrogram_utils';
import * as audio_model from './audio_model';
import * as ui_utils from './ui_utils';

//@ts-ignore
const tf = require('@tensorflow/tfjs');
export {tf};

//@ts-ignore
import AudioRecorder from 'audio-recorder-polyfill';
export {AudioRecorder};

export {
    audio_model,
    audio_loader,
    audio_utils,
    spectrogram_utils,
    ui_utils
};

export const log = (msg: string, prefix = 'Merlin:') => {
  if (verbose) {
    const logMethod = console.log;
    logMethod(`%c ${prefix} `, 'background:green; color:white', msg);
  }
};
