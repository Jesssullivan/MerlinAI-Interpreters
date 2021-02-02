import os
import time
import secrets
import subprocess
import threading
import numpy as np
import json
import glob
from flask import Flask, request, flash, redirect, jsonify
from flask_cors import CORS, cross_origin
import tensorflow as tf
import librosa

# set `devel = False` for deployment
devel = False
devport = 5000
devhost = '127.0.0.1'
verbose = False

# rendered html extension:
ext = '_render.html'
static = "./demos/"

# default html chunks:
header = static + 'templates/header.html'
footer = static + 'templates/footer.html'

# model paths:
tflite_model_fp_select = static + "models/lite/model.tflite"
labels_fp_select = static + "models/lite/labels.json"

tflite_model_fp_std = static + "models/liteStdOps/model.tflite"
labels_fp_std = static + "models/liteStdOps/labels.json"

# uploaded files are placed in temporary server side directories:
live_app_list = {}
start_time = time.time()

# recording sample values for tf model:
MODEL_SAMPLE_RATE = 22050


# how often should the garbage collector remove old directories?
collection_int = 60  # secs
collection_trash = 30  # secs

# recyclable serverside directories-

# serverside paths:
rootpath = os.path.abspath(os.curdir)

# temporary user directories go in here:
inpath = os.path.join(rootpath, 'uploads')
outpath = os.path.join(rootpath, 'downloads')

# file uploads:

# placeholders for usr hash:
usrfile = 'snippet.wav'
usr_id = ''


def new_client():
    return secrets.token_hex(15)


def new_client_dir(usrid):
    usr_dir = os.path.join(inpath, usrid)

    # make user a temporary directory:
    try:
        os.mkdir(usr_dir)
    except:
        pass

    return usr_dir


def vprint(text):
    if verbose:
        print(text)
