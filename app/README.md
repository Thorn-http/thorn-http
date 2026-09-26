# Rule editor (app)

React + Vite application that provides the rule editor UI of THorn HTTP. It is built in `extension` mode and bundled inside the browser extension (served from `app.html`).

```sh
npm install
npm run build:extension   # output in app/build, copied into the extension by browser-extension/mv3
```

See [../getting-started.md](../getting-started.md) for the full build and [../claude.md](../claude.md) for how the app talks to the extension.
