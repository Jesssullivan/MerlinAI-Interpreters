#!/bin/bash
echo -e "\nPacking photo annotator...\n"
webpack --config webpack/webpack.annotator_photo.ts
echo -e "...Done packing photo annotator! \n"
