import {audio_loader, audio_utils, spectrogram_utils} from '../src/index';

// Spectrogram Visualization Parameters
const targetSampleRate = 44100;
const stftWindowSeconds = 0.015;
const stftHopSeconds = 0.005;
const topDB = 80;

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

}


let audioInputEl = document.getElementById("audioInput") as HTMLInputElement;
audioInputEl.onchange = (e : Event) => {

    const target = <HTMLInputElement>e.target;

    // Make sure the user actually selected a file
    if (target.value.length > 0) {

        audio_loader.loadAudioFromFile( target.files[0])
            .then((audioBuffer) => audio_loader.resampleAndMakeMono(audioBuffer, targetSampleRate))
            .then((audioWaveform) => {
                console.log("Number of samples: " + audioWaveform.length);
                let dbSpec = generateSpectrogram(audioWaveform);
                let imageURI = spectrogram_utils.dBSpectrogramToImage(dbSpec, topDB);
                renderSpectrogram(imageURI, dbSpec.length);

            });
    }
};


