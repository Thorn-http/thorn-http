#!/usr/bin/env bash
# Builds store-ready zips for Chrome, Edge and Firefox into mv3/builds/<browser>/.
# Usage: from browser-extension/mv3: npm run release   (bump "version" in package.json first)
set -e
cd "$(dirname "$0")/.."

echo "** Building the rule editor app **"
(cd ../../app && npm run build:extension)

for BROWSER in chrome edge firefox; do
  echo "** Building for $BROWSER **"
  BROWSER=$BROWSER ENV=prod npm run config
  BUILD_MODE='production' npm run build
  node scripts/createZip
done

# Reset config for local development
BROWSER=chrome ENV=local npm run config
