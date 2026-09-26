#!/usr/bin/env bash
# Builds the Firefox package from a clean copy of the source, exactly like the published one.
# For Firefox Add-ons reviewers and anyone who wants to check the build.
#
# Requirements: Linux or macOS, bash, Node.js 22 and npm 10 (network access to the npm registry).
# Usage, from the repository root:   bash browser-extension/mv3/scripts/build-firefox.sh
# Result: browser-extension/mv3/dist/ (unpacked) and browser-extension/mv3/builds/firefox/*.zip
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"

bash install.sh                    # every package, versions pinned by the package-lock.json files
bash build.sh                      # shared packages and the rule processor used by the extension
(cd app && npm run build:extension) # the rule editor, bundled into the extension

cd browser-extension/mv3
BROWSER=firefox ENV=prod npm run config
BUILD_MODE=production npm run build
node scripts/createZip
