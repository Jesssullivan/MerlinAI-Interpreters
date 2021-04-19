export declare const padConstant: (data: Float32Array, padding: number | number[]) => Float32Array;
export declare const magSpectrogram: (stft: Float32Array[], power: number) => [Float32Array[], number];
export declare const hannWindow: (length: number) => Float32Array;
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
export declare const frame: (data: Float32Array, frameLength: number, hopLength: number) => Float32Array[];
export declare const applyWindow: (buffer: Float32Array, win: Float32Array) => Float32Array;
export declare const padCenterToLength: (data: Float32Array, length: number) => Float32Array;
export declare const stft: (y: Float32Array, params: SpecParams) => Float32Array[];
export declare const dBSpectrogramToImage: (spec: Float32Array[], topDB: number) => string;
export declare const generateSpectrogramToURI: (waveform: Float32Array) => string;
