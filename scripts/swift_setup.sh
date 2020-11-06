#!/bin/bash
#
# `npm run-script develop-swift-demos`
#

echo -e "\n : setting up Swift environment..."

MODELDIR="demos/models/lite/"
SWIFT="swift/swift-pkgs-tmpui/swift-pkgs-tmpui/"

echo -e "\n ...: copying model files to Swift directory..."
cp -R $MODELDIR"model.tflite" $SWIFT"Model.tflite"
cp -R $MODELDIR"labels.txt" $SWIFT"Labels.txt"


cd swift/swift-pkgs-tmpui/
echo -e "\n...(path is now)" $pwd

pod install

echo -e "\n ...: updating & installing latest nightly cocoapods..."

pod update


echo -e "...: done. \ncurrent path is now " $pwd

open swift-pkgs-tmpui.xcworkspace
