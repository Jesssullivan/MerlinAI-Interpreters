// spec_crop_interpreter.ts

import {log, audio_loader, audio_model, audio_utils, spectrogram_utils, ui_utils} from "../src/index";
import {tf} from '../src';

const noUiSlider = require('./nouislider');

window.MediaRecorder = require('audio-recorder-polyfill');

const webClassifyURL = "/classify/select"

// absolute urls
// const webClassifyURL = "http://127.0.0.1:5000/classify/select"
// const webClassifyURL = "http://127.0.0.1:5000/classify/standard"
// const webClassifyURL = "https://merlinai.herokuapp.com/classify/select"
// const webClassifyURL = "https://merlinai.herokuapp.com/classify/standard";


const recordBtn = document.getElementById("recordButton") as HTMLButtonElement;
const stopBtn = document.getElementById("stopButton") as HTMLButtonElement;
const canvas = document.querySelector('.visualizer') as HTMLCanvasElement;

const imgCrop = document.createElement('img');
let imgSpec = document.createElement('img');
let audioURL: string | Blob;

const MODEL_URL = 'models/audio/model.json';
const LABELS_URL = 'models/audio/labels.json';

let recordedBlobs : Blob;
let mediaRecorder : MediaRecorder;
let audioCtx : AudioContext;
let analyserNode : AnalyserNode;
let shouldDrawVisualization = false;
const canvasCtx = canvas.getContext("2d");
let chunks : Blob[] = [];
let currentWaveform : Float32Array;
let currentWaveformSample : Float32Array;
let handlePositions;
let classifyTextHeader = "";

// we'll load up the model here, only if we need to:
let merlinAudio = null;

// Spectrogram Visualization Parameters
const image_height = 300;
const timeScale = 1.0;
const targetSampleRate = 44100;
const stftWindowSeconds = 0.015;
const stftHopSeconds = 0.005;
const topDB = 80;

let slider = null;

const patchWindowSeconds = 3.0; // We'd like to process a minimum of 3 seconds of audio

// evaluate browser's webgl capability from here, and set stuff up accordingly:
const useBrowser = (_force=false, _force_val=false) => {

    if (_force) {
        return _force_val;
    }

    const capable = tf.ENV.getBool('WEBGL_RENDER_FLOAT32_CAPABLE');

    if (capable === true) {
        merlinAudio = new audio_model.MerlinAudioModel(LABELS_URL, MODEL_URL);
        return true;
        // return false;
    }
    else {
        return false;
    }
};

const browserUse = useBrowser();

// set classifyTextHeader:
if (browserUse === false) {
    classifyTextHeader = "Classifications processed on server:";
} else {
    classifyTextHeader = "Classifications processed in browser:";
}


const updateVis = () => {

    handlePositions = slider.noUiSlider.get();
    let pos1 = Math.round(parseFloat(handlePositions[0]));
    let pos2 = Math.round(parseFloat(handlePositions[1]));

    // Take into account the offset of the image (by scrolling)
    const specImageHolderEl = document.getElementById('specImageHolder');
    const scrollOffset = specImageHolderEl.scrollLeft;

    pos1 += scrollOffset;
    pos2 += scrollOffset;

    // Need to go from spectrogram position to waveform sample index
    const hopLengthSamples = Math.round(targetSampleRate * stftHopSeconds);

    const samplePos1 = pos1 * hopLengthSamples / timeScale;
    const samplePos2 = pos2 * hopLengthSamples / timeScale;

    currentWaveformSample = currentWaveform.slice(samplePos1, samplePos2);

    // visualize the cropped sample
    const dbSpec = generateSpectrogram(currentWaveformSample); //audio_utils.dBSpectrogram(audioData.waveform, spec_params);
    const cropped_imageURI = spectrogram_utils.dBSpectrogramToImage(dbSpec, topDB);

    // create / update cropped visualization
    const cropped_height = 300;
    const cropped_width = Math.round(dbSpec.length);

    imgCrop.src = cropped_imageURI;
    imgCrop.height = cropped_height;
    imgCrop.width =  cropped_width;

    return currentWaveformSample;

};

const handleClassifyWaveform = async() => {

    // update slider position:
    updateVis();

    // this is where we'll display the classification results:
    const sampleHolderEl = document.getElementById('specSampleHolder');

    while (sampleHolderEl.firstChild) {
        sampleHolderEl.removeChild(sampleHolderEl.firstChild);
    }

    // this is the list of resulting scores:
    const resultEl = document.createElement('ul');

    // start list by letting user know where data was just processed:
    const scoreHeaderEl = document.createElement('li');
    scoreHeaderEl.textContent = classifyTextHeader;
    resultEl.appendChild(scoreHeaderEl);

    if (browserUse === false) {

        // prepare audio snippet to send to server:

        // start audio context;
        // only for serverside processing
        if(!audioCtx) {
            //@ts-ignore
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContext();
        }

        // get slider bounds:
        const snipArray = updateVis();

        // create, fill buffer:
        let snipBuffer = audioCtx.createBuffer(1, snipArray.length, targetSampleRate);
        snipBuffer.copyToChannel(snipArray,0);

        // convert to blob to send to server:
        let snipBlob = new Blob([audio_utils.bufferToWave(snipBuffer, snipBuffer.length)], { 'type' : 'audio/ogg; codecs=opus' });
        // name: 'file' is the ID Flask will use to find and parse the POST's `snippet.wav`:

        // file is wrapped in `formData` for POST:
        const formData = new FormData();

        formData.append('file', snipBlob, 'snippet.wav');

        // make the POST:
        fetch(webClassifyURL, {
        method: 'POST',
        body: formData
        })
        .then(response => {
            response.json().then(data => {

               log('received scores!');

                // zing the received json Object into a sortable Array:
                let i;
                let results = [];
                for (i in data) {
                    results.push([i, data[i]]);
                }

                // sort the Array by descending value:
                results = results.sort((a, b) =>  b[1] - a[1]);

                // send resulting scores to user as an alert:
                let resultStr = classifyTextHeader + "\n" + "Scores:" + "\n";

                // generate a html list to show the user scores too:
                for (i in results) {
                    const scoreEl = document.createElement('li');
                    scoreEl.textContent = ' ' + results[i].join(" ");
                    resultStr += "\n" + results[i].join(" ");
                    resultEl.appendChild(scoreEl);
                    sampleHolderEl.prepend(resultEl);
                    log(results[i].join(" "));
                }
                alert(resultStr);
            });
        })
        .catch(error => {
            console.error(error);
        });
    }
    else {
        await merlinAudio.averagePredictV3(currentWaveformSample, targetSampleRate)
            // @ts-ignore
            .then(([labels, scores]) => {
                let resultStr = classifyTextHeader + "\n" + "Scores:" + "\n";
                for (let i = 0; i < 10; i++) {
                    const scoreEl = document.createElement('li');
                    scoreEl.textContent = labels[i] + " " + scores[i];
                    resultEl.appendChild(scoreEl);
                    sampleHolderEl.prepend(resultEl);
                    resultStr += labels[i] + ": " + scores[i] + " \n";
                    log(labels[i] + ": " + scores[i]);
                }
            alert(resultStr);
        });
    }
};

const generateSpectrogram = (waveform : Float32Array) : Float32Array[] => {

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

};

const renderSpectrogram = (imageURI : string, spectrogramLength: number) => {

    const image_width = Math.round(spectrogramLength * timeScale);
    imgSpec = document.createElement('img');
    imgSpec.src = imageURI;
    imgSpec.height = image_height;
    imgSpec.width = image_width;

    // Clear out previous images
    const specImageHolderEl = document.getElementById('specImageHolder');
    while (specImageHolderEl.firstChild) {
        specImageHolderEl.removeChild(specImageHolderEl.firstChild);
    }

    // Add the spectrogram
    specImageHolderEl.appendChild(imgSpec);

    // Add the slider
    const specSliderHolderEl = document.getElementById('specSliderHolder');
    while (specSliderHolderEl.firstChild) {
        specSliderHolderEl.removeChild(specSliderHolderEl.firstChild);
    }

    slider = document.createElement('div');
    slider.style.width = "" + specImageHolderEl.offsetWidth + "px";
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
            'max': specImageHolderEl.offsetWidth
        }
    });

    // create a Download Audio button:
    const dlHolder = 'downloadButtonHolder';
    const dlButton = ui_utils.MuiButton('Download Audio', dlHolder);

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

    // create a Download Spectrogram button:
    const dlSpecHolder = 'downloadSpecButtonHolder';
    const dlSpecButton = ui_utils.MuiButton('Download Spectrogram', dlSpecHolder);

    // wait for a click:
    dlSpecButton.onclick = () => {

        updateVis();

        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = imageURI;

        a.download = 'FullSpectrogram.png';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(imageURI);
        }, 100);
    };

    // create a Classify button:
    const analyzeHolder = 'specAnalyzeButtonHolder';
    const analyzeBtn = ui_utils.MuiButton('Classify', analyzeHolder);

    // wait for a click:
    analyzeBtn.onclick = async () => {

        //@ts-ignore
        currentWaveformSample = updateVis();
        // YMMV, but YOLO:
        await handleClassifyWaveform();
    };
};

const visualize = (stream : MediaStream) => {

    audioCtx = null;
    //@ts-ignore
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();

    const source = audioCtx.createMediaStreamSource(stream);

    analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = 2048;
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    source.connect(analyserNode);

    shouldDrawVisualization = true;

    const draw = () => {
        const WIDTH = canvas.width;
        const HEIGHT = canvas.height;

        if(shouldDrawVisualization){
            requestAnimationFrame(draw);
        }

        analyserNode.getByteTimeDomainData(dataArray);

        canvasCtx.fillStyle = 'rgb(255,255,255)';
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
        canvasCtx.beginPath();

        const sliceWidth = WIDTH / bufferLength;
        let x = 0;

        for(let i = 0; i < bufferLength; i++) {

            const v = dataArray[i] / 128.0;
            const y = v * HEIGHT/2;

            if(i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        canvasCtx.lineTo(canvas.width, canvas.height/2);
        canvasCtx.stroke();

    };

    draw();

};

const stop_visualize = () => {
    shouldDrawVisualization = false;
    analyserNode.disconnect();
    requestAnimationFrame(clearCanvas);
};

const clearCanvas = () => {
    canvasCtx.fillStyle = 'rgb(255,255,255)';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
};

recordBtn.onclick = () => {

    // Clear prior audio vars if any
    recordedBlobs = new Blob;
    currentWaveform = new Float32Array;
    currentWaveformSample = new Float32Array;

    // Clear prior slider if any
    const specSliderHolderEl = document.getElementById('specSliderHolder');
    while (specSliderHolderEl.firstChild) {
        specSliderHolderEl.removeChild(specSliderHolderEl.firstChild);
    }

    // Clear prior spectrogram if any
    const specImageHolderEl = document.getElementById('specImageHolder');
    while (specImageHolderEl.firstChild) {
        specImageHolderEl.removeChild(specImageHolderEl.firstChild);
    }

    // Clear prior results if any
    const sampleHolderEl = document.getElementById('specSampleHolder');
    while (sampleHolderEl.firstChild) {
        sampleHolderEl.removeChild(sampleHolderEl.firstChild);
    }


    const onSuccess = (stream : MediaStream) => {

        // you could also do mime type as:
        //  mimeType = 'audio/webm';

        mediaRecorder = new MediaRecorder(stream, {mimeType: 'audio/wav'});

        mediaRecorder.start();
        log("recorder started");

        visualize(stream);

        stopBtn.removeAttribute('disabled');
        recordBtn.setAttribute('disabled',  'disabled');

        mediaRecorder.addEventListener('stop', e => {

            // we make us a `new Blob` before anything else happens, e.g. `Analyze` or `Download`:
            recordedBlobs = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' }); // 'audio/ogg; codecs=opus'
            chunks = [];
            audioURL = window.URL.createObjectURL(recordedBlobs);

            log("recorder stopped");

            audio_loader.loadAudioFromURL(audioURL)
                .then((audioBuffer) => audio_loader.resampleAndMakeMono(audioBuffer, targetSampleRate))
                .then((audioWaveform) => {
                    currentWaveform = audioWaveform;
                    const dbSpec = generateSpectrogram(audioWaveform);
                    const imageURI = spectrogram_utils.dBSpectrogramToImage(dbSpec, topDB);
                    renderSpectrogram(imageURI, dbSpec.length);
                });
        });

        mediaRecorder.addEventListener('dataavailable', e => {
            chunks.push(e.data);
        });

    };

    const onError = (err : Error) => {
        stopBtn.setAttribute('disabled',  'disabled');
        recordBtn.removeAttribute('disabled');
    };

    const constraints = { audio: true, video : false};
    navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);

};

stopBtn.onclick = () => {

    mediaRecorder.stop();

    stop_visualize();

    stopBtn.setAttribute('disabled',  'disabled');
    recordBtn.removeAttribute('disabled');
    mediaRecorder.stream.getTracks().forEach((track) => {
        if (track.readyState === 'live' && track.kind === 'audio') {
            track.stop();
        }
    });
};
