from flask import Blueprint, render_template, Response, request
from flask import current_app as app

from app.main.tfmodels.models import TFModel

client_blueprint = Blueprint("client", __name__)

audio_model = TFModel(dir_name="audio")


@client_blueprint.route(audio_model.all_models_dir_name + "/" +
                        audio_model.dir_name + "/<file>",
                        methods=["GET", "POST"])
def audio_labels(file):
    print(audio_model.all_models_dir_name + "/" +
          audio_model.dir_name + "/" + file)
    return app.send_static_file(audio_model.all_models_dir_name + "/" +
                                audio_model.dir_name + "/" + file)


# packed demo routes:
@client_blueprint.route("/audio", methods=["GET"])
def anno_audio():
    return Response(response=render_template('otf_index.html'), status=200)


@client_blueprint.route("/audio_ml", methods=["GET"])
def anno_audio_ml():
    return Response(response=render_template('remote_index.html'), status=200)


# fetch static:
@client_blueprint.route("<file>", methods=["GET", "POST"])
def filex(file):
    return app.send_static_file(file)