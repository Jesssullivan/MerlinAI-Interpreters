# config.py
import os
import time
import secrets
import subprocess
import threading
import numpy as np
import json
import glob
from flask import Flask, request, flash, redirect, jsonify


"""
default values for web demos.
"""


# set `devel = False` for deployment
devel = True

# set `prerender = False` for deployment-
# renders & bundles should already be generated
prerender = True

# if `devel == False` prerender definitely also be False:
#if not devel:
#    prerender = False

# port `80` is enforced if devel = False
devport = 5000

# host `0.0.0.0` is enforced if devel = False
devhost = '127.0.0.1'

# rendered html extension:
ext = '_render.html'
static = "./demos/"

# default html chunks:
header = static + 'templates/header.html'
footer = static + 'templates/footer.html'

# model paths:
tflite_model_fp = static + "models/lite/model.tflite"
labels_fp = static + "models/lite/labels.json"
tflite_model_fp_std = static + "models/liteStdOps/model.tflite"
labels_fp_std = static + "models/liteStdOps/labels.json"

# uploaded files are placed in temporary server side directories:
live_app_list = {}
start_time = time.time()

# recording sample values for tf model:
SAMPLE_RATE = 44100
MODEL_INPUT_SAMPLE_COUNT = 44100
WINDOW_STEP_SAMPLE_COUNT = 22050

# do user level logging?
logger = False

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

# declare the Flask server:
app = Flask(__name__, static_folder=static)


# Common:


def new_client():
    return secrets.token_hex(15)


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

# on Heroku we are serving via gunicorn @ 0.0.0.0:
if devel:
    hostport = devport
    hosturl = devhost
else:
    hostport = 80
    hosturl = '0.0.0.0'
