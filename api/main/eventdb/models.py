from bson import json_util
from flask import current_app as app
from flask import request, jsonify
from ..tools import tools
import json


class Eventdb:

    def __init__(self):
        self.defaults = {
            "id": "",
            "bbox": [],
            "image_id": "",
            "user_id": "",
            "username": "",
            "category_id": "",
            "supercategory": ""
        }

    @staticmethod
    def add_id_event():

        _add_json = {}

        # load request:
        _request = request.json

        for id_event in _request:
            key = [id_event][0]['id']
            _add_json.update({key: [id_event][0]})

        # insert event:
        _ = app.db.eventdb.insert(_add_json)

        return tools.JsonResp(_add_json, 200)

    @staticmethod
    def delete_id_event():

        _del_json = {}

        # load request:
        _request = request.json

        for id_event in _request:
            key = [id_event][0]['id']
            _del_json.update({key: [id_event][0]})

        # delete events:
        _ = app.db.eventdb.delete_many(_del_json)

        return tools.JsonResp(_del_json, 200)

    @staticmethod
    def list():

        _raw_data = app.db.eventdb.find()
        _docs = list(_raw_data)

        return json.dumps(_docs, default=json_util.default)

    @staticmethod
    def add_dummy():

        _usr = tools.randUser()

        _event = {
            "id": tools.randID(),
            "bbox": tools.randBbox(),
            "image_id": tools.randStringNumbersOnly(8),
            "user_id": _usr + "_id",
            "username": _usr,
            "category_id": tools.randSpecies(),
            "supercategory": "Bird"
        }

        _data = app.db.eventdb.insert(_event)

        return tools.JsonResp(_data, 200)

    @staticmethod
    def query_events_dummy():

        _request = request.form

        # get key & value for query:
        _key = _request['key']
        _value = _request['value']

        # query:
        _output = app.db.eventdb.find({_key:_value})

        _docs = list(_output)

        return tools.JsonResp(_docs, 200)
