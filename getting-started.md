# Getting Started

Requirements: Node.js >= 18.18 (CI uses Node 22) and npm.

## Install

```sh
bash install.sh
```

## Build the extension

```sh
bash build.sh
```

This builds the rule processor, shared types, the rule editor app (Vite, `extension` mode) and the MV3 extension. The loadable extension ends up in `browser-extension/mv3/dist`.

## Load it in the browser

- **Chrome / Edge / Brave:** open `chrome://extensions`, enable *Developer mode*, click *Load unpacked* and pick `browser-extension/mv3/dist`.
- **Firefox:** build for Firefox first (below), then open `about:debugging#/runtime/this-firefox` → *Load Temporary Add-on…* → pick `browser-extension/mv3/dist/manifest.json`.

## Other browsers

```sh
cd browser-extension/config && BROWSER=firefox ENV=prod npm run build   # or edge / chrome
cd ../mv3 && npm run build
```

## Tests

```sh
cd browser-extension/mv3 && npm run test:e2e
```

End-to-end tests load the built extension in Chromium with Playwright (run `bash build.sh` first).

## Develop the rule editor

```sh
cd app && npm run build:extension   # rebuild the bundled editor
cd ../browser-extension/mv3 && npm run build:current   # copy it into the extension
```
