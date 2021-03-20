export declare const loadAudioFromURL: (url: string) => Promise<any>;
export declare const loadAudioFromFile: (blob: Blob) => Promise<AudioBuffer>;
export declare const getMonoAudio: (audioBuffer: AudioBuffer) => Float32Array;
export declare const resampleAndMakeMono: (audioBuffer: AudioBuffer, targetSr?: number) => Promise<Float32Array>;
