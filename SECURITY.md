# Security policy

Thorn HTTP runs with broad access to the pages you visit, so security reports are taken seriously. Thank you for helping keep its users safe.

## Supported versions

Only the latest release receives security fixes. Please update before reporting.

| Version | Supported |
| --- | --- |
| Latest release | ✅ |
| Older releases | ❌ |

## Reporting a vulnerability

**Please don't open a public issue, discussion or pull request for a vulnerability.**

Report it privately in one of these ways:

1. **GitHub private vulnerability reporting (preferred):** go to the repository's [Security tab](https://github.com/cleberpereiradasilva/thorn-request/security) and click **Report a vulnerability**.
2. **Email:** [contact@thorn-http.dev](mailto:contact@thorn-http.dev), with "Security" in the subject.

Please include:

- a description of the issue and its impact;
- the steps to reproduce it, or a proof of concept (a test page, an exported rule);
- the browser and Thorn HTTP versions you tested;
- whether the issue is already public anywhere.

## What to expect

Thorn HTTP is maintained by one independent developer, so these are goals, not guarantees:

- an acknowledgement within **7 days**;
- an assessment and a plan within **30 days**;
- a fix released as soon as reasonably possible, with credit in the release notes if you want it.

Please give a reasonable time to fix the issue before disclosing it publicly. We'll coordinate the disclosure date with you.

## Scope

In scope:

- the browser extension in this repository (service worker, content and page scripts, extension pages);
- the rule-link page at `https://thorn-http.dev/r`.

Especially relevant: a web page reading or changing your rules, making the extension act on sites where it shouldn't, lifting another site's Content Security Policy, bypassing blocked sites, or making the extension contact a server.

Out of scope:

- rule behavior the user configured on purpose (for example, a rule that injects a script);
- issues that need a compromised browser, operating system or another malicious extension;
- vulnerabilities in the browsers themselves (report those to the browser vendor).

## Known design trade-off

To change `fetch`/XHR traffic, the page script needs the active **Modify API response**, **Modify request body** and **Delay** rules, so they are made available to the pages you visit (except blocked sites). Users are told not to put secrets in those rules, and limiting this exposure is on the [roadmap](./ROADMAP.md). New ways for a page to read *other* data from the extension (other rule types, recordings, settings) are in scope.
