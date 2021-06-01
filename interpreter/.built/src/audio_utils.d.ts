export declare const fetch_audio: (audio_url: string, targetSampleRate: number) => Promise<{
    waveform: Float32Array;
    sourceSampleRate: number;
}>;
export declare const dBSpectrogram: (y: Float32Array, params: SpecParams) => Float32Array[];
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
export declare const loadAudioFromUrl: (url: string) => Promise<AudioBuffer>;
export declare const loadAudioFromFile: (blob: Blob) => Promise<AudioBuffer>;
export declare const melSpectrogram: (y: Float32Array, params: SpecParams) => Float32Array[];
export declare const powerToDb: (spec: Float32Array[], amin?: number, topDb?: number) => any[];
export declare const getMonoAudio: (audioBuffer: AudioBuffer) => Float32Array;
export declare const resampleAndMakeMono: (audioBuffer: AudioBuffer, targetSr?: number) => Promise<any>;
interface MelParams {
    sampleRate: number;
    nFft?: number;
    nMels?: number;
    fMin?: number;
    fMax?: number;
}
export declare const magSpectrogram: (stft: Float32Array[], power: number) => [Float32Array[], number];
export declare const stft: (y: Float32Array, params: SpecParams) => Float32Array[];
export declare const applyWholeFilterbank: (spec: Float32Array[], filterbank: Float32Array[]) => Float32Array[];
export declare const applyWindow: (buffer: Float32Array, win: Float32Array) => Float32Array;
export declare const padCenterToLength: (data: Float32Array, length: number) => Float32Array;
export declare const padConstant: (data: Float32Array, padding: number | number[]) => Float32Array;
export declare const frame: (data: Float32Array, frameLength: number, hopLength: number) => Float32Array[];
export declare const createMelFilterbank: (params: MelParams) => Float32Array[];
export declare const hannWindow: (length: number) => Float32Array;
export declare const bufferToWave: (buf: AudioBuffer, len: number) => Blob;
export {};
