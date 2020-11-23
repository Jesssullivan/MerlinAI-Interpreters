/**
 * Utilities for loading audio either from a url or from a file.
 * It is important to remember that Webkit can only create an OfflineAudioContext with
 * a sample rate of 44100. This means that if you want to use Safari and resample audio
 * to something other than 44100, the operation will probably be slow.
 */
export declare function loadAudioFromURL(url: string): Promise<AudioBuffer>;
export declare function loadAudioFromFile(blob: Blob): Promise<AudioBuffer>;
export declare function getMonoAudio(audioBuffer: AudioBuffer): Float32Array;
export declare function resampleAndMakeMono(audioBuffer: AudioBuffer, targetSr?: number): Promise<Float32Array>;
