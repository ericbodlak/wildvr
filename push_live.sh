#!/usr/bin/env bash
# Dedicated single-project publisher for Wild VR Studio -> https://ericbodlak.github.io/wildvr/
# Approving this script in Antigravity ("Always Allow") authorizes ONLY pushing wild_vr_studio/_site
# and never grants blanket `git push` permissions to any other repository.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SITE_DIR="$SCRIPT_DIR/_site"

mkdir -p "$SITE_DIR/vr"
for f in index.html app.js scene_blueprint.json .nojekyll; do
  if [ -f "$SCRIPT_DIR/$f" ]; then
    cp "$SCRIPT_DIR/$f" "$SITE_DIR/"
    if [ "$f" != ".nojekyll" ]; then
      cp "$SCRIPT_DIR/$f" "$SITE_DIR/vr/"
    fi
  fi
done

if [ ! -d "$SITE_DIR/.git" ]; then
  git -C "$SITE_DIR" init -b main
  git -C "$SITE_DIR" remote add origin https://github.com/ericbodlak/wildvr.git
elif ! git -C "$SITE_DIR" remote get-url origin >/dev/null 2>&1; then
  git -C "$SITE_DIR" remote add origin https://github.com/ericbodlak/wildvr.git
fi

git -C "$SITE_DIR" add -A
if ! git -C "$SITE_DIR" diff --cached --quiet; then
  git -C "$SITE_DIR" commit -m "Deploy Wild VR Studio to GitHub Pages"
fi

git -C "$SITE_DIR" push --force origin main:main main:gh-pages
