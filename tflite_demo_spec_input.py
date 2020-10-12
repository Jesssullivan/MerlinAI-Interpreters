# Thanks Grant!

import json
import librosa
import numpy as np
import tensorflow as tf


SAMPLE_RATE = 44100
MODEL_INPUT_SAMPLE_COUNT = 44100
WINDOW_STEP_SAMPLE_COUNT = 22050

tflite_model_fp = "./demos/liteStdOps/model.tflite"
labels_fp = "./demos/liteStdOps/labels.json"

# Load in the map from integer id to species code
with open(labels_fp) as f:
    label_map = json.load(f)


# Load TFLite model and allocate tensors.
interpreter = tf.lite.Interpreter(model_path=tflite_model_fp)
interpreter.allocate_tensors()

# Get input and output tensors.
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()
print("Spectrogram Input Shape: %s" % input_details[0]['shape'])
print("Output shape: %s" % output_details[0]['shape'])

# Load in an audio file
audio_fp = "/Users/GVH/Downloads/259309231.mp3"
samples, sr = librosa.load(audio_fp, sr=SAMPLE_RATE, mono=True)

assert sr == SAMPLE_RATE, "The preprocessing code assumes a sample rate of %d" % SAMPLE_RATE

waveform = samples
samplerate = SAMPLE_RATE

# Need to convert the audio waveform to a spectrogram

window_length_samples = 1102
hop_length_samples = 441
fft_length = 2048
num_spectrogram_bins = 1025

# Create the spectrogram
magnitude_spectrogram = tf.abs(
    tf.signal.stft(
        signals=waveform,
        frame_length=window_length_samples,
        frame_step=hop_length_samples,
        fft_length=fft_length
    )
)


# Convert spectrogram into log mel spectrogram.
linear_to_mel_weight_matrix = tf.signal.linear_to_mel_weight_matrix(
    num_mel_bins=96,
    num_spectrogram_bins=num_spectrogram_bins,
    sample_rate=samplerate,
    lower_edge_hertz=50,
    upper_edge_hertz=11025
)

mel_spectrogram = tf.matmul(magnitude_spectrogram, linear_to_mel_weight_matrix)


# Nonlinear transformation of the magnitude values
non_linear_alpha = -1.7
spectrogram = tf.math.pow(mel_spectrogram, (1. / (1. + tf.math.exp(-non_linear_alpha))))


# Normalize the spectrogram to [0, 1]
spectrogram = spectrogram - tf.math.reduce_min(spectrogram)
max_val = tf.math.reduce_max(spectrogram)
spectrogram = tf.math.divide(spectrogram, max_val)


# Tensorflow Lite expects a fixed input size
# So if the spectrogram is not long enough, or is too long, then we need to adjust it
DESIRED_TIME_ROWS = 298
if spectrogram.shape[0] < DESIRED_TIME_ROWS:
    # We need to add rows with 0s
    num_rows_to_add = DESIRED_TIME_ROWS - spectrogram.shape[0]
    spectrogram = tf.stack([spectrogram, tf.zeros(num_rows_to_add, spectrogram.shape[1], dtype=tf.float32)])

elif spectrogram.shape[0] > DESIRED_TIME_ROWS:
    # We need to clip the spectrogram
    # What we actually want to do is probably window the spectrogram, classify each window, and the average the results.
    spectrogram = spectrogram[:DESIRED_TIME_ROWS]

else:
    # The spectrogram is the "correct" size
    pass

# [PATCH_FRAMES, PATCH_BANDS] -> [PATCH_FRAMES, PATCH_BANDS, 1]
spectrogram = tf.expand_dims(spectrogram, axis=2)

# Duplicate the spectrogram to create an "RGB" image
spectrogram = tf.tile(spectrogram, [1, 1, 3])

# [PATCH_FRAMES, PATCH_BANDS, 1] -> [1, PATCH_FRAMES, PATCH_BANDS, 1]
spectrogram_batch = tf.expand_dims(spectrogram, 0)


# Classify the spectrogram
interpreter.set_tensor(input_details[0]['index'], spectrogram_batch)
interpreter.invoke()
output_data = interpreter.get_tensor(output_details[0]['index'])[0]


# Print the predictions
scores = output_data
label_predictions = np.argsort(scores)[::-1]
print("Class Predictions:" )
for i in range(10):
    label = label_predictions[i]
    score = scores[label]
    species_code = label_map[label]
    print("\t%7s %0.3f" % (species_code, score))
