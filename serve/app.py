from flask import Flask
from render import Render
import os
from config import *


app = Flask(__name__, static_folder=static)


""" routing """


@app.route('/crop_3')
def crop_3():
    return app.send_static_file('spec_record_crop_v3.html' + ext)


@app.route('/crop_dl')
def crop_4():
    return app.send_static_file('spec_record_crop_dl.html' + ext)


@app.route('/')
def webgl_init():
    return app.send_static_file('webgl_init.html' + ext)


@app.route('/display')
def disp():
    return app.send_static_file('spec_display.html' + ext)


@app.route('/load')
def load():
    return app.send_static_file('load_audio.html' + ext)


@app.route('/record_v2')
def rec2():
    return app.send_static_file('spec_record_v2.html' + ext)


@app.route('/webgl')
def webgl():
    return app.send_static_file('webgl_float_test.html' + ext)


@app.route('/leaflet')
def leaflet():
    return app.send_static_file('annotator.html')


if prerender:
    Render.render()

if devel:
    hostport = devport
    hosturl = devhost
else:
    hostport = 80
    hosturl = '0.0.0.0'


if __name__ == "__main__":
    app.run(host=hosturl, port=os.environ.get('PORT', hostport))

