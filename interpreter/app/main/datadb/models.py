from flask import current_app as app
from flask import request, jsonify
from ..tools import tools
import json
from datetime import datetime

from flask import Flask, request, json, Response
from pymongo import MongoClient

import os
import csv
import json
import random
import subprocess
import tarfile
import glob
from math import floor
from shutil import copyfile

# load common names:
from .preprocess.common import *


class DataAPI:

    def __init__(self, data):
        self.client = MongoClient("mongodb://127.0.0.1:27017/")

        database = data['IshmeetDB']
        collection = data['people']
        cursor = self.client[database]
        self.collection = cursor[collection]
        self.data = data

    def read(self):
        print('Reading Data')
        documents = self.collection.find()
        output = [{item: data[item] for item in data if item != '_id'} for data in documents]
        return output

    def write(self):
        print('Writing Data')
        # load request:
        _request = request.json
        print(_request)
        self.collection.insert(_request)
        return tools.JsonResp(_request, 200)

    def update(self):
        print('Updating Data')
        filt = self.data['Filter']
        updated_data = {"$set": self.data['DataToBeUpdated']}
        response = self.collection.update_one(filt, updated_data)
        output = {'Status': 'Successfully Updated' if response.modified_count > 0 else "Nothing was updated."}
        return output

    def delete(self, data):
        print('Deleting Data')
        filt = data['Document']
        response = self.collection.delete_one(filt)
        output = {'Status': 'Successfully Deleted' if response.deleted_count > 0 else "Document not found."}
        return output


class Asset:

    def __init__(self):
        self.defaults = {
            "url": "",
            "audio": "",
            "src": "",
            "attribution": ""
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

        return json.dumps(_docs)

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
