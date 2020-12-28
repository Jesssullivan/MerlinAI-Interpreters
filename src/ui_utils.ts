// misc clientside functions.

// audio stuff:
import {audio_utils, spectrogram_utils} from "../src/index";

export function MuiButton(titleName: string, holderName: string) {
    // MuiButton uses material-ui bootstrap:
    const MuiHolder = document.getElementById(holderName);
    const MuiBtn = document.createElement("button");

    MuiBtn.classList.add("mui-btn");
    MuiBtn.classList.add("mui-btn--raised");
    MuiBtn.textContent = titleName;

    // make sure all is updated in DOM
    while (MuiHolder!.firstChild) {
            MuiHolder!.removeChild(MuiHolder!.firstChild);
    }

    MuiHolder!.appendChild(MuiBtn);
    return(MuiBtn);

}

export function generateSpectrogramToURI(waveform : Float32Array) {

    // Spectrogram Visualization Parameters
    const targetSampleRate = 44100;
    const stftWindowSeconds = 0.015;
    const stftHopSeconds = 0.005;
    const topDB = 80;
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

    const dbSpec = audio_utils.dBSpectrogram(waveform, spec_params);
    return spectrogram_utils.dBSpectrogramToImage(dbSpec, topDB);

}

const toasts = document.querySelectorAll(".toast");
const toastTriggers = document.querySelectorAll(".toast__trigger");

let clicked: boolean = false;

toastTriggers.forEach((trigger, index) => {
  let toastTimeout;

  trigger.addEventListener("click", () => {
    if (clicked === true) {
      toasts[index].classList.add("toast--active");
      toastTimeout = setTimeout(() => {
        toasts[index].classList.remove("toast--active");
      }, 3500);
    }
  });

  toasts[index].addEventListener("click", () => {
    toasts[index].classList.remove("toast--active");
    clearTimeout(toastTimeout);
  });
});

export function reColor(btn: string, color: string = "lightcoral", defaultColor: string = "#7FAF41") {
    const property = document.getElementById(btn);

    if (clicked === false) {
        property.style.backgroundColor = color;
        clicked = true;
    }
    else {
        property.style.backgroundColor = defaultColor;
        clicked = false;
    }
}
