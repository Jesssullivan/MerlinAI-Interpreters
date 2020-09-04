// webgl_float_test.ts
import {tf} from '../src';

const canvas = document.querySelector('.visualizer') as HTMLCanvasElement;
const mainSection = document.querySelector('.container-fluid') as HTMLDivElement;

// we'll return our findings to a placeholder element:
const glSupportHolderEl = document.getElementById('glSupportHolder');
while (glSupportHolderEl!.firstChild) {
    glSupportHolderEl!.removeChild(glSupportHolderEl!.firstChild);
}

function buffer(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

const capable = tf.ENV.getBool('WEBGL_RENDER_FLOAT32_CAPABLE');

if (capable) {
    buffer(2000);
    glSupportHolderEl!.prepend("WebGL mediump float: Terrific! These demos are supported on your device.");
    buffer(2000);
    window.location.href = '/crop_dl';
} else {
    buffer(2000);
    const message = "WebGL mediump float: Hmm, these demos are not supported on this device.  Come build an awesome native version with us @ https://github.com/JessSullivan/tmpUI";
    glSupportHolderEl!.prepend(message);
    alert(message);
}

// Make the canvas the full width
window.addEventListener('resize', () => {
    canvas.width = mainSection.offsetWidth;
});

window.dispatchEvent(new Event('resize'));