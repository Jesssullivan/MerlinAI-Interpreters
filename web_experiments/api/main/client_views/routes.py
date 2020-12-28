from flask import Blueprint, render_template, Response, send_file
from flask import current_app as app

# todo: split demos into self contained blueprints

client_blueprint = Blueprint("client", __name__)


# static:


@client_blueprint.route(u"/site.webmanifest", methods=["GET", "POST"])
def manifest():
    return app.send_static_file('site.webmanifest')


@client_blueprint.route(u"/nouislider.css", methods=["GET", "POST"])
def nouislider_css():
    return app.send_static_file('nouislider.css')


@client_blueprint.route("/apple-touch-icon.png", methods=["GET", "POST"])
def apple_touch():
    return app.send_static_file('apple-touch-icon.png')


@client_blueprint.route("style.css", methods=["GET"])
def style_css():
    return Response(response=render_template('style.css'), status=200, mimetype="text/css")


# tf models:


@client_blueprint.route("models/audio/model.json", methods=["GET"])
def audio_model():
    return app.send_static_file("models/audio/model.json")


@client_blueprint.route("models/audio/labels.json", methods=["GET"])
def audio_labels():
    return app.send_static_file("models/audio/labels.json")


@client_blueprint.route("models/audio/group1-shard1of2.bin", methods=["GET", "POST"])
def shard1of2():
    return app.send_static_file("models/audio/group1-shard1of2.bin")


@client_blueprint.route("models/audio/group1-shard2of2.bin", methods=["GET", "POST"])
def shard2of2():
    return app.send_static_file("models/audio/group1-shard2of2.bin")


# web interpreter demo:


@client_blueprint.route("/", methods=["GET"])
def interpreter():
    return app.send_static_file('spec_crop_interpreter.html')


@client_blueprint.route("spec_crop_interpreter_bundle.js", methods=["GET"])
def spec_crop_interpreter_bundle():
    return app.send_static_file('spec_crop_interpreter_bundle.js')


# annotator tool:


@client_blueprint.route("annotator_tool_bundle.js", methods=["GET"])
def annotator_tool_bundle():
    return render_template("annotator_tool_bundle.js")


# annotator audio:


@client_blueprint.route("/audio", methods=["GET"])
def anno_audio():
    return Response(response=render_template('annotator_audio.html'), status=200)


@client_blueprint.route("annotator_audio_bundle.js", methods=["GET"])
def annotator_audio_bundle():
    return Response(response=render_template('annotator_audio_bundle.js'), status=200)


# annotator photo:


@client_blueprint.route("/photo", methods=["GET"])
def anno_photo():
    return Response(response=render_template('annotator_photo.html'), status=200)


@client_blueprint.route("annotator_photo_bundle.js", methods=["GET"])
def annotator_photo_bundle():
    return Response(response=render_template('annotator_photo_bundle.js'), status=200)


# webgl test:


@client_blueprint.route("/webgl", methods=["GET"])
def webgl():
    return render_template("webgl_test.html")


@client_blueprint.route("webgl_float_test_bundle.js", methods=["GET"])
def webgl_float_test_bundle():
    return Response(response=render_template('webgl_float_test_bundle.js'), status=200)

