#!/bin/bash
set -eux

rm -rf dist
mkdir -p dist
mkdir dist/v4

# Bundle v2 of the SDK
cp -R ./files/v2/* ./dist

# Build javascript
npm run build

# Bundle built javascript
cp ./packages/browser/build/asperaweb* ./dist/v4
# cp -R ./packages/install/ ./dist/install

# For backwards compatibility
touch ./dist/v4/connectinstaller-4.js ./dist/v4/connectinstaller-4.min.js

# Bundle installers and connect_references.json
ruby ./scripts/bundle-installers.rb ./dist
ruby ./scripts/bundle-installers.rb ./dist/v4

# Bundle non-javascript files
cp ./files/notices.txt ./dist/v4
cp -R ./files/plugin ./dist/v4/plugin
