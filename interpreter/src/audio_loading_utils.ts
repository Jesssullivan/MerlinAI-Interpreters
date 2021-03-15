/**
 * Utilities for loading audio either from a url or from a file.
 * It is important to remember that Webkit can only create an OfflineAudioContext with
 * a sample rate of 44100. This means that if you want to use Safari and resample audio
 * to something other than 44100, the operation will probably be slow.
 */

// linters complain about webkit-
/* eslint-disable */

// @ts-ignore
import * as ndarray from 'ndarray';
// @ts-ignore
import * as resample from 'ndarray-resample';

// Safari Webkit only supports 44.1kHz audio.
const WEBKIT_SAMPLE_RATE = 44100;
const SAMPLE_RATE = 44100;
// @ts-ignore
const appeaseTsLintWindow = (window as any);
const isSafari = appeaseTsLintWindow.webkitOfflineAudioContext as boolean;
// tslint:disable-next-line:variable-name
const offlineCtx = isSafari ?
    new appeaseTsLintWindow.webkitOfflineAudioContext(
        1, WEBKIT_SAMPLE_RATE, WEBKIT_SAMPLE_RATE) :
    new appeaseTsLintWindow.OfflineAudioContext(1, SAMPLE_RATE, SAMPLE_RATE);

/* eslint-enable */

/* Safari doesn't support the Promised format of `offlineCtx.decodeAudioData`
So we'll wrap the callbacks in a Promise.
*/
const decodeAudioData = (arrayBuffer : ArrayBuffer) => {

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

};

/*
Loads audio from a url.
*/
export const loadAudioFromURL = async(url: string) =>
    fetch(url)
      .then(body => body.arrayBuffer())
      .then(buffer => decodeAudioData(buffer));

/*
Loads audio from a file.
*/
export const loadAudioFromFile = async(blob: Blob) : Promise<AudioBuffer> => {

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

};

/* Returns a Float32Array
*/
export const getMonoAudio = (audioBuffer: AudioBuffer) => {

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
};

/* Returns a promised Float32Array
*/
export const resampleAndMakeMono = async(audioBuffer: AudioBuffer, targetSr = SAMPLE_RATE) => {

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

        const originalAudio = getMonoAudio(audioBuffer);
        const resampledAudio = new Float32Array(lengthRes);

        resample(
            //@ts-ignore
            ndarray(resampledAudio, [lengthRes]),
            //@ts-ignore
            ndarray(originalAudio, [originalAudio.length]));

        return resampledAudio;

    }
};

/*
 * Refactored utilities here for loading audio and computing mel spectrograms here are based on:
 * {@link https://github.com/google/web-audio-recognition/blob/librosa-compat}.
 *
 * @license
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
