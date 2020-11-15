#!/bin/bash

if [[ $EUID -ne 0 ]]; then

  echo -e "Warning:\n Clean All script removes:"
  echo "openssl stuff"
  echo ".built/ type declarations"
  echo "ALL webpack bundles"
  echo -e "ALL html renders \n"
  echo "If you are certain this is what you want to do, run the following sudo:"
  echo -e "\nsudo ./scripts/clean_all.sh\n"

   exit 0
fi

echo -e "\n...cleaning .built/ type declarations..."
rm -rf .built/

echo -e "\n...cleaning openssl stuff..."
find demos/ -name "*.key" -print -delete
find demos/ -name "*.pem" -print -delete
find demos/ -name "*.crt" -print -delete


echo "cleaning ALL renders..."
find '.' -name "*_render.html" -print -delete

echo "cleaning ALL bundles..."
find '.' -name "*_bundle.js" -print -delete

echo -e "\nAll done! :) \n"
