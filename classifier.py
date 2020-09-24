from config import *
import tensorflow as tf
import librosa

# serverside classification --> json endpoint


class Classifier(object):

    @classmethod
    def classify_proc(cls, dir=''):
        # thanks Grant!
        # Load in the map from integer id to species code
        with open(labels_fp) as f:
            label_map = json.load(f)

        # Load TFLite model and allocate tensors.
        interpreter = tf.lite.Interpreter(model_path=tflite_model_fp)
        interpreter.allocate_tensors()

        # Get input and output tensors.
        input_details = interpreter.get_input_details()
        output_details = interpreter.get_output_details()

        # Load in an audio file
        audio_fp = glob.glob(dir + '/*.wav')[0]
        print(audio_fp)

        samples, _ = librosa.load(audio_fp, sr=SAMPLE_RATE, mono=True)

        # Do we need to pad with zeros?
        if samples.shape[0] < MODEL_INPUT_SAMPLE_COUNT:
            samples = np.concatenate(
                [samples, np.zeros([MODEL_INPUT_SAMPLE_COUNT - samples.shape[0]], dtype=np.float32)])

        # How many windows do we have for this sample?
        num_windows = (samples.shape[0] - MODEL_INPUT_SAMPLE_COUNT) // WINDOW_STEP_SAMPLE_COUNT + 1

        # We'll aggregate the outputs from each window in this list
        window_outputs = list()

        # Pass each window
        for window_idx in range(num_windows):
            # Construct the window
            start_idx = window_idx * WINDOW_STEP_SAMPLE_COUNT
            end_idx = start_idx + MODEL_INPUT_SAMPLE_COUNT
            window_samples = samples[start_idx:end_idx]

            # Classify the window
            interpreter.set_tensor(input_details[0]['index'], window_samples)
            interpreter.set_tensor(input_details[1]['index'], tf.constant(SAMPLE_RATE, dtype=tf.float32))
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
            res[str(species_code)] = str(score)

        # return resulting json:
        return jsonify(res)

    @classmethod
    def main(cls):

        usrid = new_client()
        usr_dir = os.path.join(inpath, usrid)

        try:
            if not os.path.exists('uploads'):
                subprocess.Popen(str('mkdir uploads'),
                                 shell=True,
                                 executable='/bin/bash',
                                 encoding='utf8')

            if not os.path.exists(usr_dir):
                raise NotADirectoryError

        except NotADirectoryError:
            subprocess.Popen(str('mkdir ' + usr_dir),
                             shell=True,
                             executable='/bin/bash',
                             encoding='utf8')

        uploader(usr_dir)

        # after upload:
        try:
            if not os.path.isdir(usr_dir):
                raise NotADirectoryError
            else:
                if len(os.listdir(os.path.abspath(usr_dir)) )> 0:
                    return cls.classify_proc(os.path.abspath(usr_dir))

        except NotADirectoryError:
            subprocess.Popen(str('mkdir ' + usr_dir),
                             shell=True,
                             executable='/bin/bash',
                             encoding='utf8')

        return app.send_static_file('uploader.html' + ext)

