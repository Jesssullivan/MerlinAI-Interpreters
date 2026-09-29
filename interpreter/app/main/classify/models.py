from .config import *
from . import recipe_onnx  # 2026: stands in for TensorFlow Lite, librosa and scipy's decimate
import json
import numpy as np
import pydub
import os


MODEL_INPUT_SAMPLE_COUNT = 22050 * 3
WINDOW_STEP_SAMPLE_COUNT = 44100


""" serverside classification """


class Classifier(object):

    @staticmethod
    def classify_proc_select(dir=''):

        # Load in the map from integer id to species code
        # 2026: labels.json and model.tflite were never committed; the reconstruction's
        # class names and ONNX session (recipe_onnx) stand in for both.
        label_map = recipe_onnx.labels()

        # convert mp3 if needed
        try:
            mp3_fp = glob.glob(dir + '/*.mp3')[0]
            sound = pydub.AudioSegment.from_mp3(mp3_fp)
            sound.export(dir + "/snippet.wav", format="wav")
        except:
            print('no *.mp3 to convert, continuing...')
            pass

        # rename if suffix is malformed
        try:
            rename_fp_raw=None

            if glob.glob(dir + '/*.WAV')[0]:
                rename_fp_raw = glob.glob(dir + '/*.WAV')[0]

            elif glob.glob(dir + '/*.wave')[0]:
                rename_fp_raw = glob.glob(dir + '/*.wave')[0]

            elif glob.glob(dir + '/*.WAVE')[0]:
                rename_fp_raw = glob.glob(dir + '/*.WAVE')[0]

            os.rename(rename_fp_raw, dir + '/snippet.wav')

        except:
            pass

        # Load in an audio file
        audio_fp = glob.glob(dir + '/*.wav')[0]
        # 2026: decoded straight to 22050 Hz (recipe_onnx.load_22050) instead of
        # librosa.load(sr=44100) followed by decimate(q=2)
        samples = recipe_onnx.load_22050(audio_fp)

        # Do we need to pad with zeros?
        if samples.shape[0] < MODEL_INPUT_SAMPLE_COUNT:
            samples = np.concatenate(
                [samples, np.zeros([MODEL_INPUT_SAMPLE_COUNT - samples.shape[0]], dtype=np.float32)])

        if samples.shape[0] > MODEL_INPUT_SAMPLE_COUNT:
            samples = samples[:MODEL_INPUT_SAMPLE_COUNT]

        samples = samples.astype(np.float32)

        # How many windows do we have for this sample?
        num_windows = abs((samples.shape[0] - MODEL_INPUT_SAMPLE_COUNT) // WINDOW_STEP_SAMPLE_COUNT + 1)

        # sanity check
        num_windows = 1 if num_windows < 1 else num_windows

        window_outputs = []

        # Pass each window
        for window_idx in range(num_windows):
            # Construct the window
            start_idx = window_idx * WINDOW_STEP_SAMPLE_COUNT
            end_idx = start_idx + MODEL_INPUT_SAMPLE_COUNT
            window_samples = samples[start_idx:end_idx]

            # 2026: was the TFLite set_tensor / invoke / get_tensor
            output_data = recipe_onnx.predict(window_samples)

            # Save off the classification scores
            window_outputs.append(output_data)

        window_outputs = np.array(window_outputs)
        # Take an average over all the windows
        average_scores = window_outputs.mean(axis=0)
        # Print the predictions
        label_predictions = np.argsort(average_scores)[::-1]
        res = dict()
        for i in range(min(10, len(label_predictions))):  # 2026: three classes, not ten
            label = label_predictions[i]
            try:
                if float(average_scores[label]) <= .001:
                    return res
                else:
                    score = average_scores[label]
            except:
                return res

            species_code = label_map[label]
            res[str(species_code)] = str(score)

        return res

    @staticmethod
    def classify_proc_std(usr_dir):  # thanks to Grant!!!  xD

        # Load in the map from integer id to species code
        # 2026: labels.json and model.tflite were never committed (see classify_proc_select)
        label_map = recipe_onnx.labels()

        # Load in an audio file
        audio_fp = glob.glob(usr_dir + '/*.wav')[0]
        # 2026: the 2021 tf.signal front end (96-bin mel, 44.1 kHz, fixed 298 frames) fed a TFLite
        # model that was never committed, so it goes with that model. The reconstruction's own
        # front end (xoruby ml/recipe2021/frontend.py; PCEN inside the ONNX graph) runs in
        # recipe_onnx.predict on the first 3 s, as the select path does.
        samples = recipe_onnx.load_22050(audio_fp)
        output_data = recipe_onnx.predict(samples)

        # Print the predictions
        scores = output_data
        label_predictions = np.argsort(scores)[::-1]

        res = {}

        vprint("Class Predictions:")
        for i in range(min(10, len(label_predictions))):  # 2026: three classes, not ten
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
                f.save(os.path.join(usrpath, f.filename))
