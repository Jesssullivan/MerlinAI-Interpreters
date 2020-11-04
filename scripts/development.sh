#!/bin/bash

echo -e "\ndevelopment: packing, this could take a while..."
webpack --config webpack/es6.demo.config.ts

echo -e "\n ...development: packing leaflet annotator tool..."
webpack --config webpack/webpack.anno_tool.js

echo -e "\n ...development: packing annotator client..."
webpack --config webpack/webpack.anno_client.ts

find '.' -name "*_render.html" -print -delete

echo -e "\ndevelopment: packing done. \n..."

echo -e '\n...development: setting up Flask...'
rm -rf __pycache__/
export FLASK_APP=app.py

echo -e  '\ndevelopment: Done! \nLaunching...'
flask run
