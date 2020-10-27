import pyaudio
import wave
from playsound import playsound
import simpleaudio as sa
import IPython.display
import matplotlib.pyplot as plt
import librosa.display
import IPython.display
import numpy as np

y, sr = librosa.load(librosa.util.example_audio_file())
IPython.display.Audio(data=y, rate=sr)


filename = './tone_5_440.wav'
wave_obj = sa.WaveObject.from_wave_file(filename)
play_obj = wave_obj.play()

play_obj.wait_done()  # Wait until sound has finished playing
IPython.display.Audio(data=y, rate=sr)

"""
quit()
# set the chunk size of 1024 samples
chunk = 1024
# sample format
FORMAT = pyaudio.paInt16
# mono, change to 2 if you want stereo
channels = 1
# 44100 samples per second
sample_rate = 44100
record_seconds = 5
# initialize PyAudio object
p = pyaudio.PyAudio()
# open stream object as input & output
stream = p.open(format=FORMAT,
                channels=channels,
                rate=sample_rate,
                input=True,
                output=True,
                frames_per_buffer=chunk)
frames = []
print("Recording...")
for i in range(int(44100 / chunk * record_seconds)):
    data = stream.read(chunk)
    # if you want to hear your voice while recording
    # stream.write(data)
    frames.append(data)
print("Finished recording.")
# stop and close stream
stream.stop_stream()
stream.close()
# terminate pyaudio object
p.terminate()
# save audio file
# open the file in 'write bytes' mode
wf = wave.open(filename, "wb")
# set the channels
wf.setnchannels(channels)
# set the sample format
wf.setsampwidth(p.get_sample_size(FORMAT))
# set the sample rate
wf.setframerate(sample_rate)
# write the frames as bytes
wf.writeframes(b"".join(frames))
# close the file
wf.close()
"""
