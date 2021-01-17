#!/bin/bash

echo -e "Audio Dist: \n...(re)packing Audio Annotator Demo..."

webpack --config webpack/webpack.audio_dist.ts

echo -e "\n ...packing done :)"
