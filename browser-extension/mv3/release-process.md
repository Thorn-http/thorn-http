# Release process

1. Bump `"version"` in `browser-extension/mv3/package.json` (semver).
2. Build and test:
   ```sh
   bash build.sh                                   # from the repo root
   cd browser-extension/mv3 && npm run test:e2e
   ```
3. Create the store packages: `cd browser-extension/mv3 && npm run release`.
   Zips are written to `browser-extension/mv3/builds/{chrome,edge,firefox}/`.
4. Smoke-test each zip by loading it unpacked: create a rule, check it applies, open the popup, record network and export HAR, open the DevTools panel.
5. Upload:
   - Chrome Web Store: https://chrome.google.com/webstore/devconsole
   - Edge Add-ons: https://partner.microsoft.com/dashboard/microsoftedge
   - Firefox AMO: https://addons.mozilla.org/developers/ (AMO also asks for the source code: upload a zip of this repository at the release tag)
6. Tag the release: `git tag -a vX.Y.Z -m "Thorn HTTP vX.Y.Z" && git push --tags`.
