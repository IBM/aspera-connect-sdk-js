#!/bin/sh
set -eux

BRANCH=$(git rev-parse --abbrev-ref HEAD)
HASH=$(git log --format=oneline --pretty=format:"%h" -1 .)
REVISION=$(node -p -e "require('./package.json').version")

cd dist

# Zip up the SDK and carbon banner
if [[ $BRANCH == 'main' ]]; then
  zip -r ../ConnectSDK-$REVISION-$HASH.zip .
  cd ./v4/install && zip -r ../../../carbon-banner-$REVISION-$HASH.zip ./carbon-installer && cd ../..
else
  # Replace all forward slahes in the branch name with an underscore
  BRANCH_PATH=${BRANCH//\//_}
  zip -r ../ConnectSDK-$REVISION-$BRANCH_PATH-$HASH.zip .
  cd ./v4/install && zip -r ../../../carbon-banner-$REVISION-$BRANCH_PATH-$HASH.zip ./carbon-installer && cd ../..
fi
