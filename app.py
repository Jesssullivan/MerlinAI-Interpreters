from config import *
from render import Render
from trashd import Trash
from classifier import Classifier


""" routing """


@app.route('/')
def home():
    return app.send_static_file('webgl_init.html' + ext)


@app.route('/crop_dl')
def crop_4():
    return app.send_static_file('spec_record_crop_dl.html' + ext)


@app.route('/webgl')
def webgl():
    return app.send_static_file('webgl_test.html' + ext)


@app.route('/leaflet')
def leaflet():
    return app.send_static_file('annotator.html')


@app.route('/uploader_select', methods=['GET', 'POST'])
def wav_select_classify():
    wavc = Classifier()
    return wavc.main()


@app.route('/uploader_standard', methods=['GET', 'POST'])
def wav_std_classify():
    wavc = Classifier()
    return wavc.main(std=True)


@app.route('/crop_3')
def crop_3():
    return app.send_static_file('spec_record_crop_v3.html' + ext)


@app.route('/display')
def disp():
    return app.send_static_file('spec_display.html' + ext)


@app.route('/load')
def load():
    return app.send_static_file('load_audio.html' + ext)


@app.route('/record_v2')
def rec2():
    return app.send_static_file('spec_record_v2.html' + ext)


# start the garbage daemon:
Trash.truck()


# generate new, static html files?
if prerender:
    # configure this stuff in ./config.py
    Render.render()


if __name__ == "__main__":
    app.run(host=hosturl, port=os.environ.get('PORT', hostport))
