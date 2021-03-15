from flask import Blueprint, request
from .models import Eventdb
from flask import current_app as app
from ..auth.auth import token_required


eventdb_blueprint = Blueprint("events", __name__)


@eventdb_blueprint.route('add', methods=['POST'])
def add_id_event():
    return Eventdb().add_id_event()


@eventdb_blueprint.route('delete', methods=['POST'])
def delete_id_event():
    return Eventdb().delete_id_event()


@eventdb_blueprint.route('list')
def event_list():
    return Eventdb().list()


@eventdb_blueprint.route('add_dummy')
def add_dummy():
    return Eventdb().add_dummy()


@eventdb_blueprint.route('query_events_dummy',  methods=['GET', 'POST'])
def query_events_dummy():
    if request.method == 'POST':
        return Eventdb().query_events_dummy(request)
    elif request.method == 'GET':
        return app.send_static_file('get_annos.html')

