#!/bin/bash

echo -e "\nPacking demos...\n"

webpack --config webpack/es6.demo.config.ts

echo -e "...Done packing demos. \n"
