# Changelog

All notable changes to THorn HTTP are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

First release of THorn HTTP, **1.0.0 (beta)**, based on [Requestly HTTP Interceptor](https://github.com/requestly/interceptor).

### Added

- **Mock from traffic:** a Mock button next to recorded `fetch`/XHR requests, in the network recording panel and in the DevTools panel. It opens a response rule pre-filled with the URL, method, status and the real response body, and detects GraphQL operations.
- **Test URL explanations:** the editor checks every condition a rule depends on and explains what doesn't match (letter case, trailing slash, query string, http vs https, invalid regex, method and type filters, paused extension, disabled rule or group, blocked site).
- **Rule timers:** a rule can switch itself off after 15 minutes, 1 hour, 4 hours or 1 day; the rules list shows the time left.
- **Share by link:** rules can be shared in a `thorn-http.dev/r#…` link that carries them after the `#`; the recipient sees a preview, and imported rules start disabled.
- **Local delay up to 10 minutes:** `fetch`/XHR in the page, page loads through a local extension page, and (Chrome, Edge) scripts, styles, images and fonts through the optional `debugger` permission, requested with a full explanation.
- Network recording with HAR export, without the BrowserStack integration.
- **Report a problem** link in the popup and the editor footer. It opens the form on thorn-http.dev with the extension version filled in; the extension itself sends nothing.
- End-to-end test suite (Playwright) covering every rule type, the editor, the new features, security checks and the local-only audits; CI on GitHub Actions.

### Changed

- New name, icons and texts; links point to thorn-http.dev.
- The rule editor is bundled inside the extension instead of loaded from a website.
- Every feature is free: no plans, limits or premium badges.
- Rules are stored only in the browser (`chrome.storage.local`); sharing is done by JSON export/import or by link.
- Extension pages run under a strict Content Security Policy that allows no remote scripts, connections, images, fonts or frames.
- Firefox: own add-on id (`thorn-http@thorn-http.dev`), declares that no data is collected.

### Removed

- Account, sign-in, teams, sync, billing, pricing and onboarding.
- SessionBear, session recording and the API client.
- Analytics and remote services: PostHog, GrowthBook remote flags, Stripe auto-load, geolocation, Google Fonts, the BrowserStack integration and the desktop app proxy (with the `proxy` permission).
- Unused code, dependencies and assets (the unpacked extension went from 63 MB to 16 MB).

### Fixed

- The first pause after installing didn't switch the rules off.
- `fetch` calls made while the page was still loading could escape Modify API response rules.
- Only the first Delay rule applied to `fetch`/XHR.
- The code editor could lose text typed right after opening or right before saving.
- GraphQL couldn't be selected when the editor was opened directly.
- "Cannot redefine property: timeout" broke every XHR on pages where the interceptor ran twice or next to Requestly.
- Firefox: the response headers listener wasn't registered.

### Security

- A web page could lift the Content Security Policy of other sites in the same tab through a forged message (inherited from upstream). The origin now comes from the real sender, and only the page itself, with an active dynamic JavaScript rule, gets its CSP lifted.
- Pages could report disabled or unknown rules as applied.
- Blocked sites received the rules, and blocked sites with a port (like `localhost:3000`) weren't recognized.
- Rule names were inserted without escaping in the in-page notice.
- Delay rules sent the full URL to `app.requestly.io`; delay is now fully local.
- Stopping a recording started from the popup opened `www.browserstack.com`.

[Unreleased]: https://github.com/Thorn-http/thorn-http/commits/main
