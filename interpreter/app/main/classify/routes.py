from .models import Classifier
from .config import *
from flask import Blueprint, url_for
from flask import current_app as app
from ..tfmodels.models import TFModel
import os
from flask import render_template, request, redirect, send_from_directory, send_file
from werkzeug.utils import secure_filename


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
    return render_template('spec_crop_interpreter.html')


@classify_blueprint.route("/webgl", methods=["GET"])
def clwebgl():
    return app.send_static_file("webgl_test.html")


""" upload routes """


@classify_blueprint.route('/select', methods=['POST'])
def pupload_files():

    # create a temporary directory for this user:
    usr_id = new_client()
    usr_dir = new_client_dir(usr_id)

    uploaded_file = request.files['file']
    filename = secure_filename(uploaded_file.filename)

    if filename != '':
        # all seems well, save the file:
        uploaded_file.save(os.path.join(usr_dir, filename))

    res = Classifier.classify_proc_select_v2(usr_dir)

    return res


@classify_blueprint.route('/select', methods=['GET'])
def gupload_files():
    return render_template("uploaderSelectOps.html")


@classify_blueprint.route('/api/select', methods=['POST'])
def api_pupload_files():

    # create a temporary directory for this user:
    usr_id = new_client()
    usr_dir = new_client_dir(usr_id)

    uploaded_file = request.files['file']
    filename = secure_filename(uploaded_file.filename)

    if filename != '':
        # all seems well, save the file:
        uploaded_file.save(os.path.join(usr_dir, filename))

    res = Classifier.classify_proc_select_v2(usr_dir)

    return res


@classify_blueprint.route('/standard', methods=['GET'])
def gupload_filesstandard():
    return render_template("uploaderStandardOps.html")


@classify_blueprint.route('/standard', methods=['POST'])
def pupload_filesstandard():

    # create a temporary directory for this user:
    usr_id = new_client()
    usr_dir = new_client_dir(usr_id)

    uploaded_file = request.files['file']
    filename = secure_filename(uploaded_file.filename)

    if filename != '':
        # all seems well, save the file:
        uploaded_file.save(os.path.join(usr_dir, filename))

    res = Classifier.classify_proc_select_v2(usr_dir)

    for x in res:
        print(x + ": " + res[x])
        flash(x + ": " + res[x])

    return render_template("uploaderStandardOps.html")


@classify_blueprint.route('/api/standard', methods=['POST'])
def api_pupload_filesstandard():

    # create a temporary directory for this user:
    usr_id = new_client()
    usr_dir = new_client_dir(usr_id)

    uploaded_file = request.files['file']
    filename = secure_filename(uploaded_file.filename)

    if filename != '':
        # all seems well, save the file:
        uploaded_file.save(os.path.join(usr_dir, filename))

    res = Classifier.classify_proc_std(usr_dir)
    return jsonify(res)


""" fetch static """


@classify_blueprint.route("<file>", methods=["GET", "POST"])
def clfilex(file):
    return app.send_static_file(file)
