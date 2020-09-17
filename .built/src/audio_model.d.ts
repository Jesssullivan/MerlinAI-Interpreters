import * as tf from '@tensorflow/tfjs';
export declare class MerlinAudioModel {
    model: tf.GraphModel | undefined;
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
    averagePredictV3(waveform: Float32Array, sampleRate: number): Promise<(Float32Array | string[])[]>;
}
