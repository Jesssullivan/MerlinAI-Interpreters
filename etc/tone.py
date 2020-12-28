#!/usr/bin/env python3

import numpy as np
from scipy.io.wavfile import write
from sys import argv
from os.path import abspath

# Generate .wav file from the command line
#
# testing out the accuracy of fft in Swift
#
# @ github.com/Jesssullivan/tmpUI


default_msg = str("no args specified, using defaults \n " +
                  " - you can specify duration in seconds & frequency in Hz like so: \n " +
                  " ` python3 tone.py 5 440 ` ")


def generate_sine_wav(frequency=440, length=5):

    # stick with 44100 as sample rate:
    _sample_rate = 44100

    # parse any arguments passed from the shell:
    try:
        num_args = len(argv)
        if num_args == 1:
            length = int(argv[1])
            print(length)
        elif num_args > 1:
            length = int(argv[1])
            frequency = int(argv[2])
            print(argv[2])

    # no args, use defaults:
    except:
        print(default_msg)

    # give the wav file a name:
    file_name = "tone_" + str(length) + "_" + str(frequency) + ".wav"
    print("...Creating file `" + file_name + "` ")

    # generate a file:
    file = np.linspace(0, length, _sample_rate * length)

    # set frequency in Hz:
    output_array = np.sin(frequency * 2 * np.pi * file)
    # write out the .wav file:
    write(file_name, _sample_rate, output_array)

    # tell everyone about it:
    print("...Generated file: \n " +
          str(abspath(file_name)) +
          "\n:)")


if __name__ == "__main__":

    try:
        generate_sine_wav()

    except KeyboardInterrupt:
        print("...Create .wav file aborted.")
        quit()