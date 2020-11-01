#!/bin/bash

echo "development: packing, this could take a while..."
webpack --config webpack/es6.demo.config.ts

echo -e "\n ...development: packing leaflet annotator tool...\n"
webpack --config webpack/webpack.anno_tool.js

echo -e "\n ...development: packing annotator client...\n"
webpack --config webpack/webpack.anno_client.ts

find '.' -name "*_render.html" -print -delete

echo -e "\ndevelopment: packing done. \n..."
export FLASK_APP=app.py

echo 'development: starting Flask...'
flask run
