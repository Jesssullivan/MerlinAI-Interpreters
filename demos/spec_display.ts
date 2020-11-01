
//import * as tf from '@tensorflow/tfjs';

import {audio_model, audio_utils} from '../src/index';

//@ts-ignore
import {Greys} from './greys';

const CONFIG = {
    SAMPLE_RATE : 48000,
    STFT_WINDOW_SECONDS : 0.015,
    STFT_HOP_SECONDS : 0.005,
    MEL_SCALE : false,
    MEL_BANDS : 96 * 3,
    MEL_MIN_HZ : 500,
    MEL_MAX_HZ : 12000,
    LOG_OFFSET : 0.001,
    TOP_DB : 80,
    TIME_SCALE : 1.0,
    SPEC_HEIGHT_PIXELS : 100
};

function powerToDb(spec : Float32Array[], amin = 1e-10, topDb = 80.0) {
    const width = spec.length;
    const height = spec[0].length;
    const logSpec = [];
    for (let i = 0; i < width; i++) {
        logSpec[i] = new Float32Array(height);
    }

    // @ts-ignore
    const refValue = Math.max.apply(null, spec.map(arr => Math.max.apply(null, arr)));
    console.log("Ref Value: " + refValue);
    //refValue = 10.0;

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
}

function make_spectrogram(waveform : Float32Array){

    const window_length_samples = Math.round(CONFIG.SAMPLE_RATE * CONFIG.STFT_WINDOW_SECONDS);
    const hop_length_samples = Math.round(CONFIG.SAMPLE_RATE * CONFIG.STFT_HOP_SECONDS);
    const fft_length = Math.pow(2, Math.ceil(Math.log(window_length_samples) / Math.log(2.0)));
    const num_spectrogram_bins = Math.floor(fft_length / 2) + 1;

    console.log("STFT params:");
    console.log("Window length samples: " + window_length_samples);
    console.log("Window hop samples: " + hop_length_samples);
    console.log("FFT length: " + fft_length);
    console.log("Num freq bins: " + num_spectrogram_bins);

    const spec_params = {
        sampleRate: CONFIG.SAMPLE_RATE,
        hopLength: hop_length_samples,
        winLength: window_length_samples,
        nMels: CONFIG.MEL_BANDS,
        nFft: fft_length,
        fMin: CONFIG.MEL_MIN_HZ,
        fMax: CONFIG.MEL_MAX_HZ,
    };

    const stftMatrix = audio_utils.stft(waveform, spec_params);

    const power = 2.0;
    // tslint:disable-next-line:prefer-const
    let [spec, nFft] = audio_utils.magSpectrogram(stftMatrix, power);

    // const amin = 1e-10
    // const topDb = 80.0
    // spec = core.audio_utils.powerToDb(spec, amin, topDb);

    if (CONFIG.MEL_SCALE){
        spec_params.nFft = nFft;
        const melBasis = audio_utils.createMelFilterbank(spec_params);
        spec = audio_utils.applyWholeFilterbank(spec, melBasis);
    }

    //const transformed_mel_spec = magnitude_transform(spec);
    const amin = 1e-10;
    const topDb = CONFIG.TOP_DB;
    //const transformed_mel_spec = core.audio_utils.powerToDb(spec, amin, topDb);
    const transformed_mel_spec = powerToDb(spec, amin, topDb);
    // let transformed_mel_spec = mel_spec;

    //const normalized_spec = spectrogram_normalization(transformed_mel_spec)

    return transformed_mel_spec;

}

function enforceBounds(x : number) {
    if (x < 0) {
        return 0;
    } else if (x > 1){
        return 1;
    } else {
        return x;
    }
}

// Split values into four lists
const values = Greys;
const x_values : number[] = [];
const r_values : number[] = [];
const g_values : number[] = [];
const b_values : number[] = [];
for (const i in values) {
    x_values.push(values[i][0] as number);
    r_values.push(values[i][1][0]);
    g_values.push(values[i][1][1]);
    b_values.push(values[i][1][2]);
}
function interpolateLinearly(x : number) {

    let i = 1;
    while (x_values[i] < x) {
        i = i+1;
    }
    i = i-1;

    const width = Math.abs(x_values[i] - x_values[i+1]);
    const scaling_factor = (x - x_values[i]) / width;

    // Get the new color values though interpolation
    const r = r_values[i] + scaling_factor * (r_values[i+1] - r_values[i]);
    const g = g_values[i] + scaling_factor * (g_values[i+1] - g_values[i]);
    const b = b_values[i] + scaling_factor * (b_values[i+1] - b_values[i]);

    return [enforceBounds(r), enforceBounds(g), enforceBounds(b)];

}

function make_image_from_spectrogram(spec : Float32Array[]){
    /*
    spec should be between 0 and -80
    // this isn't true...
    */

    const spec_width = spec.length;
    const spec_height = spec[0].length;
    const image_buffer = new Uint8ClampedArray(spec_width * spec_height * 4); // enough bytes for RGBA

    console.log("Spec Dimensions: [ " + spec_height + ", " + spec_width + "]");

    // @ts-ignore
    const min_val = Math.min.apply(null, spec.map(arr => Math.min.apply(null, arr)));
    console.log("Spec min value: " + min_val);

    // @ts-ignore
    const max_val = Math.max.apply(null, spec.map(arr => Math.max.apply(null, arr)));
    console.log("Spec max value: " + max_val);

    //
    for(let y = 0; y < spec_height; y++) {
        for(let x = 0; x < spec_width; x++) {

            let mag = spec[x][(spec_height - 1) - y];
            //console.log(mag);
            //let pixel_val = Math.round(lerp(0, 255, Math.abs(mag) / 80.));
            //let pixel_val = Math.round(lerp(0, 255, mag));
            //pixel_val = 255 - pixel_val;
            //console.log(mag);
            mag = 1.0 - Math.abs(mag / CONFIG.TOP_DB);
            //console.log(mag);
            //let color_index = Math.round(lerp(0, 255, mag));
            //let pixel_val = Greys[color_index][1];
            const pixel_val = interpolateLinearly(mag);
            //console.log(pixel_val);
            const pos = (y * spec_width + x) * 4; // position in buffer based on x and y
            image_buffer[pos  ] = pixel_val[0] * 255;           // some R value [0, 255]
            image_buffer[pos+1] = pixel_val[1] * 255;           // some G value
            image_buffer[pos+2] = pixel_val[2] * 255;           // some B value
            image_buffer[pos+3] = 255;           // set alpha channel
        }
    }

    //let desired_height = 220;
    //let s = desired_height / spec_height;
    //let desired_width = Math.round(spec_width * s);

    const canvas = document.createElement('canvas'),
    ctx = canvas.getContext('2d');

    canvas.width = spec_width;
    canvas.height = spec_height;

    // create imageData object
    const idata = ctx!.createImageData(spec_width, spec_height);

    // set our buffer as source
    idata.data.set(image_buffer);

    // update canvas with new data
    ctx!.putImageData(idata, 0, 0);//, 0, 0, desired_width, desired_height);

     // produces a PNG file:
    return canvas.toDataURL();
}

function renderWaveform(waveform : Float32Array){
    console.log("success making waveform.");
    console.log("Audio Duration Seconds: " + waveform.length / CONFIG.SAMPLE_RATE);

    const mel_spectrogram = make_spectrogram(waveform);

    console.log("success making spectrogram.");

    const specDataUri = make_image_from_spectrogram(mel_spectrogram);

    console.log("success making image.");

    // render the (scaled) spectrogram

    const image_height = CONFIG.SPEC_HEIGHT_PIXELS;
    const scale = 1.0; //mel_spectrogram[0].length / image_height;
    const image_width = Math.round((mel_spectrogram.length / scale) * CONFIG.TIME_SCALE);

    const img = document.createElement('img');
    img.src = specDataUri;
    img.height = image_height;
    img.width =  image_width;
    console.log("Image Dims: [ " + image_height + ", " + image_width + "]");

    // Clear out previous images
    const specHolderEl = document.getElementById('specHolder');
    while (specHolderEl!.firstChild) {
        specHolderEl!.removeChild(specHolderEl!.firstChild);
    }

    // Add the spectrogram
    specHolderEl!.appendChild(img);

}

const MODEL_URL = 'models/audio/model.json';
const LABELS_URL = 'models/audio/labels.json';

const merlinAudio = new audio_model.MerlinAudioModel(LABELS_URL, MODEL_URL);

async function classifyWaveform(waveform : Float32Array){

    const results = await merlinAudio.predict(waveform);

    results.forEach(result => {
        console.log(result);
    });

}

function parseSpectrogramConfigs(){

    const inputTargetSampleRate = document.getElementById("inputTargetSampleRate") as HTMLInputElement;
    // tslint:disable-next-line:radix
    const targetSampleRate = parseInt(inputTargetSampleRate.value || inputTargetSampleRate.placeholder);
    //targetSampleRate = parseInt(targetSampleRate);

    const inputSTFTWindowSeconds = document.getElementById("inputSTFTWindowSeconds") as HTMLInputElement;
    const stftWindowSeconds = parseFloat(inputSTFTWindowSeconds.value || inputSTFTWindowSeconds.placeholder);
    //stftWindowSeconds = parseFloat(stftWindowSeconds);

    const inputSTFTHopSeconds = document.getElementById("inputSTFTHopSeconds") as HTMLInputElement;
    const stftHopSeconds = parseFloat(inputSTFTHopSeconds.value || inputSTFTHopSeconds.placeholder);
    //stftHopSeconds = parseFloat(stftHopSeconds);

    const inputDoMELScaling = document.getElementById("inputDoMELScaling") as HTMLInputElement;
    const doMELScaling = inputDoMELScaling.checked;

    const inputMELBands = document.getElementById("inputMELBands") as HTMLInputElement;
    // tslint:disable-next-line:radix
    const melBands = parseInt(inputMELBands.value || inputMELBands.placeholder);
    //melBands = parseInt(melBands);

    const inputMELMinHZ = document.getElementById("inputMELMinHZ") as HTMLInputElement;
    // tslint:disable-next-line:radix
    const melMinHz = parseInt(inputMELMinHZ.value || inputMELMinHZ.placeholder);
    //melMinHz = parseInt(melMinHz);

    const inputMELMaxHZ = document.getElementById("inputMELMaxHZ") as HTMLInputElement;
    // tslint:disable-next-line:radix
    const melMaxHz = parseInt(inputMELMaxHZ.value || inputMELMaxHZ.placeholder);
    //melMaxHz = parseInt(melMaxHz);

    const inputTopDB = document.getElementById("inputTopDB") as HTMLInputElement;
    // tslint:disable-next-line:radix
    const topDB = parseInt(inputTopDB.value || inputTopDB.placeholder);
    //topDB = parseInt(topDB);

    const inputTimeScale = document.getElementById("inputTimeScale") as HTMLInputElement;
    const timeScale = parseFloat(inputTimeScale.value || inputTimeScale.placeholder);
    //timeScale = parseFloat(timeScale);

    const inputSpecHeightPixels = document.getElementById("inputSpecHeightPixels") as HTMLInputElement;
    // tslint:disable-next-line:radix
    const specHeightPixels = parseInt(inputSpecHeightPixels.value || inputSpecHeightPixels.placeholder);
    //specHeightPixels = parseInt(specHeightPixels);

    return {
        targetSampleRate,
        stftWindowSeconds,
        stftHopSeconds,
        doMELScaling,
        melBands,
        melMinHz,
        melMaxHz,
        topDB,
        timeScale,
        specHeightPixels
    };

}

const CACHED_ASSET_DATA = {
    assetID : null as unknown as number,
    sourceSampleRate : null as unknown as number,
    waveform : null as unknown as Float32Array,
    targetSampleRate : null as unknown as number
};

function generateSpectrogram(){
    console.log("Generating Spectrogram");

    const inputAssetID = document.getElementById("inputAssetID") as HTMLInputElement;
    // tslint:disable-next-line:radix
    const assetID = parseInt(inputAssetID.value || inputAssetID.placeholder);

    const specConfigs = parseSpectrogramConfigs();
    const targetSampleRate = specConfigs.targetSampleRate;
    // @ts-ignore
    let waveform : Float32Array = null;

    if (CACHED_ASSET_DATA != null){

        if (CACHED_ASSET_DATA.assetID === assetID){

            if (CACHED_ASSET_DATA.targetSampleRate === targetSampleRate){
                // we can reuse the waveform
                waveform = CACHED_ASSET_DATA.waveform;
            }
        }
    }

    CACHED_ASSET_DATA!.assetID = assetID;
    CACHED_ASSET_DATA!.targetSampleRate = targetSampleRate;

    CONFIG.SAMPLE_RATE = specConfigs.targetSampleRate;
    CONFIG.STFT_WINDOW_SECONDS = specConfigs.stftWindowSeconds;
    CONFIG.STFT_HOP_SECONDS = specConfigs.stftHopSeconds;
    CONFIG.MEL_SCALE = specConfigs.doMELScaling;
    CONFIG.MEL_BANDS = specConfigs.melBands;
    CONFIG.MEL_MIN_HZ = specConfigs.melMinHz;
    CONFIG.MEL_MAX_HZ = specConfigs.melMaxHz;
    CONFIG.TOP_DB = specConfigs.topDB;
    CONFIG.TIME_SCALE = specConfigs.timeScale;
    CONFIG.SPEC_HEIGHT_PIXELS = specConfigs.specHeightPixels;

    if (waveform == null) {

        console.log("Downloading audio file");
        const asset_url = "https://download.ams.birds.cornell.edu/api/v1/asset/" + assetID + "/audio";

        audio_utils.fetch_audio(asset_url, targetSampleRate).then((audioData) => {

            console.log("Generated waveform");

            CACHED_ASSET_DATA.waveform = audioData.waveform;
            CACHED_ASSET_DATA.sourceSampleRate = audioData.sourceSampleRate;

            // console.log(CACHED_ASSET_DATA);

            renderWaveform(audioData.waveform);

             //const start_sec = 1.2;
            classifyWaveform(audioData.waveform);

        });

    }

    else {

        console.log("Reusing cached audio file");

        // console.log(CACHED_ASSET_DATA);

        //const start_sec = 1.4;
        //const end_sec = start_sec + 1;

        renderWaveform(waveform);
        classifyWaveform(waveform);//.slice(Math.round(CONFIG.SAMPLE_RATE * start_sec), Math.round(CONFIG.SAMPLE_RATE * end_sec)));
    }

}

const generateSpecButton = document.getElementById("createSpectrogram");
generateSpecButton!.onclick = generateSpectrogram;