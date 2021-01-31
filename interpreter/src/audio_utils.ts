
/* eslint-disable */
// @ts-ignore
import * as resample from 'ndarray-resample';
// @ts-ignore
import * as ndarray from 'ndarray';
/* eslint-enable */
import {log} from './index';
const FFT = require('fft.js');

// Safari Webkit only supports 44.1kHz audio.
const WEBKIT_SAMPLE_RATE = 44100;
const SAMPLE_RATE = 22050;

// @ts-ignore
const appeaseTsLintWindow = (window as any);

const isSafari = appeaseTsLintWindow.webkitOfflineAudioContext as boolean;
// tslint:disable-next-line:variable-name
const offlineCtx = isSafari ?
    new appeaseTsLintWindow.webkitOfflineAudioContext(
        1, WEBKIT_SAMPLE_RATE, WEBKIT_SAMPLE_RATE) :
    new appeaseTsLintWindow.OfflineAudioContext(1, SAMPLE_RATE, SAMPLE_RATE);

// Patchup Safari
//@ts-ignore
if (!window.AudioContext && window.webkitAudioContext) {
  //@ts-ignore
  window.AudioContext = window.webkitAudioContext;
  //@ts-ignore
  window.OfflineAudioContext = window.webkitOfflineAudioContext;
}

const resampleWebAudio = (audioBuffer: AudioBuffer, targetSr: number): Promise<AudioBuffer> => {

    const sourceSr = audioBuffer.sampleRate;
    const lengthRes = audioBuffer.length * targetSr / sourceSr;
    const offlineCtx = new OfflineAudioContext(1, lengthRes, targetSr);

    return new Promise((resolve) => {
      const bufferSource = offlineCtx.createBufferSource();
      bufferSource.buffer = audioBuffer;
      offlineCtx.oncomplete = (event) => {
        resolve(event.renderedBuffer);
      };

      bufferSource.connect(offlineCtx.destination);
      bufferSource.start();
      offlineCtx.startRendering();

    });

};

export const fetch_audio = async(audio_url : string, targetSampleRate : number) : Promise<{waveform : Float32Array; sourceSampleRate : number }> => {const audioContext = new window.AudioContext();

  return fetch(audio_url)
        .then(body => body.arrayBuffer())
        .then((arrayBuffer: ArrayBuffer) => {

          if (audioContext.decodeAudioData.length === 2) { // Safari
            return new Promise(resolve => {
              audioContext.decodeAudioData(arrayBuffer, (buffer: AudioBuffer) => {
                resolve(buffer);
              });
            });
          } else {
            return audioContext.decodeAudioData(arrayBuffer);
          }
        })
        // @ts-ignore
        .then((sourceAudioBuffer: AudioBuffer) => {

              const sourceSampleRate = sourceAudioBuffer.sampleRate;
              log("Source Audio Sample Rate: " + sourceSampleRate);

              if (sourceAudioBuffer.sampleRate === targetSampleRate) {
                return {
                  waveform: getMonoAudio(sourceAudioBuffer),
                  sourceSampleRate
                };
              }

              log("Resampling Source Audio to: " + targetSampleRate);

              return resampleWebAudio(sourceAudioBuffer, targetSampleRate).then((resampledSourceAudioBuffer: AudioBuffer) => ({
                  waveform: resampledSourceAudioBuffer.getChannelData(0),
                  sourceSampleRate
                }));
        });
};

const _powerToDb = (spec : Float32Array[], amin = 1e-10, topDb = 80.0) : Float32Array[] => {
  const width = spec.length;
  const height = spec[0].length;
  const logSpec = [];
  for (let i = 0; i < width; i++) {
      logSpec[i] = new Float32Array(height);
  }

  const refValue = Math.max.apply(null, spec.map(arr => Math.max.apply(null, arr)));

  for (let i = 0; i < width; i++) {
      for (let j = 0; j < height; j++) {
          const val = spec[i][j];
          logSpec[i][j] = 10.0 * Math.log10(Math.max(amin, val));
          logSpec[i][j] -= 10.0 * Math.log10(Math.max(amin, refValue));
      }
  }
  if (topDb) {
      if (topDb < 0) {
          throw new Error(`topDb must be non-negative.`);
      }
      // @ts-ignore
      const maxVal = Math.max.apply(null, logSpec.map(arr => Math.max.apply(null, arr)));

      for (let i = 0; i < width; i++) {
          //const maxVal = max(logSpec[i]);
          for (let j = 0; j < height; j++) {
              logSpec[i][j] = Math.max(logSpec[i][j], maxVal - topDb);
          }
      }
  }
  return logSpec;
};

export const dBSpectrogram = (y: Float32Array, params: SpecParams): Float32Array[] => {

    if (!params.power) {
        params.power = 2.0;
    }

    const stftMatrix = stft(y, params);
    const [spec, nFft] = magSpectrogram(stftMatrix, params.power);
    params.nFft = nFft;

    if (!params.topDB) {
      params.topDB = 80.0;
    }

    const amin = 1e-10;
  return _powerToDb(spec, amin, params.topDB);
};

/**
 * Parameters for computing a spectrogram from audio.
 */
export interface SpecParams {
  sampleRate: number;
  hopLength?: number;
  winLength?: number;
  nFft?: number;
  nMels?: number;
  power?: number;
  fMin?: number;
  fMax?: number;
  topDB?: number;
}

/**
 * Loads audio into AudioBuffer from a URL to transcribe.
 *
 * By default, audio is loaded at 16kHz monophonic for compatibility with
 * model. In Safari, audio must be loaded at 44.1kHz instead.
 *
 * @param url A path to a audio file to load.
 * @returns The loaded audio in an AudioBuffer.
 */
export const loadAudioFromUrl = async(url: string): Promise<AudioBuffer> => fetch(url)
      .then(body => body.arrayBuffer())
      .then(buffer => offlineCtx.decodeAudioData(buffer));

/**
 * Loads audio into AudioBuffer from a Blob to transcribe.
 *
 * By default, audio is loaded at 16kHz monophonic for compatibility with
 * model. In Safari, audio must be loaded at 44.1kHz instead.
 *
 * @returns The loaded audio in an AudioBuffer.
 * @param blob
 */
export const loadAudioFromFile = async(blob: Blob): Promise<AudioBuffer> => {
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
  return loadFile.then(arrayBuffer => offlineCtx.decodeAudioData(arrayBuffer));
};

export const melSpectrogram = (y: Float32Array, params: SpecParams): Float32Array[] => {

  if (!params.power) {
    params.power = 2.0;
  }

  const stftMatrix = stft(y, params);
  const [spec, nFft] = magSpectrogram(stftMatrix, params.power);

  params.nFft = nFft;
  const melBasis = createMelFilterbank(params);
  return applyWholeFilterbank(spec, melBasis);

};

/**
 * Convert a power spectrogram (amplitude squared) to decibel (dB) units
 *
 * Intended to match {@link
 * https://librosa.github.io/librosa/generated/librosa.core.power_to_db.html
 * librosa.core.power_to_db}
 *
 * @param spec Input power.
 * @param amin Minimum threshold for `abs(S)`.
 * @param topDb Threshold the output at `topDb` below the peak.
 */
export const powerToDb = (spec: Float32Array[], amin = 1e-10, topDb = 80.0) => {

  const width = spec.length;
  const height = spec[0].length;
  const logSpec = [];

  for (let i = 0; i < width; i++) {
    logSpec[i] = new Float32Array(height);
  }

  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      const val = spec[i][j];
      logSpec[i][j] = 10.0 * Math.log10(Math.max(amin, val));
    }
  }

  if (topDb) {
    if (topDb < 0) {
      throw new Error(`topDb must be non-negative.`);
    }

    for (let i = 0; i < width; i++) {
      const maxVal = max(logSpec[i]);
      for (let j = 0; j < height; j++) {
        logSpec[i][j] = Math.max(logSpec[i][j], maxVal - topDb);
      }
    }
  }

  return logSpec;

};

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

export const resampleAndMakeMono = async(audioBuffer: AudioBuffer, targetSr = SAMPLE_RATE) => {

  if (audioBuffer.sampleRate === targetSr) {
    return getMonoAudio(audioBuffer);
  }

  const sourceSr = audioBuffer.sampleRate;
  const lengthRes = audioBuffer.length * targetSr / sourceSr;

  if (!isSafari) {

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
        // @ts-ignore
        ndarray(resampledAudio, [lengthRes]),
        // @ts-ignore
        ndarray(originalAudio, [originalAudio.length])
    );

    return resampledAudio;
  }
};

interface MelParams {
  sampleRate: number;
  nFft?: number;
  nMels?: number;
  fMin?: number;
  fMax?: number;
}

export const magSpectrogram = (stft: Float32Array[], power: number): [Float32Array[], number] => {
  const spec = stft.map(fft => pow(mag(fft), power));
  const nFft = stft[0].length - 1;
  return [spec, nFft];
};

export const stft = (y: Float32Array, params: SpecParams): Float32Array[] => {
  const nFft = params.nFft || 2048;
  const winLength = params.winLength || nFft;
  const hopLength = params.hopLength || Math.floor(winLength / 4);

  let fftWindow = hannWindow(winLength);

  // Pad the window to be the size of nFft.
  fftWindow = padCenterToLength(fftWindow, nFft);

  // Pad the time series so that the frames are centered.
  y = padReflect(y, Math.floor(nFft / 2));

  // Window the time series.
  const yFrames = frame(y, nFft, hopLength);

  // Pre-allocate the STFT matrix.
  const stftMatrix = [];

  const width = yFrames.length;
  const height = nFft + 2;

  for (let i = 0; i < width; i++) {
    // Each column is a Float32Array of size height.
    stftMatrix[i] = new Float32Array(height);
  }

  for (let i = 0; i < width; i++) {

    // Populate the STFT matrix.
    const winBuffer = applyWindow(yFrames[i], fftWindow);
    const col = fft(winBuffer);

    stftMatrix[i].set(col.slice(0, height));

  }

  return stftMatrix;

};

export const applyWholeFilterbank = (spec: Float32Array[], filterbank: Float32Array[]): Float32Array[] => {
  // Apply a point-wise dot product between the array of arrays.
  const out: Float32Array[] = [];
  for (let i = 0; i < spec.length; i++) {
    out[i] = applyFilterbank(spec[i], filterbank);
  }
  return out;
};

const applyFilterbank = (mags: Float32Array, filterbank: Float32Array[]): Float32Array => {

  if (mags.length !== filterbank[0].length) {
    throw new Error(
        `Each entry in filterbank should have dimensions ` +
        `matching FFT. |mags| = ${mags.length}, ` +
        `|filterbank[0]| = ${filterbank[0].length}.`);
  }

  // Apply each filter to the whole FFT signal to get one value.
  const out = new Float32Array(filterbank.length);
  for (let i = 0; i < filterbank.length; i++) {
    // To calculate filterbank energies we multiply each filterbank with the
    // power spectrum.
    const win = applyWindow(mags, filterbank[i]);
    // Then add up the coefficents.
      // @ts-ignore
    out[i] = win.reduce((a, b) => a + b);
  }
  return out;
};

export const applyWindow = (buffer: Float32Array, win: Float32Array) => {

  if (buffer.length !== win.length) {
    log(
        `Buffer length ${buffer.length} != window length ${win.length}.`);
    return null;
  }

  const out = new Float32Array(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    out[i] = win[i] * buffer[i];
  }
  return out;
};

export const padCenterToLength = (data: Float32Array, length: number) => {
  // If data is longer than length, error!
  if (data.length > length) {
    throw new Error('Data is longer than length.');
  }

  const paddingLeft = Math.floor((length - data.length) / 2);
  const paddingRight = length - data.length - paddingLeft;
  return padConstant(data, [paddingLeft, paddingRight]);
};

export const padConstant = (data: Float32Array, padding: number|number[]) => {
  let padLeft, padRight;
  if (typeof (padding) === 'object') {
    [padLeft, padRight] = padding;
  } else {
    padLeft = padRight = padding;
  }
  const out = new Float32Array(data.length + padLeft + padRight);
  out.set(data, padLeft);
  return out;
};

const padReflect = (data: Float32Array, padding: number) => {
  const out = padConstant(data, padding);
  for (let i = 0; i < padding; i++) {
    // Pad the beginning with reflected values.
    out[i] = out[2 * padding - i];
    // Pad the end with reflected values.
    out[out.length - i - 1] = out[out.length - 2 * padding + i - 1];
  }
  return out;
};

/**
 * Given a timeseries, returns an array of timeseries that are windowed
 * according to the params specified.
 */
export const frame = (data: Float32Array, frameLength: number, hopLength: number): Float32Array[] => {
  const bufferCount = Math.floor((data.length - frameLength) / hopLength) + 1;
  const buffers = Array.from(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      {length: bufferCount}, (x, i) => new Float32Array(frameLength));
  for (let i = 0; i < bufferCount; i++) {

    const ind = i * hopLength;
    const buffer = data.slice(ind, ind + frameLength);

    buffers[i].set(buffer);

  }

  // In the end, we will likely have an incomplete buffer, which we should
  // just ignore.

  return buffers;

};

export const createMelFilterbank = (params: MelParams): Float32Array[] => {

  const fMin = params.fMin || 0;
  const fMax = params.fMax || params.sampleRate / 2;
  const nMels = params.nMels || 128;
  const nFft = params.nFft || 2048;

  // Center freqs of each FFT band.
  const fftFreqs = calculateFftFreqs(params.sampleRate, nFft);

  // (Pseudo) center freqs of each Mel band.
  const melFreqs = calculateMelFreqs(nMels + 2, fMin, fMax);

  const melDiff = internalDiff(melFreqs);
  const ramps = outerSubtract(melFreqs, fftFreqs);
  const filterSize = ramps[0].length;

  const weights = [];

  for (let i = 0; i < nMels; i++) {
    weights[i] = new Float32Array(filterSize);
    for (let j = 0; j < ramps[i].length; j++) {
      const lower = -ramps[i][j] / melDiff[i];
      const upper = ramps[i + 2][j] / melDiff[i + 1];
      weights[i][j] = Math.max(0, Math.min(lower, upper));
    }
  }

  // Slaney-style mel is scaled to be approx constant energy per channel.
  for (let i = 0; i < weights.length; i++) {
    // How much energy per channel.
    const enorm = 2.0 / (melFreqs[2 + i] - melFreqs[i]);
    // Normalize by that amount.
    weights[i] = weights[i].map(val => val * enorm);
  }

  return weights;
};

const fft = (y: Float32Array) => {
  const fft = new FFT(y.length);
  const out = fft.createComplexArray();
  const data = fft.toComplexArray(y, null);
  fft.transform(out, data);
  return out;
};

export const hannWindow = (length: number) => {

  const win = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    win[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (length - 1)));
  }
  return win;
};

const linearSpace = (start: number, end: number, count: number) => {
  // Include start and endpoints.
  const delta = (end - start) / (count - 1);
  const out = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    out[i] = start + delta * i;
  }
  return out;
};

/*
 * Given an interlaced complex array (y_i is real, y_(i+1) is imaginary),
 * calculates the energies. Output is half the size.
 */
const mag = (y: Float32Array) => {
  const out = new Float32Array(y.length / 2);
  for (let i = 0; i < y.length / 2; i++) {
    out[i] = Math.sqrt(y[i * 2] * y[i * 2] + y[i * 2 + 1] * y[i * 2 + 1]);
  }
  return out;
};

const hzToMel = (hz: number): number => 1125.0 * Math.log(1 + hz / 700.0);


const melToHz = (mel: number): number => 700.0 * (Math.exp(mel / 1125.0) - 1);


const calculateFftFreqs = (sampleRate: number, nFft: number) => linearSpace(0, sampleRate / 2, Math.floor(1 + nFft / 2));

const calculateMelFreqs = (nMels: number, fMin: number, fMax: number): Float32Array => {

  const melMin = hzToMel(fMin);
  const melMax = hzToMel(fMax);

  // Construct linearly spaced array of nMel intervals, between melMin and
  // melMax.
  const mels = linearSpace(melMin, melMax, nMels);
  return mels.map(mel => melToHz(mel));
};

const internalDiff = (arr: Float32Array): Float32Array => {
  const out = new Float32Array(arr.length - 1);
  for (let i = 0; i < arr.length; i++) {
    out[i] = arr[i + 1] - arr[i];
  }
  return out;
};

const outerSubtract = (arr: Float32Array, arr2: Float32Array): Float32Array[] => {

  const out = [];

  for (let i = 0; i < arr.length; i++) {
    out[i] = new Float32Array(arr2.length);
  }

  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr2.length; j++) {
      out[i][j] = arr[i] - arr2[j];
    }
  }
  return out;
};

const pow = (arr: Float32Array, power: number) => arr.map(v => Math.pow(v, power));

const max = (arr: Float32Array) => arr.reduce((a, b) => Math.max(a, b));


export const bufferToWave = (buf: AudioBuffer, len: number) => {
  let numOfChan = buf.numberOfChannels,
      length = len * numOfChan * 2 + 44,
      buffer = new ArrayBuffer(length),
      view = new DataView(buffer),
      channels = [], i, sample,
      offset = 0,
      pos = 0;

  // write .wav header
  setUint32(0x46464952);                         // "RIFF"
  setUint32(length - 8);                         // file length - 8
  setUint32(0x45564157);                         // "WAVE"

  setUint32(0x20746d66);                         // "fmt " chunk
  setUint32(16);                                 // length = 16
  setUint16(1);                                  // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(buf.sampleRate);
  setUint32(buf.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2);                      // block-align
  setUint16(16);                                 // 16-bit (hardcoded in this demo)

  setUint32(0x61746164);                         // "data" - chunk
  setUint32(length - pos - 4);                   // chunk length

  // write interleaved data
  for (i = 0; i < buf.numberOfChannels; i++)
    channels.push(buf.getChannelData(i));

  while(pos < length) {
    for(i = 0; i < numOfChan; i++) {             // interleave channels
      sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0; // scale to 16-bit signed int
      view.setInt16(pos, sample, true);          // write 16-bit sample
      pos += 2;
    }
    offset++                                     // next source sample
  }

  // create Blob
  return new Blob([buffer], {type: "audio/wav"});

  function setUint16(data) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}

/**
 *
 * Refactored sources include:
 * https://www.russellgood.com/how-to-convert-audiobuffer-to-audio-file/
 *
 * Refactored utilities for loading audio and computing mel spectrograms, based on
 * {@link https://github.com/google/web-audio-recognition/blob/librosa-compat}.
 *
 * Refactored utilities for loading audio and computing mel spectrograms include
 * code based on google audio code:
 *
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
