#!/bin/bash

DATAURL='http://127.0.0.1:5000/data/mongodb'


PUTDATA='{
  "database": "IshmeetDB",
  "collection": "people",
  "Filter": {
    "First_name": "Ishmeet"
  },
  "DataToBeUpdated": {
    "Last_Name": "Bindra",
    "Age": 26
  }
}'

DELETEDATA='{
  "database": "IshmeetDB",
  "collection": "people",
  "Filter": {
    "First_Name": "Jhon"
  }
}'

# echo -e '\n Testing GET...\n'
# curl -v -X GET -H "Content-Type: application/json" -d '{"database": "IshmeetDB","collection": "people"}' http://127.0.0.1:5000/data/mongodb


echo -e '\n Testing POST...\n'

curl -X POST  -H "Content-Type: application/json"  -d '{"database": "IshmeetDB", "collection": "people","Document": {"First_Name": "Ishmeet", "Last_Name": "Bindra","Age": 26}}' http://127.0.0.1:5000/data/mongodb
