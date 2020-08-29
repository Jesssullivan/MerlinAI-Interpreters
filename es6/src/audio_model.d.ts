import * as tf from '@tensorflow/tfjs';
export declare class MerlinAudioModel {
    model: tf.GraphModel;
    labels: string[];
    private sampleRate;
    private patchWindowSeconds;
    private patchHopSeconds;
    private labelsURL;
    private modelURL;
    constructor(labelsURL: string, modelURL: string);
    ensureModelLoaded(): Promise<void>;
    ensureLabelsLoaded(): Promise<void>;
    predict(waveform: Float32Array): Promise<[string, number, number][]>;
    averagePredict(waveform: Float32Array): Promise<(Float32Array | string[] | Uint8Array | Int32Array)[]>;
    averagePredictV2(waveform: Float32Array): Promise<(Float32Array | string[])[]>;
    averagePredictV3(waveform: Float32Array, sampleRate: number): Promise<(Float32Array | string[])[]>;
}
