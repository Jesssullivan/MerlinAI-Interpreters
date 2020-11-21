#!/bin/bash

echo -e "\n...cleaning .built/ type declarations..."
rm -rf .built/

echo -e "\n...cleaning openssl stuff..."
find demos/ -name "*.key" -print -delete
find demos/ -name "*.pem" -print -delete
find demos/ -name "*.crt" -print -delete


echo -e "\ncleaning ALL renders..."
find '.' -name "*_render.html" -print -delete

echo -e "\ncleaning ALL bundles..."
find '.' -name "*_bundle.js" -print -delete

echo -e "\nAll done! :) \n"
