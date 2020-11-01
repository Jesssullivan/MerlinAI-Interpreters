import {audio_loader, audio_utils, spectrogram_utils} from '../src/index';

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

const audioInputEl = document.getElementById("audioInput") as HTMLInputElement;
audioInputEl.onchange = (e : Event) => {

    const target = e.target as HTMLInputElement;

    // Make sure the user actually selected a file
    if (target.value.length > 0) {

        // @ts-ignore
        audio_loader.loadAudioFromFile(target.files[0])
            .then((audioBuffer) => audio_loader.resampleAndMakeMono(audioBuffer, targetSampleRate))
            .then((audioWaveform) => {
                console.log("Number of samples: " + audioWaveform.length);
                const dbSpec = generateSpectrogram(audioWaveform);
                const imageURI = spectrogram_utils.dBSpectrogramToImage(dbSpec, topDB);
                renderSpectrogram(imageURI, dbSpec.length);

            });
    }
};
