from render import Render
from trashd import Trash
from classifier import Classifier
from config import *


""" routing """


@app.route('/')
def home():
    return app.send_static_file('webgl_init.html' + ext)


@app.route('/crop_dl')
def crop_dl():
    return app.send_static_file('spec_record_crop_dl.html' + ext)


@app.route('/crop_post')
def crop_post():
    return app.send_static_file('spec_record_crop_post.html' + ext)


@app.route('/webgl')
def webgl():
    return app.send_static_file('webgl_test.html' + ext)


@app.route('/leaflet')
def leaflet():
    return app.send_static_file('annotator.html')


@app.route('/uploader_standard', methods=['GET','POST'])
@cross_origin()
def uploader_std():
    if request.method == 'POST':
        print('received POST')
        usr_id = new_client()
        usr_dir = new_client_dir(usr_id)
        print('created usr dir: ' + usr_dir)
        uploader(usr_dir)
        results = Classifier.classify_proc_std(usr_dir)
        print(results)
        return jsonify(results)

    else:
        flash('waiting for POST!')
        return Classifier.send_static_html(std=True)


@app.route('/uploader_select',methods=['GET','POST'])
@cross_origin()
def uploader_select():
    if request.method == 'POST':
        print('received POST')
        usr_id = new_client()
        usr_dir = new_client_dir(usr_id)
        print('created usr dir: ' + usr_dir)
        uploader(usr_dir)
        results = Classifier.classify_proc_select(usr_dir)
        print(results)
        return jsonify(results)

    else:
        flash('waiting for POST!')
        return Classifier.send_static_html(std=False)


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


# on Heroku we are serving via gunicorn @ 0.0.0.0:
if devel:
    hostport = devport
    hosturl = devhost
else:
    hostport = 80
    hosturl = '0.0.0.0'
    logger = False



if __name__ == "__main__":
    app.run(host=hosturl, port=os.environ.get('PORT', hostport))
