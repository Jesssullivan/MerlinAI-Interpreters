#!/bin/bash
#
# `npm run-script develop-swift-demos`
#
echo """
      ___  ___          _ _        ___ _____
      |  \/  |         | (_)      / _ |_   _|
      | .  . | ___ _ __| |_ _ __ / /_\ \| |
      | |\/| |/ _ | '__| | | '_ \|  _  || |
      | |  | |  __| |  | | | | | | | | _| |_
      \_|  |_/\___|_|  |_|_|_| |_\_| |_\___/
     """

echo -e ": setting up Swift environment..."

MODELDIR="demos/models/lite/"
SWIFT="swift/swift-pkgs-tmpui/swift-pkgs-tmpui/"

echo -e "\n ...: copying model files to Swift directory..."
cp -R $MODELDIR"model.tflite" $SWIFT"Model.tflite"
cp -R $MODELDIR"labels.txt" $SWIFT"Labels.txt"

echo -e "\n...cd swift/swift-pkgs-tmpui \n..." 
cd swift/swift-pkgs-tmpui/

pod install

echo -e "\n ...: updating & installing latest nightly cocoapods..."

pod update


echo -e "...: done."

open swift-pkgs-tmpui.xcworkspace
