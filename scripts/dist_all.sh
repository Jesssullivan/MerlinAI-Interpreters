#!/bin/bash

npm run-script dist-spec-web

wait
npm run-script dist-webgl-web

wait
npm run-script dist-anno-tool

wait
npm run-script dist-anno-audio
