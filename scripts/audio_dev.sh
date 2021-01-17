#!/bin/bash

echo -e "Audio Dev: \n...(re)packing Audio Annotator Demo..."

webpack --config webpack/webpack.audio_dev.ts

echo -e "\n ...packing done :)"
