import json
from pymongo import MongoClient

# add existing annotations json to mongodb.
#
# start db in another shell:
# ` mongod --dbpath ./srv/mongodb/ --port 27017 `
#
# load:
# ` python3 etc/loader.py `
#
# check all went well with...
# ` ./Merlin -s -f -i `
#
# ...then visit 127.0.0.1/get_events to query annotations

srv_mongo = MongoClient("mongodb://localhost:27017/")
db = srv_mongo["flask_pymongo"]
Collection = db["events"]

with open('etc/annotations_11_24_2020.json') as file:
    file_data = json.load(file)

if isinstance(file_data, list):
    Collection.insert_many(file_data)
else:
    Collection.insert_one(file_data)