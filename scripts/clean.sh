#!/bin/bash


echo -e "Warning: this script REMOVES:
./es6
./.built
./production
ALL renders
ALL bundles
"

if [[ $EUID -ne 0 ]]; then
   echo -e "If you are certain this is what you want to do, run the following sudo:\n
   sudo ./scripts/clean.sh
   "
   exit 0
fi


#echo "removing node_modules..."
# rm -rf node_modules

echo "removing ./es6..."
find '.' -name "es6" -type d -print -exec rm -rf {} \;

echo "removing ./production..."
find '.' -name "production" -type d -exec rm -rf {} \;

echo "removing all renders..."
find '.' -name "*_render.html" -print -delete

echo "removing all bundles..."
find '.' -name "*_bundle.js" -print -delete