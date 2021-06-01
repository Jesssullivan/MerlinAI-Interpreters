interface AudioInterface {
    pixels_per_second: number;
    pixels_per_ms: number;
    pan_interval_ms: number;
    audioElement: any;
    playing_audio: boolean;
    playing_audio_timing_id: number;
    current_offset: number;
}
declare class AudioPlayer implements AudioInterface {
    pan_interval_ms: number;
    pixels_per_second: number;
    current_offset: number;
    playing_audio: boolean;
    playing_audio_timing_id: any;
    audioElement: any;
    pixels_per_ms: number;
    panSpectrogram: () => void;
    audioEnded: () => void;
    startPlaying: () => void;
    stopPlaying: () => void;
    goForward: () => void;
    goBackward: () => void;
    handleKeyDown: (e: any) => void;
    enableAudioKeys: () => void;
    disableAudioKeys: () => void;
}
interface SpectrogramInterface {
    targetSpectrogramHeight: number;
    targetSampleRate: number;
    stftWindowSeconds: number;
    stftHopSeconds: number;
    topDB: number;
    window_length_samples: number;
    hop_length_samples: number;
    fft_length: number;
}
declare class SpectrogramPlayer extends AudioPlayer implements SpectrogramInterface {
    targetSpectrogramHeight: number;
    targetSampleRate: number;
    stftWindowSeconds: number;
    stftHopSeconds: number;
    topDB: number;
    window_length_samples: number;
    hop_length_samples: number;
    fft_length: number;
    generate: (image_info: {
        [image_info: string]: any;
    }) => Promise<HTMLImageElement>;
}
export { SpectrogramPlayer };
