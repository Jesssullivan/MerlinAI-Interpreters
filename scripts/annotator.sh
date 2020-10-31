#!/bin/bash

echo -e "\ndevelopment: packing leaflet annotator tool...\n"
webpack --config webpack/webpack.anno.js

echo "development: packing done. \n opening demos/annotator.html..."
google-chrome demos/annotator.html