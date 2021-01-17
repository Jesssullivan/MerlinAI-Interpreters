from flask import Blueprint, render_template, Response, request
from flask import current_app as app
from ..tfmodels.models import TFModel

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


@client_blueprint.route("/", methods=["GET"])
def interpreter():
    return app.send_static_file('spec_crop_interpreter.html')


@client_blueprint.route("/audio", methods=["GET"])
def anno_audio():
    return Response(response=render_template('otf_index.html'), status=200)


@client_blueprint.route("/photo", methods=["GET"])
def anno_photo():
    return Response(response=render_template('annotator_photo.html'), status=200)


@client_blueprint.route("/webgl", methods=["GET"])
def webgl():
    return render_template("webgl_test.html")


# static:
@client_blueprint.route("favicon.ico", methods=["GET", "POST"])
def cfavicon_ico():
    return app.send_static_file("icons/tmpUI.MerlinAI-favicon-dark/favicon.ico")


@client_blueprint.route("site.webmanifest", methods=["GET", "POST"])
def cwebmanifest():
    return app.send_static_file("icons/tmpUI.MerlinAI-favicon-dark/site.webmanifest")


@client_blueprint.route("favicon-16x16.png", methods=["GET", "POST"])
def cfavicon_ico16():
    return app.send_static_file("icons/tmpUI.MerlinAI-favicon-dark/favicon-16x16.png")


@client_blueprint.route("favicon-32x32.png", methods=["GET", "POST"])
def cfavicon_ico32():
    return app.send_static_file("icons/tmpUI.MerlinAI-favicon-dark/favicon-32x32.png")


@client_blueprint.route("apple-touch-icon.png", methods=["GET", "POST"])
def capple_touch():
    return app.send_static_file("icons/tmpUI.MerlinAI-favicon-dark/apple-touch-icon.png")


@client_blueprint.route("android-chrome-192x192.png", methods=["GET", "POST"])
def cdroid192():
    return app.send_static_file("icons/tmpUI.MerlinAI-favicon-dark/android-chrome-192x192.png")


@client_blueprint.route("android-chrome-512x512.png", methods=["GET", "POST"])
def cdroid512():
    return app.send_static_file("icons/tmpUI.MerlinAI-favicon-dark/android-chrome-512x512.png")


# fetch static:
@client_blueprint.route("<file>", methods=["GET", "POST"])
def filex(file):
    return app.send_static_file(file)
