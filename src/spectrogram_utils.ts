import {Greys} from './greys';

function colorMapLookup(x : number) : number{

    var i = 1;
    while (Greys[i][0] < x) {
        i = i+1;
    }
    i = i-1;

    const x1 : number = Greys[i][0];
    const x2 : number = Greys[i+1][0]
    var width : number = Math.abs(x1 - x2);
    var scaling_factor = (x - x1) / width;

    const color1 = Greys[i+1][1][0];
    const color2 = Greys[i][1][0];
    var y = color1 + scaling_factor * (color1 - color2);

    return y;
}

export function dBSpectrogramToImage(spec : Float32Array[], topDB : number) : string{


    let spec_width = spec.length;
    let spec_height = spec[0].length;
    let image_buffer = new Uint8ClampedArray(spec_width * spec_height * 4); // enough bytes for RGBA

    console.log("Spec Dimensions: [ " + spec_height + ", " + spec_width + "]");

    var min_val = Math.min.apply(null, spec.map(arr => Math.min.apply(null, arr)))
    console.log("Spec min value: " + min_val);

    var max_val = Math.max.apply(null, spec.map(arr => Math.max.apply(null, arr)));
    console.log("Spec max value: " + max_val);

    for(var y = 0; y < spec_height; y++) {
        for(var x = 0; x < spec_width; x++) {

            let mag = spec[x][(spec_height - 1) - y];
            mag = 1.0 - Math.abs(mag / topDB);      // "White background"

            let pixel_val = colorMapLookup(mag);

            var pos = (y * spec_width + x) * 4;     // position in buffer based on x and y
            image_buffer[pos  ] = pixel_val * 255;  // some R value [0, 255]
            image_buffer[pos+1] = pixel_val * 255;  // some G value
            image_buffer[pos+2] = pixel_val * 255;  // some B value
            image_buffer[pos+3] = 255;              // set alpha channel
        }
    }


    var canvas = document.createElement('canvas'),
    ctx = canvas.getContext('2d');

    canvas.width = spec_width;
    canvas.height = spec_height;

    // create imageData object
    var idata = ctx.createImageData(spec_width, spec_height);

    // set our buffer as source
    idata.data.set(image_buffer);

    // update canvas with new data
    ctx.putImageData(idata, 0, 0);

    var dataUri = canvas.toDataURL(); // produces a PNG file

    return dataUri;

}

