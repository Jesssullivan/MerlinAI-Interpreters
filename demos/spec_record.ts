//@ts-ignore
import * as noUiSlider from './nouislider';

import {audio_model, audio_utils, spectrogram_utils} from '../src/index';


// Spectrogram Visualization Parameters
const targetSampleRate = 22050;
const stftWindowSeconds = 0.015;
const stftHopSeconds = 0.005;
const topDB = 80;


const recordBtn = document.getElementById("buttonStartRecording") as HTMLButtonElement;
const stopBtn = document.getElementById("buttonStopRecording") as HTMLButtonElement;
//const timeDisplay = document.getElementById('timeDisplay');
const canvas = document.querySelector('.visualizer') as HTMLCanvasElement;
const mainSection = document.querySelector('.container-fluid') as HTMLDivElement;


stopBtn.setAttribute('disabled',  'disabled');

let audioCtx : AudioContext;
const canvasCtx = canvas.getContext("2d");

let slider : any = null;
let currentWaveform : Float32Array;

const MODEL_URL = 'models/audio/model.json';
const LABELS_URL = 'models/audio/labels.json';
//const scoreThreshold = 0.9;
const patchWindowSeconds = 1.0; // We'd like to process a minimum of 1 second of audio

var merlinAudio = new audio_model.MerlinAudioModel(LABELS_URL, MODEL_URL);

// async function classifyWaveform(waveform : Float32Array){

//     let results = await merlinAudio.predict(waveform);
//     console.log("Received " + results.length + " classification results");

//     results.forEach(result => {

//         const label = result[0];
//         const score = result[1];
//         const windowCenter = result[2];

//         if (score > scoreThreshold){
//             console.log("HIGH CONF: Found " + label + " with score " + score + " at time " + windowCenter);

//         } else{
//             console.log("Found " + label + " with score " + score + " at time " + windowCenter);
//         }

//     });

// }

async function averageClassifyWaveform(waveform : Float32Array){

    let result = await merlinAudio.averagePredictV2(waveform);

    const labels = result[0] as string[];
    const scores = result[1] as Float32Array;

    console.log("Most Confident: " + labels[0] + " @ " + scores[0]);
    ///console.log(averageScores);

    // for(var i=0; i < averageScores.length; i++){
    //     console.log(averageScores[i]);
    // }

    return [labels, scores];

}

function generatSpectrogram(waveform : Float32Array) : Float32Array[]{

    const window_length_samples = Math.round(targetSampleRate * stftWindowSeconds);
    const hop_length_samples = Math.round(targetSampleRate * stftHopSeconds);
    const fft_length = Math.pow(2, Math.ceil(Math.log(window_length_samples) / Math.log(2.0)))
    //const num_spectrogram_bins = Math.floor(fft_length / 2) + 1;

    // console.log("STFT params:");
    // console.log("Window length samples: " + window_length_samples);
    // console.log("Window hop samples: " + hop_length_samples);
    // console.log("FFT length: " + fft_length);
    // console.log("Num freq bins: " + num_spectrogram_bins);

    var spec_params = {
        sampleRate: targetSampleRate,
        hopLength: hop_length_samples,
        winLength: window_length_samples,
        nFft: fft_length,
        topDB : topDB
    };

    const dbSpec = audio_utils.dBSpectrogram(waveform, spec_params);

    return dbSpec;

}

console.log("Checking getUserMedia");
console.log(navigator.mediaDevices);
console.log("Blah");
if (navigator.mediaDevices.getUserMedia) {
    console.log('getUserMedia supported.');

    const constraints = { audio: true };
    let chunks : Blob[] = [];

    let onSuccess = function(stream : MediaStream) {

        const mediaRecorder = new MediaRecorder(stream);

        visualize(stream);

        recordBtn.onclick = function() {
            mediaRecorder.start();
            console.log(mediaRecorder.state);
            console.log("recorder started");

            stopBtn.removeAttribute('disabled');
            recordBtn.setAttribute('disabled',  'disabled');
        }

        stopBtn.onclick = function() {
            mediaRecorder.stop();
            console.log(mediaRecorder.state);
            console.log("recorder stopped");

            stopBtn.setAttribute('disabled',  'disabled');
            recordBtn.removeAttribute('disabled');
        }

        mediaRecorder.onstop = function() {
            console.log("data available after MediaRecorder.stop() called.");

            const blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
            chunks = [];
            const audioURL = window.URL.createObjectURL(blob);
            console.log(audioURL);
            console.log("recorder stopped");

            audio_utils.fetch_audio(audioURL, targetSampleRate).then((audioData) => {

                console.log("Generated waveform");
                console.log("Source Sample Rate: " + audioData.sourceSampleRate);
                console.log("Number of Samples: " + audioData.waveform.length);

                // const window_length_samples = Math.round(targetSampleRate * stftWindowSeconds);
                // const hop_length_samples = Math.round(targetSampleRate * stftHopSeconds);
                // const fft_length = Math.pow(2, Math.ceil(Math.log(window_length_samples) / Math.log(2.0)))
                // const num_spectrogram_bins = Math.floor(fft_length / 2) + 1;

                // console.log("STFT params:");
                // console.log("Window length samples: " + window_length_samples);
                // console.log("Window hop samples: " + hop_length_samples);
                // console.log("FFT length: " + fft_length);
                // console.log("Num freq bins: " + num_spectrogram_bins);

                // var spec_params = {
                //     sampleRate: targetSampleRate,
                //     hopLength: hop_length_samples,
                //     winLength: window_length_samples,
                //     nFft: fft_length,
                //     topDB : topDB
                // };

                const dbSpec = generatSpectrogram(audioData.waveform); //audio_utils.dBSpectrogram(audioData.waveform, spec_params);
                const imageURI = spectrogram_utils.dBSpectrogramToImage(dbSpec, topDB);
                currentWaveform = audioData.waveform;

                renderSpectrogram(imageURI, dbSpec.length);
                //classifyWaveform(audioData.waveform);

            });

        }

        mediaRecorder.ondataavailable = function(e) {
            chunks.push(e.data);
        }

    }

    let onError = function(err : Error) {
        console.log('The following error occured: ' + err);
    }

    navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);

}
else{
    console.log('getUserMedia not supported on your browser!');
}

function visualize(stream : MediaStream) {
    if(!audioCtx) {
        //@ts-ignore
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
    }

    const source = audioCtx.createMediaStreamSource(stream);

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    source.connect(analyser);

    draw()

    function draw() {
        const WIDTH = canvas.width
        const HEIGHT = canvas.height;

        requestAnimationFrame(draw);

        analyser.getByteTimeDomainData(dataArray);

        canvasCtx.fillStyle = 'rgb(200, 200, 200)';
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

        canvasCtx.beginPath();

        let sliceWidth = WIDTH * 1.0 / bufferLength;
        let x = 0;


        for(let i = 0; i < bufferLength; i++) {

            let v = dataArray[i] / 128.0;
            let y = v * HEIGHT/2;

            if(i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        canvasCtx.lineTo(canvas.width, canvas.height/2);
        canvasCtx.stroke();

    }
}

function renderSpectrogram(imageURI : string, spectrogramLength: number){

    // render the (scaled) spectrogram

    let image_height = 400;
    let timeScale = 1.0;
    let image_width = Math.round(spectrogramLength * timeScale);

    let img = document.createElement('img');
    img.src = imageURI;
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

    // Add the slider
    slider = document.createElement('div');
    slider.style.width = "" + image_width + "px";
    specHolderEl.appendChild(slider);

    const hop_length_samples = Math.round(targetSampleRate * stftHopSeconds)
    const spectrogram_sr = targetSampleRate / hop_length_samples
    const patch_window_length_samples = Math.round(spectrogram_sr * patchWindowSeconds);

    const margin = Math.min(spectrogramLength, patch_window_length_samples);

    noUiSlider.create(slider, {
        start: [0, margin],
        behaviour: 'drag-tap',
        connect: true,
        margin: margin,
        range: {
            'min': 0,
            'max': spectrogramLength
        }
    });

    let analyzeBtn = document.createElement('button');
    analyzeBtn.classList.add("btn");
    analyzeBtn.classList.add("btn-primary");
    analyzeBtn.textContent = 'Classify';
    specHolderEl.appendChild(analyzeBtn);

    // add a div to hold the Visualization of the sample
    let sampleHolderEl = document.createElement('div');
    specHolderEl.appendChild(sampleHolderEl);

    analyzeBtn.onclick = function(){
        const handlePositions = slider.noUiSlider.get();
        console.log(handlePositions);
        const pos1 = Math.round(parseFloat(handlePositions[0]));
        const pos2 = Math.round(parseFloat(handlePositions[1]));

        console.log("Analyze Spectrogram from column " + pos1 + " to column " + pos2);

        // Need to go from spectrogram position to waveform sample index
        let hopLengthSamples = Math.round(targetSampleRate * stftHopSeconds)

        const samplePos1 = pos1 * hopLengthSamples / timeScale;
        const samplePos2 = pos2 * hopLengthSamples / timeScale;

        console.log("Extracting waveform from sample " + samplePos1 + " to sample " + samplePos2);

        const sampleDuration = (samplePos2 - samplePos1) / targetSampleRate;
        console.log("Total waveform sample duration " + sampleDuration);

        const waveformSample = currentWaveform.slice(samplePos1, samplePos2);

        // visualize the sample
        const dbSpec = generatSpectrogram(waveformSample); //audio_utils.dBSpectrogram(audioData.waveform, spec_params);
        const imageURI = spectrogram_utils.dBSpectrogramToImage(dbSpec, topDB);
        let image_height = 400;
        //let timeScale = 1.0;
        let image_width = Math.round(dbSpec.length);

        let img = document.createElement('img');
        img.src = imageURI;
        img.height = image_height;
        img.width =  image_width;
        console.log("Extracted Sample Image Dims: [ " + image_height + ", " + image_width + "]");

        // Clear out previous images
        while (sampleHolderEl.firstChild) {
            sampleHolderEl.removeChild(sampleHolderEl.firstChild);
        }
        sampleHolderEl.appendChild(img);

        // Process with the model
        averageClassifyWaveform(waveformSample).then(([labels, scores]) => {

            let resultEl = document.createElement('ul')
            for(var i=0; i < 10; i++){
                let scoreEl = document.createElement('li');
                scoreEl.textContent = labels[i] + " " + scores[i];
                resultEl.appendChild(scoreEl);
            }

            sampleHolderEl.prepend(resultEl);

        });

    };

    // slider.noUiSlider.on('end', function(){


    // });

}

// Load testing data
// var ovenbird_waveform = null;
// fetch("./models/audio/ovenbird_test_waveform.json")
//     .then(response => response.json())
//     .then(wf => {
//         //let buffer = new ArrayBuffer(wf.length * 4);
//         ovenbird_waveform = Float32Array.from(wf); //new Float32Array(buffer);
//         console.log("Loaded ovenbird waveform, " + ovenbird_waveform.length + " samples");

//         averageClassifyWaveform(ovenbird_waveform);

//     });
// var woodthrush_waveform = null;
// fetch("./models/audio/woodthrush_test_waveform.json")
//     .then(response => response.json())
//     .then(wf => {
//         //let buffer = new ArrayBuffer(wf.length * 4);
//         woodthrush_waveform = Float32Array.from(wf);//new Float32Array(buffer);
//         console.log("Loaded woodthrush waveform, " + woodthrush_waveform.length + " samples");

//         averageClassifyWaveform(woodthrush_waveform);

//     });


window.addEventListener('resize', function(){
    canvas.width = mainSection.offsetWidth;
});

window.dispatchEvent(new Event('resize'));