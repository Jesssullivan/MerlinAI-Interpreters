//@ts-ignore
import * as noUiSlider from './nouislider';
import {audio_model, audio_loader, audio_utils, spectrogram_utils, AudioRecorder} from '../src/index';

window.MediaRecorder = AudioRecorder;

const recordBtn = document.getElementById("recordButton") as HTMLButtonElement;
const pauseBtn = document.getElementById("pauseButton") as HTMLButtonElement;
const resumeBtn = document.getElementById("resumeButton") as HTMLButtonElement;
const stopBtn = document.getElementById("stopButton") as HTMLButtonElement;
const canvas = document.querySelector('.visualizer') as HTMLCanvasElement;
const mainSection = document.querySelector('.container-fluid') as HTMLDivElement;

let mediaRecorder : MediaRecorder;
let audioCtx : AudioContext;
let analyserNode : AnalyserNode;
let shouldDrawVisualization = false;
const canvasCtx = canvas.getContext("2d");
let chunks : Blob[] = [];
let slider : any = null;
let currentWaveform : Float32Array;

// Spectrogram Visualization Parameters
const targetSampleRate = 22050;
const stftWindowSeconds = 0.015;
const stftHopSeconds = 0.005;
const topDB = 80;

const MODEL_URL = 'models/audio/model.json';
const LABELS_URL = 'models/audio/labels.json';
//const scoreThreshold = 0.9;
const patchWindowSeconds = 1.0; // We'd like to process a minimum of 1 second of audio

var merlinAudio = new audio_model.MerlinAudioModel(LABELS_URL, MODEL_URL);

async function averageClassifyWaveform(waveform : Float32Array){

    let result = await merlinAudio.averagePredictV3(waveform, targetSampleRate);

    const labels = result[0] as string[];
    const scores = result[1] as Float32Array;

    console.log("Most Confident: " + labels[0] + " @ " + scores[0]);
    ///console.log(averageScores);

    // for(var i=0; i < averageScores.length; i++){
    //     console.log(averageScores[i]);
    // }

    return [labels, scores];

}


function generateSpectrogram(waveform : Float32Array) : Float32Array[]{

    const window_length_samples = Math.round(targetSampleRate * stftWindowSeconds);
    const hop_length_samples = Math.round(targetSampleRate * stftHopSeconds);
    const fft_length = Math.pow(2, Math.ceil(Math.log(window_length_samples) / Math.log(2.0)))

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

function renderSpectrogram(imageURI : string, spectrogramLength: number){

    // render the (scaled) spectrogram

    let image_height = 300;
    let timeScale = 1.0;
    let image_width = Math.round(spectrogramLength * timeScale);

    let img = document.createElement('img');
    img.src = imageURI;
    img.height = image_height;
    img.width =  image_width;
    console.log("Image Dims: [ " + image_height + ", " + image_width + "]");

    // Clear out previous images
    let specImageHolderEl = document.getElementById('specImageHolder');
    while (specImageHolderEl.firstChild) {
        specImageHolderEl.removeChild(specImageHolderEl.firstChild);
    }

    // Add the spectrogram
    specImageHolderEl.appendChild(img);

    // Add the slider
    let specSliderHolderEl = document.getElementById('specSliderHolder');
    while (specSliderHolderEl.firstChild) {
        specSliderHolderEl.removeChild(specSliderHolderEl.firstChild);
    }

    slider = document.createElement('div');
    slider.style.width = "" + specImageHolderEl.offsetWidth + "px";
    specSliderHolderEl.appendChild(slider);

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
            'max': specImageHolderEl.offsetWidth
        }
    });

    // Create the Analyze button
    let specAnalyzeButtonHolderEl = document.getElementById("specAnalyzeButtonHolder");
    while (specAnalyzeButtonHolderEl.firstChild) {
        specAnalyzeButtonHolderEl.removeChild(specAnalyzeButtonHolderEl.firstChild);
    }

    let analyzeBtn = document.createElement('button');
    analyzeBtn.classList.add("btn");
    analyzeBtn.classList.add("btn-primary");
    analyzeBtn.textContent = 'Classify';
    specAnalyzeButtonHolderEl.appendChild(analyzeBtn);

    // add a div to hold the Visualization of the sample
    let sampleHolderEl = document.getElementById('specCropHolder');
    while (sampleHolderEl.firstChild) {
        sampleHolderEl.removeChild(sampleHolderEl.firstChild);
    }

    analyzeBtn.onclick = function(){
        const handlePositions = slider.noUiSlider.get();
        //console.log(handlePositions);
        let pos1 = Math.round(parseFloat(handlePositions[0]));
        let pos2 = Math.round(parseFloat(handlePositions[1]));

        // Take into account the offset of the image (by scrolling)
        let specImageHolderEl = document.getElementById('specImageHolder');
        const scrollOffset = specImageHolderEl.scrollLeft;

        pos1 += scrollOffset;
        pos2 += scrollOffset;

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
        const dbSpec = generateSpectrogram(waveformSample); //audio_utils.dBSpectrogram(audioData.waveform, spec_params);
        const imageURI = spectrogram_utils.dBSpectrogramToImage(dbSpec, topDB);
        let image_height = 300;
        let image_width = Math.round(dbSpec.length);

        let img = document.createElement('img');
        img.src = imageURI;
        img.height = image_height;
        img.width =  image_width;
        console.log("Extracted Sample Image Dims: [ " + image_height + ", " + image_width + "]");

        // Clear out previous images (in case they do multiple analses from the same waveform)
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

}

function visualize(stream : MediaStream) {
    if(!audioCtx) {
        //@ts-ignore
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
    }

    const source = audioCtx.createMediaStreamSource(stream);

    analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = 2048;
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    source.connect(analyserNode);

    shouldDrawVisualization = true;
    draw()

    function draw() {
        const WIDTH = canvas.width
        const HEIGHT = canvas.height;

        if(shouldDrawVisualization){
            requestAnimationFrame(draw);
        }

        analyserNode.getByteTimeDomainData(dataArray);

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

function stop_visualize(){

    shouldDrawVisualization = false;
    analyserNode.disconnect();
    requestAnimationFrame(clearCanvas);
}

function clearCanvas(){
    canvasCtx.fillStyle = 'rgb(200, 200, 200)';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
}

recordBtn.onclick = function() {

    let onSuccess = function(stream : MediaStream) {

        //const mimeType = 'audio/webm';
        mediaRecorder = new window.MediaRecorder(stream);//, <MediaRecorderOptions>{type : mimeType});

        mediaRecorder.start();
        console.log(mediaRecorder.state);
        console.log("recorder started");

        visualize(stream);

        stopBtn.removeAttribute('disabled');
        pauseBtn.removeAttribute('disabled');
        resumeBtn.setAttribute('disabled',  'disabled');
        recordBtn.setAttribute('disabled',  'disabled');


        // mediaRecorder.onstop = function() {
        mediaRecorder.addEventListener('stop', e => {
            console.log("data available after MediaRecorder.stop() called.");

            const blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' }); // 'audio/ogg; codecs=opus'
            chunks = [];
            const audioURL = window.URL.createObjectURL(blob);
            console.log(audioURL);
            console.log("recorder stopped");

            audio_loader.loadAudioFromURL( audioURL)
                .then((audioBuffer) => audio_loader.resampleAndMakeMono(audioBuffer, targetSampleRate))
                .then((audioWaveform) => {

                    console.log("Number of samples: " + audioWaveform.length);
                    currentWaveform = audioWaveform;

                    let dbSpec = generateSpectrogram(audioWaveform);
                    let imageURI = spectrogram_utils.dBSpectrogramToImage(dbSpec, topDB);
                    renderSpectrogram(imageURI, dbSpec.length);

                });

        });

        // mediaRecorder.ondataavailable = function(e) {
        //     chunks.push(e.data);
        // }
        mediaRecorder.addEventListener('dataavailable', e => {
            chunks.push(e.data);
        });


    }


    let onError = function(err : Error) {
        console.log('The following error occured: ' + err);

        stopBtn.setAttribute('disabled',  'disabled');
        recordBtn.removeAttribute('disabled');

    }

    const constraints = { audio: true, video : false};
    navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);

}

pauseBtn.onclick = function(){

    if (mediaRecorder.state == 'recording'){
        mediaRecorder.pause();
        stop_visualize();

        stopBtn.removeAttribute('disabled');
        pauseBtn.setAttribute('disabled',  'disabled');
        resumeBtn.removeAttribute('disabled');
        recordBtn.setAttribute('disabled',  'disabled');
    }

}

resumeBtn.onclick = function(){
    if (mediaRecorder.state == 'paused'){
        mediaRecorder.resume();
        visualize(mediaRecorder.stream);

        stopBtn.removeAttribute('disabled');
        pauseBtn.removeAttribute('disabled');
        resumeBtn.setAttribute('disabled',  'disabled');
        recordBtn.setAttribute('disabled',  'disabled');

    }
}

stopBtn.onclick = function() {
    mediaRecorder.stop();
    console.log(mediaRecorder.state);
    console.log("recorder stopped");

    stop_visualize();

    stopBtn.setAttribute('disabled',  'disabled');
    pauseBtn.setAttribute('disabled',  'disabled');
    resumeBtn.setAttribute('disabled',  'disabled');
    recordBtn.removeAttribute('disabled');

    mediaRecorder.stream.getTracks().forEach(function(track) {
        if (track.readyState == 'live' && track.kind === 'audio') {
            track.stop();
        }
    });

}

// Make the canvas the full width
window.addEventListener('resize', function(){
    canvas.width = mainSection.offsetWidth;
});

window.dispatchEvent(new Event('resize'));
