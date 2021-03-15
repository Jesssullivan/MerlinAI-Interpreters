#!/bin/bash

echo -e "Building Interpreter Production bundles..."

trap

echo -e "\n...packing browser interpreter..."
webpack --config webpack/webpack.spec_web_dist_browser.ts

wait

echo -e "\n...packing server interpreter..."
webpack --config webpack/webpack.spec_web_dist_server.ts

exit 0