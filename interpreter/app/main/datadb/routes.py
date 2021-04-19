from flask import Blueprint, request, Response
from .models import DataAPI
import json


datadb_blueprint = Blueprint("data", __name__)


@datadb_blueprint.route('/mongodb')
def mongo_read():
    data = request.json
    if data is None or data == {}:
        return Response(response=json.dumps({"Error": "Please provide connection information"}),
                        status=400,
                        mimetype='application/json')
    DataAPI(data)
    # response = obj1.read()
    return Response(response=json.dumps('\n Got a GET! \n'),
                    status=200,
                    mimetype='application/json')


@datadb_blueprint.route('/mongodb', methods=['POST'])
def mongo_write():
    data = request.json
    if data is None or data == {} or 'Document' not in data:
        return Response(response=json.dumps({"Error": "Please provide connection information"}),
                        status=400,
                        mimetype='application/json')

    response = DataAPI(da).write()
    return response


@datadb_blueprint.route('/mongodb', methods=['PUT'])
def mongo_update():
    data = request.json
    if data is None or data == {} or 'DataToBeUpdated' not in data:
        return Response(response=json.dumps({"Error": "Please provide connection information"}),
                        status=400,
                        mimetype='application/json')
    obj1 = DataAPI(data)
    response = obj1.update()
    return Response(response=json.dumps(response),
                    status=200,
                    mimetype='application/json')


@datadb_blueprint.route('/mongodb', methods=['DELETE'])
def mongo_delete():
    data = request.json
    if data is None or data == {} or 'Filter' not in data:
        return Response(response=json.dumps({"Error": "Please provide connection information"}),
                        status=400,
                        mimetype='application/json')
    obj1 = DataAPI(data)
    response = obj1.delete(data)
    return Response(response=json.dumps(response),
                    status=200,
                    mimetype='application/json')


"""
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

"""