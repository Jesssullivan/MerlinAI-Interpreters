from flask import Blueprint, request
from .models import Datadb
from flask import current_app as app
from ..auth.auth import token_required


Datadb_blueprint = Blueprint("events", __name__)


@Datadb_blueprint.route('add', methods=['POST'])
def add_id_event():
    return Datadb().add_id_event()


@Datadb_blueprint.route('delete', methods=['POST'])
def delete_id_event():
    return Datadb().delete_id_event()


@Datadb_blueprint.route('list')
def event_list():
    return Datadb().list()


@Datadb_blueprint.route('add_dummy')
def add_dummy():
    return Datadb().add_dummy()


@Datadb_blueprint.route('query_events_dummy',  methods=['GET', 'POST'])
def query_events_dummy():
    if request.method == 'POST':
        return Datadb().query_events_dummy(request)
    elif request.method == 'GET':
        return app.send_static_file('get_annos.html')

