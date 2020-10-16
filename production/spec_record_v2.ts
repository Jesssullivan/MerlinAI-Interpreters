import {audio_loader, audio_utils, AudioRecorder, spectrogram_utils} from '../src/index';

window.MediaRecorder = AudioRecorder;

const recordBtn = document.getElementById("buttonStartRecording") as HTMLButtonElement;
const stopBtn = document.getElementById("buttonStopRecording") as HTMLButtonElement;
const canvas = document.querySelector('.visualizer') as HTMLCanvasElement;
const mainSection = document.querySelector('.container-fluid') as HTMLDivElement;

stopBtn.setAttribute('disabled',  'disabled');

let mediaRecorder : MediaRecorder;
let microphoneStream : MediaStream; // You can't access `MediaRecorder.stream` on Safari, so we need to keep a pointer.
let audioCtx : AudioContext;
const canvasCtx = canvas.getContext("2d");
let chunks : Blob[] = [];

// Spectrogram Visualization Parameters
const targetSampleRate = 44100;
const stftWindowSeconds = 0.015;
const stftHopSeconds = 0.005;
const topDB = 80;

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

function renderSpectrogram(imageURI : string, spectrogramLength: number){

    // render the (scaled) spectrogram

    const image_height = 400;
    const timeScale = 1.0;
    const image_width = Math.round(spectrogramLength * timeScale);

    const img = document.createElement('img');
    img.src = imageURI;
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

function visualize(stream : MediaStream) {
    if(!audioCtx) {
        //@ts-ignore
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
    }

    const source = audioCtx.createMediaStreamSource(stream);

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    source.connect(analyser);

    draw();

    function draw() {
        const WIDTH = canvas.width;
        const HEIGHT = canvas.height;

        requestAnimationFrame(draw);

        analyser.getByteTimeDomainData(dataArray);

        canvasCtx!.fillStyle = 'rgb(200, 200, 200)';
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

recordBtn.onclick = () => {

    const onSuccess = (stream : MediaStream) => {

        microphoneStream = stream;

        //const mimeType = 'audio/webm';
        mediaRecorder = new window.MediaRecorder(stream);//, <MediaRecorderOptions>{type : mimeType});

        mediaRecorder.start();
        console.log(mediaRecorder.state);
        console.log("recorder started");

        visualize(stream);

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

    stopBtn.removeAttribute('disabled');
    recordBtn.setAttribute('disabled',  'disabled');

    const constraints = { audio: true, video : false};
    navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);

};

stopBtn.onclick = () => {
    mediaRecorder.stop();
    console.log(mediaRecorder.state);
    console.log("recorder stopped");

    stopBtn.setAttribute('disabled',  'disabled');
    recordBtn.removeAttribute('disabled');

    microphoneStream.getTracks().forEach((track) => {
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