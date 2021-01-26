#!/bin/bash

echo "...cleaning up..."

echo -e "\n...cleaning ./src/*.js tsc output..."
rm ./src/*.js
# rm -rf dist/*

echo -e "\n...cleaning .built/ declarations..."
rm -rf .built/
rm -rf .idea

echo -e "\ncleaning bundles..."
find '.' -name "*_bundle.js" -print -delete
find './demos/' -name "leaflet.annotation.j*" -print -delete
find '.' -name "*.pyc" -print -delete
find '.' -name "__pycache__" -print -delete

echo -e "\n...Done! :)"
