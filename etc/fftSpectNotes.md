
## *Disambiguating waveform matrix stuff:*


As of 9.29.20, the plan is to bring the preprocessing operations 
todo- finish describing of these things

- - - 


#### *Call to perform operations on waveform:*
```TypeScript
function generateSpectrogram(waveform : Float32Array) : Float32Array[]{

    // stftWindowSeconds = 0.015;
    // stftHopSeconds = 0.005;

    const window_length_samples = Math.round(targetSampleRate * stftWindowSeconds);
    const hop_length_samples = Math.round(targetSampleRate * stftHopSeconds);
    const fft_length = Math.pow(2, Math.ceil(Math.log(window_length_samples) / Math.log(2.0)));

    const spec_params = {
        sampleRate: targetSampleRate,
        hopLength: hop_length_samples,
        winLength: window_length_samples,
        power: 2.0
        nFft: fft_length,
        topDB
    };

    return audio_utils.dBSpectrogram(waveform, spec_params);
}
```


#### *Execute transformations:*
```TypeScript
export function dBSpectrogram(y: Float32Array, params: SpecParams): Float32Array[] {

    if (!params.power) {
        params.power = 2.0;
    }

    const stftMatrix = stft(y, params);
    const [spec, nFft] = magSpectrogram(stftMatrix, params.power);
    params.nFft = nFft;

    if (!params.topDB) {
      params.topDB = 80.0;
    }

    const amin = 1e-10;
    const transformed_mel_spec = _powerToDb(spec, amin, params.topDB);

    return transformed_mel_spec;
}
```

#### *... --> _powerToDb:*
```TypeScript
function _powerToDb(spec : Float32Array[], amin = 1e-10, topDb = 80.0) : Float32Array[] {
  const width = spec.length;
  const height = spec[0].length;
  const logSpec = [];
  for (let i = 0; i < width; i++) {
      logSpec[i] = new Float32Array(height);
  }

  let refValue = Math.max.apply(null, spec.map(arr => Math.max.apply(null, arr)));
  //console.log("Ref Value: " + refValue);
  //refValue = 10.0;

  for (let i = 0; i < width; i++) {
      for (let j = 0; j < height; j++) {
          const val = spec[i][j];
          logSpec[i][j] = 10.0 * Math.log10(Math.max(amin, val));
          logSpec[i][j] -= 10.0 * Math.log10(Math.max(amin, refValue));
      }
  }
  if (topDb) {
      if (topDb < 0) {
          throw new Error(`topDb must be non-negative.`);
      }

      let maxVal = Math.max.apply(null, logSpec.map(arr => Math.max.apply(null, arr)));

      for (let i = 0; i < width; i++) {
          //const maxVal = max(logSpec[i]);
          for (let j = 0; j < height; j++) {
              logSpec[i][j] = Math.max(logSpec[i][j], maxVal - topDb);
          }
      }
  }
  return logSpec;
}
```


#### *... --> magSpectrogram:*
```TypeScript
export function magSpectrogram(
    stft: Float32Array[], power: number): [Float32Array[], number] {
  const spec = stft.map(fft => pow(mag(fft), power));
  const nFft = stft[0].length - 1;
  return [spec, nFft];
}

```