#!/bin/bash

trap "kill 0" EXIT

npm run-script build-spec-web

wait
npm run-script build-test-web

wait
npm run-script build-anno-tool

wait
npm run-script build-anno-photo

wait
npm run-script build-anno-audio


exit 0
