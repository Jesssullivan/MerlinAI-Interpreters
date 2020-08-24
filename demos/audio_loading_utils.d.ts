export declare function loadAudioFromURL(url: string): Promise<AudioBuffer>;
export declare function loadAudioFromFile(blob: Blob): Promise<AudioBuffer>;
export declare function getMonoAudio(audioBuffer: AudioBuffer): Float32Array;
export declare function resampleAndMakeMono(audioBuffer: AudioBuffer, targetSr?: number): Promise<Float32Array>;
