from bson import json_util
from flask import current_app as app
from flask import request, jsonify
from ..tools import tools
import json
from datetime import datetime


class Eventdb:

    def __init__(self):
        self.defaults = {
            "id": "",
            "ML_id": "",
            "username": "",
            "media_source": "",
            "bbox": [],
            "category": "",
            "supercategory": "",
            "last_modified": ""
        }

    @staticmethod
    def add_id_event():
        _add_json = []

        # load request:
        _request = request.json

        # insert event:
        _ = app.db.eventdb.insert(_request)

        return tools.JsonResp(_add_json, 200)

    @staticmethod
    def delete_id_event():
        _del_json = {}

        # load request:
        _request = request.json

        for id_event in _request:
            _del_json.update(id_event)

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
        _event = {
            "id": tools.randID(),
            "ML_id": tools.randStringNumbersOnly(8),
            "username": tools.randUser(),
            "media_source": 'https://example.com/wavfile.wav',
            "bbox": tools.randBbox(),
            "category": tools.randSpecies(),
            "supercategory": "Bird",
            "last_modified": datetime.today().isoformat()
        }

        _data = app.db.eventdb.insert(_event)

        return tools.JsonResp(_data, 200)

    @staticmethod
    def query_events_dummy(req):
        _request = req.form

        # get key & value for query:
        _key = _request['key']
        _value = _request['value']

        # query:
        _output = app.db.eventdb.find({_key: _value})

        _docs = list(_output)

        return tools.JsonResp(_docs, 200)
