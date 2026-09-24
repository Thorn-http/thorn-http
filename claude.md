Thorn HTTP: a free, local-first HTTP interceptor browser extension (fork of Requestly HTTP Interceptor, AGPLv3). No accounts, no backend, no telemetry. See `ROADMAP.md` for status.

# Layout

- `browser-extension/mv3/` — MV3 extension: service worker, content scripts, page scripts, DNR rule management. Built with Rollup into `browser-extension/mv3/dist`. See `browser-extension/mv3/claude.md`.
- `browser-extension/common/` — Extension UI and shared extension code: popup, DevTools panel, network-recording side panel, in-page custom elements, storage. See `browser-extension/common/claude.md`.
- `browser-extension/config/` — Build-time config (`configs/env/*.json`, `configs/browser/*.json`) → `config/dist/config.build.json`.
- `app/` — React rule editor (Vite). Built in `extension` mode (`app/app.html`, `app/.env.extension`) and copied into the extension dist; served as `chrome-extension://<id>/app.html#/...` with a hash router.
- `common/rule-processor/` — Rule matching/processing engine (`@thorn-http/rule-processor`, exposed via root package `@thorn-http/core`).
- `common/analytics-vendors/` — Analytics Inspector vendor definitions for the DevTools panel (not telemetry).
- `shared/` — Shared TypeScript types (`@thorn-http/shared`).

# How the pieces talk

- `WEB_URL` in the extension config is `"extension"`; `browser-extension/common/src/config.ts` resolves it at runtime to `chrome.runtime.getURL("app.html#")`, so `${WEB_URL}/rules/...` opens the bundled editor.
- `app.html` loads `app.cs.js` (the old app content script) directly; the app and the extension keep talking through the same `window.postMessage` protocol (`app/src/config/PageScriptMessageHandler.js` ↔ `browser-extension/mv3/src/content-scripts/app/messageHandler.ts`).
- Rules live in `chrome.storage.local`. Sharing = JSON export/import.
- `isThornExtension()` (`app/src/utils/EnvUtils.ts`) gates behaviour that only makes sense in the upstream hosted app. Feature flags are local defaults in `app/src/utils/feature-flag/growthbook.js`.

# Constraints

- Extension pages have a strict CSP: no remote scripts, no `eval`/`new Function` (only `wasm-unsafe-eval`). Libraries that compile code at import time must be lazy-loaded or avoided.
- The extension must make no third-party network requests.
- Keep the AGPLv3 license and BrowserStack copyright notices intact.

# Build & test

- `bash install.sh` once, then `bash build.sh` → load `browser-extension/mv3/dist` unpacked.
- Browser: `BROWSER=firefox|edge|chrome` via `cd browser-extension/config && BROWSER=firefox ENV=prod npm run build`, then rebuild `mv3`.
- E2E tests: `cd browser-extension/mv3 && npm run test:e2e` (Playwright, loads the built extension).
