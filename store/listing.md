# Store listing — Thorn HTTP

Copy for the Chrome Web Store, Edge Add-ons and Firefox AMO listings.

## Name

Thorn HTTP: Intercept & Modify HTTP Requests

## Short description (≤ 132 characters)

Free, local-first HTTP interceptor: redirect URLs, modify headers, mock API responses and inject scripts. No account, no tracking.

## Category

Developer Tools

## Detailed description

Thorn HTTP lets you intercept and modify HTTP(S) traffic right in your browser. Everything runs locally: no account, no cloud, no analytics.

Rules
• Redirect Request: send a URL (or a pattern) to another URL, e.g. production → localhost
• Replace String: replace parts of URLs or hosts
• Query Param: add, change or remove query parameters
• Modify Headers: add, change or remove request and response headers
• Modify API Response: mock REST and GraphQL responses
• Modify Request Body: override request payloads
• Insert Scripts: inject JavaScript or CSS into pages
• Cancel Request: block requests
• Delay Network Requests: simulate slow APIs
• User-Agent: emulate other devices and browsers

Also
• Record the network traffic of a page and export it as HAR
• DevTools panel showing which rules ran on each request
• Import and export rules as JSON (Requestly exports are supported)
• Import from Charles Proxy, ModHeader, Resource Override and Header Editor
• Pause everything with one switch

Privacy
Thorn HTTP stores your rules only in your browser and sends no data anywhere.

Open source
Thorn HTTP is free software under the GNU AGPLv3, based on Requestly HTTP Interceptor. Source code: https://thorn-http.dev/source
"Requestly" is a trademark of its respective owner; Thorn HTTP is not affiliated with or endorsed by BrowserStack Inc.

## Links

- Website: https://thorn-http.dev
- Support: https://thorn-http.dev/issues
- Privacy policy: https://thorn-http.dev/privacy

## Single purpose (Chrome)

Intercept and modify the browser's HTTP(S) requests and responses according to rules the user creates.

## Permission justifications (Chrome)

| Permission | Why it is needed |
| --- | --- |
| `declarativeNetRequest` | Applies the user's redirect, replace, query param, header, cancel and user-agent rules. |
| `webRequest` | Observes requests to show which rules ran (DevTools panel) and to record network traffic when the user starts a recording. |
| `scripting` | Injects the user's Insert Script rules and the scripts that apply response/request body and delay rules to XHR/fetch. |
| `storage`, `unlimitedStorage` | Stores the user's rules and settings locally; large mocked responses can exceed the default quota. |
| `tabs` | Opens the rule editor, finds the tab a rule applies to and targets the network recording to the right tab. |
| `webNavigation` | Refreshes the rules cached in a page on each navigation so body/delay rules apply from the first request. |
| `contextMenus` | "Activate / Deactivate" item on the toolbar icon. |
| `sidePanel` | Shows the live network recording next to the page. |
| `browsingData` | Optional "disable cache" for network recordings, so the first load hits the network. Only used when the user asks for it. |
| Host permission `<all_urls>` | Rules can target any site the user chooses. |
| Remote code | None. All code is bundled in the package. |

## Data usage disclosures (Chrome)

- Does not collect or transmit any user data.
- Not sold to third parties; not used for purposes unrelated to the single purpose; not used for creditworthiness or lending.

## Firefox (AMO) reviewer notes

- Build from source: `bash install.sh && cd browser-extension/config && BROWSER=firefox ENV=prod npm run build && cd ../.. && bash build.sh`, output in `browser-extension/mv3/dist`.
- Bundled third-party libraries (React, Ant Design, CodeMirror, ...) account for the `innerHTML`/`Function` lint warnings; the extension does not evaluate remote code.

## Images

- `promo-small-440x280.png` — small promo tile (Chrome Web Store)
- `screenshots/1-rules.png`, `2-redirect-editor.png`, `3-mock-response.png` — 1280×800 store screenshots
- `screenshots/4-network-panel.png`, `5-popup.png` — extra views (not store-sized; compose onto 1280×800 if you want to use them)
- Regenerate after UI changes (the icons are still placeholders).
