#!/bin/bash
set -eux

REVISION=$(node -p -e "require('./package.json').version")
HASH=$(git log --format=oneline --pretty=format:"%h" -1 .)

cd dist && zip -r ../ConnectSDK-$REVISION-$HASH.zip .
