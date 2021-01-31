import {Greys} from './greys';
import {log} from "./index";
const FFT = require('fft.js');

const pow = (arr: Float32Array, power: number) => arr.map(v => Math.pow(v, power));

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

export const magSpectrogram = (stft: Float32Array[], power: number): [Float32Array[], number] => {
  const spec = stft.map(fft => pow(mag(fft), power));
  const nFft = stft[0].length - 1;
  return [spec, nFft];
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
 * Given a timeseries, returns an array of timeseries that are windowed
 * according to the params specified.
 */
export const frame = (data: Float32Array, frameLength: number, hopLength: number): Float32Array[] => {
  const bufferCount = Math.floor((data.length - frameLength) / hopLength) + 1;
  const buffers = Array.from(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      {length: bufferCount}, () => new Float32Array(frameLength));
  for (let i = 0; i < bufferCount; i++) {

    const ind = i * hopLength;
    const buffer = data.slice(ind, ind + frameLength);

    buffers[i].set(buffer);

  }
  // In the end, we will likely have an incomplete buffer, which we should
  // just ignore.
  return buffers;
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

const colorMapLookup = (x : number) : number => {

    let i = 1;
    while (Greys[i][0] < x) {
        i = i+1;
    }
    i = i-1;

    const x1 : number = Greys[i][0];
    const x2 : number = Greys[i+1][0];
    const width : number = Math.abs(x1 - x2);
    const scaling_factor = (x - x1) / width;

    const color1 = Greys[i+1][1][0];
    const color2 = Greys[i][1][0];
    return color1 + scaling_factor * (color1 - color2);

};

export const dBSpectrogramToImage = (spec : Float32Array[], topDB : number) : string => {

    const spec_width = spec.length;
    log(spec_width.toString());

    const spec_height_at_zero = spec[0].length;
    log('@ 0 :'  + spec_height_at_zero.toString());

    const spec_height = spec[1].length;
    log('@ 1 :' + spec_height.toString());

    const image_buffer = new Uint8ClampedArray(spec_width * spec_height * 4); // enough bytes for RGBA

    // log("Spec Dimensions: [ " + spec_height + ", " + spec_width + "]");
    // const min_val = Math.min.apply(null, spec.map(arr => Math.min.apply(null, arr)));
    // log("Spec min value: " + min_val);
    // const max_val = Math.max.apply(null, spec.map(arr => Math.max.apply(null, arr)));
    // log("Spec max value: " + max_val);

    for(let y = 0; y < spec_height; y++) {
        for(let x = 0; x < spec_width; x++) {

            let mag = spec[x][(spec_height - 1) - y];
            mag = 1.0 - Math.abs(mag / topDB);      // "White background"

            const pixel_val = colorMapLookup(mag);

            const pos = (y * spec_width + x) * 4;     // position in buffer based on x and y
            image_buffer[pos  ] = pixel_val * 255;  // some R value [0, 255]
            image_buffer[pos+1] = pixel_val * 255;  // some G value
            image_buffer[pos+2] = pixel_val * 255;  // some B value
            image_buffer[pos+3] = 255;              // set alpha channel
        }
    }

    const canvas = document.createElement('canvas'),
    ctx = canvas.getContext('2d');

    canvas.width = spec_width;
    canvas.height = spec_height;

    // create imageData object
    const idata = ctx.createImageData(spec_width, spec_height);

    // set our buffer as source
    idata.data.set(image_buffer);

    // update canvas with new data
    ctx.putImageData(idata, 0, 0);

     // produces a PNG file
    return canvas.toDataURL();

};

export const generateSpectrogramToURI = (waveform : Float32Array) => {

    // Spectrogram Visualization Parameters
    const targetSampleRate = 44100;
    const stftWindowSeconds = 0.015;
    const stftHopSeconds = 0.005;
    const topDB = 80;
    const window_length_samples = Math.round(targetSampleRate * stftWindowSeconds);
    const hop_length_samples = Math.round(targetSampleRate * stftHopSeconds);
    const fft_length = Math.pow(2, Math.ceil(Math.log(window_length_samples) / Math.log(2.0)));

    const spec_params = {
        sampleRate: targetSampleRate,
        hopLength: hop_length_samples,
        winLength: window_length_samples,
        nFft: fft_length,
        topDB
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


    /**
     * Parameters for computing a spectrogram from audio.
     */
    interface SpecParams {
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

    const dBSpectrogram = (y: Float32Array, params: SpecParams): Float32Array[] => {

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

    const dbSpec = dBSpectrogram(waveform, spec_params);
    return dBSpectrogramToImage(dbSpec, topDB);

};

