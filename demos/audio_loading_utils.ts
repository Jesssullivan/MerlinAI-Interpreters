/**
 * Utilities for loading audio either from a url or from a file.
 * It is important to remember that Webkit can only create an OfflineAudioContext with
 * a sample rate of 44100. This means that if you want to use Safari and resample audio
 * to something other than 44100, the operation will probably be slow.
 */

import * as ndarray from 'ndarray';
//@ts-ignore
import * as resample from 'ndarray-resample';
import * as logging from './logging';

// Safari Webkit only supports 44.1kHz audio.
const WEBKIT_SAMPLE_RATE = 44100;
const SAMPLE_RATE = 44100;
// tslint:disable-next-line:no-any
const appeaseTsLintWindow = (window as any);
const isSafari = appeaseTsLintWindow.webkitOfflineAudioContext as boolean;
// tslint:disable-next-line:variable-name
const offlineCtx = isSafari ?
    new appeaseTsLintWindow.webkitOfflineAudioContext(
        1, WEBKIT_SAMPLE_RATE, WEBKIT_SAMPLE_RATE) :
    new appeaseTsLintWindow.OfflineAudioContext(1, SAMPLE_RATE, SAMPLE_RATE);

/* Safari doesn't support the Promised format of `offlineCtx.decodeAudioData`
So we'll wrap the callbacks in a Promise.
*/
function decodeAudioData(arrayBuffer : ArrayBuffer){

    if (isSafari){
        return new Promise(resolve => {
            offlineCtx.decodeAudioData(arrayBuffer, (buffer : AudioBuffer) => {
              resolve(buffer);
            });
          });
    }
    else {
        return offlineCtx.decodeAudioData(arrayBuffer);
    }

}

/*
Loads audio from a url.
*/
export async function loadAudioFromURL(url: string) : Promise<AudioBuffer> {
    return fetch(url)
      .then(body => body.arrayBuffer())
      .then(buffer => decodeAudioData(buffer));
}

/*
Loads audio from a file.
*/
export async function loadAudioFromFile(blob: Blob) : Promise<AudioBuffer> {

  const fileReader = new FileReader();
  const loadFile: Promise<ArrayBuffer> = new Promise((resolve, reject) => {
    fileReader.onerror = () => {
      fileReader.abort();
      reject(new DOMException('Something went wrong reading that file.'));
    };
    fileReader.onload = () => {
      resolve(fileReader.result as ArrayBuffer);
    };
    fileReader.readAsArrayBuffer(blob);
  });
  return loadFile.then(arrayBuffer => decodeAudioData(arrayBuffer));

}

/* Returns a Float32Array
*/
export function getMonoAudio(audioBuffer: AudioBuffer) {
    if (audioBuffer.numberOfChannels === 1) {
      return audioBuffer.getChannelData(0);
    }
    if (audioBuffer.numberOfChannels !== 2) {
      throw Error(
          `${audioBuffer.numberOfChannels} channel audio is not supported.`);
    }
    const ch0 = audioBuffer.getChannelData(0);
    const ch1 = audioBuffer.getChannelData(1);

    const mono = new Float32Array(audioBuffer.length);
    for (let i = 0; i < audioBuffer.length; ++i) {
      mono[i] = (ch0[i] + ch1[i]) / 2;
    }
    return mono;
  }

/* Returns a promised Float32Array
*/
export async function resampleAndMakeMono(
      audioBuffer: AudioBuffer, targetSr = SAMPLE_RATE) {

    logging.log(
        // tslint:disable-next-line:max-line-length
        'Resampling source audio from ' + audioBuffer.sampleRate + ' Hz to ' + targetSr + ' Hz.',
        'GVH', logging.Level.INFO);

    if (audioBuffer.sampleRate === targetSr) {
      return getMonoAudio(audioBuffer);
    }
    const sourceSr = audioBuffer.sampleRate;
    const lengthRes = audioBuffer.length * targetSr / sourceSr;
    if (!isSafari) {

      const sourceSr = audioBuffer.sampleRate;
      const lengthRes = audioBuffer.length * targetSr / sourceSr;
      const offlineCtx = new OfflineAudioContext(1, lengthRes, targetSr);
      const bufferSource = offlineCtx.createBufferSource();
      bufferSource.buffer = audioBuffer;
      bufferSource.connect(offlineCtx.destination);
      bufferSource.start();
      return offlineCtx.startRendering().then(
        (buffer: AudioBuffer) => buffer.getChannelData(0));

    } else {
      // Safari does not support resampling with WebAudio.
      logging.log(
          'Safari does not support WebAudio resampling, so this may be slow.',
          'O&F', logging.Level.WARN);

      const originalAudio = getMonoAudio(audioBuffer);
      const resampledAudio = new Float32Array(lengthRes);
      resample(
          ndarray(resampledAudio, [lengthRes]),
          ndarray(originalAudio, [originalAudio.length]));
      return resampledAudio;
    }
  }