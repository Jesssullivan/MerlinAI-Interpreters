#!/bin/bash

echo -e "production: packing, this could take a while..."
# webpack --config webpack/es6.production.config.ts

echo -e "production: packing done. \n..."

echo "production: copying css..."
find demos/ -name \*.css  -print -exec cp {} production/ \;

echo "production: copying *.png favicon..."
find demos/ -name \*.png  -print -exec cp {} production/ \;

echo -e "production: copying remaining objects @ static/...\n..."
cp -rf demos/static/* production/

echo -e "production: copying tf model...\n..."
cp -rf demos/models production/models

echo "production: copying rendered html..."
find demos/ -name \*_render.html  -print -exec cp {} production/ \;
