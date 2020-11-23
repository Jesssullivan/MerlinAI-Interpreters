#!/bin/bash

echo -e "\n ...development: (re)packing leaflet annotator tool..."

echo -e "\n ...development: transpiling typed annotator depends... "

tsc src/audio_model.ts --downlevelIteration

tsc src/audio_loading_utils.ts

echo -e "\n ...development: packing tool..."

webpack --config webpack/webpack.annotator_tool.js

echo -e "development: packing done. \n "

# echo "opening demos/annotator.html..."
# google-chrome demos/annotator_client.html