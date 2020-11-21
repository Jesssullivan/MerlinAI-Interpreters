/**
 *
 *
 * Refactored utilities for loading audio and computing mel spectrograms, based on
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
export declare function fetch_audio(audio_url: string, targetSampleRate: number): Promise<{
    waveform: Float32Array;
    sourceSampleRate: number;
}>;
export declare function dBSpectrogram(y: Float32Array, params: SpecParams): Float32Array[];
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
export declare function loadAudioFromUrl(url: string): Promise<AudioBuffer>;
/**
 * Loads audio into AudioBuffer from a Blob to transcribe.
 *
 * By default, audio is loaded at 16kHz monophonic for compatibility with
 * model. In Safari, audio must be loaded at 44.1kHz instead.
 *
 * @returns The loaded audio in an AudioBuffer.
 * @param blob
 */
export declare function loadAudioFromFile(blob: Blob): Promise<AudioBuffer>;
export declare function melSpectrogram(y: Float32Array, params: SpecParams): Float32Array[];
/**
 * Convert a power spectrogram (amplitude squared) to decibel (dB) units
 *
 * Intended to match {@link
 * https://librosa.github.io/librosa/generated/librosa.core.power_to_db.html
 * librosa.core.power_to_db}
 * @param spec Input power.
 * @param amin Minimum threshold for `abs(S)`.
 * @param topDb Threshold the output at `topDb` below the peak.
 */
export declare function powerToDb(spec: Float32Array[], amin?: number, topDb?: number): Float32Array[];
export declare function getMonoAudio(audioBuffer: AudioBuffer): Float32Array;
export declare function resampleAndMakeMono(audioBuffer: AudioBuffer, targetSr?: number): Promise<any>;
interface MelParams {
    sampleRate: number;
    nFft?: number;
    nMels?: number;
    fMin?: number;
    fMax?: number;
}
export declare function magSpectrogram(stft: Float32Array[], power: number): [Float32Array[], number];
export declare function stft(y: Float32Array, params: SpecParams): Float32Array[];
export declare function applyWholeFilterbank(spec: Float32Array[], filterbank: Float32Array[]): Float32Array[];
export declare function applyWindow(buffer: Float32Array, win: Float32Array): Float32Array;
export declare function padCenterToLength(data: Float32Array, length: number): Float32Array;
export declare function padConstant(data: Float32Array, padding: number | number[]): Float32Array;
/**
 * Given a timeseries, returns an array of timeseries that are windowed
 * according to the params specified.
 */
export declare function frame(data: Float32Array, frameLength: number, hopLength: number): Float32Array[];
export declare function createMelFilterbank(params: MelParams): Float32Array[];
export declare function hannWindow(length: number): Float32Array;
export {};
