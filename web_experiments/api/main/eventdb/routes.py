import json
from flask import Blueprint
from .models import Eventdb
from ..tools.tools import JsonResp
from flask import current_app as app


eventdb_blueprint = Blueprint("events", __name__)


@eventdb_blueprint.route('add', methods=['POST'])
def add_id_event():
    return Eventdb().add_id_event()


@eventdb_blueprint.route('list')
def event_list():
    return Eventdb().list()


@eventdb_blueprint.route('add_dummy')
def dummy_add():
    return Eventdb().add_dummy()
