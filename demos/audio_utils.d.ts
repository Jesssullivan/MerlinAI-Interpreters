export declare function fetch_audio(audio_url: string, targetSampleRate: number): Promise<{
    waveform: Float32Array;
    sourceSampleRate: number;
}>;
export declare function dBSpectrogram(y: Float32Array, params: SpecParams): Float32Array[];
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
export declare function loadAudioFromUrl(url: string): Promise<AudioBuffer>;
export declare function loadAudioFromFile(blob: Blob): Promise<AudioBuffer>;
export declare function melSpectrogram(y: Float32Array, params: SpecParams): Float32Array[];
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
export declare function frame(data: Float32Array, frameLength: number, hopLength: number): Float32Array[];
export declare function createMelFilterbank(params: MelParams): Float32Array[];
export declare function hannWindow(length: number): Float32Array;
export {};
