#!/bin/bash

npm run-script build-spec-web

wait
npm run-script build-webgl-web

wait
npm run-script build-anno-tool

wait
npm run-script build-anno-photo

wait
npm run-script build-anno-audio
