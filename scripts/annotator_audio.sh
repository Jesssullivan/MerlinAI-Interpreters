#!/bin/bash
echo -e "\nPacking audio annotator...\n"
webpack --config webpack/webpack.annotator_audio.ts
echo -e "...Done packing audio annotator! \n"
