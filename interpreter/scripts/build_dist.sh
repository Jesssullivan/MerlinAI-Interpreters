#!/bin/bash

PUBDIR="./demos/"
# PUBDIR="../../../../public/dist/"

DIST="./dist/*"
FNAME="leaflet.annotation.js"

echo -e "Distribute: \n...(re)packing leaflet annotator tool..."

rm -rf ./dist/*

echo -e "\n ...transpiling typed audio depends... "

tsc src/audio_model.ts --downlevelIteration

tsc src/audio_loading_utils.ts

echo -e "\n ...transpiling default style depends... "

tsc src/defaults.ts

echo -e "\n ...packing tool..."

webpack --config webpack/webpack.annotator_dist.ts

echo -e "\npacking done, distributing to ${PUBDIR}..."

# mark existing `leaflet.annotation.js` as an archive:
# mv ${DIST} ${ARCH}

# copy new `./dist/leaflet.annotation.js` to public directory:
cp -rf ${DIST} ${PUBDIR}

echo -e "\n...Distribute complete :)"
