#!/bin/bash

echo -e "\n ...development: packing leaflet annotator tool...\n"
webpack --config webpack/webpack.anno_tool.js

echo -e "development: packing done. \n "

# echo "opening demos/annotator.html..."
# google-chrome demos/annotator_client.html