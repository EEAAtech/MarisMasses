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