/*
 * `index.ts`:
 * Declares named exports.
 */
const verbose = true;

//@ts-ignore
import AudioRecorder from 'audio-recorder-polyfill';
export {AudioRecorder};

export const log = (msg: string, prefix = 'Merlin:') => {
  if (verbose) {
    const logMethod = console.log;
    logMethod(`%c ${prefix} `, 'background:green; color:white', msg);
  }
};
