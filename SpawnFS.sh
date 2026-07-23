#!/usr/bin/env bash
set -euo pipefail

mkdir -p \
  presenter \
  static/client \
  static/controller \
  static/common \
  static/images \
  package/items \
  package/images \
  state \
  docs \
  logs

touch \
  run.py \
  requirements.txt \
  README.md \
  LICENSE \
  .gitignore \
  presenter/__init__.py \
  presenter/app.py \
  presenter/config.py \
  package/manifest.json \
  package/sequence.json \
  state/state.json


  //Todos
  1. One small issue I spotted while writing this commit: if a browser disconnects unexpectedly, the broadcast() loop could eventually encounter a dead queue. The current implementation will work well for our development and testing, but before we declare a production release I'd like to harden the SSE layer with heartbeat messages and more graceful handling of disconnects. That will be treated as a bug fix, not an architectural change, so it stays within our architecture freeze.
  