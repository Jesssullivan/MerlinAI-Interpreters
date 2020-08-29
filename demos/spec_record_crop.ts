import {audio_loader, audio_model, audio_utils, AudioRecorder, spectrogram_utils} from '../src/index';
//@ts-ignore
import * as noUiSlider from './nouislider';

window.MediaRecorder = AudioRecorder;

const recordBtn = document.getElementById("recordButton") as HTMLButtonElement;
const stopBtn = document.getElementById("stopButton") as HTMLButtonElement;
const canvas = document.querySelector('.visualizer') as HTMLCanvasElement;
const mainSection = document.querySelector('.container-fluid') as HTMLDivElement;

let recordedBlobs : Blob;
let mediaRecorder : MediaRecorder;
let audioCtx : AudioContext;
let analyserNode : AnalyserNode;
let shouldDrawVisualization = false;
const canvasCtx = canvas.getContext("2d");
let chunks : Blob[] = [];
let slider : any = null;
let currentWaveform : Float32Array;
let dlButton : HTMLButtonElement;

// Spectrogram Visualization Parameters
const targetSampleRate = 22050;
const stftWindowSeconds = 0.015;
const stftHopSeconds = 0.005;
const topDB = 80;

const MODEL_URL = 'models/audio/model.json';
const LABELS_URL = 'models/audio/labels.json';
//const scoreThreshold = 0.9;
const patchWindowSeconds = 1.0; // We'd like to process a minimum of 1 second of audio

const merlinAudio = new audio_model.MerlinAudioModel(LABELS_URL, MODEL_URL);

async function averageClassifyWaveform(waveform : Float32Array){

    const result = await merlinAudio.averagePredictV3(waveform, targetSampleRate);

    const labels = result[0] as string[];
    const scores = result[1] as Float32Array;

    console.log("Most Confident: " + labels[0] + " @ " + scores[0]);

    return [labels, scores];

}

function generateSpectrogram(waveform : Float32Array) : Float32Array[]{

    const window_length_samples = Math.round(targetSampleRate * stftWindowSeconds);
    const hop_length_samples = Math.round(targetSampleRate * stftHopSeconds);
    const fft_length = Math.pow(2, Math.ceil(Math.log(window_length_samples) / Math.log(2.0)));

    const spec_params = {
        sampleRate: targetSampleRate,
        hopLength: hop_length_samples,
        winLength: window_length_samples,
        nFft: fft_length,
        topDB
    };

    return audio_utils.dBSpectrogram(waveform, spec_params);

}

function getSample(): Float32Array {

    const timeScale = 1.0;
    const handlePositions = slider.noUiSlider.get();

    //console.log(handlePositions);
    let pos1 = Math.round(parseFloat(handlePositions[0]));
    let pos2 = Math.round(parseFloat(handlePositions[1]));

    // Take into account the offset of the image (by scrolling)
    const specImageHolderEl = document.getElementById('specImageHolder');
    // @ts-ignore
    const scrollOffset = specImageHolderEl.scrollLeft;

    pos1 += scrollOffset;
    pos2 += scrollOffset;

    //console.log("Analyze Spectrogram from column " + pos1 + " to column " + pos2);
    // Need to go from spectrogram position to waveform sample index
    const hopLengthSamples = Math.round(targetSampleRate * stftHopSeconds);
    const samplePos1 = pos1 * hopLengthSamples / timeScale;
    const samplePos2 = pos2 * hopLengthSamples / timeScale;

    // console.log("Extracting waveform from sample " + samplePos1 + " to sample " + samplePos2);
    // const sampleDuration = (samplePos2 - samplePos1) / targetSampleRate;
    // console.log("Total waveform sample duration " + sampleDuration);

    // return a Waveform blob snippet:
    return currentWaveform.slice(samplePos1, samplePos2);

}

function renderSpectrogram(imageURI : string, spectrogramLength: number){

    // render the (scaled) spectrogram
    const image_height = 300;
    const timeScale = 1.0;
    const image_width = Math.round(spectrogramLength * timeScale);

    const img = document.createElement('img');
    img.src = imageURI;
    img.height = image_height;
    img.width =  image_width;
    console.log("Image Dims: [ " + image_height + ", " + image_width + "]");

    // Clear out previous images
    const specImageHolderEl = document.getElementById('specImageHolder');
    // @ts-ignore
    while (specImageHolderEl.firstChild) {
        // @ts-ignore
        specImageHolderEl.removeChild(specImageHolderEl.firstChild);
    }

    // Add the spectrogram
    // @ts-ignore
    specImageHolderEl.appendChild(img);

    // Add the slider
    const specSliderHolderEl = document.getElementById('specSliderHolder');
    // @ts-ignore
    while (specSliderHolderEl.firstChild) {
        // @ts-ignore
        specSliderHolderEl.removeChild(specSliderHolderEl.firstChild);
    }

    slider = document.createElement('div');
    // @ts-ignore
    slider.style.width = "" + specImageHolderEl.offsetWidth + "px";
    // @ts-ignore
    specSliderHolderEl.appendChild(slider);

    const hop_length_samples = Math.round(targetSampleRate * stftHopSeconds);
    const spectrogram_sr = targetSampleRate / hop_length_samples;
    const patch_window_length_samples = Math.round(spectrogram_sr * patchWindowSeconds);

    const margin = Math.min(spectrogramLength, patch_window_length_samples);

    noUiSlider.create(slider, {
        start: [0, margin],
        behaviour: 'drag-tap',
        connect: true,
        margin,
        range: {
            'min': 0,
            // @ts-ignore
            'max': specImageHolderEl.offsetWidth
        }
    });

    // Create the Analyze button
    const specAnalyzeButtonHolderEl = document.getElementById("specAnalyzeButtonHolder");
    // @ts-ignore
    while (specAnalyzeButtonHolderEl.firstChild) {
        // @ts-ignore
        specAnalyzeButtonHolderEl.removeChild(specAnalyzeButtonHolderEl.firstChild);
    }

    const analyzeBtn = document.createElement('button');
    analyzeBtn.classList.add("mui-btn");
    analyzeBtn.classList.add("mui-btn--raised");
    analyzeBtn.textContent = 'Classify';
    // @ts-ignore
    specAnalyzeButtonHolderEl.appendChild(analyzeBtn);

    const waveformSample = getSample();

    // add a div to hold the Visualization of the sample
    const sampleHolderEl = document.getElementById('specCropHolder');
    // @ts-ignore
    while (sampleHolderEl.firstChild) {
        // @ts-ignore
        sampleHolderEl.removeChild(sampleHolderEl.firstChild);
    }

    analyzeBtn.onclick = () => {

        // visualize the sample
        const dbSpec = generateSpectrogram(waveformSample); //audio_utils.dBSpectrogram(audioData.waveform, spec_params);
        const imageURI = spectrogram_utils.dBSpectrogramToImage(dbSpec, topDB);
        const image_height = 300;
        const image_width = Math.round(dbSpec.length);

        const img = document.createElement('img');
        img.src = imageURI;
        img.height = image_height;
        img.width =  image_width;
        console.log("Extracted Sample Image Dims: [ " + image_height + ", " + image_width + "]");

        // Clear out previous images (in case they do multiple analses from the same waveform)
        // @ts-ignore
        while (sampleHolderEl.firstChild) {
            // @ts-ignore
            sampleHolderEl.removeChild(sampleHolderEl.firstChild);
        }
        // @ts-ignore
        sampleHolderEl.appendChild(img);

        // Process with the model
        averageClassifyWaveform(waveformSample).then(([labels, scores]) => {

            const resultEl = document.createElement('ul');
            for(let i=0; i < 10; i++){
                const scoreEl = document.createElement('li');
                scoreEl.textContent = labels[i] + " " + scores[i];
                resultEl.appendChild(scoreEl);
            }

            // @ts-ignore
            sampleHolderEl.prepend(resultEl);

        });

    };

}

function visualize(stream : MediaStream) {

    if(!audioCtx) {
        //@ts-ignore
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
    }

    const source = audioCtx.createMediaStreamSource(stream);

    analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = 2048;
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    source.connect(analyserNode);

    shouldDrawVisualization = true;
    draw();

    function draw() {
        const WIDTH = canvas.width;
        const HEIGHT = canvas.height;

        if(shouldDrawVisualization){
            requestAnimationFrame(draw);
        }

        analyserNode.getByteTimeDomainData(dataArray);

        // @ts-ignore
        canvasCtx.fillStyle = 'rgb(58,119,52)';
        // @ts-ignore
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

        // @ts-ignore
        canvasCtx.lineWidth = 2;
        // @ts-ignore
        canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

        // @ts-ignore
        canvasCtx.beginPath();

        const sliceWidth = WIDTH / bufferLength;
        let x = 0;

        for(let i = 0; i < bufferLength; i++) {

            const v = dataArray[i] / 128.0;
            const y = v * HEIGHT/2;

            if(i === 0) {
                // @ts-ignore
                canvasCtx.moveTo(x, y);
            } else {
                // @ts-ignore
                canvasCtx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        // @ts-ignore
        canvasCtx.lineTo(canvas.width, canvas.height/2);
        // @ts-ignore
        canvasCtx.stroke();

    }
}

function stop_visualize(){
    shouldDrawVisualization = false;
    analyserNode.disconnect();
    requestAnimationFrame(clearCanvas);
}

function clearCanvas(){
    // @ts-ignore
    canvasCtx.fillStyle = 'rgb(58,119,52)';
    // @ts-ignore
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
}

recordBtn.onclick = () => {

    const onSuccess = (stream : MediaStream) => {

        // you could also do mime type as:
        //  mimeType = 'audio/webm';
        mediaRecorder = new window.MediaRecorder(stream,{mimeType: 'audio/wav'});

        mediaRecorder.start();
        console.log(mediaRecorder.state);
        console.log("recorder started");

        visualize(stream);

        stopBtn.removeAttribute('disabled');
        recordBtn.setAttribute('disabled',  'disabled');

        // Create the Download button
        const DownloadButtonHolderEl = document.getElementById("downloadButtonHolder");
        // @ts-ignore
        while (DownloadButtonHolderEl.firstChild) {
            // @ts-ignore
            DownloadButtonHolderEl.removeChild(DownloadButtonHolderEl.firstChild);
        }

        mediaRecorder.addEventListener('stop', e => {
            // console.log("data available after MediaRecorder.stop() called.");

            // we make us a `new Blob` before anything else happens, e.g. `Analyze` or `Download`:
            recordedBlobs = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' }); // 'audio/ogg; codecs=opus'
            chunks = [];
            const audioURL = window.URL.createObjectURL(recordedBlobs);

            // console.log(audioURL);
            // console.log("recorder stopped");

            // only let user have `Download` button if `stop` has been called:
            dlButton = document.createElement("button");
            dlButton.classList.add("mui-btn");
            dlButton.classList.add("mui-btn--raised");
            dlButton.textContent = 'Download';
            // @ts-ignore
            DownloadButtonHolderEl.appendChild(dlButton);

            // wait for user to click Download-
            //  I think this needs to explicitly be a child of `stop` listener until tomorrow,
            //  can't think of a better way to do this atm
            dlButton.addEventListener('click', () => {
              const url = window.URL.createObjectURL(recordedBlobs);
              const a = document.createElement('a');
              a.style.display = 'none';
              a.href = url;

              // all this will need to include user annotation input, date, location etc
              a.download = 'SongRecording.wav';
              document.body.appendChild(a);
              a.click();
              setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
              }, 100);
            });

            audio_loader.loadAudioFromURL(audioURL)
                .then((audioBuffer) => audio_loader.resampleAndMakeMono(audioBuffer, targetSampleRate))
                .then((audioWaveform) => {

                    console.log("Number of samples: " + audioWaveform.length);
                    currentWaveform = audioWaveform;

                    const dbSpec = generateSpectrogram(audioWaveform);
                    const imageURI = spectrogram_utils.dBSpectrogramToImage(dbSpec, topDB);
                    renderSpectrogram(imageURI, dbSpec.length);

                });

        });

        // mediaRecorder.ondataavailable = function(e) {
        //     chunks.push(e.data);
        // }
        mediaRecorder.addEventListener('dataavailable', e => {
            chunks.push(e.data);
        });

    };

    const onError = (err : Error) => {
        console.log('The following error occured: ' + err);

        stopBtn.setAttribute('disabled',  'disabled');
        recordBtn.removeAttribute('disabled');

    };

    const constraints = { audio: true, video : false};
    navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);

};

stopBtn.onclick = () => {

    mediaRecorder.stop();
    console.log(mediaRecorder.state);
    console.log("recorder stopped");

    stop_visualize();

    stopBtn.setAttribute('disabled',  'disabled');
    recordBtn.removeAttribute('disabled');
    mediaRecorder.stream.getTracks().forEach((track) => {
        if (track.readyState === 'live' && track.kind === 'audio') {
            track.stop();
        }
    });
};

// Make the canvas the full width
window.addEventListener('resize', () => {
    canvas.width = mainSection.offsetWidth;
});

window.dispatchEvent(new Event('resize'));
