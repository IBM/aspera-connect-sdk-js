#!/bin/bash
set -ex

if [[ -z $GIT_BRANCH ]]; then
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
else
  BRANCH=$GIT_BRANCH
fi

HASH=$(git log --format=oneline --pretty=format:"%h" -1 .)
REVISION=$(node -p -e "require('./package.json').version")

cd dist

if [[ $BRANCH == 'master' ]]; then
  zip -r ../ConnectSDK-$REVISION-$HASH.zip .
else
  zip -r ../ConnectSDK-$REVISION-$BRANCH-$HASH.zip .
fi
