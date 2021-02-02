import * as  tf from '@tensorflow/tfjs';
//import {log} from './index';

export class MerlinAudioModel {

    model : tf.GraphModel | undefined;
    labels! : string[];

    private sampleRate  = 22050;
    //private minDurationSec : number = 1.0;
    //private stftWindowSeconds : number = 0.025;
    //private stftHopSeconds : number = 0.01;
    private patchWindowSeconds  = 0.96;
    private patchHopSeconds  = 0.48;

    private labelsURL : string;
    private modelURL : string;

    constructor(labelsURL : string, modelURL : string) {

        this.modelURL = modelURL;
        this.labelsURL = labelsURL;

    }

    async ensureModelLoaded() {
        if (this.model != null) {
            return;
        }

        await this.ensureLabelsLoaded();

        this.model = await tf.loadGraphModel(this.modelURL);

        //log('Loaded model!.');
    }

    async ensureLabelsLoaded() {
        if (this.labels != null) {
            return;
        }

        this.labels = await fetch(this.labelsURL)
            .then(response => response.json());

        //log('Loaded ' + this.labels.length + ' labels!.','audio_model.ts');

    }

    async predict(waveform : Float32Array) {

        /* Return the highest score for each frame. */
        await this.ensureModelLoaded();

        const patchWindowLengthSamples = this.patchWindowSeconds * this.sampleRate;
        const patchHopLengthSamples = this.patchHopSeconds * this.sampleRate;

        let tf_waveform = tf.tensor1d(waveform);

        // Make sure we have enough samples to create one spectrogram patch
        if (tf_waveform.shape[0] < patchWindowLengthSamples) {
            tf_waveform = tf_waveform.pad([[0, patchWindowLengthSamples - waveform.length]]);
        }

        // Frame up the waveform and process it sequentially
        const waveform_frames = tf.signal.frame(tf_waveform, patchWindowLengthSamples, patchHopLengthSamples) as tf.Tensor2D;
        const batchResults : Array<[string, number, number]> = [];

        let windowStart = this.patchWindowSeconds / 2.0;

        const batches = tf.data.array(waveform_frames.arraySync());

        await batches.forEachAsync((waveform_batch) => {

            const input_batch = tf.tensor(waveform_batch).expandDims(0);
            const outputs = this.model!.execute(input_batch) as tf.Tensor;

            const scores = outputs.dataSync() as Float32Array;
            const maxIndexTensor = outputs.argMax(-1);
            const maxIndex = maxIndexTensor.dataSync()[0];
            // @ts-ignore
            const maxScore = Math.max(...scores);

            batchResults.push([this.labels[maxIndex], maxScore, windowStart]);
            windowStart += this.patchHopSeconds;

        });

        tf.dispose([tf_waveform, waveform_frames]);

        return batchResults;

    }

    async averagePredictV3(waveform : Float32Array, sampleRate: number) {

        /* Return the average score across all frames. */

        await this.ensureModelLoaded();

        const waveformWindowSizeSeconds = 1.0;
        const waveformWindowHopSeconds = 0.5;
        const ignorePartialLastWindow = true;

        const waveformWindowSizeSamples = sampleRate * waveformWindowSizeSeconds;
        const waveformWindowHopSamples = sampleRate * waveformWindowHopSeconds;

        const totalSamples = waveform.length;

        let numWindows = null;
        if (ignorePartialLastWindow) {
            numWindows = Math.floor(totalSamples / waveformWindowSizeSamples);
        }
        else {
            numWindows = Math.ceil(totalSamples / waveformWindowSizeSamples);
        }

        numWindows = Math.max(1, numWindows);

        // log("Extracting " + numWindows + " windows from audio waveform", "audio_model.ts");

        let curSampleIndex = 0;
        const batchResults : Float32Array[] = [];

        let tf_waveform : tf.Tensor, input_waveform_batch : tf.Tensor, input_samplerate_batch : tf.Tensor, outputs : tf.Tensor;

        for (let i = 0; i < numWindows; i++) {

            const samplePos1 = curSampleIndex;
            const samplePos2 = samplePos1 + waveformWindowSizeSamples;

            tf_waveform = tf.tensor1d(waveform.slice(curSampleIndex, samplePos2));

            // Pad with zeros to ensure we have enough samples to create the spectrogram.
            if (tf_waveform.shape[0] < waveformWindowSizeSamples) {
                // log("Padding waveform with zeros", "audio_model.ts");
                tf_waveform = tf_waveform.pad([[0, waveformWindowSizeSamples - tf_waveform.shape[0]]]);
            }

            const input_waveform_batch = tf_waveform;//.expandDims(0);
            const input_samplerate_batch = tf.tensor1d([sampleRate], 'int32');

            outputs = await this.model?.executeAsync({'waveform' : input_waveform_batch, 'samplerate' : input_samplerate_batch}) as tf.Tensor;

            batchResults.push(outputs.dataSync() as Float32Array);

            curSampleIndex += waveformWindowHopSamples;

        }

        const tf_averageScores = tf.mean(tf.tensor(batchResults), 0);

        tf_averageScores.print();

        const topk = tf.topk(tf_averageScores, this.labels.length, true);

        const scores = topk['values'].dataSync() as Float32Array;
        const indices = topk['indices'].dataSync();
        const labels : string[] = [];

        for (let i=0; i < this.labels.length; i++) {
            labels.push(this.labels[indices[i]]);
        }

        tf.dispose([tf_waveform, input_waveform_batch, input_samplerate_batch, outputs, tf_averageScores, topk]);

        return [labels, scores];

    }

}
