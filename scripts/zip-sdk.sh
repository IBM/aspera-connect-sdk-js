#!/bin/bash
set -eux

BRANCH=$(git rev-parse --abbrev-ref HEAD)
HASH=$(git log --format=oneline --pretty=format:"%h" -1 .)
REVISION=$(node -p -e "require('./package.json').version")

cd dist

if [[ $BRANCH == 'master' ]]; then
  zip -r ../ConnectSDK-$REVISION-$HASH.zip .
else
  zip -r ../ConnectSDK-$REVISION-$BRANCH-$HASH.zip .
fi
