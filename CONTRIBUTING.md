# Contributing to Thorn HTTP

Thanks for helping! Thorn HTTP is a free, local-first HTTP interceptor extension, licensed under the GNU AGPLv3.

## Before you start

- Read [getting-started.md](./getting-started.md) to build and load the extension.
- Read [claude.md](./claude.md) for the architecture and the constraints every change must respect:
  - no third-party network requests from the extension,
  - no `eval`/`new Function` in extension pages (strict CSP),
  - keep the license and copyright notices intact.

## Pull requests

1. Open an issue first for anything bigger than a small fix.
2. Keep PRs focused; one change per PR.
3. Run `bash build.sh` and `cd browser-extension/mv3 && npm run test:e2e` before opening the PR.
4. By contributing you agree your contribution is licensed under the AGPLv3.

## Reporting bugs

Use the bug report template and include the exported rule (Rules → select → Export) when possible.
