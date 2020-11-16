#!/bin/bash

echo """
      ___  ___          _ _        ___ _____
      |  \/  |         | (_)      / _ |_   _|
      | .  . | ___ _ __| |_ _ __ / /_\ \| |
      | |\/| |/ _ | '__| | | '_ \|  _  || |
      | |  | |  __| |  | | | | | | | | _| |_
      \_|  |_/\___|_|  |_|_|_| |_\_| |_\___/
     """

echo "development: Developing Annotator Demos:"

# specify openssl domain to refresh on each each launch:
DOMAIN=anno

npm run-script build-anno-tool

npm run-script build-anno-photo

npm run-script build-anno-audio

echo -e "\ndevelopment: Configuring openssl...\n"

npm run-script sslgen $DOMAIN

echo -e "\ndevelopment: Launching Leaflet.annotation Demos...\n"

http-server -S -C ./demos/anno.pem -K ./demos/anno_key.pem -o ./demos/annotator_audio.html