#!/bin/bash

echo "$CONSOLE ...(re)rendering html pages..."
find '.' -name "*_render.html" -delete &> $DEMOLOG &

echo "$CONSOLE setting up flask..."
rm -rf __pycache__/ &> $FLASKLOG &

## launch ##
flask run &> $FLASKLOG &
