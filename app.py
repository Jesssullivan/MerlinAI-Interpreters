from render import Render
from trashd import Trash
from classifier import Classifier
from config import *


""" routing """


@app.route('/')
def crop():
    return app.send_static_file('spec_crop_interpreter.html' + ext)


@app.route('/webgl')
def webgl():
    return app.send_static_file('webgl_test.html' + ext)


@app.route('/leaflet_audio', methods=['GET', 'POST'])
def leaflet_audio():
    return app.send_static_file('annotator_audio.html' + ext)


@app.route('/leaflet_photo', methods=['GET', 'POST'])
def leaflet_photo():
    return app.send_static_file('annotator_photo.html' + ext)


@app.route('/uploader_standard', methods=['GET','POST'])
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

# still need to update x-origin support lol:
app.secret_key = new_client()

if __name__ == "__main__":
    app.run(host=hosturl, port=os.environ.get('PORT', hostport))
