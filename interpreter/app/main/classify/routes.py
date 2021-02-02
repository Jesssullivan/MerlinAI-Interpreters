from .models import Classifier
from .config import *
from flask import Blueprint
from flask import current_app as app
from ..tfmodels.models import TFModel
audio_model = TFModel(dir_name="audio")

classify_blueprint = Blueprint("classify", __name__)


""" routing """


# add model routes for classify here, in addition to /models/
@classify_blueprint.route(audio_model.all_models_dir_name + "/" +
                          audio_model.dir_name + "/<file>",
                          methods=["GET", "POST"])
def audio_labels(file):
    vprint(audio_model.all_models_dir_name + "/" +
          audio_model.dir_name + "/" + file)
    return app.send_static_file(audio_model.all_models_dir_name + "/" +
                                audio_model.dir_name + "/" + file)


# Index Routes:
@classify_blueprint.route("/")
def bindex():
    return redirect("/classify/server", code=302)


@classify_blueprint.route('/server', methods=['GET'])
def sbcrop():
    return app.send_static_file('spec_crop_interpreter_server.html')


@classify_blueprint.route('/browser', methods=['GET'])
def bbcrop():
    return app.send_static_file('spec_crop_interpreter_browser.html')


@classify_blueprint.route('/standard', methods=['GET', 'POST'])
def uploader_std():
    if request.method == 'POST':
        vprint('received POST')
        usr_id = new_client()
        usr_dir = new_client_dir(usr_id)
        vprint('created usr dir: ' + usr_dir)
        Classifier.uploader(usr_dir)
        results = Classifier.classify_proc_std(usr_dir)
        vprint(results)
        return jsonify(results)
    else:
        return app.send_static_file('uploaderStandardOps.html')


@classify_blueprint.route('/select', methods=['GET', 'POST'])
def uploader_select():
    if request.method == 'POST':
        vprint('received POST')
        usr_id = new_client()
        usr_dir = new_client_dir(usr_id)
        vprint('created usr dir: ' + usr_dir)
        Classifier.uploader(usr_dir)
        results = Classifier.classify_proc_select(usr_dir)
        vprint(results)
        return jsonify(results)
    else:
        return app.send_static_file('uploaderSelectOps.html')


@classify_blueprint.route("/webgl", methods=["GET"])
def clwebgl():
    return app.send_static_file("webgl_test.html")


""" static """


@classify_blueprint.route("favicon.ico", methods=["GET", "POST"])
def clcfavicon_ico():
    return app.send_static_file("icons/tmpUI.MerlinAI-favicon-dark/favicon.ico")


@classify_blueprint.route("site.webmanifest", methods=["GET", "POST"])
def clcwebmanifest():
    return app.send_static_file("icons/tmpUI.MerlinAI-favicon-dark/site.webmanifest")


@classify_blueprint.route("favicon-16x16.png", methods=["GET", "POST"])
def clcfavicon_ico16():
    return app.send_static_file("icons/tmpUI.MerlinAI-favicon-dark/favicon-16x16.png")


@classify_blueprint.route("favicon-32x32.png", methods=["GET", "POST"])
def clcfavicon_ico32():
    return app.send_static_file("icons/tmpUI.MerlinAI-favicon-dark/favicon-32x32.png")


@classify_blueprint.route("apple-touch-icon.png", methods=["GET", "POST"])
def clcapple_touch():
    return app.send_static_file("icons/tmpUI.MerlinAI-favicon-dark/apple-touch-icon.png")


@classify_blueprint.route("android-chrome-192x192.png", methods=["GET", "POST"])
def clcdroid192():
    return app.send_static_file("icons/tmpUI.MerlinAI-favicon-dark/android-chrome-192x192.png")


@classify_blueprint.route("android-chrome-512x512.png", methods=["GET", "POST"])
def clcdroid512():
    return app.send_static_file("icons/tmpUI.MerlinAI-favicon-dark/android-chrome-512x512.png")


# fetch static:
@classify_blueprint.route("<file>", methods=["GET", "POST"])
def clfilex(file):
    return app.send_static_file(file)

