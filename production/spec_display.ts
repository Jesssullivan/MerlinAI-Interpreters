
//import * as tf from '@tensorflow/tfjs';

import {audio_model, audio_utils} from '../src/index';
//@ts-ignore
import {Greys} from './greys';

var CONFIG = {
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
}

function powerToDb(spec : Float32Array[], amin = 1e-10, topDb = 80.0) {
    const width = spec.length;
    const height = spec[0].length;
    const logSpec = [];
    for (let i = 0; i < width; i++) {
        logSpec[i] = new Float32Array(height);
    }

    let refValue = Math.max.apply(null, spec.map(arr => Math.max.apply(null, arr)));
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

        let maxVal = Math.max.apply(null, logSpec.map(arr => Math.max.apply(null, arr)));

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
    const fft_length = Math.pow(2, Math.ceil(Math.log(window_length_samples) / Math.log(2.0)))
    const num_spectrogram_bins = Math.floor(fft_length / 2) + 1;

    console.log("STFT params:");
    console.log("Window length samples: " + window_length_samples);
    console.log("Window hop samples: " + hop_length_samples);
    console.log("FFT length: " + fft_length);
    console.log("Num freq bins: " + num_spectrogram_bins);

    var spec_params = {
        sampleRate: CONFIG.SAMPLE_RATE,
        hopLength: hop_length_samples,
        winLength: window_length_samples,
        nMels: CONFIG.MEL_BANDS,
        nFft: fft_length,
        fMin: CONFIG.MEL_MIN_HZ,
        fMax: CONFIG.MEL_MAX_HZ,
    };

    let stftMatrix = audio_utils.stft(waveform, spec_params);

    const power = 2.0
    var [spec, nFft] = audio_utils.magSpectrogram(stftMatrix, power);

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
let values = Greys;
var x_values : number[] = [];
var r_values : number[] = [];
var g_values : number[] = [];
var b_values : number[] = [];
for (var i in values) {
    x_values.push(<number>values[i][0]);
    r_values.push(values[i][1][0]);
    g_values.push(values[i][1][1]);
    b_values.push(values[i][1][2]);
}
function interpolateLinearly(x : number) {

    var i = 1;
    while (x_values[i] < x) {
        i = i+1;
    }
    i = i-1;

    var width = Math.abs(x_values[i] - x_values[i+1]);
    var scaling_factor = (x - x_values[i]) / width;

    // Get the new color values though interpolation
    var r = r_values[i] + scaling_factor * (r_values[i+1] - r_values[i])
    var g = g_values[i] + scaling_factor * (g_values[i+1] - g_values[i])
    var b = b_values[i] + scaling_factor * (b_values[i+1] - b_values[i])

    return [enforceBounds(r), enforceBounds(g), enforceBounds(b)];

}


function make_image_from_spectrogram(spec : Float32Array[]){
    /*
    spec should be between 0 and -80
    // this isn't true...
    */

    let spec_width = spec.length;
    let spec_height = spec[0].length;
    let image_buffer = new Uint8ClampedArray(spec_width * spec_height * 4); // enough bytes for RGBA

    console.log("Spec Dimensions: [ " + spec_height + ", " + spec_width + "]");

    var min_val = Math.min.apply(null, spec.map(arr => Math.min.apply(null, arr)))
    console.log("Spec min value: " + min_val);

    var max_val = Math.max.apply(null, spec.map(arr => Math.max.apply(null, arr)));
    console.log("Spec max value: " + max_val);

    //
    for(var y = 0; y < spec_height; y++) {
        for(var x = 0; x < spec_width; x++) {

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
            let pixel_val = interpolateLinearly(mag);
            //console.log(pixel_val);
            var pos = (y * spec_width + x) * 4; // position in buffer based on x and y
            image_buffer[pos  ] = pixel_val[0] * 255;           // some R value [0, 255]
            image_buffer[pos+1] = pixel_val[1] * 255;           // some G value
            image_buffer[pos+2] = pixel_val[2] * 255;           // some B value
            image_buffer[pos+3] = 255;           // set alpha channel
        }
    }

    //let desired_height = 220;
    //let s = desired_height / spec_height;
    //let desired_width = Math.round(spec_width * s);

    var canvas = document.createElement('canvas'),
    ctx = canvas.getContext('2d');

    canvas.width = spec_width;
    canvas.height = spec_height;

    // create imageData object
    var idata = ctx.createImageData(spec_width, spec_height);

    // set our buffer as source
    idata.data.set(image_buffer);

    // update canvas with new data
    ctx.putImageData(idata, 0, 0);//, 0, 0, desired_width, desired_height);

    //document.getElementById('specHolder').appendChild(canvas);

    var dataUri = canvas.toDataURL(); // produces a PNG file

    return dataUri;
}


function renderWaveform(waveform : Float32Array){
    console.log("success making waveform.");
    console.log("Audio Duration Seconds: " + waveform.length / CONFIG.SAMPLE_RATE);


    let mel_spectrogram = make_spectrogram(waveform);

    console.log("success making spectrogram.");

    let specDataUri = make_image_from_spectrogram(mel_spectrogram);

    console.log("success making image.");

    // render the (scaled) spectrogram

    let image_height = CONFIG.SPEC_HEIGHT_PIXELS;
    let scale = 1.0; //mel_spectrogram[0].length / image_height;
    let image_width = Math.round((mel_spectrogram.length / scale) * CONFIG.TIME_SCALE)

    let img = document.createElement('img');
    img.src = specDataUri;
    img.height = image_height;
    img.width =  image_width;
    console.log("Image Dims: [ " + image_height + ", " + image_width + "]");

    // Clear out previous images
    let specHolderEl = document.getElementById('specHolder');
    while (specHolderEl.firstChild) {
        specHolderEl.removeChild(specHolderEl.firstChild);
    }

    // Add the spectrogram
    specHolderEl.appendChild(img);

}



const MODEL_URL = 'models/audio/model.json';
const LABELS_URL = 'models/audio/labels.json';

var merlinAudio = new audio_model.MerlinAudioModel(LABELS_URL, MODEL_URL);

async function classifyWaveform(waveform : Float32Array){

    let results = await merlinAudio.predict(waveform);

    results.forEach(result => {
        console.log(result);
    });

}


// async function classifyWaveform(waveform : Float32Array){

//     let labels = await fetch(LABELS_URL)
//         .then(response => response.json());

//     let model = await tf.loadGraphModel(MODEL_URL);
//     console.log('Loaded model!.');

//     var tf_waveform = tf.tensor(waveform);
//     if (tf_waveform.shape[0] < CONFIG.SAMPLE_RATE){
//         tf_waveform = tf_waveform.pad([[0,CONFIG.SAMPLE_RATE - waveform.length]]);
//     }

//     console.log(tf_waveform.shape);

//     console.log('Running model!.');
//     const input_batch = tf_waveform.expandDims(0);
//     let outputs = model.execute(input_batch) as tf.Tensor;
//     console.log('Finshed running model!.');

//     const scores = await outputs.data() as Float32Array;
//     const maxIndexTensor = outputs.argMax(-1);
//     const maxIndex = (await maxIndexTensor.data())[0];
//     const maxScore = Math.max(...scores);
//     tf.dispose([outputs, maxIndexTensor, tf_waveform]);

//     console.log(maxIndex);
//     console.log(maxScore);
//     console.log(scores);

//     console.log(labels[maxIndex]);

// }



function parseSpectrogramConfigs(){

    let inputTargetSampleRate = <HTMLInputElement>document.getElementById("inputTargetSampleRate");
    var targetSampleRate = parseInt(inputTargetSampleRate.value || inputTargetSampleRate.placeholder);
    //targetSampleRate = parseInt(targetSampleRate);

    let inputSTFTWindowSeconds = <HTMLInputElement>document.getElementById("inputSTFTWindowSeconds");
    var stftWindowSeconds = parseFloat(inputSTFTWindowSeconds.value || inputSTFTWindowSeconds.placeholder);
    //stftWindowSeconds = parseFloat(stftWindowSeconds);

    let inputSTFTHopSeconds = <HTMLInputElement>document.getElementById("inputSTFTHopSeconds");
    var stftHopSeconds = parseFloat(inputSTFTHopSeconds.value || inputSTFTHopSeconds.placeholder);
    //stftHopSeconds = parseFloat(stftHopSeconds);

    let inputDoMELScaling = <HTMLInputElement>document.getElementById("inputDoMELScaling");
    var doMELScaling = inputDoMELScaling.checked;

    let inputMELBands = <HTMLInputElement>document.getElementById("inputMELBands");
    var melBands = parseInt(inputMELBands.value || inputMELBands.placeholder);
    //melBands = parseInt(melBands);

    let inputMELMinHZ = <HTMLInputElement>document.getElementById("inputMELMinHZ");
    var melMinHz = parseInt(inputMELMinHZ.value || inputMELMinHZ.placeholder);
    //melMinHz = parseInt(melMinHz);

    let inputMELMaxHZ = <HTMLInputElement>document.getElementById("inputMELMaxHZ");
    var melMaxHz = parseInt(inputMELMaxHZ.value || inputMELMaxHZ.placeholder);
    //melMaxHz = parseInt(melMaxHz);

    let inputTopDB = <HTMLInputElement>document.getElementById("inputTopDB");
    var topDB = parseInt(inputTopDB.value || inputTopDB.placeholder);
    //topDB = parseInt(topDB);

    let inputTimeScale = <HTMLInputElement>document.getElementById("inputTimeScale");
    var timeScale = parseFloat(inputTimeScale.value || inputTimeScale.placeholder);
    //timeScale = parseFloat(timeScale);

    let inputSpecHeightPixels = <HTMLInputElement>document.getElementById("inputSpecHeightPixels");
    var specHeightPixels = parseInt(inputSpecHeightPixels.value || inputSpecHeightPixels.placeholder);
    //specHeightPixels = parseInt(specHeightPixels);

    return {
        targetSampleRate : targetSampleRate,
        stftWindowSeconds : stftWindowSeconds,
        stftHopSeconds : stftHopSeconds,
        doMELScaling : doMELScaling,
        melBands : melBands,
        melMinHz : melMinHz,
        melMaxHz : melMaxHz,
        topDB : topDB,
        timeScale : timeScale,
        specHeightPixels : specHeightPixels
    }

}

var CACHED_ASSET_DATA = {
    assetID : null as number,
    sourceSampleRate : null as number,
    waveform : null as Float32Array,
    targetSampleRate : null as number
}



function generateSpectrogram(){
    console.log("Generating Spectrogram");

    let inputAssetID = <HTMLInputElement>document.getElementById("inputAssetID");
    var assetID = parseInt(inputAssetID.value || inputAssetID.placeholder);

    let specConfigs = parseSpectrogramConfigs();
    let targetSampleRate = specConfigs.targetSampleRate;
    var waveform : Float32Array = null;

    if (CACHED_ASSET_DATA != null){

        if (CACHED_ASSET_DATA.assetID == assetID){

            if (CACHED_ASSET_DATA.targetSampleRate == targetSampleRate){
                // we can reuse the waveform
                waveform = CACHED_ASSET_DATA.waveform
            }
        }
    }

    CACHED_ASSET_DATA.assetID = assetID;
    CACHED_ASSET_DATA.targetSampleRate = targetSampleRate;

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

    if (waveform == null){

        console.log("Downloading audio file");
        let asset_url = "https://download.ams.birds.cornell.edu/api/v1/asset/" + assetID + "/audio";

        audio_utils.fetch_audio(asset_url, targetSampleRate).then((audioData) => {

            console.log("Generated waveform");

            CACHED_ASSET_DATA.waveform = audioData.waveform;
            CACHED_ASSET_DATA.sourceSampleRate = audioData.sourceSampleRate;

            // console.log(CACHED_ASSET_DATA);

            renderWaveform(audioData.waveform);

            if (true){

                //const start_sec = 1.2;
                //const end_sec = start_sec + 1;

                classifyWaveform(audioData.waveform)//.slice(Math.round(CONFIG.SAMPLE_RATE * start_sec), Math.round(CONFIG.SAMPLE_RATE * end_sec)));
            }
        });
    }
    else{

        console.log("Reusing cached audio file");

        // console.log(CACHED_ASSET_DATA);

        //const start_sec = 1.4;
        //const end_sec = start_sec + 1;

        renderWaveform(waveform);
        classifyWaveform(waveform)//.slice(Math.round(CONFIG.SAMPLE_RATE * start_sec), Math.round(CONFIG.SAMPLE_RATE * end_sec)));
    }

}


let generateSpecButton = document.getElementById("createSpectrogram");
generateSpecButton.onclick = generateSpectrogram;