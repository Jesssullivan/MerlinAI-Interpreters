from bson import json_util
from flask import current_app as app
from flask import request, jsonify
from ..tools import tools
import json
from bson.json_util import dumps
from bson.objectid import ObjectId


class Eventdb:

    def __init__(self):
        self.defaults = {
            "id":"",
            "bbox": [],
            "image_id": "",
            "user_id": "",
            "username": "",
            "category_id": "",
            "supercategory": ""
        }

    @staticmethod
    def add_id_event():
        # load request:
        _json = request.json

        # get fields to add:
        _id = _json['id']
        _bbox = _json['bbox']
        _image_id = _json['image_id']
        _user_id = _json['user_id']
        _username = _json['username']
        _category_id = _json['category_id']
        _supercategory = _json['supercategory']

        _id_event = {'id': _id,
                     'bbox': _bbox,
                     'image_id': _image_id,
                     'user_id': _user_id,
                     'username': _username,
                     'category_id': _category_id,
                     'supercategory': _supercategory
                     }

        # insert event:
        _ = app.db.eventdb.insert(_id_event)
        resp = tools.JsonResp(_id_event, 200)
        return resp

    @staticmethod
    def list():
        _raw_data = app.db.eventdb.find()
        _docs = list(_raw_data)
        return json.dumps(_docs, default=json_util.default)

    @staticmethod
    def add_dummy():
        _event = {
            "id": tools.randID(),
            "bbox": tools.randBbox(),
            "image_id": "",
            "user_id": "",
            "username": "",
            "category_id": "",
            "supercategory": ""
        }

        _data = app.db.eventdb.insert(_event)

        return tools.JsonResp(_data, 200)
