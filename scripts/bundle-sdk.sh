#!/bin/bash
set -eux

rm -rf dist
mkdir -p dist/v4

# Bundle v2 of the SDK
cp -R ./resources/v2/* ./dist

# Bundle built javascript and source maps
cp ./packages/browser/build/*.js ./dist/v4
cp ./packages/browser/build/*.map ./dist/v4

# Bundle Connect banner
mkdir -p dist/v4/install/carbon-installer
cp -R ./packages/carbon-installer/build/* ./dist/v4/install/carbon-installer

# Bundle legacy Connect banner
cp -R ./resources/auto-topbar ./dist/v4/install/auto-topbar

# Bundle installers and build connect_references.json
node ./scripts/bundle-installers.js ./dist
node ./scripts/bundle-installers.js ./dist/v4

# Bundle non-javascript files
cp ./resources/notices.txt ./dist/v4
cp -R ./resources/plugin ./dist/v4/plugin

# Bundle docs
cp -R ./packages/browser/docs ./dist/v4/docs
