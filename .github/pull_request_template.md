<!-- Thanks for contributing to Thorn HTTP! Please read CONTRIBUTING.md before opening the PR. -->

## What and why

<!-- What does this PR change, and why? -->

Closes #

## How to test

<!-- Steps a reviewer can follow to see the change working. -->

1.

## Screenshots or recording

<!-- For visible changes. Delete this section otherwise. -->

## Checklist

- [ ] `bash build.sh` succeeds.
- [ ] End-to-end tests pass (`cd browser-extension/mv3 && npm run test:e2e`).
- [ ] Unit tests pass (`cd app && npm test`).
- [ ] Added or updated tests that cover this change.
- [ ] Tried it by hand in Chrome and Firefox (for changes to the extension).
- [ ] The extension still makes no network requests of its own, and no new permission is required (or it is optional and explained in the PR).
- [ ] Updated the documentation and the *Unreleased* section of `CHANGELOG.md`, if behavior changed.
- [ ] Commits follow [Conventional Commits](https://www.conventionalcommits.org/).
