import tensorflow as tf
import librosa
from .config import *
from scipy.signal import decimate
import json
import numpy as np

MODEL_INPUT_SAMPLE_COUNT = 22050 * 3
WINDOW_STEP_SAMPLE_COUNT = 44100


""" serverside classification """


class Classifier(object):

    @staticmethod
    def classify_proc_select(dir=''):

        # Load in the map from integer id to species code
        with open(labels_fp_select) as f:
            label_map = json.load(f)

        # Load TFLite model and allocate tensors.
        interpreter = tf.lite.Interpreter(model_path=tflite_model_fp_select)
        interpreter.allocate_tensors()

        # Get input and output tensors.
        input_details = interpreter.get_input_details()
        output_details = interpreter.get_output_details()

        print("Waveform Input Shape: %s" % input_details[0]['shape'])
        print("Output shape: %s" % output_details[0]['shape'])

        # Load in an audio file
        audio_fp = glob.glob(dir + '/*.wav')[0]
        samples_raw, sr = librosa.load(audio_fp, sr=44100, mono=True)

        samples = decimate(samples_raw, q=2)

        # Do we need to pad with zeros?
        if samples.shape[0] < MODEL_INPUT_SAMPLE_COUNT:
            samples = np.concatenate([samples, np.zeros([MODEL_INPUT_SAMPLE_COUNT - samples.shape[0]], dtype=np.float32)])

        if samples.shape[0] > MODEL_INPUT_SAMPLE_COUNT:
            samples = samples[:MODEL_INPUT_SAMPLE_COUNT]

        print(samples.shape[0])
        # How many windows do we have for this sample?
        num_windows = abs((samples.shape[0] - MODEL_INPUT_SAMPLE_COUNT) // WINDOW_STEP_SAMPLE_COUNT + 1)
        # We'll aggregate the outputs from each window in this list
        window_outputs = []

        # Pass each window
        for window_idx in range(num_windows):
            # Construct the window
            start_idx = window_idx * WINDOW_STEP_SAMPLE_COUNT
            end_idx = start_idx + MODEL_INPUT_SAMPLE_COUNT
            window_samples = samples[start_idx:end_idx]

            print('window_samples: \n '+ str(window_samples) + " \n ... ")
            # Classify the window

            interpreter.set_tensor(input_details[0]['index'], window_samples)

            interpreter.invoke()
            output_data = interpreter.get_tensor(output_details[0]['index'])[0]

            # Save off the classification scores
            window_outputs.append(output_data)

        window_outputs = np.array(window_outputs)

        # Take an average over all the windows
        average_scores = window_outputs.mean(axis=0)

        # Print the predictions
        label_predictions = np.argsort(average_scores)[::-1]

        res = {}

        for i in range(10):
            label = label_predictions[i]
            score = average_scores[label]
            species_code = label_map[label]
            print("\t%7s %0.3f" % (species_code, score))
            res[str(species_code)] = str(score)

        # return results:
        return res

    @staticmethod
    def classify_proc_std(usr_dir):  # thanks to Grant!!!  xD

        # Load in the map from integer id to species code
        with open(labels_fp_std) as f:
            label_map = json.load(f)

        # Load TFLite model and allocate tensors.
        interpreter = tf.lite.Interpreter(model_path=tflite_model_fp_std)
        interpreter.allocate_tensors()

        # Get input and output tensors.
        input_details = interpreter.get_input_details()
        output_details = interpreter.get_output_details()
        vprint("Spectrogram Input Shape: %s" % input_details[0]['shape'])
        vprint("Output shape: %s" % output_details[0]['shape'])

        # Load in an audio file
        audio_fp = glob.glob(usr_dir + '/*.wav')[0]
        samples, sr = librosa.load(audio_fp, sr=44100, mono=True)

        waveform = samples
        samplerate = 44100

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
            spectrogram = tf.concat([spectrogram, tf.zeros([num_rows_to_add, spectrogram.shape[1]], dtype=tf.float32)],
                                    axis=0)

        elif spectrogram.shape[0] > DESIRED_TIME_ROWS:
            # We need to clip the spectrogram What we actually want to do is probably window the spectrogram,
            # classify each window, and the average the results.
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

        res = {}

        vprint("Class Predictions:")
        for i in range(10):
            label = label_predictions[i]
            score = scores[label]
            species_code = label_map[label]
            vprint("\t%7s %0.3f" % (species_code, score))
            res[str(species_code)] = str(score)

        # return results:
        return res

    @staticmethod
    def uploader(usrpath):
        if request.method == 'POST':
            if 'file' not in request.files:
                flash('No file')
                return redirect(request.url)
            file = request.files['file']
            if file.filename == '':
                flash('No selected file')
                return redirect(request.url)
            if file:
                f = request.files['file']
                f.save(os.path.join(usrpath, usrfile))
