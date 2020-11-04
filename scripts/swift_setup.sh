#!/bin/bash

echo -e "\n development: setting up Swift environment..."

MODELDIR="demos/models/lite/"
SWIFT="swift/swift-pkgs-tmpui/swift-pkgs-tmpui/"

echo -e "\n ...development: copying model files to Swift directory..."
cp -R $MODELDIR"model.tflite" $SWIFT"Model.tflite"
cp -R $MODELDIR"labels.txt" $SWIFT"Labels.txt"

echo -e "\n ...development: updating & installing latest nightly cocoapods..."

cd swift/swift-pkgs-tmpui/
pod install
pod update

echo -e "...development: done. \ncurrent path is now " $pwd

open swift-pkgs-tmpui.xcworkspace
