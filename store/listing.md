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
Thorn HTTP is free software under the GNU AGPLv3, based on Requestly HTTP Interceptor. Source code: https://github.com/Thorn-http/thorn-http
"Requestly" is a trademark of its respective owner; Thorn HTTP is not affiliated with or endorsed by BrowserStack Inc.

## Links

- Website: https://thorn-http.dev
- Support: https://thorn-http.dev/report/ (issues: https://github.com/Thorn-http/thorn-http/issues)
- Support email: contact@thorn-http.dev
- Privacy policy: https://thorn-http.dev/privacy/
- License: GNU AGPLv3 (https://thorn-http.dev/license/)

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
| `alarms` | Switches rules off at the time the user set ("auto-disable"). |
| Host permission `<all_urls>` | Rules can target any site the user chooses. |
| Optional: `debugger` | Not requested at install. Only if the user allows it after reading an explanation in the Delay rule editor: pauses the scripts, styles, images and fonts that the user's Delay rules match, and continues them after the delay (Chrome DevTools Protocol, Fetch domain). Attached only while such a rule is on; removable at any time in Settings. No data is read, stored or sent. |
| Remote code | None. All code is bundled in the package. |

## Data usage disclosures (Chrome)

- Does not collect or transmit any user data.
- Not sold to third parties; not used for purposes unrelated to the single purpose; not used for creditworthiness or lending.

## Firefox (AMO) reviewer notes

Paste into "Notes to Reviewer":

```
Source code: the attached source zip (the same tree as https://github.com/Thorn-http/thorn-http at the release commit).

Build (Linux or macOS, bash, Node.js 22, npm 10, network access to the npm registry):
  bash browser-extension/mv3/scripts/build-firefox.sh
The unpacked add-on is written to browser-extension/mv3/dist/ and the zip to
browser-extension/mv3/builds/firefox/. It matches the submitted package.

The add-on makes no network requests of its own: no analytics, no remote code, no remote
configuration. Rules are stored in browser.storage.local only.

Lint warnings (innerHTML / Function) come from bundled third-party libraries (React,
Ant Design, CodeMirror and their dependencies); the add-on never evaluates remote code.

To test: open the add-on's popup, click "Open app", create a Redirect rule
(e.g. URL contains "example.com/a" -> "https://example.com/b"), then open https://example.com/a.
```

## Images

- `promo-small-440x280.png` — small promo tile (Chrome Web Store)
- `screenshots/1-rules.png`, `2-redirect-editor.png`, `3-mock-response.png` — 1280×800 store screenshots
- `screenshots/4-network-panel.png`, `5-popup.png` — extra views (not store-sized; compose onto 1280×800 if you want to use them)
- Regenerate after UI changes (the icons are still placeholders).
