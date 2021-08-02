# the predict function returns merlin's guess
# we extract predictions for rolling windows
import glob
import os
from subprocess import call

import librosa
from librosa.display import specshow as specshow
import numpy as np
import requests
from tqdm import tqdm
import tensorflow as tf

import matplotlib
from matplotlib import pyplot as plt

# Specify the input size to the model
SAMPLERATE = 22050
WINDOW_SIZE_SAMPLES = int(SAMPLERATE * 3)
WINDOW_STEP_SIZE_SAMPLES = int(SAMPLERATE * 1.5)

# Specify duration covered per plot:
SEG_LENGTH_SEC = 30

# classify threshold:
THRESH = .4

# Restore the model
savedmodel_dir = os.path.join("demos/models", "savedmodel_with_preprocessing")
model = tf.saved_model.load(savedmodel_dir)

# Load in the species codes that correspond to the model's outputs
model_text_labels = np.loadtxt(os.path.join(savedmodel_dir, "labels.txt"), dtype=object).tolist()

ml_prefix = 'https://cdn.download.ams.birds.cornell.edu/api/v1/asset/%s%s'
ml_asset_addr = lambda ml_id: ml_prefix % (ml_id, '.wav')


class Report(object):

    @staticmethod
    def download_ml_asset(usr_dir, asset_id):
        # we'll try downloading the mp3 and process it
        # if the 22050 isn't already available-
        # we'll use the converted wav file to draw the spectrogram
        try:
            # file was not present:
            response = requests.get(ml_asset_addr(asset_id), stream=True)
            ml_asset_local = os.path.join(usr_dir, str(asset_id) + '.wav')

            # write the wav file we just downloaded:
            with open(ml_asset_local, "wb") as new_file:
                for data in tqdm(response.iter_content()):
                    new_file.write(data)

            if os.path.isfile(ml_asset_local):
                print('got ml file!')
                return ml_asset_local
            else:
                return False

        except:
            # somthing didn't work-
            return False

    # plot_predictions function generates and returns a prediction graph of merlin's top 5 detections
    @staticmethod
    def plot_predictions(usr_dir,
                         thresh=THRESH,
                         plot=True):
        audio_fp = glob.glob(usr_dir + '/*.wav')[0]
        plot_fp = os.path.join(usr_dir, 'prediction_plot.png')

        # load in audio:
        samples, samplerate = librosa.load(audio_fp,
                                           sr=22050,
                                           mono=True)

        # padding out clip extra heavy handedly, please forgive me:
        while samples.shape[0] / samplerate < 3:
            samples = np.pad(samples, 100, mode='constant')

        # put labels and predictions in these lists:
        target_labels = []

        # classify in windowed chunks
        # Compute the number of valid patches
        w = samples.shape[0]
        f = WINDOW_SIZE_SAMPLES
        s = WINDOW_STEP_SIZE_SAMPLES
        p = 0

        num_valid_patches = (w - f + 2 * p) // s + 1
        patch_predictions = []

        for window_index in range(num_valid_patches):
            start_index = window_index * WINDOW_STEP_SIZE_SAMPLES
            end_index = start_index + WINDOW_SIZE_SAMPLES

            window_samples = samples[start_index:end_index]

            # Returns [1, Number of Classes]
            predictions = model(window_samples).numpy()[0]

            patch_predictions.append({
                "start_index": start_index,
                "end_index": end_index,
                "predictions": predictions
            })

        # What is the average prediction across the whole audio?
        all_preds = np.array([p['predictions'] for p in patch_predictions])

        preds = np.mean(all_preds, axis=0)

        # it may be the case with really short, low quality audio
        # we do not get any predictions whatsoever
        if preds.ndim == 0:
            print('ndim is 0, returning false')
            return False

        # perhaps something has gone all pearshaped with the audio file:
        if np.isnan(preds.all()):
            print('isnan, returning false')
            return False

        # skim off the top 5 scores and labels:
        K = 5
        top_preds = np.argsort(preds)[::-1][:K]
        top_scores = [preds[i] for i in top_preds]
        top_pred_category_ids = [model_text_labels[i] for i in top_preds]

        for i in range(5):
            if top_scores[i] > 0:
                label = top_preds[i]
                if model_text_labels[label] not in target_labels:
                    target_labels.append(model_text_labels[label])

        valid_target_labels = []
        for target_label in target_labels:
            if target_label not in model_text_labels:
                print("%s not in model" % target_label)
            else:
                valid_target_labels.append(target_label)

        target_Labels = valid_target_labels

        # pick some colors:
        color_options = ['C0', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'black', 'yellow', 'red', 'blue',
                         'green']
        target_label_colors = {label: color_options[i] for i, label in enumerate(target_labels)}

        num_patches = len(patch_predictions)
        num_classes = len(target_labels)

        ys, xs = np.mgrid[0:num_classes, 0:num_patches]
        ys = []
        xs = []
        colors = []

        for i, target_label in enumerate(target_labels):

            target_index = model_text_labels.index(target_label)

            for patch_index in range(num_patches):

                pred_info = patch_predictions[patch_index]

                s = pred_info['start_index']
                e = pred_info['end_index']
                h = s + (e - s) / 2.
                h_sec = h / samplerate

                xs.append(h_sec)
                ys.append(i)

                preds = pred_info['predictions']

                score = preds[target_index]

                if score >= thresh:
                    colors.append(matplotlib.colors.to_rgba(target_label_colors[target_label]))
                else:
                    colors.append(matplotlib.colors.to_rgba('white'))

        colored_labels = np.array(colors, dtype=np.float32)

        # plot data?
        if plot:
            # make a long spectrogram
            A = np.abs(librosa.stft(
                samples,
                n_fft=1024,
                hop_length=256,
                win_length=512
            ))
            D = librosa.amplitude_to_db(A, ref=np.max)

            # Show the spectrogram input
            plt.figure(figsize=(30, 10))
            ax = plt.subplot(2, 1, 1)
            specshow(D, y_axis='linear', x_axis='time', sr=samplerate, hop_length=256, ax=ax,
                                     cmap='Greys')

            max_time = samples.shape[0] / samplerate

            ax = plt.subplot(2, 1, 2)

            for target_label in target_labels:

                if target_label not in model_text_labels:
                    print("%s not in model" % target_label)
                    continue

                target_index = model_text_labels.index(target_label)

                scores = []
                times = []

                for pred_info in patch_predictions:
                    preds = pred_info['predictions']
                    scores.append(preds[target_index])

                    s = pred_info['start_index']
                    e = pred_info['end_index']
                    h = s + (e - s) / 2.
                    h_sec = h / samplerate

                    times.append(h_sec)

                ax.plot(times, scores, label=target_label)

            ax.plot([0, max_time], [0.5, 0.5], 'k--')
            ax.set_ylim([0, 1])
            ax.set_xlim([0, max_time])
            ax.legend()
            plt.savefig(plot_fp)

        # return plot path:
        return plot_fp
