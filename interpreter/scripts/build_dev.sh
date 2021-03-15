#!/bin/bash

echo -e "Build Dev: \n...(re)packing leaflet annotator tool..."

echo -e "\n ...transpiling typed audio depends... "

tsc src/audio_model.ts --downlevelIteration

tsc src/audio_loading_utils.ts

echo -e "\n ...transpiling default style depends... "

tsc src/defaults.ts

echo -e "\n ...packing tool..."

webpack --config webpack/webpack.annotator_dev.ts

echo -e "packing done :)\n "
