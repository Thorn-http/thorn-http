# Thorn HTTP

**Free, local-first HTTP interceptor for your browser.** No account, no backend, no tracking.

Intercept, modify and mock HTTP(S) traffic straight from the browser: redirect URLs, change headers, override API responses, inject scripts, simulate latency and more. All rules live on your machine.

🌐 https://thorn-http.dev

> **Status:** early development. See [ROADMAP.md](./ROADMAP.md).

---

## Features

| Rule | What it does |
| --- | --- |
| **Redirect** | Send a URL (or pattern) to another URL, e.g. production → localhost |
| **Replace** | Replace parts of the URL or host |
| **Query Param** | Add, change or remove query parameters |
| **Modify Headers** | Add, change or remove request and response headers |
| **Modify Request Body** | Override the request payload |
| **Modify Response** | Mock API responses (REST & GraphQL) |
| **Insert Script** | Inject custom JS or CSS into pages |
| **Cancel** | Block requests |
| **Delay** | Simulate network latency |
| **User-Agent** | Override the User-Agent |

Also:

- Import / export rules as JSON
- Import from Charles Proxy, ModHeader and Resource Override
- DevTools panel showing which rules ran on each request

## Development

See [getting-started.md](./getting-started.md) for local setup.

- `browser-extension/` — MV3 extension (Chrome, Edge, Firefox)
- `app/` — React UI (rule editor)
- `common/rule-processor/` — rule matching and execution engine
- `shared/` — shared types and helpers

## License & attribution

Thorn HTTP is a fork of [Requestly HTTP Interceptor](https://github.com/requestly/interceptor), © BrowserStack Inc., and is distributed under the **GNU AGPLv3**. See [LICENSE](./LICENSE).

"Requestly" is a trademark of its respective owner. Thorn HTTP is an independent project and is not affiliated with or endorsed by BrowserStack Inc.

Changes from upstream are tracked in git history and summarized in [ROADMAP.md](./ROADMAP.md).
