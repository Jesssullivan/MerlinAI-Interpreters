// spec_record_crop.ts v3
import {audio_loader, audio_model, audio_utils, AudioRecorder, spectrogram_utils} from '../src/index';
const noUiSlider = require('./nouislider');

window.MediaRecorder = AudioRecorder;

const recordBtn = document.getElementById("recordButton") as HTMLButtonElement;
const stopBtn = document.getElementById("stopButton") as HTMLButtonElement;
const canvas = document.querySelector('.visualizer') as HTMLCanvasElement;
const mainSection = document.querySelector('.container-fluid') as HTMLDivElement;

/* tslint:disable:prefer-const */
let imgCrop = document.createElement('img');
let imgSpec = document.createElement('img');

/* tslint:enable:prefer-const */
let recordedBlobs : Blob;
let mediaRecorder : MediaRecorder;
let audioCtx : AudioContext;
let analyserNode : AnalyserNode;
let shouldDrawVisualization = false;
const canvasCtx = canvas.getContext("2d");
let chunks : Blob[] = [];
let currentWaveform : Float32Array;

// Spectrogram Visualization Parameters
const image_height = 300;
const timeScale = 1.0;
const targetSampleRate = 22050;
const stftWindowSeconds = 0.015;
const stftHopSeconds = 0.005;
const topDB = 80;
let slider : any = null;

const MODEL_URL = 'models/audio/model.json';
const LABELS_URL = 'models/audio/labels.json';
const patchWindowSeconds = 1.0; // We'd like to process a minimum of 1 second of audio

const merlinAudio = new audio_model.MerlinAudioModel(LABELS_URL, MODEL_URL);

function MuiButton(titleName: string, holderName: string) {

    const MuiHolder = document.getElementById(holderName);
    const MuiBtn = document.createElement("button");

    MuiBtn.classList.add("mui-btn");
    MuiBtn.classList.add("mui-btn--raised");
    MuiBtn.textContent = titleName;

    while (MuiHolder!.firstChild) {
            MuiHolder!.removeChild(MuiHolder!.firstChild);
        }

    MuiHolder!.appendChild(MuiBtn);
    return(MuiBtn);

}

function updateVis() {

    const handlePositions = slider.noUiSlider.get();
    let pos1 = Math.round(parseFloat(handlePositions[0]));
    let pos2 = Math.round(parseFloat(handlePositions[1]));

    // Take into account the offset of the image (by scrolling)
    const specImageHolderEl = document.getElementById('specImageHolder');
    const scrollOffset = specImageHolderEl!.scrollLeft;
    pos1 += scrollOffset;
    pos2 += scrollOffset;

    // Need to go from spectrogram position to waveform sample index
    const hopLengthSamples = Math.round(targetSampleRate * stftHopSeconds);
    const samplePos1 = pos1 * hopLengthSamples / timeScale;
    const samplePos2 = pos2 * hopLengthSamples / timeScale;

    const waveformSample = currentWaveform.slice(samplePos1, samplePos2);

    // visualize the cropped sample
    const dbSpec = generateSpectrogram(waveformSample); //audio_utils.dBSpectrogram(audioData.waveform, spec_params);
    const cropped_imageURI = spectrogram_utils.dBSpectrogramToImage(dbSpec, topDB);

    // create / update cropped visualization
    const cropped_height = 300;
    const cropped_width = Math.round(dbSpec.length);

    imgCrop.src = cropped_imageURI;
    imgCrop.height = cropped_height;
    imgCrop.width =  cropped_width;

    const specCropImage = document.getElementById('specCropHolder');
    while (specCropImage!.firstChild) {
        specCropImage!.removeChild(specCropImage!.firstChild);
    }

    specCropImage!.appendChild(imgCrop);

    return waveformSample;

}

async function averageClassifyWaveform(waveform : Float32Array) {

    const result = await merlinAudio.averagePredictV3(waveform, targetSampleRate);
    const labels = result[0] as string[];
    const scores = result[1] as Float32Array;
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

function renderSpectrogram(imageURI : string, spectrogramLength: number) {

    const image_width = Math.round(spectrogramLength * timeScale);
    imgSpec = document.createElement('img');
    imgSpec.src = imageURI;
    imgSpec.height = image_height;
    imgSpec.width = image_width;

    // Clear out previous images
    const specImageHolderEl = document.getElementById('specImageHolder');
    while (specImageHolderEl!.firstChild) {
        specImageHolderEl!.removeChild(specImageHolderEl!.firstChild);
    }

    // Add the spectrogram
    specImageHolderEl!.appendChild(imgSpec);

    // Add the slider
    const specSliderHolderEl = document.getElementById('specSliderHolder');
    while (specSliderHolderEl!.firstChild) {
        specSliderHolderEl!.removeChild(specSliderHolderEl!.firstChild);
    }

    slider = document.createElement('div');
    slider.style.width = "" + specImageHolderEl!.offsetWidth + "px";
    specSliderHolderEl!.appendChild(slider);

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
            'max': specImageHolderEl!.offsetWidth
        }
    });

    // create a Download button:
    const dlHolder = 'downloadButtonHolder';
    const dlButton = MuiButton('Download', dlHolder);

    // wait for a click before downloading anything:
    dlButton.onclick = () => {

        // no need to capture the returned waveform, just downloading the full song thus far
        updateVis();

        // shwoop the full song recording into a downloadable element:
        const url = window.URL.createObjectURL(recordedBlobs);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;

        // all this will need to include user annotation input, date, location etc...
        a.download = 'FullSongRecording.wav';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
    };

    // create a Classify button:
    const analyzeHolder = 'specAnalyzeButtonHolder';
    const analyzeBtn = MuiButton('Classify', analyzeHolder);

    // wait for a click:
    analyzeBtn.onclick = () => {

         // add a div to hold the Visualization of the sample
        const sampleHolderEl = document.getElementById('specSampleHolder');
        while (sampleHolderEl!.firstChild) {
            sampleHolderEl!.removeChild(sampleHolderEl!.firstChild);
        }

        const waveformSample = updateVis();

        // YMMV, but YOLO:
        averageClassifyWaveform(waveformSample).then(([labels, scores]) => {
            const resultEl = document.createElement('ul');
            for (let i = 0; i < 10; i++) {
                const scoreEl = document.createElement('li');
                scoreEl.textContent = labels[i] + " " + scores[i];
                resultEl.appendChild(scoreEl);
                sampleHolderEl!.prepend(resultEl);
            }
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

        canvasCtx!.fillStyle = 'rgb(58,119,52)';
        canvasCtx!.fillRect(0, 0, WIDTH, HEIGHT);
        canvasCtx!.lineWidth = 2;
        canvasCtx!.strokeStyle = 'rgb(0, 0, 0)';
        canvasCtx!.beginPath();

        const sliceWidth = WIDTH / bufferLength;
        let x = 0;

        for(let i = 0; i < bufferLength; i++) {

            const v = dataArray[i] / 128.0;
            const y = v * HEIGHT/2;

            if(i === 0) {
                canvasCtx!.moveTo(x, y);
            } else {
                canvasCtx!.lineTo(x, y);
            }

            x += sliceWidth;
        }

        canvasCtx!.lineTo(canvas.width, canvas.height/2);
        canvasCtx!.stroke();

    }
}

function stop_visualize(){
    shouldDrawVisualization = false;
    analyserNode.disconnect();
    requestAnimationFrame(clearCanvas);
}

function clearCanvas(){
    canvasCtx!.fillStyle = 'rgb(58,119,52)';
    canvasCtx!.fillRect(0, 0, canvas.width, canvas.height);
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

        mediaRecorder.addEventListener('stop', e => {
            // console.log("data available after MediaRecorder.stop() called.");

            // we make us a `new Blob` before anything else happens, e.g. `Analyze` or `Download`:
            recordedBlobs = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' }); // 'audio/ogg; codecs=opus'
            chunks = [];
            const audioURL = window.URL.createObjectURL(recordedBlobs);

            // console.log(audioURL);
            // console.log("recorder stopped");
            audio_loader.loadAudioFromURL(audioURL)
                .then((audioBuffer) => audio_loader.resampleAndMakeMono(audioBuffer, targetSampleRate))
                .then((audioWaveform) => {
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
        // console.log('The following error occured: ' + err);
        stopBtn.setAttribute('disabled',  'disabled');
        recordBtn.removeAttribute('disabled');

    };

    const constraints = { audio: true, video : false};
    navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);

};

stopBtn.onclick = () => {

    mediaRecorder.stop();
    // console.log(mediaRecorder.state);
    // console.log("recorder stopped");
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
