from config import *
import tensorflow as tf
import tfjs_graph_converter.api as tfjs
import numpy as np
from os.path import isfile
from scipy.io.wavfile import read as wave_read
from tensorflow.python.platform import gfile

test_audio = './test_taps.wav'


def interpret(waveform):
    # waveform should be a .wav file
    # still need get the model to stays available & loaded at a flask endpoint
    # need to minimize server side file i/o shenanigans

    # Load TFLite model and allocate tensors.
    interpreter = tf.lite.Interpreter(model_path='../demos/models/lite/?.tflite')
    interpreter.allocate_tensors()

    # Load in the map from integer id to species code
    labels = {}
    with open('../demos/models/lite/conv_actions_labels.txt') as f:
        for i, line in enumerate(f):
            labels[i] = line.strip()

    # Get input and output tensors.
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    print("Input shape: %s" % input_details[0]['shape'])
    print("Output shape: %s" % output_details[0]['shape'])

    waveform_in = wave_read(waveform)
    input_data = np.array(waveform_in[1], dtype=np.float32)

    # Classify the image
    interpreter.set_tensor(input_details[0]['index'], input_data)
    interpreter.invoke()
    output_data = interpreter.get_tensor(output_details[0]['index'])[0]

    # Print the predictions
    label_predictions = np.argsort(output_data)[::-1]

    for i in range(10):
        label = label_predictions[i]
        score = output_data[label]
        species_code = labels[label]
        print("\t%7s %0.3f" % (species_code, score))

# ...
