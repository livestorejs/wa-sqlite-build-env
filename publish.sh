#! /bin/bash

set -ex

./build.sh

npm version patch --no-git-tag-version

npm publish --access=public
