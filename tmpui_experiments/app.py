import os

from bson import json_util
from flask import Flask, jsonify, request, abort, make_response, render_template
from flask_pymongo import PyMongo, ObjectId  # flask.ext.pymongo deprecated
from render import Render
from trashd import Trash
from classifier import Classifier
from config import *

Trash.truck()

# generate new, static html files?
if prerender:
    # configure this stuff in ./config.py
    Render.render()

# still need to update x-origin support lol:
app.secret_key = new_client()

# Load Config File for DB
app.config.from_pyfile('config.cfg')
mongo = PyMongo(app)

# App Root
APP_ROOT = os.path.dirname(os.path.abspath(__file__))

# Allowed files
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif'}

# on Heroku we are serving via gunicorn @ 0.0.0.0:
if devel:
    hostport = devport
    hosturl = devhost
else:
    hostport = 80
    hosturl = '0.0.0.0'
    logger = False

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


@app.route('/uploader_standard', methods=['GET', 'POST'])
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


@app.route('/uploader_select', methods=['GET', 'POST'])
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


# Route to Upload Page
@app.route("/alt_upload-page")
def main():
    return app.send_static_file('upload-file.html')


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# Upload File
@app.route('/alt_upload', methods=['POST'])
def upload():
    result = {'errors': []}
    # Set the target Folder
    usr_id = new_client()
    usr_dir = new_client_dir(usr_id)
    print('created usr dir: ' + usr_dir)
    # Loop file to get the images names
    for file in request.files.getlist("file"):
        filename = file.filename
        destination = "/".join([usr_dir, filename])
        if file and allowed_file(file.filename):
            file.save(destination)
            result = {'success!': [{'file': file.filename, 'dir': usr_dir}]}
        else:
            if not file.filename:
                file.filename = "empty"
            result["errors"].append({file.filename: 'not allowed'})


@app.route('/get_events', methods=['GET', 'POST'])
def get_events():
    if request.method == 'POST':

        key = request.form['key']
        value = request.form['value']

        event = mongo.db.events
        output = []

        for val in event.find({key: value}):
            ev = json.loads(json_util.dumps(val))
            output.append(ev)

        return jsonify({'events': output})
    if request.method == 'GET':
        return app.send_static_file('get_annos.html')

# List user by name
@app.route('/users/<user_id>', methods=['GET'])
def get_one_user(user_id):
    user = mongo.db.users
    q = user.find_one({'_id': ObjectId(user_id)})
    if q:
        output = {'user': {'_id': str(q['_id']), 'name': q['name'], 'language': q['language']}}
    else:
        output = {'error': 'user not found'}

    return jsonify(output)


# Post user
@app.route('/users', methods=['POST'])
def post_user():
    user = mongo.db.users
    name = request.form['name']
    language = request.form['language']
    if len(name) > 1 and len(language) > 0:
        q = user.find_one({'name': name})
        if q:
            user_found = {'_id': str(q['_id']), 'name': q['name'], 'language': q['language']}
            output = {'error': 'user exists !', 'user': user_found}
        else:
            inserted_id = user.insert({'name': name, 'language': language})
            output = {'message': 'new user created!', 'inserted_id': inserted_id}
    else:
        output = {'error': 'required fields error'}

    return jsonify(output)


# Update a user
@app.route('/users/<user_id>', methods=['PUT'])
def update_user(user_id):
    user = mongo.db.users
    q = user.find_one({'_id': ObjectId(user_id)})
    if q:
        if request.form['name']:
            q['name'] = request.form['name']
        if request.form['language']:
            q['language'] = request.form['language']

        user.save(q)
        output = {'message': 'user updated'}
    else:
        output = {'error': 'user not found'}

    return jsonify(output)


# Delete a user
@app.route('/users/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = mongo.db.users
    q = user.find_one({'_id': ObjectId(user_id)})
    if q:
        user.remove(q["_id"])
        output = {'message': 'user deleted'}
    else:
        output = {'error': 'user not found'}

    return jsonify(output)


# Error Handler 404
@app.errorhandler(404)
def not_found(error):
    app.logger.error('Server Error: %s', error)
    return make_response(jsonify({'error': 'Not found'}), 404)


# Error Handler 405
@app.errorhandler(405)
def not_found(error):
    app.logger.error('Server Error: %s', error)
    return make_response(jsonify({'error': 'Method is not allowed'}), 405)


# Error Handler 500
@app.errorhandler(500)
def internal_server_error(error):
    app.logger.error('Server Error: %s', error)
    return make_response(jsonify({'error': 'Internal Error'}), 500)


# Exception
@app.errorhandler(Exception)
def unhandled_exception(error):
    app.logger.error('Unhandled Exception: %s', error)
    return make_response(jsonify({'error': 'Unhandled Exception'}), 500)


if __name__ == "__main__":
    app.run(host=hosturl, port=os.environ.get('PORT', hostport), debug=True)
