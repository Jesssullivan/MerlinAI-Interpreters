#!/bin/bash

echo -e "\n ...development: packing annotator client...\n"
webpack --config webpack/webpack.anno_client.ts

echo -e "development: packing done. \n"

# echo "opening demos/annotator.html..."
# google-chrome demos/annotator_client.html