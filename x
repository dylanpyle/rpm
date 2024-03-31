#!/bin/bash

set -o errexit
set -o nounset
set -o pipefail
set -o noglob

cmd:format() {
  deno fmt src
}

cmd:check() {
  deno lint src
  deno fmt --check src
  npx tsc --noEmit
}

cmd:dev() {
  set +o noglob
  mkdir -p dist

  npx esbuild src/index.ts \
    --bundle \
    --outfile=static/bundle.js \
    --watch=forever \
    --servedir=static \
    --platform=node \
    --serve-fallback=static/index.html \
    --serve=8080

  set -o noglob
}

cmd:build() {
  set +o noglob
  mkdir -p dist

  cp -r static/* dist

  npx esbuild src/index.ts \
    --bundle \
    --minify \
    --platform=node \
    --outfile=dist/bundle.js \

  set -o noglob
}

cmd:publish() {
  set +o noglob

  git branch -D production || true
  git checkout -b production main

  npm install
  cmd:build

  ls | grep -v dist | xargs rm -rf
  mv dist/* .
  rm -rf dist

  git add .
  git commit -m "Publish"
  git push -f

  git checkout main

  set -o noglob
}

(
  cd $(dirname "$0")
  "cmd:$@"
)
