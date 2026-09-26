# Contributing to Thorn HTTP

Thanks for taking the time to contribute! Thorn HTTP is a free, local-first HTTP interceptor for the browser, and every bug report, idea, test and pull request helps.

This guide explains how the project works and what a good contribution looks like. If anything here is unclear, that's a bug too: open an issue.

## Table of contents

- [Code of Conduct](#code-of-conduct)
- [Ways to contribute](#ways-to-contribute)
- [Project principles](#project-principles)
- [Before you start](#before-you-start)
- [Development setup](#development-setup)
- [Making a change](#making-a-change)
- [Testing](#testing)
- [Commit messages](#commit-messages)
- [Pull requests](#pull-requests)
- [Reporting bugs](#reporting-bugs)
- [Suggesting features](#suggesting-features)
- [Security issues](#security-issues)
- [Licensing of contributions](#licensing-of-contributions)

## Code of Conduct

Everyone taking part in this project is expected to follow the [Code of Conduct](./CODE_OF_CONDUCT.md). Report unacceptable behavior privately to [contact@thorn-http.dev](mailto:contact@thorn-http.dev).

## Ways to contribute

You don't need to write code to help:

- **Report bugs** with clear steps to reproduce.
- **Suggest features** or improvements, ideally starting from the problem you have.
- **Improve the documentation**: README, guides, code comments, error messages.
- **Test** pre-releases on different browsers and operating systems.
- **Answer questions** from other users.
- **Write code**: fix bugs, add tests, build items from the [roadmap](./ROADMAP.md).

Issues labeled `good first issue` are a good place to start.

## Project principles

These shape every review. A change that breaks one of them won't be merged, however useful it is:

1. **Local-first.** The extension makes no network requests of its own: no analytics, telemetry, remote configuration, remote code or third-party services. If a feature ever needs the internet, it must be optional, clearly marked and off until the user turns it on.
2. **Consent and transparency.** Sensitive permissions (like `debugger`) are optional, requested only when the user chooses a feature that needs them, and explained in plain language first.
3. **Strict CSP.** Extension pages allow only their own scripts. No `eval`, `new Function`, remote scripts or libraries that compile code at runtime.
4. **Honest UI.** Texts describe what the extension actually does, today. No dark patterns.
5. **Attribution.** Keep the AGPLv3 license and the BrowserStack copyright notices intact.

## Before you start

- **Small fixes** (typos, obvious bugs, tests): open a pull request directly.
- **Anything bigger** (new features, new permissions, refactors, new dependencies): open an issue first and describe what you want to do. This avoids work that can't be merged.
- Check the [open issues](https://github.com/cleberpereiradasilva/thorn-request/issues) and the [roadmap](./ROADMAP.md) to see whether someone is already on it. Comment on an issue to say you're working on it.

## Development setup

Requirements: **Node.js ≥ 18.18** (CI uses Node 22), npm, and bash (Linux or macOS; on Windows, use WSL).

```sh
git clone https://github.com/cleberpereiradasilva/thorn-request.git
cd thorn-request
bash install.sh     # install every package
bash build.sh       # build everything into browser-extension/mv3/dist
```

Load `browser-extension/mv3/dist` as an unpacked extension (`chrome://extensions` → Developer mode → Load unpacked). The [README](./README.md#development) covers other browsers, watch mode and the repository layout, and [claude.md](./claude.md) explains how the pieces talk to each other.

## Making a change

1. Fork the repository and create a branch from `main`:
   ```sh
   git checkout -b fix/redirect-trailing-slash
   ```
   Use a short prefix that matches the change: `feat/`, `fix/`, `docs/`, `test/`, `refactor/`, `chore/`.
2. Follow the style of the file you edit. A pre-commit hook runs Prettier on staged files and ESLint on `app/`, so formatting is handled for you.
3. Never edit generated folders (`dist/`, `build/`, `node_modules/`).
4. Keep the change focused: one fix or feature per pull request. Unrelated clean-ups belong in their own PR.
5. Update the documentation when behavior changes (README, in-app texts, [CHANGELOG.md](./CHANGELOG.md) under *Unreleased*).

Some parts of the repository are kept but not built, for example the Safari files (`*.safari.ts`, `rollup.config.safari.js`). Leave them in place.

## Testing

Every change should keep the test suites green, and every bug fix or feature should come with a test that would have caught it.

```sh
bash build.sh                                   # the e2e tests use the built extension
cd browser-extension/mv3 && npm run test:e2e    # Playwright end-to-end tests
cd app && npm test                              # Vitest unit tests
```

- **End-to-end tests** live in `browser-extension/mv3/e2e/`. They load the built extension in Chromium with a local test server (see `fixtures.ts`). Tests must not depend on the internet.
- The **local-only audits** (`local-only.spec.ts`, `build-audit.spec.ts`) fail if the extension contacts any other server or ships a reference to one. If they fail on your change, the change has to be fixed, not the test.
- For changes to the extension's code, also try your change by hand in **Chrome and Firefox**.

## Commit messages

The project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <short summary in the imperative>

<optional body: what changed and why>
```

- **Types:** `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `chore`, `ci`.
- **Scopes** used so far: `extension`, `app`, `firefox`, `site`.
- Keep the summary under about 72 characters, and explain the *why* in the body when it isn't obvious.

Examples from the history:

```
feat(extension): Mock button on recorded fetch/XHR requests
fix(firefox): register the response headers listener
test: audit every file of the build and every screen for outside traffic
```

## Pull requests

1. Make sure the build, the end-to-end tests and the unit tests pass locally.
2. Open the pull request against `main` and fill in the template: what changed, why, and how to test it.
3. Link the issue it resolves (`Closes #123`).
4. For visible changes, add a screenshot or a short recording.
5. CI builds the extension, runs the tests, packages the zips and lints the Firefox build. A PR is merged only when CI is green.

**Review.** Thorn HTTP is maintained by one independent developer, so reviews happen on a best-effort basis. You'll get feedback as soon as possible; a friendly ping after a week is welcome. Reviews may ask for changes. That's normal and not a judgment of your work.

## Reporting bugs

Open a [bug report](https://github.com/cleberpereiradasilva/thorn-request/issues/new/choose) and include:

- what you did, what you expected and what happened instead;
- your browser and its version, and the Thorn HTTP version (shown in the popup);
- the rule involved, exported as JSON (Rules → select → **Export**), with anything private removed.

Search the existing issues first; if the bug is already reported, add your details there instead of opening a new one.

## Suggesting features

Open a [feature request](https://github.com/cleberpereiradasilva/thorn-request/issues/new/choose). Start from the problem you want to solve, not only the solution: it helps find the best way to do it. Check the [roadmap](./ROADMAP.md) first; your idea may already be planned.

## Security issues

**Don't report vulnerabilities in public issues.** Follow [SECURITY.md](./SECURITY.md) instead.

## Licensing of contributions

Thorn HTTP is licensed under the [GNU AGPLv3](./LICENSE). By submitting a contribution, you agree that it is licensed under the same license (inbound = outbound), and you confirm that you have the right to submit it. There is no contributor license agreement to sign.

Code copied from other projects must have a license compatible with the AGPLv3, and its origin and license must be noted in the pull request.
