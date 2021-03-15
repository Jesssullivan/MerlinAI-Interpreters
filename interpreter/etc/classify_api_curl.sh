#!/bin/bash

# demonstrates audio classification POST endpoint with curl

## create a wave file to upload: ##
python3 tone.py

## send request: ##
curl -F "file=@tone_5_440.wav" https://merlinai.herokuapp.com/classify/api/select
